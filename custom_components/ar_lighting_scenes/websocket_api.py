"""WebSocket API for the Lighting Scenes card.

Not admin-only on purpose: the customers using the card on their dashboard
are usually ordinary (non-admin) Home Assistant users.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import DOMAIN, SIGNAL_UPDATE
from .manager import ScenesManager


def _mgr(hass: HomeAssistant) -> ScenesManager | None:
    entries = hass.config_entries.async_entries(DOMAIN)
    for e in entries:
        if getattr(e, "runtime_data", None) is not None:
            return e.runtime_data
    return None


def _run(handler):
    """Answer with the result, or a readable error."""

    async def wrapped(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
        mgr = _mgr(hass)
        if mgr is None:
            connection.send_error(msg["id"], "not_ready", "AR Lighting Scenes isn't set up")
            return
        try:
            result = await handler(mgr, msg)
        except HomeAssistantError as err:
            connection.send_error(msg["id"], "failed", str(err))
            return
        connection.send_result(msg["id"], result)

    return wrapped


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/state"})
@websocket_api.async_response
@_run
async def ws_state(mgr: ScenesManager, msg: dict[str, Any]) -> dict[str, Any]:
    return mgr.state()


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/refresh"})
@websocket_api.async_response
@_run
async def ws_refresh(mgr: ScenesManager, msg: dict[str, Any]) -> dict[str, Any]:
    await mgr.async_refresh_panels()
    return mgr.state()


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/save", vol.Required("scene"): dict}
)
@websocket_api.async_response
@_run
async def ws_save(mgr: ScenesManager, msg: dict[str, Any]) -> dict[str, Any]:
    return {"id": await mgr.async_save(msg["scene"])}


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/delete", vol.Required("scene_id"): str})
@websocket_api.async_response
@_run
async def ws_delete(mgr: ScenesManager, msg: dict[str, Any]) -> None:
    await mgr.async_delete(msg["scene_id"])


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/push", vol.Required("scene_id"): str, vol.Required("panels"): [str]}
)
@websocket_api.async_response
@_run
async def ws_push(mgr: ScenesManager, msg: dict[str, Any]) -> None:
    await mgr.async_push(msg["scene_id"], msg["panels"])


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/unpush", vol.Required("scene_id"): str, vol.Required("panel"): str}
)
@websocket_api.async_response
@_run
async def ws_unpush(mgr: ScenesManager, msg: dict[str, Any]) -> None:
    await mgr.async_unpush(msg["scene_id"], msg["panel"])


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/set_panel", vol.Required("panel"): str, vol.Required("scene_ids"): [str]}
)
@websocket_api.async_response
@_run
async def ws_set_panel(mgr: ScenesManager, msg: dict[str, Any]) -> None:
    await mgr.async_set_panel(msg["panel"], msg["scene_ids"])


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/activate", vol.Optional("scene_id"): str, vol.Optional("lights"): dict}
)
@websocket_api.async_response
@_run
async def ws_activate(mgr: ScenesManager, msg: dict[str, Any]) -> None:
    if msg.get("lights"):
        await mgr.async_apply(msg["lights"])
    elif msg.get("scene_id"):
        await mgr.async_activate(msg["scene_id"])


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Tell the card when scenes or panels change (another user, a panel going offline)."""

    @callback
    def _send() -> None:
        connection.send_message(websocket_api.event_message(msg["id"], {"changed": True}))

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(hass, SIGNAL_UPDATE, _send)
    connection.send_result(msg["id"])


@callback
def async_register(hass: HomeAssistant) -> None:
    for cmd in (ws_state, ws_refresh, ws_save, ws_delete, ws_push, ws_unpush, ws_set_panel, ws_activate, ws_subscribe):
        websocket_api.async_register_command(hass, cmd)
