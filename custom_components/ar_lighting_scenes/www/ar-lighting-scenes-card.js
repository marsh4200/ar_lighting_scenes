// AR Lighting Scenes card — customers make lighting scenes and push them to
// their AR NSPanel Pro panels. Served by the ar_lighting_scenes integration;
// shows up in every dashboard's card picker, and as the "Lighting Scenes"
// sidebar page.
//
//   type: custom:ar-lighting-scenes-card
//
// Talks to the integration over its websocket API (ar_lighting_scenes/*).

const MAX = 4; // scenes per panel (home screen row + lights page row)

const CSS = `
:host{display:block;font-family:Roboto,"Segoe UI",system-ui,sans-serif;color:var(--primary-text-color,#e1e1e1)}
*{box-sizing:border-box}
.card{background:var(--ha-card-background,var(--card-background-color,#1c1c1c));color:var(--primary-text-color,#e1e1e1);border-radius:var(--ha-card-border-radius,12px);border:1px solid var(--divider-color,rgba(127,127,127,.2));overflow:hidden}
.hd{display:flex;align-items:center;gap:12px;padding:16px 16px 4px}
.hd .ic{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:rgba(242,184,102,.18);color:#d9952f;flex:none}
.hd .ic svg{width:22px;height:22px}
.hd h1{font-size:18px;font-weight:500;margin:0;line-height:1.2}
.hd p{margin:2px 0 0;font-size:13px;color:var(--secondary-text-color,#9b9b9b)}
.bd{padding:8px 16px 16px}
.lbl{font-size:12px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--secondary-text-color,#9b9b9b);margin:14px 0 8px;display:flex;align-items:center}
.lbl span{margin-left:auto;text-transform:none;letter-spacing:0;font-weight:400}
.panels{display:flex;gap:8px;flex-wrap:wrap}
.pn{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:12px;border:1px solid rgba(127,127,127,.26);background:rgba(127,127,127,.07);cursor:pointer;font:inherit;color:inherit;text-align:left}
.pn.sel{border-color:#f2b866;background:rgba(242,184,102,.12)}
.pn .dot{width:8px;height:8px;border-radius:50%;background:#4caf50;flex:none}
.pn.off .dot{background:#6b6b6b}
.pn.all .dot{background:#f2b866}
.on3{display:flex;gap:4px;flex-wrap:wrap;margin-top:3px}
.on3 i{font-style:normal;font-size:11px;padding:1px 7px;border-radius:999px;background:rgba(242,184,102,.14);color:var(--primary-text-color,#e1e1e1)}
.on3 i.no{background:rgba(127,127,127,.13);color:var(--secondary-text-color,#9b9b9b)}
.pn b{display:block;font-size:14px;font-weight:500}
.pn small{display:block;font-size:11px;color:var(--secondary-text-color,#9b9b9b)}
.row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(127,127,127,.09);margin-bottom:6px}
.row .nm{flex:1;min-width:0}
.row .nm b{display:block;font-size:15px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row .nm small{font-size:12px;color:var(--secondary-text-color,#9b9b9b)}
.empty{padding:14px 12px;border-radius:10px;border:1px dashed rgba(127,127,127,.31);color:var(--secondary-text-color,#9b9b9b);font-size:13px;text-align:center}
button.b{font:500 13px Roboto,system-ui,sans-serif;padding:7px 12px;border-radius:8px;border:1px solid rgba(127,127,127,.31);background:transparent;color:inherit;cursor:pointer;white-space:nowrap}
button.b:hover{background:rgba(127,127,127,.13)}
button.b:disabled{opacity:.4;cursor:default}
button.p{background:#f2b866;border-color:#f2b866;color:#2a1a04}
button.p:hover{background:#f5c47e}
button.d{color:#ff8a7a;border-color:rgba(255,138,122,.35)}
button.wide{width:100%;padding:11px;font-size:14px;margin-top:10px}
button:focus-visible,input:focus-visible{outline:2px solid #f2b866;outline-offset:2px}
input.t{width:100%;height:44px;border-radius:8px;border:1px solid rgba(127,127,127,.40);background:rgba(127,127,127,.09);color:inherit;font:16px Roboto,system-ui,sans-serif;padding:0 12px}
.tabs{display:flex;gap:6px;flex-wrap:wrap}
.tab{font:500 13px Roboto,system-ui,sans-serif;padding:6px 12px;border-radius:999px;border:1px solid rgba(127,127,127,.31);background:transparent;color:inherit;cursor:pointer}
.tab.sel{background:rgba(242,184,102,.16);border-color:#f2b866;color:var(--primary-text-color,#e1e1e1)}
.tab i{font-style:normal;opacity:.7;margin-left:4px}
.lt{display:grid;grid-template-columns:22px minmax(0,1fr) auto;align-items:center;gap:6px 10px;padding:10px 12px;border-radius:10px;background:rgba(127,127,127,.09);margin-bottom:6px}
.lt input[type=checkbox]{width:18px;height:18px;accent-color:#f2b866;margin:0}
.lt .ln{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lt.out .ln{opacity:.55}
.sw{display:flex;border-radius:8px;overflow:hidden;border:1px solid rgba(127,127,127,.31)}
.sw button{font:500 12px Roboto,system-ui,sans-serif;padding:5px 10px;border:0;background:transparent;color:inherit;cursor:pointer}
.sw button.sel{background:rgba(242,184,102,.22);color:var(--primary-text-color,#e1e1e1)}
.dim{grid-column:2 / 4;display:flex;align-items:center;gap:10px}
.dim input{flex:1;accent-color:#f2b866;min-width:0}
.dim span{font-size:12px;width:38px;text-align:right;color:var(--secondary-text-color,#9b9b9b)}
.foot{display:flex;gap:8px;margin-top:14px}
.foot .sp{flex:1}
.err{color:#ff8a7a;font-size:13px;margin-top:8px;min-height:1px}
.sheet{margin-top:6px}
.chk{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;background:rgba(127,127,127,.09);margin-bottom:6px;cursor:pointer}
.chk input{width:18px;height:18px;accent-color:#f2b866;margin:0}
.chk.dis{opacity:.45;cursor:default}
.chk .nm{flex:1}
.chk b{display:block;font-size:14px;font-weight:500}
.chk small{font-size:12px;color:var(--secondary-text-color,#9b9b9b)}
.note{font-size:13px;color:var(--secondary-text-color,#9b9b9b);margin:4px 0 0;line-height:1.45}
.tools{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.tools button.b{flex:1;padding:10px;font-size:13px}
.clip{display:flex;align-items:center;gap:8px;margin-top:10px;padding:8px 10px 8px 12px;border-radius:10px;background:rgba(242,184,102,.1);border:1px dashed rgba(242,184,102,.45);font-size:13px;color:var(--primary-text-color,#e1e1e1)}
.clip span{flex:1;min-width:0}
.toast{position:sticky;bottom:0;margin:10px 0 0;padding:10px 12px;border-radius:10px;background:rgba(76,175,80,.16);border:1px solid rgba(76,175,80,.4);font-size:13px;color:var(--primary-text-color,#e1e1e1);display:none}
.toast.show{display:block}
.toast.bad{background:rgba(244,67,54,.14);border-color:rgba(244,67,54,.45);color:var(--primary-text-color,#e1e1e1)}
.warn{font-size:13px;color:var(--warning-color,#e09b2d);margin:8px 0 0;line-height:1.45}
.loading{padding:28px 0;text-align:center;color:var(--secondary-text-color,#9b9b9b);font-size:14px}
`;

