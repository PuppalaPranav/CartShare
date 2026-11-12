const THRESHOLD = 75;
const $ = id => document.getElementById(id);
const money = n => "$" + n.toFixed(2);
let user = null, room = null;

const key = c => "cartshare:room:" + c;
const emptyRoom = () => ({ items: [], log: [] });
function load() {
  try { return JSON.parse(localStorage.getItem(key(room))) || emptyRoom(); }
  catch { return emptyRoom(); }
}
function save(d) { localStorage.setItem(key(room), JSON.stringify(d)); render(); }
function addLog(d, msg) {
  d.log.unshift({ t: Date.now(), msg: `${user}: ${msg}` });
  d.log = d.log.slice(0, 50);
}
function el(tag, text, cls) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text; // textContent avoids HTML injection
  if (cls) e.className = cls;
  return e;
}

function join(name, code) {
  user = name.trim(); room = code.trim().toUpperCase();
  sessionStorage.setItem("cartshare:session", JSON.stringify({ user, room })); // per-tab "login"
  const d = load();
  addLog(d, "joined the room");
  localStorage.setItem(key(room), JSON.stringify(d));
  $("loginView").classList.add("d-none");
  $("roomView").classList.remove("d-none");
  $("roomBadge").classList.remove("d-none");
  $("roomBadge").textContent = `${user} · Room ${room}`;
  render();
}
function leave() {
  sessionStorage.removeItem("cartshare:session");
  location.reload();
}

function render() {
  if (!room) return;
  const d = load();
  const body = $("cartBody"); body.replaceChildren();
  let total = 0; const per = {};
  d.items.forEach(it => {
    const line = it.price * it.qty; total += line;
    per[it.by] = (per[it.by] || 0) + line;
    const tr = el("tr");
    tr.append(el("td", it.name), el("td", it.by), el("td", it.qty, "text-end"), el("td", money(line), "text-end"));
    const td = el("td", "", "text-end");
    const btn = el("button", "✕", "btn btn-sm btn-outline-danger");
    btn.setAttribute("aria-label", "Remove " + it.name);
    btn.onclick = () => removeItem(it.id);
    td.append(btn); tr.append(td); body.append(tr);
  });
  if (!d.items.length) {
    const tr = el("tr"); const td = el("td", "Cart is empty. Add the first item!", "text-muted text-center py-4");
    td.colSpan = 5; tr.append(td); body.append(tr);
  }
  $("total").textContent = money(total);
  const pct = Math.min(100, (total / THRESHOLD) * 100);
  $("bar").style.width = pct + "%";
  $("bar").className = "progress-bar " + (total >= THRESHOLD ? "bg-success" : "bg-warning");
  $("thresholdMsg").textContent = total >= THRESHOLD
    ? "🎉 Free delivery unlocked!"
    : `Add ${money(THRESHOLD - total)} more to reach free delivery (${money(THRESHOLD)}).`;

  const sp = $("splits"); sp.replaceChildren();
  Object.entries(per).forEach(([n, v]) => {
    const li = el("li", "", "d-flex justify-content-between");
    li.append(el("span", n), el("span", money(v)));
    sp.append(li);
  });
  const lg = $("log"); lg.replaceChildren();
  d.log.forEach(l => lg.append(el("li", `${new Date(l.t).toLocaleTimeString()} – ${l.msg}`)));
}

function removeItem(id) {
  const d = load(); const it = d.items.find(i => i.id === id);
  if (!it) return;
  d.items = d.items.filter(i => i.id !== id);
  addLog(d, `removed ${it.name}`); save(d);
}

function buildReceipt() {
  const d = load(); const r = $("receipt"); r.replaceChildren();
  r.append(el("h2", "CartShare Receipt"),
    el("p", `Room: ${room} | Printed: ${new Date().toLocaleString()} | By: ${user}`));
  const t = el("table"); const h = el("tr");
  ["Item", "Added by", "Qty", "Price", "Total"].forEach((x, i) => h.append(el("th", x, i > 1 ? "r" : "")));
  t.append(h);
  let total = 0; const per = {};
  d.items.forEach(it => {
    const line = it.price * it.qty; total += line; per[it.by] = (per[it.by] || 0) + line;
    const tr = el("tr");
    tr.append(el("td", it.name), el("td", it.by), el("td", it.qty, "r"), el("td", money(it.price), "r"), el("td", money(line), "r"));
    t.append(tr);
  });
  r.append(t, el("h3", "Grand total: " + money(total)), el("h4", "Split by person"));
  Object.entries(per).forEach(([n, v]) => r.append(el("div", `${n}: ${money(v)}`)));
  r.append(el("h4", "Activity"));
  d.log.slice().reverse().forEach(l => r.append(el("div", `${new Date(l.t).toLocaleString()} – ${l.msg}`)));
}

$("joinForm").onsubmit = e => { e.preventDefault(); join($("userName").value, $("roomCode").value); };
$("genBtn").onclick = () => { $("roomCode").value = Math.random().toString(36).slice(2, 8).toUpperCase(); };
$("itemForm").onsubmit = e => {
  e.preventDefault();
  const d = load();
  const it = { id: Date.now() + Math.random(), name: $("itemName").value.trim(),
    price: parseFloat($("itemPrice").value), qty: parseInt($("itemQty").value, 10), by: user };
  if (!it.name || isNaN(it.price) || it.qty < 1) return;
  d.items.push(it); addLog(d, `added ${it.qty} × ${it.name}`); save(d);
  e.target.reset(); $("itemQty").value = 1; $("itemName").focus();
};
$("printBtn").onclick = () => { buildReceipt(); window.print(); };
$("leaveBtn").onclick = leave;
// Collaboration: fires in OTHER tabs when this room's data changes
window.addEventListener("storage", e => { if (room && e.key === key(room)) render(); });

const s = sessionStorage.getItem("cartshare:session");
if (s) { try { const o = JSON.parse(s); join(o.user, o.room); } catch {} }
