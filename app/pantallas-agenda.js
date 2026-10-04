/* Calendario: el mes con capas (reservas, eventos, personal, fiscal y pagos), reservas que avisan al grupo de
   mesoneros, eventos privados y propios, y el calendario del personal. Datos en datos-gente.js. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, $, esc, fmt, dinero, leerNum, ic, tag, puede } = A;
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

  /* ---------- mensajes al grupo y al cliente ---------- */
  const msgReserva = (r, tipo = 'Reserva nueva') => `🍽️ *${tipo}*\n*${fdl(r.d)} · ${r.hora}*\n${r.nombre} · ${r.personas} ${r.personas === 1 ? 'persona' : 'personas'}\n${r.area}${r.mesa ? ' · ' + r.mesa : ''}${r.ocasion ? '\n' + r.ocasion : ''}${r.notas ? '\nOjo: ' + r.notas : ''}${r.abono ? `\nAbono: $ ${r.abono} ${r.abonoOk ? '(recibido)' : '(falta)'}` : ''}\nTomó: ${r.tomo}`;
  const msgDia = (dia, titulo) => { const xs = vigentes().filter(r => igual(r.d, dia) && r.estado !== 'no_vino').sort((a, b) => a.hora.localeCompare(b.hora)); return xs.length ? `📅 *${titulo} · ${fdl(dia).toLowerCase()}*\n${xs.map(r => `• ${r.hora} · ${r.nombre} · ${r.personas} · ${r.area}${r.mesa ? ' ' + r.mesa : ''}${r.ocasion ? ' · ' + r.ocasion.toLowerCase() : ''}`).join('\n')}\n*Total: ${personasDe(xs)} personas*` : `📅 *${titulo} · ${fdl(dia).toLowerCase()}*\nNo hay reservas.`; };
  const msgCliente = r => `Hola, ${r.nombre.split(' (')[0]}. Le confirmamos su reserva para el ${fLarga(r.d)} a las ${r.hora}, ${r.personas} ${r.personas === 1 ? 'persona' : 'personas'}, en ${r.area.toLowerCase()}.${r.abono && !r.abonoOk ? ` Para dejarla firme falta el abono de $ ${r.abono}.` : ''} Si algo cambia, escríbanos por aquí. ¡Los esperamos!`;
  const burbuja = (txt, hora = D.HOY.hora) => `<div class="wa-burbuja">${esc(txt).replace(/\*([^*\n]+)\*/g, '<b>$1</b>')}<time>${esc(hora)} ✓✓</time></div>`;
  const wa = (txt, { grupo = D.GRUPO_MESONEROS.nombre, hora } = {}) => `<div class="wa" aria-label="Vista previa del mensaje de WhatsApp"><div class="wa-cab">${ic('mensaje', 's')}<span>${esc(grupo)}</span></div>${burbuja(txt, hora)}</div>`;
  A.msgDia = msgDia; A.wa = wa;

  /* ---------- lo que hay cada día, por capa ---------- */
  const C = { mes: 9, capas: { reservas: true, eventos: true, personal: true, fiscal: true, pagos: true }, hecho: null, form: null, vista: 'libro', dia: [5, 9] };
  const cap = t => t[0].toUpperCase() + t.slice(1);
  // una página del libro de reservas: las horas en el margen rojo, cada reserva en su renglón
  function paginaLibro(dia) {
    const ed = puede('calendario', 'editar');
    const xs = D.RESERVAS.filter(r => igual(r.d, dia)).sort((a, b) => a.hora.localeCompare(b.hora));
    const horas = []; for (let h = 12; h <= 22; h++) { horas.push(h + ':00'); if (h < 22) horas.push(h + ':30'); }
    const slots = horas.filter(h => h.endsWith(':00') || xs.some(r => r.hora === h));
    const vivas = xs.filter(r => !['cancelada', 'no_vino'].includes(r.estado));
    const ESTADO = { confirmada: 'confirmada', por_confirmar: 'por confirmar, anotada a lápiz', llego: 'llegó', no_vino: 'no vino', cancelada: 'cancelada' };
    const renglon = r => {
      const extra = [r.estado === 'no_vino' ? '<b class="lr-rojo">No vino</b>' : '', r.estado === 'cancelada' ? '<b>Cancelada</b>' : '', r.estado === 'por_confirmar' ? 'por confirmar' : '', r.ocasion ? esc(r.ocasion.toLowerCase()) : '', r.notas ? esc(r.notas) : '', r.abono && !r.abonoOk ? `<b class="lr-abono">falta el abono de $ ${r.abono}</b>` : ''].filter(Boolean).join(' · ');
      return `<button class="libro-res" data-abrir="reserva:${r.id}"><span class="lr-nombre">${esc(r.nombre)}</span><span class="lr-pers" title="Personas">${r.personas}</span><span class="lr-mesa">${esc(r.mesa || r.area)}</span>${extra ? `<small>${extra}</small>` : ''}<span class="sr-only">, ${r.personas} personas, ${ESTADO[r.estado]}</span></button>`;
    };
    return `<section class="libro-pag${igual(dia, HOY) ? ' es-hoy' : ''}" aria-label="Reservas del ${fLarga(dia)}">
      <header class="libro-cab"><h3>${cap(fLarga(dia))}</h3><span>${igual(dia, HOY) ? 'Hoy · ' : dif(dia) === 1 ? 'Mañana · ' : ''}${vivas.length} ${vivas.length === 1 ? 'reserva' : 'reservas'}</span></header>
      <ol class="libro-lineas">${slots.map(h => { const rs = xs.filter(r => r.hora === h);
        if (!rs.length) return `<li class="vacia"><time>${h}</time>${ed && dif(dia) >= 0 ? `<button class="libro-escribir" data-acc="res-hora" data-arg="${dia[0]}-${dia[1]}|${h}"><span>Anotar a las ${h}</span></button>` : '<span></span>'}</li>`;
        return rs.map((r, i) => `<li class="${r.estado}"><time>${i === 0 ? h : ''}${r.estado === 'llego' ? ic('check', 'xs') : ''}</time>${renglon(r)}</li>`).join(''); }).join('')}</ol>
      <footer class="libro-pie"><span>Total del día</span><b>${personasDe(vivas)} ${personasDe(vivas) === 1 ? 'persona' : 'personas'}</b></footer>
    </section>`;
  }
  const libro = () => `<div class="libro-nav"><div class="seg" role="group" aria-label="Día"><button data-acc="libro-dia" data-arg="-1">‹ Día anterior</button><button data-acc="libro-dia" data-arg="0" aria-pressed="${igual(C.dia, HOY)}">Hoy</button><button data-acc="libro-dia" data-arg="1">Día siguiente ›</button></div>
      <div class="seg" role="group" aria-label="Ver como"><button data-acc="res-vista" data-arg="libro" aria-pressed="true">Libro</button><button data-acc="res-vista" data-arg="lista" aria-pressed="false">Lista</button></div></div>
    <div class="libro">${paginaLibro(C.dia)}${paginaLibro(sumar(C.dia, 1))}</div>
    <p class="leyenda libro-ley"><span><span class="lm tinta">Con tinta</span> confirmada</span><span><span class="lm lapiz">A lápiz</span> por confirmar</span><span>${ic('check', 'xs')} llegó</span><span><span class="lm tachada">Tachada en rojo</span> no vino</span>${puede('calendario', 'editar') ? '<span>Toca un renglón vacío para anotar a esa hora</span>' : ''}</p>`;
  const capasDisp = () => [['reservas', 'Reservas', true], ['eventos', 'Eventos', true], ['personal', 'Personal', true], ['fiscal', 'Fiscal', puede('fiscal')], ['pagos', 'Pagos y nómina', puede('pagos') || puede('nomina')]].filter(c => c[2]);
  function itemsDia(dia, todas = false) {
    const on = k => todas || C.capas[k]; const out = [];
    if (on('reservas')) vigentes().filter(r => igual(r.d, dia)).sort((a, b) => a.hora.localeCompare(b.hora)).forEach(r => out.push({ capa: 'reservas', tono: r.estado === 'no_vino' ? 'tachado' : r.estado === 'por_confirmar' ? 'info punteado' : 'info', txt: `${r.hora} ${corto(r.nombre)} · ${r.personas}`, largo: `${r.hora} · ${r.nombre} · ${r.personas} personas · ${r.area}`, abrir: 'reserva:' + r.id, icono: 'cubiertos' }));
    if (on('eventos')) D.EVENTOS_AG.filter(e => igual(e.d, dia)).forEach(e => out.push({ capa: 'eventos', tono: e.tipo === 'propio' && !e.personas ? 'gris' : 'evento', txt: e.nombre, largo: `${e.nombre} · ${e.hora}${e.personas ? ' · ' + e.personas + ' personas' : ''}`, abrir: 'evento:' + e.id, icono: 'estrella' }));
    if (on('personal')) {
      A.rh.activos().forEach(e => {
        if (e.nac && e.nac[0] === dia[0] && e.nac[1] === dia[1]) out.push({ capa: 'personal', tono: 'lila', txt: 'Cumple ' + ini(e.nombre), largo: `Cumpleaños de ${e.nombre} (${A.rh.cumpleAnios(e)})`, abrir: sens() ? 'empleado:' + e.id : '', icono: 'pastel' });
        if (sens() && e.contratoVence && igual(e.contratoVence, dia)) out.push({ capa: 'personal', tono: 'alerta', txt: 'Vence contrato: ' + ini(e.nombre), largo: `Vence el contrato de ${e.nombre}`, abrir: 'empleado:' + e.id, icono: 'archivo' });
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
      if (puede('nomina') && ((dia[0] === 15) || (dia[1] === 9 && dia[0] === 31) || (dia[1] === 10 && dia[0] === 30))) out.push({ capa: 'pagos', tono: 'gris', txt: 'Nómina', largo: dia[0] === 15 ? 'Nómina: 1.ª quincena' : 'Nómina: 2.ª quincena + 10 %', ir: 'nomina', icono: 'nomina' });
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
    titulo: 'Calendario', corto: 'Calendario', tab: 'Calendario', grupo: 'Hoy', icono: 'calendario', mod: 'calendario',
    cuenta: () => puede('calendario', 'editar') ? D.RESERVAS.filter(r => r.estado === 'por_confirmar' && dif(r.d) >= 0).length : 0,
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
        const lista = D.RESERVAS.filter(r => filtro === 'todas' || (filtro === 'proximas' && dif(r.d) >= 0 && r.estado !== 'cancelada') || (filtro === 'hoy' && igual(r.d, HOY)) || (filtro === 'pasadas' && dif(r.d) < 0)).sort((a, b) => (filtro === 'pasadas' ? -1 : 1) * (dif(a.d) - dif(b.d) || a.hora.localeCompare(b.hora)));
        const hoy = vigentes().filter(r => igual(r.d, HOY)), man = vigentes().filter(r => igual(r.d, sumar(HOY, 1))), sem = vigentes().filter(r => dif(r.d) >= 0 && dif(r.d) <= 6);
        const pasadas = D.RESERVAS.filter(r => ['llego', 'no_vino'].includes(r.estado));
        cuerpo = `<div class="cifras">${A.cifra({ etq: 'Hoy', valor: hoy.length + (hoy.length === 1 ? ' reserva' : ' reservas'), sub: personasDe(hoy) + ' personas · la primera a las ' + (hoy.sort((a, b) => a.hora.localeCompare(b.hora))[0] || { hora: '—' }).hora, acc: 'libro-dia', arg: '0' })}${A.cifra({ etq: 'Mañana', valor: man.length + (man.length === 1 ? ' reserva' : ' reservas'), sub: personasDe(man) + ' personas' + (man.some(r => r.abono && !r.abonoOk) ? ' · falta un abono' : ''), tono: man.some(r => r.abono && !r.abonoOk) ? 'aviso' : '', abrir: man[0] ? 'reserva:' + man[0].id : '' })}${A.cifra({ etq: 'Esta semana', valor: sem.length, sub: personasDe(sem) + ' personas' })}${A.cifra({ etq: 'No vinieron (octubre)', valor: pasadas.filter(r => r.estado === 'no_vino').length + ' de ' + pasadas.length, sub: 'se anota en cada reserva' })}</div>
          ${C.vista === 'libro' ? libro() : `<div class="libro-nav"><span></span><div class="seg" role="group" aria-label="Ver como"><button data-acc="res-vista" data-arg="libro" aria-pressed="false">Libro</button><button data-acc="res-vista" data-arg="lista" aria-pressed="true">Lista</button></div></div>
          ${A.filtros('t-res', [['proximas', 'Próximas', vigentes().filter(r => dif(r.d) >= 0).length], ['hoy', 'Hoy', hoy.length], ['pasadas', 'Pasadas', D.RESERVAS.filter(r => dif(r.d) < 0).length], ['todas', 'Todas', D.RESERVAS.length]], filtro, 'Buscar nombre, mesa u ocasión')}
          ${A.tabla({ id: 't-res', cols: [{ t: 'Reserva', cls: 'p' }, { t: 'Personas', cls: 'r' }, { t: 'Dónde', cls: 'x' }, { t: 'Ocasión', cls: 'x' }, { t: 'Estado', cls: 'e' }], filas: lista.map(r => ({ abrir: 'reserva:' + r.id, clase: r.estado === 'cancelada' ? 'anulada' : '', celdas: [`<b>${esc(r.nombre)}</b><small>${igual(r.d, HOY) ? 'Hoy' : esc(fdl(r.d))} · ${esc(r.hora)}${r.notas ? ' · ' + esc(r.notas) : ''}</small>`, r.personas, esc(r.area) + (r.mesa ? ' · ' + esc(r.mesa) : ''), esc(r.ocasion || '—'), r.abono && !r.abonoOk ? tag('Falta el abono', 'aviso') : A.estadoTag(r.estado)] })) })}`}
          <p class="muted">Cada reserva nueva, cambiada o cancelada avisa al grupo «${esc(D.GRUPO_MESONEROS.nombre)}». A las 11:00 sale la lista del día y a las 18:00 la de mañana.</p>`;
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
          ${sens() ? `<article class="hoja"><h2>${ic('archivo')}Contratos y períodos de prueba</h2><ul class="lista">${A.rh.activos().filter(e => e.contratoVence || e.prueba).map(e => `<li><button class="fila" data-abrir="empleado:${e.id}"><span class="lead alerta">${ic('archivo')}</span><span class="medio"><b>${esc(e.nombre)}</b><small>${e.prueba ? 'Termina la prueba el ' + esc(fdl(e.prueba)) : 'Vence el contrato el ' + esc(fdl(e.contratoVence))}${/2\.ª/.test(e.contrato) ? ' · 2.ª prórroga' : ''}</small></span><span class="fin">${tag('En ' + dif(e.prueba || e.contratoVence) + ' días', 'aviso')}</span></button></li>`).join('')}</ul></article>` : ''}</div></div>`;
      }
      if (sub === 'avisos') {
        const G = D.GRUPO_MESONEROS; const ed = puede('calendario', 'editar');
        const reglas = [['Reserva nueva, cambiada o cancelada', 'Al momento', true], ['Las reservas del día', 'Todos los días a las 11:00', true], ['Las reservas de mañana', 'Todos los días a las 18:00', true], ['Eventos', '7 días antes y el mismo día', true], ['Cumpleaños del personal', 'El día, al grupo del personal (por decidir)', false]];
        cuerpo = `<div class="rejilla"><div class="c6 pila"><article class="hoja"><div class="hoja-cab"><h2>${ic('mensaje')}Grupo «${esc(G.nombre)}»</h2>${tag('Por crear', 'aviso')}</div><p class="muted">${esc(G.miembros)}. Hay que crear el grupo en WhatsApp y meter al número del bot (el de automatización, que ya está en los otros grupos).</p>
            <ul class="lista">${reglas.map(([t, h, on], i) => `<li><div class="fila"><span class="medio"><b>${t}</b><small>${h}</small></span><label class="interruptor"><input type="checkbox" ${on ? 'checked' : ''} ${ed ? `data-acc="aviso-grupo" data-arg="${i}"` : 'disabled'} aria-label="${esc(t)}"></label></div></li>`).join('')}</ul></article>
          <p class="nota gris">${ic('candado', 's')}<span>Al grupo no van teléfonos de clientes ni montos: solo nombre, hora, personas, mesa y lo que hay que preparar. Al cliente no le escribe el bot: el recordatorio se copia y se manda desde el WhatsApp del restaurante, que no se conecta al bot.</span></p></div>
          <div class="c6 pila"><div class="sec"><h2>Hoy a las 11:00</h2>${tag('Enviado (simulado)', 'ok')}</div>${wa(msgDia(HOY, 'Reservas de hoy'), { hora: '11:00' })}
            <div class="sec"><h2>Hoy a las 18:00</h2>${tag('Programado', 'info')}</div>${wa(msgDia(sumar(HOY, 1), 'Reservas de mañana'), { hora: '18:00' })}</div></div>`;
      }
      return `<div class="pagina">${A.cab(D.HOY.largo, 'Calendario', 'Reservas, eventos y las fechas del personal en un solo lugar. Cada reserva nueva o cambiada avisa al grupo de mesoneros.', sub !== 'nueva' ? A.boton('calendario', 'Nueva reserva', 'data-sub="nueva"', { icono: 'mas' }) : '')}
        ${sub === 'nueva' ? '' : A.lectura('calendario') + A.subnav([['mes', 'Mes'], ['reservas', 'Reservas', D.RESERVAS.filter(r => r.estado === 'por_confirmar' && dif(r.d) >= 0).length], ['eventos', 'Eventos'], ['personal', 'Personal'], ['avisos', 'Avisos al grupo']], sub)}${cuerpo}</div>`;
    },
    montar: (raiz, sub) => {
      if (sub !== 'nueva' || C.hecho || !puede('calendario', 'editar')) return;
      const pintar = () => { const v = $('#rf-vista', raiz); if (!v) return; const r = desdeForm(); v.innerHTML = wa(msgReserva(r)) + (r.personas >= 10 ? `<p class="chequeo aviso">${ic('info', 's')}<span>Grupo de ${r.personas}: pide un abono de $ ${r.personas * 5} (propuesta: $ 5 por persona).</span></p>` : ''); };
      raiz.querySelectorAll('[data-rf]').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { C.form[el.dataset.rf] = el.value; pintar(); }));
      pintar();
    },
  };
  ACC['libro-dia'] = n => { if (+n === 0) C.dia = HOY; else { const x = sumar(C.dia, +n); if (dif(x) >= -4 && dif(x) <= 55) C.dia = x; } A.pintarPagina(); };
  ACC['res-vista'] = v => { C.vista = v; A.pintarPagina(); };
  ACC['res-hora'] = arg => { const [f, h] = arg.split('|'); C.form = { ...formVacio(), fecha: f, hora: h }; C.hecho = null; A.ir('calendario/nueva'); };
  ACC['cal-capa'] = k => { C.capas[k] = !C.capas[k]; A.pintarPagina(); };
  ACC['cal-mes'] = m => { C.mes = +m; A.pintarPagina(); };
  ACC['aviso-grupo'] = (i, el) => A.aviso(el.checked ? 'Aviso encendido.' : 'Aviso apagado. Queda en el registro de cambios.');

  /* ---------- nueva reserva ---------- */
  const formVacio = () => ({ nombre: '', tel: '', fecha: '9-9', hora: '20:00', personas: '4', area: 'Salón', mesa: '', ocasion: '', notas: '', canal: 'WhatsApp del restaurante' });
  function desdeForm() { const F = C.form; const [d, m] = F.fecha.split('-').map(Number); return { d: [d, m], hora: F.hora, nombre: F.nombre.trim() || 'Nombre del cliente', tel: F.tel, personas: Math.max(1, parseInt(F.personas, 10) || 1), area: F.area, mesa: F.mesa.trim(), ocasion: F.ocasion, notas: F.notas.trim(), canal: F.canal, abono: 0, tomo: S.usuario.nombre }; }
  function formReserva() {
    if (!C.form) C.form = formVacio(); const F = C.form;
    const dias = Array.from({ length: 56 }, (_, i) => sumar(HOY, i));
    const horas = []; for (let h = 12; h <= 22; h++) { horas.push(h + ':00'); if (h < 22) horas.push(h + ':30'); }
    const sel = (k, ops) => `<select id="rf-${k}" data-rf="${k}">${ops.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(F[k]) ? ' selected' : ''}>${esc(t)}</option>`; }).join('')}</select>`;
    return `<div class="rejilla"><div class="c6 pila"><article class="hoja form"><h2>Nueva reserva</h2><div class="campos">
        <label class="campo ancho"><span>Nombre</span><input id="rf-nombre" data-rf="nombre" value="${esc(F.nombre)}" autocomplete="off" placeholder="Como lo dijo el cliente"></label>
        <label class="campo"><span>Teléfono</span><input id="rf-tel" data-rf="tel" value="${esc(F.tel)}" inputmode="tel" autocomplete="off"><small class="ayuda">No sale en el grupo.</small></label>
        <label class="campo"><span>Personas</span><input id="rf-personas" data-rf="personas" value="${esc(F.personas)}" inputmode="numeric" autocomplete="off"></label>
        <label class="campo"><span>Día</span>${sel('fecha', dias.map(d => [d[0] + '-' + d[1], (igual(d, HOY) ? 'Hoy · ' : dif(d) === 1 ? 'Mañana · ' : '') + fdl(d)]))}</label>
        <label class="campo"><span>Hora</span>${sel('hora', horas)}</label>
        <label class="campo"><span>Dónde</span>${sel('area', ['Salón', 'Terraza', 'Salón privado', 'Barra'])}</label>
        <label class="campo"><span>Mesa</span><input id="rf-mesa" data-rf="mesa" value="${esc(F.mesa)}" placeholder="S5, T2…" autocomplete="off"></label>
        <label class="campo"><span>Ocasión</span>${sel('ocasion', [['', 'Ninguna'], 'Cumpleaños', 'Aniversario', 'Negocios', 'Reencuentro', 'Otra'])}</label>
        <label class="campo"><span>Llegó por</span>${sel('canal', ['WhatsApp del restaurante', 'Instagram', 'Teléfono', 'En persona'])}</label>
        <label class="campo ancho"><span>Notas para el equipo</span><textarea id="rf-notas" data-rf="notas" placeholder="Silla de bebé, alergias, traen torta…">${esc(F.notas)}</textarea></label>
      </div></article></div>
      <div class="c6 pila"><div class="sec"><h2>Lo que le llega al grupo</h2></div><div id="rf-vista"></div>
        <button class="btn pri full" data-acc="res-guardar">${ic('enviar', 's')}Guardar y avisar al grupo</button>
        <button class="btn ghost" data-acc="res-volver">${ic('atras', 's')}Volver</button></div></div>`;
  }
  function hechoReserva(r) {
    return `<div class="rejilla"><div class="c6 pila"><div class="hecho-caja">${ic('check')}<span>Reserva guardada y avisada al grupo «${esc(D.GRUPO_MESONEROS.nombre)}». (Simulado)</span></div>${wa(msgReserva(r))}
      <div class="fila-btns"><button class="btn sec" data-acc="res-volver">Ver las reservas</button><button class="btn sec" data-acc="res-otra">Tomar otra</button></div></div>
      <div class="c6 pila"><article class="hoja"><h2>${ic('celular')}Recordatorio para el cliente</h2><p class="muted">Cópialo y mándalo desde el WhatsApp del restaurante. Ese número no se conecta al bot.</p><p class="cita" id="rec-${r.id}">${esc(msgCliente(r))}</p><button class="btn sec" data-acc="res-copiar" data-arg="${r.id}">${ic('archivo', 's')}Copiar el texto</button></article></div></div>`;
  }
  ACC['res-guardar'] = () => {
    const r = desdeForm(); if (!C.form.nombre.trim()) { A.aviso('Escribe el nombre de quien reserva.', 'info'); const el = $('#rf-nombre'); if (el) el.focus(); return; }
    const id = 'rs' + (D.RESERVAS.length + 1 + Math.floor(Math.random() * 1000)); Object.assign(r, { id, estado: 'confirmada', visitas: 0, abonoOk: false, abono: r.personas >= 10 ? r.personas * 5 : 0, tel: r.tel ? r.tel.replace(/(\d{4}).*(\d{4})$/, '$1-•••-$2') : '' });
    D.RESERVAS.push(r); A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'creada', despues: fdl(r.d) + ' ' + r.hora + ' · ' + r.personas + ' personas' });
    C.hecho = id; A.pintarPagina();
  };
  ACC['res-volver'] = () => { C.hecho = null; C.form = null; A.ir('calendario/reservas'); };
  ACC['res-otra'] = () => { C.hecho = null; C.form = null; A.pintarPagina(); };
  ACC['res-copiar'] = id => {
    const r = D.RESERVAS.find(x => x.id === id); const txt = msgCliente(r);
    const fallback = () => { const el = document.getElementById('rec-' + id); if (el) { const rg = document.createRange(); rg.selectNodeContents(el); const s2 = window.getSelection(); s2.removeAllRanges(); s2.addRange(rg); } A.aviso('Texto seleccionado: cópialo con Cmd+C o manteniendo el dedo.', 'info'); };
    try { navigator.clipboard.writeText(txt).then(() => A.aviso('Copiado. Pégalo en el chat del cliente.'), fallback); } catch (_) { fallback(); }
  };
  ACC['res-estado'] = arg => {
    const [id, est] = arg.split('|'); const r = D.RESERVAS.find(x => x.id === id); const antes = r.estado;
    const hacer = (m = '') => { r.estado = est; A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'estado', antes, despues: est, motivo: m }); A.pintarFicha(); A.pintarPagina(); A.aviso(est === 'cancelada' ? 'Cancelada. Avisamos al grupo.' : est === 'llego' ? 'Anotado: llegó.' : 'Anotado: no vino. Queda en su historial.'); };
    if (est === 'cancelada') A.pedirMotivo({ titulo: 'Cancelar la reserva', texto: 'El grupo recibe el aviso de que la mesa queda libre.', boton: 'Cancelar la reserva', tono: 'peligro' }).then(hacer).catch(() => {}); else hacer();
  };
  ACC['res-avisar'] = () => A.aviso('Avisamos al grupo «' + D.GRUPO_MESONEROS.nombre + '» con el cambio. (Simulado)');
  ACC['ev-tarea'] = arg => { if (!puede('calendario', 'editar')) { A.aviso('Solo lectura: pídeselo a ' + A.quienEdita('calendario') + '.', 'info'); return; } const [id, k] = arg.split('|'); const e = D.EVENTOS_AG.find(x => x.id === id); e.tareas[+k][1] = !e.tareas[+k][1]; A.pintarFicha(); A.pintarPagina(); };

  FICHAS.reserva = id => {
    const r = D.RESERVAS.find(x => x.id === id); const ed = puede('calendario', 'editar'); const futura = dif(r.d) >= 0;
    const acc = [];
    if (['confirmada', 'por_confirmar'].includes(r.estado) && dif(r.d) <= 0) acc.push({ txt: 'No vino', acc: 'res-estado', arg: r.id + '|no_vino', solo: 'editar' }, { txt: 'Llegó', acc: 'res-estado', arg: r.id + '|llego', tono: 'pri', icono: 'check', solo: 'editar' });
    if (['confirmada', 'por_confirmar'].includes(r.estado) && futura) acc.push({ txt: 'Cancelar', acc: 'res-estado', arg: r.id + '|cancelada', tono: 'ghost', solo: 'editar' }, { txt: 'Copiar recordatorio', acc: 'res-copiar', icono: 'archivo', solo: 'editar' });
    return { titulo: r.nombre, sub: (igual(r.d, HOY) ? 'Hoy' : esc(fdl(r.d))) + ' · ' + esc(r.hora) + ' · ' + r.personas + ' personas', mod: 'calendario', obj: r, registro: 'Reserva ' + r.nombre,
      tags: [[A.estadoTag(r.estado).replace(/<[^>]+>/g, ''), r.estado === 'por_confirmar' ? 'aviso' : r.estado === 'confirmada' ? 'ok' : ''], ...(r.abono && !r.abonoOk ? [['Falta el abono', 'aviso']] : [])],
      bloques: [{ titulo: 'Reserva', filas: [{ l: 'Día', v: esc(fdl(r.d)) }, { l: 'Hora', v: esc(r.hora), campo: { k: 'hora', tipo: 'texto' } }, { l: 'Personas', v: r.personas, campo: { k: 'personas', tipo: 'numero' } }, { l: 'Dónde', v: esc(r.area), campo: { k: 'area', tipo: 'select', opciones: ['Salón', 'Terraza', 'Salón privado', 'Barra'] } }, { l: 'Mesa', v: esc(r.mesa || '—'), campo: { k: 'mesa', tipo: 'texto' } }, { l: 'Ocasión', v: esc(r.ocasion || '—'), campo: { k: 'ocasion', tipo: 'texto' } }, { l: 'Notas para el equipo', v: esc(r.notas || '—'), largo: true, campo: { k: 'notas', tipo: 'area' } }, { l: 'Estado', v: A.estadoTag(r.estado), campo: { k: 'estado', tipo: 'select', opciones: [['confirmada', 'Confirmada'], ['por_confirmar', 'Por confirmar'], ['llego', 'Llegó'], ['no_vino', 'No vino'], ['cancelada', 'Cancelada']] } }] },
        { titulo: 'Cliente', filas: [{ l: 'Teléfono', v: ed ? esc(r.tel || '—') : '<span class="tenue">Solo quien toma reservas</span>' }, { l: 'Llegó por', v: esc(r.canal) }, { l: 'Ha venido antes', v: r.visitas ? r.visitas + (r.visitas === 1 ? ' vez' : ' veces') : 'Primera vez' }, { l: 'La tomó', v: esc(r.tomo) }] },
        r.abono ? { titulo: 'Abono', html: `<p>${r.abonoOk ? tag('Recibido', 'ok') + ' ' + dinero(r.abono, 'usd', 0) + ' · confirmado por el bot de Caja.' : tag('Falta', 'aviso') + ' ' + dinero(r.abono, 'usd', 0) + ' · grupos de 10 o más dejan abono (propuesta: $ 5 por persona).'}</p>` } : { oculto: true },
        { titulo: 'Lo que le llegó al grupo', html: wa(msgReserva(r), { hora: igual(r.d, HOY) ? '11:00' : 'Vie 2 oct' }) },
        ...(futura && ed ? [{ titulo: 'Recordatorio para el cliente', html: `<p class="cita" id="rec-${r.id}">${esc(msgCliente(r))}</p><p class="muted">Se manda desde el WhatsApp del restaurante. El bot no le escribe a clientes.</p>` }] : [])],
      acciones: acc, alGuardar: () => A.aviso('Guardado. Avisamos el cambio al grupo «' + D.GRUPO_MESONEROS.nombre + '». (Simulado)') };
  };
  FICHAS.evento = id => {
    const e = D.EVENTOS_AG.find(x => x.id === id); const total = e.personas * e.porPersona; const plata = e.tipo === 'privado' && verPlata(); const ed = puede('calendario', 'editar');
    return { titulo: e.nombre, sub: esc(fdl(e.d)) + ' · ' + esc(e.hora), mod: 'calendario', obj: e, registro: 'Evento ' + e.nombre,
      tags: [[A.estadoTag(e.estado).replace(/<[^>]+>/g, ''), e.estado === 'presupuesto' ? 'aviso' : 'ok'], [e.tipo === 'propio' ? 'Del restaurante' : 'Privado', 'info']],
      bloques: [{ titulo: 'Evento', filas: [{ l: 'Cuándo', v: esc(fdl(e.d)) + ' · ' + esc(e.hora) }, ...(e.personas ? [{ l: 'Personas', v: e.personas, campo: { k: 'personas', tipo: 'numero' } }] : []), { l: e.tipo === 'propio' ? 'Qué es' : 'Cliente', v: esc(e.cliente) }, { l: e.tipo === 'propio' ? 'Detalle' : 'Menú', v: esc(e.menu), largo: true, campo: { k: 'menu', tipo: 'area' } }, { l: 'Estado', v: A.estadoTag(e.estado), campo: { k: 'estado', tipo: 'select', opciones: [['confirmado', 'Confirmado'], ['presupuesto', 'Presupuesto enviado'], ['cancelada', 'Cancelado']] } }] },
        plata ? { titulo: 'Plata', html: `<dl class="kv"><div><dt>Por persona</dt><dd>${dinero(e.porPersona)}</dd></div><div><dt>Total</dt><dd>${dinero(total, 'usd', 0)}</dd></div><div><dt>Abono</dt><dd>${e.abono ? dinero(e.abono, 'usd', 0) : 'Sin abono'}</dd></div><div class="total"><dt><b>Se cobra el día del evento</b></dt><dd>${dinero(total - e.abono, 'usd', 0)}</dd></div></dl>${e.abonoVia ? `<p class="muted">${esc(e.abonoVia)}.</p>` : ''}` } : { oculto: true },
        { titulo: 'Tareas', html: `<ul class="tareas">${e.tareas.map(([t, h], k) => `<li class="${h ? 'hecha' : ''}"><button data-acc="ev-tarea" data-arg="${e.id}|${k}" ${ed ? '' : 'aria-disabled="true"'} aria-pressed="${h}">${ic(h ? 'check' : 'reloj', 's')}<span>${esc(t)}</span></button></li>`).join('')}</ul>` },
        { titulo: 'Avisos', tiempo: [[esc(fdl(sumar(e.d, -7))), 'Aviso al grupo de mesoneros y a Compras (7 días antes).'], [esc(fdl(e.d)), 'Aviso del día a las 11:00.']] }],
      acciones: e.tipo === 'privado' && !e.abono ? [{ txt: 'Registrar el abono', acc: 'pronto', icono: 'mas', solo: 'editar' }, { txt: 'Avisar al grupo', acc: 'res-avisar', icono: 'enviar', solo: 'editar' }] : [{ txt: 'Avisar al grupo', acc: 'res-avisar', icono: 'enviar', solo: 'editar' }] };
  };
  FICHAS.agendadia = id => {
    const [d, m] = id.split('-').map(Number); const its = itemsDia([d, m], true);
    return { titulo: fLarga([d, m])[0].toUpperCase() + fLarga([d, m]).slice(1), sub: 'Calendario', mod: 'calendario', obj: {},
      bloques: [{ html: its.length ? `<ul class="lista">${its.map(x => `<li>${x.abrir || x.ir ? `<button class="fila" ${x.abrir ? `data-abrir="${x.abrir}"` : `data-ir="${x.ir}"`}>` : '<div class="fila">'}<span class="lead ${['info', 'evento', 'lila', 'ok', 'alerta'].includes(x.tono.split(' ')[0]) ? x.tono.split(' ')[0] : ''}">${ic(x.icono)}</span><span class="medio"><b>${esc(x.largo)}</b></span><span class="fin">${x.abrir || x.ir ? ic('derecha', 's chev') : ''}</span>${x.abrir || x.ir ? '</button>' : '</div>'}</li>`).join('')}</ul>` : '<p class="muted">Nada este día.</p>' },
        ...(puede('calendario', 'editar') ? [{ html: `<button class="btn sec" data-acc="res-dia" data-arg="${d}-${m}">${ic('mas', 's')}Nueva reserva este día</button>` }] : [])] };
  };
  ACC['res-dia'] = arg => { C.form = { ...formVacio(), fecha: arg }; C.hecho = null; A.cerrarFicha(); A.ir('calendario/nueva'); };
  void leerNum; void fmt;
})();
