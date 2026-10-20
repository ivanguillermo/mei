/* App: Atletas - muestra el PDF del cliente (columna "PDF" de la hoja Clientes).
   El archivo de Drive debe estar compartido como "Cualquiera con el enlace". */
registerApp({
  id: "atletas", title: "Atletas", order: 4,
  icon: '<svg viewBox="0 0 24 24"><circle cx="14" cy="4.500" r="1.800"/><path d="M8 21l3-6 3 2v4M11 15l-1-5 4-2 3 3h3M9 10l-3 2"/></svg>',
  render(box, ctx) {
    const url = String(field(ctx.client, "PDF")).trim();
    if (!url) { box.innerHTML = '<p class="empty">Mei aún no ha cargado tu PDF.</p>'; return; }
    const id = driveId(url);
    const src = id ? `https://drive.google.com/file/d/${id}/preview` : url;
    box.style.display = "flex"; box.style.flexDirection = "column";
    box.innerHTML = `<iframe class="pdf-frame" src="${esc(src)}"></iframe><a class="btn-main" href="${esc(url)}" target="_blank" rel="noopener">Abrir PDF</a>`;
  }
});
