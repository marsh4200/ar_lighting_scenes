"""One HA scene entity per saved lighting scene (scene.ar_<name>).

The panels run these entities, and they also work in automations, scripts and
voice like any other scene.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.scene import Scene
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_platform, entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, NAME, SIGNAL_UPDATE
from .manager import ScenesManager, slug


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    mgr: ScenesManager = entry.runtime_data
    platform = entity_platform.async_get_current_platform()
    ents: dict[str, LightingScene] = {}

    async def ensure(sid: str) -> str | None:
        if sid not in ents:
            ent = LightingScene(mgr, sid)
            ents[sid] = ent
            await platform.async_add_entities([ent])
        else:
            ents[sid].async_write_ha_state()
        return ents[sid].entity_id

    async def remove(sid: str) -> None:
        ent = ents.pop(sid, None)
        reg = er.async_get(hass)
        eid = reg.async_get_entity_id("scene", DOMAIN, sid)
        if ent is not None:
            await ent.async_remove()
        if eid:
            reg.async_remove(eid)

    mgr.ensure_entity = ensure
    mgr.remove_entity = remove

    first = [LightingScene(mgr, sid) for sid in mgr.scenes]
    for ent in first:
        ents[ent.sid] = ent
    if first:
        await platform.async_add_entities(first)

    @callback
    def _names() -> None:
        for ent in ents.values():
            if ent.hass is not None and ent.sid in mgr.scenes:
                ent.async_write_ha_state()

    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_UPDATE, _names))


class LightingScene(Scene):
    _attr_has_entity_name = False
    _attr_icon = "mdi:lightbulb-group"
    _attr_should_poll = False

    def __init__(self, mgr: ScenesManager, sid: str) -> None:
        self.mgr = mgr
        self.sid = sid
        self._attr_unique_id = sid
        # first time only: scene.ar_movie_night (the registry keeps it after a rename)
        self.entity_id = "scene.ar_" + slug(mgr.scenes[sid]["name"])

    @property
    def name(self) -> str:
        sc = self.mgr.scenes.get(self.sid)
        return sc["name"] if sc else self.sid

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        sc = self.mgr.scenes.get(self.sid) or {}
        return {"entity_id": list((sc.get("lights") or {}).keys()), "made_with": NAME}

    async def async_activate(self, **kwargs: Any) -> None:
        await self.mgr.async_activate(self.sid)
