/* App: Medidas - ver por fecha de medición o por parte del cuerpo */
(function () {
  const CHEV = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';

  // keys: nombres posibles de la columna en el sheet (el primero que exista)
  const GROUPS = [
    { title: "Peso y biometría", unit: "", parts: [
      { label: "Peso corporal", keys: ["Peso"], unit: "kg" },
      { label: "% Grasa corporal", keys: ["Grasa Corporal"], unit: "%" },
      { label: "% Masa muscular", keys: ["Masa Corporal"], unit: "%" } ] },
    { title: "Pliegues cutáneos", parts: [
      { label: "Tríceps", keys: ["Tricep"], unit: "mm" },
      { label: "Subescapular", keys: ["Subescapular"], unit: "mm" },
      { label: "Suprailiaco", keys: ["Suprailiaco"], unit: "mm" },
      { label: "Abdominal", keys: ["Abdominal"], unit: "mm" },
      { label: "Muslo", keys: ["Muslo"], unit: "mm" },
      { label: "Pierna", keys: ["Pierna"], unit: "mm" } ] },
    { title: "Circunferencias", parts: [
      { label: "Cuello", keys: ["Cuello"], unit: "cm" },
      { label: "Cintura (ombligo)", keys: ["Cintura"], unit: "cm" },
      { label: "Abdomen (ombligo)", keys: ["Abdomen"], unit: "cm" },
      { label: "Cadera", keys: ["Cadera"], unit: "cm" },
      { label: "Índice cintura-cadera", keys: ["ICC"], unit: "" },
      { label: "Antebrazo derecho", keys: ["Antebrazo Der"], unit: "cm" },
      { label: "Antebrazo izquierdo", keys: ["Antebrazo Izq"], unit: "cm" },
      { label: "Brazo relajado der.", keys: ["Brazo Der"], unit: "cm" },
      { label: "Brazo relajado izq.", keys: ["Brazo Izq"], unit: "cm" },
      { label: "Brazo contraído der.", keys: ["Brazo Der Contr"], unit: "cm" },
      { label: "Brazo contraído izq.", keys: ["Brazo Izq Contr"], unit: "cm" },
      { label: "Pecho / tórax", keys: ["Pecho"], unit: "cm" },
      { label: "Muslo superior der.", keys: ["Muslo Sup Der"], unit: "cm" },
      { label: "Muslo superior izq.", keys: ["Muslo Sup Izq"], unit: "cm" },
      { label: "Muslo medio der.", keys: ["Muslo Med Der"], unit: "cm" },
      { label: "Muslo medio izq.", keys: ["Muslo Med Izq"], unit: "cm" },
      { label: "Pantorrilla derecha", keys: ["Pantorrila Der", "Pantorrilla Der"], unit: "cm" },
      { label: "Pantorrilla izquierda", keys: ["Pantorrilla Izq", "Pantorrila Izq"], unit: "cm" } ] }
  ];
  const ALL = GROUPS.flatMap(g => g.parts);

  const dateOf = r => String(field(r, "Fecha de Medicion", "Fecha Medicion", "Fecha", "Marca temporal")).slice(0, 10);
  const valOf = (r, p) => field(r, ...p.keys);
  const unitStr = p => (p.unit ? " " + p.unit : "");

  registerApp({
    id: "medidas", title: "Medidas", order: 3,
    icon: '<svg viewBox="0 0 24 24"><rect x="2" y="8" width="20" height="8" rx="1.500"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4"/></svg>',
    render(box, ctx) {
      const rows = (ctx.data.measurements || []).slice().sort((a, b) => dateOf(a).localeCompare(dateOf(b)));
      if (!rows.length) { box.innerHTML = '<p class="empty">Todavía no tienes valoraciones registradas.</p>'; return; }

      const dates = rows.map(dateOf);
      let mode = "fecha", selDate = dates[dates.length - 1], selPart = ALL[0].label;

      function draw() {
        let h = `<div class="seg"><button data-m="fecha" class="${mode === "fecha" ? "on" : ""}">Por fecha</button><button data-m="parte" class="${mode === "parte" ? "on" : ""}">Por medida</button></div>`;

        if (mode === "fecha") {
          h += `<select class="field" id="sel">${dates.slice().reverse().map(d => `<option value="${d}" ${d === selDate ? "selected" : ""}>${fmtDate(d)}</option>`).join("")}</select>`;
          const r = rows[dates.indexOf(selDate)];
          GROUPS.forEach((g, gi) => {
            const items = g.parts.map(p => [p, valOf(r, p)]).filter(([, v]) => v !== "");
            if (!items.length) return;
            h += `<details class="group" ${gi === 0 ? "open" : ""}><summary>${g.title}${CHEV}</summary><div class="rows">` +
              items.map(([p, v]) => `<div class="row"><span>${p.label}</span><span class="val">${esc(v)}${unitStr(p)}</span></div>`).join("") +
              `</div></details>`;
          });
        } else {
          h += `<select class="field" id="sel">${GROUPS.map(g => `<optgroup label="${g.title}">${g.parts.map(p => `<option value="${p.label}" ${p.label === selPart ? "selected" : ""}>${p.label}</option>`).join("")}</optgroup>`).join("")}</select>`;
          const p = ALL.find(x => x.label === selPart);
          const hist = rows.map(r => ({ d: dateOf(r), v: valOf(r, p) })).filter(x => x.v !== "");
          if (!hist.length) h += '<p class="empty">No hay registros de esta medida.</p>';
          else h += `<div class="card info-list">` + hist.map((x, i) => {
            const prev = hist[i - 1] ? Number(hist[i - 1].v) : NaN, cur = Number(x.v);
            let delta = "";
            if (!isNaN(prev) && !isNaN(cur)) {
              const diff = Math.round((cur - prev) * 100) / 100;
              delta = `<span class="delta ${diff > 0 ? "up" : diff < 0 ? "down" : "eq"}">${diff > 0 ? "▲ +" : diff < 0 ? "▼ " : "= "}${diff === 0 ? "" : diff}</span>`;
            }
            return `<div class="row"><span>${fmtDate(x.d)}</span><span><span class="val">${esc(x.v)}${unitStr(p)}</span>${delta}</span></div>`;
          }).reverse().join("") + `</div>`;
        }
        box.innerHTML = h;
        box.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
        box.querySelector("#sel").onchange = e => { mode === "fecha" ? selDate = e.target.value : selPart = e.target.value; draw(); };
      }
      draw();
    }
  });
})();
