/* Hoy: Inicio (uno por rol), Pendientes, Mi cuenta y la revisión del prototipo. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, esc, fmt, dinero, ic, tag, puede } = A;

  const leadPend = { alerta: ['alerta', 'alerta'], aviso: ['aviso', 'reloj'], info: ['info', 'usuario'], escalado: ['lila', 'reloj'] };
  const filaPend = p => {
    const [tono, icono] = leadPend[p.tipo] || ['', 'info'];
    return `<li><button class="fila" data-abrir="pendiente:${p.id}"><span class="lead ${tono}">${ic(icono)}</span><span class="medio"><b>${esc(p.titulo)}</b><small>${esc(p.sub)}${p.tipo === 'escalado' ? '' : ' · ' + esc(p.de)}</small></span><span class="fin"><span class="muted nowrap">${esc(p.edad)}</span>${ic('derecha', 's chev')}</span></button></li>`;
  };

  function parte() {
    return `<article class="parte" aria-label="El parte de la mañana">
      <div class="hoja-cab"><p class="etq">El parte de hoy · llegó a las 7:00 por WhatsApp</p><button class="enlace" data-abrir="kpi:parte">Cómo se calcula</button></div>
      <p class="parte-texto">Ayer domingo se vendieron <b>$ 4.612</b>, el 117 % de lo que hacía falta. Hoy la meta es <b>$ 3.950</b> para cubrir los costos del día.</p>
      <div class="medidor" role="img" aria-label="Ayer se vendió 117 % de la meta"><span style="width:100%"></span><i style="left:85.6%"></i></div>
      <p class="leyenda"><span>Ayer, $ 4.612</span><span>La raya marca la meta</span></p>
      <div class="mini-cifras">
        <button data-abrir="kpi:semana"><small>Domingo pasado</small><b>$ 4.380</b><small class="up">+5 %</small></button>
        <button data-abrir="kpi:anio"><small>Mismo domingo de 2025</small><b>$ 4.155</b><small class="up">+11 %</small></button>
        <button data-abrir="kpi:ticket"><small>Pedidos · ticket</small><b>251 · $ 18,40</b><small class="down">−2 % ticket</small></button>
      </div>
    </article>`;
  }
  function termometro() {
    return `<article class="hoja">
      <div class="hoja-cab"><h2>${ic('termometro')}Termómetro de la comida</h2>${tag('Fuga', 'alerta')}</div>
      <p class="muted">Semana del 28 sep al 4 oct · en % de lo vendido en comida · cobertura: 81 % de lo vendido tiene receta</p>
      <div class="barras">
        <div class="barra"><span>Lo que se gastó en comida</span><b style="color:var(--alerta)">46 %</b><div class="pista"><span class="alerta" style="width:46%"></span></div></div>
        <div class="barra"><span>Lo que dicen nuestras recetas (recetario propio, no Odoo)</span><b style="color:var(--ok)">33 %</b><div class="pista"><span class="ok" style="width:33%"></span></div></div>
      </div>
      <p style="font-size:14px">La comida costó $ 2.180 más de lo que dicen las recetas. Lo que más explica la diferencia: punta de ganso, queso telita y pernil.</p>
      <button class="enlace" data-ir="analisis/termometro">Ver el termómetro completo ${ic('derecha', 's')}</button>
    </article>`;
  }
  function estaSemana() {
    const pagado = D.LUNES.filter(r => r.c).reduce((s, r) => s + r.m, 0), total = D.LUNES.reduce((s, r) => s + r.m, 0);
    const items = [];
    if (puede('pagos')) items.push(`<li><button class="fila" data-ir="pagos"><span class="lead">${ic('pagos')}</span><span class="medio"><b>Pagos del lunes (hoy)</b><small>Pagado ${dinero(pagado, 'usd', 0)} de ${dinero(total, 'usd', 0)} · faltan ${D.LUNES.filter(r => !r.c).length}</small></span><span class="fin">${ic('derecha', 's chev')}</span></button></li>`);
    if (puede('fiscal')) items.push(`<li><button class="fila" data-abrir="obligacion:o1"><span class="lead aviso">${ic('fiscal')}</span><span class="medio"><b>IVA de la 2.ª quincena de septiembre</b><small>Vence mañana, martes 6 · en revisión</small></span><span class="fin">${tag('Mañana', 'aviso')}</span></button></li>`);
    if (puede('fiscal')) items.push(`<li><button class="fila" data-abrir="permiso:pl1"><span class="lead aviso">${ic('escudo')}</span><span class="medio"><b>Permiso de bomberos</b><small>Vence el 21 de octubre</small></span><span class="fin">${tag('Renovar', 'aviso')}</span></button></li>`);
    if (puede('nomina')) items.push(`<li><button class="fila" data-ir="nomina"><span class="lead">${ic('nomina')}</span><span class="medio"><b>Nómina del jueves 15</b><small>49 personas · falta el reporte del reloj</small></span><span class="fin">${ic('derecha', 's chev')}</span></button></li>`);
    if (puede('calendario')) {
      const hoyR = D.RESERVAS.filter(x => x.d[0] === 5 && x.d[1] === 9 && !['cancelada', 'no_vino'].includes(x.estado));
      if (hoyR.length) items.push(`<li><button class="fila" data-ir="calendario/reservas"><span class="lead info">${ic('cubiertos')}</span><span class="medio"><b>Reservas de hoy</b><small>${hoyR.length} reservas · ${hoyR.reduce((a, x) => a + x.personas, 0)} personas · la primera a las ${hoyR.map(x => x.hora).sort()[0]}</small></span><span class="fin">${ic('derecha', 's chev')}</span></button></li>`);
      A.rh.activos().filter(e => A.rh.proxCumple(e) === 0).forEach(e => items.push(`<li><button class="fila" ${puede('personal') ? 'data-abrir="empleado:' + e.id + '"' : 'data-ir="calendario/personal"'}><span class="lead lila">${ic('pastel')}</span><span class="medio"><b>Hoy cumple ${esc(e.nombre)}</b><small>${esc(e.cargo)} · cumple ${A.rh.cumpleAnios(e)}</small></span><span class="fin">${tag('Hoy', 'lila')}</span></button></li>`));
    }
    return items.length ? `<div class="sec"><h2>Esta semana</h2></div><ul class="lista">${items.join('')}</ul>` : '';
  }
  function plataHoy() {
    const bancos = D.CUENTAS.filter(c => c.mon === 'bs');
    const totBs = bancos.reduce((s, c) => s + c.saldo, 0);
    return `<article class="hoja">
      <div class="hoja-cab"><h2>${ic('bancos')}Cuánta plata hay hoy</h2>${tag('Llega en la fase 10', 'lila')}</div>
      <dl class="kv">${bancos.map(c => `<div><dt><span class="acct" data-c="${c.id}">${c.id}</span> ${esc(c.nombre)}</dt><dd>${dinero(c.saldo, 'bs', 0)}</dd></div>`).join('')}
      <div class="total"><dt><b>Total en bancos</b></dt><dd>${dinero(totBs, 'bs', 0)} <span class="muted">≈ ${dinero(totBs / D.TASA.usd, 'usd', 0)}</span></dd></div></dl>
      <p class="muted">Zelle, Binance y la bóveda se ven en Bancos y en Bóveda. El parte de WhatsApp nunca dice lo que hay en la bóveda.</p>
    </article>`;
  }
  const salud = () => puede('salud')
    ? `<button class="salud" data-ir="salud">${ic('escudo', 's')}<span>El sistema está bien, con una cosa por mirar: la copia de Odoo sigue a mano los domingos. Respaldo de las 3:00 probado, WhatsApp conectado y saldo de IA para 26 días.</span></button>` : '';

  function inicio() {
    const u = S.usuario; const mis = A.misPendientes();
    const saludo = `<header class="cabeza"><div><p class="kicker">${D.HOY.largo} · ${D.HOY.hora}</p><h1>Buenas tardes, ${esc(u.nombre.split(' ')[0])}</h1></div></header>`;
    const pend = mis.length ? `<div class="sec"><h2>Tus pendientes</h2><button class="enlace" data-ir="pendientes">${mis.length > 4 ? 'Ver los ' + mis.length : 'Ver todos'}</button></div><ul class="lista">${mis.slice(0, 4).map(filaPend).join('')}</ul>` : `<p class="nota ok">${ic('check', 's')}<span>No tienes pendientes. Buen trabajo.</span></p>`;
    const r = u.rol;
    if (r === 'dueno' || r === 'socia' || r === 'consulta') {
      return `<div class="pagina">${saludo}
        <div class="rejilla">
          <div class="pila c7">${parte()}${pend}</div>
          <div class="pila c5">${estaSemana()}${miConsumo()}${r === 'consulta' ? misRetiros() : ''}${termometro()}</div>
          <div class="c12">${plataHoy()}</div>
        </div>${salud()}</div>`;
    }
    if (r === 'contabilidad') {
      const porConf = D.CAJA.filter(c => c.estado === 'por_confirmar').length;
      const pagado = D.LUNES.filter(x => x.c).length;
      return `<div class="pagina">${saludo}
        <div class="cifras">
          ${A.cifra({ etq: 'Caja por confirmar', valor: porConf, sub: 'el más viejo de las 12:40', ir: 'caja', tono: porConf ? 'aviso' : '' })}
          ${A.cifra({ etq: 'Pagos del lunes', valor: pagado + ' de ' + D.LUNES.length, sub: 'marcados como pagados', ir: 'pagos' })}
          ${A.cifra({ etq: 'Lo fiscal esta semana', valor: '4', sub: 'el IVA vence mañana', ir: 'fiscal' })}
          ${A.cifra({ etq: 'Conciliación de septiembre', valor: '3 de 4', sub: 'falta el BNC', ir: 'bancos', tono: 'aviso' })}
        </div>
        <div class="rejilla"><div class="pila c7">${pend}</div><div class="pila c5">${estaSemana()}</div></div>${salud()}</div>`;
    }
    if (r === 'fiscal_externo') {
      const prox = D.OBLIGACIONES.filter(o => o.faltan >= 0).sort((a, b) => a.faltan - b.faltan).slice(0, 5);
      const porDesc = D.RET_RECIBIDAS.filter(x => x.estado === 'por_descontar').reduce((s, x) => s + x.monto, 0);
      return `<div class="pagina">${saludo}
        <div class="cifras">
          ${A.cifra({ etq: 'Hoja de IVA (vence mañana)', valor: 'En revisión', sub: 'falta el visto de Jose', abrir: 'obligacion:o1', tono: 'aviso' })}
          ${A.cifra({ etq: 'Reportes Z que faltan', valor: '2', sub: 'septiembre: días 13 y 27', ir: 'fiscal/z', tono: 'alerta' })}
          ${A.cifra({ etq: 'Retenciones por descontar', valor: dinero(porDesc, 'bs'), sub: '3 comprobantes', ir: 'fiscal/retenciones' })}
          ${A.cifra({ etq: 'Preguntas para ti', valor: D.PREGUNTAS.filter(q => q.estado === 'abierta').length, sub: 'de ' + D.PREGUNTAS.length + ' · las respondes aquí', ir: 'fiscal/preguntas' })}
        </div>
        <div class="rejilla">
          <div class="pila c7"><div class="sec"><h2>Lo que vence con el SENIAT y la Alcaldía</h2><button class="enlace" data-ir="fiscal">Ver el calendario</button></div>
            <ul class="lista">${prox.map(o => `<li><button class="fila" data-abrir="obligacion:${o.id}"><span class="lead ${o.faltan <= 1 ? 'aviso' : ''}">${ic('fiscal')}</span><span class="medio"><b>${esc(o.corto)}</b><small>${esc(o.ente)} · vence ${esc(o.vence)}</small></span><span class="fin">${A.estadoTag(o.estado)}</span></button></li>`).join('')}</ul></div>
          <div class="pila c5">${pend}<article class="hoja"><div class="hoja-cab"><h2>${ic('archivo')}Paquete de septiembre</h2>${tag('4 de 6 listos', 'aviso')}</div><button class="enlace" data-ir="fiscal/paquete">Ver lo que falta ${ic('derecha', 's')}</button></article></div>
        </div></div>`;
    }
    if (r === 'rrhh') {
      const pj = D.FALTAS.filter(f => f.estado === 'por_justificar').length;
      const semana = [];
      A.rh.activos().filter(e => A.rh.proxCumple(e) !== null && A.rh.proxCumple(e) <= 7).sort((a, b) => A.rh.proxCumple(a) - A.rh.proxCumple(b)).forEach(e => semana.push(`<li><button class="fila" data-abrir="empleado:${e.id}"><span class="lead lila">${ic('pastel')}</span><span class="medio"><b>${A.rh.proxCumple(e) === 0 ? 'Hoy cumple ' + esc(e.nombre) : esc(e.nombre) + ' cumple el ' + A.rh.fdl([e.nac[0], e.nac[1]])}</b><small>Cumple ${A.rh.cumpleAnios(e)} · ${esc(e.cargo)}</small></span><span class="fin">${ic('derecha', 's chev')}</span></button></li>`));
      A.rh.activos().filter(e => e.prueba).forEach(e => semana.push(`<li><button class="fila" data-abrir="empleado:${e.id}"><span class="lead aviso">${ic('reloj')}</span><span class="medio"><b>Termina la prueba de ${esc(e.nombre)}</b><small>${A.rh.fdl(e.prueba)} · hay que decidir si se queda</small></span><span class="fin">${ic('derecha', 's chev')}</span></button></li>`));
      D.VACACIONES.filter(v => v.estado === 'programada' && v.desde && A.rh.diasHasta(v.desde) <= 30).forEach(v => semana.push(`<li><button class="fila" data-abrir="vacacion:${v.id}"><span class="lead ok">${ic('maleta')}</span><span class="medio"><b>${esc(A.rh.emp(v.emp).nombre)} sale de vacaciones</b><small>${A.rh.fdl(v.desde)} · cubre: ${esc(v.cubre)}</small></span><span class="fin">${ic('derecha', 's chev')}</span></button></li>`));
      return `<div class="pagina">${saludo}
        <div class="cifras">
          ${A.cifra({ etq: 'Próxima nómina', valor: 'Jue 15 oct', sub: '49 personas · te toca prepararla', ir: 'nomina' })}
          ${A.cifra({ etq: 'Faltas por clasificar', valor: pj, sub: 'con su justificativo', ir: 'asistencia/faltas', tono: pj ? 'aviso' : '' })}
          ${A.cifra({ etq: 'Avisos del personal', valor: A.avisosPersonal().length, sub: 'contratos, salud, papeles', ir: 'personal/avisos', tono: 'aviso' })}
          ${A.cifra({ etq: 'Préstamos vivos', valor: D.PRESTAMOS.filter(p => ['activo', 'en_liquidacion'].includes(p.estado)).length, sub: '1 por aprobar', ir: 'prestamos' })}
        </div>
        <div class="rejilla"><div class="pila c7">${pend}</div><div class="pila c5"><div class="sec"><h2>Esta semana en el personal</h2></div><ul class="lista">${semana.join('')}</ul>
          <p class="nota info">${ic('info', 's')}<span>La nómina se arma con el Excel del reloj. Cuando llegue la muestra, en Asistencia aparece «Subir el reporte del reloj».</span></p></div></div></div>`;
    }
    if (r === 'reservas') {
      const esHoy = x => x.d[0] === 5 && x.d[1] === 9, esMan = x => x.d[0] === 6 && x.d[1] === 9;
      const hoyR = D.RESERVAS.filter(x => esHoy(x) && x.estado !== 'cancelada').sort((a, b) => a.hora.localeCompare(b.hora)), manR = D.RESERVAS.filter(x => esMan(x) && x.estado !== 'cancelada');
      const evs = D.EVENTOS_AG.filter(e => e.d[1] === 9 && e.d[0] >= 5 && e.personas);
      return `<div class="pagina">${saludo}
        <div class="cifras">
          ${A.cifra({ etq: 'Reservas de hoy', valor: hoyR.length, sub: hoyR.reduce((a, x) => a + x.personas, 0) + ' personas', ir: 'calendario/reservas' })}
          ${A.cifra({ etq: 'Mañana', valor: manR.length, sub: manR.reduce((a, x) => a + x.personas, 0) + ' personas · falta un abono', tono: 'aviso', abrir: manR[0] ? 'reserva:' + manR[0].id : '' })}
          ${A.cifra({ etq: 'Eventos en octubre', valor: evs.length, sub: 'el próximo: sáb 17', ir: 'calendario/eventos' })}
          ${(c => c ? A.cifra({ etq: 'Hoy cumple', valor: esc(c.nombre.split(' ')[0]), sub: esc(c.cargo.toLowerCase()) + ' · ' + esc(D.TURNOS[c.turno][0].toLowerCase()), ir: 'calendario/personal' }) : '')(A.rh.activos().find(e => A.rh.proxCumple(e) === 0))}
        </div>
        <div class="rejilla"><div class="pila c7"><div class="sec"><h2>Reservas de hoy</h2><button class="btn pri chico" data-ir="calendario/nueva">${ic('mas', 's')}Nueva reserva</button></div>
          <ul class="lista">${hoyR.map(x => `<li><button class="fila" data-abrir="reserva:${x.id}"><span class="lead info">${ic('cubiertos')}</span><span class="medio"><b>${esc(x.hora)} · ${esc(x.nombre)}</b><small>${x.personas} personas · ${esc(x.area)} ${esc(x.mesa)}${x.notas ? ' · ' + esc(x.notas) : ''}</small></span><span class="fin">${A.estadoTag(x.estado)}</span></button></li>`).join('')}</ul>${pend}</div>
          <div class="pila c5"><div class="sec"><h2>El aviso de las 11:00</h2>${tag('Enviado (simulado)', 'ok')}</div>${A.wa(A.msgDia([5, 9], 'Reservas de hoy'), { hora: '11:00' })}
          <p class="muted">Solo ves el calendario: reservas, eventos, y las vacaciones y cumpleaños del personal para armar las mesas. Nada de plata.</p></div></div></div>`;
    }
    if (r === 'compras') {
      return `<div class="pagina">${saludo}
        <div class="rejilla">
          <div class="pila c7"><div class="sec"><h2>Radar de precios</h2><button class="enlace" data-ir="analisis/precios">Ver todos</button></div>
            ${A.tabla({ cols: [{ t: 'Insumo', cls: 'p' }, { t: 'Antes', cls: 'r x' }, { t: 'Ahora', cls: 'r' }, { t: 'Cambio', cls: 'e' }], filas: D.INSUMOS.map(i => { const c = (i.ahora / i.antes - 1) * 100; return { abrir: 'insumo:' + i.id, celdas: [`<b>${esc(i.nombre)}</b><small>${esc(i.prov)}</small>`, dinero(i.antes), dinero(i.ahora) + ' / ' + i.unidad, tag((c > 0 ? '+' : '') + fmt(c, 1) + ' %', c > 5 ? 'alerta' : c > 0 ? 'aviso' : 'ok')] }; }) })}</div>
          <div class="pila c5">${pend}${eventosCompras()}</div>
        </div></div>`;
    }
    return `<div class="pagina">${saludo}${pend}</div>`;
  }
  function eventosCompras() {
    const evs = D.EVENTOS_AG.filter(e => e.personas && e.tipo === 'privado' && A.rh.diasHasta(e.d) >= 0).sort((a, b) => A.rh.diasHasta(a.d) - A.rh.diasHasta(b.d));
    return evs.length ? `<div class="sec"><h2>Eventos que vienen</h2><button class="enlace" data-ir="calendario/eventos">Ver todos</button></div><ul class="lista">${evs.map(e => `<li><button class="fila" data-abrir="evento:${e.id}"><span class="lead aviso">${ic('cubiertos')}</span><span class="medio"><b>${esc(e.nombre)}</b><small>${A.rh.fdl(e.d)} · ${e.personas} personas · ${esc(e.menu)}</small></span><span class="fin">${ic('derecha', 's chev')}</span></button></li>`).join('')}</ul>` : '';
  }
  function miConsumo() {
    const x = D.CONSUMO_SOCIOS.socios.find(z => z.usuario === S.usuario.id);
    return x && A.tarjetaConsumo ? A.tarjetaConsumo(x.socio, { compacta: true }) : '';
  }
  function misRetiros() {
    const s = D.SOCIOS.find(x => x.nombre === 'Luis Roberto');
    return `<article class="hoja"><div class="hoja-cab"><h2>${ic('cajachica')}Tus retiros este trimestre</h2></div>
      <dl class="kv"><div><dt>Retirado (anticipo de utilidades)</dt><dd>${dinero(s.retirado, 'usd', 0)}</dd></div><div><dt>Plata por rendir</dt><dd>${dinero(s.porRendir, 'usd', 0)}</dd></div></dl>
      <button class="btn sec" data-ir="boveda/sacar">${ic('menos', 's')}Registrar un retiro de la bóveda</button>
      <p class="muted">Es lo único que puedes registrar: tu propio retiro, con foto y código. Todo lo demás lo ves sin poder cambiarlo.</p></article>`;
  }

  PANT.inicio = { titulo: 'Inicio', grupo: 'Hoy', icono: 'inicio', mod: 'inicio', render: inicio };

  /* ---------- pendientes ---------- */
  PANT.pendientes = {
    titulo: 'Mis pendientes', corto: 'Pendientes', grupo: 'Hoy', icono: 'lista', mod: 'inicio',
    cuenta: () => A.misPendientes().length,
    render: () => {
      const mis = A.misPendientes(); const hechos = D.PENDIENTES.filter(p => p.para.includes(S.usuario.id) && p.hecho);
      return `<div class="pagina">${A.cab('Tu bandeja', 'Mis pendientes', 'Todo lo que espera por ti, de cualquier módulo. Si algo pasa 2 días sin resolverse, sube al dueño. Se resuelve, se descarta con motivo o se pasa a otra persona.')}
        ${mis.length ? `<ul class="lista">${mis.map(filaPend).join('')}</ul>` : `<p class="nota ok">${ic('check', 's')}<span>Nada pendiente.</span></p>`}
        ${hechos.length ? `<div class="sec"><h2>Resueltos hoy</h2></div><ul class="lista">${hechos.map(p => `<li><div class="fila"><span class="lead ok">${ic('check')}</span><span class="medio"><b>${esc(p.titulo)}</b><small>${esc(p.hecho)}</small></span><span></span></div></li>`).join('')}</ul>` : ''}
      </div>`;
    },
  };
  FICHAS.pendiente = id => {
    const p = D.PENDIENTES.find(x => x.id === id);
    const acciones = [];
    if (p.ir) acciones.push({ txt: 'Ir a resolverlo', acc: 'pend-ir', icono: 'derecha', tono: 'pri' });
    if (p.abrir) acciones.push({ txt: 'Abrir', acc: 'pend-abrir', icono: 'derecha', tono: 'pri' });
    acciones.unshift({ txt: 'Marcar resuelto', acc: 'pend-resolver', icono: 'check' }, { txt: 'Pasar a otra persona', acc: 'pend-pasar', icono: 'usuario' });
    return {
      titulo: p.titulo, sub: 'Pendiente · ' + esc(p.edad), mod: 'inicio', obj: p,
      tags: [[p.tipo === 'escalado' ? 'Subió al dueño' : p.tipo === 'alerta' ? 'Urgente' : 'Normal', p.tipo === 'alerta' ? 'alerta' : p.tipo === 'escalado' ? 'lila' : '']],
      bloques: [
        { filas: [{ l: 'Qué pasa', v: esc(p.sub), largo: true }, { l: 'Viene de', v: esc(p.de) }, { l: 'Para', v: p.para.map(x => esc(D.USUARIOS.find(u => u.id === x).nombre)).join(', ') }, { l: 'Esperando desde', v: esc(p.edad) }] },
        { titulo: 'Cómo funciona', html: '<p class="muted">Si nadie lo resuelve en 2 días, sube al dueño. Descartarlo pide un motivo. Si la persona deja la empresa, al quitarle el acceso sus pendientes pasan a quien tenga su rol.</p>' },
      ],
      acciones,
    };
  };
  ACC['pend-ir'] = id => { const p = D.PENDIENTES.find(x => x.id === id); A.ir(p.ir + (p.sub2 ? '/' + p.sub2 : '')); };
  ACC['pend-abrir'] = id => { const p = D.PENDIENTES.find(x => x.id === id); const [t, i] = p.abrir.split(':'); A.abrir(t, i); };
  ACC['pend-resolver'] = id => {
    const p = D.PENDIENTES.find(x => x.id === id);
    A.pedirMotivo({ titulo: 'Marcar resuelto', etiqueta: 'Cómo se resolvió', obligatorio: false, boton: 'Marcar resuelto' }).then(m => {
      p.hecho = 'Lo resolvió ' + S.usuario.nombre + ' a las ' + D.HOY.hora + (m ? ' · ' + m : '');
      A.auditar({ modulo: 'Pendientes', registro: p.titulo, campo: 'estado', antes: 'abierto', despues: 'resuelto', motivo: m });
      A.cerrarFicha(); A.pintarPagina(); A.aviso('Resuelto.');
    }).catch(() => {});
  };
  ACC['pend-pasar'] = id => {
    const p = D.PENDIENTES.find(x => x.id === id);
    const opciones = D.USUARIOS.filter(u => u.id !== S.usuario.id && u.estado !== 'invitada').map(u => `<option value="${u.id}">${esc(A.nombreDe(u))}</option>`).join('');
    const env = document.querySelector('#modal-raiz');
    env.innerHTML = `<div class="modal-env"><div class="modal" role="dialog" aria-modal="true"><h2>Pasar a otra persona</h2>
      <label class="campo" for="pasar-a"><span>¿A quién?</span><select id="pasar-a">${opciones}</select></label>
      <div class="modal-acc"><button class="btn sec" data-pasar="no">Cancelar</button><button class="btn pri" data-pasar="si">Pasar</button></div></div></div>`;
    env.querySelector('#pasar-a').focus();
    env.onclick = e => {
      const b = e.target.closest('[data-pasar]'); if (!b) return;
      if (b.dataset.pasar === 'si') {
        const a = env.querySelector('#pasar-a').value; p.para = [a];
        A.auditar({ modulo: 'Pendientes', registro: p.titulo, campo: 'responsable', antes: S.usuario.nombre, despues: D.USUARIOS.find(u => u.id === a).nombre });
        env.innerHTML = ''; A.cerrarFicha(); A.pintarPagina(); A.aviso('Lo pasaste a ' + D.USUARIOS.find(u => u.id === a).nombre + '.');
      } else env.innerHTML = '';
    };
  };

  /* ---------- cifras del parte (cada una se abre) ---------- */
  FICHAS.kpi = id => {
    const k = {
      parte: { t: 'Cómo se calcula la meta del día', b: [{ filas: [{ l: 'Costos fijos del mes', v: '$ 58.400' }, { l: 'Días de venta del mes', v: '30' }, { l: 'Lo variable (comida, comisiones)', v: '50,7 % de la venta' }, { l: 'Meta del día', v: '<b>$ 3.950</b>' }] }, { html: '<p class="muted">Meta = costos fijos ÷ días ÷ (1 − lo variable). Los costos fijos los escribe Alejandro en Parámetros. Las ventas salen del resumen diario del POS de Odoo.</p>' }] },
      semana: { t: 'Ayer contra el domingo pasado', b: [{ filas: [{ l: 'Domingo 4 oct', v: '$ 4.612' }, { l: 'Domingo 27 sep', v: '$ 4.380' }, { l: 'Diferencia', v: '<span class="up">+$ 232 (+5 %)</span>' }] }] },
      anio: { t: 'Ayer contra el mismo domingo de 2025', b: [{ filas: [{ l: 'Domingo 4 oct 2026', v: '$ 4.612' }, { l: 'Domingo 5 oct 2025', v: '$ 4.155' }, { l: 'Diferencia', v: '<span class="up">+$ 457 (+11 %)</span>' }] }, { html: '<p class="muted">Se compara el mismo día de la semana. La historia de Odoo arranca el 1 de octubre de 2025.</p>' }] },
      ticket: { t: 'Pedidos y ticket promedio', b: [{ filas: [{ l: 'Pedidos ayer', v: '251 (+8 % contra el domingo pasado)' }, { l: 'Ticket promedio', v: '$ 18,40' }, { l: 'Ticket del domingo pasado', v: '$ 18,77' }] }] },
    }[id];
    return { titulo: k.t, sub: 'Parte de la mañana', mod: 'analisis', bloques: k.b, acciones: [{ txt: 'Ver en Análisis', acc: 'ir-a', arg: 'analisis', icono: 'analisis' }] };
  };
  ACC['ir-a'] = arg => A.ir(arg);

  /* ---------- mi cuenta ---------- */
  PANT.cuenta = {
    titulo: 'Mi cuenta', grupo: 'Hoy', icono: 'usuario', mod: 'inicio', oculta: true, libre: true,
    render: () => {
      const u = S.usuario; const rol = D.ROLES[u.rol];
      return `<div class="pagina">${A.cab('', A.nombreDe(u), esc(rol.nombre) + ' · ' + esc(rol.desc))}
        <div class="rejilla">
          <div class="pila c6"><article class="hoja"><h2>${ic('llave')}Entrar</h2>
            <dl class="kv"><div><dt>Correo</dt><dd>${esc(u.correo)}</dd></div><div><dt>Clave</dt><dd>Cambiada hace 21 días</dd></div><div><dt>Doble factor (código)</dt><dd>${u.dosfa ? tag('Activo', 'ok') : tag('Sin activar', 'alerta')}</dd></div><div><dt>Códigos de respaldo</dt><dd>6 de 8 sin usar</dd></div></dl>
            <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sec chico" data-acc="cambiar-clave">Cambiar mi clave</button><button class="btn sec chico" data-acc="nuevos-respaldos">Nuevos códigos de respaldo</button></div></article>
            <article class="hoja"><h2>${ic('celular')}Dónde tengo la sesión abierta</h2>
            <ul class="lista">${D.SESIONES.map(s => `<li><div class="fila"><span class="lead">${ic('celular')}</span><span class="medio"><b>${esc(s.disp)}</b><small>${esc(s.donde)} · desde ${esc(s.desde)}</small></span>${s.actual ? tag('Esta', 'ok') : `<button class="btn ghost chico" data-acc="cerrar-sesion" data-arg="${s.id}">Cerrar</button>`}</div></li>`).join('')}</ul>
            <p class="muted">La sesión se cierra sola a los 30 minutos sin uso o a las 12 horas.</p></article></div>
          <div class="pila c6"><article class="hoja"><h2>${ic('usuarios')}Lo que puedo hacer</h2>
            <dl class="kv">${D.MODULOS.filter(m => A.nivel(m[0])).map(m => `<div><dt>${esc(m[1])}</dt><dd>${nivelTag(A.nivel(m[0]), m[0])}</dd></div>`).join('')}</dl>
            ${u.extra.length ? `<p class="nota info">${ic('info', 's')}<span>Además: ${esc(u.extra.join(', '))}.</span></p>` : ''}</article></div>
        </div></div>`;
    },
  };
  const nivelTag = (n, mod) => ({ a: tag('Aprueba', 'ok'), e: tag('Edita', 'info'), v: tag('Ve', ''), g: tag('Ve agrupado', 'aviso'), p: tag('Prepara', 'info'), r: tag('Revisa', 'info') }[n] || '');
  A.nivelTag = nivelTag;
  ACC['cambiar-clave'] = () => A.pedirCodigo('Para cambiar tu clave confirma con tu código.').then(() => A.aviso('Te mandamos el paso para la clave nueva. (Simulado)')).catch(() => {});
  ACC['nuevos-respaldos'] = () => A.pedirCodigo('Los códigos viejos dejan de servir.').then(() => A.aviso('8 códigos nuevos listos. (Simulado)')).catch(() => {});
  ACC['cerrar-sesion'] = id => { D.SESIONES.splice(D.SESIONES.findIndex(s => s.id === id), 1); A.pintarPagina(); A.aviso('Sesión cerrada en ese equipo.'); };

  /* ---------- revisión del prototipo ---------- */
  const REV = [
    ['Para decidir (Alejandro)', [
      ['?', 'Los $ 500 de consumo de los socios', '¿Son $ 500 cada uno o entre los dos? Propuesta: a precio de carta; lo que pase del tope se suma a los retiros de ese socio; lo que sobra no se acumula; las invitaciones a proveedores o clientes no cuentan.'],
      ['?', 'Préstamos al personal', 'Propuesta: los préstamos los apruebas tú; los adelantos de hasta $ 60, Jose. Sin intereses, hasta 12 cuotas, y entre todos los descuentos no más de un tercio de lo que gana en la quincena (el tope legal hay que confirmarlo con Cecilia o el abogado). Si alguien se va, el saldo sale de su liquidación.'],
      ['?', 'Quién toma las reservas', 'Propuesta: Patricia, la supervisora, con un usuario que solo ve el calendario. Hay que crear el grupo «Mesoneros del restaurante» en WhatsApp y meter al número del bot. ¿Abono de $ 5 por persona para grupos de 10 o más?'],
      ['?', 'Cumpleaños del personal', '¿Se da el día libre o un detalle? ¿Se avisa al grupo del personal ese día? Hoy solo avisa a RRHH y a la supervisora 3 días antes.'],
      ['?', 'La base de las prestaciones', 'Con la regla del 29-ago, la nómina formal sale casi en cero (su salario legal es el mínimo de Bs 130) y la interna se calcula sobre $ 100 al mes (mínimo + cestaticket + un margen de $ 60 por confirmar). Revisarlo con Cecilia y el abogado.'],
      ['?', '¿Eliana edita o solo ve?', 'Hoy aparece como «Socia con edición, por confirmar». Si edita, puede ser tu suplente para aprobar cuando no estés.'],
      ['?', 'Luis «solo ve», pero registra su retiro de la bóveda', 'Así lo decidiste el 3-oct. Queda como única excepción. ¿Y el crédito a clientes (pregunta Q7)? Hoy no lo puede dar.'],
      ['?', 'Retiros de más de $ 200', 'La propuesta Q1 dice que los apruebes tú. El retiro de Luis de $ 500 quedó registrado al instante. ¿Pide tu aprobación o no?'],
      ['?', '¿Luis ve los sueldos?', 'La regla dice que solo dueño, RRHH y contabilidad. En el prototipo Luis ve la nómina agrupada, sin sueldos por persona.'],
      ['?', 'Nómina en 3 pasos necesita 3 personas', 'Prepara Andreina, revisa Jose, apruebas tú. Andreina todavía no ha entrado: sin ella no hay quien prepare.'],
      ['?', 'Cambio de cuenta de un proveedor', 'Lo cambia Jose con su código y te avisa. En Pagos del lunes la cuenta queda «por verificar» hasta que confirmes por teléfono. ¿Hace falta tu aprobación además?'],
      ['?', 'Figma o este prototipo', 'El Figma tiene otra paleta. La sesión que programa va a copiar este prototipo. Confirma que manda este.'],
      ['?', 'Bloqueo por claves malas', 'Propuesta: 5 intentos y 15 minutos de bloqueo, y te avisa. No estaba definido.'],
    ]],
    ['Agregado ahora: recursos humanos, calendario y consumos', [
      ['✓', 'Recursos humanos completo (6 pantallas)', 'Personal (ficha con cumpleaños, contrato, cuenta, salud y expediente; avisos; altas y egresos; protección y disciplina) · Asistencia y horas (horario de la semana, horas trabajadas, faltas y justificativos, redobles y días extra) · Vacaciones y reposos (libro de vacaciones, quién está fuera, justificativos médicos, permisos) · Nómina (recibo de pago por concepto, 10 % del mes, propinas, recibos firmados) · Préstamos y descuentos · Prestaciones y liquidaciones.'],
      ['✓', 'Préstamos en cuotas', 'Se registra, lo apruebas con tu código, se paga desde una cuenta y cada quincena se descuenta sola. Las cuotas se ven como casillas; si alguien falta, la cuota se corre al final. Quien se va lo paga con su liquidación.'],
      ['✓', 'Consumos', 'Los de ustedes dos en Caja chica y socios, con el tope de $ 500 al mes. Los del personal en Préstamos y descuentos: corte el 27, se descuentan en la 2.ª quincena. Ambos llegan del POS.'],
      ['✓', 'Calendario', 'El mes con capas (reservas, eventos, personal, fiscal y pagos), las reservas que avisan al grupo de mesoneros, los eventos y el calendario del personal: vacaciones, contratos que vencen y cumpleaños.'],
      ['✓', 'Usuaria nueva propuesta: Patricia (reservas)', 'Cambia «Ver como» a Patricia para ver lo que vería la supervisora: solo el calendario.'],
    ]],
    ['Agregado el 4 de octubre', [
      ['✓', 'Entrar con usuario, clave y código', 'Más la invitación de alguien nuevo (Andreina): clave, código con el cuadro y 8 códigos de respaldo. Modo aprendiz de 14 días.'],
      ['✓', 'Cada persona ve solo lo suyo', 'Cambia «Ver como» arriba. Menú, Inicio y pestañas cambian por persona. Luis y Cecilia ven el aviso «Solo lectura» donde no editan.'],
      ['✓', 'Todo se abre y todo se edita', 'Cualquier fila, cifra o tarjeta abre su ficha a la derecha. Si tienes permiso, «Editar» pide el motivo y queda en el registro de cambios.'],
      ['✓', 'Módulo Fiscal para Cecilia', 'Calendario SENIAT con las fechas reales del RIF terminado en 4, hoja de IVA, reportes Z, libros, retenciones, parafiscales, máquina fiscal, permisos, paquete del mes y sus preguntas.'],
      ['✓', 'Parámetros', 'Negocio y sede, cuentas, tasas y valores legales, catálogos, reglas, antifraude, avisos, nómina y fiscal.'],
      ['✓', 'Usuarios y permisos', 'Quién entra y qué ve (matriz editable), quién aprueba qué, invitar, quitar acceso, cuentas de los bots.'],
      ['✓', 'Computadora en pantalla completa', 'Índice a la izquierda, tablas completas y la ficha a la derecha. Botón «Pantalla completa» arriba.'],
      ['✓', 'Módulos que faltaban', 'Clientes y cobranza, Proveedores y facturas (ajustes y devoluciones), Bancos y conciliación, Caja chica y socios, Personal y nómina, Documentos, Análisis, Registro de cambios y Salud del sistema.'],
      ['✓', 'Correcciones', 'Caja con sus 4 estados reales (confirmado, por confirmar, avisado, descartado). IVA vence el martes 6, no el viernes 9. La lista del lunes dice que viene de la copia a mano del domingo. El termómetro muestra la cobertura.'],
    ]],
    ['Queda para después (no bloquea la fase 0)', [
      ['·', 'Cerrar mi caja en el teléfono', 'Fase 5. Hoy el cierre sigue en papel.'],
      ['·', 'Reloj biométrico y motor de nómina', 'Espera la muestra del Excel del reloj. Las horas que se ven en Asistencia son un ejemplo.'],
      ['·', 'Mensajes al grupo de mesoneros', 'Se conectan con el bot cuando exista el grupo. El recordatorio al cliente se manda a mano desde el WhatsApp del restaurante.'],
      ['·', 'Libro de compras, TXT de IVA y XML de ISLR', 'Fase 9. Espera el candado de Odoo.'],
      ['·', 'Estado de resultados y proyección de compras', 'Fases 11 y 12.'],
      ['·', 'Campañas a clientes con su permiso', 'Fase 8.'],
    ]],
  ];
  PANT.revision = {
    titulo: 'Lo que falta', grupo: 'Hoy', icono: 'lista', mod: 'inicio', oculta: true, libre: true,
    render: () => `<div class="pagina">${A.cab('Revisión del prototipo · 5 de octubre', 'Lo que falta y lo que cambió', 'Comparé el prototipo con todo lo decidido en el esquema, el repaso y el registro de decisiones. Esto es lo que necesita tu respuesta, lo que se agregó hoy y lo que queda para después.')}
      ${REV.map(([t, items]) => `<div class="sec"><h2>${esc(t)}</h2></div><ul class="lista revision">${items.map(([m, a, b]) => `<li><span class="lead ${m === '?' ? 'aviso' : m === '✓' ? 'ok' : ''}" style="width:30px;height:30px">${m === '?' ? ic('info', 's') : m === '✓' ? ic('check', 's') : ic('reloj', 's')}</span><span><b>${esc(a)}</b><small>${esc(b)}</small></span></li>`).join('')}</ul>`).join('')}
    </div>`,
  };
})();
