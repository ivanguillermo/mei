/* =====================================================================
   Mei Rivero App - núcleo
   Las apps (Rutinas, Medidas...) viven en js/*.js y se registran con
   registerApp({...}). Aquí va: login, carga de datos, navegación,
   Home, Apps y Perfil.
   ===================================================================== */
const CONFIG = {
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbyHdC1H_gJrxSTOF-6c1uyQCBqWg3ooljmRlgy0IOdsstzkzgVuUicaMDuGMino8Pe0Hw/exec",
  GOOGLE_CLIENT_ID: "710379501227-s89g8b7p7vhjlvir8ksf6890qapq2rt6.apps.googleusercontent.com"
};

/* ---------- Utilidades compartidas ---------- */
const norm = s => String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = id => document.getElementById(id);

/** Busca un campo ignorando mayúsculas y tildes: field(row, "Fecha de Medicion", "Fecha") */
function field(obj, ...names) {
  if (!obj) return "";
  const keys = Object.keys(obj);
  for (const n of names) {
    const k = keys.find(k => norm(k) === norm(n));
    if (k !== undefined && obj[k] !== "" && obj[k] !== null && obj[k] !== undefined) return obj[k];
  }
  return "";
}

function parseDate(v) {
  if (!v) return null;
  let m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  const d = new Date(v);
  return isNaN(d) ? null : d;
}
function fmtDate(v) {
  const d = parseDate(v);
  return d ? d.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" }) : (v || "-");
}
function driveId(url) {
  const m = String(url || "").match(/\/d\/([\w-]{15,})|[?&]id=([\w-]{15,})/);
  return m ? (m[1] || m[2]) : null;
}
function imgUrl(url) {
  const id = driveId(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w600` : (url || "");
}

/* ---------- Registro de apps ---------- */
const APPS = [];
function registerApp(def) { APPS.push(def); APPS.sort((a, b) => (a.order || 99) - (b.order || 99)); }

/* ---------- Estado ---------- */
const state = { token: null, googlePhoto: "", data: null };

/* ---------- Login con Google ---------- */
function parseJwt(token) {
  const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(decodeURIComponent(atob(b64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")));
}
function whenGoogle(cb) { window.google?.accounts?.id ? cb() : setTimeout(() => whenGoogle(cb), 100); }

function showLogin(msg) {
  localStorage.removeItem("mei_token");
  $("app-main").classList.add("hidden");
  $("app-nav").classList.add("hidden");
  $("login-screen").classList.remove("hidden");
  const e = $("login-error");
  e.textContent = msg || "";
  e.classList.toggle("hidden", !msg);
  whenGoogle(() => {
    google.accounts.id.initialize({ client_id: CONFIG.GOOGLE_CLIENT_ID, callback: r => startSession(r.credential) });
    $("g-signin").innerHTML = "";
    google.accounts.id.renderButton($("g-signin"), { theme: "outline", size: "large", shape: "rectangular", text: "signin_with", logo_alignment: "left" });
  });
}

async function startSession(token) {
  let payload;
  try { payload = parseJwt(token); } catch { return showLogin("No se pudo leer la sesión. Intenta de nuevo."); }
  state.token = token;
  state.googlePhoto = payload.picture || "";
  localStorage.setItem("mei_token", token);
  $("login-screen").classList.add("hidden");
  $("loading").classList.remove("hidden");
  try {
    const res = await fetch(`${CONFIG.WEB_APP_URL}?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!data.ok) {
      if (data.error === "auth") return showLogin("Tu sesión venció. Inicia sesión otra vez.");
      if (data.error === "no_client") return showLogin(`No hay un registro para ${data.email}. Pídele a Mei que te agregue con ese correo.`);
      return showLogin("Error al leer los datos: " + data.error);
    }
    state.data = data;
    renderAll();
    $("app-main").classList.remove("hidden");
    $("app-nav").classList.remove("hidden");
    switchTab("home");
  } catch (err) {
    console.error(err);
    showLogin("No hay conexión con la base de datos. Revisa tu internet e intenta de nuevo.");
  } finally {
    $("loading").classList.add("hidden");
  }
}

