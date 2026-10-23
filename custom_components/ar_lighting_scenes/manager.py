"""Scene library, which panel shows which scene, and talking to AR NSPanel Pro.

Stored (HA .storage):
    {"scenes": {id: {"name": str, "lights": {entity_id: {"on": bool, "bri": 0..1}}}},
     "panels": {panel_id: [scene id, ...]}}

AR NSPanel Pro is reached only through its services and bus event, so the two
integrations stay separate:
    ar_nspanel_pro.list_panels  -> which panels exist, online, Elegant or not
    ar_nspanel_pro.set_scenes   -> what one panel shows ([{entity, name}])
    ar_nspanel_pro_panel_status -> a panel is ready / went on- or offline
"""

from __future__ import annotations

import asyncio
import logging
import re
import uuid
from typing import Any, Callable

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import (
    area_registry as ar,
    device_registry as dr,
    entity_registry as er,
)
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from .const import (
    CONF_SWITCHES,
    DOMAIN,
    MAX_NAME,
    MAX_PER_PANEL,
    NSP_DOMAIN,
    NSP_EVENT_PANEL_STATUS,
    SIGNAL_UPDATE,
    STORE_KEY,
    STORE_VERSION,
)

_LOGGER = logging.getLogger(__name__)


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_") or "scene"


