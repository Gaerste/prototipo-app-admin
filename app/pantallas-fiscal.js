/* Fiscal: lo que llena Cecilia para declarar sin errores. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, $, $$, esc, fmt, dinero, leerNum, ic, tag, puede } = A;
  const prov = id => (D.PROVEEDORES.find(p => p.id === id) || {}).nombre || '—';
  const F = { descontar: { rr1: true, rr2: true, rr3: true }, credito: D.IVA_HOJA.creditos[0][2] };
  const tonoObl = e => ({ pagada: 'ok', declarada: 'info', lista: 'info', revision: 'aviso', preparar: '', abierta: '' }[e] || '');
  const PASOS = ['Prepara Cecilia', 'Revisa Jose', 'Declarada', 'Pagada'];

  /* ---------- 1. lo que vence ---------- */
  function calendario() {
    const dias = []; for (let d = 28; d <= 30; d++) dias.push({ n: d, mes: 'sep' }); for (let d = 1; d <= 31; d++) dias.push({ n: d, mes: 'oct' }); dias.push({ n: 1, mes: 'nov' });
    const evs = (d) => {
      const out = [];
      D.OBLIGACIONES.forEach(o => { if (o.dia === d.n && ((o.mes || 'oct') === d.mes)) out.push(`<button class="ev ${o.estado === 'pagada' ? 'ok' : o.faltan <= 1 ? 'aviso' : 'info'}" data-abrir="obligacion:${o.id}" title="${esc(o.corto)}">${esc(o.corto)}</button>`); });
      D.PERMISOS_LIC.forEach(p => { if (d.mes === 'oct' && p.vence.startsWith(d.n + ' oct')) out.push(`<button class="ev alerta" data-abrir="permiso:${p.id}" title="${esc(p.nombre)}">Vence: ${esc(p.nombre.replace('Permiso de ', ''))}</button>`); });
      if (d.mes === 'oct' && d.n === 12) out.push('<span class="ev">Feriado</span>');
      if (d.mes === 'oct' && d.n === 26) out.push('<span class="ev">Feriado bancario</span>');
      return out.join('');
    };
    return `<div class="cal" role="grid" aria-label="Octubre de 2026">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(x => `<div class="dsem">${x}</div>`).join('')}
      ${dias.map(d => `<div class="dia${d.mes !== 'oct' ? ' fuera' : ''}${d.mes === 'oct' && d.n === 5 ? ' hoy' : ''}"><span class="n">${d.n}</span>${evs(d)}</div>`).join('')}</div>`;
  }
  function vence() {
    const prox = D.OBLIGACIONES.filter(o => o.estado !== 'pagada').sort((a, b) => a.faltan - b.faltan);
    return `<div class="cifras">
        ${A.cifra({ etq: 'Vence esta semana', valor: prox.filter(o => o.faltan <= 6).length, sub: 'la primera mañana: IVA y ret. ISLR', tono: 'aviso' })}
        ${A.cifra({ etq: 'A pagar este mes (estimado)', valor: dinero(prox.reduce((s, o) => s + (o.monto || 0), 0), 'bs', 0), sub: 'sin la 1.ª quincena de octubre' })}
        ${A.cifra({ etq: 'Permisos por vencer', valor: D.PERMISOS_LIC.filter(p => p.estado === 'por_vencer').length, sub: 'bomberos el 21 de octubre', ir: 'fiscal/permisos', tono: 'aviso' })}
        ${A.cifra({ etq: 'Máquina fiscal', valor: 'Inspección vencida', sub: 'desde el 28 de septiembre', abrir: 'maquina:m1', tono: 'alerta' })}
      </div>
      <div class="rejilla"><div class="c7 pila"><div class="sec"><h2>Octubre de 2026</h2><span class="muted">Calendario de contribuyentes especiales · RIF terminado en 4</span></div>${calendario()}</div>
      <div class="c5 pila"><div class="sec"><h2>En orden de vencimiento</h2></div>
        <ul class="lista">${prox.map(o => `<li><button class="fila" data-abrir="obligacion:${o.id}"><span class="lead ${o.faltan <= 1 ? 'aviso' : ''}">${ic('fiscal')}</span><span class="medio"><b>${esc(o.corto)}</b><small>${esc(o.ente)} · ${esc(o.vence)} · ${esc(o.resp)}</small></span><span class="fin-col">${A.estadoTag(o.estado)}${o.monto ? `<span class="muted num">${dinero(o.monto, 'bs', 0)}</span>` : ''}</span></button></li>`).join('')}</ul>
        <p class="muted">Cada obligación avisa por WhatsApp y en Pendientes a su responsable con días de anticipación. Si nadie la mueve en 2 días, sube a Alejandro.</p></div></div>`;
  }
  FICHAS.obligacion = id => {
    const o = D.OBLIGACIONES.find(x => x.id === id);
    const paso = o.paso;
    const acc = [];
    if (o.id === 'o1') acc.push({ txt: 'Abrir la hoja de IVA', acc: 'ir-a', arg: 'fiscal/iva', icono: 'archivo' });
    if (o.estado === 'preparar' || o.estado === 'abierta') acc.push({ txt: 'Lista: pasar a revisión', acc: 'obl-paso', arg: o.id + '|revision', icono: 'enviar', tono: 'pri', solo: 'editar' });
    if (o.estado === 'revision') acc.push({ txt: 'Revisado: lista para declarar', acc: 'obl-paso', arg: o.id + '|lista', icono: 'check', tono: 'pri', solo: 'editar' });
    if (o.estado === 'lista') acc.push({ txt: 'Registrar lo declarado', acc: 'obl-declarar', arg: o.id, icono: 'subir', tono: 'pri', solo: 'editar' });
    if (o.estado === 'declarada') acc.push({ txt: 'Registrar el pago', acc: 'obl-paso', arg: o.id + '|pagada', icono: 'check', tono: 'pri', solo: 'editar' });
    return {
      titulo: o.corto, sub: esc(o.ente) + ' · período ' + esc(o.periodo), mod: 'fiscal', obj: o, registro: o.corto,
      tags: [[A.estadoTag(o.estado).replace(/<[^>]+>/g, ''), tonoObl(o.estado)], [o.faltan < 0 ? 'Venció ' + o.vence : o.faltan === 0 ? 'Vence hoy' : o.faltan === 1 ? 'Vence mañana' : 'Faltan ' + o.faltan + ' días', o.faltan <= 1 && o.estado !== 'pagada' ? 'alerta' : '']],
      bloques: [
        { html: `<ol class="pasos">${PASOS.map((p, i) => `<li class="${i < paso ? 'hecho' : i === paso ? 'actual' : ''}">${p}</li>`).join('')}</ol>` },
        { titulo: 'Datos', filas: [{ l: 'Qué es', v: esc(o.nombre), largo: true }, { l: 'Vence', v: esc(o.vence) }, { l: 'Responsable', v: esc(o.resp), campo: { k: 'resp', tipo: 'select', opciones: ['Cecilia', 'Jose', 'Alejandro'] } }, { l: 'Monto (Bs)', v: o.monto ? dinero(o.monto, 'bs') : 'Se calcula al cerrar la quincena', campo: { k: 'monto', tipo: 'dinero', mon: 'bs' } }, { l: 'N.º de planilla', v: esc(o.planilla || '—'), campo: { k: 'planilla', tipo: 'texto' } }] },
        o.estado === 'pagada' ? { titulo: 'Soportes', adjuntos: ['Planilla del portal ' + o.periodo + '.pdf', 'Comprobante de pago.pdf'] } : { oculto: true },
        { html: '<p class="muted">Quien prepara, quien revisa y quien aprueba el pago son personas distintas. Lo declarado ya no se edita: se corrige con una declaración sustitutiva.</p>' },
      ],
      bloqueada: o.estado === 'pagada', acciones: acc,
    };
  };
  ACC['obl-paso'] = arg => {
    const [id, est] = arg.split('|'); const o = D.OBLIGACIONES.find(x => x.id === id);
    if (est === 'lista' && S.usuario.nombre === o.resp) return A.aviso('La revisa otra persona, no quien la preparó.', 'info');
    const antes = o.estado; o.estado = est; o.paso = { revision: 1, lista: 2, declarada: 3, pagada: 4 }[est];
    A.auditar({ modulo: 'Fiscal', registro: o.corto, campo: 'estado', antes: A.estadoTag(antes).replace(/<[^>]+>/g, ''), despues: A.estadoTag(est).replace(/<[^>]+>/g, '') });
    A.pintarFicha(); A.pintarPagina(); A.aviso('Listo. Le avisamos al siguiente en la cadena.');
  };
  ACC['obl-declarar'] = id => {
    const o = D.OBLIGACIONES.find(x => x.id === id);
    A.pedirMotivo({ titulo: 'Registrar lo declarado', etiqueta: 'N.º de planilla del portal', boton: 'Registrar', texto: 'Adjunta después el PDF del certificado. Queda bloqueada: para corregir, una sustitutiva.' }).then(m => {
      o.planilla = m; o.estado = 'declarada'; o.paso = 3;
      A.auditar({ modulo: 'Fiscal', registro: o.corto, campo: 'estado', antes: 'lista para declarar', despues: 'declarada', motivo: 'Planilla ' + m });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Declarada. Falta registrar el pago.');
    }).catch(() => {});
  };

  /* ---------- 2. hoja de IVA ---------- */
  function hojaIva() {
    const H = D.IVA_HOJA; const o = D.OBLIGACIONES.find(x => x.id === 'o1');
    const deb = H.debitos.reduce((s, d) => s + d[2], 0);
    const ret = D.RET_RECIBIDAS.filter(r => r.tipo === 'IVA' && r.estado === 'por_descontar' && F.descontar[r.id]).reduce((s, r) => s + r.monto, 0);
    const cuota = deb - F.credito - H.excedente - ret;
    const retProv = D.RET_EMITIDAS.filter(r => r.tipo.startsWith('IVA')).reduce((s, r) => s + r.monto, 0);
    const totalPlanilla = Math.max(cuota, 0) + H.igtf + H.anticipo + retProv;
    const editable = puede('fiscal', 'editar') && o.estado !== 'pagada' && o.estado !== 'declarada';
    return `<div class="rejilla"><div class="c7 pila">
      <article class="hoja"><div class="hoja-cab"><h2>${ic('fiscal')}IVA · ${esc(H.periodo)}</h2>${o.estado === 'declarada' || o.estado === 'pagada' ? A.sello(o.estado === 'pagada' ? 'Pagada' : 'Declarada') : A.estadoTag(o.estado)}</div>
        <ol class="pasos">${PASOS.map((p, i) => `<li class="${i < o.paso ? 'hecho' : i === o.paso ? 'actual' : ''}">${p}</li>`).join('')}</ol>
        <p class="muted">Vence el ${esc(H.vence)}. La app propone las cifras; Cecilia las revisa, corrige lo que haga falta y registra lo que declaró en el portal.</p></article>
      <article class="hoja plana"><div class="tabla-env"><table class="t"><thead><tr><th>Débito fiscal (ventas)</th><th class="r">Base</th><th class="r">IVA</th></tr></thead><tbody>
        ${H.debitos.map(d => `<tr data-abrir="${d[0].includes('Z') ? 'ivalinea:z' : d[0].includes('empresas') ? 'ivalinea:emp' : 'ivalinea:adic'}" tabindex="0"><td>${esc(d[0])}</td><td class="r">${dinero(d[1], 'bs')}</td><td class="r">${dinero(d[2], 'bs')}</td></tr>`).join('')}
        </tbody><tfoot><tr><td>Total débito</td><td class="r"></td><td class="r">${dinero(deb, 'bs')}</td></tr></tfoot></table></div></article>
      <article class="hoja"><h2>Lo que se resta</h2>
        <label class="campo" for="iva-credito"><span>Crédito fiscal de las compras (Bs) ${editable ? '' : ic('candado', 'xs')}</span><input id="iva-credito" inputmode="decimal" value="${fmt(F.credito)}" ${editable ? '' : 'readonly'}><small class="ayuda">Lo escribe Cecilia desde su libro de compras hasta que la app lo arme sola (fase 9).</small></label>
        <dl class="kv"><div><dt>Excedente de la quincena anterior</dt><dd>${dinero(H.excedente, 'bs')}</dd></div></dl>
        <p class="etq">Retenciones que nos hicieron y se descuentan</p>
        ${D.RET_RECIBIDAS.filter(r => r.tipo === 'IVA' && r.estado === 'por_descontar').map(r => `<label class="interruptor"><input type="checkbox" data-desc="${r.id}" ${F.descontar[r.id] ? 'checked' : ''} ${editable ? '' : 'disabled'}><span>${esc(r.cliente)} · comp. ${esc(r.comp.slice(-6))} · <b class="num">${dinero(r.monto, 'bs')}</b></span></label>`).join('')}
      </article></div>
      <div class="c5 pila"><article class="hoja" style="position:sticky;top:0"><h2>Resultado</h2>
        <dl class="kv"><div><dt>Débito</dt><dd>${dinero(deb, 'bs')}</dd></div><div><dt>− Crédito de compras</dt><dd>${dinero(F.credito, 'bs')}</dd></div><div><dt>− Excedente anterior</dt><dd>${dinero(H.excedente, 'bs')}</dd></div><div><dt>− Retenciones descontadas</dt><dd>${dinero(ret, 'bs')}</dd></div>
        <div class="total"><dt><b>IVA a pagar</b></dt><dd style="font-size:17px">${cuota >= 0 ? dinero(cuota, 'bs') : dinero(0, 'bs')}</dd></div>
        ${cuota < 0 ? `<div><dt>Excedente que pasa a la próxima</dt><dd>${dinero(-cuota, 'bs')}</dd></div>` : ''}</dl>
        <p class="etq">En la misma planilla</p>
        <dl class="kv"><div><dt>IGTF cobrado en divisas (de los Z)</dt><dd>${dinero(H.igtf, 'bs')}</dd></div><div><dt>Anticipo de ISLR (1 % de los ingresos)</dt><dd>${dinero(H.anticipo, 'bs')}</dd></div><div><dt>Retenciones de IVA a proveedores</dt><dd>${dinero(retProv, 'bs')}</dd></div>
        <div class="total"><dt><b>Total de la planilla</b></dt><dd style="font-size:17px">${dinero(totalPlanilla, 'bs')}</dd></div></dl>
        <p class="muted">≈ ${dinero(totalPlanilla / D.TASA.usd, 'usd', 0)} a la tasa BCV de hoy.</p>
        ${o.estado === 'revision' ? (S.usuario.rol === 'contabilidad' || S.usuario.rol === 'dueno' ? `<button class="btn pri full" data-acc="obl-paso" data-arg="o1|lista">${ic('check', 's')}Revisado: lista para declarar</button>` : `<p class="nota aviso">${ic('reloj', 's')}<span>Esperando la revisión de Jose.</span></p>`) : ''}
        ${o.estado === 'lista' ? A.boton('fiscal', 'Registrar lo declarado', 'data-acc="obl-declarar" data-arg="o1"', { icono: 'subir' }) : ''}
        <button class="btn sec full" data-acc="descargar">${ic('descargar', 's')}Descargar la hoja en Excel</button>
      </article></div></div>`;
  }

  /* ---------- 3. reportes Z y libro de ventas ---------- */
  function zetas() {
    return `<div class="cifras">
        ${A.cifra({ etq: 'Reportes Z de septiembre', valor: '28 de 30', sub: 'faltan los días 13 y 27', tono: 'alerta' })}
        ${A.cifra({ etq: 'Leídos sin confirmar', valor: D.ZETAS.filter(z => z.estado === 'leido').length, sub: 'los confirma Jose', tono: 'aviso' })}
        ${A.cifra({ etq: 'Saltos de número', valor: '1', sub: 'falta el Z 1485', abrir: 'zeta:z26', tono: 'alerta' })}
        ${A.cifra({ etq: 'Ventas de la quincena (base)', valor: dinero(182340, 'bs', 0), sub: 'consumidor final' })}
      </div>
      <div class="filtros">${A.boton('fiscal', 'Subir el Z de ayer', 'data-acc="subir-z"', { icono: 'camara' })}<span class="muted">Una foto o un escaneo del ticket largo. La app lee el final y Jose confirma.</span></div>
      ${A.tabla({ cols: [{ t: 'Día', cls: 'p' }, { t: 'N.º Z', cls: 'x' }, { t: 'Facturas', cls: 'x' }, { t: 'IVA', cls: 'r x' }, { t: 'Base gravada', cls: 'r' }, { t: 'Estado', cls: 'e' }],
        filas: D.ZETAS.map(z => ({ abrir: 'zeta:' + z.id, celdas: [`<b>${esc(z.fecha)}</b><small>${z.alerta ? ic('alerta', 'xs') + ' ' + esc(z.alerta) : z.num ? 'Z ' + z.num + ' · ' + z.facturas + ' facturas' : 'No se ha subido'}</small>`, z.num || '—', z.facturas || '—', z.iva ? dinero(z.iva, 'bs') : '—', z.base ? dinero(z.base, 'bs') : '—', z.estado === 'falta' ? tag('Falta', 'alerta') : z.estado === 'leido' ? tag('Leído, falta confirmar', 'aviso') : tag('Confirmado', 'ok')] })) })}
      <div class="sec"><h2>Libro de ventas · septiembre</h2><span class="cabeza-acc">${A.boton('fiscal', 'Exportar PDF', 'data-acc="descargar"', { tono: 'sec', icono: 'descargar', chico: true })}${A.boton('fiscal', 'Exportar Excel', 'data-acc="descargar"', { tono: 'sec', icono: 'descargar', chico: true })}</span></div>
      <article class="hoja"><dl class="kv"><div><dt>A consumidor final (resumen diario de los Z)</dt><dd>${dinero(362410, 'bs')} + IVA ${dinero(57985.60, 'bs')}</dd></div><div><dt>A contribuyentes (facturas con RIF)</dt><dd>${dinero(9800, 'bs')} + IVA ${dinero(1568, 'bs')}</dd></div><div><dt>Exento</dt><dd>${dinero(8310, 'bs')}</dd></div><div><dt>Cuadra con las declaraciones</dt><dd>${tag('1.ª quincena sí · 2.ª en revisión', 'aviso')}</dd></div></dl>
      <p class="muted">Las facturas con RIF que ya están dentro del Z no se cuentan dos veces (pregunta 4 para Cecilia). El libro va impreso al local cada mes.</p></article>`;
  }
  FICHAS.zeta = id => {
    const z = D.ZETAS.find(x => x.id === id);
    if (z.estado === 'falta') return { titulo: 'Reporte Z del ' + z.fecha, sub: 'Fiscal', mod: 'fiscal', obj: z, tags: [['Falta', 'alerta']],
      bloques: [{ html: `<p>Sin el Z de este día no cierra el libro de ventas. Búscalo en la carpeta de la caja.</p><label class="soltar" for="z-sube-${z.id}">${ic('camara')}<span><b>Subir la foto o el escaneo</b>Del ticket largo, sobre todo el tramo final.</span></label><input id="z-sube-${z.id}" type="file" accept="image/*,application/pdf" class="sr-only">` }] };
    return { titulo: 'Reporte Z ' + z.num, sub: esc(z.fecha) + ' · máquina de la caja principal', mod: 'fiscal', obj: z, registro: 'Z ' + z.num, tags: [[z.estado === 'leido' ? 'Leído, falta confirmar' : 'Confirmado por ' + z.por, z.estado === 'leido' ? 'aviso' : 'ok']],
      aviso: z.alerta ? `<p class="nota alerta">${ic('alerta', 's')}<span>${esc(z.alerta)}. Pudo ser un Z sacado dos veces o uno perdido. Hay que justificarlo.</span></p>` : '',
      bloques: [{ titulo: 'Lo que leyó la app', filas: [{ l: 'N.º de Z', v: z.num, campo: { k: 'num', tipo: 'numero' } }, { l: 'Facturas del día', v: z.facturas, campo: { k: 'facturas', tipo: 'numero' } }, { l: 'Base gravada 16 %', v: dinero(z.base, 'bs'), campo: { k: 'base', tipo: 'dinero', mon: 'bs' } }, { l: 'IVA', v: dinero(z.iva, 'bs'), campo: { k: 'iva', tipo: 'dinero', mon: 'bs' } }, { l: 'Exento', v: dinero(z.exento, 'bs'), campo: { k: 'exento', tipo: 'dinero', mon: 'bs' } }, { l: 'IGTF', v: dinero(z.igtf, 'bs'), campo: { k: 'igtf', tipo: 'dinero', mon: 'bs' } }, { l: 'Primer y último comprobante', v: `<span class="mono">${(z.num * 160 - z.facturas + 1)}–${z.num * 160}</span>` }] },
        { titulo: 'Foto', adjuntos: ['Z ' + z.num + ' · ' + z.fecha + '.jpg'] }],
      acciones: z.estado === 'leido' ? [{ txt: 'Confirmar el Z', acc: 'confirmar-z', arg: z.id, icono: 'check', tono: 'pri', solo: 'editar' }] : [] };
  };
  ACC['confirmar-z'] = id => { const z = D.ZETAS.find(x => x.id === id); z.estado = 'confirmado'; z.por = S.usuario.nombre; A.auditar({ modulo: 'Fiscal', registro: 'Z ' + z.num, campo: 'estado', antes: 'leído', despues: 'confirmado' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Z confirmado.'); };
  ACC['subir-z'] = () => A.aviso('Se abriría la cámara del teléfono para fotografiar el Z de ayer. (Simulado)', 'info');
  FICHAS.ivalinea = k => {
    const t = { z: ['Ventas a consumidor final', 'La suma de los Z de la quincena (16 al 30 de septiembre), menos las facturas con RIF que ya están dentro del Z.'], emp: ['Facturas a empresas', '3 facturas personalizadas con RIF del cliente.'], adic: ['Alícuota adicional (31 %)', 'Es la casilla «A» del Z: la alícuota de lujo (16 % + 15 %). Su lista (vehículos, motos, joyas, aeronaves, botes, máquinas de juego) no trae licores ni comida: en el restaurante va en cero y los licores pagan el 16 %. Si algún día trae monto, revisarlo con Cecilia.'] }[k];
    return { titulo: t[0], sub: 'Hoja de IVA', mod: 'fiscal', bloques: [{ html: `<p>${t[1]}</p>` }, k === 'z' ? { html: A.tabla({ cols: [{ t: 'Día', cls: 'p' }, { t: 'IVA', cls: 'r' }], filas: D.ZETAS.filter(z => z.iva).map(z => ({ abrir: 'zeta:' + z.id, celdas: [esc(z.fecha), dinero(z.iva, 'bs')] })) }) } : k === 'emp' ? { html: A.tabla({ cols: [{ t: 'Factura', cls: 'p' }, { t: 'IVA', cls: 'r' }], filas: D.VENTAS_EMPRESAS.map(v => ({ abrir: 'ventaemp:' + v.id, celdas: [esc(v.num + ' · ' + v.cliente), dinero(v.iva, 'bs')] })) }) } : { oculto: true }] };
  };

  /* ---------- 4. libro de compras ---------- */
  function compras() {
    return `<p class="nota gris">${ic('reloj', 's')}<span><b>Llega en la fase 9.</b> Hasta entonces Cecilia lleva el libro de compras en su Excel y escribe el crédito fiscal en la hoja de IVA. Así se verá cuando la app lo arme sola desde las facturas.</span></p>
      ${A.tabla({ cols: [{ t: 'Factura', cls: 'p' }, { t: 'N.º de control', cls: 'x' }, { t: 'Base', cls: 'r x' }, { t: 'IVA', cls: 'r' }, { t: 'Retenido', cls: 'r x' }, { t: 'Comprobante', cls: 'e' }],
        filas: D.COMPRAS.map(c => ({ abrir: 'factura:' + (D.FACTURAS.find(f => f.num === c.num) || {}).id, celdas: [`<b>${esc(prov(c.prov))}</b><small>N.º ${esc(c.num)} · ${esc(c.fecha)}${c.alerta ? ' · ' + ic('alerta', 'xs') + ' ' + esc(c.alerta) : ''}</small>`, esc(c.control), dinero(c.base), dinero(c.iva), dinero(c.retenido), c.comp === 'pendiente' ? tag('Por emitir', 'aviso') : `<span class="mono" style="font-size:12px">${esc(c.comp)}</span>`] })) })}
      <div class="filtros">${A.boton('fiscal', 'Exportar el libro', 'data-acc="descargar"', { tono: 'sec', icono: 'descargar' })}</div>`;
  }

  /* ---------- 5. retenciones ---------- */
  function retenciones() {
    const porDesc = D.RET_RECIBIDAS.filter(r => r.estado === 'por_descontar');
    return `<div class="cifras">
        ${A.cifra({ etq: 'Por descontar (plata que se recupera)', valor: dinero(porDesc.reduce((s, r) => s + r.monto, 0), 'bs'), sub: porDesc.length + ' comprobantes de clientes' })}
        ${A.cifra({ etq: 'Comprobantes por emitir', valor: D.RET_EMITIDAS.filter(r => r.estado === 'borrador').length + 1, sub: 'a proveedores · 2 días hábiles', tono: 'aviso' })}
        ${A.cifra({ etq: 'Último número usado', valor: '<span class="mono" style="font-size:18px">202609-00000041</span>', sub: 'la numeración no tiene huecos' })}
      </div>
      <div class="sec"><h2>Las que nos hicieron (clientes especiales)</h2>${A.boton('fiscal', 'Registrar un comprobante', 'data-acc="pronto"', { tono: 'sec', icono: 'mas', chico: true })}</div>
      ${A.tabla({ cols: [{ t: 'Comprobante', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Período', cls: 'x' }, { t: 'Monto', cls: 'r' }, { t: 'Estado', cls: 'e' }], filas: D.RET_RECIBIDAS.map(r => ({ abrir: 'retrec:' + r.id, celdas: [`<b>${esc(r.cliente)}</b><small class="mono">${esc(r.comp)}</small>`, esc(r.tipo), esc(r.periodo), dinero(r.monto, 'bs'), A.estadoTag(r.estado)] })) })}
      <div class="sec"><h2>Las que hicimos a proveedores</h2><span class="cabeza-acc">${A.boton('fiscal', 'TXT de IVA para el portal', 'data-acc="descargar"', { tono: 'sec', icono: 'descargar', chico: true })}${A.boton('fiscal', 'XML de ISLR', 'data-acc="descargar"', { tono: 'sec', icono: 'descargar', chico: true })}</span></div>
      ${A.tabla({ cols: [{ t: 'Comprobante', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Factura', cls: 'x' }, { t: 'Monto', cls: 'r' }, { t: 'Estado', cls: 'e' }], filas: D.RET_EMITIDAS.map(r => ({ abrir: 'retemi:' + r.id, celdas: [`<b>${esc(prov(r.prov))}</b><small class="mono">${esc(r.comp)}</small>`, esc(r.tipo), esc(r.factura), dinero(r.monto), A.estadoTag(r.estado)] })) })}`;
  }
  FICHAS.retrec = id => {
    const r = D.RET_RECIBIDAS.find(x => x.id === id);
    return { titulo: 'Retención de ' + r.cliente, sub: 'Comprobante ' + esc(r.comp), mod: 'fiscal', obj: r, registro: 'Retención ' + r.comp, tags: [[A.estadoTag(r.estado).replace(/<[^>]+>/g, ''), r.estado === 'descontada' ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'Cliente', v: esc(r.cliente) }, { l: 'Tipo', v: esc(r.tipo) }, { l: 'Monto (Bs)', v: dinero(r.monto, 'bs'), campo: { k: 'monto', tipo: 'dinero', mon: 'bs' } }, { l: 'Período', v: esc(r.periodo) }, { l: 'Se descontó en', v: r.estado === 'descontada' ? 'IVA 1.ª quinc. sep' : 'Todavía no' }] }, { titulo: 'Comprobante', adjuntos: ['Retención ' + r.comp + '.pdf'] }, { html: '<p class="muted">Al registrarla, también baja lo que el cliente nos debe en Cobranza. Nunca se manda por el grupo Caja.</p>' }] };
  };
  FICHAS.retemi = id => {
    const r = D.RET_EMITIDAS.find(x => x.id === id);
    return { titulo: 'Comprobante ' + r.comp, sub: esc(prov(r.prov)) + ' · factura ' + esc(r.factura), mod: 'fiscal', obj: r, registro: 'Retención ' + r.comp, anulable: r.estado !== 'enterada', tags: [[A.estadoTag(r.estado).replace(/<[^>]+>/g, ''), r.estado === 'entregada' ? 'ok' : r.estado === 'borrador' ? '' : 'info']],
      bloques: [{ filas: [{ l: 'Tipo', v: esc(r.tipo) }, { l: 'Monto', v: dinero(r.monto) }, { l: 'Factura', v: esc(r.factura) }, { l: 'Plazo de entrega', v: '2 días hábiles' }] }],
      acciones: r.estado === 'borrador' ? [{ txt: 'Emitir el comprobante', acc: 'emitir-ret', arg: r.id, icono: 'archivo', tono: 'pri', solo: 'editar' }] : r.estado === 'emitida' ? [{ txt: 'Marcar entregado', acc: 'entregar-ret', arg: r.id, icono: 'check', tono: 'pri', solo: 'editar' }] : [{ txt: 'Descargar PDF', acc: 'descargar', icono: 'descargar' }] };
  };
  ACC['emitir-ret'] = id => { const r = D.RET_EMITIDAS.find(x => x.id === id); r.estado = 'emitida'; A.auditar({ modulo: 'Fiscal', registro: 'Retención ' + r.comp, campo: 'estado', antes: 'borrador', despues: 'emitida' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Comprobante emitido con el siguiente número.'); };
  ACC['entregar-ret'] = id => { const r = D.RET_EMITIDAS.find(x => x.id === id); r.estado = 'entregada'; A.auditar({ modulo: 'Fiscal', registro: 'Retención ' + r.comp, campo: 'estado', antes: 'emitida', despues: 'entregada' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Marcado como entregado al proveedor.'); };

  /* ---------- 6. nómina, IGTF y municipio ---------- */
  function parafiscales() {
    return `<p class="nota gris">${ic('candado', 's')}<span>Las bases salen solo de la nómina formal y llegan agrupadas, sin nombres ni sueldos por persona.</span></p>
      ${A.tabla({ cols: [{ t: 'Aporte', cls: 'p' }, { t: 'Base del mes', cls: 'r x' }, { t: 'Monto', cls: 'r' }, { t: 'Vence', cls: 'e' }], filas: D.PARAFISCALES.map((p, i) => ({ abrir: 'obligacion:' + ['o8', 'o4', 'o5', 'o3'][i], celdas: [`<b>${esc(p.ente)}</b><small>Nómina formal de septiembre · 10 personas</small>`, dinero(p.base), dinero(p.monto), tag(p.vence, p.vence === 'Hoy' ? 'alerta' : '')] })), pie: ['Total', '', dinero(D.PARAFISCALES.reduce((s, p) => s + p.monto, 0)), ''] })}
      <div class="rejilla"><div class="c6"><article class="hoja"><h2>IGTF cobrado (3 % de los cobros en divisas)</h2><dl class="kv"><div><dt>1.ª quincena de septiembre</dt><dd>${dinero(2104.80, 'bs')} ${tag('Declarado', 'ok')}</dd></div><div><dt>2.ª quincena de septiembre</dt><dd>${dinero(D.IVA_HOJA.igtf, 'bs')} ${tag('En la hoja de IVA', 'aviso')}</dd></div></dl><p class="muted">Sale sumado de los Z. Nadie lo carga cobro por cobro.</p></article></div>
      <div class="c6"><article class="hoja"><h2>Patente municipal (Valencia)</h2><dl class="kv"><div><dt>Ventas de septiembre</dt><dd>${dinero(77612.50, 'usd')}</dd></div><div><dt>Alícuota</dt><dd>4 % ${tag('Por confirmar con Cecilia', 'aviso')}</dd></div><div><dt>A pagar</dt><dd>${dinero(3104.50, 'bs')}</dd></div><div><dt>Vence</dt><dd>20 de octubre</dd></div></dl></article></div></div>`;
  }

  /* ---------- 7. permisos y máquina fiscal ---------- */
  function permisos() {
    const m = D.MAQUINAS[0];
    return `<article class="hoja"><div class="hoja-cab"><h2>${ic('archivo')}Máquina fiscal</h2>${tag('Inspección vencida', 'alerta')}</div>
        <button class="fila" data-abrir="maquina:m1" style="padding-inline:0"><span class="medio"><b>${esc(m.modelo)}</b><small>Serial ${esc(m.serial)} · ${esc(m.ubicacion)} · último ${esc(m.ultimaZ)}</small></span>${ic('derecha', 's chev')}</button></article>
      <div class="sec"><h2>Permisos y licencias</h2>${A.boton('fiscal', 'Agregar un permiso', 'data-acc="pronto"', { tono: 'sec', icono: 'mas', chico: true })}</div>
      ${A.tabla({ cols: [{ t: 'Permiso', cls: 'p' }, { t: 'Ente', cls: 'x' }, { t: 'N.º', cls: 'x' }, { t: 'Vence', cls: 'r' }, { t: 'Estado', cls: 'e' }], filas: D.PERMISOS_LIC.map(p => ({ abrir: 'permiso:' + p.id, celdas: [`<b>${esc(p.nombre)}</b><small>${esc(p.ente)}${p.nota ? ' · ' + esc(p.nota) : ''}</small>`, esc(p.ente), esc(p.num), esc(p.vence) + (p.faltan !== null && p.faltan < 60 ? `<br><small class="muted">en ${p.faltan} días</small>` : ''), A.estadoTag(p.estado)] })) })}
      <p class="muted">Desde el 12 de agosto el RIF ya no vence ni hay que colgarlo, pero su número sí va en facturas y anuncios. La copia de la declaración de ISLR: la ley la sigue pidiendo, aunque por ahora el SENIAT no la revisa. La licencia municipal sí se exhibe.</p>`;
  }
  FICHAS.permiso = id => {
    const p = D.PERMISOS_LIC.find(x => x.id === id);
    return { titulo: p.nombre, sub: esc(p.ente), mod: 'fiscal', obj: p, registro: p.nombre, tags: [[A.estadoTag(p.estado).replace(/<[^>]+>/g, ''), { vigente: 'ok', por_vencer: 'aviso', vencido: 'alerta', en_tramite: 'info' }[p.estado]]],
      bloques: [{ filas: [{ l: 'Número', v: esc(p.num), campo: { k: 'num', tipo: 'texto' } }, { l: 'Vence', v: esc(p.vence), campo: { k: 'vence', tipo: 'texto' } }, { l: 'Avisar con (días)', v: p.aviso + ' días antes', campo: { k: 'aviso', tipo: 'numero' } }, { l: 'Responsable', v: 'Jose' }] },
        { titulo: 'Versiones', tiempo: [['oct 2025', 'Renovación vigente (versión 1).', 'ok']] }, { titulo: 'Archivo', adjuntos: [p.nombre + ' vigente.pdf'] },
        { html: '<p class="muted">Subir la renovación crea una versión nueva; la anterior queda guardada.</p>' }],
      acciones: [{ txt: 'Marcar en trámite', acc: 'permiso-tramite', arg: p.id, icono: 'reloj', solo: 'editar' }, { txt: 'Subir la renovación', acc: 'pronto', icono: 'subir', tono: 'pri', solo: 'editar' }] };
  };
  ACC['permiso-tramite'] = id => { const p = D.PERMISOS_LIC.find(x => x.id === id); p.estado = 'en_tramite'; A.auditar({ modulo: 'Fiscal', registro: p.nombre, campo: 'estado', antes: 'por vencer', despues: 'en trámite' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Marcado en trámite.'); };
  FICHAS.maquina = id => {
    const m = D.MAQUINAS.find(x => x.id === id);
    return { titulo: 'Máquina fiscal', sub: esc(m.modelo), mod: 'fiscal', obj: m, registro: 'Máquina fiscal', tags: [['Inspección vencida', 'alerta'], ['Operativa', 'ok']],
      aviso: `<p class="nota alerta">${ic('alerta', 's')}<span>La inspección técnica anual venció el 28 de septiembre. Hay que llamar al técnico autorizado; si la máquina se daña, se factura con el talonario de contingencia.</span></p>`,
      bloques: [{ filas: [{ l: 'Serial', v: `<span class="mono">${esc(m.serial)}</span>` }, { l: 'Ubicación', v: esc(m.ubicacion), campo: { k: 'ubicacion', tipo: 'texto' } }, { l: 'Último Z', v: esc(m.ultimaZ) }, { l: 'Próxima inspección', v: esc(m.inspeccion), campo: { k: 'inspeccion', tipo: 'texto' } }] }, { titulo: 'Libro de reparaciones', tiempo: [['sep 2025', 'Inspección anual al día.', 'ok'], ['mar 2026', 'Cambio de cabezal de impresión.']] }] };
  };

  /* ---------- 8. paquete del mes ---------- */
  function paquete() {
    return `<article class="hoja"><div class="hoja-cab"><h2>${ic('archivo')}Paquete de septiembre para Cecilia</h2>${tag('4 de 6 listos', 'aviso')}</div>
        <ul class="lista">${D.PAQUETE.map(([t, n, e]) => `<li><div class="fila"><span class="lead ${e === 'ok' ? 'ok' : 'aviso'}">${ic(e === 'ok' ? 'check' : 'reloj')}</span><span class="medio"><b>${esc(t)}</b><small>${esc(n)}</small></span>${tag(e === 'ok' ? 'Listo' : 'Falta', e === 'ok' ? 'ok' : 'aviso')}</div></li>`).join('')}</ul>
        <button class="btn pri" data-acc="bajar-paquete">${ic('descargar', 's')}Descargar el paquete</button>
        <p class="muted">Pide tu código y queda anotado quién lo descargó y cuándo. Todo lo de este paquete también se puede ver suelto en cada sección.</p></article>`;
  }
  ACC['bajar-paquete'] = () => A.pedirCodigo('Descargar el paquete fiscal de septiembre.').then(() => { D.ACCESOS.unshift({ cuando: 'Hoy ' + D.HOY.hora, quien: S.usuario.nombre, que: 'Descargó el paquete fiscal de septiembre (con código)', donde: 'Este equipo' }); A.aviso('Descarga lista y anotada en el registro de accesos. (Simulado)'); }).catch(() => {});

  /* ---------- 9. preguntas para Cecilia ---------- */
  function preguntas() {
    const puedeResp = S.usuario.rol === 'fiscal_externo' || S.usuario.rol === 'dueno';
    // las urgentes se nombran arriba sin cambiar el orden: los números se citan en otras pantallas
    const urg = D.PREGUNTAS.map((q, i) => ({ q, n: i + 1 })).filter(x => x.q.urgente && x.q.estado === 'abierta');
    return `<p class="desc">Antes de construir la fase fiscal hacen falta estas respuestas. Cecilia las contesta aquí mismo y Alejandro las ve al instante.</p>
      ${urg.length ? `<p class="nota aviso">${ic('alerta', 's')}<span><b>${urg.length === 1 ? 'Una no puede esperar' : urg.length + ' no pueden esperar'}:</b> ${urg.map(x => `la ${x.n} (${esc(x.q.corto || '')}${x.q.urgente !== 'Urgente' ? ', ' + esc(x.q.urgente.toLowerCase()) : ''})`).join(' y ')}.</span></p>` : ''}
      <ul class="lista">${D.PREGUNTAS.map((q, i) => `<li style="padding:14px;display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><b>${i + 1}. ${esc(q.texto)}</b><span class="fila-tags">${q.urgente && q.estado === 'abierta' ? tag(q.urgente, 'aviso') : ''}${A.estadoTag(q.estado)}</span></div>
        ${puedeResp ? `<label class="campo" for="q-${q.id}"><span class="sr-only">Respuesta</span><textarea id="q-${q.id}" placeholder="Escribe tu respuesta">${esc(q.resp)}</textarea></label><div><button class="btn sec chico" data-acc="responder" data-arg="${q.id}">${ic('check', 's')}Guardar respuesta</button></div>` : (q.resp ? `<p class="muted">${esc(q.resp)}</p>` : '<p class="muted">Sin respuesta todavía.</p>')}
      </li>`).join('')}</ul>`;
  }
  ACC.responder = id => { const q = D.PREGUNTAS.find(x => x.id === id); const v = $('#q-' + id).value.trim(); if (!v) return A.aviso('Escribe la respuesta antes de guardar.', 'info'); q.resp = v; q.estado = 'respondida'; A.auditar({ modulo: 'Fiscal', registro: 'Pregunta ' + id.slice(1), campo: 'respuesta', despues: v.slice(0, 60) }); A.pintarPagina(); A.aviso('Respuesta guardada.'); };

  /* ---------- 10. configuración fiscal ---------- */
  function config() {
    const filasObl = [['IVA + anticipo + IGTF + ret. IVA', 'SENIAT', 'Quincenal', 'Calendario SPE, dígito 4', 'Cecilia', 5], ['Retenciones de ISLR', 'SENIAT', 'Mensual', 'Calendario SPE', 'Cecilia', 5], ['Pensiones (9 %)', 'SENIAT', 'Mensual', 'Calendario de pensiones', 'Jose', 5], ['IVSS y paro forzoso', 'IVSS', 'Mensual', 'Día fijo', 'Jose', 3], ['FAOV', 'BANAVIH', 'Mensual', 'Día fijo', 'Jose', 3], ['INCES', 'INCES', 'Trimestral', '5 días tras el trimestre', 'Jose', 5], ['Patente', 'Alcaldía', 'Mensual', 'Primeros 20 días', 'Cecilia', 5], ['LOCTI', 'SIDCAI', 'Mensual', 'No inscritos · gracia hasta abr 2027', '—', 30], ['Deporte (1 %)', 'IND', 'Anual', 'Omitida por decisión', '—', 0], ['Publicidad (aviso del toldo)', 'Alcaldía', 'Mensual', 'Cada mes, o el año entero antes del 31 mar con 15 % de rebaja', 'Cecilia', 5], ['Grandes Patrimonios', 'SENIAT', 'Anual · 2 fechas', '14 oct y 12 nov (RIF 1 y 4) · ¿declaración en cero? Por confirmar con Cecilia', 'Cecilia', 5]];
    return `<div class="rejilla"><div class="c8 pila"><div class="sec"><h2>Obligaciones</h2>${A.boton('fiscal', 'Cargar el calendario 2027', 'data-acc="pronto"', { tono: 'sec', icono: 'calendario', chico: true })}</div>
        ${A.tabla({ cols: [{ t: 'Obligación', cls: 'p' }, { t: 'Frecuencia', cls: 'x' }, { t: 'Cómo vence', cls: 'x' }, { t: 'Responsable', cls: 'r' }, { t: 'Aviso', cls: 'e' }], filas: filasObl.map(f => ({ abrir: 'oblconf:' + f[0], celdas: [`<b>${esc(f[0])}</b><small>${esc(f[1])}</small>`, esc(f[2]), esc(f[3]), esc(f[4]), f[5] ? f[5] + ' días antes' : tag('Inactiva', '')] })) })}
        <p class="muted">Cada diciembre el SENIAT publica el calendario del año siguiente. Se carga una vez y la app arma todos los vencimientos.</p></div>
      <div class="c4 pila"><article class="hoja"><h2>Alícuotas</h2><dl class="kv">${D.PARAMS.alicuotas.map(a => `<div><dt>${esc(a[0])}</dt><dd>${esc(a[1])}</dd></div>`).join('')}</dl></article>
        <article class="hoja"><h2>Numeración</h2><dl class="kv"><div><dt>Retenciones de IVA</dt><dd class="mono">202609-00000041</dd></div><div><dt>Retenciones de ISLR</dt><dd class="mono">ISLR-2026-09-012</dd></div></dl><p class="muted">Arranca en el número que usa hoy Cecilia. Nunca deja huecos.</p></article>
        <article class="hoja"><h2>Períodos cerrados</h2><dl class="kv"><div><dt>Agosto</dt><dd>${tag('Bloqueado', '')}</dd></div><div><dt>1.ª quincena de septiembre</dt><dd>${tag('Declarado', 'info')}</dd></div><div><dt>2.ª quincena de septiembre</dt><dd>${tag('Abierto', 'aviso')}</dd></div></dl></article></div></div>`;
  }
  FICHAS.oblconf = nombre => ({ titulo: nombre, sub: 'Configuración fiscal', mod: 'fiscal', obj: { dias: 5, resp: 'Cecilia' }, registro: 'Obligación ' + nombre,
    bloques: [{ filas: [{ l: 'Responsable', v: 'Cecilia', campo: { k: 'resp', tipo: 'select', opciones: ['Cecilia', 'Jose', 'Alejandro'] } }, { l: 'Avisar con (días)', v: '5 días antes', campo: { k: 'dias', tipo: 'numero' } }, { l: 'Activa', v: 'Sí' }] }] });

  /* ---------- la pantalla ---------- */
  PANT.fiscal = {
    titulo: 'Fiscal', grupo: 'Fiscal', icono: 'fiscal', mod: 'fiscal',
    cuenta: () => D.OBLIGACIONES.filter(o => o.faltan >= 0 && o.faltan <= 1 && o.estado !== 'pagada').length + 1,
    render: (sub = 'vence') => {
      const cuerpo = { vence, iva: hojaIva, z: zetas, compras, retenciones, parafiscales, permisos, paquete, preguntas, config }[sub]();
      return `<div class="pagina">${A.cab('SENIAT, Alcaldía y parafiscales', 'Fiscal', 'Aquí Cecilia llena lo fiscal y lo deja listo para declarar. Cada cifra se abre para ver de dónde sale.', S.usuario.rol === 'fiscal_externo' ? tag('Trabajas como contadora externa', 'info') : '')}
        ${A.lectura('fiscal')}
        ${A.subnav([['vence', 'Lo que vence', 2], ['iva', 'Hoja de IVA'], ['z', 'Reportes Z y ventas', 2], ['compras', 'Libro de compras'], ['retenciones', 'Retenciones'], ['parafiscales', 'Nómina, IGTF y patente'], ['permisos', 'Permisos y máquina', 2], ['paquete', 'Paquete del mes'], ['preguntas', 'Preguntas para Cecilia', D.PREGUNTAS.filter(q => q.estado === 'abierta').length, true], ['config', 'Configuración']], sub)}
        ${cuerpo}</div>`;
    },
    montar: raiz => {
      const cr = $('#iva-credito', raiz);
      if (cr && !cr.readOnly) cr.addEventListener('change', () => { const n = leerNum(cr.value); if (n === null) return; const antes = F.credito; F.credito = n; A.auditar({ modulo: 'Fiscal', registro: 'Hoja de IVA 2.ª quinc. sep', campo: 'crédito de compras', antes: dinero(antes, 'bs'), despues: dinero(n, 'bs') }); A.pintarPagina(); A.aviso('Crédito actualizado. El resultado se recalculó.'); });
      $$('[data-desc]', raiz).forEach(ch => ch.addEventListener('change', () => { F.descontar[ch.dataset.desc] = ch.checked; A.pintarPagina(); }));
    },
  };
})();
