/* Piezas comunes de las pantallas. */
(() => {
  const A = window.APP; const { esc, ic, puede, quienEdita } = A;
  A.f = {}; // filtros por pantalla

  A.cab = (kicker, titulo, desc = '', acciones = '') => `<header class="cabeza"><div>${kicker ? `<p class="kicker">${kicker}</p>` : ''}<h1>${esc(titulo)}</h1>${desc ? `<p class="desc">${desc}</p>` : ''}</div>${acciones ? `<div class="cabeza-acc">${acciones}</div>` : ''}</header>`;

  // botón que respeta permisos: si no puede, sale como candado con explicación
  A.boton = (mod, txt, attrs, { tono = 'pri', icono = '', permiso = 'editar', chico = false } = {}) => puede(mod, permiso)
    ? `<button class="btn ${tono}${chico ? ' chico' : ''}" ${attrs}>${icono ? ic(icono, 's') : ''}${esc(txt)}</button>`
    : `<button class="btn bloq${chico ? ' chico' : ''}" data-acc="sin-permiso" data-arg="${mod}" title="Solo lectura">${ic('candado', 's')}${esc(txt)}</button>`;
  A.ACC['sin-permiso'] = mod => A.aviso('Solo lectura: pídeselo a ' + quienEdita(mod) + '.', 'info');

  A.sello = (txt, { rojo = false, recien = false, fecha = '' } = {}) => `<span class="sello${rojo ? ' rojo' : ''}${recien ? ' recien' : ''}" role="img" aria-label="Sello: ${esc(txt)}">${esc(txt)}${fecha ? `<small>${esc(fecha)}</small>` : ''}</span>`;

  A.lectura = mod => puede(mod, 'editar') ? '' : `<p class="nota gris">${ic('ojo', 's')}<span><b>Solo lectura.</b> Puedes abrir y ver todo; los cambios los hace ${esc(quienEdita(mod))}.</span></p>`;

  A.subnav = (items, actual) => `<nav class="subnav" aria-label="Secciones">${items.filter(Boolean).map(([k, t, n, gris]) => `<button data-sub="${k}" aria-current="${k === actual}">${esc(t)}${n ? `<span class="cuenta${gris ? ' gris' : ''}">${n}</span>` : ''}</button>`).join('')}</nav>`;

  A.cifra = ({ etq, valor, sub = '', abrir = '', ir = '', acc = '', arg = '', tono = '' }) => {
    const attr = abrir ? `data-abrir="${abrir}"` : ir ? `data-ir="${ir}"` : acc ? `data-acc="${acc}" data-arg="${arg}"` : '';
    const el = attr ? 'button' : 'div';
    return `<${el} class="cifra ${tono}" ${attr}><span class="etq">${esc(etq)}</span><b>${valor}</b>${sub ? `<small>${sub}</small>` : ''}</${el}>`;
  };

  // tabla: en computadora es tabla; en teléfono cada fila es una ficha (clases p, r, e, s, x)
  A.tabla = ({ id = '', cols, filas, pie = null, vacio = 'No hay nada por aquí.' }) => {
    const abre = filas.some(f => f.abrir || f.ir);
    if (!filas.length) return `<div class="hoja"><p class="muted">${esc(vacio)}</p></div>`;
    return `<div class="hoja plana"><div class="tabla-env"><table class="t fichas" ${id ? `id="${id}"` : ''}>
      <thead><tr>${cols.map(c => `<th class="${c.cls || ''}${c.cls && c.cls.includes('r') ? ' r' : ''}" scope="col">${esc(c.t)}</th>`).join('')}${abre ? '<th class="chev-c"><span class="sr-only">Abrir</span></th>' : ''}</tr></thead>
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

  A.alMontar = raiz => {
    A.$$('[data-filtrar]', raiz).forEach(inp => inp.addEventListener('input', () => {
      const q = inp.value.trim().toLowerCase();
      A.$$('#' + inp.dataset.filtrar + ' tbody tr', raiz).forEach(tr => { tr.hidden = q && !(tr.dataset.txt + ' ' + tr.textContent.toLowerCase()).includes(q); });
    }));
  };

  A.estadoTag = (est) => {
    const m = {
      confirmado: ['Confirmado', 'ok'], por_confirmar: ['Por confirmar', 'aviso'], avisado: ['Avisado: no cayó', 'alerta'], descartado: ['Descartado', ''],
      abierta: ['Abierta', ''], pagada: ['Pagada', 'ok'], vencida: ['Vencida', 'alerta'], ajustada: ['Ajustada por Jose', 'info'], parcial: ['Pago parcial', 'aviso'], anulada: ['Anulada', ''],
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
      reposo: ['De reposo', 'lila'], vacaciones: ['De vacaciones', ''], egresado: ['Egresado', ''], por_justificar: ['Por justificar', 'aviso'], justificada: ['Justificada', 'ok'], injustificada: ['Injustificada', 'alerta'],
      causada: ['Por programar', ''], programada: ['Programada', 'info'], disfrutando: ['Disfrutando', 'ok'], disfrutada: ['Disfrutada', 'ok'], en_liquidacion: ['Sale de su liquidación', 'aviso'], rechazado: ['Rechazado', ''], perdonado: ['Perdonado', 'lila'],
      por_repartir: ['Por repartir', 'aviso'], alertada: ['Sin resolver', 'aviso'], resuelta: ['Resuelta', 'ok'], presupuesto: ['Presupuesto enviado', 'aviso'], confirmada: ['Confirmada', 'ok'], llego: ['Llegó', 'ok'], no_vino: ['No vino', 'alerta'], cancelada: ['Cancelada', ''], firmado: ['Firmado', 'ok'], por_firmar: ['Por firmar', 'aviso'],
    };
    const [t, tono] = m[est] || [est, ''];
    return A.tag(t, tono);
  };

  // gráfico de barras simple con hover (una serie)
  A.barrasSVG = ({ datos, alto = 180, meta = null, etiquetaY = v => v, resaltar = -1, id = 'g' }) => {
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
      return `<g data-tip="${esc(d[0])}: ${esc(d[2] || etiquetaY(d[1]))}" data-x="${(x + bw / 2) / W}" data-y="${yy / H}"><rect class="hit" x="${L + paso * i}" y="${T}" width="${paso}" height="${H - T - B}"/><path d="${path}" style="fill:${i === resaltar ? 'var(--boligrafo)' : 'var(--tinta-3)'};opacity:${i === resaltar ? 1 : .55}"/>${i % 2 === (n % 2 ? 0 : 1) || i === n - 1 ? `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(d[0])}</text>` : ''}</g>`;
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

  A.spark = (vals, { w = 320, h = 70, etqIni = '', etqFin = '' } = {}) => {
    const min = Math.min(...vals), max = Math.max(...vals); const L = 4, R = 4, T = 16, B = 16;
    const x = i => L + (w - L - R) * i / (vals.length - 1); const y = v => T + (h - T - B) * (1 - (v - min) / ((max - min) || 1));
    const pts = vals.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1));
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(etqIni)} a ${esc(etqFin)}">
      <path d="M${pts.join(' L')} L${x(vals.length - 1)},${h - B} L${L},${h - B} Z" fill="currentColor" fill-opacity=".08"/>
      <polyline points="${pts.join(' ')}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${x(vals.length - 1)}" cy="${y(vals[vals.length - 1])}" r="3.5" fill="currentColor"/>
      <text x="${L}" y="${h - 3}">${esc(etqIni)}</text><text x="${w - R}" y="11" text-anchor="end">${esc(etqFin)}</text></svg>`;
  };
})();
