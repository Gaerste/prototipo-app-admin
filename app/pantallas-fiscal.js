/* Fiscal: lo que llena Cecilia para declarar sin errores. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, $, $$, esc, fmt, dinero, leerNum, ic, tag, puede } = A;
  const prov = id => (D.PROVEEDORES.find(p => p.id === id) || {}).nombre || '—';
  const provDe = id => D.PROVEEDORES.find(p => p.id === id) || {};
  const obl = id => D.OBLIGACIONES.find(x => x.id === id);
  // lo que se toca en la hoja de IVA (qué retenciones se descuentan y el crédito escrito) · verOk: la línea «N revisiones en orden», desplegada
  // verQ1: los Z de la 1.ª quincena, desplegados · avisar: quién pidió que le avisen cuando el paquete del mes esté completo
  const F = { descontar: { rr1: true, rr2: true, rr3: true }, credito: D.IVA_HOJA.creditos[0][2], verOk: false, verQ1: false, avisar: new Set() };
  const tonoObl = e => ({ pagada: 'ok', declarada: 'info', lista: 'info', revision: 'aviso', preparar: '', abierta: '' }[e] || '');
  const PASOS = ['Prepara Cecilia', 'Revisa Jose', 'Declarada', 'Pagada'];
  // prepara su responsable y revisa otra persona (la que dice «revisa», o Cecilia si prepara Jose y Jose si prepara otro; el RNET lo revisa Alejandro,
  // que ve los sueldos) · Alejandro puede revisar cualquiera que no haya preparado él · «sinPago» termina al declarar (RNET) · «soloPago» no se prepara ni se declara (aseo)
  const revisorDe = o => o.revisa || (o.resp === 'Jose' ? 'Cecilia' : 'Jose');
  const puedeRevisar = o => puede('fiscal', 'editar') && S.usuario.nombre !== o.resp && (S.usuario.nombre === revisorDe(o) || S.usuario.rol === 'dueno');
  const pasosDe = o => o.soloPago ? ['Por pagar', 'Pagada'] : [`Prepara ${o.resp}`, `Revisa ${revisorDe(o)}`, ...PASOS.slice(2, o.sinPago ? 3 : 4)];
  const hecha = o => o.estado === 'pagada' || (!!o.sinPago && o.estado === 'declarada');
  const estTag = o => o.soloPago && !hecha(o) ? tag('Por pagar', '') : A.estadoTag(o.estado);
  const r2 = n => Math.round(n * 100) / 100;
  const pctBs = (m, p) => Math.round(Math.round(m * 100) * p / 100) / 100; // el p % de un monto, redondeado al céntimo
  // con Cecilia adentro se le habla a ella («Aquí llenas lo fiscal»); con los demás, de «la contadora» (la misma pieza que usan rrhh y los datos)
  const { esCecilia, aCecilia, paraCecilia } = A;
  const conCecilia = () => aCecilia('Por confirmar contigo', 'Por confirmar con Cecilia');
  const enLista = xs => xs.join(', ').replace(/, ([^,]*)$/, ' y $1');
  /* los reportes Z: subirlos es trabajo del local (Jose); quién los confirma lo decide Alejandro (¿solo Jose, o Jose o Cecilia?): el botón
     y los textos salen del mismo dato (Parámetros › Reglas), así nunca dicen cosas distintas · a Cecilia: «Pedir a Jose los Z que faltan» */
  const quienesConfirmanZ = () => D.PARAMS.confirmaZ || ['Jose'];
  const confirmaZTxt = () => enLista(quienesConfirmanZ());
  const confirmaZ = () => puede('fiscal', 'editar') && (quienesConfirmanZ().includes(S.usuario.nombre) || S.usuario.rol === 'dueno');
  const subeZ = () => puede('fiscal', 'editar') && S.usuario.rol !== 'fiscal_externo';
  const porDecidirZ = () => tag('Por decidir', 'aviso') + ` <small class="tenue">${aCecilia('si también los confirmas tú', 'si también los confirma Cecilia')}</small>`;
  // lo que se sube en Fiscal (un certificado, un Z, una retención) también queda en Documentos › Fiscal: la carpeta suma uno
  const sumarArchivo = () => { const cp = D.CARPETAS.find(c => c.id === 'fiscal'); if (cp) cp.n++; };
  const suave = () => (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

  /* ---------- cada monto en su moneda y de un solo cálculo ----------
     Lo fiscal va en bolívares, como se declara. Debajo de cada cifra, su «≈ $» (A.bs): lo que suma documentos (Z, facturas, retenciones)
     a la tasa del día de cada uno; lo que falta por pagar, a la tasa de hoy, y lo dice. El monto de una obligación sale de su hoja y es un
     estimado hasta que se declara. */
  const estimado = o => !['declarada', 'pagada'].includes(o.estado);
  // el «≈ $» de un monto de obligación: si ya se pagó, a la tasa del día del pago; si falta pagarlo, a la tasa de hoy (y estimado si no se ha declarado)
  const opObl = o => o.estado === 'pagada' && o.pagadaEl ? { tasa: D.tasaDel(o.pagadaEl) } : { hoy: true, estimado: estimado(o) };
  // la suma en $ de varios documentos, cada uno a su tasa (la misma cuenta que hace Proveedores, factura por factura)
  const usdDocs = (xs, k = 'monto') => r2(xs.reduce((s, x) => s + (x[k] && x.tasa ? r2(x[k] / x.tasa) : 0), 0));
  const zq = q => D.ZETAS.filter(z => !q || z.quincena === q);
  const zHay = q => zq(q).filter(z => z.base !== null);
  const porDia = (a, b) => a.dia - b.dia;
  const retProvQ2 = () => D.RET_EMITIDAS.filter(r => r.tipo.startsWith('IVA') && r.periodo === '2026-09' && r.quincena === 2);
  // la nómina formal del trimestre en $: con ella sale el ≈ $ de cada base (cada quincena paga 650 Bs de mínimo a la tasa de ese día de pago)
  const NF = D.NOMINA_FORMAL;
  const minUsd = m => r2(NF.pagos[m].reduce((s, [, t]) => s + NF.minimo * NF.personas / 2 / t, 0));
  const diezUsd = m => r2(NF.diezEur[m][0] * NF.diezEur[m][1] / NF.pagos[m][1][1]); // el 10 % se paga con la 2.ª quincena
  const diezBs = m => r2(NF.diezEur[m][0] * NF.diezEur[m][1]);
  const baseUsd = p => ({ o4: minUsd('sep'), o5: r2((minUsd('sep') + diezUsd('sep')) * (1 + 15 / 360 + 30 / 360)), o3: r2(['jul', 'ago', 'sep'].reduce((s, m) => s + minUsd(m) + diezUsd(m), 0)),
    o8: p.base === p.piso ? NF.personas * NF.pisoUsd : r2(NF.quincenaUsd * 2 + diezUsd('sep')) }[p.id] ?? null);

  // la hoja de IVA en números: también fija el monto de la obligación o1 (el total de la planilla)
  function calcIva() {
    const H = D.IVA_HOJA;
    const deb = H.debitos.reduce((s, d) => s + d[2], 0);
    const marcadas = D.RET_RECIBIDAS.filter(r => r.tipo === 'IVA' && r.estado === 'por_descontar' && F.descontar[r.id]);
    const ret = marcadas.reduce((s, r) => s + r.monto, 0);
    const antes = r2(deb - F.credito - H.excedente);      // cuota antes de las retenciones
    const excCredito = Math.max(-antes, 0);                // el crédito que sobra pasa a la próxima quincena
    const cuota = Math.max(antes, 0);
    const retUsada = Math.min(ret, cuota);                 // las retenciones bajan el IVA hasta cero, no más
    const retSobra = r2(ret - retUsada);                   // lo que sobra sigue por descontar
    const iva = r2(cuota - retUsada);
    // las retenciones de IVA a proveedores de la quincena (16 al 30 de septiembre), emitidas o no: van en esta planilla
    const rp = retProvQ2(); const retProv = r2(rp.reduce((s, r) => s + r.monto, 0));
    return { deb, ret, marcadas, excCredito, retUsada, retSobra, iva, rp, retProv, total: r2(iva + H.igtf + H.anticipo + retProv) };
  }
  /* lo declarado queda fijo: al registrar lo declarado se guarda una foto de la hoja (o.foto) y desde ahí se dibujan la hoja, «De dónde
     sale», «Lo que suma» y la tarjeta de la patente · lo vivo (los Z que llegan después) se compara con la foto: si no coincide, la hoja, el
     libro y la obligación dicen «No cuadra con lo declarado: hace falta una sustitutiva» */
  const firmaZ = z => [z.id, z.base, z.iva, z.exento, z.igtf].join(':');
  // la hoja de IVA en una pieza (la misma forma viva o en foto): débitos con los Z que entraron, crédito, retenciones, IGTF, anticipo, retenciones a proveedores y total
  function fotoIva() {
    const c = calcIva(); const H = D.IVA_HOJA; const z2 = zHay(2); const emp = D.VENTAS_EMPRESAS.filter(v => v.quincena === 2); const libro = H.creditos[0][2];
    const credUsd = libro ? r2(D.COMPRAS.filter(x => x.periodo === '2026-09' && x.quincena === 2).reduce((s, x) => s + x.usd[1], 0) * F.credito / libro) : null;
    const ret = r => ({ id: r.id, cliente: r.cliente, comp: r.comp, monto: r.monto, tasa: r.tasa });
    return { zIds: z2.map(z => z.id), zFirmas: z2.map(firmaZ), zN: z2.length, empN: emp.length, debitos: H.debitos.map(d => d.slice()), usdDeb: [[usdDocs(z2, 'base'), usdDocs(z2, 'iva')], [usdDocs(emp, 'base'), usdDocs(emp, 'iva')], [null, null]],
      deb: c.deb, credito: F.credito, libro, credUsd, excedente: H.excedente, marcadas: c.marcadas.map(ret), noMarcadas: D.RET_RECIBIDAS.filter(r => r.tipo === 'IVA' && r.estado === 'por_descontar' && !F.descontar[r.id]).map(ret),
      ret: c.ret, retUsada: c.retUsada, retSobra: c.retSobra, excCredito: c.excCredito, iva: c.iva, igtf: H.igtf, igtfUsd: usdDocs(z2, 'igtf'), anticipo: H.anticipo,
      rp: c.rp.map(r => ({ id: r.id, prov: r.prov, comp: r.comp, fecha: r.fecha, monto: r.monto, tasa: r.tasa })), retProv: c.retProv, retProvUsd: usdDocs(c.rp), total: c.total };
  }
  // la patente en una pieza: las ventas del mes (los Z de las dos quincenas, las facturas y el exento), el 4 %, el mínimo y lo que se paga
  function fotoPatente() {
    const P = D.PATENTE, z1 = zHay(1), z2 = zHay(2), zs = zHay();
    return { zIds: zs.map(z => z.id), zFirmas: zs.map(firmaZ), mes: P.mes, pct: P.pct, minimoEur: P.minimoEur, ventas: P.ventas, ventasUsd: ventasUsd(), cuatro: P.cuatro, minimo: P.minimo, monto: P.monto,
      q1: { n: z1.length, base: r2(z1.reduce((s, z) => s + z.base, 0)), usd: usdDocs(z1, 'base') }, q2: { n: z2.length, base: r2(z2.reduce((s, z) => s + z.base, 0)), usd: usdDocs(z2, 'base') },
      empN: D.VENTAS_EMPRESAS.length, empresas: D.LIBRO_VENTAS.empresas, empUsd: usdDocs(D.VENTAS_EMPRESAS, 'base'), exento: D.LIBRO_VENTAS.exento, exentoUsd: usdDocs(zs, 'exento') };
  }
  const declaradaConFoto = o => !!o && !!o.foto && !estimado(o);
  // lo que se ve: la foto si ya se declaró; si no, lo vivo
  const vistaIva = () => { const o = obl('o1'); return declaradaConFoto(o) ? o.foto : fotoIva(); };
  const vistaPatente = () => { const o = obl('o6'); return declaradaConFoto(o) ? o.foto : fotoPatente(); };
  // qué cambió en los Z desde que se declaró: los que llegaron después, los que cambiaron y los que ya no están
  function cambioZ(o, zs) {
    if (!declaradaConFoto(o)) return null; const f = o.foto;
    const nuevos = zs.filter(z => !f.zIds.includes(z.id)), cambiados = zs.filter(z => f.zIds.includes(z.id) && !f.zFirmas.includes(firmaZ(z))), quitados = f.zIds.filter(id => !zs.some(z => z.id === id));
    return nuevos.length || cambiados.length || quitados.length ? { nuevos, cambiados, quitados } : null;
  }
  const cambioIva = () => cambioZ(obl('o1'), zHay(2));
  const cambioPatente = () => cambioZ(obl('o6'), zHay());
  // en una línea: «Llegó el Z del dom 27 después de declarar · hace falta una sustitutiva»
  const cambioTxt = ch => { const dias = xs => enLista(xs.slice().sort(porDia).map(z => z.fecha.toLowerCase()));
    return [ch.nuevos.length ? (ch.nuevos.length === 1 ? 'Llegó el Z del ' : 'Llegaron los Z del ') + dias(ch.nuevos) + ' después de declarar' : '', ch.cambiados.length ? (ch.cambiados.length === 1 ? 'Cambió el Z del ' : 'Cambiaron los Z del ') + dias(ch.cambiados) + ' después de declarar' : '', ch.quitados.length ? 'Falta un Z que estaba en lo declarado' : ''].filter(Boolean).join(' · ') + ' · hace falta una sustitutiva'; };
  const notaCambio = ch => ch ? `<p class="nota alerta">${ic('alerta', 's')}<span><b>${esc(cambioTxt(ch))}.</b> Lo declarado no cambia: se corrige con una declaración sustitutiva.</span></p>` : '';
  // un solo cálculo: los Z mueven las ventas, el libro, la patente y la hoja; la hoja mueve el IVA (o1); cada obligación sigue a su hoja hasta declararse
  const syncIva = () => { const o = obl('o1'); if (o && estimado(o)) o.monto = calcIva().total; };
  const recalcular = () => { D.calcularVentas(); const o6 = obl('o6'); if (o6 && estimado(o6)) o6.monto = D.PATENTE.monto; syncIva(); };
  recalcular();

  /* ---------- antes de declarar: lo que está mal, con su ficha; lo que está bien, en una línea ---------- */
  // los saltos de número que no explica un día que falta (el Z que falta «sería» el número del salto: es lo mismo)
  function saltosSinExplicar(q) {
    const hay = zHay(q).sort(porDia); const faltan = zq(q).filter(z => z.base === null).map(z => z.numEsperado); const out = [];
    hay.forEach((z, i) => { const sig = hay[i + 1]; if (!sig) return; for (let n = z.num + 1; n < sig.num; n++) if (!faltan.includes(n)) out.push({ num: n, z: sig }); });
    return out;
  }
  function revisionIva() {
    const zs = zq(2).slice().sort(porDia); const malas = [], buenas = [];
    zs.filter(z => z.estado === 'falta').forEach(z => malas.push({ tono: 'alerta', tipo: 'z', abrir: 'zeta:' + z.id, t: 'Falta el Z del ' + z.fecha.toLowerCase(), s: '(sería el ' + z.numEsperado + ')' }));
    const sj = saltosSinExplicar(2);
    sj.forEach(x => malas.push({ tono: 'alerta', tipo: 'salto', abrir: 'zeta:' + x.z.id, t: 'Salto de número: no está el Z ' + x.num, s: '(ningún día lo explica)' }));
    const libro = D.IVA_HOJA.creditos[0][2];
    const sinEmitir = retProvQ2().filter(r => r.estado === 'borrador');
    sinEmitir.forEach(r => malas.push({ tono: 'alerta', tipo: 'ret', abrir: 'retemi:' + r.id, t: 'Falta emitir la retención de ' + prov(r.prov), s: '· factura N.º ' + r.factura }));
    zs.filter(z => z.estado === 'leido').forEach(z => malas.push({ tono: 'aviso', tipo: 'conf', abrir: 'zeta:' + z.id, t: 'Z del ' + z.fecha.toLowerCase() + ' sin confirmar', s: '· lo confirma ' + confirmaZTxt() }));
    if (Math.abs(F.credito - libro) > 0.005) malas.push({ tono: 'aviso', tipo: 'credito', ir: 'fiscal/compras', t: 'El crédito escrito no es el del libro de compras', s: '· el libro dice ' + dinero(libro, 'bs') });
    if (!zs.some(z => z.estado !== 'confirmado')) buenas.push({ t: 'Los 15 Z de la quincena, confirmados', abrir: 'ivalinea:z' });
    if (!sj.length) buenas.push({ t: 'La numeración de los Z no tiene saltos sin explicar', ir: 'fiscal/z' });
    const emp = D.VENTAS_EMPRESAS.filter(v => v.quincena === 2); buenas.push({ t: (emp.length === 1 ? '1 factura' : emp.length + ' facturas') + ' a empresas en el libro de ventas', abrir: 'ivalinea:emp' });
    if (Math.abs(F.credito - libro) <= 0.005) buenas.push({ t: 'El crédito es el IVA del libro de compras', ir: 'fiscal/compras' });
    if (!sinEmitir.length) buenas.push({ t: retProvQ2().length + ' retenciones a proveedores emitidas', ir: 'fiscal/retenciones' });
    return { malas, buenas, rojas: malas.filter(m => m.tono === 'alerta') };
  }
  // en una línea, lo que está en rojo: «Falta 1 Z», «Faltan 2 Z y 1 cosa más en rojo»
  const rojasTxt = rojas => { const z = rojas.filter(x => x.tipo === 'z').length, o = rojas.length - z;
    return [z ? (z === 1 ? 'Falta 1 Z' : 'Faltan ' + z + ' Z') : '', o ? (o === 1 ? '1 cosa' : o + ' cosas') + (z ? ' más' : '') + ' en rojo' : ''].filter(Boolean).join(' y '); };
  const filaAntes = x => `<li><button class="antes-fila ${x.tono}" ${x.abrir ? `data-abrir="${x.abrir}"` : `data-ir="${x.ir}"`}>${ic(x.tono === 'alerta' ? 'alerta' : 'reloj', 's')}<span>${esc(x.t)}${x.s ? ` <small>${esc(x.s)}</small>` : ''}</span>${ic('derecha', 's')}</button></li>`;
  function antesDeDeclarar() {
    const R = revisionIva(); const n = R.buenas.length;
    return `<section class="antes" id="antes-declarar" tabindex="-1" aria-labelledby="antes-t"><h3 class="etq" id="antes-t">Antes de declarar</h3>
      ${R.malas.length ? `<ul class="antes-lista">${R.malas.map(filaAntes).join('')}</ul>` : ''}
      ${n ? `<button class="antes-ok" data-acc="iva-ok" aria-expanded="${F.verOk}"${F.verOk ? ' aria-controls="antes-bien"' : ''}>${ic('check', 's')}<span>${n === 1 ? '1 revisión en orden' : n + ' revisiones en orden'}</span>${ic(F.verOk ? 'abajo' : 'derecha', 's')}</button>
        ${F.verOk ? `<ul class="antes-bien" id="antes-bien">${R.buenas.map(x => `<li><button class="antes-fila ok" ${x.abrir ? `data-abrir="${x.abrir}"` : `data-ir="${x.ir}"`}>${ic('check', 's')}<span>${esc(x.t)}</span>${ic('derecha', 's')}</button></li>`).join('')}</ul>` : ''}` : ''}
    </section>`;
  }
  ACC['iva-ok'] = () => { F.verOk = !F.verOk; A.pintarPagina(); };
  ACC['ver-antes'] = () => { const b = $('#antes-declarar'); if (!b) return; b.scrollIntoView({ block: 'start', behavior: suave() }); b.focus({ preventScroll: true }); };
  // junto a «Revisado» y «Registrar lo declarado»: lo que está en rojo, en una línea, con un enlace al bloque de arriba
  const avisoRojas = (rojas, enHoja) => rojas.length ? `<p class="nota alerta antes-aviso">${ic('alerta', 's')}<span><b>${esc(rojasTxt(rojas))}</b> · ${enHoja ? '<button class="enlace" data-acc="ver-antes">ver arriba</button>' : '<button class="enlace" data-acc="ir-a" data-arg="fiscal/iva">ver en la hoja de IVA</button>'}</span></p>` : '';

  /* ---------- las dudas para la contadora ---------- */
  // donde nace una duda («4 % · Por confirmar con Cecilia») va un enlace a su pregunta: «Pregunta 6 para la contadora»; a ella, «Respóndela»
  const numPregunta = id => D.PREGUNTAS.findIndex(q => q.id === id) + 1;
  const enlacePregunta = id => {
    const q = D.PREGUNTAS.find(x => x.id === id); if (!q || !puede('fiscal')) return '';
    const n = numPregunta(id); const resp = q.estado === 'respondida';
    const txt = esCecilia() ? (resp ? 'Ver tu respuesta (' + n + ')' : 'Respóndela') : (resp ? 'Ver la respuesta (pregunta ' + n + ')' : 'Pregunta ' + n + ' para la contadora');
    return `<button class="enlace duda-enlace" data-acc="ir-pregunta" data-arg="${id}"${esCecilia() && !resp ? ` aria-label="Responder la pregunta ${n}"` : ''}>${esc(txt)}${ic('derecha', 's')}</button>`;
  };
  // la etiqueta de la duda y su enlace; si ya la respondió, «Respondida» en verde
  const duda = id => { const q = D.PREGUNTAS.find(x => x.id === id); return (q && q.estado === 'respondida' ? tag('Respondida', 'ok') : tag(conCecilia(), 'aviso')) + ' ' + enlacePregunta(id); };
  // ir a la pregunta: la pantalla baja hasta ella y queda marcada; a quien responde, el cursor queda en su cuadro
  ACC['ir-pregunta'] = id => {
    A.ir('fiscal/preguntas'); const li = $('#pq-' + id); if (!li) return;
    li.classList.add('resaltada'); li.scrollIntoView({ block: 'center', behavior: suave() });
    const ta = $('#q-' + id); (ta || li).focus({ preventScroll: true });
  };

  /* ---------- 1. lo que vence ---------- */
  // lo que vence un día (las obligaciones, los permisos y los feriados), con el tono de cada cosa: la misma lista para el calendario y la hoja del día
  const DIAS_FIS = { 'oct-12': 'Feriado: Día de la Resistencia Indígena', 'oct-26': 'Feriado bancario: no abren los bancos' };
  const MES_N = { sep: 8, oct: 9, nov: 10 }, DOWL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'], MESL = { sep: 'septiembre', oct: 'octubre', nov: 'noviembre' };
  const largaFis = (n, mes) => DOWL[new Date(2026, MES_N[mes], n).getDay()] + ' ' + n + ' de ' + MESL[mes];
  const cosasDia = (n, mes) => {
    const out = [];
    D.OBLIGACIONES.forEach(o => { if (o.dia === n && (o.mes || 'oct') === mes) out.push({ tipo: 'obl', o, tono: hecha(o) ? 'ok' : o.faltan <= 1 ? 'aviso' : 'info', txt: o.corto, abrir: 'obligacion:' + o.id }); });
    D.PERMISOS_LIC.forEach(p => { if (mes === 'oct' && p.vence.startsWith(n + ' oct')) out.push({ tipo: 'permiso', p, tono: 'alerta', txt: 'Vence: ' + p.nombre.replace('Permiso de ', ''), abrir: 'permiso:' + p.id }); });
    if (DIAS_FIS[mes + '-' + n]) out.push({ tipo: 'feriado', tono: 'gris', txt: n === 12 ? 'Feriado' : 'Feriado bancario', largo: DIAS_FIS[mes + '-' + n] });
    return out;
  };
  const resumenFis = xs => { const ob = xs.filter(x => x.tipo === 'obl').length, pe = xs.filter(x => x.tipo === 'permiso').length, fe = xs.find(x => x.tipo === 'feriado');
    const t = [ob ? ob + (ob === 1 ? ' vencimiento' : ' vencimientos') : '', pe ? pe + (pe === 1 ? ' permiso que vence' : ' permisos que vencen') : '', fe ? fe.txt.toLowerCase() : ''].filter(Boolean); return t.length ? t.join(', ').replace(/, ([^,]*)$/, ' y $1') : 'nada vence'; };
  /* el calendario: en la computadora y el iPad cada vencimiento se toca y el número abre el día · en el teléfono toda la celda es un solo botón
     (48 × 56) que abre la hoja del día, y lo que vence se ve como marcas de color sólido que no se tocan (la lista de abajo también se toca) */
  function calendario() {
    const dias = []; for (let d = 28; d <= 30; d++) dias.push({ n: d, mes: 'sep' }); for (let d = 1; d <= 31; d++) dias.push({ n: d, mes: 'oct' }); dias.push({ n: 1, mes: 'nov' });
    const celda = d => {
      const xs = cosasDia(d.n, d.mes); const esHoy = d.mes === 'oct' && d.n === 5;
      const evs = xs.map(x => x.abrir ? `<button class="ev ${x.tono}" data-abrir="${x.abrir}" title="${esc(x.o ? x.o.corto : x.p.nombre)}">${esc(x.txt)}</button>` : `<span class="ev">${esc(x.txt)}</span>`).join('');
      const marcas = xs.length ? `<span class="marcas" aria-hidden="true">${xs.slice(0, 3).map(x => `<i class="marca-dia ${x.tono}"></i>`).join('')}</span>${xs.length > 3 ? `<small class="marcas-mas" aria-hidden="true">+${xs.length - 3}</small>` : ''}` : '';
      return `<div class="dia${d.mes !== 'oct' ? ' fuera' : ''}${esHoy ? ' hoy' : ''}"><button class="n" data-abrir="fiscaldia:${d.n}-${d.mes}" aria-label="${largaFis(d.n, d.mes)}${esHoy ? ', hoy' : ''}: ${resumenFis(xs)}"><span class="n-num">${d.n}</span></button>${marcas}${evs}</div>`;
    };
    return `<div class="cal fiscal-cal" role="group" aria-label="Octubre de 2026">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(x => `<div class="dsem" aria-hidden="true">${x}</div>`).join('')}
      ${dias.map(celda).join('')}</div>`;
  }
  // la hoja de un día del calendario fiscal: lo que vence ese día, con su estado y su monto, y los feriados
  FICHAS.fiscaldia = id => {
    const [n0, mes] = String(id).split('-'); const n = +n0; const xs = MES_N[mes] !== undefined && n ? cosasDia(n, mes) : [];
    const titulo = MES_N[mes] !== undefined && n ? largaFis(n, mes) : 'Día del calendario'; const fe = xs.find(x => x.tipo === 'feriado');
    const fila = x => x.tipo === 'obl' ? `<li><button class="fila" data-abrir="${x.abrir}"><span class="lead ${x.tono === 'aviso' ? 'aviso' : x.tono === 'ok' ? 'ok' : ''}">${ic('fiscal')}</span><span class="medio"><b>${esc(x.o.corto)}</b><small>${esc(x.o.ente)} · ${esc(x.o.resp)}</small></span><span class="fin-col">${estTag(x.o)}${x.o.monto ? `<span class="monto">${A.bs(x.o.monto, opObl(x.o))}</span>` : ''}</span></button></li>`
      : `<li><button class="fila" data-abrir="${x.abrir}"><span class="lead alerta">${ic('escudo')}</span><span class="medio"><b>${esc(x.p.nombre)}</b><small>${esc(x.p.ente)} · vence el ${esc(x.p.vence)}</small></span><span class="fin">${A.estadoTag(x.p.estado)}</span></button></li>`;
    const con = xs.filter(x => x.tipo !== 'feriado');
    return { titulo: titulo.charAt(0).toUpperCase() + titulo.slice(1), sub: 'Fiscal · lo que vence', mod: 'fiscal',
      bloques: [fe ? { html: `<p class="nota gris">${ic('calendario', 's')}<span>${esc(fe.largo)}.</span></p>` } : { oculto: true },
        { html: con.length ? `<ul class="lista">${con.map(fila).join('')}</ul>` : '<p class="muted">Nada vence este día.</p>' },
        { html: '<p class="muted">Cada monto sale de su hoja y es un estimado hasta declararlo.</p>' }] };
  };
  // en la lista, el monto (la cifra sola, que es la que se compara con su hoja) y debajo su ≈ $ a la tasa de hoy, «estimado» si todavía es un cálculo
  const montoLista = o => o.monto ? `<span class="muted num">${dinero(o.monto, 'bs')}</span>${A.equiv(o.monto, opObl(o))}` : '';
  function vence() {
    const prox = D.OBLIGACIONES.filter(o => !hecha(o)).sort((a, b) => a.faltan - b.faltan); const p0 = prox[0];
    const cuando = o => o.faltan === 0 ? 'hoy' : o.faltan === 1 ? 'mañana' : 'en ' + o.faltan + ' días';
    const tot = r2(prox.reduce((s, o) => s + (o.monto || 0), 0));
    return `<div class="cifras">
        ${A.cifra({ etq: 'Vence esta semana', valor: prox.filter(o => o.faltan <= 6).length, sub: p0 ? 'la primera, ' + cuando(p0) + ': ' + esc(p0.corto) : '', tono: 'aviso', abrir: p0 ? 'obligacion:' + p0.id : '' })}
        ${A.cifra({ etq: 'A pagar este mes (estimado)', valor: dinero(tot, 'bs', 0), sub: '≈ ' + dinero(tot / D.TASA.usd, 'usd', 0) + ' a la tasa de hoy · sin la 1.ª quincena de octubre', abrir: 'apagarmes:oct' })}
        ${A.cifra({ etq: 'Permisos por vencer', valor: D.PERMISOS_LIC.filter(p => p.estado === 'por_vencer').length, sub: 'bomberos el 21 de octubre', ir: 'fiscal/permisos', tono: 'aviso' })}
        ${A.cifra({ etq: 'Máquina fiscal', valor: 'Inspección vencida', sub: 'desde el 28 de septiembre', abrir: 'maquina:m1', tono: 'alerta' })}
      </div>
      <div class="rejilla"><div class="c7 pila"><div class="sec"><h2>Octubre de 2026</h2><span class="muted">Calendario de contribuyentes especiales · RIF terminado en 4</span></div>${calendario()}</div>
      <div class="c5 pila"><div class="sec"><h2>En orden de vencimiento</h2></div>
        <ul class="lista">${prox.map(o => `<li><button class="fila" data-abrir="obligacion:${o.id}"><span class="lead ${o.faltan <= 1 ? 'aviso' : ''}">${ic('fiscal')}</span><span class="medio"><b>${esc(o.corto)}</b><small>${esc(o.ente)} · ${esc(o.vence)} · ${esc(o.resp)}</small></span><span class="fin-col">${estTag(o)}${montoLista(o)}</span></button></li>`).join('')}</ul>
        <p class="muted">Cada monto sale de su hoja y es un estimado hasta declararlo. Cada obligación avisa por WhatsApp y en Pendientes a su responsable con días de anticipación. Si nadie la mueve en 2 días, sube a Alejandro.</p></div></div>`;
  }
  // lo que hay que pagar en el mes: cada obligación con su monto, en orden de vencimiento
  FICHAS.apagarmes = () => {
    const prox = D.OBLIGACIONES.filter(o => !hecha(o)).sort((a, b) => a.faltan - b.faltan); const con = prox.filter(o => o.monto); const tot = r2(con.reduce((s, o) => s + o.monto, 0));
    return { titulo: 'A pagar este mes (estimado)', sub: 'Fiscal · octubre', mod: 'fiscal',
      bloques: [{ html: `<ul class="lista">${con.map(o => `<li><button class="fila" data-abrir="obligacion:${o.id}"><span class="lead">${ic('fiscal')}</span><span class="medio"><b>${esc(o.corto)}</b><small>${esc(o.ente)} · vence ${esc(o.vence)}</small></span><span class="monto">${A.bs(o.monto, opObl(o))}</span></button></li>`).join('')}</ul><dl class="kv"><div class="total"><dt><b>Total</b></dt><dd>${A.bs(tot, { hoy: true, estimado: true })}</dd></div></dl>` },
        prox.some(o => !o.monto) ? { html: `<p class="muted">No entran ${esc(prox.filter(o => !o.monto).map(o => o.corto + (o.sinPago ? ', que solo se declara' : ', que se calcula al cerrar la quincena')).join(', ni '))}.</p>` } : { oculto: true }] };
  };

  /* ---------- la ficha de cada obligación ---------- */
  // dónde se prepara cada una (el IVA, en su hoja; los aportes y la patente, en Nómina, IGTF y patente; el RNET, en la nómina) · el aseo no se prepara
  // (la 1.ª quincena de octubre, o7, todavía no tiene hoja: se abre el 16 de octubre, con los Z de esa quincena)
  const DONDE = { o1: ['fiscal/iva', 'Hoja de IVA'], o2: ['fiscal/retenciones', 'Retenciones'], o3: ['fiscal/parafiscales', 'Nómina, IGTF y patente'], o4: ['fiscal/parafiscales', 'Nómina, IGTF y patente'],
    o5: ['fiscal/parafiscales', 'Nómina, IGTF y patente'], o6: ['fiscal/parafiscales', 'Nómina, IGTF y patente'], o8: ['fiscal/parafiscales', 'Nómina, IGTF y patente'], o11: ['nomina/corridas', 'Nómina'] };
  // de dónde sale el monto: la base de cada aporte, la patente, el aseo y la planilla de IVA (el resumen; la lista completa se abre desde el monto)
  function origen(o) {
    const p = D.PARAFISCALES.find(x => x.id === o.id);
    if (p) return { titulo: 'De dónde sale', filas: [{ l: 'Base de ' + p.periodo + ' (Bs)', v: A.bs(p.base, { usd: baseUsd(p) }) }, { l: 'Qué entra', v: esc(p.que), largo: true }, ...(p.piso ? [{ l: 'Piso: ' + NF.personas + ' × ' + dinero(NF.pisoUsd, 'usd', 0), v: A.bs(p.piso, { tasa: NF.tasaPago }) + ` <small class="tenue">a ${dinero(NF.tasaPago, 'bs')}</small>` }] : []), { l: 'Aporte', v: fmt(p.pct, p.pct % 1 ? 1 : 0) + ' % de la base' }, { l: 'Quién lo pone', v: esc(p.parte), largo: true }, ...(p.nota ? [p.pregunta ? { l: 'Base exacta', v: duda(p.pregunta) } : { l: 'Por confirmar', v: tag(paraCecilia(p.nota), 'aviso') }] : [])] };
    if (o.id === 'o6') { const P = vistaPatente(); return { titulo: 'De dónde sale', filas: [{ l: 'Ventas de ' + P.mes + ' (libro de ventas, sin IVA)', v: A.bs(P.ventas, { usd: P.ventasUsd }) }, { l: P.pct + ' % de las ventas', v: A.bs(P.cuatro, { hoy: true }) }, { l: 'Mínimo: ' + P.minimoEur + ' veces el euro BCV', v: A.bs(P.minimo, { hoy: true }) }, { l: 'Se paga el mayor', v: A.bs(o.monto, opObl(o)) }] }; }
    if (o.id === 'o7') return { html: '<p class="muted">Su hoja se abre el 16 de octubre, con los Z de esa quincena. Hasta entonces no hay nada que preparar.</p>' };
    if (o.id === 'o12') return { titulo: 'De dónde sale', filas: [{ l: 'Tarifa del IMA', v: dinero(D.ASEO.eur, 'eur', 0) + ' al mes (sale de los m² del local y del tipo de actividad)', largo: true }, { l: 'Euro BCV de hoy', v: dinero(D.TASA.eur, 'bs') }] };
    if (o.id === 'o11') return { html: `<p class="muted">Se declara en el portal del Ministerio del Trabajo la nómina formal del trimestre: personas, salarios y horas. La prepara ${esc(o.resp)} y la revisa ${esc(revisorDe(o))}, que ven los sueldos; ${aCecilia('tú ves', 'Cecilia ve')} la nómina agrupada.</p>` };
    if (o.id === 'o2') { const rs = D.RET_EMITIDAS.filter(r => r.tipo.startsWith('ISLR') && r.periodo === '2026-09'); return { titulo: 'De dónde sale', filas: rs.map(r => ({ l: r.comp + ' · ' + prov(r.prov), v: A.bs(r.monto, { tasa: r.tasa }) + ` <small class="tenue">${fmt(r.pctRet, 0)} % de ${dinero(r.base, 'bs')}</small>` })).concat([{ l: 'Total de septiembre', v: A.bs(o.monto, opObl(o)) }]) }; }
    if (o.id === 'o1') { const v = vistaIva(); return { titulo: 'De dónde sale', filas: [{ l: 'IVA a pagar', v: A.bs(v.iva, { hoy: true }) }, { l: 'IGTF cobrado en divisas', v: A.bs(v.igtf, { usd: v.igtfUsd }) }, { l: 'Anticipo de ISLR', v: A.bs(v.anticipo, { hoy: true }) }, { l: 'Retenciones de IVA a proveedores', v: A.bs(v.retProv, { usd: v.retProvUsd }) }, { l: 'Total de la planilla', v: A.bs(o.monto, opObl(o)) }] }; }
    if (o.id === 'o9') { const Q = D.IVA_Q1, t = { tasa: D.tasaDel(o.pagadaEl) }; return { titulo: 'De dónde sale', filas: [{ l: 'IVA pagado', v: A.bs(Q.iva, t) }, { l: 'IGTF cobrado en divisas', v: A.bs(Q.igtf, t) }, { l: 'Anticipo de ISLR', v: A.bs(Q.anticipo, t) }, { l: 'Retenciones de IVA a proveedores', v: A.bs(Q.retProv, t) }, { l: 'Total de la planilla', v: A.bs(o.monto, t) }] }; }
    return { oculto: true };
  }
  // las ventas del mes en $: cada Z y cada factura a su tasa (con eso se calcula la patente)
  const ventasUsd = () => r2(usdDocs(zHay(), 'base') + usdDocs(zHay(), 'exento') + usdDocs(D.VENTAS_EMPRESAS, 'base'));
  // el certificado de la declaración y el comprobante del pago: subidos (se abren) o por subir; también quedan en Documentos › Fiscal
  function soportesDe(o) {
    const ya = o.estado === 'declarada' || o.estado === 'pagada'; if (!ya) return { oculto: true };
    const s = o.soportes; const ed = puede('fiscal', 'editar');
    const pieza = (k, subir, que) => s[k] ? `<div class="adjuntos"><button class="adjunto" data-acc="ver-archivo" data-arg="${esc(s[k])}">${ic('archivo', 's')}<span>${esc(s[k])}</span></button></div>`
      : ed ? `<label class="soltar" for="sop-${o.id}-${k}">${ic('subir')}<span><b>${esc(subir)}</b>${esc(que)}</span></label><input id="sop-${o.id}-${k}" data-sop="${o.id}|${k}" type="file" accept="application/pdf" class="sr-only">`
      : `<p class="muted">Falta ${esc(que.charAt(0).toLowerCase() + que.slice(1).replace(/\.$/, ''))}: lo sube ${esc(o.resp)}.</p>`;
    const items = [];
    if (!o.soloPago) items.push(pieza('cert', 'Subir el certificado (PDF)', 'El que da el portal al declarar.'));
    if (o.estado === 'pagada' && !o.sinPago) items.push(pieza('pago', 'Subir el comprobante de pago (PDF)', 'El del banco, con su referencia.'));
    return { titulo: 'Soportes', html: `<div class="pila soportes">${items.join('')}</div>` };
  }
  FICHAS.obligacion = id => {
    const o = obl(id);
    const paso = o.paso, listo = hecha(o);
    const acc = [];
    const donde = !listo && DONDE[o.id];
    if (donde && puede(donde[0].split('/')[0])) acc.push({ txt: 'Dónde se prepara: ' + donde[1], acc: 'ir-a', arg: donde[0], icono: 'derecha' });
    if (o.soloPago) { if (!listo) acc.push({ txt: 'Registrar el pago', acc: 'obl-paso', arg: o.id + '|pagada', icono: 'check', tono: 'pri', solo: 'editar', plata: true }); }
    else {
      if (o.estado === 'preparar' || o.estado === 'abierta') acc.push({ txt: 'Lista: pasar a revisión', acc: 'obl-paso', arg: o.id + '|revision', icono: 'enviar', tono: 'pri', solo: 'editar' });
      if (o.estado === 'revision' && puedeRevisar(o)) acc.push({ txt: 'Revisado: lista para declarar', acc: 'obl-paso', arg: o.id + '|lista', icono: 'check', tono: 'pri', solo: 'editar' });
      if (o.estado === 'lista') acc.push({ txt: 'Registrar lo declarado', acc: 'obl-declarar', arg: o.id, icono: 'subir', tono: 'pri', solo: 'editar' });
      if (o.estado === 'declarada' && !o.sinPago) acc.push({ txt: 'Registrar el pago', acc: 'obl-paso', arg: o.id + '|pagada', icono: 'check', tono: 'pri', solo: 'editar', plata: true });
    }
    // el monto sale de su hoja, nunca se escribe aparte: se toca para abrir la lista que lo suma
    const monto = o.sinPago ? { l: 'Monto (Bs)', v: 'No lleva pago: solo se declara' }
      : o.monto == null ? { l: 'Monto (Bs)', v: 'Se calcula al cerrar la quincena' }
      : { l: 'Monto (Bs)', v: `<span class="doble"><button class="enlace monto-enlace" data-abrir="oblsuma:${o.id}" aria-label="${esc(dinero(o.monto, 'bs'))}: ver lo que lo suma">${dinero(o.monto, 'bs')}${ic('derecha', 's')}</button>${A.equiv(o.monto, opObl(o))}<small class="equiv">${o.estado === 'pagada' ? 'pagado el ' + esc(o.pagadaEl || '') : estimado(o) ? 'sale de su hoja: toca el monto para ver lo que lo suma' : 'el de la planilla declarada'}</small></span>` };
    const rojas = o.id === 'o1' && !listo && o.estado !== 'declarada' ? revisionIva().rojas : [];
    const espera = o.estado === 'revision' && !puedeRevisar(o) ? `<p class="nota aviso">${ic('reloj', 's')}<span>Esperando la revisión de ${esc(revisorDe(o))}.</span></p>` : '';
    const sust = notaCambio(o.id === 'o1' ? cambioIva() : o.id === 'o6' ? cambioPatente() : null);
    return {
      titulo: o.corto, sub: esc(o.ente) + ' · período ' + esc(o.periodo), mod: 'fiscal', obj: o, registro: o.corto, aviso: avisoRojas(rojas, false) + espera + sust,
      tags: [[estTag(o).replace(/<[^>]+>/g, ''), o.soloPago && !listo ? '' : tonoObl(o.estado)], [o.faltan < 0 ? 'Venció ' + o.vence : o.faltan === 0 ? 'Vence hoy' : o.faltan === 1 ? 'Vence mañana' : 'Faltan ' + o.faltan + ' días', o.faltan <= 1 && !listo ? 'alerta' : '']],
      bloques: [
        { html: `<ol class="pasos">${pasosDe(o).map((p, i) => `<li class="${i < paso ? 'hecho' : i === paso ? 'actual' : ''}">${esc(p)}</li>`).join('')}</ol>` },
        { titulo: 'Datos', filas: [{ l: 'Qué es', v: esc(o.nombre), largo: true }, { l: 'Vence', v: esc(o.vence) }, { l: 'Responsable', v: esc(o.resp), campo: { k: 'resp', tipo: 'select', opciones: ['Cecilia', 'Jose', 'Alejandro'] } }, monto].concat(o.soloPago ? [] : [{ l: 'N.º de planilla', v: o.planilla ? `<span class="mono">${esc(o.planilla)}</span>` : '—', campo: { k: 'planilla', tipo: 'texto' } }]) },
        origen(o),
        soportesDe(o),
        { html: o.soloPago ? '<p class="muted">Se paga con la factura del mes y se sube el comprobante. Lo pagado ya no se edita.</p>' : `<p class="muted">${o.sinPago ? 'Quien prepara y quien revisa son personas distintas.' : 'Quien prepara, quien revisa y quien aprueba el pago son personas distintas.'} Lo declarado ya no se edita: se corrige con una declaración sustitutiva.</p>` },
      ],
      // lo declarado o pagado ya no se edita: se corrige con una sustitutiva
      bloqueada: listo || o.estado === 'declarada', bloqueo: o.soloPago ? 'Está pagada: ya no se edita.' : 'Está ' + (o.estado === 'pagada' ? 'pagada' : 'declarada') + ': ya no se edita. Se corrige con una declaración sustitutiva.', acciones: acc,
    };
  };
  // la lista que suma el monto de cada obligación: cada línea con su cifra y, si tiene, su ficha
  // [texto, detalle, monto en Bs, opciones del ≈ $, abrir o ir] · los grupos se suman uno debajo del otro
  const L = (t, s, m, op, a) => ({ t, s, m, op, a });
  function sumaDe(o) {
    const corr = id => 'corrida:' + id; const t = o.pagadaEl ? { tasa: D.tasaDel(o.pagadaEl) } : null;
    if (o.id === 'o1') {
      const v = vistaIva();
      return { grupos: [
        { titulo: 'Débito (las ventas)', filas: [L('Ventas a consumidor final', v.zN + ' de 15 Z de la quincena', v.debitos[0][2], { usd: v.usdDeb[0][1] }, 'abrir:ivalinea:z'), L('Facturas a empresas', v.empN + ' con RIF', v.debitos[1][2], { usd: v.usdDeb[1][1] }, 'abrir:ivalinea:emp'), L('Alícuota adicional 31 %', 'va en cero', 0, {}, 'abrir:ivalinea:adic')] },
        { titulo: 'Lo que se resta', filas: [L('Crédito de las compras', Math.abs(v.credito - v.libro) > 0.005 ? 'escrito a mano: el libro dice ' + dinero(v.libro, 'bs') : 'el IVA del libro de compras', -v.credito, { usd: v.credUsd === null ? null : -v.credUsd }, 'ir:fiscal/compras'), L('Excedente de la quincena anterior', 'no quedó', -v.excedente, {}, '')]
          .concat(v.marcadas.map(r => L('Retención de ' + r.cliente, 'comp. ' + r.comp.slice(-6) + (v.retSobra > 0 ? ' · no se usa toda' : ''), -r.monto, { tasa: r.tasa }, 'abrir:retrec:' + r.id)))
          .concat(v.retSobra > 0 ? [L('Retenciones que pasan a la próxima', 'el IVA ya llegó a cero', v.retSobra, { hoy: true }, '')] : []).concat(v.excCredito > 0 ? [L('Crédito que pasa a la próxima', 'el IVA ya llegó a cero', v.excCredito, { hoy: true }, '')] : []),
          sub: ['IVA a pagar', v.iva, { hoy: true }] },
        { titulo: 'En la misma planilla', filas: [L('IGTF cobrado en divisas', 'sale de los Z', v.igtf, { usd: v.igtfUsd }, 'ir:fiscal/z'), L('Anticipo de ISLR', '1 % de los ingresos de la quincena', v.anticipo, { hoy: true }, '')]
          .concat(v.rp.map(r => L('Retención a ' + prov(r.prov), (r.comp || 'por emitir') + ' · ' + r.fecha, r.monto, { tasa: r.tasa }, 'abrir:retemi:' + r.id))) }],
        total: 'Total de la planilla', nota: declaradaConFoto(o) ? 'Son las cifras de la planilla declarada.' : '' };
    }
    if (o.id === 'o9') { const Q = D.IVA_Q1; return { grupos: [{ filas: [L('Débito de las ventas', Q.zetas + ' de 15 Z · 1 al 15 sep', pctBs(Q.ventas, 16), t, 'ir:fiscal/z'), L('Crédito de las compras', 'del libro de compras', -Q.credito, t, ''), L('IGTF cobrado en divisas', 'sale de los Z', Q.igtf, t, ''), L('Anticipo de ISLR', '1 % de los ingresos', Q.anticipo, t, ''), L('Retenciones de IVA a proveedores', '75 % del crédito', Q.retProv, t, '')] }], total: 'Total de la planilla' }; }
    if (o.id === 'o2') return { grupos: [{ filas: D.RET_EMITIDAS.filter(r => r.tipo.startsWith('ISLR') && r.periodo === '2026-09').map(r => L(prov(r.prov), r.comp + ' · ' + fmt(r.pctRet, 0) + ' % de ' + dinero(r.base, 'bs'), r.monto, { tasa: r.tasa }, 'abrir:retemi:' + r.id)) }], total: 'Retenciones de ISLR de septiembre' };
    const quincena = (fecha, tasa, id) => L('Quincena del ' + fecha, NF.personas + ' personas · ' + dinero(NF.quincenaUsd, 'usd', 0) + ' a ' + dinero(tasa, 'bs'), r2(NF.quincenaUsd * tasa), { tasa }, id ? 'abrir:' + corr(id) : '');
    const minimo = (fecha, tasa, id) => L('Mínimo de la quincena del ' + fecha, NF.personas + ' × ' + dinero(NF.minimo / 2, 'bs', 0), NF.minimo * NF.personas / 2, { tasa }, id ? 'abrir:' + corr(id) : '');
    const diez = (m, id) => L('10 % de ' + ({ jul: 'julio', ago: 'agosto', sep: 'septiembre' }[m]) + ' (nómina formal)', dinero(NF.diezEur[m][0], 'eur') + ' a ' + dinero(NF.diezEur[m][1], 'bs'), diezBs(m), { usd: diezUsd(m) }, id ? 'abrir:' + corr(id) : '');
    const p = D.PARAFISCALES.find(x => x.id === o.id);
    if (o.id === 'o4') return { grupos: [{ filas: [minimo('15 sep', 589.12, 'n2f'), minimo('30 sep', 604.95, 'n1f')], sub: ['Base: salario mínimo de septiembre', p.base, { usd: baseUsd(p) }] }], por: p.pct, total: 'IVSS y paro forzoso', nota: 'El negocio pone el 12 % (' + dinero(pctBs(p.base, 12), 'bs') + ') y al trabajador se le descuenta el 4,5 % (' + dinero(pctBs(p.base, 4.5), 'bs') + ') en su recibo.' };
    if (o.id === 'o5') { const normal = r2(NF.sep.minimo + NF.sep.diez); return { grupos: [{ filas: [minimo('15 sep', 589.12, 'n2f'), minimo('30 sep', 604.95, 'n1f'), diez('sep', 'n1d')], sub: ['Salario normal', normal, { usd: r2(minUsd('sep') + diezUsd('sep')) }] }, { filas: [L('Parte del bono vacacional', '15 días de 360', r2(normal * 15 / 360), { usd: r2((minUsd('sep') + diezUsd('sep')) * 15 / 360) }, ''), L('Parte de las utilidades', '30 días de 360', r2(normal * 30 / 360), { usd: r2((minUsd('sep') + diezUsd('sep')) * 30 / 360) }, '')], sub: ['Base: salario integral', p.base, { usd: baseUsd(p) }] }], por: p.pct, total: 'FAOV' }; }
    if (o.id === 'o3') return { grupos: [{ filas: [minimo('15 jul', 512.30), minimo('31 jul', 531.75), diez('jul'), minimo('15 ago', 548.60), minimo('31 ago', 566.20, 'n3f'), diez('ago', 'n3d'), minimo('15 sep', 589.12, 'n2f'), minimo('30 sep', 604.95, 'n1f'), diez('sep', 'n1d')], sub: ['Base: salario normal del trimestre', p.base, { usd: baseUsd(p) }] }], por: p.pct, total: 'INCES del 3.er trimestre' };
    if (o.id === 'o8') return { grupos: [{ filas: [quincena('15 sep', 589.12, 'n2f'), quincena('30 sep', 604.95, 'n1f'), diez('sep', 'n1d')], sub: ['Todo lo pagado en septiembre', r2(NF.sep.minimo + NF.sep.incremento + NF.sep.diez), { usd: r2(NF.quincenaUsd * 2 + diezUsd('sep')) }] },
      { filas: [L('Piso: ' + NF.personas + ' × ' + dinero(NF.pisoUsd, 'usd', 0), 'a ' + dinero(NF.tasaPago, 'bs'), p.piso, { tasa: NF.tasaPago }, '')], sub: ['Base: el mayor de los dos', p.base, { usd: baseUsd(p) }] }], por: p.pct, total: 'Pensiones de septiembre' };
    if (o.id === 'o10') { const base = r2(NF.quincenaUsd * 548.60 + NF.quincenaUsd * 566.20 + diezBs('ago')); return { grupos: [{ filas: [quincena('15 ago', 548.60), quincena('31 ago', 566.20, 'n3f'), diez('ago', 'n3d')], sub: ['Base: todo lo pagado en agosto', base, { usd: r2(NF.quincenaUsd * 2 + diezUsd('ago')) }] }], por: 9, total: 'Pensiones de agosto' }; }
    if (o.id === 'o6') { const P = vistaPatente();
      return { grupos: [{ filas: [L('Consumidor final, 1.ª quincena', P.q1.n + ' de 15 Z', P.q1.base, { usd: P.q1.usd }, 'ir:fiscal/z'), L('Consumidor final, 2.ª quincena', P.q2.n + ' de 15 Z', P.q2.base, { usd: P.q2.usd }, 'abrir:ivalinea:z'), L('Facturas a empresas', P.empN + ' con RIF', P.empresas, { usd: P.empUsd }, 'abrir:ivalinea:emp'), L('Exento', 'de los Z', P.exento, { usd: P.exentoUsd }, '')],
        sub: ['Ventas del mes, sin IVA', P.ventas, { usd: P.ventasUsd }] }, { filas: [L(P.pct + ' % de las ventas', '', P.cuatro, { hoy: true }, ''), L('Mínimo: ' + P.minimoEur + ' veces el euro BCV', dinero(P.minimoEur, 'eur', 0) + ' × ' + dinero(D.TASA.eur, 'bs'), P.minimo, { hoy: true }, '')] }], total: 'Se paga el mayor', nota: declaradaConFoto(o) ? 'Son las cifras de lo declarado.' : '' }; }
    if (o.id === 'o12') return { grupos: [{ filas: [L('Tarifa del IMA', dinero(D.ASEO.eur, 'eur', 0) + ' × el euro BCV de hoy (' + dinero(D.TASA.eur, 'bs') + ')', o.monto, { hoy: true }, '')] }], total: 'Aseo de octubre' };
    return null;
  }
  FICHAS.oblsuma = id => {
    const o = obl(id); const s = o.monto == null ? null : sumaDe(o);
    const base = { titulo: 'Lo que suma ' + o.corto, sub: 'Fiscal · ' + esc(o.ente), mod: 'fiscal' };
    if (!s) return { ...base, bloques: [{ html: `<p class="muted">${o.sinPago ? 'No lleva pago: solo se declara.' : 'Todavía no hay nada que sumar: se calcula al cerrar la quincena.'}</p>` }] };
    const fila = x => { const [k, ...r] = (x.a || '').split(':'); const dst = r.join(':'); const attr = k === 'abrir' ? `data-abrir="${dst}"` : k === 'ir' ? `data-ir="${dst}"` : '';
      const dentro = `<span class="medio"><b>${esc(x.t)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ''}</span><span class="monto">${A.bs(x.m, x.op)}</span>`;
      return `<li>${attr ? `<button class="fila" ${attr}>${dentro}</button>` : `<div class="fila">${dentro}</div>`}</li>`; };
    const grupos = s.grupos.map(g => `${g.titulo ? `<p class="etq">${esc(g.titulo)}</p>` : ''}<ul class="lista">${g.filas.map(fila).join('')}</ul>${g.sub ? `<dl class="kv"><div class="total"><dt><b>${esc(g.sub[0])}</b></dt><dd>${A.bs(g.sub[1], g.sub[2])}</dd></div></dl>` : ''}`).join('');
    const final = `<dl class="kv">${s.por ? `<div><dt>× ${fmt(s.por, s.por % 1 ? 1 : 0)} %</dt><dd></dd></div>` : ''}<div class="total"><dt><b>= ${esc(s.total)}</b></dt><dd>${A.bs(o.monto, opObl(o))}</dd></div></dl>${s.nota ? `<p class="muted">${esc(s.nota)}</p>` : ''}`;
    return { ...base, tags: [[estimado(o) ? 'Estimado' : o.estado === 'pagada' ? 'Pagado' : 'Declarado', estimado(o) ? 'aviso' : 'info']], aviso: notaCambio(o.id === 'o1' ? cambioIva() : o.id === 'o6' ? cambioPatente() : null),
      bloques: [{ html: `<div class="pila suma">${grupos}${final}</div>` },
        { html: `<p class="muted">${estimado(o) ? 'Es el mismo monto de «Lo que vence» y de su hoja: si cambia algo de lo de arriba, cambia en los tres lados. Queda fijo al declararse.' : 'Es el monto de la planilla declarada: ya no cambia.'} Debajo de cada cifra, su equivalente en dólares: los documentos a la tasa de su día; lo que falta pagar, a la de hoy.</p>` }],
      acciones: DONDE[o.id] && !hecha(o) && puede(DONDE[o.id][0].split('/')[0]) ? [{ txt: 'Dónde se prepara: ' + DONDE[o.id][1], acc: 'ir-a', arg: DONDE[o.id][0], icono: 'derecha' }] : [] };
  };
  // el aviso de cada paso usa el verbo del botón
  const AVISO_PASO = { revision: o => 'Pasada a revisión. Le avisamos a ' + revisorDe(o) + '.', lista: o => 'Revisada: lista para declarar. Le avisamos a ' + o.resp + '.', declarada: () => 'Declarada.', pagada: () => 'Pago registrado.' };
  // registrar el pago mueve plata: un aprendiz lo manda a aprobar (hasta entonces sigue «Declarada»; al aprobarlo queda pagada)
  A.EJECUTA['obl-pagar'] = id => { const o = obl(id); if (!o || hecha(o)) return; const antes = estTag(o).replace(/<[^>]+>/g, ''); o.estado = 'pagada'; o.paso = 4; if (!o.pagadaEl) o.pagadaEl = '5 oct'; A.auditar({ modulo: 'Fiscal', registro: o.corto, campo: 'estado', antes, despues: 'Pagada' }); };
  ACC['obl-paso'] = arg => {
    const [id, est] = arg.split('|'); const o = obl(id);
    if (est === 'lista' && S.usuario.nombre === o.resp) return A.aviso('La revisa otra persona, no quien la preparó.', 'info');
    if (est === 'lista' && !puedeRevisar(o)) return A.aviso('La revisa ' + revisorDe(o) + '.', 'info');
    const rg = est === 'pagada' ? A.regla({ mod: 'fiscal', plata: true }) : null;
    if (rg && rg.modo === 'aprobar') {
      A.confirmar({ titulo: 'Enviar para aprobar', texto: `Registrar el pago de ${esc(o.corto)}${o.monto ? ' · ' + dinero(o.monto, 'bs') : ''}. Lo aprueba ${esc(rg.quien)}: hasta entonces sigue «${esc(estTag(o).replace(/<[^>]+>/g, ''))}».`, boton: 'Enviar para aprobar' }).then(() => {
        A.proponer({ clave: 'obligacion:' + id, titulo: 'Registrar el pago de ' + o.corto, registro: o.corto, modulo: 'Fiscal', r: rg, accion: { nombre: 'obl-pagar', arg: id, campo: 'pago', txt: 'Registrar el pago de ' + o.corto + (o.monto ? ' · ' + dinero(o.monto, 'bs') : '') } });
        A.pintarFicha(); A.pintarPagina(); A.aviso('Enviado para aprobar. Le llegó a ' + rg.quien + '.');
      }).catch(() => {});
      return;
    }
    const txt = () => estTag(o).replace(/<[^>]+>/g, '');
    const hacer = (motivo = '') => {
      const antes = txt(); o.estado = est; o.paso = { revision: 1, lista: 2, declarada: 3, pagada: 4 }[est];
      if (est === 'pagada' && !o.pagadaEl) o.pagadaEl = '5 oct';
      A.auditar({ modulo: 'Fiscal', registro: o.corto, campo: 'estado', antes, despues: txt(), motivo });
      A.pintarFicha(); A.pintarPagina(); A.aviso(AVISO_PASO[est](o) + (motivo ? ' El motivo quedó en el registro de cambios.' : ''));
    };
    // con algo en rojo, «Revisado» pide un motivo escrito, sin bloquear: el IVA se declara a tiempo igual
    const rojas = est === 'lista' && o.id === 'o1' ? revisionIva().rojas : [];
    if (!rojas.length) { hacer(); return; }
    A.pedirMotivo({ titulo: 'Revisado con algo en rojo', texto: `<p><b>${esc(rojas.map(x => x.t + (x.s ? ' ' + x.s : '')).join(' · '))}.</b></p><p>El IVA se declara a tiempo igual. Escribe por qué se sigue: queda en el registro de cambios.</p>`, etiqueta: 'Por qué se sigue', boton: 'Revisado: lista para declarar' })
      .then(m => hacer(rojasTxt(rojas) + ': ' + m)).catch(() => {});
  };
  // registrar lo declarado: el número de la planilla y, si hay algo en rojo, por qué se declara igual · el monto es el de su hoja, no se escribe
  ACC['obl-declarar'] = id => {
    const o = obl(id); const rojas = o.id === 'o1' ? revisionIva().rojas : []; const env = $('#modal-raiz');
    A.modal(`<h2 id="modal-t">Registrar lo declarado</h2>
      <div class="muted" id="modal-d"><p>${esc(o.corto)}${o.sinPago ? ' · no lleva pago' : ' · ' + dinero(o.monto, 'bs') + ', el total de su hoja'}. Queda bloqueada: para corregirla, una declaración sustitutiva.</p></div>
      ${rojas.length ? `<p class="nota alerta">${ic('alerta', 's')}<span><b>${esc(rojas.map(x => x.t + (x.s ? ' ' + x.s : '')).join(' · '))}.</b> Se declara a tiempo igual: escribe por qué.</span></p>` : ''}
      <label class="campo" for="dec-planilla"><span>N.º de planilla del portal</span><input id="dec-planilla" autocomplete="off"><small class="ayuda" id="dec-msg-p"></small></label>
      ${rojas.length ? '<label class="campo" for="dec-motivo"><span>Por qué se declara así</span><textarea id="dec-motivo" placeholder="Escribe por qué. Queda en el registro de cambios."></textarea><small class="ayuda" id="dec-msg-m"></small></label>' : ''}
      <p class="muted">El certificado (PDF) lo subes después en Soportes, en esta misma ficha.</p>
      <div class="modal-acc"><button class="btn sec" data-dec="no">Cancelar</button><button class="btn pri" data-dec="si">${ic('subir', 's')}Registrar lo declarado</button></div>`, 'teclado');
    $('#dec-planilla').focus();
    const marca = (inp, msg, txt) => { inp.closest('.campo').classList.toggle('error', !!txt); $(msg).textContent = txt; };
    env.onclick = e => {
      const b = e.target.closest('[data-dec]'); if (!b) return;
      if (b.dataset.dec === 'no') { A.cerrarModal(); return; }
      const pi = $('#dec-planilla'), mi = $('#dec-motivo'); const pl = pi.value.trim(), mo = mi ? mi.value.trim() : '';
      marca(pi, '#dec-msg-p', pl.length < 4 ? 'Escribe el número de la planilla: sale en el portal al declarar.' : '');
      if (mi) marca(mi, '#dec-msg-m', mo.length < 4 ? 'Escribe por qué: sin el motivo no se registra.' : '');
      if (pl.length < 4) { pi.focus(); return; } if (mi && mo.length < 4) { mi.focus(); return; }
      A.cerrarModal();
      const antes = estTag(o).replace(/<[^>]+>/g, '');
      // la foto de la hoja tal como se declaró (los Z que entraron, el crédito, las retenciones…): desde ahora se dibuja desde aquí
      if (o.id === 'o1') { o.foto = fotoIva(); o.monto = o.foto.total; } if (o.id === 'o6') { o.foto = fotoPatente(); o.monto = o.foto.monto; }
      o.planilla = pl; o.estado = 'declarada'; o.paso = 3; if (mo) o.declaradaCon = rojasTxt(rojas) + ': ' + mo;
      A.auditar({ modulo: 'Fiscal', registro: o.corto, campo: 'estado', antes, despues: 'declarada', motivo: 'Planilla ' + pl + (mo ? ' · ' + rojasTxt(rojas) + ': ' + mo : '') });
      A.pintarFicha(); A.pintarPagina(); A.aviso(o.sinPago ? 'Declaración registrada. Esta no lleva pago.' : 'Declaración registrada. Falta registrar el pago.');
    };
  };
  // subir un soporte (el certificado o el comprobante del pago): queda en la ficha y en Documentos › Fiscal, y en el registro de cambios
  document.addEventListener('change', e => {
    const el = e.target; if (!el.matches || !el.matches('#ficha-raiz [data-sop]') || !el.files || !el.files.length) return;
    const [id, k] = el.dataset.sop.split('|'); const o = obl(id); const f = el.files[0];
    o.soportes[k] = f.name;
    D.ARCHIVOS.unshift({ id: 'a' + Date.now(), carpeta: 'fiscal', nombre: f.name, fecha: '5 oct 2026', vence: '—', vinculo: o.corto + (k === 'cert' ? ' · certificado' : ' · comprobante de pago'), abrir: 'obligacion:' + o.id, version: 1 });
    sumarArchivo();
    A.auditar({ modulo: 'Fiscal', registro: o.corto, campo: k === 'cert' ? 'certificado' : 'comprobante de pago', antes: 'falta', despues: f.name });
    A.pintarFicha(); A.aviso((k === 'cert' ? 'Certificado subido' : 'Comprobante de pago subido') + '. También quedó en Documentos › Fiscal.');
  });

  /* ---------- 2. hoja de IVA ---------- */
  // declarada, la hoja se dibuja desde la foto de lo declarado (v): si después llega un Z, lo dice arriba y la hoja sigue con lo declarado
  function hojaIva() {
    const H = D.IVA_HOJA; const o = obl('o1');
    const v = vistaIva(); const R = revisionIva(); const ch = cambioIva();
    const editable = puede('fiscal', 'editar') && o.estado !== 'pagada' && o.estado !== 'declarada';
    const porDecl = o.estado === 'revision' || o.estado === 'lista' || o.estado === 'preparar';
    const usdDebTot = r2(v.usdDeb[0][1] + v.usdDeb[1][1]);
    return `<div class="rejilla"><div class="c7 pila">
      <article class="hoja"><div class="hoja-cab"><h2>${ic('fiscal')}IVA · ${esc(H.periodo)}</h2>${o.estado === 'declarada' || o.estado === 'pagada' ? A.sello(o.estado === 'pagada' ? 'Pagada' : 'Declarada') : A.estadoTag(o.estado)}</div>
        ${notaCambio(ch)}
        <ol class="pasos">${pasosDe(o).map((p, i) => `<li class="${i < o.paso ? 'hecho' : i === o.paso ? 'actual' : ''}">${esc(p)}</li>`).join('')}</ol>
        ${porDecl ? antesDeDeclarar() : ''}
        <p class="muted">Vence el ${esc(H.vence)}. La app propone las cifras; ${aCecilia('tú las revisas, corriges lo que haga falta y registras lo que declaraste en el portal', 'la contadora las revisa, corrige lo que haga falta y registra lo que declaró en el portal')}.</p></article>
      <article class="hoja plana"><div class="tabla-env"><table class="t"><thead><tr><th>Débito fiscal (ventas)</th><th class="r plata">Base (Bs)</th><th class="r plata">IVA (Bs)</th></tr></thead><tbody>
        ${v.debitos.map((d, i) => `<tr data-abrir="${['ivalinea:z', 'ivalinea:emp', 'ivalinea:adic'][i]}" tabindex="0"><td>${esc(d[0])}</td><td class="r plata">${A.bs(d[1], { usd: v.usdDeb[i][0] })}</td><td class="r plata">${A.bs(d[2], { usd: v.usdDeb[i][1] })}</td></tr>`).join('')}
        </tbody><tfoot><tr><td>Total débito</td><td class="r plata"></td><td class="r plata">${A.bs(v.deb, { usd: usdDebTot })}</td></tr></tfoot></table></div></article>
      <article class="hoja"><h2>Lo que se resta</h2>
        ${editable ? `<label class="campo" for="iva-credito"><span>Crédito fiscal de las compras (Bs)</span><input id="iva-credito" inputmode="decimal" value="${fmt(F.credito)}" aria-describedby="iva-credito-ayuda"><small class="ayuda" id="iva-credito-ayuda">${v.credUsd !== null ? '≈ ' + dinero(v.credUsd, 'usd') + ' a la tasa de cada factura. ' : ''}${aCecilia('Por ahora lo escribes tú desde tu Excel', 'Por ahora lo escribe la contadora desde su Excel')}; más adelante la app lo arma sola desde las facturas.</small></label>` : ''}
        ${!editable && puede('fiscal', 'editar') ? `<p class="nota gris">${ic('candado', 's')}<span>Ya se declaró: estas cifras no se cambian.${ch ? ' Lo que llegó después va en una sustitutiva.' : ''}</span></p>` : ''}
        <dl class="kv">${editable ? '' : `<div><dt>Crédito fiscal de las compras</dt><dd>${A.bs(v.credito, { usd: v.credUsd })}</dd></div>`}<div><dt>Excedente de la quincena anterior</dt><dd>${dinero(v.excedente, 'bs')}${v.excedente ? '' : ' <small class="tenue">no quedó: en la 1.ª quincena se pagó IVA</small>'}</dd></div></dl>
        <p class="etq">Retenciones que nos hicieron y se descuentan</p>
        ${editable ? D.RET_RECIBIDAS.filter(r => r.tipo === 'IVA' && r.estado === 'por_descontar').map(r => `<label class="interruptor"><input type="checkbox" data-desc="${r.id}" ${F.descontar[r.id] ? 'checked' : ''}><span>${esc(r.cliente)} · comp. ${esc(r.comp.slice(-6))} · <b class="num">${dinero(r.monto, 'bs')}</b> ${A.equiv(r.monto, { tasa: r.tasa, linea: true })}</span></label>`).join('')
          // quien solo mira (o con la hoja declarada) ve si cada una se descuenta, sin casillas que no responden
          : `<dl class="kv">${v.marcadas.map(r => [r, true]).concat(v.noMarcadas.map(r => [r, false])).map(([r, si]) => `<div><dt>${esc(r.cliente)} · comp. ${esc(r.comp.slice(-6))}</dt><dd>${A.bs(r.monto, { tasa: r.tasa })} <small class="tenue">${si ? 'se descuenta' : 'no se descuenta'}</small></dd></div>`).join('')}</dl>`}
      </article></div>
      <div class="c5 pila"><article class="hoja" style="position:sticky;top:0"><h2>Resultado</h2>
        <dl class="kv"><div><dt>Débito</dt><dd>${A.bs(v.deb, { usd: usdDebTot })}</dd></div><div><dt>− Crédito de compras</dt><dd>${A.bs(v.credito, { usd: v.credUsd })}</dd></div><div><dt>− Excedente anterior</dt><dd>${dinero(v.excedente, 'bs')}</dd></div><div><dt>− Retenciones descontadas</dt><dd>${A.bs(v.retUsada, { usd: v.retSobra > 0 ? null : usdDocs(v.marcadas), hoy: v.retSobra > 0 })}${v.retSobra > 0 ? ` <small class="tenue">de ${dinero(v.ret, 'bs')} marcadas</small>` : ''}</dd></div>
        <div class="total"><dt><b>IVA a pagar</b></dt><dd style="font-size:17px">${A.bs(v.iva, { hoy: true })}</dd></div>
        ${v.excCredito > 0 ? `<div><dt>Excedente de crédito (pasa a la próxima quincena)</dt><dd>${A.bs(v.excCredito, { hoy: true })}</dd></div>` : ''}
        ${v.retSobra > 0 ? `<div><dt>Retenciones que siguen por descontar</dt><dd>${A.bs(v.retSobra, { hoy: true })}</dd></div>` : ''}</dl>
        ${v.excCredito > 0 || v.retSobra > 0 ? `<p class="muted">Lo que se resta pasó del IVA, así que no hay IVA que pagar.${v.excCredito > 0 ? ' El excedente de crédito se resta en la próxima quincena.' : ''}${v.retSobra > 0 ? ' Las retenciones que sobran también pasan a la próxima; si en 3 quincenas no se pudieron usar, se pueden pedir de vuelta al SENIAT.' : ''}</p>` : ''}
        <p class="etq">En la misma planilla</p>
        <dl class="kv"><div><dt>IGTF cobrado en divisas (de los Z)</dt><dd>${A.bs(v.igtf, { usd: v.igtfUsd })}</dd></div><div><dt>Anticipo de ISLR (1 % de los ingresos)</dt><dd>${A.bs(v.anticipo, { hoy: true })}</dd></div><div><dt>Retenciones de IVA a proveedores</dt><dd>${A.bs(v.retProv, { usd: v.retProvUsd })}</dd></div>
        <div class="total"><dt><b>Total de la planilla</b></dt><dd style="font-size:17px">${A.bs(v.total, opObl(o))}</dd></div></dl>
        <p class="muted">Las retenciones a proveedores son las de la pestaña Retenciones, en bolívares a la tasa del día de cada factura. <button class="enlace" data-abrir="oblsuma:o1">Ver todo lo que suma la planilla</button></p>
        ${porDecl ? avisoRojas(R.rojas, true) : ''}
        ${o.estado === 'revision' ? (puedeRevisar(o) ? `<button class="btn pri full" data-acc="obl-paso" data-arg="o1|lista">${ic('check', 's')}Revisado: lista para declarar</button>` : `<p class="nota aviso">${ic('reloj', 's')}<span>Esperando la revisión de ${esc(revisorDe(o))}.</span></p>`) : ''}
        ${o.estado === 'lista' ? A.boton('fiscal', 'Registrar lo declarado', 'data-acc="obl-declarar" data-arg="o1"', { icono: 'subir' }) : ''}
        <button class="btn sec full" data-acc="descargar">${ic('descargar', 's')}Descargar la hoja en Excel</button>
      </article></div></div>`;
  }

  /* ---------- 3. reportes Z y libro de ventas ---------- */
  const tablaZ = (q) => {
    const zs = zq(q); const hay = zs.filter(z => z.base !== null);
    const filas = zs.map(z => ({ abrir: 'zeta:' + z.id, celdas: [`<b>${esc(z.fecha)}</b><small>${z.num ? 'Z ' + z.num + ' · ' + z.facturas + ' facturas' : 'No se ha subido · sería el Z ' + z.numEsperado}</small>`, z.num || '—', z.facturas || '—',
      z.base !== null ? A.bs(z.base, { tasa: z.tasa }) : '—', z.iva !== null ? A.bs(z.iva, { tasa: z.tasa }) : '—', z.estado === 'falta' ? tag('Falta', 'alerta') : z.estado === 'leido' ? tag('Leído, falta confirmar', 'aviso') : tag('Confirmado', 'ok')] }));
    const base = r2(hay.reduce((s, z) => s + z.base, 0)), iva = r2(hay.reduce((s, z) => s + z.iva, 0));
    return A.tabla({ cols: [{ t: 'Día', cls: 'p' }, { t: 'N.º Z', cls: 'x' }, { t: 'Facturas', cls: 'x' }, { t: 'Base gravada (Bs)', cls: 'r plata' }, { t: 'IVA (Bs)', cls: 'r x plata' }, { t: 'Estado', cls: 'e' }],
      filas, pie: ['Total de la quincena · ' + hay.length + ' de ' + zs.length + ' Z', '', '', A.bs(base, { usd: usdDocs(hay, 'base') }), A.bs(iva, { usd: usdDocs(hay, 'iva') }), ''] });
  };
  // el estado de cada quincena del libro: nunca «cuadra» mientras le falte un Z
  const estadoQuincena = q => {
    const falta = zq(q).filter(z => z.base === null).sort(porDia); const sinConf = zq(q).filter(z => z.estado === 'leido');
    if (falta.length) return { tono: 'alerta', txt: 'Falta el Z del ' + enLista(falta.map(z => z.fecha.toLowerCase())), abrir: 'zeta:' + falta[0].id };
    if (q === 1 && Math.abs(D.VENTAS_SEP.q1.final - D.IVA_Q1.ventas) > 0.005) return { tono: 'alerta', txt: 'No cuadra con lo declarado: hace falta una sustitutiva', abrir: 'obligacion:o9' };
    if (q === 2 && cambioIva()) return { tono: 'alerta', txt: 'No cuadra con lo declarado: hace falta una sustitutiva', abrir: 'obligacion:o1' };
    if (sinConf.length) return { tono: 'aviso', txt: sinConf.length === 1 ? 'Falta confirmar 1 Z' : 'Falta confirmar ' + sinConf.length + ' Z', abrir: 'zeta:' + sinConf[0].id };
    if (q === 2 && estimado(obl('o1'))) return { tono: 'info', txt: 'Completa: falta declararla', abrir: 'obligacion:o1' };
    return { tono: 'ok', txt: 'Cuadra', abrir: q === 1 ? 'obligacion:o9' : 'obligacion:o1' };
  };
  // arriba de los Z: quien sube (el local) ve «Subir el Z de ayer» y quién lo confirma; la contadora, «Pedir a Jose los Z que faltan»
  const zBotonera = faltan => {
    if (subeZ()) return `<div class="filtros">${A.boton('fiscal', 'Subir el Z de ayer', 'data-acc="subir-z"', { icono: 'camara' })}<span class="muted">Una foto o un escaneo del ticket largo. La app lee el final y lo confirma ${esc(confirmaZTxt())}.</span></div>`;
    if (!puede('fiscal', 'editar')) return '';
    const pedido = D.PENDIENTES.find(p => p.pedidoZ && !p.hecho);
    return `<div class="filtros">${faltan.length ? `<button class="btn sec" data-acc="pedir-z"${pedido ? ' aria-pressed="true"' : ''}>${ic(pedido ? 'check' : 'enviar', 's')}${pedido ? 'Pedido a Jose · ' + esc(pedido.pedidoZ) : 'Pedir a Jose los Z que faltan'}</button>` : ''}<span class="muted">Subirlos es trabajo del local: los sube Jose y los confirma ${esc(confirmaZTxt())}. ${porDecidirZ()}</span></div>`;
  };
  // pedirlos: a Jose le llega (o se le recuerda) el pendiente de los Z que faltan, a nombre de quien los pide
  // el pendiente de Jose dice lo que de verdad falta: el título cuenta los Z que faltan y debajo van sus días y cuáles se pidieron
  const tituloZ = n => n === 1 ? 'Subir el Z que falta de septiembre' : 'Subir los ' + n + ' reportes Z que faltan de septiembre';
  const pedidoDe = z => D.PENDIENTES.find(p => p.pedidoZ && !p.hecho && (p.pedidos || []).includes(z.id));
  ACC['pedir-z'] = id => {
    const faltan = (id ? zq().filter(z => z.id === id) : zq()).filter(z => z.base === null).sort(porDia); if (!faltan.length) { A.aviso('No falta ningún Z.', 'info'); return; }
    const todos = zq().filter(z => z.base === null).sort(porDia); const jose = D.USUARIOS.find(u => u.nombre === 'Jose');
    let p = D.PENDIENTES.find(x => x.para.includes(jose.id) && !x.hecho && x.ir === 'fiscal' && x.sub2 === 'z');
    if (!p) { p = { id: 'pe' + Date.now(), para: [jose.id], tipo: 'aviso', titulo: '', de: S.usuario.nombre, ir: 'fiscal', sub2: 'z' }; A.pendiente(p); }
    p.pedidos = [...new Set((p.pedidos || []).concat(faltan.map(z => z.id)))].filter(zid => todos.some(z => z.id === zid));
    const pedidos = todos.filter(z => p.pedidos.includes(z.id)); const diasDe = xs => enLista(xs.map(z => z.fecha.toLowerCase()));
    Object.assign(p, { titulo: tituloZ(todos.length), sub: 'Falta' + (todos.length === 1 ? ' el Z del ' : 'n los Z del ') + diasDe(todos) + ' · ' + (pedidos.length === todos.length ? 'los pidió ' + S.usuario.nombre : S.usuario.nombre + ' pidió el del ' + diasDe(pedidos)) + ' · sin el Z no cierra el libro de ventas', de: S.usuario.nombre, edad: 'Ahora', pedidoZ: D.HOY.hora });
    const dias = diasDe(faltan);
    A.auditar({ modulo: 'Fiscal', registro: 'Reportes Z de septiembre', campo: 'pedido', despues: 'pedidos a Jose: ' + dias });
    if (S.ficha) A.pintarFicha(); A.pintarPagina(); A.aviso('Pedido a Jose. Le llegó como pendiente.');
  };
  function zetas() {
    const L2 = D.LIBRO_VENTAS; const faltan = zq().filter(z => z.base === null).sort(porDia); const leidos = zq().filter(z => z.estado === 'leido');
    const sj = saltosSinExplicar(); const q2 = D.VENTAS_SEP.q2; const z1 = zHay(1); const e1 = estadoQuincena(1), e2 = estadoQuincena(2);
    const resumenQ1 = `<div class="hoja quincena-resumen"><dl class="kv"><div><dt>${z1.length} de 15 Z · se declaró el mié 30 sep</dt><dd><button class="enlace" data-abrir="${e1.abrir}">${tag(e1.txt, e1.tono)}</button></dd></div><div class="total"><dt><b>Total de la quincena (base)</b></dt><dd>${A.bs(D.VENTAS_SEP.q1.final, { usd: usdDocs(z1, 'base') })}</dd></div></dl>
      <button class="btn sec chico" data-acc="z-q1" aria-expanded="${F.verQ1}">${ic(F.verQ1 ? 'abajo' : 'derecha', 's')}${F.verQ1 ? 'Esconder los 15 días' : 'Ver los 15 días'}</button></div>`;
    return `<div class="cifras">
        ${A.cifra({ etq: 'Reportes Z de septiembre', valor: (zq().length - faltan.length) + ' de ' + zq().length, sub: faltan.length ? (faltan.length === 1 ? 'falta el día ' : 'faltan los días ') + enLista(faltan.map(z => z.dia)) : 'están todos', tono: faltan.length ? 'alerta' : '', abrir: 'paquete:' + D.PAQUETE.findIndex(x => x[3] === 'z') })}
        ${A.cifra({ etq: 'Leídos sin confirmar', valor: leidos.length, sub: 'los confirma ' + confirmaZTxt(), tono: leidos.length ? 'aviso' : '', abrir: leidos[0] ? 'zeta:' + leidos[0].id : '' })}
        ${A.cifra({ etq: 'Saltos de número sin explicar', valor: sj.length || 'Ninguno', sub: sj.length ? 'falta el Z ' + enLista(sj.map(x => x.num)) : faltan.length ? 'el ' + enLista(faltan.map(z => z.numEsperado)) + (faltan.length === 1 ? ' es el del día que falta' : ' son los de los días que faltan') : 'la numeración no tiene huecos', tono: sj.length ? 'alerta' : '', abrir: sj.length ? 'zeta:' + sj[0].z.id : '' })}
        ${A.cifra({ etq: 'Ventas de la quincena (base)', valor: dinero(q2.final, 'bs', 0), sub: '≈ ' + dinero(usdDocs(zHay(2), 'base'), 'usd', 0) + ' · consumidor final · 16 al 30 sep', abrir: 'ivalinea:z' })}
      </div>
      ${zBotonera(faltan)}
      <div class="sec"><h2>2.ª quincena · 16 al 30 sep</h2><span class="cabeza-acc"><button class="enlace" data-abrir="${e2.abrir}">${tag(e2.txt, e2.tono)}</button></span></div>
      ${tablaZ(2)}
      <div class="sec"><h2>1.ª quincena · 1 al 15 sep</h2></div>
      ${resumenQ1}${F.verQ1 ? tablaZ(1) : ''}
      <div class="sec"><h2>Libro de ventas · septiembre</h2><span class="cabeza-acc">${A.boton('fiscal', 'Exportar PDF', 'data-acc="descargar"', { tono: 'sec', icono: 'descargar', chico: true })}${A.boton('fiscal', 'Exportar Excel', 'data-acc="descargar"', { tono: 'sec', icono: 'descargar', chico: true })}</span></div>
      ${A.tabla({ cols: [{ t: 'Ventas del mes', cls: 'p' }, { t: 'Base (Bs)', cls: 'r plata' }, { t: 'IVA (Bs)', cls: 'r x plata' }], filas: [
        { celdas: ['<b>A consumidor final</b><small>Resumen diario de los Z</small>', A.bs(L2.final, { usd: usdDocs(zHay(), 'base') }), A.bs(L2.ivaFinal, { usd: usdDocs(zHay(), 'iva') })] },
        { celdas: ['<b>A contribuyentes</b><small>Facturas con RIF</small>', A.bs(L2.empresas, { usd: usdDocs(D.VENTAS_EMPRESAS, 'base') }), A.bs(L2.ivaEmpresas, { usd: usdDocs(D.VENTAS_EMPRESAS, 'iva') })] },
        { celdas: ['<b>Exento</b><small>De los Z</small>', A.bs(L2.exento, { usd: usdDocs(zHay(), 'exento') }), '—'] }],
        pie: ['Ventas del mes, sin IVA', A.bs(r2(L2.final + L2.empresas + L2.exento), { usd: ventasUsd() }), ''] })}
      <article class="hoja"><dl class="kv"><div><dt>Cuadra con las declaraciones · 1.ª quincena</dt><dd><button class="enlace" data-abrir="${e1.abrir}">${tag(e1.txt, e1.tono)}</button></dd></div><div><dt>Cuadra con las declaraciones · 2.ª quincena</dt><dd><button class="enlace" data-abrir="${e2.abrir}">${tag(e2.txt, e2.tono)}</button></dd></div></dl>
      <p class="muted">Con las ventas del mes, sin IVA, se calcula la patente. El libro va impreso al local cada mes. Las facturas con RIF que ya están dentro del Z no se cuentan dos veces; cómo se separan está por confirmar: ${enlacePregunta('q4')}</p></article>`;
  }
  ACC['z-q1'] = () => { F.verQ1 = !F.verQ1; A.pintarPagina(); };
  // lo que lee la app de un Z que se sube (inventado para el prototipo): [base, exento, IGTF, facturas]
  const LECTURA_Z = { z27: [1402000, 34000, 17630, 252], z13: [1356000, 30000, 15810, 246] };
  FICHAS.zeta = id => {
    const z = D.ZETAS.find(x => x.id === id);
    // el que falta: lo sube el local (la cámara o la galería); a la contadora le sale «Pedir a Jose este Z»
    if (z.estado === 'falta') return { titulo: 'Reporte Z del ' + z.fecha, sub: 'Fiscal · sería el Z ' + z.numEsperado, mod: 'fiscal', obj: z, tags: [['Falta', 'alerta']],
      bloques: [{ html: `<p>Sin el Z de este día no cierra el libro de ventas${z.quincena === 2 ? ' ni cuadra la hoja de IVA' : ''}. Sería el Z ${z.numEsperado}: por eso la numeración salta del ${z.numEsperado - 1} al ${z.numEsperado + 1}. Búscalo en la carpeta de la caja.</p>${subeZ() ? `<label class="soltar" for="z-sube-${z.id}">${ic('camara')}<span><b>Subir la foto o el escaneo</b>Del ticket largo, sobre todo el tramo final. La app lo lee y lo confirma ${esc(confirmaZTxt())}.</span></label><input id="z-sube-${z.id}" data-subirz="${z.id}" type="file" accept="image/*,application/pdf" class="sr-only">` : `<p class="muted">Lo sube Jose: es trabajo del local.</p>`}` }],
      acciones: !subeZ() && puede('fiscal', 'editar') ? [(pz => pz ? { txt: 'Pedido a Jose · ' + pz.pedidoZ, acc: 'pedir-z', arg: z.id, icono: 'check', tono: 'sec', pressed: true } : { txt: 'Pedir a Jose este Z', acc: 'pedir-z', arg: z.id, icono: 'enviar', tono: 'pri', pressed: false })(pedidoDe(z))] : [] };
    const sj = saltosSinExplicar(z.quincena).filter(x => x.z.id === z.id);
    return { titulo: 'Reporte Z ' + z.num, sub: esc(z.fecha) + ' · máquina de la caja principal', mod: 'fiscal', obj: z, registro: 'Z ' + z.num, tags: [[z.estado === 'leido' ? 'Leído, falta confirmar' : 'Confirmado por ' + z.por, z.estado === 'leido' ? 'aviso' : 'ok']],
      aviso: (sj.length ? `<p class="nota alerta">${ic('alerta', 's')}<span>Salto de número: no está el Z ${sj.map(x => x.num).join(', ')} y ningún día lo explica. Pudo ser un Z sacado dos veces o uno perdido. Hay que justificarlo.</span></p>` : '')
        + (z.estado === 'leido' && !confirmaZ() ? `<p class="nota gris">${ic('reloj', 's')}<span>Lo confirma ${esc(confirmaZTxt())}. ${porDecidirZ()}</span></p>` : ''),
      bloques: [{ titulo: 'Lo que leyó la app', filas: [{ l: 'N.º de Z', v: z.num, campo: { k: 'num', tipo: 'numero', sinMiles: true, entero: true, obligatorio: true } }, { l: 'Facturas del día', v: z.facturas, campo: { k: 'facturas', tipo: 'numero', entero: true, obligatorio: true } }, { l: 'Base gravada 16 % (Bs)', v: A.bs(z.base, { tasa: z.tasa }), campo: { k: 'base', tipo: 'dinero', mon: 'bs', obligatorio: true } }, { l: 'IVA (Bs)', v: A.bs(z.iva, { tasa: z.tasa }), campo: { k: 'iva', tipo: 'dinero', mon: 'bs', obligatorio: true } }, { l: 'Exento (Bs)', v: A.bs(z.exento, { tasa: z.tasa }), campo: { k: 'exento', tipo: 'dinero', mon: 'bs', obligatorio: true } }, { l: 'IGTF (Bs)', v: A.bs(z.igtf, { tasa: z.tasa }), campo: { k: 'igtf', tipo: 'dinero', mon: 'bs', obligatorio: true } }, { l: 'Tasa BCV de ese día', v: dinero(z.tasa, 'bs') }, { l: 'Primer y último comprobante', v: `<span class="mono">${(z.num * 160 - z.facturas + 1)}–${z.num * 160}</span>` }] },
        { titulo: 'Foto', adjuntos: [z.foto || 'Z ' + z.num + ' · ' + z.fecha + '.jpg'] }],
      alGuardar: () => recalcular(),
      acciones: z.estado === 'leido' && confirmaZ() ? [{ txt: 'Confirmar el Z', acc: 'confirmar-z', arg: z.id, icono: 'check', tono: 'pri', solo: 'editar' }] : [] };
  };
  ACC['confirmar-z'] = id => { if (!confirmaZ()) { A.aviso('Lo confirma ' + confirmaZTxt() + '. Por decidir: si también lo confirma Cecilia.', 'info'); return; } const z = D.ZETAS.find(x => x.id === id); z.estado = 'confirmado'; z.por = S.usuario.nombre; A.auditar({ modulo: 'Fiscal', registro: 'Z ' + z.num, campo: 'estado', antes: 'leído', despues: 'confirmado' }); recalcular(); A.pintarFicha(); A.pintarPagina(); A.aviso('Z confirmado.'); };
  ACC['subir-z'] = () => A.aviso('Se abriría la cámara del teléfono para fotografiar el Z de ayer. (Simulado)', 'info');
  // subir el Z que faltaba: la app lo lee (en el prototipo, cifras inventadas), queda «leído» y Jose lo confirma; las ventas, el libro, la patente y la hoja se mueven solos
  document.addEventListener('change', e => {
    const el = e.target; if (!el.matches || !el.matches('#ficha-raiz [data-subirz]') || !el.files || !el.files.length) return;
    const z = D.ZETAS.find(x => x.id === el.dataset.subirz); if (!z || z.base !== null) return;
    const [base, exento, igtf, facturas] = LECTURA_Z[z.id] || [1300000, 30000, 16000, 240];
    Object.assign(z, { num: z.numEsperado, base, iva: pctBs(base, 16), exento, igtf, facturas, estado: 'leido', por: '—', foto: el.files[0].name });
    D.ARCHIVOS.unshift({ id: 'a' + Date.now(), carpeta: 'fiscal', nombre: el.files[0].name, fecha: '5 oct 2026', vence: '—', vinculo: 'Reporte Z del ' + z.fecha.toLowerCase(), abrir: 'zeta:' + z.id, version: 1 }); sumarArchivo();
    A.auditar({ modulo: 'Fiscal', registro: 'Z ' + z.num, campo: 'reporte Z', antes: 'falta', despues: 'leído: base ' + dinero(base, 'bs') });
    recalcular(); A.pintarFicha(); A.pintarPagina(); A.aviso('Z subido y leído. Falta que Jose lo confirme.');
  });
  FICHAS.ivalinea = k => {
    if (k === 'z') {
      // los 15 días de la quincena (los que faltan, con «Falta»); su suma es la línea de la hoja de IVA
      const zs = zq(2).slice().sort(porDia); const hay = zs.filter(z => z.base !== null); const falta = zs.filter(z => z.base === null); const sinConf = zs.filter(z => z.estado === 'leido');
      // declarada, la línea de la hoja es la de lo declarado: si la suma de hoy no es esa (llegó un Z después), no cuadra y no lleva el sello
      const linea = D.IVA_HOJA.debitos[0]; const o1 = obl('o1'); const decl = declaradaConFoto(o1) ? o1.foto : null; const ch = cambioIva();
      const cuadra = !falta.length && !sinConf.length && !ch;
      return { titulo: 'Ventas a consumidor final', sub: 'Hoja de IVA · 16 al 30 de septiembre', mod: 'fiscal', obj: { estado: cuadra ? 'cuadra' : 'abierta' },
        tags: ch ? [['No cuadra con lo declarado', 'alerta']] : falta.length ? [['No cuadra', 'alerta']] : sinConf.length ? [[sinConf.length === 1 ? 'Falta confirmar 1 Z' : 'Falta confirmar ' + sinConf.length + ' Z', 'aviso']] : [['Cuadra', 'ok']],
        aviso: ch ? notaCambio(ch) : falta.length ? `<p class="nota alerta">${ic('alerta', 's')}<span><b>No cuadra:</b> ${esc(falta.map(z => 'falta el Z del ' + z.fecha.toLowerCase() + ' (sería el ' + z.numEsperado + ')').join(', '))}. La línea de la hoja lleva ${hay.length} de 15 días.</span></p>` : '',
        bloques: [{ html: `<p>La suma de los Z de la quincena, del 16 al 30 de septiembre. Las facturas con RIF que ya están dentro del Z no se cuentan dos veces; cómo se separan está por confirmar: ${enlacePregunta('q4')}</p>` },
          // en la ficha, una lista (como «A pagar este mes»): cada día con su base y su estado; abajo, la suma con doble subrayado = la línea de la hoja
          { html: `<ul class="lista">${zs.map(z => `<li><button class="fila" data-abrir="zeta:${z.id}"><span class="lead ${z.estado === 'falta' ? 'alerta' : z.estado === 'leido' ? 'aviso' : 'ok'}">${ic(z.estado === 'falta' ? 'alerta' : z.estado === 'leido' ? 'reloj' : 'check')}</span><span class="medio"><b>${esc(z.fecha)}</b><small>${z.num ? 'Z ' + z.num + ' · IVA ' + dinero(z.iva, 'bs') : 'Sería el Z ' + z.numEsperado + ' · no se ha subido'}</small></span><span class="fin-col">${z.base !== null ? `<span class="monto">${A.bs(z.base, { tasa: z.tasa })}</span>` : ''}${z.estado === 'falta' ? tag('Falta', 'alerta') : z.estado === 'leido' ? tag('Sin confirmar', 'aviso') : tag('Confirmado', 'ok')}</span></button></li>`).join('')}</ul>` },
          { html: decl ? `<dl class="kv"><div class="total"><dt><b>Suma de la base hoy · ${hay.length} de 15 días</b></dt><dd>${A.bs(linea[1], { usd: usdDocs(hay, 'base') })}</dd></div><div><dt>Lo declarado · ${decl.zN} de 15 días = línea de la hoja</dt><dd>${A.bs(decl.debitos[0][1], { usd: decl.usdDeb[0][0] })}</dd></div><div><dt>Su IVA declarado (16 %)</dt><dd>${A.bs(decl.debitos[0][2], { usd: decl.usdDeb[0][1] })}</dd></div></dl>`
            : `<dl class="kv"><div class="total"><dt><b>Suma de la base · ${hay.length} de 15 días = línea de la hoja</b></dt><dd>${A.bs(linea[1], { usd: usdDocs(hay, 'base') })}</dd></div><div><dt>Su IVA (16 %) = línea de la hoja</dt><dd>${A.bs(linea[2], { usd: usdDocs(hay, 'iva') })}</dd></div></dl>` },
          { html: `<p class="muted">${cuadra ? 'Están los 15 Z, todos confirmados' + (decl ? ' y la suma es la de lo declarado' : '') + ': la línea cuadra.' : ch ? 'La suma de hoy no es la de lo declarado: hace falta una sustitutiva. Mientras tanto no lleva el sello «Cuadra».' : 'El sello «Cuadra» sale cuando estén los 15 Z y todos confirmados.'}</p>` }] };
    }
    if (k === 'emp') return { titulo: 'Facturas a empresas', sub: 'Hoja de IVA', mod: 'fiscal', bloques: [{ html: '<p>Las facturas personalizadas con el RIF del cliente, de la 2.ª quincena.</p>' },
      { html: `<ul class="lista">${D.VENTAS_EMPRESAS.filter(v => v.quincena === 2).map(v => `<li><button class="fila" data-abrir="ventaemp:${v.id}"><span class="lead">${ic('archivo')}</span><span class="medio"><b>N.º ${esc(v.num)}</b><small>${esc(v.cliente)} · ${esc(v.fecha)} · base ${dinero(v.base, 'bs')}</small></span><span class="monto">${A.bs(v.iva, { tasa: v.tasa })}</span></button></li>`).join('')}</ul>
        <dl class="kv"><div><dt>Base</dt><dd>${A.bs(D.IVA_HOJA.debitos[1][1], { usd: usdDocs(D.VENTAS_EMPRESAS.filter(v => v.quincena === 2), 'base') })}</dd></div><div class="total"><dt><b>IVA = línea de la hoja</b></dt><dd>${A.bs(D.IVA_HOJA.debitos[1][2], { usd: usdDocs(D.VENTAS_EMPRESAS.filter(v => v.quincena === 2), 'iva') })}</dd></div></dl>` }] };
    return { titulo: 'Alícuota adicional (31 %)', sub: 'Hoja de IVA', mod: 'fiscal', bloques: [{ html: `<p>Es la casilla «A» del Z: la alícuota de lujo (16 % + 15 %). Su lista (vehículos, motos, joyas, aeronaves, botes, máquinas de juego) no trae licores ni comida: en el restaurante va en cero y los licores pagan el 16 %. ${aCecilia('Si algún día trae monto, revísalo tú.', 'Si algún día trae monto, revisarlo con Cecilia.')} ${enlacePregunta('q16')}</p>` }] };
  };

  /* ---------- 4. libro de compras ---------- */
  function compras() {
    return `<p class="nota gris">${ic('reloj', 's')}<span><b>${aCecilia('Por ahora lo escribes tú desde tu Excel', 'Por ahora lo escribe la contadora desde su Excel')}; más adelante la app lo arma sola desde las facturas.</b> Mientras tanto, el crédito fiscal se escribe a mano en la hoja de IVA. Abajo, cómo se verá el libro cuando lo arme la app.</span></p>
      ${A.tabla({ cols: [{ t: 'Factura', cls: 'p' }, { t: 'N.º de control', cls: 'x' }, { t: 'Base (Bs)', cls: 'r x plata' }, { t: 'IVA (Bs)', cls: 'r plata' }, { t: 'Retenido (Bs)', cls: 'r x plata' }, { t: 'Comprobante', cls: 'e' }],
        filas: D.COMPRAS.map(c => { const r = D.RET_EMITIDAS.find(x => x.lc === c.id); return { abrir: 'factura:' + (D.FACTURAS.find(f => f.num === c.num) || {}).id, celdas: [`<b>${esc(prov(c.prov))}</b><small>N.º ${esc(c.num)} · ${esc(c.fecha)} · tasa ${fmt(c.tasa)}${c.alerta ? ' · ' + ic('alerta', 'xs') + ' ' + esc(c.alerta) : ''}</small>`, esc(c.control), A.bs(c.base, { usd: c.usd[0] }), A.bs(c.iva, { usd: c.usd[1] }), A.bs(c.retenido, { tasa: c.tasa }), c.comp === 'pendiente' ? (r && puede('fiscal', 'editar') ? `<button class="enlace" data-abrir="retemi:${r.id}">${tag('Por emitir', 'aviso')}</button>` : tag('Por emitir', 'aviso')) : `<span class="mono" style="font-size:12px">${esc(c.comp)}</span>`] }; }) })}
      <p class="muted">En bolívares, a la tasa BCV del día de cada factura; debajo, su equivalente en dólares, el mismo de Proveedores. Las de la 2.ª quincena de septiembre (16 al 30) suman ${dinero(D.IVA_HOJA.creditos[0][2], 'bs')} de IVA: es el crédito de la hoja de IVA, y lo retenido es lo que esa hoja suma como retenciones a proveedores. Las del 3 y el 4 de octubre van en la 1.ª quincena de octubre.</p>
      <div class="filtros">${A.boton('fiscal', 'Exportar el libro', 'data-acc="descargar"', { tono: 'sec', icono: 'descargar' })}</div>`;
  }

  /* ---------- 5. retenciones ---------- */
  // lo que espera otra firma también se ve en las listas: «Por aprobar · Jose» (no solo dentro de la ficha)
  const porAprobarTag = clave => { const p = A.propuestaDe(clave); return p ? tag('Por aprobar · ' + p.paraNombre, 'aviso') : ''; };
  // la numeración de los comprobantes de IVA: AAAAMM del período y un número que sigue sin huecos (no vuelve a 1 cada mes)
  const ultimoIva = () => D.RET_EMITIDAS.filter(r => r.tipo.startsWith('IVA') && r.comp).map(r => r.comp).sort((a, b) => +a.slice(-8) - +b.slice(-8)).pop() || '—';
  const ultimoIslr = () => D.RET_EMITIDAS.filter(r => r.tipo.startsWith('ISLR') && r.comp).map(r => r.comp).sort((a, b) => +a.slice(-3) - +b.slice(-3)).pop() || '—';
  const siguienteNum = r => r.tipo.startsWith('IVA') ? r.periodo.replace('-', '') + '-' + String(+ultimoIva().slice(-8) + 1).padStart(8, '0') : 'ISLR-' + r.periodo + '-' + String(+ultimoIslr().slice(-3) + 1).padStart(3, '0');
  function retenciones() {
    const porDesc = D.RET_RECIBIDAS.filter(r => r.estado === 'por_descontar'); const borr = D.RET_EMITIDAS.filter(r => r.estado === 'borrador');
    const tot = r2(porDesc.reduce((s, r) => s + r.monto, 0)); const u = ultimoIva();
    return `<div class="cifras">
        ${A.cifra({ etq: 'Por descontar (plata que se recupera)', valor: dinero(tot, 'bs'), sub: '≈ ' + dinero(usdDocs(porDesc), 'usd', 0) + ' · ' + porDesc.length + ' comprobantes de clientes · se descuentan en la hoja de IVA', ir: 'fiscal/iva' })}
        ${A.cifra({ etq: 'Comprobantes por emitir', valor: borr.length, sub: 'a proveedores · 2 días hábiles ' + tag(conCecilia(), 'aviso'), tono: borr.length ? 'aviso' : '', abrir: borr.length ? 'poremitir:todos' : '' })}
        ${A.cifra({ etq: 'Último número usado', valor: `<span class="mono" style="font-size:18px">${esc(u)}</span>`, sub: 'la numeración no tiene huecos', abrir: (r => r ? 'retemi:' + r.id : '')(D.RET_EMITIDAS.find(r => r.comp === u)) })}
      </div>
      <div class="sec"><h2>Las que nos hicieron (clientes especiales)</h2>${A.boton('fiscal', 'Registrar un comprobante', 'data-acc="retrec-nueva"', { tono: 'sec', icono: 'mas', chico: true, plata: true })}</div>
      ${A.tabla({ cols: [{ t: 'Comprobante', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Período', cls: 'x' }, { t: 'Monto (Bs)', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: D.RET_RECIBIDAS.map(r => ({ abrir: 'retrec:' + r.id, celdas: [`<b>${esc(r.cliente)}</b><small class="mono">${esc(r.comp)}</small>`, esc(r.tipo), esc(r.periodo), A.bs(r.monto, { tasa: r.tasa }), porAprobarTag('retrec:' + r.id) || A.estadoTag(r.estado)] })) })}
      <div class="sec"><h2>Las que hicimos a proveedores</h2><span class="cabeza-acc">${A.boton('fiscal', 'TXT de IVA para el portal', 'data-acc="descargar"', { tono: 'sec', icono: 'descargar', chico: true })}${A.boton('fiscal', 'XML de ISLR', 'data-acc="descargar"', { tono: 'sec', icono: 'descargar', chico: true })}</span></div>
      ${A.tabla({ cols: [{ t: 'Comprobante', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Factura', cls: 'x' }, { t: 'Monto (Bs)', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: D.RET_EMITIDAS.map(r => ({ abrir: 'retemi:' + r.id, celdas: [`<b>${esc(prov(r.prov))}</b><small class="mono">${r.comp ? esc(r.comp) : 'Número por asignar'}</small>`, esc(r.tipo), `${esc(r.factura)}<br><small class="tenue">${esc(r.fecha)} · tasa ${fmt(r.tasa)}</small>`, A.bs(r.monto, { tasa: r.tasa }), porAprobarTag('retemi:' + r.id) || (r.estado === 'borrador' ? tag('Por emitir', 'aviso') : A.estadoTag(r.estado))] })) })}
      <p class="muted">En bolívares, a la tasa BCV del día de cada factura; debajo, su equivalente en dólares, el mismo de Proveedores. Las de IVA de la 2.ª quincena de septiembre son las que suma la hoja de IVA.</p>`;
  }
  FICHAS.retrec = id => {
    const r = D.RET_RECIBIDAS.find(x => x.id === id); const v = D.VENTAS_EMPRESAS.find(x => x.num === r.factura);
    return { titulo: 'Retención de ' + r.cliente, sub: 'Comprobante ' + esc(r.comp), mod: 'fiscal', obj: r, registro: 'Retención ' + r.comp, tags: [[A.estadoTag(r.estado).replace(/<[^>]+>/g, ''), r.estado === 'descontada' ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'Cliente', v: esc(r.cliente) }, { l: 'RIF', v: `<span class="mono">${esc(r.rif)}</span>` }, { l: 'Tipo', v: esc(r.tipo) }, { l: 'Monto (Bs)', v: A.bs(r.monto, { tasa: r.tasa }), campo: { k: 'monto', tipo: 'dinero', mon: 'bs', obligatorio: true } }, { l: 'Fecha del comprobante', v: esc(r.fecha) + ` <small class="tenue">tasa ${fmt(r.tasa)}</small>` }, { l: 'Período', v: esc(r.periodo) },
        { l: 'Factura que retiene', v: v && puede('clientes') ? `<button class="enlace" data-abrir="ventaemp:${v.id}">N.º ${esc(r.factura)}</button>` : 'N.º ' + esc(r.factura || '—') }, { l: 'Se descuenta en', v: r.tipo === 'ISLR' ? 'ISLR del año' : 'La declaración de IVA de la quincena' }, { l: 'Se usó en', v: r.estado === 'descontada' ? esc(r.usadaEn || '—') : 'Todavía no' }] },
        { titulo: 'Comprobante', adjuntos: [r.pdf] }, { html: `<p class="muted">${r.tipo === 'ISLR' ? 'Las de ISLR no van en la hoja de IVA: rebajan el ISLR que se declara en marzo. ' : ''}Al registrarla, su factura deja de esperar el comprobante en Cobranza. Nunca se manda por el grupo Caja.</p>` }] };
  };
  // registrar un comprobante que nos mandó un cliente especial: cliente con RIF, número, período, tipo, monto en Bs y el PDF · avisa si el número ya existe
  // desde la factura de una empresa (Cobranza) llega con el cliente, la factura y el monto puestos
  const CLI_ESP = () => D.CLIENTES.filter(c => c.esp);
  // lo que registra un aprendiz queda «por aprobar»: no se descuenta en la hoja de IVA hasta que Jose lo apruebe (al devolverlo, no cuenta)
  A.EJECUTA['retrec-nueva'] = id => { const r = D.RET_RECIBIDAS.find(x => x.id === id); if (!r) return; r.estado = 'por_descontar'; const v = D.VENTAS_EMPRESAS.find(x => x.num === r.factura); if (v) v.retencion = D.retencionDe(v); };
  A.DEVUELVE['retrec-nueva'] = id => { const r = D.RET_RECIBIDAS.find(x => x.id === id); if (r) r.estado = 'devuelta'; };
  ACC['retrec-nueva'] = arg => {
    if (!puede('fiscal', 'editar')) { A.aviso('Lo registran ' + A.quienEdita('fiscal') + '.', 'info'); return; }
    const rg = A.regla({ mod: 'fiscal', plata: true }); const aprendiz = rg.modo === 'aprobar';
    const v0 = arg ? D.VENTAS_EMPRESAS.find(x => x.id === arg) : null; const c0 = v0 ? D.CLIENTES.find(c => c.nombre === v0.cliente) : CLI_ESP()[0]; const env = $('#modal-raiz');
    const periodos = ['2026-10', '2026-09', '2026-08'];
    A.modal(`<h2 id="modal-t">Registrar un comprobante de retención</h2><p class="muted" id="modal-d">El que nos manda un cliente especial cuando nos paga neto. Se descuenta en la declaración.</p>
      <div class="form">
        <label class="campo" for="rr-cli"><span>Cliente</span><select id="rr-cli">${CLI_ESP().map(c => `<option value="${c.id}"${c0 && c.id === c0.id ? ' selected' : ''}>${esc(c.nombre)}</option>`).join('')}<option value="otro">Otro contribuyente especial</option></select><small class="ayuda" id="rr-rif-ver"></small></label>
        <div class="campos" id="rr-otro" hidden><label class="campo" for="rr-nom"><span>Nombre</span><input id="rr-nom" autocomplete="off"></label><label class="campo" for="rr-rif"><span>RIF</span><input id="rr-rif" class="mono" placeholder="J-00000000-0" autocomplete="off"></label></div>
        <label class="campo" for="rr-fac"><span>Factura que retiene (opcional)</span><select id="rr-fac"></select></label>
        <label class="campo" for="rr-num"><span>Número del comprobante</span><input id="rr-num" class="mono" inputmode="numeric" placeholder="14 números: año, mes y el número" autocomplete="off"><small class="ayuda" id="rr-num-msg"></small></label>
        <div id="rr-dup"></div>
        <div class="campos"><label class="campo" for="rr-per"><span>Período</span><select id="rr-per">${periodos.map(p => `<option>${p}</option>`).join('')}</select></label>
          <label class="campo" for="rr-tipo"><span>Tipo</span><select id="rr-tipo"><option value="IVA">IVA</option><option value="ISLR">ISLR</option></select></label></div>
        <label class="campo" for="rr-monto"><span>Monto (Bs)</span><input id="rr-monto" inputmode="decimal" autocomplete="off"></label>
        <div class="campo soltar-env"><label class="soltar" for="rr-pdf">${ic('subir')}<span><b>El comprobante (PDF)</b>Sin el PDF no se registra: es el soporte para descontarla.</span></label><input id="rr-pdf" type="file" accept="application/pdf" class="sr-only" data-mini></div>
      </div>
      ${aprendiz ? `<p class="nota aviso">${ic('reloj', 's')}<span>Mueve plata: lo aprueba ${esc(rg.quien)}. Hasta que lo apruebe no se descuenta en la hoja de IVA.</span></p>` : ''}
      <div class="modal-acc"><button class="btn sec" data-rr="no">Cancelar</button>${aprendiz ? `<span class="btn-con-nota"><button class="btn pri" data-rr="si">${ic('enviar', 's')}Enviar para aprobar</button><small class="btn-nota">Lo aprueba ${esc(rg.quien)}</small></span>` : `<button class="btn pri" data-rr="si">${ic('check', 's')}Registrar el comprobante</button>`}</div>`, 'teclado');
    const cli = () => D.CLIENTES.find(c => c.id === $('#rr-cli').value);
    // el RIF del cliente elegido, sus facturas y, con la factura, el monto que toca (el 75 % del IVA, si es de IVA)
    const alCliente = () => {
      const c = cli(); $('#rr-otro').hidden = !!c; $('#rr-rif-ver').textContent = c ? 'RIF ' + c.rif : 'Escribe el nombre y el RIF del cliente.';
      const fs = c ? D.VENTAS_EMPRESAS.filter(v => v.cliente === c.nombre) : [];
      $('#rr-fac').innerHTML = fs.map(v => `<option value="${v.id}"${v0 && v.id === v0.id ? ' selected' : ''}>N.º ${esc(v.num)} · ${esc(v.fecha)} · IVA ${dinero(v.iva, 'bs')}</option>`).join('') + '<option value="">Otra, o no sé cuál</option>';
      alFactura();
    };
    const alFactura = () => { const v = D.VENTAS_EMPRESAS.find(x => x.id === $('#rr-fac').value); if (v && $('#rr-tipo').value === 'IVA') $('#rr-monto').value = fmt(pctBs(v.iva, 75)); };
    // el número: 14 cifras (AAAAMM y 8 más) · cada cliente que retiene numera sus propios comprobantes: el repetido es el mismo número del
    // mismo cliente (su RIF); si ya está, lo dice y lleva a ese comprobante · el mismo número de otro cliente no bloquea: una nota gris para
    // revisar que el cliente sea el correcto · el período sale de sus primeras cifras
    const rifSel = () => { const c = cli(); return c ? c.rif : ($('#rr-rif').value || '').trim().toUpperCase(); };
    const mismoRif = (a, b) => String(a || '').replace(/[^0-9A-Z]/gi, '').toUpperCase() === String(b || '').replace(/[^0-9A-Z]/gi, '').toUpperCase();
    const dup = () => { const n = $('#rr-num').value.replace(/\D/g, ''); const rif = rifSel(); const vivos = D.RET_RECIBIDAS.filter(r => r.comp === n && r.estado !== 'devuelta');
      const x = vivos.find(r => mismoRif(r.rif, rif)) || null; const otro = !x && n.length === 14 ? vivos[0] : null;
      $('#rr-dup').innerHTML = x ? `<p class="nota alerta">${ic('alerta', 's')}<span><b>Ese número ya está registrado:</b> ${esc(x.cliente)} · ${dinero(x.monto, 'bs')} · ${esc(x.periodo)}. <button class="enlace" type="button" data-acc="ver-retrec" data-arg="${x.id}">Ver ese comprobante</button></span></p>`
        : otro ? `<p class="nota gris">${ic('info', 's')}<span>${esc(otro.cliente)} tiene un comprobante con este número: revisa que el cliente sea el correcto.</span></p>` : '';
      const per = n.length >= 6 ? n.slice(0, 4) + '-' + n.slice(4, 6) : ''; if (periodos.includes(per)) $('#rr-per').value = per; return x; };
    $('#rr-cli').addEventListener('change', () => { alCliente(); dup(); }); $('#rr-fac').addEventListener('change', alFactura); $('#rr-tipo').addEventListener('change', alFactura);
    $('#rr-num').addEventListener('input', dup); $('#rr-rif').addEventListener('input', dup);
    alCliente(); $('#rr-num').focus();
    env.onclick = e => {
      const b = e.target.closest('[data-rr]'); if (!b) return;
      if (b.dataset.rr === 'no') { A.cerrarModal(); return; }
      const c = cli(); const nombre = c ? c.nombre : $('#rr-nom').value.trim(); const rif = c ? c.rif : $('#rr-rif').value.trim();
      const num = $('#rr-num').value.replace(/\D/g, ''); const monto = leerNum($('#rr-monto').value); const pdf = $('#rr-pdf').files[0];
      // lo que falta, debajo de su campo, y el cursor en el primero (la misma pieza en todos los formularios)
      if (A.faltan(env, [[!c && nombre.length < 3, 'rr-nom', 'Escribe el nombre del cliente.'], [!c && !/^[VJEGP]-?\d{6,9}-?\d?$/i.test(rif), 'rr-rif', 'Escribe el RIF, por ejemplo J-12345678-9.'],
        [num.length !== 14 || !!dup(), 'rr-num', num.length !== 14 ? 'El número tiene 14 cifras: año, mes y 8 más.' : 'Ya está registrado: no se registra dos veces.'],
        [!monto || monto <= 0, 'rr-monto', 'Escribe el monto en bolívares.'], [!pdf, 'rr-pdf', 'Falta el PDF del comprobante.']])) return;
      const v = D.VENTAS_EMPRESAS.find(x => x.id === $('#rr-fac').value);
      const r = { id: 'rr' + (D.RET_RECIBIDAS.length + 1), comp: num, cliente: nombre, rif, tipo: $('#rr-tipo').value, monto: r2(monto), periodo: $('#rr-per').value, fecha: '5 oct', tasa: D.TASA.usd, factura: v ? v.num : '', estado: aprendiz ? 'por_aprobar' : 'por_descontar', pdf: pdf.name };
      D.RET_RECIBIDAS.push(r); if (v) v.retencion = D.retencionDe(v);
      D.ARCHIVOS.unshift({ id: 'a' + Date.now(), carpeta: 'fiscal', nombre: pdf.name, fecha: '5 oct 2026', vence: '—', vinculo: 'Retención ' + num, abrir: 'retrec:' + r.id, version: 1 }); sumarArchivo();
      A.auditar({ modulo: 'Fiscal', registro: 'Retención ' + num, campo: 'creada', despues: nombre + ' · ' + r.tipo + ' · ' + dinero(r.monto, 'bs') + (v ? ' · factura N.º ' + v.num : '') });
      if (aprendiz) { A.proponer({ clave: 'retrec:' + r.id, titulo: 'Registrar el comprobante de ' + nombre, registro: 'Retención ' + num, modulo: 'Fiscal', r: rg, accion: { nombre: 'retrec-nueva', arg: r.id, campo: 'registrar el comprobante', txt: 'Registrar el comprobante de ' + nombre + ' · ' + r.tipo + ' · ' + dinero(r.monto, 'bs') } });
        A.cerrarModal(); A.pintarPagina(); A.aviso('Enviado para aprobar. Le llegó a ' + rg.quien + '.'); return; }
      A.cerrarModal(); A.pintarPagina(); A.aviso('Comprobante registrado.' + (r.tipo === 'IVA' ? ' Queda por descontar: márcalo en la hoja de IVA si va en esta quincena.' : ''));
    };
  };
  ACC['ver-retrec'] = id => { A.cerrarModal(); A.abrir('retrec', id); };
  FICHAS.retemi = id => {
    const r = D.RET_EMITIDAS.find(x => x.id === id); const pv = provDe(r.prov);
    // la retención baja el saldo de su factura: el proveedor la cobra completa menos esto (la de IVA va en «ret» y la de ISLR en «retIslr»)
    const f = D.FACTURAS.find(x => x.prov === r.prov && x.num === r.factura); const rf = f ? (f.ret && f.ret.id === r.id ? f.ret : f.retIslr && f.retIslr.id === r.id ? f.retIslr : f.retPend && f.retPend.id === r.id ? f.retPend : null) : null;
    const islr = r.tipo.startsWith('ISLR'); const borr = r.estado === 'borrador';
    const enlaceFac = f && puede('proveedores') ? `<button class="enlace" data-abrir="factura:${f.id}">factura N.º ${esc(f.num)}</button>` : 'factura N.º ' + esc(r.factura);
    return { titulo: borr ? 'Retención por emitir' : 'Comprobante ' + r.comp, sub: esc(prov(r.prov)) + ' · factura ' + esc(r.factura), mod: 'fiscal', obj: r, registro: 'Retención ' + (r.comp || r.factura), anulable: !borr && r.estado !== 'enterada', tags: [[borr ? 'Por emitir' : A.estadoTag(r.estado).replace(/<[^>]+>/g, ''), r.estado === 'entregada' ? 'ok' : borr ? 'aviso' : 'info']],
      bloques: [{ filas: [{ l: 'Proveedor', v: esc(pv.nombre || '—') }, { l: 'RIF', v: `<span class="mono">${esc(pv.rif || '—')}</span>` }, { l: 'Tipo', v: esc(r.tipo) }, { l: 'Factura', v: esc(r.factura) + ' · ' + esc(r.fecha) }, { l: 'Número de control', v: esc(r.control) + (/sin control/.test(r.control) ? ' ' + tag('Se retiene el 100 %', 'aviso') : '') },
        { l: islr ? 'Base sin IVA (Bs)' : 'Base (Bs)', v: A.bs(r.base, { tasa: r.tasa }) }, ...(islr ? [] : [{ l: 'IVA de la factura (Bs)', v: A.bs(r.iva, { tasa: r.tasa }) }]), { l: 'Porcentaje', v: fmt(r.pctRet, 0) + ' % ' + (islr ? 'de la base sin IVA' : 'del IVA') },
        { l: 'Monto retenido (Bs)', v: A.bs(r.monto, { tasa: r.tasa }) }, { l: 'Tasa BCV de ese día', v: dinero(r.tasa, 'bs') },
        ...(rf ? [{ l: borr ? 'Al emitirla, se le descuenta' : 'Se le descuenta al proveedor', v: `${dinero(rf.usd, 'usd')} de la ${enlaceFac}` }] : []),
        ...(islr ? [{ l: 'Se declara en', v: `Las retenciones de ISLR de septiembre (${puede('fiscal') ? '<button class="enlace" data-abrir="obligacion:o2">vence el mar 6 oct</button>' : 'vence el mar 6 oct'})` }] : []),
        { l: 'Número', v: borr ? 'Se asigna al emitirlo: el siguiente es <span class="mono">' + esc(siguienteNum(r)) + '</span>' : `<span class="mono">${esc(r.comp)}</span>` },
        { l: 'Plazo de entrega', v: '2 días hábiles ' + duda('q17') }] },
        { html: '<p class="muted">Si no se entrega a tiempo, la multa es de 100 veces el euro BCV y puede haber hasta 10 días de cierre.</p>' }],
      acciones: borr ? [{ txt: 'Emitir el comprobante', acc: 'emitir-ret', arg: r.id, icono: 'archivo', tono: 'pri', solo: 'editar', plata: true }] : r.estado === 'emitida' ? [{ txt: 'Marcar entregado', acc: 'entregar-ret', arg: r.id, icono: 'check', tono: 'pri', solo: 'editar' }] : [{ txt: 'Descargar PDF', acc: 'descargar', icono: 'descargar' }] };
  };
  // los que faltan por emitir, para la cifra de Retenciones
  FICHAS.poremitir = () => {
    const xs = D.RET_EMITIDAS.filter(r => r.estado === 'borrador');
    return { titulo: 'Comprobantes por emitir', sub: 'Fiscal · retenciones a proveedores', mod: 'fiscal', tags: [[xs.length ? xs.length + ' por emitir' : 'Ninguno por emitir', xs.length ? 'aviso' : 'ok']],
      bloques: [xs.length ? { html: `<ul class="lista">${xs.map(r => `<li><button class="fila" data-abrir="retemi:${r.id}"><span class="lead aviso">${ic('archivo')}</span><span class="medio"><b>${esc(prov(r.prov))}</b><small>Factura N.º ${esc(r.factura)} · ${esc(r.fecha)} · ${esc(r.tipo)}${/sin control/.test(r.control) ? ' · sin número de control' : ''}</small></span><span class="monto">${A.bs(r.monto, { tasa: r.tasa })}</span></button></li>`).join('')}</ul>` } : { html: '<p class="muted">No queda ninguno por emitir.</p>' },
        { html: `<p class="muted">Cada uno se revisa y se emite en su ficha: al emitirlo toma el siguiente número y baja lo que se le paga al proveedor. Se le entrega en 2 días hábiles ${tag(conCecilia(), 'aviso')} ${enlacePregunta('q17')}</p>` }] };
  };
  // emitir: antes de hacerlo, la ventana muestra lo que se emite (RIF, factura con su número de control, base, porcentaje y monto en Bs) y el número que toma
  // un aprendiz lo manda a aprobar desde la misma ventana: el botón dice «Enviar para aprobar» y el número se asigna al aprobarlo
  const datosEmitir = (r, num) => { const pv = provDe(r.prov); const islr = r.tipo.startsWith('ISLR');
    return `<dl class="kv emitir-kv"><div><dt>Proveedor</dt><dd>${esc(pv.nombre || '—')}</dd></div><div><dt>RIF</dt><dd class="mono">${esc(pv.rif || '—')}</dd></div><div><dt>Factura</dt><dd>N.º ${esc(r.factura)} · ${esc(r.fecha)}</dd></div><div><dt>Número de control</dt><dd>${esc(r.control)}</dd></div>
        <div><dt>${islr ? 'Base sin IVA' : 'Base'}</dt><dd>${A.bs(r.base, { tasa: r.tasa })}</dd></div>${islr ? '' : `<div><dt>IVA de la factura</dt><dd>${A.bs(r.iva, { tasa: r.tasa })}</dd></div>`}<div><dt>Porcentaje</dt><dd>${fmt(r.pctRet, 0)} % ${islr ? 'de la base' : 'del IVA'}</dd></div>
        <div class="total"><dt><b>Monto retenido</b></dt><dd>${A.bs(r.monto, { tasa: r.tasa })}</dd></div><div><dt>Número que toma</dt><dd class="mono">${num ? esc(num) : 'El siguiente libre, al aprobarlo'}</dd></div></dl>`; };
  ACC['emitir-ret'] = id => {
    const r = D.RET_EMITIDAS.find(x => x.id === id); const pv = provDe(r.prov); const islr = r.tipo.startsWith('ISLR'); const env = $('#modal-raiz');
    const rg = A.regla({ mod: 'fiscal', plata: true }); const aprendiz = rg.modo === 'aprobar'; const num = aprendiz ? '' : siguienteNum(r);
    A.modal(`<h2 id="modal-t">${aprendiz ? 'Enviar para aprobar' : 'Emitir el comprobante'}</h2><p class="muted" id="modal-d">${aprendiz ? 'Emitir el comprobante de ' + esc(pv.nombre || '') + '. Lo aprueba ' + esc(rg.quien) + ': al aprobarlo toma su número y ya no se edita.' : 'Revisa los datos: al emitirlo ya no se edita (si algo está mal, se anula y se emite otro).'}</p>
      ${datosEmitir(r, num)}
      <p class="muted">${islr ? 'Va en la declaración de retenciones de ISLR del mes.' : 'Va en la declaración de IVA de su quincena, y baja lo que se le paga al proveedor.'}</p>
      <div class="modal-acc"><button class="btn sec" data-em="no">Cancelar</button>${aprendiz ? `<span class="btn-con-nota"><button class="btn pri" data-em="si">${ic('enviar', 's')}Enviar para aprobar</button><small class="btn-nota">Lo aprueba ${esc(rg.quien)}</small></span>` : `<button class="btn pri" data-em="si">${ic('archivo', 's')}Emitir el comprobante</button>`}</div>`);
    $('#modal-raiz [data-em="si"]').focus();
    env.onclick = e => {
      const b = e.target.closest('[data-em]'); if (!b) return; A.cerrarModal(); if (b.dataset.em === 'no') return;
      if (aprendiz) {
        A.proponer({ clave: 'retemi:' + id, titulo: 'Emitir el comprobante de ' + (pv.nombre || ''), registro: 'Retención de ' + (pv.nombre || '') + ' · factura N.º ' + r.factura, modulo: 'Fiscal', r: rg,
          accion: { nombre: 'emitir-ret', arg: id, campo: 'emitir el comprobante', txt: 'Emitir el comprobante de ' + (pv.nombre || '') + ' · ' + dinero(r.monto, 'bs'), det: datosEmitir(r, '') } });
        A.pintarFicha(); A.pintarPagina(); A.aviso('Enviado para aprobar. Le llegó a ' + rg.quien + '.'); return;
      }
      emitirRet(r, num);
    };
  };
  // emitir de verdad: lo hace quien emite directo y, lo de un aprendiz, quien lo aprueba (con el número que esté libre en ese momento)
  A.EJECUTA['emitir-ret'] = id => { const r = D.RET_EMITIDAS.find(x => x.id === id); if (r && r.estado === 'borrador') emitirRet(r, siguienteNum(r)); };
  function emitirRet(r, num) {
      r.comp = num; r.estado = 'emitida';
      const c = D.COMPRAS.find(x => x.id === r.lc); if (c) c.comp = num;
      // la factura: la retención pasa de «por emitir» a hecha y baja su saldo; si su línea del lunes no se ha pagado y el lote está abierto, la sigue
      const f = D.FACTURAS.find(x => x.prov === r.prov && x.num === r.factura); const antes = f ? f.saldo : null;
      D.enlazarRet(r);
      if (f && f.saldo > 0 && !f.pago) { const u = r2(r.monto / r.tasa); f.saldo = r2(Math.max(0, f.saldo - u)); const p = D.PROVEEDORES.find(x => x.id === r.prov); if (p) p.deuda = r2(D.FACTURAS.filter(x => x.prov === p.id).reduce((s, x) => s + x.saldo, 0));
        const l = D.LUNES.find(x => x.p === r.prov); const abierto = !A.PAGOS || !!A.PAGOS.P.cambio || !A.PAGOS.P.aprobado;
        if (l && !l.c && abierto) l.m = r2(D.FACTURAS.filter(x => x.prov === l.p && x.saldo > 0).reduce((s, x) => s + x.saldo, 0)); }
      A.auditar({ modulo: 'Fiscal', registro: 'Retención ' + num, campo: 'estado', antes: 'por emitir', despues: 'emitida · ' + dinero(r.monto, 'bs') + (f && antes !== null ? ' · saldo de la factura ' + dinero(antes, 'usd') + ' → ' + dinero(f.saldo, 'usd') : '') });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Comprobante emitido: ' + num + '.');
  }
  ACC['entregar-ret'] = id => { const r = D.RET_EMITIDAS.find(x => x.id === id); r.estado = 'entregada'; A.auditar({ modulo: 'Fiscal', registro: 'Retención ' + r.comp, campo: 'estado', antes: 'emitida', despues: 'entregada' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Marcado como entregado al proveedor.'); };

  /* ---------- 6. nómina, IGTF y municipio ---------- */
  function parafiscales() {
    const P = vistaPatente(), o6 = obl('o6'); const z1 = zHay(1), z2 = zHay(2);
    // el monto de cada fila es el de su obligación: el mismo que sale en «Lo que vence»
    const filas = D.PARAFISCALES.map(p => {
      const o = obl(p.id); const monto = o ? o.monto : p.monto;
      return { abrir: o ? 'obligacion:' + o.id : 'oblconf:' + p.conf, monto, celdas: [`<b>${esc(p.ente)}</b><small>${esc(p.corto)}${p.nota ? ' · ' + (p.pregunta ? 'base exacta: ' + enlacePregunta(p.pregunta) : esc(paraCecilia(p.nota.charAt(0).toLowerCase() + p.nota.slice(1)))) : ''}</small>`, p.base ? A.bs(p.base, { usd: baseUsd(p) }) : dinero(0, 'bs'), A.bs(monto, o ? opObl(o) : { hoy: true }), tag(p.vence, p.vence === 'Hoy' ? 'alerta' : '')] };
    });
    const tot = r2(filas.reduce((s, f) => s + f.monto, 0));
    return `<p class="nota gris">${ic('candado', 's')}<span>Las bases salen solo de la nómina formal (${NF.personas} personas) y llegan agrupadas, sin nombres ni sueldos por persona.</span></p>
      ${A.tabla({ cols: [{ t: 'Aporte', cls: 'p' }, { t: 'Base (Bs)', cls: 'r x plata' }, { t: 'Monto (Bs)', cls: 'r plata' }, { t: 'Vence', cls: 'e' }], filas, pie: ['Total', '', A.bs(tot, { hoy: true, estimado: true }), ''] })}
      <p class="muted">Cada aporte tiene su base; debajo, su equivalente en dólares a la tasa de cada día de pago. El 10 % es salario: entra en el FAOV, el INCES y las pensiones, pero solo la parte de la nómina formal (${dinero(NF.diezEur.sep[0], 'eur')} del 10 % de septiembre, a ${dinero(NF.diezEur.sep[1], 'bs')}). El incremento del cestaticket no es salario: solo entra en las pensiones.</p>
      <div class="rejilla"><div class="c6"><article class="hoja"><h2>IGTF cobrado (3 % de los cobros en divisas)</h2><dl class="kv"><div><dt>1.ª quincena de septiembre</dt><dd>${A.bs(D.IVA_Q1.igtf, { usd: usdDocs(z1, 'igtf') })} ${tag('Declarado', 'ok')}</dd></div><div><dt>2.ª quincena de septiembre</dt><dd>${A.bs(D.IVA_HOJA.igtf, { usd: usdDocs(z2, 'igtf') })} ${tag('En la hoja de IVA', 'aviso')}</dd></div></dl><p class="muted">Sale sumado de los Z, cada uno a la tasa de su día. Nadie lo carga cobro por cobro.</p></article></div>
      <div class="c6"><article class="hoja"><h2>Patente municipal (Valencia)</h2>${notaCambio(cambioPatente())}<dl class="kv"><div><dt>Ventas de ${esc(P.mes)} (libro de ventas, sin IVA)</dt><dd>${A.bs(P.ventas, { usd: P.ventasUsd })}</dd></div><div><dt>Alícuota</dt><dd>${P.pct} % ${duda('q6')}</dd></div><div><dt>${P.pct} % de las ventas</dt><dd>${A.bs(P.cuatro, { hoy: true })}</dd></div><div><dt>Mínimo del mes (${P.minimoEur} veces el euro BCV)</dt><dd>${A.bs(P.minimo, { hoy: true })}</dd></div>
        <div class="total"><dt><b>A pagar: el mayor de los dos</b></dt><dd>${A.bs(o6.monto, opObl(o6))}</dd></div><div><dt>Vence</dt><dd>${esc(D.PATENTE.vence)}</dd></div></dl>
        <p class="muted">Se paga en bolívares.</p></article></div></div>`;
  }

  /* ---------- 7. permisos y máquina fiscal ---------- */
  function permisos() {
    const m = D.MAQUINAS[0];
    return `<article class="hoja"><div class="hoja-cab"><h2>${ic('archivo')}Máquina fiscal</h2>${tag('Inspección vencida', 'alerta')}</div>
        <button class="fila" data-abrir="maquina:m1" style="padding-inline:0"><span class="medio"><b>${esc(m.modelo)}</b><small>Serial ${esc(m.serial)} · ${esc(m.ubicacion)} · último ${esc(m.ultimaZ)}</small></span>${ic('derecha', 's chev')}</button></article>
      <div class="sec"><h2>Permisos y licencias</h2>${A.boton('fiscal', 'Agregar un permiso', 'data-acc="pronto"', { tono: 'sec', icono: 'mas', chico: true })}</div>
      ${A.tabla({ cols: [{ t: 'Permiso', cls: 'p' }, { t: 'Ente', cls: 'x' }, { t: 'N.º', cls: 'x' }, { t: 'Vence', cls: 'r' }, { t: 'Estado', cls: 'e' }], filas: D.PERMISOS_LIC.map(p => ({ abrir: 'permiso:' + p.id, celdas: [`<b>${esc(p.nombre)}</b><small>${esc(p.ente)}${p.nota ? ' · ' + esc(p.nota) : ''}</small>`, esc(p.ente), esc(p.num), esc(p.vence) + (p.faltan !== null && p.faltan < 60 ? `<br><small class="muted">en ${p.faltan} días</small>` : ''), A.estadoTag(p.estado)] })) })}
      <p class="muted">Desde el 12 de agosto el RIF ya no vence ni hay que colgarlo, pero su número sí va en facturas y anuncios. La copia de la declaración de ISLR: la ley la sigue pidiendo, aunque por ahora el SENIAT no la revisa. La licencia municipal sí se exhibe.</p>`;
  }
  FICHAS.permiso = id => {
    const p = D.PERMISOS_LIC.find(x => x.id === id);
    return { titulo: p.nombre, sub: esc(p.ente), mod: 'fiscal', obj: p, registro: p.nombre, tags: [[A.estadoTag(p.estado).replace(/<[^>]+>/g, ''), { vigente: 'ok', por_vencer: 'aviso', vencido: 'alerta', en_tramite: 'info' }[p.estado]]],
      bloques: [{ filas: [{ l: 'Número', v: esc(p.num), campo: { k: 'num', tipo: 'texto' } }, { l: 'Vence', v: esc(p.vence), campo: { k: 'vence', tipo: 'texto' } }, { l: 'Avisar con (días)', v: p.aviso + ' días antes', campo: { k: 'aviso', tipo: 'numero', entero: true, obligatorio: true } }, { l: 'Responsable', v: 'Jose' }] },
        { titulo: 'Versiones', tiempo: [['oct 2025', 'Renovación vigente (versión 1).', 'ok']] }, { titulo: 'Archivo', adjuntos: [p.nombre + ' vigente.pdf'] },
        { html: '<p class="muted">Subir la renovación crea una versión nueva; la anterior queda guardada.</p>' }],
      acciones: [{ txt: 'Marcar en trámite', acc: 'permiso-tramite', arg: p.id, icono: 'reloj', solo: 'editar' }, { txt: 'Subir la renovación', acc: 'pronto', icono: 'subir', tono: 'pri', solo: 'editar' }] };
  };
  ACC['permiso-tramite'] = id => { const p = D.PERMISOS_LIC.find(x => x.id === id); p.estado = 'en_tramite'; A.auditar({ modulo: 'Fiscal', registro: p.nombre, campo: 'estado', antes: 'por vencer', despues: 'en trámite' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Marcado en trámite.'); };
  FICHAS.maquina = id => {
    const m = D.MAQUINAS.find(x => x.id === id);
    return { titulo: 'Máquina fiscal', sub: esc(m.modelo), mod: 'fiscal', obj: m, registro: 'Máquina fiscal', tags: [['Inspección vencida', 'alerta'], ['Operativa', 'ok']],
      aviso: `<p class="nota alerta">${ic('alerta', 's')}<span>La inspección técnica anual venció el 28 de septiembre. Hay que llamar al técnico autorizado; si la máquina se daña, se factura con el talonario de contingencia.</span></p>`,
      bloques: [{ filas: [{ l: 'Serial', v: `<span class="mono">${esc(m.serial)}</span>` }, { l: 'Ubicación', v: esc(m.ubicacion), campo: { k: 'ubicacion', tipo: 'texto' } }, { l: 'Último Z', v: esc(m.ultimaZ) }, { l: 'Próxima inspección', v: esc(m.inspeccion), campo: { k: 'inspeccion', tipo: 'texto' } }] }, { titulo: 'Libro de reparaciones', tiempo: [['sep 2025', 'Inspección anual al día.', 'ok'], ['mar 2026', 'Cambio de cabezal de impresión.']] }] };
  };

  /* ---------- 8. paquete del mes ---------- */
  // cada pieza: qué trae, qué falta y dónde se ve suelta · «cuenta» dice cuánto hay y si está lista, contado de lo que hay; «faltas», qué falta (cada una abre su origen)
  const PIEZA = {
    z: { ir: 'fiscal/z', lista: 'Lo que falta', txt: 'Los reportes Z de la máquina fiscal, uno por día. Sin el de un día no cierra el libro de ventas.',
      cuenta: () => { const z = zq(); const hay = z.filter(x => x.base !== null).length; return [hay + ' de ' + z.length, hay === z.length ? 'ok' : 'aviso']; },
      faltas: () => zq().filter(z => z.base === null).sort(porDia).map(z => ({ abrir: 'zeta:' + z.id, t: 'Falta el Z del ' + z.fecha.toLowerCase() })),
      filas: () => zq().filter(z => z.estado !== 'confirmado').sort(porDia).map(z => ({ abrir: 'zeta:' + z.id, t: 'Z del ' + z.fecha.toLowerCase(), s: z.estado === 'falta' ? 'Falta: no se ha subido · lo sube Jose' : 'Leído, falta que lo confirme ' + confirmaZTxt(), tono: z.estado === 'falta' ? 'alerta' : 'aviso' })) },
    empresas: { ir: 'clientes/empresas', txt: 'Las facturas con el RIF del cliente, aparte del resumen de los Z.', cuenta: () => [D.VENTAS_EMPRESAS.length + ' de ' + D.VENTAS_EMPRESAS.length, 'ok'],
      filas: () => D.VENTAS_EMPRESAS.map(v => ({ abrir: 'ventaemp:' + v.id, t: 'N.º ' + v.num + ' · ' + v.cliente, s: v.fecha + ' · base ' + dinero(v.base, 'bs') + ' ≈ ' + dinero(r2(v.base / v.tasa), 'usd'), tono: 'ok' })) },
    compras: { ir: 'proveedores/facturas', txt: 'Las facturas de los proveedores del mes, de la copia de Odoo. Hoy la copia es a mano los domingos (la última, el dom 4 oct): la automática sigue bloqueada.',
      filas: () => [] },
    retenciones: { ir: 'fiscal/retenciones', txt: 'Los comprobantes de retención que nos mandaron los clientes especiales en septiembre. Se descuentan en la declaración de IVA.',
      cuenta: () => { const n = D.RET_RECIBIDAS.filter(r => r.periodo === '2026-09').length; return [n === 1 ? '1 nueva' : n + ' nuevas', 'ok']; },
      filas: () => D.RET_RECIBIDAS.filter(r => r.periodo === '2026-09').map(r => ({ abrir: 'retrec:' + r.id, t: r.cliente + ' · ' + r.tipo, s: 'Comp. ' + r.comp + ' · ' + dinero(r.monto, 'bs') + ' ≈ ' + dinero(r2(r.monto / r.tasa), 'usd'), tono: 'ok' })) },
    bancos: { ir: 'bancos', txt: 'Los estados de cuenta de septiembre de las cuatro cuentas en bolívares. Con ellos se concilia el mes.',
      cuenta: () => { const c = D.CONCILIACION; const hay = c.filter(x => x.estado !== 'falta').length; return [hay + ' de ' + c.length + ' bancos', hay === c.length ? 'ok' : 'aviso']; },
      faltas: () => D.CONCILIACION.filter(x => x.estado === 'falta').map(x => ({ abrir: 'conciliacion:' + x.id, t: 'Falta el ' + x.id })),
      filas: () => D.CONCILIACION.map(c => ({ abrir: 'conciliacion:' + c.id, t: c.id + ' · ' + ((D.CUENTAS.find(x => x.id === c.id) || {}).nombre || ''), s: c.estado === 'falta' ? 'Falta el estado de cuenta · lo sube Jose' : 'Subido el ' + c.subido.toLowerCase() + ' por ' + c.por, tono: c.estado === 'falta' ? 'alerta' : 'ok' })) },
    nomina: { ir: 'nomina/corridas', txt: 'La nómina formal de septiembre, agrupada por corrida y sin nombres. Con ella se declaran el IVSS, el FAOV, el INCES y las pensiones. La nómina interna no va a los entes.',
      filas: () => D.NOMINA.corridas.filter(c => /sep/.test(c.fecha) && (c.tipo === 'formal' || c.tipo === 'diez')).sort((a, b) => (parseInt(a.fecha, 10) - parseInt(b.fecha, 10)) || ((a.tipo === 'diez') - (b.tipo === 'diez'))).map(c => ({ abrir: 'corrida:' + c.id, t: A.corridas.nombre(c) + ' · ' + c.fecha, s: c.personas + ' personas · ' + (c.mon === 'eur' ? dinero(c.total, 'eur') + (c.formalEur ? ': ' + dinero(c.formalEur, 'eur') + ' son de la nómina formal y entran en las bases' : '') : dinero(c.total, 'usd')), tono: 'ok' })) },
  };
  // las piezas del paquete, contadas de lo que hay (y anotadas en D.PAQUETE, para quien las lea)
  const piezas = () => D.PAQUETE.map((x, i) => {
    const [t, n0, e0, k, quien] = x; const P = PIEZA[k] || {};
    const [n, e] = P.cuenta ? P.cuenta() : [n0, e0]; x[1] = n; x[2] = e;
    return { i, t, n, e, k, quien, faltas: e === 'ok' || !P.faltas ? [] : P.faltas() };
  });
  // «Falta el BNC · lo sube Jose», «Falta el Z del dom 13 · lo sube Jose»: lo que falta del paquete, en una línea
  const faltaTxt = ps => ps.filter(p => p.e !== 'ok').map(p => p.faltas.map(f => f.t + ' · lo sube ' + p.quien).join(' · ')).filter(Boolean).join(' · ');
  function paquete() {
    const ps = piezas(); const listos = ps.filter(p => p.e === 'ok').length; const completo = listos === ps.length; const avisado = F.avisar.has(S.usuario.id);
    return `<article class="hoja"><div class="hoja-cab"><h2>${ic('archivo')}${aCecilia('Tu paquete de septiembre', 'Paquete de septiembre para la contadora')}</h2>${tag(listos + ' de ' + ps.length + ' listos', completo ? 'ok' : 'aviso')}</div>
        <ul class="lista">${ps.map(p => `<li><button class="fila" data-abrir="paquete:${p.i}"><span class="lead ${p.e === 'ok' ? 'ok' : 'aviso'}">${ic(p.e === 'ok' ? 'check' : 'reloj')}</span><span class="medio"><b>${esc(p.t)}</b><small>${esc(p.n)}</small></span><span class="fin">${tag(p.e === 'ok' ? 'Listo' : 'Falta', p.e === 'ok' ? 'ok' : 'aviso')}${ic('derecha', 's chev')}</span></button>
          ${p.faltas.length ? `<ul class="paq-faltas">${p.faltas.map(f => `<li><button class="paq-falta" data-abrir="${f.abrir}">${ic('alerta', 's')}<span>${esc(f.t)} · lo sube ${esc(p.quien)}</span>${ic('derecha', 's')}</button></li>`).join('')}</ul>` : ''}</li>`).join('')}</ul>
        <div class="fila-btns"><button class="btn pri" data-acc="bajar-paquete">${ic('descargar', 's')}${completo ? 'Descargar el paquete' : `Descargar lo que está listo (${listos} de ${ps.length})`}</button>
          ${completo ? '' : `<button class="btn sec" data-acc="paq-avisar" aria-pressed="${avisado}">${ic(avisado ? 'check' : 'campana', 's')}${avisado ? 'Te avisamos cuando esté completo' : 'Avísame cuando esté completo'}</button>`}</div>
        <p class="muted">Pide tu código y queda anotado quién lo descargó y cuándo. Toca cada pieza para ver qué trae y qué falta; también se ve suelta en su sección.</p></article>`;
  }
  FICHAS.paquete = i => {
    const p = piezas()[+i]; const P = PIEZA[p.k] || { ir: '', txt: '', filas: () => [] }; const filas = P.filas();
    const mod = P.ir.split('/')[0];
    return { titulo: p.t, sub: 'Paquete de septiembre · ' + esc(p.n), mod: 'fiscal', tags: [[p.e === 'ok' ? 'Listo' : 'Falta', p.e === 'ok' ? 'ok' : 'aviso']],
      bloques: [{ html: `<p>${esc(P.txt)}</p>${p.e !== 'ok' ? `<p class="muted">Lo sube ${esc(p.quien)}.</p>` : ''}` },
        filas.length ? { titulo: P.lista || 'Qué trae', html: `<ul class="lista">${filas.map(f => `<li><button class="fila" data-abrir="${f.abrir}"><span class="lead ${f.tono}">${ic(f.tono === 'ok' ? 'check' : 'reloj')}</span><span class="medio"><b>${esc(f.t)}</b><small>${esc(f.s)}</small></span>${ic('derecha', 's chev')}</button></li>`).join('')}</ul>` } : { oculto: true },
        { html: '<p class="muted">Va dentro del paquete del mes. Descargarlo pide tu código y queda anotado.</p>' }],
      acciones: mod && puede(mod) ? [{ txt: 'Verlo en su sección', acc: 'ir-a', arg: P.ir, icono: 'derecha' }] : [] };
  };
  // descargar: si falta algo, el botón y la ventana del código dicen cuánto está listo y qué falta
  ACC['bajar-paquete'] = () => {
    const ps = piezas(); const listos = ps.filter(p => p.e === 'ok').length; const completo = listos === ps.length; const falta = faltaTxt(ps);
    A.pedirCodigo({ que: completo ? 'Descargar el paquete fiscal de septiembre' : `Descargar lo que está listo del paquete de septiembre (${listos} de ${ps.length})`, det: (completo ? '' : esc(falta) + '. ') + 'Queda anotado en el registro de accesos.', boton: completo ? 'Descargar' : `Descargar ${listos} de ${ps.length}` }).then(() => {
      D.ACCESOS.unshift({ cuando: 'Hoy ' + D.HOY.hora, quien: S.usuario.nombre, que: completo ? 'Descargó el paquete fiscal de septiembre (con código)' : `Descargó lo que estaba listo del paquete fiscal de septiembre, ${listos} de ${ps.length} (con código)`, donde: 'Este equipo' });
      A.aviso(completo ? 'Paquete descargado y anotado en el registro de accesos. (Simulado)' : `Descargado lo que está listo (${listos} de ${ps.length}). ${falta}. (Simulado)`);
    }).catch(() => {});
  };
  ACC['paq-avisar'] = () => { const u = S.usuario.id; if (F.avisar.has(u)) { F.avisar.delete(u); A.aviso('Listo: ya no te avisamos.', 'info'); } else { F.avisar.add(u); A.aviso('Te avisaremos por WhatsApp y en Pendientes cuando esté completo.'); } A.pintarPagina(); };

  /* ---------- 9. preguntas para Cecilia ---------- */
  // las urgentes se nombran arriba sin cambiar el orden: los números se citan en otras pantallas
  const notaUrgentes = () => {
    const urg = D.PREGUNTAS.map((q, i) => ({ q, n: i + 1 })).filter(x => x.q.urgente && x.q.estado === 'abierta');
    return urg.length ? `<p class="nota aviso">${ic('alerta', 's')}<span><b>${urg.length === 1 ? 'Una no puede esperar' : urg.length + ' no pueden esperar'}:</b> ${urg.map(x => `la ${x.n} (${esc(x.q.corto || '')}${x.q.urgente !== 'Urgente' ? ', ' + esc(x.q.urgente.toLowerCase()) : ''})`).join(' y ')}.</span></p>` : '';
  };
  const tagsPregunta = q => (q.urgente && q.estado === 'abierta' ? tag(q.urgente, 'aviso') : '') + A.estadoTag(q.estado);
  const guardadoTxt = q => q.guardada ? `${ic('check', 'xs')}<span>Guardado ${esc(q.guardada)}</span>` : '<span>Se guarda sola al salir del cuadro.</span>';
  function preguntas() {
    const puedeResp = S.usuario.rol === 'fiscal_externo' || S.usuario.rol === 'dueno';
    return `<p class="desc">Antes de construir lo fiscal hacen falta estas respuestas. ${aCecilia('Las contestas', 'La contadora las contesta')} aquí mismo y Alejandro las ve al instante. Donde una pantalla tiene una duda, su enlace trae aquí.</p>
      <div id="q-urgentes">${notaUrgentes()}</div>
      <ul class="lista">${D.PREGUNTAS.map((q, i) => `<li class="pregunta" id="pq-${q.id}" tabindex="-1">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><b>${i + 1}. ${esc(q.texto)}</b><span class="fila-tags" id="qt-${q.id}">${tagsPregunta(q)}</span></div>
        ${puedeResp ? `<label class="campo" for="q-${q.id}"><span class="sr-only">Respuesta a la pregunta ${i + 1}</span><textarea id="q-${q.id}" data-pregunta="${q.id}" placeholder="Escribe tu respuesta" aria-describedby="qg-${q.id}">${esc(q.resp)}</textarea></label><p class="guardado" id="qg-${q.id}" aria-live="polite">${guardadoTxt(q)}</p>` : (q.resp ? `<p class="muted">${esc(q.resp)}</p>` : '<p class="muted">Sin respuesta todavía.</p>')}
      </li>`).join('')}</ul>`;
  }
  // cada respuesta se guarda sola al salir de su cuadro, sin volver a dibujar la página: las que se están escribiendo no se pierden
  // una respuesta que tenía texto y quedó vacía no se borra sola: al lado del cuadro pregunta «¿Borrar tu respuesta?» (Borrar · Dejarla)
  // el registro de cambios guarda el texto completo (se acorta solo al mostrarlo en la tabla)
  function guardarRespuesta(ta, { borrar = false } = {}) {
    const q = D.PREGUNTAS.find(x => x.id === ta.dataset.pregunta); if (!q) return;
    const v = ta.value.trim(); const antes = (q.resp || '').trim(); const g = $('#qg-' + q.id);
    if (v === antes) { if (g && g.dataset.borrar) { delete g.dataset.borrar; g.innerHTML = guardadoTxt(q); } return; }
    if (!v && antes && !borrar) {
      if (g) { g.dataset.borrar = '1'; g.innerHTML = `${ic('alerta', 'xs')}<span>¿Borrar tu respuesta?</span><button class="enlace" type="button" data-acc="q-borrar" data-arg="${q.id}">Borrar</button><button class="enlace" type="button" data-acc="q-dejar" data-arg="${q.id}">Dejarla</button>`; }
      return;
    }
    q.resp = v; q.estado = v ? 'respondida' : 'abierta'; q.guardada = D.HOY.hora;
    A.auditar({ modulo: 'Fiscal', registro: 'Pregunta ' + q.id.slice(1), campo: 'respuesta', antes: antes || '—', despues: v || '—' });
    const t = $('#qt-' + q.id); if (t) t.innerHTML = tagsPregunta(q);
    if (g) { delete g.dataset.borrar; g.innerHTML = guardadoTxt(q); }
    const u = $('#q-urgentes'); if (u) u.innerHTML = notaUrgentes();
    const n = D.PREGUNTAS.filter(x => x.estado === 'abierta').length; const sn = document.querySelector('#main .subnav [data-sub="preguntas"]');
    if (sn) { let c = sn.querySelector('.cuenta'); if (n) { if (!c) { c = document.createElement('span'); c.className = 'cuenta gris'; sn.appendChild(c); } c.textContent = n; } else if (c) c.remove(); }
  }
  // «Borrar» la deja vacía (vuelve a «Abierta») · «Dejarla» devuelve el texto al cuadro, completo, y el teclado vuelve ahí
  ACC['q-borrar'] = id => { const ta = $('#q-' + id); if (!ta) return; ta.value = ''; guardarRespuesta(ta, { borrar: true }); const g = $('#qg-' + id); if (g) g.innerHTML = `${ic('check', 'xs')}<span>Respuesta borrada ${esc(D.HOY.hora)}</span>`; ta.focus(); };
  ACC['q-dejar'] = id => { const q = D.PREGUNTAS.find(x => x.id === id); const ta = $('#q-' + id); if (!q || !ta) return; ta.value = q.resp || ''; const g = $('#qg-' + id); if (g) { delete g.dataset.borrar; g.innerHTML = guardadoTxt(q); } ta.focus(); };

  /* ---------- 10. configuración fiscal ---------- */
  // [nombre, ente, frecuencia, cómo vence, responsable, días de aviso (0 = inactiva), pregunta para la contadora si la hay]
  const OBL_CONF = [
    ['IVA + anticipo + IGTF + ret. IVA', 'SENIAT', 'Quincenal', 'Calendario SPE, dígito 4', 'Cecilia', 5],
    ['Retenciones de ISLR', 'SENIAT', 'Mensual', 'Calendario SPE', 'Cecilia', 5],
    ['ISLR anual', 'SENIAT', 'Anual', 'Marzo, según el calendario SPE (en 2026 fue el 11)', 'Cecilia', 15],
    ['Pensiones (9 %)', 'SENIAT', 'Mensual', 'Calendario de pensiones', 'Jose', 5],
    ['IVSS y paro forzoso', 'IVSS', 'Mensual', 'Día fijo', 'Jose', 3],
    ['FAOV', 'BANAVIH', 'Mensual', 'Día fijo', 'Jose', 3],
    ['INCES', 'INCES', 'Trimestral', '5 días hábiles tras el trimestre', 'Jose', 5],
    ['INCES 0,5 % de las utilidades', 'INCES', 'Al pagar las utilidades', '10 días después de pagarlas (en diciembre)', 'Jose', 5],
    ['Declaración trimestral RNET', 'Ministerio del Trabajo', 'Trimestral', '15 días después del trimestre', 'Jose', 5],
    ['Patente', 'Alcaldía', 'Mensual', 'Primeros 20 días', 'Cecilia', 5],
    ['Definitiva de la patente', 'Alcaldía', 'Anual', 'Primeros 20 días de enero', 'Cecilia', 15],
    ['Aseo urbano', 'Alcaldía (IMA)', 'Mensual', 'Día fijo, antes de fin de mes', 'Jose', 5],
    ['LOCTI', 'SIDCAI', 'Mensual', 'No inscritos · gracia hasta abr 2027', '—', 30],
    ['Deporte (1 %)', 'IND', 'Anual', 'Omitida por decisión', '—', 0],
    ['Publicidad (aviso del toldo)', 'Alcaldía', 'Mensual', 'Cada mes, o el año entero antes del 31 mar con 15 % de rebaja', 'Cecilia', 5],
    ['Grandes Patrimonios', 'SENIAT', 'Anual · 2 fechas', '14 oct y 12 nov (RIF 1 y 4) · ¿declaración en cero? Por confirmar con Cecilia', 'Cecilia', 5, 'q12'],
    ['Asamblea con comisario', 'Registro Mercantil', 'Anual', 'Marzo (3 meses después del cierre)', 'Alejandro', 30],
    ['Estados financieros trimestrales', 'Para los socios', 'Trimestral', 'Al cerrar cada trimestre', 'Cecilia', 10],
  ];
  function config() {
    const filasObl = OBL_CONF;
    return `<div class="rejilla"><div class="c8 pila"><div class="sec"><h2>Obligaciones</h2>${A.boton('fiscal', 'Cargar el calendario 2027', 'data-acc="pronto"', { tono: 'sec', icono: 'calendario', chico: true })}</div>
        ${A.tabla({ cols: [{ t: 'Obligación', cls: 'p' }, { t: 'Frecuencia', cls: 'x' }, { t: 'Cómo vence', cls: 'x' }, { t: 'Responsable', cls: 'r' }, { t: 'Aviso', cls: 'e' }], filas: filasObl.map(f => ({ abrir: 'oblconf:' + f[0], celdas: [`<b>${esc(f[0])}</b><small>${esc(f[1])}</small>`, esc(f[2]), esc(f[3].replace('Por confirmar con Cecilia', conCecilia())) + (f[6] ? ' ' + enlacePregunta(f[6]) : ''), esc(f[4]), f[5] ? f[5] + ' días antes' : tag('Inactiva', '')] })) })}
        <p class="muted">Cada diciembre el SENIAT publica el calendario del año siguiente. Se carga una vez y la app arma todos los vencimientos.</p></div>
      <div class="c4 pila"><article class="hoja"><h2>Alícuotas</h2><dl class="kv">${D.PARAMS.alicuotas.map(a => `<div><dt>${esc(a[0])}</dt><dd>${esc(a[1])}</dd></div>`).join('')}</dl></article>
        <article class="hoja"><h2>Numeración</h2><dl class="kv"><div><dt>Retenciones de IVA</dt><dd class="mono">${esc(ultimoIva())}</dd></div><div><dt>Retenciones de ISLR</dt><dd class="mono">${esc(ultimoIslr())}</dd></div></dl><p class="muted">${aCecilia('Arranca en el número que usas hoy.', 'Arranca en el número que usa hoy Cecilia.')} Nunca deja huecos: el próximo de IVA es el ${esc(String(+ultimoIva().slice(-8) + 1).padStart(8, '0'))}.</p></article>
        <article class="hoja"><h2>Períodos cerrados</h2><dl class="kv"><div><dt>Agosto</dt><dd>${tag('Bloqueado', '')}</dd></div><div><dt>1.ª quincena de septiembre</dt><dd>${tag('Declarado', 'info')}</dd></div><div><dt>2.ª quincena de septiembre</dt><dd>${tag(estimado(obl('o1')) ? 'Abierto' : 'Declarado', estimado(obl('o1')) ? 'aviso' : 'info')}</dd></div></dl></article></div></div>`;
  }
  FICHAS.oblconf = nombre => {
    const f = OBL_CONF.find(x => x[0] === nombre) || [nombre, '', '—', '—', 'Cecilia', 5];
    return { titulo: nombre, sub: 'Configuración fiscal' + (f[1] ? ' · ' + esc(f[1]) : ''), mod: 'fiscal', obj: { resp: f[4], dias: f[5] }, registro: 'Obligación ' + nombre,
      bloques: [{ filas: [{ l: 'Frecuencia', v: esc(f[2]) }, { l: 'Cómo vence', v: esc(f[3].replace(' · ¿declaración en cero? Por confirmar con Cecilia', ' · ¿declaración en cero?').replace('Por confirmar con Cecilia', conCecilia())) + (f[6] ? ' ' + duda(f[6]) : ''), largo: true }, { l: 'Responsable', v: f[4] === '—' ? 'Sin responsable' : esc(f[4]), campo: { k: 'resp', tipo: 'select', opciones: [['—', 'Sin responsable'], 'Cecilia', 'Jose', 'Alejandro'] } }, { l: 'Avisar con (días)', v: f[5] ? f[5] + ' días antes' : 'No avisa', campo: { k: 'dias', tipo: 'numero', entero: true } }, { l: 'Activa', v: f[5] ? 'Sí' : 'No' }] }],
      alGuardar: cambios => cambios.forEach(c => { if (c.r.campo.k === 'resp') f[4] = c.nuevo; if (c.r.campo.k === 'dias') f[5] = c.nuevo; }) };
  };

  // la misma regla del botón, al tocar: quien solo mira Fiscal no llega a estas acciones (lo que mueve plata de un aprendiz va a aprobar)
  A.reglaAcc(['emitir-ret', 'entregar-ret', 'obl-paso', 'obl-declarar', 'retrec-nueva', 'permiso-tramite', 'confirmar-z', 'pedir-z', 'subir-z'], { mod: 'fiscal' });
  // para Inicio (Cecilia): los Z que faltan y cuánto del paquete está listo, contados igual que aquí
  A.fiscal = { zFaltan: () => zq().filter(z => z.base === null).sort(porDia), paquete: () => { const ps = piezas(); return { listos: ps.filter(p => p.e === 'ok').length, total: ps.length }; }, revisionIva, recalcular };

  /* ---------- la pantalla ---------- */
  // lo que vence hoy o mañana (o ya venció) sin hacer · los Z que faltan y los leídos sin confirmar · los permisos por vencer
  const venceN = () => D.OBLIGACIONES.filter(o => !hecha(o) && o.faltan <= 1).length;
  const zN = () => zq().filter(z => z.base === null || z.estado === 'leido').length;
  const permisosN = () => D.PERMISOS_LIC.filter(p => p.estado === 'por_vencer').length;
  PANT.fiscal = {
    titulo: 'Fiscal', grupo: 'Fiscal', icono: 'fiscal', mod: 'fiscal', palabras: 'seniat impuestos alcaldia declaracion',
    // los nombres largos van en el buscador («Fiscal › Permisos y máquina»); en la computadora las pestañas usan los cortos
    secciones: () => [['vence', 'Lo que vence', 'vencimientos calendario'], ['iva', 'Hoja de IVA', 'iva declaracion planilla'], ['z', 'Reportes Z y ventas', 'z maquina fiscal libro de ventas'], ['compras', 'Libro de compras', 'credito fiscal'],
      ['retenciones', 'Retenciones', 'retencion comprobante islr'], ['parafiscales', 'Nómina, IGTF y patente', 'ivss faov inces pensiones igtf patente parafiscales'], ['permisos', 'Permisos y máquina', 'licencia bomberos sanidad maquina fiscal'],
      ['paquete', 'Paquete del mes', 'paquete'], ['preguntas', aCecilia('Tus preguntas', 'Preguntas para la contadora'), 'preguntas contadora'], ['config', 'Configuración', 'configuracion obligaciones alicuotas numeracion']],
    // el número del menú: lo que vence hoy o mañana (o ya venció) y no está hecho · cada pestaña cuenta lo suyo, desde los datos
    cuenta: () => venceN(),
    render: (sub = 'vence') => {
      const cuerpo = { vence, iva: hojaIva, z: zetas, compras, retenciones, parafiscales, permisos, paquete, preguntas, config }[sub]();
      // Configuración no es una pestaña más: es un botón con engranaje en la cabecera (así las pestañas caben a 1366 px)
      const conf = `<button class="btn sec chico" data-sub="config" aria-current="${sub === 'config'}">${ic('engranaje', 's')}Configuración</button>`;
      return `<div class="pagina">${A.cab('SENIAT, Alcaldía y parafiscales', 'Fiscal', aCecilia('Aquí llenas lo fiscal y lo dejas listo para declarar.', 'Aquí la contadora llena lo fiscal y lo deja listo para declarar.') + ' Todo va en bolívares, como se declara, con su equivalente en dólares debajo. Cada cifra se abre para ver de dónde sale.', (esCecilia() ? tag('Trabajas como contadora externa', 'info') : '') + conf)}
        ${A.lectura('fiscal')}
        ${A.subnav([['vence', 'Lo que vence', venceN()], ['iva', 'Hoja de IVA', 0, false, 'IVA'], ['z', 'Reportes Z y ventas', zN(), false, 'Z y ventas'], ['compras', 'Libro de compras', 0, false, 'Compras'], ['retenciones', 'Retenciones'], ['parafiscales', 'Nómina, IGTF y patente'], ['permisos', 'Permisos y máquina', permisosN(), false, 'Permisos'], ['paquete', 'Paquete del mes', 0, false, 'Paquete'], ['preguntas', aCecilia('Tus preguntas', 'Preguntas para la contadora'), D.PREGUNTAS.filter(q => q.estado === 'abierta').length, true, aCecilia('Tus preguntas', 'Preguntas')]], sub)}
        ${cuerpo}</div>`;
    },
    montar: raiz => {
      const cr = $('#iva-credito', raiz);
      if (cr && !cr.readOnly) cr.addEventListener('change', () => { const n = leerNum(cr.value); if (n === null) return; const antes = F.credito; F.credito = n; A.auditar({ modulo: 'Fiscal', registro: 'Hoja de IVA 2.ª quinc. sep', campo: 'crédito de compras', antes: dinero(antes, 'bs'), despues: dinero(n, 'bs') }); syncIva(); A.pintarPagina(); A.aviso('Crédito actualizado. El resultado se recalculó.'); });
      $$('[data-desc]', raiz).forEach(ch => ch.addEventListener('change', () => { F.descontar[ch.dataset.desc] = ch.checked; syncIva(); A.pintarPagina(); }));
      $$('[data-pregunta]', raiz).forEach(ta => ta.addEventListener('change', () => guardarRespuesta(ta)));
    },
  };
  /* ---------- lo fiscal en el buscador (solo quien ve Fiscal) ----------
     un Z por su número (el que falta también: dice que falta), los comprobantes de retención emitidos y recibidos, los permisos y las
     preguntas para la contadora (una pregunta lleva a su cuadro, en Fiscal › Preguntas) */
  const corta = (t, n = 80) => (t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);
  A.BUSCABLES.push(() => {
    if (!puede('fiscal')) return [];
    const est = e => A.estadoTxt(e).toLowerCase();
    return [].concat(
      D.ZETAS.map(z => ({ t: z.num ? 'Reporte Z N.º ' + z.num : 'Reporte Z del ' + z.fecha.toLowerCase() + ' (falta)', que: 'Reporte Z · ' + (z.num ? est(z.estado === 'confirmado' ? 'confirmado_z' : z.estado) : 'falta subirlo'), dia: z.fecha.toLowerCase(), monto: z.base ? dinero(z.base, 'bs', 0) + ' de base' : '', montos: z.base ? [z.base] : [], refs: [String(z.num || z.numEsperado)], abrir: 'zeta:' + z.id, tipo: 'zeta' })),
      D.RET_EMITIDAS.map(r => ({ t: r.comp ? 'Retención N.º ' + r.comp : 'Retención por emitir · factura ' + r.factura, que: 'Retención de ' + r.tipo + ' a ' + prov(r.prov) + ' · ' + est(r.estado), dia: r.fecha, monto: dinero(r.monto, 'bs'), montos: [r.monto], refs: [r.comp, r.factura, r.control].filter(Boolean), abrir: 'retemi:' + r.id, tipo: 'retencion' })),
      D.RET_RECIBIDAS.map(r => ({ t: 'Retención recibida N.º ' + r.comp, que: 'Retención de ' + r.tipo + ' de ' + r.cliente + ' · ' + est(r.estado), dia: r.fecha, monto: dinero(r.monto, 'bs'), montos: [r.monto], refs: [r.comp, r.factura], abrir: 'retrec:' + r.id, tipo: 'retencion' })),
      D.PERMISOS_LIC.map(x => ({ t: x.nombre, que: 'Permiso · ' + x.ente + ' · ' + est(x.estado), dia: /^Sin/.test(x.vence) ? x.vence.toLowerCase() : 'vence el ' + x.vence, refs: [x.num], a: 'permiso permisos licencia', abrir: 'permiso:' + x.id, tipo: 'permiso' })),
      D.PREGUNTAS.map((q, i) => ({ t: 'Pregunta ' + (i + 1) + ': ' + corta(q.texto), a: q.texto + ' ' + (q.corto || '') + ' pregunta contadora', que: 'Para la contadora · ' + est(q.estado) + (q.urgente && q.estado === 'abierta' ? ' · ' + q.urgente.toLowerCase() : ''), acc: 'ir-pregunta', arg: q.id, tipo: 'pregunta' })));
  });
})();