const BULB = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

class ARLightingScenesCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.view = "list"; // list | edit | push | copy
    this.panelId = null;
    this.draft = null; // {id?, name, lights:{eid:{on,bri}}}
    this.area = null;
    this.pushId = null;
    this.toastT = null;
    this.clip = null; // {kind:"room", area, items:[{name,on,bri}]} | {kind:"scene", name, lights}
  }
  set backend(b) {
    this.b = b;
    b.onChange(() => {
      if (this.panelId !== "*" && !this.panel()) this.pickPanel();
      if (this.view === "list") this.render();
    });
    b.onError((m) => this.toast(m, true));
    this.pickPanel();
    this.render();
  }
  pickPanel() {
    const ps = this.b.panels();
    this.panelId = (ps.find((p) => p.online) || ps[0] || {}).id;
  }

  // ---- helpers ----
  panel() {
    return this.b.panels().find((p) => p.id === this.panelId);
  }
  isAll() {
    return this.panelId === "*";
  }
  toast(msg, bad) {
    const t = this.shadowRoot.querySelector(".toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.toggle("bad", !!bad);
    t.classList.add("show");
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => t.classList.remove("show"), 3500);
  }
  shell(body) {
    this.shadowRoot.innerHTML = `<style>${CSS}</style><div class="card"><div class="hd"><span class="ic">${BULB}</span><div><h1>Lighting Scenes</h1><p>Make your own scenes and put them on your panels</p></div></div><div class="bd">${body}<div class="toast" role="status"></div></div></div>`;
    return this.shadowRoot;
  }
  on(sel, ev, fn) {
    this.shadowRoot.querySelectorAll(sel).forEach((n) => n.addEventListener(ev, fn));
  }
  countText(sc) {
    const n = Object.keys(sc.lights).length;
    const on = Object.keys(sc.lights).filter((e) => sc.lights[e].on).length;
    return n + (n === 1 ? " light" : " lights") + (on < n ? " · " + (n - on) + " switched off" : "");
  }

  render() {
    if (this.view === "edit") return this.renderEdit();
    if (this.view === "push") return this.renderPush();
    if (this.view === "copy") return this.renderCopy();
    if (this.isAll()) return this.renderAll();
    const panels = this.b.panels();
    const scenes = this.b.scenes();
    const p = this.panel();
    const mine = p ? p.scenes.filter((id) => scenes[id]) : [];
    const others = Object.keys(scenes).filter((id) => mine.indexOf(id) < 0);
    if (!panels.length) {
      this.shell(`<div class="empty" style="margin-top:12px">No AR NSPanel Pro panels found yet. Once a panel is set up in AR NSPanel Pro it shows here by itself.</div>`);
      return;
    }
    let h = `<div class="lbl">Panel</div><div class="panels">` + this.allChip();
    panels.forEach((x) => {
      h += `<button class="pn${x.id === this.panelId ? " sel" : ""}${x.online ? "" : " off"}" data-p="${x.id}"><span class="dot"></span><span><b>${esc(x.name)}</b><small>${x.online ? "Online" : "Offline"} · ${x.scenes.length} of ${MAX} scenes</small></span></button>`;
    });
    h += `</div>`;
    if (p) {
      h += `<div class="lbl">On ${esc(p.name)}<span>${mine.length} of ${MAX}</span></div>`;
      if (!mine.length) h += `<div class="empty">No scenes on this panel yet. Make one below, or add a saved one.</div>`;
      mine.forEach((id) => {
        const sc = scenes[id];
        h += `<div class="row"><div class="nm"><b>${esc(sc.name)}</b><small>${this.countText(sc)}</small></div><button class="b" data-try="${id}">Try</button><button class="b" data-edit="${id}">Edit</button><button class="b" data-copy="${id}">Copy</button><button class="b d" data-unpush="${id}" title="Take it off this panel (the scene is kept)">Remove</button></div>`;
      });
      if (others.length) {
        h += `<div class="lbl">Other saved scenes</div>`;
        others.forEach((id) => {
          const sc = scenes[id];
          h += `<div class="row"><div class="nm"><b>${esc(sc.name)}</b><small>${this.countText(sc)}</small></div><button class="b" data-try="${id}">Try</button><button class="b" data-edit="${id}">Edit</button><button class="b" data-copy="${id}">Copy</button><button class="b" data-add="${id}" ${mine.length >= MAX || !p.online ? "disabled" : ""}>Add to panel</button></div>`;
        });
      }
      if (!p.elegant) h += `<p class="warn">${esc(p.name)} uses the Classic dashboard. Lighting scenes show on panels set to Elegant (ask your installer).</p>`;
      if (!p.online) h += `<p class="note">${esc(p.name)} is offline. Scenes you put on it arrive when it's back on.</p>`;
      if (panels.length > 1) h += `<button class="b wide" id="copyp" ${mine.length ? "" : "disabled"}>Copy ${esc(p.name)}'s scenes to other panels</button>`;
    }
    h += `<button class="b p wide" id="new">+ New lighting scene</button>`;
    this.shell(h);
    this.bindChips();
    const cp = this.shadowRoot.getElementById("copyp");
    if (cp)
      cp.addEventListener("click", () => {
        this.copySel = {};
        this.view = "copy";
        this.render();
      });
    this.bindRows();
    this.on("[data-unpush]", "click", (e) => {
      const id = e.currentTarget.getAttribute("data-unpush");
      this.b.unpush(id, this.panelId);
      this.render();
      this.toast(scenes[id].name + " taken off " + p.name + ". It's still saved.");
    });
    this.on("[data-add]", "click", (e) => {
      const id = e.currentTarget.getAttribute("data-add");
      this.b.push(id, [this.panelId]);
      this.render();
      this.toast(scenes[id].name + " is on " + p.name + " now");
    });
    this.on("#new", "click", () => {
      this.draft = { name: "", lights: {} };
      this.view = "edit";
      this.render();
    });
  }

  allChip() {
    const n = this.b.panels().length;
    return `<button class="pn all${this.isAll() ? " sel" : ""}" data-p="*"><span class="dot"></span><span><b>All panels</b><small>${n} panels · same scenes on each</small></span></button>`;
  }
  bindChips() {
    this.on("[data-p]", "click", (e) => {
      this.panelId = e.currentTarget.getAttribute("data-p");
      this.render();
    });
  }
  bindRows() {
    const scenes = this.b.scenes();
    this.on("[data-try]", "click", (e) => {
      const id = e.currentTarget.getAttribute("data-try");
      this.b.activate(id);
      this.toast(scenes[id].name + " is on");
    });
    this.on("[data-copy]", "click", (e) => {
      const id = e.currentTarget.getAttribute("data-copy");
      this.clip = { kind: "scene", name: scenes[id].name, lights: JSON.parse(JSON.stringify(scenes[id].lights)) };
      this.toast(scenes[id].name + " copied. Pick a panel, tap + New lighting scene, then Paste.");
    });
    this.on("[data-edit]", "click", (e) => {
      const id = e.currentTarget.getAttribute("data-edit");
      this.draft = JSON.parse(JSON.stringify(Object.assign({ id: id }, scenes[id])));
      this.view = "edit";
      this.render();
    });
  }

  // "All panels": every saved scene, which panels have it, add to / remove from all at once
  renderAll() {
    const panels = this.b.panels();
    const scenes = this.b.scenes();
    const ids = Object.keys(scenes);
    let h = `<div class="lbl">Panel</div><div class="panels">` + this.allChip();
    panels.forEach((x) => {
      h += `<button class="pn${x.online ? "" : " off"}" data-p="${x.id}"><span class="dot"></span><span><b>${esc(x.name)}</b><small>${x.online ? "Online" : "Offline"} · ${x.scenes.length} of ${MAX} scenes</small></span></button>`;
    });
    h += `</div><div class="lbl">All saved scenes<span>${ids.length}</span></div>`;
    if (!ids.length) h += `<div class="empty">No scenes yet. Make one below; with All panels picked it goes to every panel.</div>`;
    ids.forEach((id) => {
      const sc = scenes[id];
      const onAll = panels.every((p) => p.scenes.indexOf(id) >= 0);
      const onAny = panels.some((p) => p.scenes.indexOf(id) >= 0);
      const roomAll = panels.every((p) => p.scenes.indexOf(id) >= 0 || p.scenes.length < MAX);
      h += `<div class="row"><div class="nm"><b>${esc(sc.name)}</b><small>${this.countText(sc)}</small><div class="on3">${panels.map((p) => `<i class="${p.scenes.indexOf(id) >= 0 ? "" : "no"}">${esc(p.name.replace(/ panel$/i, ""))}</i>`).join("")}</div></div><button class="b" data-try="${id}">Try</button><button class="b" data-edit="${id}">Edit</button>${onAll ? `<button class="b d" data-unall="${id}">Remove from all</button>` : `<button class="b" data-toall="${id}" ${roomAll ? "" : 'disabled title="A panel already has 4 scenes"'}>Add to all</button>`}</div>`;
      void onAny;
    });
    h += `<button class="b p wide" id="new">+ New lighting scene for all panels</button>`;
    this.shell(h);
    this.bindChips();
    this.bindRows();
    this.on("[data-toall]", "click", (e) => {
      const id = e.currentTarget.getAttribute("data-toall");
      this.b.push(id, panels.map((p) => p.id));
      this.render();
      this.toast(scenes[id].name + " is on every panel now");
    });
    this.on("[data-unall]", "click", (e) => {
      const id = e.currentTarget.getAttribute("data-unall");
      panels.forEach((p) => this.b.unpush(id, p.id));
      this.render();
      this.toast(scenes[id].name + " taken off every panel. It's still saved.");
    });
    this.on("#new", "click", () => {
      this.draft = { name: "", lights: {} };
      this.view = "edit";
      this.render();
    });
  }

  // copy one panel's scenes to other panels: they end up identical
  renderCopy() {
    const src = this.panel();
    const scenes = this.b.scenes();
    const others = this.b.panels().filter((p) => p.id !== src.id);
    const names = src.scenes.filter((id) => scenes[id]).map((id) => scenes[id].name);
    let h = `<div class="lbl">Copy from</div><div class="row"><div class="nm"><b>${esc(src.name)}</b><small>${names.map(esc).join(" · ")}</small></div></div>`;
    h += `<div class="lbl">To<span><button class="b" id="pickall" style="padding:4px 10px">All panels</button></span></div>`;
    others.forEach((p) => {
      const now = p.scenes.filter((id) => scenes[id]).map((id) => scenes[id].name);
      h += `<label class="chk"><input type="checkbox" data-cp="${p.id}" ${this.copySel[p.id] ? "checked" : ""}><span class="nm"><b>${esc(p.name)}</b><small>${p.online ? "Online" : "Offline, gets it when it's back on"} · now: ${now.length ? now.map(esc).join(", ") : "no scenes"}</small></span></label>`;
    });
    h += `<p class="note">The panels you tick end up with exactly the same scenes as ${esc(src.name)}, in the same order. Their other scenes come off them (they stay saved).</p>`;
    h += `<div class="foot"><span class="sp"></span><button class="b" id="cancel">Cancel</button><button class="b p" id="go">Copy</button></div>`;
    this.shell(h);
    const R = this.shadowRoot;
    const label = () => {
      const n = Object.keys(this.copySel).filter((k) => this.copySel[k]).length;
      R.getElementById("go").textContent = n > 1 ? "Copy to " + n + " panels" : "Copy";
      R.getElementById("go").disabled = !n;
    };
    this.on("[data-cp]", "change", (e) => {
      this.copySel[e.currentTarget.getAttribute("data-cp")] = e.currentTarget.checked;
      label();
    });
    R.getElementById("pickall").addEventListener("click", () => {
      others.forEach((p) => (this.copySel[p.id] = true));
      this.renderCopy();
    });
    label();
    R.getElementById("cancel").addEventListener("click", () => {
      this.view = "list";
      this.render();
    });
    R.getElementById("go").addEventListener("click", () => {
      const ids = Object.keys(this.copySel).filter((k) => this.copySel[k]);
      ids.forEach((pid) => this.b.setPanelScenes(pid, src.scenes.slice()));
      this.view = "list";
      this.render();
      this.toast(others.filter((p) => ids.indexOf(p.id) >= 0).map((p) => p.name).join(", ") + " now match " + src.name);
    });
  }

  renderEdit() {
    const d = this.draft;
    const lights = this.b.lights();
    const areas = [];
    lights.forEach((l) => areas.indexOf(l.area) < 0 && areas.push(l.area));
    if (!this.area || areas.indexOf(this.area) < 0) {
      const firstUsed = lights.find((l) => d.lights[l.entity]);
      this.area = firstUsed ? firstUsed.area : areas[0];
    }
    const used = (a) => lights.filter((l) => l.area === a && d.lights[l.entity]).length;
    let h = `<div class="lbl">${d.id ? "Edit scene" : "New scene"}</div><input class="t" id="name" placeholder="Scene name, e.g. Movie night" maxlength="24" value="${esc(d.name)}">`;
    h += `<div class="lbl">Lights<span>${Object.keys(d.lights).length} in this scene</span></div><div class="tabs">`;
    areas.forEach((a) => (h += `<button class="tab${a === this.area ? " sel" : ""}" data-a="${esc(a)}">${esc(a)}${used(a) ? "<i>" + used(a) + "</i>" : ""}</button>`));
    h += `</div><div class="sheet">`;
    lights
      .filter((l) => l.area === this.area)
      .forEach((l) => {
        const s = d.lights[l.entity];
        h += `<div class="lt${s ? "" : " out"}"><input type="checkbox" data-in="${l.entity}" ${s ? "checked" : ""} aria-label="Use ${esc(l.name)}"><span class="ln">${esc(l.name)}</span>`;
        if (s) {
          h += `<span class="sw"><button data-on="${l.entity}" class="${s.on ? "sel" : ""}">On</button><button data-off="${l.entity}" class="${s.on ? "" : "sel"}">Off</button></span>`;
          if (s.on && l.dim) h += `<div class="dim"><input type="range" min="1" max="100" value="${Math.round((s.bri || 1) * 100)}" data-bri="${l.entity}" aria-label="${esc(l.name)} brightness"><span>${Math.round((s.bri || 1) * 100)} %</span></div>`;
        } else h += `<span></span>`;
        h += `</div>`;
      });
    const inRoom = lights.filter((l) => l.area === this.area && d.lights[l.entity]).length;
    h += `</div><button class="b wide" id="copy">Use how the ${esc(this.area)} lights are right now</button>`;
    h += `<div class="tools"><button class="b" id="croom" ${inRoom ? "" : "disabled"}>Copy ${esc(this.area)} settings</button>`;
    const c = this.clip;
    if (c && c.kind === "room") h += `<button class="b p" id="paste" ${c.area === this.area ? "disabled" : ""}>Paste ${esc(c.area)} into ${esc(this.area)}</button>`;
    if (c && c.kind === "scene") h += `<button class="b p" id="paste">Paste ${esc(c.name)}</button>`;
    h += `</div>`;
    if (c) h += `<div class="clip"><span>Copied: ${c.kind === "room" ? esc(c.area) + " (" + c.items.length + " lights)" : esc(c.name) + " (" + Object.keys(c.lights).length + " lights)"}</span><button class="b" id="clear" style="padding:4px 10px">Clear</button></div>`;
    h += `<div class="err" id="err"></div><div class="foot">${d.id ? '<button class="b d" id="del">Delete</button>' : ""}<span class="sp"></span><button class="b" id="cancel">Cancel</button><button class="b" id="try">Try it</button><button class="b p" id="save">Save</button></div>`;
    this.shell(h);
    const R = this.shadowRoot;
    R.getElementById("name").addEventListener("input", (e) => (d.name = e.target.value));
    this.on("[data-a]", "click", (e) => {
      this.area = e.currentTarget.getAttribute("data-a");
      this.renderEdit();
    });
    this.on("[data-in]", "change", (e) => {
      const id = e.currentTarget.getAttribute("data-in");
      const l = lights.find((x) => x.entity === id);
      if (e.currentTarget.checked) d.lights[id] = { on: true, bri: l.dim ? l.bri || 0.8 : 1 };
      else delete d.lights[id];
      this.renderEdit();
    });
    this.on("[data-on]", "click", (e) => {
      d.lights[e.currentTarget.getAttribute("data-on")].on = true;
      this.renderEdit();
    });
    this.on("[data-off]", "click", (e) => {
      d.lights[e.currentTarget.getAttribute("data-off")].on = false;
      this.renderEdit();
    });
    this.on("[data-bri]", "input", (e) => {
      const v = Number(e.currentTarget.value);
      d.lights[e.currentTarget.getAttribute("data-bri")].bri = v / 100;
      e.currentTarget.nextElementSibling.textContent = v + " %";
    });
    R.getElementById("copy").addEventListener("click", () => {
      lights
        .filter((l) => l.area === this.area)
        .forEach((l) => (d.lights[l.entity] = { on: l.on, bri: l.dim && l.on ? l.bri || 1 : 1 }));
      this.renderEdit();
    });
    // copy this room's settings in the scene; paste them onto another room's
    // lights (same name first, e.g. Downlights -> Downlights, then in order)
    R.getElementById("croom").addEventListener("click", () => {
      const items = lights.filter((l) => l.area === this.area && d.lights[l.entity]).map((l) => ({ name: l.name.toLowerCase(), on: d.lights[l.entity].on, bri: d.lights[l.entity].bri }));
      this.clip = { kind: "room", area: this.area, items: items };
      this.renderEdit();
      this.toast(this.area + " copied. Tap another room above, then Paste.");
    });
    const pb = R.getElementById("paste");
    if (pb)
      pb.addEventListener("click", () => {
        const c = this.clip;
        if (c.kind === "scene") {
          Object.keys(c.lights).forEach((e) => (d.lights[e] = Object.assign({}, c.lights[e])));
          if (!d.name.trim()) d.name = c.name + " copy";
          this.renderEdit();
          this.toast(c.name + " pasted: " + Object.keys(c.lights).length + " lights. Change anything you like, then Save.");
          return;
        }
        const target = lights.filter((l) => l.area === this.area);
        const left = c.items.slice();
        const take = (fn) => {
          const i = left.findIndex(fn);
          return i < 0 ? null : left.splice(i, 1)[0];
        };
        const pairs = target.map((l) => ({ l: l, s: take((x) => x.name === l.name.toLowerCase()) }));
        pairs.forEach((p) => {
          if (!p.s) p.s = take(() => true);
        });
        let n = 0;
        pairs.forEach((p) => {
          if (!p.s) return;
          d.lights[p.l.entity] = { on: p.s.on, bri: p.l.dim ? p.s.bri || 1 : 1 };
          n++;
        });
        this.renderEdit();
        this.toast(c.area + " pasted into " + this.area + ": " + n + " lights set." + (target.length > n ? " " + (target.length - n) + " left as they were." : ""));
      });
    const cl = R.getElementById("clear");
    if (cl)
      cl.addEventListener("click", () => {
        this.clip = null;
        this.renderEdit();
      });
    R.getElementById("cancel").addEventListener("click", () => {
      this.view = "list";
      this.render();
    });
    R.getElementById("try").addEventListener("click", () => {
      if (!Object.keys(d.lights).length) return void (R.getElementById("err").textContent = "Tick at least one light.");
      this.b.activate(null, d);
      this.toast("Showing it on the lights now. Save to keep it.");
    });
    if (d.id)
      R.getElementById("del").addEventListener("click", (e) => {
        if (!e.currentTarget.dataset.armed) {
          e.currentTarget.dataset.armed = "1";
          e.currentTarget.textContent = "Tap again to delete";
          return;
        }
        this.b.remove(d.id);
        this.view = "list";
        this.render();
        this.toast(d.name + " deleted and taken off every panel");
      });
    R.getElementById("save").addEventListener("click", () => {
      const err = R.getElementById("err");
      d.name = d.name.trim();
      if (!d.name) return void (err.textContent = "Give the scene a name.");
      if (!Object.keys(d.lights).length) return void (err.textContent = "Tick at least one light.");
      const was = d.id;
      if (!d.id) d.id = d.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 30) + "_" + Math.random().toString(36).slice(2, 6);
      const id = this.b.save(d);
      const on = this.b.panels().filter((p) => p.scenes.indexOf(id) >= 0);
      if (was && on.length) {
        this.view = "list";
        this.render();
        this.toast(d.name + " saved. Updated on " + on.map((p) => p.name).join(", ") + ".");
        return;
      }
      this.pushId = id;
      this.pushSel = {};
      const p = this.panel();
      if (this.isAll()) this.b.panels().forEach((x) => x.scenes.length < MAX && (this.pushSel[x.id] = true));
      else if (p && p.online && p.scenes.length < MAX) this.pushSel[p.id] = true;
      this.view = "push";
      this.render();
    });
  }

  renderPush() {
    const sc = this.b.scenes()[this.pushId];
    const panels = this.b.panels();
    let h = `<div class="lbl">Saved</div><div class="row"><div class="nm"><b>${esc(sc.name)}</b><small>${this.countText(sc)}</small></div></div>`;
    h += `<div class="lbl">Push to panel<span><button class="b" id="pickall" style="padding:4px 10px">All panels</button></span></div>`;
    panels.forEach((p) => {
      const has = p.scenes.indexOf(this.pushId) >= 0;
      const full = !has && p.scenes.length >= MAX;
      const dis = has || full;
      h += `<label class="chk${dis ? " dis" : ""}"><input type="checkbox" data-pp="${p.id}" ${this.pushSel[p.id] || has ? "checked" : ""} ${dis ? "disabled" : ""}><span class="nm"><b>${esc(p.name)}</b><small>${has ? "Already on it" : full ? "Full: " + MAX + " of " + MAX + " scenes. Remove one first." : (p.online ? "Online" : "Offline, gets it when it's back on") + " · " + p.scenes.length + " of " + MAX + " scenes"}</small></span></label>`;
    });
    h += `<p class="note">The scene shows on the panel's home screen under the weather, and next to All on / All off on its Lights page.</p>`;
    h += `<div class="foot"><span class="sp"></span><button class="b" id="later">Not now</button><button class="b p" id="push">Push to panel</button></div>`;
    this.shell(h);
    const R = this.shadowRoot;
    const label = () => {
      const n = Object.keys(this.pushSel).filter((k) => this.pushSel[k]).length;
      R.getElementById("push").textContent = n > 1 ? "Push to " + n + " panels" : "Push to panel";
      R.getElementById("push").disabled = !n;
    };
    R.getElementById("pickall").addEventListener("click", () => {
      panels.forEach((p) => p.scenes.indexOf(this.pushId) < 0 && p.scenes.length < MAX && (this.pushSel[p.id] = true));
      this.renderPush();
    });
    this.on("[data-pp]", "change", (e) => {
      this.pushSel[e.currentTarget.getAttribute("data-pp")] = e.currentTarget.checked;
      label();
    });
    label();
    R.getElementById("later").addEventListener("click", () => {
      this.view = "list";
      this.render();
      this.toast(sc.name + " saved. Add it to a panel any time.");
    });
    R.getElementById("push").addEventListener("click", () => {
      const ids = Object.keys(this.pushSel).filter((k) => this.pushSel[k]);
      this.b.push(this.pushId, ids);
      this.view = "list";
      this.render();
      this.toast(sc.name + " pushed to " + panels.filter((p) => ids.indexOf(p.id) >= 0).map((p) => p.name).join(", "));
    });
  }
}


