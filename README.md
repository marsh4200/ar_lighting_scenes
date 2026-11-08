# AR Lighting Scenes

Lets the people living in the house make their own lighting scenes and put them
on their AR NSPanel Pro panels — no installer needed.

It is separate from **AR NSPanel Pro** on purpose. AR NSPanel Pro is the
installer's tool. This integration is for customers.

## Install

1. AR NSPanel Pro **1.9.9 or newer** must be installed and its panels added.
2. Install this through HACS (custom repository), or copy
   `custom_components/ar_lighting_scenes` into your config folder.
3. Restart Home Assistant.
4. Go to Settings → Devices & services → Add integration → **AR Lighting Scenes**.
   It finds AR NSPanel Pro and its panels by itself. New panels added later show
   up on their own.

## Using it

- A **Lighting Scenes** page appears in the sidebar for every user. You can turn
  it off in the integration's options.
- The card is also available in every dashboard's card picker:

  ```yaml
  type: custom:ar-lighting-scenes-card
  ```

In the card:

- **Pick a panel** or **All panels**.
- **+ New lighting scene**: the name and Save sit at the top. Pick from the
  **Lights** or **Switches** tab (with search; the list scrolls in its own box).
  What you tick shows under "In this scene", where you set on or off and a
  brightness, or take it out again. "Use how these are right now" fills them in
  from their current state. **Try it** shows the scene without saving it.
- **Copy** a scene, then **Paste** it into a new scene on another panel.
- **Save**, then **Push to panel**: push to one panel, several, or all of them.
- **Copy a panel's scenes to other panels**: the panels you pick end up identical.
- Each panel holds **4 scenes**. On the panel they show on the Elegant home
  screen under the weather, and next to All on / All off on the Lights page.

Every scene is also a normal Home Assistant scene (`scene.ar_…`), so you can use
it in automations, scripts and voice.

## Icons: background removed (1.1.1)

An uploaded icon is saved as the **icon only**, on a see-through background, so it sits on the panel button like the built-in icons.

- **Remove background** is on by default. The background colour is read from the picture's edge, and only background joined to the edge comes off, so white inside the icon (a window, an eye) stays.
- The edges are soft and the background colour is taken out of them, so there's no white halo on the dark panel.
- **Strength**: lower it if bits of the icon go, raise it if background is left.
- **Inside gaps too**: also clears enclosed background, such as the middle of a ring or the hole in a letter.
- **Icon colour**: As it is, or White. A dark icon is hard to see on the panel, and the cropper says so.
- The live preview shows the saved icon on a checkerboard (see-through) and on the panel's dark colour.
- The icon is trimmed and centred in the square. A picture that is already see-through (a PNG logo) is kept as it is.
- Icons uploaded before 1.1.1 keep their background: delete them and upload them again.

Needs AR NSPanel Pro 4.8.8 or newer, which shows uploaded icons in the button like the built-in icons (before that they filled the button like a photo).

## Icons and backgrounds (1.1.0)

Next to **Lighting scenes**, the page has **Icons** and **Backgrounds** tabs:

- **Upload** a picture from your phone, then drag and pinch to crop it. Icons are square (shown round on
  the panel buttons); backgrounds are cropped to your panel's shape (Landscape 16:10 for the Source 10,
  Wide 16:9 for the Source 7, Square for the NSPanel Pro, or Portrait), so what you frame is exactly what
  the panel shows.
- Up to **10 icons and 10 backgrounds**. At 10, delete one before adding another.
- Every panel gets them: uploaded icons in the panel's **Settings > Icons**, uploaded backgrounds in
  **Settings > Look > Backgrounds**. An icon is only offered as an icon, a background only as a background.
- Pictures are stored in `<config>/ar_lighting_scenes_media/`. Needs AR NSPanel Pro 4.8.6 or newer.

## Options

- Lighting Scenes page in the sidebar (on by default).

Only lights and switches are offered: no sensors, no hidden entities and no
device settings switches.

## How it talks to AR NSPanel Pro

Uploaded icons and backgrounds go to every panel through AR NSPanel Pro's `set_media` service.


It only uses AR NSPanel Pro's `ar_nspanel_pro.list_panels` and
`ar_nspanel_pro.set_scenes` services, plus its `ar_nspanel_pro_panel_status`
event. The event is what tells it when a panel is ready or comes back online,
so it can resend that panel's scenes. Removing this integration takes the
scenes off every panel.
