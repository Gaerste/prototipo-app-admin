/* Hoy: Inicio (uno por rol), Pendientes, Mi cuenta y la revisión del prototipo. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, esc, fmt, dinero, ic, tag, puede } = A;

  const leadPend = { alerta: ['alerta', 'alerta'], aviso: ['aviso', 'reloj'], info: ['info', 'usuario'], escalado: ['lila', 'reloj'] };
  // el pendiente del cambio de un lote dice la diferencia en vivo (lo que Jose va cambiando) · cada quien lee el título de su paso
  const subPend = p => (p.lote && A.resumenCambio && !p.hecho ? A.resumenCambio(p.lote, A.subPendDe(p)) : A.subPendDe(p));
  const filaPend = p => {
    const [tono, icono] = leadPend[p.tipo] || ['', 'info'];
    return `<li><button class="fila" data-abrir="pendiente:${p.id}"><span class="lead ${A.enEspera(p) ? '' : tono}">${ic(icono)}</span><span class="medio"><b>${esc(A.tituloPend(p))}</b><small>${esc(subPend(p))}${p.tipo === 'escalado' ? '' : ' · ' + esc(p.de)}</small></span><span class="fin">${A.enEspera(p) ? tag('En espera', '') : `<span class="muted nowrap">${esc(p.edad)}</span>`}${ic('derecha', 's chev')}</span></button></li>`;
  };

  // un solo ticket promedio en toda la app: venta neta ÷ pedidos, en dólares (lo usan el parte y Análisis)
  const TK = A.TICKET = { ayer: { venta: 3006, pedidos: 101 }, domPasado: { venta: 2863, pedidos: 97 }, semana: { venta: D.SEMANAS[D.SEMANAS.length - 1][1], pedidos: 672 } };
  const ticket = p => Math.round(p.venta / p.pedidos * 100) / 100;
  A.ticket = ticket;
  // la venta del mismo domingo de 2025 y la meta del día (costos fijos del mes ÷ 30 días ÷ (1 − lo variable), como en «Cómo se calcula la meta del día»)
  const ANIO = 2708, VARIABLE = 0.507; const meta = () => Math.round((D.PARAMS.costosFijos || 38060) / 30 / (1 - VARIABLE));
  function parte() {
    const tA = ticket(TK.ayer), tP = ticket(TK.domPasado), cambio = (tA / tP - 1) * 100, cambioP = (TK.ayer.pedidos / TK.domPasado.pedidos - 1) * 100;
    const pct = c => `<small class="${c >= 0 ? 'up' : 'down'}">${c >= 0 ? '+' : '−'}${fmt(Math.abs(c), 0)} %</small>`;
    return `<article class="parte" aria-label="El parte de la mañana">
      <div class="hoja-cab"><p class="etq">El parte de hoy · llegó a las 7:00 por WhatsApp</p><button class="enlace" data-abrir="kpi:parte">Cómo se calcula</button></div>
      <p class="parte-texto">Ayer domingo se vendieron <b>${dinero(TK.ayer.venta, 'usd', 0)}</b>, el 117&nbsp;% de lo que hacía falta. Hoy la meta es <b>${dinero(meta(), 'usd', 0)}</b> para cubrir los costos del día.</p>
      <div class="medidor" role="img" aria-label="Ayer se vendió 117 % de la meta"><span style="width:100%"></span><i style="left:85.6%"></i></div>
      <p class="leyenda"><span>Ayer, ${dinero(TK.ayer.venta, 'usd', 0)}</span><span>La raya marca la meta</span></p>
      <div class="mini-cifras">
        <button data-abrir="kpi:semana"><small>Domingo pasado</small><b>${dinero(TK.domPasado.venta, 'usd', 0)}</b><small class="up">+5 %</small></button>
        <button data-abrir="kpi:anio"><small>Mismo domingo de 2025</small><b>${dinero(ANIO, 'usd', 0)}</b><small class="up">+11 %</small></button>
        <button data-abrir="kpi:ticket"><small>Pedidos ayer</small><b>${TK.ayer.pedidos}</b>${pct(cambioP)}</button>
        <button data-abrir="kpi:ticket"><small>Ticket promedio</small><b>${dinero(tA, 'usd')}</b>${pct(cambio)}</button>
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
      <p style="font-size:14px">La comida costó ${dinero(2180, 'usd', 0)} más de lo que dicen las recetas. Lo que más explica la diferencia: punta de ganso, queso telita y pernil.</p>
      <button class="enlace" data-ir="analisis/termometro">Ver el termómetro completo ${ic('derecha', 's')}</button>
    </article>`;
  }
  function estaSemana() {
    const items = [];
    // dice lo mismo que la barra del lote en el teléfono: la duda por resolver, «Aprobar y enviar 8 pagos · $ X · 4 sin pagar» o «Enviado»
    if (puede('pagos')) { const el = A.estadoLunes(); items.push(`<li><button class="fila" data-ir="pagos/lunes"><span class="lead${el.tono ? ' ' + el.tono : ''}">${ic('pagos')}</span><span class="medio"><b>Pagos del lunes (hoy)</b><small>${esc(el.txt)}</small></span><span class="fin">${tag(el.tag[0], el.tag[1])}</span></button></li>`); }
    // el IVA y la nómina con su monto: el del IVA sale de su hoja (el mismo de Fiscal) y el de la nómina es el estimado de la pre-nómina
    const o1 = D.OBLIGACIONES.find(o => o.id === 'o1');
    if (puede('fiscal') && o1) items.push(`<li><button class="fila" data-abrir="obligacion:o1"><span class="lead aviso">${ic('fiscal')}</span><span class="medio"><b>IVA de la 2.ª quincena de septiembre</b><small>Vence mañana, martes 6 · ${esc(A.estadoTxt(o1.estado).toLowerCase())}${o1.monto ? (['declarada', 'pagada'].includes(o1.estado) ? ' · el monto declarado, en dólares a la tasa de hoy' : ' · monto estimado, en dólares a la tasa de hoy') : ''}</small></span><span class="fin-col">${tag('Mañana', 'aviso')}${o1.monto ? `<span class="monto">${dinero(o1.monto, 'bs', 0)}</span><small class="equiv">≈ ${dinero(o1.monto / D.TASA.usd, 'usd', 0)}</small>` : ''}</span></button></li>`);
    if (puede('fiscal')) items.push(`<li><button class="fila" data-abrir="permiso:pl1"><span class="lead aviso">${ic('escudo')}</span><span class="medio"><b>Permiso de bomberos</b><small>Vence el 21 de octubre</small></span><span class="fin">${tag('Renovar', 'aviso')}</span></button></li>`);
    const N = D.NOMINA.proxima;
    if (puede('nomina')) items.push(`<li><button class="fila" data-ir="nomina"><span class="lead">${ic('nomina')}</span><span class="medio"><b>Nómina del jueves 15</b><small>${N.personas} personas · falta el reporte del reloj</small></span><span class="fin"><span class="fin-col"><span class="monto">${dinero(N.formal.total + N.interna.total, 'usd', 0)}</span><small class="equiv">estimado</small></span>${ic('derecha', 's chev')}</span></button></li>`);
    if (puede('calendario')) {
      const hoyR = D.RESERVAS.filter(x => x.d[0] === 5 && x.d[1] === 9 && !['cancelada', 'no_vino'].includes(x.estado));
      if (hoyR.length) items.push(`<li><button class="fila" data-ir="calendario/reservas"><span class="lead info">${ic('cubiertos')}</span><span class="medio"><b>Reservas de hoy</b><small>${hoyR.length} reservas · ${hoyR.reduce((a, x) => a + x.personas, 0)} personas · la primera a las ${hoyR.map(x => x.hora).sort()[0]}</small></span><span class="fin">${ic('derecha', 's chev')}</span></button></li>`);
      A.rh.activos().filter(e => A.rh.proxCumple(e) === 0).forEach(e => items.push(`<li><button class="fila" ${puede('personal') ? 'data-abrir="empleado:' + e.id + '"' : 'data-ir="calendario/personal"'}><span class="lead lila">${ic('pastel')}</span><span class="medio"><b>Hoy cumple ${esc(e.nombre)}</b><small>${esc(e.cargo)} · cumple ${A.rh.cumpleAnios(e)}</small></span><span class="fin">${tag('Hoy', 'lila')}</span></button></li>`));
    }
    return items.length ? `<div class="sec"><h2>Esta semana</h2></div><ul class="lista">${items.join('')}</ul>` : '';
  }
  /* ---------- ¿Llegamos a la nómina? ----------
     Una hoja de libro que cubre hasta la próxima nómina (el jueves 15): lo que hay hoy (bancos, Zelle y Binance, en dólares a la tasa de hoy)
     + la venta prudente hasta el 15 (propuesta: la más baja del mismo día en las últimas 4 semanas) + los cobros a crédito que vencen − lo que
     falta del lunes de hoy − el lote del próximo lunes (propuesta: el más alto de los últimos 4) − lo fiscal con fecha − la nómina estimada del
     15 = lo que quedaría, en rojo solo si no alcanza. Debajo: si los bolívares solos no alcanzan, cuántos faltarían; y, solo para quien ve la
     bóveda, lo que suma la bóveda (el parte de WhatsApp nunca la menciona). Cada renglón abre «Cómo se calcula», con el detalle por moneda.
     Mientras los bancos no estén conectados, la hoja dice solo «Lo que sale hasta el 15», con sus montos, sin «Quedaría». */
  const LL = { sinBancos: false }; // solo en el prototipo: así se ve antes de conectar los bancos
  const r2 = n => Math.round(n * 100) / 100;
  const hechaObl = o => o.estado === 'pagada' || (!!o.sinPago && o.estado === 'declarada');
  const usd0 = n => dinero(n, 'usd', 0);
  function cuentaNomina() {
    const T = D.TASA, F = A.F; const N = D.NOMINA.proxima; const nomina = r2(N.formal.total + N.interna.total);
    const hasta = F.dif([15, 9, 2026]); // días de hoy a la nómina del jueves 15
    // lo que hay hoy: los bancos en bolívares a la tasa de hoy, el Zelle en dólares y el Binance a lo que rinde en bolívares (como en Pagos)
    const bancos = D.CUENTAS.filter(c => c.mon === 'bs'); const bs = r2(bancos.reduce((s, c) => s + c.saldo, 0)); const bsUsd = r2(bs / T.usd);
    const zel = D.CUENTAS.find(c => c.id === 'ZEL'), bin = D.CUENTAS.find(c => c.id === 'BIN'); const binUsd = r2(bin.saldo * T.usdt / T.usd);
    const hay = r2(bsUsd + zel.saldo + binUsd);
    // la venta prudente: de mañana al día antes de la nómina, cada día con la venta más baja del mismo día de la semana en las últimas 4 semanas
    const feriados = (D.PARAMS.feriados || []).map(f => f[0]);
    const dias = [];
    for (let i = 1; i < hasta; i++) {
      const d = F.sumar(F.hoy, i); const dw = F.dt(d).getDay();
      const mismos = D.VENTA_DIAS.filter(x => F.dt([x.d[0], x.d[1], 2026]).getDay() === dw).slice(-4);
      const min = mismos.reduce((a, x) => (x.v < a.v ? x : a), mismos[0]);
      dias.push({ d, v: min.v, de: min.d, feriado: feriados.includes(d[0] + ' ' + D.MESES[d[1]]) });
    }
    const M = D.MEZCLA_COBROS; const bruta = r2(dias.reduce((s, x) => s + x.v, 0));
    const venta = { bruta, bs: r2(bruta * M.bs / 100), zelle: r2(bruta * M.zelle / 100), binance: r2(bruta * M.binance / 100), efectivo: r2(bruta * M.efectivo / 100) };
    venta.cuenta = r2(venta.bs + venta.zelle + venta.binance);
    // los cobros a crédito que vencen de hoy al 15 (lo que ya venció no se cuenta: no se sabe cuándo llega)
    const cobros = D.CLIENTES.filter(c => c.saldo > 0).map(c => ({ c, vence: c.dias - c.antig, usd: r2(c.saldo * T[c.mon || 'eur'] / T.usd) })).sort((a, b) => b.vence - a.vence);
    const entran = cobros.filter(x => x.vence >= 0 && x.vence <= hasta); const cobrosUsd = r2(entran.reduce((s, x) => s + x.usd, 0));
    // lo que falta del lunes de hoy (el mismo cuadre de Pagos) y el lote del próximo lunes (el 12 es feriado bancario: se paga el martes 13)
    const fl = A.faltaLunes ? A.faltaLunes() : { n: 0, m: 0, lineas: [] };
    const lotes = [{ f: 'Lunes 5 oct (hoy)', t: A.totalLunes ? A.totalLunes() : 0 }].concat(A.lotesAnteriores ? A.lotesAnteriores() : []).slice(0, 4);
    const loteMax = lotes.reduce((a, x) => (x.t > a.t ? x : a), lotes[0]); const lote = loteMax.t;
    // lo fiscal con fecha: lo que vence de hoy al 15, tiene monto y todavía no se pagó (en bolívares; aquí, a la tasa de hoy)
    const obls = D.OBLIGACIONES.filter(o => !hechaObl(o) && o.faltan >= 0 && o.faltan <= hasta && o.monto).sort((a, b) => a.faltan - b.faltan);
    const fiscalBs = r2(obls.reduce((s, o) => s + o.monto, 0)); const fiscal = r2(fiscalBs / T.usd);
    const noEntran = D.OBLIGACIONES.filter(o => !hechaObl(o) && o.faltan >= 0 && !obls.includes(o)).sort((a, b) => a.faltan - b.faltan);
    const entra = r2(hay + venta.cuenta + cobrosUsd); const sale = r2(fl.m + lote + fiscal + nomina); const queda = r2(entra - sale);
    // en bolívares: lo que hay en los bancos y entra en bolívares, contra todo lo que sale (todo eso se paga en bolívares)
    const bsVenta = r2(venta.bs * T.usd), bsCobros = r2(cobrosUsd * T.usd);
    const bsEntra = r2(bs + bsVenta + bsCobros); const bsSale = r2((fl.m + lote + nomina) * T.usd + fiscalBs); const bsFalta = r2(bsSale - bsEntra);
    return { T, hasta, N, nomina, bancos, bs, bsUsd, zel, bin, binUsd, hay, dias, M, venta, cobros, entran, cobrosUsd, fl, lotes, loteMax, lote, obls, noEntran, fiscalBs, fiscal, entra, sale, queda, bsVenta, bsCobros, bsEntra, bsSale, bsFalta, boveda: D.BOVEDA.total };
  }
  A.cuentaNomina = cuentaNomina;
  function llegamos() {
    // la hoja muestra cada renglón sin céntimos: el total es la suma de esos renglones redondeados (así la columna suma lo que dice); la ficha
    // «Cómo se calcula» conserva los céntimos · una resta sale con su signo delante del símbolo («−$ 6.959»), como en toda la app
    const k = cuentaNomina(); const rd = Math.round; const saleHoja = rd(k.fl.m) + rd(k.lote) + rd(k.fiscal) + rd(k.nomina);
    const quedaHoja = rd(k.hay) + rd(k.venta.cuenta) + rd(k.cobrosUsd) - saleHoja; const neg = quedaHoja < 0; const veBoveda = puede('boveda'); const prop = tag('Propuesta', 'aviso');
    const salidas = [
      { signo: '−', t: 'Lo que falta del lunes de hoy', sub: k.fl.n ? k.fl.n + (k.fl.n === 1 ? ' pago sin hacer' : ' pagos sin hacer') : 'ya se pagó todo', v: usd0(k.fl.m), abrir: 'llegamos:lunes' },
      { signo: '−', t: 'El lote del próximo lunes', sub: 'se paga el martes 13 · el más alto de los últimos 4 ' + prop, v: usd0(k.lote), abrir: 'llegamos:lote' },
      { signo: '−', t: 'Lo fiscal con fecha', sub: k.obls.length + (k.obls.length === 1 ? ' pago que vence' : ' pagos que vencen') + ' hasta el 15', v: usd0(k.fiscal), abrir: 'llegamos:fiscal' },
      { signo: '−', t: 'Nómina estimada del 15', sub: k.N.personas + ' personas · las dos corridas', v: usd0(k.nomina), abrir: 'llegamos:nomina' },
    ];
    const cab = `<div class="hoja-cab"><h2 id="ll-t">${ic('nomina')}¿Llegamos a la nómina del 15?</h2><button class="enlace" data-abrir="llegamos:${LL.sinBancos ? 'sale' : 'quedaria'}">Cómo se calcula</button></div>
      <p class="muted">De hoy al jueves 15 · en dólares a la tasa de hoy (${dinero(k.T.usd, 'bs')} el dólar)</p>`;
    const proto = `<label class="proto-prueba"><input type="checkbox" data-acc="llegamos-bancos"${LL.sinBancos ? ' checked' : ''}><span><b>Solo en el prototipo</b>Así se ve mientras los bancos no estén conectados.</span></label>`;
    // sin los saldos de los bancos no se puede saber cuánto quedaría: solo lo que sale, con sus montos
    if (LL.sinBancos) return `<article class="hoja libro-nomina sin-bancos" aria-labelledby="ll-t">${cab}
      ${A.sumaLibro(salidas.map(f => ({ ...f, signo: '' })).concat([{ t: 'Lo que sale hasta el 15', v: usd0(saleHoja), abrir: 'llegamos:sale', clase: 'total' }]), { plata: true, etiqueta: 'Lo que sale hasta el 15' })}
      <p class="muted">Cuando se conecten los bancos, aquí sale cuánto quedaría.</p>${proto}</article>`;
    const filas = [
      { t: 'Hay hoy', sub: 'bancos, Zelle y Binance', v: usd0(k.hay), abrir: 'llegamos:hay' },
      { signo: '+', t: 'Venta prudente hasta el 15', sub: 'la más baja del mismo día en 4 semanas, sin el efectivo ' + prop, v: usd0(k.venta.cuenta), abrir: 'llegamos:venta' },
      { signo: '+', t: 'Cobros a crédito que vencen', sub: k.entran.length ? k.entran.length + (k.entran.length === 1 ? ' cliente' : ' clientes') + ' hasta el 15' : 'ninguno vence antes del 15', v: usd0(k.cobrosUsd), abrir: 'llegamos:cobros' },
      ...salidas,
      { signo: '=', t: 'Quedaría', sub: neg ? '<b>No alcanza</b>, aun contando la venta prudente' : '', v: usd0(quedaHoja), abrir: 'llegamos:quedaria', clase: 'total' + (neg ? ' rojo' : '') },
    ];
    const extra = (k.bsFalta > 0 ? `<button type="button" class="sl-extra aviso" data-abrir="llegamos:bs">${ic('alerta', 's')}<span>En bolívares faltarían <b class="nowrap">${dinero(k.bsFalta, 'bs', 0)}</b>: hay que vender dólares o USDT.</span>${ic('derecha', 's chev')}</button>` : '')
      + (veBoveda ? `<button type="button" class="sl-extra" data-abrir="llegamos:boveda">${ic('boveda', 's')}<span>Si se usa la bóveda: <b class="nowrap">+ ${usd0(k.boveda)}</b></span>${ic('derecha', 's chev')}</button>` : '');
    return `<article class="hoja libro-nomina" aria-labelledby="ll-t">${cab}
      ${A.sumaLibro(filas, { plata: true, etiqueta: '¿Llegamos a la nómina del 15?' })}
      ${extra ? `<div class="sl-extras">${extra}</div>` : ''}
      <p class="muted">${veBoveda ? 'El parte de WhatsApp nunca dice lo que hay en la bóveda. ' : ''}Saldos de ejemplo: los reales llegan cuando se conecten los bancos.</p>${proto}</article>`;
  }
  ACC['llegamos-bancos'] = (arg, el) => { LL.sinBancos = !!(el && el.checked); A.pintarPagina(); };
  // «Cómo se calcula» de cada renglón, con el detalle por moneda
  FICHAS.llegamos = id => {
    const k = cuentaNomina(); const T = k.T; const fd = d => A.F.corta(d);
    const kv = filas => `<dl class="kv">${filas.filter(Boolean).map(([l, v, cl]) => `<div${cl ? ` class="${cl}"` : ''}><dt>${l}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
    const enBs = usd => `<small class="tenue">≈ ${dinero(usd * T.usd, 'bs', 0)} a la tasa de hoy</small>`;
    const ir = (txt, a, mod) => (puede(mod) ? [{ txt, acc: 'ir-a', arg: a, icono: 'derecha' }] : []);
    const prop = tag('Propuesta', 'aviso');
    const x = {
      hay: () => ({ t: 'Hay hoy: ' + dinero(k.hay, 'usd'), b: [
        { titulo: 'En bolívares', html: kv(k.bancos.map(c => [`<span class="acct" data-c="${c.id}">${c.id}</span> ${esc(c.nombre)}`, dinero(c.saldo, 'bs')]).concat([['<b>Total en los bancos</b>', `${dinero(k.bs, 'bs')}<small class="tenue">÷ ${fmt(T.usd)} = ${dinero(k.bsUsd, 'usd')}</small>`, 'total']])) },
        { titulo: 'En dólares', html: kv([[`<span class="acct" data-c="ZEL">ZEL</span> ${esc(k.zel.nombre)}`, dinero(k.zel.saldo, 'usd') + '<small class="tenue">ya está en dólares</small>']]) },
        { titulo: 'En USDT', html: kv([[`<span class="acct" data-c="BIN">BIN</span> ${esc(k.bin.nombre)}`, `${dinero(k.bin.saldo, 'usdt')}<small class="tenue">× ${fmt(T.usdt)} ÷ ${fmt(T.usd)} = ${dinero(k.binUsd, 'usd')}</small>`]]) + '<p class="muted">El USDT cuenta por lo que rinde en bolívares, igual que cuando se paga desde Binance en Pagos de los lunes.</p>' },
        { html: kv([['<b>Hay hoy</b>', `<b>${dinero(k.hay, 'usd')}</b>`, 'total']]) + `<p class="muted">Saldos de ejemplo: los reales llegan cuando se conecten los bancos.${puede('boveda') ? ' La bóveda va aparte, en su propia línea.' : ''}</p>` }],
        acc: ir('Ver los bancos', 'bancos/cuentas', 'bancos') }),
      venta: () => ({ t: 'Venta prudente: ' + dinero(k.venta.cuenta, 'usd'), b: [
        { html: `<p>Para no contar con plata que quizá no llega, cada día va con la venta más baja de ese mismo día de la semana en las últimas 4 semanas. ${prop}</p><p class="muted">Cuánta venta contar hasta la nómina lo decide Alejandro: está en «Lo que falta».</p>` },
        { titulo: 'Día por día', html: kv(k.dias.map(x => [esc(fd(x.d)) + (x.feriado ? ' <small class="tenue">feriado</small>' : ''), `${dinero(x.v, 'usd', 0)}<small class="tenue">la del ${esc(fd([x.de[0], x.de[1], 2026]))}</small>`])
          .concat([['<b>Venta de esos ' + k.dias.length + ' días</b>', `<b>${dinero(k.venta.bruta, 'usd', 0)}</b>`, 'total']])) },
        { titulo: 'Por moneda · cómo pagaron del ' + esc(k.M.periodo), html: kv([
          ['Bolívares (pago móvil, transferencia y punto) · ' + k.M.bs + ' %', `${dinero(k.venta.bs, 'usd')}${enBs(k.venta.bs)}`],
          ['Zelle · ' + k.M.zelle + ' %', dinero(k.venta.zelle, 'usd')],
          ['Binance · ' + k.M.binance + ' %', `${dinero(k.venta.binance, 'usd')}<small class="tenue">≈ ${dinero(k.venta.binance * T.usd / T.usdt, 'usdt')}</small>`],
          ['Efectivo en dólares · ' + k.M.efectivo + ' %', `<s class="tenue">${dinero(k.venta.efectivo, 'usd')}</s><small class="tenue">va a la bóveda: no se cuenta</small>`],
          ['<b>Se cuenta</b>', `<b>${dinero(k.venta.cuenta, 'usd')}</b>`, 'total']]) },
        { html: '<p class="muted">Es venta neta, sin IVA: el IVA de estos días se declara el jueves 22, después de la nómina. Hoy no se cuenta: lo que entra hoy se ve mañana en los bancos. El día del feriado se cuenta como un lunes flojo, aunque el año pasado se vendió más.</p>' }],
        acc: ir('Ver las ventas', 'analisis/ventas', 'analisis') }),
      cobros: () => ({ t: 'Cobros a crédito: ' + dinero(k.cobrosUsd, 'usd'), b: [
        { titulo: 'Quién nos debe', html: kv(k.cobros.map(x => { const dentro = k.entran.includes(x); const cuando = x.vence >= 0 ? (x.vence === 0 ? 'vence hoy' : 'vence en ' + x.vence + (x.vence === 1 ? ' día' : ' días')) : 'venció hace ' + -x.vence + (x.vence === -1 ? ' día' : ' días');
          return [esc(x.c.nombre) + ` <small class="tenue">${cuando}</small>`, dentro ? `${dinero(x.c.saldo, x.c.mon || 'eur')}<small class="tenue">≈ ${dinero(x.usd, 'usd')} · se cuenta</small>` : `<s class="tenue">${dinero(x.c.saldo, x.c.mon || 'eur')}</s><small class="tenue">no se cuenta</small>`]; })
          .concat([['<b>Se cuenta</b>', `<b>${dinero(k.cobrosUsd, 'usd')}</b>${enBs(k.cobrosUsd)}`, 'total']])) },
        { html: `<p class="muted">Deben en euros, como la carta, y pagan en bolívares al euro BCV del día (hoy, ${dinero(T.eur, 'bs')} el euro). Solo se cuenta lo que vence de hoy al 15: lo que ya venció no se sabe cuándo llega y se cobra aparte, con el recordatorio de los lunes.</p>` }],
        acc: ir('Ver quién nos debe', 'clientes/deben', 'clientes') }),
      lunes: () => ({ t: 'Lo que falta del lunes: ' + dinero(k.fl.m, 'usd'), b: [
        { titulo: k.fl.n ? 'Pagos sin hacer' : 'Ya se pagó todo', html: k.fl.n ? kv(k.fl.lineas.map(l => [esc(l.nombre) + (l.v ? ` <small class="tenue">${esc(String(l.v).toLowerCase())}</small>` : ''), dinero(l.m, 'usd')]).concat([['<b>Falta</b>', `<b>${dinero(k.fl.m, 'usd')}</b>${enBs(k.fl.m)}`, 'total']])) : '<p class="muted">El lote de hoy ya está pagado.</p>' },
        { html: '<p class="muted">Son las líneas del lote de hoy que todavía no se marcaron como pagadas: el mismo cuadre de Pagos de los lunes. Se pagan en bolívares desde las cuentas del negocio.</p>' }],
        acc: ir('Ver el lote de hoy', 'pagos/lunes', 'pagos') }),
      lote: () => ({ t: 'El lote del próximo lunes: ' + dinero(k.lote, 'usd'), b: [
        { html: `<p>Las facturas de esta semana todavía no llegaron: mientras tanto se cuenta el lote más alto de los últimos 4, para no quedarse corto. ${prop}</p>` },
        { titulo: 'Los últimos 4 lotes', html: kv(k.lotes.map(l => [esc(l.f) + (l === k.loteMax ? ' <small class="tenue">el más alto</small>' : ''), dinero(l.t, 'usd')])) },
        { html: `<p class="muted">El lunes 12 es feriado bancario: ese lote se paga el martes 13. Se paga en bolívares: ${dinero(k.lote * T.usd, 'bs', 0)} a la tasa de hoy.</p>` }],
        acc: ir('Ver los lotes anteriores', 'pagos/anteriores', 'pagos') }),
      fiscal: () => ({ t: 'Lo fiscal hasta el 15: ' + dinero(k.fiscal, 'usd'), b: [
        { titulo: 'Lo que vence de hoy al 15', html: `<ul class="lista">${k.obls.map(o => `<li><button class="fila" data-abrir="obligacion:${o.id}"><span class="lead${o.faltan <= 1 ? ' aviso' : ''}">${ic('fiscal')}</span><span class="medio"><b>${esc(o.corto)}</b><small>${esc(o.ente)} · vence ${esc(o.vence)}</small></span><span class="monto">${A.bs(o.monto, { hoy: true, estimado: !['declarada', 'pagada'].includes(o.estado) })}</span></button></li>`).join('')}</ul>${kv([['<b>Total</b>', `<b>${dinero(k.fiscalBs, 'bs')}</b><small class="tenue">÷ ${fmt(T.usd)} = ${dinero(k.fiscal, 'usd')}</small>`, 'total']])}` },
        k.noEntran.length ? { html: `<p class="muted">No entran: ${esc(k.noEntran.map(o => o.corto + (o.sinPago ? ' (solo se declara)' : o.monto ? ' (vence el ' + o.dia + ')' : ' (todavía sin monto)')).join(', '))}.</p>` } : { oculto: true },
        { html: '<p class="muted">Cada monto sale de su hoja, en bolívares, y es un estimado hasta declararlo.</p>' }],
        acc: ir('Ver lo que vence', 'fiscal/vence', 'fiscal') }),
      nomina: () => ({ t: 'Nómina estimada del 15: ' + dinero(k.nomina, 'usd'), b: [
        { html: kv([['Nómina formal · ' + k.N.formal.personas + ' personas', dinero(k.N.formal.total, 'usd')], ['Nómina interna · ' + k.N.interna.personas + ' personas', dinero(k.N.interna.total, 'usd')], ['<b>Las dos corridas</b>', `<b>${dinero(k.nomina, 'usd')}</b>${enBs(k.nomina)}`, 'total']]) },
        { html: '<p class="muted">Es la pre-nómina: falta el reporte del reloj. Se paga en bolívares a la tasa BCV del día de pago. El 10 % y el premio del mes van con la 2.ª quincena, no el 15.</p>' }],
        acc: ir('Ver la nómina', 'nomina', 'nomina') }),
      sale: () => ({ t: 'Lo que sale hasta el 15: ' + dinero(k.sale, 'usd'), b: [
        { html: kv([['Lo que falta del lunes de hoy', dinero(k.fl.m, 'usd')], ['El lote del próximo lunes ' + prop, dinero(k.lote, 'usd')], ['Lo fiscal con fecha', dinero(k.fiscal, 'usd')], ['Nómina estimada del 15', dinero(k.nomina, 'usd')], ['<b>Lo que sale</b>', `<b>${dinero(k.sale, 'usd')}</b>${enBs(k.sale)}`, 'total']]) },
        { html: '<p class="muted">Mientras los bancos no estén conectados no se sabe cuánta plata hay, así que la hoja no dice cuánto quedaría: solo lo que sale.</p>' }] }),
      quedaria: () => ({ t: (k.queda < 0 ? 'No alcanza: ' : 'Quedaría ') + dinero(k.queda, 'usd'), b: [
        { html: kv([['Hay hoy', dinero(k.hay, 'usd')], ['+ Venta prudente hasta el 15 ' + prop, dinero(k.venta.cuenta, 'usd')], ['+ Cobros a crédito que vencen', dinero(k.cobrosUsd, 'usd')],
          ['− Lo que falta del lunes de hoy', dinero(k.fl.m, 'usd')], ['− El lote del próximo lunes ' + prop, dinero(k.lote, 'usd')], ['− Lo fiscal con fecha', dinero(k.fiscal, 'usd')], ['− Nómina estimada del 15', dinero(k.nomina, 'usd')],
          [k.queda < 0 ? '<b>= No alcanza</b>' : '<b>= Quedaría</b>', `<b class="${k.queda < 0 ? 'down' : ''}">${dinero(k.queda, 'usd')}</b>`, 'total']]) },
        { html: `<p class="muted">Todo en dólares a la tasa BCV de hoy (${dinero(T.usd, 'bs')}); el USDT, por lo que rinde en bolívares (${dinero(T.usdt, 'bs')}). Sale en rojo solo si no alcanza aun contando la venta prudente. La venta prudente y el lote del próximo lunes son propuestas: se cuentan así hasta que Alejandro decida.</p>${k.bsFalta > 0 ? `<p class="muted">Aunque alcance en dólares, en bolívares faltarían ${dinero(k.bsFalta, 'bs', 0)}: todo lo que sale se paga en bolívares.</p>` : ''}` }] }),
      bs: () => ({ t: 'En bolívares faltarían ' + dinero(Math.max(0, k.bsFalta), 'bs', 0), b: [
        { titulo: 'Entra en bolívares', html: kv([['Los bancos, hoy', dinero(k.bs, 'bs')], ['La venta en bolívares (' + k.M.bs + ' %)', dinero(k.bsVenta, 'bs')], ['Los cobros a crédito', dinero(k.bsCobros, 'bs')], ['<b>Entra</b>', `<b>${dinero(k.bsEntra, 'bs')}</b>`, 'total']]) },
        { titulo: 'Sale en bolívares', html: kv([['Lo que falta del lunes, el lote y la nómina', `${dinero((k.fl.m + k.lote + k.nomina) * T.usd, 'bs')}<small class="tenue">${dinero(k.fl.m + k.lote + k.nomina, 'usd')} a ${fmt(T.usd)}</small>`], ['Lo fiscal', dinero(k.fiscalBs, 'bs')], ['<b>Sale</b>', `<b>${dinero(k.bsSale, 'bs')}</b>`, 'total']]) },
        { html: kv([['<b>Faltarían</b>', `<b>${dinero(Math.max(0, k.bsFalta), 'bs')}</b><small class="tenue">≈ ${dinero(Math.max(0, k.bsFalta) / T.usd, 'usd')}</small>`, 'total']]) + `<p class="muted">Para cubrirlo hay que vender dólares o USDT: hoy hay ${dinero(k.zel.saldo, 'usd')} en Zelle y ${dinero(k.bin.saldo, 'usdt')} en Binance, y entran más con la venta en Zelle y Binance.</p>` }] }),
      boveda: () => ({ t: 'Si se usa la bóveda: + ' + dinero(k.boveda, 'usd', 0), mod: 'boveda', b: [
        { html: kv([['En la bóveda hoy', `<b>${dinero(k.boveda, 'usd', 0)}</b><small class="tenue">la suma de sus billetes</small>`], ['El efectivo que entra hasta el 15', `≈ ${dinero(k.venta.efectivo, 'usd', 0)}<small class="tenue">no se cuenta: llega en billetes, día a día</small>`]]) },
        { html: '<p class="muted">No entra en «Quedaría»: la bóveda se usa solo si hace falta. Solo la ven los socios y quien la custodia, y el parte de WhatsApp nunca la menciona.</p>' }],
        acc: ir('Ver la bóveda', 'boveda', 'boveda') }),
    }[id] || (() => ({ t: '¿Llegamos a la nómina del 15?', b: [{ html: '<p class="muted">Esa parte de la cuenta ya no está.</p>' }] }));
    const s = x();
    return { titulo: s.t, sub: '¿Llegamos a la nómina del 15? · cómo se calcula', mod: s.mod || 'pagos', bloques: s.b, acciones: s.acc || [] };
  };
  const salud = () => puede('salud')
    ? `<button class="salud" data-ir="salud">${ic('escudo', 's')}<span>El sistema está bien, con una cosa por mirar: la copia de Odoo sigue a mano los domingos. Respaldo de las 3:00 probado, WhatsApp conectado y saldo de IA para 21 días.</span></button>` : '';

  function inicio() {
    const u = S.usuario; const mis = A.misPendientes();
    const saludo = `<header class="cabeza"><div><p class="kicker">${D.HOY.largo} · ${D.HOY.hora}</p><h1>Buenas tardes, ${esc(u.nombre.split(' ')[0])}</h1></div></header>`;
    const pend = mis.length ? `<div class="sec"><h2>Tus pendientes</h2><button class="enlace" data-ir="pendientes">${mis.length > 4 ? 'Ver los ' + mis.length : 'Ver todos'}</button></div><ul class="lista">${mis.slice(0, 4).map(filaPend).join('')}</ul>` : `<p class="nota ok">${ic('check', 's')}<span>No tienes pendientes. Buen trabajo.</span></p>`;
    const r = u.rol;
    if (r === 'dueno' || r === 'socia' || r === 'consulta') {
      // en el teléfono, la hoja de la nómina va justo debajo del parte; la suma de comida + personal, debajo del termómetro
      const conHoja = puede('pagos') && puede('bancos') && puede('nomina') && puede('fiscal');
      return `<div class="pagina">${saludo}
        <div class="rejilla">
          <div class="pila c7">${parte()}${conHoja ? llegamos() : ''}${pend}</div>
          <div class="pila c5">${estaSemana()}${miConsumo()}${r === 'consulta' ? misRetiros() : ''}${termometro()}${A.sumaPrimo ? A.sumaPrimo() : ''}</div>
        </div>${salud()}</div>`;
    }
    if (r === 'contabilidad') {
      const porConf = D.CAJA.filter(c => c.estado === 'por_confirmar').length;
      const pagado = D.LUNES.filter(x => x.c).length;
      return `<div class="pagina">${saludo}
        <div class="cifras">
          ${A.cifra({ etq: 'Caja por confirmar', valor: porConf, sub: 'el más viejo de las 12:40', ir: 'caja', tono: porConf ? 'aviso' : '' })}
          ${(el => A.cifra({ etq: 'Pagos del lunes', valor: pagado + ' de ' + D.LUNES.length, sub: 'marcados · ' + el.corto, ir: 'pagos/lunes', tono: el.tono }))(A.estadoLunes())}
          ${A.cifra({ etq: 'Lo fiscal esta semana', valor: D.OBLIGACIONES.filter(o => o.faltan >= 0 && o.faltan <= 6 && o.estado !== 'pagada' && !(o.sinPago && o.estado === 'declarada')).length, sub: 'el IVA vence mañana', ir: 'fiscal' })}
          ${A.cifra({ etq: 'Conciliación de septiembre', valor: '3 de 4', sub: 'falta el BNC', ir: 'bancos', tono: 'aviso' })}
        </div>
        <div class="rejilla"><div class="pila c7">${pend}</div><div class="pila c5">${estaSemana()}</div></div>${salud()}</div>`;
    }
    if (r === 'fiscal_externo') {
      const prox = D.OBLIGACIONES.filter(o => o.faltan >= 0).sort((a, b) => a.faltan - b.faltan).slice(0, 5);
      const rd = D.RET_RECIBIDAS.filter(x => x.estado === 'por_descontar'); const porDesc = rd.reduce((s, x) => s + x.monto, 0);
      // lo mismo que cuenta Fiscal: los Z que faltan, la hoja de IVA y cuánto del paquete está listo
      const zf = A.fiscal.zFaltan(); const paq = A.fiscal.paquete(); const o1 = D.OBLIGACIONES.find(o => o.id === 'o1');
      const o1sub = { revision: 'falta el visto de Jose', lista: 'falta registrar lo declarado', declarada: 'falta registrar el pago', pagada: 'declarada y pagada' }[o1.estado] || '';
      return `<div class="pagina">${saludo}
        <div class="cifras">
          ${A.cifra({ etq: 'Hoja de IVA (vence mañana)', valor: A.estadoTxt(o1.estado), sub: o1sub, abrir: 'obligacion:o1', tono: ['declarada', 'pagada'].includes(o1.estado) ? '' : 'aviso' })}
          ${A.cifra({ etq: 'Reportes Z que faltan', valor: zf.length, sub: zf.length ? 'septiembre: ' + (zf.length === 1 ? 'día ' : 'días ') + zf.map(z => z.dia).join(' y ') : 'están todos', ir: 'fiscal/z', tono: zf.length ? 'alerta' : '' })}
          ${A.cifra({ etq: 'Retenciones por descontar', valor: dinero(porDesc, 'bs'), sub: '≈ ' + dinero(rd.reduce((s, x) => s + Math.round(x.monto / x.tasa * 100) / 100, 0), 'usd', 0) + ' · ' + rd.length + ' comprobantes', ir: 'fiscal/retenciones' })}
          ${A.cifra({ etq: 'Preguntas para ti', valor: D.PREGUNTAS.filter(q => q.estado === 'abierta').length, sub: 'de ' + D.PREGUNTAS.length + ' · las respondes aquí', ir: 'fiscal/preguntas' })}
        </div>
        <div class="rejilla">
          <div class="pila c7"><div class="sec"><h2>Lo que vence con el SENIAT y la Alcaldía</h2><button class="enlace" data-ir="fiscal">Ver el calendario</button></div>
            <ul class="lista">${prox.map(o => `<li><button class="fila" data-abrir="obligacion:${o.id}"><span class="lead ${o.faltan <= 1 ? 'aviso' : ''}">${ic('fiscal')}</span><span class="medio"><b>${esc(o.corto)}</b><small>${esc(o.ente)} · vence ${esc(o.vence)}</small></span><span class="fin">${A.estadoTag(o.estado)}</span></button></li>`).join('')}</ul></div>
          <div class="pila c5">${pend}<article class="hoja"><div class="hoja-cab"><h2>${ic('archivo')}Tu paquete de septiembre</h2>${tag(paq.listos + ' de ' + paq.total + ' listos', paq.listos === paq.total ? 'ok' : 'aviso')}</div><button class="enlace" data-ir="fiscal/paquete">Ver lo que falta ${ic('derecha', 's')}</button></article></div>
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
          ${(n => A.cifra({ etq: 'Avisos del personal', valor: A.avisosCuenta(), sub: n ? n + (n === 1 ? ' ya vencido o que ya falta' : ' ya vencidos o que ya faltan') : 'nada vencido', ir: 'personal/avisos', tono: n ? 'alerta' : 'aviso' }))(A.avisosVencidos())}
          ${A.cifra({ etq: 'Préstamos vivos', valor: D.PRESTAMOS.filter(p => ['activo', 'en_liquidacion'].includes(p.estado)).length, sub: '1 por aprobar', ir: 'prestamos' })}
        </div>
        <div class="rejilla"><div class="pila c7">${pend}</div><div class="pila c5"><div class="sec"><h2>Esta semana en el personal</h2></div><ul class="lista">${semana.join('')}</ul>
          <p class="nota info">${ic('info', 's')}<span>La nómina se arma con el Excel del reloj. Cuando llegue la muestra, en Asistencia aparece «Subir el reporte del reloj».</span></p></div></div></div>`;
    }
    if (r === 'reservas') {
      const esHoy = x => x.d[0] === 5 && x.d[1] === 9, esMan = x => x.d[0] === 6 && x.d[1] === 9;
      const hoyR = D.RESERVAS.filter(x => esHoy(x) && x.estado !== 'cancelada').sort((a, b) => a.hora.localeCompare(b.hora)), manR = D.RESERVAS.filter(x => esMan(x) && x.estado !== 'cancelada');
      const evs = D.EVENTOS_AG.filter(e => e.d[1] === 9 && e.d[0] >= 5 && e.personas);
      // lo que no salió al grupo va arriba: es lo único que pide algo (mandarlo a mano)
      return `<div class="pagina">${saludo}${(A.noSalieron ? A.noSalieron() : []).map(x => `<p class="nota alerta">${ic('alerta', 's')}<span><b>No salió un aviso al grupo:</b> ${esc((x.aviso.tipo || 'aviso').toLowerCase())} de ${esc(x.nombre)} (${esc(x.aviso.hora)}). <button class="enlace" data-ir="calendario/avisos">Mandarlo a mano ${ic('derecha', 's')}</button></span></p>`).join('')}
        <div class="cifras">
          ${A.cifra({ etq: 'Reservas de hoy', valor: hoyR.length, sub: hoyR.reduce((a, x) => a + x.personas, 0) + ' personas', ir: 'calendario/reservas' })}
          ${(falta => A.cifra({ etq: 'Mañana', valor: manR.length, sub: manR.reduce((a, x) => a + x.personas, 0) + ' personas · ' + manR.filter(x => x.recordado).length + ' de ' + manR.length + ' recordadas' + (falta ? ' · falta un abono' : ''), tono: falta || manR.some(x => !x.recordado) ? 'aviso' : '', ir: 'calendario/reservas' }))(manR.some(x => x.abono && !x.abonoOk))}
          ${A.cifra({ etq: 'Eventos en octubre', valor: evs.length, sub: 'el próximo: sáb 17', ir: 'calendario/eventos' })}
          ${(c => c ? A.cifra({ etq: 'Hoy cumple', valor: esc(c.nombre.split(' ')[0]), sub: esc(c.cargo.toLowerCase()) + ' · ' + esc(D.TURNOS[c.turno][0].toLowerCase()), ir: 'calendario/personal' }) : '')(A.rh.activos().find(e => A.rh.proxCumple(e) === 0))}
        </div>
        <div class="rejilla"><div class="pila c7"><div class="sec"><h2>Reservas de hoy</h2><button class="btn pri chico" data-ir="calendario/nueva">${ic('mas', 's')}Nueva reserva</button></div>
          <ul class="lista">${hoyR.map(x => `<li><button class="fila" data-abrir="reserva:${x.id}"><span class="lead info">${ic('cubiertos')}</span><span class="medio"><b>${esc(x.hora)} · ${esc(x.nombre)}</b><small>${x.personas} personas · ${esc(x.area)} ${esc(x.mesa)}${x.notas ? ' · ' + esc(x.notas) : ''}</small></span><span class="fin">${A.estadoTag(x.estado)}</span></button></li>`).join('')}</ul>${pend}</div>
          <div class="pila c5"><div class="sec"><h2>El aviso de las 11:00</h2>${tag('Enviado (simulado)', 'ok')}</div>${A.wa(A.msgDia([5, 9], 'Reservas de hoy'), { hora: '11:00', estado: 'confirmado' })}
          <p class="muted">Solo ves el calendario: reservas, eventos, y las vacaciones y cumpleaños del personal para armar las mesas. Nada de plata.</p></div></div></div>`;
    }
    if (r === 'compras') {
      return `<div class="pagina">${saludo}
        <div class="rejilla">
          <div class="pila c7"><div class="sec"><h2>Radar de precios</h2><button class="enlace" data-ir="analisis/precios">Ver todos</button></div>
            ${A.tabla({ cols: [{ t: 'Insumo', cls: 'p' }, { t: 'Antes', cls: 'r x plata' }, { t: 'Ahora', cls: 'r plata' }, { t: 'Cambio', cls: 'e' }], filas: D.INSUMOS.map(i => { const c = (i.ahora / i.antes - 1) * 100; return { abrir: 'insumo:' + i.id, celdas: [`<b>${esc(i.nombre)}</b><small>${esc(i.prov)}</small>`, dinero(i.antes, 'usd'), dinero(i.ahora, 'usd') + ' / ' + i.unidad, tag((c > 0 ? '+' : '') + fmt(c, 1) + ' %', c > 5 ? 'alerta' : c > 0 ? 'aviso' : 'ok')] }; }) })}</div>
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
    // los últimos retiros, cada uno con su ficha: el que se acaba de registrar sale aquí de una vez (y «Por revisar» si no cuadró con la foto)
    const ultimos = D.RETIROS.filter(r => r.socio === s.nombre && r.de === 'Bóveda').slice(0, 3);
    return `<article class="hoja"><div class="hoja-cab"><h2>${ic('cajachica')}Tus retiros este trimestre</h2></div>
      <dl class="kv"><div><dt>Retirado (anticipo de utilidades) ${tag('Propuesta (Q5)', 'aviso')}</dt><dd>${dinero(s.retirado, 'usd', 0)}</dd></div><div><dt>Plata por rendir</dt><dd>${dinero(pr, 'usd', 0)}</dd></div></dl>
      ${ultimos.length ? `<ul class="lista">${ultimos.map(r => `<li><button class="fila" data-abrir="retiro:${r.id}"><span class="lead ${r.estado === 'revisar' ? 'aviso' : ''}">${ic('boveda')}</span><span class="medio"><b>${dinero(r.monto, 'usd', 0)} de la bóveda</b><small>${esc(r.fecha)}</small></span><span class="fin">${r.estado === 'revisar' ? tag('Por revisar', 'aviso') : ''}${ic('derecha', 's chev')}</span></button></li>`).join('')}</ul>` : ''}
      ${pr ? `<button class="enlace" data-ir="cajachica/rendir">Ver lo que falta rendir ${ic('derecha', 's')}</button>` : ''}
      <button class="btn sec" data-ir="boveda/sacar">${ic('menos', 's')}Registrar un retiro de la bóveda</button>
      <p class="muted">Es lo único que puedes registrar: tu propio retiro, con foto y código. Todo lo demás lo ves sin poder cambiarlo.</p></article>`;
  }

  // palabras: las de la casa con que alguien buscaría esta pantalla (el buscador compara sin tildes)
  PANT.inicio = { titulo: 'Inicio', grupo: 'Hoy', icono: 'inicio', mod: 'inicio', render: inicio, palabras: 'parte resumen meta ayer' };

  /* ---------- pendientes ---------- */
  PANT.pendientes = {
    titulo: 'Mis pendientes', corto: 'Pendientes', grupo: 'Hoy', icono: 'lista', mod: 'inicio', palabras: 'tareas bandeja avisos',
    cuenta: () => A.misPendientes().length,
    render: () => {
      const mis = A.misPendientes(); const hechos = D.PENDIENTES.filter(p => p.para.includes(S.usuario.id) && p.hecho);
      return `<div class="pagina">${A.cab('Tu bandeja', 'Mis pendientes', 'Todo lo que espera por ti, de cualquier módulo. Si algo pasa 2 días sin resolverse, sube al dueño. Se resuelve, se descarta con motivo o se pasa a otra persona.')}
        ${mis.length ? `<ul class="lista">${mis.map(filaPend).join('')}</ul>` : `<p class="nota ok">${ic('check', 's')}<span>Nada pendiente.</span></p>`}
        ${hechos.length ? `<div class="sec"><h2>Resueltos hoy</h2></div><ul class="lista">${hechos.map(p => `<li><div class="fila"><span class="lead ok">${ic('check')}</span><span class="medio"><b>${esc(A.tituloPend(p))}</b><small>${esc(p.hecho)}</small></span><span></span></div></li>`).join('')}</ul>` : ''}
      </div>`;
    },
  };
  // de qué módulo es un pendiente (el de la sección a la que lleva o el de la ficha que abre) y quién más puede resolverlo:
  // solo quien edita ese módulo, con su acceso ya activo
  const modPend = p => {
    if (p.ir && PANT[p.ir.split('/')[0]]) return PANT[p.ir.split('/')[0]].mod;
    if (p.abrir) { const [t, i] = p.abrir.split(':'); try { const f = FICHAS[t] && FICHAS[t](i); if (f && f.mod) return f.mod; } catch (_) { /* sin ficha: queda en Inicio */ } }
    return 'inicio';
  };
  const otrosPara = p => { const mod = modPend(p); return D.USUARIOS.filter(u => u.id !== S.usuario.id && !['invitada', 'por_confirmar', 'sin_acceso'].includes(u.estado) && A.puede(mod, 'editar', u)); };
  FICHAS.pendiente = id => {
    const p = D.PENDIENTES.find(x => x.id === id);
    // lo que pidió un aprendiz (o lo que pasó un tope): el antes → después y dos botones, «Devolver» y «Aprobar»; no se «marca resuelto»
    // ni se pasa a otra persona: se cierra solo al aprobarlo o al devolverlo
    const pr = p.propuesta ? A.POR_APROBAR.find(x => x.id === p.propuesta) : null;
    if (pr) {
      const viva = pr.estado === 'por_aprobar'; const mia = viva && S.usuario.id === pr.para;
      const queCambia = pr.cambios.length ? `<ul class="cambios">${pr.cambios.map(c => `<li><span><b>${esc(c.l)}</b>: <s>${esc(c.antesTxt)}</s> → <span class="lapiz">${esc(c.nuevoTxt)}</span></span></li>`).join('')}</ul>` : `<p><b>${esc(pr.accion.txt)}</b></p>${pr.accion.det || ''}`;
      return { titulo: A.tituloPend(p), sub: 'Pendiente · ' + esc(p.edad), mod: 'inicio', obj: p,
        tags: [[viva ? 'Por aprobar' : pr.estado === 'aprobada' ? 'Aprobado por ' + pr.aprobo : 'Devuelto', viva ? 'aviso' : pr.estado === 'aprobada' ? 'ok' : '']],
        bloques: [{ filas: [{ l: 'Qué', v: esc(pr.registro), largo: true }, { l: 'Lo pidió', v: esc(pr.quien) + ' · ' + esc(pr.cuando) },
          { l: 'Por qué espera', v: pr.porque === 'tope' ? (pr.tope.sinTope ? 'Su tope en esto está por decidir (Parámetros › Límites)' : 'Pasa su tope de ' + esc(A.montoTope(pr.tope.hasta, pr.tope.mon)) + ' (Parámetros › Límites)') : 'Está en modo aprendiz: lo que mueve plata espera otra firma', largo: true },
          ...(pr.motivo ? [{ l: 'Su motivo', v: '«' + esc(pr.motivo) + '»', largo: true }] : [])] },
          { titulo: 'Lo que cambia', html: queCambia },
          { html: `<p class="muted">${viva ? 'Al aprobarlo vale lo nuevo y sale el sello de tinta. Al devolverlo queda como estaba y ' + esc(pr.quien) + ' ve tu motivo.' : pr.estado === 'aprobada' ? 'Ya está aprobado.' : 'Se devolvió: «' + esc(pr.devolvio.motivo) + '».'}</p>` }],
        acciones: [{ txt: 'Ver la ficha', acc: 'pend-abrir', icono: 'derecha' }].concat(mia ? [{ txt: 'Devolver', acc: 'prop-devolver', arg: pr.id, tono: 'ghost', icono: 'atras' }, { txt: 'Aprobar', acc: 'prop-aprobar', arg: pr.id, tono: 'pri', icono: 'candado' }] : []) };
    }
    // el cambio de un lote ya aprobado (lo reabrió Jose): trae solo la diferencia y se aprueba aquí mismo con un código
    // no se «marca resuelto» ni se pasa a otra persona: se resuelve solo al aprobarlo o al dejarlo como estaba
    const cl = p.lote && !p.hecho && A.cambioLote ? A.cambioLote(p.lote) : null;
    if (cl) return {
      titulo: p.titulo, sub: 'Pendiente · ' + esc(p.edad), mod: 'inicio', obj: p, tags: [['Por aprobar', 'aviso']],
      bloques: [{ filas: [{ l: 'Qué pasa', v: esc(p.sub), largo: true }, { l: 'Viene de', v: esc(p.de) }, { l: 'Esperando desde', v: esc(p.edad) }] }, { titulo: 'Lo que cambió', html: cl.html },
        { html: `<p class="muted">${cl.puede ? 'Apruebas solo la diferencia, con tu código. Lo demás ya estaba aprobado.' : esc(cl.razon || 'Lo aprueba ' + A.quienAprueba('pagos') + ', solo la diferencia.')}</p>` }],
      acciones: [{ txt: p.lote === 'nomina' ? 'Ver el pago' : 'Ver el lote', acc: 'pend-ir', icono: 'derecha', tono: cl.puede ? 'sec' : 'pri' }].concat(cl.puede ? [{ txt: cl.boton, acc: 'lote-aprobar', arg: p.lote, icono: 'candado', tono: 'pri' }] : []),
    };
    const acciones = [];
    const donde = dondeDe(p);
    // si el pendiente trae su ficha, «Abrir» la abre directo (y, si trae también su sección, la deja detrás, donde se resuelve)
    if (p.abrir) acciones.push({ txt: 'Abrir', acc: 'pend-abrir', icono: 'derecha', tono: 'pri' });
    else if (p.ir) acciones.push({ txt: 'Ir a resolverlo', acc: 'pend-ir', icono: 'derecha', tono: 'pri' });
    // «Pasar a otra persona» solo aparece si alguien más puede hacerlo · el que espera a otro paso no se marca resuelto todavía
    const espera = A.enEspera(p);
    acciones.unshift(...(espera ? [] : [{ txt: 'Marcar resuelto', acc: 'pend-resolver', icono: 'check' }]), ...(otrosPara(p).length ? [{ txt: 'Pasar a otra persona', acc: 'pend-pasar', icono: 'usuario' }] : []));
    return {
      titulo: A.tituloPend(p), sub: 'Pendiente · ' + esc(p.edad), mod: 'inicio', obj: p,
      tags: [[p.tipo === 'escalado' ? 'Subió al dueño' : p.tipo === 'alerta' ? 'Urgente' : 'Normal', p.tipo === 'alerta' ? 'alerta' : p.tipo === 'escalado' ? 'lila' : '']].concat(espera ? [['En espera', '']] : []),
      aviso: espera ? `<p class="nota gris">${ic('reloj', 's')}<span><b>En espera:</b> te toca cuando ${esc(p.esperaTxt || 'termine el paso de antes')}. Hasta entonces no se marca resuelto.</span></p>` : '',
      bloques: [
        { filas: [{ l: 'Qué pasa', v: esc(A.subPendDe(p)), largo: true }, { l: 'Viene de', v: esc(p.de) }, { l: 'Para', v: p.para.map(x => esc(D.USUARIOS.find(u => u.id === x).nombre)).join(', ') }, { l: 'Esperando desde', v: esc(p.edad) }, ...(donde.txt ? [{ l: 'Dónde se resuelve', v: esc(donde.txt), largo: true }] : [])] },
        avisoBot(p, donde),
        { titulo: 'Cómo funciona', html: '<p class="muted">Si nadie lo resuelve en 2 días, sube al dueño. Descartarlo pide un motivo. Si la persona deja la empresa, al quitarle el acceso sus pendientes pasan a quien tenga su rol.</p>' },
      ],
      acciones,
    };
  };
  ACC['pend-ir'] = id => { const p = D.PENDIENTES.find(x => x.id === id); A.ir(p.ir + (p.sub2 ? '/' + p.sub2 : '')); };
  // «Abrir»: va a la sección donde se resuelve, abre su ficha y arriba de ella queda «‹ el pendiente» (o el «Atrás» del teléfono) para volver
  // a marcarlo · si quien lo mira no entra a esa sección, la ficha se abre donde está
  ACC['pend-abrir'] = id => {
    const p = D.PENDIENTES.find(x => x.id === id); const [t, i] = p.abrir.split(':');
    // el pendiente recuerda la pantalla donde estaba abierto: «‹ el pendiente» lo devuelve ahí
    const camino = [{ tipo: 'pendiente', id: p.id, t: A.tituloPend(p), r: A.S.ruta, s: A.S.sub[A.S.ruta] }];
    if (p.ir && A.accesible(p.ir)) {
      A.ir(p.ir + (p.sub2 ? '/' + p.sub2 : '')); if (A.S.ruta !== p.ir) return; // con una ficha a medio editar, primero pregunta
      const m = document.getElementById('main'); if (m) m.focus({ preventScroll: true }); // al cerrar la ficha, el teclado queda en la sección
    }
    A.abrir(t, i, { pila: camino });
  };
  /* dónde se resuelve un pendiente, en palabras («Fiscal › Hoja de IVA › IVA de la 2.ª quincena de septiembre») y en su dirección: la sección
     con el pendiente y su ficha encima (así el enlace del aviso del bot vuelve al pendiente con «‹») */
  function dondeDe(p) {
    const ir = p.ir && A.PANT[p.ir] ? p.ir : ''; const sub = ir && p.sub2 ? p.sub2 : '';
    const [t, i] = String(p.abrir || '').split(':'); const ficha = t && FICHAS[t] ? A.tituloFicha({ tipo: t, id: i }) : '';
    const txt = [ir ? A.caminoDe(ir) : '', sub ? A.nombreSeccion(ir, sub) : '', ficha].filter(Boolean).join(' › ');
    const dir = A.dirDe({ r: ir || 'pendientes', s: sub || undefined, f: [{ tipo: 'pendiente', id: p.id }].concat(t && FICHAS[t] ? [{ tipo: t, id: i }] : []) });
    return { txt, dir };
  }
  // el aviso que le mandaría el bot por WhatsApp: el pendiente con su enlace exacto (por dónde llegan las firmas está por decidir: va como propuesta)
  const avisoBot = (p, donde) => !A.wa ? { oculto: true } : { titulo: 'Así te llegaría por WhatsApp', extra: tag('Propuesta', 'aviso'),
    html: A.wa('🔔 *' + A.tituloPend(p) + '*\n' + A.subPendDe(p) + '\nÁbrelo aquí: …/' + donde.dir, { grupo: 'Bot de la app', hora: p.edad === 'Ahora' ? D.HOY.hora : '7:00', estado: 'previa', previa: 'Así te llegaría' })
      + '<p class="muted">El enlace abre la ficha exacta, en su sección. Arriba de esa ficha queda el enlace para volver a este pendiente y marcarlo. Lo mismo vale para el parte de las 7:00.</p>' };
  ACC['pend-resolver'] = id => {
    const p = D.PENDIENTES.find(x => x.id === id);
    A.pedirMotivo({ titulo: 'Marcar resuelto', etiqueta: 'Cómo se resolvió', obligatorio: false, boton: 'Marcar resuelto' }).then(m => {
      p.hecho = 'Lo resolvió ' + S.usuario.nombre + ' a las ' + D.HOY.hora + (m ? ' · ' + m : '');
      A.auditar({ modulo: 'Pendientes', registro: A.tituloPend(p), campo: 'estado', antes: 'abierto', despues: 'resuelto', motivo: m });
      A.cerrarFicha(); A.pintarPagina(); A.aviso('Resuelto.');
    }).catch(() => {});
  };
  ACC['pend-pasar'] = id => {
    const p = D.PENDIENTES.find(x => x.id === id);
    const gente = otrosPara(p); const modulo = A.nombreModulo(modPend(p));
    const opciones = gente.map(u => `<option value="${u.id}">${esc(A.nombreDe(u))}</option>`).join('');
    const env = document.querySelector('#modal-raiz');
    A.modal(`<h2 id="modal-t">Pasar a otra persona</h2>
      ${gente.length ? `<label class="campo" for="pasar-a"><span>¿A quién?</span><select id="pasar-a">${opciones}</select><small class="ayuda">Solo aparece quien puede hacer cambios en «${esc(modulo)}».</small></label>`
        : `<p class="muted">Nadie más puede resolverlo: solo tú haces cambios en «${esc(modulo)}».</p>`}
      <div class="modal-acc"><button class="btn sec" data-pasar="no">${gente.length ? 'Cancelar' : 'Cerrar'}</button>${gente.length ? '<button class="btn pri" data-pasar="si">Pasar</button>' : ''}</div>`, gente.length ? 'teclado' : '');
    (env.querySelector('#pasar-a') || env.querySelector('[data-pasar="no"]')).focus();
    env.onclick = e => {
      const b = e.target.closest('[data-pasar]'); if (!b) return;
      if (b.dataset.pasar === 'si') {
        const a = env.querySelector('#pasar-a').value; p.para = [a];
        A.auditar({ modulo: 'Pendientes', registro: A.tituloPend(p), campo: 'responsable', antes: S.usuario.nombre, despues: D.USUARIOS.find(u => u.id === a).nombre });
        A.cerrarModal(); A.cerrarFicha(); A.pintarPagina(); A.aviso('Lo pasaste a ' + D.USUARIOS.find(u => u.id === a).nombre + '.');
      } else A.cerrarModal();
    };
  };

  /* ---------- modo aprendiz: qué necesita aprobación (el enlace de la banda) ----------
     la misma regla que usan los botones (A.regla): lo que mueve plata espera otra firma; lo demás es su trabajo y se guarda directo */
  FICHAS.aprobacion = () => {
    const u = S.usuario; const mod = u.rol === 'fiscal_externo' ? 'fiscal' : (D.MODULOS.map(m => m[0]).find(m => A.puede(m, 'editar')) || 'inicio');
    const quien = A.aprobadorDe(mod).nombre; const mias = A.POR_APROBAR.filter(p => p.quienId === u.id && p.estado === 'por_aprobar');
    const fiscal = mod === 'fiscal';
    const espera = fiscal ? ['Los montos: retenciones, reportes Z y cualquier cifra en bolívares', 'Emitir un comprobante de retención', 'Registrar un comprobante que nos mandó un cliente', 'Registrar el pago de una obligación'] : ['Los montos y todo lo que mueve plata'];
    const directo = fiscal ? ['La configuración fiscal: responsables y días de aviso', 'Cargar el calendario de 2027 (llega más adelante)', 'Tus respuestas a las preguntas', 'Pasar una obligación a revisión y registrar lo declarado', 'Los soportes: certificados y comprobantes'] : ['Lo que no mueve plata: datos, notas y configuración'];
    const lista = (xs, icono) => `<ul class="lista">${xs.map(t => `<li><div class="fila"><span class="lead">${ic(icono)}</span><span class="medio"><b>${esc(t)}</b></span><span></span></div></li>`).join('')}</ul>`;
    return { titulo: 'Qué necesita aprobación', sub: u.estado === 'aprendiz' ? 'Modo aprendiz · ' + esc(u.aprendiz || '') : 'Cómo se aprueba', mod: 'inicio',
      bloques: [{ titulo: 'Espera otra firma · lo aprueba ' + quien, html: lista(espera, 'enviar') + `<p class="muted">El botón dice «Enviar para aprobar». Mientras tanto queda a lápiz, con el valor de antes tachado y «Por aprobar · ${esc(quien)}». El sello de tinta sale al aprobarlo; si ${esc(quien)} lo devuelve, ves su motivo.</p>` },
        { titulo: 'Se guarda directo · es tu trabajo', html: lista(directo, 'lapiz') },
        { titulo: 'Tus cambios por aprobar', html: mias.length ? `<ul class="lista">${mias.map(p => `<li><button class="fila" data-abrir="${esc(p.clave)}"><span class="lead aviso">${ic('reloj')}</span><span class="medio"><b>${esc(p.registro)}</b><small>${esc(A.detallePropuesta(p))}</small></span><span class="fin">${ic('derecha', 's chev')}</span></button></li>`).join('')}</ul>` : '<p class="muted">Ninguno por ahora.</p>' },
        { html: '<p class="muted">Al terminar el modo aprendiz, lo que mueve plata se guarda directo, y queda igual en el registro de cambios.</p>' }] };
  };

  /* ---------- cifras del parte (cada una se abre) ---------- */
  FICHAS.kpi = id => {
    const k = {
      parte: { t: 'Cómo se calcula la meta del día', b: [{ filas: [{ l: 'Costos fijos del mes', v: dinero(D.PARAMS.costosFijos || 38060, 'usd', 0) }, { l: 'Días de venta del mes', v: '30' }, { l: 'Lo variable (comida, comisiones)', v: '50,7 % de la venta' }, { l: 'Meta del día', v: '<b>' + dinero(meta(), 'usd', 0) + '</b>' }] }, { html: '<p class="muted">Meta = costos fijos ÷ días ÷ (1 − lo variable). Los costos fijos los escribe Alejandro en Parámetros. Las ventas salen del resumen diario del POS de Odoo.</p>' },
        // el parte de las 7:00 puede llevar el enlace exacto: abre esta misma ficha en Inicio
        { titulo: 'El parte de las 7:00, con su enlace', extra: tag('Propuesta', 'aviso'), html: A.wa ? A.wa('☀️ *El parte de hoy*\nAyer se vendieron ' + dinero(TK.ayer.venta, 'usd', 0) + ': el 117 % de lo que hacía falta. Hoy la meta es ' + dinero(meta(), 'usd', 0) + '.\nCómo se calcula: …/' + A.dirDe({ r: 'inicio', f: [{ tipo: 'kpi', id: 'parte' }] }), { grupo: 'Bot de la app', hora: '7:00', estado: 'previa', previa: 'Así le llega a Alejandro' }) : '' }] },
      semana: { t: 'Ayer contra el domingo pasado', b: [{ filas: [{ l: 'Domingo 4 oct', v: dinero(TK.ayer.venta, 'usd', 0) }, { l: 'Domingo 27 sep', v: dinero(TK.domPasado.venta, 'usd', 0) }, { l: 'Diferencia', v: '<span class="up">+' + dinero(TK.ayer.venta - TK.domPasado.venta, 'usd', 0) + ' (+5 %)</span>' }] }] },
      anio: { t: 'Ayer contra el mismo domingo de 2025', b: [{ filas: [{ l: 'Domingo 4 oct 2026', v: dinero(TK.ayer.venta, 'usd', 0) }, { l: 'Domingo 5 oct 2025', v: dinero(ANIO, 'usd', 0) }, { l: 'Diferencia', v: '<span class="up">+' + dinero(TK.ayer.venta - ANIO, 'usd', 0) + ' (+11 %)</span>' }] }, { html: '<p class="muted">Se compara el mismo día de la semana. La historia de Odoo arranca el 1 de octubre de 2025.</p>' }] },
      // la misma cuenta en el parte y en Análisis (venta neta ÷ pedidos, en dólares): el parte usa el día de ayer y Análisis, la semana
      ticket: { t: 'Ticket promedio', b: [{ filas: [
        { l: 'Ayer, domingo 4 oct', v: `${dinero(ticket(TK.ayer), 'usd')} <small class="tenue">${dinero(TK.ayer.venta, 'usd', 0)} ÷ ${TK.ayer.pedidos} pedidos · el del parte</small>` },
        { l: 'Domingo 27 sep', v: `${dinero(ticket(TK.domPasado), 'usd')} <small class="tenue">${dinero(TK.domPasado.venta, 'usd', 0)} ÷ ${TK.domPasado.pedidos} pedidos</small>` },
        { l: 'Esta semana (28 sep – 4 oct)', v: `${dinero(ticket(TK.semana), 'usd')} <small class="tenue">${dinero(TK.semana.venta, 'usd', 0)} ÷ ${TK.semana.pedidos} pedidos · el de Análisis</small>` },
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
  ACC['cambiar-clave'] = () => A.pedirCodigo({ que: 'Cambiar tu clave', det: 'Te mandamos el paso para la clave nueva.', boton: 'Cambiar la clave' }).then(() => A.aviso('Te mandamos el paso para la clave nueva. (Simulado)')).catch(() => {});
  ACC['nuevos-respaldos'] = () => A.pedirCodigo({ que: 'Códigos de respaldo nuevos', det: 'Los 8 viejos dejan de servir.', boton: 'Crear los nuevos' }).then(() => A.aviso('Creados: 8 códigos nuevos. Los viejos ya no sirven. (Simulado)')).catch(() => {});
  ACC['cerrar-sesion'] = id => { D.SESIONES.splice(D.SESIONES.findIndex(s => s.id === id), 1); A.pintarPagina(); A.aviso('Sesión cerrada en ese equipo.'); };

  /* ---------- revisión del prototipo ---------- */
  const REV = [
    ['Decidido el 5 y el 6 de octubre', [
      ['✓', 'Las reglas van aparte del prototipo', 'Desde el 5 de octubre las reglas de la app viven en un documento propio que Alejandro aprueba parte por parte. El prototipo solo las dibuja: no inventa reglas. Esta lista se va a armar desde ese documento.'],
      ['✓', 'Las cajeras pasan a la app', 'Apenas la app esté en el servidor: suben las fotos de los pagos y reportan el fondo al abrir y al cerrar, en un equipo fijo de la caja, cada una con su clave corta (se cambia cada 90 días). Arranca el turno de la mañana dos semanas y después el de la noche. El grupo de caja queda de respaldo, y un mismo comprobante nunca cuenta dos veces.'],
      ['✓', 'Cómo se firma', 'Con la cara o la huella del teléfono; si falla, con el código de respaldo.'],
      ['✓', 'El motivo, según el riesgo', 'Nada en lo chico; motivo si cambia montos; motivo y firma en lo cerrado o delicado. Al anular y en los ajustes, siempre.'],
      ['✓', 'Siempre aprueba otra persona', 'Nadie aprueba lo que preparó, ni dentro de su tope: el tope dice hasta cuánto aprueba cada rol lo que preparó otro. Una vez al mes Alejandro revisa lo que se aprobó dentro de los topes.'],
      ['✓', 'Quién cambia los parámetros', 'Jose cambia los catálogos (categorías y métodos de pago) y Alejandro todo lo demás. A Alejandro le llega un aviso de cada cambio de Jose.'],
    ]],
    ['Para decidir (Alejandro) · dinero y socios', [
      ['?', 'Los $ 500 de consumo de los socios', '¿Son $ 500 cada uno o entre los dos? Propuesta: a precio de carta; lo que pase del tope se suma a los retiros de ese socio; lo que sobra no se acumula; las invitaciones a proveedores o clientes no cuentan.'],
      ['?', 'Socios: su parte, los retiros y el reparto', '¿Con qué parte está cada socio y las cuentas a nombre de Eliana cuentan como del negocio (Q4)? Propuesta para la Q5: los retiros son anticipos de utilidades, se registran el mismo día, se avisa al otro socio y se liquidan cada trimestre. Falta el tope de retiro por socio al mes y si el reparto lo aprueban los dos con su código. En el prototipo la parte de cada uno sale «por confirmar».'],
      ['?', 'Retiros de más de $ 200', 'La propuesta Q1 dice que los apruebes tú. El retiro de Luis de $ 500 quedó registrado al instante. ¿Pide tu aprobación o no?'],
      ['?', 'Tasa de la caja y caja chica', 'El fondo fijo de la caja ya está decidido (5-oct). Falta: ¿a qué tasa recibe dólares la caja si la carta está en euros (Q2)? ¿Se pagan gastos desde la caja (Q3)? Propuesta: el resto a la bóveda cada noche, y una caja chica aparte de $ 150 con foto de cada gasto y reposición semanal.'],
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
    ['Mejorado el 5 de octubre: más fácil de usar', [
      ['✓', 'Guardar solo lo que se tocó', 'Al editar una ficha solo se guardan los campos que se cambiaron. Si un número queda 10 veces más grande o más chico, la app pregunta si fue la coma. El registro de cambios dice «Descanso → Tarde», no códigos.'],
      ['✓', 'No se pierde lo escrito', 'Si hay algo a medias, salir pregunta «¿Salir sin guardar?». Las respuestas de Cecilia se guardan solas al salir del cuadro.'],
      ['✓', 'Firmar sabiendo qué se firma', 'La ventana del código dice qué, a quién y cuánto, y el botón dice la acción («Aprobar $ 200»). La casilla acepta pegar y el relleno automático del teléfono. Pedir un préstamo ya no pide código; aprobarlo sí.'],
      ['✓', 'Lo aprobado queda con candado', 'Al aprobar el lote del lunes, sus cuentas y montos quedan con candado y el sello dice el total y la hora. «Cambiar el lote» pide el motivo y muestra solo lo que cambió (ver la ronda de la tarde).'],
      ['✓', 'Sin prueba no hay sello', 'Una falta justificada, la firma de un préstamo o una diferencia del banco piden el archivo ahí mismo. Sin archivo quedan «sin soporte», nunca con sello.'],
      ['✓', 'Reservas más claras', 'Nueva reserva pregunta Hoy, Mañana u Otro día; ninguna hora se esconde en el libro; «Anular reserva» va aparte; Llegó y No vino se pueden deshacer. Los avisos al grupo muestran si salieron, como en WhatsApp.'],
      ['✓', 'Mejor en el teléfono', 'Lupa para buscar en toda la app, sin importar las tildes; botones de al menos 44 px; montos que no se parten; la pestaña elegida siempre a la vista; textos sin «fases»; letra y bordes más claros; la raya roja solo en columnas de plata.'],
      ['✓', 'Teclado', 'Enter abre la ficha, Escape cierra y el teclado vuelve a la fila donde estaba.'],
    ]],
    ['Mejorado el 5 de octubre en la tarde: 16 mejoras de uso', [
      ['✓', 'Corregir un lote ya aprobado', '«Cambiar el lote» pide el motivo y muestra solo lo que cambió; se aprueba solo esa diferencia, con un sello nuevo. Si el lote ya salió, el cambio va al grupo como «Corrección del lote». Aprobar y enviar son un solo paso, con una sola firma. Igual en la nómina.'],
      ['✓', 'El lunes en el teléfono, en orden', 'La duda va dentro de su línea, con las dos capturas a la vista; una barra fija dice qué falta; lo pagado va en renglones cortos. En la computadora las capturas se pueden arrastrar desde una carpeta o desde WhatsApp.'],
      ['✓', '¿Llegamos a la nómina?', 'En el Inicio, una hoja con lo que hay, lo que entra y lo que sale hasta la próxima nómina, y el costo de comida más personal debajo del termómetro. Es propuesta: cuánta venta contar y la meta están por decidir.'],
      ['✓', 'Fiscal más claro', 'Cada monto en su moneda, con «≈ $» debajo de lo que está en bolívares; cada obligación sale del mismo cálculo que su hoja; la hoja de IVA avisa lo que falta antes de declarar; cada obligación lleva a su soporte.'],
      ['✓', 'Quién puede qué, en un solo lugar', 'Lo que mueve plata de un aprendiz, o lo que pasa el tope de alguien, espera la firma de otra persona. Las decisiones de un toque se pueden deshacer y reabrir con motivo.'],
      ['✓', 'Formularios que piden lo necesario', 'Registrar un egreso empieza por quién se va; la bóveda registra «con diferencia» si lo escrito no cuadra con la foto; las vacaciones se eligen en un calendario que salta los descansos y feriados; Nueva persona pide lo necesario para pagarle.'],
      ['✓', 'Recursos humanos: avisos que se cierran ahí mismo', 'Los avisos van por urgencia y cada uno trae su botón (renovar, subir el certificado, programar vacaciones). La falta y su justificativo son un solo registro.'],
      ['✓', 'Reservas, direcciones y búsqueda', 'Avisa si la mesa ya está tomada; el recordatorio abre WhatsApp con el texto listo. Cada pantalla tiene su dirección y el «Atrás» del teléfono funciona. El buscador encuentra montos y referencias. Pestañas y calendario pensados para el teléfono.'],
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
    render: () => `<div class="pagina">${A.cab('Revisión del prototipo · 6 de octubre', 'Lo que falta y lo que cambió', 'Primero lo que Alejandro decidió el 5 y el 6 de octubre; después lo que falta decidir y lo que tiene que revisar Jose; al final, lo que se agregó, lo que mejoró, lo que se corrigió y lo que queda para después. Desde el 5 de octubre las reglas viven en un documento aparte, y esta lista se va a armar desde ahí.')}
      ${REV.map(([t, items]) => `<div class="sec"><h2>${esc(t)}</h2></div><ul class="lista revision">${items.map(([m, a, b]) => `<li><span class="lead ${m === '?' ? 'aviso' : m === '✓' ? 'ok' : ''}" style="width:30px;height:30px">${m === '?' ? ic('info', 's') : m === '✓' ? ic('check', 's') : ic('reloj', 's')}</span><span><b>${esc(a)}</b><small>${esc(b)}</small></span></li>`).join('')}</ul>`).join('')}
    </div>`,
  };
})();
