/* Calendario: el mes con capas (reservas, eventos, personal, fiscal y pagos), reservas que avisan al grupo de
   mesoneros, eventos privados y propios, y el calendario del personal. Datos en datos-gente.js. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, $, $$, esc, fmt, dinero, leerNum, ic, tag, puede } = A;
  const M = D.MESES; const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']; const DOWL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const HOY = [5, 9];
  const fdl = ([d, m]) => DOW[new Date(2026, m, d).getDay()] + ' ' + d + ' ' + M[m];
  const fLarga = ([d, m]) => DOWL[new Date(2026, m, d).getDay()] + ' ' + d + ' de ' + MESL[m];
  const dif = ([d, m]) => Math.round((new Date(2026, m, d) - new Date(2026, 9, 5)) / 864e5);
  const igual = (a, b) => a[0] === b[0] && a[1] === b[1];
  const sumar = ([d, m], n) => { const x = new Date(2026, m, d + n); return [x.getDate(), x.getMonth()]; };
  const sens = () => puede('personal', 'editar') || puede('nomina', 'sueldos');
  const verPlata = () => puede('calendario', 'editar') || puede('nomina', 'sueldos');
  const vigentes = () => D.RESERVAS.filter(r => r.estado !== 'cancelada');
  const personasDe = xs => xs.reduce((s2, r) => s2 + r.personas, 0);
  const ini = n => { const p = n.split(' '); return p[0] + (p[1] ? ' ' + p[1][0] + '.' : ''); };
  const corto = n => n.length > 22 ? n.split(' (')[0].split(' ').slice(0, 2).join(' ') : n;
  // la hora en minutos: «19:45» → 1185 (una hora que no se puede leer da null y va al final, nunca se esconde)
  const minDe = h => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(h || '').trim()); return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null; };
  const hhmm = n => Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
  const porHora = (a, b) => (minDe(a.hora) ?? 9999) - (minDe(b.hora) ?? 9999);
  const AHORA = minDe(D.HOY.hora); // en el prototipo siempre son las 14:05 del lunes 5
  // «No vino» se puede marcar desde media hora después de la hora de la reserva (un día que ya pasó, siempre)
  const noVinoDesde = r => { const m = minDe(r.hora); return m === null ? null : m + 30; };
  const puedeNoVino = r => dif(r.d) < 0 || (dif(r.d) === 0 && noVinoDesde(r) !== null && AHORA >= noVinoDesde(r));

  /* ---------- mensajes al grupo y al cliente ---------- */
  const personasTxt = n => n ? n + ' ' + (n === 1 ? 'persona' : 'personas') : 'personas por anotar';
  // dónde: el área y la mesa, sin repetir la mesa si el área ya la nombra («Salón privado», no «Salón privado · Privado»)
  const donde = (r, sep = ' · ') => r.area + (r.mesa && !String(r.area).toLowerCase().includes(String(r.mesa).toLowerCase()) ? sep + r.mesa : '');
  const msgReserva = (r, tipo = 'Reserva nueva') => `🍽️ *${tipo}*\n*${r.d ? fdl(r.d) : 'Día por elegir'} · ${r.hora || 'hora por elegir'}*\n${r.nombre} · ${personasTxt(r.personas)}\n${donde(r)}${r.ocasion ? '\n' + r.ocasion : ''}${r.notas ? '\nOjo: ' + r.notas : ''}${r.abono ? `\nAbono: $ ${r.abono} ${r.abonoOk ? '(recibido)' : '(falta)'}` : ''}\nTomó: ${r.tomo}`;
  const msgDia = (dia, titulo) => { const xs = vigentes().filter(r => igual(r.d, dia) && r.estado !== 'no_vino').sort(porHora); return xs.length ? `📅 *${titulo} · ${fdl(dia).toLowerCase()}*\n${xs.map(r => `• ${r.hora} · ${r.nombre} · ${r.personas} · ${donde(r, ' ')}${r.ocasion ? ' · ' + r.ocasion.toLowerCase() : ''}`).join('\n')}\n*Total: ${personasDe(xs)} personas*` : `📅 *${titulo} · ${fdl(dia).toLowerCase()}*\nNo hay reservas.`; };
  const msgCliente = r => `Hola, ${r.nombre.split(' (')[0]}. Le confirmamos su reserva para el ${fLarga(r.d)} a las ${r.hora}, ${r.personas} ${r.personas === 1 ? 'persona' : 'personas'}, en ${r.area.toLowerCase()}.${r.abono && !r.abonoOk ? ` Para dejarla firme falta el abono de $ ${r.abono}.` : ''} Si algo cambia, escríbanos por aquí. ¡Los esperamos!`;
  /* los signos de WhatsApp dicen la verdad:
     previa: lo que todavía no sale (una reserva sin guardar) va sin palomitas y dice «Así le llegará al grupo»
     programado: lleva un reloj y la hora en que sale («Sale a las 18:00») · enviando: «Enviando…», mientras el bot no confirma
     confirmado: las dos palomitas, solo cuando el bot confirma que salió · no_salio: en rojo, con «Copiar para mandarlo a mano»
     a_mano: lo mandó una persona desde su teléfono (sin palomitas: el bot no lo vio salir) */
  const PIE_WA = {
    previa: () => '',
    programado: h => `${ic('reloj', 'xs')}<span>Sale a las ${esc(h)}</span>`,
    enviando: () => `${ic('reloj', 'xs')}<span>Enviando…</span>`,
    confirmado: h => `<span>${esc(h)}</span><span class="tics" aria-hidden="true">✓✓</span><span class="sr-only">, el bot confirmó que salió</span>`,
    no_salio: h => `${ic('alerta', 'xs')}<span>No salió · ${esc(h)}</span>`,
    a_mano: h => `${ic('celular', 'xs')}<span>Mandado a mano · ${esc(h)}</span>`,
  };
  const burbuja = (txt, hora = D.HOY.hora, estado = 'confirmado') => { const pie = (PIE_WA[estado] || PIE_WA.confirmado)(hora); return `<div class="wa-burbuja ${estado}">${esc(txt).replace(/\*([^*\n]+)\*/g, '<b>$1</b>')}${pie ? `<time>${pie}</time>` : ''}</div>`; };
  // copiar: la reserva cuyo mensaje no salió (con «Copiar para mandarlo a mano» y, para quien toma reservas, «Ya lo mandé») · por: por qué no salió
  const wa = (txt, { grupo = D.GRUPO_MESONEROS.nombre, hora = D.HOY.hora, estado = 'confirmado', copiar = '', por = '' } = {}) => {
    const falla = estado !== 'no_salio' ? '' : `<div class="wa-falla"><p>${ic('alerta', 's')}<span>${esc(por || 'El bot no lo pudo mandar.')}${puede('calendario', 'editar') ? ' Cópialo y mándalo desde un teléfono que esté en el grupo.' : ' Lo manda a mano quien toma las reservas.'}</span></p>
      ${copiar && puede('calendario', 'editar') ? `<div class="fila-btns"><button class="btn sec chico" data-acc="wa-copiar" data-arg="${esc(copiar)}">${ic('copiar', 's')}Copiar para mandarlo a mano</button><button class="btn ghost chico" data-acc="wa-mandado" data-arg="${esc(copiar)}">${ic('check', 's')}Ya lo mandé</button></div>` : ''}</div>`;
    return `<div class="wa" data-estado="${estado}" role="group" aria-label="${estado === 'previa' ? 'Vista previa del mensaje: todavía no sale' : 'Mensaje de WhatsApp al grupo ' + esc(grupo)}"><div class="wa-cab">${ic('mensaje', 's')}<span>${esc(grupo)}</span>${estado === 'previa' ? `<span class="wa-previa">${ic('ojo', 'xs')}Así le llegará al grupo</span>` : ''}</div>${burbuja(txt, hora, estado)}${falla}</div>`;
  };
  // el último mensaje de una reserva al grupo (si no se guardó, el de cuando se tomó: salió y el bot lo confirmó)
  const avisoDe = r => r.aviso || { estado: 'confirmado', tipo: 'Reserva nueva', hora: igual(r.d, HOY) ? '11:00' : 'Vie 2 oct' };
  // al guardar, cambiar o anular, el mensaje sale «Enviando…» y el bot lo confirma (simulado: 1,6 s después); recién ahí lleva ✓✓
  const avisar = (r, tipo) => {
    r.aviso = { estado: 'enviando', tipo, hora: D.HOY.hora };
    setTimeout(() => {
      if (!D.RESERVAS.includes(r) || !r.aviso || r.aviso.estado !== 'enviando') return;
      r.aviso.estado = 'confirmado';
      if (S.ficha && S.ficha.tipo === 'reserva' && S.ficha.id === r.id && !S.ficha.editando) A.pintarFicha();
      if (S.usuario && S.ruta === 'calendario' && S.sub.calendario === 'nueva' && C.hecho === r.id) A.pintarPagina();
    }, 1600);
  };
  const noSalieron = () => D.RESERVAS.filter(r => r.aviso && r.aviso.estado === 'no_salio');
  A.msgDia = msgDia; A.wa = wa; A.noSalieron = noSalieron;

  /* ---------- lo que hay cada día, por capa ---------- */
  const C = { mes: 9, capas: { reservas: true, eventos: true, personal: true, fiscal: true, pagos: true }, hecho: null, form: null, vista: 'libro', dia: [5, 9] };
  const cap = t => t[0].toUpperCase() + t.slice(1);
  // una página del libro de reservas: las horas en el margen rojo, cada reserva en su renglón
  // cualquier hora tiene su renglón (19:45 va debajo de 19:30) y ninguna reserva se esconde: una hora que no se puede leer va al final
  function paginaLibro(dia) {
    const ed = puede('calendario', 'editar');
    const xs = D.RESERVAS.filter(r => igual(r.d, dia)).sort(porHora);
    const base = []; for (let h = 12; h <= 22; h++) base.push(h * 60);
    const slots = [...new Set(base.concat(xs.map(r => minDe(r.hora)).filter(m => m !== null)))].sort((a, b) => a - b);
    const sinHora = xs.filter(r => minDe(r.hora) === null);
    const vivas = xs.filter(r => !['cancelada', 'no_vino'].includes(r.estado));
    const ESTADO = { confirmada: 'confirmada', por_confirmar: 'por confirmar, anotada a lápiz', llego: 'llegó', no_vino: 'no vino', cancelada: 'anulada' };
    const renglon = r => {
      const extra = [r.estado === 'no_vino' ? '<b class="lr-rojo">No vino</b>' : '', r.estado === 'cancelada' ? '<b>Anulada</b>' : '', r.estado === 'por_confirmar' ? 'por confirmar' : '', minDe(r.hora) === null ? `<b class="lr-abono">hora por revisar: «${esc(r.hora)}»</b>` : '', r.ocasion ? esc(r.ocasion.toLowerCase()) : '', r.notas ? esc(r.notas) : '', r.abono && !r.abonoOk ? `<b class="lr-abono">falta el abono de $ ${r.abono}</b>` : ''].filter(Boolean).join(' · ');
      return `<button class="libro-res" data-abrir="reserva:${r.id}"><span class="lr-nombre">${esc(r.nombre)}</span><span class="lr-pers" title="Personas">${r.personas}</span><span class="lr-mesa">${esc(r.mesa || r.area)}</span>${extra ? `<small>${extra}</small>` : ''}<span class="sr-only">, ${r.personas} personas, ${ESTADO[r.estado]}</span></button>`;
    };
    const filas = rs => rs.map((r, i) => `<li class="${r.estado}"><time>${i === 0 ? (minDe(r.hora) === null ? '¿?' : hhmm(minDe(r.hora))) : ''}${r.estado === 'llego' ? ic('check', 'xs') : ''}</time>${renglon(r)}</li>`).join('');
    return `<section class="libro-pag${igual(dia, HOY) ? ' es-hoy' : ''}" aria-label="Reservas del ${fLarga(dia)}">
      <header class="libro-cab"><h3>${cap(fLarga(dia))}</h3><span>${igual(dia, HOY) ? 'Hoy · ' : dif(dia) === 1 ? 'Mañana · ' : ''}${vivas.length} ${vivas.length === 1 ? 'reserva' : 'reservas'}</span></header>
      <ol class="libro-lineas">${slots.map(m => { const h = hhmm(m); const rs = xs.filter(r => minDe(r.hora) === m);
        if (!rs.length) return `<li class="vacia"><time>${h}</time>${ed && dif(dia) >= 0 ? `<button class="libro-escribir" data-acc="res-hora" data-arg="${dia[0]}-${dia[1]}|${h}"><span>Anotar a las ${h}</span></button>` : '<span></span>'}</li>`;
        return filas(rs); }).join('')}${filas(sinHora)}</ol>
      <footer class="libro-pie"><span>Total del día</span><b>${personasDe(vivas)} ${personasDe(vivas) === 1 ? 'persona' : 'personas'}</b></footer>
    </section>`;
  }
  const libro = () => `<div class="libro-nav"><div class="seg" role="group" aria-label="Día"><button data-acc="libro-dia" data-arg="-1">‹ Día anterior</button><button data-acc="libro-dia" data-arg="0" aria-pressed="${igual(C.dia, HOY)}">Hoy</button><button data-acc="libro-dia" data-arg="1">Día siguiente ›</button></div>
      <div class="seg" role="group" aria-label="Ver como"><button data-acc="res-vista" data-arg="libro" aria-pressed="true">Libro</button><button data-acc="res-vista" data-arg="lista" aria-pressed="false">Lista</button></div></div>
    <div class="libro-reservas">${paginaLibro(C.dia)}${paginaLibro(sumar(C.dia, 1))}</div>
    <p class="leyenda libro-ley"><span><span class="lm tinta">Con tinta</span> confirmada</span><span><span class="lm lapiz">A lápiz</span> por confirmar</span><span>${ic('check', 'xs')} llegó</span><span><span class="lm tachada">Tachada en rojo</span> no vino</span>${puede('calendario', 'editar') ? '<span>Toca un renglón vacío para anotar a esa hora</span>' : ''}</p>`;
  const capasDisp = () => [['reservas', 'Reservas', true], ['eventos', 'Eventos', true], ['personal', 'Personal', true], ['fiscal', 'Fiscal', puede('fiscal')], ['pagos', 'Pagos y nómina', puede('pagos') || puede('nomina')]].filter(c => c[2]);
  function itemsDia(dia, todas = false) {
    const on = k => todas || C.capas[k]; const out = [];
    if (on('reservas')) vigentes().filter(r => igual(r.d, dia)).sort(porHora).forEach(r => out.push({ capa: 'reservas', tono: r.estado === 'no_vino' ? 'tachado' : r.estado === 'por_confirmar' ? 'info punteado' : 'info', txt: `${r.hora} ${corto(r.nombre)} · ${r.personas}`, largo: `${r.hora} · ${r.nombre} · ${r.personas} personas · ${r.area}`, abrir: 'reserva:' + r.id, icono: 'cubiertos' }));
    if (on('eventos')) D.EVENTOS_AG.filter(e => igual(e.d, dia)).forEach(e => out.push({ capa: 'eventos', tono: e.tipo === 'propio' && !e.personas ? 'gris' : 'evento', txt: e.nombre, largo: `${e.nombre} · ${e.hora}${e.personas ? ' · ' + e.personas + ' personas' : ''}`, abrir: 'evento:' + e.id, icono: 'estrella' }));
    if (on('personal')) {
      A.rh.activos().forEach(e => {
        if (e.nac && e.nac[0] === dia[0] && e.nac[1] === dia[1]) out.push({ capa: 'personal', tono: 'lila', txt: 'Cumple ' + ini(e.nombre), largo: `Cumpleaños de ${e.nombre} (${A.rh.cumpleAnios(e)})`, abrir: sens() ? 'empleado:' + e.id : '', icono: 'pastel' });
        if (sens() && e.contratoVence && igual(e.contratoVence, dia)) out.push(A.rh.yaFijo(e)
          ? { capa: 'personal', tono: 'alerta', txt: 'Ya es fijo: ' + ini(e.nombre), largo: `${e.nombre}: ${A.rh.fijoTxt(e).toLowerCase()}, ya es indeterminado (fijo) y esta fecha no lo termina`, abrir: 'empleado:' + e.id, icono: 'archivo' }
          : { capa: 'personal', tono: 'alerta', txt: 'Vence contrato: ' + ini(e.nombre), largo: `Vence el contrato de ${e.nombre}`, abrir: 'empleado:' + e.id, icono: 'archivo' });
        if (sens() && e.prueba && igual(e.prueba, dia)) out.push({ capa: 'personal', tono: 'alerta', txt: 'Fin de prueba: ' + ini(e.nombre), largo: `Termina el período de prueba de ${e.nombre}`, abrir: 'empleado:' + e.id, icono: 'reloj' });
      });
      D.VACACIONES.filter(v => v.desde).forEach(v => {
        const n = A.rh.emp(v.emp).nombre;
        if (igual(v.desde, dia)) out.push({ capa: 'personal', tono: 'ausencia', txt: 'Vacaciones: ' + ini(n), largo: `Empieza vacaciones ${n} · regresa el ${v.regresa}`, abrir: sens() ? 'vacacion:' + v.id : '', icono: 'maleta' });
        if (igual(sumar(v.hasta, 1), dia)) out.push({ capa: 'personal', tono: 'gris', txt: 'Regresa ' + ini(n), largo: `Regresa de vacaciones ${n}`, abrir: sens() ? 'vacacion:' + v.id : '', icono: 'maleta' });
      });
      D.REPOSOS.filter(r => r.tipo === 'reposo').forEach(r => { const n = A.rh.emp(r.emp).nombre; if (igual(sumar(r.hasta, 1), dia)) out.push({ capa: 'personal', tono: 'gris', txt: 'Vuelve ' + ini(n), largo: `Vuelve ${n}${sens() ? ' (termina su reposo)' : ''}`, abrir: sens() ? 'reposo:' + r.id : '', icono: 'usuario' }); });
    }
    if (on('fiscal') && puede('fiscal')) D.OBLIGACIONES.filter(o => o.dia === dia[0] && (o.mes || 'oct') === M[dia[1]] && o.estado !== 'pagada').forEach(o => out.push({ capa: 'fiscal', tono: 'gris', txt: o.corto, largo: `${o.corto} · ${o.ente}`, abrir: 'obligacion:' + o.id, icono: 'fiscal' }));
    if (on('pagos') && (puede('pagos') || puede('nomina'))) {
      if (puede('pagos') && new Date(2026, dia[1], dia[0]).getDay() === 1) out.push({ capa: 'pagos', tono: 'gris', txt: 'Pagos del lunes', largo: 'Pagos de los lunes a proveedores', ir: 'pagos', icono: 'pagos' });
      if (puede('nomina') && ((dia[0] === 15) || (dia[1] === 9 && dia[0] === 31) || (dia[1] === 10 && dia[0] === 30))) out.push({ capa: 'pagos', tono: 'gris', txt: 'Nómina', largo: dia[0] === 15 ? 'Nómina: 1.ª quincena' : 'Nómina: 2.ª quincena, 10 % y premio, cada uno en su corrida', ir: 'nomina', icono: 'nomina' });
    }
    return out;
  }
  const evBtn = x => x.abrir ? `<button class="ev ${x.tono}" data-abrir="${x.abrir}" title="${esc(x.largo)}">${esc(x.txt)}</button>` : x.ir ? `<button class="ev ${x.tono}" data-ir="${x.ir}" title="${esc(x.largo)}">${esc(x.txt)}</button>` : `<span class="ev ${x.tono}" title="${esc(x.largo)}">${esc(x.txt)}</span>`;
  function mes(m) {
    const off = (new Date(2026, m, 1).getDay() + 6) % 7; const ult = new Date(2026, m + 1, 0).getDate(); const celdas = Math.ceil((off + ult) / 7) * 7;
    let html = `<div class="cal agenda" role="grid" aria-label="${MESL[m]} de 2026">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(x => `<div class="dsem">${x}</div>`).join('')}`;
    for (let k = 0; k < celdas; k++) {
      const dt = new Date(2026, m, 1 - off + k); const dia = [dt.getDate(), dt.getMonth()]; const fuera = dt.getMonth() !== m;
      const its = itemsDia(dia); const max = 3;
      html += `<div class="dia${fuera ? ' fuera' : ''}${igual(dia, HOY) ? ' hoy' : ''}"><button class="n" data-abrir="agendadia:${dia[0]}-${dia[1]}" aria-label="${fLarga(dia)}: ${its.length} cosas">${dia[0]}</button>${its.slice(0, max).map(evBtn).join('')}${its.length > max ? `<button class="ev mas" data-abrir="agendadia:${dia[0]}-${dia[1]}">+${its.length - max} más</button>` : ''}</div>`;
    }
    return html + '</div>';
  }
  const agendaLista = (dias) => dias.map(dia => { const its = itemsDia(dia); return its.length ? `<div class="sec"><h2>${igual(dia, HOY) ? 'Hoy' : dif(dia) === 1 ? 'Mañana' : fdl(dia)}</h2></div><ul class="lista">${its.map(x => `<li>${x.abrir || x.ir ? `<button class="fila" ${x.abrir ? `data-abrir="${x.abrir}"` : `data-ir="${x.ir}"`}>` : '<div class="fila">'}<span class="lead ${['info', 'evento', 'lila', 'ok', 'alerta'].includes(x.tono.split(' ')[0]) ? x.tono.split(' ')[0] : ''}">${ic(x.icono)}</span><span class="medio"><b>${esc(x.largo)}</b></span><span class="fin">${x.abrir || x.ir ? ic('derecha', 's chev') : ''}</span>${x.abrir || x.ir ? '</button>' : '</div>'}</li>`).join('')}</ul>` : ''; }).join('');

  /* =============== CALENDARIO =============== */
  PANT.calendario = {
    titulo: 'Calendario', corto: 'Calendario', tab: 'Calendario', grupo: 'Hoy', icono: 'calendario', mod: 'calendario', palabras: 'reserva reservas evento cumpleanos agenda',
    secciones: [['mes', 'Mes', 'capas'], ['reservas', 'Reservas', 'reserva mesa libro'], ['eventos', 'Eventos', 'evento salon privado'], ['personal', 'Personal', 'cumpleanos vacaciones'], ['avisos', 'Avisos al grupo', 'mesoneros whatsapp']],
    cuenta: () => puede('calendario', 'editar') ? D.RESERVAS.filter(r => r.estado === 'por_confirmar' && dif(r.d) >= 0).length : 0,
    // «Salir sin guardar» desde la reserva nueva: el borrador se descarta y la próxima arranca en blanco
    descartar: () => { C.form = null; C.hecho = null; },
    // la reserva nueva es un formulario: la pestaña o el menú vuelven al mes, y al salir se borra «Reserva guardada»
    // (así «Nueva reserva» abre siempre en blanco; «Anotar a las…» y «Nueva reserva este día» llenan el día y la hora a propósito)
    transitorias: ['nueva'],
    alSalir: sub => { if (sub === 'nueva') { C.form = null; C.hecho = null; } },
    render: (sub = 'mes') => {
      let cuerpo = '';
      if (sub === 'mes') {
        const prox = Array.from({ length: 7 }, (_, i) => sumar(HOY, i));
        cuerpo = `<div class="filtros"><div class="seg capas" role="group" aria-label="Qué mostrar">${capasDisp().map(([k, t]) => `<button data-acc="cal-capa" data-arg="${k}" aria-pressed="${C.capas[k]}"><i class="punto ${k}"></i>${t}</button>`).join('')}</div>
          <div class="seg" role="group" aria-label="Mes"><button data-acc="cal-mes" data-arg="9" aria-pressed="${C.mes === 9}">Octubre</button><button data-acc="cal-mes" data-arg="10" aria-pressed="${C.mes === 10}">Noviembre</button></div></div>
          <div class="rejilla"><div class="c8 pila"><div class="sec"><h2>${MESL[C.mes][0].toUpperCase() + MESL[C.mes].slice(1)} de 2026</h2><span class="muted">Toca un día para ver todo lo que tiene</span></div>${mes(C.mes)}</div>
          <div class="c4 pila"><div class="sec"><h2>Los próximos 7 días</h2></div>${agendaLista(prox) || '<p class="muted">Nada en los próximos 7 días.</p>'}</div></div>`;
      }
      if (sub === 'reservas') {
        const filtro = A.filtroActual('proximas');
        const lista = D.RESERVAS.filter(r => filtro === 'todas' || (filtro === 'proximas' && dif(r.d) >= 0 && r.estado !== 'cancelada') || (filtro === 'hoy' && igual(r.d, HOY)) || (filtro === 'pasadas' && dif(r.d) < 0)).sort((a, b) => (filtro === 'pasadas' ? -1 : 1) * (dif(a.d) - dif(b.d) || porHora(a, b)));
        const hoy = vigentes().filter(r => igual(r.d, HOY)), man = vigentes().filter(r => igual(r.d, sumar(HOY, 1))), sem = vigentes().filter(r => dif(r.d) >= 0 && dif(r.d) <= 6);
        const pasadas = D.RESERVAS.filter(r => ['llego', 'no_vino'].includes(r.estado));
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Hoy', valor: hoy.length + (hoy.length === 1 ? ' reserva' : ' reservas'), sub: personasDe(hoy) + ' personas · la primera a las ' + (hoy.sort(porHora)[0] || { hora: '—' }).hora, acc: 'libro-dia', arg: '0' })}${A.cifra({ etq: 'Mañana', valor: man.length + (man.length === 1 ? ' reserva' : ' reservas'), sub: personasDe(man) + ' personas' + (man.some(r => r.abono && !r.abonoOk) ? ' · falta un abono' : ''), tono: man.some(r => r.abono && !r.abonoOk) ? 'aviso' : '', abrir: man[0] ? 'reserva:' + man[0].id : '' })}${A.cifra({ etq: 'Esta semana', valor: sem.length, sub: personasDe(sem) + ' personas' })}${A.cifra({ etq: 'No vinieron (octubre)', valor: pasadas.filter(r => r.estado === 'no_vino').length + ' de ' + pasadas.length, sub: 'se anota en cada reserva' })}</div>
          ${C.vista === 'libro' ? libro() : `<div class="libro-nav"><span></span><div class="seg" role="group" aria-label="Ver como"><button data-acc="res-vista" data-arg="libro" aria-pressed="false">Libro</button><button data-acc="res-vista" data-arg="lista" aria-pressed="true">Lista</button></div></div>
          ${A.filtros('t-res', [['proximas', 'Próximas', vigentes().filter(r => dif(r.d) >= 0).length], ['hoy', 'Hoy', hoy.length], ['pasadas', 'Pasadas', D.RESERVAS.filter(r => dif(r.d) < 0).length], ['todas', 'Todas', D.RESERVAS.length]], filtro, 'Buscar nombre, mesa u ocasión')}
          ${A.tabla({ id: 't-res', cols: [{ t: 'Reserva', cls: 'p' }, { t: 'Personas', cls: 'r x' }, { t: 'Dónde', cls: 'x' }, { t: 'Ocasión', cls: 'x' }, { t: 'Estado', cls: 'e' }], filas: lista.map(r => ({ abrir: 'reserva:' + r.id, clase: r.estado === 'cancelada' ? 'anulada' : '', celdas: [`<b>${esc(r.nombre)}</b><small>${igual(r.d, HOY) ? 'Hoy' : esc(fdl(r.d))} · ${esc(r.hora)}<span class="en-tel"> · ${esc(donde(r))} · ${personasTxt(r.personas)}</span>${r.notas ? ' · ' + esc(r.notas) : ''}</small>`, r.personas, esc(donde(r)), esc(r.ocasion || '—'), r.abono && !r.abonoOk ? tag('Falta el abono', 'aviso') : A.estadoTag(r.estado)] })) })}`}
          <p class="muted">Cada reserva nueva, cambiada o anulada avisa al grupo «${esc(D.GRUPO_MESONEROS.nombre)}». A las 11:00 sale la lista del día y a las 18:00 la de mañana.</p>`;
      }
      if (sub === 'nueva') cuerpo = !puede('calendario', 'editar') ? A.lectura('calendario') : C.hecho ? hechoReserva(D.RESERVAS.find(r => r.id === C.hecho)) : formReserva();
      if (sub === 'eventos') {
        const xs = [...D.EVENTOS_AG].sort((a, b) => dif(a.d) - dif(b.d));
        cuerpo = `<p class="desc">Eventos privados (alguien reserva el salón o un menú para un grupo) y eventos propios del restaurante. Compras los ve con tiempo para pedir la mercancía.</p>
          <div class="rejilla">${xs.map(e => { const hechas = e.tareas.filter(t => t[1]).length; return `<div class="c6"><button class="hoja evento-tarjeta" data-abrir="evento:${e.id}"><div class="hoja-cab"><h2>${ic(e.tipo === 'propio' ? 'estrella' : 'cubiertos')}${esc(e.nombre)}</h2>${A.estadoTag(e.estado)}</div>
            <dl class="kv"><div><dt>Cuándo</dt><dd>${esc(fdl(e.d))} · ${esc(e.hora)}</dd></div>${e.personas ? `<div><dt>Personas</dt><dd>${e.personas}</dd></div>` : ''}${e.tipo === 'privado' && verPlata() ? `<div><dt>Total · abono</dt><dd>${dinero(e.personas * e.porPersona, 'usd', 0)} · ${e.abono ? dinero(e.abono, 'usd', 0) : 'sin abono'}</dd></div>` : ''}<div><dt>Listo</dt><dd>${hechas} de ${e.tareas.length} tareas</dd></div></dl>
            <div class="pista"><span class="${hechas === e.tareas.length ? 'ok' : 'aviso'}" style="width:${hechas / e.tareas.length * 100}%"></span></div></button></div>`; }).join('')}</div>
          ${A.boton('calendario', 'Nuevo evento', 'data-acc="pronto"', { tono: 'sec', icono: 'mas' })}`;
      }
      if (sub === 'personal') {
        const cumples = A.rh.activos().filter(e => e.nac && A.rh.proxCumple(e) <= 60).sort((a, b) => A.rh.proxCumple(a) - A.rh.proxCumple(b));
        cuerpo = `<p class="desc">Vacaciones, ausencias y cumpleaños de octubre y noviembre${sens() ? ', más los contratos y períodos de prueba que vencen' : ''}. Sirve para armar los turnos sin sorpresas.</p>
          <article class="hoja">${A.gantt(A.filasPersonal({ conContratos: sens() }))}</article>
          <div class="rejilla"><div class="c6"><article class="hoja"><h2>${ic('pastel')}Cumpleaños que vienen</h2><ul class="lista">${cumples.map(e => `<li>${sens() ? `<button class="fila" data-abrir="empleado:${e.id}">` : '<div class="fila">'}<span class="lead lila">${ic('pastel')}</span><span class="medio"><b>${esc(e.nombre)}</b><small>${esc(fdl([e.nac[0], e.nac[1]]))} · cumple ${A.rh.cumpleAnios(e)} · ${esc(e.cargo)}</small></span><span class="fin">${A.rh.proxCumple(e) === 0 ? tag('Hoy', 'lila') : tag('En ' + A.rh.proxCumple(e) + ' días', '')}</span>${sens() ? '</button>' : '</div>'}</li>`).join('')}</ul>
            <p class="muted">RRHH y la supervisora reciben el aviso 3 días antes.</p></article></div>
          <div class="c6"><article class="hoja"><h2>${ic('maleta')}Vacaciones y ausencias</h2><ul class="lista">${D.VACACIONES.filter(v => v.desde).map(v => `<li><div class="fila"><span class="lead rayado">${ic('maleta')}</span><span class="medio"><b>${esc(A.rh.emp(v.emp).nombre)}</b><small>${esc(fdl(v.desde))} al ${esc(fdl(v.hasta))} · regresa el ${esc(v.regresa)}</small></span><span class="fin">${A.estadoTag(v.estado)}</span></div></li>`).join('')}${D.REPOSOS.filter(r => r.tipo === 'reposo').map(r => `<li><div class="fila"><span class="lead rayado">${ic('usuario')}</span><span class="medio"><b>${esc(A.rh.emp(r.emp).nombre)}</b><small>${sens() ? 'De reposo' : 'Ausente'} hasta el ${esc(fdl(r.hasta))}</small></span><span></span></div></li>`).join('')}</ul></article>
          ${sens() ? `<article class="hoja"><h2>${ic('archivo')}Contratos y períodos de prueba</h2><ul class="lista">${A.rh.activos().filter(e => e.contratoVence || e.prueba).map(e => { const fijo = !e.prueba && A.rh.yaFijo(e); return `<li><button class="fila" data-abrir="empleado:${e.id}"><span class="lead alerta">${ic('archivo')}</span><span class="medio"><b>${esc(e.nombre)}</b><small>${e.prueba ? 'Termina la prueba el ' + esc(fdl(e.prueba)) : fijo ? esc(A.rh.fijoTxt(e)) + ': ya es indeterminado (fijo). Terminarlo sería un despido y necesita permiso de la Inspectoría' : 'Vence el contrato el ' + esc(fdl(e.contratoVence))}${/2\.ª/.test(e.contrato) ? ' · 2.ª prórroga' : ''}</small></span><span class="fin">${fijo ? tag('Ya es fijo', 'alerta') : tag('En ' + dif(e.prueba || e.contratoVence) + ' días', 'aviso')}</span></button></li>`; }).join('')}</ul></article>` : ''}</div></div>`;
      }
      if (sub === 'avisos') {
        const G = D.GRUPO_MESONEROS; const ed = puede('calendario', 'editar');
        const reglas = [['Reserva nueva, cambiada o anulada', 'Al momento', true], ['Las reservas del día', 'Todos los días a las 11:00', true], ['Las reservas de mañana', 'Todos los días a las 18:00', true], ['Eventos', '7 días antes y el mismo día', true], ['Cumpleaños del personal', 'El día, al grupo del personal (por decidir)', false]];
        // lo que no salió va primero: es lo único que pide algo (mandarlo a mano)
        const fallas = noSalieron().map(r => { const a = avisoDe(r); return `<div class="sec"><h2>${esc(a.tipo)} · ${esc(r.nombre)}</h2>${tag('No salió', 'alerta')}</div>${wa(msgReserva(r, a.tipo), { hora: a.hora, estado: 'no_salio', copiar: r.id, por: a.por })}`; }).join('');
        // los mensajes van primero (en el teléfono, lo que no salió queda arriba); la configuración del grupo, al lado o debajo
        cuerpo = `<div class="rejilla"><div class="c6 pila">${fallas}
            <div class="sec"><h2>Hoy a las 11:00</h2>${tag('Enviado (simulado)', 'ok')}</div>${wa(msgDia(HOY, 'Reservas de hoy'), { hora: '11:00', estado: 'confirmado' })}
            <div class="sec"><h2>Hoy a las 18:00</h2>${tag('Programado', 'info')}</div>${wa(msgDia(sumar(HOY, 1), 'Reservas de mañana'), { hora: '18:00', estado: 'programado' })}</div>
          <div class="c6 pila"><article class="hoja"><div class="hoja-cab"><h2>${ic('mensaje')}Grupo «${esc(G.nombre)}»</h2>${tag('Por crear', 'aviso')}</div><p class="muted">${esc(G.miembros)}. Hay que crear el grupo en WhatsApp y meter al número del bot (el de automatización, que ya está en los otros grupos).</p>
            <ul class="lista lista-reglas">${reglas.map(([t, h, on], i) => `<li><div class="fila"><span class="medio"><b>${t}</b><small>${h}</small></span>${ed ? `<label class="interruptor"><input type="checkbox" ${on ? 'checked' : ''} data-acc="aviso-grupo" data-arg="${i}" aria-label="${esc(t)}"></label>` : `<span class="tenue">${on ? 'Encendido' : 'Apagado'}</span>`}</div></li>`).join('')}</ul></article>
          <p class="nota gris">${ic('candado', 's')}<span>Al grupo no van teléfonos de clientes ni montos: solo nombre, hora, personas, mesa y lo que hay que preparar. Al cliente no le escribe el bot: el recordatorio se copia y se manda desde el WhatsApp del restaurante, que no se conecta al bot.</span></p>
          <p class="leyenda wa-ley"><span><span class="tics" aria-hidden="true">✓✓</span> el bot confirmó que salió</span><span>${ic('reloj', 'xs')} programado o enviándose</span><span>${ic('alerta', 'xs')} no salió: hay que mandarlo a mano</span><span>${ic('ojo', 'xs')} vista previa: todavía no sale</span></p></div></div>`;
      }
      return `<div class="pagina">${A.cab(D.HOY.largo, 'Calendario', 'Reservas, eventos y las fechas del personal en un solo lugar. Cada reserva nueva o cambiada avisa al grupo de mesoneros.', sub !== 'nueva' ? A.boton('calendario', 'Nueva reserva', 'data-sub="nueva"', { icono: 'mas' }) : '')}
        ${sub === 'nueva' ? '' : A.lectura('calendario') + A.subnav([['mes', 'Mes'], ['reservas', 'Reservas', D.RESERVAS.filter(r => r.estado === 'por_confirmar' && dif(r.d) >= 0).length], ['eventos', 'Eventos'], ['personal', 'Personal'], ['avisos', 'Avisos al grupo', noSalieron().length]], sub)}${cuerpo}</div>`;
    },
    montar: (raiz, sub) => {
      if (sub !== 'nueva' || C.hecho || !puede('calendario', 'editar')) return;
      // la vista previa: sin palomitas, «Así le llegará al grupo»; con lo que falta escrito como «por elegir»
      const pintar = () => { const v = $('#rf-vista', raiz); if (!v) return; const r = desdeForm(); v.innerHTML = wa(msgReserva(r), { estado: 'previa' }) + (r.personas >= 10 ? `<p class="chequeo aviso">${ic('info', 's')}<span>Grupo de ${r.personas}: pide un abono de $ ${r.personas * 5} (propuesta: $ 5 por persona).</span></p>` : ''); };
      raiz.querySelectorAll('[data-rf]').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
        C.form[el.dataset.rf] = el.value; const caja = el.closest('.campo.error'); if (caja) { caja.classList.remove('error'); const m = caja.querySelector('.error-msg'); if (m) m.remove(); } pintar();
      }));
      pintar();
    },
  };
  ACC['libro-dia'] = n => { if (+n === 0) C.dia = HOY; else { const x = sumar(C.dia, +n); if (dif(x) >= -4 && dif(x) <= 55) C.dia = x; } A.pintarPagina(); };
  ACC['res-vista'] = v => { C.vista = v; A.pintarPagina(); };
  // desde un renglón del libro, el día y la hora ya vienen puestos (las personas, no: se escriben)
  ACC['res-hora'] = arg => { const [f, h] = arg.split('|'); C.form = { ...formVacio(), fecha: f, hora: h }; C.hecho = null; A.ir('calendario/nueva'); };
  ACC['cal-capa'] = k => { C.capas[k] = !C.capas[k]; A.pintarPagina(); };
  ACC['cal-mes'] = m => { C.mes = +m; A.pintarPagina(); };
  ACC['aviso-grupo'] = (i, el) => A.aviso(el.checked ? 'Aviso encendido.' : 'Aviso apagado. Queda en el registro de cambios.');
  // lo que no salió: copiar el mensaje tal cual (con los * de las negritas de WhatsApp) y, cuando se mandó a mano, anotarlo
  ACC['wa-copiar'] = id => { const r = D.RESERVAS.find(x => x.id === id); if (!r) return; const a = avisoDe(r); const el = document.querySelector(`[data-acc="wa-copiar"][data-arg="${CSS.escape(id)}"]`); A.copiar(msgReserva(r, a.tipo), { el: el && el.closest('.wa') ? el.closest('.wa').querySelector('.wa-burbuja') : null, ok: 'Copiado. Pégalo en el grupo «' + D.GRUPO_MESONEROS.nombre + '» y después toca «Ya lo mandé».' }); };
  ACC['wa-mandado'] = id => {
    const r = D.RESERVAS.find(x => x.id === id); if (!r || !r.aviso) return;
    r.aviso = { ...r.aviso, estado: 'a_mano', hora: D.HOY.hora, quien: S.usuario.nombre };
    A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'aviso al grupo', antes: 'no salió', despues: 'mandado a mano por ' + S.usuario.nombre });
    if (S.ficha) A.pintarFicha(); A.pintarPagina(); A.aviso('Anotado: lo mandaste a mano.');
  };

  /* ---------- nueva reserva ---------- */
  // arranca sin día, sin hora y sin personas: nada que parezca escogido sin que nadie lo escogiera
  // (desde un renglón del libro o desde un día del mes, el día y la hora ya vienen puestos)
  const formVacio = () => ({ nombre: '', tel: '', fecha: '', hora: '', personas: '', area: 'Salón', mesa: '', ocasion: '', notas: '', canal: 'WhatsApp del restaurante', otroDia: false });
  const diaDe = f => { const [d, m] = String(f || '').split('-').map(Number); return f && !isNaN(d) && !isNaN(m) ? [d, m] : null; };
  function desdeForm() { const F = C.form; const n = parseInt(F.personas, 10); return { d: diaDe(F.fecha), hora: F.hora, nombre: F.nombre.trim() || 'Nombre del cliente', tel: F.tel, personas: n > 0 ? n : 0, area: F.area, mesa: F.mesa.trim(), ocasion: F.ocasion, notas: F.notas.trim(), canal: F.canal, abono: 0, tomo: S.usuario.nombre }; }
  // horas de 12:00 a 22:00 cada 15 minutos (se escogen, no se escriben)
  const HORAS = []; for (let m = 12 * 60; m <= 22 * 60; m += 15) HORAS.push(hhmm(m));
  function formReserva() {
    if (!C.form) C.form = formVacio(); const F = C.form;
    const dia = diaDe(F.fecha); const cual = !dia ? '' : igual(dia, HOY) ? 'hoy' : dif(dia) === 1 ? 'man' : 'otro';
    const otro = cual === 'otro' || F.otroDia;
    const dias = Array.from({ length: 54 }, (_, i) => sumar(HOY, i + 2));
    // el día que viene escogido (un renglón del libro o un día del mes) siempre está en la lista, aunque pase de los 54 que se ofrecen
    if (dia && dif(dia) >= 2 && !dias.some(d => igual(d, dia))) { dias.push(dia); dias.sort((a, b) => dif(a) - dif(b)); }
    const horas = HORAS.includes(F.hora) || !F.hora ? HORAS : [...HORAS, F.hora].sort((a, b) => minDe(a) - minDe(b));
    const sel = (k, ops, vacio = '') => `<select id="rf-${k}" data-rf="${k}">${vacio ? `<option value=""${F[k] ? '' : ' selected'}>${esc(vacio)}</option>` : ''}${ops.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(F[k]) ? ' selected' : ''}>${esc(t)}</option>`; }).join('')}</select>`;
    const btnDia = (k, t, sub) => `<button type="button" data-acc="rf-dia" data-arg="${k}" aria-pressed="${k === 'otro' ? otro : cual === k}">${(k === 'otro' ? otro : cual === k) ? ic('check', 's') : ''}<span>${t}${sub ? `<small>${esc(sub)}</small>` : ''}</span></button>`;
    return `<div class="rejilla" data-form="reserva"><div class="c6 pila"><article class="hoja form"><h2>Nueva reserva</h2><div class="campos">
        <label class="campo ancho"><span>Nombre</span><input id="rf-nombre" data-rf="nombre" value="${esc(F.nombre)}" autocomplete="off" placeholder="Como lo dijo el cliente"></label>
        <div class="campo ancho" id="rf-dia-campo"><span id="rf-dia-t">Día</span><div class="dias" role="group" aria-labelledby="rf-dia-t">${btnDia('hoy', 'Hoy', fdl(HOY).toLowerCase())}${btnDia('man', 'Mañana', fdl(sumar(HOY, 1)).toLowerCase())}${btnDia('otro', 'Otro día', otro && dia ? fdl(dia).toLowerCase() : '')}</div>
          ${otro ? `<label class="campo" id="rf-fecha-campo"><span class="sr-only">Qué día</span>${sel('fecha', dias.map(d => [d[0] + '-' + d[1], fdl(d)]), 'Elige el día')}</label>` : ''}</div>
        <label class="campo"><span>Hora</span>${sel('hora', horas, 'Elige la hora')}</label>
        <label class="campo"><span>Personas</span><input id="rf-personas" data-rf="personas" value="${esc(F.personas)}" inputmode="numeric" autocomplete="off" placeholder="¿Cuántas?"></label>
        <label class="campo"><span>Teléfono</span><input id="rf-tel" data-rf="tel" value="${esc(F.tel)}" inputmode="tel" autocomplete="off"><small class="ayuda">No sale en el grupo.</small></label>
        <label class="campo"><span>Dónde</span>${sel('area', ['Salón', 'Terraza', 'Salón privado', 'Barra'])}</label>
        <label class="campo"><span>Mesa</span><input id="rf-mesa" data-rf="mesa" value="${esc(F.mesa)}" placeholder="S5, T2…" autocomplete="off"></label>
        <label class="campo"><span>Ocasión</span>${sel('ocasion', [['', 'Ninguna'], 'Cumpleaños', 'Aniversario', 'Negocios', 'Reencuentro', 'Otra'])}</label>
        <label class="campo"><span>Llegó por</span>${sel('canal', ['WhatsApp del restaurante', 'Instagram', 'Teléfono', 'En persona'])}</label>
        <label class="campo ancho"><span>Notas para el equipo</span><textarea id="rf-notas" data-rf="notas" placeholder="Silla de bebé, alergias, traen torta…">${esc(F.notas)}</textarea></label>
      </div></article></div>
      <div class="c6 pila"><div class="sec"><h2>El aviso al grupo</h2></div><div id="rf-vista"></div>
        <button class="btn pri full" data-acc="res-guardar">${ic('enviar', 's')}Guardar y avisar al grupo</button>
        <button class="btn ghost" data-acc="res-volver">${ic('atras', 's')}Volver</button></div></div>`;
  }
  // el día: Hoy y Mañana lo dejan puesto; Otro día abre la lista de los días que siguen
  ACC['rf-dia'] = k => {
    if (!C.form) C.form = formVacio();
    if (k === 'otro') { C.form.otroDia = true; const d = diaDe(C.form.fecha); if (d && dif(d) < 2) C.form.fecha = ''; }
    else { C.form.otroDia = false; const d = k === 'hoy' ? HOY : sumar(HOY, 1); C.form.fecha = d[0] + '-' + d[1]; }
    S.borrador = { ruta: S.ruta, sub: S.sub[S.ruta], form: 'reserva' }; // escoger el día ya cuenta como empezar a escribir
    A.pintarPagina();
    if (k === 'otro') { const s = $('#rf-fecha'); if (s) s.focus(); }
  };
  // el aviso del grupo sale «Enviando…» y, cuando el bot confirma, con las dos palomitas
  function hechoReserva(r) {
    const a = avisoDe(r);
    return `<div class="rejilla"><div class="c6 pila"><div class="hecho-caja">${ic('check')}<span>Guardado y avisado al grupo «${esc(D.GRUPO_MESONEROS.nombre)}». (Simulado)</span></div>${wa(msgReserva(r, a.tipo), { hora: a.hora, estado: a.estado })}
      <div class="fila-btns"><button class="btn sec" data-acc="res-volver">Ver las reservas</button><button class="btn sec" data-acc="res-otra">Tomar otra</button></div></div>
      <div class="c6 pila"><article class="hoja"><h2>${ic('celular')}Recordatorio para el cliente</h2><p class="muted">Cópialo y mándalo desde el WhatsApp del restaurante. Ese número no se conecta al bot.</p><p class="cita" id="rec-${r.id}">${esc(msgCliente(r))}</p><button class="btn sec" data-acc="res-copiar" data-arg="${r.id}">${ic('copiar', 's')}Copiar el texto</button></article></div></div>`;
  }
  // lo que falta se marca en su casilla, con lo que hay que hacer, y el teclado va a la primera
  ACC['res-guardar'] = () => {
    const F = C.form || formVacio(); const r = desdeForm();
    $$('#main [data-form="reserva"] .campo.error').forEach(x => { x.classList.remove('error'); const m = x.querySelector('.error-msg'); if (m) m.remove(); });
    const otro = !!$('#rf-fecha'); // con «Otro día» tocado, lo que falta es escoger el día en la lista
    const faltan = [[!F.nombre.trim(), 'rf-nombre', 'Escribe el nombre de quien reserva.'], [!r.d, otro ? 'rf-fecha-campo' : 'rf-dia-campo', otro ? 'Escoge el día en la lista.' : 'Toca Hoy, Mañana u Otro día.'], [!F.hora, 'rf-hora', 'Escoge la hora.'], [!r.personas, 'rf-personas', 'Escribe cuántas personas vienen.']].filter(x => x[0]);
    if (faltan.length) {
      faltan.forEach(([, id, msg]) => { const el = $('#' + id); const caja = el && (el.classList.contains('campo') ? el : el.closest('.campo')); if (caja) { caja.classList.add('error'); caja.insertAdjacentHTML('beforeend', `<small class="ayuda error-msg">${esc(msg)}</small>`); } });
      const primero = $('#' + faltan[0][1]); const foco = primero && (primero.matches('input, select, textarea') ? primero : primero.querySelector('button, select'));
      if (foco) foco.focus();
      A.aviso('Falta ' + faltan.map(x => ({ 'rf-nombre': 'el nombre', 'rf-dia-campo': 'el día', 'rf-fecha-campo': 'el día', 'rf-hora': 'la hora', 'rf-personas': 'cuántas personas' })[x[1]]).join(', ').replace(/, ([^,]*)$/, ' y $1') + '.', 'info');
      return;
    }
    const id = 'rs' + (D.RESERVAS.length + 1 + Math.floor(Math.random() * 1000)); Object.assign(r, { id, estado: 'confirmada', visitas: 0, abonoOk: false, abono: r.personas >= 10 ? r.personas * 5 : 0, tel: r.tel ? r.tel.replace(/(\d{4}).*(\d{4})$/, '$1-•••-$2') : '' });
    D.RESERVAS.push(r); A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'creada', despues: fdl(r.d) + ' ' + r.hora + ' · ' + r.personas + ' personas' });
    avisar(r, 'Reserva nueva');
    C.hecho = id; A.pintarPagina(); A.aviso('Guardado y avisado al grupo.');
  };
  // «Volver» desde una reserva a medio escribir pregunta antes de perderla
  ACC['res-volver'] = () => A.antesDeSalir(() => { C.hecho = null; C.form = null; A.ir('calendario/reservas'); });
  ACC['res-otra'] = () => { C.hecho = null; C.form = null; A.pintarPagina(); };
  ACC['res-copiar'] = id => { const r = D.RESERVAS.find(x => x.id === id); A.copiar(msgCliente(r), { el: document.getElementById('rec-' + id), ok: 'Copiado. Pégalo en el chat del cliente.' }); };
  /* Llegó, No vino, Confirmar y Anular reserva:
     Llegó se marca todo el día; No vino, desde media hora después de la hora. Los dos van de un toque y se pueden deshacer
     durante 10 segundos; después, «Corregir» queda a la vista (abre la edición con el estado y pide el motivo).
     Confirmar pasa de lápiz a tinta sin pedir motivo. Anular reserva pide el motivo, y su ventana sale con «No, dejarla». */
  const DESHACER_MS = 10000;
  const MARCA = { id: null, antes: null, est: null, hasta: 0, t: null, iv: null };
  const deshacible = r => MARCA.id === r.id && r.estado === MARCA.est && Date.now() < MARCA.hasta;
  const quedan = () => Math.max(0, Math.ceil((MARCA.hasta - Date.now()) / 1000));
  const fichaDe = id => S.ficha && S.ficha.tipo === 'reserva' && S.ficha.id === id && !S.ficha.editando;
  function marcar(r, est) {
    const antes = r.estado; r.estado = est;
    A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'estado', antes: A.estadoTxt(antes), despues: A.estadoTxt(est) });
    clearTimeout(MARCA.t); clearInterval(MARCA.iv);
    Object.assign(MARCA, { id: r.id, antes, est, hasta: Date.now() + DESHACER_MS });
    // la cuenta atrás del botón (sin volver a dibujar la ficha) y, a los 10 segundos, «Deshacer» deja su sitio a «Corregir»
    MARCA.iv = setInterval(() => { const n = document.querySelector('[data-acc="res-deshacer"] .quedan'); if (n) n.textContent = quedan(); }, 250);
    // si el teclado estaba en «Deshacer» cuando se vence, pasa a «Corregir»
    MARCA.t = setTimeout(() => { clearInterval(MARCA.iv); const id = MARCA.id; MARCA.id = null; if (!fichaDe(id)) return; const a = document.activeElement; const enDeshacer = a && a.matches && a.matches('[data-acc="res-deshacer"]'); A.pintarFicha(); if (enDeshacer) { const c = document.querySelector('#ficha-raiz [data-ficha="editar"]'); if (c) c.focus({ preventScroll: true }); } }, DESHACER_MS);
    A.pintarFicha(); A.pintarPagina();
    // el teclado va a «Deshacer», que se vence a los 10 segundos (no al título, lejos del botón)
    const d = document.querySelector('#ficha-raiz [data-acc="res-deshacer"]'); if (d) d.focus({ preventScroll: true });
    A.aviso((est === 'llego' ? 'Anotado: llegó.' : 'Anotado: no vino.') + ' Puedes deshacerlo durante 10 segundos.');
  }
  ACC['res-estado'] = arg => {
    const [id, est] = arg.split('|'); const r = D.RESERVAS.find(x => x.id === id); const antes = r.estado;
    if (est === 'llego' || est === 'no_vino') {
      if (est === 'no_vino' && !puedeNoVino(r)) { A.aviso('«No vino» se puede marcar desde las ' + (noVinoDesde(r) !== null ? hhmm(noVinoDesde(r)) : 'media hora después de la hora') + ', media hora después de la hora de la reserva.', 'info'); return; }
      marcar(r, est); return;
    }
    const hacer = (m = '') => {
      r.estado = est; A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'estado', antes: A.estadoTxt(antes), despues: A.estadoTxt(est), motivo: m });
      avisar(r, est === 'cancelada' ? 'Reserva anulada' : 'Reserva confirmada');
      A.pintarFicha(); A.pintarPagina(); A.aviso(est === 'cancelada' ? 'Reserva anulada. Avisamos al grupo que la mesa queda libre.' : 'Confirmada: pasa a tinta en el libro. Avisamos al grupo.');
    };
    if (est === 'cancelada') A.pedirMotivo({ titulo: 'Anular la reserva de ' + r.nombre, texto: 'El grupo recibe el aviso de que la mesa queda libre. En el libro queda tachada, con el motivo.', boton: 'Anular reserva', tono: 'peligro', cancelar: 'No, dejarla' }).then(hacer).catch(() => {});
    else hacer();
  };
  ACC['res-deshacer'] = id => {
    const r = D.RESERVAS.find(x => x.id === id);
    if (!r || !deshacible(r)) { A.aviso('Ya pasaron los 10 segundos: para cambiarlo, toca «Corregir».', 'info'); if (S.ficha) A.pintarFicha(); return; }
    const est = r.estado; r.estado = MARCA.antes; clearTimeout(MARCA.t); clearInterval(MARCA.iv); MARCA.id = null;
    A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'estado', antes: A.estadoTxt(est), despues: A.estadoTxt(r.estado), motivo: 'Deshecho a los pocos segundos de marcarlo' });
    A.pintarFicha(); A.pintarPagina(); A.aviso('Deshecho: vuelve a «' + A.estadoTxt(r.estado) + '».');
  };
  ACC['res-avisar'] = () => A.aviso('Avisado al grupo «' + D.GRUPO_MESONEROS.nombre + '». (Simulado)');
  ACC['ev-tarea'] = arg => { if (!puede('calendario', 'editar')) { A.aviso('Solo lectura: pídeselo a ' + A.quienEdita('calendario') + '.', 'info'); return; } const [id, k] = arg.split('|'); const e = D.EVENTOS_AG.find(x => x.id === id); e.tareas[+k][1] = !e.tareas[+k][1]; A.pintarFicha(); A.pintarPagina(); };

  FICHAS.reserva = id => {
    const r = D.RESERVAS.find(x => x.id === id); const ed = puede('calendario', 'editar'); const futura = dif(r.d) >= 0;
    const pendiente = ['confirmada', 'por_confirmar'].includes(r.estado); const marcada = ['llego', 'no_vino'].includes(r.estado);
    const acc = [];
    // anular va aparte, a la izquierda, lejos de Llegó o Confirmar
    if (pendiente && futura) acc.push({ txt: 'Anular reserva', acc: 'res-estado', arg: r.id + '|cancelada', tono: 'ghost', icono: 'anular', izq: true, solo: 'editar' });
    // a lápiz: Confirmar, de un toque y sin motivo (es la principal si la reserva no es de hoy)
    if (r.estado === 'por_confirmar' && futura) acc.push({ txt: 'Confirmar', acc: 'res-estado', arg: r.id + '|confirmada', icono: 'check', tono: dif(r.d) > 0 ? 'pri' : 'sec', solo: 'editar' });
    // el día de la reserva (o después, si quedó sin marcar): Llegó todo el día; No vino, desde media hora después de la hora
    if (pendiente && dif(r.d) <= 0) { if (puedeNoVino(r)) acc.push({ txt: 'No vino', acc: 'res-estado', arg: r.id + '|no_vino', solo: 'editar' }); acc.push({ txt: 'Llegó', acc: 'res-estado', arg: r.id + '|llego', tono: 'pri', icono: 'check', solo: 'editar' }); }
    // recién marcada: «Deshacer» durante 10 segundos (la cuenta atrás no se lee en voz alta: el botón se llama «Deshacer»)
    if (marcada && deshacible(r)) acc.push({ txt: 'Deshacer', html: `Deshacer<span aria-hidden="true">· <span class="quedan">${quedan()}</span> s</span>`, acc: 'res-deshacer', arg: r.id, tono: 'pri', icono: 'refrescar', solo: 'editar' });
    const desde = ed && pendiente && dif(r.d) === 0 && !puedeNoVino(r) && noVinoDesde(r) !== null ? hhmm(noVinoDesde(r)) : '';
    const a = avisoDe(r);
    const tituloAviso = { enviando: 'Enviando al grupo', no_salio: 'No le llegó al grupo', a_mano: 'Se mandó a mano al grupo' }[a.estado] || 'Lo que le llegó al grupo';
    return { titulo: r.nombre, sub: (igual(r.d, HOY) ? 'Hoy' : esc(fdl(r.d))) + ' · ' + esc(r.hora) + ' · ' + r.personas + ' personas', mod: 'calendario', obj: r, registro: 'Reserva ' + r.nombre,
      tags: [[A.estadoTag(r.estado).replace(/<[^>]+>/g, ''), r.estado === 'por_confirmar' ? 'aviso' : r.estado === 'confirmada' ? 'ok' : ''], ...(r.abono && !r.abonoOk ? [['Falta el abono', 'aviso']] : []), ...(a.estado === 'no_salio' ? [['El aviso no salió', 'alerta']] : [])],
      aviso: a.estado === 'no_salio' && ed ? `<p class="nota alerta">${ic('alerta', 's')}<span><b>El último aviso no le llegó al grupo.</b> Más abajo está listo para copiarlo y mandarlo a mano.</span></p>` : '',
      bloques: [{ titulo: 'Reserva', filas: [{ l: 'Día', v: esc(fdl(r.d)) }, { l: 'Hora', v: esc(r.hora), campo: { k: 'hora', tipo: 'texto' } }, { l: 'Personas', v: r.personas, campo: { k: 'personas', tipo: 'numero', entero: true, obligatorio: true } }, { l: 'Dónde', v: esc(r.area), campo: { k: 'area', tipo: 'select', opciones: ['Salón', 'Terraza', 'Salón privado', 'Barra'] } }, { l: 'Mesa', v: esc(r.mesa || '—'), campo: { k: 'mesa', tipo: 'texto' } }, { l: 'Ocasión', v: esc(r.ocasion || '—'), campo: { k: 'ocasion', tipo: 'texto' } }, { l: 'Notas para el equipo', v: esc(r.notas || '—'), largo: true, campo: { k: 'notas', tipo: 'area' } }, { l: 'Estado', v: A.estadoTag(r.estado), campo: { k: 'estado', tipo: 'select', opciones: estadosEditar(r, marcada) } }] },
        { titulo: 'Cliente', filas: [{ l: 'Teléfono', v: ed ? esc(r.tel || '—') : '<span class="tenue">Solo quien toma reservas</span>' }, { l: 'Llegó por', v: esc(r.canal) }, { l: 'Ha venido antes', v: r.visitas ? r.visitas + (r.visitas === 1 ? ' vez' : ' veces') : 'Primera vez' }, { l: 'La tomó', v: esc(r.tomo) }] },
        r.abono ? { titulo: 'Abono', html: `<p>${r.abonoOk ? tag('Recibido', 'ok') + ' ' + dinero(r.abono, 'usd', 0) + ' · confirmado por el bot de Caja.' : tag('Falta', 'aviso') + ' ' + dinero(r.abono, 'usd', 0) + ' · grupos de 10 o más dejan abono (propuesta: $ 5 por persona).'}</p>` } : { oculto: true },
        { titulo: tituloAviso, html: wa(msgReserva(r, a.tipo), { hora: a.hora, estado: a.estado, copiar: r.id, por: a.por }) },
        ...(futura && ed && pendiente ? [{ titulo: 'Recordatorio para el cliente', html: `<p class="cita" id="rec-${r.id}">${esc(msgCliente(r))}</p><div class="fila-btns"><button class="btn sec chico" data-acc="res-copiar" data-arg="${r.id}">${ic('copiar', 's')}Copiar el recordatorio</button></div><p class="muted">Se manda desde el WhatsApp del restaurante. El bot no le escribe a clientes.</p>` }] : [])],
      acciones: acc, pieNota: desde ? `${ic('reloj', 'xs')}«No vino» se puede marcar desde las ${desde}.` : '',
      // marcada (llegó o no vino): «Corregir» abre la edición en el estado y pide el motivo; esa corrección no avisa al grupo
      editar: marcada ? 'Corregir' : 'Editar', editarTono: marcada ? 'sec' : undefined, focoEditar: marcada ? 'estado' : '',
      guardar: marcada ? 'Guardar la corrección' : 'Guardar y avisar al grupo',
      guardado: marcada ? 'Corregido. Quedó en el registro de cambios.' : 'Guardado y avisado al grupo «' + D.GRUPO_MESONEROS.nombre + '». (Simulado)',
      // el aviso dice lo que pasó: «Reserva confirmada», «Reserva por confirmar» o, si cambió la hora, las personas, el lugar o las notas,
      // «Cambio en la reserva» (anular, Llegó y No vino van por sus botones, con «No, dejarla» y «Deshacer»)
      alGuardar: cambios => { if (marcada) return; const ce = cambios.find(c => c.r.campo.k === 'estado'); avisar(r, ce ? ({ confirmada: 'Reserva confirmada', por_confirmar: 'Reserva por confirmar', cancelada: 'Reserva anulada' }[ce.nuevo] || 'Cambio en la reserva') : 'Cambio en la reserva'); } };
  };
  // el estado que se puede escoger al editar: en una reserva por venir, solo Confirmada o Por confirmar (anular, Llegó y No vino tienen
  // sus botones); una anulada se puede volver a activar; al «Corregir» una ya marcada, todos los que valen para ese día
  const estadosEditar = (r, marcada) => {
    const todos = [['confirmada', 'Confirmada'], ['por_confirmar', 'Por confirmar'], ['llego', 'Llegó'], ['no_vino', 'No vino'], ['cancelada', 'Anulada']];
    if (!marcada) return todos.filter(([k]) => k === 'confirmada' || k === 'por_confirmar' || k === r.estado);
    return todos.filter(([k]) => k === r.estado || (k === 'no_vino' ? puedeNoVino(r) : k === 'llego' ? dif(r.d) <= 0 : true));
  };
  FICHAS.evento = id => {
    const e = D.EVENTOS_AG.find(x => x.id === id); const total = e.personas * e.porPersona; const plata = e.tipo === 'privado' && verPlata(); const ed = puede('calendario', 'editar');
    return { titulo: e.nombre, sub: esc(fdl(e.d)) + ' · ' + esc(e.hora), mod: 'calendario', obj: e, registro: 'Evento ' + e.nombre,
      tags: [[A.estadoTag(e.estado).replace(/<[^>]+>/g, ''), e.estado === 'presupuesto' ? 'aviso' : 'ok'], [e.tipo === 'propio' ? 'Del restaurante' : 'Privado', 'info']],
      bloques: [{ titulo: 'Evento', filas: [{ l: 'Cuándo', v: esc(fdl(e.d)) + ' · ' + esc(e.hora) }, ...(e.personas ? [{ l: 'Personas', v: e.personas, campo: { k: 'personas', tipo: 'numero', entero: true, obligatorio: true } }] : []), { l: e.tipo === 'propio' ? 'Qué es' : 'Cliente', v: esc(e.cliente) }, { l: e.tipo === 'propio' ? 'Detalle' : 'Menú', v: esc(e.menu), largo: true, campo: { k: 'menu', tipo: 'area' } }, { l: 'Estado', v: A.estadoTag(e.estado), campo: { k: 'estado', tipo: 'select', opciones: [['confirmado', 'Confirmado'], ['presupuesto', 'Presupuesto enviado'], ['cancelada', 'Anulado']] } }] },
        plata ? { titulo: 'Plata', html: `<dl class="kv"><div><dt>Por persona</dt><dd>${dinero(e.porPersona)}</dd></div><div><dt>Total</dt><dd>${dinero(total, 'usd', 0)}</dd></div><div><dt>Abono</dt><dd>${e.abono ? dinero(e.abono, 'usd', 0) : 'Sin abono'}</dd></div><div class="total"><dt><b>Se cobra el día del evento</b></dt><dd>${dinero(total - e.abono, 'usd', 0)}</dd></div></dl>${e.abonoVia ? `<p class="muted">${esc(e.abonoVia)}.</p>` : ''}` } : { oculto: true },
        // quien solo mira ve la lista de tareas como dato: sin botones que no responden
        { titulo: 'Tareas', html: `<ul class="tareas">${e.tareas.map(([t, h], k) => `<li class="${h ? 'hecha' : ''}">${ed ? `<button data-acc="ev-tarea" data-arg="${e.id}|${k}" aria-pressed="${h}">${ic(h ? 'check' : 'reloj', 's')}<span>${esc(t)}</span></button>` : `<span class="tarea">${ic(h ? 'check' : 'reloj', 's')}<span>${esc(t)}<span class="sr-only">${h ? ', hecha' : ', pendiente'}</span></span></span>`}</li>`).join('')}</ul>` },
        { titulo: 'Avisos', tiempo: [[esc(fdl(sumar(e.d, -7))), 'Aviso al grupo de mesoneros y a Compras (7 días antes).'], [esc(fdl(e.d)), 'Aviso del día a las 11:00.']] }],
      acciones: e.tipo === 'privado' && !e.abono ? [{ txt: 'Registrar el abono', acc: 'pronto', icono: 'mas', solo: 'editar' }, { txt: 'Avisar al grupo', acc: 'res-avisar', icono: 'enviar', solo: 'editar' }] : [{ txt: 'Avisar al grupo', acc: 'res-avisar', icono: 'enviar', solo: 'editar' }] };
  };
  FICHAS.agendadia = id => {
    const [d, m] = id.split('-').map(Number); const its = itemsDia([d, m], true);
    return { titulo: fLarga([d, m])[0].toUpperCase() + fLarga([d, m]).slice(1), sub: 'Calendario', mod: 'calendario', obj: {},
      bloques: [{ html: its.length ? `<ul class="lista">${its.map(x => `<li>${x.abrir || x.ir ? `<button class="fila" ${x.abrir ? `data-abrir="${x.abrir}"` : `data-ir="${x.ir}"`}>` : '<div class="fila">'}<span class="lead ${['info', 'evento', 'lila', 'ok', 'alerta'].includes(x.tono.split(' ')[0]) ? x.tono.split(' ')[0] : ''}">${ic(x.icono)}</span><span class="medio"><b>${esc(x.largo)}</b></span><span class="fin">${x.abrir || x.ir ? ic('derecha', 's chev') : ''}</span>${x.abrir || x.ir ? '</button>' : '</div>'}</li>`).join('')}</ul>` : '<p class="muted">Nada este día.</p>' },
        // un día que ya pasó no recibe reservas nuevas
        ...(puede('calendario', 'editar') && dif([d, m]) >= 0 ? [{ html: `<button class="btn sec" data-acc="res-dia" data-arg="${d}-${m}">${ic('mas', 's')}Nueva reserva este día</button>` }] : [])] };
  };
  ACC['res-dia'] = arg => { C.form = { ...formVacio(), fecha: arg }; C.hecho = null; A.cerrarFicha(); A.ir('calendario/nueva'); };
  void leerNum; void fmt;
})();
