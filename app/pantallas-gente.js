/* Documentos y Análisis. (Recursos humanos vive en pantallas-rrhh.js.) */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, $, esc, fmt, dinero, ic, tag, puede } = A;

  /* =============== DOCUMENTOS =============== */
  PANT.documentos = {
    titulo: 'Documentos', grupo: 'Para decidir', icono: 'documentos', mod: 'documentos', tab: 'Docs', camino: 'Documentos', palabras: 'archivo archivos drive pdf carpeta',
    // cada carpeta que ve quien busca («Documentos › Estados de cuenta»)
    secciones: () => D.CARPETAS.filter(c => c.ven.includes(S.usuario.id)).map(c => [c.id, c.nombre.split(' (')[0], 'carpeta']),
    subs: ['todas'], // «Todas» también tiene su dirección (#documentos~todas)
    render: (sub = 'todas') => {
      const mias = D.CARPETAS.filter(c => c.ven.includes(S.usuario.id));
      const archivos = D.ARCHIVOS.filter(a => mias.some(c => c.id === a.carpeta) && (sub === 'todas' || a.carpeta === sub));
      return `<div class="pagina">${A.cab('El drive de la empresa', 'Documentos', 'Cada archivo enlazado a lo que respalda: el permiso, la factura, el pago o la ficha. Nada se borra; subir otra vez crea una versión nueva.', A.boton('documentos', 'Subir un archivo', 'data-acc="pronto"', { icono: 'subir' }))}
        <div class="cifras">${mias.map(c => `<button class="cifra" data-sub="${c.id}"><span class="etq">${esc(c.nombre)}</span><b>${fmt(c.n, 0)}</b><small>${c.restringida ? ic('candado', 'xs') + ' Solo dueño y RRHH' : 'archivos'}</small></button>`).join('')}</div>
        ${D.CARPETAS.length > mias.length ? (n => `<p class="nota gris">${ic('candado', 's')}<span>Hay ${n} ${n === 1 ? 'carpeta' : 'carpetas'} que no ves por tu rol.</span></p>`)(D.CARPETAS.length - mias.length) : ''}
        <div class="filtros"><div class="seg" role="group" aria-label="Carpeta"><button data-sub="todas" aria-pressed="${sub === 'todas'}">Todas</button>${mias.map(c => `<button data-sub="${c.id}" aria-pressed="${sub === c.id}">${esc(c.nombre.split(' (')[0])}</button>`).join('')}</div></div>
        ${A.tabla({ cols: [{ t: 'Archivo', cls: 'p' }, { t: 'Carpeta', cls: 'x' }, { t: 'Respalda a', cls: 'x' }, { t: 'Vence', cls: 'r' }, { t: '', cls: 'e' }], filas: archivos.map(a => ({ abrir: 'archivo:' + a.id, celdas: [`<b>${esc(a.nombre)}</b><small>Subido el ${esc(a.fecha)}${a.version > 1 ? ' · versión ' + a.version : ''}</small>`, esc(D.CARPETAS.find(c => c.id === a.carpeta).nombre), esc(a.vinculo), esc(a.vence), a.vence !== '—' ? tag('Avisa antes', 'aviso') : ''] })) })}</div>`;
    },
  };
  FICHAS.archivo = id => {
    const a = D.ARCHIVOS.find(x => x.id === id);
    return { titulo: a.nombre, sub: esc(D.CARPETAS.find(c => c.id === a.carpeta).nombre), mod: 'documentos', obj: a, registro: a.nombre,
      bloques: [{ html: `<div class="captura"><div class="recibo">${ic(/pdf$/i.test(a.nombre) ? 'archivo' : 'imagen', 'l')}<strong>${esc(a.nombre)}</strong><span class="muted">Vista previa simulada</span></div></div>` },
        { filas: [{ l: 'Respalda a', v: (m => a.abrir && m && puede(m) ? `<button class="enlace" data-abrir="${esc(a.abrir)}">${esc(a.vinculo)}</button>` : esc(a.vinculo))(a.abrir && ({ obligacion: 'fiscal', zeta: 'fiscal', permiso: 'fiscal', retrec: 'fiscal', retemi: 'fiscal', conciliacion: 'bancos', factura: 'proveedores' })[a.abrir.split(':')[0]]) }, { l: 'Subido', v: esc(a.fecha) }, { l: 'Vence', v: esc(a.vence), campo: { k: 'vence', tipo: 'texto' } }, { l: 'Versión', v: a.version }] },
        { html: '<p class="muted">Se abre con un enlace que caduca en 5 minutos. Descargarlo pide tu código y queda en el registro de accesos.</p>' }],
      acciones: [{ txt: 'Descargar', acc: 'descargar', icono: 'descargar' }, { txt: 'Subir versión nueva', acc: 'pronto', icono: 'subir', solo: 'editar' }] };
  };

  /* =============== ANÁLISIS =============== */
  const r2 = n => Math.round(n * 100) / 100;
  // el punto de equilibrio sale de lo mismo que la meta del día del parte: costos fijos (los pone Alejandro en Parámetros) ÷ 30 días ÷ (1 − lo variable), por 7 días
  const VARIABLE = 0.507;
  const equilibrio = () => { const fijos = D.PARAMS.costosFijos || 38060; const semana = r2(fijos * 7 / 30); return { fijos, semana, dia: r2(fijos / 30 / (1 - VARIABLE)), eq: r2(semana / (1 - VARIABLE)) }; };
  // lo que más se vende cuenta las últimas 4 semanas
  const venta4 = () => D.SEMANAS.slice(-4).reduce((s, x) => s + x[1], 0);
  // termómetro de la comida de la semana del 28 sep al 4 oct: en % de lo vendido en comida · fugas = [insumo, $ que explica, su ficha del radar]
  const TERMO = { gasto: 46, recetas: 33, dif: 2180, cobertura: 81, fugas: [['Punta de ganso', 640, 'i2'], ['Queso telita', 410, 'i1'], ['Pernil', 380, 'i5'], ['Aceite', 210, ''], ['Harina de maíz', 140, 'i4']] };
  TERMO.ventaComida = r2(TERMO.dif / ((TERMO.gasto - TERMO.recetas) / 100));
  // la barra (bebidas) se mide aparte: lo que costó lo que salió de la barra, en % de lo vendido en bebida (inventado)
  TERMO.bebida = { gasto: 28 };

  /* ---------- comida + personal (el costo primo) ----------
     Sobre TODA la venta de la semana (no solo la comida, como el termómetro): lo que costó la comida y la bebida, más lo que cuesta el personal
     (las dos nóminas, el 10 % repartido, el premio del mes y los aportes del negocio). El personal sale del mes de septiembre: la parte de una
     semana es 7 de 30 días. La meta la fija Alejandro en Parámetros (por fijar mientras tanto) · lo ve quien ve la nómina, aunque sea agrupada */
  const costoPrimo = () => {
    const venta = D.SEMANAS[D.SEMANAS.length - 1][1]; const vC = TERMO.ventaComida, vB = r2(venta - vC);
    const cC = r2(vC * TERMO.gasto / 100), cB = r2(vB * TERMO.bebida.gasto / 100);
    // septiembre: las corridas de las dos quincenas (formal, interna, el 10 % y el premio), cada una en dólares a la tasa de su día
    const corr = D.NOMINA.corridas.filter(c => /septiembre/.test(c.grupo));
    const sumaTipo = t => r2(corr.filter(c => (Array.isArray(t) ? t.includes(c.tipo) : c.tipo === t)).reduce((s, c) => s + (c.usd || 0), 0));
    // los aportes del negocio, en Bs: pensiones (todo), IVSS (12 de 16,5), FAOV (2 de 3) e INCES (un tercio del trimestre), a la tasa del último pago
    const P = id => (D.PARAFISCALES.find(p => p.id === id) || { monto: 0 }).monto;
    const aporBs = r2(P('o8') + P('o4') * 12 / 16.5 + P('o5') * 2 / 3 + P('o3') / 3); const tasa = D.NOMINA_FORMAL.tasaPago; const apor = r2(aporBs / tasa);
    const mes = { formal: sumaTipo('formal'), interna: sumaTipo('interna'), diez: sumaTipo('diez'), premio: sumaTipo('premio'), apor, aporBs, tasa };
    mes.total = r2(mes.formal + mes.interna + mes.diez + mes.premio + mes.apor);
    const personal = r2(mes.total * 7 / 30);
    const pc = r2((cC + cB) / venta * 100), pp = r2(personal / venta * 100);
    return { venta, vC, vB, cC, cB, comida: r2(cC + cB), personal, mes, pc, pp, total: r2(pc + pp), meta: D.PARAMS.metaPrimo };
  };
  A.costoPrimo = costoPrimo;
  const pctTxt = n => fmt(n, 1) + ' %';
  // la suma de libro debajo del termómetro: Comida y bebida + Personal = Costo primo, con doble subrayado y la raya de la meta
  A.sumaPrimo = () => {
    if (!puede('nomina')) return '';
    const k = costoPrimo(); const meta = k.meta; const pasa = meta != null && k.total > meta;
    const filas = [{ t: 'Comida y bebida', sub: 'lo que costó lo que salió de la cocina y la barra', v: pctTxt(k.pc), abrir: 'primo:comida' },
      { signo: '+', t: 'Personal', sub: 'las dos nóminas, el 10 % y los aportes', v: pctTxt(k.pp), abrir: 'primo:personal' },
      { signo: '=', t: 'Costo primo', v: pctTxt(k.total), abrir: 'primo:total', clase: 'total' }];
    return `<article class="hoja suma-primo" aria-labelledby="primo-t">
      <div class="hoja-cab"><h2 id="primo-t">${ic('analisis')}Comida + personal</h2>${meta == null ? tag('Meta por fijar', '') : pasa ? tag('Pasa la meta', 'aviso') : tag('Dentro de la meta', 'ok')}</div>
      <p class="muted">Semana del 28 sep al 4 oct · sobre toda la venta de la semana (${dinero(k.venta, 'usd', 0)})</p>
      ${A.sumaLibro(filas, { etiqueta: 'Comida y personal sobre la venta de la semana' })}
      <div class="medidor primo" role="img" aria-label="Costo primo ${pctTxt(k.total)} de la venta${meta == null ? ', meta por fijar' : ', la meta es ' + fmt(meta, 0) + ' %'}"><span class="${pasa ? 'aviso' : ''}" style="width:${Math.min(100, k.total)}%"></span>${meta != null ? `<i style="left:${Math.min(100, meta)}%"></i>` : ''}</div>
      <p class="leyenda"><span>${meta == null ? 'Meta por fijar: la pone Alejandro en Parámetros' : 'La raya marca la meta: ' + fmt(meta, 0) + ' %' + (pasa ? ' · ' + fmt(k.total - meta, 1) + ' puntos arriba' : '')}</span><span>100 %</span></p>
    </article>`;
  };
  FICHAS.primo = k => {
    const c = costoPrimo(); const meta = c.meta; const M = c.mes;
    const fila = (l, v) => ({ l, v });
    const x = {
      comida: { t: 'Comida y bebida: ' + pctTxt(c.pc), filas: [fila('Venta de la semana', dinero(c.venta, 'usd') + ` <small class="tenue">comida ${dinero(c.vC, 'usd', 0)} · bebida ${dinero(c.vB, 'usd', 0)}</small>`),
          fila('Lo que costó la comida', dinero(c.cC, 'usd') + ` <small class="tenue">${TERMO.gasto} % de lo vendido en comida (el termómetro)</small>`),
          fila('Lo que costó la bebida', dinero(c.cB, 'usd') + ` <small class="tenue">${TERMO.bebida.gasto} % de lo vendido en bebida</small>`),
          fila('Comida y bebida', `<b>${dinero(c.comida, 'usd')}</b> <small class="tenue">÷ ${dinero(c.venta, 'usd', 0)} = ${pctTxt(c.pc)}</small>`)],
        nota: 'El termómetro mide la comida sobre lo vendido en comida. Aquí va sobre toda la venta, para sumarle el personal.' },
      personal: { t: 'Personal: ' + pctTxt(c.pp), filas: [fila('Nómina formal de septiembre', dinero(M.formal, 'usd') + ' <small class="tenue">las dos quincenas</small>'), fila('Nómina interna de septiembre', dinero(M.interna, 'usd')),
          fila('El 10 % repartido', dinero(M.diez, 'usd') + ' <small class="tenue">el de septiembre, a la tasa del euro de ese día</small>'), fila('Premio del mes', dinero(M.premio, 'usd')),
          fila('Aportes del negocio', `${dinero(M.apor, 'usd')} <small class="tenue">${dinero(M.aporBs, 'bs', 0)} a ${fmt(M.tasa)}: pensiones, IVSS, FAOV e INCES</small>`),
          fila('Personal del mes', dinero(M.total, 'usd')), fila('La parte de una semana', `<b>${dinero(c.personal, 'usd')}</b> <small class="tenue">7 de 30 días · ÷ ${dinero(c.venta, 'usd', 0)} = ${pctTxt(c.pp)}</small>`)],
        nota: 'Es el costo total del personal: lo que se paga y lo que se aporta. Los recargos de noche y de domingo entran cuando el motor de nómina los calcule.' },
      total: { t: 'Costo primo: ' + pctTxt(c.total), filas: [fila('Comida y bebida', pctTxt(c.pc)), fila('Personal', pctTxt(c.pp)), fila('Costo primo', `<b>${pctTxt(c.total)}</b> <small class="tenue">de la venta de la semana</small>`), fila('Meta', meta == null ? tag('Por fijar', 'aviso') : fmt(meta, 0) + ' %')],
        nota: 'Comida y personal son los dos costos más grandes de un restaurante: juntos dicen cuánto queda para todo lo demás. La meta la fija Alejandro en Parámetros; mientras tanto, el Inicio dice «meta por fijar».' },
    }[k] || { t: 'Comida + personal', filas: [], nota: '' };
    return { titulo: x.t, sub: 'Comida + personal · semana del 28 sep al 4 oct', mod: 'nomina', bloques: [{ filas: x.filas }, { html: `<p class="muted">${esc(x.nota)}</p>` },
      { html: `<p class="muted">La venta es la venta neta, sin IVA. El 10 % de servicio no entra en la venta ${tag('Por confirmar', 'aviso')}, como en el ticket promedio.</p>` }],
      acciones: k === 'total' && puede('parametros', 'aprobar') ? [{ txt: meta == null ? 'Fijar la meta' : 'Cambiar la meta', acc: 'ir-a', arg: 'parametros/negocio', icono: 'parametros' }] : [] };
  };
  FICHAS.termo = k => {
    const T = TERMO; const otros = r2(T.dif - T.fugas.reduce((s, f) => s + f[1], 0));
    const x = {
      gasto: ['Se gastó en comida', T.gasto + ' %', 'Lo que costó la comida que salió de la cocina en la semana, entre lo vendido en comida. Sale de las compras y del inventario: lo que había al empezar, más lo que llegó, menos lo que queda.'],
      recetas: ['Dicen las recetas', T.recetas + ' %', 'Lo que debió costar lo vendido según las recetas del recetario propio (no las de Odoo, que están mal desde junio).'],
      diferencia: ['Diferencia', dinero(T.dif, 'usd', 0), `Son ${T.gasto - T.recetas} puntos de lo vendido en comida en la semana (≈ ${dinero(T.ventaComida, 'usd', 0)}). Los 5 insumos de la lista explican ${dinero(r2(T.dif - otros), 'usd', 0)}; el resto, ${dinero(otros, 'usd', 0)}, se reparte entre muchos.`],
      cobertura: ['Cobertura', T.cobertura + ' %', `De cada ${dinero(100, 'usd', 0)} vendidos en comida, ${dinero(T.cobertura, 'usd', 0)} son de platos con receta. El ${100 - T.cobertura} % que falta no se puede comparar: hay que cargar esas recetas.`],
    }[k] || ['Termómetro de la comida', '', ''];
    return { titulo: x[0], sub: 'Termómetro de la comida · 28 sep al 4 oct', mod: 'analisis', tags: k === 'gasto' || k === 'diferencia' ? [['Fuga', 'alerta']] : [],
      bloques: [{ filas: [{ l: x[0], v: '<b>' + x[1] + '</b>' }] }, { html: `<p>${esc(x[2])}</p>` }, { html: '<p class="muted">Comida y barra se miden por separado. Lo que comen los socios y el personal entra por el POS con su receta: no cuenta como merma.</p>' }] };
  };
  FICHAS.fuga = i => {
    const f = TERMO.fugas[+i] || TERMO.fugas[0]; const ins = D.INSUMOS.find(x => x.id === f[2]); const c = ins ? (ins.ahora / ins.antes - 1) * 100 : 0;
    return { titulo: f[0], sub: 'Termómetro de la comida · 28 sep al 4 oct', mod: 'analisis', tags: [['Explica ' + dinero(f[1], 'usd', 0), 'alerta']],
      bloques: [{ filas: [{ l: 'De la diferencia de la semana', v: dinero(f[1], 'usd', 0) + ` <small class="tenue">de ${dinero(TERMO.dif, 'usd', 0)}</small>` }].concat(ins ? [{ l: 'Precio', v: `${dinero(ins.antes, 'usd')} → ${dinero(ins.ahora, 'usd')} por ${esc(ins.unidad)} <small class="tenue">${c > 0 ? '+' : ''}${fmt(c, 1)} %</small>` }, { l: 'Proveedor', v: esc(ins.prov) }] : [{ l: 'Precio', v: 'No cambió' }]) },
        { html: ins ? `<p class="muted">Una parte es el precio y otra, la cantidad: salió más de lo que dicen las recetas. ${ins.mejor ? 'Otro proveedor lo vendió más barato: ' + esc(ins.mejor) + '.' : ''}</p><button class="enlace" data-abrir="insumo:${ins.id}">Ver en el radar de precios ${ic('derecha', 's')}</button>` : '<p class="muted">No está en el radar de precios porque su precio no cambió: la diferencia es de cantidad. Salió más aceite del que dicen las recetas de las frituras.</p>' }] };
  };
  const PERIODO_PLATOS = 'últimas 4 semanas (' + D.SEMANAS[D.SEMANAS.length - 4][0] + ' – 4 oct)';
  PANT.analisis = {
    titulo: 'Análisis', grupo: 'Para decidir', icono: 'analisis', mod: 'analisis', tab: 'Análisis', palabras: 'ventas numeros reporte',
    secciones: [['ventas', 'Ventas', 'ticket pedidos equilibrio'], ['termometro', 'Termómetro de la comida', 'costo comida recetas merma'], ['precios', 'Radar de precios', 'precio insumos'], ['decisiones', 'Medir decisiones', 'decision antes despues']],
    render: (sub = 'ventas') => {
      let cuerpo = '';
      if (sub === 'ventas') {
        const ult = D.SEMANAS[D.SEMANAS.length - 1][1], ant = D.SEMANAS[D.SEMANAS.length - 2][1];
        // el mismo ticket del parte de la mañana: venta neta ÷ pedidos, en dólares (se define en la ficha kpi:ticket)
        const sem = A.TICKET.semana; const E = equilibrio();
        cuerpo = `<div class="cifras">
            ${A.cifra({ etq: 'Esta semana (28 sep – 4 oct)', valor: dinero(ult, 'usd', 0), sub: `<span class="up">+${fmt((ult / ant - 1) * 100, 1)} %</span> contra la anterior`, abrir: 'semana:11' })}
            ${A.cifra({ etq: 'Pedidos por día', valor: fmt(sem.pedidos / 7, 0), sub: '<span class="down">−7 %</span> contra julio · ' + sem.pedidos + ' en la semana', abrir: 'decision:md1' })}
            ${A.cifra({ etq: 'Ticket promedio de la semana', valor: dinero(A.ticket(sem), 'usd'), sub: dinero(sem.venta, 'usd', 0) + ' ÷ ' + sem.pedidos + ' pedidos · el parte usa el de ayer', abrir: 'kpi:ticket' })}
            ${A.cifra({ etq: 'Punto de equilibrio semanal', valor: dinero(E.eq, 'usd', 0), sub: ult >= E.eq ? 'esta semana se cubrió' : 'esta semana no se cubrió', tono: ult >= E.eq ? '' : 'aviso', abrir: 'equilibrio:semana' })}
          </div>
          <article class="hoja"><div class="hoja-cab"><h2>Venta por semana</h2><span class="muted">Últimas 12 semanas · la raya punteada es el punto de equilibrio (${dinero(E.eq, 'usd', 0)}) · toca una barra para ver su venta</span></div>
            ${A.barrasSVG({ datos: D.SEMANAS.map(s => [s[0], s[1], dinero(s[1], 'usd', 0)]), prefijo: 'Semana del ', meta: E.eq, etiquetaY: v => v ? dinero(v / 1000, 'usd', 0) + 'k' : dinero(0, 'usd', 0), resaltar: D.SEMANAS.length - 1, id: 'sem', abrir: i => 'semana:' + i, cada: 3, titulo: 'Venta por semana de las últimas 12 semanas', metaLeer: 'La raya punteada es el punto de equilibrio: ' + dinero(E.eq, 'usd', 0) })}</article>
          <div class="rejilla"><div class="c6"><article class="hoja"><div class="hoja-cab"><h2>Lo que más se vende</h2><span class="muted">${esc(PERIODO_PLATOS)}</span></div>${A.tabla({ cols: [{ t: 'Plato', cls: 'p' }, { t: 'Unidades', cls: 'r x' }, { t: '% de la venta', cls: 'r' }], filas: D.PLATOS.map((p, i) => ({ abrir: 'plato:' + i, celdas: [`<b>${esc(p[0])}</b>`, fmt(p[1], 0), fmt(p[2], 1) + ' %'] })) })}</article></div>
          <div class="c6"><article class="hoja"><h2>${ic('calendario')}Fechas que vienen</h2><ul class="lista">${D.EVENTOS.map(e => `<li><button class="fila" data-abrir="fecha:${e.id}"><span class="lead ${e.tipo === 'feriado' ? 'aviso' : 'info'}">${ic('calendario')}</span><span class="medio"><b>${esc(e.nombre)}</b><small>${esc(e.fecha)} · ${esc(e.efecto)}</small></span>${ic('derecha', 's chev')}</button></li>`).join('')}</ul></article></div></div>`;
      }
      if (sub === 'termometro') cuerpo = `<article class="hoja"><div class="hoja-cab"><h2>${ic('termometro')}Termómetro de la comida · semana del 28 sep al 4 oct</h2>${tag('Fuga', 'alerta')}</div>
          <div class="cifras">${A.cifra({ etq: 'Se gastó en comida', valor: TERMO.gasto + ' %', sub: 'de lo vendido en comida', tono: 'alerta', abrir: 'termo:gasto' })}${A.cifra({ etq: 'Dicen las recetas', valor: TERMO.recetas + ' %', sub: 'recetario propio', abrir: 'termo:recetas' })}${A.cifra({ etq: 'Diferencia', valor: dinero(TERMO.dif, 'usd', 0), sub: 'en la semana', tono: 'alerta', abrir: 'termo:diferencia' })}${A.cifra({ etq: 'Cobertura', valor: TERMO.cobertura + ' %', sub: 'de lo vendido tiene receta', abrir: 'termo:cobertura' })}</div>
          <p class="etq">Los insumos que más explican la diferencia · toca uno para ver su ficha</p>
          <div class="barras">${TERMO.fugas.map(([n, v], i) => `<button class="barra" data-abrir="fuga:${i}"><span>${n}</span><b>${dinero(v, 'usd', 0)}</b><div class="pista"><span class="alerta" style="width:${v / 6.4}%"></span></div></button>`).join('')}</div>
          <p class="muted">Comida y barra se miden por separado. Las recetas salen del recetario propio, no de las de Odoo (que están mal desde junio).</p></article>${A.sumaPrimo()}`;
      if (sub === 'precios') cuerpo = `<p class="desc">Avisa cuando un insumo sube más de 5 % contra la compra anterior o cuando otro proveedor lo vendió más barato en las últimas 4 semanas.</p>` +
        A.tabla({ cols: [{ t: 'Insumo', cls: 'p' }, { t: 'Antes', cls: 'r x plata' }, { t: 'Ahora', cls: 'r plata' }, { t: 'Más barato en', cls: 'x' }, { t: 'Cambio', cls: 'e' }], filas: D.INSUMOS.map(i => { const c = (i.ahora / i.antes - 1) * 100; return { abrir: 'insumo:' + i.id, celdas: [`<b>${esc(i.nombre)}</b><small>${esc(i.prov)} · por ${esc(i.unidad)}</small>`, dinero(i.antes, 'usd'), dinero(i.ahora, 'usd'), esc(i.mejor || '—'), tag((c > 0 ? '+' : '') + fmt(c, 1) + ' %', c > 5 ? 'alerta' : c > 0 ? 'aviso' : 'ok')] }; }) });
      if (sub === 'decisiones') cuerpo = `<p class="desc">Antes de un cambio grande (precios, menú, horario) se marca la fecha. La app compara 4 semanas antes contra 4 semanas después, descontando la temporada.</p>` +
        `<ul class="lista">${D.DECISIONES.map(d => `<li><button class="fila" data-abrir="decision:${d.id}"><span class="lead ${d.tono}">${ic('analisis')}</span><span class="medio"><b>${esc(d.nombre)}</b><small>${esc(d.resultado)}</small></span><span class="fin">${A.estadoTag(d.estado)}${ic('derecha', 's chev')}</span></button></li>`).join('')}</ul>${A.boton('analisis', 'Medir una decisión nueva', 'data-acc="pronto"', { tono: 'sec', icono: 'mas' })}`;
      return `<div class="pagina">${A.cab('Para decidir con números', 'Análisis', 'Ventas, costos de la comida, precios de los insumos y el efecto de cada decisión. Sale de los resúmenes diarios del POS de Odoo.')}
        ${A.subnav([['ventas', 'Ventas'], ['termometro', 'Termómetro de la comida'], ['precios', 'Radar de precios', D.INSUMOS.filter(i => i.ahora / i.antes > 1.05).length], ['decisiones', 'Medir decisiones']], sub)}${cuerpo}</div>`;
    },
  };
  FICHAS.insumo = id => {
    const i = D.INSUMOS.find(x => x.id === id); const c = (i.ahora / i.antes - 1) * 100;
    return { titulo: i.nombre, sub: 'Radar de precios · por ' + esc(i.unidad), mod: 'analisis', obj: i, tags: [[(c > 0 ? '+' : '') + fmt(c, 1) + ' %', c > 5 ? 'alerta' : c > 0 ? 'aviso' : 'ok']],
      bloques: [{ filas: [{ l: 'Compra anterior', v: dinero(i.antes, 'usd') }, { l: 'Última compra', v: dinero(i.ahora, 'usd') }, { l: 'Proveedor', v: esc(i.prov) }, { l: 'Más barato en las últimas 4 semanas', v: esc(i.mejor || 'Nadie') }] }, { html: A.spark([i.antes, i.antes * 1.01, i.antes * .99, i.antes * 1.02, (i.antes + i.ahora) / 2, i.ahora], { etqIni: 'hace 6 compras', etqFin: 'hoy ' + dinero(i.ahora, 'usd') }) }] };
  };
  FICHAS.decision = id => {
    const d = D.DECISIONES.find(x => x.id === id);
    return { titulo: d.nombre, sub: 'Desde el ' + esc(d.desde), mod: 'analisis', obj: d, tags: [[A.estadoTag(d.estado).replace(/<[^>]+>/g, ''), d.estado === 'medida' ? 'ok' : 'info']],
      // ticket con la misma definición del parte y de Análisis (venta neta ÷ pedidos, en dólares), con la venta por semana de D.SEMANAS:
      // antes, las 3 semanas de julio ÷ 21 días ÷ 103 pedidos · después, las 4 semanas desde el 24 de agosto ÷ 28 días ÷ 96 pedidos
      bloques: [{ filas: d.id === 'md1' ? [{ l: 'Pedidos por día, antes', v: '103' }, { l: 'Pedidos por día, después', v: '96 (−7 %, rango −12 % a −1 %)' }, { l: 'Venta de carta por día', v: '−11 %' }, { l: 'Ticket (venta neta ÷ pedidos)', v: dinero(28.83, 'usd') + ' → ' + dinero(27.53, 'usd') }] : [{ l: 'Antes (4 semanas)', v: 'Medido' }, { l: 'Después', v: '2 de 4 semanas' }] }, { html: `<p>${esc(d.resultado)}</p><p class="muted">Pesa también el contexto del país (luz, terremoto de junio, tasa). La app lo anota al lado, no lo esconde.</p>` }] };
  };
  FICHAS.semana = i => {
    const k = +i; const s = D.SEMANAS[k]; const ant = D.SEMANAS[k - 1]; const E = equilibrio();
    return { titulo: 'Semana del ' + s[0], sub: 'Ventas', mod: 'analisis', bloques: [{ filas: [{ l: 'Venta', v: dinero(s[1], 'usd', 0) }, { l: 'Semana anterior', v: ant ? dinero(ant[1], 'usd', 0) + ` <small class="tenue">${s[1] >= ant[1] ? '+' : '−'}${fmt(Math.abs(s[1] / ant[1] - 1) * 100, 1)} %</small>` : 'Fuera de las 12 semanas' }, { l: 'Punto de equilibrio', v: dinero(E.eq, 'usd', 0) + ` <small class="tenue">${s[1] >= E.eq ? 'se cubrió' : 'no se cubrió'}</small>` }] }] };
  };
  // el punto de equilibrio de la semana: la misma cuenta que la meta del día del parte de la mañana
  FICHAS.equilibrio = () => {
    const E = equilibrio(); const ult = D.SEMANAS[D.SEMANAS.length - 1][1]; const sobra = r2(ult - E.eq);
    return { titulo: 'Punto de equilibrio semanal', sub: 'Análisis · lo que hay que vender para cubrir los costos', mod: 'analisis',
      bloques: [{ filas: [{ l: 'Costos fijos del mes', v: dinero(E.fijos, 'usd', 0) + ' <small class="tenue">los pone Alejandro en Parámetros</small>' }, { l: 'Los de una semana (7 de 30 días)', v: dinero(E.semana, 'usd') }, { l: 'Lo variable (comida, comisiones)', v: fmt(VARIABLE * 100, 1) + ' % de la venta' }, { l: 'Punto de equilibrio', v: `<b>${dinero(E.eq, 'usd')}</b> <small class="tenue">= ${dinero(E.semana, 'usd')} ÷ (1 − ${fmt(VARIABLE * 100, 1)} %)</small>` }, { l: 'Esta semana se vendió', v: dinero(ult, 'usd', 0) + ` <small class="tenue">${sobra >= 0 ? 'cubrió y sobraron ' + dinero(sobra, 'usd', 0) : 'faltaron ' + dinero(-sobra, 'usd', 0)}</small>` }] },
        { html: `<p class="muted">Es la meta del día del parte de la mañana (${dinero(E.dia, 'usd', 0)}) por 7 días. Si cambian los costos fijos, se recalcula sola.</p>` }],
      acciones: puede('parametros') ? [{ txt: 'Ver los costos fijos', acc: 'ir-a', arg: 'parametros/negocio', icono: 'parametros' }] : [] };
  };
  // cada plato de «Lo que más se vende»: cuánto se vendió en las últimas 4 semanas
  FICHAS.plato = i => {
    const k = +i; const p = D.PLATOS[k]; const v = venta4(); const venta = r2(v * p[2] / 100);
    return { titulo: p[0], sub: 'Lo que más se vende · ' + esc(PERIODO_PLATOS), mod: 'analisis', tags: [['Puesto ' + (k + 1) + ' de ' + D.PLATOS.length, '']],
      bloques: [{ filas: [{ l: 'Unidades', v: fmt(p[1], 0) + ` <small class="tenue">≈ ${fmt(p[1] / 28, 0)} al día</small>` }, { l: '% de la venta', v: fmt(p[2], 1) + ' %' }, { l: 'Venta del plato', v: '≈ ' + dinero(venta, 'usd', 0) + ` <small class="tenue">de ${dinero(v, 'usd', 0)} en las 4 semanas</small>` }] },
        { html: '<p class="muted">Sale de los resúmenes diarios del POS de Odoo. Cuánto deja cada plato, con su receta y su costo, llega más adelante, cuando las recetas estén arregladas.</p>' }] };
  };
  // cada fecha que viene: qué esperar y qué tener listo; se abre en el calendario
  FICHAS.fecha = id => {
    const e = D.EVENTOS.find(x => x.id === id);
    return { titulo: e.nombre, sub: 'Fechas que vienen · ' + esc(e.fecha), mod: 'analisis', tags: [[e.tipo === 'feriado' ? 'Feriado' : 'Fecha especial', e.tipo === 'feriado' ? 'info' : '']],
      bloques: [{ filas: [{ l: 'Cuándo', v: esc(e.fecha) }, { l: 'Qué esperar', v: esc(e.efecto), largo: true }, ...(e.tipo === 'feriado' ? [{ l: 'Quien trabaje', v: 'Cobra 50 % más del día (es feriado)', largo: true }] : [])] },
        { titulo: 'Para tener listo', html: `<ul class="tiempo">${(e.preparar || []).map((t, k) => `<li><time>${k + 1}</time><span>${esc(t)}</span></li>`).join('')}</ul>` },
        puede('calendario') && e.d ? { html: `<button class="enlace" data-abrir="agendadia:${e.d[0]}-${e.d[1]}">Ver ese día en el calendario ${ic('derecha', 's')}</button>` } : { oculto: true }] };
  };
})();