function restoreSession() {
  const t = localStorage.getItem("mei_token");
  if (t) {
    try {
      if (parseJwt(t).exp * 1000 > Date.now() + 60000) return startSession(t);
    } catch {}
  }
  showLogin();
}

/* ---------- Navegación ---------- */
function switchTab(tab) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  $("view-" + tab).classList.remove("hidden");
  $("view-" + tab).scrollTop = 0;
  document.querySelectorAll("#app-nav button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
}

/* ---------- Hoja de cada app ---------- */
function openApp(id) {
  const app = APPS.find(a => a.id === id);
  if (!app) return;
  $("sheet-title").textContent = app.title;
  const body = $("sheet-body");
  body.innerHTML = "";
  body.removeAttribute("style");
  $("sheet").classList.remove("hidden");
  app.render(body, { data: state.data, client: state.data.client, config: state.data.config });
}
function closeApp() { $("sheet").classList.add("hidden"); $("sheet-body").innerHTML = ""; }

/** Ventana flotante simple (la usa Rutinas para el video) */
function showOverlay(html) {
  const o = document.createElement("div");
  o.className = "overlay";
  o.innerHTML = `<div class="box">${html}<button class="btn-ghost" data-close>Cerrar</button></div>`;
  o.addEventListener("click", e => { if (e.target === o || e.target.hasAttribute("data-close")) o.remove(); });
  $("app").appendChild(o);
  return o;
}

/* ---------- Render ---------- */
const ICONS = {
  instagram: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.200" cy="6.800" r=".6" fill="currentColor"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24"><path d="M3 21l1.700-5A8.500 8.500 0 1 1 8 19.300L3 21z"/><path d="M9 8.500c0 3.500 2.500 6.500 6.500 6.500l1-1.500-2.200-1-.8.800c-1-.4-1.800-1.300-2.200-2.200l.8-.8-1-2.200L9 8.500z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24"><path d="M14 3v11.500a3.500 3.500 0 1 1-3.500-3.500"/><path d="M14 3c.4 2.600 2 4.200 4.500 4.400"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1"/><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/></svg>'
};

function initials(c) {
  const t = (String(field(c, "Nombres")).charAt(0) + String(field(c, "Apellidos")).charAt(0)).toUpperCase() || "MR";
  return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#3f9488"/><text x="60" y="76" font-family="Arial" font-size="46" font-weight="700" fill="#fff" text-anchor="middle">${t}</text></svg>`);
}
function setPhoto(img, client) {
  const own = imgUrl(field(client, "fdp", "Foto", "Foto de perfil"));
  const fallbacks = [state.googlePhoto, initials(client)].filter(Boolean);
  const queue = own ? [own, ...fallbacks] : fallbacks;
  let i = 0;
  img.referrerPolicy = "no-referrer";
  img.onerror = () => { i++; if (i < queue.length) img.src = queue[i]; };
  img.src = queue[0];
}

function calcAge(c) {
  const b = parseDate(field(c, "Fecha de Nacimiento"));
  if (!b) return field(c, "Edad");
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t < new Date(t.getFullYear(), b.getMonth(), b.getDate())) a--;
  return a;
}

