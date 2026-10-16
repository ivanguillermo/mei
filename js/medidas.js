/**
 * Módulo Medidas - Estilo Bbm / KeepAPP
 */
window.initMedidasModule = function(measurements) {
  const container = document.getElementById('view-profile'); // O el contenedor donde desees renderizarlo
  if (!container || !measurements || measurements.length === 0) {
    console.warn("No hay datos de medidas disponibles.");
    return;
  }

  // Ordenar mediciones por fecha (ascendente)
  measurements.sort((a, b) => new Date(a["Fecha Medicion"] || a["Fecha"] || 0) - new Date(b["Fecha Medicion"] || b["Fecha"] || 0));

  let modoFiltro = 'fecha'; // 'fecha' o 'parte'
  
  // Extraer lista de fechas únicas
  const fechas = [...new Set(measurements.map(d => d["Fecha Medicion"] || d["Fecha"]))].filter(Boolean);
  let fechaSeleccionada = fechas[fechas.length - 1] || ''; // Por defecto la más reciente

  // Partes del cuerpo disponibles basadas en tus columnas exactas
  const partesCuerpo = [
    { key: 'Peso', label: 'Peso (Kg)' },
    { key: 'Grasa Corporal', label: '% Grasa' },
    { key: 'Masa Corporal', label: 'Masa Corporal' },
    { key: 'Tricep', label: 'Tricep' },
    { key: 'Subescapular', label: 'Subescapular' },
    { key: 'Suprailiaco', label: 'Suprailiaco' },
    { key: 'Abdominal', label: 'Abdominal' },
    { key: 'Muslo', label: 'Muslo' },
    { key: 'Pierna', label: 'Pierna' },
    { key: 'Cuello', label: 'Cuello' },
    { key: 'Cintura', label: 'Cintura' },
    { key: 'Cadera', label: 'Cadera' },
    { key: 'ICC', label: 'ICC' },
    { key: 'Antebrazo Der', label: 'Anteb Der' },
    { key: 'Antebrazo Izq', label: 'Anteb Izq' },
    { key: 'Brazo Der', label: 'Brazo Der' },
    { key: 'Brazo Izq', label: 'Brazo Izq' },
    { key: 'Brazo Der Contr', label: 'Brazo Der Contr' },
    { key: 'Brazo Izq Contr', label: 'Brazo Izq Contr' },
    { key: 'Pecho', label: 'Pecho' },
    { key: 'Muslo Sup Der', label: 'Muslo Sup Der' },
    { key: 'Muslo Sup Izq', label: 'Muslo Sup Izq' },
    { key: 'Muslo Med Der', label: 'Muslo Med Der' },
    { key: 'Muslo Med Izq', label: 'Muslo Med Izq' },
    { key: 'Pantorrila Der', label: 'Pantorrila Der' },
    { key: 'Pantorrilla Izq', label: 'Pantorrilla Izq' }
  ];

  let parteSeleccionada = partesCuerpo[0].key;

  function renderMedidasUI() {
    let selectorHTML = '';

    if (modoFiltro === 'fecha') {
      const opts = fechas.map(f => `<option value="${f}" ${f === fechaSeleccionada ? 'selected' : ''}>${f}</option>`).join('');
      selectorHTML = `<select id="select-medida-val" class="bg-emerald-50 text-emerald-800 text-xs font-bold py-1.5 px-3 rounded-xl border border-emerald-200 outline-none">${opts}</select>`;
    } else {
      const opts = partesCuerpo.map(p => `<option value="${p.key}" ${p.key === parteSeleccionada ? 'selected' : ''}>${p.label}</option>`).join('');
      selectorHTML = `<select id="select-medida-val" class="bg-emerald-50 text-emerald-800 text-xs font-bold py-1.5 px-3 rounded-xl border border-emerald-200 outline-none">${opts}</select>`;
    }

    let html = `
      <div class="space-y-4 p-4 bg-white rounded-2xl shadow-sm border border-emerald-100 my-4">
        <!-- Cabecera de Filtros estilo captura -->
        <div class="flex flex-col gap-2 bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100">
          <div class="flex items-center justify-between border-b border-emerald-100 pb-2">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">FILTRAR POR:</span>
            <div class="flex gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
              <button id="btn-modo-fecha" class="px-3 py-1 rounded-lg transition-all ${modoFiltro === 'fecha' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500'}">Fecha</button>
              <button id="btn-modo-parte" class="px-3 py-1 rounded-lg transition-all ${modoFiltro === 'parte' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500'}">Parte del cuerpo</button>
            </div>
          </div>
          <div class="flex items-center justify-between pt-1">
            <span class="text-xs font-semibold text-gray-600">Selección:</span>
            ${selectorHTML}
          </div>
        </div>
    `;

    if (modoFiltro === 'fecha') {
      const registro = measurements.find(d => (d["Fecha Medicion"] || d["Fecha"]) === fechaSeleccionada);
      if (registro) {
        const pesoVal = registro["Peso"] || '-';
        
        html += `
          <div class="bg-white rounded-2xl p-4 shadow-xs border border-emerald-100 space-y-3">
            <div class="flex justify-between items-center border-b border-gray-100 pb-2">
              <span class="text-xs font-bold text-gray-400">${fechaSeleccionada}</span>
              <div class="text-emerald-700 font-black text-base">${pesoVal} <span class="text-xs font-medium">kg</span></div>
            </div>
            
            <div class="grid grid-cols-4 gap-2 text-center text-xs">
        `;

        partesCuerpo.forEach(p => {
          if (p.key === 'Peso') return; // Ya se muestra arriba
          const val = registro[p.key];
          if (val !== undefined && val !== '') {
            html += `
              <div class="bg-emerald-50/60 p-2 rounded-xl flex flex-col justify-center border border-emerald-100/50">
                <span class="text-gray-400 text-[9px] uppercase font-bold tracking-tight">${p.label}</span>
                <span class="font-bold text-gray-800 text-xs mt-0.5">${val}</span>
              </div>
            `;
          }
        });

        html += `
            </div>
          </div>
        `;
      } else {
        html += `<p class="text-center text-xs text-gray-400 py-4">No hay registros para esta fecha.</p>`;
      }
    } else {
      // Modo Histórico por Parte del Cuerpo
      const labelParte = partesCuerpo.find(p => p.key === parteSeleccionada)?.label || parteSeleccionada;
      html += `
        <div class="bg-white rounded-2xl p-4 shadow-xs border border-emerald-100">
          <h3 class="font-bold text-gray-800 text-sm mb-3 border-b border-gray-100 pb-2">${labelParte} - Histórico</h3>
          <div class="space-y-2">
      `;

      measurements.forEach(d => {
        const val = d[parteSeleccionada] || '-';
        const fecha = d["Fecha Medicion"] || d["Fecha"] || '-';
        html += `
          <div class="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span class="text-xs text-gray-500 font-medium">${fecha}</span>
            <span class="font-black text-sm text-emerald-800">${val}</span>
          </div>
        `;
      });

      html += `</div></div>`;
    }

    html += `</div>`;
    
    // Inyectar en un contenedor específico para medidas (puedes crear un div con id="modulo-medidas" donde prefieras mostrarlo)
    let medidasContainer = document.getElementById('modulo-medidas');
    if (!medidasContainer) {
      medidasContainer = document.createElement('div');
      medidasContainer.id = 'modulo-medidas';
      container.appendChild(medidasContainer);
    }
    medidasContainer.innerHTML = html;

    // Asignar Event Listeners
    document.getElementById('btn-modo-fecha').addEventListener('click', () => { modoFiltro = 'fecha'; renderMedidasUI(); });
    document.getElementById('btn-modo-parte').addEventListener('click', () => { modoFiltro = 'parte'; renderMedidasUI(); });

    const selectEl = document.getElementById('select-medida-val');
    if (selectEl) {
      selectEl.addEventListener('change', (e) => {
        if (modoFiltro === 'fecha') fechaSeleccionada = e.target.value;
        else parteSeleccionada = e.target.value;
        renderMedidasUI();
      });
    }
  }

  renderMedidasUI();
};