class ScenesManager:
    """Everything the card and the scene entities need."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self.entry = entry
        self._store: Store = Store(hass, STORE_VERSION, STORE_KEY)
        self.scenes: dict[str, dict[str, Any]] = {}
        self.panel_scenes: dict[str, list[str]] = {}
        #: last ar_nspanel_pro.list_panels answer, by panel_id
        self.panels: dict[str, dict[str, Any]] = {}
        #: set by the scene platform: async (scene id) -> entity_id
        self.ensure_entity: Callable[[str], Any] | None = None
        self.remove_entity: Callable[[str], Any] | None = None
        self._unsubs: list[Callable[[], None]] = []
        self._lock = asyncio.Lock()

    # --- lifecycle ----------------------------------------------------------

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        self.scenes = {
            k: {"name": str(v.get("name") or "Scene")[:MAX_NAME], "lights": dict(v.get("lights") or {})}
            for k, v in (data.get("scenes") or {}).items()
            if isinstance(v, dict)
        }
        self.panel_scenes = {
            k: [i for i in v if i in self.scenes][:MAX_PER_PANEL]
            for k, v in (data.get("panels") or {}).items()
            if isinstance(v, list)
        }

    async def async_start(self) -> None:
        """Find the panels and put every panel's scenes back on it."""
        self._unsubs.append(self.hass.bus.async_listen(NSP_EVENT_PANEL_STATUS, self._on_panel_status))
        await self.async_refresh_panels()
        await self.async_sync_all()

    async def async_stop(self) -> None:
        for u in self._unsubs:
            u()
        self._unsubs.clear()
        # write now (a reload / unload would otherwise lose the last change)
        await self._store.async_save({"scenes": self.scenes, "panels": self.panel_scenes})

    def _save(self) -> None:
        self._store.async_delay_save(
            lambda: {"scenes": self.scenes, "panels": self.panel_scenes}, 1
        )

    @callback
    def _changed(self) -> None:
        async_dispatcher_send(self.hass, SIGNAL_UPDATE)

    # --- panels (AR NSPanel Pro) ----------------------------------------------

    async def async_refresh_panels(self) -> None:
        if not self.hass.services.has_service(NSP_DOMAIN, "list_panels"):
            _LOGGER.warning("AR NSPanel Pro 1.9.9 or newer is needed to find the panels")
            self.panels = {}
            return
        try:
            resp = await self.hass.services.async_call(
                NSP_DOMAIN, "list_panels", {}, blocking=True, return_response=True
            )
        except Exception:  # noqa: BLE001
            _LOGGER.warning("Couldn't list the AR NSPanel Pro panels", exc_info=True)
            return
        self.panels = {
            p["panel_id"]: p for p in (resp or {}).get("panels", []) if isinstance(p, dict) and p.get("panel_id")
        }

    async def _on_panel_status(self, event: Event) -> None:
        panel_id = event.data.get("panel_id")
        await self.async_refresh_panels()
        if panel_id in self.panels:
            await self.async_sync_panel(panel_id)
        self._changed()

    def _panel_payload(self, panel_id: str) -> list[dict[str, str]]:
        out = []
        for sid in self.panel_scenes.get(panel_id, []):
            eid = self.entity_id(sid)
            if sid in self.scenes and eid:
                out.append({"entity": eid, "name": self.scenes[sid]["name"]})
        return out

    async def async_sync_panel(self, panel_id: str) -> None:
        """Send one panel the scenes it should show (an offline panel gets the
        retained copy when it comes back)."""
        p = self.panels.get(panel_id)
        if not p or not p.get("device_id"):
            return
        try:
            await self.hass.services.async_call(
                NSP_DOMAIN,
                "set_scenes",
                {"device_id": p["device_id"], "scenes": self._panel_payload(panel_id)},
                blocking=True,
            )
        except Exception:  # noqa: BLE001
            _LOGGER.warning("Couldn't send the scenes to %s", p.get("name"), exc_info=True)

    async def async_sync_all(self) -> None:
        for pid in list(self.panels):
            await self.async_sync_panel(pid)

    async def async_clear_panels(self) -> None:
        """Integration removed: take every customer scene off the panels."""
        await self.async_refresh_panels()
        for p in self.panels.values():
            if p.get("device_id"):
                try:
                    await self.hass.services.async_call(
                        NSP_DOMAIN, "set_scenes", {"device_id": p["device_id"], "scenes": []}, blocking=True
                    )
                except Exception:  # noqa: BLE001
                    pass

    # --- scene entities --------------------------------------------------------

    def entity_id(self, sid: str) -> str | None:
        return er.async_get(self.hass).async_get_entity_id("scene", DOMAIN, sid)

    # --- what the card shows ---------------------------------------------------------

    def lights(self) -> list[dict[str, Any]]:
        """Lights (and switches, if chosen) by HA area, for the scene editor."""
        domains = ["light"] + (["switch"] if self.entry.options.get(CONF_SWITCHES) else [])
        ereg = er.async_get(self.hass)
        dreg = dr.async_get(self.hass)
        areg = ar.async_get(self.hass)
        out = []
        for st in self.hass.states.async_all(domains):
            ent = ereg.async_get(st.entity_id)
            if ent and (ent.hidden_by or ent.disabled_by or ent.entity_category):
                continue
            if st.attributes.get("entity_id"):  # light groups
                continue
            area_id = ent.area_id if ent else None
            if not area_id and ent and ent.device_id:
                dev = dreg.async_get(ent.device_id)
                area_id = dev.area_id if dev else None
            area = areg.async_get_area(area_id) if area_id else None
            area_name = area.name if area else "Other"
            name = str(st.attributes.get("friendly_name") or st.entity_id)
            short = name[len(area_name) + 1 :] if name.lower().startswith(area_name.lower() + " ") else name
            modes = st.attributes.get("supported_color_modes") or []
            dim = st.domain == "light" and any(m != "onoff" for m in modes)
            out.append({"entity": st.entity_id, "name": short or name, "area": area_name, "dim": dim})
        out.sort(key=lambda x: (x["area"] == "Other", x["area"].lower(), x["name"].lower()))
        return out

    def state(self) -> dict[str, Any]:
        panels = []
        for pid, p in self.panels.items():
            panels.append(
                {
                    "id": pid,
                    "name": p.get("name") or pid,
                    "model": p.get("model") or "",
                    "online": bool(p.get("online")),
                    "elegant": bool(p.get("elegant")),
                    "scenes": [s for s in self.panel_scenes.get(pid, []) if s in self.scenes],
                }
            )
        panels.sort(key=lambda x: x["name"].lower())
        return {
            "max": MAX_PER_PANEL,
            "panels": panels,
            "scenes": {k: {**v, "entity_id": self.entity_id(k)} for k, v in self.scenes.items()},
            "lights": self.lights(),
        }

    # --- changes from the card ------------------------------------------------------

    @staticmethod
    def _clean_lights(lights: Any) -> dict[str, dict[str, Any]]:
        out = {}
        for eid, s in (lights or {}).items():
            if not isinstance(eid, str) or "." not in eid or not isinstance(s, dict):
                continue
            bri = s.get("bri", 1)
            bri = max(0.01, min(1.0, float(bri))) if isinstance(bri, (int, float)) else 1.0
            out[eid] = {"on": bool(s.get("on")), "bri": round(bri, 2)}
        return out

    async def async_save(self, scene: dict[str, Any]) -> str:
        name = str(scene.get("name") or "").strip()[:MAX_NAME]
        lights = self._clean_lights(scene.get("lights"))
        if not name:
            raise HomeAssistantError("Give the scene a name")
        if not lights:
            raise HomeAssistantError("Tick at least one light")
        async with self._lock:
            sid = scene.get("id")
            # the card picks the id of a new scene itself (so it can show it at once)
            if not isinstance(sid, str) or not re.fullmatch(r"[a-z0-9_]{1,40}", sid):
                sid = slug(name)[:30] + "_" + uuid.uuid4().hex[:4]
            self.scenes[sid] = {"name": name, "lights": lights}
            self._save()
            if self.ensure_entity:
                await self.ensure_entity(sid)
        for pid, ids in self.panel_scenes.items():
            if sid in ids:
                await self.async_sync_panel(pid)
        self._changed()
        return sid

    async def async_delete(self, sid: str) -> None:
        if sid not in self.scenes:
            return
        touched = [pid for pid, ids in self.panel_scenes.items() if sid in ids]
        for pid in touched:
            self.panel_scenes[pid] = [i for i in self.panel_scenes[pid] if i != sid]
        for pid in touched:
            await self.async_sync_panel(pid)
        if self.remove_entity:
            await self.remove_entity(sid)
        del self.scenes[sid]
        self._save()
        self._changed()

    async def async_push(self, sid: str, panel_ids: list[str]) -> None:
        if sid not in self.scenes:
            raise HomeAssistantError("That scene doesn't exist any more")
        full = []
        for pid in panel_ids:
            ids = self.panel_scenes.setdefault(pid, [])
            if sid in ids:
                continue
            if len(ids) >= MAX_PER_PANEL:
                full.append(self.panels.get(pid, {}).get("name", pid))
                continue
            ids.append(sid)
            await self.async_sync_panel(pid)
        self._save()
        self._changed()
        if full:
            raise HomeAssistantError(f"Already {MAX_PER_PANEL} scenes on: " + ", ".join(full))

    async def async_unpush(self, sid: str, panel_id: str) -> None:
        self.panel_scenes[panel_id] = [i for i in self.panel_scenes.get(panel_id, []) if i != sid]
        await self.async_sync_panel(panel_id)
        self._save()
        self._changed()

    async def async_set_panel(self, panel_id: str, ids: list[str]) -> None:
        """Copy a panel: this panel shows exactly these scenes, in this order."""
        self.panel_scenes[panel_id] = [i for i in dict.fromkeys(ids) if i in self.scenes][:MAX_PER_PANEL]
        await self.async_sync_panel(panel_id)
        self._save()
        self._changed()

    async def async_apply(self, lights: dict[str, dict[str, Any]]) -> None:
        """Set the lights: each to on at its brightness, or off."""
        calls = []
        for eid, s in self._clean_lights(lights).items():
            domain = eid.split(".", 1)[0]
            if domain not in ("light", "switch"):
                continue
            if not s["on"]:
                calls.append((domain, "turn_off", {ATTR_ENTITY_ID: eid}))
            elif domain == "light":
                st = self.hass.states.get(eid)
                modes = (st.attributes.get("supported_color_modes") or []) if st else []
                data: dict[str, Any] = {ATTR_ENTITY_ID: eid}
                if any(m != "onoff" for m in modes):
                    data["brightness_pct"] = max(1, round(s["bri"] * 100))
                calls.append(("light", "turn_on", data))
            else:
                calls.append(("switch", "turn_on", {ATTR_ENTITY_ID: eid}))
        await asyncio.gather(
            *(self.hass.services.async_call(d, svc, data, blocking=True) for d, svc, data in calls),
            return_exceptions=True,
        )

    async def async_activate(self, sid: str) -> None:
        sc = self.scenes.get(sid)
        if sc:
            await self.async_apply(sc["lights"])
