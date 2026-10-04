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
  const ve = () => puede('nomina', 'sueldos');          // montos por persona
  const edP = () => puede('personal', 'editar');
  const sensible = () => ve() || edP();                 // expediente, cuentas, salud
  const turnoTxt = t => t + ' · ' + D.TURNOS[t][0].toLowerCase();
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
  <p class="leyenda gantt-ley"><span><i class="gl vac"></i>Vacaciones</span><span><i class="gl rep"></i>Reposo o ausencia</span><span>${ic('pastel', 'xs')} Cumpleaños</span>${edP() || ve() ? `<span>${ic('alerta', 'xs')} Vence contrato o período de prueba</span>` : ''}<span><i class="gl hoy"></i>Hoy</span></p>`;
  // filas del diagrama a partir del personal
  A.filasPersonal = ({ conContratos = false, soloConAlgo = true } = {}) => activos().map(e => {
    const barras = [], marcas = [];
    D.VACACIONES.filter(v => v.emp === e.id && v.desde).forEach(v => barras.push({ desde: v.desde, hasta: v.hasta, txt: 'Vacaciones · regresa ' + v.regresa, tono: 'vac', abrir: conContratos ? 'vacacion:' + v.id : '' }));
    D.REPOSOS.filter(r => r.emp === e.id && r.tipo === 'reposo').forEach(r => barras.push({ desde: r.desde, hasta: r.hasta, txt: conContratos ? 'Reposo hasta el ' + fd(r.hasta) : 'Ausente hasta el ' + fd(r.hasta), tono: 'rep', abrir: conContratos ? 'reposo:' + r.id : '' }));
    if (e.nac) marcas.push({ d: [e.nac[0], e.nac[1]], tipo: 'cumple', txt: 'Cumpleaños: ' + fd([e.nac[0], e.nac[1]]) });
    if (conContratos && e.contratoVence) marcas.push({ d: e.contratoVence, tipo: 'contrato', txt: 'Vence el contrato: ' + fd(e.contratoVence) });
    if (conContratos && e.prueba) marcas.push({ d: e.prueba, tipo: 'contrato', txt: 'Termina el período de prueba: ' + fd(e.prueba) });
    return { nombre: e.nombre, abrir: conContratos ? 'empleado:' + e.id : '', barras, marcas };
  }).filter(f => !soloConAlgo || f.barras.length || f.marcas.some(m => idx(m.d) >= 0 && idx(m.d) < DIAS));
  A.rh = { emp, fd, fdl, diasHasta, proxCumple, cumpleAnios, activos };

  // avisos del personal (fechas, papeles, salud, disciplina)
  function avisosPersonal() {
    const out = [];
    D.EMPLEADOS.filter(e => e.prueba).forEach(e => out.push({ abrir: 'empleado:' + e.id, tono: 'aviso', icono: 'reloj', t: `${esc(e.nombre)}: termina el período de prueba el ${fdl(e.prueba)}`, s: 'Hay que decidir antes si se queda. Después, salir cuesta como un despido.', fin: tag('En ' + diasHasta(e.prueba) + ' días', 'aviso') }));
    D.EMPLEADOS.filter(e => e.contratoVence && e.estado !== 'egresado').forEach(e => out.push({ abrir: 'empleado:' + e.id, tono: /2\.ª/.test(e.contrato) ? 'alerta' : 'aviso', icono: 'archivo', t: `${esc(e.nombre)}: vence el contrato el ${fdl(e.contratoVence)}`, s: /2\.ª/.test(e.contrato) ? 'Es la 2.ª prórroga: si sigue trabajando, pasa a contrato indeterminado.' : 'Renovar, pasar a indeterminado o terminar.', fin: tag('En ' + diasHasta(e.contratoVence) + ' días', /2\.ª/.test(e.contrato) ? 'alerta' : 'aviso') }));
    D.EMPLEADOS.filter(e => !e.certOk && e.estado !== 'egresado').forEach(e => out.push({ abrir: 'empleado:' + e.id, tono: 'alerta', icono: 'pulso', t: `${esc(e.nombre)}: certificado de salud ${/trámite/.test(e.cert) ? 'en trámite' : 'vencido'}`, s: esc(e.cert) + ' · manipula alimentos: lo pide Sanidad en cada inspección.', fin: tag('Salud', 'alerta') }));
    D.VACACIONES.filter(v => v.acumulados >= 2).forEach(v => out.push({ abrir: 'vacacion:' + v.id, tono: 'aviso', icono: 'maleta', t: `${esc(emp(v.emp).nombre)}: 2 períodos de vacaciones sin disfrutar`, s: 'Es el máximo que permite la ley. Pagarlas sin darlas obliga a darlas otra vez.', fin: tag('Vacaciones', 'aviso') }));
    D.EMPLEADOS.filter(e => /Falta/.test(e.docs) && e.certOk).forEach(e => out.push({ abrir: 'empleado:' + e.id, tono: 'aviso', icono: 'documentos', t: `${esc(e.nombre)}: expediente incompleto`, s: esc(e.docs) + '.', fin: tag('Papeles', 'aviso') }));
    if (sensible()) D.EMPLEADOS.filter(e => /\(V-/.test(e.titular) && e.estado !== 'egresado').forEach(e => out.push({ abrir: 'empleado:' + e.id, tono: 'info', icono: 'escudo', t: `${esc(e.nombre)}: cobra en la cuenta de un familiar`, s: 'Titular: ' + esc(e.titular) + '. Está bien si está anotado; el antifraude avisa si esa cuenta aparece en otra persona.', fin: tag('Cuenta', 'info') }));
    D.AMONESTACIONES.forEach(a => out.push({ abrir: 'amonestacion:' + a.id, tono: 'aviso', icono: 'alerta', t: `${esc(emp(a.emp).nombre)}: amonestación escrita del ${esc(a.fecha)}`, s: `Quedan ${a.quedan} días para pedir la calificación a la Inspectoría; después la falta se da por perdonada.`, fin: tag(a.quedan + ' días', 'aviso') }));
    D.REPOSOS.filter(r => r.tipo === 'reposo' && !r.convalidado).forEach(r => out.push({ abrir: 'reposo:' + r.id, tono: 'lila', icono: 'pulso', t: `${esc(emp(r.emp).nombre)}: falta convalidar el reposo en el IVSS`, s: `Del ${fd(r.desde)} al ${fd(r.hasta)} · ${r.dias} días.`, fin: tag('IVSS', 'lila') }));
    activos().filter(e => proxCumple(e) !== null && proxCumple(e) <= 7).sort((a, b) => proxCumple(a) - proxCumple(b)).forEach(e => out.push({ abrir: 'empleado:' + e.id, tono: 'lila', icono: 'pastel', t: proxCumple(e) === 0 ? `Hoy cumple ${esc(e.nombre)} (${cumpleAnios(e)} años)` : `${esc(e.nombre)} cumple ${cumpleAnios(e)} el ${fdl([e.nac[0], e.nac[1]])}`, s: esc(e.cargo) + ' · ' + turnoTxt(e.turno), fin: tag(proxCumple(e) === 0 ? 'Hoy' : 'En ' + proxCumple(e) + ' días', 'lila') }));
    return out;
  }

  A.avisosPersonal = avisosPersonal;

  /* =============== PERSONAL =============== */
  const P = { nueva: false };
  PANT.personal = {
    titulo: 'Personal', corto: 'Personal', tab: 'Personal', grupo: 'Recursos humanos', icono: 'equipo', mod: 'personal',
    cuenta: () => edP() ? avisosPersonal().filter(a => a.tono === 'alerta').length : 0,
    render: (sub = 'lista') => {
      const g = nivel('personal') === 'g'; const avisos = avisosPersonal();
      let cuerpo = '';
      if (sub === 'lista') {
        const filtro = A.filtroActual('activos');
        const lista = D.EMPLEADOS.filter(e => filtro === 'todos' || (filtro === 'activos' && e.estado !== 'egresado') || (filtro === 'formal' && e.formal && e.estado !== 'egresado') || (filtro === 'interna' && !e.formal && e.estado !== 'egresado') || (filtro === 'fuera' && ['vacaciones', 'reposo'].includes(e.estado)) || (filtro === 'egresados' && e.estado === 'egresado'));
        const hoyTrab = activos().filter(e => /[123]/.test((D.HORARIOS.filas[e.id] || [])[0] || '')).length;
        const cumple = activos().filter(e => proxCumple(e) !== null && proxCumple(e) <= 7).sort((a, b) => proxCumple(a) - proxCumple(b));
        const cols = [{ t: 'Persona', cls: 'p' }, { t: 'Área', cls: 'x' }, { t: 'Ingreso', cls: 'x' }, { t: 'Cumpleaños', cls: 'x' }, { t: 'Nómina', cls: 'x' }];
        if (ve()) cols.push({ t: 'Sueldo quincenal', cls: 'r' });
        cols.push({ t: 'Estado', cls: 'e' });
        cuerpo = `<div class="cifras">
            ${A.cifra({ etq: 'En nómina', valor: '49', sub: '10 en la formal · 39 en la interna' })}
            ${A.cifra({ etq: 'Trabajan hoy', valor: hoyTrab + ' de ' + activos().length, sub: 'de las personas de esta lista', ir: 'asistencia' })}
            ${A.cifra({ etq: 'De vacaciones o reposo', valor: activos().filter(e => ['vacaciones', 'reposo'].includes(e.estado)).length, sub: 'Wilmer y Mariela', ir: 'ausencias' })}
            ${A.cifra({ etq: 'Cumpleaños esta semana', valor: cumple.length, sub: cumple.map(e => e.nombre.split(' ')[0] + (proxCumple(e) === 0 ? ' (hoy)' : ' (' + DOW[new Date(2026, e.nac[1], e.nac[0]).getDay()].toLowerCase() + ')')).join(', '), abrir: cumple[0] ? 'empleado:' + cumple[0].id : '' })}
          </div>
          ${A.filtros('t-emp', [['activos', 'Activos', activos().length], ['formal', 'Formal', activos().filter(e => e.formal).length], ['interna', 'Interna', activos().filter(e => !e.formal).length], ['fuera', 'Fuera hoy', 2], ['egresados', 'Egresados', D.EMPLEADOS.filter(e => e.estado === 'egresado').length]], filtro, 'Buscar persona, cargo o área')}
          ${A.tabla({ id: 't-emp', cols, filas: lista.map(e => {
            const c = [`<b>${esc(e.nombre)}</b><small>${esc(e.cargo)} · ${turnoTxt(e.turno)}</small>`, esc(e.area), esc(e.ingreso), e.nac ? fd([e.nac[0], e.nac[1]]) + (proxCumple(e) === 0 ? ' ' + tag('Hoy', 'lila') : '') : '<span class="tenue">Sin fecha</span>', e.formal ? tag('Formal', 'info') : tag('Interna', '')];
            if (ve()) c.push(e.tipoSal === 'por_dia' ? dinero(e.diaria, 'usd', 0) + ' <small class="tenue">/día</small>' : dinero(e.sueldo, 'usd', 0));
            c.push(e.estado !== 'activo' ? A.estadoTag(e.estado) : /Falta/.test(e.docs) && sensible() ? tag('Faltan papeles', 'aviso') : tag('Activo', 'ok'));
            return { abrir: 'empleado:' + e.id, clase: e.estado === 'egresado' ? 'tenue' : '', celdas: c };
          }) })}
          <p class="muted">Se muestran 14 de las 49 personas en nómina (datos inventados).</p>`;
      }
      if (sub === 'avisos') cuerpo = `<p class="desc">Lo que vence o falta en el personal, en orden de urgencia. Cada aviso llega a RRHH; lo que nadie resuelve en 2 días sube a Alejandro.</p>
        <ul class="lista">${avisos.map(filaLista).join('')}</ul>`;
      if (sub === 'egresos') cuerpo = `<div class="rejilla"><div class="c6 pila">
          <div class="sec"><h2>Altas recientes</h2></div>
          <article class="hoja"><div class="hoja-cab"><h2>${ic('usuario')}Rosa Medina · mesonera</h2>${tag('En prueba', 'aviso')}</div>
            <ol class="pasos">${['Ficha y cédula', 'Contrato firmado', 'Certificado de salud', 'Cuenta para pagarle', 'Fin de la prueba'].map((p, i) => `<li class="${i < 2 || i === 3 ? 'hecho' : i === 2 ? 'actual' : ''}">${p}</li>`).join('')}</ol>
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
        : `<div class="rejilla"><div class="c7 pila"><article class="hoja form"><h2>Datos de la persona</h2>
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
        ${g ? notaAgrupada('Ves quién trabaja, en qué y en qué turno. Sueldos, cuentas, expedientes y temas de salud solo los ven el dueño, RRHH y contabilidad.') : ''}
        ${sub === 'nueva' ? '' : A.subnav([['lista', 'Personas'], ['avisos', 'Avisos', avisos.length], ['egresos', 'Altas y egresos'], g ? null : ['legal', 'Protección y disciplina']], sub)}${cuerpo}</div>`;
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
    A.pedirMotivo({ titulo: e ? 'Registrar el egreso de ' + e.nombre : 'Registrar un egreso', texto: 'Escribe el motivo: renuncia, fin de contrato o despido (este último solo con la calificación de la Inspectoría mientras dure la inamovilidad). La app arma la liquidación, descuenta lo que deba y le quita el acceso a los grupos.', boton: 'Registrar el egreso', tono: 'peligro', codigo: true })
      .then(m => { if (e) { e.estado = 'egresado'; e.egreso = 'Lun 5 oct 2026'; e.motivoEgreso = m; A.auditar({ modulo: 'Personal', registro: e.nombre, campo: 'estado', antes: 'activo', despues: 'egresado', motivo: m }); A.pintarFicha(); } A.pintarPagina(); A.aviso('Egreso registrado. La liquidación quedó por aprobar: vence en 5 días.'); }).catch(() => {});
  };
  ACC.constancia = id => A.aviso('Constancia de trabajo de ' + emp(id).nombre + ' lista para descargar, con los datos de la ficha. Queda registrada en su expediente. (Simulado)');
  ACC['prestamo-para'] = id => { PR.form = { emp: id, tipo: 'prestamo', monto: '200', cuotas: '4', primera: '15 oct', desde: 'BVCA', motivo: '' }; PR.hecho = false; A.cerrarFicha(); A.ir('prestamos/nuevo'); };

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
          { l: 'Contrato', v: esc(e.contrato) + (e.contratoVence ? ' · vence el ' + fd(e.contratoVence) : '') },
          ...(e.prueba ? [{ l: 'Período de prueba', v: 'Termina el ' + fdl(e.prueba) + ' ' + tag('En ' + diasHasta(e.prueba) + ' días', 'aviso') }] : []),
        ] },
        { titulo: 'Pago', oculto: !ve(), filas: [
          { l: 'Cómo se le paga', v: e.tipoSal === 'por_dia' ? 'Tarifa por día' : 'Sueldo quincenal (el día vale el sueldo ÷ 15)' },
          e.tipoSal === 'por_dia' ? { l: 'Tarifa por día ($)', v: dinero(e.diaria), campo: { k: 'diaria', tipo: 'dinero', sensible: true } } : { l: 'Sueldo quincenal ($)', v: dinero(e.sueldo, 'usd', 0), campo: { k: 'sueldo', tipo: 'dinero', sensible: true } },
          { l: '% del 10 % de servicio', v: fmt(e.pct, 1) + ' %', campo: { k: 'pct', tipo: 'numero' } },
          { l: 'Cuenta para pagarle', v: esc(e.cuenta), campo: { k: 'cuenta', tipo: 'texto', sensible: true } },
          { l: 'Titular de la cuenta', v: esc(e.titular) + (/\(V-/.test(e.titular) ? ' ' + tag('Familiar', 'info') : '') },
        ] },
        { titulo: 'Horas de la última quincena', oculto: !h, extra: ' <small class="tenue">16 al 30 sep · ejemplo</small>', html: h ? `<dl class="kv"><div><dt>Trabajó</dt><dd>${fmt(h.trab, h.trab % 1 ? 1 : 0)} h de ${h.prog} h ${h.trab < h.prog - 4 ? tag('Faltan ' + fmt(h.prog - h.trab, 0) + ' h', 'aviso') : ''}</dd></div><div><dt>Redobles</dt><dd>${h.redobles || 'Ninguno'}</dd></div><div><dt>Llegadas tarde</dt><dd>${h.tarde ? h.tarde + ' min en total' : 'Ninguna'}</dd></div><div><dt>Faltas</dt><dd>${h.faltas || 'Ninguna'}</dd></div></dl><button class="enlace" data-ir="asistencia/horas">Ver las horas de todos ${ic('derecha', 's')}</button>` : '' },
        { titulo: 'Vacaciones', html: `<p>${esc(e.vacaciones)}.</p>${vac.map(v => `<button class="enlace" data-abrir="vacacion:${v.id}">${esc(v.periodo)} · ${v.dias} días ${ic('derecha', 's')}</button>`).join('')}` },
        { titulo: 'Préstamos y descuentos', oculto: !puede('nomina'), html: !ve() ? `<p class="muted">${deuda ? 'Tiene préstamos o adelantos vivos.' : 'Sin préstamos.'} El detalle lo ven el dueño, RRHH y contabilidad.</p>`
          : (pres.length || ade.length ? `<ul class="lista">${pres.map(p => `<li><button class="fila" data-abrir="prestamo:${p.id}">${lead(vivo(p) ? 'aviso' : '', 'prestamo')}<span class="medio"><b>Préstamo de ${dinero(p.monto, 'usd', 0)}</b><small>${p.pagadas} de ${p.cuotas} cuotas · ${esc(p.motivo)}</small></span><span class="fin">${vivo(p) ? 'Debe ' + dinero(saldo(p), 'usd', 0) : A.estadoTag(p.estado)}</span></button></li>`).join('')}${ade.map(a => `<li><button class="fila" data-abrir="adelanto:${a.id}">${lead('aviso', 'menos')}<span class="medio"><b>Adelanto de ${dinero(a.monto, 'usd', 0)}</b><small>Se descuenta el ${esc(a.descuenta)}</small></span><span class="fin">${A.estadoTag(a.estado)}</span></button></li>`).join('')}</ul>` : '<p class="muted">No tiene préstamos ni adelantos.</p>') },
        { titulo: 'Expediente', oculto: !sensible(), adjuntos: ['Cédula.jpg', 'Contrato' + (/contrato/.test(e.docs) ? ' (sin firmar)' : '') + '.pdf', 'Certificado de salud.pdf', 'Acuerdo del cestaticket.pdf'] },
        { oculto: !sensible() || e.docs === 'Completo', html: `<p class="nota aviso">${ic('alerta', 's')}<span>${esc(e.docs)}.</span></p>` },
        { titulo: 'Salud', oculto: !sensible(), filas: [{ l: 'Certificado de salud', v: esc(e.cert) + (e.certOk ? '' : ' ' + tag(/trámite/.test(e.cert) ? 'En trámite' : 'Vencido', 'alerta')) }, { l: 'Contacto de emergencia', v: esc(e.emergencia) }] },
        { titulo: 'Historial', tiempo: [[esc(e.ingreso), 'Ingresó como ' + esc(e.cargo.toLowerCase()) + '.'], ...(e.anios >= 2 ? [['ene 2026', 'Aumento del sueldo base (motivo: revisión anual).']] : []), ...(pres.filter(vivo).map(p => [esc(p.fecha), 'Préstamo de ' + dinero(p.monto, 'usd', 0) + '.'])), ...(e.estado === 'egresado' ? [[esc(e.egreso), 'Egreso por ' + esc(e.motivoEgreso).toLowerCase() + '.', 'alerta']] : [])] },
      ], acciones };
  };
  FICHAS.fuero = id => { const f = D.FUEROS.find(x => x.id === id); return { titulo: 'Protección: ' + emp(f.emp).nombre, sub: esc(f.tipo), mod: 'personal', obj: f, bloques: [{ filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${f.emp}">${esc(emp(f.emp).nombre)}</button>` }, { l: 'Tipo', v: esc(f.tipo) }, { l: 'Desde', v: esc(f.desde) }, { l: 'Hasta', v: esc(f.hasta), campo: { k: 'hasta', tipo: 'texto' } }] }, { html: '<p class="muted">Mientras dure, no se le puede despedir, trasladar ni bajar el sueldo sin la autorización de la Inspectoría. La app avisa 30 días antes de que termine.</p>' }] }; };
  FICHAS.amonestacion = id => { const a = D.AMONESTACIONES.find(x => x.id === id); return { titulo: 'Amonestación a ' + emp(a.emp).nombre, sub: esc(a.fecha), mod: 'personal', obj: a, registro: 'Amonestación ' + emp(a.emp).nombre, tags: [[a.quedan + ' días para pedir la calificación', 'aviso']], bloques: [{ filas: [{ l: 'Qué pasó', v: esc(a.hechos), largo: true, campo: { k: 'hechos', tipo: 'area' } }, { l: 'Tipo', v: esc(a.tipo) }, { l: 'Firma', v: esc(a.firma) }] }, { titulo: 'Documento', adjuntos: ['Amonestación ' + a.fecha + '.pdf'] }, { html: '<p class="muted">Tres faltas sin justificar en 30 días son causa de despido. Con la inamovilidad, primero se pide la calificación a la Inspectoría, y hay 30 días desde la falta para hacerlo.</p>' }] }; };

  /* =============== ASISTENCIA Y HORAS =============== */
  const CT = { 1: ['t1', 'Mañana'], 2: ['t2', 'Tarde'], 3: ['t3', 'Noche'], D: ['td', 'Descanso'], V: ['tv', 'Vacaciones'], R: ['tr', 'Reposo'] };
  PANT.asistencia = {
    titulo: 'Asistencia y horas', corto: 'Asistencia', tab: 'Asistencia', grupo: 'Recursos humanos', icono: 'reloj', mod: 'personal',
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
          ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Programadas', cls: 'r x' }, { t: 'Trabajadas', cls: 'r' }, { t: 'Extra', cls: 'r x' }, { t: 'Nocturnas', cls: 'r x' }, { t: 'Tarde (min)', cls: 'r x' }, { t: 'Redobles', cls: 'r x' }, { t: '', cls: 'e' }],
            filas: ids.map(i => { const h = F[i], e = emp(i), dif = h.trab - h.prog; return { abrir: 'empleado:' + i, celdas: [`<b>${esc(e.nombre)}</b><small>${esc(e.cargo)} · ${turnoTxt(e.turno)}</small>`, h.prog, fmt(h.trab, h.trab % 1 ? 1 : 0), h.extra || '—', h.noct || '—', h.tarde ? `<span class="reloj-rojo">${h.tarde}</span>` : '—', h.redobles || '—', dif <= -4 ? tag('Faltan ' + fmt(-dif, 0) + ' h', 'aviso') : e.estado === 'reposo' ? A.estadoTag('reposo') : tag('Cuadra', 'ok')] }; }),
            pie: ['Total', tot('prog'), fmt(tot('trab'), 0), tot('extra'), tot('noct'), tot('tarde'), tot('redobles'), ''] })}
          <p class="muted">Horas extra: máximo 10 por semana y 100 al año, con permiso de la Inspectoría. Las de noche (de 7 p. m. a 5 a. m.) llevan 30 % más. Los domingos y feriados trabajados, 50 % más.</p>`;
      }
      if (sub === 'faltas') {
        const pj = D.FALTAS.filter(f => f.estado === 'por_justificar').length;
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Por justificar', valor: pj, sub: 'Andreina las clasifica con su soporte', tono: pj ? 'aviso' : '' })}${A.cifra({ etq: 'Sin justificar este mes', valor: D.FALTAS.filter(f => f.estado === 'injustificada').length, sub: 'se descuentan del día', tono: 'alerta' })}${A.cifra({ etq: 'Justificadas', valor: D.FALTAS.filter(f => f.estado === 'justificada').length, sub: 'con justificativo o permiso', ir: 'ausencias/medicos' })}</div>
          ${A.tabla({ cols: [{ t: 'Falta', cls: 'p' }, { t: 'Turno', cls: 'x' }, { t: 'Qué pasó', cls: 'x' }, { t: 'Estado', cls: 'e' }], filas: D.FALTAS.map(f => ({ abrir: 'falta:' + f.id, celdas: [`<b>${esc(emp(f.emp).nombre)}</b><small>${esc(f.fecha)}</small>`, esc(f.turno), sensible() ? esc(f.nota) : '<span class="tenue">Solo RRHH</span>', A.estadoTag(f.estado)] })) })}
          <p class="nota info">${ic('info', 's')}<span>El reloj solo dice que alguien no vino. Andreina decide si la falta está justificada y adjunta el soporte (justificativo médico, constancia o permiso). 3 faltas sin justificar en 30 días son causa de despido, siempre con la calificación de la Inspectoría mientras dure la inamovilidad.</span></p>`;
      }
      if (sub === 'redobles') {
        const sin = D.REDOBLES.filter(r => !r.revisado);
        const monto = r => { const d = diario(emp(r.emp)); return (r.tipo === 'redoble' ? .5 : 1.5) * d * r.veces; };
        const cols = [{ t: 'Persona', cls: 'p' }, { t: 'Qué', cls: 'x' }, { t: 'Detalle', cls: 'x' }]; if (verMonto) cols.push({ t: 'Se le paga', cls: 'r' }); cols.push({ t: 'Revisión', cls: 'e' });
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Sin revisar', valor: sin.length, sub: 'los revisa Jose antes de la nómina', tono: sin.length ? 'aviso' : '' })}${verMonto ? A.cifra({ etq: 'Entran en la nómina del 15', valor: dinero(D.REDOBLES.reduce((s2, r) => s2 + monto(r), 0)), sub: D.REDOBLES.length + ' días' }) : ''}${A.cifra({ etq: 'Redoble', valor: '½ día', sub: 'doblar turno paga medio día más' })}${A.cifra({ etq: 'Día extra', valor: '1½ días', sub: 'trabajar el día de descanso' })}</div>
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
  FICHAS.falta = id => {
    const f = D.FALTAS.find(x => x.id === id); const e = emp(f.emp);
    return { titulo: 'Falta de ' + e.nombre, sub: esc(f.fecha) + ' · turno ' + esc(f.turno), mod: 'personal', obj: f, registro: 'Falta ' + e.nombre + ' ' + f.fecha, tags: [[A.estadoTag(f.estado).replace(/<[^>]+>/g, ''), f.estado === 'por_justificar' ? 'aviso' : '']],
      aviso: f.mes >= 2 ? `<p class="nota alerta">${ic('alerta', 's')}<span>Es la ${f.mes}.ª falta sin justificar en 30 días. A la 3.ª hay causa de despido (con calificación de la Inspectoría).</span></p>` : '',
      bloques: [{ filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${e.id}">${esc(e.nombre)}</button>` }, ...(sensible() ? [{ l: 'Qué pasó', v: esc(f.nota), largo: true, campo: { k: 'nota', tipo: 'area' } }] : []), { l: 'La clasificó', v: esc(f.clasifico || 'Nadie todavía') }] },
        f.soporte ? { titulo: 'Soporte', adjuntos: [f.soporte] } : { html: `<label class="soltar" for="fa-${f.id}">${ic('camara')}<span><b>Subir el justificativo</b>Foto del justificativo médico, la constancia o el permiso.</span></label><input id="fa-${f.id}" type="file" accept="image/*,.pdf" class="sr-only">` },
        { html: '<p class="muted">Justificada: no se descuenta. Sin justificar: se descuenta el día en la nómina y cuenta para las 3 del mes.</p>' }],
      acciones: f.estado === 'por_justificar' ? [{ txt: 'Sin justificar', acc: 'falta-clas', arg: f.id + '|injustificada', solo: 'editar' }, { txt: 'Justificada', acc: 'falta-clas', arg: f.id + '|justificada', tono: 'pri', icono: 'check', solo: 'editar' }] : [] };
  };
  ACC['falta-clas'] = arg => { const [id, est] = arg.split('|'); const f = D.FALTAS.find(x => x.id === id); f.estado = est; f.clasifico = A.S.usuario.nombre; if (est === 'justificada' && !f.soporte) f.soporte = 'Justificativo ' + f.fecha + '.jpg'; A.auditar({ modulo: 'Asistencia', registro: 'Falta ' + emp(f.emp).nombre, campo: 'estado', antes: 'por justificar', despues: est }); A.pintarFicha(); A.pintarPagina(); A.aviso(est === 'justificada' ? 'Justificada. No se descuenta.' : 'Sin justificar. Se descuenta el día en la nómina del 15.'); };
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
    return { titulo: 'Horas de ' + e.nombre, sub: esc(x.periodo), mod: 'personal', obj: x, registro: 'Horas ' + e.nombre + ' ' + x.periodo, tags: [[A.estadoTag(x.estado).replace(/<[^>]+>/g, ''), x.estado === 'resuelta' ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'Programadas', v: x.esperadas + ' h' }, { l: 'Trabajadas', v: x.reales + ' h' }, { l: 'Diferencia', v: (x.reales - x.esperadas) + ' h' }, { l: 'Por qué', v: esc(x.causa || '—'), campo: { k: 'causa', tipo: 'area' } }, { l: 'Lo acordado', v: esc(x.acuerdo || 'Sin acordar'), campo: { k: 'acuerdo', tipo: 'select', opciones: ['', 'Se descuentan las horas', 'No se descuenta (tenía justificación)', 'Las compensa la semana que viene'] } }] },
        { html: '<p class="muted">Lo acordado lo anotan Jose o Andreina. Al guardar, la app lo aplica en la nómina y la incidencia queda resuelta.</p>' }],
      alGuardar: () => { if (x.acuerdo) x.estado = 'resuelta'; } };
  };

  /* =============== VACACIONES, REPOSOS Y PERMISOS =============== */
  PANT.ausencias = {
    titulo: 'Vacaciones y reposos', corto: 'Vacaciones y reposos', tab: 'Vacaciones', grupo: 'Recursos humanos', icono: 'maleta', mod: 'personal',
    cuenta: () => edP() ? D.REPOSOS.filter(r => !r.convalidado).length : 0,
    render: (sub = 'libro') => {
      let cuerpo = '';
      if (sub === 'libro') cuerpo = `<div class="cifras">${A.cifra({ etq: 'De vacaciones hoy', valor: D.VACACIONES.filter(v => v.estado === 'disfrutando').length, sub: 'Wilmer regresa el mar 20 oct', abrir: 'vacacion:va3' })}${A.cifra({ etq: 'Programadas', valor: D.VACACIONES.filter(v => v.estado === 'programada').length, sub: 'la próxima: Patricia el 19 oct', abrir: 'vacacion:va2' })}${A.cifra({ etq: 'Por programar', valor: D.VACACIONES.filter(v => v.estado === 'causada').length, sub: 'ya las ganaron' })}${A.cifra({ etq: 'Con 2 períodos acumulados', valor: D.VACACIONES.filter(v => v.acumulados >= 2).length, sub: 'el máximo: darlas ya', tono: 'alerta', abrir: 'vacacion:va1' })}</div>
          <div class="sec"><h2>Libro de vacaciones</h2>${A.boton('personal', 'Programar vacaciones', 'data-acc="vac-programar"', { tono: 'sec', icono: 'calendario', chico: true })}</div>
          ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Días', cls: 'r' }, { t: 'Cuándo', cls: 'x' }, { t: 'Quién cubre', cls: 'x' }, { t: 'Estado', cls: 'e' }], filas: D.VACACIONES.map(v => ({ abrir: 'vacacion:' + v.id, celdas: [`<b>${esc(emp(v.emp).nombre)}</b><small>${esc(v.periodo)}</small>`, v.dias + ' <small class="tenue">+ bono ' + v.bono + '</small>', v.desde ? fdl(v.desde) + ' al ' + fdl(v.hasta) : '<span class="tenue">' + esc(v.nota || 'Por programar') + '</span>', esc(v.cubre || '—'), A.estadoTag(v.estado)] })) })}
          <p class="muted">15 días hábiles el primer año y uno más por cada año, hasta 30. El bono vacacional, igual. Se pagan al empezar a disfrutarlas. Se pueden acumular hasta 2 períodos.</p>`;
      if (sub === 'fuera') cuerpo = `<p class="desc">Octubre y noviembre: quién está de vacaciones o de reposo, los cumpleaños${edP() || ve() ? ' y los contratos o períodos de prueba que vencen' : ''}. La raya roja es hoy.</p>
          <article class="hoja">${A.gantt(A.filasPersonal({ conContratos: edP() || ve() }))}</article>
          <button class="enlace" data-ir="calendario/personal">Verlo en el calendario ${ic('derecha', 's')}</button>`;
      if (sub === 'medicos') {
        const cols = [{ t: 'Persona', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Días', cls: 'r' }, { t: 'Soporte', cls: 'e' }];
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'De reposo hoy', valor: D.REPOSOS.filter(r => r.tipo === 'reposo').length, sub: 'Mariela, hasta el 14 oct', abrir: 'reposo:rp1' })}${A.cifra({ etq: 'Justificativos por subir', valor: D.REPOSOS.filter(r => !r.soporte).length, sub: 'sin él la falta queda sin justificar', tono: 'aviso', abrir: 'reposo:rp3' })}${A.cifra({ etq: 'Por convalidar en el IVSS', valor: D.REPOSOS.filter(r => r.tipo === 'reposo' && !r.convalidado).length, sub: 'reposos de más de 3 días' })}</div>
          ${A.tabla({ cols, filas: D.REPOSOS.map(r => ({ abrir: 'reposo:' + r.id, celdas: [`<b>${esc(emp(r.emp).nombre)}</b><small>${fd(r.desde)}${r.dias > 1 ? ' al ' + fd(r.hasta) : ''}${sensible() ? ' · ' + esc(r.motivo) : ''}</small>`, r.tipo === 'reposo' ? 'Reposo' : 'Justificativo', r.dias, r.soporte ? (r.tipo === 'reposo' && !r.convalidado ? tag('Falta el IVSS', 'lila') : tag('Con foto', 'ok')) : tag('Falta la foto', 'aviso')] })) })}
          ${edP() ? `<label class="soltar" for="med-foto">${ic('camara')}<span><b>Subir un justificativo médico</b>Foto o PDF. La app lo junta con la falta de ese día.</span></label><input id="med-foto" type="file" accept="image/*,.pdf" class="sr-only">` : ''}
          <p class="nota info">${ic('pulso', 's')}<span>Hasta 3 días basta un justificativo médico. Más de 3 días es un reposo del IVSS (o convalidado por el IVSS). En la nómina formal, desde el día 4 el IVSS paga 2/3 y el negocio 1/3.${sensible() ? '' : ' El motivo médico solo lo ven el dueño, RRHH y contabilidad.'}</span></p>`;
      }
      if (sub === 'permisos') cuerpo = `<p class="desc">Permisos de horas o de un día, con su motivo y si se pagan o no.</p>
        ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Cuándo', cls: 'x' }, { t: 'Tipo', cls: 'x' }, { t: 'Soporte', cls: 'e' }], filas: D.PERMISOS_EMP.map(p => ({ abrir: 'permisoemp:' + p.id, celdas: [`<b>${esc(emp(p.emp).nombre)}</b><small>${esc(p.motivo)}</small>`, esc(p.fecha) + ' · ' + esc(p.horas), esc(p.tipo), p.soporte ? tag('Con constancia', 'ok') : tag('Sin soporte', '')] })) })}
        ${A.boton('personal', 'Registrar un permiso', 'data-acc="pronto"', { tono: 'sec', icono: 'mas' })}`;
      return `<div class="pagina">${A.cab('Recursos humanos', 'Vacaciones, reposos y permisos', 'Las vacaciones se disfrutan: pagarlas sin darlas obliga a darlas otra vez. Aquí se programan, se ve quién está fuera y se guardan los justificativos médicos.')}
        ${A.subnav([['libro', 'Vacaciones'], ['fuera', 'Quién está fuera'], ['medicos', 'Justificativos y reposos', D.REPOSOS.filter(r => !r.soporte || (r.tipo === 'reposo' && !r.convalidado)).length], ['permisos', 'Permisos']], sub)}${cuerpo}</div>`;
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
      bloques: [{ filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${e.id}">${esc(e.nombre)}</button>` }, { l: 'Lo emitió', v: esc(r.emisor), campo: { k: 'emisor', tipo: 'texto' } }, ...(sensible() ? [{ l: 'Motivo', v: esc(r.motivo) }] : []), { l: 'Días', v: r.dias }] },
        r.soporte ? { titulo: 'Soporte', adjuntos: [r.soporte] } : { html: `<label class="soltar" for="rp-${r.id}">${ic('camara')}<span><b>Subir la foto del justificativo</b>Sin ella la falta queda sin justificar.</span></label><input id="rp-${r.id}" type="file" accept="image/*,.pdf" class="sr-only">` },
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
    D.REDOBLES.filter(r => r.emp === e.id).forEach(r => as.push([(r.tipo === 'redoble' ? 'Redoble ' : 'Día extra ') + r.fecha.toLowerCase(), (r.tipo === 'redoble' ? .5 : 1.5) * d * r.veces]));
    if (e.formal) de.push(['IVSS, paro forzoso y FAOV (5,5 %)', 65 * .055 / t]);
    D.FALTAS.filter(f => f.emp === e.id && f.estado === 'injustificada').forEach(f => de.push(['Falta sin justificar ' + f.fecha.toLowerCase(), d]));
    D.PRESTAMOS.filter(p => p.emp === e.id && p.estado === 'activo').forEach(p => de.push([`Cuota de préstamo ${p.pagadas + 1} de ${p.cuotas}`, p.cuota]));
    D.ADELANTOS.filter(a => a.emp === e.id && a.estado === 'por_descontar').forEach(a => de.push(['Adelanto del ' + a.fecha.toLowerCase(), a.monto]));
    const ta = as.reduce((s2, x) => s2 + x[1], 0), td = de.reduce((s2, x) => s2 + x[1], 0);
    const prestDesc = de.filter(x => /préstamo|Adelanto/.test(x[0])).reduce((s2, x) => s2 + x[1], 0);
    return { as, de, ta, td, neto: ta - td, tope: prestDesc > ta / 3, pend: D.FALTAS.some(f => f.emp === e.id && f.estado === 'por_justificar') };
  }
  A.lineaNomina = linea;
  const N = {};
  PANT.nomina = {
    titulo: 'Nómina', corto: 'Nómina', tab: 'Nómina', grupo: 'Recursos humanos', icono: 'nomina', mod: 'nomina',
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
            <dl class="kv"><div><dt>Corrida formal (${n.formal.personas} personas, va a los entes)</dt><dd>${ve() ? dinero(n.formal.total) : 'Agrupada'}</dd></div><div><dt>Corrida interna (${n.interna.personas} personas)</dt><dd>${ve() ? dinero(n.interna.total) : 'Agrupada'}</dd></div><div class="total"><dt><b>Total estimado</b></dt><dd>${dinero(n.formal.total + n.interna.total)}</dd></div></dl>
          </article></div>
          <div class="c5 pila"><div class="sec"><h2>Lo que falta para calcularla</h2></div>
            <ul class="lista">
              ${filaLista({ ir: 'asistencia/reloj', tono: 'alerta', icono: 'reloj', t: 'El reporte del reloj (Excel)', s: 'Sin él no hay horas, redobles ni faltas del reloj', fin: tag('Bloquea', 'alerta') })}
              ${pj ? filaLista({ ir: 'asistencia/faltas', tono: 'aviso', icono: 'alerta', t: pj + (pj === 1 ? ' falta por clasificar' : ' faltas por clasificar'), s: 'Las clasifica Andreina con su soporte' }) : ''}
              ${rs ? filaLista({ ir: 'asistencia/redobles', tono: 'aviso', icono: 'check', t: rs + ' redobles por revisar', s: 'Los revisa Jose' }) : ''}
              ${ia ? filaLista({ ir: 'asistencia/incidencias', tono: 'aviso', icono: 'reloj', t: ia + ' persona con horas que no cuadran', s: 'Hay que anotar lo acordado' }) : ''}
            </ul>
            <article class="hoja"><h2>${ic('prestamo')}Descuentos de esta quincena</h2><dl class="kv"><div><dt>Cuotas de préstamos</dt><dd>${ve() ? dinero(descP, 'usd', 0) : D.PRESTAMOS.filter(p => p.estado === 'activo').length + ' cuotas'}</dd></div><div><dt>Adelantos</dt><dd>${ve() ? dinero(descA, 'usd', 0) : D.ADELANTOS.filter(a => a.estado === 'por_descontar').length}</dd></div><div><dt>Consumos del personal</dt><dd>Van en la del 31</dd></div></dl><button class="enlace" data-ir="prestamos/descuentos">Ver por persona ${ic('derecha', 's')}</button></article></div></div>
          ${ve() ? `<div class="sec"><h2>Pre-nómina estimada · se muestran ${lista.length} de 49</h2><span class="muted">A tasa BCV de hoy: Bs ${fmt(D.TASA.usd)}</span></div>
            ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Gana', cls: 'r x' }, { t: 'Descuentos', cls: 'r x' }, { t: 'Neto $', cls: 'r' }, { t: 'Neto Bs', cls: 'r x' }, { t: '', cls: 'e' }],
              filas: ls.map(({ e, l }) => ({ abrir: 'recibo:' + e.id, celdas: [`<b>${esc(e.nombre)}</b><small>${e.formal ? 'Formal' : 'Interna'} · ${esc(e.cargo)}</small>`, dinero(l.ta), l.td ? '−' + dinero(l.td) : '—', dinero(l.neto), dinero(l.neto * D.TASA.usd, 'bs', 0), l.pend ? tag('Falta por clasificar', 'aviso') : e.estado === 'reposo' ? tag('Reposo: IVSS 2/3', 'lila') : l.tope ? tag('Pasa el tope', 'alerta') : ''] })),
              pie: ['Total de estas personas', dinero(ls.reduce((s2, x) => s2 + x.l.ta, 0)), '−' + dinero(ls.reduce((s2, x) => s2 + x.l.td, 0)), dinero(ls.reduce((s2, x) => s2 + x.l.neto, 0)), dinero(ls.reduce((s2, x) => s2 + x.l.neto, 0) * D.TASA.usd, 'bs', 0), ''] })}
            <p class="muted">Toca a una persona para ver su recibo por concepto. Se calcula en dólares y se paga en bolívares a la tasa BCV del día; la tasa queda guardada.</p>`
          : notaAgrupada('Ves la nómina agrupada por corrida, sin nombres ni sueldos por persona.')}`;
      }
      if (sub === 'diez') {
        const B = D.BOLSA.anterior; const lista = D.EMPLEADOS.filter(e => e.estado !== 'egresado' || e.id === 'e14');
        const rep = 23.4; const repartido = B.comision * rep / 100;
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Comisión del ' + B.periodo, valor: '€ ' + fmt(B.comision, 0), sub: 'la cargó ' + B.cargo })}${A.cifra({ etq: 'Se repartió', valor: fmt(rep, 1) + ' %', sub: '€ ' + fmt(repartido, 0) + ' entre 49 personas' })}${A.cifra({ etq: 'Se quedó el negocio', valor: '€ ' + fmt(B.comision - repartido, 0), sub: fmt(100 - rep, 1) + ' % (regla del 30-ago)' })}${A.cifra({ etq: 'Tasa euro BCV', valor: 'Bs ' + fmt(B.tasaEur), sub: 'el 10 % se cobra y se paga en euros' })}</div>
          <div class="rejilla"><div class="c7 pila">${ve() ? A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: '%', cls: 'r' }, { t: 'Le tocó €', cls: 'r' }, { t: 'En Bs', cls: 'r x' }, { t: '', cls: 'e' }], filas: lista.map(e => { const m = B.comision * e.pct / 100; return { abrir: 'empleado:' + e.id, celdas: [`<b>${esc(e.nombre)}</b><small>${esc(e.cargo)}</small>`, fmt(e.pct, 1) + ' %', '€ ' + fmt(m), dinero(m * B.tasaEur, 'bs', 0), e.pct === 0 ? tag('Nueva: arranca en 0', '') : e.id === 'e14' ? tag('Último mes', '') : ''] }; }) }) : notaAgrupada('Ves el total del 10 %, sin lo que le tocó a cada persona.')}</div>
          <div class="c5 pila"><article class="hoja"><div class="hoja-cab"><h2>${ic('calendario')}Período actual</h2>${tag('Abierto', 'info')}</div><dl class="kv"><div><dt>Período</dt><dd>${esc(D.BOLSA.actual.periodo)}</dd></div><div><dt>Comisión</dt><dd>${esc(D.BOLSA.actual.carga)}</dd></div><div><dt>Se paga</dt><dd>Con la 2.ª quincena (31 oct)</dd></div></dl>${A.boton('nomina', 'Cargar la comisión', 'data-acc="pronto"', { tono: 'sec', icono: 'mas' })}</article>
            <p class="nota info">${ic('info', 's')}<span>El período va del 28 al 27, no del 1 al 30. Quien no trabajó el período completo cobra su % sobre la comisión de los días que sí trabajó. El 10 % es salario y va en el recibo.</span></p></div></div>`;
      }
      if (sub === 'propinas') cuerpo = `<p class="desc">El pote de propinas de cada semana se reparte el lunes, con su recibo.</p>
        ${A.tabla({ cols: [{ t: 'Semana', cls: 'p' }, { t: 'Personas', cls: 'r x' }, { t: 'Pote', cls: 'r' }, { t: 'Le toca a cada uno', cls: 'r x' }, { t: 'Estado', cls: 'e' }], filas: D.PROPINAS.map(p => ({ abrir: 'propina:' + p.id, celdas: [`<b>${esc(p.semana)}</b><small>${esc(p.regla)}</small>`, p.personas, dinero(p.pote), dinero(p.pote / p.personas), A.estadoTag(p.estado)] })) })}`;
      if (sub === 'recibos') cuerpo = `<p class="desc">Andreina imprime los recibos, recoge las firmas el día de pago y sube la foto. Sin el recibo firmado, en un reclamo vale lo que diga el trabajador.</p>
        ${A.tabla({ cols: [{ t: 'Corrida', cls: 'p' }, { t: 'Firmados', cls: 'r' }, { t: '', cls: 'e' }], filas: D.RECIBOS.map(r => ({ abrir: 'corrida:' + r.corrida, celdas: [`<b>${esc(r.fecha)}</b><small>${esc(D.NOMINA.corridas.find(c => c.id === r.corrida).tipo)}</small>`, r.firmados + ' de ' + r.total, r.firmados === r.total ? tag('Completos', 'ok') : tag('Faltan ' + (r.total - r.firmados), 'aviso')] })) })}
        ${puede('nomina', 'editar') ? `<label class="soltar" for="rec-fotos">${ic('camara')}<span><b>Subir fotos de recibos firmados</b>La app lee el nombre y lo junta con su recibo.</span></label><input id="rec-fotos" type="file" accept="image/*" class="sr-only" multiple>` : ''}`;
      if (sub === 'corridas') cuerpo = `<div class="rejilla"><div class="c7 pila">${A.tabla({ cols: [{ t: 'Corrida', cls: 'p' }, { t: 'Personas', cls: 'x' }, { t: 'Total', cls: 'r' }, { t: 'Estado', cls: 'e' }], filas: D.NOMINA.corridas.map(c => ({ abrir: 'corrida:' + c.id, celdas: [`<b>${esc(c.fecha)}</b><small>${esc(c.tipo)}</small>`, c.personas, dinero(c.total), tag('Pagada', 'ok')] })) })}</div>
        <div class="c5 pila"><article class="hoja"><h2>${ic('cajachica')}El ahorro de diciembre</h2><p class="muted">Lo que se va apartando cada mes para pagar en diciembre la liquidación anual, las utilidades y los intereses.</p><dl class="kv"><div><dt>Apartado hasta hoy</dt><dd>${ve() ? dinero(D.DICIEMBRE.apartado, 'usd', 0) : 'Agrupado'}</dd></div><div><dt>Hace falta en diciembre (estimado)</dt><dd>${ve() ? dinero(D.DICIEMBRE.liquidacionAnual + D.DICIEMBRE.utilidades + D.DICIEMBRE.intereses, 'usd', 0) : 'Agrupado'}</dd></div></dl><button class="enlace" data-ir="prestaciones/diciembre">Ver el cálculo ${ic('derecha', 's')}</button></article></div></div>`;
      if (sub === 'reglas') cuerpo = `<div class="rejilla"><div class="c6 pila"><article class="hoja"><h2>Conceptos de pago</h2><dl class="kv">${D.PARAMS.conceptos.map(c => `<div><dt>${esc(c[0])}</dt><dd class="largo">${esc(c[1])}</dd></div>`).join('')}</dl><p class="muted">Cada concepto dice si es salario o no, y en qué aportes incide. Lo edita RRHH y lo aprueba Alejandro.</p></article>
          <article class="hoja"><h2>Turnos</h2><dl class="kv">${Object.entries(D.TURNOS).map(([k, [n2, h]]) => `<div><dt>${k} · ${n2}</dt><dd class="largo">${esc(h)}</dd></div>`).join('')}</dl></article></div>
        <div class="c6 pila"><article class="hoja"><h2>Feriados</h2><dl class="kv">${D.PARAMS.feriados.map(f => `<div><dt>${esc(f[0])}</dt><dd class="largo">${esc(f[1])}</dd></div>`).join('')}</dl></article>
          <article class="hoja"><h2>Préstamos y consumos</h2><dl class="kv">${D.PARAMS.reglas.filter(r => /Préstamos|Adelantos|Consumo del personal/.test(r[0])).map(r => `<div><dt>${esc(r[0])}</dt><dd class="largo">${esc(r[1])}</dd></div>`).join('')}</dl></article>
          <p class="nota gris">${ic('reloj', 's')}<span>El motor (horas, redobles, 10 %, vacaciones, prestaciones) calcula todo cuando llegue la muestra del Excel del reloj.</span></p></div></div>`;
      return `<div class="pagina">${A.cab('Recursos humanos', 'Nómina', 'Dos corridas cada quincena: la formal, que va a los entes, y la interna. El 10 % del mes se paga con la 2.ª quincena, a tasa euro.')}
        ${A.subnav([['quincena', 'Quincena del 15'], ['diez', '10 % del mes'], ['propinas', 'Propinas', D.PROPINAS.filter(p => p.estado === 'por_repartir').length], ['recibos', 'Recibos firmados', D.RECIBOS.reduce((s2, r) => s2 + r.total - r.firmados, 0), true], ['corridas', 'Corridas anteriores'], ['reglas', 'Reglas']], sub)}${cuerpo}</div>`;
    },
  };
  FICHAS.recibo = id => {
    const e = emp(id); const l = linea(e); const t = D.TASA.usd;
    const col = (titulo, xs, tot) => `<div class="recibo-col"><h4>${titulo}</h4><dl>${xs.length ? xs.map(([c, m]) => `<div><dt>${esc(c)}</dt><dd>${m < 1 ? dinero(m * t, 'bs') : dinero(m)}</dd></div>`).join('') : '<div><dt class="tenue">Nada</dt><dd></dd></div>'}</dl><p class="recibo-sub"><span>Total</span><b>${dinero(tot)}</b></p></div>`;
    return { titulo: 'Recibo de ' + e.nombre, sub: '1.ª quincena de octubre · estimado', mod: 'nomina', obj: { estado: 'por_firmar' }, tags: [['Por firmar', 'aviso']],
      bloques: [{ html: `<div class="recibo-pago"><header class="recibo-cab"><div><b>Recibo de pago</b><small>Razón social de ejemplo, C.A. · RIF J-0000000-4</small></div><div class="der"><small>Del 1 al 15 de octubre de 2026</small><small>Tasa BCV: Bs ${fmt(t)}</small></div></header>
          <p class="recibo-quien"><b>${esc(e.nombre)}</b> · C.I. ${esc(e.ci || 'por cargar')} · ${esc(e.cargo)} · desde el ${esc(e.ingreso)}</p>
          <div class="recibo-cols">${col('Asignaciones', l.as, l.ta)}${col('Deducciones', l.de, l.td)}</div>
          <div class="recibo-neto"><span>Neto a pagar</span><span><b>${dinero(l.neto)}</b> <small>= ${dinero(l.neto * t, 'bs')}</small></span></div>
          <div class="recibo-firma"><span>Recibí conforme · firma del trabajador</span><span>Fecha</span></div></div>` },
        { html: (l.tope ? `<p class="nota alerta">${ic('alerta', 's')}<span>Los préstamos y adelantos pasan de un tercio de lo que gana. La app propone correr una cuota a la quincena siguiente.</span></p>` : '') + (l.pend ? `<p class="nota aviso">${ic('alerta', 's')}<span>Tiene una falta por clasificar. Si queda sin justificar, se descuenta el día.</span></p>` : '') + '<p class="muted">Va un recibo por persona en cada corrida, también en la interna. Se imprime, se firma el día de pago y se sube la foto.</p>' }] };
  };
  FICHAS.corrida = id => {
    const c = D.NOMINA.corridas.find(x => x.id === id); const r = D.RECIBOS.find(x => x.corrida === id);
    return { titulo: 'Nómina del ' + c.fecha, sub: esc(c.tipo), mod: 'nomina', obj: c, bloqueada: true, tags: [['Pagada', 'ok']],
      bloques: [{ filas: [{ l: 'Personas', v: c.personas }, { l: 'Total', v: dinero(c.total) }, { l: 'La preparó', v: 'Andreina' }, { l: 'La revisó', v: 'Jose' }, { l: 'Visto final', v: 'Alejandro' }, ...(r ? [{ l: 'Recibos firmados', v: r.firmados + ' de ' + r.total + (r.firmados < r.total ? ' ' + tag('Faltan ' + (r.total - r.firmados), 'aviso') : '') }] : [])] }, { titulo: 'Archivos', adjuntos: ['Recibos ' + c.fecha + '.pdf', 'Resumen enviado a Pagos al Personal.pdf'] },
        { html: ve() ? '<p class="muted">Una nómina pagada ya no se edita. Si hubo un error, se hace una corrida de reemplazo enlazada a esta.</p>' : '<p class="muted">Ves el total de la corrida. El detalle por persona es solo para dueño, RRHH y contabilidad.</p>' }] };
  };
  FICHAS.propina = id => {
    const p = D.PROPINAS.find(x => x.id === id);
    return { titulo: 'Propinas · ' + p.semana, sub: 'Corrida de los lunes', mod: 'nomina', obj: p, registro: 'Propinas ' + p.semana, tags: [[A.estadoTag(p.estado).replace(/<[^>]+>/g, ''), p.estado === 'pagada' ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'Pote', v: dinero(p.pote), campo: { k: 'pote', tipo: 'dinero' } }, { l: 'Regla', v: esc(p.regla), largo: true }, { l: 'Personas', v: p.personas }, { l: 'A cada uno', v: dinero(p.pote / p.personas) }] }],
      acciones: p.estado === 'por_repartir' ? [{ txt: 'Repartir', acc: 'propina-ok', arg: p.id, tono: 'pri', icono: 'check', solo: 'editar' }] : [] };
  };
  ACC['propina-ok'] = id => A.pedirCodigo('Repartir el pote de la semana.').then(() => { const p = D.PROPINAS.find(x => x.id === id); p.estado = 'pagada'; A.auditar({ modulo: 'Nómina', registro: 'Propinas ' + p.semana, campo: 'estado', antes: 'por repartir', despues: 'pagada' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Repartido. Los recibos quedan por firmar.'); }).catch(() => {});

  /* =============== PRÉSTAMOS Y DESCUENTOS =============== */
  const PR = { form: { emp: 'e3', tipo: 'prestamo', monto: '200', cuotas: '4', primera: '15 oct', desde: 'BVCA', motivo: '' }, hecho: false };
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
    titulo: 'Préstamos y descuentos', corto: 'Préstamos', tab: 'Préstamos', grupo: 'Recursos humanos', icono: 'prestamo', mod: 'nomina', visible: () => S.usuario.rol !== 'fiscal_externo',
    cuenta: () => puede('nomina', 'aprobar') ? D.PRESTAMOS.filter(p => p.estado === 'por_aprobar').length : 0,
    render: (sub = 'prestamos') => {
      const g = !ve(); let cuerpo = '';
      const porCobrar = D.PRESTAMOS.filter(vivo).reduce((s2, p) => s2 + saldo(p), 0);
      const el15 = D.PRESTAMOS.filter(p => p.estado === 'activo').reduce((s2, p) => s2 + p.cuota, 0);
      if (sub === 'prestamos') {
        const filtro = A.filtroActual('vivos');
        const lista = D.PRESTAMOS.filter(p => filtro === 'todos' || (filtro === 'vivos' && (vivo(p) || p.estado === 'por_aprobar')) || (filtro === 'cerrados' && !vivo(p) && p.estado !== 'por_aprobar'));
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Prestado y por cobrar', valor: dinero(porCobrar, 'usd', 0), sub: D.PRESTAMOS.filter(vivo).length + ' préstamos vivos' })}${A.cifra({ etq: 'Se descuenta el 15 de octubre', valor: dinero(el15, 'usd', 0), sub: D.PRESTAMOS.filter(p => p.estado === 'activo').length + ' cuotas' })}${A.cifra({ etq: 'Sale de liquidaciones', valor: dinero(D.PRESTAMOS.filter(p => p.estado === 'en_liquidacion').reduce((s2, p) => s2 + saldo(p), 0), 'usd', 0), sub: 'de quien ya se fue', abrir: 'liquidacion:lq1' })}${A.cifra({ etq: 'Por aprobar', valor: D.PRESTAMOS.filter(p => p.estado === 'por_aprobar').length, sub: 'los aprueba Alejandro', tono: D.PRESTAMOS.some(p => p.estado === 'por_aprobar') ? 'aviso' : '', abrir: (D.PRESTAMOS.find(p => p.estado === 'por_aprobar') || {}).id ? 'prestamo:' + D.PRESTAMOS.find(p => p.estado === 'por_aprobar').id : '' })}</div>
          ${g ? notaAgrupada('Ves los totales. El detalle por persona lo ven el dueño, RRHH y contabilidad.') : `${A.filtros('t-pres', [['vivos', 'Vivos', D.PRESTAMOS.filter(p => vivo(p) || p.estado === 'por_aprobar').length], ['cerrados', 'Pagados o cerrados', D.PRESTAMOS.filter(p => !vivo(p) && p.estado !== 'por_aprobar').length], ['todos', 'Todos', D.PRESTAMOS.length]], filtro, 'Buscar persona o motivo')}
          ${A.tabla({ id: 't-pres', cols: [{ t: 'Persona', cls: 'p' }, { t: 'Prestado', cls: 'r x' }, { t: 'Cuotas', cls: 'x' }, { t: 'Cuota', cls: 'r x' }, { t: 'Debe', cls: 'r' }, { t: 'Estado', cls: 'e' }],
            filas: lista.map(p => ({ abrir: 'prestamo:' + p.id, clase: ['rechazado', 'perdonado'].includes(p.estado) ? 'tenue' : '', celdas: [`<b>${esc(emp(p.emp).nombre)}</b><small>${esc(p.motivo)}</small>`, dinero(p.monto, 'usd', 0), tiraCuotas(p, true) + `<small class="tenue">${p.pagadas} de ${p.cuotas} · termina el ${esc(finDe(p))}</small>`, dinero(p.cuota, 'usd', 0), vivo(p) || p.estado === 'por_aprobar' ? dinero(saldo(p), 'usd', 0) : '—', A.estadoTag(p.estado)] })) })}`}
          <p class="muted">Sin intereses. Cada préstamo lleva la autorización de descuento firmada por la persona. Sale de una cuenta del negocio como pago al personal y se descuenta solo en cada quincena.</p>`;
      }
      if (sub === 'nuevo') {
        const F = PR.form; const e = emp(F.emp);
        cuerpo = !puede('nomina', 'editar') ? A.lectura('nomina') : PR.hecho
          ? `<div class="pila" style="max-width:640px"><div class="hecho-caja">${ic('check')}<span>${PR.hecho}</span></div><div class="fila-btns"><button class="btn sec" data-acc="prest-volver">Volver a los préstamos</button><button class="btn sec" data-acc="prest-nuevo">Registrar otro</button>${PR.nuevoId ? `<button class="btn pri" data-abrir="prestamo:${PR.nuevoId}">Abrir el préstamo</button>` : ''}</div></div>`
          : `<div class="rejilla"><div class="c6 pila"><article class="hoja form"><h2>${F.tipo === 'adelanto' ? 'Adelanto de quincena' : 'Préstamo'}</h2>
              <div class="seg" role="group" aria-label="Tipo"><button data-acc="prest-tipo" data-arg="prestamo" aria-pressed="${F.tipo === 'prestamo'}">Préstamo en cuotas</button><button data-acc="prest-tipo" data-arg="adelanto" aria-pressed="${F.tipo === 'adelanto'}">Adelanto de quincena</button></div>
              <div class="campos">
                <label class="campo ancho"><span>Persona</span><select id="pf-emp" data-pf="emp">${activos().map(x => `<option value="${x.id}"${x.id === F.emp ? ' selected' : ''}>${esc(x.nombre)} · ${esc(x.cargo)}</option>`).join('')}</select></label>
                <label class="campo"><span>Monto ($)</span><input id="pf-monto" data-pf="monto" inputmode="decimal" value="${esc(F.monto)}" autocomplete="off"></label>
                ${F.tipo === 'prestamo' ? `<label class="campo"><span>Cuotas</span><select id="pf-cuotas" data-pf="cuotas">${[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n2 => `<option${String(n2) === F.cuotas ? ' selected' : ''}>${n2}</option>`).join('')}</select></label>
                <label class="campo"><span>Primera cuota</span><select id="pf-primera" data-pf="primera">${['15 oct', '31 oct', '15 nov'].map(q => `<option${q === F.primera ? ' selected' : ''}>${q}</option>`).join('')}</select></label>` : `<label class="campo"><span>Se descuenta</span><select id="pf-primera" data-pf="primera">${['15 oct', '31 oct'].map(q => `<option${q === F.primera ? ' selected' : ''}>${q}</option>`).join('')}</select></label>`}
                <label class="campo"><span>Sale de</span><select id="pf-desde" data-pf="desde">${['BVCA', 'BVCJ', 'BVCE', 'BNC', 'Bóveda', 'Caja chica'].map(c => `<option${c === F.desde ? ' selected' : ''}>${c}</option>`).join('')}</select></label>
                <label class="campo ancho"><span>Para qué</span><input id="pf-motivo" data-pf="motivo" value="${esc(F.motivo)}" placeholder="Lo que dijo la persona" autocomplete="off"></label>
              </div></article>
              <label class="soltar" for="pf-firma">${ic('camara')}<span><b>Autorización de descuento firmada</b>Obligatoria: sin ella no se descuenta de la nómina.</span></label><input id="pf-firma" type="file" accept="image/*,.pdf" class="sr-only"></div>
            <div class="c6 pila"><article class="hoja" id="pf-vista"></article>
              <button class="btn pri full" data-acc="prest-enviar">${ic('candado', 's')}${puede('nomina', 'aprobar') ? 'Aprobar y registrar' : 'Enviar a Alejandro para aprobar'}</button>
              <p class="muted" style="text-align:center">${puede('nomina', 'aprobar') ? 'Te pedirá tu código de 6 dígitos.' : (F.tipo === 'adelanto' ? 'Hasta $ 60 lo apruebas tú (propuesta); más, Alejandro.' : 'Los préstamos los aprueba Alejandro con su código.')}</p>
              <button class="btn ghost" data-acc="prest-volver">${ic('atras', 's')}Volver</button></div></div>`;
        void e;
      }
      if (sub === 'adelantos') cuerpo = g ? notaAgrupada('Ves los totales: ' + D.ADELANTOS.filter(a => a.estado === 'por_descontar').length + ' adelantos por descontar el 15.') : `<p class="desc">Plata que se le adelanta a alguien de su próxima quincena. Se descuenta completa en esa quincena.</p>
        ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Salió de', cls: 'x' }, { t: 'Aprobó', cls: 'x' }, { t: 'Monto', cls: 'r' }, { t: 'Estado', cls: 'e' }], filas: D.ADELANTOS.map(a => ({ abrir: 'adelanto:' + a.id, celdas: [`<b>${esc(emp(a.emp).nombre)}</b><small>${esc(a.fecha)} · ${esc(a.motivo)} · se descuenta el ${esc(a.descuenta)}</small>`, esc(a.desde), esc(a.aprobo), dinero(a.monto, 'usd', 0), A.estadoTag(a.estado)] })) })}
        ${A.boton('nomina', 'Nuevo adelanto', 'data-acc="prest-tipo" data-arg="adelanto-nuevo"', { tono: 'sec', icono: 'mas' })}`;
      if (sub === 'consumos') {
        const por = {}; D.CONSUMOEMP.forEach(c => { por[c.emp] = (por[c.emp] || 0) + c.monto; });
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Consumos del 28 sep al 27 oct', valor: dinero(D.CONSUMOEMP.reduce((s2, c) => s2 + c.monto, 0)), sub: Object.keys(por).length + ' personas hasta hoy' })}${A.cifra({ etq: 'Se descuentan', valor: '31 oct', sub: 'con la 2.ª quincena (corte el 27)' })}${A.cifra({ etq: 'Cómo llegan', valor: 'Del POS', sub: 'la cajera usa «Consumo personal»' })}</div>
          ${g ? notaAgrupada('Ves el total. El detalle por persona lo ven el dueño, RRHH y contabilidad.') : A.tabla({ cols: [{ t: 'Consumo', cls: 'p' }, { t: 'Persona', cls: 'x' }, { t: 'Pedido', cls: 'x' }, { t: 'Monto', cls: 'r' }], filas: D.CONSUMOEMP.map(c => ({ abrir: 'consumoemp:' + c.id, celdas: [`<b>${esc(c.que)}</b><small>${esc(c.fecha)}</small>`, esc(emp(c.emp).nombre), esc(c.pedido), dinero(c.monto)] })), pie: ['Total', '', '', dinero(D.CONSUMOEMP.reduce((s2, c) => s2 + c.monto, 0))] })}
          <p class="nota info">${ic('info', 's')}<span>La comida del turno que da el negocio no se descuenta y no aparece aquí: se registra aparte para que el termómetro de la comida no la cuente como merma. Pendiente: cómo es hoy la comida del personal.</span></p>`;
      }
      if (sub === 'descuentos') {
        const filas = activos().map(e => { const l = linea(e); const pr = l.de.filter(x => /préstamo/.test(x[0])).reduce((s2, x) => s2 + x[1], 0), ad = l.de.filter(x => /Adelanto/.test(x[0])).reduce((s2, x) => s2 + x[1], 0), co = D.CONSUMOEMP.filter(c => c.emp === e.id).reduce((s2, c) => s2 + c.monto, 0); return { e, l, pr, ad, co }; }).filter(x => x.pr || x.ad || x.co);
        cuerpo = g ? notaAgrupada('Ves los totales: ' + dinero(el15, 'usd', 0) + ' en cuotas de préstamos el 15.') : `<p class="desc">Lo que se le descuenta a cada persona en la nómina del 15, comparado con un tercio de lo que gana (el tope propuesto). Los consumos se descuentan el 31.</p>
          ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Préstamo', cls: 'r' }, { t: 'Adelanto', cls: 'r x' }, { t: 'Consumo (el 31)', cls: 'r x' }, { t: 'Tope (1/3)', cls: 'r x' }, { t: '', cls: 'e' }],
            filas: filas.map(({ e, l, pr, ad, co }) => ({ abrir: 'recibo:' + e.id, celdas: [`<b>${esc(e.nombre)}</b><small>Gana ${dinero(l.ta)} en la quincena</small>`, pr ? dinero(pr) : '—', ad ? dinero(ad) : '—', co ? dinero(co) : '—', dinero(l.ta / 3), l.tope ? tag('Pasa el tope', 'alerta') : tag('Dentro del tope', 'ok')] })),
            pie: ['Total', dinero(filas.reduce((s2, x) => s2 + x.pr, 0)), dinero(filas.reduce((s2, x) => s2 + x.ad, 0)), dinero(filas.reduce((s2, x) => s2 + x.co, 0)), '', ''] })}
          <p class="nota aviso">${ic('info', 's')}<span><b>Por confirmar con Cecilia o el abogado:</b> cuánto se puede descontar como máximo en una quincena. Si un descuento pasa el tope, la app propone correr esa cuota al final.</span></p>`;
      }
      return `<div class="pagina">${A.cab('Recursos humanos', 'Préstamos y descuentos', 'Lo que se le presta o adelanta a cada persona y lo que se le descuenta en cada quincena. El saldo siempre está a la vista y, si alguien se va, sale de su liquidación.', sub !== 'nuevo' ? A.boton('nomina', 'Nuevo préstamo', 'data-sub="nuevo"', { icono: 'mas' }) : '')}
        ${sub === 'nuevo' ? '' : A.subnav([['prestamos', 'Préstamos', D.PRESTAMOS.filter(p => p.estado === 'por_aprobar').length], ['adelantos', 'Adelantos'], ['consumos', 'Consumos del personal'], ['descuentos', 'Lo que se descuenta el 15']], sub)}${cuerpo}</div>`;
    },
    montar: (raiz, sub) => {
      if (sub !== 'nuevo' || PR.hecho || !puede('nomina', 'editar')) return;
      const pintar = () => {
        const F = PR.form; const e = emp(F.emp); const monto = leerNum(F.monto) || 0; const n = F.tipo === 'adelanto' ? 1 : +F.cuotas; const cuota = monto / n;
        const l = linea(e); const otros = l.de.filter(x => /préstamo|Adelanto/.test(x[0])).reduce((s2, x) => s2 + x[1], 0);
        const pasa = cuota + otros > l.ta / 3; const vivos = D.PRESTAMOS.filter(p => p.emp === e.id && vivo(p));
        const i0 = D.QUINCENAS.indexOf(F.primera); const fechas = D.QUINCENAS.slice(i0, i0 + n);
        const v = $('#pf-vista', raiz); if (!v) return;
        v.innerHTML = `<h2>Así quedaría</h2>
          <div class="cuotas">${fechas.map((f, k) => `<span class="cuota ${k === 0 ? 'proxima' : 'pendiente'}"><i></i><small>${esc(f)}</small></span>`).join('')}${n > fechas.length ? '<span class="tenue">…</span>' : ''}</div>
          <dl class="kv"><div><dt>${n === 1 ? 'Se descuenta' : n + ' cuotas de'}</dt><dd>${dinero(cuota)}</dd></div><div><dt>Termina</dt><dd>${esc(fechas[fechas.length - 1] || '—')}</dd></div><div><dt>Ya le descuentan el ${esc(F.primera)}</dt><dd>${otros ? dinero(otros) : 'Nada'}</dd></div><div class="total"><dt><b>Total de descuentos de esa quincena</b></dt><dd>${dinero(cuota + otros)} <small class="tenue">de un tope de ${dinero(l.ta / 3)}</small></dd></div></dl>
          ${pasa ? `<p class="chequeo alerta">${ic('alerta', 's')}<span>Pasa un tercio de lo que gana en la quincena. Sube el número de cuotas o baja el monto.</span></p>` : `<p class="chequeo ok">${ic('check', 's')}<span>Queda dentro del tope.</span></p>`}
          ${e.prueba ? `<p class="chequeo alerta">${ic('reloj', 's')}<span>Está en período de prueba hasta el ${fdl(e.prueba)}.</span></p>` : ''}
          ${vivos.length ? `<p class="chequeo aviso">${ic('prestamo', 's')}<span>Ya tiene ${vivos.length === 1 ? 'un préstamo' : vivos.length + ' préstamos'}: debe ${dinero(vivos.reduce((s2, p) => s2 + saldo(p), 0), 'usd', 0)}.</span></p>` : ''}`;
      };
      raiz.querySelectorAll('[data-pf]').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { PR.form[el.dataset.pf] = el.value; pintar(); }));
      pintar();
    },
  };
  ACC['prest-nuevo'] = () => { PR.hecho = false; PR.nuevoId = null; A.ir('prestamos/nuevo'); };
  ACC['prest-tipo'] = t => { if (t === 'adelanto-nuevo') { PR.form.tipo = 'adelanto'; PR.form.monto = '50'; PR.hecho = false; A.ir('prestamos/nuevo'); return; } PR.form.tipo = t; if (t === 'adelanto' && (leerNum(PR.form.monto) || 0) > 100) PR.form.monto = '50'; A.pintarPagina(); };
  ACC['prest-volver'] = () => { PR.hecho = false; PR.nuevoId = null; A.ir('prestamos/prestamos'); };
  ACC['prest-enviar'] = () => {
    const F = PR.form; const monto = leerNum(F.monto) || 0; const e = emp(F.emp);
    if (monto <= 0) { A.aviso('Escribe el monto.', 'info'); return; }
    if (F.motivo.trim().length < 3) { A.aviso('Escribe para qué es: queda en la ficha del préstamo.', 'info'); const m = $('#pf-motivo'); if (m) m.focus(); return; }
    const aprueba = puede('nomina', 'aprobar') || (F.tipo === 'adelanto' && monto <= 60);
    A.pedirCodigo(aprueba ? 'Aprobar y registrar ' + (F.tipo === 'adelanto' ? 'el adelanto' : 'el préstamo') + ' de ' + dinero(monto, 'usd', 0) + ' a ' + e.nombre + '.' : 'Enviar a Alejandro el préstamo de ' + dinero(monto, 'usd', 0) + ' para ' + e.nombre + '.').then(() => {
      if (F.tipo === 'adelanto') {
        const id = 'ad' + (D.ADELANTOS.length + 1); D.ADELANTOS.unshift({ id, emp: e.id, monto, fecha: 'Hoy', descuenta: F.primera, motivo: F.motivo, aprobo: aprueba ? A.S.usuario.nombre : '', desde: F.desde, estado: aprueba ? 'por_descontar' : 'por_aprobar' });
        PR.nuevoId = null; PR.hecho = `Adelanto de ${dinero(monto, 'usd', 0)} a ${esc(e.nombre)} ${aprueba ? 'registrado' : 'enviado a Alejandro'}. Se descuenta completo el ${esc(F.primera)}.`;
      } else {
        const n = +F.cuotas; const id = 'pr' + (D.PRESTAMOS.length + 1);
        D.PRESTAMOS.unshift({ id, emp: e.id, monto, cuotas: n, cuota: Math.round(monto / n * 100) / 100, pagadas: 0, corridas: 0, inicio: F.primera, fecha: 'Hoy', motivo: F.motivo, desde: F.desde, aprobo: aprueba ? A.S.usuario.nombre : '', registro: A.S.usuario.nombre, firmada: true, estado: aprueba ? 'aprobada' : 'por_aprobar' });
        PR.nuevoId = id; PR.hecho = aprueba ? `Préstamo aprobado. Falta pagarlo desde ${esc(F.desde)} y subir el comprobante; la primera cuota se descuenta el ${esc(F.primera)}.` : `Préstamo enviado a Alejandro. Le llegó como pendiente; cuando lo apruebe, se paga y empiezan las cuotas el ${esc(F.primera)}.`;
      }
      A.auditar({ modulo: 'Préstamos', registro: (F.tipo === 'adelanto' ? 'Adelanto ' : 'Préstamo ') + e.nombre, campo: 'creado', despues: dinero(monto, 'usd', 0), motivo: F.motivo });
      A.pintarPagina();
    }).catch(() => {});
  };
  FICHAS.prestamo = id => {
    const p = D.PRESTAMOS.find(x => x.id === id); const e = emp(p.emp); const ap = puede('nomina', 'aprobar');
    const acc = [];
    if (p.estado === 'por_aprobar' && ap) acc.push({ txt: 'Rechazar', acc: 'prest-rechazar', tono: 'ghost' }, { txt: 'Aprobar', acc: 'prest-aprobar', tono: 'pri', icono: 'candado' });
    if (p.estado === 'aprobada' && puede('nomina', 'editar')) acc.push({ txt: 'Registrar el pago', acc: 'prest-pagar', tono: 'pri', icono: 'enviar' });
    if (p.estado === 'activo' && puede('nomina', 'editar')) acc.push({ txt: 'Pagó por adelantado', acc: 'prest-abono', icono: 'mas' }, { txt: 'Correr una cuota', acc: 'prest-correr', icono: 'calendario' });
    if (p.estado === 'activo' && ap) acc.push({ txt: 'Perdonar el saldo', acc: 'prest-perdonar', tono: 'ghost' });
    return { titulo: 'Préstamo de ' + e.nombre, sub: dinero(p.monto, 'usd', 0) + ' · ' + p.cuotas + (p.cuotas === 1 ? ' cuota' : ' cuotas de ') + (p.cuotas === 1 ? '' : dinero(p.cuota)), mod: 'nomina', obj: p, registro: 'Préstamo ' + e.nombre,
      tags: [[A.estadoTag(p.estado).replace(/<[^>]+>/g, ''), p.estado === 'por_aprobar' ? 'aviso' : p.estado === 'activo' ? 'ok' : '']],
      aviso: (p.estado === 'por_aprobar' ? `<p class="nota info">${ic('info', 's')}<span>Lo registró ${esc(p.registro)} hoy. ${ap ? 'Falta tu aprobación con código.' : 'Falta la aprobación de Alejandro.'}</span></p>` : '')
        + (e.prueba && p.estado === 'por_aprobar' ? `<p class="nota aviso">${ic('reloj', 's')}<span>${esc(e.nombre)} está en período de prueba hasta el ${fdl(e.prueba)}. Si no se queda, el saldo sale de lo que se le pague al salir.</span></p>` : '')
        + (p.estado === 'en_liquidacion' ? `<p class="nota aviso">${ic('salir', 's')}<span>${esc(e.nombre)} ya no trabaja aquí. Los ${dinero(saldo(p), 'usd', 0)} que faltan se descuentan de su liquidación. <button class="enlace" data-abrir="liquidacion:lq1">Ver la liquidación</button></span></p>` : '')
        + (p.nota ? `<p class="nota aviso">${ic('calendario', 's')}<span>${esc(p.nota)}</span></p>` : ''),
      bloques: [{ titulo: 'Cuotas', html: tiraCuotas(p) + `<p class="leyenda cuotas-ley"><span><i class="cl pagada"></i>Descontada</span><span><i class="cl proxima"></i>La próxima</span><span><i class="cl corrida"></i>Se corrió</span><span><i class="cl pendiente"></i>Pendiente</span></p>` },
        { titulo: 'Préstamo', filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${e.id}">${esc(e.nombre)}</button>` }, { l: 'Para qué', v: esc(p.motivo), campo: { k: 'motivo', tipo: 'texto' } }, { l: 'Prestado', v: dinero(p.monto, 'usd', 0) }, { l: 'Pagado', v: dinero(p.pagadas * p.cuota, 'usd', 0) }, { l: 'Debe', v: '<b>' + dinero(saldo(p), 'usd', 0) + '</b>' }, { l: 'Termina', v: esc(finDe(p)) }, { l: 'Salió de', v: `<span class="acct" data-c="${esc(p.desde)}">${esc(p.desde)}</span> · ${esc(p.fecha)}` }, { l: 'Lo registró', v: esc(p.registro) }, { l: 'Lo aprobó', v: esc(p.aprobo || 'Nadie todavía') }] },
        p.firmada ? { titulo: 'Autorización de descuento', adjuntos: ['Autorización firmada · ' + e.nombre + '.jpg'] } : { titulo: 'Autorización de descuento', html: `<p class="nota alerta">${ic('alerta', 's')}<span>Falta la autorización firmada. Sin ella no se debería descontar.</span></p><label class="soltar" for="aut-${p.id}">${ic('camara')}<span><b>Subir la autorización firmada</b>Foto o PDF.</span></label><input id="aut-${p.id}" type="file" accept="image/*,.pdf" class="sr-only">` },
        { titulo: 'Historial', tiempo: [[esc(p.fecha), 'Lo registró ' + esc(p.registro) + '.'], ...(p.aprobo ? [[esc(p.fecha), 'Lo aprobó ' + esc(p.aprobo) + ' con su código.']] : []), ...cuotasDe(p).filter(c => c.estado === 'pagada').map(c => [esc(c.fecha), 'Cuota descontada en la nómina.', 'ok'])] }],
      acciones: acc };
  };
  const cambiaPrest = (id, est, txt, motivo = '') => { const p = D.PRESTAMOS.find(x => x.id === id); const antes = p.estado; p.estado = est; if (est === 'aprobada') p.aprobo = A.S.usuario.nombre; A.auditar({ modulo: 'Préstamos', registro: 'Préstamo ' + emp(p.emp).nombre, campo: 'estado', antes, despues: est, motivo }); A.pintarFicha(); A.pintarPagina(); A.aviso(txt); };
  ACC['prest-aprobar'] = id => A.pedirCodigo('Aprobar el préstamo.').then(() => cambiaPrest(id, 'aprobada', 'Aprobado. Jose lo paga y sube el comprobante; la primera cuota se descuenta sola.')).catch(() => {});
  ACC['prest-rechazar'] = id => A.pedirMotivo({ titulo: 'Rechazar el préstamo', texto: 'La persona y quien lo registró ven el motivo.', boton: 'Rechazar', tono: 'peligro' }).then(m => cambiaPrest(id, 'rechazado', 'Rechazado. Se le avisó a quien lo registró.', m)).catch(() => {});
  ACC['prest-pagar'] = id => A.pedirCodigo('Registrar que el préstamo se pagó. Sube después el comprobante.').then(() => cambiaPrest(id, 'activo', 'Pagado. Las cuotas empiezan en la próxima quincena.')).catch(() => {});
  ACC['prest-abono'] = id => A.confirmar({ titulo: 'Pagó una cuota por adelantado', texto: 'Anota que la persona pagó una cuota en efectivo o por transferencia. Entra a la caja o al banco como cobro.', boton: 'Anotar el pago' }).then(() => { const p = D.PRESTAMOS.find(x => x.id === id); p.pagadas = Math.min(p.cuotas, p.pagadas + 1); if (p.pagadas === p.cuotas) p.estado = 'pagada'; A.auditar({ modulo: 'Préstamos', registro: 'Préstamo ' + emp(p.emp).nombre, campo: 'cuotas pagadas', antes: p.pagadas - 1, despues: p.pagadas }); A.pintarFicha(); A.pintarPagina(); A.aviso(p.estado === 'pagada' ? 'Préstamo pagado completo.' : 'Cuota anotada.'); }).catch(() => {});
  ACC['prest-correr'] = id => A.pedirMotivo({ titulo: 'Correr la próxima cuota al final', texto: 'La cuota de la próxima quincena se mueve al final del préstamo. Úsalo si la persona faltó o el descuento pasa el tope.', boton: 'Correr la cuota' }).then(m => { const p = D.PRESTAMOS.find(x => x.id === id); const antes = finDe(p); const c = cuotasDe(p).find(x => x.estado === 'proxima' || x.estado === 'pendiente'); if (!c) return; p.corridaEn = [...(p.corridaEn || []), c.fecha]; p.corridas = p.corridaEn.length; p.nota = 'La cuota del ' + c.fecha + ' se corrió al final: ' + m; A.auditar({ modulo: 'Préstamos', registro: 'Préstamo ' + emp(p.emp).nombre, campo: 'cuotas', antes: 'termina ' + antes, despues: 'termina ' + finDe(p), motivo: m }); A.pintarFicha(); A.pintarPagina(); A.aviso('Listo: ahora termina el ' + finDe(p) + '.'); }).catch(() => {});
  ACC['prest-perdonar'] = id => A.pedirMotivo({ titulo: 'Perdonar el saldo', texto: 'Lo que falta se da por pagado y deja de descontarse. Queda registrado como un beneficio para la persona.', boton: 'Perdonar', tono: 'peligro', codigo: true }).then(m => cambiaPrest(id, 'perdonado', 'Saldo perdonado.', m)).catch(() => {});
  FICHAS.adelanto = id => { const a = D.ADELANTOS.find(x => x.id === id); return { titulo: 'Adelanto de ' + emp(a.emp).nombre, sub: esc(a.fecha) + ' · ' + dinero(a.monto, 'usd', 0), mod: 'nomina', obj: a, registro: 'Adelanto ' + emp(a.emp).nombre, bloques: [{ filas: [{ l: 'Persona', v: `<button class="enlace" data-abrir="empleado:${a.emp}">${esc(emp(a.emp).nombre)}</button>` }, { l: 'Monto', v: dinero(a.monto, 'usd', 0), campo: { k: 'monto', tipo: 'dinero' } }, { l: 'Para qué', v: esc(a.motivo), campo: { k: 'motivo', tipo: 'texto' } }, { l: 'Salió de', v: esc(a.desde) }, { l: 'Lo aprobó', v: esc(a.aprobo || 'Nadie todavía') }, { l: 'Se descuenta', v: 'Completo el ' + esc(a.descuenta) }, { l: 'Estado', v: A.estadoTag(a.estado) }] }] }; };
  FICHAS.consumoemp = id => { const c = D.CONSUMOEMP.find(x => x.id === id); return { titulo: c.que, sub: esc(emp(c.emp).nombre) + ' · ' + esc(c.fecha), mod: 'nomina', obj: c, registro: 'Consumo ' + emp(c.emp).nombre, anulable: true, bloques: [{ filas: [{ l: 'Persona', v: esc(emp(c.emp).nombre) }, { l: 'Pedido del POS', v: esc(c.pedido) }, { l: 'Monto ($)', v: dinero(c.monto), campo: { k: 'monto', tipo: 'dinero' } }, { l: 'Se descuenta', v: '31 oct (2.ª quincena)' }] }, { html: '<p class="muted">Viene del POS: la cajera cerró el pedido con el método «Consumo personal». Si fue un error, se anula aquí con el motivo.</p>' }] }; };

  /* =============== PRESTACIONES Y LIQUIDACIONES =============== */
  const PS = D.PRESTA;
  const prest = e => {
    const base = e.formal ? PS.baseFormal : PS.baseInterna; const integral = base / 30 * (1 + 15 / 360 + 30 / 360);
    const trim = e.anios === 0 ? 0 : PS.trimestres2026; const gar = trim * 15 * integral; const adic = e.anios >= 2 ? Math.min(30, 2 * (e.anios - 1)) * integral : 0;
    const ant = PS.anticipos[e.id] || 0; const inter = (gar + adic) * .04;
    return { base, integral, gar, adic, ant, inter, acum: gar + adic + inter - ant, dic: PS.pagadoDic2025[e.id] || 0 };
  };
  PANT.prestaciones = {
    titulo: 'Prestaciones y liquidaciones', corto: 'Prestaciones', grupo: 'Recursos humanos', icono: 'cajachica', mod: 'nomina', visible: () => S.usuario.rol !== 'fiscal_externo',
    cuenta: () => puede('nomina', 'aprobar') ? D.LIQUIDACIONES.filter(l => l.estado === 'por_aprobar').length : 0,
    render: (sub = 'garantia') => {
      let cuerpo = ''; const g = !ve(); const DI = D.DICIEMBRE;
      if (sub === 'garantia') {
        const lista = activos().map(e => ({ e, p: prest(e) }));
        cuerpo = `<div class="rejilla"><div class="c7 pila">${g ? notaAgrupada('Ves el total: ' + dinero(lista.reduce((s2, x) => s2 + x.p.acum, 0), 'usd', 0) + ' acumulado en 2026 por las personas de la lista.') : A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Base al mes', cls: 'r x' }, { t: 'Garantía 2026', cls: 'r' }, { t: 'Días adicionales', cls: 'r x' }, { t: 'Anticipos', cls: 'r x' }, { t: 'Acumulado', cls: 'r' }],
            filas: lista.map(({ e, p }) => ({ abrir: 'prestacion:' + e.id, celdas: [`<b>${esc(e.nombre)}</b><small>${e.formal ? 'Formal' : 'Interna'} · ${e.anios ? e.anios + (e.anios === 1 ? ' año' : ' años') : 'menos de 1 año'}</small>`, dinero(p.base), dinero(p.gar), p.adic ? dinero(p.adic) : '—', p.ant ? '−' + dinero(p.ant) : '—', dinero(p.acum)] })),
            pie: ['Total', '', dinero(lista.reduce((s2, x) => s2 + x.p.gar, 0)), dinero(lista.reduce((s2, x) => s2 + x.p.adic, 0)), '', dinero(lista.reduce((s2, x) => s2 + x.p.acum, 0))] })}</div>
          <div class="c5 pila"><article class="hoja"><h2>Cómo se calcula</h2><dl class="kv"><div><dt>Cada trimestre</dt><dd class="largo">15 días de salario integral</dd></div><div><dt>Desde el 2.º año</dt><dd class="largo">2 días más por año, hasta 30</dd></div><div><dt>Base de la nómina interna</dt><dd class="largo">$ ${PS.baseInterna} al mes: mínimo + cestaticket + margen de $ ${PS.margen} ${tag('Margen por confirmar', 'aviso')}</dd></div><div><dt>Base de la nómina formal</dt><dd class="largo">La legal: salario mínimo (Bs 130) + recargos</dd></div><div><dt>Anticipos</dt><dd class="largo">Hasta el 75 %, con motivo y soporte</dd></div></dl></article>
          <p class="nota aviso">${ic('alerta', 's')}<span><b>Ojo:</b> con la regla del 29-ago, los formales salen casi en cero porque su salario legal es el mínimo y el resto es cestaticket, que no es salario. Los internos quedan sobre $ ${PS.baseInterna}. Revisar con Cecilia y el abogado.</span></p></div></div>`;
      }
      if (sub === 'diciembre') {
        const total = DI.liquidacionAnual + DI.utilidades + DI.intereses; const llega = DI.apartado + DI.mensual * 2.5; const falta = total - llega;
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Liquidación anual (todos)', valor: g ? 'Agrupado' : dinero(DI.liquidacionAnual, 'usd', 0), sub: 'lo causado en 2026, como pago a cuenta' })}${A.cifra({ etq: 'Utilidades', valor: g ? 'Agrupado' : dinero(DI.utilidades, 'usd', 0), sub: '30 días (el piso) · por confirmar' })}${A.cifra({ etq: 'Intereses de prestaciones', valor: g ? 'Agrupado' : dinero(DI.intereses, 'usd', 0), sub: 'a la tasa del BCV' })}${A.cifra({ etq: 'Hace falta', valor: dinero(total, 'usd', 0), sub: 'del 1 al 15 de diciembre' })}</div>
          <div class="rejilla"><div class="c6"><article class="hoja"><h2>${ic('cajachica')}El ahorro de diciembre</h2><dl class="kv"><div><dt>Apartado hasta hoy</dt><dd>${dinero(DI.apartado, 'usd', 0)}</dd></div><div><dt>Se aparta cada mes</dt><dd>${dinero(DI.mensual, 'usd', 0)}</dd></div><div><dt>Al ritmo de hoy llega a</dt><dd>${dinero(llega, 'usd', 0)}</dd></div><div class="total"><dt><b>${falta > 0 ? 'Faltarían' : 'Sobrarían'}</b></dt><dd>${dinero(Math.abs(falta), 'usd', 0)}</dd></div></dl>
            ${falta > 0 ? `<p class="nota aviso">${ic('alerta', 's')}<span>Para llegar, hay que apartar ${dinero((total - DI.apartado) / 2.5, 'usd', 0)} al mes desde octubre.</span></p>` : ''}</article></div>
          <div class="c6"><article class="hoja"><h2>${ic('calendario')}Lo que viene</h2><ol class="tiempo"><li><time>1 al 15 dic</time><span>Anticipo de utilidades y liquidación anual para todos.</span></li><li><time>31 dic</time><span>Intereses de prestaciones del año.</span></li><li><time>Enero</time><span>Comprobante anual de retenciones (ARC) para la nómina formal.</span></li></ol></article></div></div>`;
      }
      if (sub === 'egresos') cuerpo = `<p class="desc">Cuando alguien se va, la app compara la garantía acumulada con el cálculo retroactivo (30 días por año al último salario integral) y paga el mayor. Descuenta lo ya pagado en cada diciembre y lo que la persona deba. Si fue un despido sin causa, se paga el doble.</p>
        ${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Motivo', cls: 'x' }, { t: 'Vence', cls: 'x' }, { t: 'A pagar', cls: 'r' }, { t: 'Estado', cls: 'e' }], filas: D.LIQUIDACIONES.map(l => ({ abrir: 'liquidacion:' + l.id, celdas: [`<b>${esc(emp(l.emp).nombre)}</b><small>Salió el ${esc(l.egreso)} · ${esc(l.tiempo)}</small>`, esc(l.motivo), esc(l.vence), g ? 'Agrupado' : dinero(l.lineas.reduce((s2, x) => s2 + x[1], 0)), A.estadoTag(l.estado)] })) })}
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
      bloques: [{ html: `<dl class="kv">${l.lineas.map(([c, m, n]) => `<div><dt>${esc(c)}${n ? `<small class="tenue" style="display:block">${esc(n)}</small>` : ''}</dt><dd>${ve() ? (m < 0 ? '−' : '') + dinero(Math.abs(m)) : '—'}</dd></div>`).join('')}<div class="total"><dt><b>A pagar</b></dt><dd>${ve() ? dinero(tot) : 'Agrupado'}</dd></div></dl>` },
        { filas: [{ l: 'Tiempo trabajado', v: esc(l.tiempo) }, { l: 'La preparó', v: esc(l.preparo) }, { l: 'Despido sin causa', v: 'No (renuncia): no hay pago doble' }] },
        { titulo: 'Documentos', adjuntos: ['Carta de renuncia.jpg', 'Finiquito para firmar.pdf'] }],
      acciones: l.estado === 'por_aprobar' && puede('nomina', 'aprobar') ? [{ txt: 'Descargar el finiquito', acc: 'descargar', icono: 'descargar' }, { txt: 'Aprobar y pagar', acc: 'liq-ok', arg: l.id, tono: 'pri', icono: 'candado' }] : [{ txt: 'Descargar el finiquito', acc: 'descargar', icono: 'descargar' }] };
  };
  ACC['liq-ok'] = id => A.pedirCodigo('Aprobar y pagar la liquidación.').then(() => { const l = D.LIQUIDACIONES.find(x => x.id === id); l.estado = 'pagada'; const p = D.PRESTAMOS.find(x => x.emp === l.emp && x.estado === 'en_liquidacion'); if (p) { p.pagadas = p.cuotas; p.estado = 'pagada'; } A.auditar({ modulo: 'Prestaciones', registro: 'Liquidación ' + emp(l.emp).nombre, campo: 'estado', antes: 'por aprobar', despues: 'pagada' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Aprobada. El préstamo quedó saldado con la liquidación.'); }).catch(() => {});
})();
