"""Icons and backgrounds the customer uploads, for every AR NSPanel Pro panel.

The card crops each picture in the browser (icons square, backgrounds to the
panel's shape) and sends it here. Kept apart from the scenes on purpose: its
own storage, its own folder, its own websocket commands.

Stored in ``<config>/ar_lighting_scenes_media/`` (outside the integration, so
HACS updates never remove it) and served without login at
``/ar_lighting_scenes_media/<file>``, because the panels have no Home Assistant
login (the same way AR NSPanel Pro serves its own pictures).

Each list (icons, backgrounds) holds at most MAX_MEDIA. The panels get both
lists through AR NSPanel Pro's ``set_media`` service; an icon only ever shows
as an icon choice, a background only as a background choice.
"""

from __future__ import annotations

import base64
import binascii
import hashlib
import logging
import uuid
from pathlib import Path
from typing import Any, Callable

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import Event, HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.storage import Store

from .const import DOMAIN, MAX_MEDIA, MAX_NAME, MEDIA_DIR, MEDIA_URL, NSP_DOMAIN, NSP_EVENT_PANEL_STATUS

_LOGGER = logging.getLogger(__name__)

KINDS = ("icons", "backgrounds")
MAX_BYTES = 3 * 1024 * 1024
_MAGIC = {"png": b"\x89PNG\r\n\x1a\n", "jpg": b"\xff\xd8\xff"}
_SERVED = f"{DOMAIN}_media_served"


class MediaLibrary:
    """The uploaded icons and backgrounds."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store = Store(hass, 1, f"{DOMAIN}.media")
        self.items: dict[str, list[dict[str, str]]] = {k: [] for k in KINDS}
        self.folder = Path(hass.config.path(MEDIA_DIR))
        self._unsubs: list[Callable[[], None]] = []

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        for k in KINDS:
            self.items[k] = [
                {"id": str(m["id"]), "name": str(m.get("name") or "")[:MAX_NAME], "file": str(m["file"])}
                for m in (data.get(k) or [])
                if isinstance(m, dict) and m.get("id") and m.get("file")
            ][:MAX_MEDIA]
        await self.hass.async_add_executor_job(lambda: self.folder.mkdir(parents=True, exist_ok=True))
        if not self.hass.data.get(_SERVED):
            await self.hass.http.async_register_static_paths(
                [StaticPathConfig(MEDIA_URL, str(self.folder), cache_headers=True)]
            )
            self.hass.data[_SERVED] = True

    async def async_start(self) -> None:
        """Put the lists on every panel, and on any panel that comes along later."""
        self._unsubs.append(self.hass.bus.async_listen(NSP_EVENT_PANEL_STATUS, self._on_panel))
        await self.async_push()

    async def async_stop(self) -> None:
        for u in self._unsubs:
            u()
        self._unsubs.clear()

    async def _on_panel(self, _event: Event) -> None:
        await self.async_push()

    def _save(self) -> None:
        self._store.async_delay_save(lambda: self.items, 1)

    def payload(self) -> dict[str, Any]:
        return {
            k: [{"id": m["id"], "name": m["name"], "url": f"{MEDIA_URL}/{m['file']}"} for m in self.items[k]]
            for k in KINDS
        }

    def state(self) -> dict[str, Any]:
        return {"max": MAX_MEDIA, **self.payload()}

    async def async_push(self) -> None:
        """Send both lists to every panel (AR NSPanel Pro 4.8.6 or newer)."""
        if not self.hass.services.has_service(NSP_DOMAIN, "set_media"):
            _LOGGER.debug("AR NSPanel Pro has no set_media service yet (update it to 4.8.6 or newer)")
            return
        try:
            await self.hass.services.async_call(NSP_DOMAIN, "set_media", self.payload(), blocking=True)
        except Exception:  # noqa: BLE001 - a panel problem must not break the upload
            _LOGGER.warning("Couldn't send the uploaded icons and backgrounds to the panels", exc_info=True)

    async def async_add(self, kind: str, name: str, data_b64: str) -> dict[str, str]:
        if kind not in KINDS:
            raise HomeAssistantError("Unknown picture type")
        if len(self.items[kind]) >= MAX_MEDIA:
            raise HomeAssistantError(f"{MAX_MEDIA} of {MAX_MEDIA} used. Delete one to add another.")
        if "," in data_b64[:80]:
            data_b64 = data_b64.split(",", 1)[1]  # a data: URL
        try:
            data = base64.b64decode(data_b64, validate=True)
        except (binascii.Error, ValueError) as err:
            raise HomeAssistantError("The picture could not be read") from err
        if not data or len(data) > MAX_BYTES:
            raise HomeAssistantError("The picture is empty or larger than 3 MB")
        ext = next((e for e, magic in _MAGIC.items() if data.startswith(magic)), None)
        if ext is None:
            raise HomeAssistantError("Only JPEG and PNG pictures can be used")
        file = hashlib.sha256(data).hexdigest()[:20] + "." + ext
        target = self.folder / file

        def _write() -> None:
            self.folder.mkdir(parents=True, exist_ok=True)
            if not target.exists():
                target.write_bytes(data)

        await self.hass.async_add_executor_job(_write)
        item = {"id": uuid.uuid4().hex[:12], "name": (name or "").strip()[:MAX_NAME] or ("Icon" if kind == "icons" else "Background"), "file": file}
        self.items[kind].append(item)
        self._save()
        await self.async_push()
        return item

    async def async_delete(self, kind: str, item_id: str) -> None:
        if kind not in KINDS:
            raise HomeAssistantError("Unknown picture type")
        gone = [m for m in self.items[kind] if m["id"] == item_id]
        self.items[kind] = [m for m in self.items[kind] if m["id"] != item_id]
        still = {m["file"] for k in KINDS for m in self.items[k]}
        for m in gone:
            if m["file"] not in still:
                path = self.folder / m["file"]
                await self.hass.async_add_executor_job(lambda p=path: p.unlink(missing_ok=True))
        self._save()
        await self.async_push()