// ---- Home Assistant backend: a local copy of the integration's state, changed
// at once on every action (so the card answers straight away) while the call
// goes to Home Assistant; Home Assistant's answer then replaces the copy.
class HaBackend {
  constructor(hass) {
    this.hass = hass;
    this.d = { panels: [], scenes: {}, lights: [], max: 4 };
    this.cbs = [];
    this.errs = [];
  }
  ws(type, extra) {
    return this.hass.connection.sendMessagePromise(Object.assign({ type: "ar_lighting_scenes/" + type }, extra || {}));
  }
  async load(refresh) {
    this.d = await this.ws(refresh ? "refresh" : "state");
    this.cbs.forEach((f) => f());
  }
  async start() {
    await this.load(true);
    this.unsub = await this.hass.connection.subscribeMessage(() => this.load().catch(() => {}), { type: "ar_lighting_scenes/subscribe" });
  }
  stop() {
    if (this.unsub) this.unsub();
    this.unsub = null;
  }
  call(type, extra) {
    return this.ws(type, extra).catch((e) => {
      this.errs.forEach((f) => f((e && e.message) || "Home Assistant didn't accept that"));
      return this.load().catch(() => {});
    });
  }
  // what the card reads
  panels() {
    return this.d.panels;
  }
  scenes() {
    return this.d.scenes;
  }
  lights() {
    const st = (this.hass && this.hass.states) || {};
    return this.d.lights.map((l) => {
      const s = st[l.entity];
      const on = !!s && s.state === "on";
      const b = s && s.attributes && typeof s.attributes.brightness === "number" ? s.attributes.brightness / 255 : on ? 1 : 0;
      return Object.assign({}, l, { on: on, bri: b || 1 });
    });
  }
  onChange(f) {
    this.cbs.push(f);
  }
  onError(f) {
    this.errs.push(f);
  }
  // what the card changes
  save(d) {
    this.d.scenes[d.id] = { name: d.name, lights: JSON.parse(JSON.stringify(d.lights)) };
    this.call("save", { scene: { id: d.id, name: d.name, lights: d.lights } });
    return d.id;
  }
  remove(id) {
    delete this.d.scenes[id];
    this.d.panels.forEach((p) => (p.scenes = p.scenes.filter((x) => x !== id)));
    this.call("delete", { scene_id: id });
  }
  push(id, ids) {
    const max = this.d.max || 4;
    this.d.panels.forEach((p) => {
      if (ids.indexOf(p.id) >= 0 && p.scenes.indexOf(id) < 0 && p.scenes.length < max) p.scenes.push(id);
    });
    this.call("push", { scene_id: id, panels: ids });
  }
  unpush(id, pid) {
    this.d.panels.forEach((p) => {
      if (p.id === pid) p.scenes = p.scenes.filter((x) => x !== id);
    });
    this.call("unpush", { scene_id: id, panel: pid });
  }
  setPanelScenes(pid, ids) {
    const max = this.d.max || 4;
    this.d.panels.forEach((p) => {
      if (p.id === pid) p.scenes = ids.slice(0, max);
    });
    this.call("set_panel", { panel: pid, scene_ids: ids });
  }
  activate(id, draft) {
    if (draft) this.call("activate", { lights: draft.lights });
    else this.call("activate", { scene_id: id });
  }
}

