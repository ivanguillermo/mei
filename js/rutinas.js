/* App: Rutinas - un día por pestaña, un ejercicio por tarjeta.
   Hoja "Rutinas": Correo | Dia | Orden | Ejercicio | Series | Repeticiones | Peso | Descanso | Notas | Video */
(function () {
  const DAYS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  const JS_DAY = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const label = d => d.charAt(0).toUpperCase() + d.slice(1).replace("miercoles", "miércoles").replace("sabado", "sábado");

  function youtubeEmbed(url) {
    const m = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}?rel=0` : null;
  }

  registerApp({
    id: "rutinas", title: "Rutinas", order: 1,
    icon: '<svg viewBox="0 0 24 24"><path d="M6.500 6.500v11M17.500 6.500v11M3.500 9v6M20.500 9v6M6.500 12h11"/></svg>',
    render(box, ctx) {
      const rows = ctx.data.routines || [];
      const byDay = {};
      rows.forEach(r => { const d = norm(field(r, "Dia", "Día")); if (d) (byDay[d] = byDay[d] || []).push(r); });
      const days = DAYS.filter(d => byDay[d]);
      if (!days.length) { box.innerHTML = '<p class="empty">Mei aún no ha cargado tu rutina.</p>'; return; }

      let sel = days.includes(JS_DAY[new Date().getDay()]) ? JS_DAY[new Date().getDay()] : days[0];

      function draw() {
        const list = byDay[sel].slice().sort((a, b) => (Number(field(a, "Orden")) || 999) - (Number(field(b, "Orden")) || 999));
        box.innerHTML = `<div class="days">${days.map(d => `<button data-d="${d}" class="${d === sel ? "on" : ""}">${label(d)}</button>`).join("")}</div>` +
          list.map((r, i) => {
            const s = field(r, "Series"), reps = field(r, "Repeticiones", "Reps"), kg = field(r, "Peso"), rest = field(r, "Descanso"), note = field(r, "Notas"), vid = field(r, "Video");
            const tags = [
              s !== "" && `<span class="tag">${esc(s)} ${Number(s) === 1 ? "serie" : "series"}</span>`,
              reps !== "" && `<span class="tag">${esc(reps)} reps</span>`,
              kg !== "" && `<span class="tag soft">${esc(kg)} kg</span>`,
              rest !== "" && `<span class="tag soft">Descanso ${esc(rest)}</span>`
            ].filter(Boolean).join("");
            return `<div class="exercise"><h4>${esc(field(r, "Ejercicio"))}</h4><div class="tags">${tags}</div>` +
              (note ? `<p class="note">${esc(note)}</p>` : "") +
              (vid ? `<button class="btn-video" data-v="${i}">Ver ejemplo</button>` : "") + `</div>`;
          }).join("");
        box.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { sel = b.dataset.d; draw(); });
        box.querySelectorAll("[data-v]").forEach(b => b.onclick = () => {
          const r = list[+b.dataset.v], url = field(r, "Video"), emb = youtubeEmbed(url);
          showOverlay(`<h4>${esc(field(r, "Ejercicio"))}</h4>` + (emb
            ? `<iframe src="${emb}" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
            : `<a class="btn-main" href="${esc(url)}" target="_blank" rel="noopener">Abrir video</a>`));
        });
      }
      draw();
    }
  });
})();
