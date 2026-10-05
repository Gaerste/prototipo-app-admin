/* Recursos humanos: Personal, Asistencia y horas, Vacaciones y reposos, Nómina, Préstamos y descuentos,
   Prestaciones y liquidaciones. Datos en datos-gente.js. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, $, esc, fmt, dinero, leerNum, ic, tag, puede, nivel } = A;
  const M = D.MESES; const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  /* ---------- ayudas ---------- */
  const emp = id => D.EMPLEADOS.find(e => e.id === id) || { nombre: '—', cargo: '', area: '' };
  const activos = () => D.EMPLEADOS.filter(e => e.estado !== 'egresado');
  const fd = ([d, m]) => d + ' ' + M[m];
  const fdl = ([d, m]) => DOW[new Date(2026, m, d).getDay()] + ' ' + d + ' ' + M[m];
  const diasHasta = ([d, m]) => Math.round((new Date(2026, m, d) - new Date(2026, 9, 5)) / 864e5);
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
  const saldo = p => (p.cuotas - p.pagadas) * p.cuota;
  const vivo = p => ['activo', 'en_liquidacion', 'aprobada'].includes(p.estado);
  const lead = (tono, icono) => `<span class="lead ${tono}">${ic(icono)}</span>`;
  const filaLista = ({ abrir = '', ir = '', tono = '', icono = 'info', t, s = '', fin = '' }) => `<li><button class="fila" ${abrir ? `data-abrir="${abrir}"` : `data-ir="${ir}"`}>${lead(tono, icono)}<span class="medio"><b>${t}</b>${s ? `<small>${s}</small>` : ''}</span><span class="fin">${fin}${ic('derecha', 's chev')}</span></button></li>`;
  const notaAgrupada = txt => `<p class="nota gris">${ic('ojo', 's')}<span>${txt}</span></p>`;

  // diagrama de barras por persona (vacaciones, reposos) con marcas (cumpleaños, contratos) · 1 oct → 30 nov
  const DIAS = 61; const idx = ([d, m]) => Math.round((new Date(2026, m, d) - new Date(2026, 9, 1)) / 864e5);
  const pos = dm => Math.max(0, Math.min(DIAS, idx(dm))) / DIAS * 100;
  A.gantt = filas => `<div class="tabla-env"><div class="gantt" role="img" aria-label="Calendario del personal de octubre y noviembre">
    <div class="gantt-fila gantt-cab"><span></span><div class="gantt-pista"><span style="left:0">Octubre</span><span style="left:${31 / DIAS * 100}%">Noviembre</span>${[5, 12, 19, 26].map(d => `<i style="left:${pos([d, 9])}%">${d}</i>`).join('')}${[2, 9, 16, 23, 30].map(d => `<i style="left:${pos([d, 10])}%">${d}</i>`).join('')}</div></div>
    ${filas.map(f => `<div class="gantt-fila"><b>${f.abrir ? `<button class="enlace" data-abrir="${f.abrir}">${esc(f.nombre)}</button>` : esc(f.nombre)}</b><div class="gantt-pista"><span class="gantt-hoy" style="left:${(idx([5, 9]) + .5) / DIAS * 100}%"></span>
      ${(f.barras || []).map(b => { const l = pos(b.desde), w = Math.max(1.6, (Math.min(DIAS, idx(b.hasta) + 1) - Math.max(0, idx(b.desde))) / DIAS * 100); return `<${b.abrir ? 'button' : 'span'} class="gantt-barra ${b.tono}" ${b.abrir ? `data-abrir="${b.abrir}"` : ''} style="left:${l}%;width:${w}%" title="${esc(b.txt)}">${esc(b.txt)}</${b.abrir ? 'button' : 'span'}>`; }).join('')}
      ${(f.marcas || []).filter(m => idx(m.d) >= 0 && idx(m.d) < DIAS).map(m => `<span class="gantt-marca ${m.tipo}" style="left:${(idx(m.d) + .5) / DIAS * 100}%" title="${esc(m.txt)}">${ic(m.tipo === 'cumple' ? 'pastel' : 'alerta', 'xs')}<span class="sr-only">${esc(m.txt)}</span></span>`).join('')}
    </div></div>`).join('')}
  </div></div>
  <p class="leyenda gantt-ley"><span><i class="gl vac"></i>Vacaciones</span><span><i class="gl rep"></i>Reposo o ausencia</span><span>${ic('pastel', 'xs')} Cumpleaños</span>${edP() || ve() ? `<span>${ic('alerta', 'xs')} Contrato (vence o ya es fijo) o fin de la prueba</span>` : ''}<span><i class="gl hoy"></i>Hoy</span></p>`;
  // filas del diagrama a partir del personal
  A.filasPersonal = ({ conContratos = false, soloConAlgo = true } = {}) => activos().map(e => {
    const barras = [], marcas = [];
    D.VACACIONES.filter(v => v.emp === e.id && v.desde).forEach(v => barras.push({ desde: v.desde, hasta: v.hasta, txt: 'Vacaciones · regresa ' + v.regresa, tono: 'vac', abrir: conContratos ? 'vacacion:' + v.id : '' }));
    D.REPOSOS.filter(r => r.emp === e.id && r.tipo === 'reposo').forEach(r => barras.push({ desde: r.desde, hasta: r.hasta, txt: conContratos ? 'Reposo hasta el ' + fd(r.hasta) : 'Ausente hasta el ' + fd(r.hasta), tono: 'rep', abrir: conContratos ? 'reposo:' + r.id : '' }));
    if (e.nac) marcas.push({ d: [e.nac[0], e.nac[1]], tipo: 'cumple', txt: 'Cumpleaños: ' + fd([e.nac[0], e.nac[1]]) });
    if (conContratos && e.contratoVence) marcas.push({ d: e.contratoVence, tipo: 'contrato', txt: yaFijo(e) ? fijoTxt(e) + ': ya es fijo, no vence' : 'Vence el contrato: ' + fd(e.contratoVence) });
    if (conContratos && e.prueba) marcas.push({ d: e.prueba, tipo: 'contrato', txt: 'Termina el período de prueba: ' + fd(e.prueba) });
    return { nombre: e.nombre, abrir: conContratos ? 'empleado:' + e.id : '', barras, marcas };
  }).filter(f => !soloConAlgo || f.barras.length || f.marcas.some(m => idx(m.d) >= 0 && idx(m.d) < DIAS));
  A.rh = { emp, fd, fdl, diasHasta, proxCumple, cumpleAnios, activos, yaFijo, fijoTxt };

  // avisos del personal (fechas, papeles, salud, disciplina) · la salud, el expediente y la disciplina solo los ven el dueño y RRHH
  function avisosPersonal() {
    const out = [];
    D.EMPLEADOS.filter(e => e.prueba).forEach(e => out.push({ abrir: 'empleado:' + e.id, tono: 'aviso', icono: 'reloj', t: `${esc(e.nombre)}: termina el período de prueba el ${fdl(e.prueba)}`, s: 'Hay que decidir antes si se queda. Después, salir cuesta como un despido.', fin: tag('En ' + diasHasta(e.prueba) + ' días', 'aviso') }));
    D.EMPLEADOS.filter(e => e.contratoVence && e.estado !== 'egresado').forEach(e => out.push(yaFijo(e)
      ? { abrir: 'empleado:' + e.id, tono: 'alerta', icono: 'archivo', t: `${esc(e.nombre)}: ${fijoTxt(e).toLowerCase()}`, s: 'Ya es contrato indeterminado (fijo). Terminarlo sería un despido y, con la inamovilidad hasta el 31-dic, necesita permiso de la Inspectoría.', fin: tag('Ya es fijo', 'alerta') }
      : { abrir: 'empleado:' + e.id, tono: 'aviso', icono: 'archivo', t: `${esc(e.nombre)}: vence el contrato el ${fdl(e.contratoVence)}`, s: 'Renovar, pasar a indeterminado o terminar.', fin: tag('En ' + diasHasta(e.contratoVence) + ' días', 'aviso') }));
    if (edP()) D.EMPLEADOS.filter(e => !e.certOk && e.estado !== 'egresado').forEach(e => out.push({ abrir: 'empleado:' + e.id, tono: 'alerta', icono: 'pulso', t: `${esc(e.nombre)}: certificado de salud ${/trámite/.test(e.cert) ? 'en trámite' : 'vencido'}`, s: esc(e.cert) + ' · manipula alimentos: lo pide Sanidad en cada inspección.', fin: tag('Salud', 'alerta') }));
    D.VACACIONES.filter(v => v.acumulados >= 2).forEach(v => out.push({ abrir: 'vacacion:' + v.id, tono: 'aviso', icono: 'maleta', t: `${esc(emp(v.emp).nombre)}: 2 períodos de vacaciones sin disfrutar`, s: 'Es el máximo que permite la ley. Pagarlas sin darlas obliga a darlas otra vez.', fin: tag('Vacaciones', 'aviso') }));
    if (edP()) D.EMPLEADOS.filter(e => /Falta/.test(e.docs) && e.certOk).forEach(e => out.push({ abrir: 'empleado:' + e.id, tono: 'aviso', icono: 'documentos', t: `${esc(e.nombre)}: expediente incompleto`, s: esc(e.docs) + '.', fin: tag('Papeles', 'aviso') }));
    if (sensible()) D.EMPLEADOS.filter(e => /\(V-/.test(e.titular) && e.estado !== 'egresado').forEach(e => out.push({ abrir: 'empleado:' + e.id, tono: 'info', icono: 'escudo', t: `${esc(e.nombre)}: cobra en la cuenta de un familiar`, s: 'Titular: ' + esc(e.titular) + '. Está bien si está anotado; el antifraude avisa si esa cuenta aparece en otra persona.', fin: tag('Cuenta', 'info') }));
    if (edP()) D.AMONESTACIONES.forEach(a => out.push({ abrir: 'amonestacion:' + a.id, tono: 'aviso', icono: 'alerta', t: `${esc(emp(a.emp).nombre)}: amonestación escrita del ${esc(a.fecha)}`, s: `Quedan ${a.quedan} días para pedir la calificación a la Inspectoría; después la falta se da por perdonada.`, fin: tag(a.quedan + ' días', 'aviso') }));
    D.REPOSOS.filter(r => r.tipo === 'reposo' && !r.convalidado).forEach(r => out.push({ abrir: 'reposo:' + r.id, tono: 'lila', icono: 'pulso', t: `${esc(emp(r.emp).nombre)}: falta convalidar el reposo en el IVSS`, s: `Del ${fd(r.desde)} al ${fd(r.hasta)} · ${r.dias} días.`, fin: tag('IVSS', 'lila') }));
    activos().filter(e => proxCumple(e) !== null && proxCumple(e) <= 7).sort((a, b) => proxCumple(a) - proxCumple(b)).forEach(e => out.push({ abrir: 'empleado:' + e.id, tono: 'lila', icono: 'pastel', t: proxCumple(e) === 0 ? `Hoy cumple ${esc(e.nombre)} (${cumpleAnios(e)} años)` : `${esc(e.nombre)} cumple ${cumpleAnios(e)} el ${fdl([e.nac[0], e.nac[1]])}`, s: esc(e.cargo) + ' · ' + turnoTxt(e.turno), fin: tag(proxCumple(e) === 0 ? 'Hoy' : 'En ' + proxCumple(e) + ' días', 'lila') }));
    return out;
  }

  A.avisosPersonal = avisosPersonal;

  /* =============== PERSONAL =============== */
  const P = { nueva: false };
  PANT.personal = {
    titulo: 'Personal', corto: 'Personal', tab: 'Personal', grupo: 'Recursos humanos', icono: 'personal', mod: 'personal', palabras: 'empleado empleados trabajador trabajadores expediente ficha',
    secciones: () => [['lista', 'Personas', 'empleados trabajadores'], ['avisos', 'Avisos', 'contratos vencen'], ['egresos', 'Altas y egresos', 'ingreso renuncia despido'], edP() ? ['legal', 'Protección y disciplina', 'fuero amonestacion inamovilidad'] : null],
    cuenta: () => edP() ? avisosPersonal().filter(a => a.tono === 'alerta').length : 0,
    // «Salir sin guardar» desde Nueva persona: lo escrito se pierde y la próxima arranca en blanco
    descartar: () => { P.nueva = false; },
    // Nueva persona es un formulario: la pestaña o el menú vuelven a la lista, y al salir se borra «Ficha creada»
    transitorias: ['nueva'],
    alSalir: sub => { if (sub === 'nueva') P.nueva = false; },
    render: (sub = 'lista') => {
      const g = nivel('personal') === 'g'; const avisos = avisosPersonal();
      if (sub === 'legal' && !edP()) sub = 'lista'; // fueros y amonestaciones: salud y expediente, solo el dueño y RRHH
      let cuerpo = '';
      if (sub === 'lista') {
        const filtro = A.filtroActual('activos');
        const lista = D.EMPLEADOS.filter(e => filtro === 'todos' || (filtro === 'activos' && e.estado !== 'egresado') || (filtro === 'formal' && e.formal && e.estado !== 'egresado') || (filtro === 'interna' && !e.formal && e.estado !== 'egresado') || (filtro === 'fuera' && ['vacaciones', 'reposo'].includes(e.estado)) || (filtro === 'egresados' && e.estado === 'egresado'));
        const hoyTrab = activos().filter(e => /[123]/.test((D.HORARIOS.filas[e.id] || [])[0] || '')).length;
        const cumple = activos().filter(e => proxCumple(e) !== null && proxCumple(e) <= 7).sort((a, b) => proxCumple(a) - proxCumple(b));
        const cols = [{ t: 'Persona', cls: 'p' }, { t: 'Área', cls: 'x' }, { t: 'Ingreso', cls: 'x' }, { t: 'Cumpleaños', cls: 'x' }, { t: 'Nómina', cls: 'x' }];
        if (ve()) cols.push({ t: 'Sueldo quincenal', cls: 'r plata' });
        cols.push({ t: 'Estado', cls: 'e' });
        cuerpo = `<div class="cifras">
            ${A.cifra({ etq: 'En nómina', valor: '49', sub: '10 en la formal · 39 en la interna', ir: puede('nomina') ? 'nomina/corridas' : '' })}
            ${A.cifra({ etq: 'Trabajan hoy', valor: hoyTrab + ' de ' + activos().length, sub: 'de las personas de esta lista', ir: 'asistencia' })}
            ${A.cifra({ etq: 'De vacaciones o reposo', valor: activos().filter(e => ['vacaciones', 'reposo'].includes(e.estado)).length, sub: 'Wilmer y Mariela', ir: 'ausencias' })}
            ${A.cifra({ etq: 'Cumpleaños esta semana', valor: cumple.length, sub: cumple.map(e => e.nombre.split(' ')[0] + (proxCumple(e) === 0 ? ' (hoy)' : ' (' + DOW[new Date(2026, e.nac[1], e.nac[0]).getDay()].toLowerCase() + ')')).join(', '), abrir: cumple[0] ? 'empleado:' + cumple[0].id : '' })}
          </div>
          ${A.filtros('t-emp', [['activos', 'Activos', activos().length], ['formal', 'Formal', activos().filter(e => e.formal).length], ['interna', 'Interna', activos().filter(e => !e.formal).length], ['fuera', 'Fuera hoy', 2], ['egresados', 'Egresados', D.EMPLEADOS.filter(e => e.estado === 'egresado').length]], filtro, 'Buscar persona, cargo o área')}
          ${A.tabla({ id: 't-emp', cols, filas: lista.map(e => {
            const c = [`<b>${esc(e.nombre)}</b><small>${esc(e.cargo)} · ${turnoTxt(e.turno)}</small>`, esc(e.area), esc(e.ingreso), e.nac ? fd([e.nac[0], e.nac[1]]) + (proxCumple(e) === 0 ? ' ' + tag('Hoy', 'lila') : '') : '<span class="tenue">Sin fecha</span>', e.formal ? tag('Formal', 'info') : tag('Interna', '')];
            if (ve()) c.push(e.tipoSal === 'por_dia' ? dinero(e.diaria, 'usd', 0) + ' <small class="tenue">/día</small>' : dinero(e.sueldo, 'usd', 0));
            c.push(e.estado !== 'activo' ? A.estadoTag(e.estado) : /Falta/.test(e.docs) && edP() ? tag('Faltan papeles', 'aviso') : tag('Activo', 'ok'));
            return { abrir: 'empleado:' + e.id, clase: e.estado === 'egresado' ? 'tenue' : '', celdas: c };
          }) })}
          <p class="muted">Se muestran 14 de las 49 personas en nómina (datos inventados).</p>`;
      }
      if (sub === 'avisos') cuerpo = `<p class="desc">Lo que vence o falta en el personal, en orden de urgencia. Cada aviso llega a RRHH; lo que nadie resuelve en 2 días sube a Alejandro.</p>
        <ul class="lista">${avisos.map(filaLista).join('')}</ul>`;
      if (sub === 'egresos') cuerpo = `<div class="rejilla"><div class="c6 pila">
          <div class="sec"><h2>Altas recientes</h2></div>
          <article class="hoja"><div class="hoja-cab"><h2>${ic('usuario')}Rosa Medina · mesonera</h2>${tag('En prueba', 'aviso')}</div>
            <ol class="pasos">${['Ficha y cédula', 'Contrato firmado', edP() ? 'Certificado de salud' : 'Papeles del expediente (los ve RRHH)', 'Cuenta para pagarle', 'Fin de la prueba'].map((p, i) => `<li class="${i < 2 || i === 3 ? 'hecho' : i === 2 ? 'actual' : ''}">${p}</li>`).join('')}</ol>
            <dl class="kv"><div><dt>Ingresó</dt><dd>Lun 14 sep</dd></div><div><dt>Termina la prueba</dt><dd>Mié 14 oct ${tag('En 9 días', 'aviso')}</dd></div><div><dt>% del 10 %</dt><dd>0 % (los nuevos arrancan en 0)</dd></div><div><dt>Alta en el IVSS</dt><dd>No aplica (nómina interna)</dd></div></dl>
            <button class="enlace" data-abrir="empleado:e10">Abrir su ficha ${ic('derecha', 's')}</button></article>
          <p class="nota info">${ic('info', 's')}<span>Si entra a la nómina formal, el alta en el IVSS se hace en los 3 días hábiles siguientes. Si ya trabajó aquí en el mismo puesto, no hay período de prueba.</span></p>
        </div><div class="c6 pila">
          <div class="sec"><h2>Egresos</h2>${A.boton('personal', 'Registrar un egreso', 'data-acc="egreso" data-arg=""', { tono: 'sec', icono: 'salir', chico: true })}</div>
          ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Motivo', cls: 'x' }, { t: 'Liquidación', cls: 'e' }], filas: D.EMPLEADOS.filter(e => e.estado === 'egresado').map(e => ({ abrir: puede('nomina') ? 'liquidacion:lq1' : 'empleado:' + e.id, celdas: [`<b>${esc(e.nombre)}</b><small>Salió el ${esc(e.egreso)}</small>`, esc(e.motivoEgreso), tag('Vence hoy', 'alerta')] })) })}
          <p class="nota aviso">${ic('reloj', 's')}<span>La liquidación se paga en los 5 días siguientes al egreso. Después corre interés de mora a la tasa activa del BCV. Al registrar el egreso se le quita el acceso a los grupos y la app arma la liquidación, descontando lo que deba.</span></p>
        </div></div>`;
      if (sub === 'legal') cuerpo = `<p class="nota aviso">${ic('escudo', 's')}<span><b>Inamovilidad laboral hasta el 31 de diciembre de 2026</b> para todo el personal. Para despedir a alguien hace falta pedir antes la calificación a la Inspectoría del Trabajo.</span></p>
        <div class="rejilla"><div class="c6 pila"><div class="sec"><h2>Quién tiene protección especial</h2></div>
          ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Por qué', cls: 'x' }, { t: 'Hasta', cls: 'e' }], filas: D.FUEROS.map(f => ({ abrir: 'fuero:' + f.id, celdas: [`<b>${esc(emp(f.emp).nombre)}</b><small>${esc(emp(f.emp).cargo)}</small>`, esc(f.tipo), esc(f.hasta)] })) })}
          <div class="sec"><h2>Amonestaciones</h2></div>
          ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Plazo', cls: 'e' }], filas: D.AMONESTACIONES.map(a => ({ abrir: 'amonestacion:' + a.id, celdas: [`<b>${esc(emp(a.emp).nombre)}</b><small>${esc(a.fecha)} · ${esc(a.hechos)}</small>`, esc(a.tipo), tag(a.quedan + ' días', 'aviso')] })) })}
        </div><div class="c6 pila"><article class="hoja"><h2>${ic('archivo')}Papeles firmados por cada persona</h2><p class="muted">El catálogo dice qué es salario y qué no; lo que defiende al negocio en un reclamo es el papel firmado por cada persona.</p>
          <div class="barras">${D.ACUERDOS.map(([n, h, t, d]) => `<div class="barra"><span>${esc(n)}<small class="tenue" style="display:block">${esc(d)}</small></span><b>${h} de ${t}</b><div class="pista"><span class="${h === t ? 'ok' : h / t > .6 ? 'aviso' : 'alerta'}" style="width:${h / t * 100}%"></span></div></div>`).join('')}</div></article>
          <p class="nota gris">${ic('info', 's')}<span>Seguridad laboral (exámenes, dotación, comité): diseñado para más adelante. Lo único que aplica ya es el certificado de salud de quien manipula alimentos.</span></p></div></div>`;
      if (sub === 'nueva') cuerpo = !edP() ? A.lectura('personal') : P.nueva
        ? `<div class="pila" style="max-width:640px"><div class="hecho-caja">${ic('check')}<span>Ficha creada. Le llega a la persona el contrato para firmar y a Alejandro el aviso. (Simulado)</span></div><div class="fila-btns"><button class="btn sec" data-acc="emp-volver">Volver al personal</button><button class="btn sec" data-acc="emp-otra">Crear otra</button></div></div>`
        : `<div class="rejilla" data-form="persona"><div class="c7 pila"><article class="hoja form"><h2>Datos de la persona</h2>
            <div class="campos">
              <label class="campo"><span>Nombre y apellido</span><input id="np-nombre" autocomplete="off"></label>
              <label class="campo"><span>Cédula</span><input id="np-ci" placeholder="V-00000000" autocomplete="off"><small class="ayuda">Se guarda como texto: no pierde ceros.</small></label>
              <label class="campo"><span>Fecha de nacimiento</span><input id="np-nac" placeholder="dd/mm/aaaa" autocomplete="off"><small class="ayuda">Para su cumpleaños en el calendario.</small></label>
              <label class="campo"><span>Cargo</span><input id="np-cargo" autocomplete="off"></label>
              <label class="campo"><span>Área</span><select id="np-area">${['Cocina', 'Servicio', 'Caja', 'Delivery', 'Seguridad', 'Limpieza'].map(x => `<option>${x}</option>`).join('')}</select></label>
              <label class="campo"><span>Turno</span><select id="np-turno">${Object.entries(D.TURNOS).map(([k, [n, h]]) => `<option value="${k}">${k} · ${n} (${h})</option>`).join('')}</select></label>
              <label class="campo"><span>Nómina</span><select id="np-reg"><option>Interna</option><option>Formal (va a los entes)</option></select></label>
              <label class="campo"><span>Fecha de ingreso</span><input id="np-ing" value="lun 5 oct 2026"></label>
            </div></article>
            <article class="hoja form"><h2>Pago</h2><div class="campos">
              <label class="campo"><span>Cómo se le paga</span><select id="np-tipo"><option>Sueldo quincenal</option><option>Tarifa por día</option></select></label>
              <label class="campo"><span>Monto ($)</span><input id="np-monto" inputmode="decimal"></label>
              <label class="campo"><span>Cuenta o pago móvil</span><input id="np-cuenta" placeholder="Banco y número, o teléfono"></label>
              <label class="campo"><span>Titular de la cuenta</span><select id="np-titular"><option>La misma persona</option><option>Un familiar (anotar su cédula)</option></select></label>
            </div></article></div>
          <div class="c5 pila"><article class="hoja"><h2>Lo que la app hace sola</h2><ul class="lista">
              ${[['reloj', 'Período de prueba de 30 días', 'Aviso a RRHH el día 25'], ['archivo', 'Contrato para firmar', 'Se genera con los datos de la ficha'], ['pulso', 'Certificado de salud', 'Si va a cocina, servicio o barra'], ['pastel', 'Cumpleaños en el calendario', 'Aviso 3 días antes'], ['escudo', 'Antifraude', 'Revisa que la cuenta no esté en otra persona']].map(([i, t, s2]) => `<li><div class="fila">${lead('', i)}<span class="medio"><b>${t}</b><small>${s2}</small></span><span></span></div></li>`).join('')}
            </ul></article>
            <label class="soltar" for="np-docs">${ic('camara')}<span><b>Fotos de la cédula y el RIF</b>Van al expediente digital.</span></label><input id="np-docs" type="file" accept="image/*" class="sr-only" multiple>
            <button class="btn pri full" data-acc="emp-crear">${ic('check', 's')}Crear la ficha</button>
            <button class="btn ghost" data-sub="lista">${ic('atras', 's')}Volver</button></div></div>`;
      return `<div class="pagina">${A.cab('Recursos humanos', 'Personal', 'La ficha de cada persona: contrato, turno, cumpleaños, cuenta, expediente, vacaciones y préstamos. Nadie se borra: quien se va queda como egresado.', sub !== 'nueva' ? A.boton('personal', 'Nueva persona', 'data-sub="nueva"', { icono: 'mas' }) : '')}
        ${g ? notaAgrupada('Ves quién trabaja, en qué y en qué turno. Sueldos y cuentas solo los ven el dueño, RRHH y contabilidad; los expedientes y los temas de salud, solo el dueño y RRHH.') : !edP() ? notaAgrupada('Los expedientes y los temas de salud solo los ven el dueño y RRHH.') : ''}
        ${sub === 'nueva' ? '' : A.subnav([['lista', 'Personas'], ['avisos', 'Avisos', avisos.length], ['egresos', 'Altas y egresos'], edP() ? ['legal', 'Protección y disciplina'] : null], sub)}${cuerpo}</div>`;
    },
  };
  ACC['emp-crear'] = () => {
    const n = ($('#np-nombre') || {}).value; if (!n || n.trim().length < 3) { A.aviso('Escribe el nombre para crear la ficha.', 'info'); return; }
    A.auditar({ modulo: 'Personal', registro: n.trim(), campo: 'creado', despues: 'ficha nueva' }); P.nueva = true; A.pintarPagina();
  };
  ACC['emp-volver'] = () => { P.nueva = false; A.ir('personal/lista'); };
  ACC['emp-otra'] = () => { P.nueva = false; A.pintarPagina(); };
  ACC.egreso = id => {
    const e = id ? emp(id) : null;
    A.pedirMotivo({ titulo: e ? 'Registrar el egreso de ' + e.nombre : 'Registrar un egreso', texto: 'Escribe el motivo: renuncia, fin de contrato o despido (este último solo con la calificación de la Inspectoría mientras dure la inamovilidad). La app arma la liquidación, descuenta lo que deba y le quita el acceso a los grupos.', boton: 'Registrar el egreso', tono: 'peligro', codigo: e ? { que: 'Egreso de ' + esc(e.nombre), det: esc(e.cargo) + ' · ingresó el ' + esc(e.ingreso) + ' · la app arma su liquidación', boton: 'Registrar el egreso', tono: 'peligro' } : true })
      .then(m => { if (e) { e.estado = 'egresado'; e.egreso = 'Lun 5 oct 2026'; e.motivoEgreso = m; A.auditar({ modulo: 'Personal', registro: e.nombre, campo: 'estado', antes: 'activo', despues: 'egresado', motivo: m }); A.pintarFicha(); } A.pintarPagina(); A.aviso('Egreso registrado. La liquidación quedó por aprobar: vence en 5 días.'); }).catch(() => {});
  };
  ACC.constancia = id => A.aviso('Constancia de trabajo de ' + emp(id).nombre + ' lista para descargar, con los datos de la ficha. Queda registrada en su expediente. (Simulado)');
  ACC['prestamo-para'] = id => { PR.form = { ...prestVacio(), emp: id }; PR.hecho = false; A.cerrarFicha(); A.ir('prestamos/nuevo'); };

  FICHAS.empleado = id => {
    const e = emp(id); const g = nivel('personal') === 'g' || !puede('personal');
    const h = D.HORAS.filas[id]; const vac = D.VACACIONES.filter(v => v.emp === id);
    const pres = D.PRESTAMOS.filter(p => p.emp === id && p.estado !== 'rechazado'); const ade = D.ADELANTOS.filter(a => a.emp === id && a.estado === 'por_descontar');
    const deuda = pres.filter(vivo).reduce((s2, p) => s2 + saldo(p), 0) + ade.reduce((s2, a) => s2 + a.monto, 0);
    const acciones = [];
    if (edP()) acciones.push({ txt: 'Constancia de trabajo', acc: 'constancia', icono: 'descargar' });
    if (puede('nomina', 'editar') && e.estado !== 'egresado') acciones.push({ txt: 'Nuevo préstamo', acc: 'prestamo-para', icono: 'prestamo' });
    if (edP() && e.estado !== 'egresado') acciones.push({ txt: 'Registrar egreso', acc: 'egreso', icono: 'salir', tono: 'ghost' });
    return { titulo: e.nombre, sub: esc(e.cargo) + ' · ' + esc(e.area), mod: 'personal', obj: e, registro: 'Ficha de ' + e.nombre,
      tags: [[e.formal ? 'Nómina formal' : 'Nómina interna', e.formal ? 'info' : ''], ...(e.estado !== 'activo' ? [[A.estadoTag(e.estado).replace(/<[^>]+>/g, ''), e.estado === 'egresado' ? '' : 'lila']] : []), ...(proxCumple(e) === 0 ? [['Hoy cumple ' + cumpleAnios(e), 'lila']] : [])],
      aviso: e.estado === 'egresado' ? `<p class="nota aviso">${ic('salir', 's')}<span>Salió el ${esc(e.egreso)} (${esc(e.motivoEgreso).toLowerCase()}). ${puede('nomina') ? '<button class="enlace" data-abrir="liquidacion:lq1">Ver su liquidación</button>' : ''}</span></p>` : '',
      bloques: [
        { titulo: 'Ficha', filas: [
          { l: 'Cédula', v: e.ci ? esc(e.ci) : tag('Falta', 'aviso') },
          { l: 'Cargo', v: esc(e.cargo), campo: { k: 'cargo', tipo: 'texto' } },
          { l: 'Área', v: esc(e.area), campo: { k: 'area', tipo: 'select', opciones: ['Cocina', 'Servicio', 'Caja', 'Delivery', 'Seguridad', 'Limpieza'] } },
          { l: 'Turno', v: esc(e.turno) + ' · ' + esc(D.TURNOS[e.turno][0].toLowerCase()) + ', ' + esc(D.TURNOS[e.turno][1]), campo: { k: 'turno', tipo: 'select', opciones: Object.entries(D.TURNOS).map(([k, [n]]) => [k, k + ' · ' + n]) } },
          { l: 'Ingresó', v: esc(e.ingreso) + (e.anios ? ' · ' + e.anios + (e.anios === 1 ? ' año' : ' años') : ' · menos de 1 año') },
          { l: 'Cumpleaños', v: e.nac ? fd([e.nac[0], e.nac[1]]) + ` · cumple ${cumpleAnios(e)}` + (proxCumple(e) === 0 ? ' ' + tag('Hoy', 'lila') : proxCumple(e) <= 7 ? ' ' + tag('En ' + proxCumple(e) + ' días', 'lila') : '') : tag('Sin fecha', 'aviso') },
          { l: 'Contrato', v: esc(e.contrato) + (yaFijo(e) ? ' ' + tag('Ya es indeterminado (fijo)', 'alerta') : e.contratoVence ? ' · vence el ' + fd(e.contratoVence) : '') },
          ...(e.prueba ? [{ l: 'Período de prueba', v: 'Termina el ' + fdl(e.prueba) + ' ' + tag('En ' + diasHasta(e.prueba) + ' días', 'aviso') }] : []),
        ] },
        { titulo: 'Pago', oculto: !ve(), filas: [
          { l: 'Cómo se le paga', v: e.tipoSal === 'por_dia' ? 'Tarifa por día' : 'Sueldo quincenal (el día vale el sueldo ÷ 15)' },
          e.tipoSal === 'por_dia' ? { l: 'Tarifa por día ($)', v: dinero(e.diaria), campo: { k: 'diaria', tipo: 'dinero', sensible: true, obligatorio: true } } : { l: 'Sueldo quincenal ($)', v: dinero(e.sueldo, 'usd', 0), campo: { k: 'sueldo', tipo: 'dinero', sensible: true, obligatorio: true } },
          { l: '% del 10 % de servicio', v: fmt(e.pct, 1) + ' %', campo: { k: 'pct', tipo: 'numero', obligatorio: true } },
          { l: 'Cuenta para pagarle', v: esc(e.cuenta) + (e.cuentaNueva ? ' ' + tag('Por verificar', 'alerta') : e.cuentaVerificada ? ` <small class="tenue">${esc(e.cuentaVerificada)}</small>` : ''), campo: { k: 'cuenta', tipo: 'texto', sensible: true } },
          ...(e.cuentaVieja ? [{ l: 'Cuenta anterior', v: esc(e.cuentaVieja) + ' <small class="tenue">ya no se usa</small>' }] : []),
          { l: 'Titular de la cuenta', v: esc(e.titular) + (/\(V-/.test(e.titular) ? ' ' + tag('Familiar', 'info') : '') },
        ] },
        // una cuenta que cambió queda por verificar: en Pagar la nómina no se le paga ahí hasta que Alejandro la confirme con la persona
        { oculto: !ve() || !e.cuentaNueva, html: `<p class="nota alerta">${ic('candado', 's')}<span><b>Cuenta por verificar.</b> ${esc(e.cuentaNueva || '')}. En Pagar la nómina no se le paga ahí hasta que Alejandro la confirme con la persona.</span></p>` },
        { titulo: 'Horas de la última quincena', oculto: !h, extra: ' <small class="tenue">16 al 30 sep · ejemplo</small>', html: h ? `<dl class="kv"><div><dt>Trabajó</dt><dd>${fmt(h.trab, h.trab % 1 ? 1 : 0)} h de ${h.prog} h ${h.trab < h.prog - 4 ? tag('Faltan ' + fmt(h.prog - h.trab, 0) + ' h', 'aviso') : ''}</dd></div><div><dt>Redobles</dt><dd>${h.redobles || 'Ninguno'}</dd></div><div><dt>Horas de noche (7 p. m. a 5 a. m.)</dt><dd>${h.noct ? h.noct + ' h' : 'Ninguna'}</dd></div><div><dt>Domingos o feriados trabajados</dt><dd>${h.dom ? h.dom + (h.dom === 1 ? ' día' : ' días') : 'Ninguno'}</dd></div><div><dt>Llegadas tarde</dt><dd>${h.tarde ? h.tarde + ' min en total' : 'Ninguna'}</dd></div><div><dt>Faltas</dt><dd>${h.faltas || 'Ninguna'}</dd></div></dl><button class="enlace" data-ir="asistencia/horas">Ver las horas de todos ${ic('derecha', 's')}</button>` : '' },
        { titulo: 'Vacaciones', html: `<p>${esc(e.vacaciones)}.</p>${vac.map(v => `<button class="enlace" data-abrir="vacacion:${v.id}">${esc(v.periodo)} · ${v.dias} días ${ic('derecha', 's')}</button>`).join('')}` },
        { titulo: 'Préstamos y descuentos', oculto: !puede('nomina'), html: !ve() ? `<p class="muted">${deuda ? 'Tiene préstamos o adelantos vivos.' : 'Sin préstamos.'} El detalle lo ven el dueño, RRHH y contabilidad.</p>`
          : (pres.length || ade.length ? `<ul class="lista">${pres.map(p => `<li><button class="fila" data-abrir="prestamo:${p.id}">${lead(vivo(p) ? 'aviso' : '', 'prestamo')}<span class="medio"><b>Préstamo de ${dinero(p.monto, 'usd', 0)}</b><small>${p.pagadas} de ${p.cuotas} cuotas · ${esc(p.motivo)}</small></span><span class="fin">${vivo(p) ? 'Debe ' + dinero(saldo(p), 'usd', 0) : A.estadoTag(p.estado)}</span></button></li>`).join('')}${ade.map(a => `<li><button class="fila" data-abrir="adelanto:${a.id}">${lead('aviso', 'menos')}<span class="medio"><b>Adelanto de ${dinero(a.monto, 'usd', 0)}</b><small>Se descuenta el ${esc(a.descuenta)}</small></span><span class="fin">${A.estadoTag(a.estado)}</span></button></li>`).join('')}</ul>` : '<p class="muted">No tiene préstamos ni adelantos.</p>') },
        { titulo: 'Expediente', oculto: !edP(), adjuntos: ['Cédula.jpg', 'Contrato' + (/contrato/.test(e.docs) ? ' (sin firmar)' : '') + '.pdf', 'Certificado de salud.pdf', 'Acuerdo del cestaticket.pdf'] },
        { oculto: !edP() || e.docs === 'Completo', html: `<p class="nota aviso">${ic('alerta', 's')}<span>${esc(e.docs)}.</span></p>` },
        { titulo: 'Salud', oculto: !edP(), filas: [{ l: 'Certificado de salud', v: esc(e.cert) + (e.certOk ? '' : ' ' + tag(/trámite/.test(e.cert) ? 'En trámite' : 'Vencido', 'alerta')) }, { l: 'Contacto de emergencia', v: esc(e.emergencia) }] },
        { titulo: 'Historial', tiempo: [[esc(e.ingreso), 'Ingresó como ' + esc(e.cargo.toLowerCase()) + '.'], ...(e.anios >= 2 ? [['ene 2026', 'Aumento del sueldo base (motivo: revisión anual).']] : []), ...(ve() ? pres.filter(vivo).map(p => [esc(p.fecha), 'Préstamo de ' + dinero(p.monto, 'usd', 0) + '.']) : []), ...(e.estado === 'egresado' ? [[esc(e.egreso), 'Egreso por ' + esc(e.motivoEgreso).toLowerCase() + '.', 'alerta']] : [])] },
      ], acciones,
      // cambiar la cuenta la deja por verificar y le avisa a Alejandro, como la de un proveedor
      alGuardar: cambios => {
        const c = cambios.find(x => x.r.campo.k === 'cuenta'); if (!c) return;
        e.cuentaVieja = c.antes; e.cuentaNueva = S.usuario.nombre + ' la cambió hoy con su código'; delete e.cuentaVerificada;
        if (S.usuario.id !== 'alejandro') D.PENDIENTES.unshift({ id: 'pe' + Date.now(), para: ['alejandro'], tipo: 'alerta', titulo: 'Una persona del personal cambió de cuenta', sub: e.nombre + ' · confírmala con la persona antes de pagarle', de: S.usuario.nombre, edad: 'Ahora', ir: 'pagos', sub2: 'nomina', emp: e.id });
      } };
  };
  // la protección y la disciplina tocan la salud y el expediente: solo el dueño y RRHH (los demás no llegan aquí; si llegan, no ven el detalle)
  const soloRRHH = (titulo, sub) => ({ titulo, sub, mod: 'personal', bloques: [{ html: notaAgrupada('El detalle lo ven el dueño y RRHH: toca la salud o el expediente de la persona.') }] });
  FICHAS.fuero = id => { const f = D.FUEROS.find(x => x.id === id); if (!edP()) return soloRRHH('Protección: ' + emp(f.emp).nombre, 'Personal'); return { titulo: 'Protección: ' + emp(f.emp).nombre, sub: esc(f.tipo), mod: 'personal', obj: f, bloques: [{ filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${f.emp}">${esc(emp(f.emp).nombre)}</button>` }, { l: 'Tipo', v: esc(f.tipo) }, { l: 'Desde', v: esc(f.desde) }, { l: 'Hasta', v: esc(f.hasta), campo: { k: 'hasta', tipo: 'texto' } }] }, { html: '<p class="muted">Mientras dure, no se le puede despedir, trasladar ni bajar el sueldo sin la autorización de la Inspectoría. La app avisa 30 días antes de que termine.</p>' }] }; };
  FICHAS.amonestacion = id => { const a = D.AMONESTACIONES.find(x => x.id === id); if (!edP()) return soloRRHH('Amonestación a ' + emp(a.emp).nombre, 'Personal'); return { titulo: 'Amonestación a ' + emp(a.emp).nombre, sub: esc(a.fecha), mod: 'personal', obj: a, registro: 'Amonestación ' + emp(a.emp).nombre, tags: [[a.quedan + ' días para pedir la calificación', 'aviso']], bloques: [{ filas: [{ l: 'Qué pasó', v: esc(a.hechos), largo: true, campo: { k: 'hechos', tipo: 'area' } }, { l: 'Tipo', v: esc(a.tipo) }, { l: 'Firma', v: esc(a.firma) }] }, { titulo: 'Documento', adjuntos: ['Amonestación ' + a.fecha + '.pdf'] }, { html: '<p class="muted">Tres faltas sin justificar en 30 días son causa de despido. Con la inamovilidad, primero se pide la calificación a la Inspectoría, y hay 30 días desde la falta para hacerlo.</p>' }] }; };

  /* =============== ASISTENCIA Y HORAS =============== */
  const CT = { 1: ['t1', 'Mañana'], 2: ['t2', 'Tarde'], 3: ['t3', 'Noche'], D: ['td', 'Descanso'], V: ['tv', 'Vacaciones'], R: ['tr', 'Reposo'] };
  PANT.asistencia = {
    titulo: 'Asistencia y horas', corto: 'Asistencia', tab: 'Asistencia', grupo: 'Recursos humanos', icono: 'reloj', mod: 'personal', palabras: 'horario turnos faltas reloj',
    secciones: [['semana', 'Horario de la semana', 'turno turnos'], ['horas', 'Horas trabajadas', 'horas extra nocturnas'], ['faltas', 'Faltas y justificativos', 'falta inasistencia'], ['redobles', 'Redobles y días extra', 'redoble doblar'], ['incidencias', 'Horas que no cuadran', 'incidencia'], ['reloj', 'Reloj', 'biometrico marcas excel']],
    cuenta: () => edP() ? D.FALTAS.filter(f => f.estado === 'por_justificar').length : ['r', 'a'].includes(nivel('nomina')) ? D.REDOBLES.filter(r => !r.revisado).length : 0,
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
          ${A.tabla({ cols: [{ t: 'Falta', cls: 'p' }, { t: 'Turno', cls: 'x' }, { t: 'Qué pasó', cls: 'x' }, { t: 'Estado', cls: 'e' }], filas: D.FALTAS.map(f => ({ abrir: 'falta:' + f.id, celdas: [`<b>${esc(emp(f.emp).nombre)}</b><small>${esc(f.fecha)}</small>`, esc(f.turno), edP() ? esc(f.nota) : '<span class="tenue">Solo RRHH</span>', A.estadoTag(f.estado)] })) })}
          <p class="nota info">${ic('info', 's')}<span>El reloj solo dice que alguien no vino. Andreina decide si la falta está justificada y adjunta el soporte (justificativo médico, constancia o permiso). 3 faltas sin justificar en 30 días son causa de despido, siempre con la calificación de la Inspectoría mientras dure la inamovilidad.</span></p>`;
      }
      if (sub === 'redobles') {
        const sin = D.REDOBLES.filter(r => !r.revisado);
        const monto = r => { const d = diario(emp(r.emp)); return (r.tipo === 'redoble' ? .5 : 1.5) * d * r.veces; };
        const cols = [{ t: 'Persona', cls: 'p' }, { t: 'Qué', cls: 'x' }, { t: 'Detalle', cls: 'x' }]; if (verMonto) cols.push({ t: 'Se le paga', cls: 'r plata' }); cols.push({ t: 'Revisión', cls: 'e' });
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Sin revisar', valor: sin.length, sub: 'los revisa Jose antes de la nómina', tono: sin.length ? 'aviso' : '', abrir: sin[0] ? 'redoble:' + sin[0].id : '' })}${verMonto ? A.cifra({ etq: 'Entran en la nómina del 15', valor: dinero(D.REDOBLES.reduce((s2, r) => s2 + monto(r), 0)), sub: D.REDOBLES.length + ' días', ir: 'nomina/quincena' }) : ''}${A.cifra({ etq: 'Redoble', valor: '½ día', sub: 'doblar turno paga medio día más' })}${A.cifra({ etq: 'Día extra', valor: '1½ días', sub: 'trabajar el día de descanso' })}</div>
          ${A.tabla({ cols, filas: D.REDOBLES.map(r => { const c = [`<b>${esc(emp(r.emp).nombre)}</b><small>${esc(r.fecha)}</small>`, r.tipo === 'redoble' ? 'Redoble' : 'Día extra', esc(r.detalle)]; if (verMonto) c.push(dinero(monto(r))); c.push(r.revisado ? tag('Revisado por Jose', 'ok') : tag('Por revisar', 'aviso')); return { abrir: 'redoble:' + r.id, celdas: c }; }) })}
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
      return `<div class="pagina">${A.cab('Recursos humanos', 'Asistencia y horas', 'Quién trabaja cada día, las horas reales, las faltas con su justificativo y los redobles que entran en la nómina.')}
        ${sub !== 'reloj' && sub !== 'semana' ? `<p class="nota aviso">${ic('reloj', 's')}<span>El reloj todavía no está conectado (falta la muestra del Excel). Las horas de esta pantalla son un ejemplo de cómo se verán.</span></p>` : ''}
        ${A.subnav([['semana', 'Horario de la semana'], ['horas', 'Horas trabajadas'], ['faltas', 'Faltas y justificativos', D.FALTAS.filter(f => f.estado === 'por_justificar').length], ['redobles', 'Redobles y días extra', D.REDOBLES.filter(r => !r.revisado).length], ['incidencias', 'Horas que no cuadran', D.INCIDENCIAS.filter(x => x.estado === 'alertada').length], ['reloj', 'Reloj']], sub)}${cuerpo}</div>`;
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
  // «Dejar sin justificar» va de un toque, como «Llegó» y «No vino» en las reservas: se puede deshacer durante 10 segundos y después
  // «Corregir» abre la edición con el estado (pide el motivo); «Justificada» solo se ofrece si hay soporte
  const DESHACER_MS = 10000;
  const MARCA_F = { id: null, antes: null, clasifico: '', est: null, hasta: 0, t: null, iv: null, pend: [] };
  const deshacibleF = f => MARCA_F.id === f.id && f.estado === MARCA_F.est && Date.now() < MARCA_F.hasta;
  const quedanF = () => Math.max(0, Math.ceil((MARCA_F.hasta - Date.now()) / 1000));
  FICHAS.falta = id => {
    const f = D.FALTAS.find(x => x.id === id); const e = emp(f.emp); const por = f.estado === 'por_justificar', sinSop = f.estado === 'justificada_sin';
    const opcionesEstado = [['por_justificar', 'Por justificar'], ...(f.soporte ? [['justificada', 'Justificada']] : []), ['justificada_sin', 'Justificada sin soporte'], ['injustificada', 'Sin justificar']];
    const acciones = por ? [{ txt: 'Dejar sin justificar', acc: 'falta-clas', arg: f.id + '|injustificada', solo: 'editar' }, { txt: 'Justificada', acc: 'falta-just', arg: f.id, tono: 'pri', icono: f.soporte ? 'check' : 'camara', solo: 'editar' }]
      : deshacibleF(f) ? [{ txt: 'Deshacer', html: `Deshacer<span aria-hidden="true">· <span class="quedan">${quedanF()}</span> s</span>`, acc: 'falta-deshacer', arg: f.id, tono: 'pri', icono: 'refrescar', solo: 'editar' }] : [];
    return { titulo: 'Falta de ' + e.nombre, sub: esc(f.fecha) + ' · turno ' + esc(f.turno), mod: 'personal', obj: f, registro: 'Falta ' + e.nombre + ' ' + f.fecha, tags: [[A.estadoTag(f.estado).replace(/<[^>]+>/g, ''), por || sinSop ? 'aviso' : '']],
      aviso: (f.mes >= 2 ? `<p class="nota alerta">${ic('alerta', 's')}<span>Es la ${f.mes}.ª falta sin justificar en 30 días. A la 3.ª hay causa de despido (con calificación de la Inspectoría).</span></p>` : '')
        + (sinSop ? `<p class="nota aviso">${ic('alerta', 's')}<span><b>Justificada sin soporte.</b> No se descuenta, pero no tiene el papel.${edP() ? ' Si lo traen, súbelo abajo y queda con su sello.' : ''}</span></p>` : ''),
      bloques: [{ filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${e.id}">${esc(e.nombre)}</button>` }, ...(edP() ? [{ l: 'Qué pasó', v: esc(f.nota), largo: true, campo: { k: 'nota', tipo: 'area' } }] : []), ...(!por ? [{ l: 'Estado', v: A.estadoTag(f.estado), campo: { k: 'estado', tipo: 'select', opciones: opcionesEstado } }] : []), { l: 'La clasificó', v: esc(f.clasifico || 'Nadie todavía') }, ...(sinSop && edP() ? [{ l: 'Por qué sin papel', v: esc(f.motivoSin || '—'), largo: true }] : [])] },
        // el soporte puede traer el diagnóstico: el archivo solo lo ven el dueño y RRHH
        !edP() ? { titulo: 'Soporte', html: `<p class="nota gris">${ic('candado', 's')}<span>${f.soporte ? 'Tiene soporte · lo ven el dueño y RRHH.' : sinSop ? 'Justificada sin soporte.' : 'Falta el soporte.'}</span></p>` }
          : f.soporte ? { titulo: 'Soporte', adjuntos: [f.soporte] }
          : sinSop ? { titulo: 'Soporte', html: `<label class="soltar" for="fa-${f.id}">${ic('camara')}<span><b>Subir el justificativo</b>Foto del justificativo médico, la constancia o el permiso. Al subirlo queda justificada, con su sello.</span></label><input id="fa-${f.id}" data-subir-falta="${f.id}" type="file" accept="image/*,application/pdf" class="sr-only">` }
          : por ? { titulo: 'Soporte', html: `<p class="muted">${ic('camara', 'xs')} Para dejarla justificada hace falta la foto del justificativo: «Justificada» abre la cámara o la galería.</p>` }
          : { titulo: 'Soporte', html: '<p class="muted">Sin soporte.</p>' },
        { html: '<p class="muted">Justificada: no se descuenta. Sin justificar: se descuenta el día en la nómina y cuenta para las 3 del mes.</p>' }],
      acciones,
      enlaces: por && !f.soporte ? [{ txt: 'No hay papel: justificar con el motivo', acc: 'falta-sin', arg: f.id, solo: 'editar' }] : [],
      // ya clasificada: «Corregir» abre la edición en el estado y pide el motivo
      editar: por ? 'Editar' : 'Corregir', editarTono: por ? undefined : 'sec', focoEditar: por ? '' : 'estado', guardar: por ? undefined : 'Guardar la corrección', guardado: por ? undefined : 'Corregido. Quedó en el registro de cambios.',
      alGuardar: (cambios, motivo) => { const c = cambios.find(x => x.r.campo.k === 'estado'); if (!c) return; f.clasifico = c.nuevo === 'por_justificar' ? '' : A.S.usuario.nombre; if (c.nuevo === 'justificada_sin') f.motivoSin = motivo; pendFalta(f); } };
  };
  // el pendiente «Clasificar la falta de…» se cierra al clasificarla y vuelve a abrirse si regresa a «Por justificar»
  const pendFalta = f => D.PENDIENTES.filter(p => p.abrir === 'falta:' + f.id).forEach(p => { if (f.estado === 'por_justificar') p.hecho = ''; else if (!p.hecho) p.hecho = 'La clasificó ' + A.S.usuario.nombre + ': ' + A.estadoTxt(f.estado).toLowerCase(); });
  const clasificar = (f, est, motivo = '') => { const antes = f.estado; f.estado = est; f.clasifico = A.S.usuario.nombre; A.auditar({ modulo: 'Asistencia', registro: 'Falta ' + emp(f.emp).nombre, campo: 'estado', antes: A.estadoTxt(antes), despues: A.estadoTxt(est), motivo }); pendFalta(f); A.pintarFicha(); A.pintarPagina(); };
  // «Dejar sin justificar» → «Quedó sin justificar», con «Deshacer» 10 segundos (el teclado va ahí); a los 10 segundos deja su sitio a «Corregir»
  ACC['falta-clas'] = arg => {
    const [id, est] = arg.split('|'); if (est === 'justificada') { ACC['falta-just'](id); return; }
    const f = D.FALTAS.find(x => x.id === id); const antes = f.estado, clasifico = f.clasifico || '';
    const abiertos = D.PENDIENTES.filter(p => p.abrir === 'falta:' + id && !p.hecho);
    clearTimeout(MARCA_F.t); clearInterval(MARCA_F.iv);
    Object.assign(MARCA_F, { id, antes, clasifico, est, hasta: Date.now() + DESHACER_MS, pend: abiertos });
    MARCA_F.iv = setInterval(() => { const n = document.querySelector('[data-acc="falta-deshacer"] .quedan'); if (n) n.textContent = quedanF(); }, 250);
    MARCA_F.t = setTimeout(() => {
      clearInterval(MARCA_F.iv); const fid = MARCA_F.id; MARCA_F.id = null;
      if (!(A.S.ficha && A.S.ficha.tipo === 'falta' && A.S.ficha.id === fid && !A.S.ficha.editando)) return;
      const enDeshacer = document.activeElement && document.activeElement.matches && document.activeElement.matches('[data-acc="falta-deshacer"]');
      A.pintarFicha(); if (enDeshacer) { const c = document.querySelector('#ficha-raiz [data-ficha="editar"]'); if (c) c.focus({ preventScroll: true }); }
    }, DESHACER_MS);
    clasificar(f, est);
    const d = document.querySelector('#ficha-raiz [data-acc="falta-deshacer"]'); if (d) d.focus({ preventScroll: true });
    A.aviso('Quedó sin justificar. Se descuenta el día en la nómina del 15. Puedes deshacerlo durante 10 segundos.');
  };
  ACC['falta-deshacer'] = id => {
    const f = D.FALTAS.find(x => x.id === id);
    if (!f || !deshacibleF(f)) { A.aviso('Ya pasaron los 10 segundos: para cambiarlo, toca «Corregir».', 'info'); if (A.S.ficha) A.pintarFicha(); return; }
    const est = f.estado; f.estado = MARCA_F.antes; f.clasifico = MARCA_F.clasifico; MARCA_F.pend.forEach(p => { p.hecho = ''; });
    clearTimeout(MARCA_F.t); clearInterval(MARCA_F.iv); MARCA_F.id = null;
    A.auditar({ modulo: 'Asistencia', registro: 'Falta ' + emp(f.emp).nombre, campo: 'estado', antes: A.estadoTxt(est), despues: A.estadoTxt(f.estado), motivo: 'Deshecho a los pocos segundos de marcarlo' });
    A.pintarFicha(); A.pintarPagina(); A.aviso('Deshecho: vuelve a «' + A.estadoTxt(f.estado) + '».');
  };
  ACC['falta-just'] = id => {
    const f = D.FALTAS.find(x => x.id === id);
    const listo = () => { clasificar(f, 'justificada', 'Con su soporte: ' + f.soporte); A.aviso('Justificada con su soporte. No se descuenta.'); };
    if (f.soporte) { listo(); return; }
    A.pedirArchivo(file => { f.soporte = file.name; listo(); });
  };
  ACC['falta-sin'] = id => {
    const f = D.FALTAS.find(x => x.id === id);
    A.pedirMotivo({ titulo: 'Justificar sin soporte', texto: 'No se descuenta, pero queda «Justificada sin soporte»: sin el papel no lleva sello. Si lo traen después, se sube en esta ficha y queda con su sello.', etiqueta: 'Por qué se justifica sin papel', boton: 'Justificar sin soporte' })
      .then(m => { f.motivoSin = m; clasificar(f, 'justificada_sin', m); A.aviso('Justificada sin soporte. No se descuenta.'); }).catch(() => {});
  };
  // lo que se sube en una ficha: el justificativo de una falta sin soporte, la foto de un justificativo médico y la autorización de un préstamo
  // (solo cuenta si hay un archivo: sin archivo no cambia nada)
  const subirReposo = (r, nombre) => {
    r.soporte = nombre; const f = r.falta ? D.FALTAS.find(x => x.id === r.falta) : null; if (f && !f.soporte) f.soporte = nombre;
    A.auditar({ modulo: 'Vacaciones y reposos', registro: (r.tipo === 'reposo' ? 'Reposo ' : 'Justificativo ') + emp(r.emp).nombre, campo: 'foto', antes: 'falta', despues: nombre });
    return f;
  };
  document.addEventListener('change', e => {
    const t = e.target; if (!t || !t.matches || !t.files || !t.files.length) return;
    const nombre = t.files[0].name;
    if (t.matches('#ficha-raiz [data-subir-falta]')) {
      const f = D.FALTAS.find(x => x.id === t.dataset.subirFalta); if (!f) return; f.soporte = nombre;
      clasificar(f, 'justificada', 'Subió el soporte: ' + nombre); A.aviso('Soporte subido: queda justificada, con su sello.');
    } else if (t.matches('#ficha-raiz [data-subir-reposo]')) {
      const r = D.REPOSOS.find(x => x.id === t.dataset.subirReposo); if (!r) return; const f = subirReposo(r, nombre);
      A.pintarFicha(); A.pintarPagina(); A.aviso('Foto subida.' + (f ? ' Quedó junto a la falta del ' + f.fecha.toLowerCase() + (f.estado === 'por_justificar' ? ': falta clasificarla.' : '.') : ''));
    } else if (t.matches('#ficha-raiz [data-firma-prest]')) {
      const p = D.PRESTAMOS.find(x => x.id === t.dataset.firmaPrest); if (!p) return; p.firmada = true; p.firmaArchivo = nombre;
      A.auditar({ modulo: 'Préstamos', registro: 'Préstamo ' + emp(p.emp).nombre, campo: 'autorización de descuento', antes: 'falta', despues: 'subida: ' + nombre });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Autorización subida. Ya se puede descontar.');
    }
  });
  FICHAS.redoble = id => {
    const r = D.REDOBLES.find(x => x.id === id); const e = emp(r.emp); const d = diario(e); const f = r.tipo === 'redoble' ? .5 : 1.5;
    const revisa = ['r', 'a'].includes(nivel('nomina'));
    return { titulo: (r.tipo === 'redoble' ? 'Redoble de ' : 'Día extra de ') + e.nombre, sub: esc(r.fecha), mod: 'nomina', obj: r, registro: 'Redoble ' + e.nombre + ' ' + r.fecha, tags: [[r.revisado ? 'Revisado por Jose' : 'Por revisar', r.revisado ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${e.id}">${esc(e.nombre)}</button>` }, { l: 'Qué pasó', v: esc(r.detalle), largo: true, campo: { k: 'detalle', tipo: 'area' } }, { l: 'De dónde salió', v: esc(r.fuente) }, ...(ve() ? [{ l: 'Cómo se paga', v: `${dinero(d)} el día × ${String(f).replace('.', ',')} = <b>${dinero(d * f * r.veces)}</b>` }] : [])] },
        { html: '<p class="muted">Redoble: doblar el turno paga medio día más. Día extra: trabajar en el día de descanso paga día y medio (el recargo legal del 50 %), y se le debe el descanso la semana siguiente.</p>' }],
      acciones: !r.revisado && revisa ? [{ txt: 'Revisado', acc: 'redoble-ok', arg: r.id, tono: 'pri', icono: 'check' }] : [] };
  };
  ACC['redoble-ok'] = id => { const r = D.REDOBLES.find(x => x.id === id); r.revisado = true; A.auditar({ modulo: 'Asistencia', registro: 'Redoble ' + emp(r.emp).nombre, campo: 'revisión', antes: 'por revisar', despues: 'revisado' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Revisado. Entra en la nómina del 15.'); };
  FICHAS.incidencia = id => {
    const x = D.INCIDENCIAS.find(i => i.id === id); const e = emp(x.emp);
    // módulo de nómina: lo acordado lo anotan Jose (revisa) y Andreina (prepara), no solo quien edita Personal (29-ago)
    // lo que ya está acordado va entre las opciones: así guardar sin tocarlo no lo borra
    const acuerdos = ['Se descuentan las horas', 'No se descuenta (tenía justificación)', 'Las compensa la semana que viene'];
    const opciones = [['', 'Sin acordar']].concat(acuerdos, x.acuerdo && !acuerdos.includes(x.acuerdo) ? [x.acuerdo] : []);
    return { titulo: 'Horas de ' + e.nombre, sub: esc(x.periodo), mod: 'nomina', moduloNombre: 'Asistencia', obj: x, registro: 'Horas ' + e.nombre + ' ' + x.periodo, tags: [[A.estadoTag(x.estado).replace(/<[^>]+>/g, ''), x.estado === 'resuelta' ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'Programadas', v: x.esperadas + ' h' }, { l: 'Trabajadas', v: x.reales + ' h' }, { l: 'Diferencia', v: (x.reales - x.esperadas) + ' h' }, { l: 'Por qué', v: esc(x.causa || '—'), campo: { k: 'causa', tipo: 'area' } }, { l: 'Lo acordado', v: esc(x.acuerdo || 'Sin acordar'), campo: { k: 'acuerdo', tipo: 'select', opciones } }] },
        { html: '<p class="muted">Lo acordado lo anotan Jose o Andreina. Al guardar, la app lo aplica en la nómina y la incidencia queda resuelta. Si se quita lo acordado, vuelve a quedar sin resolver.</p>' }],
      alGuardar: () => { x.estado = x.acuerdo ? 'resuelta' : 'alertada'; } };
  };

  /* =============== VACACIONES, REPOSOS Y PERMISOS =============== */
  PANT.ausencias = {
    titulo: 'Vacaciones y reposos', corto: 'Vacaciones y reposos', tab: 'Vacaciones', grupo: 'Recursos humanos', icono: 'maleta', mod: 'personal', palabras: 'vacacion reposo permiso ausencia',
    secciones: [['libro', 'Libro de vacaciones', 'vacacion bono vacacional'], ['fuera', 'Quién está fuera', 'ausentes'], ['medicos', 'Justificativos y reposos', 'reposo medico ivss'], ['permisos', 'Permisos', 'permiso horas']],
    cuenta: () => edP() ? D.REPOSOS.filter(r => !r.convalidado).length : 0,
    render: (sub = 'libro') => {
      let cuerpo = '';
      if (sub === 'libro') cuerpo = `<div class="cifras">${A.cifra({ etq: 'De vacaciones hoy', valor: D.VACACIONES.filter(v => v.estado === 'disfrutando').length, sub: 'Wilmer regresa el mar 20 oct', abrir: 'vacacion:va3' })}${A.cifra({ etq: 'Programadas', valor: D.VACACIONES.filter(v => v.estado === 'programada').length, sub: 'la próxima: Patricia el 19 oct', abrir: 'vacacion:va2' })}${A.cifra({ etq: 'Por programar', valor: D.VACACIONES.filter(v => v.estado === 'causada').length, sub: 'ya las ganaron', abrir: (v => v ? 'vacacion:' + v.id : '')(D.VACACIONES.find(v => v.estado === 'causada')) })}${A.cifra({ etq: 'Con 2 períodos acumulados', valor: D.VACACIONES.filter(v => v.acumulados >= 2).length, sub: 'el máximo: darlas ya', tono: 'alerta', abrir: 'vacacion:va1' })}</div>
          <div class="sec"><h2>Libro de vacaciones</h2>${A.boton('personal', 'Programar vacaciones', 'data-acc="vac-programar"', { tono: 'sec', icono: 'calendario', chico: true })}</div>
          ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Días', cls: 'r' }, { t: 'Cuándo', cls: 'x' }, { t: 'Quién cubre', cls: 'x' }, { t: 'Estado', cls: 'e' }], filas: D.VACACIONES.map(v => ({ abrir: 'vacacion:' + v.id, celdas: [`<b>${esc(emp(v.emp).nombre)}</b><small>${esc(v.periodo)}</small>`, v.dias + ' <small class="tenue">+ bono ' + v.bono + '</small>', v.desde ? fdl(v.desde) + ' al ' + fdl(v.hasta) : '<span class="tenue">' + esc(v.nota || 'Por programar') + '</span>', esc(v.cubre || '—'), A.estadoTag(v.estado)] })) })}
          <p class="muted">15 días hábiles el primer año y uno más por cada año, hasta 30. El bono vacacional, igual. Se pagan al empezar a disfrutarlas. Se pueden acumular hasta 2 períodos.</p>`;
      if (sub === 'fuera') cuerpo = `<p class="desc">Octubre y noviembre: quién está de vacaciones o de reposo, los cumpleaños${edP() || ve() ? ' y los contratos o períodos de prueba que vencen' : ''}. La raya roja es hoy.</p>
          <article class="hoja">${A.gantt(A.filasPersonal({ conContratos: edP() || ve() }))}</article>
          <button class="enlace" data-ir="calendario/personal">Verlo en el calendario ${ic('derecha', 's')}</button>`;
      if (sub === 'medicos') {
        const cols = [{ t: 'Persona', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Días', cls: 'r' }, { t: 'Soporte', cls: 'e' }];
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'De reposo hoy', valor: D.REPOSOS.filter(r => r.tipo === 'reposo').length, sub: 'Mariela, hasta el 14 oct', abrir: 'reposo:rp1' })}${A.cifra({ etq: 'Justificativos por subir', valor: D.REPOSOS.filter(r => !r.soporte).length, sub: 'sin él la falta queda sin justificar', tono: 'aviso', abrir: 'reposo:rp3' })}${A.cifra({ etq: 'Por convalidar en el IVSS', valor: D.REPOSOS.filter(r => r.tipo === 'reposo' && !r.convalidado).length, sub: 'reposos de más de 3 días', abrir: (r => r ? 'reposo:' + r.id : '')(D.REPOSOS.find(r => r.tipo === 'reposo' && !r.convalidado)) })}</div>
          ${A.tabla({ cols, filas: D.REPOSOS.map(r => ({ abrir: 'reposo:' + r.id, celdas: [`<b>${esc(emp(r.emp).nombre)}</b><small>${fd(r.desde)}${r.dias > 1 ? ' al ' + fd(r.hasta) : ''}${edP() ? ' · ' + esc(r.motivo) : ''}</small>`, r.tipo === 'reposo' ? 'Reposo' : 'Justificativo', r.dias, r.soporte ? (r.tipo === 'reposo' && !r.convalidado ? tag('Falta el IVSS', 'lila') : tag('Con foto', 'ok')) : tag('Falta la foto', 'aviso')] })) })}
          ${edP() ? `<label class="soltar" for="med-foto">${ic('camara')}<span><b>Subir un justificativo médico</b>Foto o PDF. La app lo junta con la falta de ese día.</span></label><input id="med-foto" type="file" accept="image/*,.pdf" class="sr-only">` : ''}
          <p class="nota info">${ic('pulso', 's')}<span>Hasta 3 días basta un justificativo médico. Más de 3 días es un reposo del IVSS (o convalidado por el IVSS). En la nómina formal, desde el día 4 el IVSS paga 2/3 y el negocio 1/3.${edP() ? '' : ' El motivo médico solo lo ven el dueño y RRHH.'}</span></p>`;
      }
      if (sub === 'permisos') cuerpo = `<p class="desc">Permisos de horas o de un día, con su motivo y si se pagan o no.</p>
        ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Cuándo', cls: 'x' }, { t: 'Tipo', cls: 'x' }, { t: 'Soporte', cls: 'e' }], filas: D.PERMISOS_EMP.map(p => ({ abrir: 'permisoemp:' + p.id, celdas: [`<b>${esc(emp(p.emp).nombre)}</b><small>${esc(p.motivo)}</small>`, esc(p.fecha) + ' · ' + esc(p.horas), esc(p.tipo), p.soporte ? tag('Con constancia', 'ok') : tag('Sin soporte', '')] })) })}
        ${A.boton('personal', 'Registrar un permiso', 'data-acc="pronto"', { tono: 'sec', icono: 'mas' })}`;
      return `<div class="pagina">${A.cab('Recursos humanos', 'Vacaciones, reposos y permisos', 'Las vacaciones se disfrutan: pagarlas sin darlas obliga a darlas otra vez. Aquí se programan, se ve quién está fuera y se guardan los justificativos médicos.')}
        ${A.subnav([['libro', 'Vacaciones'], ['fuera', 'Quién está fuera'], ['medicos', 'Justificativos y reposos', D.REPOSOS.filter(r => !r.soporte || (r.tipo === 'reposo' && !r.convalidado)).length], ['permisos', 'Permisos']], sub)}${cuerpo}</div>`;
    },
    // la foto que se sube aquí se junta con el justificativo que la espera (en el prototipo, el primero sin foto); sin archivo no pasa nada
    montar: raiz => {
      const mf = $('#med-foto', raiz); if (!mf) return;
      mf.addEventListener('change', () => {
        if (!mf.files.length) return; const r = D.REPOSOS.find(x => !x.soporte);
        if (!r) { A.aviso('Recibido: no hay ningún justificativo esperando foto. (Simulado)', 'info'); return; }
        const f = subirReposo(r, mf.files[0].name); A.pintarPagina();
        A.aviso('Recibido: lo juntamos con el justificativo de ' + emp(r.emp).nombre + ' del ' + fd(r.desde) + (f ? ' y con su falta' : '') + '. (Simulado)');
      });
    },
  };
  ACC['vac-programar'] = () => { A.abrir('vacacion', 'va4'); A.S.ficha.editando = true; A.pintarFicha(); };
  FICHAS.vacacion = id => {
    const v = D.VACACIONES.find(x => x.id === id); const e = emp(v.emp);
    if (v.desdeTxt === undefined) { v.desdeTxt = v.desde ? fdl(v.desde) : ''; v.hastaTxt = v.hasta ? fdl(v.hasta) : ''; }
    const base = e.formal ? 'base legal' : 'base de $ ' + D.PRESTA.baseInterna + ' al mes'; const diaB = e.formal ? D.PRESTA.baseFormal / 30 : D.PRESTA.baseInterna / 30;
    return { titulo: 'Vacaciones de ' + e.nombre, sub: esc(v.periodo), mod: 'personal', obj: v, registro: 'Vacaciones ' + e.nombre, tags: v.acumulados >= 2 ? [['2 períodos acumulados', 'alerta']] : [],
      aviso: v.nota && v.acumulados >= 2 ? `<p class="nota alerta">${ic('alerta', 's')}<span>${esc(v.nota)}</span></p>` : '',
      bloques: [{ filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${e.id}">${esc(e.nombre)}</button>` }, { l: 'Días hábiles', v: v.dias }, { l: 'Bono vacacional', v: v.bono + ' días' },
        { l: 'Desde', v: esc(v.desdeTxt || 'Sin fecha'), campo: { k: 'desdeTxt', tipo: 'texto' } }, { l: 'Hasta', v: esc(v.hastaTxt || 'Sin fecha'), campo: { k: 'hastaTxt', tipo: 'texto' } }, ...(v.regresa ? [{ l: 'Regresa', v: esc(v.regresa) }] : []),
        { l: 'Quién cubre', v: esc(v.cubre || '—'), campo: { k: 'cubre', tipo: 'texto' } }, { l: 'Estado', v: A.estadoTag(v.estado), campo: { k: 'estado', tipo: 'select', opciones: [['causada', 'Por programar'], ['programada', 'Programada'], ['disfrutando', 'Disfrutando'], ['disfrutada', 'Disfrutada']] } }] },
        { titulo: 'Pago', oculto: !ve(), filas: [{ l: 'Se paga al empezar', v: dinero((v.dias + v.bono) * diaB) + ' <small class="tenue">(' + (v.dias + v.bono) + ' días · ' + base + ')</small>' }] },
        { titulo: 'Historial', tiempo: [[esc(v.periodo.split('(')[1] || '').replace(')', ''), 'Las ganó al cumplir el año.'], ...(v.desde ? [['Programadas', 'Se le avisó a la persona y a la supervisora.']] : [])] }],
      alGuardar: () => { if (v.estado === 'causada' && v.desdeTxt) v.estado = 'programada'; } };
  };
  FICHAS.reposo = id => {
    const r = D.REPOSOS.find(x => x.id === id); const e = emp(r.emp);
    return { titulo: (r.tipo === 'reposo' ? 'Reposo de ' : 'Justificativo de ') + e.nombre, sub: fd(r.desde) + (r.dias > 1 ? ' al ' + fd(r.hasta) : '') + ' · ' + r.dias + (r.dias === 1 ? ' día' : ' días'), mod: 'personal', obj: r, registro: 'Reposo ' + e.nombre,
      tags: [[r.tipo === 'reposo' ? (r.convalidado ? 'Convalidado' : 'Falta el IVSS') : (r.soporte ? 'Con foto' : 'Falta la foto'), r.convalidado || (r.tipo !== 'reposo' && r.soporte) ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${e.id}">${esc(e.nombre)}</button>` }, { l: 'Lo emitió', v: esc(r.emisor), campo: { k: 'emisor', tipo: 'texto' } }, ...(edP() ? [{ l: 'Motivo', v: esc(r.motivo) }] : []), { l: 'Días', v: r.dias }] },
        // el reposo y el justificativo traen el diagnóstico: el archivo solo lo ven el dueño y RRHH
        !edP() ? { titulo: 'Soporte', html: `<p class="nota gris">${ic('candado', 's')}<span>${r.soporte ? 'Tiene soporte · lo ven el dueño y RRHH.' : 'Falta el soporte.'}</span></p>` }
          : r.soporte ? { titulo: 'Soporte', adjuntos: [r.soporte] } : { html: `<label class="soltar" for="rp-${r.id}">${ic('camara')}<span><b>Subir la foto del justificativo</b>Sin ella la falta queda sin justificar.${r.falta ? ' Queda junto a la falta de ese día.' : ''}</span></label><input id="rp-${r.id}" data-subir-reposo="${r.id}" type="file" accept="image/*,application/pdf" class="sr-only">` },
        { html: `<p class="muted">${esc(r.nota)}</p>` }],
      acciones: r.tipo === 'reposo' && !r.convalidado ? [{ txt: 'Ya está convalidado', acc: 'reposo-ok', arg: r.id, tono: 'pri', icono: 'check', solo: 'editar' }] : [] };
  };
  ACC['reposo-ok'] = id => { const r = D.REPOSOS.find(x => x.id === id); r.convalidado = true; A.auditar({ modulo: 'Vacaciones y reposos', registro: 'Reposo ' + emp(r.emp).nombre, campo: 'IVSS', antes: 'por convalidar', despues: 'convalidado' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Anotado: reposo convalidado en el IVSS.'); };
  FICHAS.permisoemp = id => { const p = D.PERMISOS_EMP.find(x => x.id === id); return { titulo: 'Permiso de ' + emp(p.emp).nombre, sub: esc(p.fecha), mod: 'personal', obj: p, bloques: [{ filas: [{ l: 'Motivo', v: esc(p.motivo), campo: { k: 'motivo', tipo: 'texto' } }, { l: 'Horas', v: esc(p.horas), campo: { k: 'horas', tipo: 'texto' } }, { l: 'Tipo', v: esc(p.tipo), campo: { k: 'tipo', tipo: 'select', opciones: ['Remunerado', 'No remunerado'] } }] }, p.soporte ? { titulo: 'Soporte', adjuntos: ['Constancia ' + p.fecha + '.pdf'] } : { html: '<p class="muted">Sin soporte.</p>' }] }; };

  /* =============== NÓMINA =============== */
  // línea estimada de la quincena del 15 de octubre, por concepto (el recibo)
  function linea(e) {
    const t = D.TASA.usd; const d = diario(e); const as = [], de = [];
    if (e.formal) { as.push(['Salario (mínimo legal)', 65 / t]); as.push(['Incremento complementario del cestaticket', e.sueldo - 65 / t]); }
    else if (e.tipoSal === 'por_dia') as.push([`Salario (13 días × ${dinero(e.diaria)})`, 13 * e.diaria]);
    else as.push(['Salario (15 días)', e.sueldo]);
    // recargos de las dos nóminas, cada uno en su línea (guía laboral §2 y §4): 30 % por hora entre 7 p. m. y 5 a. m. y 50 % del día
    // por domingo o feriado trabajado · sobre el mismo día que los redobles · salen de las horas ya revisadas de la quincena anterior
    const h = D.HORAS.filas[e.id] || {}; const noche = h.noct ? r2(h.noct * d / 8 * .3) : 0, dom = h.dom ? r2(h.dom * d * .5) : 0;
    if (noche) as.push([`Bono nocturno (30 %) · ${h.noct} h`, noche]);
    if (dom) as.push([`Domingo o feriado trabajado (50 %) · ${h.dom} ${h.dom === 1 ? 'día' : 'días'}`, dom]);
    D.REDOBLES.filter(r => r.emp === e.id).forEach(r => as.push([(r.tipo === 'redoble' ? 'Redoble ' : 'Día extra ') + r.fecha.toLowerCase(), (r.tipo === 'redoble' ? .5 : 1.5) * d * r.veces]));
    // lo de ley, en bolívares (tercer dato 'bs'): el IVSS y el paro sobre el mínimo, con la base por confirmar (pregunta 8 a Cecilia);
    // el FAOV, el 1 % del salario integral de la quincena (el mínimo y los recargos, con la parte del bono vacacional y de las utilidades: × 1,125)
    // · el del 10 % se descuenta en su propia corrida · la suma de los dos es el 1 % del trabajador que declara Fiscal
    if (e.formal) { de.push(['IVSS y paro forzoso (4,5 % del mínimo)', r2(65 * .045) / t, 'bs']); de.push(['FAOV (1 % del salario integral)', r2((65 + (noche + dom) * t) * 1.125 * .01) / t, 'bs']); }
    D.FALTAS.filter(f => f.emp === e.id && f.estado === 'injustificada').forEach(f => de.push(['Falta sin justificar ' + f.fecha.toLowerCase(), d]));
    D.PRESTAMOS.filter(p => p.emp === e.id && p.estado === 'activo').forEach(p => de.push([`Cuota de préstamo ${p.pagadas + 1} de ${p.cuotas}`, p.cuota]));
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
  const montoCorrida = c => c.mon === 'eur' ? `${dinero(c.total, 'eur')} <small class="tenue">≈ ${dinero(c.usd)}</small>` : dinero(c.total);
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
      <dl class="kv"><div><dt>Se paga</dt><dd>${esc(P2.paga)}, en su propia corrida</dd></div><div><dt>Monto</dt><dd>${dinero(P2.monto)}</dd></div><div><dt>Ganador</dt><dd>${e ? (ve() ? esc(e.nombre) : 'Escogido') : 'Por escoger'}</dd></div>${e && ve() ? `<div><dt>Por qué</dt><dd class="largo">${esc(P2.motivo)}</dd></div>` : ''}</dl>
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
      A.pedirCodigo({ que: 'Premio de ' + esc(P2.mes) + ' para ' + esc(emp(id).nombre) + ' · ' + dinero(P2.monto), det: 'Se paga el ' + esc(P2.paga) + ' en su propia corrida, con su recibo.', boton: 'Escoger a ' + emp(id).nombre.split(' ')[0] }).then(() => {
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
        const pj = D.FALTAS.filter(f => f.estado === 'por_justificar').length, rs = D.REDOBLES.filter(r => !r.revisado).length, ia = D.INCIDENCIAS.filter(x => x.estado === 'alertada').length;
        const lista = activos();
        const ls = lista.map(e => ({ e, l: linea(e) }));
        const descP = D.PRESTAMOS.filter(p => p.estado === 'activo').reduce((s2, p) => s2 + p.cuota, 0), descA = D.ADELANTOS.filter(a => a.estado === 'por_descontar').reduce((s2, a) => s2 + a.monto, 0);
        cuerpo = `<div class="rejilla"><div class="c7 pila">
          <article class="hoja"><div class="hoja-cab"><h2>${ic('nomina')}Próxima: ${esc(n.fecha)}</h2>${tag('Paso 1 de 4', 'aviso')}</div>
            <ol class="pasos">${pasos.map((p, i) => `<li class="${i === 0 ? 'actual' : ''}">${p}</li>`).join('')}</ol>
            ${mio ? `<p class="nota info">${ic('info', 's')}<span><b>${esc(mio)}.</b> Cada paso lo hace una persona distinta.</span></p>` : ''}
            <dl class="kv"><div><dt>Corrida formal (${n.formal.personas} personas, va a los entes)</dt><dd>${ve() ? dinero(n.formal.total) : 'Agrupada'}</dd></div><div><dt>Corrida interna (${n.interna.personas} personas)</dt><dd>${ve() ? dinero(n.interna.total) : 'Agrupada'}</dd></div><div class="total"><dt><b>Total estimado</b><small class="tenue" style="display:block">sin los recargos de noche y domingo</small></dt><dd>${dinero(n.formal.total + n.interna.total)}</dd></div></dl>
            ${ve() ? `<p class="muted">Los recargos de noche y domingo de las ${lista.length} personas que se muestran suman ${dinero(ls.reduce((s2, x) => s2 + x.l.rec, 0))} (${dinero(ls.filter(x => x.e.formal).reduce((s2, x) => s2 + x.l.rec, 0))} en la corrida formal) y ya van en su recibo. Los del resto salen cuando llegue el reloj.</p>` : ''}
            <p class="muted">El 31 de octubre van, además, el 10 % de octubre y el premio del mes, cada uno en su corrida y con sus recibos.</p>
          </article>${reporteCard()}</div>
          <div class="c5 pila"><div class="sec"><h2>Lo que falta para calcularla</h2></div>
            <ul class="lista">
              ${filaLista({ ir: 'asistencia/reloj', tono: 'alerta', icono: 'reloj', t: 'El reporte del reloj (Excel)', s: 'Sin él no hay horas, redobles ni faltas del reloj', fin: tag('Bloquea', 'alerta') })}
              ${pj ? filaLista({ ir: 'asistencia/faltas', tono: 'aviso', icono: 'alerta', t: pj + (pj === 1 ? ' falta por clasificar' : ' faltas por clasificar'), s: 'Las clasifica Andreina con su soporte' }) : ''}
              ${rs ? filaLista({ ir: 'asistencia/redobles', tono: 'aviso', icono: 'check', t: rs + ' redobles por revisar', s: 'Los revisa Jose' }) : ''}
              ${ia ? filaLista({ ir: 'asistencia/incidencias', tono: 'aviso', icono: 'reloj', t: ia + ' persona con horas que no cuadran', s: 'Hay que anotar lo acordado' }) : ''}
            </ul>
            <article class="hoja"><h2>${ic('prestamo')}Descuentos de esta quincena</h2><dl class="kv"><div><dt>Cuotas de préstamos</dt><dd>${ve() ? dinero(descP, 'usd', 0) : D.PRESTAMOS.filter(p => p.estado === 'activo').length + ' cuotas'}</dd></div><div><dt>Adelantos</dt><dd>${ve() ? dinero(descA, 'usd', 0) : D.ADELANTOS.filter(a => a.estado === 'por_descontar').length}</dd></div><div><dt>Consumos del personal</dt><dd>Van en la del 31</dd></div></dl><button class="enlace" data-ir="prestamos/descuentos">Ver por persona ${ic('derecha', 's')}</button></article></div></div>
          ${ve() ? `<div class="sec"><h2>Pre-nómina estimada · se muestran ${lista.length} de 49</h2><span class="muted">A tasa BCV de hoy: Bs ${fmt(D.TASA.usd)}</span></div>
            ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Gana', cls: 'r x plata' }, { t: 'Noche y domingo', cls: 'r x plata' }, { t: 'Descuentos', cls: 'r x plata' }, { t: 'Neto $', cls: 'r plata' }, { t: 'Neto Bs', cls: 'r x plata' }, { t: '', cls: 'e' }],
              filas: ls.map(({ e, l }) => ({ abrir: 'recibo:' + e.id, celdas: [`<b>${esc(e.nombre)}</b><small>${e.formal ? 'Formal' : 'Interna'} · ${esc(e.cargo)}</small>`, dinero(l.ta), l.rec ? dinero(l.rec) : '—', l.td ? '−' + dinero(l.td) : '—', dinero(l.neto), dinero(l.neto * D.TASA.usd, 'bs', 0), l.pend ? tag('Falta por clasificar', 'aviso') : e.estado === 'reposo' ? tag('Reposo: IVSS 2/3', 'lila') : l.tope ? tag('Pasa el tope', 'alerta') : ''] })),
              pie: ['Total de estas personas', dinero(ls.reduce((s2, x) => s2 + x.l.ta, 0)), dinero(ls.reduce((s2, x) => s2 + x.l.rec, 0)), '−' + dinero(ls.reduce((s2, x) => s2 + x.l.td, 0)), dinero(ls.reduce((s2, x) => s2 + x.l.neto, 0)), dinero(ls.reduce((s2, x) => s2 + x.l.neto, 0) * D.TASA.usd, 'bs', 0), ''] })}
            <p class="muted">Toca a una persona para ver su recibo por concepto. «Noche y domingo» es el bono nocturno (30 %) más los domingos o feriados trabajados (50 %), con las horas del ${esc(D.HORAS.periodo)}; ya va sumado en «Gana». Se calcula en dólares y se paga en bolívares a la tasa BCV del día; la tasa queda guardada.</p>`
          : notaAgrupada('Ves la nómina agrupada por corrida, sin nombres ni sueldos por persona.')}`;
      }
      if (sub === 'diez') {
        const B = D.BOLSA.anterior; const lista = D.EMPLEADOS.filter(e => e.estado !== 'egresado' || e.id === 'e14');
        const rep = B.rep; const repartido = B.comision * rep / 100; // lo repartido es la corrida del 10 % de septiembre
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Comisión del ' + B.periodo, valor: '€ ' + fmt(B.comision, 0), sub: 'la cargó ' + B.cargo, abrir: 'corrida:n1d' })}${A.cifra({ etq: 'Se repartió', valor: fmt(rep, 1) + ' %', sub: '€ ' + fmt(repartido, 0) + ' entre 49 personas · su corrida', abrir: 'corrida:n1d' })}${A.cifra({ etq: 'Se quedó el negocio', valor: '€ ' + fmt(B.comision - repartido, 0), sub: fmt(100 - rep, 1) + ' % (regla del 30-ago)' })}${A.cifra({ etq: 'Tasa euro BCV', valor: 'Bs ' + fmt(B.tasaEur), sub: 'el 10 % se cobra y se paga en euros', ir: puede('tasas') ? 'tasas' : '' })}</div>
          <div class="rejilla"><div class="c7 pila">${ve() ? A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: '%', cls: 'r' }, { t: 'Le tocó €', cls: 'r plata' }, { t: 'En Bs', cls: 'r x plata' }, { t: '', cls: 'e' }], filas: lista.map(e => { const m = B.comision * e.pct / 100; const faov = e.formal && m ? r2(r2(m * B.tasaEur) * 1.125 * .01) : 0; return { abrir: 'empleado:' + e.id, celdas: [`<b>${esc(e.nombre)}</b><small>${esc(e.cargo)}${e.formal ? ' · nómina formal' : ''}</small>`, fmt(e.pct, 1) + ' %', '€ ' + fmt(m), dinero(m * B.tasaEur, 'bs', 0) + (faov ? `<small class="tenue" style="display:block">− FAOV ${dinero(faov, 'bs')}</small>` : ''), e.pct === 0 ? tag('Nueva: arranca en 0', '') : e.id === 'e14' ? tag('Último mes', '') : ''] }; }) }) + `<p class="muted">Se muestran ${lista.length} de las 49 personas. A la nómina formal se le descuenta en el recibo del 10 % el 1 % de FAOV de su parte (sobre el salario integral: × 1,125). Entre las 10 de la nómina formal se llevaron el ${fmt(B.pctFormal, 1)} % (${dinero(r2(B.comision * B.pctFormal / 100), 'eur')}): es lo que entra en las bases de Fiscal.</p>` : notaAgrupada('Ves el total del 10 %, sin lo que le tocó a cada persona.')}</div>
          <div class="c5 pila"><article class="hoja"><div class="hoja-cab"><h2>${ic('calendario')}Período actual</h2>${tag('Abierto', 'info')}</div><dl class="kv"><div><dt>Período</dt><dd>${esc(D.BOLSA.actual.periodo)}</dd></div><div><dt>Comisión</dt><dd>${esc(D.BOLSA.actual.carga)}</dd></div><div><dt>Se paga</dt><dd>Con la 2.ª quincena (31 oct)</dd></div></dl>${A.boton('nomina', 'Cargar la comisión', 'data-acc="pronto"', { tono: 'sec', icono: 'mas' })}</article>
            <p class="nota info">${ic('info', 's')}<span>El período va del 28 al 27, no del 1 al 30. Quien no trabajó el período completo cobra su % sobre la comisión de los días que sí trabajó. El 10 % es salario y va en el recibo.</span></p></div></div>`;
      }
      if (sub === 'propinas') cuerpo = `<p class="desc">El pote de propinas de cada semana se reparte el lunes, con su recibo. Lo reparten Jose o Andreina y queda revisada; se da por pagada con el visto final de Alejandro.</p>
        ${A.tabla({ cols: [{ t: 'Semana', cls: 'p' }, { t: 'Personas', cls: 'r x' }, { t: 'Pote', cls: 'r plata' }, { t: 'Promedio por persona', cls: 'r x plata' }, { t: 'Estado', cls: 'e' }], filas: D.PROPINAS.map(p => ({ abrir: 'propina:' + p.id, celdas: [`<b>${esc(p.semana)}</b><small>${esc(p.regla)}</small>`, p.personas, dinero(p.pote), dinero(p.pote / p.personas), A.estadoTag(p.estado)] })) })}`;
      if (sub === 'recibos') cuerpo = `<p class="desc">Andreina imprime los recibos, recoge las firmas el día de pago y sube la foto. Sin el recibo firmado, en un reclamo vale lo que diga el trabajador.</p>
        ${A.tabla({ cols: [{ t: 'Corrida', cls: 'p' }, { t: 'Firmados', cls: 'r' }, { t: '', cls: 'e' }], filas: D.RECIBOS.map(r => { const c = D.NOMINA.corridas.find(x => x.id === r.corrida); return { abrir: 'corrida:' + r.corrida, celdas: [`<b>${esc(r.fecha)} · ${esc(nombreCorrida(c))}</b><small>${esc(c.grupo)}</small>`, r.firmados + ' de ' + r.total, r.firmados === r.total ? tag('Completos', 'ok') : tag('Faltan ' + (r.total - r.firmados), 'aviso')] }; }) })}
        <p class="muted">Cada corrida lleva sus propios recibos: la formal, la interna, el 10 % y el premio.</p>
        ${puede('nomina', 'editar') ? `<label class="soltar" for="rec-fotos">${ic('camara')}<span><b>Subir fotos de recibos firmados</b>La app lee el nombre y lo junta con su recibo.</span></label><input id="rec-fotos" type="file" accept="image/*" class="sr-only" multiple>` : ''}`;
      if (sub === 'corridas') cuerpo = `<div class="rejilla"><div class="c7 pila">${fechasCorridas().map(f => { const cs = corridasDe(f); return `<div class="sec"><h2>${esc(cs[0].grupo)}</h2><span class="muted">pagada el ${esc(f)} · ${cs.length} corridas · ≈ ${dinero(cs.reduce((s2, c) => s2 + c.usd, 0))}</span></div>`
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
  FICHAS.recibo = id => {
    const e = emp(id); const l = linea(e); const t = D.TASA.usd;
    const col = (titulo, xs, tot) => `<div class="recibo-col"><h4>${titulo}</h4><dl>${xs.length ? xs.map(([c, m, mon]) => `<div><dt>${esc(c)}</dt><dd>${mon === 'bs' || m < 1 ? dinero(m * t, 'bs') : dinero(m)}</dd></div>`).join('') : '<div><dt class="tenue">Nada</dt><dd></dd></div>'}</dl><p class="recibo-sub"><span>Total</span><b>${dinero(tot)}</b></p></div>`;
    return { titulo: 'Recibo de ' + e.nombre, sub: '1.ª quincena de octubre · estimado', mod: 'nomina', obj: { estado: 'por_firmar' }, tags: [['Por firmar', 'aviso']],
      bloques: [{ html: `<div class="recibo-pago"><header class="recibo-cab"><div><b>Recibo de pago</b><small>Razón social de ejemplo, C.A. · RIF J-0000000-4</small></div><div class="der"><small>Del 1 al 15 de octubre de 2026</small><small>Tasa BCV: Bs ${fmt(t)}</small></div></header>
          <p class="recibo-quien"><b>${esc(e.nombre)}</b> · C.I. ${esc(e.ci || 'por cargar')} · ${esc(e.cargo)} · desde el ${esc(e.ingreso)}</p>
          <div class="recibo-cols">${col('Asignaciones', l.as, l.ta)}${col('Deducciones', l.de, l.td)}</div>
          <div class="recibo-neto"><span>Neto a pagar</span><span><b>${dinero(l.neto)}</b> <small>= ${dinero(l.neto * t, 'bs')}</small></span></div>
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
          { l: 'FAOV que se les descuenta (1 %)', v: '− ' + dinero(r2(r2(c.formalEur * c.tasaEur) * 1.125 * .01), 'bs') + ' <small class="tenue">sobre el salario integral (× 1,125), en su recibo del 10 %</small>' }] : [])],
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
        D.PENDIENTES.unshift({ id: 'pe' + Date.now(), para: ['alejandro'], tipo: 'info', titulo: 'Aprobar un cambio en las reglas de la nómina', sub: titulo + ' · lo propuso ' + S.usuario.nombre, de: S.usuario.nombre, edad: 'Ahora', abrir: clave });
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
      bloques: [{ filas: [{ l: 'Pote', v: dinero(p.pote), campo: { k: 'pote', tipo: 'dinero', obligatorio: true } }, { l: 'Regla', v: esc(p.regla), largo: true }, { l: 'Personas', v: p.personas }, { l: 'Promedio por persona', v: dinero(p.pote / p.personas) }, { l: 'La repartió', v: esc(p.reparte || 'Nadie todavía') }, { l: 'Visto final', v: esc(p.visto || (revisada ? 'Falta el de Alejandro' : '—')) }] },
        pagada ? { html: '<p class="muted">Lo repartido ya no se edita. Si hubo un error, se hace una corrida de reemplazo enlazada a esta.</p>' } : { oculto: true }],
      bloqueada: pagada || revisada, bloqueo: pagada ? 'Ya se repartió: no se edita. Se corrige con una corrida de reemplazo.' : 'Ya se repartió y espera el visto final: no se edita. Si hay un error, Alejandro la devuelve para corregir.',
      acciones };
  };
  const propina = id => D.PROPINAS.find(x => x.id === id);
  // al repartir le llega a Alejandro un pendiente para el visto final; se cierra con el visto o al devolverla
  const cierraPropina = (id, hecho) => D.PENDIENTES.filter(p => p.abrir === 'propina:' + id && !p.hecho).forEach(p => { p.hecho = hecho; });
  ACC['propina-ok'] = id => A.pedirCodigo((p => ({ que: 'Propinas de la semana del ' + esc(p.semana) + ' · ' + dinero(p.pote) + ' entre ' + p.personas + ' personas', det: 'Después le llega a Alejandro para el visto final.', boton: 'Repartir ' + dinero(p.pote) }))(propina(id))).then(() => {
    const p = propina(id); p.estado = 'revisada'; p.reparte = A.S.usuario.nombre;
    A.auditar({ modulo: 'Nómina', registro: 'Propinas ' + p.semana, campo: 'estado', antes: 'por repartir', despues: 'revisada' });
    D.PENDIENTES.unshift({ id: 'pe' + Date.now(), para: ['alejandro'], tipo: 'info', titulo: 'Dar el visto final a las propinas', sub: 'Semana del ' + p.semana + ' · las repartió ' + p.reparte + ' · ' + dinero(p.pote), de: p.reparte, edad: 'Ahora', abrir: 'propina:' + p.id });
    A.pintarFicha(); A.pintarPagina(); A.aviso('Repartido. Le llegó a Alejandro para el visto final.');
  }).catch(() => {});
  ACC['propina-visto'] = id => A.pedirCodigo((p => ({ que: 'Visto final · propinas de la semana del ' + esc(p.semana) + ' · ' + dinero(p.pote), det: 'Las repartió ' + esc(p.reparte || 'RRHH') + '. Quedan pagadas.', boton: 'Dar el visto final' }))(propina(id))).then(() => { const p = propina(id); p.estado = 'pagada'; p.visto = A.S.usuario.nombre; cierraPropina(id, 'Visto final de ' + A.S.usuario.nombre); A.auditar({ modulo: 'Nómina', registro: 'Propinas ' + p.semana, campo: 'estado', antes: 'revisada', despues: 'pagada' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Visto final dado: quedó pagada. Los recibos quedan por firmar.'); }).catch(() => {});
  ACC['propina-devolver'] = id => A.pedirMotivo({ titulo: 'Devolver las propinas para corregir', texto: 'Vuelven a «por repartir» y quien las repartió ve el motivo.', boton: 'Devolver' }).then(m => { const p = propina(id); const quien = p.reparte; p.estado = 'por_repartir'; p.reparte = ''; cierraPropina(id, 'Devuelta para corregir por ' + A.S.usuario.nombre); A.auditar({ modulo: 'Nómina', registro: 'Propinas ' + p.semana, campo: 'estado', antes: 'revisada', despues: 'por repartir', motivo: m }); A.pintarFicha(); A.pintarPagina(); A.aviso('Devueltas' + (quien ? ' a ' + quien : '') + ' para corregir.'); }).catch(() => {});

  /* =============== PRÉSTAMOS Y DESCUENTOS =============== */
  // firma: el nombre del archivo de la autorización de descuento firmada (solo los préstamos; sin archivo, el préstamo queda «falta la firma»)
  // arranca sin persona, sin monto y sin cuotas: nada escogido sin que alguien lo escoja (desde la ficha de una persona, ella ya viene puesta)
  const prestVacio = () => ({ emp: '', tipo: 'prestamo', monto: '', cuotas: '', primera: '15 oct', desde: 'BVCA', motivo: '', firma: '' });
  const PR = { form: prestVacio(), hecho: false };
  // los pendientes de préstamos y adelantos: le llegan a quien aprueba y se cierran al aprobar o rechazar
  const pendPara = (nombre, x) => { const u = D.USUARIOS.find(v => v.nombre === nombre) || D.USUARIOS.find(v => v.rol === 'dueno'); D.PENDIENTES.unshift({ id: 'pe' + Date.now() + Math.floor(Math.random() * 1000), para: [u.id], tipo: 'info', de: A.S.usuario.nombre, edad: 'Ahora', ...x }); };
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
    <dl class="kv"><div><dt>${x.n === 1 ? 'Se descuenta' : x.n + ' cuotas de'}</dt><dd>${dinero(x.cuota)}</dd></div><div><dt>Termina</dt><dd>${esc(x.fechas[x.fechas.length - 1] || '—')}</dd></div><div><dt>Ya le descuentan el ${esc(x.primera)}</dt><dd>${x.otros ? dinero(x.otros) : 'Nada'}</dd></div><div><dt>Gana en la quincena</dt><dd>${dinero(x.gana)}</dd></div><div class="total"><dt><b>Total de descuentos de esa quincena</b></dt><dd>${dinero(x.cuota + x.otros)} <small class="tenue">de un tope de ${dinero(x.tope)}</small></dd></div></dl>
    ${x.pasa ? `<p class="chequeo alerta">${ic('alerta', 's')}<span>${conCuotas ? (tipo === 'adelanto' ? 'Pasa un tercio de lo que gana en la quincena. Baja el monto o anótalo como préstamo en cuotas.' : 'Pasa un tercio de lo que gana en la quincena. Sube el número de cuotas o baja el monto.') : tipo === 'adelanto' ? 'Pasa un tercio de lo que gana. Recházalo y pide un monto menor, o que lo anoten como préstamo en cuotas.' : 'Pasa un tercio de lo que gana. Recházalo y pide más cuotas, o apruébalo y corre una cuota después.'}</span></p>` : `<p class="chequeo ok">${ic('check', 's')}<span>Queda dentro del tope.</span></p>`}`;
  // la línea de lo que se firma con el código: «Préstamo a Kevin Torres · $ 200 en 4 cuotas · sale de BVCA»
  const firmaPrestamo = (e, monto, n, desde) => 'Préstamo a ' + esc(e.nombre) + ' · ' + dinero(monto, 'usd', 0) + (n > 1 ? ' en ' + n + ' cuotas' : ' en 1 cuota') + ' · sale de ' + A.cta(desde);
  const puedeAprobarAdelanto = a => a.estado === 'por_aprobar' && (puede('nomina', 'aprobar') || (S.usuario.nombre === apruebaAdelanto(a.monto, a.registro) && S.usuario.nombre !== a.registro));
  function cuotasDe(p) {
    const corr = p.corridaEn || []; const i0 = D.QUINCENAS.indexOf(p.inicio); const n = p.cuotas + corr.length; const out = [];
    for (let k = 0; k < n; k++) { const fecha = D.QUINCENAS[i0 + k] || '—'; out.push({ fecha, estado: corr.includes(fecha) ? 'corrida' : null }); }
    let pag = 0; out.forEach(c => { if (c.estado) return; if (pag < p.pagadas) { c.estado = 'pagada'; pag++; } else c.estado = 'pendiente'; });
    const prox = out.find(c => c.estado === 'pendiente'); if (prox && p.estado === 'activo') prox.estado = 'proxima';
    return out;
  }
  const tiraCuotas = (p, mini = false) => `<div class="cuotas${mini ? ' mini' : ''}" role="img" aria-label="${p.pagadas} de ${p.cuotas} cuotas pagadas">${cuotasDe(p).map(c => `<span class="cuota ${c.estado}" title="${esc(c.fecha)}: ${c.estado === 'pagada' ? 'descontada' : c.estado === 'corrida' ? 'se corrió' : c.estado === 'proxima' ? 'la próxima' : 'pendiente'}"><i></i>${mini ? '' : `<small>${esc(c.fecha)}</small>`}</span>`).join('')}</div>`;
  const finDe = p => { const c = cuotasDe(p); return c[c.length - 1].fecha; };
  PANT.prestamos = {
    titulo: 'Préstamos y descuentos', corto: 'Préstamos', tab: 'Préstamos', grupo: 'Recursos humanos', icono: 'prestamo', mod: 'nomina', visible: () => S.usuario.rol !== 'fiscal_externo', palabras: 'prestamo adelanto cuotas descuento',
    secciones: [['prestamos', 'Lista de préstamos', 'prestamo cuotas'], ['adelantos', 'Adelantos', 'adelanto'], ['consumos', 'Consumos del personal', 'comida pos'], ['descuentos', 'Lo que se descuenta el 15', 'descuentos tope']],
    cuenta: () => (puede('nomina', 'aprobar') ? D.PRESTAMOS.filter(p => p.estado === 'por_aprobar').length : 0) + D.ADELANTOS.filter(puedeAprobarAdelanto).length,
    // «Salir sin guardar» desde el préstamo nuevo: vuelve a como arranca
    descartar: () => { PR.form = prestVacio(); PR.hecho = false; PR.nuevoId = null; },
    // el préstamo nuevo es un formulario: la pestaña o el menú vuelven a la lista, y al salir se borra la confirmación
    // (así «Nuevo préstamo» abre siempre en blanco; el de la ficha de una persona la deja escogida a propósito)
    transitorias: ['nuevo'],
    alSalir: sub => { if (sub === 'nuevo') { PR.form = prestVacio(); PR.hecho = false; PR.nuevoId = null; } },
    render: (sub = 'prestamos') => {
      const g = !ve(); let cuerpo = '';
      const porCobrar = D.PRESTAMOS.filter(vivo).reduce((s2, p) => s2 + saldo(p), 0);
      const el15 = D.PRESTAMOS.filter(p => p.estado === 'activo').reduce((s2, p) => s2 + p.cuota, 0);
      if (sub === 'prestamos') {
        const filtro = A.filtroActual('vivos');
        const lista = D.PRESTAMOS.filter(p => filtro === 'todos' || (filtro === 'vivos' && (vivo(p) || p.estado === 'por_aprobar')) || (filtro === 'cerrados' && !vivo(p) && p.estado !== 'por_aprobar'));
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Prestado y por cobrar', valor: dinero(porCobrar, 'usd', 0), sub: D.PRESTAMOS.filter(vivo).length + ' préstamos vivos' })}${A.cifra({ etq: 'Se descuenta el 15 de octubre', valor: dinero(el15, 'usd', 0), sub: D.PRESTAMOS.filter(p => p.estado === 'activo').length + ' cuotas', ir: 'prestamos/descuentos' })}${A.cifra({ etq: 'Sale de liquidaciones', valor: dinero(D.PRESTAMOS.filter(p => p.estado === 'en_liquidacion').reduce((s2, p) => s2 + saldo(p), 0), 'usd', 0), sub: 'de quien ya se fue', abrir: 'liquidacion:lq1' })}${A.cifra({ etq: 'Por aprobar', valor: D.PRESTAMOS.filter(p => p.estado === 'por_aprobar').length, sub: 'los aprueba Alejandro', tono: D.PRESTAMOS.some(p => p.estado === 'por_aprobar') ? 'aviso' : '', abrir: !g && (D.PRESTAMOS.find(p => p.estado === 'por_aprobar') || {}).id ? 'prestamo:' + D.PRESTAMOS.find(p => p.estado === 'por_aprobar').id : '' })}</div>
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
              <div class="seg" role="group" aria-label="Tipo"><button data-acc="prest-tipo" data-arg="prestamo" aria-pressed="${F.tipo === 'prestamo'}">Préstamo en cuotas</button><button data-acc="prest-tipo" data-arg="adelanto" aria-pressed="${F.tipo === 'adelanto'}">Adelanto de quincena</button></div>
              <div class="campos">
                <label class="campo ancho"><span>Persona</span><select id="pf-emp" data-pf="emp"><option value=""${F.emp ? '' : ' selected'}>Elige la persona</option>${activos().map(x => `<option value="${x.id}"${x.id === F.emp ? ' selected' : ''}>${esc(x.nombre)} · ${esc(x.cargo)}</option>`).join('')}</select></label>
                <label class="campo"><span>Monto ($)</span><input id="pf-monto" data-pf="monto" inputmode="decimal" value="${esc(F.monto)}" autocomplete="off" placeholder="¿Cuánto?"></label>
                ${F.tipo === 'prestamo' ? `<label class="campo"><span>Cuotas</span><select id="pf-cuotas" data-pf="cuotas"><option value=""${F.cuotas ? '' : ' selected'}>¿Cuántas?</option>${[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n2 => `<option${String(n2) === F.cuotas ? ' selected' : ''}>${n2}</option>`).join('')}</select></label>
                <label class="campo"><span>Primera cuota</span><select id="pf-primera" data-pf="primera">${['15 oct', '31 oct', '15 nov'].map(q => `<option${q === F.primera ? ' selected' : ''}>${q}</option>`).join('')}</select></label>` : `<label class="campo"><span>Se descuenta</span><select id="pf-primera" data-pf="primera">${['15 oct', '31 oct'].map(q => `<option${q === F.primera ? ' selected' : ''}>${q}</option>`).join('')}</select></label>`}
                <label class="campo"><span>Sale de</span><select id="pf-desde" data-pf="desde">${['BVCA', 'BVCJ', 'BVCE', 'BNC', 'Bóveda', 'Caja chica'].map(c => `<option${c === F.desde ? ' selected' : ''}>${c}</option>`).join('')}</select></label>
                <label class="campo ancho"><span>Para qué</span><input id="pf-motivo" data-pf="motivo" value="${esc(F.motivo)}" placeholder="Lo que dijo la persona" autocomplete="off"></label>
              </div></article>
              ${F.tipo === 'prestamo' ? `<label class="soltar${F.firma ? ' lista' : ''}" for="pf-firma">${ic(F.firma ? 'check' : 'camara')}<span><b>${F.firma ? 'Autorización lista: ' + esc(F.firma) : 'Autorización de descuento firmada'}</b>${F.firma ? 'Toca para cambiarla.' : 'Sin ella no se descuenta de la nómina. Si no la tienes ahora, el préstamo sale igual y queda pendiente.'}</span></label><input id="pf-firma" type="file" accept="image/*,application/pdf" class="sr-only">` : ''}</div>
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
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Consumos del 28 sep al 27 oct', valor: dinero(D.CONSUMOEMP.reduce((s2, c) => s2 + c.monto, 0)), sub: Object.keys(por).length + ' personas hasta hoy' })}${A.cifra({ etq: 'Se descuentan', valor: '31 oct', sub: 'con la 2.ª quincena (corte el 27)' })}${A.cifra({ etq: 'Cómo llegan', valor: 'Del POS', sub: 'la cajera usa «Consumo personal»' })}</div>
          ${g ? notaAgrupada('Ves el total. El detalle por persona lo ven el dueño, RRHH y contabilidad.') : A.tabla({ cols: [{ t: 'Consumo', cls: 'p' }, { t: 'Persona', cls: 'x' }, { t: 'Pedido', cls: 'x' }, { t: 'Monto', cls: 'r plata' }], filas: D.CONSUMOEMP.map(c => ({ abrir: 'consumoemp:' + c.id, celdas: [`<b>${esc(c.que)}</b><small>${esc(c.fecha)}</small>`, esc(emp(c.emp).nombre), esc(c.pedido), dinero(c.monto)] })), pie: ['Total', '', '', dinero(D.CONSUMOEMP.reduce((s2, c) => s2 + c.monto, 0))] })}
          <p class="nota info">${ic('info', 's')}<span>La comida del turno que da el negocio no se descuenta y no aparece aquí: se registra aparte para que el termómetro de la comida no la cuente como merma. Pendiente: cómo es hoy la comida del personal.</span></p>`;
      }
      if (sub === 'descuentos') {
        const filas = activos().map(e => { const l = linea(e); const pr = l.de.filter(x => /préstamo/.test(x[0])).reduce((s2, x) => s2 + x[1], 0), ad = l.de.filter(x => /Adelanto/.test(x[0])).reduce((s2, x) => s2 + x[1], 0), co = D.CONSUMOEMP.filter(c => c.emp === e.id).reduce((s2, c) => s2 + c.monto, 0); return { e, l, pr, ad, co }; }).filter(x => x.pr || x.ad || x.co);
        cuerpo = g ? notaAgrupada('Ves los totales: ' + dinero(el15, 'usd', 0) + ' en cuotas de préstamos el 15.') : `<p class="desc">Lo que se le descuenta a cada persona en la nómina del 15, comparado con un tercio de lo que gana (el tope propuesto). Los consumos se descuentan el 31.</p>
          ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Préstamo', cls: 'r plata' }, { t: 'Adelanto', cls: 'r x plata' }, { t: 'Consumo (el 31)', cls: 'r x plata' }, { t: 'Tope (1/3)', cls: 'r x plata' }, { t: '', cls: 'e' }],
            filas: filas.map(({ e, l, pr, ad, co }) => ({ abrir: 'recibo:' + e.id, celdas: [`<b>${esc(e.nombre)}</b><small>Gana ${dinero(l.ta)} en la quincena</small>`, pr ? dinero(pr) : '—', ad ? dinero(ad) : '—', co ? dinero(co) : '—', dinero(l.ta / 3), l.tope ? tag('Pasa el tope', 'alerta') : tag('Dentro del tope', 'ok')] })),
            pie: ['Total', dinero(filas.reduce((s2, x) => s2 + x.pr, 0)), dinero(filas.reduce((s2, x) => s2 + x.ad, 0)), dinero(filas.reduce((s2, x) => s2 + x.co, 0)), '', ''] })}
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
      const fi = $('#pf-firma', raiz); if (fi) fi.addEventListener('change', () => { if (!fi.files.length) return; PR.form.firma = fi.files[0].name; A.pintarPagina(); A.aviso('Autorización lista: ' + PR.form.firma + '.'); });
      pintar();
    },
  };
  // lo que falta para enviar (y para ver «Así quedaría»): la persona, el monto y, en un préstamo, las cuotas
  const faltaPrest = F => [!F.emp ? 'la persona' : '', !(leerNum(F.monto) > 0) ? 'el monto' : '', F.tipo === 'prestamo' && !(+F.cuotas > 0) ? 'cuántas cuotas' : ''].filter(Boolean);
  const y = xs => xs.join(', ').replace(/, ([^,]*)$/, ' y $1');
  // «Registrar otro» y «Nuevo adelanto» también abren en blanco (el adelanto, ya marcado como adelanto)
  ACC['prest-nuevo'] = () => { PR.form = prestVacio(); PR.hecho = false; PR.nuevoId = null; A.ir('prestamos/nuevo'); };
  ACC['prest-tipo'] = t => { if (t === 'adelanto-nuevo') { PR.form = { ...prestVacio(), tipo: 'adelanto' }; PR.hecho = false; PR.nuevoId = null; A.ir('prestamos/nuevo'); return; } PR.form.tipo = t; if (t === 'adelanto' && (leerNum(PR.form.monto) || 0) > 100) PR.form.monto = '50'; A.pintarPagina(); };
  // «Volver» desde un préstamo a medio escribir pregunta antes de perderlo
  ACC['prest-volver'] = () => A.antesDeSalir(() => { PR.hecho = false; PR.nuevoId = null; A.ir('prestamos/prestamos'); });
  ACC['prest-enviar'] = () => {
    const F = PR.form; const monto = leerNum(F.monto) || 0; const e = emp(F.emp);
    // primero a quién, después cuánto y en cuántas cuotas: el teclado va a lo que falta
    const pide = (msg, sel) => { A.aviso(msg, 'info'); const el = $(sel); if (el) el.focus(); };
    if (!F.emp) { pide('Elige a quién se le presta.', '#pf-emp'); return; }
    if (monto <= 0) { pide('Escribe el monto.', '#pf-monto'); return; }
    if (F.tipo === 'prestamo' && !(+F.cuotas > 0)) { pide('Elige en cuántas cuotas.', '#pf-cuotas'); return; }
    if (F.motivo.trim().length < 3) { pide('Escribe para qué es: queda en la ficha del préstamo.', '#pf-motivo'); return; }
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
        if (!aprueba) pendPara(va, { titulo: 'Aprobar un préstamo de ' + dinero(monto, 'usd', 0), sub: e.nombre + ' · ' + n + (n === 1 ? ' cuota de ' : ' cuotas de ') + dinero(monto / n) + (e.prueba ? ' · está en período de prueba' : '') + (firmada ? '' : ' · falta la firma'), abrir: 'prestamo:' + id });
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
      : { que: firmaPrestamo(e, monto, n, F.desde), det: 'Cuotas de ' + dinero(monto / n) + ' desde el ' + esc(F.primera) + '.' + (firmada ? '' : ' Falta la autorización firmada: queda pendiente.'), boton: 'Aprobar ' + dinero(monto, 'usd', 0) }).then(registrar).catch(() => {});
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
    return { titulo: 'Préstamo de ' + e.nombre, sub: dinero(p.monto, 'usd', 0) + ' · ' + p.cuotas + (p.cuotas === 1 ? ' cuota' : ' cuotas de ') + (p.cuotas === 1 ? '' : dinero(p.cuota)), mod: 'nomina', obj: p, registro: 'Préstamo ' + e.nombre,
      tags: [[A.estadoTag(p.estado).replace(/<[^>]+>/g, ''), porAprobar ? 'aviso' : p.estado === 'activo' ? 'ok' : ''], ...(faltaFirma ? [['Falta la firma', 'aviso']] : [])],
      aviso: (porAprobar ? `<p class="nota info">${ic('info', 's')}<span>Lo registró ${esc(p.registro)} hoy. ${ap ? 'Falta tu aprobación con código.' : 'Falta la aprobación de Alejandro.'}</span></p>` : '')
        // sin prueba no hay «firmado»: el aviso sale arriba, con su botón para subirla
        + (!faltaFirma ? '' : `<p class="nota alerta">${ic('alerta', 's')}<span><b>Falta la autorización firmada.</b> Sin ella no se debería descontar de la nómina.${subeFirma ? ` <button class="enlace" data-acc="subir-firma" data-arg="${p.id}">${ic('camara', 's')}Subirla</button>` : ''}</span></p>`)
        + (e.prueba && porAprobar ? `<p class="nota aviso">${ic('reloj', 's')}<span>${esc(e.nombre)} está en período de prueba hasta el ${fdl(e.prueba)}. Si no se queda, el saldo sale de lo que se le pague al salir.</span></p>` : '')
        + (p.estado === 'en_liquidacion' ? `<p class="nota aviso">${ic('salir', 's')}<span>${esc(e.nombre)} ya no trabaja aquí. Los ${dinero(saldo(p), 'usd', 0)} que faltan se descuentan de su liquidación. <button class="enlace" data-abrir="liquidacion:lq1">Ver la liquidación</button></span></p>` : '')
        + (p.nota ? `<p class="nota aviso">${ic('calendario', 's')}<span>${esc(p.nota)}</span></p>` : ''),
      // por aprobar: arriba, si la cuota cabe en su quincena, con lo que ya se le descuenta ese día (lo que Jose ve en su formulario)
      bloques: [asi ? { titulo: 'Así quedaría', extra: tagTope(asi), html: `<div class="asi-quedaria">${htmlAsi(asi, false)}</div>` } : { oculto: true },
        { titulo: 'Cuotas', html: tiraCuotas(p) + `<p class="leyenda cuotas-ley"><span><i class="cl pagada"></i>Descontada</span><span><i class="cl proxima"></i>La próxima</span><span><i class="cl corrida"></i>Se corrió</span><span><i class="cl pendiente"></i>Pendiente</span></p>` },
        { titulo: 'Préstamo', filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${e.id}">${esc(e.nombre)}</button>` }, { l: 'Para qué', v: esc(p.motivo), campo: { k: 'motivo', tipo: 'texto' } }, { l: 'Prestado', v: dinero(p.monto, 'usd', 0) }, { l: 'Pagado', v: dinero(p.pagadas * p.cuota, 'usd', 0) }, { l: 'Debe', v: '<b>' + dinero(saldo(p), 'usd', 0) + '</b>' }, { l: 'Termina', v: esc(finDe(p)) }, salida, { l: 'Lo registró', v: esc(p.registro) }, { l: 'Lo aprobó', v: esc(p.aprobo || 'Nadie todavía') }] },
        p.firmada ? { titulo: 'Autorización de descuento', adjuntos: [p.firmaArchivo || 'Autorización firmada · ' + e.nombre + '.jpg'] } : { titulo: 'Autorización de descuento', html: `<p class="muted">Falta la autorización firmada por ${esc(e.nombre)}.</p>${subeFirma ? `<label class="soltar" for="aut-${p.id}">${ic('camara')}<span><b>Subir la autorización firmada</b>Foto o PDF. Al subirla, ya se puede descontar.</span></label><input id="aut-${p.id}" data-firma-prest="${p.id}" type="file" accept="image/*,application/pdf" class="sr-only">` : ''}` },
        { titulo: 'Historial', tiempo: [[esc(p.fecha), 'Lo registró ' + esc(p.registro) + '.'], ...(p.aprobo ? [[esc(p.fecha), 'Lo aprobó ' + esc(p.aprobo) + ' con su código.']] : []), ...cuotasDe(p).filter(c => c.estado === 'pagada').map(c => [esc(c.fecha), 'Cuota descontada en la nómina.', 'ok'])] }],
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
  ACC['prest-abono'] = id => A.confirmar({ titulo: 'Pagó una cuota por adelantado', texto: 'Anota que la persona pagó una cuota en efectivo o por transferencia. Entra a la caja o al banco como cobro.', boton: 'Anotar el pago' }).then(() => { const p = D.PRESTAMOS.find(x => x.id === id); p.pagadas = Math.min(p.cuotas, p.pagadas + 1); if (p.pagadas === p.cuotas) p.estado = 'pagada'; A.auditar({ modulo: 'Préstamos', registro: 'Préstamo ' + emp(p.emp).nombre, campo: 'cuotas pagadas', antes: p.pagadas - 1, despues: p.pagadas }); A.pintarFicha(); A.pintarPagina(); A.aviso(p.estado === 'pagada' ? 'Préstamo pagado completo.' : 'Cuota anotada.'); }).catch(() => {});
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
    return { titulo: 'Adelanto de ' + e.nombre, sub: esc(a.fecha) + ' · ' + dinero(a.monto, 'usd', 0), mod: 'nomina', obj: a, registro: 'Adelanto ' + e.nombre, bloqueada: !!bloqueo, bloqueo, anulable: a.estado === 'por_descontar',
      aviso: toca ? `<p class="nota info">${ic('info', 's')}<span>Lo anotó ${esc(a.registro || '—')}. ${mio ? 'Falta tu aprobación con código.' : 'Le toca aprobarlo a ' + esc(toca) + ': quien lo anota no lo aprueba.'}</span></p>` : '',
      // la plata sale cuando se aprueba: mientras tanto, «Saldrá de»; rechazado, «Iba a salir de»
      bloques: [asi ? { titulo: 'Así quedaría', extra: tagTope(asi), html: `<div class="asi-quedaria">${htmlAsi(asi, false, 'adelanto')}</div>` } : { oculto: true },
        { filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${a.emp}">${esc(e.nombre)}</button>` }, { l: 'Monto', v: dinero(a.monto, 'usd', 0), campo: { k: 'monto', tipo: 'dinero', obligatorio: true } }, { l: 'Para qué', v: esc(a.motivo), campo: { k: 'motivo', tipo: 'texto' } }, a.estado === 'por_aprobar' ? { l: 'Saldrá de', v: `${A.cta(a.desde)} <small class="tenue">cuando se apruebe</small>` } : a.estado === 'rechazado' ? { l: 'Iba a salir de', v: `${A.cta(a.desde)} <small class="tenue">no salió: se rechazó</small>` } : { l: 'Salió de', v: A.cta(a.desde) }, { l: 'Lo anotó', v: esc(a.registro || '—') }, { l: 'Lo aprobó', v: esc(a.aprobo || (toca ? 'Le toca a ' + toca : 'Nadie todavía')) }, { l: 'Se descuenta', v: 'Completo el ' + esc(a.descuenta) }, { l: 'Estado', v: A.estadoTag(a.estado) }] }],
      acciones: mio ? [{ txt: 'Rechazar', acc: 'adel-rechazar', arg: a.id, tono: 'ghost' }, { txt: 'Aprobar', acc: 'adel-aprobar', arg: a.id, tono: 'pri', icono: 'candado' }] : [] };
  };
  const cambiaAdel = (id, est, txt, motivo = '') => { const a = D.ADELANTOS.find(x => x.id === id); const antes = a.estado; a.estado = est; if (est === 'por_descontar') a.aprobo = A.S.usuario.nombre; if (antes === 'por_aprobar') cierraPend('adelanto:' + id, (est === 'rechazado' ? 'Lo rechazó ' : 'Lo aprobó ') + A.S.usuario.nombre); A.auditar({ modulo: 'Préstamos', registro: 'Adelanto ' + emp(a.emp).nombre, campo: 'estado', antes: A.estadoTxt(antes), despues: A.estadoTxt(est), motivo }); A.pintarFicha(); A.pintarPagina(); A.aviso(txt); };
  ACC['adel-aprobar'] = id => {
    const a = D.ADELANTOS.find(x => x.id === id); const e = emp(a.emp);
    A.pedirCodigo({ que: 'Adelanto a ' + esc(e.nombre) + ' · ' + dinero(a.monto, 'usd', 0) + ' · sale de ' + A.cta(a.desde), det: 'Lo anotó ' + esc(a.registro || '—') + '. Se descuenta completo el ' + esc(a.descuenta) + '.', boton: 'Aprobar ' + dinero(a.monto, 'usd', 0) })
      .then(() => cambiaAdel(id, 'por_descontar', 'Aprobado. Se entrega y se descuenta completo en la quincena.')).catch(() => {});
  };
  ACC['adel-rechazar'] = id => A.pedirMotivo({ titulo: 'Rechazar el adelanto', texto: 'La persona y quien lo anotó ven el motivo.', boton: 'Rechazar', tono: 'peligro' }).then(m => cambiaAdel(id, 'rechazado', 'Rechazado. Se le avisó a quien lo anotó.', m)).catch(() => {});
  FICHAS.consumoemp = id => { const c = D.CONSUMOEMP.find(x => x.id === id); return { titulo: c.que, sub: esc(emp(c.emp).nombre) + ' · ' + esc(c.fecha), mod: 'nomina', obj: c, registro: 'Consumo ' + emp(c.emp).nombre, anulable: true, bloques: [{ filas: [{ l: 'Persona', v: esc(emp(c.emp).nombre) }, { l: 'Pedido del POS', v: esc(c.pedido) }, { l: 'Monto ($)', v: dinero(c.monto), campo: { k: 'monto', tipo: 'dinero', obligatorio: true } }, { l: 'Se descuenta', v: '31 oct (2.ª quincena)' }] }, { html: '<p class="muted">Viene del POS: la cajera cerró el pedido con el método «Consumo personal». Si fue un error, se anula aquí con el motivo.</p>' }] }; };

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
            filas: lista.map(({ e, p }) => ({ abrir: 'prestacion:' + e.id, celdas: [`<b>${esc(e.nombre)}</b><small>${e.formal ? 'Formal' : 'Interna'} · ${e.anios ? e.anios + (e.anios === 1 ? ' año' : ' años') : 'menos de 1 año'}</small>`, dinero(p.base), dinero(p.gar), p.adic ? dinero(p.adic) : '—', p.ant ? '−' + dinero(p.ant) : '—', dinero(p.acum)] })),
            pie: ['Total', '', dinero(lista.reduce((s2, x) => s2 + x.p.gar, 0)), dinero(lista.reduce((s2, x) => s2 + x.p.adic, 0)), '', dinero(lista.reduce((s2, x) => s2 + x.p.acum, 0))] })}</div>
          <div class="c5 pila"><article class="hoja"><h2>Cómo se calcula</h2><dl class="kv"><div><dt>Cada trimestre</dt><dd class="largo">15 días de salario integral</dd></div><div><dt>Desde el 2.º año</dt><dd class="largo">2 días más por año, hasta 30</dd></div><div><dt>Base de la nómina interna</dt><dd class="largo">$ ${PS.baseInterna} al mes: mínimo + cestaticket + margen de $ ${PS.margen} ${tag('Margen por confirmar', 'aviso')}</dd></div><div><dt>Base de la nómina formal</dt><dd class="largo">Solo el salario mínimo (Bs 130). Los recargos y el 10 %, por decidir con el abogado</dd></div><div><dt>Anticipos</dt><dd class="largo">Hasta el 75 %, con motivo y soporte</dd></div></dl></article>
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
        ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Motivo', cls: 'x' }, { t: 'Vence', cls: 'x' }, { t: 'A pagar', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: D.LIQUIDACIONES.map(l => ({ abrir: 'liquidacion:' + l.id, celdas: [`<b>${esc(emp(l.emp).nombre)}</b><small>Salió el ${esc(l.egreso)} · ${esc(l.tiempo)}</small>`, esc(l.motivo), esc(l.vence), g ? 'Agrupado' : dinero(l.lineas.reduce((s2, x) => s2 + x[1], 0)), A.estadoTag(l.estado)] })) })}
        <p class="nota aviso">${ic('reloj', 's')}<span>Hay 5 días desde el egreso para pagarla. Después corre interés de mora a la tasa activa del BCV.</span></p>`;
      if (sub === 'utilidades') cuerpo = `<div class="rejilla"><div class="c7"><article class="hoja"><h2>Utilidades de 2026</h2><dl class="kv"><div><dt>Días</dt><dd class="largo">Por confirmar con Cecilia (el piso legal es 30 días; el máximo, 4 meses)</dd></div><div><dt>Anticipo</dt><dd class="largo">En los primeros 15 días de diciembre, junto con la liquidación anual</dd></div><div><dt>Quien no trabajó el año completo</dt><dd class="largo">Cobra por los meses completos trabajados</dd></div><div><dt>Base</dt><dd class="largo">La misma de las prestaciones, según la nómina</dd></div></dl></article></div>
        <div class="c5"><p class="nota info">${ic('fiscal', 's')}<span>Las utilidades también alimentan el 0,5 % del INCES que se declara en Fiscal.</span></p>${puede('fiscal') ? `<button class="enlace" data-ir="fiscal/preguntas">Ver la pregunta a Cecilia ${ic('derecha', 's')}</button>` : ''}</div></div>`;
      return `<div class="pagina">${A.cab('Recursos humanos', 'Prestaciones y liquidaciones', 'Lo que se le debe a cada persona por su antigüedad, lo que se paga en diciembre y la liquidación de quien se va.')}
        ${A.subnav([['garantia', 'Prestaciones de cada persona'], ['diciembre', 'Diciembre'], ['egresos', 'Liquidaciones', D.LIQUIDACIONES.filter(l => l.estado === 'por_aprobar').length], ['utilidades', 'Utilidades']], sub)}${cuerpo}</div>`;
    },
  };
  FICHAS.prestacion = id => {
    const e = emp(id); const p = prest(e);
    return { titulo: 'Prestaciones de ' + e.nombre, sub: (e.formal ? 'Nómina formal' : 'Nómina interna') + ' · desde el ' + esc(e.ingreso), mod: 'nomina', obj: e,
      bloques: [{ filas: [{ l: 'Base mensual', v: dinero(p.base) + (e.formal ? ' <small class="tenue">(salario legal)</small>' : ' <small class="tenue">(mínimo + cestaticket + margen)</small>') }, { l: 'Salario integral diario', v: dinero(p.integral) }, { l: 'Garantía de 2026 (' + PS.trimestres2026 + ' trimestres)', v: dinero(p.gar) }, { l: 'Días adicionales', v: p.adic ? dinero(p.adic) : 'Todavía no (desde el 2.º año)' }, { l: 'Intereses (ejemplo)', v: dinero(p.inter) }, { l: 'Anticipos pedidos', v: p.ant ? '−' + dinero(p.ant) : 'Ninguno' }, { l: 'Pagado en diciembre de 2025', v: p.dic ? dinero(p.dic) : '—' }] },
        { html: `<dl class="kv"><div class="total"><dt><b>Acumulado en 2026</b></dt><dd>${dinero(p.acum)}</dd></div></dl><p class="muted">Puede pedir hasta el 75 % como anticipo para vivienda, salud o estudios, con soporte.</p>` }] };
  };
  FICHAS.liquidacion = id => {
    const l = D.LIQUIDACIONES.find(x => x.id === id); const e = emp(l.emp); const tot = l.lineas.reduce((s2, x) => s2 + x[1], 0);
    return { titulo: 'Liquidación de ' + e.nombre, sub: esc(l.motivo) + ' · salió el ' + esc(l.egreso), mod: 'nomina', obj: l, registro: 'Liquidación ' + e.nombre, tags: l.estado === 'por_aprobar' ? [['Vence hoy', 'alerta']] : [],
      aviso: l.estado === 'por_aprobar' ? `<p class="nota alerta">${ic('reloj', 's')}<span><b>Vence hoy.</b> Pasado el plazo de 5 días corre interés de mora a la tasa activa del BCV.</span></p>` : '',
      bloques: [{ html: `<dl class="kv">${l.lineas.map(([c, m, n]) => `<div><dt>${esc(c)}${n && ve() ? `<small class="tenue" style="display:block">${esc(n)}</small>` : ''}</dt><dd>${ve() ? (m < 0 ? '−' : '') + dinero(Math.abs(m)) : '—'}</dd></div>`).join('')}<div class="total"><dt><b>A pagar</b></dt><dd>${ve() ? dinero(tot) : 'Agrupado'}</dd></div></dl>` },
        { filas: [{ l: 'Tiempo trabajado', v: esc(l.tiempo) }, { l: 'La preparó', v: esc(l.preparo) }, { l: 'Despido sin causa', v: 'No (renuncia): no hay pago doble' }] },
        // el finiquito trae los montos de la persona (lo ven quienes ven sueldos); la carta de renuncia es del expediente (dueño y RRHH)
        ve() ? { titulo: 'Documentos', adjuntos: (edP() ? ['Carta de renuncia.jpg'] : []).concat(['Finiquito para firmar.pdf']) } : { titulo: 'Documentos', html: notaAgrupada('El finiquito trae los montos de la persona: lo ven el dueño, RRHH y contabilidad.') }],
      acciones: (ve() ? [{ txt: 'Descargar el finiquito', acc: 'descargar', icono: 'descargar' }] : []).concat(l.estado === 'por_aprobar' && puede('nomina', 'aprobar') ? [{ txt: 'Aprobar y pagar', acc: 'liq-ok', arg: l.id, tono: 'pri', icono: 'candado' }] : []) };
  };
  ACC['liq-ok'] = id => A.pedirCodigo((l => ({ que: 'Liquidación de ' + esc(emp(l.emp).nombre) + ' · ' + dinero(l.lineas.reduce((s2, x) => s2 + x[1], 0)), det: esc(l.motivo) + ' · salió el ' + esc(l.egreso) + (D.PRESTAMOS.some(p => p.emp === l.emp && p.estado === 'en_liquidacion') ? ' · ya trae el descuento del préstamo' : ''), boton: 'Aprobar y pagar ' + dinero(l.lineas.reduce((s2, x) => s2 + x[1], 0)) }))(D.LIQUIDACIONES.find(x => x.id === id))).then(() => { const l = D.LIQUIDACIONES.find(x => x.id === id); l.estado = 'pagada'; const p = D.PRESTAMOS.find(x => x.emp === l.emp && x.estado === 'en_liquidacion'); if (p) { p.pagadas = p.cuotas; p.estado = 'pagada'; } A.auditar({ modulo: 'Prestaciones', registro: 'Liquidación ' + emp(l.emp).nombre, campo: 'estado', antes: 'por aprobar', despues: 'pagada' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Aprobada y pagada. El préstamo quedó saldado con la liquidación.'); }).catch(() => {});
})();
