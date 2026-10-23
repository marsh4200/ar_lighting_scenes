"""AR Lighting Scenes — customers build lighting scenes on a dashboard card and
push them to their AR NSPanel Pro panels.

Separate from AR NSPanel Pro on purpose: that one is the installer's tool, this
one is for the people living with the panels. They meet only through AR NSPanel
Pro's list_panels / set_scenes services and its panel-status event.
"""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components.frontend import (
    add_extra_js_url,
    async_register_built_in_panel,
    async_remove_panel,
)
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, Platform
from homeassistant.core import CoreState, Event, HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from . import websocket_api
from .const import CARD_FILE, CONF_SIDEBAR, DOMAIN, SIDEBAR_PATH, STATIC_URL, VERSION
from .manager import ScenesManager

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [Platform.SCENE]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

type ScenesConfigEntry = ConfigEntry[ScenesManager]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the card (it shows up in every dashboard's card picker) and the API."""
    websocket_api.async_register(hass)
    await hass.http.async_register_static_paths(
        [StaticPathConfig(STATIC_URL, str(Path(__file__).parent / "www"), cache_headers=False)]
    )
    add_extra_js_url(hass, f"{STATIC_URL}/{CARD_FILE}?v={VERSION}")
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ScenesConfigEntry) -> bool:
    mgr = ScenesManager(hass, entry)
    await mgr.async_load()
    entry.runtime_data = mgr
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # find the panels once AR NSPanel Pro has set them up (after start-up, or
    # straight away when this is added to a running Home Assistant)
    if hass.state is CoreState.running:
        entry.async_create_background_task(hass, mgr.async_start(), f"{DOMAIN}_start")
    else:

        pending: list = []

        async def _started(_event: Event) -> None:
            pending.clear()
            await mgr.async_start()

        pending.append(hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _started))
        entry.async_on_unload(lambda: [u() for u in pending])

    if entry.options.get(CONF_SIDEBAR, True):
        async_register_built_in_panel(
            hass,
            component_name="custom",
            sidebar_title="Lighting Scenes",
            sidebar_icon="mdi:lightbulb-group",
            frontend_url_path=SIDEBAR_PATH,
            require_admin=False,
            config={
                "_panel_custom": {
                    "name": "ar-lighting-scenes-panel",
                    "module_url": f"{STATIC_URL}/{CARD_FILE}?v={VERSION}",
                    "embed_iframe": False,
                    "trust_external": False,
                }
            },
            update=True,
        )
        hass.data[f"{DOMAIN}_sidebar"] = True
    entry.async_on_unload(entry.add_update_listener(_reload))
    return True


async def _reload(hass: HomeAssistant, entry: ScenesConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ScenesConfigEntry) -> bool:
    ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if ok:
        await entry.runtime_data.async_stop()
        if hass.data.pop(f"{DOMAIN}_sidebar", False):
            async_remove_panel(hass, SIDEBAR_PATH)
    return ok


async def async_remove_entry(hass: HomeAssistant, entry: ScenesConfigEntry) -> None:
    """Removed: take the customer scenes off every panel."""
    mgr = ScenesManager(hass, entry)
    await mgr.async_clear_panels()
