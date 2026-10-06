/* Recursos humanos: Personal, Asistencia y horas, Vacaciones y reposos, Nómina, Préstamos y descuentos,
   Prestaciones y liquidaciones. Datos en datos-gente.js. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, $, esc, fmt, dinero, leerNum, ic, tag, puede, nivel } = A;
  const M = D.MESES; const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  /* ---------- ayudas ---------- */
  const F = A.F; // fechas [día, mes, año] (sin año es 2026): ui.js
  const emp = id => D.EMPLEADOS.find(e => e.id === id) || { nombre: '—', cargo: '', area: '' };
  const activos = () => D.EMPLEADOS.filter(e => e.estado !== 'egresado');
  const conAnio = y => (y && y !== 2026 ? ' ' + y : '');
  const fd = ([d, m, y]) => d + ' ' + M[m] + conAnio(y);
  const fdl = ([d, m, y = 2026]) => DOW[new Date(y, m, d).getDay()] + ' ' + d + ' ' + M[m] + conAnio(y);
  const diasHasta = ([d, m, y = 2026]) => Math.round((new Date(y, m, d) - new Date(2026, 9, 5)) / 864e5);
  const minus = t => String(t || '').charAt(0).toLowerCase() + String(t || '').slice(1);
  const lista = xs => xs.join(', ').replace(/, ([^,]*)$/, ' y $1');

  /* ---------- el expediente, por documento ----------
     Lo mismo dicen los avisos y la ficha de la persona: cédula, contrato, certificado de salud y acuerdo del cestaticket. Cada uno está
     «Cargado» (con su archivo), «Falta» (con su botón para subirlo) o «No aplica». La fecha de nacimiento no es un papel: va en la ficha. */
  const AREAS_SALUD = ['Cocina', 'Servicio', 'Caja', 'Delivery']; // quien manipula o sirve alimentos: lo pide Sanidad en cada inspección
  // el certificado de salud: vigente, por vencer (en 30 días), vencido, en trámite, no aplica o falta (alguien nuevo)
  function certDe(e) {
    if (e.certNoAplica) return { estado: 'no_aplica', txt: 'No aplica: no manipula alimentos' };
    if (e.certTramite) return { estado: 'tramite', txt: e.certTramite, falta: true };
    if (!e.certVence) return { estado: 'falta', txt: 'Falta: todavía no lo trae', falta: true };
    const x = F.dif(e.certVence);
    if (x < 0) return { estado: 'vencido', txt: 'Venció el ' + fd(e.certVence), falta: true, vence: e.certVence };
    if (x <= 30) return { estado: 'por_vencer', txt: 'Vence el ' + fdl(e.certVence).toLowerCase(), vence: e.certVence };
    return { estado: 'vigente', txt: 'Vale hasta ' + F.mesAnio(e.certVence), vence: e.certVence };
  }
  const esFamiliar = e => /\([VE]-/.test(e.titular || '');
  // la foto de la cédula: la de los datos de ejemplo se da por subida (docCed sin anotar); una ficha nueva sin foto la tiene vacía y la pide
  const fotoCed = e => e.docCed !== undefined ? e.docCed : (e.ci ? 'Cédula ' + e.nombre + '.jpg' : '');
  // el acuerdo del cestaticket: en los datos de ejemplo, firmado; una ficha nueva arranca por firmar (se firma con el contrato)
  const cestaFirmado = e => e.cestaFirmado !== false;
  // los papeles que faltan (para la etiqueta «Faltan papeles» y el aviso): la cédula (el número y su foto), el contrato firmado, el acuerdo del
  // cestaticket y la fecha de nacimiento
  const faltaPapeles = e => [!e.ci ? 'la cédula' : !fotoCed(e) ? 'la foto de la cédula' : '', e.contratoFirmado === false ? 'el contrato firmado' : '', !cestaFirmado(e) ? 'el acuerdo del cestaticket firmado' : '', !e.nac && e.estado !== 'egresado' ? 'la fecha de nacimiento' : ''].filter(Boolean);
  function docsDe(e) {
    const c = certDe(e);
    return [
      { k: 'ced', nombre: 'Cédula', estado: e.ci && fotoCed(e) ? 'cargado' : 'falta', detalle: !e.ci ? 'Falta la cédula' : fotoCed(e) ? esc(e.ci) : esc(e.ci) + ' · falta la foto de la cédula', archivo: e.ci && fotoCed(e) ? fotoCed(e) : '', acc: { txt: 'Subir cédula (foto)', acc: 'av-cedula', icono: 'camara' } },
      { k: 'contrato', nombre: 'Contrato', estado: e.contratoFirmado === false ? 'falta' : 'cargado', detalle: e.contratoFirmado === false ? (e.contratoEnviado ? 'Le llegó ' + esc(e.contratoEnviado) + ' para firmar: falta el firmado' : 'Falta el contrato firmado') : 'Firmado · ' + esc(minus(e.contrato)) + (e.contratoVence && !yaFijo(e) ? ' hasta el ' + fd(e.contratoVence) : ''), archivo: e.contratoFirmado === false ? '' : (e.docContrato || 'Contrato ' + e.nombre + '.pdf'), acc: { txt: 'Subir contrato firmado (foto)', acc: 'av-contrato', icono: 'camara' } },
      { k: 'salud', nombre: 'Certificado de salud', estado: c.estado === 'no_aplica' ? 'no_aplica' : c.falta ? 'falta' : 'cargado', aviso: c.estado === 'por_vencer', detalle: esc(c.txt), archivo: c.falta || c.estado === 'no_aplica' ? '' : (e.docCert || 'Certificado de salud ' + e.nombre + '.pdf'), acc: { txt: c.estado === 'por_vencer' ? 'Subir el nuevo (foto)' : 'Subir certificado (foto)', acc: 'av-salud', icono: 'camara' } },
      { k: 'cesta', nombre: 'Acuerdo del cestaticket', estado: cestaFirmado(e) ? 'cargado' : 'falta', detalle: cestaFirmado(e) ? 'Firmado: el monto fijo pactado' : 'Por firmar: se firma con el contrato', archivo: cestaFirmado(e) ? (e.docCesta || 'Acuerdo del cestaticket ' + e.nombre + '.pdf') : '', acc: { txt: 'Subir el acuerdo firmado (foto)', acc: 'av-cesta', icono: 'camara' } },
    ];
  }

  /* ---------- los días hábiles de cada persona ----------
     sus descansos salen de la semana del horario (la «D»); si esa semana no trabaja (vacaciones o reposo), de su ficha (descanso)
     los feriados son los de Nómina › Reglas */
  const descansos = e => { const f = (D.HORARIOS.filas[e.id] || []).map((c, i) => (c === 'D' ? i : -1)).filter(i => i >= 0); return f.length ? f : (e.descanso || [5, 6]); };
  const DIAS_SEM = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  const descansoTxt = e => lista(descansos(e).map(i => DIAS_SEM[i]));
  const feriados = () => (D.PARAMS.feriados || []).map(([f, n]) => { const p = String(f).split(' '); return { d: [parseInt(p[0], 10), M.indexOf(p[1]), 2026], nombre: n }; }).filter(x => x.d[0] && x.d[1] >= 0);
  const feriadoDe = d => feriados().find(x => F.igual(x.d, d)) || null;
  const habil = (e, d) => !descansos(e).includes(F.dow(d)) && !feriadoDe(d);
  // las vacaciones desde el día de salida: cuenta n días hábiles (sin sus descansos ni los feriados) · hasta: el último día de vacaciones ·
  // regresa: el primer día que trabaja después · saltados: los feriados que caían en un día que trabaja
  function calcVac(e, salida, n) {
    let d = salida, k = 0; const saltados = []; let vueltas = 0;
    while (vueltas++ < 400) { if (habil(e, d)) { k++; if (k >= n) break; } else if (feriadoDe(d) && !descansos(e).includes(F.dow(d))) saltados.push(feriadoDe(d)); d = F.sumar(d, 1); }
    const hasta = d; let r = F.sumar(hasta, 1); while (!habil(e, r) && vueltas++ < 400) { if (feriadoDe(r) && !descansos(e).includes(F.dow(r))) saltados.push(feriadoDe(r)); r = F.sumar(r, 1); }
    return { salida, hasta, regresa: r, saltados, dias: n };
  }
  // con el regreso corregido a mano: el último día es el día hábil anterior y se cuentan los días hábiles que quedan
  function calcVacHasta(e, salida, regresa) {
    let h = F.sumar(regresa, -1); while (!habil(e, h) && F.dif(h, salida) > 0) h = F.sumar(h, -1);
    let n = 0; const saltados = []; for (let d = salida; F.dif(d, h) <= 0; d = F.sumar(d, 1)) { if (habil(e, d)) n++; else if (feriadoDe(d) && !descansos(e).includes(F.dow(d))) saltados.push(feriadoDe(d)); }
    return { salida, hasta: h, regresa, saltados, dias: n };
  }
  const cap1 = t => String(t).charAt(0).toUpperCase() + String(t).slice(1);
  const proxCumple = e => { if (!e.nac) return null; const x = diasHasta([e.nac[0], e.nac[1]]); return x < 0 ? x + 365 : x; };
  const cumpleAnios = e => e.nac ? 2026 - e.nac[2] + (diasHasta([e.nac[0], e.nac[1]]) < 0 ? 1 : 0) : null;
  const diario = e => e.tipoSal === 'por_dia' ? e.diaria : e.sueldo / 15;
  const r2 = n => Math.round(n * 100) / 100;
  const ve = () => puede('nomina', 'sueldos');          // montos por persona
  const edP = () => puede('personal', 'editar');
  const sensible = () => ve() || edP();                 // cuentas (el expediente, la salud y los motivos médicos: solo edP)
  // contrato a término con 1 año o más desde el ingreso, o en 2.ª prórroga: ya es indeterminado (máximo 1 año, guía laboral §3)
  const yaFijo = e => !!e.contratoVence && (/2\.ª/.test(e.contrato) || e.anios >= 1);
  const fijoTxt = e => 'Contrato a término ' + (e.anios >= 1 ? 'con más de 1 año' : 'en 2.ª prórroga');
  const turnoTxt = t => t + ' · ' + D.TURNOS[t][0].toLowerCase();
  // el recargo de noche de cada turno (el horario solo lleva las horas): la tarde tiene 4 h después de las 7 p. m.; la noche, toda la jornada
  const recargoNoche = t => t === 'T-1' ? 'No tiene' : t === 'T-2' ? '30 % más por cada hora después de las 7 p. m. (4 h por turno)' : '30 % más en toda la jornada';
  // lo que debe: las cuotas que faltan, menos lo que ya abonó a la próxima (un pago por adelantado que no llegó a una cuota)
  const saldo = p => Math.max(0, r2((p.cuotas - p.pagadas) * p.cuota - (p.abonado || 0)));
  // sin la autorización firmada no se descuenta ninguna cuota; lo abonado a la próxima la hace más chica
  const seDescuenta = p => p.estado === 'activo' && !!p.firmada;
  const cuotaDel15 = p => seDescuenta(p) ? Math.min(saldo(p), r2(p.cuota - (p.abonado || 0))) : 0;
  const vivo = p => ['activo', 'en_liquidacion', 'aprobada'].includes(p.estado);
  const lead = (tono, icono) => `<span class="lead ${tono}">${ic(icono)}</span>`;
  const filaLista = ({ abrir = '', ir = '', tono = '', icono = 'info', t, s = '', fin = '' }) => `<li><button class="fila" ${abrir ? `data-abrir="${abrir}"` : `data-ir="${ir}"`}>${lead(tono, icono)}<span class="medio"><b>${t}</b>${s ? `<small>${s}</small>` : ''}</span><span class="fin">${fin}${ic('derecha', 's chev')}</span></button></li>`;
  const notaAgrupada = txt => `<p class="nota gris">${ic('ojo', 's')}<span>${txt}</span></p>`;

  /* ---------- el diagrama del personal: una fila por persona, con sus vacaciones, reposos y marcas ----------
     A.gantt(filas, { desde, dias, ley, etiqueta }) · por defecto, del 1 de octubre al 30 de noviembre · la tira de «Programar vacaciones» usa
     solo las semanas que importan · barras: { desde, hasta, txt, tono: 'vac' | 'rep' | 'vac nueva' (a lápiz: la que se está programando), abrir } */
  const VENTANA = { desde: [1, 9, 2026], dias: 61 };
  const idx = (d, v = VENTANA) => F.dif(d, v.desde);
  const pos = (d, v = VENTANA) => Math.max(0, Math.min(v.dias, idx(d, v))) / v.dias * 100;
  A.gantt = (filas, { desde = VENTANA.desde, dias = VENTANA.dias, ley = null, etiqueta = '' } = {}) => {
    const v = { desde, dias }; const fin = F.sumar(desde, dias - 1); const meses = [], lunes = [];
    for (let d = desde; F.dif(d, fin) <= 0; d = F.sumar(d, 1)) { if (d[0] === 1 || F.igual(d, desde)) meses.push(d); if (F.dow(d) === 0) lunes.push(d); }
    // el nombre del primer mes no se monta sobre el del siguiente cuando la ventana empieza a fin de mes
    const mesesVis = meses.filter((d, i) => !(i === 0 && meses[1] && idx(meses[1], v) < 6));
    const hoyX = idx(F.hoy, v);
    return `<div class="tabla-env"><div class="gantt" role="group" aria-label="${esc(etiqueta || 'Calendario del personal del ' + fd(desde) + ' al ' + fd(fin))}" style="--dias:${dias};--off:${(7 - F.dow(desde)) % 7}">
    <div class="gantt-fila gantt-cab"><span></span><div class="gantt-pista">${mesesVis.map(d => `<span style="left:${pos(d, v)}%">${cap1(F.MESL[d[1]])}</span>`).join('')}${lunes.map(d => `<i style="left:${pos(d, v)}%">${d[0]}</i>`).join('')}</div></div>
    ${filas.map(f => `<div class="gantt-fila${f.cls ? ' ' + f.cls : ''}"><b>${f.abrir ? `<button class="enlace" data-abrir="${f.abrir}">${esc(f.nombre)}</button>` : esc(f.nombre)}</b><div class="gantt-pista">${hoyX >= 0 && hoyX < dias ? `<span class="gantt-hoy" style="left:${(hoyX + .5) / dias * 100}%"></span>` : ''}
      ${(f.barras || []).filter(b => idx(b.hasta, v) >= 0 && idx(b.desde, v) < dias).map(b => { const l = pos(b.desde, v), w = Math.max(1.6, (Math.min(dias, idx(b.hasta, v) + 1) - Math.max(0, idx(b.desde, v))) / dias * 100); return `<${b.abrir ? 'button' : 'span'} class="gantt-barra ${b.tono}" ${b.abrir ? `data-abrir="${b.abrir}"` : ''} style="left:${l}%;width:${w}%" title="${esc(b.txt)}">${esc(b.txt)}</${b.abrir ? 'button' : 'span'}>`; }).join('')}
      ${(f.marcas || []).filter(m => idx(m.d, v) >= 0 && idx(m.d, v) < dias).map(m => `<span class="gantt-marca ${m.tipo}" style="left:${(idx(m.d, v) + .5) / dias * 100}%" title="${esc(m.txt)}">${ic(m.tipo === 'cumple' ? 'pastel' : 'alerta', 'xs')}<span class="sr-only">${esc(m.txt)}</span></span>`).join('')}
    </div></div>`).join('')}
  </div></div>
  ${ley !== null ? ley : `<p class="leyenda gantt-ley"><span><i class="gl vac"></i>Vacaciones</span><span><i class="gl rep"></i>Reposo o ausencia</span><span>${ic('pastel', 'xs')} Cumpleaños</span>${edP() || ve() ? `<span>${ic('alerta', 'xs')} Contrato (vence o ya es fijo) o fin de la prueba</span>` : ''}<span><i class="gl hoy"></i>Hoy</span></p>`}`;
  };
  // filas del diagrama a partir del personal
  // «Quién está fuera»: desde el primero de este mes hasta el fin del mes de la última vacación o reposo programado (por lo menos, dos meses)
  function ventanaFuera() {
    const desde = [1, F.hoy[1], F.hoy[2]]; let fin = F.sumar(F.meses(desde, 2), -1);
    D.VACACIONES.filter(v => v.desde && v.hasta).concat(D.REPOSOS.filter(r => r.hasta)).forEach(x => { const h = [x.hasta[0], x.hasta[1], x.hasta[2] || 2026]; if (F.dif(h, fin) > 0) fin = F.sumar(F.meses([1, h[1], h[2]], 1), -1); });
    const ms = []; for (let d = desde; F.dif(d, fin) <= 0; d = F.meses(d, 1)) ms.push(F.MESL[d[1]] + (d[2] !== 2026 ? ' de ' + d[2] : ''));
    return { desde, dias: F.dif(fin, desde) + 1, txt: ms.length === 2 ? ms[0] + ' y ' + ms[1] : 'de ' + ms[0] + ' a ' + ms[ms.length - 1] };
  }
  A.filasPersonal = ({ conContratos = false, soloConAlgo = true, ventana = VENTANA } = {}) => activos().map(e => {
    const barras = [], marcas = [];
    D.VACACIONES.filter(v => v.emp === e.id && v.desde).forEach(v => barras.push({ desde: v.desde, hasta: v.hasta, txt: 'Vacaciones · regresa ' + v.regresa, tono: 'vac', abrir: conContratos ? 'vacacion:' + v.id : '' }));
    D.REPOSOS.filter(r => r.emp === e.id && r.tipo === 'reposo').forEach(r => barras.push({ desde: r.desde, hasta: r.hasta, txt: conContratos ? 'Reposo hasta el ' + fd(r.hasta) : 'Ausente hasta el ' + fd(r.hasta), tono: 'rep', abrir: conContratos ? 'reposo:' + r.id : '' }));
    if (e.nac) marcas.push({ d: [e.nac[0], e.nac[1]], tipo: 'cumple', txt: 'Cumpleaños: ' + fd([e.nac[0], e.nac[1]]) });
    if (conContratos && e.contratoVence) marcas.push({ d: e.contratoVence, tipo: 'contrato', txt: yaFijo(e) ? fijoTxt(e) + ': ya es fijo, no vence' : 'Vence el contrato: ' + fd(e.contratoVence) });
    if (conContratos && e.prueba) marcas.push({ d: e.prueba, tipo: 'contrato', txt: 'Termina el período de prueba: ' + fd(e.prueba) });
    return { nombre: e.nombre, abrir: conContratos ? 'empleado:' + e.id : '', barras, marcas };
  }).filter(f => !soloConAlgo || f.barras.length || f.marcas.some(m => idx(m.d, ventana) >= 0 && idx(m.d, ventana) < ventana.dias));
  A.rh = { emp, fd, fdl, diasHasta, proxCumple, cumpleAnios, activos, yaFijo, fijoTxt };

  /* ---------- avisos del personal: por urgencia, y cada uno se cierra ahí mismo ----------
     Cuatro bloques: «Ya vencido o ya falta», «Esta semana» (hasta el domingo), «Este mes» y «Más adelante». Los cumpleaños y quien cobra en
     la cuenta de un familiar van aparte, en «Para saber», y no cuentan en el número.
     Cada aviso trae su botón (solo para quien edita Personal: el dueño y RRHH). Al resolverlo pasa a «Resueltos hoy» con su sello, queda en el
     registro de cambios y cierra su pendiente (el pendiente lleva aviso: la clave del aviso). Sin señal, la foto queda «Esperando señal» y el
     aviso no cuenta como resuelto hasta que sube. La salud, el expediente y la disciplina solo los ven el dueño y RRHH.
     un aviso: { clave ('salud:e2'), grupo, abrir, icono, tono, t, s, fin: [texto, tono], acciones: [{ txt, acc, arg, icono }] } */
  const GRUPOS_AV = [['vencido', 'Ya vencido o ya falta', 'alerta', 'Nada vencido ni que falte.'], ['semana', 'Esta semana', 'aviso', 'Nada esta semana.'], ['mes', 'Este mes', 'aviso', 'Nada más este mes.'], ['luego', 'Más adelante', '', 'Nada más adelante.']];
  const hastaDomingo = 6 - F.dow(F.hoy);
  const grupoDe = d => { if (!d) return 'vencido'; const x = F.dif(d); if (x < 0) return 'vencido'; if (x <= hastaDomingo) return 'semana'; return d[1] === F.hoy[1] && (d[2] || 2026) === F.hoy[2] ? 'mes' : 'luego'; };
  const enDias = d => { const x = F.dif(d); return x === 0 ? 'Hoy' : x === 1 ? 'Mañana' : x > 0 ? 'En ' + x + ' días' : 'Hace ' + (-x) + (x === -1 ? ' día' : ' días'); };
  const HECHOS = D.AVISOS_HECHOS;
  // sin señal (solo en el prototipo): la foto queda en la cola y el aviso sigue abierto hasta que sube
  const RH = { sinSenal: false }; const COLA = []; // { aviso, acc, archivo, hacer }
  function avisosPersonal() {
    const out = []; const ed = edP();
    const b = (txt, acc, arg, icono = '') => ({ txt, acc, arg, icono });
    activos().filter(e => e.prueba).forEach(e => out.push({ clave: 'prueba:' + e.id, grupo: grupoDe(e.prueba), abrir: 'empleado:' + e.id, icono: 'reloj',
      t: `${esc(e.nombre)}: termina el período de prueba el ${fdl(e.prueba)}`, s: 'Hay que decidir antes si se queda. Después, salir cuesta como un despido.', fin: [enDias(e.prueba), 'aviso'],
      acciones: [b('Se queda', 'av-se-queda', e.id, 'check'), b('No sigue', 'av-no-sigue', e.id, 'salir')] }));
    // un contrato renovado hoy no vuelve a avisar hasta 30 días antes de su nuevo vencimiento
    activos().filter(e => e.contratoVence && !(e.renovado && F.dif(e.contratoVence) > 30)).forEach(e => out.push(yaFijo(e)
      ? { clave: 'contrato:' + e.id, grupo: 'vencido', abrir: 'empleado:' + e.id, icono: 'archivo', t: `${esc(e.nombre)}: ${fijoTxt(e).toLowerCase()}`,
        s: 'Ya es contrato indeterminado (fijo). Terminarlo sería un despido y, con la inamovilidad hasta el 31-dic, necesita permiso de la Inspectoría.', fin: ['Ya es fijo', 'alerta'],
        acciones: [b('Pasar a indeterminado', 'av-indet', e.id, 'check'), b('Termina', 'av-termina', e.id, 'salir')] }
      : { clave: 'contrato:' + e.id, grupo: grupoDe(e.contratoVence), abrir: 'empleado:' + e.id, icono: 'archivo', t: `${esc(e.nombre)}: vence el contrato el ${fdl(e.contratoVence)}`,
        s: 'Renovar, pasar a indeterminado o terminar.' + (/1\.ª/.test(e.contrato) ? ' Va en su 1.ª prórroga: la 2.ª ya la hace indeterminado.' : ''), fin: [enDias(e.contratoVence), F.dif(e.contratoVence) < 0 ? 'alerta' : 'aviso'],
        acciones: [b('Renovar', 'av-renovar', e.id, 'refrescar'), b('Pasar a indeterminado', 'av-indet', e.id, 'check'), b('Termina', 'av-termina', e.id, 'salir')] }));
    if (ed) activos().forEach(e => {
      const c = certDe(e); if (!c.falta && c.estado !== 'por_vencer') return;
      out.push({ clave: 'salud:' + e.id, grupo: c.estado === 'por_vencer' ? grupoDe(c.vence) : 'vencido', abrir: 'empleado:' + e.id, icono: 'pulso',
        t: `${esc(e.nombre)}: certificado de salud ${{ vencido: 'vencido', tramite: 'en trámite', falta: 'por traer', por_vencer: 'por vencer' }[c.estado]}`,
        s: esc(c.txt) + ' · ' + (AREAS_SALUD.includes(e.area) ? 'manipula alimentos: lo pide Sanidad en cada inspección.' : 'lo pide Sanidad en cada inspección.'),
        fin: [c.estado === 'por_vencer' ? enDias(c.vence) : c.estado === 'vencido' ? 'Venció ' + minus(enDias(c.vence)) : c.estado === 'tramite' ? 'En trámite' : 'Falta', c.estado === 'por_vencer' ? 'aviso' : 'alerta'],
        acciones: [b(c.estado === 'por_vencer' ? 'Subir el nuevo (foto)' : 'Subir certificado (foto)', 'av-salud', e.id, 'camara')] });
    });
    D.VACACIONES.filter(v => v.acumulados >= 2 && v.estado === 'causada').forEach(v => out.push({ clave: 'vac:' + v.id, grupo: 'vencido', abrir: 'vacacion:' + v.id, icono: 'maleta',
      t: `${esc(emp(v.emp).nombre)}: 2 períodos de vacaciones sin disfrutar`, s: 'Es el máximo que permite la ley. Pagarlas sin darlas obliga a darlas otra vez.', fin: ['Al máximo', 'alerta'],
      acciones: [b('Programar', 'vac-programar', v.id, 'calendario')] }));
    if (ed) activos().forEach(e => {
      const f = faltaPapeles(e); if (!f.length) return; const hoy = e.papelesHoy || [];
      const ac = [!e.ci || !fotoCed(e) ? b('Subir cédula (foto)', 'av-cedula', e.id, 'camara') : null, !cestaFirmado(e) ? b('Subir el acuerdo del cestaticket (foto)', 'av-cesta', e.id, 'camara') : null, e.contratoFirmado === false ? b('Subir contrato firmado (foto)', 'av-contrato', e.id, 'camara') : null, !e.nac ? b('Escribir fecha de nacimiento', 'av-nac', e.id, 'lapiz') : null].filter(Boolean);
      out.push({ clave: 'papeles:' + e.id, grupo: 'vencido', abrir: 'empleado:' + e.id, icono: 'documentos', t: `${esc(e.nombre)}: expediente incompleto`,
        s: 'Falta ' + lista(f) + '.' + (hoy.length ? ' Ya está ' + lista(hoy) + '.' : ''), fin: [f.length === 1 ? 'Falta 1' : 'Faltan ' + f.length, 'alerta'], acciones: ac });
    });
    if (ed) D.AMONESTACIONES.filter(a => !a.calificacion).forEach(a => { const plazo = F.sumar(F.hoy, a.quedan); out.push({ clave: 'amon:' + a.id, grupo: grupoDe(plazo), abrir: 'amonestacion:' + a.id, icono: 'alerta',
      t: `${esc(emp(a.emp).nombre)}: amonestación escrita del ${esc(a.fecha)}`, s: `Quedan ${a.quedan} días para pedir la calificación a la Inspectoría (hasta el ${fdl(plazo).toLowerCase()}); después la falta se da por perdonada.`, fin: [a.quedan + ' días', 'aviso'],
      acciones: [b('Ya pedí la calificación', 'av-amon', a.id, 'check')] }); });
    D.REPOSOS.filter(r => r.tipo === 'reposo' && !r.convalidado).forEach(r => out.push({ clave: 'ivss:' + r.id, grupo: 'vencido', abrir: 'reposo:' + r.id, icono: 'pulso',
      t: `${esc(emp(r.emp).nombre)}: falta convalidar el reposo en el IVSS`, s: `Del ${fd(r.desde)} al ${fd(r.hasta)} · ${r.dias} días.`, fin: ['Falta el IVSS', 'alerta'],
      acciones: [b('Subir el reposo convalidado (foto)', 'reposo-ok', r.id, 'camara')] }));
    // para saber: no piden nada urgente y no cuentan en el número
    if (sensible()) activos().filter(e => esFamiliar(e) && !e.familiarAnotado).forEach(e => out.push({ clave: 'cuenta:' + e.id, grupo: 'saber', abrir: 'empleado:' + e.id, icono: 'escudo', tono: 'info',
      t: `${esc(e.nombre)}: cobra en la cuenta de un familiar`, s: 'Titular: ' + esc(e.titular) + '. Está bien si está anotado; el antifraude avisa si esa cuenta aparece en otra persona.', fin: ['Cuenta', 'info'],
      acciones: [b('Anotado', 'av-anotado', e.id, 'check')] }));
    activos().filter(e => proxCumple(e) !== null && proxCumple(e) <= 7).sort((a, c) => proxCumple(a) - proxCumple(c)).forEach(e => out.push({ clave: 'cumple:' + e.id, grupo: 'saber', abrir: 'empleado:' + e.id, icono: 'pastel', tono: 'lila',
      t: proxCumple(e) === 0 ? `Hoy cumple ${esc(e.nombre)} (${cumpleAnios(e)} años)` : `${esc(e.nombre)} cumple ${cumpleAnios(e)} el ${fdl([e.nac[0], e.nac[1]])}`, s: esc(e.cargo) + ' · ' + turnoTxt(e.turno),
      fin: [proxCumple(e) === 0 ? 'Hoy' : 'En ' + proxCumple(e) + ' días', 'lila'], acciones: [] }));
    return out;
  }
  // el número de los avisos: los que piden algo (no cuentan los de «Para saber») · el del menú: lo que ya está vencido o ya falta
  const avisosCuenta = () => avisosPersonal().filter(a => a.grupo !== 'saber').length;
  A.avisosPersonal = avisosPersonal; A.avisosCuenta = avisosCuenta;
  A.avisosVencidos = () => avisosPersonal().filter(a => a.grupo === 'vencido').length;
  // los botones de un aviso van con contorno: en una lista de muchos, la urgencia la dicen el bloque y la etiqueta, y una decisión
  // («Se queda» o «No sigue») no se empuja hacia un lado
  const botonAv = x => `<button class="btn sec chico" data-acc="${x.acc}" data-arg="${esc(x.arg)}">${x.icono ? ic(x.icono, 's') : ''}${esc(x.txt)}</button>`;
  function avisoHtml(a, tono) {
    const esp = COLA.filter(c => c.aviso === a.clave); const acciones = edP() ? a.acciones.filter(x => !esp.some(c => c.acc === x.acc)) : [];
    // cada pieza va directo en la rejilla de la fila: en el teléfono, la etiqueta baja debajo del título y los botones van a lo ancho
    return `<li class="av-fila${esp.length ? ' espera' : ''}" data-aviso="${esc(a.clave)}">${lead(a.tono || tono, a.icono)}<button class="aviso-t" data-abrir="${a.abrir}"><b>${a.t}</b><small>${a.s}</small></button>
      <span class="aviso-fin">${esp.length ? tag('Esperando señal', 'aviso') : tag(a.fin[0], a.fin[1])}</span>
      ${esp.length ? `<p class="aviso-espera">${ic('reloj', 's')}<span><b>Esperando señal.</b> ${esp.map(c => '«' + esc(c.archivo) + '»').join(' y ')} se sube sola cuando vuelva. Todavía no cuenta como resuelto.</span></p>` : ''}
      ${acciones.length ? `<div class="aviso-acc">${acciones.map(botonAv).join('')}</div>` : ''}</li>`;
  }
  // lo resuelto: con su sello y, durante 10 segundos, «Deshacer» (la fila se queda en el sitio del aviso); después, en «Resueltos hoy», las
  // decisiones de un toque traen «Reabrir» (pide el motivo, tacha el sello y devuelve el aviso a su lugar)
  function hechoHtml(h) {
    const ut = A.deshacible(h.k) && edP(); const reab = !ut && h.deshacer && !h.reabierto && edP();
    const html = `<li class="av-fila hecho${ut ? ' en-sitio' : ''}${h.reabierto ? ' reabierto' : ''}" data-hecho="${esc(h.k)}">${lead(h.reabierto ? '' : h.rojo ? '' : 'ok', h.reabierto ? 'refrescar' : h.rojo ? 'salir' : 'check')}<button class="aviso-t" data-abrir="${h.abrir}"><b>${esc(h.t)}</b><small>${esc(h.hecho)} · ${esc(h.quien)}, ${esc(h.hora)}${h.reabierto ? ' · reabierto por ' + esc(h.reabierto.quien) + ': «' + esc(h.reabierto.motivo) + '»' : ''}</small></button>
      <span class="aviso-fin">${A.sello(h.sello, { rojo: h.rojo, recien: h.recien && !h.reabierto, fecha: '05 OCT ' + h.hora, tachado: !!h.reabierto })}</span>
      ${ut ? `<div class="aviso-acc"><button class="btn pri chico" data-acc="av-deshacer" data-arg="${esc(h.k)}" data-ut="${esc(h.k)}">${ic('refrescar', 's')}Deshacer<span aria-hidden="true"> · <span class="quedan">${A.quedanUT(h.k)}</span> s</span></button></div>`
        : reab ? `<div class="aviso-acc"><button class="btn sec chico" data-acc="av-reabrir" data-arg="${esc(h.k)}" data-reabrir="${esc(h.k)}">${ic('refrescar', 's')}Reabrir</button></div>` : ''}</li>`;
    h.recien = false; return html;
  }
  // lo recién decidido con un toque se queda 10 segundos en el sitio de su aviso (con «Deshacer» a la vista); después baja a «Resueltos hoy»
  const enSitio = h => !!h.lugar && A.deshacible(h.k);
  const conEnSitio = (k, filas, hechos) => { const out = filas.slice(); hechos.filter(h => enSitio(h) && h.lugar.grupo === k).sort((a, b) => a.lugar.i - b.lugar.i).forEach(h => out.splice(Math.min(h.lugar.i, out.length), 0, hechoHtml(h))); return out; };
  function avisosHtml() {
    const av = avisosPersonal(); const ed = edP(); const saber = av.filter(a => a.grupo === 'saber');
    const hechos = HECHOS.filter(h => h.ver === 'rrhh' ? ed : h.ver === 'cuentas' ? sensible() : true);
    return `<p class="desc">Lo que vence o falta en el personal, en orden de urgencia. Cada aviso trae su botón: al resolverlo pasa a «Resueltos hoy» con su sello. Lo que nadie resuelve en 2 días sube a Alejandro.</p>
      ${ed ? `<label class="proto-prueba"><input type="checkbox" data-acc="av-senal"${RH.sinSenal ? ' checked' : ''}><span><b>Solo en el prototipo</b>Que las fotos no suban, como si no hubiera señal: quedan «Esperando señal» y suben solas al desmarcarlo.</span></label>` : A.lectura('personal')}
      ${GRUPOS_AV.map(([k, t, tono, vacio]) => { const xs = av.filter(a => a.grupo === k); const filas = conEnSitio(k, xs.map(a => avisoHtml(a, tono)), hechos); return `<section class="av-grupo ${k}" aria-labelledby="avg-${k}"><div class="sec"><h2 id="avg-${k}">${t}${xs.length ? ` <span class="av-n${tono ? ' ' + tono : ''}">${xs.length}</span>` : ''}</h2></div>
        ${filas.length ? `<ul class="lista avisos">${filas.join('')}</ul>` : `<p class="muted av-vacio">${vacio}</p>`}</section>`; }).join('')}
      ${(f => f.length ? `<section class="av-grupo saber" aria-labelledby="avg-saber"><div class="sec"><h2 id="avg-saber">Para saber</h2><span class="muted">No cuentan en el número de avisos</span></div><ul class="lista avisos">${f.join('')}</ul></section>` : '')(conEnSitio('saber', saber.map(a => avisoHtml(a, '')), hechos))}
      ${(xs => xs.length ? `<section class="av-grupo hechos" aria-labelledby="avg-hechos"><div class="sec"><h2 id="avg-hechos">Resueltos hoy</h2><span class="muted">Quedaron en el registro de cambios</span></div><ul class="lista avisos">${xs.map(hechoHtml).join('')}</ul></section>` : '')(hechos.filter(h => !enSitio(h)))}`;
  }
  /* resolver un aviso: pasa a «Resueltos hoy» con su sello, queda en el registro de cambios y cierra su pendiente
     deshacer: lo que lo deja como estaba (las decisiones de un toque: «Se queda», «Pasar a indeterminado», «Anotado»): 10 segundos de
     «Deshacer» en el sitio del aviso (lugar: su bloque y su puesto, tomado antes de decidir) y después «Reabrir» en «Resueltos hoy» */
  // dónde estaba un aviso antes de resolverlo: su bloque y su puesto en él
  const lugarDe = clave => { const av = avisosPersonal(); const a = av.find(x => x.clave === clave); if (!a) return null; return { grupo: a.grupo, i: av.filter(x => x.grupo === a.grupo).indexOf(a) }; };
  function resolver(clave, { t, hecho, sello, rojo = false, abrir, deshacer = null, motivo = '', lugar = null }) {
    const tipo = clave.split(':')[0]; const ver = ['salud', 'papeles', 'amon'].includes(tipo) ? 'rrhh' : tipo === 'cuenta' ? 'cuentas' : '';
    const h = { clave, t, hecho, sello, rojo, abrir, ver, quien: S.usuario.nombre, hora: D.HOY.hora, recien: true, k: 'aviso:' + clave + ':' + (HECHOS.length + 1), lugar: deshacer ? lugar : null, deshacer };
    HECHOS.unshift(h);
    A.auditar({ modulo: 'Personal', registro: 'Aviso · ' + t, campo: 'aviso', antes: 'por resolver', despues: minus(hecho), motivo });
    const pend = D.PENDIENTES.filter(p => p.aviso === clave && !p.hecho); pend.forEach(p => { p.hecho = 'Lo resolvió ' + S.usuario.nombre + ': ' + minus(hecho); }); h.pend = pend;
    if (deshacer) A.unToque(h.k, () => {
      deshacer(); const i = HECHOS.indexOf(h); if (i >= 0) HECHOS.splice(i, 1); pend.forEach(p => { p.hecho = ''; });
      A.auditar({ modulo: 'Personal', registro: 'Aviso · ' + t, campo: 'aviso', antes: minus(hecho), despues: 'por resolver', motivo: 'Deshecho a los pocos segundos de marcarlo' });
      if (S.ficha) A.pintarFicha(); A.pintarPagina();
      // el teclado vuelve al aviso, que está otra vez en su sitio
      const a = document.querySelector(`#main [data-aviso="${CSS.escape(clave)}"] .aviso-t`); if (a) a.focus({ preventScroll: true });
      A.aviso('Deshecho: el aviso vuelve a su lugar.');
    });
    return h;
  }
  // subir una foto que resuelve un aviso: con señal sube en el acto (hacer); sin señal queda en la cola, «Esperando señal»
  function subirFoto(aviso, acc, archivo, hacer) {
    if (RH.sinSenal) { COLA.push({ aviso, acc, archivo, hacer }); A.pintarPagina(); if (S.ficha) A.pintarFicha(); A.aviso('Sin señal: «' + archivo + '» queda esperando y se sube sola cuando vuelva. Todavía no cuenta como resuelto.', 'info'); return false; }
    hacer(); return true;
  }
  const esperaDe = (aviso, acc) => COLA.some(c => c.aviso === aviso && (!acc || c.acc === acc));
  ACC['av-senal'] = () => {
    RH.sinSenal = !RH.sinSenal;
    if (!RH.sinSenal && COLA.length) { const xs = COLA.splice(0); xs.forEach(c => c.hacer()); if (S.ficha) A.pintarFicha(); A.pintarPagina(); A.aviso('Volvió la señal: ' + (xs.length === 1 ? 'se subió la foto.' : 'se subieron las ' + xs.length + ' fotos.')); return; }
    A.pintarPagina(); A.aviso(RH.sinSenal ? 'Prototipo: las fotos que subas quedan esperando señal.' : 'Prototipo: las fotos vuelven a subir en el acto.', 'info');
  };
  ACC['av-deshacer'] = k => { if (!A.deshacerUT(k)) { A.aviso('Ya pasaron los 10 segundos: para cambiarlo, toca «Reabrir» en «Resueltos hoy».', 'info'); A.pintarPagina(); } };
  // reabrir una decisión de un toque (después de los 10 segundos): el motivo es de un toque, el sello queda tachado y el aviso vuelve a su lugar
  ACC['av-reabrir'] = k => {
    const h = HECHOS.find(x => x.k === k); if (!h || !h.deshacer || h.reabierto) return;
    A.pedirReabrir({ titulo: 'Reabrir: ' + h.t, texto: 'El aviso vuelve a su lugar para decidirlo otra vez. Lo de antes queda en el registro de cambios y su sello, tachado.', opciones: ['Me equivoqué de botón'] }).then(m => {
      h.deshacer(); h.reabierto = { motivo: m, quien: S.usuario.nombre, hora: D.HOY.hora }; (h.pend || []).forEach(p => { p.hecho = ''; });
      A.auditar({ modulo: 'Personal', registro: 'Aviso · ' + h.t, campo: 'aviso', antes: minus(h.hecho), despues: 'por resolver (reabierto)', motivo: m });
      pila(); const a = document.querySelector(`#main [data-aviso="${CSS.escape(h.clave)}"] .aviso-t`); if (a) a.focus({ preventScroll: true });
      A.aviso('Reabierto: el aviso vuelve a su lugar.');
    }).catch(() => {});
  };
  // después de decidir con un toque: el teclado queda en el «Deshacer» de esa fila, que se quedó en su sitio
  const focoDeshacer = h => { const d = h && document.querySelector(`#main [data-acc="av-deshacer"][data-arg="${CSS.escape(h.k)}"]`); if (d) { d.focus({ preventScroll: true }); d.scrollIntoView({ block: 'nearest' }); } };
  // en Documentos › Personal (expedientes) queda cada papel que se sube
  const alExpediente = (e, nombre, vence = '—') => { D.ARCHIVOS.unshift({ id: 'ax' + Date.now() + Math.floor(Math.random() * 1000), carpeta: 'personal', nombre, fecha: '5 oct 2026', vence, vinculo: 'Ficha de ' + e.nombre, version: 1 }); const c = D.CARPETAS.find(x => x.id === 'personal'); if (c) c.n++; };
  const pila = () => { if (S.ficha) A.pintarFicha(); A.pintarPagina(); };
  // el período de prueba: «Se queda» de un toque (con «Deshacer») · «No sigue» abre el egreso, con «No sigue tras la prueba» ya marcado
  ACC['av-se-queda'] = id => {
    const e = emp(id); if (!e.prueba) return; const antes = e.prueba; const lugar = lugarDe('prueba:' + id);
    e.prueba = null; e.pruebaFin = 'Pasó el período de prueba (se decidió el lun 5 oct)';
    A.auditar({ modulo: 'Personal', registro: e.nombre, campo: 'período de prueba', antes: 'termina el ' + fdl(antes).toLowerCase(), despues: 'se queda' });
    const h = resolver('prueba:' + id, { t: e.nombre + ': período de prueba', hecho: 'Se queda: pasó la prueba', sello: 'Se queda', abrir: 'empleado:' + id, lugar, deshacer: () => { e.prueba = antes; delete e.pruebaFin; } });
    pila(); focoDeshacer(h); A.aviso(e.nombre.split(' ')[0] + ' se queda: quedó anotado. Puedes deshacerlo durante 10 segundos.');
  };
  ACC['av-no-sigue'] = id => { const e = emp(id); abrirEgreso(id, { tipo: 'prueba', alRegistrar: () => resolver('prueba:' + id, { t: e.nombre + ': período de prueba', hecho: 'No sigue: se registró su egreso', sello: 'No sigue', rojo: true, abrir: 'empleado:' + id }) }); };
  // el contrato: «Renovar» (hasta cuándo, sin pasar de 1 año desde el ingreso), «Pasar a indeterminado» de un toque, «Termina» abre el egreso
  const ingresoDm = e => { const m = /(\d{1,2}) (\w{3}) (\d{4})/.exec(e.ingreso || ''); return m ? [+m[1], M.indexOf(m[2]), +m[3]] : F.hoy.slice(); };
  ACC['av-indet'] = id => {
    const e = emp(id); const antes = { contrato: e.contrato, contratoVence: e.contratoVence, renovado: e.renovado }; const lugar = lugarDe('contrato:' + id);
    e.contrato = 'Indeterminado'; e.contratoVence = null; delete e.renovado;
    A.auditar({ modulo: 'Personal', registro: e.nombre, campo: 'contrato', antes: antes.contrato + (antes.contratoVence ? ' hasta el ' + fd(antes.contratoVence) : ''), despues: 'Indeterminado' });
    const h = resolver('contrato:' + id, { t: e.nombre + ': contrato', hecho: 'Pasó a contrato indeterminado', sello: 'Indeterminado', abrir: 'empleado:' + id, lugar, deshacer: () => Object.assign(e, antes) });
    pila(); focoDeshacer(h); A.aviso('Pasó a indeterminado. Puedes deshacerlo durante 10 segundos.');
  };
  ACC['av-renovar'] = id => {
    const e = emp(id); if (!e.contratoVence) return; const tope = F.sumar(F.meses(ingresoDm(e), 12), -1); const segunda = /1\.ª/.test(e.contrato);
    const ops = [[3, '3 meses más'], [6, '6 meses más']].map(([n, t]) => [t, F.meses(e.contratoVence, n)]).filter(([, d]) => F.dif(d, tope) < 0).concat([['Hasta completar el año', tope]]).filter(([, d]) => F.dif(d, e.contratoVence) > 0);
    let elegido = null; const env = A.modal(`<h2 id="modal-t">Renovar el contrato de ${esc(e.nombre)}</h2>
      <p class="muted" id="modal-d">Vence el ${esc(fdl(e.contratoVence).toLowerCase())}. Un contrato a término no pasa de 1 año desde el ingreso (${esc(e.ingreso)}): después ya es indeterminado.${segunda ? ' <b>Esta sería su 2.ª prórroga: con ella pasa a indeterminado.</b>' : ''}</p>
      <div class="campo" id="rn-campo"><span id="rn-t">¿Hasta cuándo?</span><div class="tres-botones" role="group" aria-labelledby="rn-t">${ops.map(([t, d], i) => `<button type="button" class="btn sec dos-lineas" data-rn="${i}" aria-pressed="false"><span>${esc(t)}<small>hasta el ${esc(fdl(d).toLowerCase())}</small></span></button>`).join('')}</div></div>
      <div class="modal-acc"><button class="btn sec" data-m="no">Cancelar</button><button class="btn pri" data-m="si">${ic('refrescar', 's')}<span id="rn-btn">Renovar</span></button></div>`);
    env.querySelector('[data-rn]').focus();
    env.addEventListener('click', ev => {
      const o = ev.target.closest('[data-rn]'); if (o) { elegido = ops[+o.dataset.rn]; A.$$('[data-rn]', env).forEach(x => x.setAttribute('aria-pressed', String(x === o))); A.limpiarFaltas(env); env.querySelector('#rn-btn').textContent = 'Renovar hasta el ' + fdl(elegido[1]).toLowerCase(); return; }
      const x = ev.target.closest('[data-m]'); if (!x) return; if (x.dataset.m === 'no') { A.cerrarModal(); return; }
      if (A.faltan(env, [[!elegido, 'rn-campo', 'Toca hasta cuándo se renueva.']])) return;
      A.cerrarModal(); const antes = e.contratoVence, antesC = e.contrato;
      e.contratoVence = elegido[1]; e.contrato = segunda ? 'Determinado (2.ª prórroga)' : 'Determinado (1.ª prórroga)'; e.renovado = true;
      A.auditar({ modulo: 'Personal', registro: e.nombre, campo: 'contrato', antes: antesC + ' hasta el ' + fd(antes), despues: e.contrato + ' hasta el ' + fd(e.contratoVence) });
      resolver('contrato:' + id, { t: e.nombre + ': contrato', hecho: 'Renovado hasta el ' + fdl(e.contratoVence).toLowerCase(), sello: 'Renovado', abrir: 'empleado:' + id });
      pila(); A.aviso('Renovado hasta el ' + fdl(e.contratoVence).toLowerCase() + '.');
    });
  };
  ACC['av-termina'] = id => {
    const e = emp(id); const fijo = yaFijo(e);
    abrirEgreso(id, { tipo: fijo ? 'despido' : 'fin', fecha: fijo || !e.contratoVence ? '' : fdl(e.contratoVence) + ' ' + (e.contratoVence[2] || 2026), nota: fijo ? 'Su contrato ya es indeterminado (fijo): terminarlo es un despido.' : '',
      alRegistrar: (x, tipoTxt) => resolver('contrato:' + id, { t: e.nombre + ': contrato', hecho: 'Termina: se registró su egreso (' + minus(tipoTxt) + ')', sello: 'Termina', rojo: true, abrir: 'empleado:' + id }) });
  };
  // las fotos que resuelven un aviso: el certificado de salud (con su vencimiento), la cédula (con su número), el contrato firmado,
  // el recibido de la Inspectoría y el reposo convalidado · sin foto no se resuelve nada
  const zonaFoto = (id, titulo, sub) => `<div class="campo soltar-env"><label class="soltar" for="${id}">${ic('camara')}<span><b>${esc(titulo)}</b>${esc(sub)}</span></label><input id="${id}" type="file" accept="image/*,application/pdf" class="sr-only" data-mini></div>`;
  const papelListo = (e, que) => {
    e.papelesHoy = (e.papelesHoy || []).concat([que]);
    if (!faltaPapeles(e).length) resolver('papeles:' + e.id, { t: e.nombre + ': expediente', hecho: 'Expediente completo: ' + lista(e.papelesHoy), sello: 'Completo', abrir: 'empleado:' + e.id });
  };
  ACC['av-salud'] = id => {
    const e = emp(id); const c = certDe(e); let plazo = '';
    const ops = [['6', '6 meses', F.meses(F.hoy, 6)], ['12', '1 año', F.meses(F.hoy, 12)]];
    const env = A.modal(`<h2 id="modal-t">Certificado de salud de ${esc(e.nombre)}</h2><p class="muted" id="modal-d">${esc(c.txt)}. ${AREAS_SALUD.includes(e.area) ? 'Manipula alimentos: lo' : 'Lo'} pide Sanidad en cada inspección.</p>
      <div class="form">${zonaFoto('cs-foto', 'Foto del certificado', 'La cámara o la galería. Va a su expediente.')}
        <div class="campo" id="cs-campo"><span id="cs-t">¿Hasta cuándo vale?</span><div class="tres-botones" role="group" aria-labelledby="cs-t">${ops.map(([k, t, d]) => `<button type="button" class="btn sec dos-lineas" data-cs="${k}" aria-pressed="false"><span>${t}<small>hasta ${esc(F.mesAnio(d))}</small></span></button>`).join('')}<button type="button" class="btn sec" data-cs="otra" aria-pressed="false">Otra fecha</button></div>
          <div class="nac-fila dos" id="cs-otra" hidden><label class="nac-c mes" for="cs-mes"><span>Mes</span><select id="cs-mes"><option value="">—</option>${F.MESL.map((t, i) => `<option value="${i}">${t}</option>`).join('')}</select></label><label class="nac-c" for="cs-anio"><span>Año</span><select id="cs-anio"><option value="">—</option><option>2026</option><option>2027</option><option>2028</option></select></label></div></div></div>
      <div class="modal-acc"><button class="btn sec" data-m="no">Cancelar</button><button class="btn pri" data-m="si">${ic('check', 's')}Guardar el certificado</button></div>`, 'teclado');
    env.querySelector('.soltar').focus();
    env.addEventListener('click', ev => {
      const o = ev.target.closest('[data-cs]'); if (o) { plazo = o.dataset.cs; A.$$('[data-cs]', env).forEach(x => x.setAttribute('aria-pressed', String(x === o))); env.querySelector('#cs-otra').hidden = plazo !== 'otra'; A.limpiarFaltas(env.querySelector('#cs-campo').parentElement); if (plazo === 'otra') env.querySelector('#cs-mes').focus(); return; }
      const x = ev.target.closest('[data-m]'); if (!x) return; if (x.dataset.m === 'no') { A.cerrarModal(); return; }
      const foto = env.querySelector('#cs-foto').files[0]; const mes = env.querySelector('#cs-mes').value, anio = env.querySelector('#cs-anio').value;
      const vence = plazo === 'otra' ? (mes !== '' && anio ? [new Date(+anio, +mes + 1, 0).getDate(), +mes, +anio] : null) : plazo ? ops.find(p => p[0] === plazo)[2] : null;
      if (A.faltan(env, [[!foto, 'cs-foto', 'Falta la foto del certificado.'], [!plazo, 'cs-campo', 'Toca hasta cuándo vale.'], [plazo === 'otra' && !vence, 'cs-mes', 'Elige el mes y el año.'], [!!vence && F.dif(vence) <= 0, 'cs-campo', 'Esa fecha ya pasó: el certificado tiene que estar vigente.']])) return;
      A.cerrarModal();
      const hizo = subirFoto('salud:' + id, 'av-salud', foto.name, () => {
        const antes = certDe(e).txt; e.certVence = vence; delete e.certTramite; e.docCert = foto.name; alExpediente(e, foto.name, F.mesAnio(vence));
        A.auditar({ modulo: 'Personal', registro: e.nombre, campo: 'certificado de salud', antes, despues: 'vale hasta ' + F.mesAnio(vence) + ' · ' + foto.name });
        resolver('salud:' + id, { t: e.nombre + ': certificado de salud', hecho: 'Subió el certificado: vale hasta ' + F.mesAnio(vence), sello: 'Cargado', abrir: 'empleado:' + id });
      });
      pila(); if (hizo) A.aviso('Guardado el certificado: vale hasta ' + F.mesAnio(vence) + '.');
    });
  };
  ACC['av-cedula'] = id => {
    const e = emp(id);
    const env = A.modal(`<h2 id="modal-t">Cédula de ${esc(e.nombre)}</h2><p class="muted" id="modal-d">La foto va a su expediente y el número, a su ficha.</p>
      <div class="form">${zonaFoto('cc-foto', 'Foto de la cédula', 'Por delante, que se lea el número.')}${A.campoCi({ id: 'cc-ci', etiqueta: 'Número de cédula', letra: /^E/.test(e.ci || '') ? 'E' : 'V', valor: e.ciNum || '' })}</div>
      <div class="modal-acc"><button class="btn sec" data-m="no">Cancelar</button><button class="btn pri" data-m="si">${ic('check', 's')}Guardar la cédula</button></div>`, 'teclado');
    env.querySelector('.soltar').focus();
    env.addEventListener('click', ev => {
      const x = ev.target.closest('[data-m]'); if (!x) return; if (x.dataset.m === 'no') { A.cerrarModal(); return; }
      const foto = env.querySelector('#cc-foto').files[0]; const ci = A.ciDe('cc-ci'); const otra = ci.num && D.EMPLEADOS.find(z => z.id !== id && z.ciNum === ci.num);
      if (A.faltan(env, [[!foto, 'cc-foto', 'Falta la foto de la cédula.'], [ci.num.length < 6, 'cc-ci', 'Escribe el número: solo los números, por ejemplo 12345678.'], [!!otra, 'cc-ci', otra ? 'Esa cédula ya está en la ficha de ' + otra.nombre + '.' : '']])) return;
      A.cerrarModal();
      const hizo = subirFoto('papeles:' + id, 'av-cedula', foto.name, () => {
        const habia = !!e.ci; e.ci = A.ciTapada(ci.letra, ci.num); e.ciNum = ci.num; e.docCed = foto.name; alExpediente(e, foto.name);
        A.auditar({ modulo: 'Personal', registro: e.nombre, campo: 'cédula', antes: habia ? 'sin foto' : 'falta', despues: e.ci + ' · ' + foto.name }); papelListo(e, habia ? 'la foto de la cédula' : 'la cédula');
      });
      pila(); if (hizo) A.aviso('Guardada la cédula.' + (faltaPapeles(e).length ? ' Falta ' + lista(faltaPapeles(e)) + '.' : ' El expediente quedó completo.'));
    });
  };
  ACC['av-nac'] = id => {
    const e = emp(id);
    const env = A.modal(`<h2 id="modal-t">Fecha de nacimiento de ${esc(e.nombre)}</h2><p class="muted" id="modal-d">Para su cumpleaños en el calendario y el aviso a RRHH y a la supervisora 3 días antes.</p>
      <div class="form">${A.campoNac({ id: 'fn', opcional: false })}</div>
      <div class="modal-acc"><button class="btn sec" data-m="no">Cancelar</button><button class="btn pri" data-m="si">${ic('check', 's')}Guardar la fecha</button></div>`, 'teclado');
    env.querySelector('#fn-d').focus();
    env.addEventListener('click', ev => {
      const x = ev.target.closest('[data-m]'); if (!x) return; if (x.dataset.m === 'no') { A.cerrarModal(); return; }
      const n = A.leerNac('fn'); if (A.faltan(env, [[n.vacio || !!n.msg, 'fn-d', n.msg || 'Elige el día, el mes y escribe el año.']])) return;
      A.cerrarModal(); e.nac = n.dm;
      A.auditar({ modulo: 'Personal', registro: e.nombre, campo: 'fecha de nacimiento', antes: 'sin fecha', despues: n.dm[0] + ' ' + M[n.dm[1]] + ' ' + n.dm[2] }); papelListo(e, 'la fecha de nacimiento');
      pila(); A.aviso('Guardada la fecha: su cumpleaños ya sale en el calendario.' + (faltaPapeles(e).length ? ' Falta ' + lista(faltaPapeles(e)) + '.' : ''));
    });
  };
  ACC['av-contrato'] = id => {
    const e = emp(id);
    A.pedirArchivo(f => {
      const hizo = subirFoto('papeles:' + id, 'av-contrato', f.name, () => {
        e.contratoFirmado = true; e.docContrato = f.name; alExpediente(e, f.name);
        A.auditar({ modulo: 'Personal', registro: e.nombre, campo: 'contrato firmado', antes: 'falta', despues: f.name }); papelListo(e, 'el contrato firmado');
      });
      pila(); if (hizo) A.aviso('Subido el contrato firmado.');
    });
  };
  // el acuerdo del cestaticket firmado (una ficha nueva lo trae por firmar): la foto va a su expediente
  ACC['av-cesta'] = id => {
    const e = emp(id);
    A.pedirArchivo(f => {
      const hizo = subirFoto('papeles:' + id, 'av-cesta', f.name, () => {
        e.cestaFirmado = true; e.docCesta = f.name; alExpediente(e, f.name);
        A.auditar({ modulo: 'Personal', registro: e.nombre, campo: 'acuerdo del cestaticket', antes: 'por firmar', despues: f.name }); papelListo(e, 'el acuerdo del cestaticket firmado');
      });
      pila(); if (hizo) A.aviso('Subido el acuerdo del cestaticket firmado.');
    });
  };
  ACC['av-amon'] = id => {
    const a = D.AMONESTACIONES.find(x => x.id === id); const e = emp(a.emp);
    const env = A.modal(`<h2 id="modal-t">Calificación de la falta de ${esc(e.nombre)}</h2><p class="muted" id="modal-d">Amonestación del ${esc(a.fecha.toLowerCase())}. Con el recibido de la Inspectoría queda constancia de que se pidió a tiempo.</p>
      <div class="form">${zonaFoto('am-foto', 'Foto del recibido', 'La copia sellada que te dan en la Inspectoría.')}
        <label class="campo" for="am-num"><span>N.º del expediente (opcional)</span><input id="am-num" autocomplete="off" placeholder="Por ejemplo: 0789-2026"></label></div>
      <div class="modal-acc"><button class="btn sec" data-m="no">Cancelar</button><button class="btn pri" data-m="si">${ic('check', 's')}Guardar el recibido</button></div>`, 'teclado');
    env.querySelector('.soltar').focus();
    env.addEventListener('click', ev => {
      const x = ev.target.closest('[data-m]'); if (!x) return; if (x.dataset.m === 'no') { A.cerrarModal(); return; }
      const foto = env.querySelector('#am-foto').files[0]; const num = env.querySelector('#am-num').value.trim();
      if (A.faltan(env, [[!foto, 'am-foto', 'Falta la foto del recibido de la Inspectoría.']])) return;
      A.cerrarModal();
      const hizo = subirFoto('amon:' + id, 'av-amon', foto.name, () => {
        a.calificacion = { foto: foto.name, numero: num, fecha: 'Lun 5 oct', quien: S.usuario.nombre }; alExpediente(e, foto.name);
        A.auditar({ modulo: 'Personal', registro: 'Amonestación ' + e.nombre, campo: 'calificación', antes: 'sin pedir', despues: 'pedida el lun 5 oct' + (num ? ' · expediente ' + num : '') + ' · ' + foto.name });
        resolver('amon:' + id, { t: e.nombre + ': amonestación del ' + a.fecha.toLowerCase(), hecho: 'Pidió la calificación a la Inspectoría' + (num ? ' (expediente ' + num + ')' : ''), sello: 'Pedida', abrir: 'amonestacion:' + id });
      });
      pila(); if (hizo) A.aviso('Recibido guardado: la calificación quedó pedida el lun 5 oct.');
    });
  };
  ACC['av-anotado'] = id => {
    const e = emp(id); const lugar = lugarDe('cuenta:' + id); e.familiarAnotado = true;
    A.auditar({ modulo: 'Personal', registro: e.nombre, campo: 'cuenta de un familiar', antes: 'por anotar', despues: 'anotado · ' + e.titular });
    const h = resolver('cuenta:' + id, { t: e.nombre + ': cobra en la cuenta de un familiar', hecho: 'Anotado: la cuenta es de ' + minus(e.titular), sello: 'Anotado', abrir: 'empleado:' + id, lugar, deshacer: () => { delete e.familiarAnotado; } });
    pila(); focoDeshacer(h); A.aviso('Anotado. Puedes deshacerlo durante 10 segundos.');
  };

  /* =============== PERSONAL =============== */
  /* Nueva persona: lo escrito vive en NP.form (la pantalla se vuelve a dibujar al tocar un botón de dos opciones o el calendario).
     Elegir en vez de escribir: V o E y solo números en la cédula (al escribirla, la app la busca entre quienes ya trabajaron aquí y ofrece
     reactivar su ficha con su historial); el WhatsApp, obligatorio (ahí llegan el contrato y los avisos); el nacimiento en tres casillas; el
     ingreso en un calendario, con hoy marcado; el contrato, el pago y el titular con botones. «Crear la ficha» va al final y se puede guardar
     a medias como borrador, con la lista de lo que falta para poder pagarle. */
  const BANCOS = { '0102': 'Banco de Venezuela', '0104': 'Venezolano de Crédito', '0105': 'Mercantil', '0108': 'Provincial', '0114': 'Bancaribe', '0115': 'Exterior', '0128': 'Caroní', '0134': 'Banesco', '0137': 'Sofitasa', '0138': 'Plaza', '0151': 'BFC', '0156': '100% Banco', '0157': 'Del Sur', '0163': 'Banco del Tesoro', '0166': 'Banco Agrícola', '0168': 'Bancrecer', '0169': 'Mi Banco', '0171': 'Banco Activo', '0172': 'Bancamiga', '0174': 'Banplus', '0175': 'Bicentenario', '0177': 'Banfanb', '0191': 'BNC' };
  const AREAS = ['Cocina', 'Servicio', 'Caja', 'Delivery', 'Seguridad', 'Limpieza'];
  const npVacio = () => ({ nombre: '', ciLetra: 'V', ci: '', tel: '', nacD: '', nacM: '', nacY: '', cargo: '', area: 'Cocina', turno: 'T-1', reg: 'Interna', ingreso: F.hoy.slice(), ingMes: [F.hoy[1], F.hoy[2]], contrato: '', vence: '', tipoSal: 'quincenal', monto: '', pagoA: '', cuenta: '', pmBanco: '', pmTel: '', titular: 'misma', famNombre: '', famLetra: 'V', famCi: '', docs: [], reactivar: '', borrador: '' });
  const NP = { form: npVacio(), hecho: null };
  const telOk = t => /^04\d{9}$/.test(t || '');
  const telTapado = t => t.slice(0, 4) + '-•••-' + t.slice(-4);
  const bancoDe = cuenta => BANCOS[String(cuenta || '').slice(0, 4)] || '';
  const pagoOk = f => f.pagoA === 'cuenta' ? f.cuenta.length === 20 && !!bancoDe(f.cuenta) : f.pagoA === 'pm' ? !!f.pmBanco && telOk(f.pmTel) : false;
  const famOk = f => f.famNombre.trim().length >= 3 && f.famCi.length >= 6;
  const VENCE_OPS = [['3', '3 meses', 3], ['6', '6 meses', 6], ['12', '1 año', 12]];
  const venceDe = f => { const o = VENCE_OPS.find(x => x[0] === f.vence); return o ? F.sumar(F.meses(f.ingreso, o[2]), -1) : null; };
  const conCedula = num => (num && num.length >= 6 ? D.EMPLEADOS.find(e => e.ciNum === num) : null);
  const mismoCargo = (f, e) => !!e && minus(e.cargo) === minus(f.cargo.trim());
  // lo que falta para poder pagarle (la misma lista en el formulario, en el borrador y después de crear la ficha)
  function faltaPagar(f) {
    return [f.nombre.trim().length < 3 ? 'el nombre' : '', f.ci.length < 6 ? 'la cédula' : '', !telOk(f.tel) ? 'el teléfono (WhatsApp)' : '', f.cargo.trim().length < 3 ? 'el cargo' : '',
      !f.contrato || (f.contrato === 'Determinado' && !f.vence) ? 'el contrato' : '', !(leerNum(f.monto) > 0) ? (f.tipoSal === 'por_dia' ? 'la tarifa por día' : 'el sueldo de la quincena') : '',
      !pagoOk(f) ? 'la cuenta o el pago móvil' : '', f.titular === 'familiar' && !famOk(f) ? 'el nombre y la cédula del familiar' : ''].filter(Boolean);
  }
  const checkNP = f => [[f.nombre.trim().length >= 3 && f.ci.length >= 6, 'Nombre y cédula'], [telOk(f.tel), 'Teléfono (WhatsApp)'], [f.cargo.trim().length >= 3 && !!f.contrato && (f.contrato !== 'Determinado' || !!f.vence), 'Cargo y contrato'],
    [leerNum(f.monto) > 0, f.tipoSal === 'por_dia' ? 'Tarifa por día' : 'Sueldo de la quincena'], [pagoOk(f), 'Cuenta o pago móvil'], ...(f.titular === 'familiar' ? [[famOk(f), 'Nombre y cédula del familiar']] : [])];
  const checkHtml = f => checkNP(f).map(([ok, t]) => `<li class="${ok ? 'ok' : ''}">${ic(ok ? 'check' : 'menos', 's')}<span>${esc(t)}${ok ? '<span class="sr-only">: listo</span>' : ' <small>falta</small>'}</span></li>`).join('');
  function reactivarHtml() {
    const f = NP.form;
    if (f.reactivar) { const e = emp(f.reactivar); return `<div class="reactivar listo">${ic('refrescar', 's')}<span><b>Vas a reactivar la ficha de ${esc(e.nombre)}</b>, con su historial: trabajó aquí del ${esc(e.ingreso)} al ${esc(minus(e.egreso))} (${esc(minus(e.motivoEgreso))}). <button type="button" class="enlace" data-acc="np-no-reactivar">No es esa persona</button></span></div>`; }
    const x = conCedula(f.ci); if (!x) return '';
    if (x.estado === 'egresado') return `<div class="reactivar">${ic('usuario', 's')}<span><b>Esta cédula es de alguien que ya trabajó aquí:</b> ${esc(x.nombre)}, ${esc(minus(x.cargo))}, del ${esc(x.ingreso)} al ${esc(minus(x.egreso))} (${esc(minus(x.motivoEgreso))}). Su ficha sigue guardada.</span><button type="button" class="btn sec chico" data-acc="np-reactivar" data-arg="${x.id}">${ic('refrescar', 's')}Reactivar su ficha</button></div>`;
    return `<div class="reactivar alerta">${ic('alerta', 's')}<span><b>Esa cédula ya es de ${esc(x.nombre)}</b>, que trabaja aquí (${esc(minus(x.cargo))}). Revisa el número.</span></div>`;
  }
  const btnCrearTxt = () => NP.form.reactivar ? 'Reactivar la ficha de ' + emp(NP.form.reactivar).nombre.split(' ')[0] : 'Crear la ficha';
  // la cuenta de 20 dígitos se lee en sus grupos (banco, oficina, control y número): así se revisa contra la libreta
  const grupos = c => [c.slice(0, 4), c.slice(4, 8), c.slice(8, 10), c.slice(10)].filter(Boolean).join(' ');
  const bancoTxt = c => (c.length >= 4 ? (bancoDe(c) ? bancoDe(c) + ' · ' : 'Esos 4 primeros números no son de un banco conocido · ') : 'Los 4 primeros números dicen el banco · ') + (c.length === 20 ? grupos(c) : c.length + ' de 20 dígitos');
  const titularCi = f => f.titular === 'familiar' ? (f.famCi.length >= 6 ? A.ciTxt(f.famLetra, f.famCi) + ' (la del familiar)' : 'la del familiar, que escribes abajo') : (f.ci.length >= 6 ? A.ciTxt(f.ciLetra, f.ci) + ' (la de la persona)' : 'la de la persona, que escribiste arriba');
  function formPersona() {
    const f = NP.form; const re = f.reactivar ? emp(f.reactivar) : null; const vence = venceDe(f); const prueba = re && mismoCargo(f, re) ? null : F.sumar(f.ingreso, 30);
    const opc = (k, ops, idc, titulo, extra = '') => `<div class="campo" id="${idc}"><span id="${idc}-t">${titulo}</span><div class="tres-botones" role="group" aria-labelledby="${idc}-t">${ops.map(([v, t, s2]) => `<button type="button" class="btn sec${s2 ? ' dos-lineas' : ''}" data-acc="np-set" data-arg="${k}|${esc(v)}" aria-pressed="${f[k] === v}">${s2 ? `<span>${esc(t)}<small>${esc(s2)}</small></span>` : esc(t)}</button>`).join('')}</div>${extra}</div>`;
    // las dos columnas van en su propia rejilla y el pie, debajo, fuera de ella: así la columna fija de la derecha (en la computadora y el
    // iPad acostado) se detiene al final de las columnas y nunca tapa «Guardar como borrador» ni «Crear la ficha»
    return `<div class="pila np-env" data-form="persona"><div class="rejilla"><div class="c7 pila">
      <article class="hoja form"><h2>Datos de la persona</h2>
        <div class="campos">
          <label class="campo ancho"><span>Nombre y apellido</span><input id="np-nombre" data-np="nombre" value="${esc(f.nombre)}" autocomplete="off"></label>
        </div>
        <div class="campos dos-col">
          ${A.campoCi({ id: 'np-ci', letra: f.ciLetra, valor: f.ci, ayuda: 'Solo los números. Se guarda como texto: no pierde ceros.', attrs: 'data-np="ci"', extra: `<div id="np-reactivar" aria-live="polite">${reactivarHtml()}</div>` })}
          <label class="campo"><span>Teléfono (WhatsApp)</span><input id="np-tel" data-np="tel" data-solo-num data-max="11" maxlength="16" inputmode="tel" autocomplete="off" placeholder="04141234567" value="${esc(f.tel)}" aria-describedby="np-tel-ay"><small class="ayuda" id="np-tel-ay">Ahí le llegan el contrato para firmar y los avisos.${re ? ' El que tenía: ' + esc(re.tel) + '.' : ''}</small></label>
        </div>
        <div class="campos">
          ${A.campoNac({ id: 'np-nac', valor: [f.nacD ? +f.nacD : '', f.nacM !== '' ? +f.nacM : '', f.nacY], ayuda: 'Para su cumpleaños en el calendario. Si no la tienes ahora, queda en los avisos para completarla.' })}
          <label class="campo"><span>Cargo</span><input id="np-cargo" data-np="cargo" value="${esc(f.cargo)}" autocomplete="off"></label>
          <label class="campo"><span>Área</span><select id="np-area" data-np="area">${AREAS.map(x => `<option${x === f.area ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
          <label class="campo"><span>Turno</span><select id="np-turno" data-np="turno">${Object.entries(D.TURNOS).map(([k, [n, h]]) => `<option value="${k}"${k === f.turno ? ' selected' : ''}>${k} · ${n} (${h})</option>`).join('')}</select></label>
          <label class="campo"><span>Nómina</span><select id="np-reg" data-np="reg"><option value="Interna"${f.reg === 'Interna' ? ' selected' : ''}>Interna</option><option value="Formal"${f.reg === 'Formal' ? ' selected' : ''}>Formal (va a los entes)</option></select></label>
        </div>
        <div class="campo soltar-env"><label class="soltar${f.docs.length ? ' lista con-mini' : ''}" for="np-docs">${f.docs.length ? A.miniHtml(f.docs[0], f.docsUrl || '', true, f.docs.length - 1) : `${ic('camara')}<span><b>Fotos de la cédula y el RIF (opcional)</b>Van a su expediente: la cédula queda cargada.</span>`}</label><input id="np-docs" type="file" accept="image/*" class="sr-only" multiple></div>
      </article>
      <article class="hoja form"><h2>Contrato</h2>
        <div class="campo" id="np-ing-campo"><span id="np-ing-t">Fecha de ingreso</span>${A.calendario({ id: 'np-ing', mes: f.ingMes, sel: f.ingreso, desde: [1, 8, 2026], hasta: [31, 11, 2026], etiqueta: 'Fecha de ingreso' })}<small class="ayuda">Entra el ${esc(F.larga(f.ingreso))}${F.igual(f.ingreso, F.hoy) ? ' (hoy)' : ''}.</small></div>
        ${opc('contrato', [['Indeterminado', 'Indeterminado', 'sin fecha de fin'], ['Determinado', 'Determinado', 'con fecha de fin']], 'np-contrato-campo', 'Tipo de contrato')}
        ${f.contrato === 'Determinado' ? opc('vence', VENCE_OPS.map(([k, t, n]) => [k, t, 'hasta el ' + F.corta(F.sumar(F.meses(f.ingreso, n), -1))]), 'np-vence-campo', '¿Hasta cuándo?', '<small class="ayuda">Un contrato a término no pasa de 1 año: después ya es indeterminado. La app avisa a RRHH 30 días antes de que venza.</small>') : ''}
        <p class="nota ${prueba ? 'info' : 'ok'}">${ic(prueba ? 'reloj' : 'check', 's')}<span>${prueba ? `Período de prueba de 30 días: termina el ${esc(F.corta(prueba))}. La app avisa a RRHH antes de que termine.` : `Ya trabajó aquí como ${esc(minus(re.cargo))}: en el mismo puesto no hay período de prueba.`}${vence ? ` El contrato va hasta el ${esc(F.corta(vence))}.` : ''}</span></p>
      </article>
      <article class="hoja form"><h2>Pago</h2>
        ${opc('tipoSal', [['quincenal', 'Sueldo quincenal'], ['por_dia', 'Tarifa por día']], 'np-tiposal-campo', 'Cómo se le paga')}
        <label class="campo"><span>${f.tipoSal === 'por_dia' ? 'Tarifa por día ($)' : 'Sueldo de la quincena ($)'}</span><input id="np-monto" data-np="monto" inputmode="decimal" autocomplete="off" value="${esc(f.monto)}" placeholder="${f.tipoSal === 'por_dia' ? 'Lo que gana por día trabajado' : 'Lo que gana cada quincena'}"></label>
        ${opc('pagoA', [['cuenta', 'Cuenta bancaria', '20 dígitos'], ['pm', 'Pago móvil', 'banco y teléfono']], 'np-pago-campo', 'A dónde se le paga', `<small class="ayuda">Sin esto no se le puede pagar por el banco: se puede cargar después en su ficha.${re ? ' La que tenía: ' + esc(re.cuenta) + '.' : ''}</small>`)}
        ${f.pagoA === 'cuenta' ? `<label class="campo"><span>Número de cuenta</span><input id="np-cuenta" data-np="cuenta" data-solo-num data-max="20" maxlength="32" inputmode="numeric" autocomplete="off" placeholder="0134 0000 00 0000000000" value="${esc(f.cuenta)}" aria-describedby="np-banco"><small class="ayuda" id="np-banco">${esc(bancoTxt(f.cuenta))}</small></label>` : ''}
        ${f.pagoA === 'pm' ? `<div class="campos"><label class="campo"><span>Banco del pago móvil</span><select id="np-pm-banco" data-np="pmBanco"><option value="">Elige el banco</option>${[...new Set(Object.values(BANCOS))].sort((a, b) => a.localeCompare(b, 'es')).map(b => `<option${b === f.pmBanco ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select></label>
          <label class="campo"><span>Teléfono del pago móvil</span><input id="np-pm-tel" data-np="pmTel" data-solo-num data-max="11" maxlength="16" inputmode="tel" autocomplete="off" placeholder="04141234567" value="${esc(f.pmTel)}"></label></div>
          <p class="muted" id="np-pm-ci">Cédula del titular: ${esc(titularCi(f))}</p>` : ''}
        ${opc('titular', [['misma', 'La misma persona'], ['familiar', 'Un familiar']], 'np-titular-campo', '¿De quién es la cuenta?')}
        ${f.titular === 'familiar' ? `<div class="campos"><label class="campo"><span>Nombre del familiar</span><input id="np-fam-nombre" data-np="famNombre" value="${esc(f.famNombre)}" autocomplete="off" placeholder="Nombre y apellido"></label>${A.campoCi({ id: 'np-fam-ci', etiqueta: 'Cédula del familiar', letra: f.famLetra, valor: f.famCi, attrs: 'data-np="famCi"', ayuda: 'El antifraude avisa si esta cuenta aparece en otra persona.' })}</div>` : ''}
      </article></div>
      <div class="c5 pila np-lado"><article class="hoja"><div class="hoja-cab"><h2>${ic('lista')}Para poder pagarle</h2></div><ul class="checklist" id="np-check" aria-live="polite">${checkHtml(f)}</ul>
          <p class="muted">Puedes guardarla como borrador y completarla después: queda en Altas y egresos.</p></article>
        <article class="hoja"><h2>Lo que la app hace sola</h2><ul class="lista">
          ${[['archivo', 'Contrato para firmar', 'Le llega por WhatsApp, con los datos de la ficha'], ['reloj', 'Período de prueba de 30 días', 'Aviso a RRHH antes de que termine'], ['pulso', 'Certificado de salud', 'Si va a cocina, servicio, caja o delivery'], ['pastel', 'Cumpleaños en el calendario', 'Aviso 3 días antes'], ['escudo', 'Antifraude', 'Revisa que la cuenta no esté en otra persona']].map(([i, t, s2]) => `<li><div class="fila">${lead('', i)}<span class="medio"><b>${t}</b><small>${s2}</small></span><span></span></div></li>`).join('')}
        </ul></article></div></div>
      <div class="form-pie"><button class="btn ghost" data-sub="lista" data-volver>${ic('atras', 's')}Volver</button>
        <span class="form-pie-der"><button class="btn sec" data-acc="emp-borrador">Guardar como borrador</button><button class="btn pri" data-acc="emp-crear">${ic('check', 's')}<span id="np-crear-t">${esc(btnCrearTxt())}</span></button></span></div></div>`;
  }
  // mientras se escribe: la lista de lo que falta, el banco de la cuenta, la cédula del titular y si la cédula ya trabajó aquí
  function refrescarNP(raiz) {
    const f = NP.form; const set = (id, h, txt = false) => { const el = raiz.querySelector('#' + id); if (el) { if (txt) el.textContent = h; else el.innerHTML = h; } };
    set('np-check', checkHtml(f)); set('np-reactivar', reactivarHtml()); set('np-crear-t', btnCrearTxt(), true);
    if (f.pagoA === 'cuenta') set('np-banco', bancoTxt(f.cuenta), true); if (f.pagoA === 'pm') set('np-pm-ci', 'Cédula del titular: ' + titularCi(f), true);
  }
  const borradorNP = () => A.borrador('persona');
  function leerNP(el) {
    if (el.dataset.np) { NP.form[el.dataset.np] = el.value.trim() === '' ? '' : el.value; if (el.id === 'np-ci') NP.form.ciLetra = el.dataset.letra || 'V'; if (el.id === 'np-fam-ci') NP.form.famLetra = el.dataset.letra || 'V'; }
    if (el.dataset.nac === 'np-nac') NP.form['nac' + el.id.slice(-1).toUpperCase()] = el.value;
  }
  const leerTodoNP = () => document.querySelectorAll('#main [data-form="persona"] [data-np], #main [data-form="persona"] [data-nac]').forEach(leerNP);
  PANT.personal = {
    titulo: 'Personal', corto: 'Personal', tab: 'Personal', grupo: 'Recursos humanos', icono: 'personal', mod: 'personal', palabras: 'empleado empleados trabajador trabajadores expediente ficha',
    secciones: () => [['lista', 'Personas', 'empleados trabajadores'], ['avisos', 'Avisos', 'contratos vencen certificado papeles'], ['egresos', 'Altas y egresos', 'ingreso renuncia despido borrador'], edP() ? ['legal', 'Protección y disciplina', 'fuero amonestacion inamovilidad'] : null],
    // el número del menú: lo que ya está vencido o ya falta (el de la pestaña Avisos: todo lo que pide algo)
    cuenta: () => edP() ? A.avisosVencidos() : 0,
    // lo escrito se guarda solo en el equipo mientras se escribe: al salir, arriba queda «Tienes una persona nueva a medias: … · Seguir · Descartar»
    // («Guardar como borrador» es otra cosa: la deja en Altas y egresos, para que la siga otra persona)
    borradores: {
      nueva: {
        tomar: () => { const f = { ...NP.form }; delete f.docsUrl; return f; },
        poner: d => { NP.form = Object.assign(npVacio(), d); NP.hecho = null; },
        txt: d => 'una persona nueva a medias' + (d.nombre && d.nombre.trim() ? ': ' + d.nombre.trim() : ''),
        vacio: d => !String(d.nombre || '').trim() && !d.ci && !d.tel && !String(d.cargo || '').trim() && !d.monto && !d.contrato && !d.pagoA && !d.nacD && !d.nacY && !(d.docs || []).length && !d.reactivar && !d.famNombre && !d.famCi,
      },
    },
    // Nueva persona es un formulario: la pestaña o el menú vuelven a la lista, y al salir se borra «Ficha creada»
    transitorias: ['nueva'],
    alSalir: sub => { if (sub === 'nueva') { NP.form = npVacio(); NP.hecho = null; } },
    alRepetir: sub => { if (sub !== 'nueva' || !NP.hecho) return null; NP.form = npVacio(); NP.hecho = null; return '#np-nombre'; },
    render: (sub = 'lista') => {
      const g = nivel('personal') === 'g';
      if (sub === 'legal' && !edP()) sub = 'lista'; // fueros y amonestaciones: salud y expediente, solo el dueño y RRHH
      let cuerpo = '';
      if (sub === 'lista') {
        const filtro = A.filtroActual('activos');
        const gente = D.EMPLEADOS.filter(e => filtro === 'todos' || (filtro === 'activos' && e.estado !== 'egresado') || (filtro === 'formal' && e.formal && e.estado !== 'egresado') || (filtro === 'interna' && !e.formal && e.estado !== 'egresado') || (filtro === 'fuera' && ['vacaciones', 'reposo'].includes(e.estado)) || (filtro === 'egresados' && e.estado === 'egresado'));
        const hoyTrab = activos().filter(e => /[123]/.test((D.HORARIOS.filas[e.id] || [])[0] || '')).length;
        const cumple = activos().filter(e => proxCumple(e) !== null && proxCumple(e) <= 7).sort((a, b) => proxCumple(a) - proxCumple(b));
        const cols = [{ t: 'Persona', cls: 'p' }, { t: 'Área', cls: 'x' }, { t: 'Ingreso', cls: 'x' }, { t: 'Cumpleaños', cls: 'x' }, { t: 'Nómina', cls: 'x' }];
        if (ve()) cols.push({ t: 'Sueldo quincenal', cls: 'r plata' });
        cols.push({ t: 'Estado', cls: 'e' });
        const papeles = e => faltaPapeles(e).length || certDe(e).falta;
        cuerpo = `<div class="cifras">
            ${A.cifra({ etq: 'En nómina', valor: '49', sub: '10 en la formal · 39 en la interna', ir: puede('nomina') ? 'nomina/corridas' : '' })}
            ${A.cifra({ etq: 'Trabajan hoy', valor: hoyTrab + ' de ' + activos().length, sub: 'de las personas de esta lista', ir: 'asistencia' })}
            ${A.cifra({ etq: 'De vacaciones o reposo', valor: activos().filter(e => ['vacaciones', 'reposo'].includes(e.estado)).length, sub: 'Wilmer y Mariela', ir: 'ausencias' })}
            ${A.cifra({ etq: 'Cumpleaños esta semana', valor: cumple.length, sub: cumple.map(e => e.nombre.split(' ')[0] + (proxCumple(e) === 0 ? ' (hoy)' : ' (' + DOW[new Date(2026, e.nac[1], e.nac[0]).getDay()].toLowerCase() + ')')).join(', '), abrir: cumple[0] ? 'empleado:' + cumple[0].id : '' })}
          </div>
          ${A.filtros('t-emp', [['activos', 'Activos', activos().length], ['formal', 'Formal', activos().filter(e => e.formal).length], ['interna', 'Interna', activos().filter(e => !e.formal).length], ['fuera', 'Fuera hoy', activos().filter(e => ['vacaciones', 'reposo'].includes(e.estado)).length], ['egresados', 'Egresados', D.EMPLEADOS.filter(e => e.estado === 'egresado').length]], filtro, 'Buscar persona, cargo o área')}
          ${A.tabla({ id: 't-emp', cols, filas: gente.map(e => {
            const c = [`<b>${esc(e.nombre)}</b><small>${esc(e.cargo)} · ${turnoTxt(e.turno)}</small>`, esc(e.area), esc(e.ingreso), e.nac ? fd([e.nac[0], e.nac[1]]) + (proxCumple(e) === 0 ? ' ' + tag('Hoy', 'lila') : '') : '<span class="tenue">Sin fecha</span>', e.formal ? tag('Formal', 'info') : tag('Interna', '')];
            if (ve()) c.push(e.tipoSal === 'por_dia' ? dinero(e.diaria, 'usd', 0) + ' <small class="tenue">/día</small>' : dinero(e.sueldo, 'usd', 0));
            c.push(e.estado !== 'activo' ? A.estadoTag(e.estado) : papeles(e) && edP() ? tag('Faltan papeles', 'aviso') : tag('Activo', 'ok'));
            return { abrir: 'empleado:' + e.id, clase: e.estado === 'egresado' ? 'tenue' : '', celdas: c };
          }) })}
          <p class="muted" data-muestra="t-emp">Se muestran ${activos().length} de las 49 personas en nómina (datos inventados).</p>`;
      }
      if (sub === 'avisos') cuerpo = avisosHtml();
      if (sub === 'egresos') {
        const ros = emp('e10'); const borr = D.BORRADORES_PERSONA;
        cuerpo = `<div class="rejilla"><div class="c6 pila">
          ${borr.length && edP() ? `<div class="sec"><h2>Fichas a medias</h2><span class="muted">Guardadas como borrador</span></div><ul class="lista">${borr.map(b => { const fl = faltaPagar(b.form); return `<li><div class="fila">${lead('aviso', 'lapiz')}<span class="medio"><b>${esc(b.form.nombre)}</b><small>Borrador de ${esc(b.quien)}, hoy ${esc(b.hora)} · para poder pagarle falta ${esc(lista(fl)) || 'nada'}</small></span><button class="btn sec chico" data-acc="emp-seguir" data-arg="${b.id}">${ic('lapiz', 's')}Seguir llenando</button></div></li>`; }).join('')}</ul>` : ''}
          <div class="sec"><h2>Altas recientes</h2></div>
          <article class="hoja"><div class="hoja-cab"><h2>${ic('usuario')}Rosa Medina · mesonera</h2>${ros.prueba ? tag('En prueba', 'aviso') : tag('Pasó la prueba', 'ok')}</div>
            <ol class="pasos">${[['Ficha y cédula', !!ros.ci], ['Contrato firmado', ros.contratoFirmado !== false], [edP() ? 'Certificado de salud' : 'Papeles del expediente (los ve RRHH)', !certDe(ros).falta], ['Cuenta para pagarle', !!ros.cuenta], ['Fin de la prueba', !ros.prueba]].map(([p, ok], i, xs) => `<li class="${ok ? 'hecho' : xs.slice(0, i).every(x => x[1]) ? 'actual' : ''}">${p}</li>`).join('')}</ol>
            <dl class="kv"><div><dt>Ingresó</dt><dd>Lun 14 sep</dd></div><div><dt>Termina la prueba</dt><dd>${ros.prueba ? fdl(ros.prueba) + ' ' + tag(enDias(ros.prueba), 'aviso') : esc(ros.pruebaFin || 'Se quedó')}</dd></div><div><dt>% del 10 %</dt><dd>0 % (los nuevos arrancan en 0)</dd></div><div><dt>Alta en el IVSS</dt><dd>No aplica (nómina interna)</dd></div></dl>
            <button class="enlace" data-abrir="empleado:e10">Abrir su ficha ${ic('derecha', 's')}</button></article>
          <p class="nota info">${ic('info', 's')}<span>Si entra a la nómina formal, el alta en el IVSS se hace en los 3 días hábiles siguientes. Si ya trabajó aquí en el mismo puesto, no hay período de prueba.</span></p>
        </div><div class="c6 pila">
          <div class="sec"><h2>Egresos</h2>${A.boton('personal', 'Registrar un egreso', 'data-acc="egreso" data-arg=""', { tono: 'sec', icono: 'salir', chico: true })}</div>
          ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Motivo', cls: 'x' }, { t: 'Liquidación', cls: 'e' }], filas: D.EMPLEADOS.filter(e => e.estado === 'egresado').map(e => { const lq = D.LIQUIDACIONES.find(l => l.emp === e.id);
            return { abrir: lq && puede('nomina') ? 'liquidacion:' + lq.id : 'empleado:' + e.id, celdas: [`<b>${esc(e.nombre)}</b><small>Salió el ${esc(e.egreso)}</small>`, esc(e.motivoEgreso), lq ? (lq.estado === 'por_aprobar' ? tag('Vence hoy', 'alerta') : tag('Pagada', 'ok')) : e.liquidacionPagada ? tag('Pagada', 'ok') : tag('Por armar', 'aviso')] }; }) })}
          <p class="nota aviso">${ic('reloj', 's')}<span>La liquidación se paga en los 5 días siguientes al egreso. Después corre interés de mora a la tasa activa del BCV. Al registrar el egreso se le quita el acceso a los grupos y la app arma la liquidación, descontando lo que deba.</span></p>
        </div></div>`;
      }
      if (sub === 'legal') cuerpo = `<p class="nota aviso">${ic('escudo', 's')}<span><b>Inamovilidad laboral hasta el 31 de diciembre de 2026</b> para todo el personal. Para despedir a alguien hace falta pedir antes la calificación a la Inspectoría del Trabajo.</span></p>
        <div class="rejilla"><div class="c6 pila"><div class="sec"><h2>Quién tiene protección especial</h2></div>
          ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Por qué', cls: 'x' }, { t: 'Hasta', cls: 'e' }], filas: D.FUEROS.map(f => ({ abrir: 'fuero:' + f.id, celdas: [`<b>${esc(emp(f.emp).nombre)}</b><small>${esc(emp(f.emp).cargo)}</small>`, esc(f.tipo), esc(f.hasta)] })) })}
          <div class="sec"><h2>Amonestaciones</h2></div>
          ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Plazo', cls: 'e' }], filas: D.AMONESTACIONES.map(a => ({ abrir: 'amonestacion:' + a.id, celdas: [`<b>${esc(emp(a.emp).nombre)}</b><small>${esc(a.fecha)} · ${esc(a.hechos)}</small>`, esc(a.tipo), a.calificacion ? tag('Calificación pedida', 'info') : tag(a.quedan + ' días', 'aviso')] })) })}
        </div><div class="c6 pila"><article class="hoja"><h2>${ic('archivo')}Papeles firmados por cada persona</h2><p class="muted">El catálogo dice qué es salario y qué no; lo que defiende al negocio en un reclamo es el papel firmado por cada persona.</p>
          <div class="barras">${D.ACUERDOS.map(([n, h, t, d]) => `<div class="barra"><span>${esc(n)}<small class="tenue" style="display:block">${esc(d)}</small></span><b>${h} de ${t}</b><div class="pista"><span class="${h === t ? 'ok' : h / t > .6 ? 'aviso' : 'alerta'}" style="width:${h / t * 100}%"></span></div></div>`).join('')}</div></article>
          <p class="nota gris">${ic('info', 's')}<span>Seguridad laboral (exámenes, dotación, comité): diseñado para más adelante. Lo único que aplica ya es el certificado de salud de quien manipula alimentos.</span></p></div></div>`;
      if (sub === 'nueva') cuerpo = !edP() ? A.lectura('personal') : NP.hecho ? hechoPersona() : formPersona();
      return `<div class="pagina">${A.cab('Recursos humanos', sub === 'nueva' ? (NP.form.reactivar ? 'Reactivar una ficha' : 'Nueva persona') : 'Personal', sub === 'nueva' ? 'Lo que hace falta para darle de alta y poder pagarle. Si todavía no lo tienes todo, guárdala como borrador y complétala después.' : 'La ficha de cada persona: contrato, turno, cumpleaños, cuenta, expediente, vacaciones y préstamos. Nadie se borra: quien se va queda como egresado.', sub !== 'nueva' ? A.boton('personal', 'Nueva persona', 'data-sub="nueva"', { icono: 'mas' }) : '')}
        ${g ? notaAgrupada('Ves quién trabaja, en qué y en qué turno. Sueldos y cuentas solo los ven el dueño, RRHH y contabilidad; los expedientes y los temas de salud, solo el dueño y RRHH.') : !edP() ? notaAgrupada('Los expedientes y los temas de salud solo los ven el dueño y RRHH.') : ''}
        ${sub === 'nueva' ? '' : A.subnav([['lista', 'Personas'], ['avisos', 'Avisos', avisosCuenta()], ['egresos', 'Altas y egresos', edP() ? D.BORRADORES_PERSONA.length : 0, true], edP() ? ['legal', 'Protección y disciplina'] : null], sub)}${cuerpo}</div>`;
    },
    // Nueva persona: lo que se escribe queda en NP.form; la lista de lo que falta y el aviso de la cédula se actualizan mientras se escribe
    montar: (raiz, sub) => {
      if (sub !== 'nueva' || NP.hecho || !edP()) return;
      A.CAL['np-ing'] = {
        elegir: d => { leerTodoNP(); NP.form.ingreso = d; NP.form.ingMes = [d[1], d[2]]; borradorNP(); A.pintarPagina(); },
        mes: n => { leerTodoNP(); const [m, y] = NP.form.ingMes; const x = new Date(y, m + n, 1); NP.form.ingMes = [x.getMonth(), x.getFullYear()]; A.pintarPagina(); },
      };
      // cada campo se escucha a sí mismo (también lo que se escribe sin que el evento suba hasta el formulario)
      raiz.querySelectorAll('[data-form="persona"] [data-np], [data-form="persona"] [data-nac]').forEach(el => ['input', 'change'].forEach(ev => el.addEventListener(ev, () => { leerNP(el); refrescarNP(raiz); })));
      // las fotos de la cédula: se guardan en el formulario (se ven con su miniatura aunque la pantalla se vuelva a dibujar)
      const fd2 = raiz.querySelector('#np-docs'); if (fd2) fd2.addEventListener('change', () => { if (!fd2.files.length) return; leerTodoNP(); NP.form.docs = [...fd2.files].map(x => x.name); NP.form.docsUrl = A.urlDe(fd2.files[0]); borradorNP(); A.pintarPagina(); });
    },
  };
  ACC['np-set'] = arg => { leerTodoNP(); const [k, v] = String(arg).split('|'); NP.form[k] = v; if (k === 'contrato' && v !== 'Determinado') NP.form.vence = ''; borradorNP(); A.pintarPagina(); };
  ACC['np-reactivar'] = id => {
    leerTodoNP(); const e = emp(id); if (!e || e.estado !== 'egresado') return;
    Object.assign(NP.form, { reactivar: id, nombre: e.nombre, cargo: e.cargo, area: e.area, turno: e.turno, reg: e.formal ? 'Formal' : 'Interna', nacD: e.nac ? String(e.nac[0]) : '', nacM: e.nac ? String(e.nac[1]) : '', nacY: e.nac ? String(e.nac[2]) : '', tipoSal: e.tipoSal === 'por_dia' ? 'por_dia' : 'quincenal' });
    borradorNP(); A.pintarPagina(); A.aviso('Listo: se usa la ficha de ' + e.nombre.split(' ')[0] + ', con su historial. Revisa el teléfono, el contrato y la cuenta: pueden haber cambiado.');
  };
  ACC['np-no-reactivar'] = () => { NP.form.reactivar = ''; NP.form.ci = ''; A.pintarPagina(); const c = document.getElementById('np-ci'); if (c) c.focus(); A.aviso('Escribe la cédula de la persona nueva.', 'info'); };
  // lo que se pide para crear la ficha (los errores, debajo de cada campo); lo del pago puede quedar para después: va en la lista de lo que falta
  function errorsNP() {
    const f = NP.form; const nac = A.leerNac('np-nac'); const x = conCedula(f.ci);
    return [[f.nombre.trim().length < 3, 'np-nombre', 'Escribe el nombre y el apellido.'], [f.ci.length < 6, 'np-ci', 'Escribe la cédula: solo los números, por ejemplo 12345678.'],
      [!!x && x.estado !== 'egresado' && x.id !== f.reactivar, 'np-ci', x ? 'Esa cédula ya es de ' + x.nombre + ', que trabaja aquí.' : ''],
      [!!x && x.estado === 'egresado' && x.id !== f.reactivar, 'np-ci', x ? 'Esa cédula ya trabajó aquí: toca «Reactivar su ficha» para seguir con su historial.' : ''],
      [!telOk(f.tel), 'np-tel', 'Escribe su WhatsApp, por ejemplo 04141234567: ahí le llega el contrato.'], [!!nac.msg, 'np-nac-d', nac.msg],
      [f.cargo.trim().length < 3, 'np-cargo', 'Escribe el cargo.'], [!f.contrato, 'np-contrato-campo', 'Toca el tipo de contrato: indeterminado o determinado.'],
      [f.contrato === 'Determinado' && !f.vence, 'np-vence-campo', 'Toca hasta cuándo va el contrato.'],
      [!(leerNum(f.monto) > 0), 'np-monto', f.tipoSal === 'por_dia' ? 'Escribe la tarifa por día.' : 'Escribe el sueldo de la quincena.'],
      [f.pagoA === 'cuenta' && !!f.cuenta && !(f.cuenta.length === 20 && bancoDe(f.cuenta)), 'np-cuenta', f.cuenta.length !== 20 ? 'La cuenta tiene 20 dígitos: van ' + f.cuenta.length + '.' : 'Esos 4 primeros números no son de un banco conocido.'],
      [f.pagoA === 'pm' && !!f.pmTel && !telOk(f.pmTel), 'np-pm-tel', 'El teléfono del pago móvil tiene 11 números y empieza por 04.'],
      [f.titular === 'familiar' && f.famCi.length > 0 && f.famCi.length < 6, 'np-fam-ci', 'Escribe la cédula del familiar completa.']];
  }
  ACC['emp-crear'] = () => {
    leerTodoNP(); if (A.faltan($('#main'), errorsNP())) return;
    const f = NP.form; const nac = A.leerNac('np-nac'); const re = f.reactivar ? emp(f.reactivar) : null; const monto = leerNum(f.monto);
    const datos = { nombre: f.nombre.trim(), ci: A.ciTapada(f.ciLetra, f.ci), ciNum: f.ci, tel: telTapado(f.tel), cargo: f.cargo.trim(), area: f.area, turno: f.turno, formal: f.reg === 'Formal', estado: 'activo',
      ingreso: f.ingreso[0] + ' ' + M[f.ingreso[1]] + ' ' + f.ingreso[2], anios: 0, tipoSal: f.tipoSal, nac: nac.dm, contrato: f.contrato, contratoVence: f.contrato === 'Determinado' ? venceDe(f) : null,
      prueba: re && mismoCargo(f, re) ? null : F.sumar(f.ingreso, 30), cuenta: !pagoOk(f) ? '' : f.pagoA === 'cuenta' ? bancoDe(f.cuenta) + ' •••• ' + f.cuenta.slice(-4) : 'Pago móvil ' + telTapado(f.pmTel) + ' · ' + f.pmBanco,
      titular: f.titular === 'familiar' && famOk(f) ? f.famNombre.trim() + ' (' + A.ciTapada(f.famLetra, f.famCi) + ')' : 'La misma persona', vacaciones: 'Todavía no causa' };
    if (f.tipoSal === 'por_dia') Object.assign(datos, { diaria: monto, sueldo: Math.round(monto * 15) }); else Object.assign(datos, { sueldo: monto });
    let e;
    if (re) {
      e = re; e.historial = (e.historial || []).concat([{ desde: e.ingreso, hasta: e.egreso, motivo: e.motivoEgreso, cargo: e.cargo }]);
      ['egreso', 'motivoEgreso', 'notaEgreso', 'calificacion', 'liquidacionPagada', 'certVence', 'docCert', 'certNoAplica', 'familiarAnotado', 'contratoFirmado', 'renovado', 'papelesHoy'].forEach(k => delete e[k]);
      // vuelve con su historial; su parte del 10 % arranca en 0, como la de cualquiera que entra (la regla de hoy)
      Object.assign(e, datos, { pct: 0, emergencia: e.emergencia || '—' });
    } else {
      const n = Math.max(...D.EMPLEADOS.map(x => +String(x.id).replace(/\D/g, '') || 0)) + 1;
      e = Object.assign({ id: 'e' + n, pct: 0, emergencia: '—' }, datos); D.EMPLEADOS.push(e);
    }
    if (!AREAS_SALUD.includes(e.area)) e.certNoAplica = true;
    e.contratoFirmado = false; e.contratoEnviado = 'por WhatsApp al ' + e.tel;
    // sin foto, la cédula queda «Falta la foto» (el número solo no es el papel); el acuerdo del cestaticket se firma con el contrato
    if (f.docs.length) { e.docCed = f.docs[0]; f.docs.forEach(x => alExpediente(e, x)); } else if (!re) e.docCed = '';
    e.cestaFirmado = false; delete e.docCesta;
    A.auditar({ modulo: 'Personal', registro: e.nombre, campo: re ? 'ficha' : 'creado', antes: re ? 'egresado' : '—', despues: re ? 'reactivada: volvió el ' + F.corta(f.ingreso) : 'ficha nueva' });
    if (S.usuario.rol !== 'dueno') A.pendiente({ id: 'pe' + Date.now(), para: ['alejandro'], tipo: 'info', titulo: (re ? 'Vuelve ' : 'Persona nueva: ') + e.nombre, sub: e.cargo + ' · ' + e.area + ' · entra el ' + F.corta(f.ingreso) + ' · la registró ' + S.usuario.nombre, de: S.usuario.nombre, edad: 'Ahora', abrir: 'empleado:' + e.id });
    if (f.borrador) { const i = D.BORRADORES_PERSONA.findIndex(b => b.id === f.borrador); if (i >= 0) D.BORRADORES_PERSONA.splice(i, 1); }
    NP.hecho = { tipo: re ? 'reactivada' : 'creada', id: e.id, nombre: e.nombre, tel: e.tel, falta: faltaPagar(f), formal: e.formal };
    A.borradorHecho(); A.pintarPagina();
    A.aviso(re ? 'Ficha reactivada: le llega el contrato por WhatsApp. (Simulado)' : 'Ficha creada: le llega el contrato por WhatsApp. (Simulado)');
  };
  // guardar a medias: basta el nombre; queda en Altas y egresos con lo que falta para poder pagarle
  ACC['emp-borrador'] = () => {
    leerTodoNP(); const f = NP.form; if (A.faltan($('#main'), [[f.nombre.trim().length < 3, 'np-nombre', 'Para guardar el borrador, escribe al menos el nombre.']])) return;
    const copia = JSON.parse(JSON.stringify(f)); delete copia.docsUrl;
    const prev = f.borrador ? D.BORRADORES_PERSONA.find(b => b.id === f.borrador) : null;
    if (prev) Object.assign(prev, { form: copia, quien: S.usuario.nombre, hora: D.HOY.hora }); else { const id = 'bp' + (D.BORRADORES_PERSONA.length + 1) + Date.now() % 1000; copia.borrador = id; D.BORRADORES_PERSONA.unshift({ id, form: copia, quien: S.usuario.nombre, hora: D.HOY.hora }); }
    A.auditar({ modulo: 'Personal', registro: f.nombre.trim(), campo: 'borrador', antes: '—', despues: 'guardado a medias · falta ' + (lista(faltaPagar(f)) || 'nada') });
    NP.hecho = { tipo: 'borrador', nombre: f.nombre.trim(), falta: faltaPagar(f) }; A.borradorHecho(); A.pintarPagina(); A.aviso('Guardado como borrador.');
  };
  ACC['emp-seguir'] = id => { const b = D.BORRADORES_PERSONA.find(x => x.id === id); if (!b) return; NP.form = Object.assign(npVacio(), JSON.parse(JSON.stringify(b.form)), { borrador: id }); NP.hecho = null; A.ir('personal/nueva'); };
  function hechoPersona() {
    const h = NP.hecho;
    const txt = h.tipo === 'borrador' ? `Guardado como borrador: ${esc(h.nombre)}. Lo encuentras en Altas y egresos, en «Fichas a medias».`
      : `${h.tipo === 'reactivada' ? 'Ficha reactivada, con su historial' : 'Ficha creada'}. A ${esc(h.nombre.split(' ')[0])} le llega el contrato para firmar por WhatsApp al ${esc(h.tel)}${S.usuario.rol === 'dueno' ? '' : ', y a Alejandro, el aviso'}. (Simulado)`;
    return `<div class="pila" style="max-width:640px"><div class="hecho-caja">${ic(h.tipo === 'borrador' ? 'lapiz' : 'check')}<span>${txt}</span></div>
      ${h.formal ? `<p class="nota info">${ic('info', 's')}<span>Va a la nómina formal: el alta en el IVSS se hace en los 3 días hábiles siguientes.</span></p>` : ''}
      ${h.falta.length ? `<p class="nota aviso">${ic('alerta', 's')}<span><b>Para poder pagarle falta</b> ${esc(lista(h.falta))}.${h.tipo === 'borrador' ? '' : ' Se carga en su ficha.'}</span></p>` : `<p class="nota ok">${ic('check', 's')}<span>Tiene todo para poder pagarle.</span></p>`}
      <div class="fila-btns">${h.id ? `<button class="btn pri" data-abrir="empleado:${h.id}">Abrir su ficha</button>` : ''}<button class="btn sec" data-acc="emp-volver" data-arg="${h.tipo === 'borrador' ? 'egresos' : 'lista'}">${h.tipo === 'borrador' ? 'Ir a Altas y egresos' : 'Volver al personal'}</button><button class="btn sec" data-acc="emp-otra">Crear otra</button></div></div>`;
  }
  // «Volver»: si la pantalla de antes es esa misma lista, es un paso atrás en el historial
  ACC['emp-volver'] = arg => { NP.form = npVacio(); NP.hecho = null; A.volver('personal/' + (arg || 'lista')); };
  ACC['emp-otra'] = () => { NP.form = npVacio(); NP.hecho = null; A.pintarPagina(); };
  /* registrar un egreso: primero quién se va (desde su ficha o su aviso ya viene puesto), después el tipo con botones (el despido pide la
     calificación de la Inspectoría mientras dure la inamovilidad; quien está en período de prueba tiene además «No sigue tras la prueba»),
     el último día y una nota opcional · el botón dice «Registrar el egreso de [nombre]»
     desde un aviso: tipo (ya marcado), fecha (el último día), nota (arriba) y alRegistrar (el aviso pasa a «Resueltos hoy») */
  const TIPOS_EGRESO = [['renuncia', 'Renuncia'], ['fin', 'Fin de contrato'], ['despido', 'Despido']];
  // «Fin de contrato» solo vale para un contrato determinado que todavía no es fijo: a quien es indeterminado (o ya fijo) terminarlo es un despido
  const finVale = x => !x || (/^Determinado/.test(x.contrato || '') && !!x.contratoVence && !yaFijo(x));
  const tiposPara = x => (x && x.prueba ? [['prueba', 'No sigue tras la prueba']] : []).concat(TIPOS_EGRESO.filter(([k]) => k !== 'fin' || finVale(x)));
  // el último día escrito («Lun 5 oct 2026», «20 nov»): para saber si cae antes de que venza el contrato
  const leerDia = t => { const m = /(\d{1,2})\s+([a-záéíóú]{3})[a-záéíóú]*\.?(?:\s+(?:de\s+)?(\d{4}))?/i.exec(String(t || '')); if (!m) return null; const mi = M.indexOf(m[2].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 3)); return mi >= 0 ? [+m[1], mi, m[3] ? +m[3] : 2026] : null; };
  function abrirEgreso(id, { tipo: tipo0 = '', fecha = '', nota: notaArriba = '', alRegistrar = null } = {}) {
    if (!edP()) { A.aviso('Lo registran ' + A.quienEdita('personal') + '.', 'info'); return; }
    const gente = activos(); let tipo = tipo0;
    const botones = x => tiposPara(x).map(([k, t]) => `<button type="button" class="btn sec" data-eg-tipo="${k}" aria-pressed="${k === tipo}">${t}</button>`).join('');
    const env = A.modal(`<h2 id="modal-t">Registrar un egreso</h2><p class="muted" id="modal-d">La app arma la liquidación, descuenta lo que deba y le quita el acceso a los grupos. Hay 5 días para pagarla.</p>
      ${notaArriba ? `<p class="nota aviso">${ic('escudo', 's')}<span>${esc(notaArriba)}</span></p>` : ''}
      <div class="form">
        <label class="campo" for="eg-quien"><span>¿Quién se va?</span><select id="eg-quien"><option value="">Elige la persona</option>${gente.map(x => `<option value="${x.id}"${x.id === id ? ' selected' : ''}>${esc(x.nombre)} · ${esc(x.cargo)}</option>`).join('')}</select></label>
        <div class="campo" id="eg-tipo-campo"><span id="eg-tipo-t">¿Por qué se va?</span><div class="tres-botones" role="group" aria-labelledby="eg-tipo-t" id="eg-tipos">${botones(gente.find(x => x.id === id))}</div></div>
        <div class="pila" id="eg-despido"${tipo === 'despido' ? '' : ' hidden'} style="gap:10px">
          <p class="nota aviso">${ic('escudo', 's')}<span>Hay inamovilidad hasta el 31 de diciembre: para despedir hace falta, antes, la calificación de la Inspectoría del Trabajo.</span></p>
          <label class="campo" for="eg-prov"><span>N.º de la providencia de la Inspectoría</span><input id="eg-prov" autocomplete="off" placeholder="Por ejemplo: 0123-2026"><small class="ayuda">O sube la foto de la calificación aquí abajo.</small></label>
          <div class="campo soltar-env"><label class="soltar" for="eg-cal">${ic('camara')}<span><b>La calificación de la Inspectoría (opcional si escribiste el número)</b>Foto o PDF de la providencia.</span></label><input id="eg-cal" type="file" accept="image/*,application/pdf" class="sr-only" data-mini></div>
        </div>
        <label class="campo" for="eg-fecha"><span>Último día de trabajo</span><input id="eg-fecha" value="${esc(fecha || 'Lun 5 oct 2026')}" autocomplete="off"></label>
        <label class="campo" for="eg-nota"><span>Nota (opcional)</span><textarea id="eg-nota" placeholder="Lo que haga falta saber: entregó el uniforme, avisó con tiempo…"></textarea></label>
      </div>
      <div class="modal-acc"><button class="btn sec" data-eg="no">Cancelar</button><button class="btn peligro" data-eg="si">${ic('salir', 's')}<span id="eg-btn-t">Registrar el egreso</span></button></div>`, 'teclado');
    const quien = () => gente.find(x => x.id === $('#eg-quien').value);
    // quien está en período de prueba tiene además «No sigue tras la prueba» (al cambiar de persona, los botones se vuelven a armar)
    const cambiaQuien = () => { const q = quien(); $('#eg-btn-t').textContent = q ? 'Registrar el egreso de ' + q.nombre : 'Registrar el egreso'; if (!tiposPara(q).some(t => t[0] === tipo)) tipo = ''; $('#eg-tipos').innerHTML = botones(q); $('#eg-despido').hidden = tipo !== 'despido'; };
    $('#eg-quien').addEventListener('change', cambiaQuien); cambiaQuien();
    (id ? (env.querySelector('[data-eg-tipo][aria-pressed="true"]') || env.querySelector('[data-eg-tipo]')) : $('#eg-quien')).focus();
    env.onclick = e => {
      const tb = e.target.closest('[data-eg-tipo]');
      if (tb) { tipo = tb.dataset.egTipo; A.$$('[data-eg-tipo]', env).forEach(b => b.setAttribute('aria-pressed', String(b === tb))); $('#eg-despido').hidden = tipo !== 'despido'; A.limpiarFaltas($('#eg-tipo-campo').parentElement); return; }
      const b = e.target.closest('[data-eg]'); if (!b) return;
      if (b.dataset.eg === 'no') { A.cerrarModal(); return; }
      const x = quien(); const fechaTxt = $('#eg-fecha').value.trim(); const prov = $('#eg-prov').value.trim(); const cal = $('#eg-cal').files[0];
      // terminar un contrato determinado antes de que venza es un despido: pide la calificación (el aviso va en la fecha)
      const ult = leerDia(fechaTxt); const antesDeVencer = tipo === 'fin' && x && x.contratoVence && ult && A.F.dif(ult, x.contratoVence) < 0;
      if (A.faltan(env, [[!x, 'eg-quien', 'Elige quién se va.'], [!tipo, 'eg-tipo-campo', 'Toca por qué se va: ' + tiposPara(x).map(t => t[1].toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' o $1') + '.'],
        [tipo === 'despido' && !prov && !cal, 'eg-prov', 'Escribe el número de la providencia o sube la calificación: sin ella no se puede despedir.'], [!fechaTxt, 'eg-fecha', 'Escribe el último día de trabajo.'],
        [!!antesDeVencer, 'eg-fecha', antesDeVencer ? 'Su contrato vence el ' + fd(x.contratoVence) + ': terminarlo antes es un despido. Toca «Despido» y sube la calificación de la Inspectoría.' : '']])) return;
      const tipoTxt = tiposPara(x).find(t => t[0] === tipo)[1]; const nota = $('#eg-nota').value.trim(); const calif = tipo === 'despido' ? (prov ? 'providencia ' + prov : cal.name) : '';
      A.cerrarModal();
      A.pedirCodigo({ que: 'Egreso de ' + esc(x.nombre) + ' · ' + esc(tipoTxt.toLowerCase()), det: esc(x.cargo) + ' · ingresó el ' + esc(x.ingreso) + ' · último día: ' + esc(fechaTxt) + (calif ? ' · calificación: ' + esc(calif) : '') + '. La app arma su liquidación.', boton: 'Registrar el egreso de ' + x.nombre.split(' ')[0], tono: 'peligro' }).then(() => {
        Object.assign(x, { estado: 'egresado', egreso: fechaTxt, motivoEgreso: tipoTxt, notaEgreso: nota, calificacion: calif });
        A.auditar({ modulo: 'Personal', registro: x.nombre, campo: 'estado', antes: 'activo', despues: 'egresado · ' + tipoTxt.toLowerCase(), motivo: [nota, calif ? 'Calificación: ' + calif : ''].filter(Boolean).join(' · ') });
        if (alRegistrar) alRegistrar(x, tipoTxt);
        if (S.ficha) A.pintarFicha(); A.pintarPagina(); A.aviso('Egreso de ' + x.nombre + ' registrado. Su liquidación queda por armar: hay 5 días para pagarla.');
      }).catch(() => {});
    };
  }
  ACC.egreso = id => abrirEgreso(id);
  ACC.constancia = id => A.aviso('Constancia de trabajo de ' + emp(id).nombre + ' lista para descargar, con los datos de la ficha. Queda registrada en su expediente. (Simulado)');
  ACC['prestamo-para'] = id => { PR.form = { ...prestVacio(), emp: id }; PR.hecho = false; A.cerrarFicha(); A.ir('prestamos/nuevo'); };

  // el expediente por documento: cada papel dice «Cargado» (y se abre), trae su botón para subirlo o dice «No aplica» (los mismos datos que los avisos)
  function expedienteHtml(e) {
    const ed = edP() && e.estado !== 'egresado';
    return `<ul class="expediente">${docsDe(e).map(d => {
      const avKey = d.k === 'salud' ? 'salud:' + e.id : 'papeles:' + e.id; const espera = d.acc && esperaDe(avKey, d.acc.acc);
      const estado = espera ? tag('Esperando señal', 'aviso') : d.estado === 'cargado' ? (d.aviso ? tag('Por vencer', 'aviso') : `<span class="exp-ok">${ic('check', 'xs')}Cargado</span>`) : d.estado === 'no_aplica' ? '<span class="tenue">No aplica</span>' : tag('Falta', 'aviso');
      const fin = espera ? '' : d.acc && ed && (d.estado === 'falta' || d.aviso) ? `<button class="btn sec chico" data-acc="${d.acc.acc}" data-arg="${e.id}">${ic(d.acc.icono, 's')}${esc(d.acc.txt)}</button>` : d.archivo ? `<button class="adjunto" data-acc="ver-archivo" data-arg="${esc(d.archivo)}">${ic(/\.pdf$/i.test(d.archivo) ? 'archivo' : 'imagen', 's')}<span>${esc(d.archivo)}</span></button>` : '';
      return `<li class="exp-doc ${d.estado}${d.aviso ? ' por-vencer' : ''}"><div class="exp-cab"><b>${esc(d.nombre)}</b>${estado}</div><small>${d.detalle}${espera ? ' · la foto se sube sola cuando vuelva la señal' : ''}</small>${fin ? `<div class="exp-fin">${fin}</div>` : ''}</li>`;
    }).join('')}</ul>`;
  }
  FICHAS.empleado = id => {
    const e = emp(id);
    const h = D.HORAS.filas[id]; const vac = D.VACACIONES.filter(v => v.emp === id);
    const pres = D.PRESTAMOS.filter(p => p.emp === id && p.estado !== 'rechazado'); const ade = D.ADELANTOS.filter(a => a.emp === id && a.estado === 'por_descontar');
    const deuda = pres.filter(vivo).reduce((s2, p) => s2 + saldo(p), 0) + ade.reduce((s2, a) => s2 + a.monto, 0);
    const lq = D.LIQUIDACIONES.find(l => l.emp === id);
    const acciones = [];
    if (edP()) acciones.push({ txt: 'Constancia de trabajo', acc: 'constancia', icono: 'descargar' });
    if (puede('nomina', 'editar') && e.estado !== 'egresado') acciones.push({ txt: 'Nuevo préstamo', acc: 'prestamo-para', icono: 'prestamo' });
    if (edP() && e.estado !== 'egresado') acciones.push({ txt: 'Registrar egreso', acc: 'egreso', icono: 'salir', tono: 'ghost' });
    return { titulo: e.nombre, sub: esc(e.cargo) + ' · ' + esc(e.area), mod: 'personal', obj: e, registro: 'Ficha de ' + e.nombre,
      tags: [[e.formal ? 'Nómina formal' : 'Nómina interna', e.formal ? 'info' : ''], ...(e.estado !== 'activo' ? [[A.estadoTag(e.estado).replace(/<[^>]+>/g, ''), e.estado === 'egresado' ? '' : 'lila']] : []), ...(proxCumple(e) === 0 ? [['Hoy cumple ' + cumpleAnios(e), 'lila']] : [])],
      aviso: e.estado === 'egresado' ? `<p class="nota aviso">${ic('salir', 's')}<span>Salió el ${esc(e.egreso)} (${esc(e.motivoEgreso).toLowerCase()}). ${lq && puede('nomina') ? `<button class="enlace" data-abrir="liquidacion:${lq.id}">Ver su liquidación</button>` : e.liquidacionPagada ? 'Liquidación: ' + esc(minus(e.liquidacionPagada)) + '.' : ''}</span></p>` : '',
      bloques: [
        { titulo: 'Ficha', filas: [
          { l: 'Cédula', v: e.ci ? esc(e.ci) : tag('Falta', 'aviso') },
          ...(sensible() && e.tel ? [{ l: 'Teléfono (WhatsApp)', v: esc(e.tel) }] : []),
          { l: 'Cargo', v: esc(e.cargo), campo: { k: 'cargo', tipo: 'texto' } },
          { l: 'Área', v: esc(e.area), campo: { k: 'area', tipo: 'select', opciones: AREAS } },
          { l: 'Turno', v: esc(e.turno) + ' · ' + esc(D.TURNOS[e.turno][0].toLowerCase()) + ', ' + esc(D.TURNOS[e.turno][1]), campo: { k: 'turno', tipo: 'select', opciones: Object.entries(D.TURNOS).map(([k, [n]]) => [k, k + ' · ' + n]) } },
          { l: 'Ingresó', v: esc(e.ingreso) + (e.anios ? ' · ' + e.anios + (e.anios === 1 ? ' año' : ' años') : ' · menos de 1 año') },
          { l: 'Cumpleaños', v: e.nac ? fd([e.nac[0], e.nac[1]]) + ` · cumple ${cumpleAnios(e)}` + (proxCumple(e) === 0 ? ' ' + tag('Hoy', 'lila') : proxCumple(e) <= 7 ? ' ' + tag('En ' + proxCumple(e) + ' días', 'lila') : '') : tag('Sin fecha', 'aviso') + (edP() && e.estado !== 'egresado' ? ` <button class="enlace" data-acc="av-nac" data-arg="${e.id}">${ic('lapiz', 's')}Escribir fecha de nacimiento</button>` : '') },
          { l: 'Contrato', v: esc(e.contrato) + (yaFijo(e) ? ' ' + tag('Ya es indeterminado (fijo)', 'alerta') : e.contratoVence ? ' · vence el ' + fd(e.contratoVence) : '') },
          ...(e.prueba ? [{ l: 'Período de prueba', v: 'Termina el ' + fdl(e.prueba) + ' ' + tag(enDias(e.prueba), 'aviso') }] : []),
        ] },
        { titulo: 'Pago', oculto: !ve(), filas: [
          { l: 'Cómo se le paga', v: e.tipoSal === 'por_dia' ? 'Tarifa por día' : 'Sueldo quincenal (el día vale el sueldo ÷ 15)' },
          e.tipoSal === 'por_dia' ? { l: 'Tarifa por día ($)', v: dinero(e.diaria, 'usd'), campo: { k: 'diaria', tipo: 'dinero', mon: 'usd', sensible: true, obligatorio: true } } : { l: 'Sueldo quincenal ($)', v: dinero(e.sueldo, 'usd', 0), campo: { k: 'sueldo', tipo: 'dinero', mon: 'usd', sensible: true, obligatorio: true } },
          { l: '% del 10 % de servicio', v: fmt(e.pct, 1) + ' %', campo: { k: 'pct', tipo: 'numero', obligatorio: true } },
          { l: 'Cuenta para pagarle', v: (e.cuenta ? esc(e.cuenta) : tag('Falta: sin ella no se le puede pagar', 'aviso')) + (e.cuentaNueva ? ' ' + tag('Por verificar', 'alerta') : e.cuentaVerificada ? ` <small class="tenue">${esc(e.cuentaVerificada)}</small>` : ''), campo: { k: 'cuenta', tipo: 'texto', sensible: true } },
          ...(e.cuentaVieja ? [{ l: 'Cuenta anterior', v: esc(e.cuentaVieja) + ' <small class="tenue">ya no se usa</small>' }] : []),
          { l: 'Titular de la cuenta', v: esc(e.titular) + (esFamiliar(e) ? ' ' + tag(e.familiarAnotado ? 'Familiar · anotado' : 'Familiar', 'info') : '') },
        ] },
        // una cuenta que cambió queda por verificar: en Pagar la nómina no se le paga ahí hasta que Alejandro la confirme con la persona
        { oculto: !ve() || !e.cuentaNueva, html: `<p class="nota alerta">${ic('candado', 's')}<span><b>Cuenta por verificar.</b> ${esc(e.cuentaNueva || '')}. En Pagar la nómina no se le paga ahí hasta que Alejandro la confirme con la persona.</span></p>` },
        { titulo: 'Horas de la última quincena', oculto: !h, extra: ' <small class="tenue">16 al 30 sep · ejemplo</small>', html: h ? `<dl class="kv"><div><dt>Trabajó</dt><dd>${fmt(h.trab, h.trab % 1 ? 1 : 0)} h de ${h.prog} h ${h.trab < h.prog - 4 ? tag('Faltan ' + fmt(h.prog - h.trab, 0) + ' h', 'aviso') : ''}</dd></div><div><dt>Redobles</dt><dd>${h.redobles || 'Ninguno'}</dd></div><div><dt>Horas de noche (7 p. m. a 5 a. m.)</dt><dd>${h.noct ? h.noct + ' h' : 'Ninguna'}</dd></div><div><dt>Domingos o feriados trabajados</dt><dd>${h.dom ? h.dom + (h.dom === 1 ? ' día' : ' días') : 'Ninguno'}</dd></div><div><dt>Llegadas tarde</dt><dd>${h.tarde ? h.tarde + ' min en total' : 'Ninguna'}</dd></div><div><dt>Faltas</dt><dd>${h.faltas || 'Ninguna'}</dd></div></dl><button class="enlace" data-ir="asistencia/horas">Ver las horas de todos ${ic('derecha', 's')}</button>` : '' },
        { titulo: 'Vacaciones', html: `<p>${esc(e.vacaciones)}.</p>${vac.map(v => `<button class="enlace" data-abrir="vacacion:${v.id}">${esc(v.periodo)} · ${v.dias} días ${ic('derecha', 's')}</button>`).join('')}` },
        { titulo: 'Préstamos y descuentos', oculto: !puede('nomina'), html: !ve() ? `<p class="muted">${deuda ? 'Tiene préstamos o adelantos vivos.' : 'Sin préstamos.'} El detalle lo ven el dueño, RRHH y contabilidad.</p>`
          : (pres.length || ade.length ? `<ul class="lista">${pres.map(p => `<li><button class="fila" data-abrir="prestamo:${p.id}">${lead(vivo(p) ? 'aviso' : '', 'prestamo')}<span class="medio"><b>Préstamo de ${dinero(p.monto, 'usd', 0)}</b><small>${p.pagadas} de ${p.cuotas} cuotas · ${esc(p.motivo)}</small></span><span class="fin">${vivo(p) ? 'Debe ' + dinero(saldo(p), 'usd', 0) : A.estadoTag(p.estado)}</span></button></li>`).join('')}${ade.map(a => `<li><button class="fila" data-abrir="adelanto:${a.id}">${lead('aviso', 'menos')}<span class="medio"><b>Adelanto de ${dinero(a.monto, 'usd', 0)}</b><small>Se descuenta el ${esc(a.descuenta)}</small></span><span class="fin">${A.estadoTag(a.estado)}</span></button></li>`).join('')}</ul>` : '<p class="muted">No tiene préstamos ni adelantos.</p>') },
        // el expediente: cada papel con su estado y su botón; los datos son los mismos que los de los avisos
        { titulo: 'Expediente', oculto: !edP(), html: expedienteHtml(e) },
        { titulo: 'Contacto de emergencia', oculto: !edP(), filas: [{ l: 'Quién y su teléfono', v: e.emergencia && e.emergencia !== '—' ? esc(e.emergencia) : '<span class="tenue">Sin anotar</span>', campo: { k: 'emergencia', tipo: 'texto' } }] },
        { titulo: 'Historial', tiempo: [...(e.historial || []).map(x => [esc(x.desde), 'Trabajó aquí hasta el ' + esc(minus(x.hasta)) + ' como ' + esc(minus(x.cargo)) + ' (' + esc(minus(x.motivo)) + ').']),
          [esc(e.ingreso), (e.historial && e.historial.length ? 'Volvió como ' : 'Ingresó como ') + esc(e.cargo.toLowerCase()) + '.'], ...(e.pruebaFin ? [['Hoy', esc(e.pruebaFin) + '.', 'ok']] : []), ...(e.anios >= 2 ? [['ene 2026', 'Aumento del sueldo base (motivo: revisión anual).']] : []), ...(ve() ? pres.filter(vivo).map(p => [esc(p.fecha), 'Préstamo de ' + dinero(p.monto, 'usd', 0) + '.']) : []), ...(e.estado === 'egresado' ? [[esc(e.egreso), 'Egreso por ' + esc(e.motivoEgreso).toLowerCase() + '.', 'alerta']] : [])] },
      ], acciones,
      // cambiar la cuenta la deja por verificar y le avisa a Alejandro, como la de un proveedor
      alGuardar: cambios => {
        const c = cambios.find(x => x.r.campo.k === 'cuenta'); if (!c) return;
        e.cuentaVieja = c.antes; e.cuentaNueva = S.usuario.nombre + ' la cambió hoy con su código'; delete e.cuentaVerificada;
        if (S.usuario.id !== 'alejandro') A.pendiente({ id: 'pe' + Date.now(), para: ['alejandro'], tipo: 'alerta', titulo: 'Una persona del personal cambió de cuenta', sub: e.nombre + ' · confírmala con la persona antes de pagarle', de: S.usuario.nombre, edad: 'Ahora', ir: 'pagos', sub2: 'nomina', emp: e.id });
      } };
  };
  // la protección y la disciplina tocan la salud y el expediente: solo el dueño y RRHH (los demás no llegan aquí; si llegan, no ven el detalle)
  const soloRRHH = (titulo, sub) => ({ titulo, sub, mod: 'personal', bloques: [{ html: notaAgrupada('El detalle lo ven el dueño y RRHH: toca la salud o el expediente de la persona.') }] });
  FICHAS.fuero = id => { const f = D.FUEROS.find(x => x.id === id); if (!edP()) return soloRRHH('Protección: ' + emp(f.emp).nombre, 'Personal'); return { titulo: 'Protección: ' + emp(f.emp).nombre, sub: esc(f.tipo), mod: 'personal', obj: f, bloques: [{ filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${f.emp}">${esc(emp(f.emp).nombre)}</button>` }, { l: 'Tipo', v: esc(f.tipo) }, { l: 'Desde', v: esc(f.desde) }, { l: 'Hasta', v: esc(f.hasta), campo: { k: 'hasta', tipo: 'texto' } }] }, { html: '<p class="muted">Mientras dure, no se le puede despedir, trasladar ni bajar el sueldo sin la autorización de la Inspectoría. La app avisa 30 días antes de que termine.</p>' }] }; };
  // la amonestación: con el recibido de la Inspectoría queda «Calificación pedida» (la foto, la fecha y el número); sin él, «Ya pedí la calificación»
  FICHAS.amonestacion = id => { const a = D.AMONESTACIONES.find(x => x.id === id); if (!edP()) return soloRRHH('Amonestación a ' + emp(a.emp).nombre, 'Personal'); const c = a.calificacion;
    return { titulo: 'Amonestación a ' + emp(a.emp).nombre, sub: esc(a.fecha), mod: 'personal', obj: a, registro: 'Amonestación ' + emp(a.emp).nombre, tags: [c ? ['Calificación pedida el ' + c.fecha.toLowerCase(), 'info'] : [a.quedan + ' días para pedir la calificación', 'aviso']],
      bloques: [{ filas: [{ l: 'Qué pasó', v: esc(a.hechos), largo: true, campo: { k: 'hechos', tipo: 'area' } }, { l: 'Tipo', v: esc(a.tipo) }, { l: 'Firma', v: esc(a.firma) }, ...(c ? [{ l: 'Calificación', v: 'Pedida el ' + esc(c.fecha.toLowerCase()) + ' por ' + esc(c.quien) + (c.numero ? ' · expediente ' + esc(c.numero) : '') }] : [])] },
        { titulo: 'Documentos', adjuntos: ['Amonestación ' + a.fecha + '.pdf'].concat(c ? [c.foto] : []) }, { html: '<p class="muted">Tres faltas sin justificar en 30 días son causa de despido. Con la inamovilidad, primero se pide la calificación a la Inspectoría, y hay 30 días desde la falta para hacerlo.</p>' }],
      acciones: c ? [] : [{ txt: 'Ya pedí la calificación', acc: 'av-amon', arg: a.id, tono: 'pri', icono: 'check', solo: 'editar' }] }; };

  // el soporte de una falta: la misma etiqueta en Asistencia › Faltas y en Vacaciones › Justificativos y reposos (es la misma fila)
  const soporteTag = f => f.soporte ? tag('Con foto', 'ok') : f.estado === 'justificada_sin' ? tag('Sin papel', 'aviso') : f.estado === 'injustificada' ? '<span class="tenue">Sin soporte</span>' : tag('Falta la foto', 'aviso');

  /* =============== ASISTENCIA Y HORAS =============== */
  const CT = { 1: ['t1', 'Mañana'], 2: ['t2', 'Tarde'], 3: ['t3', 'Noche'], D: ['td', 'Descanso'], V: ['tv', 'Vacaciones'], R: ['tr', 'Reposo'] };
  PANT.asistencia = {
    titulo: 'Asistencia y horas', corto: 'Asistencia', tab: 'Asistencia', grupo: 'Recursos humanos', icono: 'reloj', mod: 'personal', palabras: 'horario turnos faltas reloj',
    secciones: [['semana', 'Horario de la semana', 'turno turnos'], ['horas', 'Horas trabajadas', 'horas extra nocturnas'], ['faltas', 'Faltas y justificativos', 'falta inasistencia'], ['redobles', 'Redobles y días extra', 'redoble doblar'], ['incidencias', 'Horas que no cuadran', 'incidencia'], ['reloj', 'Reloj', 'biometrico marcas excel']],
    cuenta: () => edP() ? D.FALTAS.filter(f => f.estado === 'por_justificar').length : ['r', 'a'].includes(nivel('nomina')) ? D.REDOBLES.filter(r => r.estado === 'por_revisar').length : 0,
    render: (sub = 'semana') => {
      let cuerpo = '';
      const verMonto = ve();
      if (sub === 'semana') {
        const H = D.HORARIOS; const filas = activos();
        cuerpo = `<div class="sec"><h2>${esc(H.semana)}</h2>${A.boton('personal', 'Cambiar un turno', 'data-acc="turno-ayuda"', { tono: 'sec', icono: 'lapiz', chico: true })}</div>
          <p class="leyenda turnos-ley">${Object.entries(CT).map(([k, [c, n]]) => `<span><span class="turno ${c}">${n}</span>${/[123]/.test(k) ? ' ' + esc(D.TURNOS['T-' + k][1]) : ''}</span>`).join('')}<span class="tenue">Más oscuro, más tarde en el día. Las ausencias van rayadas.</span></p>
          <div class="hoja plana"><div class="tabla-env"><table class="t horario"><thead><tr><th scope="col">Persona</th>${H.dias.map((d, i) => `<th scope="col" class="${i === 0 ? 'hoy' : ''}">${d}</th>`).join('')}</tr></thead>
            <tbody>${filas.map(e => `<tr><th scope="row"><button class="enlace" data-abrir="empleado:${e.id}">${esc(e.nombre)}</button><small>${esc(e.cargo)}</small></th>${(H.filas[e.id] || []).map((c, i) => { const [cls, n] = CT[c]; const m = i === 0 && H.hoy[e.id]; return `<td class="${i === 0 ? 'hoy' : ''}"><button class="turno ${cls}" data-abrir="dia:${e.id}-${i}" aria-label="${esc(e.nombre)}, ${esc(H.dias[i])}: ${n}${m && m[0] ? ', marcó a las ' + esc(m[0]) : ''}">${n}</button>${m && m[0] ? `<small class="ponche${m[1] ? ' tarde' : ''}" title="${esc(m[1] || 'Marcó a tiempo')}">${esc(m[0])}</small>` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody>
            <tfoot><tr><td>Trabajan</td>${H.dias.map((d, i) => { const n = filas.filter(e => /[123]/.test((H.filas[e.id] || [])[i])).length; return `<td class="${i === 0 ? 'hoy' : ''}">${n}</td>`; }).join('')}</tr></tfoot></table></div></div>
          <div class="rejilla"><div class="c6"><p class="nota ok">${ic('check', 's')}<span>Todos tienen sus 2 días de descanso seguidos. Si un cambio los rompe, la app avisa antes de guardar.</span></p></div>
          <div class="c6"><p class="nota info">${ic('reloj', 's')}<span>Debajo del turno de hoy va la hora que marcó cada quien en el reloj; en rojo, si llegó tarde, como lo imprime el reloj de ponchar. Yohana marcó a las 7:12 (ejemplo).</span></p></div></div>`;
      }
      if (sub === 'horas') {
        const F = D.HORAS.filas; const ids = Object.keys(F);
        const tot = k => ids.reduce((s2, i) => s2 + F[i][k], 0);
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Horas programadas', valor: fmt(tot('prog'), 0), sub: D.HORAS.periodo })}${A.cifra({ etq: 'Horas trabajadas', valor: fmt(tot('trab'), 0), sub: fmt(tot('trab') / tot('prog') * 100, 1) + ' % de lo programado' })}${A.cifra({ etq: 'Llegadas tarde', valor: fmt(tot('tarde'), 0) + ' min', sub: 'en ' + ids.filter(i => F[i].tarde).length + ' personas', tono: 'aviso' })}${A.cifra({ etq: 'Redobles', valor: tot('redobles'), sub: 'medio día cada uno', ir: 'asistencia/redobles' })}</div>
          ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Programadas', cls: 'r x' }, { t: 'Trabajadas', cls: 'r' }, { t: 'Extra', cls: 'r x' }, { t: 'Nocturnas', cls: 'r x' }, { t: 'Domingos', cls: 'r x' }, { t: 'Tarde (min)', cls: 'r x' }, { t: 'Redobles', cls: 'r x' }, { t: '', cls: 'e' }],
            filas: ids.map(i => { const h = F[i], e = emp(i), dif = h.trab - h.prog; return { abrir: 'empleado:' + i, celdas: [`<b>${esc(e.nombre)}</b><small>${esc(e.cargo)} · ${turnoTxt(e.turno)}</small>`, h.prog, fmt(h.trab, h.trab % 1 ? 1 : 0), h.extra || '—', h.noct || '—', h.dom || '—', h.tarde ? `<span class="reloj-rojo">${h.tarde}</span>` : '—', h.redobles || '—', dif <= -4 ? tag('Faltan ' + fmt(-dif, 0) + ' h', 'aviso') : e.estado === 'reposo' ? A.estadoTag('reposo') : tag('Cuadra', 'ok')] }; }),
            pie: ['Total', tot('prog'), fmt(tot('trab'), 0), tot('extra'), tot('noct'), tot('dom'), tot('tarde'), tot('redobles'), ''] })}
          <p class="muted">Horas extra: máximo 10 por semana y 100 al año, con permiso de la Inspectoría. Las de noche (de 7 p. m. a 5 a. m.) llevan 30 % más: el turno de la tarde tiene 4 por día y el de la noche, todas. Los domingos y feriados trabajados, 50 % más. Los dos recargos van en la nómina, cada uno en su línea del recibo.</p>`;
      }
      if (sub === 'faltas') {
        const pj = D.FALTAS.filter(f => f.estado === 'por_justificar').length;
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Por justificar', valor: pj, sub: 'Andreina las clasifica con su soporte', tono: pj ? 'aviso' : '', abrir: (f => f ? 'falta:' + f.id : '')(D.FALTAS.find(f => f.estado === 'por_justificar')) })}${A.cifra({ etq: 'Sin justificar este mes', valor: D.FALTAS.filter(f => f.estado === 'injustificada').length, sub: 'se descuentan del día', tono: 'alerta', abrir: (f => f ? 'falta:' + f.id : '')(D.FALTAS.find(f => f.estado === 'injustificada')) })}${(n => A.cifra({ etq: 'Justificadas', valor: D.FALTAS.filter(f => f.estado === 'justificada').length + n, sub: n ? n + ' sin soporte' : 'con justificativo o permiso', tono: n ? 'aviso' : '', ir: 'ausencias/medicos' }))(D.FALTAS.filter(f => f.estado === 'justificada_sin').length)}</div>
          ${A.tabla({ cols: [{ t: 'Falta', cls: 'p' }, { t: 'Turno', cls: 'x' }, { t: 'Qué pasó', cls: 'x' }, { t: 'Soporte', cls: 'x' }, { t: 'Estado', cls: 'e' }], filas: D.FALTAS.map(f => ({ abrir: 'falta:' + f.id, celdas: [`<b>${esc(emp(f.emp).nombre)}</b><small>${esc(f.fecha)}${f.medico && edP() ? ' · con justificativo médico' : ''}</small>`, esc(f.turno), edP() ? esc(f.nota) : '<span class="tenue">Solo RRHH</span>', soporteTag(f), A.estadoTag(f.estado)] })) })}
          <p class="nota info">${ic('info', 's')}<span>El reloj solo dice que alguien no vino. Andreina decide si la falta está justificada y adjunta el soporte (justificativo médico, constancia o permiso). La falta y su justificativo son la misma fila: también sale en Vacaciones › Justificativos y reposos, y al subir la foto se actualizan las dos. 3 faltas sin justificar en 30 días son causa de despido, siempre con la calificación de la Inspectoría mientras dure la inamovilidad.</span></p>`;
      }
      if (sub === 'redobles') {
        const sin = D.REDOBLES.filter(r => r.estado === 'por_revisar'); const van = D.REDOBLES.filter(r => r.estado !== 'no_va');
        const monto = r => { const d = diario(emp(r.emp)); return (r.tipo === 'redoble' ? .5 : 1.5) * d * r.veces; };
        const cols = [{ t: 'Persona', cls: 'p' }, { t: 'Qué', cls: 'x' }, { t: 'Detalle', cls: 'x' }]; if (verMonto) cols.push({ t: 'Se le paga', cls: 'r plata' }); cols.push({ t: 'Revisión', cls: 'e' });
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Sin revisar', valor: sin.length, sub: 'los revisa Jose antes de la nómina', tono: sin.length ? 'aviso' : '', abrir: sin[0] ? 'redoble:' + sin[0].id : '' })}${verMonto ? A.cifra({ etq: 'Entran en la nómina del 15', valor: dinero(van.reduce((s2, r) => s2 + monto(r), 0), 'usd'), sub: van.length + ' días' + (van.length < D.REDOBLES.length ? ' · ' + (D.REDOBLES.length - van.length) + ' no van' : ''), ir: 'nomina/quincena' }) : ''}${A.cifra({ etq: 'Redoble', valor: '½ día', sub: 'doblar turno paga medio día más' })}${A.cifra({ etq: 'Día extra', valor: '1½ días', sub: 'trabajar el día de descanso' })}</div>
          ${A.tabla({ cols, filas: D.REDOBLES.map(r => { const c = [`<b>${esc(emp(r.emp).nombre)}</b><small>${esc(r.fecha)}</small>`, r.tipo === 'redoble' ? 'Redoble' : 'Día extra', esc(r.detalle)]; if (verMonto) c.push(r.estado === 'no_va' ? `<s class="tenue">${dinero(monto(r), 'usd')}</s>` : dinero(monto(r), 'usd')); c.push(tagRedoble(r)); return { abrir: 'redoble:' + r.id, celdas: c }; }) })}
          <p class="muted">Hoy los anota la supervisora. Con el reloj conectado, la app los detecta sola: alguien que marcó un turno distinto al programado o que trabajó en su descanso.</p>`;
      }
      if (sub === 'incidencias') cuerpo = `<p class="desc">Cuando alguien trabaja menos horas de las programadas, la app avisa a Jose y a Andreina. Ellos anotan lo acordado (descontar, no descontar o compensar) y la app lo aplica en la nómina. Mientras quede una sin resolver, la nómina no pasa a revisión.</p>
        ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Esperadas', cls: 'r x' }, { t: 'Trabajadas', cls: 'r' }, { t: 'Lo acordado', cls: 'x' }, { t: 'Estado', cls: 'e' }], filas: D.INCIDENCIAS.map(x => ({ abrir: 'incidencia:' + x.id, celdas: [`<b>${esc(emp(x.emp).nombre)}</b><small>${esc(x.periodo)}</small>`, x.esperadas + ' h', x.reales + ' h', esc(x.acuerdo || '—'), A.estadoTag(x.estado)] })) })}`;
      if (sub === 'reloj') cuerpo = `<div class="rejilla"><div class="c7 pila"><article class="hoja"><div class="hoja-cab"><h2>${ic('reloj')}Reloj biométrico</h2>${tag('Esperando la muestra del Excel', 'aviso')}</div>
          <ol class="pasos">${['Subir el Excel', 'Juntar cada ID con su persona', 'Revisar huecos', 'Horas listas para la nómina'].map((p, i) => `<li class="${i === 0 ? 'actual' : ''}">${p}</li>`).join('')}</ol>
          <p>Así va a funcionar: Andreina sube el archivo que sale del reloj. La app junta cada número del reloj con su persona, empareja entradas y salidas contra el turno programado, quita las marcas dobles de menos de 5 minutos y avisa si faltan días («faltan las marcas del 8 al 10»). Subir el mismo archivo dos veces no duplica nada.</p>
          ${edP() ? `<label class="soltar" for="reloj-xls">${ic('subir')}<span><b>Subir el reporte del reloj</b>El Excel que sale del reloj biométrico.</span></label><input id="reloj-xls" type="file" class="sr-only" accept=".xls,.xlsx,.csv">` : ''}
          </article></div>
          <div class="c5 pila"><p class="nota aviso">${ic('alerta', 's')}<span><b>Bloquea el motor de nómina desde julio.</b> Sin una muestra del Excel no se puede saber cómo vienen las marcas.</span></p>
          <p class="nota gris">${ic('candado', 's')}<span>Las marcas del reloj nunca se editan. Una corrección es una fila nueva, con quién la hizo y por qué.</span></p></div></div>`;
      // la franja del reloj, en todas las secciones (también en el horario): el reloj frena la nómina y no puede quedar escondido en una pestaña
      const franja = sub === 'reloj' ? '' : `<div class="franja aviso" role="note">${ic('reloj', 's')}<span><b>El reloj todavía no está conectado:</b> falta la muestra del Excel y sin ella no se arma la nómina del 15.${sub === 'semana' ? ' Las marcas de hoy son un ejemplo.' : ' Las horas de aquí son un ejemplo.'}</span><button type="button" class="btn sec franja-btn" data-sub="reloj">${ic('reloj', 's')}Ver el reloj</button></div>`;
      return `<div class="pagina">${A.cab('Recursos humanos', 'Asistencia y horas', 'Quién trabaja cada día, las horas reales, las faltas con su justificativo y los redobles que entran en la nómina.')}
        ${franja}
        ${A.subnav([['semana', 'Horario de la semana'], ['horas', 'Horas trabajadas'], ['faltas', 'Faltas y justificativos', D.FALTAS.filter(f => f.estado === 'por_justificar').length], ['redobles', 'Redobles y días extra', D.REDOBLES.filter(r => r.estado === 'por_revisar').length], ['incidencias', 'Horas que no cuadran', D.INCIDENCIAS.filter(x => x.estado === 'alertada').length], ['reloj', 'Reloj']], sub)}${cuerpo}</div>`;
    },
  };
  ACC['turno-ayuda'] = () => A.aviso('Toca el turno de cualquier persona y día para cambiarlo. Queda en el registro y avisa a la supervisora.', 'info');
  FICHAS.dia = id => {
    const [eid, i] = id.split('-'); const e = emp(eid); const H = D.HORARIOS; const c = H.filas[eid][+i]; const m = +i === 0 && H.hoy[eid];
    const obj = { turno: c, estado: '' };
    return { titulo: e.nombre + ' · ' + H.dias[+i], sub: 'Horario de la semana', mod: 'personal', obj, registro: 'Turno de ' + e.nombre + ' el ' + H.dias[+i],
      bloques: [{ filas: [{ l: 'Turno programado', v: CT[c][1] + (/[123]/.test(c) ? ' · ' + esc(D.TURNOS['T-' + c][1]) : ''), campo: { k: 'turno', tipo: 'select', opciones: [['1', 'Mañana (T-1)'], ['2', 'Tarde (T-2)'], ['3', 'Noche (T-3)'], ['D', 'Descanso'], ['V', 'Vacaciones'], ['R', 'Reposo']] } },
        { l: 'Lo que marcó el reloj', v: +i === 0 ? (m && m[0] ? 'Entrada ' + esc(m[0]) + (m[1] ? ' · ' + esc(m[1]) : '') : /[12]/.test(c) && c === '2' ? 'Su turno empieza a las 15:00' : c === 'D' ? 'Descansa' : 'Sin marcas todavía') : 'Todavía no' }] },
        { html: '<p class="muted">Al cambiar un turno, la app revisa que la persona siga con 2 días de descanso seguidos y avisa a la supervisora. Si alguien trabaja un turno distinto al programado, se marca como posible redoble.</p>' }],
      alGuardar: () => { H.filas[eid][+i] = obj.turno; } };
  };
  // sin prueba no hay sello: «Justificada» pide la foto del justificativo ahí mismo (la cámara o la galería) y el sello sale cuando se sube;
  // si no hay papel, «Justificar con el motivo» la deja «Justificada sin soporte», con su etiqueta de aviso y sin sello
  // «Dejar sin justificar» y «Justificada» van de un toque, como «Llegó» y «No vino» en las reservas: se pueden deshacer durante 10 segundos
  // (la misma pieza de todas las decisiones de un toque, A.unToque) y después queda «Reabrir», que pide un motivo de un toque y deja el sello tachado
  // «Justificada» solo se ofrece si hay soporte
  FICHAS.falta = id => {
    const f = D.FALTAS.find(x => x.id === id); const e = emp(f.emp); const por = f.estado === 'por_justificar', sinSop = f.estado === 'justificada_sin';
    const acciones = por ? [{ txt: 'Dejar sin justificar', acc: 'falta-clas', arg: f.id + '|injustificada', solo: 'editar' }, { txt: 'Justificada', acc: 'falta-just', arg: f.id, tono: 'pri', icono: f.soporte ? 'check' : 'camara', solo: 'editar' }]
      : A.deshacible('falta:' + f.id) ? [{ ...A.accDeshacer('falta-deshacer', f.id, 'falta:' + f.id), solo: 'editar' }] : [{ ...A.accReabrir('falta-reabrir', f.id, 'falta:' + f.id), solo: 'editar' }];
    return { titulo: 'Falta de ' + e.nombre, sub: esc(f.fecha) + ' · turno ' + esc(f.turno), mod: 'personal', obj: f, registro: 'Falta ' + e.nombre + ' ' + f.fecha, tags: [[A.estadoTag(f.estado).replace(/<[^>]+>/g, ''), por || sinSop ? 'aviso' : '']],
      aviso: (f.mes >= 2 ? `<p class="nota alerta">${ic('alerta', 's')}<span>Es la ${f.mes}.ª falta sin justificar en 30 días. A la 3.ª hay causa de despido (con calificación de la Inspectoría).</span></p>` : '')
        + (sinSop ? `<p class="nota aviso">${ic('alerta', 's')}<span><b>Justificada sin soporte.</b> No se descuenta, pero no tiene el papel.${edP() ? ' Si lo traen, súbelo abajo y queda con su sello.' : ''}</span></p>` : ''),
      bloques: [{ filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${e.id}">${esc(e.nombre)}</button>` }, ...(edP() ? [{ l: 'Qué pasó', v: esc(f.nota), largo: true, campo: { k: 'nota', tipo: 'area' } }] : []), ...(edP() && f.medico ? [{ l: 'Justificativo médico', v: f.soporte ? 'Subido · ' + esc(f.soporte) : esc(f.medico.emisor) + ' · ' + esc(minus(f.medico.motivo)), largo: true }] : []), ...(!por ? [{ l: 'Estado', v: A.estadoTag(f.estado) }] : []), { l: 'La clasificó', v: esc(f.clasifico || 'Nadie todavía') }, ...(sinSop && edP() ? [{ l: 'Por qué sin papel', v: esc(f.motivoSin || '—'), largo: true }] : [])] },
        // el soporte puede traer el diagnóstico: el archivo solo lo ven el dueño y RRHH
        !edP() ? { titulo: 'Soporte', html: `<p class="nota gris">${ic('candado', 's')}<span>${f.soporte ? 'Tiene soporte · lo ven el dueño y RRHH.' : sinSop ? 'Justificada sin soporte.' : 'Falta el soporte.'}</span></p>` }
          : f.soporte ? { titulo: 'Soporte', adjuntos: [f.soporte] }
          : sinSop ? { titulo: 'Soporte', html: `<label class="soltar" for="fa-${f.id}">${ic('camara')}<span><b>Subir el justificativo</b>Foto del justificativo médico, la constancia o el permiso. Al subirlo queda justificada, con su sello.</span></label><input id="fa-${f.id}" data-subir-falta="${f.id}" type="file" accept="image/*,application/pdf" class="sr-only">` }
          : por ? { titulo: 'Soporte', html: `<p class="muted">${ic('camara', 'xs')} Para dejarla justificada hace falta la foto del justificativo: «Justificada» abre la cámara o la galería.</p>` }
          : { titulo: 'Soporte', html: '<p class="muted">Sin soporte.</p>' },
        { html: `<p class="muted">${f.medico && edP() && !f.soporte && f.estado === 'por_justificar' ? esc(f.medico.nota) + ' ' : ''}Justificada: no se descuenta. Sin justificar: se descuenta el día en la nómina y cuenta para las 3 del mes.${f.medico ? ' Es la misma fila que en Vacaciones › Justificativos y reposos.' : ''}</p>` }],
      acciones,
      enlaces: por && !f.soporte ? [{ txt: 'No hay papel: justificar con el motivo', acc: 'falta-sin', arg: f.id, solo: 'editar' }] : [],
      // ya clasificada, lo que se edita es la nota; la clasificación se cambia con «Reabrir»
      editarTono: por ? undefined : 'sec' };
  };
  // el pendiente «Clasificar la falta de…» se cierra al clasificarla y vuelve a abrirse si regresa a «Por justificar»
  const pendFalta = f => D.PENDIENTES.filter(p => p.abrir === 'falta:' + f.id).forEach(p => { if (f.estado === 'por_justificar') p.hecho = ''; else if (!p.hecho) p.hecho = 'La clasificó ' + A.S.usuario.nombre + ': ' + A.estadoTxt(f.estado).toLowerCase(); });
  const clasificar = (f, est, motivo = '') => { const antes = f.estado; f.estado = est; f.clasifico = A.S.usuario.nombre; A.auditar({ modulo: 'Asistencia', registro: 'Falta ' + emp(f.emp).nombre, campo: 'estado', antes: A.estadoTxt(antes), despues: A.estadoTxt(est), motivo }); pendFalta(f); A.pintarFicha(); A.pintarPagina(); };
  // clasificar de un toque: queda «Deshacer» 10 segundos (el teclado va ahí); a los 10 segundos deja su sitio a «Reabrir»
  const marcarFalta = (f, est, motivo = '') => {
    const antes = f.estado, clasifico = f.clasifico || ''; const abiertos = D.PENDIENTES.filter(p => p.abrir === 'falta:' + f.id && !p.hecho);
    A.unToque('falta:' + f.id, () => {
      const ahora = f.estado; f.estado = antes; f.clasifico = clasifico; abiertos.forEach(p => { p.hecho = ''; });
      A.auditar({ modulo: 'Asistencia', registro: 'Falta ' + emp(f.emp).nombre, campo: 'estado', antes: A.estadoTxt(ahora), despues: A.estadoTxt(f.estado), motivo: 'Deshecho a los pocos segundos de marcarlo' });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Deshecho: vuelve a «' + A.estadoTxt(f.estado) + '».');
    });
    clasificar(f, est, motivo);
    const d = document.querySelector('#ficha-raiz [data-acc="falta-deshacer"]'); if (d) d.focus({ preventScroll: true });
  };
  ACC['falta-clas'] = arg => {
    const [id, est] = arg.split('|'); if (est === 'justificada') { ACC['falta-just'](id); return; }
    marcarFalta(D.FALTAS.find(x => x.id === id), est);
    A.aviso('Quedó sin justificar. Se descuenta el día en la nómina del 15. Puedes deshacerlo durante 10 segundos.');
  };
  ACC['falta-deshacer'] = id => { if (!A.deshacerUT('falta:' + id)) { A.aviso('Ya pasaron los 10 segundos: para cambiarlo, toca «Reabrir».', 'info'); if (A.S.ficha) A.pintarFicha(); } };
  ACC['falta-just'] = id => {
    const f = D.FALTAS.find(x => x.id === id);
    const listo = () => { marcarFalta(f, 'justificada', 'Con su soporte: ' + f.soporte); A.aviso('Justificada con su soporte. No se descuenta. Puedes deshacerlo durante 10 segundos.'); };
    if (f.soporte) { listo(); return; }
    A.pedirArchivo(file => { f.soporte = file.name; listo(); });
  };
  // reabrir más tarde: un motivo de un toque; vuelve a «Por justificar» (su pendiente se abre otra vez) y el sello que tenía queda tachado
  const SELLO_FALTA = { justificada: ['Justificada', false], injustificada: ['Injustificada', true] };
  ACC['falta-reabrir'] = id => {
    const f = D.FALTAS.find(x => x.id === id); if (!f || f.estado === 'por_justificar') return;
    A.pedirReabrir({ titulo: 'Reabrir la falta de ' + emp(f.emp).nombre, texto: 'Vuelve a «Por justificar» y se clasifica otra vez. Lo de antes queda en el registro de cambios' + (SELLO_FALTA[f.estado] ? ' y su sello, tachado' : '') + '.', opciones: ['Me equivoqué de botón', 'Llegó el justificativo'] }).then(m => {
      const antes = f.estado; const s = SELLO_FALTA[antes]; if (s) A.selloViejo(f, s[0], s[1]);
      f.estado = 'por_justificar'; f.clasifico = ''; pendFalta(f);
      A.auditar({ modulo: 'Asistencia', registro: 'Falta ' + emp(f.emp).nombre, campo: 'estado', antes: A.estadoTxt(antes), despues: 'Por justificar (reabierta)', motivo: m });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Reabierta: vuelve a «Por justificar».');
    }).catch(() => {});
  };
  ACC['falta-sin'] = id => {
    const f = D.FALTAS.find(x => x.id === id);
    A.pedirMotivo({ titulo: 'Justificar sin soporte', texto: 'No se descuenta, pero queda «Justificada sin soporte»: sin el papel no lleva sello. Si lo traen después, se sube en esta ficha y queda con su sello.', etiqueta: 'Por qué se justifica sin papel', boton: 'Justificar sin soporte' })
      .then(m => { f.motivoSin = m; clasificar(f, 'justificada_sin', m); A.aviso('Justificada sin soporte. No se descuenta.'); }).catch(() => {});
  };
  // lo que se sube en una ficha: el justificativo de una falta sin soporte, la foto de un justificativo médico y la autorización de un préstamo
  // (solo cuenta si hay un archivo: sin archivo no cambia nada)
  // (un justificativo de 1 a 3 días no se sube aquí: es la falta de ese día, la misma fila en las dos listas)
  const subirReposo = (r, nombre) => { r.soporte = nombre; A.auditar({ modulo: 'Vacaciones y reposos', registro: 'Reposo ' + emp(r.emp).nombre, campo: 'foto', antes: 'falta', despues: nombre }); };
  document.addEventListener('change', e => {
    const t = e.target; if (!t || !t.matches || !t.files || !t.files.length) return;
    const nombre = t.files[0].name;
    if (t.matches('#ficha-raiz [data-subir-falta]')) {
      const f = D.FALTAS.find(x => x.id === t.dataset.subirFalta); if (!f) return; f.soporte = nombre;
      clasificar(f, 'justificada', 'Subió el soporte: ' + nombre); A.aviso('Soporte subido: queda justificada, con su sello.');
    } else if (t.matches('#ficha-raiz [data-subir-reposo]')) {
      const r = D.REPOSOS.find(x => x.id === t.dataset.subirReposo); if (!r) return; subirReposo(r, nombre);
      A.pintarFicha(); A.pintarPagina(); A.aviso('Foto subida: quedó en su reposo.');
    } else if (t.matches('#ficha-raiz [data-firma-prest]')) {
      const p = D.PRESTAMOS.find(x => x.id === t.dataset.firmaPrest); if (!p) return; p.firmada = true; p.firmaArchivo = nombre;
      A.auditar({ modulo: 'Préstamos', registro: 'Préstamo ' + emp(p.emp).nombre, campo: 'autorización de descuento', antes: 'falta', despues: 'subida: ' + nombre });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Autorización subida. Ya se puede descontar.');
    }
  });
  // el redoble: «Revisado» o «No va», de un toque, con «Deshacer» 10 segundos y después «Reabrir» (el sello queda tachado)
  // estado: por_revisar · revisado (entra en la nómina) · no_va (no se paga) · reviso: quién lo decidió
  D.REDOBLES.forEach(r => { if (!r.estado) r.estado = r.revisado ? 'revisado' : 'por_revisar'; if (r.revisado && !r.reviso) r.reviso = 'Jose'; });
  const tagRedoble = r => r.estado === 'revisado' ? tag('Revisado por ' + (r.reviso || 'Jose'), 'ok') : r.estado === 'no_va' ? tag('No va · ' + (r.reviso || ''), '') : tag('Por revisar', 'aviso');
  FICHAS.redoble = id => {
    const r = D.REDOBLES.find(x => x.id === id); const e = emp(r.emp); const d = diario(e); const f = r.tipo === 'redoble' ? .5 : 1.5;
    const revisa = ['r', 'a'].includes(nivel('nomina')); const k = 'redoble:' + r.id;
    const acciones = !revisa ? [] : r.estado === 'por_revisar' ? [{ txt: 'No va', acc: 'redoble-no', arg: r.id, icono: 'x' }, { txt: 'Revisado', acc: 'redoble-ok', arg: r.id, tono: 'pri', icono: 'check' }]
      : A.deshacible(k) ? [A.accDeshacer('redoble-deshacer', r.id, k)] : [A.accReabrir('redoble-reabrir', r.id, k)];
    return { titulo: (r.tipo === 'redoble' ? 'Redoble de ' : 'Día extra de ') + e.nombre, sub: esc(r.fecha), mod: 'nomina', obj: r, registro: 'Redoble ' + e.nombre + ' ' + r.fecha, tags: [[tagRedoble(r).replace(/<[^>]+>/g, ''), r.estado === 'revisado' ? 'ok' : r.estado === 'no_va' ? '' : 'aviso']],
      bloques: [{ filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${e.id}">${esc(e.nombre)}</button>` }, { l: 'Qué pasó', v: esc(r.detalle), largo: true, campo: { k: 'detalle', tipo: 'area' } }, { l: 'De dónde salió', v: esc(r.fuente) }, ...(ve() ? [{ l: 'Cómo se paga', v: r.estado === 'no_va' ? `<s>${dinero(d * f * r.veces, 'usd')}</s> <small class="tenue">no va: no se paga</small>` : `${dinero(d, 'usd')} el día × ${String(f).replace('.', ',')} = <b>${dinero(d * f * r.veces, 'usd')}</b>` }] : []), ...(r.reviso && r.estado !== 'por_revisar' ? [{ l: r.estado === 'no_va' ? 'Dijo que no va' : 'Lo revisó', v: esc(r.reviso) }] : [])] },
        { html: '<p class="muted">Redoble: doblar el turno paga medio día más. Día extra: trabajar en el día de descanso paga día y medio (el recargo legal del 50 %), y se le debe el descanso la semana siguiente. «No va»: no se trabajó como se anotó y no se paga.</p>' }],
      acciones };
  };
  const decidirRedoble = (id, est) => {
    const r = D.REDOBLES.find(x => x.id === id); const antes = { estado: r.estado, revisado: r.revisado, reviso: r.reviso };
    Object.assign(r, { estado: est, revisado: est === 'revisado', reviso: S.usuario.nombre });
    A.auditar({ modulo: 'Asistencia', registro: 'Redoble ' + emp(r.emp).nombre, campo: 'revisión', antes: 'por revisar', despues: est === 'revisado' ? 'revisado' : 'no va' });
    A.unToque('redoble:' + id, () => {
      Object.assign(r, antes); A.auditar({ modulo: 'Asistencia', registro: 'Redoble ' + emp(r.emp).nombre, campo: 'revisión', antes: est === 'revisado' ? 'revisado' : 'no va', despues: 'por revisar', motivo: 'Deshecho a los pocos segundos de marcarlo' });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Deshecho: vuelve a «Por revisar».');
    });
    A.pintarFicha(); A.pintarPagina(); const des = document.querySelector('#ficha-raiz [data-acc="redoble-deshacer"]'); if (des) des.focus({ preventScroll: true });
    A.aviso((est === 'revisado' ? 'Revisado. Entra en la nómina del 15.' : 'Anotado: no va. No se paga en la nómina.') + ' Puedes deshacerlo durante 10 segundos.');
  };
  ACC['redoble-ok'] = id => decidirRedoble(id, 'revisado');
  ACC['redoble-no'] = id => decidirRedoble(id, 'no_va');
  ACC['redoble-deshacer'] = id => { if (!A.deshacerUT('redoble:' + id)) { A.aviso('Ya pasaron los 10 segundos: para cambiarlo, toca «Reabrir».', 'info'); if (S.ficha) A.pintarFicha(); } };
  ACC['redoble-reabrir'] = id => {
    const r = D.REDOBLES.find(x => x.id === id); if (!r || r.estado === 'por_revisar') return;
    A.pedirReabrir({ titulo: 'Reabrir el redoble de ' + emp(r.emp).nombre, texto: 'Vuelve a «Por revisar». Lo de antes queda en el registro de cambios y su sello, tachado.', opciones: ['Me equivoqué de botón'] }).then(m => {
      const antes = r.estado; A.selloViejo(r, antes === 'revisado' ? 'Revisado' : 'No va', antes === 'no_va');
      Object.assign(r, { estado: 'por_revisar', revisado: false, reviso: '' });
      A.auditar({ modulo: 'Asistencia', registro: 'Redoble ' + emp(r.emp).nombre, campo: 'revisión', antes: antes === 'revisado' ? 'revisado' : 'no va', despues: 'por revisar (reabierto)', motivo: m });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Reabierto: vuelve a «Por revisar».');
    }).catch(() => {});
  };
  // las horas que no cuadran: lo acordado va con botones directos, como la falta (de un toque, con «Deshacer» y después «Reabrir»);
  // lo anotan Jose (revisa) y Andreina (prepara), no solo quien edita Personal (29-ago) · al editar queda el porqué
  const ACUERDOS = ['Se descuentan las horas', 'No se descuenta (tenía justificación)', 'Las compensa la semana que viene'];
  FICHAS.incidencia = id => {
    const x = D.INCIDENCIAS.find(i => i.id === id); const e = emp(x.emp); const k = 'incidencia:' + x.id; const sin = x.estado === 'alertada';
    const acciones = !puede('nomina', 'editar') ? [] : sin ? ACUERDOS.map((t, i) => ({ txt: t, acc: 'inc-acuerdo', arg: x.id + '|' + i, tono: i === 0 ? 'pri' : 'sec', icono: i === 0 ? 'check' : '' }))
      : A.deshacible(k) ? [A.accDeshacer('inc-deshacer', x.id, k)] : [A.accReabrir('inc-reabrir', x.id, k)];
    return { titulo: 'Horas de ' + e.nombre, sub: esc(x.periodo), mod: 'nomina', moduloNombre: 'Asistencia', obj: x, registro: 'Horas ' + e.nombre + ' ' + x.periodo, tags: [[A.estadoTag(x.estado).replace(/<[^>]+>/g, ''), x.estado === 'resuelta' ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'Programadas', v: x.esperadas + ' h' }, { l: 'Trabajadas', v: x.reales + ' h' }, { l: 'Diferencia', v: (x.reales - x.esperadas) + ' h' }, { l: 'Por qué', v: esc(x.causa || '—'), campo: { k: 'causa', tipo: 'area' } }, { l: 'Lo acordado', v: esc(x.acuerdo || 'Sin acordar') }, ...(x.acordo && !sin ? [{ l: 'Lo anotó', v: esc(x.acordo) }] : [])] },
        { html: `<p class="muted">${sin ? 'Toca lo acordado: la app lo aplica en la nómina y la incidencia queda resuelta. Mientras quede una sin resolver, la nómina no pasa a revisión.' : 'Ya está aplicado en la nómina. Para cambiarlo, «Reabrir» la deja sin resolver otra vez.'}</p>` }],
      acciones };
  };
  ACC['inc-acuerdo'] = arg => {
    const [id, i] = arg.split('|'); const x = D.INCIDENCIAS.find(z => z.id === id); const antes = { estado: x.estado, acuerdo: x.acuerdo, acordo: x.acordo };
    Object.assign(x, { acuerdo: ACUERDOS[+i], estado: 'resuelta', acordo: S.usuario.nombre });
    A.auditar({ modulo: 'Asistencia', registro: 'Horas ' + emp(x.emp).nombre + ' ' + x.periodo, campo: 'lo acordado', antes: antes.acuerdo || 'sin acordar', despues: x.acuerdo });
    A.unToque('incidencia:' + id, () => {
      Object.assign(x, antes); A.auditar({ modulo: 'Asistencia', registro: 'Horas ' + emp(x.emp).nombre + ' ' + x.periodo, campo: 'lo acordado', antes: ACUERDOS[+i], despues: antes.acuerdo || 'sin acordar', motivo: 'Deshecho a los pocos segundos de marcarlo' });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Deshecho: vuelve a quedar sin resolver.');
    });
    A.pintarFicha(); A.pintarPagina(); const des = document.querySelector('#ficha-raiz [data-acc="inc-deshacer"]'); if (des) des.focus({ preventScroll: true });
    A.aviso('Anotado: ' + ACUERDOS[+i].toLowerCase() + '. Se aplica en la nómina. Puedes deshacerlo durante 10 segundos.');
  };
  ACC['inc-deshacer'] = id => { if (!A.deshacerUT('incidencia:' + id)) { A.aviso('Ya pasaron los 10 segundos: para cambiarlo, toca «Reabrir».', 'info'); if (S.ficha) A.pintarFicha(); } };
  ACC['inc-reabrir'] = id => {
    const x = D.INCIDENCIAS.find(z => z.id === id); if (!x || x.estado !== 'resuelta') return;
    A.pedirReabrir({ titulo: 'Reabrir las horas de ' + emp(x.emp).nombre, texto: 'Vuelve a quedar sin resolver y lo acordado sale de la nómina. Lo de antes queda en el registro de cambios y su sello, tachado.', opciones: ['Me equivoqué de botón'] }).then(m => {
      const antes = x.acuerdo; A.selloViejo(x, 'Resuelta'); Object.assign(x, { estado: 'alertada', acuerdo: '', acordo: '' });
      A.auditar({ modulo: 'Asistencia', registro: 'Horas ' + emp(x.emp).nombre + ' ' + x.periodo, campo: 'lo acordado', antes, despues: 'sin acordar (reabierta)', motivo: m });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Reabierta: vuelve a quedar sin resolver.');
    }).catch(() => {});
  };

  /* =============== VACACIONES, REPOSOS Y PERMISOS =============== */
  // quién cubre: una o varias personas, con su nota corta, o «Por definir» (el texto de siempre sale de ahí: «Daniela Salas como encargada…»)
  const cubreTxt = v => v.porDefinir ? 'Por definir' : (v.cubreIds || []).length ? lista(v.cubreIds.map(id => emp(id).nombre)) + (v.cubreNota ? ' ' + v.cubreNota : '') : (v.cubre || '—');
  D.VACACIONES.forEach(v => { if (v.cubreIds || v.porDefinir) v.cubre = cubreTxt(v); });
  /* Programar vacaciones: primero «¿De quién?» (quien tiene vacaciones por programar; arriba y en rojo, quien ya tiene 2 períodos). En un
     calendario se elige solo el día de salida: la app propone hasta cuándo y cuándo vuelve, contando los días hábiles de esa persona (sin sus
     descansos) y saltando los feriados de Nómina › Reglas, y lo explica en una línea. El regreso se puede corregir dejando el motivo. Debajo,
     la tira del diagrama con quién más está fuera esas semanas (y un aviso si sale otra persona de su área) y «Quién cubre», de una lista. */
  const vpVacio = () => ({ v: '', salida: null, mes: [F.hoy[1], F.hoy[2]], corregir: false, regresa: null, motivo: '', cubre: [], nota: '', porDefinir: false, hecho: null });
  const VP = vpVacio();
  // lo que tiene esa persona fuera entre dos fechas (sus otras vacaciones y sus reposos)
  const fueraEn = (e, de, a) => [...D.VACACIONES.filter(v => v.emp === e.id && v.desde && v.id !== VP.v).map(v => ({ tipo: 'vacaciones', desde: v.desde, hasta: v.hasta, regresa: v.regresa })), ...D.REPOSOS.filter(r => r.emp === e.id && r.tipo === 'reposo').map(r => ({ tipo: 'reposo', desde: r.desde, hasta: r.hasta }))].filter(x => F.dif(x.hasta, de) >= 0 && F.dif(x.desde, a) <= 0);
  const propuestaVP = (e, v) => (VP.salida ? calcVac(e, VP.salida, v.dias) : null);
  const calcVP = (e, v) => { const p = propuestaVP(e, v); return !p ? null : VP.corregir && VP.regresa && !F.igual(VP.regresa, p.regresa) ? Object.assign(calcVacHasta(e, VP.salida, VP.regresa), { corregido: true }) : p; };
  const saltoTxt = c => !c.saltados.length ? '' : c.saltados.length === 1 ? ' · se saltó el feriado del ' + fd(c.saltados[0].d) : ' · se saltaron los feriados del ' + lista(c.saltados.map(f => fd(f.d)));
  const lineaVP = c => 'Sale el ' + F.corta(c.salida) + ' · vuelve el ' + F.corta(c.regresa) + saltoTxt(c);
  const borradorVP = () => A.borrador('vacaciones');
  // con 2 períodos acumulados se programa primero el más viejo: el del año de antes, con un día menos de vacaciones y de bono (sin bajar de 15)
  const aProgramar = v => !v || !(v.acumulados >= 2 && v.estado === 'causada') ? v : { ...v, periodo: periodosDe(v.periodo)[0], dias: Math.max(15, v.dias - 1), bono: Math.max(15, v.bono - 1) };
  // «Año 4 (mar 2025 – mar 2026)» → el período de antes («Año 3 (mar 2024 – mar 2025)») y ese mismo: el viejo se programa primero
  const periodosDe = t => { const m = /^Año (\d+) \((\w+) (\d{4}) – (\w+) (\d{4})\)$/.exec(String(t || '')); if (!m) return [t + ' · el más viejo', t];
    return ['Año ' + (+m[1] - 1) + ' (' + m[2] + ' ' + (+m[3] - 1) + ' – ' + m[4] + ' ' + (+m[5] - 1) + ')', t]; };
  function vpQuien() {
    const xs = D.VACACIONES.filter(v => v.estado === 'causada').sort((a, b) => (b.acumulados || 0) - (a.acumulados || 0));
    return `<div class="pila vp-quien"><div class="sec"><h2>¿De quién?</h2><span class="muted">Quien tiene vacaciones por programar. Arriba, en rojo, quien ya tiene 2 períodos: el máximo.</span></div>
      ${xs.length ? `<ul class="lista">${xs.map(v => { const e = emp(v.emp); const max = v.acumulados >= 2; return `<li><button class="fila${max ? ' al-maximo' : ''}" data-acc="vp-quien" data-arg="${v.id}">${lead(max ? 'alerta' : '', 'maleta')}<span class="medio"><b>${esc(e.nombre)}</b><small>${esc(e.cargo)} · ${esc(v.periodo)} · ${v.dias} días hábiles y bono de ${v.bono}${max ? ' · tiene 2 períodos sin disfrutar' : ''}</small></span><span class="fin">${max ? tag('2 períodos: el máximo', 'alerta') : tag('Por programar', '')}${ic('derecha', 's chev')}</span></button></li>`; }).join('')}</ul>` : `<p class="nota ok">${ic('check', 's')}<span>Nadie tiene vacaciones por programar.</span></p>`}
      <div class="form-pie"><button class="btn ghost" data-sub="libro" data-volver>${ic('atras', 's')}Volver</button></div></div>`;
  }
  function vpForm() {
    const v = aProgramar(D.VACACIONES.find(x => x.id === VP.v)); const e = emp(v.emp); const p = propuestaVP(e, v); const c = calcVP(e, v); const nueva = v.estado === 'causada';
    if (VP.corregir && !VP.regresa && p) VP.regresa = p.regresa;
    const otros = c ? activos().filter(x => x.id !== e.id).map(x => ({ x, f: fueraEn(x, c.salida, c.hasta) })).filter(o => o.f.length) : [];
    const mismaArea = otros.filter(o => o.x.area === e.area);
    const desde = c ? F.sumar(c.salida, -4) : null; const dias = c ? Math.max(28, F.dif(c.regresa, c.salida) + 10) : 0;
    const filas = c ? [{ nombre: e.nombre, cls: 'propia', barras: [{ desde: c.salida, hasta: c.hasta, txt: 'A lápiz · vuelve el ' + F.corta(c.regresa), tono: 'vac nueva' }] },
      ...otros.map(o => ({ nombre: o.x.nombre, barras: o.f.map(z => ({ desde: z.desde, hasta: z.hasta, txt: z.tipo === 'vacaciones' ? 'Vacaciones · regresa ' + z.regresa : 'Reposo hasta el ' + fd(z.hasta), tono: z.tipo === 'vacaciones' ? 'vac' : 'rep' })) }))] : [];
    const ley = `<p class="leyenda gantt-ley"><span><i class="gl vac nueva"></i>La que estás programando (a lápiz)</span><span><i class="gl vac"></i>Vacaciones</span><span><i class="gl rep"></i>Reposo</span><span><i class="gl hoy"></i>Hoy</span></p>`;
    // quién cubre: primero los de su área libres esas fechas, después los demás libres; quien está fuera esas fechas no se puede escoger
    const cand = c ? activos().filter(x => x.id !== e.id).map(x => ({ x, f: fueraEn(x, c.salida, c.hasta), area: x.area === e.area })).sort((a, b) => (!!a.f.length - !!b.f.length) || (b.area - a.area) || a.x.nombre.localeCompare(b.x.nombre, 'es')) : [];
    // las fechas de regreso que se pueden escoger al corregir: días que trabaja, alrededor de lo que propone la app
    const opsRegreso = () => { const xs = []; let d = p.regresa; for (let k = 0; k < 6 && F.dif(d, c.salida) > 1; ) { d = F.sumar(d, -1); if (habil(e, d)) { xs.unshift(d); k++; } } xs.push(p.regresa); d = p.regresa; for (let k = 0; k < 8; ) { d = F.sumar(d, 1); if (habil(e, d)) { xs.push(d); k++; } } return xs; };
    const cal = A.calendario({ id: 'vp-sal', mes: VP.mes, sel: VP.salida, desde: F.hoy, hasta: [31, 11, 2026], rango: c ? [c.salida, c.hasta] : null, etiqueta: 'Día que sale ' + e.nombre,
      dia: d => { const fer = feriadoDe(d); if (fer) return { no: 'Es feriado (' + fer.nombre + '): las vacaciones empiezan un día de trabajo.', marca: 'feriado', nota: 'feriado', cls: 'fer' }; if (descansos(e).includes(F.dow(d))) return { no: 'Ese día descansa: las vacaciones empiezan un día que trabaja.', marca: 'descansa', nota: 'descansa', cls: 'descansa' }; return {}; } });
    return `<div class="pila vp" data-form="vacaciones">
      <article class="hoja vp-persona"><div class="hoja-cab"><h2>${ic('maleta')}${esc(e.nombre)} <small class="tenue">${esc(e.cargo)} · ${esc(e.area)} · ${turnoTxt(e.turno)}</small></h2>${nueva ? `<button class="enlace" data-acc="vp-otra">${ic('usuario', 's')}Cambiar de persona</button>` : tag('Programada', 'info')}</div>
        <dl class="kv"><div><dt>Le tocan</dt><dd>${v.dias} días hábiles y un bono de ${v.bono} días</dd></div><div><dt>Período</dt><dd>${esc(v.periodo)}</dd></div><div><dt>Descansa</dt><dd>${esc(descansoTxt(e))}: esos días no cuentan</dd></div></dl>
        ${v.acumulados >= 2 && nueva ? `<p class="nota alerta">${ic('alerta', 's')}<span>Tiene 2 períodos sin disfrutar: es el máximo. Programa estas primero.</span></p>` : ''}</article>
      <div class="rejilla"><div class="c6 pila"><article class="hoja"><h2>${ic('calendario')}¿Qué día sale?</h2>
          <div class="campo" id="vp-sal-campo">${cal}</div>
          <p class="leyenda calp-ley"><span><i class="cl-hoy"></i>Hoy</span><span><i class="cl-desc"></i>Descansa</span><span><i class="cl-fer"></i>Feriado</span><span><i class="cl-rango"></i>Sus vacaciones</span></p></article></div>
        <div class="c6 pila"><article class="hoja vp-asi" aria-live="polite"><h2>${ic('lista')}Así quedan</h2>
          ${!c ? `<p class="muted">Toca en el calendario el día que sale. La app cuenta sus ${v.dias} días hábiles sin sus descansos (${esc(descansoTxt(e))}), salta los feriados de Nómina › Reglas y propone cuándo vuelve.</p>`
            : `<p class="vp-linea">${esc(lineaVP(c))}</p>
              <dl class="kv"><div><dt>Sale</dt><dd>${esc(cap1(F.corta(c.salida)))}</dd></div><div><dt>Último día de vacaciones</dt><dd>${esc(cap1(F.corta(c.hasta)))}</dd></div><div><dt>Vuelve</dt><dd>${esc(cap1(F.corta(c.regresa)))}${c.corregido ? ' ' + tag('Corregido', 'aviso') : ''}</dd></div><div class="total"><dt><b>Días hábiles</b></dt><dd>${c.dias}${c.dias !== v.dias ? ` <small class="tenue">le tocan ${v.dias}</small>` : ''}</dd></div></dl>
              <p class="muted">Sin sus descansos (${esc(descansoTxt(e))})${c.saltados.length ? ' y sin los feriados' : ''}. El bono de ${v.bono} días se paga al empezar.</p>
              ${VP.corregir ? `<div class="campos vp-corr"><label class="campo"><span>Vuelve el</span><select id="vp-regresa" data-vp="regresa">${opsRegreso().map(d => `<option value="${F.clave(d)}"${F.igual(d, VP.regresa) ? ' selected' : ''}>${esc(F.corta(d))} · ${calcVacHasta(e, c.salida, d).dias} días hábiles${F.igual(d, p.regresa) ? ' (lo que propone la app)' : ''}</option>`).join('')}</select></label>
                <label class="campo ancho"><span>¿Por qué cambias el regreso?</span><textarea id="vp-motivo" data-vp="motivo" placeholder="Por ejemplo: pidió un día más por un viaje. Queda en el registro de cambios.">${esc(VP.motivo)}</textarea></label></div>
                <button class="enlace" data-acc="vp-corregir" data-arg="no">${ic('refrescar', 's')}Usar lo que propone la app</button>`
              : `<button class="enlace" data-acc="vp-corregir" data-arg="si">${ic('lapiz', 's')}Corregir el regreso</button>`}
              ${mismaArea.length ? `<p class="nota aviso">${ic('alerta', 's')}<span><b>Ojo: también sale gente de ${esc(e.area.toLowerCase())}.</b> ${mismaArea.map(o => esc(o.x.nombre) + (o.f[0].tipo === 'vacaciones' ? ' está de vacaciones' : ' está de reposo') + ' hasta el ' + esc(F.corta(o.f[0].hasta))).join('; ')}.</span></p>` : `<p class="chequeo ok">${ic('check', 's')}<span>Nadie más de ${esc(e.area.toLowerCase())} está fuera esas fechas.</span></p>`}`}
        </article></div></div>
      ${c ? `<article class="hoja"><h2>${ic('equipo')}Quién más está fuera esas semanas</h2>${A.gantt(filas, { desde, dias, ley, etiqueta: 'Quién está fuera del ' + fd(desde) + ' al ' + fd(F.sumar(desde, dias - 1)) })}${otros.length ? '' : '<p class="muted">Nadie más está fuera esas semanas.</p>'}</article>
        <article class="hoja"><h2>${ic('usuario')}Quién cubre</h2>
          <div class="campo" id="vp-cubre-campo"><span id="vp-cubre-t">Una o varias personas · primero las de ${esc(e.area.toLowerCase())} que están libres esas fechas</span>
            <ul class="lista elige vp-cubre" role="group" aria-labelledby="vp-cubre-t">${cand.map(o => `<li><label class="elige-op${o.f.length ? ' no' : ''}"><input type="checkbox" data-vp-cubre value="${o.x.id}"${VP.cubre.includes(o.x.id) ? ' checked' : ''}${o.f.length || VP.porDefinir ? ' disabled' : ''}><span><b>${esc(o.x.nombre)}</b><small>${esc(o.x.cargo)} · ${esc(o.x.area)} · ${turnoTxt(o.x.turno)} · ${o.f.length ? 'fuera esas fechas (' + (o.f[0].tipo === 'vacaciones' ? 'vacaciones' : 'reposo') + ' hasta el ' + esc(fd(o.f[0].hasta)) + ')' : o.area ? 'de su área, libre esas fechas' : 'libre esas fechas'}</small></span></label></li>`).join('')}</ul></div>
          <div class="campos"><label class="campo"><span>Nota corta (opcional)</span><input id="vp-nota" data-vp="nota" value="${esc(VP.nota)}" placeholder="Por ejemplo: como encargada del turno de la mañana" autocomplete="off"></label>
            <label class="interruptor vp-def"><input type="checkbox" data-vp-pordefinir${VP.porDefinir ? ' checked' : ''}><span>Por definir: todavía no se sabe quién cubre</span></label></div></article>` : ''}
      <div class="form-pie"><button class="btn ghost" data-sub="libro" data-volver>${ic('atras', 's')}Volver</button><span class="form-pie-der"><button class="btn pri" data-acc="vp-guardar">${ic('calendario', 's')}${nueva ? 'Programar las vacaciones de ' + esc(e.nombre.split(' ')[0]) : 'Guardar las fechas nuevas'}</button></span></div></div>`;
  }
  function vpHecho() {
    const h = VP.hecho;
    return `<div class="pila" style="max-width:680px"><div class="hecho-caja">${ic('check')}<span>${h.nueva ? 'Programadas' : 'Fechas cambiadas'}: ${esc(h.nombre)} sale el ${esc(F.corta(h.salida))} y vuelve el ${esc(F.corta(h.regresa))}. Cubre: ${esc(h.cubre)}. Le avisamos a la persona y a la supervisora. (Simulado)</span></div>
      ${h.queda ? `<p class="nota info">${ic('info', 's')}<span>${esc(h.queda)}.</span></p>` : ''}
      <div class="fila-btns"><button class="btn pri" data-sub="libro">Ver el libro</button><button class="btn sec" data-sub="fuera">Ver quién está fuera</button><button class="btn sec" data-acc="vac-programar">Programar otras</button></div></div>`;
  }
  // los justificativos de 1 a 3 días son las faltas con su justificativo médico: la misma fila que en Asistencia › Faltas
  const faltasMedicas = () => D.FALTAS.filter(f => f.medico);
  const porSubirMed = () => faltasMedicas().filter(f => !f.soporte && ['por_justificar', 'justificada_sin'].includes(f.estado)).length + D.REPOSOS.filter(r => r.tipo === 'reposo' && !r.soporte).length;
  const porConvalidar = () => D.REPOSOS.filter(r => r.tipo === 'reposo' && !r.convalidado).length;
  PANT.ausencias = {
    titulo: 'Vacaciones y reposos', corto: 'Vacaciones y reposos', tab: 'Vacaciones', grupo: 'Recursos humanos', icono: 'maleta', mod: 'personal', palabras: 'vacacion reposo permiso ausencia',
    secciones: () => [['libro', 'Libro de vacaciones', 'vacacion bono vacacional'], edP() ? ['programar', 'Programar vacaciones', 'vacacion salida regreso'] : null, ['fuera', 'Quién está fuera', 'ausentes'], ['medicos', 'Justificativos y reposos', 'reposo medico ivss falta'], ['permisos', 'Permisos', 'permiso horas']],
    cuenta: () => edP() ? porSubirMed() + porConvalidar() : 0,
    transitorias: ['programar'],
    alSalir: sub => { if (sub === 'programar') Object.assign(VP, vpVacio()); },
    alRepetir: sub => { if (sub !== 'programar' || !VP.hecho) return null; Object.assign(VP, vpVacio()); return '[data-acc="vp-quien"]'; },
    // las fechas que se eligieron se guardan en el equipo: al salir, arriba queda «Tienes unas vacaciones a medias: … · Seguir · Descartar»
    borradores: {
      programar: {
        tomar: () => { const v = { ...VP }; delete v.hecho; return v; },
        poner: d => { Object.assign(VP, vpVacio(), d, { hecho: null }); },
        txt: d => { const v = D.VACACIONES.find(x => x.id === d.v); return 'unas vacaciones a medias' + (v ? ': ' + emp(v.emp).nombre : '') + (d.salida ? ', sale el ' + F.corta(d.salida) : ''); },
        vacio: d => !d.v,
      },
    },
    render: (sub = 'libro') => {
      let cuerpo = '';
      if (sub === 'libro') cuerpo = `<div class="cifras">${A.cifra({ etq: 'De vacaciones hoy', valor: D.VACACIONES.filter(v => v.estado === 'disfrutando').length, sub: 'Wilmer regresa el mar 20 oct', abrir: 'vacacion:va3' })}${A.cifra({ etq: 'Programadas', valor: D.VACACIONES.filter(v => v.estado === 'programada').length, sub: (v => v ? 'la próxima: ' + emp(v.emp).nombre.split(' ')[0] + ' el ' + fd(v.desde) : 'ninguna')(D.VACACIONES.filter(v => v.estado === 'programada').sort((a, b) => F.dif(a.desde, b.desde))[0]), abrir: (v => v ? 'vacacion:' + v.id : '')(D.VACACIONES.filter(v => v.estado === 'programada').sort((a, b) => F.dif(a.desde, b.desde))[0]) })}${A.cifra({ etq: 'Por programar', valor: D.VACACIONES.filter(v => v.estado === 'causada').length, sub: 'ya las ganaron', ...(edP() ? { acc: 'vac-programar', arg: '' } : { abrir: (v => v ? 'vacacion:' + v.id : '')(D.VACACIONES.find(v => v.estado === 'causada')) }) })}${(xs => A.cifra({ etq: 'Con 2 períodos acumulados', valor: xs.length, sub: xs.length ? 'el máximo: darlas ya' : 'nadie', tono: xs.length ? 'alerta' : '', abrir: xs[0] ? 'vacacion:' + xs[0].id : '' }))(D.VACACIONES.filter(v => v.acumulados >= 2 && v.estado === 'causada'))}</div>
          <div class="sec"><h2>Libro de vacaciones</h2>${A.boton('personal', 'Programar vacaciones', 'data-sub="programar"', { tono: 'sec', icono: 'calendario', chico: true })}</div>
          ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Días', cls: 'r' }, { t: 'Cuándo', cls: 's' }, { t: 'Quién cubre', cls: 'x' }, { t: 'Estado', cls: 'e' }], filas: D.VACACIONES.map(v => ({ abrir: 'vacacion:' + v.id, celdas: [`<b>${esc(emp(v.emp).nombre)}</b><small>${esc(v.periodo)}</small>`, v.dias + ' <small class="tenue">+ bono ' + v.bono + '</small>',
            v.desde ? fdl(v.desde) + ' al ' + fdl(v.hasta) + (v.queda ? `<small class="tenue" style="display:block">${esc(v.queda)}</small>` : '') : `<span class="libro-prog"><span class="${v.acumulados >= 2 ? 'al-maximo-txt' : 'tenue'}">${esc(v.nota || 'Por programar')}</span>${edP() && v.estado === 'causada' ? `<button class="btn sec chico" data-acc="vac-programar" data-arg="${v.id}">${ic('calendario', 's')}Programar</button>` : ''}</span>`,
            esc(v.cubre || '—'), A.estadoTag(v.estado)] })) })}
          <p class="muted">15 días hábiles el primer año y uno más por cada año, hasta 30. El bono vacacional, igual. Se pagan al empezar a disfrutarlas. Se pueden acumular hasta 2 períodos.</p>`;
      if (sub === 'programar') cuerpo = !edP() ? A.lectura('personal') : VP.hecho ? vpHecho() : VP.v ? vpForm() : vpQuien();
      if (sub === 'fuera') { const vf = ventanaFuera(); cuerpo = `<p class="desc">${esc(cap1(vf.txt))}: quién está de vacaciones o de reposo, los cumpleaños${edP() || ve() ? ' y los contratos o períodos de prueba que vencen' : ''}. La raya roja es hoy.</p>
          <article class="hoja">${A.gantt(A.filasPersonal({ conContratos: edP() || ve(), ventana: vf }), vf)}</article>
          <button class="enlace" data-ir="calendario/personal">Verlo en el calendario ${ic('derecha', 's')}</button>`; }
      if (sub === 'medicos') {
        const cols = [{ t: 'Persona', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Días', cls: 'r' }, { t: 'Soporte', cls: 'e' }];
        const rp = D.REPOSOS.filter(r => r.tipo === 'reposo'); const fm = faltasMedicas(); const sinFoto = fm.find(f => !f.soporte && f.estado === 'por_justificar');
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'De reposo hoy', valor: rp.length, sub: 'Mariela, hasta el 14 oct', abrir: rp[0] ? 'reposo:' + rp[0].id : '' })}${A.cifra({ etq: 'Justificativos por subir', valor: porSubirMed(), sub: 'sin él la falta queda sin justificar', tono: porSubirMed() ? 'aviso' : '', abrir: sinFoto ? 'falta:' + sinFoto.id : '' })}${A.cifra({ etq: 'Por convalidar en el IVSS', valor: porConvalidar(), sub: 'reposos de más de 3 días', abrir: (r => r ? 'reposo:' + r.id : '')(rp.find(r => !r.convalidado)) })}</div>
          ${A.tabla({ cols, filas: [...rp.map(r => ({ abrir: 'reposo:' + r.id, celdas: [`<b>${esc(emp(r.emp).nombre)}</b><small>${fd(r.desde)}${r.dias > 1 ? ' al ' + fd(r.hasta) : ''}${edP() ? ' · ' + esc(r.motivo) : ''}</small>`, 'Reposo', r.dias, r.soporte ? (!r.convalidado ? tag('Falta el IVSS', 'alerta') : tag('Convalidado', 'ok')) : tag('Falta la foto', 'aviso')] })),
            ...fm.map(f => ({ abrir: 'falta:' + f.id, celdas: [`<b>${esc(emp(f.emp).nombre)}</b><small>${esc(f.fecha)}${edP() ? ' · ' + esc(f.medico.motivo) : ''} · ${esc(A.estadoTxt(f.estado).toLowerCase())}</small>`, 'Justificativo', 1, soporteTag(f)] }))] })}
          ${edP() ? `<label class="soltar" for="med-foto">${ic('camara')}<span><b>Subir un justificativo médico</b>Foto o PDF. La app lo junta con la falta de ese día y la deja justificada.</span></label><input id="med-foto" type="file" accept="image/*,.pdf" class="sr-only">` : ''}
          <p class="nota info">${ic('pulso', 's')}<span>Hasta 3 días basta un justificativo médico: es la misma fila que la falta de ese día en Asistencia › Faltas, y al subir la foto se actualizan las dos. Más de 3 días es un reposo del IVSS (o convalidado por el IVSS). En la nómina formal, desde el día 4 el IVSS paga 2/3 y el negocio 1/3.${edP() ? '' : ' El motivo médico solo lo ven el dueño y RRHH.'}</span></p>`;
      }
      if (sub === 'permisos') cuerpo = `<p class="desc">Permisos de horas o de un día, con su motivo y si se pagan o no.</p>
        ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Cuándo', cls: 'x' }, { t: 'Tipo', cls: 'x' }, { t: 'Soporte', cls: 'e' }], filas: D.PERMISOS_EMP.map(p => ({ abrir: 'permisoemp:' + p.id, celdas: [`<b>${esc(emp(p.emp).nombre)}</b><small>${esc(p.motivo)}</small>`, esc(p.fecha) + ' · ' + esc(p.horas), esc(p.tipo), p.soporte ? tag('Con constancia', 'ok') : tag('Sin soporte', '')] })) })}
        ${A.boton('personal', 'Registrar un permiso', 'data-acc="pronto"', { tono: 'sec', icono: 'mas' })}`;
      return `<div class="pagina">${A.cab('Recursos humanos', sub === 'programar' ? 'Programar vacaciones' : 'Vacaciones, reposos y permisos', sub === 'programar' ? 'Se elige solo el día que sale: la app cuenta sus días hábiles, sin sus descansos ni los feriados, y propone cuándo vuelve.' : 'Las vacaciones se disfrutan: pagarlas sin darlas obliga a darlas otra vez. Aquí se programan, se ve quién está fuera y se guardan los justificativos médicos.')}
        ${sub === 'programar' ? '' : A.subnav([['libro', 'Vacaciones'], ['fuera', 'Quién está fuera'], ['medicos', 'Justificativos y reposos', porSubirMed() + porConvalidar()], ['permisos', 'Permisos']], sub)}${cuerpo}</div>`;
    },
    // la foto que se sube aquí se junta con la falta que espera su justificativo (si hay varias, pregunta de cuál es); sin archivo no pasa nada
    montar: (raiz, sub) => {
      const mf = $('#med-foto', raiz);
      if (mf) mf.addEventListener('change', () => {
        if (!mf.files.length) return; const nombre = mf.files[0].name;
        const esperan = faltasMedicas().filter(f => !f.soporte && ['por_justificar', 'justificada_sin'].includes(f.estado));
        const juntar = f => { f.soporte = nombre; marcarFalta(f, 'justificada', 'Con su justificativo médico: ' + nombre); A.abrir('falta', f.id); A.aviso('Recibido: quedó con la falta de ' + emp(f.emp).nombre + ' del ' + f.fecha.toLowerCase() + ', justificada. Puedes deshacerlo durante 10 segundos.'); };
        if (!esperan.length) { A.aviso('Recibido: no hay ninguna falta esperando un justificativo. (Simulado)', 'info'); return; }
        if (esperan.length === 1) { juntar(esperan[0]); return; }
        deCualFalta(esperan, juntar);
      });
      if (sub !== 'programar' || !VP.v || VP.hecho || !edP()) return;
      A.CAL['vp-sal'] = {
        elegir: d => { Object.assign(VP, { salida: d, mes: [d[1], d[2]], corregir: false, regresa: null, motivo: '' }); borradorVP(); A.pintarPagina(); },
        mes: n => { const [m, y] = VP.mes; const x = new Date(y, m + n, 1); VP.mes = [x.getMonth(), x.getFullYear()]; A.pintarPagina(); },
      };
      raiz.querySelectorAll('[data-form="vacaciones"] [data-vp], [data-form="vacaciones"] [data-vp-cubre], [data-form="vacaciones"] [data-vp-pordefinir]').forEach(el => ['input', 'change'].forEach(ev => el.addEventListener(ev, () => {
        const t = el;
        if (t.matches('[data-vp-cubre]')) { if (ev !== 'change') return; VP.cubre = t.checked ? [...new Set(VP.cubre.concat(t.value))] : VP.cubre.filter(x => x !== t.value); A.limpiarFaltas($('#vp-cubre-campo').parentElement); borradorVP(); return; }
        if (t.matches('[data-vp-pordefinir]')) { if (ev !== 'change') return; VP.porDefinir = t.checked; if (t.checked) VP.cubre = []; borradorVP(); A.pintarPagina(); return; }
        if (t.dataset.vp === 'regresa') { if (ev !== 'change') return; VP.regresa = F.deClave(t.value); borradorVP(); A.pintarPagina(); return; }
        if (t.dataset.vp) VP[t.dataset.vp] = t.value;
      })));
    },
  };
  // si varias faltas esperan su justificativo, se escoge de cuál es (la lista para escoger uno)
  function deCualFalta(xs, elegido) {
    const env = A.modal(`<h2 id="modal-t">¿De qué falta es?</h2><p class="muted" id="modal-d">Hay ${xs.length} faltas esperando su justificativo.</p>
      <div class="campo" id="dcf-campo"><span id="dcf-t">Faltas</span><ul class="lista elige" role="radiogroup" aria-labelledby="dcf-t">${xs.map(f => `<li><label class="elige-op"><input type="radio" name="dcf" value="${f.id}"><span><b>${esc(emp(f.emp).nombre)}</b><small>${esc(f.fecha)} · ${esc(f.medico.motivo)}</small></span></label></li>`).join('')}</ul></div>
      <div class="modal-acc"><button class="btn sec" data-m="no">Cancelar</button><button class="btn pri" data-m="si">${ic('check', 's')}Juntar con esa falta</button></div>`);
    env.querySelector('input').focus();
    env.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; if (b.dataset.m === 'no') { A.cerrarModal(); return; } const sel = env.querySelector('input[name="dcf"]:checked'); if (A.faltan(env, [[!sel, 'dcf-campo', 'Escoge de qué falta es.']])) return; A.cerrarModal(); elegido(D.FALTAS.find(f => f.id === sel.value)); });
  }
  // «Programar vacaciones» (o «Programar» de una fila, de un aviso o de su ficha): sin persona, pregunta de quién; con ella, ya viene puesta
  ACC['vac-programar'] = id => {
    Object.assign(VP, vpVacio()); const v = id ? D.VACACIONES.find(x => x.id === id) : null;
    if (v && ['causada', 'programada'].includes(v.estado)) Object.assign(VP, { v: v.id, ...(v.desde ? { salida: v.desde, mes: [v.desde[1], v.desde[2] || 2026], cubre: (v.cubreIds || []).slice(), nota: v.cubreNota || '', porDefinir: !!v.porDefinir } : {}) });
    if (S.ficha) A.cerrarFicha({ volver: false }); A.ir('ausencias/programar');
    if (v && v.desde && S.sub.ausencias === 'programar') { const p = calcVac(emp(v.emp), v.desde, v.dias); if (!F.igual(p.hasta, v.hasta)) { let r = F.sumar(v.hasta, 1); while (!habil(emp(v.emp), r)) r = F.sumar(r, 1); Object.assign(VP, { corregir: true, regresa: r, motivo: v.correccion || '' }); A.pintarPagina(); } }
  };
  ACC['vp-quien'] = id => { Object.assign(VP, vpVacio(), { v: id }); borradorVP(); A.pintarPagina(); const c = document.querySelector('#calp-vp-sal .calp-dia[tabindex="0"]'); if (c) c.focus({ preventScroll: true }); };
  ACC['vp-otra'] = () => { Object.assign(VP, vpVacio()); A.pintarPagina(); };
  ACC['vp-corregir'] = arg => { VP.corregir = arg === 'si'; if (!VP.corregir) { VP.regresa = null; VP.motivo = ''; } borradorVP(); A.pintarPagina(); const s2 = document.getElementById(VP.corregir ? 'vp-regresa' : 'main'); if (s2) s2.focus({ preventScroll: true }); };
  ACC['vp-guardar'] = () => {
    document.querySelectorAll('#main [data-form="vacaciones"] [data-vp="motivo"], #main [data-form="vacaciones"] [data-vp="nota"]').forEach(el => { VP[el.dataset.vp] = el.value; });
    VP.cubre = [...document.querySelectorAll('#main [data-vp-cubre]:checked')].map(x => x.value);
    const v = D.VACACIONES.find(x => x.id === VP.v); if (!v) return; const e = emp(v.emp); const vv = aProgramar(v); const p = propuestaVP(e, vv); const c = calcVP(e, vv);
    if (A.faltan($('#main'), [[!c, 'vp-sal-campo', 'Elige en el calendario el día que sale.'], [!!c && c.corregido && VP.motivo.trim().length < 4, 'vp-motivo', 'Escribe por qué cambias el regreso: queda en el registro de cambios.'],
      [!!c && !VP.cubre.length && !VP.porDefinir, 'vp-cubre-campo', 'Elige quién cubre (una o varias personas) o marca «Por definir».']])) return;
    const nueva = v.estado === 'causada'; const antes = v.desde ? fd(v.desde) + ' al ' + fd(v.hasta) : 'por programar'; const habia2 = nueva && v.acumulados >= 2;
    Object.assign(v, { desde: c.salida, hasta: c.hasta, regresa: cap1(F.corta(c.regresa)), cubreIds: VP.porDefinir ? [] : VP.cubre.slice(), cubreNota: VP.nota.trim(), porDefinir: VP.porDefinir, estado: 'programada', correccion: c.corregido ? VP.motivo.trim() : '', programadaEl: 'Hoy' });
    v.cubre = cubreTxt(v);
    // con 2 períodos acumulados, se programa el más viejo y el que queda sigue «por programar», con su propia fila (libro, «¿De quién?» y la cuenta)
    if (habia2) { v.queda = 'Le queda 1 período más por programar';
      D.VACACIONES.push({ id: v.id + 'b', emp: v.emp, periodo: v.periodo, dias: v.dias, bono: v.bono, estado: 'causada', acumulados: v.acumulados - 1, nota: 'El otro período que tenía acumulado: por programar.' });
      Object.assign(v, { periodo: vv.periodo, dias: vv.dias, bono: vv.bono, acumulados: 1 }); }
    e.vacaciones = 'Programadas del ' + fd(c.salida) + ' al ' + fd(c.hasta);
    A.auditar({ modulo: 'Vacaciones y reposos', registro: 'Vacaciones ' + e.nombre, campo: 'fechas', antes, despues: fd(c.salida) + ' al ' + fd(c.hasta) + ' · vuelve el ' + F.corta(c.regresa) + ' · cubre: ' + v.cubre, motivo: c.corregido ? 'Regreso corregido: ' + VP.motivo.trim() + ' (la app proponía el ' + F.corta(p.regresa) + ')' : '' });
    if (habia2) resolver('vac:' + v.id, { t: e.nombre + ': 2 períodos de vacaciones', hecho: 'Programadas: sale el ' + F.corta(c.salida) + ' y vuelve el ' + F.corta(c.regresa), sello: 'Programadas', abrir: 'vacacion:' + v.id });
    VP.hecho = { nueva, nombre: e.nombre, salida: c.salida, regresa: c.regresa, cubre: v.cubre, queda: v.queda && habia2 ? v.queda : '' }; A.borradorHecho();
    A.pintarPagina(); A.aviso((nueva ? 'Programadas' : 'Fechas cambiadas') + ': sale el ' + F.corta(c.salida) + ' y vuelve el ' + F.corta(c.regresa) + '.');
  };
  // la ficha de las vacaciones: las fechas no se escriben a mano, se programan («Programar» o «Cambiar las fechas» abren el calendario)
  FICHAS.vacacion = id => {
    const v = D.VACACIONES.find(x => x.id === id); const e = emp(v.emp);
    const base = e.formal ? 'base legal' : 'base de $ ' + D.PRESTA.baseInterna + ' al mes'; const diaB = e.formal ? D.PRESTA.baseFormal / 30 : D.PRESTA.baseInterna / 30;
    const acciones = !edP() ? [] : v.estado === 'causada' ? [{ txt: 'Programar', acc: 'vac-programar', arg: v.id, tono: 'pri', icono: 'calendario' }] : v.estado === 'programada' ? [{ txt: 'Cambiar las fechas', acc: 'vac-programar', arg: v.id, icono: 'calendario' }] : [];
    return { titulo: 'Vacaciones de ' + e.nombre, sub: esc(v.periodo), mod: 'personal', obj: v, registro: 'Vacaciones ' + e.nombre, tags: v.acumulados >= 2 && v.estado === 'causada' ? [['2 períodos acumulados', 'alerta']] : [],
      aviso: v.nota && v.acumulados >= 2 && v.estado === 'causada' ? `<p class="nota alerta">${ic('alerta', 's')}<span>${esc(v.nota)}</span></p>` : '',
      bloques: [{ filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${e.id}">${esc(e.nombre)}</button>` }, { l: 'Días hábiles', v: v.dias }, { l: 'Bono vacacional', v: v.bono + ' días' }, { l: 'Descansa', v: esc(descansoTxt(e)) },
        { l: 'Sale', v: v.desde ? esc(fdl(v.desde)) : 'Sin fecha' }, { l: 'Último día', v: v.hasta ? esc(fdl(v.hasta)) : 'Sin fecha' }, ...(v.regresa ? [{ l: 'Regresa', v: esc(v.regresa) + (v.correccion ? ' ' + tag('Corregido', 'aviso') : '') }] : []),
        ...(v.correccion ? [{ l: 'Por qué se corrigió', v: esc(v.correccion), largo: true }] : []), { l: 'Quién cubre', v: esc(cubreTxt(v)) }, { l: 'Estado', v: A.estadoTag(v.estado) }, ...(v.queda ? [{ l: 'Lo que queda', v: esc(v.queda), largo: true }] : [])] },
        { titulo: 'Pago', oculto: !ve(), filas: [{ l: 'Se paga al empezar', v: dinero((v.dias + v.bono) * diaB, 'usd') + ' <small class="tenue">(' + (v.dias + v.bono) + ' días · ' + base + ')</small>' }] },
        // en la columna de la fecha, solo la fecha (el período entero no cabe): el fin del período y el día en que se programaron
        { titulo: 'Historial', tiempo: [[esc((v.periodo.split('–')[1] || '').replace(')', '').trim()), 'Las ganó al cumplir el año.'], ...(v.desde ? [[esc(v.programadaEl || '—'), (v.correccion ? 'Programadas, con el regreso corregido. ' : 'Programadas. ') + 'Se le avisó a la persona y a la supervisora.']] : [])] }],
      acciones };
  };
  FICHAS.reposo = id => {
    const r = D.REPOSOS.find(x => x.id === id); const e = emp(r.emp); const espera = esperaDe('ivss:' + r.id);
    return { titulo: 'Reposo de ' + e.nombre, sub: fd(r.desde) + (r.dias > 1 ? ' al ' + fd(r.hasta) : '') + ' · ' + r.dias + (r.dias === 1 ? ' día' : ' días'), mod: 'personal', obj: r, registro: 'Reposo ' + e.nombre,
      tags: [[espera ? 'Esperando señal' : r.convalidado ? 'Convalidado' : 'Falta el IVSS', espera ? 'aviso' : r.convalidado ? 'ok' : 'alerta']],
      bloques: [{ filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${e.id}">${esc(e.nombre)}</button>` }, { l: 'Lo emitió', v: esc(r.emisor), campo: { k: 'emisor', tipo: 'texto' } }, ...(edP() ? [{ l: 'Motivo', v: esc(r.motivo) }] : []), { l: 'Días', v: r.dias }] },
        // el reposo trae el diagnóstico: el archivo solo lo ven el dueño y RRHH
        !edP() ? { titulo: 'Soporte', html: `<p class="nota gris">${ic('candado', 's')}<span>${r.soporte ? 'Tiene soporte · lo ven el dueño y RRHH.' : 'Falta el soporte.'}</span></p>` }
          : r.soporte ? { titulo: 'Soporte', adjuntos: [r.soporte].concat(r.convArchivo ? [r.convArchivo] : []) } : { html: `<label class="soltar" for="rp-${r.id}">${ic('camara')}<span><b>Subir la foto del reposo</b>Sin ella no cuenta.</span></label><input id="rp-${r.id}" data-subir-reposo="${r.id}" type="file" accept="image/*,application/pdf" class="sr-only">` },
        espera ? { html: `<p class="nota aviso">${ic('reloj', 's')}<span><b>Esperando señal.</b> La foto del reposo convalidado se sube sola cuando vuelva. Todavía no cuenta.</span></p>` } : { oculto: true },
        { html: `<p class="muted">${esc(r.nota)}</p>` }],
      acciones: r.tipo === 'reposo' && !r.convalidado && !espera ? [{ txt: 'Subir el reposo convalidado (foto)', acc: 'reposo-ok', arg: r.id, tono: 'pri', icono: 'camara', solo: 'editar' }] : [] };
  };
  // convalidado: sin prueba no hay sello · la foto del reposo con el sello del IVSS (sin señal, queda esperando) · cierra su aviso
  ACC['reposo-ok'] = id => {
    const r = D.REPOSOS.find(x => x.id === id); if (!r || r.convalidado) return; const e = emp(r.emp);
    A.pedirArchivo(f => {
      const hizo = subirFoto('ivss:' + id, 'reposo-ok', f.name, () => {
        r.convalidado = true; r.convArchivo = f.name; alExpediente(e, f.name);
        A.auditar({ modulo: 'Vacaciones y reposos', registro: 'Reposo ' + e.nombre, campo: 'IVSS', antes: 'por convalidar', despues: 'convalidado · ' + f.name });
        resolver('ivss:' + id, { t: e.nombre + ': reposo en el IVSS', hecho: 'Subió el reposo convalidado por el IVSS', sello: 'Convalidado', abrir: 'reposo:' + id });
      });
      pila(); if (hizo) A.aviso('Convalidado: la foto del IVSS quedó en su reposo.');
    });
  };
  FICHAS.permisoemp = id => { const p = D.PERMISOS_EMP.find(x => x.id === id); return { titulo: 'Permiso de ' + emp(p.emp).nombre, sub: esc(p.fecha), mod: 'personal', obj: p, bloques: [{ filas: [{ l: 'Motivo', v: esc(p.motivo), campo: { k: 'motivo', tipo: 'texto' } }, { l: 'Horas', v: esc(p.horas), campo: { k: 'horas', tipo: 'texto' } }, { l: 'Tipo', v: esc(p.tipo), campo: { k: 'tipo', tipo: 'select', opciones: ['Remunerado', 'No remunerado'] } }] }, p.soporte ? { titulo: 'Soporte', adjuntos: ['Constancia ' + p.fecha + '.pdf'] } : { html: '<p class="muted">Sin soporte.</p>' }] }; };

  /* =============== NÓMINA =============== */
  // línea estimada de la quincena del 15 de octubre, por concepto (el recibo)
  function linea(e) {
    const t = D.TASA.usd; const d = diario(e); const as = [], de = [];
    if (e.formal) { as.push(['Salario (mínimo legal)', 65 / t]); as.push(['Incremento complementario del cestaticket', e.sueldo - 65 / t]); }
    else if (e.tipoSal === 'por_dia') as.push([`Salario (13 días × ${dinero(e.diaria, 'usd')})`, 13 * e.diaria]);
    else as.push(['Salario (15 días)', e.sueldo]);
    // recargos de las dos nóminas, cada uno en su línea (guía laboral §2 y §4): 30 % por hora entre 7 p. m. y 5 a. m. y 50 % del día
    // por domingo o feriado trabajado · sobre el mismo día que los redobles · salen de las horas ya revisadas de la quincena anterior
    const h = D.HORAS.filas[e.id] || {}; const noche = h.noct ? r2(h.noct * d / 8 * .3) : 0, dom = h.dom ? r2(h.dom * d * .5) : 0;
    if (noche) as.push([`Bono nocturno (30 %) · ${h.noct} h`, noche]);
    if (dom) as.push([`Domingo o feriado trabajado (50 %) · ${h.dom} ${h.dom === 1 ? 'día' : 'días'}`, dom]);
    D.REDOBLES.filter(r => r.emp === e.id && r.estado !== 'no_va').forEach(r => as.push([(r.tipo === 'redoble' ? 'Redoble ' : 'Día extra ') + r.fecha.toLowerCase(), (r.tipo === 'redoble' ? .5 : 1.5) * d * r.veces]));
    // lo de ley, en bolívares (tercer dato 'bs'): el IVSS y el paro sobre el mínimo, con la base por confirmar (pregunta 8 a Cecilia);
    // el FAOV, el 1 % del salario integral de la quincena (el mínimo y los recargos, con la parte del bono vacacional y de las utilidades: × 1,125)
    // · el del 10 % se descuenta en su propia corrida · la suma de los dos es el 1 % del trabajador que declara Fiscal
    if (e.formal) { de.push(['IVSS y paro forzoso (4,5 % del mínimo)', r2(65 * .045) / t, 'bs']); de.push(['FAOV (1 % del salario integral)', r2((65 + (noche + dom) * t) * 1.125 * .01) / t, 'bs']); }
    D.FALTAS.filter(f => f.emp === e.id && f.estado === 'injustificada').forEach(f => de.push(['Falta sin justificar ' + f.fecha.toLowerCase(), d]));
    D.PRESTAMOS.filter(p => p.emp === e.id && seDescuenta(p)).forEach(p => de.push([`Cuota de préstamo ${p.pagadas + 1} de ${p.cuotas}`, cuotaDel15(p)]));
    D.ADELANTOS.filter(a => a.emp === e.id && a.estado === 'por_descontar').forEach(a => de.push(['Adelanto del ' + a.fecha.toLowerCase(), a.monto]));
    const ta = as.reduce((s2, x) => s2 + x[1], 0), td = de.reduce((s2, x) => s2 + x[1], 0);
    const prestDesc = de.filter(x => /préstamo|Adelanto/.test(x[0])).reduce((s2, x) => s2 + x[1], 0);
    // el neto va al céntimo: es lo que se paga, y la misma cifra sale en Pagos › Pagar la nómina
    return { as, de, ta, td, neto: r2(ta - td), rec: noche + dom, tope: prestDesc > ta / 3, pend: D.FALTAS.some(f => f.emp === e.id && f.estado === 'por_justificar') };
  }
  A.lineaNomina = linea;
  // corridas: cada fecha de pago lleva la formal, la interna y, con la 2.ª quincena, el 10 % del mes y el premio, cada una con sus recibos (29-ago)
  const nombreCorrida = c => ({ formal: 'Corrida formal', interna: 'Corrida interna', diez: '10 % de ' + c.mes, premio: 'Premio del mes de ' + c.mes })[c.tipo] || c.tipo;
  const subCorrida = c => ({ formal: 'Va a los entes', interna: 'Contrato interno · no va a los entes', diez: 'Del ' + c.periodo + ' · en euros, con la 2.ª quincena', premio: 'Ganador escogido a mano por ' + c.escogio })[c.tipo] || '';
  const montoCorrida = c => c.mon === 'eur' ? `${dinero(c.total, 'eur')} <small class="tenue">≈ ${dinero(c.usd, 'usd')}</small>` : dinero(c.total, 'usd');
  const fechasCorridas = () => [...new Set(D.NOMINA.corridas.map(c => c.fecha))];
  const corridasDe = f => D.NOMINA.corridas.filter(c => c.fecha === f);
  A.corridas = { nombre: nombreCorrida, sub: subCorrida, monto: montoCorrida };
  // el reporte para pagar: lo sube Andreina, que no ve Pagos; con él se arma la lista de Pagos › Pagar la nómina
  function reporteCard() {
    const R = D.PAGO_NOMINA.reporte; const sube = ['p', 'a'].includes(nivel('nomina')); const rrhh = nivel('nomina') === 'p';
    return `<article class="hoja"><div class="hoja-cab"><h2>${ic('subir')}Reporte para pagar</h2>${tag('Subido', 'ok')}</div>
      <p class="muted">Después del visto final, ${rrhh ? 'subes' : 'Andreina sube'} aquí el reporte de pago, en el orden en que se paga: primero la corrida formal y después la interna, cada una por banco. Con él se arma la lista de Pagos › Pagar la nómina${rrhh ? ', que tú no ves: te avisamos cuando todo esté pagado' : ', que pagan Jose o Alejandro'}.</p>
      <dl class="kv"><div><dt>El último</dt><dd>${esc(R.subio)} · ${esc(R.cuando)}</dd></div></dl>
      ${ve() ? `<button class="adjunto" data-acc="ver-archivo" data-arg="${esc(R.archivo)}">${ic('archivo', 's')}<span>${esc(R.archivo)}</span></button>` : notaAgrupada('El reporte trae el monto de cada persona: lo ven el dueño, RRHH y contabilidad.')}
      ${sube ? `<label class="soltar" for="nom-reporte">${ic('subir')}<span><b>Subir el reporte de pago</b>El Excel o el PDF de la nómina aprobada, en el orden en que se paga.</span></label><input id="nom-reporte" type="file" accept=".xls,.xlsx,.csv,.pdf" class="sr-only">` : ''}
      ${ve() && puede('pagos') ? `<button class="enlace" data-ir="pagos/nomina">Ver la lista para pagar ${ic('derecha', 's')}</button>` : ''}</article>`;
  }
  // el premio del mes va en su propia corrida; el ganador lo escoge Alejandro a mano (la app no lo calcula)
  function premioCard() {
    const P2 = D.NOMINA.premio; const e = P2.ganador ? emp(P2.ganador) : null; const ult = D.NOMINA.corridas.find(c => c.tipo === 'premio');
    return `<article class="hoja"><div class="hoja-cab"><h2>${ic('estrella')}Premio de ${esc(P2.mes)}</h2>${e ? tag('Escogido', 'ok') : tag('Por escoger', 'aviso')}</div>
      <dl class="kv"><div><dt>Se paga</dt><dd>${esc(P2.paga)}, en su propia corrida</dd></div><div><dt>Monto</dt><dd>${dinero(P2.monto, 'usd')}</dd></div><div><dt>Ganador</dt><dd>${e ? (ve() ? esc(e.nombre) : 'Escogido') : 'Por escoger'}</dd></div>${e && ve() ? `<div><dt>Por qué</dt><dd class="largo">${esc(P2.motivo)}</dd></div>` : ''}</dl>
      <p class="muted">El ganador lo escoge Alejandro a mano: la app no lo calcula. Lleva su recibo, como cualquier corrida.</p>
      ${!e && puede('nomina', 'aprobar') ? `<button class="btn sec" data-acc="premio-escoger">${ic('estrella', 's')}Escoger el ganador</button>` : ''}
      ${ult ? `<button class="enlace" data-abrir="corrida:${ult.id}">Ver el de ${esc(ult.mes)} ${ic('derecha', 's')}</button>` : ''}</article>`;
  }
  ACC['premio-escoger'] = () => {
    if (!puede('nomina', 'aprobar')) return A.aviso('El ganador lo escoge Alejandro.', 'info');
    const P2 = D.NOMINA.premio; const env = $('#modal-raiz');
    A.modal(`<h2 id="modal-t">Premio de ${esc(P2.mes)}</h2><p class="muted" id="modal-d">Lo escoges tú, a mano. Se paga el ${esc(P2.paga)} en su propia corrida, con su recibo.</p>
      <label class="campo" for="pm-emp"><span>Ganador</span><select id="pm-emp">${activos().map(x => `<option value="${x.id}">${esc(x.nombre)} · ${esc(x.cargo)}</option>`).join('')}</select></label>
      <label class="campo" for="pm-por"><span>Por qué</span><textarea id="pm-por" placeholder="Lo que hizo bien este mes"></textarea><small class="ayuda" id="pm-msg"></small></label>
      <div class="modal-acc"><button class="btn sec" data-pm="no">Cancelar</button><button class="btn pri" data-pm="si">Escoger</button></div>`, 'teclado');
    $('#pm-emp').focus();
    env.onclick = ev => {
      const b = ev.target.closest('[data-pm]'); if (!b) return;
      if (b.dataset.pm === 'no') { A.cerrarModal(); return; }
      const id = $('#pm-emp').value; const por = $('#pm-por').value.trim();
      if (por.length < 4) { $('#pm-msg').textContent = 'Escribe por qué: queda en el registro de cambios.'; return; }
      A.cerrarModal();
      A.pedirCodigo({ que: 'Premio de ' + esc(P2.mes) + ' para ' + esc(emp(id).nombre) + ' · ' + dinero(P2.monto, 'usd'), det: 'Se paga el ' + esc(P2.paga) + ' en su propia corrida, con su recibo.', boton: 'Escoger a ' + emp(id).nombre.split(' ')[0] }).then(() => {
        P2.ganador = id; P2.motivo = por; P2.escogio = S.usuario.nombre;
        A.auditar({ modulo: 'Nómina', registro: 'Premio de ' + P2.mes, campo: 'ganador', antes: 'por escoger', despues: emp(id).nombre, motivo: por });
        A.pintarPagina(); A.aviso('Escogido. Va en su propia corrida el ' + P2.paga + ', con su recibo.');
      }).catch(() => {});
    };
  };
  const N = {};
  PANT.nomina = {
    titulo: 'Nómina', corto: 'Nómina', tab: 'Nómina', grupo: 'Recursos humanos', icono: 'nomina', mod: 'nomina', palabras: 'sueldo sueldos salario salarios quincena pago del personal',
    secciones: [['quincena', 'Quincena del 15', 'prenomina recibo'], ['diez', '10 % del mes', 'diez servicio comision'], ['propinas', 'Propinas', 'propina pote'], ['recibos', 'Recibos firmados', 'firma recibo'], ['corridas', 'Corridas', 'corrida premio'], ['reglas', 'Reglas', 'conceptos turnos feriados']],
    // a quien da el visto final le cuenta las semanas de propinas que esperan por él
    cuenta: () => puede('nomina', 'aprobar') ? D.PROPINAS.filter(p => p.estado === 'revisada').length : 0,
    render: (sub = 'quincena') => {
      const n = D.NOMINA.proxima; const nv = nivel('nomina'); let cuerpo = '';
      if (sub === 'quincena') {
        const pasos = ['Prepara Andreina', 'Revisa Jose', 'Aprueba Alejandro', 'Se paga'];
        const mio = { p: 'Te toca preparar', r: 'Te toca revisar cuando Andreina la prepare', a: 'Te toca el visto final' }[nv];
        const pj = D.FALTAS.filter(f => f.estado === 'por_justificar').length, rs = D.REDOBLES.filter(r => r.estado === 'por_revisar').length, ia = D.INCIDENCIAS.filter(x => x.estado === 'alertada').length;
        const lista = activos();
        const ls = lista.map(e => ({ e, l: linea(e) }));
        const descP = r2(D.PRESTAMOS.reduce((s2, p) => s2 + cuotaDel15(p), 0)), descA = D.ADELANTOS.filter(a => a.estado === 'por_descontar').reduce((s2, a) => s2 + a.monto, 0);
        cuerpo = `<div class="rejilla"><div class="c7 pila">
          <article class="hoja"><div class="hoja-cab"><h2>${ic('nomina')}Próxima: ${esc(n.fecha)}</h2>${tag('Paso 1 de 4', 'aviso')}</div>
            <ol class="pasos">${pasos.map((p, i) => `<li class="${i === 0 ? 'actual' : ''}">${p}</li>`).join('')}</ol>
            ${mio ? `<p class="nota info">${ic('info', 's')}<span><b>${esc(mio)}.</b> Cada paso lo hace una persona distinta.</span></p>` : ''}
            <dl class="kv"><div><dt>Corrida formal (${n.formal.personas} personas, va a los entes)</dt><dd>${ve() ? dinero(n.formal.total, 'usd') : 'Agrupada'}</dd></div><div><dt>Corrida interna (${n.interna.personas} personas)</dt><dd>${ve() ? dinero(n.interna.total, 'usd') : 'Agrupada'}</dd></div><div class="total"><dt><b>Total estimado</b><small class="tenue" style="display:block">sin los recargos de noche y domingo</small></dt><dd>${dinero(n.formal.total + n.interna.total, 'usd')}</dd></div></dl>
            ${ve() ? `<p class="muted">Los recargos de noche y domingo de las ${lista.length} personas que se muestran suman ${dinero(ls.reduce((s2, x) => s2 + x.l.rec, 0), 'usd')} (${dinero(ls.filter(x => x.e.formal).reduce((s2, x) => s2 + x.l.rec, 0), 'usd')} en la corrida formal) y ya van en su recibo. Los del resto salen cuando llegue el reloj.</p>` : ''}
            <p class="muted">El 31 de octubre van, además, el 10 % de octubre y el premio del mes, cada uno en su corrida y con sus recibos.</p>
          </article>${reporteCard()}</div>
          <div class="c5 pila"><div class="sec"><h2>Lo que falta para calcularla</h2></div>
            <ul class="lista">
              ${filaLista({ ir: 'asistencia/reloj', tono: 'alerta', icono: 'reloj', t: 'El reporte del reloj (Excel)', s: 'Sin él no hay horas, redobles ni faltas del reloj', fin: tag('Bloquea', 'alerta') })}
              ${pj ? filaLista({ ir: 'asistencia/faltas', tono: 'aviso', icono: 'alerta', t: pj + (pj === 1 ? ' falta por clasificar' : ' faltas por clasificar'), s: 'Las clasifica Andreina con su soporte' }) : ''}
              ${rs ? filaLista({ ir: 'asistencia/redobles', tono: 'aviso', icono: 'check', t: rs + ' redobles por revisar', s: 'Los revisa Jose' }) : ''}
              ${ia ? filaLista({ ir: 'asistencia/incidencias', tono: 'aviso', icono: 'reloj', t: ia + ' persona con horas que no cuadran', s: 'Hay que anotar lo acordado' }) : ''}
            </ul>
            <article class="hoja"><h2>${ic('prestamo')}Descuentos de esta quincena</h2><dl class="kv"><div><dt>Cuotas de préstamos</dt><dd>${ve() ? dinero(descP, 'usd', 0) : D.PRESTAMOS.filter(seDescuenta).length + ' cuotas'}</dd></div><div><dt>Adelantos</dt><dd>${ve() ? dinero(descA, 'usd', 0) : D.ADELANTOS.filter(a => a.estado === 'por_descontar').length}</dd></div><div><dt>Consumos del personal</dt><dd>Van en la del 31</dd></div></dl><button class="enlace" data-ir="prestamos/descuentos">Ver por persona ${ic('derecha', 's')}</button></article></div></div>
          ${ve() ? `<div class="sec"><h2>Pre-nómina estimada · se muestran ${lista.length} de 49</h2><span class="muted">A tasa BCV de hoy: Bs ${fmt(D.TASA.usd)}</span></div>
            ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Gana', cls: 'r x plata' }, { t: 'Noche y domingo', cls: 'r x plata' }, { t: 'Descuentos', cls: 'r x plata' }, { t: 'Neto $', cls: 'r plata' }, { t: 'Neto Bs', cls: 'r x plata' }, { t: '', cls: 'e' }],
              filas: ls.map(({ e, l }) => ({ abrir: 'recibo:' + e.id, celdas: [`<b>${esc(e.nombre)}</b><small>${e.formal ? 'Formal' : 'Interna'} · ${esc(e.cargo)}</small>`, dinero(l.ta, 'usd'), l.rec ? dinero(l.rec, 'usd') : '—', l.td ? dinero(-l.td, 'usd') : '—', dinero(l.neto, 'usd'), dinero(l.neto * D.TASA.usd, 'bs', 0), l.pend ? tag('Falta por clasificar', 'aviso') : e.estado === 'reposo' ? tag('Reposo: IVSS 2/3', 'lila') : l.tope ? tag('Pasa el tope', 'alerta') : ''] })),
              pie: ['Total de estas personas', dinero(ls.reduce((s2, x) => s2 + x.l.ta, 0), 'usd'), dinero(ls.reduce((s2, x) => s2 + x.l.rec, 0), 'usd'), dinero(-ls.reduce((s2, x) => s2 + x.l.td, 0), 'usd'), dinero(ls.reduce((s2, x) => s2 + x.l.neto, 0), 'usd'), dinero(ls.reduce((s2, x) => s2 + x.l.neto, 0) * D.TASA.usd, 'bs', 0), ''] })}
            <p class="muted">Toca a una persona para ver su recibo por concepto. «Noche y domingo» es el bono nocturno (30 %) más los domingos o feriados trabajados (50 %), con las horas del ${esc(D.HORAS.periodo)}; ya va sumado en «Gana». Se calcula en dólares y se paga en bolívares a la tasa BCV del día; la tasa queda guardada.</p>`
          : notaAgrupada('Ves la nómina agrupada por corrida, sin nombres ni sueldos por persona.')}`;
      }
      if (sub === 'diez') {
        const B = D.BOLSA.anterior; const lista = D.EMPLEADOS.filter(e => e.estado !== 'egresado' || e.id === 'e14');
        const rep = B.rep; const repartido = B.comision * rep / 100; // lo repartido es la corrida del 10 % de septiembre
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Comisión del ' + B.periodo, valor: dinero(B.comision, 'eur', 0), sub: 'la cargó ' + B.cargo, abrir: 'corrida:n1d' })}${A.cifra({ etq: 'Se repartió', valor: fmt(rep, 1) + ' %', sub: dinero(repartido, 'eur', 0) + ' entre 49 personas · su corrida', abrir: 'corrida:n1d' })}${A.cifra({ etq: 'Se quedó el negocio', valor: dinero(B.comision - repartido, 'eur', 0), sub: fmt(100 - rep, 1) + ' % (regla del 30-ago)' })}${A.cifra({ etq: 'Tasa euro BCV', valor: dinero(B.tasaEur, 'bs'), sub: 'el 10 % se cobra y se paga en euros', ir: puede('tasas') ? 'tasas' : '' })}</div>
          <div class="rejilla"><div class="c7 pila">${ve() ? A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: '%', cls: 'r' }, { t: 'Le tocó €', cls: 'r plata' }, { t: 'En Bs', cls: 'r x plata' }, { t: '', cls: 'e' }], filas: lista.map(e => { const m = B.comision * e.pct / 100; const faov = e.formal && m ? r2(r2(m * B.tasaEur) * 1.125 * .01) : 0; return { abrir: 'empleado:' + e.id, celdas: [`<b>${esc(e.nombre)}</b><small>${esc(e.cargo)}${e.formal ? ' · nómina formal' : ''}</small>`, fmt(e.pct, 1) + ' %', dinero(m, 'eur'), dinero(m * B.tasaEur, 'bs', 0) + (faov ? `<small class="tenue" style="display:block">FAOV ${dinero(-faov, 'bs')}</small>` : ''), e.pct === 0 ? tag('Nueva: arranca en 0', '') : e.id === 'e14' ? tag('Último mes', '') : ''] }; }) }) + `<p class="muted">Se muestran ${lista.length} de las 49 personas. A la nómina formal se le descuenta en el recibo del 10 % el 1 % de FAOV de su parte (sobre el salario integral: × 1,125). Entre las 10 de la nómina formal se llevaron el ${fmt(B.pctFormal, 1)} % (${dinero(r2(B.comision * B.pctFormal / 100), 'eur')}): es lo que entra en las bases de Fiscal.</p>` : notaAgrupada('Ves el total del 10 %, sin lo que le tocó a cada persona.')}</div>
          <div class="c5 pila"><article class="hoja"><div class="hoja-cab"><h2>${ic('calendario')}Período actual</h2>${tag('Abierto', 'info')}</div><dl class="kv"><div><dt>Período</dt><dd>${esc(D.BOLSA.actual.periodo)}</dd></div><div><dt>Comisión</dt><dd>${esc(D.BOLSA.actual.carga)}</dd></div><div><dt>Se paga</dt><dd>Con la 2.ª quincena (31 oct)</dd></div></dl>${A.boton('nomina', 'Cargar la comisión', 'data-acc="pronto"', { tono: 'sec', icono: 'mas' })}</article>
            <p class="nota info">${ic('info', 's')}<span>El período va del 28 al 27, no del 1 al 30. Quien no trabajó el período completo cobra su % sobre la comisión de los días que sí trabajó. El 10 % es salario y va en el recibo.</span></p></div></div>`;
      }
      if (sub === 'propinas') cuerpo = `<p class="desc">El pote de propinas de cada semana se reparte el lunes, con su recibo. Lo reparten Jose o Andreina y queda revisada; se da por pagada con el visto final de Alejandro.</p>
        ${A.tabla({ cols: [{ t: 'Semana', cls: 'p' }, { t: 'Personas', cls: 'r x' }, { t: 'Pote', cls: 'r plata' }, { t: 'Promedio por persona', cls: 'r x plata' }, { t: 'Estado', cls: 'e' }], filas: D.PROPINAS.map(p => ({ abrir: 'propina:' + p.id, celdas: [`<b>${esc(p.semana)}</b><small>${esc(p.regla)}</small>`, p.personas, dinero(p.pote, 'usd'), dinero(p.pote / p.personas, 'usd'), A.estadoTag(p.estado)] })) })}`;
      if (sub === 'recibos') cuerpo = `<p class="desc">Andreina imprime los recibos, recoge las firmas el día de pago y sube la foto. Sin el recibo firmado, en un reclamo vale lo que diga el trabajador.</p>
        ${A.tabla({ cols: [{ t: 'Corrida', cls: 'p' }, { t: 'Firmados', cls: 'r' }, { t: '', cls: 'e' }], filas: D.RECIBOS.map(r => { const c = D.NOMINA.corridas.find(x => x.id === r.corrida); return { abrir: 'corrida:' + r.corrida, celdas: [`<b>${esc(r.fecha)} · ${esc(nombreCorrida(c))}</b><small>${esc(c.grupo)}</small>`, r.firmados + ' de ' + r.total, r.firmados === r.total ? tag('Completos', 'ok') : tag('Faltan ' + (r.total - r.firmados), 'aviso')] }; }) })}
        <p class="muted">Cada corrida lleva sus propios recibos: la formal, la interna, el 10 % y el premio.</p>
        ${puede('nomina', 'editar') ? `<label class="soltar" for="rec-fotos">${ic('camara')}<span><b>Subir fotos de recibos firmados</b>La app lee el nombre y lo junta con su recibo.</span></label><input id="rec-fotos" type="file" accept="image/*" class="sr-only" multiple>` : ''}`;
      if (sub === 'corridas') cuerpo = `<div class="rejilla"><div class="c7 pila">${fechasCorridas().map(f => { const cs = corridasDe(f); return `<div class="sec"><h2>${esc(cs[0].grupo)}</h2><span class="muted">pagada el ${esc(f)} · ${cs.length} corridas · ≈ ${dinero(cs.reduce((s2, c) => s2 + c.usd, 0), 'usd')}</span></div>`
          + A.tabla({ cols: [{ t: 'Corrida', cls: 'p' }, { t: 'Personas', cls: 'x' }, { t: 'Total', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: cs.map(c => ({ abrir: 'corrida:' + c.id, celdas: [`<b>${esc(nombreCorrida(c))}</b><small>${esc(subCorrida(c))}</small>`, c.personas, montoCorrida(c), tag('Pagada', 'ok')] })) }); }).join('')}
          <p class="muted">Cada corrida va por separado y con sus recibos: la formal va a los entes y la interna no. El 10 % se paga en euros a la tasa euro BCV de ese día; el total de cada fecha va en dólares a la tasa de ese día.</p></div>
        <div class="c5 pila">${premioCard()}<article class="hoja"><h2>${ic('cajachica')}El ahorro de diciembre</h2><p class="muted">Lo que se va apartando cada mes para pagar en diciembre la liquidación anual, las utilidades y los intereses.</p><dl class="kv"><div><dt>Apartado hasta hoy</dt><dd>${ve() ? dinero(D.DICIEMBRE.apartado, 'usd', 0) : 'Agrupado'}</dd></div><div><dt>Hace falta en diciembre (estimado)</dt><dd>${ve() ? dinero(D.DICIEMBRE.liquidacionAnual + D.DICIEMBRE.utilidades + D.DICIEMBRE.intereses, 'usd', 0) : 'Agrupado'}</dd></div></dl><button class="enlace" data-ir="prestaciones/diciembre">Ver el cálculo ${ic('derecha', 's')}</button></article></div></div>`;
      if (sub === 'reglas') {
        // cada concepto, turno y feriado se abre: lo cambia RRHH y lo aprueba Alejandro (lo que guarda Andreina queda propuesto)
        const filaR = (abrir, t, s2) => `<li><button class="fila" data-abrir="${abrir}" style="grid-template-columns:minmax(0,1fr) auto"><span class="medio"><b>${esc(t)}</b><small>${esc(s2)}</small></span><span class="fin">${PROP[abrir] ? tag('Cambio por aprobar', 'aviso') : ''}${ic('derecha', 's chev')}</span></button></li>`;
        cuerpo = `<div class="rejilla"><div class="c6 pila"><article class="hoja"><h2>Conceptos de pago</h2><ul class="lista" style="border:0">${D.PARAMS.conceptos.map((c, i) => filaR('concepto:' + i, c[0], c[1])).join('')}</ul><p class="muted">Cada concepto dice si es salario o no, y en qué aportes incide. Lo edita RRHH y lo aprueba Alejandro.</p></article>
          <article class="hoja"><h2>Turnos</h2><ul class="lista" style="border:0">${Object.entries(D.TURNOS).map(([k, [n2, h]]) => filaR('turno:' + k, k + ' · ' + n2, h + ' · ' + ({ 'T-1': 'sin recargo de noche', 'T-2': '4 h con recargo de noche', 'T-3': 'toda la jornada con recargo de noche' }[k] || ''))).join('')}</ul></article></div>
        <div class="c6 pila"><article class="hoja"><h2>Feriados</h2><ul class="lista" style="border:0">${D.PARAMS.feriados.map((f, i) => filaR('feriado:' + i, f[0], f[1])).join('')}</ul><p class="muted">Trabajar un domingo o un feriado paga 50 % más. El 24 y el 31 de diciembre son feriados completos, aunque se cierre temprano.</p></article>
          <article class="hoja"><h2>Préstamos y consumos</h2><ul class="lista" style="border:0">${D.PARAMS.reglas.map((r, i) => [r, i]).filter(([r]) => /Préstamos|Adelantos|Consumo del personal/.test(r[0])).map(([r, i]) => filaR('param:reg-' + i, r[0], A.paraCecilia(r[1]))).join('')}</ul></article>
          <p class="nota gris">${ic('reloj', 's')}<span>El motor (horas, redobles, 10 %, vacaciones, prestaciones) calcula todo cuando llegue la muestra del Excel del reloj.</span></p></div></div>`;
      }
      return `<div class="pagina">${A.cab('Recursos humanos', 'Nómina', 'Dos corridas cada quincena: la formal, que va a los entes, y la interna. El 10 % del mes se paga con la 2.ª quincena, en su propia corrida y a tasa euro; el premio del mes, también aparte.')}
        ${A.subnav([['quincena', 'Quincena del 15'], ['diez', '10 % del mes'], ['propinas', 'Propinas', D.PROPINAS.filter(p => p.estado !== 'pagada').length], ['recibos', 'Recibos firmados', D.RECIBOS.reduce((s2, r) => s2 + r.total - r.firmados, 0), true], ['corridas', 'Corridas'], ['reglas', 'Reglas', Object.keys(PROP).length]], sub)}${cuerpo}</div>`;
    },
    // el reporte de pago que sube Andreina arma la lista de Pagos › Pagar la nómina, en su orden (simulado)
    montar: raiz => {
      const f = $('#nom-reporte', raiz);
      if (f) f.addEventListener('change', ev => {
        if (!ev.target.files.length) return;
        const R = D.PAGO_NOMINA.reporte; const antes = R.archivo; R.archivo = ev.target.files[0].name; R.subio = S.usuario.nombre; R.cuando = 'Hoy ' + D.HOY.hora;
        A.auditar({ modulo: 'Nómina', registro: 'Reporte de pago del ' + D.PAGO_NOMINA.corto, campo: 'archivo', antes, despues: R.archivo });
        A.pintarPagina();
        A.aviso(puede('pagos') ? 'Reporte subido. La lista de Pagos › Pagar la nómina quedó en el mismo orden; lo que ya estaba marcado se queda. (Simulado)' : 'Reporte subido. Jose y Alejandro ya ven la lista para pagar, en tu orden. Te avisamos cuando todo esté pagado. (Simulado)');
      });
    },
  };
  // el recibo trae los montos de la persona: quien ve la nómina agrupada (Luis, Cecilia, Eliana) ve solo dónde está el total, aunque llegue por un enlace
  const soloTotal = (titulo, sub, txt, ir = '', irTxt = '') => ({ titulo, sub, mod: 'nomina', bloques: [{ html: notaAgrupada(txt) + (ir && A.accesible(ir.split('/')[0]) ? `<button class="enlace" data-ir="${ir}">${esc(irTxt)} ${ic('derecha', 's')}</button>` : '') }] });
  FICHAS.recibo = id => {
    const e = emp(id); if (!ve()) return soloTotal('Recibo de ' + e.nombre, '1.ª quincena de octubre', 'El recibo trae los montos de la persona: lo ven el dueño, RRHH y contabilidad. Tú ves el total de la nómina.', 'nomina/quincena', 'Ver el total de la quincena');
    const l = linea(e); const t = D.TASA.usd;
    const col = (titulo, xs, tot) => `<div class="recibo-col"><h4>${titulo}</h4><dl>${xs.length ? xs.map(([c, m, mon]) => `<div><dt>${esc(c)}</dt><dd>${mon === 'bs' || m < 1 ? dinero(m * t, 'bs') : dinero(m, 'usd')}</dd></div>`).join('') : '<div><dt class="tenue">Nada</dt><dd></dd></div>'}</dl><p class="recibo-sub"><span>Total</span><b>${dinero(tot, 'usd')}</b></p></div>`;
    return { titulo: 'Recibo de ' + e.nombre, sub: '1.ª quincena de octubre · estimado', mod: 'nomina', sensible: 'sueldos', obj: { estado: 'por_firmar' }, tags: [['Por firmar', 'aviso']],
      bloques: [{ html: `<div class="recibo-pago"><header class="recibo-cab"><div><b>Recibo de pago</b><small>Razón social de ejemplo, C.A. · RIF J-0000000-4</small></div><div class="der"><small>Del 1 al 15 de octubre de 2026</small><small>Tasa BCV: Bs ${fmt(t)}</small></div></header>
          <p class="recibo-quien"><b>${esc(e.nombre)}</b> · C.I. ${esc(e.ci || 'por cargar')} · ${esc(e.cargo)} · desde el ${esc(e.ingreso)}</p>
          <div class="recibo-cols">${col('Asignaciones', l.as, l.ta)}${col('Deducciones', l.de, l.td)}</div>
          <div class="recibo-neto"><span>Neto a pagar</span><span><b>${dinero(l.neto, 'usd')}</b> <small>= ${dinero(l.neto * t, 'bs')}</small></span></div>
          <div class="recibo-firma"><span>Recibí conforme · firma del trabajador</span><span>Fecha</span></div></div>` },
        { html: (l.tope ? `<p class="nota alerta">${ic('alerta', 's')}<span>Los préstamos y adelantos pasan de un tercio de lo que gana. La app propone correr una cuota a la quincena siguiente.</span></p>` : '') + (l.pend ? `<p class="nota aviso">${ic('alerta', 's')}<span>Tiene una falta por clasificar. Si queda sin justificar, se descuenta el día.</span></p>` : '') + (l.rec ? `<p class="muted">El bono nocturno y los domingos trabajados salen de las horas ya revisadas del ${esc(D.HORAS.periodo)}, en Asistencia y horas. Cada recargo va en su propia línea, como pide la ley.</p>` : '') + (e.formal ? `<p class="muted">El IVSS y el paro forzoso se descuentan sobre el mínimo hasta que Cecilia confirme la base ${tag('Pregunta 8', 'aviso')}. El FAOV va sobre el salario integral de la quincena: el mínimo${l.rec ? ' y los recargos' : ''}. El FAOV de su parte del 10 % se descuenta en el recibo del 10 %.</p>` : '') + '<p class="muted">Va un recibo por persona en cada corrida, también en la interna. Se imprime, se firma el día de pago y se sube la foto.</p>' }] };
  };
  FICHAS.corrida = id => {
    const c = D.NOMINA.corridas.find(x => x.id === id); const r = D.RECIBOS.find(x => x.corrida === id); const eur = c.mon === 'eur';
    const B = D.BOLSA.anterior; const bolsa = c.tipo === 'diez' && c.periodo === B.periodo;
    const propias = {
      formal: [{ l: 'Va a los entes', v: 'Sí: con ella se declaran el IVSS, el FAOV, el INCES, las pensiones y el RNET' }],
      interna: [{ l: 'Va a los entes', v: 'No: es la nómina de contrato interno' }],
      // la parte de la nómina formal entra en las bases de los aportes y a esas 10 personas se les descuenta el 1 % de FAOV sobre ella (salario integral: × 1,125)
      diez: [{ l: 'Período', v: 'Del ' + esc(c.periodo) }, ...(bolsa ? [{ l: 'Comisión del período', v: dinero(B.comision, 'eur', 0) + ` <small class="tenue">se repartió el ${fmt(B.rep, 1)} %</small>` }] : []), { l: 'Cuándo se paga', v: 'Con la 2.ª quincena, en su propia corrida' },
        ...(c.formalEur ? [{ l: 'De la nómina formal', v: dinero(c.formalEur, 'eur') + ` <small class="tenue">${dinero(r2(c.formalEur * c.tasaEur), 'bs')} · entra en las bases del FAOV, el INCES y las pensiones</small>` },
          { l: 'FAOV que se les descuenta (1 %)', v: dinero(-r2(r2(c.formalEur * c.tasaEur) * 1.125 * .01), 'bs') + ' <small class="tenue">sobre el salario integral (× 1,125), en su recibo del 10 %</small>' }] : [])],
      premio: [{ l: 'Ganador', v: ve() ? `<button class="enlace" data-abrir="empleado:${c.ganador}">${esc(emp(c.ganador).nombre)}</button>` : 'Lo ven el dueño, RRHH y contabilidad' }, { l: 'Lo escogió', v: esc(c.escogio) + ', a mano' }, ...(ve() ? [{ l: 'Por qué', v: esc(c.motivo), largo: true }] : [])],
    }[c.tipo] || [];
    return { titulo: nombreCorrida(c), sub: 'Nómina del ' + esc(c.fecha) + ' · ' + esc(c.grupo), mod: 'nomina', obj: c, bloqueada: true, tags: [['Pagada', 'ok']],
      bloques: [{ filas: [{ l: 'Personas', v: c.personas }, { l: 'Total', v: montoCorrida(c) }, { l: eur ? 'Tasa euro BCV de ese día' : 'Tasa BCV de ese día', v: dinero(eur ? c.tasaEur : c.tasa, 'bs') }, { l: 'En bolívares', v: dinero(Math.round(c.total * (eur ? c.tasaEur : c.tasa) * 100) / 100, 'bs') }, ...propias,
          { l: 'La preparó', v: 'Andreina' }, { l: 'La revisó', v: 'Jose' }, { l: 'Visto final', v: 'Alejandro' }, ...(r ? [{ l: 'Recibos firmados', v: r.firmados + ' de ' + r.total + (r.firmados < r.total ? ' ' + tag('Faltan ' + (r.total - r.firmados), 'aviso') : '') }] : [])] },
        ve() ? { titulo: 'Archivos', adjuntos: ['Recibos ' + c.fecha + ' · ' + nombreCorrida(c).toLowerCase() + '.pdf', 'Resumen enviado a Pagos al Personal.pdf'] } : { oculto: true },
        c.tipo === 'diez' ? { html: '<p class="muted">El 10 % es salario. La parte de la nómina formal entra en las bases del FAOV, el INCES y las pensiones, y a esas personas se les descuenta el FAOV en el recibo del 10 %.</p>' } : { oculto: true },
        { html: ve() ? '<p class="muted">Una nómina pagada ya no se edita. Si hubo un error, se hace una corrida de reemplazo enlazada a esta.</p>' : '<p class="muted">Ves el total de la corrida. El detalle por persona es solo para dueño, RRHH y contabilidad.</p>' }] };
  };

  /* ---------- reglas de la nómina: conceptos, turnos y feriados ----------
     los cambia RRHH y los aprueba Alejandro: lo que guarda Andreina queda propuesto hasta que él lo apruebe; lo que cambia él rige de una vez */
  const PROP = D.PROP_REGLAS; // cambios que esperan a Alejandro, por ficha (por ejemplo 'turno:T-1')
  const APLICA = {
    concepto: (i, k, v) => { D.PARAMS.conceptos[+i][k === 'nombre' ? 0 : 1] = v; },
    turno: (t, k, v) => { D.TURNOS[t][k === 'nombre' ? 0 : 1] = v; },
    feriado: (i, k, v) => { D.PARAMS.feriados[+i][k === 'fecha' ? 0 : 1] = v; },
  };
  function fichaRegla({ tipo, id, titulo, sub, obj, filas, extra = [], nota = '' }) {
    const clave = tipo + ':' + id; const pr = PROP[clave]; const dueno = puede('nomina', 'aprobar');
    const edita = ['p', 'a'].includes(nivel('nomina')) && !pr; // RRHH propone y el dueño cambia; mientras haya una propuesta, nadie la pisa
    return { titulo, sub, mod: 'nomina', moduloNombre: 'Nómina · reglas', obj, registro: (dueno ? '' : 'Propuesta · ') + titulo,
      tags: pr ? [['Cambio por aprobar', 'aviso']] : [],
      aviso: pr ? `<p class="nota aviso">${ic('reloj', 's')}<span><b>${esc(pr.quien)} propuso un cambio.</b> ${pr.cambios.map(c => esc(c.l) + ': «' + esc(c.antes) + '» → «' + esc(c.nuevo) + '»').join(' · ')}. Motivo: «${esc(pr.motivo)}». ${dueno ? 'Falta tu aprobación.' : 'Falta la aprobación de Alejandro.'}</span></p>` : '',
      bloques: [{ filas: filas.map(f => (f.campo && !edita ? { ...f, campo: undefined } : f)) }, ...extra,
        { html: `<p class="muted">${nota ? esc(nota) + ' ' : ''}${nivel('nomina') === 'p' ? 'Lo que guardas queda propuesto hasta que Alejandro lo apruebe' : dueno ? 'Lo que cambias tú rige de una vez; lo que guarda Andreina te llega para aprobar' : 'Lo cambia RRHH y lo aprueba Alejandro'}. Todo queda en el registro de cambios.</p>` }],
      acciones: pr && dueno ? [{ txt: 'Rechazar', acc: 'regla-rechazar', arg: clave, tono: 'ghost' }, { txt: 'Aprobar el cambio', acc: 'regla-aprobar', arg: clave, tono: 'pri', icono: 'candado' }] : [],
      alGuardar: (cambios, motivo) => {
        if (dueno) { cambios.forEach(c => APLICA[tipo](id, c.r.campo.k, c.nuevo)); return; }
        PROP[clave] = { titulo, quien: S.usuario.nombre, motivo, cambios: cambios.map(c => ({ k: c.r.campo.k, l: c.r.l, antes: String(c.antes ?? ''), nuevo: String(c.nuevo) })) };
        A.pendiente({ id: 'pe' + Date.now(), para: ['alejandro'], tipo: 'info', titulo: 'Aprobar un cambio en las reglas de la nómina', sub: titulo + ' · lo propuso ' + S.usuario.nombre, de: S.usuario.nombre, edad: 'Ahora', abrir: clave });
        setTimeout(() => A.aviso('Propuesto. Le llegó a Alejandro para aprobarlo.'), 0);
      } };
  }
  const cierraProp = (clave, hecho) => { delete PROP[clave]; D.PENDIENTES.filter(p => p.abrir === clave && !p.hecho).forEach(p => { p.hecho = hecho; }); };
  ACC['regla-aprobar'] = clave => {
    const pr = PROP[clave]; if (!pr) return;
    A.pedirCodigo({ que: 'Cambio de «' + esc(pr.titulo) + '» que propuso ' + esc(pr.quien), det: pr.cambios.map(c => esc(c.l) + ': ' + esc(c.antes || '—') + ' → ' + esc(c.nuevo)).join('<br>') + '<br>Rige desde la próxima nómina.', boton: 'Aprobar el cambio' }).then(() => {
      const [tipo, id] = clave.split(':'); pr.cambios.forEach(c => APLICA[tipo](id, c.k, c.nuevo)); cierraProp(clave, 'Aprobado por ' + S.usuario.nombre);
      A.auditar({ modulo: 'Nómina · reglas', registro: pr.titulo, campo: 'cambio propuesto por ' + pr.quien, antes: 'por aprobar', despues: 'aprobado', motivo: pr.motivo });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Aprobado. Rige desde la próxima nómina.');
    }).catch(() => {});
  };
  ACC['regla-rechazar'] = clave => {
    const pr = PROP[clave]; if (!pr) return;
    A.pedirMotivo({ titulo: 'Rechazar el cambio', texto: 'Queda como estaba y ' + esc(pr.quien) + ' ve el motivo.', boton: 'Rechazar', tono: 'peligro' }).then(m => {
      cierraProp(clave, 'Rechazado por ' + S.usuario.nombre);
      A.auditar({ modulo: 'Nómina · reglas', registro: pr.titulo, campo: 'cambio propuesto por ' + pr.quien, antes: 'por aprobar', despues: 'rechazado', motivo: m });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Rechazado. Quedó como estaba.');
    }).catch(() => {});
  };
  // cada concepto dice si es salario y en qué aportes entra (guía laboral §2 y fiscal: las pensiones llevan el salario y todos los bonos)
  const claseConcepto = d => /^Salarial/.test(d) ? 'salario' : /^No salarial/.test(d) ? 'bono' : /^Descuento/.test(d) ? 'descuento' : 'clasificar';
  const ES_SALARIO = { salario: 'Sí', bono: 'No', descuento: 'No: es un descuento', clasificar: tag('Por clasificar con el abogado', 'aviso') };
  const APORTES = {
    salario: 'FAOV, INCES y pensiones; en el IVSS y el paro, con tope (pregunta 8 a Cecilia). También cuenta para prestaciones, vacaciones y utilidades.',
    bono: 'Solo las pensiones, que llevan todos los bonos. No cuenta para prestaciones ni vacaciones.',
    descuento: 'Ninguno: se resta de lo que se paga.',
    clasificar: 'Las pensiones siempre, porque llevan todos los bonos. Si el abogado dice que es salario, también FAOV, INCES, prestaciones, vacaciones y utilidades.',
  };
  FICHAS.concepto = i => {
    const c = D.PARAMS.conceptos[+i]; const k = claseConcepto(c[1]); const ult = c[0] === 'Premio del mes' ? D.NOMINA.corridas.find(x => x.tipo === 'premio') : null;
    return fichaRegla({ tipo: 'concepto', id: i, titulo: c[0], sub: 'Nómina › Reglas · concepto de pago', obj: { nombre: c[0], regla: c[1] },
      filas: [{ l: 'Nombre', v: esc(c[0]), campo: { k: 'nombre', tipo: 'texto' } }, { l: 'Regla', v: esc(c[1]), largo: true, campo: { k: 'regla', tipo: 'area' } }, { l: '¿Es salario?', v: ES_SALARIO[k] }, { l: 'En qué aportes entra', v: esc(A.paraCecilia(APORTES[k])), largo: true }, { l: 'En el recibo', v: k === 'descuento' ? 'En las deducciones, con su nombre' : 'En su propia línea' }],
      extra: ult ? [{ html: `<button class="enlace" data-abrir="corrida:${ult.id}">El último se pagó el ${esc(ult.fecha)}, en su propia corrida ${ic('derecha', 's')}</button>` }] : [],
      nota: k === 'clasificar' ? 'Lo que diga el abogado decide si cuenta para prestaciones, vacaciones y utilidades.' : '' });
  };
  FICHAS.turno = t => {
    const T = D.TURNOS[t]; const n = activos().filter(e => e.turno === t).length;
    return fichaRegla({ tipo: 'turno', id: t, titulo: t + ' · ' + T[0], sub: 'Nómina › Reglas · turno', obj: { nombre: T[0], horas: T[1] },
      filas: [{ l: 'Nombre', v: esc(T[0]), campo: { k: 'nombre', tipo: 'texto' } }, { l: 'Horario', v: esc(T[1]), largo: true, campo: { k: 'horas', tipo: 'texto' } }, { l: 'Recargo de noche', v: recargoNoche(t) }, { l: 'Lo tienen', v: n + ' de las ' + activos().length + ' personas que se muestran' }],
      nota: 'Cambiar un horario cambia los recargos de noche y el cartel de horario, que visa la Inspectoría.' });
  };
  FICHAS.feriado = i => {
    const f = D.PARAMS.feriados[+i]; const dm = [parseInt(f[0], 10), M.indexOf(String(f[0]).split(' ')[1])]; const temprano = /^(24|31) dic/.test(f[0]);
    return fichaRegla({ tipo: 'feriado', id: i, titulo: f[1], sub: 'Nómina › Reglas · feriado', obj: { fecha: f[0], nombre: f[1] },
      filas: [{ l: 'Fecha', v: esc(f[0]), campo: { k: 'fecha', tipo: 'texto' } }, { l: 'Nombre', v: esc(f[1]), campo: { k: 'nombre', tipo: 'texto' } }, { l: 'Quien trabaje', v: 'Cobra 50 % más del día, en su propia línea del recibo' + (temprano ? '; el día entero, aunque se cierre temprano' : ''), largo: true }],
      extra: puede('calendario') && dm[0] && dm[1] >= 0 ? [{ html: `<button class="enlace" data-abrir="agendadia:${dm[0]}-${dm[1]}">Verlo en el calendario ${ic('derecha', 's')}</button>` }] : [] });
  };
  // propinas: las reparten Jose o Andreina (queda «revisada») y se dan por pagadas con el visto final de Alejandro (29-ago)
  FICHAS.propina = id => {
    const p = D.PROPINAS.find(x => x.id === id);
    const pagada = p.estado === 'pagada', revisada = p.estado === 'revisada';
    const reparte = ['p', 'r'].includes(nivel('nomina')), visto = puede('nomina', 'aprobar');
    const acciones = [];
    if (p.estado === 'por_repartir' && reparte) acciones.push({ txt: 'Repartir', acc: 'propina-ok', arg: p.id, tono: 'pri', icono: 'check' });
    if (revisada && visto) acciones.push({ txt: 'Devolver para corregir', acc: 'propina-devolver', arg: p.id, tono: 'ghost' }, { txt: 'Dar el visto final', acc: 'propina-visto', arg: p.id, tono: 'pri', icono: 'candado' });
    return { titulo: 'Propinas · ' + p.semana, sub: 'Corrida de los lunes', mod: 'nomina', obj: p, registro: 'Propinas ' + p.semana, tags: [[A.estadoTag(p.estado).replace(/<[^>]+>/g, ''), pagada ? 'ok' : 'aviso']],
      aviso: p.estado === 'por_repartir' && visto ? `<p class="nota info">${ic('info', 's')}<span>La reparten Jose o Andreina. Después te llega para el visto final.</span></p>`
        : revisada && !visto ? `<p class="nota info">${ic('info', 's')}<span>La repartió ${esc(p.reparte || 'RRHH')}. Falta el visto final de Alejandro para darla por pagada.</span></p>` : '',
      bloques: [{ filas: [{ l: 'Pote', v: dinero(p.pote, 'usd'), campo: { k: 'pote', tipo: 'dinero', mon: 'usd', obligatorio: true } }, { l: 'Regla', v: esc(p.regla), largo: true }, { l: 'Personas', v: p.personas }, { l: 'Promedio por persona', v: dinero(p.pote / p.personas, 'usd') }, { l: 'La repartió', v: esc(p.reparte || 'Nadie todavía') }, { l: 'Visto final', v: esc(p.visto || (revisada ? 'Falta el de Alejandro' : '—')) }] },
        pagada ? { html: '<p class="muted">Lo repartido ya no se edita. Si hubo un error, se hace una corrida de reemplazo enlazada a esta.</p>' } : { oculto: true }],
      bloqueada: pagada || revisada, bloqueo: pagada ? 'Ya se repartió: no se edita. Se corrige con una corrida de reemplazo.' : 'Ya se repartió y espera el visto final: no se edita. Si hay un error, Alejandro la devuelve para corregir.',
      acciones };
  };
  const propina = id => D.PROPINAS.find(x => x.id === id);
  // al repartir le llega a Alejandro un pendiente para el visto final; se cierra con el visto o al devolverla
  const cierraPropina = (id, hecho) => D.PENDIENTES.filter(p => p.abrir === 'propina:' + id && !p.hecho).forEach(p => { p.hecho = hecho; });
  ACC['propina-ok'] = id => A.pedirCodigo((p => ({ que: 'Propinas de la semana del ' + esc(p.semana) + ' · ' + dinero(p.pote, 'usd') + ' entre ' + p.personas + ' personas', det: 'Después le llega a Alejandro para el visto final.', boton: 'Repartir ' + dinero(p.pote, 'usd') }))(propina(id))).then(() => {
    const p = propina(id); p.estado = 'revisada'; p.reparte = A.S.usuario.nombre;
    A.auditar({ modulo: 'Nómina', registro: 'Propinas ' + p.semana, campo: 'estado', antes: 'por repartir', despues: 'revisada' });
    A.pendiente({ id: 'pe' + Date.now(), para: ['alejandro'], tipo: 'info', titulo: 'Dar el visto final a las propinas', sub: 'Semana del ' + p.semana + ' · las repartió ' + p.reparte + ' · ' + dinero(p.pote, 'usd'), de: p.reparte, edad: 'Ahora', abrir: 'propina:' + p.id });
    A.pintarFicha(); A.pintarPagina(); A.aviso('Repartido. Le llegó a Alejandro para el visto final.');
  }).catch(() => {});
  ACC['propina-visto'] = id => A.pedirCodigo((p => ({ que: 'Visto final · propinas de la semana del ' + esc(p.semana) + ' · ' + dinero(p.pote, 'usd'), det: 'Las repartió ' + esc(p.reparte || 'RRHH') + '. Quedan pagadas.', boton: 'Dar el visto final' }))(propina(id))).then(() => { const p = propina(id); p.estado = 'pagada'; p.visto = A.S.usuario.nombre; cierraPropina(id, 'Visto final de ' + A.S.usuario.nombre); A.auditar({ modulo: 'Nómina', registro: 'Propinas ' + p.semana, campo: 'estado', antes: 'revisada', despues: 'pagada' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Visto final dado: quedó pagada. Los recibos quedan por firmar.'); }).catch(() => {});
  ACC['propina-devolver'] = id => A.pedirMotivo({ titulo: 'Devolver las propinas para corregir', texto: 'Vuelven a «por repartir» y quien las repartió ve el motivo.', boton: 'Devolver' }).then(m => { const p = propina(id); const quien = p.reparte; p.estado = 'por_repartir'; p.reparte = ''; cierraPropina(id, 'Devuelta para corregir por ' + A.S.usuario.nombre); A.auditar({ modulo: 'Nómina', registro: 'Propinas ' + p.semana, campo: 'estado', antes: 'revisada', despues: 'por repartir', motivo: m }); A.pintarFicha(); A.pintarPagina(); A.aviso('Devueltas' + (quien ? ' a ' + quien : '') + ' para corregir.'); }).catch(() => {});

  /* =============== PRÉSTAMOS Y DESCUENTOS =============== */
  // firma: el nombre del archivo de la autorización de descuento firmada (solo los préstamos; sin archivo, el préstamo queda «falta la firma»)
  // arranca sin persona, sin monto y sin cuotas: nada escogido sin que alguien lo escoja (desde la ficha de una persona, ella ya viene puesta)
  const prestVacio = () => ({ emp: '', tipo: 'prestamo', monto: '', cuotas: '', primera: '15 oct', desde: 'BVCA', motivo: '', firma: '' });
  const PR = { form: prestVacio(), hecho: false };
  // los pendientes de préstamos y adelantos: le llegan a quien aprueba y se cierran al aprobar o rechazar
  const pendPara = (nombre, x) => { const u = D.USUARIOS.find(v => v.nombre === nombre) || D.USUARIOS.find(v => v.rol === 'dueno'); A.pendiente({ id: 'pe' + Date.now() + Math.floor(Math.random() * 1000), para: [u.id], tipo: 'info', de: A.S.usuario.nombre, edad: 'Ahora', ...x }); };
  const cierraPend = (abrir, hecho) => D.PENDIENTES.filter(p => p.abrir === abrir && !p.hecho).forEach(p => { p.hecho = hecho; });
  // quién aprueba (quien prepara no aprueba): los préstamos, Alejandro · un adelanto hasta el límite de «Quién aprueba qué» ($ 60),
  // Jose, si lo anotó otra persona; si lo anota él o pasa del límite, Alejandro · el dueño aprueba al registrar
  const limAdelanto = () => D.LIMITES.find(l => l.id === 'l8') || { quien: 'Jose', hasta: 60, arriba: 'Alejandro' };
  const apruebaAdelanto = (monto, registro) => { const L = limAdelanto(); return monto <= L.hasta && registro !== L.quien ? L.quien : L.arriba; };
  const aprobadorDe = (tipo, monto) => puede('nomina', 'aprobar') ? '' : tipo === 'adelanto' ? apruebaAdelanto(monto, S.usuario.nombre) : 'Alejandro';
  // enviar a aprobar no pide código (no mueve plata); aprobar sí · un préstamo sin la autorización firmada sale igual y queda pendiente
  const textoEnviar = (tipo, monto, firma = true) => { const va = aprobadorDe(tipo, monto); if (tipo === 'prestamo' && !firma) return va ? 'Enviar sin la firma (queda pendiente)' : 'Aprobar sin la firma (queda pendiente)'; return va ? 'Enviar a ' + va + ' para aprobar' : 'Aprobar y registrar'; };
  // «Así quedaría»: la cuota más lo que ya se le descuenta en la quincena de la primera cuota, contra el tope (un tercio de lo que gana)
  // lo usan el formulario y la ficha del préstamo por aprobar: los montos los ve quien ve sueldos; los socios, solo la etiqueta
  function asiQuedaria(e, monto, n, primera) {
    const cuota = monto / n; const l = linea(e); const otros = l.de.filter(x => /préstamo|Adelanto/.test(x[0])).reduce((s2, x) => s2 + x[1], 0);
    const i0 = D.QUINCENAS.indexOf(primera); const fechas = i0 >= 0 ? D.QUINCENAS.slice(i0, i0 + n) : [];
    return { cuota, otros, gana: l.ta, tope: l.ta / 3, pasa: cuota + otros > l.ta / 3, fechas, n, primera };
  }
  const tagTope = x => x.pasa ? tag('Pasa el tope', 'alerta') : tag('Dentro del tope', 'ok');
  // conCuotas: la tira de cuotas (en la ficha ya está en su propio bloque, más abajo)
  const tiraAsi = x => `<div class="cuotas">${x.fechas.map((f, k) => `<span class="cuota ${k === 0 ? 'proxima' : 'pendiente'}"><i></i><small>${esc(f)}</small></span>`).join('')}${x.n > x.fechas.length ? '<span class="tenue">…</span>' : ''}</div>`;
  // en el formulario, quien pasa el tope puede subir las cuotas o bajar el monto; en la ficha, quien aprueba solo puede rechazarlo o aprobarlo
  // («Gana en la quincena» es el porqué del tope)
  const htmlAsi = (x, conCuotas = true, tipo = 'prestamo') => `${conCuotas ? tiraAsi(x) : ''}
    <dl class="kv"><div><dt>${x.n === 1 ? 'Se descuenta' : x.n + ' cuotas de'}</dt><dd>${dinero(x.cuota, 'usd')}</dd></div><div><dt>Termina</dt><dd>${esc(x.fechas[x.fechas.length - 1] || '—')}</dd></div><div><dt>Ya le descuentan el ${esc(x.primera)}</dt><dd>${x.otros ? dinero(x.otros, 'usd') : 'Nada'}</dd></div><div><dt>Gana en la quincena</dt><dd>${dinero(x.gana, 'usd')}</dd></div><div class="total"><dt><b>Total de descuentos de esa quincena</b></dt><dd>${dinero(x.cuota + x.otros, 'usd')} <small class="tenue">de un tope de ${dinero(x.tope, 'usd')}</small></dd></div></dl>
    ${x.pasa ? `<p class="chequeo alerta">${ic('alerta', 's')}<span>${conCuotas ? (tipo === 'adelanto' ? 'Pasa un tercio de lo que gana en la quincena. Baja el monto o anótalo como préstamo en cuotas.' : 'Pasa un tercio de lo que gana en la quincena. Sube el número de cuotas o baja el monto.') : tipo === 'adelanto' ? 'Pasa un tercio de lo que gana. Recházalo y pide un monto menor, o que lo anoten como préstamo en cuotas.' : 'Pasa un tercio de lo que gana. Recházalo y pide más cuotas, o apruébalo y corre una cuota después.'}</span></p>` : `<p class="chequeo ok">${ic('check', 's')}<span>Queda dentro del tope.</span></p>`}`;
  // la línea de lo que se firma con el código: «Préstamo a Kevin Torres · $ 200 en 4 cuotas · sale de BVCA»
  const firmaPrestamo = (e, monto, n, desde) => 'Préstamo a ' + esc(e.nombre) + ' · ' + dinero(monto, 'usd', 0) + (n > 1 ? ' en ' + n + ' cuotas' : ' en 1 cuota') + ' · sale de ' + A.cta(desde);
  const puedeAprobarAdelanto = a => a.estado === 'por_aprobar' && (puede('nomina', 'aprobar') || (S.usuario.nombre === apruebaAdelanto(a.monto, a.registro) && S.usuario.nombre !== a.registro));
  function cuotasDe(p) {
    const corr = p.corridaEn || []; const i0 = D.QUINCENAS.indexOf(p.inicio); const n = p.cuotas + corr.length; const out = [];
    for (let k = 0; k < n; k++) { const fecha = D.QUINCENAS[i0 + k] || '—'; out.push({ fecha, estado: corr.includes(fecha) ? 'corrida' : null }); }
    let pag = 0; out.forEach(c => { if (c.estado) return; if (pag < p.pagadas) { c.estado = 'pagada'; pag++; } else c.estado = 'pendiente'; });
    const prox = out.find(c => c.estado === 'pendiente'); if (prox && p.estado === 'activo') prox.estado = p.firmada ? 'proxima' : 'espera';
    return out;
  }
  const tiraCuotas = (p, mini = false) => `<div class="cuotas${mini ? ' mini' : ''}" role="img" aria-label="${p.pagadas} de ${p.cuotas} cuotas pagadas">${cuotasDe(p).map(c => `<span class="cuota ${c.estado}" title="${esc(c.fecha)}: ${c.estado === 'pagada' ? 'descontada' : c.estado === 'corrida' ? 'se corrió' : c.estado === 'proxima' ? 'la próxima' : c.estado === 'espera' ? 'en espera: falta la firma' : 'pendiente'}"><i></i>${mini ? '' : `<small>${esc(c.fecha)}</small>`}</span>`).join('')}</div>`;
  const finDe = p => { const c = cuotasDe(p); return c[c.length - 1].fecha; };
  PANT.prestamos = {
    titulo: 'Préstamos y descuentos', corto: 'Préstamos', tab: 'Préstamos', grupo: 'Recursos humanos', icono: 'prestamo', mod: 'nomina', visible: () => S.usuario.rol !== 'fiscal_externo', palabras: 'prestamo adelanto cuotas descuento',
    secciones: [['prestamos', 'Lista de préstamos', 'prestamo cuotas'], ['adelantos', 'Adelantos', 'adelanto'], ['consumos', 'Consumos del personal', 'comida pos'], ['descuentos', 'Lo que se descuenta el 15', 'descuentos tope']],
    cuenta: () => (puede('nomina', 'aprobar') ? D.PRESTAMOS.filter(p => p.estado === 'por_aprobar').length : 0) + D.ADELANTOS.filter(puedeAprobarAdelanto).length,
    // lo escrito se guarda en el equipo: al salir, arriba queda «Tienes un préstamo a medias de $ 200 para … · Seguir · Descartar» y, al seguir,
    // «Así quedaría» se vuelve a calcular con el monto y las cuotas escritos
    borradores: {
      nuevo: {
        tomar: () => { const f = { ...PR.form }; delete f.firmaUrl; return f; },
        poner: d => { PR.form = { ...prestVacio(), ...d }; PR.hecho = false; PR.nuevoId = null; },
        txt: d => { const n = leerNum(d.monto); const e = d.emp ? emp(d.emp) : null; return (d.tipo === 'adelanto' ? 'un adelanto a medias' : 'un préstamo a medias') + (n > 0 ? ' de ' + dinero(n, 'usd', Math.round(n * 100) % 100 ? 2 : 0) : '') + (e ? ' para ' + e.nombre : ''); },
        vacio: d => !d.emp && !String(d.monto || '').trim() && !d.cuotas && !String(d.motivo || '').trim() && !d.firma,
      },
    },
    // el préstamo nuevo es un formulario: la pestaña o el menú vuelven a la lista, y al salir se borra la confirmación
    // (así «Nuevo préstamo» abre siempre en blanco; el de la ficha de una persona la deja escogida a propósito)
    transitorias: ['nuevo'],
    alSalir: sub => { if (sub === 'nuevo') { PR.form = prestVacio(); PR.hecho = false; PR.nuevoId = null; } },
    alRepetir: sub => { if (sub !== 'nuevo' || !PR.hecho) return null; PR.form = prestVacio(); PR.hecho = false; PR.nuevoId = null; return '#pf-emp'; },
    render: (sub = 'prestamos') => {
      const g = !ve(); let cuerpo = '';
      const porCobrar = D.PRESTAMOS.filter(vivo).reduce((s2, p) => s2 + saldo(p), 0);
      const el15 = r2(D.PRESTAMOS.reduce((s2, p) => s2 + cuotaDel15(p), 0)); const sinFirma = D.PRESTAMOS.filter(p => p.estado === 'activo' && !p.firmada).length;
      if (sub === 'prestamos') {
        const filtro = A.filtroActual('vivos');
        const lista = D.PRESTAMOS.filter(p => filtro === 'todos' || (filtro === 'vivos' && (vivo(p) || p.estado === 'por_aprobar')) || (filtro === 'cerrados' && !vivo(p) && p.estado !== 'por_aprobar'));
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Prestado y por cobrar', valor: dinero(porCobrar, 'usd', 0), sub: D.PRESTAMOS.filter(vivo).length + ' préstamos vivos' })}${A.cifra({ etq: 'Se descuenta el 15 de octubre', valor: dinero(el15, 'usd', 0), sub: D.PRESTAMOS.filter(seDescuenta).length + ' cuotas' + (sinFirma ? ' · ' + sinFirma + ' en espera: falta la firma' : ''), ir: 'prestamos/descuentos', tono: sinFirma ? 'aviso' : '' })}${A.cifra({ etq: 'Sale de liquidaciones', valor: dinero(D.PRESTAMOS.filter(p => p.estado === 'en_liquidacion').reduce((s2, p) => s2 + saldo(p), 0), 'usd', 0), sub: 'de quien ya se fue', abrir: 'liquidacion:lq1' })}${A.cifra({ etq: 'Por aprobar', valor: D.PRESTAMOS.filter(p => p.estado === 'por_aprobar').length, sub: 'los aprueba Alejandro', tono: D.PRESTAMOS.some(p => p.estado === 'por_aprobar') ? 'aviso' : '', abrir: !g && (D.PRESTAMOS.find(p => p.estado === 'por_aprobar') || {}).id ? 'prestamo:' + D.PRESTAMOS.find(p => p.estado === 'por_aprobar').id : '' })}</div>
          ${g ? notaAgrupada('Ves los totales. El detalle por persona lo ven el dueño, RRHH y contabilidad.') : `${A.filtros('t-pres', [['vivos', 'Vivos', D.PRESTAMOS.filter(p => vivo(p) || p.estado === 'por_aprobar').length], ['cerrados', 'Pagados o cerrados', D.PRESTAMOS.filter(p => !vivo(p) && p.estado !== 'por_aprobar').length], ['todos', 'Todos', D.PRESTAMOS.length]], filtro, 'Buscar persona o motivo')}
          ${A.tabla({ id: 't-pres', cols: [{ t: 'Persona', cls: 'p' }, { t: 'Prestado', cls: 'r x plata' }, { t: 'Cuotas', cls: 'x' }, { t: 'Cuota', cls: 'r x plata' }, { t: 'Debe', cls: 'r plata' }, { t: 'Estado', cls: 'e' }],
            filas: lista.map(p => ({ abrir: 'prestamo:' + p.id, clase: ['rechazado', 'perdonado'].includes(p.estado) ? 'tenue' : '', celdas: [`<b>${esc(emp(p.emp).nombre)}</b><small>${esc(p.motivo)}</small>`, dinero(p.monto, 'usd', 0), tiraCuotas(p, true) + `<small class="tenue">${p.pagadas} de ${p.cuotas} · termina el ${esc(finDe(p))}</small>`, dinero(p.cuota, 'usd', 0), vivo(p) || p.estado === 'por_aprobar' ? dinero(saldo(p), 'usd', 0) : '—', A.estadoTag(p.estado)] })) })}`}
          <p class="muted">Sin intereses. Cada préstamo lleva la autorización de descuento firmada por la persona. Sale de una cuenta del negocio como pago al personal y se descuenta solo en cada quincena.</p>`;
      }
      if (sub === 'nuevo') {
        const F = PR.form; const e = emp(F.emp);
        cuerpo = !puede('nomina', 'editar') ? A.lectura('nomina') : PR.hecho
          ? `<div class="pila" style="max-width:640px"><div class="hecho-caja">${ic('check')}<span>${PR.hecho}</span></div><div class="fila-btns"><button class="btn sec" data-acc="prest-volver">Volver a los préstamos</button><button class="btn sec" data-acc="prest-nuevo">Registrar otro</button>${PR.nuevoId ? `<button class="btn pri" data-abrir="prestamo:${PR.nuevoId}">Abrir el préstamo</button>` : ''}</div></div>`
          : `<div class="rejilla" data-form="prestamo"><div class="c6 pila"><article class="hoja form"><h2>${F.tipo === 'adelanto' ? 'Adelanto de quincena' : 'Préstamo'}</h2>
              ${A.opciones({ etiqueta: 'Tipo', actual: F.tipo, items: [{ k: 'prestamo', t: 'Préstamo en cuotas', sub: 'Se descuenta en cuotas, una cada quincena' }, { k: 'adelanto', t: 'Adelanto de quincena', sub: 'Se descuenta completo en la quincena siguiente' }].map(o => ({ ...o, attrs: `data-acc="prest-tipo" data-arg="${o.k}"` })) })}
              <div class="campos">
                <label class="campo ancho"><span>Persona</span><select id="pf-emp" data-pf="emp"><option value=""${F.emp ? '' : ' selected'}>Elige la persona</option>${activos().map(x => `<option value="${x.id}"${x.id === F.emp ? ' selected' : ''}>${esc(x.nombre)} · ${esc(x.cargo)}</option>`).join('')}</select></label>
                <label class="campo"><span>Monto ($)</span><input id="pf-monto" data-pf="monto" inputmode="decimal" value="${esc(F.monto)}" autocomplete="off" placeholder="¿Cuánto?"></label>
                ${F.tipo === 'prestamo' ? `<label class="campo"><span>Cuotas</span><select id="pf-cuotas" data-pf="cuotas"><option value=""${F.cuotas ? '' : ' selected'}>¿Cuántas?</option>${[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n2 => `<option${String(n2) === F.cuotas ? ' selected' : ''}>${n2}</option>`).join('')}</select></label>
                <label class="campo"><span>Primera cuota</span><select id="pf-primera" data-pf="primera">${['15 oct', '31 oct', '15 nov'].map(q => `<option${q === F.primera ? ' selected' : ''}>${q}</option>`).join('')}</select></label>` : `<label class="campo"><span>Se descuenta</span><select id="pf-primera" data-pf="primera">${['15 oct', '31 oct'].map(q => `<option${q === F.primera ? ' selected' : ''}>${q}</option>`).join('')}</select></label>`}
                <label class="campo"><span>Sale de</span><select id="pf-desde" data-pf="desde">${['BVCA', 'BVCJ', 'BVCE', 'BNC', 'Bóveda', 'Caja chica'].map(c => `<option${c === F.desde ? ' selected' : ''}>${c}</option>`).join('')}</select></label>
                <label class="campo ancho"><span>Para qué</span><input id="pf-motivo" data-pf="motivo" value="${esc(F.motivo)}" placeholder="Lo que dijo la persona" autocomplete="off"></label>
              </div></article>
              ${F.tipo === 'prestamo' ? `<div class="campo soltar-env"><label class="soltar${F.firma ? ' lista con-mini' : ''}" for="pf-firma">${F.firma ? A.miniHtml(F.firma, F.firmaUrl || '', F.firmaImg !== false) : `${ic('camara')}<span><b>Autorización de descuento firmada (opcional)</b>Sin ella no se descuenta ninguna cuota. Si no la tienes ahora, el préstamo sale igual y queda pendiente.</span>`}</label><input id="pf-firma" type="file" accept="image/*,application/pdf" class="sr-only"></div>` : ''}</div>
            <div class="c6 pila"><article class="hoja" id="pf-vista"></article>
              <button class="btn pri full" data-acc="prest-enviar">${ic(puede('nomina', 'aprobar') ? 'candado' : 'enviar', 's')}<span id="pf-enviar-txt">${esc(textoEnviar(F.tipo, leerNum(F.monto) || 0, !!F.firma))}</span></button>
              <p class="muted" style="text-align:center">${puede('nomina', 'aprobar') ? 'Te pedirá tu código de 6 dígitos.' : (F.tipo === 'adelanto' ? (L => `Hasta ${dinero(L.hasta, 'usd', 0)} lo aprueba ${esc(L.quien)} si lo anota otra persona; si no, ${esc(L.arriba)}.`)(limAdelanto()) : 'Los préstamos los aprueba Alejandro con su código.') + (puede('nomina', 'aprobar') ? '' : ' Enviarlo no pide código: la plata no sale hasta que lo aprueben.')}</p>
              <button class="btn ghost" data-acc="prest-volver">${ic('atras', 's')}Volver</button></div></div>`;
        void e;
      }
      if (sub === 'adelantos') cuerpo = g ? notaAgrupada('Ves los totales: ' + D.ADELANTOS.filter(a => a.estado === 'por_descontar').length + ' adelantos por descontar el 15.') : `<p class="desc">Plata que se le adelanta a alguien de su próxima quincena. Se descuenta completa en esa quincena. Quien lo anota no lo aprueba.</p>
        ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Sale de', cls: 'x' }, { t: 'Lo anotó', cls: 'x' }, { t: 'Lo aprobó', cls: 'x' }, { t: 'Monto', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: D.ADELANTOS.map(a => ({ abrir: 'adelanto:' + a.id, celdas: [`<b>${esc(emp(a.emp).nombre)}</b><small>${esc(a.fecha)} · ${esc(a.motivo)} · se descuenta el ${esc(a.descuenta)}</small>`, esc(a.desde), esc(a.registro || '—'), a.aprobo ? esc(a.aprobo) : a.estado === 'por_aprobar' ? '<span class="tenue">Le toca a ' + esc(apruebaAdelanto(a.monto, a.registro)) + '</span>' : '—', dinero(a.monto, 'usd', 0), A.estadoTag(a.estado)] })) })}
        ${A.boton('nomina', 'Nuevo adelanto', 'data-acc="prest-tipo" data-arg="adelanto-nuevo"', { tono: 'sec', icono: 'mas' })}`;
      if (sub === 'consumos') {
        const por = {}; D.CONSUMOEMP.forEach(c => { por[c.emp] = (por[c.emp] || 0) + c.monto; });
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Consumos del 28 sep al 27 oct', valor: dinero(D.CONSUMOEMP.reduce((s2, c) => s2 + c.monto, 0), 'usd'), sub: Object.keys(por).length + ' personas hasta hoy' })}${A.cifra({ etq: 'Se descuentan', valor: '31 oct', sub: 'con la 2.ª quincena (corte el 27)' })}${A.cifra({ etq: 'Cómo llegan', valor: 'Del POS', sub: 'la cajera usa «Consumo personal»' })}</div>
          ${g ? notaAgrupada('Ves el total. El detalle por persona lo ven el dueño, RRHH y contabilidad.') : A.tabla({ cols: [{ t: 'Consumo', cls: 'p' }, { t: 'Persona', cls: 'x' }, { t: 'Pedido', cls: 'x' }, { t: 'Monto', cls: 'r plata' }], filas: D.CONSUMOEMP.map(c => ({ abrir: 'consumoemp:' + c.id, celdas: [`<b>${esc(c.que)}</b><small>${esc(c.fecha)}</small>`, esc(emp(c.emp).nombre), esc(c.pedido), dinero(c.monto, 'usd')] })), pie: ['Total', '', '', dinero(D.CONSUMOEMP.reduce((s2, c) => s2 + c.monto, 0), 'usd')] })}
          <p class="nota info">${ic('info', 's')}<span>La comida del turno que da el negocio no se descuenta y no aparece aquí: se registra aparte para que el termómetro de la comida no la cuente como merma. Pendiente: cómo es hoy la comida del personal.</span></p>`;
      }
      if (sub === 'descuentos') {
        const filas = activos().map(e => { const l = linea(e); const pr = l.de.filter(x => /préstamo/.test(x[0])).reduce((s2, x) => s2 + x[1], 0), ad = l.de.filter(x => /Adelanto/.test(x[0])).reduce((s2, x) => s2 + x[1], 0), co = D.CONSUMOEMP.filter(c => c.emp === e.id).reduce((s2, c) => s2 + c.monto, 0); return { e, l, pr, ad, co }; }).filter(x => x.pr || x.ad || x.co);
        cuerpo = g ? notaAgrupada('Ves los totales: ' + dinero(el15, 'usd', 0) + ' en cuotas de préstamos el 15.') : `<p class="desc">Lo que se le descuenta a cada persona en la nómina del 15, comparado con un tercio de lo que gana (el tope propuesto). Los consumos se descuentan el 31.</p>
          ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Préstamo', cls: 'r plata' }, { t: 'Adelanto', cls: 'r x plata' }, { t: 'Consumo (el 31)', cls: 'r x plata' }, { t: 'Tope (1/3)', cls: 'r x plata' }, { t: '', cls: 'e' }],
            filas: filas.map(({ e, l, pr, ad, co }) => ({ abrir: 'recibo:' + e.id, celdas: [`<b>${esc(e.nombre)}</b><small>Gana ${dinero(l.ta, 'usd')} en la quincena</small>`, pr ? dinero(pr, 'usd') : '—', ad ? dinero(ad, 'usd') : '—', co ? dinero(co, 'usd') : '—', dinero(l.ta / 3, 'usd'), l.tope ? tag('Pasa el tope', 'alerta') : tag('Dentro del tope', 'ok')] })),
            pie: ['Total', dinero(filas.reduce((s2, x) => s2 + x.pr, 0), 'usd'), dinero(filas.reduce((s2, x) => s2 + x.ad, 0), 'usd'), dinero(filas.reduce((s2, x) => s2 + x.co, 0), 'usd'), '', ''] })}
          <p class="nota aviso">${ic('info', 's')}<span><b>Por confirmar con Cecilia o el abogado:</b> cuánto se puede descontar como máximo en una quincena. Si un descuento pasa el tope, la app propone correr esa cuota al final.</span></p>`;
      }
      return `<div class="pagina">${A.cab('Recursos humanos', 'Préstamos y descuentos', 'Lo que se le presta o adelanta a cada persona y lo que se le descuenta en cada quincena. El saldo siempre está a la vista y, si alguien se va, sale de su liquidación.', sub !== 'nuevo' ? A.boton('nomina', 'Nuevo préstamo', 'data-sub="nuevo"', { icono: 'mas' }) : '')}
        ${sub === 'nuevo' ? '' : A.subnav([['prestamos', 'Préstamos', D.PRESTAMOS.filter(p => p.estado === 'por_aprobar').length], ['adelantos', 'Adelantos', D.ADELANTOS.filter(a => a.estado === 'por_aprobar').length],['consumos', 'Consumos del personal'], ['descuentos', 'Lo que se descuenta el 15']], sub)}${cuerpo}</div>`;
    },
    montar: (raiz, sub) => {
      if (sub !== 'nuevo' || PR.hecho || !puede('nomina', 'editar')) return;
      const pintar = () => {
        const F = PR.form; const e = emp(F.emp); const monto = leerNum(F.monto) || 0; const n = F.tipo === 'adelanto' ? 1 : +F.cuotas;
        const v = $('#pf-vista', raiz); if (!v) return;
        const bt = $('#pf-enviar-txt', raiz); if (bt) bt.textContent = textoEnviar(F.tipo, monto, !!F.firma); // el monto decide si va a Jose o a Alejandro
        // «Así quedaría» espera a que haya persona, monto y cuotas: mientras tanto dice lo que falta
        const faltan = faltaPrest(F);
        if (faltan.length) { v.innerHTML = `<div class="hoja-cab"><h2>Así quedaría</h2></div><p class="muted">Falta ${esc(y(faltan))}. Con eso se ve la cuota contra lo que gana en la quincena.</p>`; return; }
        const x = asiQuedaria(e, monto, n, F.primera); const vivos = D.PRESTAMOS.filter(p => p.emp === e.id && vivo(p));
        v.innerHTML = `<div class="hoja-cab"><h2>Así quedaría</h2>${tagTope(x)}</div>${htmlAsi(x, true, F.tipo)}
          ${e.prueba ? `<p class="chequeo alerta">${ic('reloj', 's')}<span>Está en período de prueba hasta el ${fdl(e.prueba)}.</span></p>` : ''}
          ${vivos.length ? `<p class="chequeo aviso">${ic('prestamo', 's')}<span>Ya tiene ${vivos.length === 1 ? 'un préstamo' : vivos.length + ' préstamos'}: debe ${dinero(vivos.reduce((s2, p) => s2 + saldo(p), 0), 'usd', 0)}.</span></p>` : ''}`;
      };
      raiz.querySelectorAll('[data-pf]').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { PR.form[el.dataset.pf] = el.value; pintar(); }));
      // la autorización firmada: solo cuenta si se sube un archivo (el botón deja de decir «sin la firma»)
      const fi = $('#pf-firma', raiz); if (fi) fi.addEventListener('change', () => { if (!fi.files.length) return; const fl = fi.files[0]; Object.assign(PR.form, { firma: fl.name, firmaUrl: A.urlDe(fl), firmaImg: /^image\//.test(fl.type || '') }); A.pintarPagina(); A.aviso('Autorización lista: ' + PR.form.firma + '.'); });
      pintar();
    },
  };
  // lo que falta para enviar (y para ver «Así quedaría»): la persona, el monto y, en un préstamo, las cuotas
  const faltaPrest = F => [!F.emp ? 'la persona' : '', !(leerNum(F.monto) > 0) ? 'el monto' : '', F.tipo === 'prestamo' && !(+F.cuotas > 0) ? 'cuántas cuotas' : ''].filter(Boolean);
  const y = xs => xs.join(', ').replace(/, ([^,]*)$/, ' y $1');
  // «Registrar otro» y «Nuevo adelanto» también abren en blanco (el adelanto, ya marcado como adelanto)
  ACC['prest-nuevo'] = () => { PR.form = prestVacio(); PR.hecho = false; PR.nuevoId = null; A.ir('prestamos/nuevo'); };
  ACC['prest-tipo'] = t => { if (t === 'adelanto-nuevo') { PR.form = { ...prestVacio(), tipo: 'adelanto' }; PR.hecho = false; PR.nuevoId = null; A.ir('prestamos/nuevo'); return; } PR.form.tipo = t; if (t === 'adelanto' && (leerNum(PR.form.monto) || 0) > 100) PR.form.monto = '50'; A.pintarPagina(); };
  // «Volver»: lo escrito queda en su borrador (arriba, «Tienes un préstamo a medias») y, si la lista era la pantalla de antes, es un paso atrás
  ACC['prest-volver'] = () => { PR.hecho = false; PR.nuevoId = null; A.volverAtras('prestamos/prestamos'); };
  ACC['prest-enviar'] = () => {
    const F = PR.form; const monto = leerNum(F.monto) || 0; const e = emp(F.emp);
    // lo que falta, debajo de su campo (a quién, cuánto, en cuántas cuotas y para qué); la pantalla baja al primero y el cursor queda ahí
    if (A.faltan($('#main'), [[!F.emp, 'pf-emp', 'Elige a quién se le presta.'], [monto <= 0, 'pf-monto', 'Escribe el monto.'], [F.tipo === 'prestamo' && !(+F.cuotas > 0), 'pf-cuotas', 'Elige en cuántas cuotas.'], [F.motivo.trim().length < 3, 'pf-motivo', 'Escribe para qué es: queda en la ficha del préstamo.']])) return;
    const va = aprobadorDe(F.tipo, monto); const aprueba = !va; const n = F.tipo === 'adelanto' ? 1 : +F.cuotas; const firmada = !!F.firma;
    const registrar = () => {
      if (F.tipo === 'adelanto') {
        const id = 'ad' + (D.ADELANTOS.length + 1); D.ADELANTOS.unshift({ id, emp: e.id, monto, fecha: 'Hoy', descuenta: F.primera, motivo: F.motivo, registro: A.S.usuario.nombre, aprobo: aprueba ? A.S.usuario.nombre : '', desde: F.desde, estado: aprueba ? 'por_descontar' : 'por_aprobar' });
        // a quien lo aprueba le llega como pendiente, con la ficha del adelanto
        if (!aprueba) pendPara(va, { titulo: 'Aprobar un adelanto de ' + dinero(monto, 'usd', 0), sub: e.nombre + ' · se descuenta completo el ' + F.primera + ' · lo anotó ' + A.S.usuario.nombre, abrir: 'adelanto:' + id });
        PR.nuevoId = null; PR.hecho = aprueba ? `Adelanto de ${dinero(monto, 'usd', 0)} a ${esc(e.nombre)} registrado. Se descuenta completo el ${esc(F.primera)}.` : `Adelanto de ${dinero(monto, 'usd', 0)} a ${esc(e.nombre)} enviado a ${esc(va)} para aprobar: quien lo anota no lo aprueba. Cuando lo apruebe, se descuenta completo el ${esc(F.primera)}.`;
      } else {
        const id = 'pr' + (D.PRESTAMOS.length + 1);
        D.PRESTAMOS.unshift({ id, emp: e.id, monto, cuotas: n, cuota: Math.round(monto / n * 100) / 100, pagadas: 0, corridas: 0, inicio: F.primera, fecha: 'Hoy', motivo: F.motivo, desde: F.desde, aprobo: aprueba ? A.S.usuario.nombre : '', registro: A.S.usuario.nombre, firmada, firmaArchivo: F.firma || '', estado: aprueba ? 'aprobada' : 'por_aprobar' });
        // «Le llegó como pendiente»: de verdad le llega a Alejandro, con la ficha del préstamo
        if (!aprueba) pendPara(va, { titulo: 'Aprobar un préstamo de ' + dinero(monto, 'usd', 0), sub: e.nombre + ' · ' + n + (n === 1 ? ' cuota de ' : ' cuotas de ') + dinero(monto / n, 'usd') + (e.prueba ? ' · está en período de prueba' : '') + (firmada ? '' : ' · falta la firma'), abrir: 'prestamo:' + id });
        const sinFirma = firmada ? '' : ' Falta subir la autorización firmada: sin ella no se descuenta.';
        PR.nuevoId = id; PR.hecho = (aprueba ? `Préstamo aprobado. Falta pagarlo desde ${esc(F.desde)} y subir el comprobante; la primera cuota se descuenta el ${esc(F.primera)}.` : `Préstamo enviado a Alejandro. Le llegó como pendiente; cuando lo apruebe, se paga y empiezan las cuotas el ${esc(F.primera)}.`) + sinFirma;
      }
      A.auditar({ modulo: 'Préstamos', registro: (F.tipo === 'adelanto' ? 'Adelanto ' : 'Préstamo ') + e.nombre, campo: 'creado', despues: dinero(monto, 'usd', 0), motivo: F.motivo });
      A.pintarPagina();
    };
    // el código va donde se compromete la plata: quien solo lo manda a aprobar no firma nada
    if (!aprueba) { registrar(); return; }
    A.pedirCodigo(F.tipo === 'adelanto'
      ? { que: 'Adelanto a ' + esc(e.nombre) + ' · ' + dinero(monto, 'usd', 0) + ' · sale de ' + A.cta(F.desde), det: 'Se descuenta completo el ' + esc(F.primera) + '.', boton: 'Aprobar ' + dinero(monto, 'usd', 0) }
      : { que: firmaPrestamo(e, monto, n, F.desde), det: 'Cuotas de ' + dinero(monto / n, 'usd') + ' desde el ' + esc(F.primera) + '.' + (firmada ? '' : ' Falta la autorización firmada: queda pendiente.'), boton: 'Aprobar ' + dinero(monto, 'usd', 0) }).then(registrar).catch(() => {});
  };
  FICHAS.prestamo = id => {
    const p = D.PRESTAMOS.find(x => x.id === id); const e = emp(p.emp); const ap = puede('nomina', 'aprobar');
    const porAprobar = p.estado === 'por_aprobar'; const asi = porAprobar ? asiQuedaria(e, p.monto, p.cuotas, p.inicio) : null;
    // quien ve la nómina agrupada (Luis, Eliana) solo ve el estado (y, si está por aprobar, si la cuota cabe en su quincena, sin montos):
    // el detalle por persona es del dueño, RRHH y contabilidad
    if (!ve()) return { titulo: 'Préstamo de ' + e.nombre, sub: 'Préstamos y descuentos', mod: 'nomina', obj: { estado: p.estado }, tags: [[A.estadoTag(p.estado).replace(/<[^>]+>/g, ''), porAprobar ? 'aviso' : p.estado === 'activo' ? 'ok' : '']],
      bloques: [{ filas: [{ l: 'Estado', v: A.estadoTag(p.estado) }, ...(asi ? [{ l: 'La cuota en su quincena', v: tagTope(asi) }] : [])] }, { html: '<p class="muted">El detalle lo ven el dueño, RRHH y contabilidad.</p>' }] };
    const acc = [];
    if (p.estado === 'por_aprobar' && ap) acc.push({ txt: 'Rechazar', acc: 'prest-rechazar', tono: 'ghost' }, { txt: 'Aprobar', acc: 'prest-aprobar', tono: 'pri', icono: 'candado' });
    if (p.estado === 'aprobada' && puede('nomina', 'editar')) acc.push({ txt: 'Registrar el pago', acc: 'prest-pagar', tono: 'pri', icono: 'enviar' });
    if (p.estado === 'activo' && puede('nomina', 'editar')) acc.push({ txt: 'Pagó por adelantado', acc: 'prest-abono', icono: 'mas' }, { txt: 'Correr una cuota', acc: 'prest-correr', icono: 'calendario' });
    if (p.estado === 'activo' && ap) acc.push({ txt: 'Perdonar el saldo', acc: 'prest-perdonar', tono: 'ghost' });
    // la plata sale cuando se paga: mientras está por aprobar o aprobado, la ficha dice de dónde «saldrá»
    const sinPagar = ['por_aprobar', 'aprobada'].includes(p.estado);
    const salida = sinPagar ? { l: 'Saldrá de', v: `${A.cta(p.desde)} <small class="tenue">cuando se pague</small>` } : p.estado === 'rechazado' ? { l: 'Iba a salir de', v: `${A.cta(p.desde)} <small class="tenue">no salió: se rechazó</small>` } : { l: 'Salió de', v: `${A.cta(p.desde)} · ${esc(p.pagado || p.fecha)}` };
    // la firma importa mientras se descuenta: un préstamo rechazado, pagado o perdonado ya no la pide
    const faltaFirma = !p.firmada && !['rechazado', 'pagada', 'perdonado'].includes(p.estado); const subeFirma = faltaFirma && puede('nomina', 'editar');
    return { titulo: 'Préstamo de ' + e.nombre, sub: dinero(p.monto, 'usd', 0) + ' · ' + p.cuotas + (p.cuotas === 1 ? ' cuota' : ' cuotas de ') + (p.cuotas === 1 ? '' : dinero(p.cuota, 'usd')), mod: 'nomina', sensible: 'sueldos', obj: p, registro: 'Préstamo ' + e.nombre,
      tags: [[A.estadoTag(p.estado).replace(/<[^>]+>/g, ''), porAprobar ? 'aviso' : p.estado === 'activo' ? 'ok' : ''], ...(faltaFirma ? [['Falta la firma', 'aviso']] : [])],
      aviso: (porAprobar ? `<p class="nota info">${ic('info', 's')}<span>Lo registró ${esc(p.registro)} hoy. ${ap ? 'Falta tu aprobación con código.' : 'Falta la aprobación de Alejandro.'}</span></p>` : '')
        // sin prueba no hay «firmado»: el aviso sale arriba, con su botón para subirla
        + (!faltaFirma ? '' : `<p class="nota alerta">${ic('alerta', 's')}<span><b>Falta la autorización firmada.</b> Sin ella no se descuenta ninguna cuota: ${p.estado === 'activo' ? 'la próxima queda en espera hasta que se suba.' : 'empiezan cuando se suba.'}${subeFirma ? ` <button class="enlace" data-acc="subir-firma" data-arg="${p.id}">${ic('camara', 's')}Subirla</button>` : ''}</span></p>`)
        + (e.prueba && porAprobar ? `<p class="nota aviso">${ic('reloj', 's')}<span>${esc(e.nombre)} está en período de prueba hasta el ${fdl(e.prueba)}. Si no se queda, el saldo sale de lo que se le pague al salir.</span></p>` : '')
        + (p.estado === 'en_liquidacion' ? `<p class="nota aviso">${ic('salir', 's')}<span>${esc(e.nombre)} ya no trabaja aquí. Los ${dinero(saldo(p), 'usd', 0)} que faltan se descuentan de su liquidación. <button class="enlace" data-abrir="liquidacion:lq1">Ver la liquidación</button></span></p>` : '')
        + (p.nota ? `<p class="nota aviso">${ic('calendario', 's')}<span>${esc(p.nota)}</span></p>` : ''),
      // por aprobar: arriba, si la cuota cabe en su quincena, con lo que ya se le descuenta ese día (lo que Jose ve en su formulario)
      bloques: [asi ? { titulo: 'Así quedaría', extra: tagTope(asi), html: `<div class="asi-quedaria">${htmlAsi(asi, false)}</div>` } : { oculto: true },
        { titulo: 'Cuotas', html: tiraCuotas(p) + `<p class="leyenda cuotas-ley"><span><i class="cl pagada"></i>Descontada</span><span><i class="cl proxima"></i>La próxima</span><span><i class="cl corrida"></i>Se corrió</span><span><i class="cl pendiente"></i>Pendiente</span>${!p.firmada && p.estado === 'activo' ? '<span><i class="cl espera"></i>En espera: falta la firma</span>' : ''}</p>` },
        { titulo: 'Préstamo', filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${e.id}">${esc(e.nombre)}</button>` }, { l: 'Para qué', v: esc(p.motivo), campo: { k: 'motivo', tipo: 'texto' } }, { l: 'Prestado', v: dinero(p.monto, 'usd', 0) }, { l: 'Pagado', v: dinero(r2(p.pagadas * p.cuota + (p.abonado || 0)), 'usd', p.abonado ? 2 : 0) + (p.abonado ? ` <small class="tenue">${dinero(p.abonado, 'usd')} abonados a la próxima cuota</small>` : '') }, { l: 'Debe', v: '<b>' + dinero(saldo(p), 'usd', 0) + '</b>' }, { l: 'Termina', v: esc(finDe(p)) }, salida, { l: 'Lo registró', v: esc(p.registro) }, { l: 'Lo aprobó', v: esc(p.aprobo || 'Nadie todavía') }] },
        p.firmada ? { titulo: 'Autorización de descuento', adjuntos: [p.firmaArchivo || 'Autorización firmada · ' + e.nombre + '.jpg'] } : { titulo: 'Autorización de descuento', html: `<p class="muted">Falta la autorización firmada por ${esc(e.nombre)}.</p>${subeFirma ? `<label class="soltar" for="aut-${p.id}">${ic('camara')}<span><b>Subir la autorización firmada</b>Foto o PDF. Al subirla, ya se puede descontar.</span></label><input id="aut-${p.id}" data-firma-prest="${p.id}" type="file" accept="image/*,application/pdf" class="sr-only">` : ''}` },
        { titulo: 'Historial', tiempo: [[esc(p.fecha), 'Lo registró ' + esc(p.registro) + '.'], ...(p.aprobo ? [[esc(p.fecha), 'Lo aprobó ' + esc(p.aprobo) + ' con su código.']] : []), ...cuotasDe(p).filter(c => c.estado === 'pagada').map(c => [esc(c.fecha), 'Cuota descontada en la nómina.', 'ok']), ...(p.abonos || []).map(x => [esc(x.fecha), 'Pagó ' + abonoTxt(x) + ' por adelantado · entró a ' + esc(x.a) + ' · lo anotó ' + esc(x.quien) + '.', 'ok'])] },
        p.abonos && p.abonos.length ? { titulo: 'Comprobantes de lo que pagó por adelantado', adjuntos: p.abonos.map(x => x.foto) } : { oculto: true }],
      acciones: acc };
  };
  // aprobado o rechazado, su pendiente «Aprobar un préstamo…» queda resuelto (la campana baja)
  const cambiaPrest = (id, est, txt, motivo = '') => { const p = D.PRESTAMOS.find(x => x.id === id); const antes = p.estado; p.estado = est; if (est === 'aprobada') p.aprobo = A.S.usuario.nombre; if (est === 'activo' && antes === 'aprobada') p.pagado = 'Hoy'; if (antes === 'por_aprobar') cierraPend('prestamo:' + id, (est === 'rechazado' ? 'Lo rechazó ' : 'Lo aprobó ') + A.S.usuario.nombre); A.auditar({ modulo: 'Préstamos', registro: 'Préstamo ' + emp(p.emp).nombre, campo: 'estado', antes: A.estadoTxt(antes), despues: A.estadoTxt(est), motivo }); A.pintarFicha(); A.pintarPagina(); A.aviso(txt); };
  // la ventana del código dice qué se aprueba: «Préstamo a Kevin Torres · $ 200 en 4 cuotas · sale de BVCA» con «Aprobar $ 200»
  ACC['prest-aprobar'] = id => {
    const p = D.PRESTAMOS.find(x => x.id === id); const e = emp(p.emp); const x = asiQuedaria(e, p.monto, p.cuotas, p.inicio);
    A.pedirCodigo({ que: firmaPrestamo(e, p.monto, p.cuotas, p.desde), det: (x.pasa ? 'Ojo: pasa el tope de su quincena.' : 'La cuota cabe en su quincena.') + (p.firmada ? '' : ' Falta la autorización firmada.'), boton: 'Aprobar ' + dinero(p.monto, 'usd', 0) })
      .then(() => cambiaPrest(id, 'aprobada', 'Aprobado. Jose lo paga y sube el comprobante; la primera cuota se descuenta sola.')).catch(() => {});
  };
  ACC['prest-rechazar'] = id => A.pedirMotivo({ titulo: 'Rechazar el préstamo', texto: 'La persona y quien lo registró ven el motivo.', boton: 'Rechazar', tono: 'peligro' }).then(m => cambiaPrest(id, 'rechazado', 'Rechazado. Se le avisó a quien lo registró.', m)).catch(() => {});
  ACC['prest-pagar'] = id => {
    const p = D.PRESTAMOS.find(x => x.id === id); const e = emp(p.emp);
    A.pedirCodigo({ que: 'Pago del préstamo a ' + esc(e.nombre) + ' · ' + dinero(p.monto, 'usd', 0) + ' · sale de ' + A.cta(p.desde), det: 'Sube después el comprobante del pago.', boton: 'Registrar el pago de ' + dinero(p.monto, 'usd', 0) })
      .then(() => cambiaPrest(id, 'activo', 'Pago registrado. Las cuotas empiezan en la próxima quincena.')).catch(() => {});
  };
  // «Subirla» desde el aviso de arriba abre el mismo selector que la zona de la autorización
  ACC['subir-firma'] = id => { const inp = document.getElementById('aut-' + id); if (inp) inp.click(); };
  // pagó por adelantado: el monto viene con una cuota y se puede cambiar; a dónde entró (la Caja o una cuenta, con su resaltador) y la foto del
  // comprobante · lo que no llega a una cuota queda abonado a la próxima (se descuenta menos)
  // a dónde entró lo que pagó por adelantado: la Caja y el Zelle reciben dólares; las cuentas del banco, bolívares (con su ≈ $ a la tasa del día)
  const DESTINOS_ABONO = ['Caja', 'Zelle', 'BVCA', 'BVCE', 'BVCJ', 'BNC'];
  const enBs = a => !!a && a !== 'Caja' && a !== 'Zelle';
  const abonoTxt = x => (x.bs ? dinero(x.bs, 'bs') + ' (≈ ' + dinero(x.monto, 'usd') + ' a ' + fmt(x.tasa) + ')' : dinero(x.monto, 'usd'));
  const cuotasTxt = (p, n) => { if (!(n > 0)) return ''; const k = Math.floor((n + (p.abonado || 0) + 1e-9) / p.cuota); const resto = r2(n + (p.abonado || 0) - k * p.cuota);
    return n > saldo(p) + 0.005 ? '' : r2(n) === r2(saldo(p)) ? 'Paga todo lo que debe.' : (k ? (k === 1 ? 'Cubre 1 cuota' : 'Cubre ' + k + ' cuotas') : 'No llega a una cuota') + (resto > 0.005 ? '; ' + dinero(resto, 'usd') + ' se abonan a la próxima.' : '.'); };
  ACC['prest-abono'] = id => {
    const p = D.PRESTAMOS.find(x => x.id === id); const e = emp(p.emp); const debe = saldo(p); const env = $('#modal-raiz'); let a = ''; const tasa = D.TASA.usd;
    // primero a dónde entró: eso dice en qué moneda se escribe el monto (en bolívares, la app muestra su ≈ $ a la tasa de hoy)
    A.modal(`<h2 id="modal-t">Pagó por adelantado</h2><p class="muted" id="modal-d">${esc(e.nombre)} · debe ${dinero(debe, 'usd')} · cuotas de ${dinero(p.cuota, 'usd')}</p>
      <div class="form">
        <div class="campo" id="pa-a-campo"><span id="pa-a-t">¿A dónde entró?</span><div class="tres-botones" role="group" aria-labelledby="pa-a-t">${DESTINOS_ABONO.map(c => `<button type="button" class="btn sec" data-pa-a="${c}" aria-pressed="false">${c === 'Caja' ? 'Caja (efectivo)' : c === 'Zelle' ? 'Zelle' : A.cta(c)}</button>`).join('')}</div></div>
        <label class="campo" for="pa-monto"><span id="pa-monto-t">¿Cuánto pagó? ($)</span><input id="pa-monto" inputmode="decimal" value="${fmt(Math.min(r2(p.cuota - (p.abonado || 0)), debe))}" autocomplete="off" aria-describedby="pa-cuotas"><small class="ayuda" id="pa-cuotas"></small></label>
        <div class="campo soltar-env"><label class="soltar" for="pa-foto">${ic('camara')}<span><b>Foto del comprobante</b>El recibo de la caja o la captura del pago.</span></label><input id="pa-foto" type="file" accept="image/*,application/pdf" class="sr-only" data-mini></div>
      </div>
      <div class="modal-acc"><button class="btn sec" data-pa="no">Cancelar</button><button class="btn pri" data-pa="si">${ic('check', 's')}Anotar el pago</button></div>`, 'teclado');
    // lo escrito en dólares (o, si entró a una cuenta en bolívares, su equivalente a la tasa de hoy): con eso se cubren las cuotas
    const usdDe = () => { const x = leerNum($('#pa-monto').value); return x > 0 ? (enBs(a) ? r2(x / tasa) : x) : x; };
    const cuenta = () => { const x = leerNum($('#pa-monto').value); const n = usdDe(); $('#pa-cuotas').textContent = (enBs(a) && x > 0 ? '≈ ' + dinero(n, 'usd') + ' a la tasa de hoy (' + dinero(tasa, 'bs') + '). ' : '') + cuotasTxt(p, n); };
    $('#pa-monto').addEventListener('input', cuenta); cuenta(); env.querySelector('[data-pa-a]').focus();
    env.onclick = ev => {
      const db = ev.target.closest('[data-pa-a]');
      if (db) { const antes = enBs(a); a = db.dataset.paA; A.$$('[data-pa-a]', env).forEach(b => b.setAttribute('aria-pressed', String(b === db))); A.limpiarFaltas($('#pa-a-campo').parentElement);
        // al cambiar de moneda, el monto se pasa a la otra (los mismos dólares, en bolívares a la tasa de hoy, o al revés)
        const inp = $('#pa-monto'); const x = leerNum(inp.value); if (x > 0 && antes !== enBs(a)) inp.value = fmt(enBs(a) ? r2(x * tasa) : r2(x / tasa));
        $('#pa-monto-t').textContent = enBs(a) ? '¿Cuántos Bs entraron?' : '¿Cuánto pagó? ($)'; cuenta(); return; }
      const b = ev.target.closest('[data-pa]'); if (!b) return;
      if (b.dataset.pa === 'no') { A.cerrarModal(); return; }
      const x = leerNum($('#pa-monto').value); const n = usdDe(); const foto = $('#pa-foto').files[0];
      if (A.faltan(env, [[!a, 'pa-a-campo', 'Toca a dónde entró: la Caja, el Zelle o una cuenta.'], [!(x > 0), 'pa-monto', 'Escribe el monto.'], [n > debe + 0.005, 'pa-monto', 'Pasa lo que debe (' + dinero(debe, 'usd') + (enBs(a) ? ' ≈ ' + dinero(r2(debe * tasa), 'bs') : '') + ').'], [!foto, 'pa-foto', 'Falta la foto del comprobante.']])) return;
      A.cerrarModal();
      const antes = saldo(p); const total = r2(n + (p.abonado || 0)); const k = Math.min(p.cuotas - p.pagadas, Math.floor((total + 1e-9) / p.cuota));
      p.pagadas += k; p.abonado = r2(total - k * p.cuota); if (saldo(p) <= 0.005) { p.pagadas = p.cuotas; p.abonado = 0; p.estado = 'pagada'; }
      // en bolívares se guardan los Bs que entraron, los $ y la tasa: así casa con el estado de cuenta en la conciliación
      const ab = { monto: n, a, foto: foto.name, fecha: 'Hoy', quien: S.usuario.nombre, ...(enBs(a) ? { bs: r2(x), tasa } : {}) };
      p.abonos = (p.abonos || []).concat([ab]);
      A.auditar({ modulo: 'Préstamos', registro: 'Préstamo ' + e.nombre, campo: 'pago por adelantado', antes: 'debe ' + dinero(antes, 'usd'), despues: 'debe ' + dinero(saldo(p), 'usd'), motivo: abonoTxt(ab) + ' entró a ' + a + ' · comprobante ' + foto.name });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Pago anotado: ' + abonoTxt(ab) + ' entró a ' + a + '.' + (p.estado === 'pagada' ? ' El préstamo quedó pagado completo.' : ''));
    };
  };
  ACC['prest-correr'] = id => A.pedirMotivo({ titulo: 'Correr la próxima cuota al final', texto: 'La cuota de la próxima quincena se mueve al final del préstamo. Úsalo si la persona faltó o el descuento pasa el tope.', boton: 'Correr la cuota' }).then(m => { const p = D.PRESTAMOS.find(x => x.id === id); const antes = finDe(p); const c = cuotasDe(p).find(x => x.estado === 'proxima' || x.estado === 'pendiente'); if (!c) return; p.corridaEn = [...(p.corridaEn || []), c.fecha]; p.corridas = p.corridaEn.length; p.nota = 'La cuota del ' + c.fecha + ' se corrió al final: ' + m; A.auditar({ modulo: 'Préstamos', registro: 'Préstamo ' + emp(p.emp).nombre, campo: 'cuotas', antes: 'termina ' + antes, despues: 'termina ' + finDe(p), motivo: m }); A.pintarFicha(); A.pintarPagina(); A.aviso('Listo: ahora termina el ' + finDe(p) + '.'); }).catch(() => {});
  ACC['prest-perdonar'] = id => {
    const p = D.PRESTAMOS.find(x => x.id === id); const e = emp(p.emp); const s = saldo(p);
    A.pedirMotivo({ titulo: 'Perdonar el saldo', texto: 'Lo que falta se da por pagado y deja de descontarse. Queda registrado como un beneficio para la persona.', boton: 'Perdonar', tono: 'peligro', codigo: { que: 'Perdonar el saldo de ' + esc(e.nombre) + ' · ' + dinero(s, 'usd', 0), det: 'Deja de descontarse y queda como un beneficio para la persona.', boton: 'Perdonar ' + dinero(s, 'usd', 0), tono: 'peligro' } })
      .then(m => cambiaPrest(id, 'perdonado', 'Saldo perdonado.', m)).catch(() => {});
  };
  FICHAS.adelanto = id => {
    const a = D.ADELANTOS.find(x => x.id === id); const e = emp(a.emp);
    // por aprobar: arriba, si cabe en su quincena (se descuenta completo y cuenta para el mismo tope que las cuotas de los préstamos)
    const asi = a.estado === 'por_aprobar' ? asiQuedaria(e, a.monto, 1, a.descuenta) : null;
    if (!ve()) return { titulo: 'Adelanto de ' + e.nombre, sub: 'Préstamos y descuentos', mod: 'nomina', obj: { estado: a.estado }, bloques: [{ filas: [{ l: 'Estado', v: A.estadoTag(a.estado) }, ...(asi ? [{ l: 'En su quincena', v: tagTope(asi) }] : [])] }, { html: '<p class="muted">El detalle lo ven el dueño, RRHH y contabilidad.</p>' }] };
    const toca = a.estado === 'por_aprobar' ? apruebaAdelanto(a.monto, a.registro) : ''; const mio = puedeAprobarAdelanto(a);
    // quien prepara no aprueba: mientras está por aprobar solo lo corrige quien lo anotó (al cambiar el monto se recalcula a quién le toca);
    // aprobado, descontado, rechazado o anulado ya no se edita: si el monto de uno aprobado no es, se anula con motivo y se anota otro, que vuelve a aprobarse
    const bloqueo = a.estado === 'por_aprobar' ? (S.usuario.nombre === a.registro ? '' : 'Lo corrige quien lo anotó (' + (a.registro || '—') + '). Si el monto no es ese, recházalo.')
      : { descontada: 'Ya se descontó: no se edita.', rechazado: 'Está rechazado: no se edita.', anulada: 'Está anulado: no se edita.' }[a.estado] || 'Ya está aprobado: no se edita. Si cambió el monto, se anula y se anota otro, que vuelve a aprobarse.';
    return { titulo: 'Adelanto de ' + e.nombre, sub: esc(a.fecha) + ' · ' + dinero(a.monto, 'usd', 0), mod: 'nomina', sensible: 'sueldos', obj: a, registro: 'Adelanto ' + e.nombre, bloqueada: !!bloqueo, bloqueo, anulable: a.estado === 'por_descontar',
      aviso: toca ? `<p class="nota info">${ic('info', 's')}<span>Lo anotó ${esc(a.registro || '—')}. ${mio ? 'Falta tu aprobación con código.' : 'Le toca aprobarlo a ' + esc(toca) + ': quien lo anota no lo aprueba.'}</span></p>` : '',
      // la plata sale cuando se aprueba: mientras tanto, «Saldrá de»; rechazado, «Iba a salir de»
      bloques: [asi ? { titulo: 'Así quedaría', extra: tagTope(asi), html: `<div class="asi-quedaria">${htmlAsi(asi, false, 'adelanto')}</div>` } : { oculto: true },
        { filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${a.emp}">${esc(e.nombre)}</button>` }, { l: 'Monto', v: dinero(a.monto, 'usd', 0), campo: { k: 'monto', tipo: 'dinero', mon: 'usd', obligatorio: true } }, { l: 'Para qué', v: esc(a.motivo), campo: { k: 'motivo', tipo: 'texto' } }, a.estado === 'por_aprobar' ? { l: 'Saldrá de', v: `${A.cta(a.desde)} <small class="tenue">cuando se apruebe</small>` } : a.estado === 'rechazado' ? { l: 'Iba a salir de', v: `${A.cta(a.desde)} <small class="tenue">no salió: se rechazó</small>` } : { l: 'Salió de', v: A.cta(a.desde) }, { l: 'Lo anotó', v: esc(a.registro || '—') }, { l: 'Lo aprobó', v: esc(a.aprobo || (toca ? 'Le toca a ' + toca : 'Nadie todavía')) }, { l: 'Se descuenta', v: 'Completo el ' + esc(a.descuenta) }, { l: 'Estado', v: A.estadoTag(a.estado) }] }],
      acciones: mio ? [{ txt: 'Rechazar', acc: 'adel-rechazar', arg: a.id, tono: 'ghost' }, { txt: 'Aprobar', acc: 'adel-aprobar', arg: a.id, tono: 'pri', icono: 'candado' }] : [] };
  };
  const cambiaAdel = (id, est, txt, motivo = '') => { const a = D.ADELANTOS.find(x => x.id === id); const antes = a.estado; a.estado = est; if (est === 'por_descontar') a.aprobo = A.S.usuario.nombre; if (antes === 'por_aprobar') cierraPend('adelanto:' + id, (est === 'rechazado' ? 'Lo rechazó ' : 'Lo aprobó ') + A.S.usuario.nombre); A.auditar({ modulo: 'Préstamos', registro: 'Adelanto ' + emp(a.emp).nombre, campo: 'estado', antes: A.estadoTxt(antes), despues: A.estadoTxt(est), motivo }); A.pintarFicha(); A.pintarPagina(); A.aviso(txt); };
  ACC['adel-aprobar'] = id => {
    const a = D.ADELANTOS.find(x => x.id === id); const e = emp(a.emp);
    A.pedirCodigo({ que: 'Adelanto a ' + esc(e.nombre) + ' · ' + dinero(a.monto, 'usd', 0) + ' · sale de ' + A.cta(a.desde), det: 'Lo anotó ' + esc(a.registro || '—') + '. Se descuenta completo el ' + esc(a.descuenta) + '.', boton: 'Aprobar ' + dinero(a.monto, 'usd', 0) })
      .then(() => cambiaAdel(id, 'por_descontar', 'Aprobado. Se entrega y se descuenta completo en la quincena.')).catch(() => {});
  };
  ACC['adel-rechazar'] = id => A.pedirMotivo({ titulo: 'Rechazar el adelanto', texto: 'La persona y quien lo anotó ven el motivo.', boton: 'Rechazar', tono: 'peligro' }).then(m => cambiaAdel(id, 'rechazado', 'Rechazado. Se le avisó a quien lo anotó.', m)).catch(() => {});
  FICHAS.consumoemp = id => { const c = D.CONSUMOEMP.find(x => x.id === id); if (!ve()) return soloTotal('Consumo de ' + emp(c.emp).nombre, 'Préstamos y descuentos', 'El consumo de cada persona lo ven el dueño, RRHH y contabilidad. Tú ves el total del mes.', 'prestamos/consumos', 'Ver el total de los consumos');
    return { titulo: c.que, sub: esc(emp(c.emp).nombre) + ' · ' + esc(c.fecha), mod: 'nomina', sensible: 'sueldos', obj: c, registro: 'Consumo ' + emp(c.emp).nombre, anulable: true, bloques: [{ filas: [{ l: 'Persona', v: esc(emp(c.emp).nombre) }, { l: 'Pedido del POS', v: esc(c.pedido) }, { l: 'Monto ($)', v: dinero(c.monto, 'usd'), campo: { k: 'monto', tipo: 'dinero', mon: 'usd', obligatorio: true } }, { l: 'Se descuenta', v: '31 oct (2.ª quincena)' }] }, { html: '<p class="muted">Viene del POS: la cajera cerró el pedido con el método «Consumo personal». Si fue un error, se anula aquí con el motivo.</p>' }] }; };

  /* =============== PRESTACIONES Y LIQUIDACIONES =============== */
  const PS = D.PRESTA;
  const prest = e => {
    const base = e.formal ? PS.baseFormal : PS.baseInterna; const integral = base / 30 * (1 + 15 / 360 + 30 / 360);
    const trim = e.anios === 0 ? 0 : PS.trimestres2026; const gar = trim * 15 * integral; const adic = e.anios >= 2 ? Math.min(30, 2 * (e.anios - 1)) * integral : 0;
    const ant = PS.anticipos[e.id] || 0; const inter = (gar + adic) * .04;
    return { base, integral, gar, adic, ant, inter, acum: gar + adic + inter - ant, dic: PS.pagadoDic2025[e.id] || 0 };
  };
  PANT.prestaciones = {
    titulo: 'Prestaciones y liquidaciones', corto: 'Prestaciones', grupo: 'Recursos humanos', icono: 'prestaciones', mod: 'nomina', visible: () => S.usuario.rol !== 'fiscal_externo', palabras: 'liquidacion utilidades antiguedad finiquito',
    secciones: [['garantia', 'Prestaciones de cada persona', 'antiguedad garantia'], ['diciembre', 'Diciembre', 'ahorro'], ['egresos', 'Liquidaciones', 'liquidacion finiquito'], ['utilidades', 'Utilidades', 'utilidades']],
    cuenta: () => puede('nomina', 'aprobar') ? D.LIQUIDACIONES.filter(l => l.estado === 'por_aprobar').length : 0,
    render: (sub = 'garantia') => {
      let cuerpo = ''; const g = !ve(); const DI = D.DICIEMBRE;
      if (sub === 'garantia') {
        const lista = activos().map(e => ({ e, p: prest(e) }));
        cuerpo = `<div class="rejilla"><div class="c7 pila">${g ? notaAgrupada('Ves el total: ' + dinero(lista.reduce((s2, x) => s2 + x.p.acum, 0), 'usd', 0) + ' acumulado en 2026 por las personas de la lista.') : A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Base al mes', cls: 'r x plata' }, { t: 'Garantía 2026', cls: 'r plata' }, { t: 'Días adicionales', cls: 'r x plata' }, { t: 'Anticipos', cls: 'r x plata' }, { t: 'Acumulado', cls: 'r plata' }],
            filas: lista.map(({ e, p }) => ({ abrir: 'prestacion:' + e.id, celdas: [`<b>${esc(e.nombre)}</b><small>${e.formal ? 'Formal' : 'Interna'} · ${e.anios ? e.anios + (e.anios === 1 ? ' año' : ' años') : 'menos de 1 año'}</small>`, dinero(p.base, 'usd'), dinero(p.gar, 'usd'), p.adic ? dinero(p.adic, 'usd') : '—', p.ant ? dinero(-p.ant, 'usd') : '—', dinero(p.acum, 'usd')] })),
            pie: ['Total', '', dinero(lista.reduce((s2, x) => s2 + x.p.gar, 0), 'usd'), dinero(lista.reduce((s2, x) => s2 + x.p.adic, 0), 'usd'), '', dinero(lista.reduce((s2, x) => s2 + x.p.acum, 0), 'usd')] })}</div>
          <div class="c5 pila"><article class="hoja"><h2>Cómo se calcula</h2><dl class="kv"><div><dt>Cada trimestre</dt><dd class="largo">15 días de salario integral</dd></div><div><dt>Desde el 2.º año</dt><dd class="largo">2 días más por año, hasta 30</dd></div><div><dt>Base de la nómina interna</dt><dd class="largo">$ ${PS.baseInterna} al mes: mínimo + cestaticket + margen de $ ${PS.margen} ${tag('Margen por confirmar', 'aviso')}</dd></div><div><dt>Base de la nómina formal</dt><dd class="largo">Solo el salario mínimo (${dinero(D.NOMINA_FORMAL.minimo, 'bs', 0)}). Los recargos y el 10 %, por decidir con el abogado</dd></div><div><dt>Anticipos</dt><dd class="largo">Hasta el 75 %, con motivo y soporte</dd></div></dl></article>
          <p class="nota aviso">${ic('alerta', 's')}<span><b>Ojo:</b> con la regla del 29-ago, los formales salen casi en cero porque se toma solo el mínimo, sin el 10 %, que también cobran y que es salario; está por decidir con el abogado si entra en la base. Lo mismo con los recargos de noche y domingo. Los internos quedan sobre $ ${PS.baseInterna}. Revisar con Cecilia y el abogado.</span></p></div></div>`;
      }
      if (sub === 'diciembre') {
        const total = DI.liquidacionAnual + DI.utilidades + DI.intereses; const llega = DI.apartado + DI.mensual * 2.5; const falta = total - llega;
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Liquidación anual (todos)', valor: g ? 'Agrupado' : dinero(DI.liquidacionAnual, 'usd', 0), sub: 'lo causado en 2026, como pago a cuenta' })}${A.cifra({ etq: 'Utilidades', valor: g ? 'Agrupado' : dinero(DI.utilidades, 'usd', 0), sub: '30 días (el piso) · por confirmar', ir: 'prestaciones/utilidades' })}${A.cifra({ etq: 'Intereses de prestaciones', valor: g ? 'Agrupado' : dinero(DI.intereses, 'usd', 0), sub: 'a la tasa del BCV' })}${A.cifra({ etq: 'Hace falta', valor: dinero(total, 'usd', 0), sub: 'del 1 al 15 de diciembre' })}</div>
          <div class="rejilla"><div class="c6"><article class="hoja"><h2>${ic('cajachica')}El ahorro de diciembre</h2><dl class="kv"><div><dt>Apartado hasta hoy</dt><dd>${dinero(DI.apartado, 'usd', 0)}</dd></div><div><dt>Se aparta cada mes</dt><dd>${dinero(DI.mensual, 'usd', 0)}</dd></div><div><dt>Al ritmo de hoy llega a</dt><dd>${dinero(llega, 'usd', 0)}</dd></div><div class="total"><dt><b>${falta > 0 ? 'Faltarían' : 'Sobrarían'}</b></dt><dd>${dinero(Math.abs(falta), 'usd', 0)}</dd></div></dl>
            ${falta > 0 ? `<p class="nota aviso">${ic('alerta', 's')}<span>Para llegar, hay que apartar ${dinero((total - DI.apartado) / 2.5, 'usd', 0)} al mes desde octubre.</span></p>` : ''}</article></div>
          <div class="c6"><article class="hoja"><h2>${ic('calendario')}Lo que viene</h2><ol class="tiempo"><li><time>1 al 15 dic</time><span>Anticipo de utilidades y liquidación anual para todos.</span></li><li><time>31 dic</time><span>Intereses de prestaciones del año.</span></li><li><time>Enero</time><span>Comprobante anual de retenciones (ARC) para la nómina formal.</span></li></ol></article></div></div>`;
      }
      if (sub === 'egresos') cuerpo = `<p class="desc">Cuando alguien se va, la app compara la garantía acumulada con el cálculo retroactivo (30 días por año al último salario integral) y paga el mayor. Descuenta lo ya pagado en cada diciembre y lo que la persona deba. Si fue un despido sin causa, se paga el doble.</p>
        ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Motivo', cls: 'x' }, { t: 'Vence', cls: 'x' }, { t: 'A pagar', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: D.LIQUIDACIONES.map(l => ({ abrir: 'liquidacion:' + l.id, celdas: [`<b>${esc(emp(l.emp).nombre)}</b><small>Salió el ${esc(l.egreso)} · ${esc(l.tiempo)}</small>`, esc(l.motivo), esc(l.vence), g ? 'Agrupado' : dinero(l.lineas.reduce((s2, x) => s2 + x[1], 0), 'usd'), A.estadoTag(l.estado)] })) })}
        <p class="nota aviso">${ic('reloj', 's')}<span>Hay 5 días desde el egreso para pagarla. Después corre interés de mora a la tasa activa del BCV.</span></p>`;
      if (sub === 'utilidades') cuerpo = `<div class="rejilla"><div class="c7"><article class="hoja"><h2>Utilidades de 2026</h2><dl class="kv"><div><dt>Días</dt><dd class="largo">Por confirmar con Cecilia (el piso legal es 30 días; el máximo, 4 meses)</dd></div><div><dt>Anticipo</dt><dd class="largo">En los primeros 15 días de diciembre, junto con la liquidación anual</dd></div><div><dt>Quien no trabajó el año completo</dt><dd class="largo">Cobra por los meses completos trabajados</dd></div><div><dt>Base</dt><dd class="largo">La misma de las prestaciones, según la nómina</dd></div></dl></article></div>
        <div class="c5"><p class="nota info">${ic('fiscal', 's')}<span>Las utilidades también alimentan el 0,5 % del INCES que se declara en Fiscal.</span></p>${puede('fiscal') ? `<button class="enlace" data-ir="fiscal/preguntas">Ver la pregunta a Cecilia ${ic('derecha', 's')}</button>` : ''}</div></div>`;
      return `<div class="pagina">${A.cab('Recursos humanos', 'Prestaciones y liquidaciones', 'Lo que se le debe a cada persona por su antigüedad, lo que se paga en diciembre y la liquidación de quien se va.')}
        ${A.subnav([['garantia', 'Prestaciones de cada persona'], ['diciembre', 'Diciembre'], ['egresos', 'Liquidaciones', D.LIQUIDACIONES.filter(l => l.estado === 'por_aprobar').length], ['utilidades', 'Utilidades']], sub)}${cuerpo}</div>`;
    },
  };
  FICHAS.prestacion = id => {
    const e = emp(id); if (!ve()) return soloTotal('Prestaciones de ' + e.nombre, 'Prestaciones y liquidaciones', 'Lo acumulado por cada persona lo ven el dueño, RRHH y contabilidad. Tú ves el total.', 'prestaciones/garantia', 'Ver el total acumulado');
    const p = prest(e);
    return { titulo: 'Prestaciones de ' + e.nombre, sub: (e.formal ? 'Nómina formal' : 'Nómina interna') + ' · desde el ' + esc(e.ingreso), mod: 'nomina', sensible: 'sueldos', obj: e,
      bloques: [{ filas: [{ l: 'Base mensual', v: dinero(p.base, 'usd') + (e.formal ? ' <small class="tenue">(salario legal)</small>' : ' <small class="tenue">(mínimo + cestaticket + margen)</small>') }, { l: 'Salario integral diario', v: dinero(p.integral, 'usd') }, { l: 'Garantía de 2026 (' + PS.trimestres2026 + ' trimestres)', v: dinero(p.gar, 'usd') }, { l: 'Días adicionales', v: p.adic ? dinero(p.adic, 'usd') : 'Todavía no (desde el 2.º año)' }, { l: 'Intereses (ejemplo)', v: dinero(p.inter, 'usd') }, { l: 'Anticipos pedidos', v: p.ant ? dinero(-p.ant, 'usd') : 'Ninguno' }, { l: 'Pagado en diciembre de 2025', v: p.dic ? dinero(p.dic, 'usd') : '—' }] },
        { html: `<dl class="kv"><div class="total"><dt><b>Acumulado en 2026</b></dt><dd>${dinero(p.acum, 'usd')}</dd></div></dl><p class="muted">Puede pedir hasta el 75 % como anticipo para vivienda, salud o estudios, con soporte.</p>` }] };
  };
  FICHAS.liquidacion = id => {
    const l = D.LIQUIDACIONES.find(x => x.id === id); const e = emp(l.emp); const tot = l.lineas.reduce((s2, x) => s2 + x[1], 0);
    return { titulo: 'Liquidación de ' + e.nombre, sub: esc(l.motivo) + ' · salió el ' + esc(l.egreso), mod: 'nomina', obj: l, registro: 'Liquidación ' + e.nombre, tags: l.estado === 'por_aprobar' ? [['Vence hoy', 'alerta']] : [],
      aviso: l.estado === 'por_aprobar' ? `<p class="nota alerta">${ic('reloj', 's')}<span><b>Vence hoy.</b> Pasado el plazo de 5 días corre interés de mora a la tasa activa del BCV.</span></p>` : '',
      bloques: [{ html: `<dl class="kv">${l.lineas.map(([c, m, n]) => `<div><dt>${esc(c)}${n && ve() ? `<small class="tenue" style="display:block">${esc(n)}</small>` : ''}</dt><dd>${ve() ? dinero(m, 'usd') : '—'}</dd></div>`).join('')}<div class="total"><dt><b>A pagar</b></dt><dd>${ve() ? dinero(tot, 'usd') : 'Agrupado'}</dd></div></dl>` },
        { filas: [{ l: 'Tiempo trabajado', v: esc(l.tiempo) }, { l: 'La preparó', v: esc(l.preparo) }, { l: 'Despido sin causa', v: 'No (renuncia): no hay pago doble' }] },
        // el finiquito trae los montos de la persona (lo ven quienes ven sueldos); la carta de renuncia es del expediente (dueño y RRHH)
        ve() ? { titulo: 'Documentos', adjuntos: (edP() ? ['Carta de renuncia.jpg'] : []).concat(['Finiquito para firmar.pdf']) } : { titulo: 'Documentos', html: notaAgrupada('El finiquito trae los montos de la persona: lo ven el dueño, RRHH y contabilidad.') }],
      acciones: (ve() ? [{ txt: 'Descargar el finiquito', acc: 'descargar', icono: 'descargar' }] : []).concat(l.estado === 'por_aprobar' && puede('nomina', 'aprobar') ? [{ txt: 'Aprobar y pagar', acc: 'liq-ok', arg: l.id, tono: 'pri', icono: 'candado' }] : []) };
  };
  ACC['liq-ok'] = id => A.pedirCodigo((l => ({ que: 'Liquidación de ' + esc(emp(l.emp).nombre) + ' · ' + dinero(l.lineas.reduce((s2, x) => s2 + x[1], 0), 'usd'), det: esc(l.motivo) + ' · salió el ' + esc(l.egreso) + (D.PRESTAMOS.some(p => p.emp === l.emp && p.estado === 'en_liquidacion') ? ' · ya trae el descuento del préstamo' : ''), boton: 'Aprobar y pagar ' + dinero(l.lineas.reduce((s2, x) => s2 + x[1], 0), 'usd') }))(D.LIQUIDACIONES.find(x => x.id === id))).then(() => { const l = D.LIQUIDACIONES.find(x => x.id === id); l.estado = 'pagada'; const p = D.PRESTAMOS.find(x => x.emp === l.emp && x.estado === 'en_liquidacion'); if (p) { p.pagadas = p.cuotas; p.estado = 'pagada'; } A.auditar({ modulo: 'Prestaciones', registro: 'Liquidación ' + emp(l.emp).nombre, campo: 'estado', antes: 'por aprobar', despues: 'pagada' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Aprobada y pagada. El préstamo quedó saldado con la liquidación.'); }).catch(() => {});
  // la misma regla del botón, al tocarlo (A.regla): quien solo mira el módulo, o no tiene ese permiso, no llega a la acción
  A.reglaAcc(['egreso', 'falta-clas', 'falta-just', 'falta-sin', 'falta-deshacer', 'falta-reabrir', 'emp-crear', 'emp-borrador', 'emp-seguir', 'np-set', 'np-reactivar', 'np-no-reactivar',
    'av-se-queda', 'av-no-sigue', 'av-indet', 'av-renovar', 'av-termina', 'av-salud', 'av-cedula', 'av-cesta', 'av-nac', 'av-contrato', 'av-amon', 'av-anotado', 'av-deshacer', 'av-reabrir', 'av-senal', 'reposo-ok',
    'vac-programar', 'vp-quien', 'vp-otra', 'vp-corregir', 'vp-guardar'], { mod: 'personal' });
  A.reglaAcc(['redoble-ok', 'redoble-no', 'redoble-deshacer', 'redoble-reabrir', 'inc-acuerdo', 'inc-deshacer', 'inc-reabrir', 'prest-abono', 'prest-correr', 'prest-pagar', 'propina-ok'], { mod: 'nomina' });
  A.reglaAcc(['prest-aprobar', 'prest-rechazar', 'prest-perdonar', 'liq-ok', 'premio-escoger', 'propina-visto', 'propina-devolver', 'regla-aprobar', 'regla-rechazar'], { mod: 'nomina', permiso: 'aprobar' });
})();
