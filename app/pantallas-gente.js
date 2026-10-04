/* Documentos y Análisis. (Recursos humanos vive en pantallas-rrhh.js.) */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, $, esc, fmt, dinero, ic, tag, puede } = A;

  /* =============== DOCUMENTOS =============== */
  PANT.documentos = {
    titulo: 'Documentos', grupo: 'Para decidir', icono: 'documentos', mod: 'documentos', tab: 'Docs',
    render: (sub = 'todas') => {
      const mias = D.CARPETAS.filter(c => c.ven.includes(S.usuario.id));
      const archivos = D.ARCHIVOS.filter(a => mias.some(c => c.id === a.carpeta) && (sub === 'todas' || a.carpeta === sub));
      return `<div class="pagina">${A.cab('El drive de la empresa', 'Documentos', 'Cada archivo enlazado a lo que respalda: el permiso, la factura, el pago o la ficha. Nada se borra; subir otra vez crea una versión nueva.', A.boton('documentos', 'Subir un archivo', 'data-acc="pronto"', { icono: 'subir' }))}
        <div class="cifras">${mias.map(c => `<button class="cifra" data-sub="${c.id}"><span class="etq">${esc(c.nombre)}</span><b>${fmt(c.n, 0)}</b><small>${c.restringida ? ic('candado', 'xs') + ' Solo dueño, RRHH y contabilidad' : 'archivos'}</small></button>`).join('')}</div>
        ${D.CARPETAS.length > mias.length ? `<p class="nota gris">${ic('candado', 's')}<span>Hay ${D.CARPETAS.length - mias.length} carpetas que no ves por tu rol.</span></p>` : ''}
        <div class="filtros"><div class="seg" role="group" aria-label="Carpeta"><button data-sub="todas" aria-pressed="${sub === 'todas'}">Todas</button>${mias.map(c => `<button data-sub="${c.id}" aria-pressed="${sub === c.id}">${esc(c.nombre.split(' (')[0])}</button>`).join('')}</div></div>
        ${A.tabla({ cols: [{ t: 'Archivo', cls: 'p' }, { t: 'Carpeta', cls: 'x' }, { t: 'Respalda a', cls: 'x' }, { t: 'Vence', cls: 'r' }, { t: '', cls: 'e' }], filas: archivos.map(a => ({ abrir: 'archivo:' + a.id, celdas: [`<b>${esc(a.nombre)}</b><small>Subido el ${esc(a.fecha)}${a.version > 1 ? ' · versión ' + a.version : ''}</small>`, esc(D.CARPETAS.find(c => c.id === a.carpeta).nombre), esc(a.vinculo), esc(a.vence), a.vence !== '—' ? tag('Avisa antes', 'aviso') : ''] })) })}</div>`;
    },
  };
  FICHAS.archivo = id => {
    const a = D.ARCHIVOS.find(x => x.id === id);
    return { titulo: a.nombre, sub: esc(D.CARPETAS.find(c => c.id === a.carpeta).nombre), mod: 'documentos', obj: a, registro: a.nombre,
      bloques: [{ html: `<div class="captura"><div class="recibo">${ic(/pdf$/i.test(a.nombre) ? 'archivo' : 'imagen', 'l')}<strong>${esc(a.nombre)}</strong><span class="muted">Vista previa simulada</span></div></div>` },
        { filas: [{ l: 'Respalda a', v: esc(a.vinculo) }, { l: 'Subido', v: esc(a.fecha) }, { l: 'Vence', v: esc(a.vence), campo: { k: 'vence', tipo: 'texto' } }, { l: 'Versión', v: a.version }] },
        { html: '<p class="muted">Se abre con un enlace que caduca en 5 minutos. Si la carpeta es sensible (Personal), cada descarga queda registrada.</p>' }],
      acciones: [{ txt: 'Descargar', acc: 'descargar', icono: 'descargar' }, { txt: 'Subir versión nueva', acc: 'pronto', icono: 'subir', solo: 'editar' }] };
  };

  /* =============== ANÁLISIS =============== */
  PANT.analisis = {
    titulo: 'Análisis', grupo: 'Para decidir', icono: 'analisis', mod: 'analisis', tab: 'Análisis',
    render: (sub = 'ventas') => {
      let cuerpo = '';
      if (sub === 'ventas') {
        const ult = D.SEMANAS[D.SEMANAS.length - 1][1], ant = D.SEMANAS[D.SEMANAS.length - 2][1];
        cuerpo = `<div class="cifras">
            ${A.cifra({ etq: 'Esta semana (28 sep – 4 oct)', valor: dinero(ult, 'usd', 0), sub: `<span class="up">+${fmt((ult / ant - 1) * 100, 1)} %</span> contra la anterior`, abrir: 'semana:11' })}
            ${A.cifra({ etq: 'Pedidos por día', valor: '109', sub: '<span class="down">−8 %</span> contra julio', abrir: 'decision:md1' })}
            ${A.cifra({ etq: 'Ticket promedio', valor: '€ 34,40', sub: 'julio: € 37,70' })}
            ${A.cifra({ etq: 'Punto de equilibrio semanal', valor: dinero(27650, 'usd', 0), sub: 'esta semana se cubrió', tono: '' })}
          </div>
          <article class="hoja"><div class="hoja-cab"><h2>Venta por semana</h2><span class="muted">Últimas 12 semanas · la raya es el punto de equilibrio</span></div>
            ${A.barrasSVG({ datos: D.SEMANAS.map(s => [s[0], s[1], dinero(s[1], 'usd', 0)]), meta: 27650, etiquetaY: v => '$' + fmt(v / 1000, 0) + 'k', resaltar: D.SEMANAS.length - 1, id: 'sem' })}</article>
          <div class="rejilla"><div class="c6"><article class="hoja"><h2>Lo que más se vende</h2>${A.tabla({ cols: [{ t: 'Plato', cls: 'p' }, { t: 'Unidades', cls: 'r x' }, { t: '% de la venta', cls: 'r' }], filas: D.PLATOS.map(p => ({ celdas: [`<b>${esc(p[0])}</b>`, fmt(p[1], 0), fmt(p[2], 1) + ' %'] })) })}</article></div>
          <div class="c6"><article class="hoja"><h2>${ic('calendario')}Fechas que vienen</h2><ul class="lista">${D.EVENTOS.map(e => `<li><div class="fila"><span class="lead ${e.tipo === 'feriado' ? 'aviso' : 'info'}">${ic('calendario')}</span><span class="medio"><b>${esc(e.nombre)}</b><small>${esc(e.fecha)} · ${esc(e.efecto)}</small></span><span></span></div></li>`).join('')}</ul></article></div></div>`;
      }
      if (sub === 'termometro') cuerpo = `<article class="hoja"><div class="hoja-cab"><h2>${ic('termometro')}Termómetro de la comida · semana del 28 sep al 4 oct</h2>${tag('Fuga', 'alerta')}</div>
          <div class="cifras">${A.cifra({ etq: 'Se gastó en comida', valor: '46 %', sub: 'de lo vendido en comida', tono: 'alerta' })}${A.cifra({ etq: 'Dicen las recetas', valor: '33 %', sub: 'recetario propio' })}${A.cifra({ etq: 'Diferencia', valor: dinero(2180, 'usd', 0), sub: 'en la semana', tono: 'alerta' })}${A.cifra({ etq: 'Cobertura', valor: '81 %', sub: 'de lo vendido tiene receta' })}</div>
          <p class="etq">Los insumos que más explican la diferencia</p>
          <div class="barras">${[['Punta de ganso', 640], ['Queso telita', 410], ['Pernil', 380], ['Aceite', 210], ['Harina de maíz', 140]].map(([n, v]) => `<div class="barra"><span>${n}</span><b>${dinero(v, 'usd', 0)}</b><div class="pista"><span class="alerta" style="width:${v / 6.4}%"></span></div></div>`).join('')}</div>
          <p class="muted">Comida y barra se miden por separado. Las recetas salen del recetario propio, no de las de Odoo (que están mal desde junio).</p></article>`;
      if (sub === 'precios') cuerpo = `<p class="desc">Avisa cuando un insumo sube más de 5 % contra la compra anterior o cuando otro proveedor lo vendió más barato en las últimas 4 semanas.</p>` +
        A.tabla({ cols: [{ t: 'Insumo', cls: 'p' }, { t: 'Antes', cls: 'r x' }, { t: 'Ahora', cls: 'r' }, { t: 'Más barato en', cls: 'x' }, { t: 'Cambio', cls: 'e' }], filas: D.INSUMOS.map(i => { const c = (i.ahora / i.antes - 1) * 100; return { abrir: 'insumo:' + i.id, celdas: [`<b>${esc(i.nombre)}</b><small>${esc(i.prov)} · por ${esc(i.unidad)}</small>`, dinero(i.antes), dinero(i.ahora), esc(i.mejor || '—'), tag((c > 0 ? '+' : '') + fmt(c, 1) + ' %', c > 5 ? 'alerta' : c > 0 ? 'aviso' : 'ok')] }; }) });
      if (sub === 'decisiones') cuerpo = `<p class="desc">Antes de un cambio grande (precios, menú, horario) se marca la fecha. La app compara 4 semanas antes contra 4 semanas después, descontando la temporada.</p>` +
        `<ul class="lista">${D.DECISIONES.map(d => `<li><button class="fila" data-abrir="decision:${d.id}"><span class="lead ${d.tono}">${ic('analisis')}</span><span class="medio"><b>${esc(d.nombre)}</b><small>${esc(d.resultado)}</small></span><span class="fin">${A.estadoTag(d.estado)}${ic('derecha', 's chev')}</span></button></li>`).join('')}</ul>${A.boton('analisis', 'Medir una decisión nueva', 'data-acc="pronto"', { tono: 'sec', icono: 'mas' })}`;
      return `<div class="pagina">${A.cab('Para decidir con números', 'Análisis', 'Ventas, costos de la comida, precios de los insumos y el efecto de cada decisión. Sale de los resúmenes diarios del POS de Odoo.')}
        ${A.subnav([['ventas', 'Ventas'], ['termometro', 'Termómetro de la comida'], ['precios', 'Radar de precios', D.INSUMOS.filter(i => i.ahora / i.antes > 1.05).length], ['decisiones', 'Medir decisiones']], sub)}${cuerpo}</div>`;
    },
  };
  FICHAS.insumo = id => {
    const i = D.INSUMOS.find(x => x.id === id); const c = (i.ahora / i.antes - 1) * 100;
    return { titulo: i.nombre, sub: 'Radar de precios · por ' + esc(i.unidad), mod: 'analisis', obj: i, tags: [[(c > 0 ? '+' : '') + fmt(c, 1) + ' %', c > 5 ? 'alerta' : c > 0 ? 'aviso' : 'ok']],
      bloques: [{ filas: [{ l: 'Compra anterior', v: dinero(i.antes) }, { l: 'Última compra', v: dinero(i.ahora) }, { l: 'Proveedor', v: esc(i.prov) }, { l: 'Más barato en las últimas 4 semanas', v: esc(i.mejor || 'Nadie') }] }, { html: A.spark([i.antes, i.antes * 1.01, i.antes * .99, i.antes * 1.02, (i.antes + i.ahora) / 2, i.ahora], { etqIni: 'hace 6 compras', etqFin: 'hoy ' + dinero(i.ahora) }) }] };
  };
  FICHAS.decision = id => {
    const d = D.DECISIONES.find(x => x.id === id);
    return { titulo: d.nombre, sub: 'Desde el ' + esc(d.desde), mod: 'analisis', obj: d, tags: [[A.estadoTag(d.estado).replace(/<[^>]+>/g, ''), d.estado === 'medida' ? 'ok' : 'info']],
      bloques: [{ filas: d.id === 'md1' ? [{ l: 'Pedidos por día, antes', v: '117 → 109' }, { l: 'Pedidos por día, después', v: '−8 % (rango −13 % a −2 %)' }, { l: 'Venta de carta por día', v: '−16 %' }, { l: 'Ticket', v: '€ 37,70 → € 34,40' }] : [{ l: 'Antes (4 semanas)', v: 'Medido' }, { l: 'Después', v: '2 de 4 semanas' }] }, { html: `<p>${esc(d.resultado)}</p><p class="muted">Pesa también el contexto del país (luz, terremoto de junio, tasa). La app lo anota al lado, no lo esconde.</p>` }] };
  };
  FICHAS.semana = i => { const s = D.SEMANAS[i]; return { titulo: 'Semana del ' + s[0], sub: 'Ventas', mod: 'analisis', bloques: [{ filas: [{ l: 'Venta', v: dinero(s[1], 'usd', 0) }, { l: 'Semana anterior', v: dinero(D.SEMANAS[i - 1][1], 'usd', 0) }, { l: 'Punto de equilibrio', v: dinero(27650, 'usd', 0) }] }] }; };
})();
