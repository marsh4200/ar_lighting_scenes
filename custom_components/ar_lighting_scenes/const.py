"""Constants for AR Lighting Scenes."""

from __future__ import annotations

DOMAIN = "ar_lighting_scenes"
NAME = "AR Lighting Scenes"
VERSION = "1.0.0"

#: The panel integration this one feeds. Talked to only through its services
#: (list_panels / set_scenes) and its panel-status bus event.
NSP_DOMAIN = "ar_nspanel_pro"
NSP_EVENT_PANEL_STATUS = "ar_nspanel_pro_panel_status"

#: Most scenes one panel shows (its home screen row / Lights page row).
MAX_PER_PANEL = 4
#: Longest scene name (fits a panel button).
MAX_NAME = 24

STORE_KEY = f"{DOMAIN}.data"
STORE_VERSION = 1

CONF_SWITCHES = "include_switches"
CONF_SIDEBAR = "sidebar"

#: dispatcher: scenes / panels changed (card subscriptions, scene entities)
SIGNAL_UPDATE = f"{DOMAIN}_update"

STATIC_URL = "/ar_lighting_scenes_static"
CARD_FILE = "ar-lighting-scenes-card.js"
SIDEBAR_PATH = "lighting-scenes"
