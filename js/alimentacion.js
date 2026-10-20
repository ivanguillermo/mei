/* App: Alimentación - pendiente de definir la hoja. Por ahora solo aviso. */
registerApp({
  id: "alimentacion", title: "Alimentación", order: 2,
  icon: '<svg viewBox="0 0 24 24"><path d="M4 12h16a8 8 0 0 1-16 0z"/><path d="M12 12V6c3 0 5 2 5 5"/></svg>',
  render(box) {
    box.innerHTML = `<div class="soon"><svg viewBox="0 0 24 24"><path d="M4 12h16a8 8 0 0 1-16 0z"/><path d="M12 12V6c3 0 5 2 5 5"/></svg><h3>Muy pronto</h3><p>Aquí verás tu plan de comidas de cada día.</p></div>`;
  }
});