function renderAll() {
  const { client, config, articles } = state.data;
  const first = String(field(client, "Nombres")).split(" ")[0] || "";
  const fullName = `${field(client, "Nombres")} ${field(client, "Apellidos")}`.trim();
  const age = calcAge(client);

  // Home
  $("home-greeting").textContent = first ? `Hola, ${first}` : "Hola";
  $("home-intro").textContent = config["intro"] || "";

  // Apps: tarjeta de identidad
  setPhoto($("apps-photo"), client);
  $("apps-name").textContent = fullName;
  $("apps-tel").textContent = field(client, "Telefono") || "-";
  $("apps-age").textContent = age ? `${age} años` : "-";

  // Apps: botones (columna "Apps" del sheet Clientes; vacía = todas)
  const allowed = String(field(client, "Apps")).split(/[,;]/).map(norm).filter(Boolean);
  const visible = APPS.filter(a => !allowed.length || allowed.includes(norm(a.title)) || allowed.includes(a.id));
  $("apps-grid").innerHTML = visible.length
    ? visible.map(a => `<button class="app-btn" data-app="${a.id}">${a.icon}<span>${esc(a.title)}</span></button>`).join("")
    : '<p class="empty">Aún no tienes apps asignadas.</p>';

  // Artículos
  $("articles").innerHTML = (articles || []).map(a => `
    <a class="article" href="${esc(field(a, "Link"))}" target="_blank" rel="noopener">
      <img src="${esc(imgUrl(field(a, "Foto")))}" alt="" loading="lazy" referrerpolicy="no-referrer">
      <span>${esc(field(a, "Articulo"))}</span>
    </a>`).join("") || '<p class="empty" style="grid-column:1/-1">Pronto habrá artículos nuevos.</p>';

  // Redes
  const socials = [["instagram", "Instagram"], ["whatsapp", "WhatsApp"], ["tiktok", "TikTok"]];
  $("socials").innerHTML = socials.map(([key, label]) => {
    let url = String(config[key] || "").trim();
    if (!url) return "";
    if (key === "whatsapp" && !/^https?:/i.test(url)) url = "https://wa.me/" + url.replace(/\D/g, "");
    return `<a class="social" href="${esc(url)}" target="_blank" rel="noopener">${ICONS[key]}<span>${label}</span></a>`;
  }).join("");

  // Perfil
  setPhoto($("profile-photo"), client);
  $("profile-name").textContent = fullName;
  const row = (l, v) => `<div class="row"><span>${l}</span><span>${v}</span></div>`;
  const altura = field(client, "Altura (en cm)", "Altura");
  $("profile-data").innerHTML = [
    row("Teléfono", esc(field(client, "Telefono") || "-")),
    row("Correo", esc(field(client, "Correo Electronico", "Correo") || "-")),
    row("Nacimiento", fmtDate(field(client, "Fecha de Nacimiento"))),
    row("Edad", age ? `${age} años` : "-"),
    row("Altura", altura ? `${esc(altura)} cm` : "-")
  ].join("");

  const pago = parseDate(field(client, "Proximo Pago"));
  let rest = '<span class="chip">-</span>';
  if (pago) {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const d = Math.round((pago - t) / 86400000);
    const cls = d < 0 ? "danger" : d <= 3 ? "warn" : "";
    const txt = d < 0 ? `Vencido hace ${-d} ${-d === 1 ? "día" : "días"}` : d === 0 ? "Vence hoy" : `${d} ${d === 1 ? "día" : "días"}`;
    rest = `<span class="chip ${cls}">${txt}</span>`;
  }
  $("profile-plan").innerHTML = [
    row("Horario", esc(field(client, "Horario de Preferencia") || "-")),
    row("Días", esc(field(client, "Dias") || "-")),
    row("Próxima valoración", fmtDate(field(client, "Proxima Valoracion"))),
    row("Fecha de pago", fmtDate(field(client, "Proximo Pago"))),
    row("Días restantes", rest)
  ].join("");

  const cond = field(client, "Condiciones");
  const cEl = $("profile-conditions");
  cEl.textContent = cond || "Sin condiciones registradas.";
  cEl.classList.toggle("none", !cond);
}

/* ---------- Eventos ---------- */
document.querySelectorAll("#app-nav button").forEach(b => b.addEventListener("click", () => switchTab(b.dataset.tab)));
$("apps-grid").addEventListener("click", e => { const b = e.target.closest("[data-app]"); if (b) openApp(b.dataset.app); });
$("sheet-close").addEventListener("click", closeApp);
$("sheet").addEventListener("click", e => { if (e.target === $("sheet")) closeApp(); });
$("btn-logout").addEventListener("click", () => { window.google?.accounts?.id?.disableAutoSelect(); showLogin(); });

restoreSession();


