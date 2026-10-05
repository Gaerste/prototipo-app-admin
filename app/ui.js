/* Piezas comunes de las pantallas. */
(() => {
  const A = window.APP; const { esc, ic, puede, quienEdita } = A;
  A.f = {}; // filtros por pantalla

  A.cab = (kicker, titulo, desc = '', acciones = '') => `<header class="cabeza"><div>${kicker ? `<p class="kicker">${kicker}</p>` : ''}<h1>${esc(titulo)}</h1>${desc ? `<p class="desc">${desc}</p>` : ''}</div>${acciones ? `<div class="cabeza-acc">${acciones}</div>` : ''}</header>`;

  // botón que respeta permisos. A quien solo mira el módulo no se le muestra: ya tiene el ojo y la nota de solo lectura.
  // A quien edita pero no tiene ese permiso (por ejemplo, aprobar), sale con candado y, al tocarlo, dice quién lo hace.
  A.boton = (mod, txt, attrs, { tono = 'pri', icono = '', permiso = 'editar', chico = false } = {}) => {
    if (puede(mod, permiso)) return `<button class="btn ${tono}${chico ? ' chico' : ''}" ${attrs}>${icono ? ic(icono, 's') : ''}${esc(txt)}</button>`;
    if (!puede(mod, 'editar')) return '';
    return `<button class="btn bloq${chico ? ' chico' : ''}" data-acc="sin-permiso" data-arg="${mod}|${permiso}" aria-disabled="true">${ic('candado', 's')}${esc(txt)}</button>`;
  };
  A.ACC['sin-permiso'] = arg => { const [mod, permiso] = String(arg).split('|'); A.aviso(permiso === 'aprobar' ? 'Esto lo aprueba ' + A.quienAprueba(mod) + '.' : 'Solo lectura: pídeselo a ' + quienEdita(mod) + '.', 'info'); };

  // tachado: lo que dejó de valer (un lote aprobado que se reabrió para cambiarlo) queda a la vista, con una raya encima
  A.sello = (txt, { rojo = false, recien = false, fecha = '', tachado = false } = {}) => `<span class="sello${rojo ? ' rojo' : ''}${recien ? ' recien' : ''}${tachado ? ' tachado' : ''}" role="img" aria-label="${tachado ? 'Sello tachado, ya no vale' : 'Sello'}: ${esc(txt)}${fecha ? ' · ' + esc(fecha) : ''}">${esc(txt)}${fecha ? `<small>${esc(fecha)}</small>` : ''}</span>`;

  A.lectura = mod => puede(mod, 'editar') ? '' : `<p class="nota gris">${ic('ojo', 's')}<span><b>Solo lectura.</b> Puedes abrir y ver todo; los cambios los hace ${esc(quienEdita(mod))}.</span></p>`;

  // [sub, nombre, cuenta, gris, corto] · con «corto», la computadora muestra el nombre corto para que quepan todas («IVA» por «Hoja de IVA»)
  A.subnav = (items, actual) => `<nav class="subnav" aria-label="Secciones">${items.filter(Boolean).map(([k, t, n, gris, corto]) => `<button data-sub="${k}" aria-current="${k === actual}">${corto ? `<span class="sn-largo">${esc(t)}</span><span class="sn-corto">${esc(corto)}</span>` : esc(t)}${n ? `<span class="cuenta${gris ? ' gris' : ''}">${n}</span>` : ''}</button>`).join('')}</nav>`;

  A.cifra = ({ etq, valor, sub = '', abrir = '', ir = '', acc = '', arg = '', tono = '' }) => {
    const attr = abrir ? `data-abrir="${abrir}"` : ir ? `data-ir="${ir}"` : acc ? `data-acc="${acc}" data-arg="${arg}"` : '';
    const el = attr ? 'button' : 'div';
    return `<${el} class="cifra ${tono}" ${attr}><span class="etq">${esc(etq)}</span><b>${valor}</b>${sub ? `<small>${sub}</small>` : ''}</${el}>`;
  };

  // tabla: en computadora es tabla; en teléfono cada fila es una ficha (clases p, r, e, s, x)
  // r alinea a la derecha (en el teléfono, arriba a la derecha) · plata lleva la raya roja del libro: solo en las columnas de plata
  A.tabla = ({ id = '', cols, filas, pie = null, vacio = 'No hay nada por aquí.' }) => {
    const abre = filas.some(f => f.abrir || f.ir);
    if (!filas.length) return `<div class="hoja"><p class="muted">${esc(vacio)}</p></div>`;
    return `<div class="hoja plana"><div class="tabla-env"><table class="t fichas" ${id ? `id="${id}"` : ''}>
      <thead><tr>${cols.map(c => `<th class="${c.cls || ''}" scope="col">${c.t ? esc(c.t) : c.sr ? `<span class="sr-only">${esc(c.sr)}</span>` : ''}</th>`).join('')}${abre ? '<th class="chev-c"><span class="sr-only">Abrir</span></th>' : ''}</tr></thead>
      <tbody>${filas.map(f => `<tr ${f.abrir ? `data-abrir="${f.abrir}" tabindex="0"` : f.ir ? `data-ir="${f.ir}" tabindex="0"` : ''} class="${f.clase || ''}" data-txt="${esc((f.txt || '').toLowerCase())}">${f.celdas.map((c, i) => `<td class="${cols[i].cls || ''}">${c ?? '—'}</td>`).join('')}${abre ? `<td class="chev-c">${ic('derecha', 's')}</td>` : ''}</tr>`).join('')}</tbody>
      ${pie ? `<tfoot><tr>${pie.map((c, i) => `<td class="${cols[i].cls || ''}">${c ?? ''}</td>`).join('')}${abre ? '<td class="chev-c"></td>' : ''}</tr></tfoot>` : ''}
    </table></div></div>`;
  };
  A.filtros = (tablaId, segs = null, actual = null, placeholder = 'Buscar…') => `<div class="filtros">
    ${segs ? `<div class="seg" role="group" aria-label="Filtrar">${segs.map(([k, t, n]) => `<button data-acc="filtro" data-arg="${k}" aria-pressed="${k === actual}">${esc(t)}${n !== undefined ? `<span class="n">${n}</span>` : ''}</button>`).join('')}</div>` : ''}
    <label class="filtro-buscar" for="buscar-${tablaId}">${ic('buscar', 's')}<input id="buscar-${tablaId}" data-filtrar="${tablaId}" placeholder="${esc(placeholder)}" autocomplete="off"></label>
  </div>`;
  A.ACC.filtro = arg => { A.f[A.S.ruta + ':' + (A.S.sub[A.S.ruta] || '')] = arg; A.pintarPagina(); };
  A.filtroActual = (def) => A.f[A.S.ruta + ':' + (A.S.sub[A.S.ruta] || '')] || def;

  // el filtro de una tabla compara sin tildes («nomina» encuentra «Nómina»), como el buscador
  A.alMontar = raiz => {
    A.$$('[data-filtrar]', raiz).forEach(inp => inp.addEventListener('input', () => {
      const q = A.sinTildes(inp.value).replace(/\s+/g, ' ').trim();
      A.$$('#' + inp.dataset.filtrar + ' tbody tr', raiz).forEach(tr => { tr.hidden = q && !A.sinTildes(tr.dataset.txt + ' ' + tr.textContent).replace(/\s+/g, ' ').includes(q); });
    }));
    A.deslizar(raiz);
  };

  /* ---------- filas que se deslizan: pestañas, filtros y tablas anchas ----------
     · al dibujar la página (y al llegar por un enlace) la pestaña o el filtro elegido queda a la vista, moviendo solo la fila, nunca la página
     · cada fila recuerda dónde quedó entre un toque y otro
     · si hay más, un degradado del color del fondo con «›» en el borde, y «‹» del otro lado cuando ya se desplazó (se tocan para avanzar)
     · una tabla más ancha que la pantalla (el horario, la matriz de permisos, la hoja de IVA) lleva el degradado y «Desliza →» */
  const POS = {}; let ro = null; const vigiladas = new Set();
  const marcarBordes = (w, f) => { const max = f.scrollWidth - f.clientWidth; w.classList.toggle('hay-antes', f.scrollLeft > 2); w.classList.toggle('hay-despues', max - f.scrollLeft > 2); if (f.scrollLeft > 2) w.classList.add('ya-deslizo'); };
  // «Desliza →» va sobre la primera fila de datos, debajo de los encabezados (los de una tabla o los meses del calendario del personal):
  // así no tapa el nombre de ninguna columna
  const ponerPista = (w, f) => { const p = w.querySelector('.desliza-pista'); if (!p) return; const cab = f.querySelector('thead, .gantt-cab'); const alto = cab ? cab.getBoundingClientRect().bottom - w.getBoundingClientRect().top : 0; p.style.top = (alto > 0 ? Math.round(alto) + 8 : 7) + 'px'; };
  // lleva lo elegido a la vista con un margen para el degradado; si ya se ve entero, no mueve nada
  const aLaVista = f => {
    const el = f.querySelector('[aria-current="true"], [aria-pressed="true"]'); if (!el || f.scrollWidth <= f.clientWidth) return;
    const m = 40; const izq = el.offsetLeft - m, der = el.offsetLeft + el.offsetWidth + m;
    if (izq < f.scrollLeft) f.scrollLeft = Math.max(0, izq); else if (der > f.scrollLeft + f.clientWidth) f.scrollLeft = der - f.clientWidth;
  };
  const suave = () => (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  A.deslizar = raiz => {
    if (!raiz) return;
    // si la fila cambia de ancho (otro formato, la ventana más angosta), lo elegido vuelve a quedar a la vista
    if (!ro && window.ResizeObserver) ro = new ResizeObserver(es => es.forEach(e => { const f = e.target.firstElementChild; if (!f) return; if (!e.target.classList.contains('es-tabla')) aLaVista(f); else ponerPista(e.target, f); marcarBordes(e.target, f); }));
    vigiladas.forEach(w => { if (!w.isConnected) { if (ro) ro.unobserve(w); vigiladas.delete(w); } });
    const enFicha = raiz.id === 'ficha-raiz'; const cuenta = {};
    A.$$('.subnav, .seg, .tabla-env', raiz).forEach(f => {
      if (f.parentElement && f.parentElement.classList.contains('desliza')) return;
      const tipo = f.classList.contains('subnav') ? 'subnav' : f.classList.contains('seg') ? 'seg' : 'tabla';
      const w = document.createElement('div'); w.className = 'desliza es-' + tipo;
      f.replaceWith(w); w.appendChild(f);
      // con el dedo, «Desliza →»; con el ratón, «Más columnas →» (el ratón no desliza)
      w.insertAdjacentHTML('beforeend', tipo === 'tabla' ? '<span class="desliza-sig" aria-hidden="true"><span class="desliza-pista"><span class="con-dedo">Desliza →</span><span class="con-raton">Más columnas →</span></span></span>'
        : '<button type="button" class="desliza-ant" tabindex="-1" aria-hidden="true">‹</button><button type="button" class="desliza-sig" tabindex="-1" aria-hidden="true">›</button>');
      if (tipo === 'tabla') ponerPista(w, f);
      // la clave de la fila: la pantalla (y la pestaña, si la fila está dentro de una), qué fila es y cuántas iguales van antes
      const S = A.S; const nombre = f.getAttribute('aria-label') || tipo;
      const base = (enFicha ? 'ficha:' + (S.ficha ? S.ficha.tipo : '') : S.ruta + (tipo === 'subnav' ? '' : '/' + (S.sub[S.ruta] || ''))) + '|' + tipo + '|' + nombre;
      cuenta[base] = (cuenta[base] || 0) + 1; const clave = base + '|' + cuenta[base];
      if (POS[clave]) f.scrollLeft = POS[clave];
      if (tipo !== 'tabla') aLaVista(f);
      marcarBordes(w, f);
      f.addEventListener('scroll', () => { POS[clave] = f.scrollLeft; marcarBordes(w, f); }, { passive: true });
      // «‹», «›» y «Desliza →» también se tocan (o se les hace clic) para avanzar
      A.$$('button.desliza-ant, button.desliza-sig, .desliza-pista', w).forEach(b => b.addEventListener('click', () => f.scrollBy({ left: (b.classList.contains('desliza-ant') ? -1 : 1) * Math.max(120, f.clientWidth * .7), behavior: suave() })));
      if (ro) { ro.observe(w); vigiladas.add(w); }
    });
  };

  A.estadoTag = (est) => {
    const m = {
      confirmado: ['Confirmado', 'ok'], por_confirmar: ['Por confirmar', 'aviso'], avisado: ['Avisado: no cayó', 'alerta'], descartado: ['Descartado', ''],
      abierta: ['Abierta', ''], pagada: ['Pagada', 'ok'], vencida: ['Vencida', 'alerta'], ajustada: ['Corregida', 'info'], parcial: ['Pago parcial', 'aviso'], anulada: ['Anulada', ''],
      al_dia: ['Al día', 'ok'], cuenta_nueva: ['Cuenta por verificar', 'alerta'],
      preparar: ['Por preparar', ''], revision: ['En revisión', 'aviso'], lista: ['Lista para declarar', 'info'], declarada: ['Declarada', 'info'],
      vigente: ['Vigente', 'ok'], por_vencer: ['Por vencer', 'aviso'], vencido: ['Vencido', 'alerta'], en_tramite: ['En trámite', 'info'],
      por_descontar: ['Por descontar', 'aviso'], descontada: ['Descontada', 'ok'], borrador: ['Borrador', ''], emitida: ['Emitida', 'info'], entregada: ['Entregada', 'ok'], enterada: ['Pagada al SENIAT', 'ok'],
      conciliada: ['Conciliada', 'ok'], diferencias: ['Con diferencias', 'aviso'], falta: ['Falta el estado de cuenta', 'alerta'],
      confirmado_z: ['Confirmado', 'ok'], leido: ['Leído, falta confirmar', 'aviso'],
      activo: ['Activo', 'ok'], aprendiz: ['Aprendiz', 'lila'], invitada: ['Invitación enviada', 'info'], por_confirmar_u: ['Por confirmar', 'aviso'], sin_acceso: ['Sin acceso', ''],
      esperando: ['Esperando reposición', 'aviso'], repuesta: ['Repuesta', 'ok'], por_aprobar: ['Por aprobar', 'aviso'], aprobada: ['Aprobada', 'ok'],
      ok: ['Al día', 'ok'], atencion: ['Atención', 'aviso'], caido: ['Caído', 'alerta'], revisar: ['Por revisar', 'aviso'], sin_soporte: ['Falta la foto', 'aviso'],
      respondida: ['Respondida', 'ok'], midiendo: ['Midiendo', 'info'], medida: ['Medida', 'ok'],
      reposo: ['De reposo', 'lila'], vacaciones: ['De vacaciones', ''], egresado: ['Egresado', ''], por_justificar: ['Por justificar', 'aviso'], justificada: ['Justificada', 'ok'], justificada_sin: ['Justificada sin soporte', 'aviso'], injustificada: ['Injustificada', 'alerta'],
      causada: ['Por programar', ''], programada: ['Programada', 'info'], disfrutando: ['Disfrutando', 'ok'], disfrutada: ['Disfrutada', 'ok'], en_liquidacion: ['Sale de su liquidación', 'aviso'], rechazado: ['Rechazado', ''], perdonado: ['Perdonado', 'lila'],
      por_repartir: ['Por repartir', 'aviso'], revisada: ['Revisada: falta el visto final', 'aviso'], alertada: ['Sin resolver', 'aviso'], resuelta: ['Resuelta', 'ok'], presupuesto: ['Presupuesto enviado', 'aviso'], confirmada: ['Confirmada', 'ok'], llego: ['Llegó', 'ok'], no_vino: ['No vino', 'alerta'], cancelada: ['Anulada', ''], firmado: ['Firmado', 'ok'], por_firmar: ['Por firmar', 'aviso'],
    };
    const [t, tono] = m[est] || [est, ''];
    return A.tag(t, tono);
  };
  // el resaltador de una cuenta, como en todas partes («Bóveda» y «Caja chica» llevan el del efectivo)
  const CODIGO_CTA = { 'Bóveda': 'BOV', 'Caja chica': 'CCH' };
  A.cta = c => `<span class="acct" data-c="${esc(CODIGO_CTA[c] || c)}">${esc(c)}</span>`;
  // una línea por cuenta con su resaltador y su monto (la ventana del código del lote: BVCA, BVCE y BVCJ con lo que sale de cada una)
  A.porCuenta = pares => pares.map(([c, m]) => `<span class="firma-cta">${A.cta(c)}<span>${A.dinero(m)}</span></span>`).join('');
  // copiar un texto; si el navegador no deja, lo deja seleccionado en su sitio (el) para copiarlo a mano
  // completo: lo que se ve está cortado («Orden 4402…118»): antes de seleccionarlo se escribe entero, para que se copie lo que sirve
  A.copiar = (txt, { el = null, ok = 'Copiado.', completo = false } = {}) => {
    const aMano = () => {
      if (el) { if (completo) el.textContent = txt; const rg = document.createRange(); rg.selectNodeContents(el); const s = window.getSelection(); s.removeAllRanges(); s.addRange(rg); }
      A.aviso(el ? 'Texto seleccionado: cópialo con Cmd+C o manteniendo el dedo.' : 'No se pudo copiar. Es: ' + txt, 'info');
    };
    try { navigator.clipboard.writeText(txt).then(() => A.aviso(ok), aMano); } catch (_) { aMano(); }
  };
  // el nombre de un estado sin la etiqueta: el registro de cambios dice «No vino → Llegó», no «no_vino → llego»
  A.estadoTxt = est => A.estadoTag(est).replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  // gráfico de barras simple con hover (una serie) · abrir: i => 'tipo:id' hace que cada barra abra su ficha
  A.barrasSVG = ({ datos, alto = 180, meta = null, etiquetaY = v => v, resaltar = -1, id = 'g', abrir = null }) => {
    // con meta, el margen derecho guarda su etiqueta para que no tape barras
    const W = 640, H = alto, L = 44, R = meta ? 66 : 8, T = 14, B = 26;
    // escalones redondos (1, 2, 2,5 o 5 × 10ⁿ) para que el eje nombre valores reales
    const crudo = Math.max(...datos.map(d => d[1]), meta || 0) * 1.04 || 1;
    const base = Math.pow(10, Math.floor(Math.log10(crudo / 4)));
    const escalon = [1, 2, 2.5, 5, 10, 20].map(k => k * base).find(e => Math.ceil(crudo / e) <= 6), ticks = Math.ceil(crudo / escalon);
    const max = escalon * ticks;
    const n = datos.length, paso = (W - L - R) / n, bw = Math.min(34, paso * .62);
    const y = v => T + (H - T - B) * (1 - v / max);
    let g = '';
    for (let i = 0; i <= ticks; i++) { const v = escalon * i; const yy = y(v); g += `<line class="rej" x1="${L}" x2="${W - R}" y1="${yy.toFixed(1)}" y2="${yy.toFixed(1)}"/><text x="${L - 6}" y="${(yy + 3.5).toFixed(1)}" text-anchor="end">${etiquetaY(v)}</text>`; }
    const barras = datos.map((d, i) => {
      const x = L + paso * i + (paso - bw) / 2, yy = y(d[1]), h = H - B - yy;
      const r = Math.min(4, h / 2);
      const path = `M${x},${H - B} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + bw - r} Q${x + bw},${yy} ${x + bw},${yy + r} V${H - B} Z`;
      return `<g ${abrir ? `data-abrir="${esc(abrir(i))}" ` : ''}data-tip="${esc(d[0])}: ${esc(d[2] || etiquetaY(d[1]))}" data-x="${(x + bw / 2) / W}" data-y="${yy / H}"><rect class="hit" x="${L + paso * i}" y="${T}" width="${paso}" height="${H - T - B}"/><path d="${path}" style="fill:${i === resaltar ? 'var(--boligrafo)' : 'var(--tinta-3)'};opacity:${i === resaltar ? 1 : .55}"/>${i % 2 === (n % 2 ? 0 : 1) || i === n - 1 ? `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(d[0])}</text>` : ''}</g>`;
    }).join('');
    const m = meta ? `<line class="meta" x1="${L}" x2="${W - R}" y1="${y(meta)}" y2="${y(meta)}"/><text x="${W - R + 6}" y="${y(meta) + 3.5}" style="fill:var(--tinta)">Equilibrio</text>` : '';
    return `<div style="position:relative" data-graf="${id}"><svg class="graf" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de barras">${g}<line class="eje" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>${barras}${m}</svg><span class="tip" hidden></span></div>`;
  };
  document.addEventListener('mouseover', e => {
    const g = e.target.closest('[data-tip]'); const cont = e.target.closest('[data-graf]');
    if (!cont) return; const tip = cont.querySelector('.tip');
    if (!g) { tip.hidden = true; return; }
    tip.textContent = g.dataset.tip; tip.hidden = false;
    tip.style.left = (parseFloat(g.dataset.x) * 100) + '%'; tip.style.top = (parseFloat(g.dataset.y) * 100) + '%';
  });
  document.addEventListener('mouseout', e => { const cont = e.target.closest('[data-graf]'); if (cont && !cont.contains(e.relatedTarget)) { const t = cont.querySelector('.tip'); if (t) t.hidden = true; } });

  // la línea va en el dibujo, que estira a lo ancho con su alto fijo; sus dos etiquetas van debajo, como texto
  // (dentro del dibujo crecían o encogían con su ancho: en el teléfono no se leían) · el punto de hoy es una raya de largo cero, siempre redonda
  A.spark = (vals, { w = 320, h = 54, etqIni = '', etqFin = '' } = {}) => {
    const min = Math.min(...vals), max = Math.max(...vals); const L = 4, R = 6, T = 6, B = 4;
    const x = i => L + (w - L - R) * i / (vals.length - 1); const y = v => T + (h - T - B) * (1 - (v - min) / ((max - min) || 1));
    const pts = vals.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1)); const xf = x(vals.length - 1).toFixed(1), yf = y(vals[vals.length - 1]).toFixed(1);
    return `<span class="spark-env"><svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(etqIni)} a ${esc(etqFin)}">
      <path d="M${pts.join(' L')} L${xf},${h - B} L${L},${h - B} Z" fill="currentColor" fill-opacity=".08"/>
      <polyline points="${pts.join(' ')}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      <line x1="${xf}" y1="${yf}" x2="${xf}" y2="${yf}" stroke="currentColor" stroke-width="7" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
      ${etqIni || etqFin ? `<span class="leyenda spark-ley" aria-hidden="true"><span>${esc(etqIni)}</span><span>${esc(etqFin)}</span></span>` : ''}</span>`;
  };
})();