class ARLightingScenesHaCard extends ARLightingScenesCard {
  setConfig(config) {
    this.config = config || {};
  }
  getCardSize() {
    return 6;
  }
  static getStubConfig() {
    return {};
  }
  set hass(h) {
    this._hass = h;
    if (this.be) {
      // keep the live light states for "Use how the lights are right now";
      // don't redraw (that would wipe a scene being edited)
      this.be.hass = h;
      return;
    }
    this.be = new HaBackend(h);
    this.shell('<div class="loading">Looking for your panels…</div>');
    this.be
      .start()
      .then(() => {
        if (this.be) this.backend = this.be;
      })
      .catch((e) => this.shell('<div class="empty" style="margin-top:12px">' + esc((e && e.message) || "AR Lighting Scenes isn't set up in Home Assistant.") + "</div>"));
  }
  get hass() {
    return this._hass;
  }
  connectedCallback() {
    if (!this.be && this._hass) this.hass = this._hass;
  }
  disconnectedCallback() {
    if (this.be) this.be.stop();
    this.be = null;
  }
}
if (!customElements.get("ar-lighting-scenes-card")) customElements.define("ar-lighting-scenes-card", ARLightingScenesHaCard);

// the "Lighting Scenes" sidebar page: the card on its own page
class ARLightingScenesPanel extends HTMLElement {
  set hass(h) {
    this._hass = h;
    if (!this.card) {
      this.innerHTML =
        "<style>" +
        "ar-lighting-scenes-panel{display:block;min-height:100vh;background:var(--primary-background-color,#111)}" +
        ".ar-ls-top{display:flex;align-items:center;gap:6px;height:56px;padding:0 12px;background:var(--app-header-background-color,#1c1c1c);color:var(--app-header-text-color,#e1e1e1);font:400 20px Roboto,system-ui,sans-serif;border-bottom:1px solid var(--divider-color,rgba(255,255,255,.08))}" +
        ".ar-ls-body{max-width:640px;margin:0 auto;padding:16px}" +
        '</style><div class="ar-ls-top"><ha-menu-button></ha-menu-button><span>Lighting Scenes</span></div><div class="ar-ls-body"></div>';
      this.card = document.createElement("ar-lighting-scenes-card");
      this.card.setConfig({});
      this.querySelector(".ar-ls-body").appendChild(this.card);
    }
    const mb = this.querySelector("ha-menu-button");
    if (mb) {
      mb.hass = h;
      mb.narrow = this._narrow;
    }
    this.card.hass = h;
  }
  get hass() {
    return this._hass;
  }
  set narrow(n) {
    this._narrow = n;
    const mb = this.querySelector("ha-menu-button");
    if (mb) mb.narrow = n;
  }
  get narrow() {
    return this._narrow;
  }
  set panel(p) {}
  set route(r) {}
}
if (!customElements.get("ar-lighting-scenes-panel")) customElements.define("ar-lighting-scenes-panel", ARLightingScenesPanel);

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "ar-lighting-scenes-card"))
  window.customCards.push({
    type: "ar-lighting-scenes-card",
    name: "AR Lighting Scenes",
    description: "Make lighting scenes and push them to your AR NSPanel Pro panels.",
    preview: false,
  });
