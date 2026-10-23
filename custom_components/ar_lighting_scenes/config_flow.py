"""Set-up: look for AR NSPanel Pro and its panels; nothing to type."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import HomeAssistant, callback

from .const import CONF_SIDEBAR, CONF_SWITCHES, DOMAIN, NAME, NSP_DOMAIN


async def _find_panels(hass: HomeAssistant) -> list[dict[str, Any]] | None:
    """AR NSPanel Pro's panels, or None when AR NSPanel Pro isn't there."""
    if not hass.config_entries.async_entries(NSP_DOMAIN):
        return None
    if not hass.services.has_service(NSP_DOMAIN, "list_panels"):
        return []
    try:
        resp = await hass.services.async_call(NSP_DOMAIN, "list_panels", {}, blocking=True, return_response=True)
    except Exception:  # noqa: BLE001
        return []
    return list((resp or {}).get("panels") or [])


def _schema(defaults: dict[str, Any]) -> vol.Schema:
    return vol.Schema(
        {
            vol.Optional(CONF_SIDEBAR, default=defaults.get(CONF_SIDEBAR, True)): bool,
            vol.Optional(CONF_SWITCHES, default=defaults.get(CONF_SWITCHES, False)): bool,
        }
    )


class ScenesConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        panels = await _find_panels(self.hass)
        if panels is None:
            return self.async_abort(reason="no_nspanel")
        if not self.hass.services.has_service(NSP_DOMAIN, "list_panels"):
            return self.async_abort(reason="nspanel_too_old")
        if user_input is not None:
            return self.async_create_entry(title=NAME, data={}, options=user_input)
        names = ", ".join(
            f"{p.get('name')} ({'online' if p.get('online') else 'offline'})" for p in panels
        )
        return self.async_show_form(
            step_id="user",
            data_schema=_schema({}),
            description_placeholders={"count": str(len(panels)), "panels": names or "none yet"},
        )

    @staticmethod
    @callback
    def async_get_options_flow(entry: ConfigEntry) -> OptionsFlow:
        return ScenesOptionsFlow(entry)


class ScenesOptionsFlow(OptionsFlow):
    def __init__(self, entry: ConfigEntry) -> None:
        self._current = dict(entry.options)

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data=user_input)
        return self.async_show_form(step_id="init", data_schema=_schema(self._current))
