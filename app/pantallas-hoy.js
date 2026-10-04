/* Hoy: Inicio (uno por rol), Pendientes, Mi cuenta y la revisión del prototipo. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, esc, fmt, dinero, ic, tag, puede } = A;

  const leadPend = { alerta: ['alerta', 'alerta'], aviso: ['aviso', 'reloj'], info: ['info', 'usuario'], escalado: ['lila', 'reloj'] };
  const filaPend = p => {
    const [tono, icono] = leadPend[p.tipo] || ['', 'info'];
    return `<li><button class="fila" data-abrir="pendiente:${p.id}"><span class="lead ${tono}">${ic(icono)}</span><span class="medio"><b>${esc(p.titulo)}</b><small>${esc(p.sub)}${p.tipo === 'escalado' ? '' : ' · ' + esc(p.de)}</small></span><span class="fin"><span class="muted nowrap">${esc(p.edad)}</span>${ic('derecha', 's chev')}</span></button></li>`;
  };

  // un solo ticket promedio en toda la app: venta neta ÷ pedidos, en dólares (lo usan el parte y Análisis)
  const TK = A.TICKET = { ayer: { venta: 3006, pedidos: 101 }, domPasado: { venta: 2863, pedidos: 97 }, semana: { venta: D.SEMANAS[D.SEMANAS.length - 1][1], pedidos: 672 } };
  const ticket = p => Math.round(p.venta / p.pedidos * 100) / 100;
  A.ticket = ticket;
  function parte() {
    const tA = ticket(TK.ayer), tP = ticket(TK.domPasado), cambio = (tA / tP - 1) * 100;
    return `<article class="parte" aria-label="El parte de la mañana">
      <div class="hoja-cab"><p class="etq">El parte de hoy · llegó a las 7:00 por WhatsApp</p><button class="enlace" data-abrir="kpi:parte">Cómo se calcula</button></div>
      <p class="parte-texto">Ayer domingo se vendieron <b>$ 3.006</b>, el 117 % de lo que hacía falta. Hoy la meta es <b>$ 2.573</b> para cubrir los costos del día.</p>
      <div class="medidor" role="img" aria-label="Ayer se vendió 117 % de la meta"><span style="width:100%"></span><i style="left:85.6%"></i></div>
      <p class="leyenda"><span>Ayer, $ 3.006</span><span>La raya marca la meta</span></p>
      <div class="mini-cifras">
        <button data-abrir="kpi:semana"><small>Domingo pasado</small><b>$ 2.863</b><small class="up">+5 %</small></button>
        <button data-abrir="kpi:anio"><small>Mismo domingo de 2025</small><b>$ 2.708</b><small class="up">+11 %</small></button>
        <button data-abrir="kpi:ticket"><small>Pedidos · ticket</small><b>${TK.ayer.pedidos} · ${dinero(tA)}</b><small class="${cambio >= 0 ? 'up' : 'down'}">${cambio >= 0 ? '+' : '−'}${fmt(Math.abs(cambio), 0)} % ticket</small></button>
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
    ? `<button class="salud" data-ir="salud">${ic('escudo', 's')}<span>El sistema está bien, con una cosa por mirar: la copia de Odoo sigue a mano los domingos. Respaldo de las 3:00 probado, WhatsApp conectado y saldo de IA para 21 días.</span></button>` : '';

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
          ${A.cifra({ etq: 'Lo fiscal esta semana', valor: D.OBLIGACIONES.filter(o => o.faltan >= 0 && o.faltan <= 6 && o.estado !== 'pagada' && !(o.sinPago && o.estado === 'declarada')).length, sub: 'el IVA vence mañana', ir: 'fiscal' })}
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
          <div class="pila c5">${pend}${A.tarjetaRendir ? A.tarjetaRendir(u.id) : ''}${eventosCompras()}</div>
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
    const s = D.SOCIOS.find(x => x.nombre === 'Luis Roberto'); const pr = A.porRendirDe ? A.porRendirDe(s.nombre) : 0;
    // que los retiros sean anticipo de utilidades es la propuesta de la Q5, todavía sin respuesta
    return `<article class="hoja"><div class="hoja-cab"><h2>${ic('cajachica')}Tus retiros este trimestre</h2></div>
      <dl class="kv"><div><dt>Retirado (anticipo de utilidades) ${tag('Propuesta (Q5)', 'aviso')}</dt><dd>${dinero(s.retirado, 'usd', 0)}</dd></div><div><dt>Plata por rendir</dt><dd>${dinero(pr, 'usd', 0)}</dd></div></dl>
      ${pr ? `<button class="enlace" data-ir="cajachica/rendir">Ver lo que falta rendir ${ic('derecha', 's')}</button>` : ''}
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
      parte: { t: 'Cómo se calcula la meta del día', b: [{ filas: [{ l: 'Costos fijos del mes', v: '$ 38.060' }, { l: 'Días de venta del mes', v: '30' }, { l: 'Lo variable (comida, comisiones)', v: '50,7 % de la venta' }, { l: 'Meta del día', v: '<b>$ 2.573</b>' }] }, { html: '<p class="muted">Meta = costos fijos ÷ días ÷ (1 − lo variable). Los costos fijos los escribe Alejandro en Parámetros. Las ventas salen del resumen diario del POS de Odoo.</p>' }] },
      semana: { t: 'Ayer contra el domingo pasado', b: [{ filas: [{ l: 'Domingo 4 oct', v: '$ 3.006' }, { l: 'Domingo 27 sep', v: '$ 2.863' }, { l: 'Diferencia', v: '<span class="up">+$ 143 (+5 %)</span>' }] }] },
      anio: { t: 'Ayer contra el mismo domingo de 2025', b: [{ filas: [{ l: 'Domingo 4 oct 2026', v: '$ 3.006' }, { l: 'Domingo 5 oct 2025', v: '$ 2.708' }, { l: 'Diferencia', v: '<span class="up">+$ 298 (+11 %)</span>' }] }, { html: '<p class="muted">Se compara el mismo día de la semana. La historia de Odoo arranca el 1 de octubre de 2025.</p>' }] },
      // la misma cuenta en el parte y en Análisis (venta neta ÷ pedidos, en dólares): el parte usa el día de ayer y Análisis, la semana
      ticket: { t: 'Ticket promedio', b: [{ filas: [
        { l: 'Ayer, domingo 4 oct', v: `${dinero(ticket(TK.ayer))} <small class="tenue">${dinero(TK.ayer.venta, 'usd', 0)} ÷ ${TK.ayer.pedidos} pedidos · el del parte</small>` },
        { l: 'Domingo 27 sep', v: `${dinero(ticket(TK.domPasado))} <small class="tenue">${dinero(TK.domPasado.venta, 'usd', 0)} ÷ ${TK.domPasado.pedidos} pedidos</small>` },
        { l: 'Esta semana (28 sep – 4 oct)', v: `${dinero(ticket(TK.semana))} <small class="tenue">${dinero(TK.semana.venta, 'usd', 0)} ÷ ${TK.semana.pedidos} pedidos · el de Análisis</small>` },
        { l: 'Pedidos ayer', v: `${TK.ayer.pedidos} <small class="tenue">${fmt((TK.ayer.pedidos / TK.domPasado.pedidos - 1) * 100, 0)} % más que el domingo pasado</small>` }] },
        { titulo: 'Cómo se calcula', html: `<p><b>Ticket promedio = venta neta ÷ pedidos.</b> La misma cuenta en las dos pantallas: el parte usa el día de ayer y Análisis, la semana.</p><ul class="tiempo"><li><time>1</time><span><b>Venta neta:</b> lo cobrado en el POS, sin IVA, ya restados los anulados, las devoluciones, los descuentos y las cortesías. Es la misma venta del parte. El 10 % de servicio no entra ${tag('Por confirmar', 'aviso')}</span></li><li><time>2</time><span><b>Pedidos:</b> las cuentas cerradas en el POS (mesa, para llevar y delivery). No cuentan los consumos de los socios ni del personal.</span></li><li><time>3</time><span><b>En dólares:</b> cada venta a la tasa BCV de su día, aunque la carta esté en euros.</span></li></ul>` }] },
    }[id];
    return { titulo: k.t, sub: id === 'ticket' ? 'Indicador · parte de la mañana y Análisis' : 'Parte de la mañana', mod: 'analisis', bloques: k.b, acciones: S.ruta === 'analisis' ? [] : [{ txt: 'Ver en Análisis', acc: 'ir-a', arg: 'analisis', icono: 'analisis' }] };
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
    ['Para decidir (Alejandro) · dinero y socios', [
      ['?', 'Los $ 500 de consumo de los socios', '¿Son $ 500 cada uno o entre los dos? Propuesta: a precio de carta; lo que pase del tope se suma a los retiros de ese socio; lo que sobra no se acumula; las invitaciones a proveedores o clientes no cuentan.'],
      ['?', 'Socios: su parte, los retiros y el reparto', '¿Con qué parte está cada socio y las cuentas a nombre de Eliana cuentan como del negocio (Q4)? Propuesta para la Q5: los retiros son anticipos de utilidades, se registran el mismo día, se avisa al otro socio y se liquidan cada trimestre. Falta el tope de retiro por socio al mes y si el reparto lo aprueban los dos con su código. En el prototipo la parte de cada uno sale «por confirmar».'],
      ['?', 'Retiros de más de $ 200', 'La propuesta Q1 dice que los apruebes tú. El retiro de Luis de $ 500 quedó registrado al instante. ¿Pide tu aprobación o no?'],
      ['?', 'Fondo de cada caja y caja chica', '¿Con cuánto arranca cada caja, en $ y en Bs, y a qué tasa recibe dólares si la carta está en euros (Q2)? ¿Se pagan gastos desde la caja (Q3)? Propuesta: un fondo fijo en $ y otro en Bs que defines tú, el resto a la bóveda cada noche, y una caja chica aparte de $ 150 con foto de cada gasto y reposición semanal.'],
      ['?', 'El grupo de WhatsApp de la bóveda', '¿Cuál es y quiénes están (Q9)? Propuesta: un grupo nuevo solo con los socios y quien custodia, con el bot dentro. Hasta que exista se muestra «por crear», como el de mesoneros.'],
      ['?', 'Pagos sin factura de junio a agosto', 'En Odoo hay pagos de esos meses sin factura a nombre de gente de la casa, y hay que saber qué fue cada uno (Q6). Propuesta: una sesión con Jose para clasificarlos uno por uno: traspaso, retiro, reintegro o pago a un proveedor.'],
      ['?', 'Dónde se ve lo pagado por tasa', 'Cada pago guarda su tasa (dólar BCV, euro BCV o USDT) y los lunes se ve cuánto toca pagar en cada una, con su promedio, las comisiones y lo que se ganó o perdió por la tasa (29-ago). El PDF del grupo queda como hoy. Propuesta: en la pantalla del lunes y en un mensaje solo para ti, a las 6:00 y al terminar de pagar.'],
      ['?', 'Cambio de cuenta de un proveedor', 'Lo cambia Jose con su código y te avisa. En Pagos del lunes la cuenta queda «por verificar» hasta que confirmes por teléfono. ¿Hace falta tu aprobación además?'],
      ['?', 'Quién carga las compras en Odoo', '¿Quién carga hoy las órdenes de compra, las recepciones y las facturas: Jose o Marisel (Q8)? Propuesta: aclararlo antes de la fase 9; quien recibe la mercancía pone el precio real.'],
    ]],
    ['Para decidir (Alejandro) · personal y nómina', [
      ['?', 'Préstamos al personal', 'Propuesta: los préstamos los apruebas tú y los adelantos de hasta $ 60, Jose, siempre que los anote otra persona: quien prepara no aprueba, y si los anota él, te llegan a ti. Sin intereses, hasta 12 cuotas, y entre todos los descuentos no más de un tercio de lo que gana en la quincena (el tope legal lo confirman Cecilia o el abogado). Si alguien se va, el saldo sale de su liquidación.'],
      ['?', 'La base de las prestaciones', 'Con la regla del 29-ago la nómina formal sale casi en cero: se toma solo el mínimo de Bs 130 y queda fuera el 10 %, que por ley cuenta para prestaciones, vacaciones y utilidades. La interna se calcula sobre $ 100 al mes (mínimo + cestaticket + un margen de $ 60 por confirmar), y su recibo pone todo como «Salario». Revisarlo con Cecilia y el abogado: si el 10 % entra en la base y qué conceptos lleva el recibo interno.'],
      ['?', 'Quincena de quien está de vacaciones', 'El prototipo le paga la quincena completa y además, al empezar, esos mismos días más el bono: los días salen dos veces. Propuesta: sigue cobrando su quincena y al empezar recibe solo el bono vacacional. Confirmarlo con Cecilia.'],
      ['?', 'Faltas y extras en la nómina formal', 'El incremento del cestaticket es fijo (29-ago), pero el prototipo calcula el día con todo lo que gana la persona: una falta le quita parte del incremento. Con el salario legal, faltas y extras salen en céntimos. Decidirlo con el abogado antes del motor de nómina.'],
      ['?', 'El 10 %: nuevos, vacaciones y reposos', 'Quien entra arranca en 0 % sin regla de cuándo empieza a ganar, y el prototipo le recorta la parte a todo el que no trabajó el período completo, también por vacaciones o reposo. ¿Desde cuándo gana un nuevo y qué pasa en vacaciones y reposos? Verlo con Cecilia y el abogado.'],
      ['?', 'Cómo se reparten las propinas', 'Hoy se anotan por mesonero en el cierre de caja y se pagan los lunes; el prototipo lo deja «por confirmar». Propuesta: seguir como hoy, por mesonero; Jose o Andreina reparten y tú das el visto final cada lunes (te llega como pendiente).'],
      ['?', 'Cumpleaños del personal', '¿Se da el día libre o un detalle? ¿Se avisa al grupo del personal ese día? Hoy solo avisa a RRHH y a la supervisora 3 días antes.'],
      ['?', '¿Luis ve los sueldos?', 'La regla dice que solo dueño, RRHH y contabilidad. En el prototipo Luis ve la nómina agrupada, sin sueldos ni préstamos por persona.'],
      ['?', 'Nómina en 3 pasos necesita 3 personas', 'Prepara Andreina, revisa Jose, apruebas tú. Andreina todavía no ha entrado: sin ella no hay quien prepare.'],
    ]],
    ['Para decidir (Alejandro) · permisos, reservas y seguridad', [
      ['?', '¿Eliana edita o solo ve?', 'Hoy aparece «por confirmar», con permiso para editar lo operativo del dinero. El suplente para aprobar, por ahora, eres tú mismo (3-oct): otro se nombra cuando la app esté andando.'],
      ['?', 'Luis «solo ve», pero registra su retiro de la bóveda', 'Así lo decidiste el 3-oct. Pero en el prototipo Luis también firma como testigo del conteo de la bóveda y puede dar crédito a clientes hasta $ 100 (Q7): ¿se quedan esas dos? En el prototipo, lo que se lleva «por rendir» lo cierran Jose o Alejandro a su nombre, con las fotos que mande Luis.'],
      ['?', 'Quién cambia los parámetros', 'Hoy contabilidad puede cambiar casi todos sin código ni aviso: desde cuánto un gasto pide aprobación hasta el tope de consumo de los socios o el bloqueo por claves malas. Los costos fijos de la meta del día ya se decidió que los pones tú. Propuesta: Jose edita los catálogos (categorías, métodos de pago) y el resto lo cambias tú.'],
      ['?', 'Quién se encarga de los respaldos', 'Falta quién hace la copia de cada noche fuera del servidor y la prueba mensual de recuperarla. Propuesta: el programador, por unos $ 5 al mes, y la llave para abrir la copia la guardas tú, fuera de línea.'],
      ['?', 'Quién toma las reservas', 'Propuesta: Patricia, la supervisora, con un usuario que solo ve el calendario. Hay que crear el grupo «Mesoneros del restaurante» en WhatsApp y meter al número del bot. ¿Hay salón para eventos privados? ¿Abono de $ 5 por persona para grupos de 10 o más?'],
      ['?', '¿Jose ve los fueros?', 'Los expedientes, la salud y los fueros (por ejemplo, el maternal) quedaron solo para ti y RRHH. ¿Contabilidad necesita ver los fueros para preparar las liquidaciones? Por ahora no los ve.'],
      ['?', 'Bloqueo por claves malas', 'Propuesta: 5 intentos y 15 minutos de bloqueo, y te avisa. No estaba definido.'],
    ]],
    ['Para decidir (Alejandro) · finanzas nuevas', [
      ['?', 'Partir la fase 4 en dos', 'La investigación de finanzas propone adelantar a la fase 4 «comida + personal» (estaba en la 11) y «cuánto deja cada plato» (estaba en la 12), y anotar la merma junto al termómetro. La fase quedaría muy cargada: 4a para comida y precios, 4b para controles y cierre de la semana.'],
      ['?', 'Meta de comida + personal', '¿Qué % quieres? La referencia de un restaurante es 60-65 %; mientras decides, la app compara contra tu propia historia. ¿Y la venta se mide con el 10 % de servicio dentro o fuera?'],
      ['?', 'Colchón de caja', '¿Cuántos días de salidas quieres tener siempre guardados, y dónde (bóveda en $ o USDT)? Sin ese número, la plata libre y las próximas 13 semanas salen sin semáforo. Lo de impuestos y diciembre, ¿se aparta solo en la app o en una cuenta aparte con un traspaso semanal?'],
      ['?', 'Conteo de control a ciegas', 'Un conteo de 8 a 12 artículos caros, hecho sin ver cuánto «debería haber» y por alguien que no recibe la mercancía. Cambia lo decidido el 3-oct (los conteos solo en Odoo), aunque no reemplaza el inventario oficial. ¿Quién recibe y pesa la carne? No puede ser compras.'],
      ['?', 'Merma y comida del personal', 'Hoy no se anota lo que se bota en cocina ni la comida del turno. La comida del personal, ¿son platos de la carta o una olla aparte? ¿Cocina anota la merma con un usuario propio o con fotos a un grupo? ¿Qué es un «servicio» y qué es un «trago» en la barra?'],
      ['?', 'Pedirle cambios en Odoo al programador', 'Entrada con clave para cada empleado, que solo los supervisores cambien precios, un método «Cortesía» y una lista de motivos para anular y devolver. Así se puede ver lo que se deja de cobrar por tipo y por persona (solo tú y la supervisión).'],
      ['?', 'Caja por turno y conteo sorpresa', '¿Una sesión del POS por turno, para saber de quién es cada descuadre, o el cierre del día anotando quién tuvo la gaveta? ¿Un socio hace cada mes un conteo sorpresa de la bóveda?'],
      ['?', 'Tope de fiado y margen por plato', '¿Cuánto es lo máximo que nos pueden deber todos los clientes juntos y solo tú das una deuda por perdida? ¿Qué margen quieres por categoría de plato y cuándo te avisa la app si se pierde?'],
    ]],
    ['Para decidir (Alejandro) · cómo se usa', [
      ['?', 'Firmar con código o con la cara', 'Hoy cada firma pide el código de 6 números: un lunes son unos 6 seguidos. Propuesta: firmar con Face ID o la huella del teléfono, con el código como respaldo. Otra opción: después de un código, 5 minutos sin pedirlo, salvo bóveda, permisos y cuentas de proveedores.'],
      ['?', 'Motivo escrito para todo o solo donde importa', 'Hoy hasta mover una mesa pide escribir un motivo. Propuesta: tres niveles. Sin motivo lo que solo describe (mesa, notas, cargo); «Deshacer» y «Reabrir» en lo de un toque; motivo con botones y código en plata, cuentas, sueldos y lo ya cerrado.'],
      ['?', 'Mientras Andreina no entra', '¿Quién clasifica las faltas y prepara la quincena? Propuesta: Jose como suplente, con el permiso que vuelve a Andreina cuando active su cuenta. Si no, te llega a ti, o la nómina del 15 se queda esperando.'],
      ['?', 'Por dónde te llegan las firmas pendientes', 'Propuesta: por WhatsApp del bot, como el parte de las 7:00, con un recordatorio cada 4 horas en horario de trabajo. Lo urgente (lo que vence hoy, el lote del lunes) también por ntfy, que suena aunque silencies WhatsApp.'],
      ['?', 'Cuánta venta contar hasta la nómina', 'Para «¿Llegamos a la nómina?»: propuesta, la venta más baja del mismo día de la semana en las últimas 4 semanas. La meta de comida + personal es la misma pregunta de «finanzas nuevas».'],
      ['?', 'Quién confirma los reportes Z', '¿Solo Jose, o Jose o Cecilia? En los dos casos, a Cecilia le sale «Pedir a Jose los Z que faltan», porque subirlos es trabajo del local.'],
      ['?', 'A qué grupo se publica el horario', '¿Un grupo de WhatsApp por área (cocina, servicio, caja, delivery, seguridad) o uno solo del personal? Hoy no existe ninguno, y para mencionar a cada persona hace falta su teléfono en la ficha.'],
      ['?', 'Quién apaga los avisos automáticos de reservas', '¿Quien toma las reservas, con una confirmación y quedando en el registro, o solo tú desde Parámetros?'],
    ]],
    ['Para revisar (Jose)', [
      ['?', 'Revisar el prototipo y dar el visto bueno', 'Antes de programar las primeras pantallas hace falta el visto bueno de Jose. Propuesta: que lo recorra con «Ver como» Jose y diga qué cambiaría.'],
    ]],
    ['Agregado ahora: recursos humanos, calendario y consumos', [
      ['✓', 'Recursos humanos completo (6 pantallas)', 'Personal (ficha con cumpleaños, contrato, cuenta, salud y expediente; avisos; altas y egresos; protección y disciplina) · Asistencia y horas (horario de la semana, horas trabajadas, faltas y justificativos, redobles y días extra) · Vacaciones y reposos (libro de vacaciones, quién está fuera, justificativos médicos, permisos) · Nómina (recibo de pago por concepto, 10 % del mes, propinas, recibos firmados) · Préstamos y descuentos · Prestaciones y liquidaciones.'],
      ['✓', 'Préstamos en cuotas', 'Se registra, lo apruebas con tu código, se paga desde una cuenta y cada quincena la cuota se descuenta sola. Las cuotas se ven como casillas; si alguien falta, la cuota se corre al final. Quien se va lo paga con su liquidación.'],
      ['✓', 'Consumos', 'Los de los socios, en Caja chica y socios, con el tope de $ 500 al mes. Los del personal, en Préstamos y descuentos: corte el 27, se descuentan en la 2.ª quincena. Ambos llegan del POS.'],
      ['✓', 'Calendario', 'El mes con capas (reservas, eventos, personal, fiscal y pagos), las reservas que avisan al grupo de mesoneros, los eventos y el calendario del personal: vacaciones, contratos que vencen y cumpleaños.'],
      ['✓', 'Usuaria nueva propuesta: Patricia (reservas)', 'Cambia «Ver como» a Patricia para ver lo que vería la supervisora: solo el calendario.'],
    ]],
    ['Corregido el 4 de octubre', [
      ['✓', 'Lo cerrado ya no se edita', 'Una factura pagada, una obligación declarada, una propina pagada o un gasto registrado se corrigen con un movimiento al revés, con motivo y código. Al enviar el lote del lunes, sus facturas quedan pagadas.'],
      ['✓', 'El lunes resta la retención del IVA y el cuadre suma las capturas', 'La parte retenida va al SENIAT, no al proveedor. Si la lista menos lo no pagado no da igual a lo que dicen las capturas, aprobar pide una nota. Cada proveedor puede tener varias cuentas, con su titular.'],
      ['✓', 'Pagar la nómina como a los proveedores', 'Persona por persona, con el banco y la captura casada. Las corridas formal, interna y del 10 % salen separadas, con el premio del mes. El recibo trae los recargos de noche, domingo y feriado.'],
      ['✓', 'Fiscal en bolívares y cada aporte con su base', 'Pensiones, IVSS, FAOV, INCES y la patente (con su mínimo) se calculan cada uno con su base, y el monto es el mismo en todas las pantallas. Libros y retenciones en Bs a la tasa de cada día. Nuevas en el calendario: RNET, aseo, ISLR anual, asamblea y estados financieros.'],
      ['✓', 'Cada quien ve lo suyo', 'Luis y Eliana ya no ven préstamos, finiquitos ni soportes médicos por persona. Expedientes y salud, solo tú y RRHH. Jose y Andreina anotan lo acordado de las horas.'],
      ['✓', 'Quien prepara no aprueba', 'Un adelanto lo aprueba alguien distinto de quien lo anota; los costos fijos solo los cambias tú; cada obligación fiscal la revisa otra persona. Descargar cualquier archivo pide el código.'],
      ['✓', 'Bóveda y socios', 'El conteo de la bóveda es a ciegas: cada uno cuenta sin ver lo esperado. Lo que se lleva «por rendir» se cierra con factura o vuelto. Cada socio tiene su cuenta de aportes y préstamos.'],
      ['✓', 'Propuestas marcadas como propuestas', 'Lo que espera tu respuesta (fondo de caja, parte de cada socio, anticipo de utilidades, grupo de la bóveda, rol de Eliana) sale como «Propuesta» o «Por confirmar». Un solo ticket promedio en toda la app.'],
      ['✓', 'Fechas y cifras del SENIAT', 'Revisado contra las Gacetas: las pensiones de agosto vencían el 16 de septiembre, no el 30; los licores pagan 16 % (el 31 % es para bienes de lujo); Grandes Patrimonios (14 oct y 12 nov) y el impuesto del aviso del toldo ya están en Configuración; el lunes 26 de octubre no abren los bancos. Cinco preguntas nuevas para Cecilia, dos urgentes.'],
    ]],
    ['Agregado el 4 de octubre', [
      ['✓', 'Entrar con usuario, clave y código', 'Más la invitación de alguien nuevo (Andreina): clave, código con el cuadro y 8 códigos de respaldo. Modo aprendiz de 14 días.'],
      ['✓', 'Cada persona ve solo lo suyo', 'Cambia «Ver como» arriba. Menú, Inicio y pestañas cambian por persona. Luis y Cecilia ven el aviso «Solo lectura» donde no editan.'],
      ['✓', 'Todo se abre; lo cerrado no se edita', 'Las filas, cifras y tarjetas abren su ficha a la derecha (quedan unos pocos totales que solo informan). Con permiso, «Editar» pide el motivo y queda en el registro de cambios. Lo pagado, declarado o cerrado no se edita: se corrige con un movimiento al revés, una declaración sustitutiva o una nómina de reemplazo.'],
      ['✓', 'Módulo Fiscal para Cecilia', 'Calendario SENIAT con las fechas reales del RIF terminado en 4, hoja de IVA, reportes Z, libros, retenciones, parafiscales, máquina fiscal, permisos, paquete del mes y sus preguntas.'],
      ['✓', 'Parámetros', 'Negocio y sede, cuentas, tasas y valores legales, catálogos, reglas, antifraude, avisos, nómina y fiscal.'],
      ['✓', 'Usuarios y permisos', 'Quién entra y qué ve (matriz editable), quién aprueba qué, invitar, quitar acceso, cuentas de los bots.'],
      ['✓', 'Computadora en pantalla completa', 'Índice a la izquierda, tablas completas y la ficha a la derecha. Botón «Pantalla completa» arriba.'],
      ['✓', 'Módulos que faltaban', 'Clientes y cobranza, Proveedores y facturas (ajustes y devoluciones), Bancos y conciliación, Caja chica y socios, Personal y nómina, Documentos, Análisis, Registro de cambios y Salud del sistema.'],
      ['✓', 'Correcciones', 'Caja con sus 4 estados reales (confirmado, por confirmar, avisado, descartado). IVA vence el martes 6, no el viernes 9. La lista del lunes dice que viene de la copia a mano del domingo. El termómetro muestra la cobertura.'],
    ]],
    ['Queda para después (no bloquea la fase 0)', [
      ['·', 'Cerrar mi caja en el teléfono', 'Fase 5. Hoy el cierre sigue en papel.'],
      ['·', 'Reloj biométrico y motor de nómina', 'Espera la muestra del Excel del reloj y la lista de quiénes son los 10 de la nómina formal. Las horas que se ven en Asistencia son un ejemplo. Ojo: el motor suma los recargos de noche (30 %) y de domingos y feriados (50 %), que la nómina de hoy no trae, así que va a costar más.'],
      ['·', 'Mensajes al grupo de mesoneros', 'Se conectan con el bot cuando exista el grupo. El recordatorio al cliente se manda a mano desde el WhatsApp del restaurante.'],
      ['·', 'Fase 9: compras, consumos y comparación con Odoo', 'Libro de compras, TXT de IVA y XML de ISLR. También los consumos de los proveedores en el restaurante, que se descuentan de su pago, y «Lo que no cuadra con Odoo», que dirá cuándo el paralelo lleva 2 semanas cuadrando. Espera el candado de Odoo.'],
      ['·', 'Resultados, cuánto deja cada plato y compras', 'Fases 11 y 12. «Cuánto deja cada plato» usa las facturas que corrige Jose y las recetas ya arregladas (o pasa a la fase 4, si así lo decides).'],
      ['·', 'Campañas a clientes con su permiso', 'Fase 8.'],
      ['·', 'Clave para ver las fotos del bot', 'La Caja del día (fase 1) necesita una clave que solo deje mirar las fotos que guarda el bot. La pide Alejandro al programador.'],
      ['·', 'Copia de la base casi al minuto', 'Antes de usar de verdad la bóveda y la nómina, además de la copia de cada noche hace falta una que se guarde a cada rato. La monta el programador con el servidor.'],
    ]],
    ['Ideas de finanzas para más adelante', [
      ['·', 'Precios de la carta en euros contra costos en dólares', 'Cuánto vale hoy 1 € de la carta en dólares, cuánto margen perdió cada plato desde su último ajuste y un simulador antes de cambiar un precio. Fase 4.'],
      ['·', 'Merma con foto y recuento a ciegas', 'La merma evitable se anota con foto, motivo y quién; carne y licores se recuentan sin ver lo esperado, y cada ajuste lleva su motivo. Fase 4, después de pesar una vara de cada corte.'],
      ['·', 'Pesar la carne al recibir', 'Quien recibe pesa y sube la foto de la balanza; en la lista del lunes se ve si llegó completa. Fases 2 a 9.'],
      ['·', 'Lo que no se cobró en el POS', 'Anulados, devoluciones, descuentos y cortesías aparte de la venta, por tipo y, cuando Odoo lo permita, por persona. Fase 4.'],
      ['·', 'Revisión del mes del dueño', '15 minutos con tu código: diferencias del banco aclaradas a mano, lo que contabilidad aprobó sola, fichas cambiadas y 5 pagos al azar con su comprobante. Fase 2.'],
      ['·', 'Cierre de caja a ciegas', 'La cajera guarda su conteo antes de ver lo esperado; faltantes y sobrantes se suman aparte, en dólares y por persona. Fase 5. El conteo de la bóveda ya es a ciegas en el prototipo.'],
      ['·', 'Cada gasto con su renglón y un presupuesto', 'Luz, gasoil, gas, mantenimiento, publicidad… cada pago lleva su renglón desde la fase 2, y con eso sale el presupuesto y el estado de resultados sin trabajo extra.'],
      ['·', 'Venta por hora contra horas pagadas', 'Debajo de cada día del horario, la venta esperada y los $ por hora, con aviso si se anota un redoble en un día flojo. Fase 4.'],
      ['·', 'Cerrar la semana', 'Al cerrar, los números quedan congelados y lo que llegue tarde entra como «ajuste de semanas anteriores». Fase 4.'],
      ['·', 'Bolívares parados y compra de dólares', 'Cuánto se pierde por tener bolívares esperando y cuánto se pagó de más en cada compra de dólares o USDT. Fases 2 a 10.'],
      ['·', 'Cuánto cuesta cobrar con cada forma de pago', 'La comisión de cada una (el punto, partido en débito y crédito) y los días hasta poder usar la plata. Tarifas desde la fase 0; la tabla, en la 5.'],
      ['·', 'Plata libre y las próximas 13 semanas', 'Lo que hay menos lo que no es nuestro (IVA, retenciones, propinas, el 10 %) y lo comprometido, y una proyección que avisa 2-3 semanas antes si la plata no alcanza. Fases 4 y 10.'],
      ['·', 'Apartar impuestos y diciembre', '«De esto ya no es nuestro»: impuestos y la cuota de diciembre, también al sacar plata de la bóveda y al aprobar los pagos del lunes. Fases 3 y 10.'],
      ['·', 'Fiado, plazos y depósito', 'Tope total de fiado, plazo pactado contra días reales de pago por proveedor y cuántos días de costo hay parados en el depósito. Fases 2, 4 y 8.'],
      ['·', 'Cuánto deja cada evento', 'Venta menos comida, gastos y personal de cada feria o evento privado, y cuánto hay que vender para no perder antes de inscribirse. Fase 4.'],
    ]],
  ];

  PANT.revision = {
    titulo: 'Lo que falta', grupo: 'Hoy', icono: 'lista', mod: 'inicio', oculta: true, libre: true,
    render: () => `<div class="pagina">${A.cab('Revisión del prototipo · 5 de octubre', 'Lo que falta y lo que cambió', 'Se comparó el prototipo con todo lo decidido en el esquema, el repaso y el registro de decisiones. Primero va lo que tiene que decidir Alejandro y lo que tiene que revisar Jose; después, lo que se agregó, lo que se corrigió y lo que queda para después.')}
      ${REV.map(([t, items]) => `<div class="sec"><h2>${esc(t)}</h2></div><ul class="lista revision">${items.map(([m, a, b]) => `<li><span class="lead ${m === '?' ? 'aviso' : m === '✓' ? 'ok' : ''}" style="width:30px;height:30px">${m === '?' ? ic('info', 's') : m === '✓' ? ic('check', 's') : ic('reloj', 's')}</span><span><b>${esc(a)}</b><small>${esc(b)}</small></span></li>`).join('')}</ul>`).join('')}
    </div>`,
  };
})();
