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
.foot.top{margin-top:10px}
.lt.in{grid-template-columns:minmax(0,1fr) auto auto}
.lt .ln b{display:block;font-weight:500;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lt .ln small,.pk small{display:block;font-size:11px;color:var(--secondary-text-color,#9b9b9b)}
.lt .x{font:400 20px/1 Roboto,system-ui,sans-serif;width:30px;height:30px;border-radius:8px;border:0;background:transparent;color:var(--secondary-text-color,#9b9b9b);cursor:pointer}
.lt .x:hover{background:rgba(127,127,127,.13);color:#ff8a7a}
.lt.in .dim{grid-column:1 / 4}
input.search{height:40px;font-size:14px;margin-top:8px}
.pick{margin-top:8px;max-height:320px;overflow-y:auto;border-radius:10px;border:1px solid rgba(127,127,127,.22);padding:4px}
.pk{display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:8px;cursor:pointer}
.pk:hover{background:rgba(127,127,127,.11)}
.pk.on{background:rgba(242,184,102,.1)}
.pk input{width:18px;height:18px;accent-color:#f2b866;margin:0;flex:none}
.pk .ln{min-width:0}
.pk b{display:block;font-weight:400;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.toast{position:sticky;bottom:0;margin:10px 0 0;padding:10px 12px;border-radius:10px;background:rgba(76,175,80,.16);border:1px solid rgba(76,175,80,.4);font-size:13px;color:var(--primary-text-color,#e1e1e1);display:none}
.toast.show{display:block}
.toast.bad{background:rgba(244,67,54,.14);border-color:rgba(244,67,54,.45);color:var(--primary-text-color,#e1e1e1)}
.warn{font-size:13px;color:var(--warning-color,#e09b2d);margin:8px 0 0;line-height:1.45}
.loading{padding:28px 0;text-align:center;color:var(--secondary-text-color,#9b9b9b);font-size:14px}
.sec{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 2px}
.sec .tab{font-size:14px;padding:8px 14px}
.mg{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px;margin-top:10px}
.mg.bg{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
.mi{position:relative;border-radius:12px;border:1px solid rgba(127,127,127,.26);background:rgba(127,127,127,.07);overflow:hidden}
.mi .th{aspect-ratio:1;display:grid;place-items:center;background:#15151a}
.mi .th img{width:60%;height:60%;object-fit:contain}
.mg.bg .mi .th{aspect-ratio:16/10}
.mg.bg .mi .th img{width:100%;height:100%;border-radius:0;object-fit:cover}
.mi .mn{font-size:12px;padding:6px 8px 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mi .x{position:absolute;top:6px;right:6px;width:28px;height:28px;border-radius:50%;border:0;background:rgba(0,0,0,.6);color:#fff;font-size:16px;line-height:28px;cursor:pointer;padding:0}
.mi .x:hover{background:#b3473a}
.madd{border:1px dashed rgba(127,127,127,.45);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:120px;cursor:pointer;color:var(--secondary-text-color,#9b9b9b);font:13px Roboto,system-ui,sans-serif;background:transparent}
.madd b{font-size:26px;font-weight:300;color:#f2b866}
.madd:disabled{opacity:.45;cursor:default}
.mfull{margin-top:10px;font-size:13px;color:#ff8a7a}
.crop{position:fixed;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px;z-index:9}
.cbox{width:min(640px,100%);background:var(--ha-card-background,var(--card-background-color,#1c1c1c));border-radius:14px;border:1px solid rgba(127,127,127,.25);padding:16px;display:flex;flex-direction:column;gap:12px;max-height:100%;overflow:auto}
.cbox h2{font-size:17px;font-weight:500;margin:0}
.cfw{display:flex;justify-content:center;background:#0b0b0d;border-radius:10px;padding:14px}
.cfr{position:relative;overflow:hidden;touch-action:none;cursor:grab;background:#000;border-radius:6px;box-shadow:0 0 0 2px #f2b866}
.chk{background-color:#2a2a30;background-image:linear-gradient(45deg,#3a3a42 25%,transparent 25%,transparent 75%,#3a3a42 75%),linear-gradient(45deg,#3a3a42 25%,transparent 25%,transparent 75%,#3a3a42 75%);background-size:16px 16px;background-position:0 0,8px 8px}
.cfw.ic{gap:14px;flex-wrap:wrap;align-items:center}
.cpv{display:grid;grid-template-columns:96px 96px;gap:8px;align-content:center}
.cpv small{grid-column:1/-1;text-align:center;font-size:11px;color:var(--secondary-text-color,#9b9b9b)}
.cpv .pv{width:96px;height:96px;border-radius:12px;display:grid;place-items:center;overflow:hidden}
.cpv .pv canvas{width:72px;height:72px}
.cpv .pv.dk{background:radial-gradient(circle at 50% 40%,#2b2b33,#141418);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.copt{display:flex;flex-direction:column;gap:8px}
.ctg{display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer}
.ctg input{width:18px;height:18px;accent-color:#f2b866}
.ctg small{color:var(--secondary-text-color,#9b9b9b)}
.ccol{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;color:var(--secondary-text-color,#9b9b9b)}
.ccol span{margin-right:4px}
.copt input[type=range]:disabled,.ctg input:disabled{opacity:.4}
.cfr img{position:absolute;left:0;top:0;transform-origin:0 0;user-select:none;-webkit-user-drag:none;pointer-events:none;max-width:none}
.czm{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--secondary-text-color,#9b9b9b)}
.czm input{flex:1;accent-color:#f2b866}
.cact{display:flex;gap:8px;justify-content:flex-end}
`;

// uploaded icons / backgrounds: the shapes a background can be cropped to
const SHAPES = { wide: [16, 10, "Landscape · Source 10 (16:10)"], hd: [16, 9, "Wide · Source 7 (16:9)"], sq: [1, 1, "Square · NSPanel Pro"], tall: [10, 16, "Portrait"] };

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
    this.section = "scenes"; // scenes | icons | backgrounds (the tabs at the top)
    this.shadowRoot.addEventListener("click", (e) => {
      const t = e.target.closest && e.target.closest("[data-sec]");
      if (!t) return;
      this.section = t.getAttribute("data-sec");
      this.render();
    });
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
    const tabs = this.view === "list" && this.b ? `<div class="sec">${[["scenes", "Lighting scenes"], ["icons", "Icons"], ["backgrounds", "Backgrounds"]].map((t) => `<button class="tab${this.section === t[0] ? " sel" : ""}" data-sec="${t[0]}" type="button">${t[1]}</button>`).join("")}</div>` : "";
    this.shadowRoot.innerHTML = `<style>${CSS}</style><div class="card"><div class="hd"><span class="ic">${BULB}</span><div><h1>Lighting Scenes</h1><p>Make your own scenes, icons and backgrounds for your panels</p></div></div><div class="bd">${tabs}${body}<div class="toast" role="status"></div></div></div>`;
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
    if (this.view === "list" && this.section !== "scenes") return this.renderMedia();
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
    const byId = {};
    lights.forEach((l) => (byId[l.entity] = l));
    const kindOf = (l) => (l.entity.split(".")[0] === "switch" ? "switch" : "light");
    if (this.kind !== "switch") this.kind = "light";
    if (typeof this.q !== "string") this.q = "";
    const sub = (l) => (kindOf(l) === "switch" ? "Switch" : "Light") + (l.area && l.area !== "Other" ? " · " + l.area : "");
    let h = `<div class="lbl">${d.id ? "Edit scene" : "New scene"}</div><input class="t" id="name" placeholder="Scene name, e.g. Movie night" maxlength="24" value="${esc(d.name)}">`;
    h += `<div class="foot top">${d.id ? '<button class="b d" id="del">Delete</button>' : ""}<span class="sp"></span><button class="b" id="cancel">Cancel</button><button class="b" id="try">Try it</button><button class="b p" id="save">Save</button></div><div class="err" id="err"></div>`;
    h += `<div class="lbl">In this scene<span id="cnt"></span></div><div id="chosen"></div>`;
    h += `<div class="lbl">Add to the scene</div><div class="tabs"><button class="tab" data-k="light">Lights <i>${lights.filter((l) => kindOf(l) === "light").length}</i></button><button class="tab" data-k="switch">Switches <i>${lights.filter((l) => kindOf(l) === "switch").length}</i></button></div>`;
    h += `<input class="t search" id="q" type="search" placeholder="Search" autocomplete="off" value="${esc(this.q)}"><div class="pick" id="pick"></div>`;
    const c = this.clip;
    if (c && c.kind === "scene") h += `<div class="clip"><span>Copied: ${esc(c.name)} (${Object.keys(c.lights).length})</span><button class="b p" id="paste" style="padding:4px 10px">Paste</button><button class="b" id="clear" style="padding:4px 10px">Clear</button></div>`;
    this.shell(h);
    const R = this.shadowRoot;
    const chosen = R.getElementById("chosen");
    const pick = R.getElementById("pick");

    // what's in the scene: on / off, brightness, remove
    const drawChosen = () => {
      const ids = Object.keys(d.lights).filter((e) => byId[e]);
      R.getElementById("cnt").textContent = ids.length ? ids.length + (ids.length === 1 ? " item" : " items") : "";
      if (!ids.length) {
        chosen.innerHTML = `<div class="empty">Nothing yet. Tick lights or switches below.</div>`;
        return;
      }
      ids.sort((a, b) => byId[a].name.localeCompare(byId[b].name));
      let x = "";
      ids.forEach((e) => {
        const l = byId[e];
        const s = d.lights[e];
        x += `<div class="lt in"><span class="ln"><b>${esc(l.name)}</b><small>${esc(sub(l))}</small></span><span class="sw"><button data-on="${e}" class="${s.on ? "sel" : ""}">On</button><button data-off="${e}" class="${s.on ? "" : "sel"}">Off</button></span><button class="x" data-rm="${e}" aria-label="Take ${esc(l.name)} out">×</button>`;
        if (s.on && l.dim) x += `<div class="dim"><input type="range" min="1" max="100" value="${Math.round((s.bri || 1) * 100)}" data-bri="${e}" aria-label="${esc(l.name)} brightness"><span>${Math.round((s.bri || 1) * 100)} %</span></div>`;
        x += `</div>`;
      });
      x += `<button class="b wide" id="now">Use how these are right now</button>`;
      chosen.innerHTML = x;
    };
    // the list to add from: one tab for lights, one for switches, with search
    const drawPick = () => {
      R.querySelectorAll("[data-k]").forEach((t) => t.classList.toggle("sel", t.getAttribute("data-k") === this.kind));
      const q = this.q.trim().toLowerCase();
      const list = lights.filter((l) => kindOf(l) === this.kind && (!q || (l.name + " " + (l.area || "") + " " + l.entity).toLowerCase().indexOf(q) >= 0));
      if (!list.length) {
        pick.innerHTML = `<div class="empty">${q ? "Nothing matches “" + esc(this.q) + "”" : "None in Home Assistant"}</div>`;
        return;
      }
      let x = "";
      list.forEach((l) => {
        const inn = !!d.lights[l.entity];
        x += `<label class="pk${inn ? " on" : ""}"><input type="checkbox" data-in="${l.entity}" ${inn ? "checked" : ""}><span class="ln"><b>${esc(l.name)}</b>${l.area && l.area !== "Other" ? "<small>" + esc(l.area) + "</small>" : ""}</span></label>`;
      });
      pick.innerHTML = x;
    };
    drawChosen();
    drawPick();

    R.getElementById("name").addEventListener("input", (e) => {
      d.name = e.target.value;
      R.getElementById("err").textContent = "";
    });
    this.on("[data-k]", "click", (e) => {
      this.kind = e.currentTarget.getAttribute("data-k");
      pick.scrollTop = 0;
      drawPick();
    });
    R.getElementById("q").addEventListener("input", (e) => {
      this.q = e.target.value;
      drawPick();
    });
    pick.addEventListener("change", (e) => {
      const id = e.target.getAttribute && e.target.getAttribute("data-in");
      if (!id) return;
      const l = byId[id];
      if (e.target.checked) d.lights[id] = { on: true, bri: l.dim ? 0.8 : 1 };
      else delete d.lights[id];
      e.target.parentNode.classList.toggle("on", e.target.checked);
      drawChosen();
    });
    chosen.addEventListener("click", (e) => {
      const t = e.target;
      const on = t.getAttribute("data-on");
      const off = t.getAttribute("data-off");
      const rm = t.getAttribute("data-rm");
      if (on) d.lights[on].on = true;
      else if (off) d.lights[off].on = false;
      else if (rm) {
        delete d.lights[rm];
        drawPick();
      } else if (t.id === "now") {
        Object.keys(d.lights).forEach((id) => {
          const l = byId[id];
          if (l) d.lights[id] = { on: l.on, bri: l.dim && l.on ? l.bri || 1 : 1 };
        });
        this.toast("Filled in from how they are right now.");
      } else return;
      drawChosen();
    });
    chosen.addEventListener("input", (e) => {
      const id = e.target.getAttribute("data-bri");
      if (!id) return;
      const v = Number(e.target.value);
      d.lights[id].bri = v / 100;
      e.target.nextElementSibling.textContent = v + " %";
    });
    const pb = R.getElementById("paste");
    if (pb)
      pb.addEventListener("click", () => {
        Object.keys(c.lights).forEach((e) => (d.lights[e] = Object.assign({}, c.lights[e])));
        if (!d.name.trim()) d.name = c.name + " copy";
        R.getElementById("name").value = d.name;
        drawChosen();
        drawPick();
        this.toast(c.name + " pasted. Change anything you like, then Save.");
      });
    const cl = R.getElementById("clear");
    if (cl)
      cl.addEventListener("click", () => {
        this.clip = null;
        this.renderEdit();
      });
    R.getElementById("cancel").addEventListener("click", () => {
      this.q = "";
      this.view = "list";
      this.render();
    });
    R.getElementById("try").addEventListener("click", () => {
      if (!Object.keys(d.lights).length) return void (R.getElementById("err").textContent = "Tick at least one light or switch.");
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
      if (!d.name) {
        err.textContent = "Give the scene a name.";
        R.getElementById("name").focus();
        return;
      }
      if (!Object.keys(d.lights).length) return void (err.textContent = "Tick at least one light or switch.");
      this.q = "";
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

  // ---- uploaded icons / backgrounds (every panel can pick them) ----
  renderMedia() {
    const kind = this.section; // icons | backgrounds
    const isIcon = kind === "icons";
    const m = this.b.media ? this.b.media() : { max: 10, icons: [], backgrounds: [] };
    const list = m[kind] || [];
    const max = m.max || 10;
    const full = list.length >= max;
    let h = `<div class="lbl">${isIcon ? "Your icons" : "Your backgrounds"}<span>${list.length} of ${max}</span></div>`;
    h += `<p class="note" style="margin:0">${isIcon ? "On every panel under Settings → Icons, to put on a home-screen button." : "On every panel under Settings → Look → Backgrounds, for every room or one room."}</p>`;
    h += `<div class="mg${isIcon ? "" : " bg"}">`;
    list.forEach((it) => {
      h += `<div class="mi"><div class="th"><img alt="" src="${esc(it.url)}"></div><div class="mn">${esc(it.name)}</div><button class="x" type="button" data-del="${esc(it.id)}" aria-label="Delete ${esc(it.name)}">×</button></div>`;
    });
    h += `<button class="madd" type="button" id="madd" ${full ? "disabled" : ""}><b>+</b>${isIcon ? "Upload icon" : "Upload background"}</button></div>`;
    if (full) h += `<div class="mfull">${max} of ${max} used. Delete one to add another.</div>`;
    h += `<input type="file" id="mfile" accept="image/*" hidden>`;
    this.shell(h);
    const R = this.shadowRoot;
    this.on("[data-del]", "click", (e) => {
      const id = e.currentTarget.getAttribute("data-del");
      const it = list.find((x) => x.id === id);
      this.b.delMedia(kind, id).then(() => {
        this.render();
        this.toast((it ? it.name : "Picture") + " deleted. Panels using it go back to their own.");
      });
    });
    const add = R.getElementById("madd");
    if (add)
      add.addEventListener("click", () => {
        const f = R.getElementById("mfile");
        f.value = "";
        f.click();
      });
    R.getElementById("mfile").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const rd = new FileReader();
      rd.onload = () => this.openCrop(kind, rd.result, file.name);
      rd.readAsDataURL(file);
    });
  }
  openCrop(kind, src, fileName) {
    const isIcon = kind === "icons";
    const cr = { shape: isIcon ? "sq" : "wide", s: 1, min: 1, x: 0, y: 0, fw: 0, fh: 0 };
    const wrap = document.createElement("div");
    wrap.className = "crop";
    wrap.innerHTML = `<div class="cbox" role="dialog" aria-modal="true"><h2>${isIcon ? "Crop your icon" : "Crop your background"}</h2><div class="tabs" id="cshp"></div><div class="cfw${isIcon ? " ic" : ""}"><div class="cfr${isIcon ? " chk" : ""}" id="cfr"><img alt="" id="cimg"></div>${isIcon ? '<div class="cpv"><div class="pv chk"><canvas id="pv1" width="192" height="192"></canvas></div><div class="pv dk"><canvas id="pv2" width="192" height="192"></canvas></div><small>Saved icon: see-through, and on the panel</small></div>' : ""}</div><div class="czm"><span>Zoom</span><input type="range" id="czm" min="1" max="4" step="0.01" value="1" aria-label="Zoom"></div>${isIcon ? '<div class="copt"><label class="ctg"><input type="checkbox" id="crm" checked> Remove background</label><div class="czm"><span>Strength</span><input type="range" id="ctol" min="15" max="150" step="1" value="60" aria-label="How much of the background to remove"></div><label class="ctg"><input type="checkbox" id="cho"> Inside gaps too <small>(the middle of a ring, letter or loop)</small></label><div class="ccol"><span>Icon colour</span><button class="tab sel" type="button" data-col="0">As it is</button><button class="tab" type="button" data-col="1">White</button></div><p class="note" id="cnote" style="margin:0"></p></div>' : ""}<input class="t" id="cnm" maxlength="24" placeholder="Name (shows under it on the panel)"><div class="cact"><button class="b" type="button" id="cno">Cancel</button><button class="b p" type="button" id="cok">Save</button></div></div>`;
    this.shadowRoot.appendChild(wrap);
    const $ = (id) => wrap.querySelector("#" + id);
    const img = $("cimg");
    const frame = $("cfr");
    $("cnm").value = String(fileName || "").replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 24);
    const size = () => {
      const [a, b] = SHAPES[cr.shape];
      const maxW = Math.min(560, wrap.clientWidth - 80);
      const maxH = Math.min(380, window.innerHeight * 0.45);
      let w = maxW;
      let h = (w * b) / a;
      if (h > maxH) {
        h = maxH;
        w = (h * a) / b;
      }
      cr.fw = Math.round(w);
      cr.fh = Math.round(h);
      frame.style.width = cr.fw + "px";
      frame.style.height = cr.fh + "px";
    };
    const draw = () => {
      const iw = img.naturalWidth * cr.s;
      const ih = img.naturalHeight * cr.s;
      cr.x = iw <= cr.fw ? (cr.fw - iw) / 2 : Math.min(0, Math.max(cr.fw - iw, cr.x));
      cr.y = ih <= cr.fh ? (cr.fh - ih) / 2 : Math.min(0, Math.max(cr.fh - ih, cr.y));
      img.style.transform = "translate(" + cr.x + "px," + cr.y + "px) scale(" + cr.s + ")";
      if (isIcon) later();
    };
    // icons: the cut-out, as it will be saved, shown live
    let ed = null, pvT = 0;
    const cut = (px, out) => {
      const c = document.createElement("canvas");
      c.width = px;
      c.height = px;
      const g = c.getContext("2d");
      g.imageSmoothingQuality = "high";
      g.drawImage(img, cr.x * (px / cr.fw), cr.y * (px / cr.fh), img.naturalWidth * cr.s * (px / cr.fw), img.naturalHeight * cr.s * (px / cr.fh));
      return iconCutout(c, { remove: $("crm").checked, tol: +$("ctol").value, holes: $("cho").checked, white: cr.white, size: out, fit: true, info: ed });
    };
    const preview = () => {
      if (!ed) return;
      const r = cut(288, 192);
      ["pv1", "pv2"].forEach((id) => {
        const g = $(id).getContext("2d");
        g.clearRect(0, 0, 192, 192);
        g.drawImage(r.canvas, 0, 0);
      });
      const nt = $("cnote");
      nt.textContent = ed.hasAlpha
        ? "This picture already has a see-through background: it's kept as it is."
        : !$("crm").checked
        ? "The background is kept. Tick Remove background to save the icon only."
        : r.info.empty
        ? "Nothing left: lower the Strength."
        : r.info.dark && !cr.white
        ? "This icon is dark, so it will be hard to see on the panel: choose White."
        : ed.plain
        ? "If bits of the icon disappear, lower the Strength. If background is left, raise it."
        : "The background isn't one plain colour, so it may not all come off. Raise the Strength, or use a picture on a plain background.";
      $("crm").disabled = ed.hasAlpha;
      $("ctol").disabled = ed.hasAlpha || !$("crm").checked;
      $("cho").disabled = ed.hasAlpha || !$("crm").checked;
    };
    const later = () => {
      clearTimeout(pvT);
      pvT = setTimeout(preview, 60);
    };
    const fit = () => {
      size();
      // icons: the whole picture fits at the start (a wide logo isn't cut off)
      cr.min = (isIcon ? Math.min : Math.max)(cr.fw / img.naturalWidth, cr.fh / img.naturalHeight);
      cr.s = cr.min;
      cr.x = (cr.fw - img.naturalWidth * cr.s) / 2;
      cr.y = (cr.fh - img.naturalHeight * cr.s) / 2;
      $("czm").value = 1;
      draw();
    };
    const zoomTo = (z, cx, cy) => {
      const ns = cr.min * z;
      cx = cx == null ? cr.fw / 2 : cx;
      cy = cy == null ? cr.fh / 2 : cy;
      cr.x = cx - ((cx - cr.x) * ns) / cr.s;
      cr.y = cy - ((cy - cr.y) * ns) / cr.s;
      cr.s = ns;
      draw();
    };
    const shapes = () => {
      const box = $("cshp");
      if (isIcon) {
        box.innerHTML = '<span class="note" style="margin:0">Square. Only the icon is kept: the background comes off, so it sits on the panel button like the built-in icons.</span>';
        return;
      }
      box.innerHTML = Object.keys(SHAPES).map((k) => `<button class="tab${k === cr.shape ? " sel" : ""}" type="button" data-shp="${k}">${SHAPES[k][2]}</button>`).join("");
      box.querySelectorAll("[data-shp]").forEach((b) =>
        b.addEventListener("click", () => {
          cr.shape = b.getAttribute("data-shp");
          shapes();
          fit();
        })
      );
    };
    $("czm").addEventListener("input", (e) => zoomTo(+e.target.value));
    if (isIcon) {
      ["crm", "ctol", "cho"].forEach((id) => $(id).addEventListener("input", later));
      wrap.querySelectorAll("[data-col]").forEach((b) =>
        b.addEventListener("click", () => {
          cr.white = b.getAttribute("data-col") === "1";
          wrap.querySelectorAll("[data-col]").forEach((x) => x.classList.toggle("sel", x === b));
          later();
        })
      );
    }
    const pts = new Map();
    let pinch = null;
    frame.addEventListener("pointerdown", (e) => {
      frame.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cr.s / cr.min };
      }
    });
    frame.addEventListener("pointermove", (e) => {
      if (!pts.has(e.pointerId)) return;
      const p = pts.get(e.pointerId);
      if (pts.size === 1) {
        cr.x += e.clientX - p.x;
        cr.y += e.clientY - p.y;
        draw();
      }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && pinch) {
        const [a, b] = [...pts.values()];
        const r = frame.getBoundingClientRect();
        const z = Math.max(1, Math.min(4, (pinch.z * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d));
        zoomTo(z, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
        $("czm").value = z;
      }
    });
    const up = (e) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
    };
    frame.addEventListener("pointerup", up);
    frame.addEventListener("pointercancel", up);
    frame.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const r = frame.getBoundingClientRect();
        const z = Math.max(1, Math.min(4, (cr.s / cr.min) * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
        zoomTo(z, e.clientX - r.left, e.clientY - r.top);
        $("czm").value = z;
      },
      { passive: false }
    );
    const close = () => wrap.remove();
    $("cno").addEventListener("click", close);
    $("cok").addEventListener("click", () => {
      const [a, b] = SHAPES[cr.shape];
      const OW = isIcon ? 256 : a >= b ? 1600 : 1000;
      const OH = Math.round((OW * b) / a);
      let c;
      if (isIcon) {
        c = cut(768, OW).canvas; // cut out at 3× and scaled down: clean edges
      } else {
        c = document.createElement("canvas");
        c.width = OW;
        c.height = OH;
        const g = c.getContext("2d");
        g.imageSmoothingQuality = "high";
        g.drawImage(img, -cr.x / cr.s, -cr.y / cr.s, cr.fw / cr.s, cr.fh / cr.s, 0, 0, OW, OH);
      }
      const data = c.toDataURL(isIcon ? "image/png" : "image/jpeg", 0.86);
      const name = $("cnm").value.trim();
      $("cok").disabled = true;
      $("cok").textContent = "Saving…";
      this.b.addMedia(kind, name, data).then((ok) => {
        close();
        this.render();
        if (ok) this.toast((name || (isIcon ? "Icon" : "Background")) + " saved. It's on every panel to pick now.");
      });
    });
    img.onload = () => {
      if (isIcon) {
        ed = pictureEdge(img);
        if (ed.hasAlpha) $("crm").checked = false;
      }
      shapes();
      fit();
    };
    img.src = src;
  }
}

// ---- icon cut-out: takes the plain background off an uploaded icon -----------
// The background colour is read from the picture's edge. Only background that is
// joined to the edge is removed (a white mark inside the icon stays), unless
// "inside gaps too" is on. Edges get soft alpha and their colour is un-mixed from
// the background, so no white halo shows on the dark panel. Then the icon is
// trimmed and centred in the square.
function pictureEdge(img) {
  const k = Math.min(1, 400 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * k));
  c.height = Math.max(1, Math.round(img.naturalHeight * k));
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  const r = iconCutout(c, { remove: false, tol: 60, size: 8, fit: false });
  return { hasAlpha: r.info.hasAlpha, plain: r.info.plain, bg: r.info.bg };
}
function iconCutout(src, opt) {
  const W = src.width, H = src.height;
  const g0 = src.getContext("2d", { willReadFrequently: true });
  const im = g0.getImageData(0, 0, W, H);
  const d = im.data, n = W * H;
  // edge pixels: already transparent? plain background?
  const edge = [];
  for (let x = 0; x < W; x++) edge.push(x, (H - 1) * W + x);
  for (let y = 1; y < H - 1; y++) edge.push(y * W, y * W + W - 1);
  let clear = 0;
  for (const i of edge) if (d[i * 4 + 3] < 200) clear++;
  const hasAlpha = opt.info ? opt.info.hasAlpha : clear > edge.length * 0.3;
  const ch = [[], [], []];
  for (const i of edge) if (d[i * 4 + 3] >= 200) for (let c = 0; c < 3; c++) ch[c].push(d[i * 4 + c]);
  const med = (a) => { if (!a.length) return 255; a.sort((x, y) => x - y); return a[a.length >> 1]; };
  const bg = opt.info ? opt.info.bg : [med(ch[0]), med(ch[1]), med(ch[2])];
  const dist = (i) => { const r = d[i * 4] - bg[0], gg = d[i * 4 + 1] - bg[1], b = d[i * 4 + 2] - bg[2]; return Math.sqrt(r * r + gg * gg + b * b); };
  let near = 0, opq = 0;
  for (const i of edge) if (d[i * 4 + 3] >= 200) { opq++; if (dist(i) < 40) near++; }
  const plain = opq > 0 && near / opq > 0.6;
  const info = opt.info ? Object.assign({}, opt.info) : { hasAlpha, plain, bg };
  const A = new Float32Array(n); // 0..1 alpha from the colour
  for (let i = 0; i < n; i++) A[i] = d[i * 4 + 3] / 255;
  if (opt.remove && !hasAlpha) {
    const hi = opt.tol, lo = opt.tol * 0.45;
    const D = new Float32Array(n);
    for (let i = 0; i < n; i++) D[i] = d[i * 4 + 3] < 128 ? 0 : dist(i); // empty room around a zoomed-out picture is background
    const inBg = new Uint8Array(n);
    if (opt.holes) {
      for (let i = 0; i < n; i++) if (D[i] < hi) inBg[i] = 1;
    } else {
      const q = new Int32Array(n);
      let qh = 0, qt = 0;
      for (const i of edge) if (!inBg[i] && D[i] < hi) { inBg[i] = 1; q[qt++] = i; }
      while (qh < qt) {
        const i = q[qh++], x = i % W, y = (i / W) | 0;
        // spread only through clear background: soft edge pixels are taken but
        // don't carry on, so a thin outline can't leak into the icon
        if (D[i] >= lo) continue;
        const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
        for (const j of nb) if (j >= 0 && !inBg[j] && D[j] < hi) { inBg[j] = 1; q[qt++] = j; }
      }
    }
    // the cut edge: background pixels that aren't clear, and icon pixels up to
    // 2 px from the background (the blend between icon and background)
    const near = inBg.slice();
    for (let k = 0; k < 2; k++) {
      const nx = near.slice();
      for (let i = 0; i < n; i++) {
        if (near[i]) continue;
        const x = i % W, y = (i / W) | 0;
        if ((x > 0 && near[i - 1]) || (x < W - 1 && near[i + 1]) || (y > 0 && near[i - W]) || (y < H - 1 && near[i + W])) nx[i] = 1;
      }
      near.set(nx);
    }
    const floor = lo * 0.5; // JPEG noise in the background
    for (let i = 0; i < n; i++) {
      if (inBg[i] && D[i] < lo) { A[i] = 0; continue; }
      if (!near[i]) continue;
      // how far this pixel is from the background, against the icon colour next to it
      const x = i % W, y = (i / W) | 0;
      let fg = 0;
      for (let dy = -3; dy <= 3; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= H) continue;
        for (let dx = -3; dx <= 3; dx++) {
          const xx = x + dx; if (xx < 0 || xx >= W) continue;
          const j = yy * W + xx;
          if (!inBg[j] && D[j] > fg) fg = D[j];
        }
      }
      if (fg <= hi) fg = Math.max(fg, D[i]); // no solid icon colour close by
      if (fg <= floor) continue;
      const a = Math.max(0, Math.min(1, (D[i] - floor) / (fg - floor)));
      A[i] = Math.min(A[i], a);
      if (a > 0 && a < 1) {
        // un-mix the background from the edge colour (no white fringe)
        for (let c = 0; c < 3; c++) d[i * 4 + c] = Math.max(0, Math.min(255, Math.round((d[i * 4 + c] - (1 - a) * bg[c]) / a)));
      }
    }
    // smooth the cut edge a touch (1-2-1), never adding alpha the colour didn't have
    const B = new Float32Array(n);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let s = 0, w = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy; if (yy < 0 || yy >= H) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx; if (xx < 0 || xx >= W) continue;
            const k = (dx ? 1 : 2) * (dy ? 1 : 2); s += A[yy * W + xx] * k; w += k;
          }
        }
        B[y * W + x] = Math.min(A[y * W + x], (A[y * W + x] + s / w) / 2);
      }
    for (let i = 0; i < n; i++) A[i] = B[i];
  }
  let lum = 0, cnt = 0;
  for (let i = 0; i < n; i++) {
    d[i * 4 + 3] = Math.round(A[i] * 255);
    if (A[i] > 0.9) { lum += 0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]; cnt++; }
    if (opt.white && A[i] > 0) { d[i * 4] = 255; d[i * 4 + 1] = 255; d[i * 4 + 2] = 255; }
  }
  info.dark = cnt > 0 && lum / cnt < 80; // hard to see on the dark panel
  const tmp = document.createElement("canvas");
  tmp.width = W; tmp.height = H;
  tmp.getContext("2d").putImageData(im, 0, 0);
  // trim to the icon and centre it with a little room around
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const out = document.createElement("canvas");
  out.width = opt.size; out.height = opt.size;
  const g = out.getContext("2d");
  g.imageSmoothingQuality = "high";
  if (x1 < 0) { info.empty = true; return { canvas: out, info }; }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, room = opt.size * (opt.fit ? 0.84 : 1);
  const sc = opt.fit ? room / Math.max(bw, bh) : opt.size / W;
  if (opt.fit) g.drawImage(tmp, x0, y0, bw, bh, (opt.size - bw * sc) / 2, (opt.size - bh * sc) / 2, bw * sc, bh * sc);
  else g.drawImage(tmp, 0, 0, W, H, 0, 0, opt.size, opt.size);
  return { canvas: out, info };
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
    await this.loadMedia().catch(() => {});
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
  // uploaded icons / backgrounds (their own commands; the scenes are not involved)
  async loadMedia() {
    this.m = await this.ws("media");
  }
  media() {
    return this.m || { max: 10, icons: [], backgrounds: [] };
  }
  addMedia(kind, name, data) {
    return this.ws("media_add", { kind: kind, name: name, data: data })
      .then((m) => ((this.m = m), true))
      .catch((e) => (this.errs.forEach((f) => f((e && e.message) || "Home Assistant didn't accept that picture")), false));
  }
  delMedia(kind, id) {
    return this.ws("media_delete", { kind: kind, item_id: id })
      .then((m) => (this.m = m))
      .catch((e) => this.errs.forEach((f) => f((e && e.message) || "Couldn't delete that picture")));
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
