/* Fiscal: lo que llena Cecilia para declarar sin errores. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, $, $$, esc, fmt, dinero, leerNum, ic, tag, puede } = A;
  const prov = id => (D.PROVEEDORES.find(p => p.id === id) || {}).nombre || '—';
  const F = { descontar: { rr1: true, rr2: true, rr3: true }, credito: D.IVA_HOJA.creditos[0][2] };
  const tonoObl = e => ({ pagada: 'ok', declarada: 'info', lista: 'info', revision: 'aviso', preparar: '', abierta: '' }[e] || '');
  const PASOS = ['Prepara Cecilia', 'Revisa Jose', 'Declarada', 'Pagada'];
  // prepara su responsable y revisa otra persona (la que dice «revisa», o Cecilia si prepara Jose y Jose si prepara otro; el RNET lo revisa Alejandro,
  // que ve los sueldos) · Alejandro puede revisar cualquiera que no haya preparado él · «sinPago» termina al declarar (RNET) · «soloPago» no se prepara ni se declara (aseo)
  const revisorDe = o => o.revisa || (o.resp === 'Jose' ? 'Cecilia' : 'Jose');
  const puedeRevisar = o => puede('fiscal', 'editar') && S.usuario.nombre !== o.resp && (S.usuario.nombre === revisorDe(o) || S.usuario.rol === 'dueno');
  const pasosDe = o => o.soloPago ? ['Por pagar', 'Pagada'] : [`Prepara ${o.resp}`, `Revisa ${revisorDe(o)}`, ...PASOS.slice(2, o.sinPago ? 3 : 4)];
  const hecha = o => o.estado === 'pagada' || (!!o.sinPago && o.estado === 'declarada');
  const estTag = o => o.soloPago && !hecha(o) ? tag('Por pagar', '') : A.estadoTag(o.estado);
  const r2 = n => Math.round(n * 100) / 100;
  // con Cecilia adentro se le habla a ella («Aquí llenas lo fiscal»); con los demás, de «la contadora» (la misma pieza que usan rrhh y los datos)
  const { esCecilia, aCecilia, paraCecilia } = A;
  const conCecilia = () => aCecilia('Por confirmar contigo', 'Por confirmar con Cecilia');

  // la hoja de IVA en números: también fija el monto de la obligación o1 (el total de la planilla)
  function calcIva() {
    const H = D.IVA_HOJA;
    const deb = H.debitos.reduce((s, d) => s + d[2], 0);
    const ret = D.RET_RECIBIDAS.filter(r => r.tipo === 'IVA' && r.estado === 'por_descontar' && F.descontar[r.id]).reduce((s, r) => s + r.monto, 0);
    const antes = r2(deb - F.credito - H.excedente);      // cuota antes de las retenciones
    const excCredito = Math.max(-antes, 0);                // el crédito que sobra pasa a la próxima quincena
    const cuota = Math.max(antes, 0);
    const retUsada = Math.min(ret, cuota);                 // las retenciones bajan el IVA hasta cero, no más
    const retSobra = r2(ret - retUsada);                   // lo que sobra sigue por descontar
    const iva = r2(cuota - retUsada);
    const retProv = r2(D.RET_EMITIDAS.filter(r => r.tipo.startsWith('IVA')).reduce((s, r) => s + r.monto, 0));
    return { deb, ret, excCredito, retUsada, retSobra, iva, retProv, total: r2(iva + H.igtf + H.anticipo + retProv) };
  }
  const syncIva = () => { const o = D.OBLIGACIONES.find(x => x.id === 'o1'); if (o && o.estado !== 'declarada' && o.estado !== 'pagada') o.monto = calcIva().total; };
  syncIva();

  /* ---------- 1. lo que vence ---------- */
  function calendario() {
    const dias = []; for (let d = 28; d <= 30; d++) dias.push({ n: d, mes: 'sep' }); for (let d = 1; d <= 31; d++) dias.push({ n: d, mes: 'oct' }); dias.push({ n: 1, mes: 'nov' });
    const evs = (d) => {
      const out = [];
      D.OBLIGACIONES.forEach(o => { if (o.dia === d.n && ((o.mes || 'oct') === d.mes)) out.push(`<button class="ev ${hecha(o) ? 'ok' : o.faltan <= 1 ? 'aviso' : 'info'}" data-abrir="obligacion:${o.id}" title="${esc(o.corto)}">${esc(o.corto)}</button>`); });
      D.PERMISOS_LIC.forEach(p => { if (d.mes === 'oct' && p.vence.startsWith(d.n + ' oct')) out.push(`<button class="ev alerta" data-abrir="permiso:${p.id}" title="${esc(p.nombre)}">Vence: ${esc(p.nombre.replace('Permiso de ', ''))}</button>`); });
      if (d.mes === 'oct' && d.n === 12) out.push('<span class="ev">Feriado</span>');
      if (d.mes === 'oct' && d.n === 26) out.push('<span class="ev">Feriado bancario</span>');
      return out.join('');
    };
    return `<div class="cal" role="grid" aria-label="Octubre de 2026">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(x => `<div class="dsem">${x}</div>`).join('')}
      ${dias.map(d => `<div class="dia${d.mes !== 'oct' ? ' fuera' : ''}${d.mes === 'oct' && d.n === 5 ? ' hoy' : ''}"><span class="n">${d.n}</span>${evs(d)}</div>`).join('')}</div>`;
  }
  function vence() {
    const prox = D.OBLIGACIONES.filter(o => !hecha(o)).sort((a, b) => a.faltan - b.faltan); const p0 = prox[0];
    const cuando = o => o.faltan === 0 ? 'hoy' : o.faltan === 1 ? 'mañana' : 'en ' + o.faltan + ' días';
    return `<div class="cifras">
        ${A.cifra({ etq: 'Vence esta semana', valor: prox.filter(o => o.faltan <= 6).length, sub: p0 ? 'la primera, ' + cuando(p0) + ': ' + esc(p0.corto) : '', tono: 'aviso', abrir: p0 ? 'obligacion:' + p0.id : '' })}
        ${A.cifra({ etq: 'A pagar este mes (estimado)', valor: dinero(prox.reduce((s, o) => s + (o.monto || 0), 0), 'bs', 0), sub: 'sin la 1.ª quincena de octubre', abrir: 'apagarmes:oct' })}
        ${A.cifra({ etq: 'Permisos por vencer', valor: D.PERMISOS_LIC.filter(p => p.estado === 'por_vencer').length, sub: 'bomberos el 21 de octubre', ir: 'fiscal/permisos', tono: 'aviso' })}
        ${A.cifra({ etq: 'Máquina fiscal', valor: 'Inspección vencida', sub: 'desde el 28 de septiembre', abrir: 'maquina:m1', tono: 'alerta' })}
      </div>
      <div class="rejilla"><div class="c7 pila"><div class="sec"><h2>Octubre de 2026</h2><span class="muted">Calendario de contribuyentes especiales · RIF terminado en 4</span></div>${calendario()}</div>
      <div class="c5 pila"><div class="sec"><h2>En orden de vencimiento</h2></div>
        <ul class="lista">${prox.map(o => `<li><button class="fila" data-abrir="obligacion:${o.id}"><span class="lead ${o.faltan <= 1 ? 'aviso' : ''}">${ic('fiscal')}</span><span class="medio"><b>${esc(o.corto)}</b><small>${esc(o.ente)} · ${esc(o.vence)} · ${esc(o.resp)}</small></span><span class="fin-col">${estTag(o)}${o.monto ? `<span class="muted num">${dinero(o.monto, 'bs')}</span>` : ''}</span></button></li>`).join('')}</ul>
        <p class="muted">Cada obligación avisa por WhatsApp y en Pendientes a su responsable con días de anticipación. Si nadie la mueve en 2 días, sube a Alejandro.</p></div></div>`;
  }
  // lo que hay que pagar en el mes: cada obligación con su monto, en orden de vencimiento
  FICHAS.apagarmes = () => {
    const prox = D.OBLIGACIONES.filter(o => !hecha(o)).sort((a, b) => a.faltan - b.faltan); const con = prox.filter(o => o.monto);
    return { titulo: 'A pagar este mes (estimado)', sub: 'Fiscal · octubre', mod: 'fiscal',
      bloques: [{ html: `<ul class="lista">${con.map(o => `<li><button class="fila" data-abrir="obligacion:${o.id}"><span class="lead">${ic('fiscal')}</span><span class="medio"><b>${esc(o.corto)}</b><small>${esc(o.ente)} · vence ${esc(o.vence)}</small></span><span class="monto">${dinero(o.monto, 'bs')}</span></button></li>`).join('')}</ul><dl class="kv"><div class="total"><dt><b>Total</b></dt><dd>${dinero(r2(con.reduce((s, o) => s + o.monto, 0)), 'bs')} <small class="tenue">≈ ${dinero(con.reduce((s, o) => s + o.monto, 0) / D.TASA.usd, 'usd', 0)}</small></dd></div></dl>` },
        prox.some(o => !o.monto) ? { html: `<p class="muted">No entran ${esc(prox.filter(o => !o.monto).map(o => o.corto + (o.sinPago ? ', que solo se declara' : ', que se calcula al cerrar la quincena')).join(', ni '))}.</p>` } : { oculto: true }] };
  };
  // de dónde sale el monto: la base de cada aporte, la patente, el aseo y la planilla de IVA
  function origen(o) {
    const p = D.PARAFISCALES.find(x => x.id === o.id);
    if (p) return { titulo: 'De dónde sale', filas: [{ l: 'Base de ' + p.periodo, v: dinero(p.base, 'bs') }, { l: 'Qué entra', v: esc(p.que), largo: true }, ...(p.piso ? [{ l: 'Piso: ' + D.NOMINA_FORMAL.personas + ' × $ ' + D.NOMINA_FORMAL.pisoUsd, v: dinero(p.piso, 'bs') + ` <small class="tenue">a Bs ${fmt(D.NOMINA_FORMAL.tasaPago)}</small>` }] : []), { l: 'Aporte', v: fmt(p.pct, p.pct % 1 ? 1 : 0) + ' % de la base' }, { l: 'Quién lo pone', v: esc(p.parte), largo: true }, ...(p.nota ? [{ l: 'Por confirmar', v: tag(paraCecilia(p.nota), 'aviso') }] : [])] };
    if (o.id === 'o6') { const P = D.PATENTE; return { titulo: 'De dónde sale', filas: [{ l: 'Ventas de ' + P.mes + ' (libro de ventas, sin IVA)', v: dinero(P.ventas, 'bs') }, { l: P.pct + ' % de las ventas', v: dinero(P.cuatro, 'bs') }, { l: 'Mínimo: ' + P.minimoEur + ' veces el euro BCV', v: dinero(P.minimo, 'bs') }, { l: 'Se paga el mayor', v: dinero(P.monto, 'bs') + ` <small class="tenue">≈ ${dinero(P.monto / D.TASA.usd)}</small>` }] }; }
    if (o.id === 'o12') return { titulo: 'De dónde sale', filas: [{ l: 'Tarifa del IMA', v: '€ ' + fmt(D.ASEO.eur, 0) + ' al mes (sale de los m² del local y del tipo de actividad)', largo: true }, { l: 'Euro BCV de hoy', v: dinero(D.TASA.eur, 'bs') }] };
    if (o.id === 'o11') return { html: `<p class="muted">Se declara en el portal del Ministerio del Trabajo la nómina formal del trimestre: personas, salarios y horas. La prepara ${esc(o.resp)} y la revisa ${esc(revisorDe(o))}, que ven los sueldos; ${aCecilia('tú ves', 'Cecilia ve')} la nómina agrupada.</p>` };
    if (o.id === 'o2') { const rs = D.RET_EMITIDAS.filter(r => r.tipo.startsWith('ISLR') && r.periodo === '2026-09'); return { titulo: 'De dónde sale', filas: rs.map(r => ({ l: r.comp + ' · ' + prov(r.prov), v: dinero(r.monto, 'bs') + ` <small class="tenue">${fmt(r.pctRet, 0)} % de ${dinero(r2(r.baseUsd * r.tasa), 'bs')}</small>` })).concat([{ l: 'Total de septiembre', v: dinero(o.monto, 'bs') }]) }; }
    if (o.id === 'o1') { const c = calcIva(); return { titulo: 'De dónde sale', filas: [{ l: 'IVA a pagar', v: dinero(c.iva, 'bs') }, { l: 'IGTF cobrado en divisas', v: dinero(D.IVA_HOJA.igtf, 'bs') }, { l: 'Anticipo de ISLR', v: dinero(D.IVA_HOJA.anticipo, 'bs') }, { l: 'Retenciones de IVA a proveedores', v: dinero(c.retProv, 'bs') }] }; }
    return { oculto: true };
  }
  FICHAS.obligacion = id => {
    const o = D.OBLIGACIONES.find(x => x.id === id);
    const paso = o.paso, listo = hecha(o);
    const acc = [];
    if (o.id === 'o1') acc.push({ txt: 'Abrir la hoja de IVA', acc: 'ir-a', arg: 'fiscal/iva', icono: 'archivo' });
    if (o.soloPago) { if (!listo) acc.push({ txt: 'Registrar el pago', acc: 'obl-paso', arg: o.id + '|pagada', icono: 'check', tono: 'pri', solo: 'editar' }); }
    else {
      if (o.estado === 'preparar' || o.estado === 'abierta') acc.push({ txt: 'Lista: pasar a revisión', acc: 'obl-paso', arg: o.id + '|revision', icono: 'enviar', tono: 'pri', solo: 'editar' });
      if (o.estado === 'revision' && puedeRevisar(o)) acc.push({ txt: 'Revisado: lista para declarar', acc: 'obl-paso', arg: o.id + '|lista', icono: 'check', tono: 'pri', solo: 'editar' });
      if (o.estado === 'lista') acc.push({ txt: 'Registrar lo declarado', acc: 'obl-declarar', arg: o.id, icono: 'subir', tono: 'pri', solo: 'editar' });
      if (o.estado === 'declarada' && !o.sinPago) acc.push({ txt: 'Registrar el pago', acc: 'obl-paso', arg: o.id + '|pagada', icono: 'check', tono: 'pri', solo: 'editar' });
    }
    const monto = o.sinPago ? { l: 'Monto (Bs)', v: 'No lleva pago: solo se declara' }
      : o.id === 'o1' ? { l: 'Monto (Bs)', v: dinero(o.monto, 'bs') + ' <small class="tenue">total de la planilla, sale de la hoja de IVA</small>' }
      : o.id === 'o2' ? { l: 'Monto (Bs)', v: dinero(o.monto, 'bs') + ' <small class="tenue">la suma de las retenciones de ISLR del mes, en Retenciones</small>' }
      : { l: 'Monto (Bs)', v: o.monto ? dinero(o.monto, 'bs') : 'Se calcula al cerrar la quincena', campo: { k: 'monto', tipo: 'dinero', mon: 'bs' } };
    const espera = o.estado === 'revision' && !puedeRevisar(o) ? `<p class="nota aviso">${ic('reloj', 's')}<span>Esperando la revisión de ${esc(revisorDe(o))}.</span></p>` : '';
    const soportes = o.soloPago ? ['Factura de ' + o.nombre.toLowerCase() + '.pdf', 'Comprobante de pago.pdf'] : ['Planilla del portal ' + o.periodo + '.pdf'].concat(o.sinPago ? [] : ['Comprobante de pago.pdf']);
    return {
      titulo: o.corto, sub: esc(o.ente) + ' · período ' + esc(o.periodo), mod: 'fiscal', obj: o, registro: o.corto, aviso: espera,
      tags: [[estTag(o).replace(/<[^>]+>/g, ''), o.soloPago && !listo ? '' : tonoObl(o.estado)], [o.faltan < 0 ? 'Venció ' + o.vence : o.faltan === 0 ? 'Vence hoy' : o.faltan === 1 ? 'Vence mañana' : 'Faltan ' + o.faltan + ' días', o.faltan <= 1 && !listo ? 'alerta' : '']],
      bloques: [
        { html: `<ol class="pasos">${pasosDe(o).map((p, i) => `<li class="${i < paso ? 'hecho' : i === paso ? 'actual' : ''}">${esc(p)}</li>`).join('')}</ol>` },
        { titulo: 'Datos', filas: [{ l: 'Qué es', v: esc(o.nombre), largo: true }, { l: 'Vence', v: esc(o.vence) }, { l: 'Responsable', v: esc(o.resp), campo: { k: 'resp', tipo: 'select', opciones: ['Cecilia', 'Jose', 'Alejandro'] } }, monto].concat(o.soloPago ? [] : [{ l: 'N.º de planilla', v: esc(o.planilla || '—'), campo: { k: 'planilla', tipo: 'texto' } }]) },
        origen(o),
        listo ? { titulo: 'Soportes', adjuntos: soportes } : { oculto: true },
        { html: o.soloPago ? '<p class="muted">Se paga con la factura del mes y se sube el comprobante. Lo pagado ya no se edita.</p>' : `<p class="muted">${o.sinPago ? 'Quien prepara y quien revisa son personas distintas.' : 'Quien prepara, quien revisa y quien aprueba el pago son personas distintas.'} Lo declarado ya no se edita: se corrige con una declaración sustitutiva.</p>` },
      ],
      // lo declarado o pagado ya no se edita: se corrige con una sustitutiva
      bloqueada: listo || o.estado === 'declarada', bloqueo: o.soloPago ? 'Está pagada: ya no se edita.' : 'Está ' + (o.estado === 'pagada' ? 'pagada' : 'declarada') + ': ya no se edita. Se corrige con una declaración sustitutiva.', acciones: acc,
    };
  };
  ACC['obl-paso'] = arg => {
    const [id, est] = arg.split('|'); const o = D.OBLIGACIONES.find(x => x.id === id);
    if (est === 'lista' && S.usuario.nombre === o.resp) return A.aviso('La revisa otra persona, no quien la preparó.', 'info');
    if (est === 'lista' && !puedeRevisar(o)) return A.aviso('La revisa ' + revisorDe(o) + '.', 'info');
    const txt = () => estTag(o).replace(/<[^>]+>/g, '');
    const antes = txt(); o.estado = est; o.paso = { revision: 1, lista: 2, declarada: 3, pagada: 4 }[est];
    A.auditar({ modulo: 'Fiscal', registro: o.corto, campo: 'estado', antes, despues: txt() });
    A.pintarFicha(); A.pintarPagina(); A.aviso('Listo. Le avisamos al siguiente en la cadena.');
  };
  ACC['obl-declarar'] = id => {
    const o = D.OBLIGACIONES.find(x => x.id === id);
    A.pedirMotivo({ titulo: 'Registrar lo declarado', etiqueta: 'N.º de planilla del portal', boton: 'Registrar', texto: 'Adjunta después el PDF del certificado. Queda bloqueada: para corregir, una sustitutiva.' }).then(m => {
      o.planilla = m; o.estado = 'declarada'; o.paso = 3;
      A.auditar({ modulo: 'Fiscal', registro: o.corto, campo: 'estado', antes: 'lista para declarar', despues: 'declarada', motivo: 'Planilla ' + m });
      A.pintarFicha(); A.pintarPagina(); A.aviso(o.sinPago ? 'Declarada. Esta no lleva pago.' : 'Declarada. Falta registrar el pago.');
    }).catch(() => {});
  };

  /* ---------- 2. hoja de IVA ---------- */
  function hojaIva() {
    const H = D.IVA_HOJA; const o = D.OBLIGACIONES.find(x => x.id === 'o1');
    const c = calcIva();
    const editable = puede('fiscal', 'editar') && o.estado !== 'pagada' && o.estado !== 'declarada';
    return `<div class="rejilla"><div class="c7 pila">
      <article class="hoja"><div class="hoja-cab"><h2>${ic('fiscal')}IVA · ${esc(H.periodo)}</h2>${o.estado === 'declarada' || o.estado === 'pagada' ? A.sello(o.estado === 'pagada' ? 'Pagada' : 'Declarada') : A.estadoTag(o.estado)}</div>
        <ol class="pasos">${pasosDe(o).map((p, i) => `<li class="${i < o.paso ? 'hecho' : i === o.paso ? 'actual' : ''}">${esc(p)}</li>`).join('')}</ol>
        <p class="muted">Vence el ${esc(H.vence)}. La app propone las cifras; ${aCecilia('tú las revisas, corriges lo que haga falta y registras lo que declaraste en el portal', 'la contadora las revisa, corrige lo que haga falta y registra lo que declaró en el portal')}.</p></article>
      <article class="hoja plana"><div class="tabla-env"><table class="t"><thead><tr><th>Débito fiscal (ventas)</th><th class="r plata">Base</th><th class="r plata">IVA</th></tr></thead><tbody>
        ${H.debitos.map(d => `<tr data-abrir="${d[0].includes('Z') ? 'ivalinea:z' : d[0].includes('empresas') ? 'ivalinea:emp' : 'ivalinea:adic'}" tabindex="0"><td>${esc(d[0])}</td><td class="r plata">${dinero(d[1], 'bs')}</td><td class="r plata">${dinero(d[2], 'bs')}</td></tr>`).join('')}
        </tbody><tfoot><tr><td>Total débito</td><td class="r plata"></td><td class="r plata">${dinero(c.deb, 'bs')}</td></tr></tfoot></table></div></article>
      <article class="hoja"><h2>Lo que se resta</h2>
        ${editable ? `<label class="campo" for="iva-credito"><span>Crédito fiscal de las compras (Bs)</span><input id="iva-credito" inputmode="decimal" value="${fmt(F.credito)}"><small class="ayuda">${aCecilia('Por ahora lo escribes tú desde tu Excel', 'Por ahora lo escribe la contadora desde su Excel')}; más adelante la app lo arma sola desde las facturas.</small></label>` : ''}
        ${!editable && puede('fiscal', 'editar') ? `<p class="nota gris">${ic('candado', 's')}<span>Ya se declaró: estas cifras no se cambian.</span></p>` : ''}
        <dl class="kv">${editable ? '' : `<div><dt>Crédito fiscal de las compras</dt><dd>${dinero(F.credito, 'bs')}</dd></div>`}<div><dt>Excedente de la quincena anterior</dt><dd>${dinero(H.excedente, 'bs')}${H.excedente ? '' : ' <small class="tenue">no quedó: en la 1.ª quincena se pagó IVA</small>'}</dd></div></dl>
        <p class="etq">Retenciones que nos hicieron y se descuentan</p>
        ${(xs => editable ? xs.map(r => `<label class="interruptor"><input type="checkbox" data-desc="${r.id}" ${F.descontar[r.id] ? 'checked' : ''}><span>${esc(r.cliente)} · comp. ${esc(r.comp.slice(-6))} · <b class="num">${dinero(r.monto, 'bs')}</b></span></label>`).join('')
          // quien solo mira (o con la hoja declarada) ve si cada una se descuenta, sin casillas que no responden
          : `<dl class="kv">${xs.map(r => `<div><dt>${esc(r.cliente)} · comp. ${esc(r.comp.slice(-6))}</dt><dd>${dinero(r.monto, 'bs')} <small class="tenue">${F.descontar[r.id] ? 'se descuenta' : 'no se descuenta'}</small></dd></div>`).join('')}</dl>`)(D.RET_RECIBIDAS.filter(r => r.tipo === 'IVA' && r.estado === 'por_descontar'))}
      </article></div>
      <div class="c5 pila"><article class="hoja" style="position:sticky;top:0"><h2>Resultado</h2>
        <dl class="kv"><div><dt>Débito</dt><dd>${dinero(c.deb, 'bs')}</dd></div><div><dt>− Crédito de compras</dt><dd>${dinero(F.credito, 'bs')}</dd></div><div><dt>− Excedente anterior</dt><dd>${dinero(H.excedente, 'bs')}</dd></div><div><dt>− Retenciones descontadas</dt><dd>${dinero(c.retUsada, 'bs')}${c.retSobra > 0 ? ` <small class="tenue">de ${dinero(c.ret, 'bs')} marcadas</small>` : ''}</dd></div>
        <div class="total"><dt><b>IVA a pagar</b></dt><dd style="font-size:17px">${dinero(c.iva, 'bs')}</dd></div>
        ${c.excCredito > 0 ? `<div><dt>Excedente de crédito (pasa a la próxima quincena)</dt><dd>${dinero(c.excCredito, 'bs')}</dd></div>` : ''}
        ${c.retSobra > 0 ? `<div><dt>Retenciones que siguen por descontar</dt><dd>${dinero(c.retSobra, 'bs')}</dd></div>` : ''}</dl>
        ${c.excCredito > 0 || c.retSobra > 0 ? `<p class="muted">Lo que se resta pasó del IVA, así que no hay IVA que pagar.${c.excCredito > 0 ? ' El excedente de crédito se resta en la próxima quincena.' : ''}${c.retSobra > 0 ? ' Las retenciones que sobran también pasan a la próxima; si en 3 quincenas no se pudieron usar, se pueden pedir de vuelta al SENIAT.' : ''}</p>` : ''}
        <p class="etq">En la misma planilla</p>
        <dl class="kv"><div><dt>IGTF cobrado en divisas (de los Z)</dt><dd>${dinero(H.igtf, 'bs')}</dd></div><div><dt>Anticipo de ISLR (1 % de los ingresos)</dt><dd>${dinero(H.anticipo, 'bs')}</dd></div><div><dt>Retenciones de IVA a proveedores</dt><dd>${dinero(c.retProv, 'bs')}</dd></div>
        <div class="total"><dt><b>Total de la planilla</b></dt><dd style="font-size:17px">${dinero(c.total, 'bs')}</dd></div></dl>
        <p class="muted">≈ ${dinero(c.total / D.TASA.usd, 'usd', 0)} a la tasa BCV de hoy. Las retenciones a proveedores son las de la pestaña Retenciones, en bolívares a la tasa del día de cada factura.</p>
        ${o.estado === 'revision' ? (puedeRevisar(o) ? `<button class="btn pri full" data-acc="obl-paso" data-arg="o1|lista">${ic('check', 's')}Revisado: lista para declarar</button>` : `<p class="nota aviso">${ic('reloj', 's')}<span>Esperando la revisión de ${esc(revisorDe(o))}.</span></p>`) : ''}
        ${o.estado === 'lista' ? A.boton('fiscal', 'Registrar lo declarado', 'data-acc="obl-declarar" data-arg="o1"', { icono: 'subir' }) : ''}
        <button class="btn sec full" data-acc="descargar">${ic('descargar', 's')}Descargar la hoja en Excel</button>
      </article></div></div>`;
  }

  /* ---------- 3. reportes Z y libro de ventas ---------- */
  function zetas() {
    const L = D.LIBRO_VENTAS;
    return `<div class="cifras">
        ${A.cifra({ etq: 'Reportes Z de septiembre', valor: '28 de 30', sub: 'faltan los días 13 y 27', tono: 'alerta', abrir: 'paquete:' + D.PAQUETE.findIndex(x => x[3] === 'z') })}
        ${A.cifra({ etq: 'Leídos sin confirmar', valor: D.ZETAS.filter(z => z.estado === 'leido').length, sub: 'los confirma Jose', tono: 'aviso', abrir: (z => z ? 'zeta:' + z.id : '')(D.ZETAS.find(z => z.estado === 'leido')) })}
        ${A.cifra({ etq: 'Saltos de número', valor: '1', sub: 'falta el Z 1485', abrir: 'zeta:z26', tono: 'alerta' })}
        ${A.cifra({ etq: 'Ventas de la quincena (base)', valor: dinero(D.IVA_HOJA.debitos[0][1], 'bs', 0), sub: 'consumidor final · 16 al 30 sep', abrir: 'ivalinea:z' })}
      </div>
      <div class="filtros">${A.boton('fiscal', 'Subir el Z de ayer', 'data-acc="subir-z"', { icono: 'camara' })}<span class="muted">Una foto o un escaneo del ticket largo. La app lee el final y Jose confirma.</span></div>
      ${A.tabla({ cols: [{ t: 'Día', cls: 'p' }, { t: 'N.º Z', cls: 'x' }, { t: 'Facturas', cls: 'x' }, { t: 'IVA', cls: 'r x plata' }, { t: 'Base gravada', cls: 'r plata' }, { t: 'Estado', cls: 'e' }],
        filas: D.ZETAS.map(z => ({ abrir: 'zeta:' + z.id, celdas: [`<b>${esc(z.fecha)}</b><small>${z.alerta ? ic('alerta', 'xs') + ' ' + esc(z.alerta) : z.num ? 'Z ' + z.num + ' · ' + z.facturas + ' facturas' : 'No se ha subido'}</small>`, z.num || '—', z.facturas || '—', z.iva ? dinero(z.iva, 'bs') : '—', z.base ? dinero(z.base, 'bs') : '—', z.estado === 'falta' ? tag('Falta', 'alerta') : z.estado === 'leido' ? tag('Leído, falta confirmar', 'aviso') : tag('Confirmado', 'ok')] })) })}
      <div class="sec"><h2>Libro de ventas · septiembre</h2><span class="cabeza-acc">${A.boton('fiscal', 'Exportar PDF', 'data-acc="descargar"', { tono: 'sec', icono: 'descargar', chico: true })}${A.boton('fiscal', 'Exportar Excel', 'data-acc="descargar"', { tono: 'sec', icono: 'descargar', chico: true })}</span></div>
      <article class="hoja"><dl class="kv"><div><dt>A consumidor final (resumen diario de los Z)</dt><dd>${dinero(L.final, 'bs')} + IVA ${dinero(L.ivaFinal, 'bs')}</dd></div><div><dt>A contribuyentes (facturas con RIF)</dt><dd>${dinero(L.empresas, 'bs')} + IVA ${dinero(L.ivaEmpresas, 'bs')}</dd></div><div><dt>Exento</dt><dd>${dinero(L.exento, 'bs')}</dd></div><div class="total"><dt><b>Ventas del mes, sin IVA</b></dt><dd>${dinero(r2(L.final + L.empresas + L.exento), 'bs')} <small class="tenue">con esto se calcula la patente</small></dd></div><div><dt>Cuadra con las declaraciones</dt><dd>${tag('1.ª quincena sí · 2.ª en revisión', 'aviso')}</dd></div></dl>
      <p class="muted">Las facturas con RIF que ya están dentro del Z no se cuentan dos veces (${aCecilia('tu pregunta 4', 'pregunta 4 para Cecilia')}). El libro va impreso al local cada mes.</p></article>`;
  }
  FICHAS.zeta = id => {
    const z = D.ZETAS.find(x => x.id === id);
    if (z.estado === 'falta') return { titulo: 'Reporte Z del ' + z.fecha, sub: 'Fiscal', mod: 'fiscal', obj: z, tags: [['Falta', 'alerta']],
      bloques: [{ html: `<p>Sin el Z de este día no cierra el libro de ventas. Búscalo en la carpeta de la caja.</p>${puede('fiscal', 'editar') ? `<label class="soltar" for="z-sube-${z.id}">${ic('camara')}<span><b>Subir la foto o el escaneo</b>Del ticket largo, sobre todo el tramo final.</span></label><input id="z-sube-${z.id}" type="file" accept="image/*,application/pdf" class="sr-only">` : ''}` }] };
    return { titulo: 'Reporte Z ' + z.num, sub: esc(z.fecha) + ' · máquina de la caja principal', mod: 'fiscal', obj: z, registro: 'Z ' + z.num, tags: [[z.estado === 'leido' ? 'Leído, falta confirmar' : 'Confirmado por ' + z.por, z.estado === 'leido' ? 'aviso' : 'ok']],
      aviso: z.alerta ? `<p class="nota alerta">${ic('alerta', 's')}<span>${esc(z.alerta)}. Pudo ser un Z sacado dos veces o uno perdido. Hay que justificarlo.</span></p>` : '',
      bloques: [{ titulo: 'Lo que leyó la app', filas: [{ l: 'N.º de Z', v: z.num, campo: { k: 'num', tipo: 'numero', sinMiles: true, entero: true, obligatorio: true } }, { l: 'Facturas del día', v: z.facturas, campo: { k: 'facturas', tipo: 'numero', entero: true, obligatorio: true } }, { l: 'Base gravada 16 %', v: dinero(z.base, 'bs'), campo: { k: 'base', tipo: 'dinero', mon: 'bs', obligatorio: true } }, { l: 'IVA', v: dinero(z.iva, 'bs'), campo: { k: 'iva', tipo: 'dinero', mon: 'bs', obligatorio: true } }, { l: 'Exento', v: dinero(z.exento, 'bs'), campo: { k: 'exento', tipo: 'dinero', mon: 'bs', obligatorio: true } }, { l: 'IGTF', v: dinero(z.igtf, 'bs'), campo: { k: 'igtf', tipo: 'dinero', mon: 'bs', obligatorio: true } }, { l: 'Primer y último comprobante', v: `<span class="mono">${(z.num * 160 - z.facturas + 1)}–${z.num * 160}</span>` }] },
        { titulo: 'Foto', adjuntos: ['Z ' + z.num + ' · ' + z.fecha + '.jpg'] }],
      acciones: z.estado === 'leido' ? [{ txt: 'Confirmar el Z', acc: 'confirmar-z', arg: z.id, icono: 'check', tono: 'pri', solo: 'editar' }] : [] };
  };
  ACC['confirmar-z'] = id => { const z = D.ZETAS.find(x => x.id === id); z.estado = 'confirmado'; z.por = S.usuario.nombre; A.auditar({ modulo: 'Fiscal', registro: 'Z ' + z.num, campo: 'estado', antes: 'leído', despues: 'confirmado' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Z confirmado.'); };
  ACC['subir-z'] = () => A.aviso('Se abriría la cámara del teléfono para fotografiar el Z de ayer. (Simulado)', 'info');
  FICHAS.ivalinea = k => {
    const t = { z: ['Ventas a consumidor final', 'La suma de los Z de la quincena (16 al 30 de septiembre), menos las facturas con RIF que ya están dentro del Z.'], emp: ['Facturas a empresas', '3 facturas personalizadas con RIF del cliente.'], adic: ['Alícuota adicional (31 %)', 'Es la casilla «A» del Z: la alícuota de lujo (16 % + 15 %). Su lista (vehículos, motos, joyas, aeronaves, botes, máquinas de juego) no trae licores ni comida: en el restaurante va en cero y los licores pagan el 16 %. ' + aCecilia('Si algún día trae monto, revísalo tú.', 'Si algún día trae monto, revisarlo con Cecilia.')] }[k];
    return { titulo: t[0], sub: 'Hoja de IVA', mod: 'fiscal', bloques: [{ html: `<p>${t[1]}</p>` }, k === 'z' ? { html: A.tabla({ cols: [{ t: 'Día', cls: 'p' }, { t: 'IVA', cls: 'r plata' }], filas: D.ZETAS.filter(z => z.iva).map(z => ({ abrir: 'zeta:' + z.id, celdas: [esc(z.fecha), dinero(z.iva, 'bs')] })) }) } : k === 'emp' ? { html: A.tabla({ cols: [{ t: 'Factura', cls: 'p' }, { t: 'IVA', cls: 'r plata' }], filas: D.VENTAS_EMPRESAS.map(v => ({ abrir: 'ventaemp:' + v.id, celdas: [esc(v.num + ' · ' + v.cliente), dinero(v.iva, 'bs')] })) }) } : { oculto: true }] };
  };

  /* ---------- 4. libro de compras ---------- */
  function compras() {
    return `<p class="nota gris">${ic('reloj', 's')}<span><b>${aCecilia('Por ahora lo escribes tú desde tu Excel', 'Por ahora lo escribe la contadora desde su Excel')}; más adelante la app lo arma sola desde las facturas.</b> Mientras tanto, el crédito fiscal se escribe a mano en la hoja de IVA. Abajo, cómo se verá el libro cuando lo arme la app.</span></p>
      ${A.tabla({ cols: [{ t: 'Factura', cls: 'p' }, { t: 'N.º de control', cls: 'x' }, { t: 'Base', cls: 'r x plata' }, { t: 'IVA', cls: 'r plata' }, { t: 'Retenido', cls: 'r x plata' }, { t: 'Comprobante', cls: 'e' }],
        filas: D.COMPRAS.map(c => ({ abrir: 'factura:' + (D.FACTURAS.find(f => f.num === c.num) || {}).id, celdas: [`<b>${esc(prov(c.prov))}</b><small>N.º ${esc(c.num)} · ${esc(c.fecha)} · tasa ${fmt(c.tasa)}${c.alerta ? ' · ' + ic('alerta', 'xs') + ' ' + esc(c.alerta) : ''}</small>`, esc(c.control), dinero(c.base, 'bs'), dinero(c.iva, 'bs'), dinero(c.retenido, 'bs'), c.comp === 'pendiente' ? tag('Por emitir', 'aviso') : `<span class="mono" style="font-size:12px">${esc(c.comp)}</span>`] })) })}
      <p class="muted">En bolívares, a la tasa BCV del día de cada factura. Las de la 2.ª quincena de septiembre (16 al 30) suman ${dinero(D.IVA_HOJA.creditos[0][2], 'bs')} de IVA: es el crédito de la hoja de IVA, y lo retenido es lo que esa hoja suma como retenciones a proveedores. La del 3 de octubre va en la 1.ª quincena de octubre.</p>
      <div class="filtros">${A.boton('fiscal', 'Exportar el libro', 'data-acc="descargar"', { tono: 'sec', icono: 'descargar' })}</div>`;
  }

  /* ---------- 5. retenciones ---------- */
  function retenciones() {
    const porDesc = D.RET_RECIBIDAS.filter(r => r.estado === 'por_descontar');
    return `<div class="cifras">
        ${A.cifra({ etq: 'Por descontar (plata que se recupera)', valor: dinero(porDesc.reduce((s, r) => s + r.monto, 0), 'bs'), sub: porDesc.length + ' comprobantes de clientes · se descuentan en la hoja de IVA', ir: 'fiscal/iva' })}
        ${A.cifra({ etq: 'Comprobantes por emitir', valor: D.RET_EMITIDAS.filter(r => r.estado === 'borrador').length + D.COMPRAS.filter(c => c.comp === 'pendiente').length, sub: 'a proveedores · 2 días hábiles ' + tag(conCecilia(), 'aviso'), tono: 'aviso', abrir: (c => { const f = c && D.FACTURAS.find(x => x.prov === c.prov && x.num === c.num); return f ? 'factura:' + f.id : ''; })(D.COMPRAS.find(c => c.comp === 'pendiente')) })}
        ${A.cifra({ etq: 'Último número usado', valor: '<span class="mono" style="font-size:18px">202609-00000041</span>', sub: 'la numeración no tiene huecos', abrir: (r => r ? 'retemi:' + r.id : '')(D.RET_EMITIDAS.find(r => r.comp === '202609-00000041')) })}
      </div>
      <div class="sec"><h2>Las que nos hicieron (clientes especiales)</h2>${A.boton('fiscal', 'Registrar un comprobante', 'data-acc="pronto"', { tono: 'sec', icono: 'mas', chico: true })}</div>
      ${A.tabla({ cols: [{ t: 'Comprobante', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Período', cls: 'x' }, { t: 'Monto', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: D.RET_RECIBIDAS.map(r => ({ abrir: 'retrec:' + r.id, celdas: [`<b>${esc(r.cliente)}</b><small class="mono">${esc(r.comp)}</small>`, esc(r.tipo), esc(r.periodo), dinero(r.monto, 'bs'), A.estadoTag(r.estado)] })) })}
      <div class="sec"><h2>Las que hicimos a proveedores</h2><span class="cabeza-acc">${A.boton('fiscal', 'TXT de IVA para el portal', 'data-acc="descargar"', { tono: 'sec', icono: 'descargar', chico: true })}${A.boton('fiscal', 'XML de ISLR', 'data-acc="descargar"', { tono: 'sec', icono: 'descargar', chico: true })}</span></div>
      ${A.tabla({ cols: [{ t: 'Comprobante', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Factura', cls: 'x' }, { t: 'Monto', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: D.RET_EMITIDAS.map(r => ({ abrir: 'retemi:' + r.id, celdas: [`<b>${esc(prov(r.prov))}</b><small class="mono">${esc(r.comp)}</small>`, esc(r.tipo), `${esc(r.factura)}<br><small class="tenue">${esc(r.fecha)} · tasa ${fmt(r.tasa)}</small>`, dinero(r.monto, 'bs'), A.estadoTag(r.estado)] })) })}
      <p class="muted">En bolívares, a la tasa BCV del día de cada factura. Las de IVA son las mismas que suma la hoja de IVA.</p>`;
  }
  FICHAS.retrec = id => {
    const r = D.RET_RECIBIDAS.find(x => x.id === id);
    return { titulo: 'Retención de ' + r.cliente, sub: 'Comprobante ' + esc(r.comp), mod: 'fiscal', obj: r, registro: 'Retención ' + r.comp, tags: [[A.estadoTag(r.estado).replace(/<[^>]+>/g, ''), r.estado === 'descontada' ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'Cliente', v: esc(r.cliente) }, { l: 'Tipo', v: esc(r.tipo) }, { l: 'Monto (Bs)', v: dinero(r.monto, 'bs'), campo: { k: 'monto', tipo: 'dinero', mon: 'bs', obligatorio: true } }, { l: 'Período', v: esc(r.periodo) }, { l: 'Se descuenta en', v: r.tipo === 'ISLR' ? 'ISLR del año' : 'La declaración de IVA de la quincena' }, { l: 'Se usó en', v: r.estado === 'descontada' ? esc(r.usadaEn || '—') : 'Todavía no' }] }, { titulo: 'Comprobante', adjuntos: ['Retención ' + r.comp + '.pdf'] }, { html: `<p class="muted">${r.tipo === 'ISLR' ? 'Las de ISLR no van en la hoja de IVA: rebajan el ISLR que se declara en marzo. ' : ''}Al registrarla, también baja lo que el cliente nos debe en Cobranza. Nunca se manda por el grupo Caja.</p>` }] };
  };
  FICHAS.retemi = id => {
    const r = D.RET_EMITIDAS.find(x => x.id === id);
    // la retención baja el saldo de su factura: el proveedor la cobra completa menos esto (la de IVA va en «ret» y la de ISLR en «retIslr»)
    const f = D.FACTURAS.find(x => (x.ret && x.ret.id === r.id) || (x.retIslr && x.retIslr.id === r.id)); const rf = f ? (f.ret && f.ret.id === r.id ? f.ret : f.retIslr) : null;
    const islr = r.tipo.startsWith('ISLR');
    return { titulo: 'Comprobante ' + r.comp, sub: esc(prov(r.prov)) + ' · factura ' + esc(r.factura), mod: 'fiscal', obj: r, registro: 'Retención ' + r.comp, anulable: r.estado !== 'enterada', tags: [[A.estadoTag(r.estado).replace(/<[^>]+>/g, ''), r.estado === 'entregada' ? 'ok' : r.estado === 'borrador' ? '' : 'info']],
      bloques: [{ filas: [{ l: 'Tipo', v: esc(r.tipo) }, { l: 'Monto (Bs)', v: dinero(r.monto, 'bs') + (islr ? ` <small class="tenue">${fmt(r.pctRet, 0)} % de la base sin IVA, ${dinero(r2(r.baseUsd * r.tasa), 'bs')}</small>` : '') }, { l: 'Factura', v: esc(r.factura) + ' · ' + esc(r.fecha) }, { l: 'Tasa BCV de ese día', v: dinero(r.tasa, 'bs') }, ...(rf ? [{ l: 'Se le descuenta al proveedor', v: `${dinero(rf.usd)} de la ${puede('proveedores') ? `<button class="enlace" data-abrir="factura:${f.id}">factura N.º ${esc(f.num)}</button>` : 'factura N.º ' + esc(f.num)}` }] : []), ...(islr ? [{ l: 'Se declara en', v: `Las retenciones de ISLR de septiembre (${puede('fiscal') ? '<button class="enlace" data-abrir="obligacion:o2">vence el mar 6 oct</button>' : 'vence el mar 6 oct'})` }] : []), { l: 'Plazo de entrega', v: '2 días hábiles ' + tag(conCecilia(), 'aviso') }] },
        { html: '<p class="muted">Si no se entrega a tiempo, la multa es de 100 veces el euro BCV y puede haber hasta 10 días de cierre.</p>' }],
      acciones: r.estado === 'borrador' ? [{ txt: 'Emitir el comprobante', acc: 'emitir-ret', arg: r.id, icono: 'archivo', tono: 'pri', solo: 'editar' }] : r.estado === 'emitida' ? [{ txt: 'Marcar entregado', acc: 'entregar-ret', arg: r.id, icono: 'check', tono: 'pri', solo: 'editar' }] : [{ txt: 'Descargar PDF', acc: 'descargar', icono: 'descargar' }] };
  };
  ACC['emitir-ret'] = id => { const r = D.RET_EMITIDAS.find(x => x.id === id); r.estado = 'emitida'; A.auditar({ modulo: 'Fiscal', registro: 'Retención ' + r.comp, campo: 'estado', antes: 'borrador', despues: 'emitida' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Comprobante emitido con el siguiente número.'); };
  ACC['entregar-ret'] = id => { const r = D.RET_EMITIDAS.find(x => x.id === id); r.estado = 'entregada'; A.auditar({ modulo: 'Fiscal', registro: 'Retención ' + r.comp, campo: 'estado', antes: 'emitida', despues: 'entregada' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Marcado como entregado al proveedor.'); };

  /* ---------- 6. nómina, IGTF y municipio ---------- */
  function parafiscales() {
    const P = D.PATENTE, o6 = D.OBLIGACIONES.find(x => x.id === 'o6');
    // el monto de cada fila es el de su obligación: el mismo que sale en «Lo que vence»
    const filas = D.PARAFISCALES.map(p => {
      const o = D.OBLIGACIONES.find(x => x.id === p.id); const monto = o ? o.monto : p.monto;
      return { abrir: o ? 'obligacion:' + o.id : 'oblconf:' + p.conf, monto, celdas: [`<b>${esc(p.ente)}</b><small>${esc(p.corto)}${p.nota ? ' · ' + esc(paraCecilia(p.nota.charAt(0).toLowerCase() + p.nota.slice(1))) : ''}</small>`, dinero(p.base, 'bs'), dinero(monto, 'bs'), tag(p.vence, p.vence === 'Hoy' ? 'alerta' : '')] };
    });
    return `<p class="nota gris">${ic('candado', 's')}<span>Las bases salen solo de la nómina formal (${D.NOMINA_FORMAL.personas} personas) y llegan agrupadas, sin nombres ni sueldos por persona.</span></p>
      ${A.tabla({ cols: [{ t: 'Aporte', cls: 'p' }, { t: 'Base', cls: 'r x plata' }, { t: 'Monto', cls: 'r plata' }, { t: 'Vence', cls: 'e' }], filas, pie: ['Total', '', dinero(filas.reduce((s, f) => s + f.monto, 0), 'bs'), ''] })}
      <p class="muted">Cada aporte tiene su base. El 10 % es salario: entra en el FAOV, el INCES y las pensiones, pero solo la parte de la nómina formal (${dinero(D.NOMINA_FORMAL.diezEur.sep[0], 'eur')} del 10 % de septiembre, a Bs ${fmt(D.NOMINA_FORMAL.diezEur.sep[1])}). El incremento del cestaticket no es salario: solo entra en las pensiones.</p>
      <div class="rejilla"><div class="c6"><article class="hoja"><h2>IGTF cobrado (3 % de los cobros en divisas)</h2><dl class="kv"><div><dt>1.ª quincena de septiembre</dt><dd>${dinero(D.IVA_Q1.igtf, 'bs')} ${tag('Declarado', 'ok')}</dd></div><div><dt>2.ª quincena de septiembre</dt><dd>${dinero(D.IVA_HOJA.igtf, 'bs')} ${tag('En la hoja de IVA', 'aviso')}</dd></div></dl><p class="muted">Sale sumado de los Z. Nadie lo carga cobro por cobro.</p></article></div>
      <div class="c6"><article class="hoja"><h2>Patente municipal (Valencia)</h2><dl class="kv"><div><dt>Ventas de ${esc(P.mes)} (libro de ventas, sin IVA)</dt><dd>${dinero(P.ventas, 'bs')}</dd></div><div><dt>Alícuota</dt><dd>${P.pct} % ${tag(conCecilia(), 'aviso')}</dd></div><div><dt>${P.pct} % de las ventas</dt><dd>${dinero(P.cuatro, 'bs')}</dd></div><div><dt>Mínimo del mes (${P.minimoEur} veces el euro BCV)</dt><dd>${dinero(P.minimo, 'bs')}</dd></div>
        <div class="total"><dt><b>A pagar: el mayor de los dos</b></dt><dd>${dinero(o6.monto, 'bs')}</dd></div><div><dt>Vence</dt><dd>${esc(P.vence)}</dd></div></dl>
        <p class="muted">Se paga en bolívares: ≈ ${dinero(o6.monto / D.TASA.usd)} a la tasa BCV de hoy.</p></article></div></div>`;
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
      bloques: [{ filas: [{ l: 'Número', v: esc(p.num), campo: { k: 'num', tipo: 'texto' } }, { l: 'Vence', v: esc(p.vence), campo: { k: 'vence', tipo: 'texto' } }, { l: 'Avisar con (días)', v: p.aviso + ' días antes', campo: { k: 'aviso', tipo: 'numero', entero: true, obligatorio: true } }, { l: 'Responsable', v: 'Jose' }] },
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
    const listos = D.PAQUETE.filter(x => x[2] === 'ok').length;
    return `<article class="hoja"><div class="hoja-cab"><h2>${ic('archivo')}${aCecilia('Tu paquete de septiembre', 'Paquete de septiembre para la contadora')}</h2>${tag(listos + ' de ' + D.PAQUETE.length + ' listos', listos === D.PAQUETE.length ? 'ok' : 'aviso')}</div>
        <ul class="lista">${D.PAQUETE.map(([t, n, e], i) => `<li><button class="fila" data-abrir="paquete:${i}"><span class="lead ${e === 'ok' ? 'ok' : 'aviso'}">${ic(e === 'ok' ? 'check' : 'reloj')}</span><span class="medio"><b>${esc(t)}</b><small>${esc(n)}</small></span><span class="fin">${tag(e === 'ok' ? 'Listo' : 'Falta', e === 'ok' ? 'ok' : 'aviso')}${ic('derecha', 's chev')}</span></button></li>`).join('')}</ul>
        <button class="btn pri" data-acc="bajar-paquete">${ic('descargar', 's')}Descargar el paquete</button>
        <p class="muted">Pide tu código y queda anotado quién lo descargó y cuándo. Toca cada pieza para ver qué trae y qué falta; también se ve suelta en su sección.</p></article>`;
  }
  // cada pieza del paquete: qué trae, qué falta y dónde se ve suelta
  const PIEZA = {
    z: { ir: 'fiscal/z', lista: 'Lo que falta', txt: 'Los reportes Z de la máquina fiscal, uno por día. Sin el de un día no cierra el libro de ventas.',
      filas: () => D.ZETAS.filter(z => z.estado !== 'confirmado').map(z => ({ abrir: 'zeta:' + z.id, t: 'Z del ' + z.fecha.toLowerCase(), s: z.estado === 'falta' ? 'Falta: no se ha subido' : 'Leído, falta que Jose lo confirme', tono: z.estado === 'falta' ? 'alerta' : 'aviso' })) },
    empresas: { ir: 'clientes/empresas', txt: 'Las facturas con el RIF del cliente, aparte del resumen de los Z.',
      filas: () => D.VENTAS_EMPRESAS.map(v => ({ abrir: 'ventaemp:' + v.id, t: 'N.º ' + v.num + ' · ' + v.cliente, s: v.fecha + ' · base ' + dinero(v.base, 'bs'), tono: 'ok' })) },
    compras: { ir: 'proveedores/facturas', txt: 'Las facturas de los proveedores del mes, de la copia de Odoo. Hoy la copia es a mano los domingos (la última, el dom 4 oct): la automática sigue bloqueada.',
      filas: () => [] },
    retenciones: { ir: 'fiscal/retenciones', txt: 'Los comprobantes de retención que nos mandaron los clientes especiales en septiembre. Se descuentan en la declaración de IVA.',
      filas: () => D.RET_RECIBIDAS.filter(r => r.periodo === '2026-09').map(r => ({ abrir: 'retrec:' + r.id, t: r.cliente + ' · ' + r.tipo, s: 'Comp. ' + r.comp + ' · ' + dinero(r.monto, 'bs'), tono: 'ok' })) },
    bancos: { ir: 'bancos', txt: 'Los estados de cuenta de septiembre de las cuatro cuentas en bolívares. Con ellos se concilia el mes.',
      filas: () => D.CONCILIACION.map(c => ({ abrir: 'conciliacion:' + c.id, t: c.id + ' · ' + ((D.CUENTAS.find(x => x.id === c.id) || {}).nombre || ''), s: c.estado === 'falta' ? 'Falta el estado de cuenta' : 'Subido el ' + c.subido.toLowerCase() + ' por ' + c.por, tono: c.estado === 'falta' ? 'alerta' : 'ok' })) },
    nomina: { ir: 'nomina/corridas', txt: 'La nómina formal de septiembre, agrupada por corrida y sin nombres. Con ella se declaran el IVSS, el FAOV, el INCES y las pensiones. La nómina interna no va a los entes.',
      filas: () => D.NOMINA.corridas.filter(c => /sep/.test(c.fecha) && (c.tipo === 'formal' || c.tipo === 'diez')).sort((a, b) => (parseInt(a.fecha, 10) - parseInt(b.fecha, 10)) || ((a.tipo === 'diez') - (b.tipo === 'diez'))).map(c => ({ abrir: 'corrida:' + c.id, t: A.corridas.nombre(c) + ' · ' + c.fecha, s: c.personas + ' personas · ' + (c.mon === 'eur' ? dinero(c.total, 'eur') + (c.formalEur ? ': ' + dinero(c.formalEur, 'eur') + ' son de la nómina formal y entran en las bases' : '') : dinero(c.total)), tono: 'ok' })) },
  };
  FICHAS.paquete = i => {
    const [t, n, e, k] = D.PAQUETE[+i]; const P = PIEZA[k] || { ir: '', txt: '', filas: () => [] }; const filas = P.filas();
    const mod = P.ir.split('/')[0];
    return { titulo: t, sub: 'Paquete de septiembre · ' + esc(n), mod: 'fiscal', tags: [[e === 'ok' ? 'Listo' : 'Falta', e === 'ok' ? 'ok' : 'aviso']],
      bloques: [{ html: `<p>${esc(P.txt)}</p>` },
        filas.length ? { titulo: P.lista || 'Qué trae', html: `<ul class="lista">${filas.map(f => `<li><button class="fila" data-abrir="${f.abrir}"><span class="lead ${f.tono}">${ic(f.tono === 'ok' ? 'check' : 'reloj')}</span><span class="medio"><b>${esc(f.t)}</b><small>${esc(f.s)}</small></span>${ic('derecha', 's chev')}</button></li>`).join('')}</ul>` } : { oculto: true },
        { html: '<p class="muted">Va dentro del paquete del mes. Descargarlo pide tu código y queda anotado.</p>' }],
      acciones: mod && puede(mod) ? [{ txt: 'Verlo en su sección', acc: 'ir-a', arg: P.ir, icono: 'derecha' }] : [] };
  };
  ACC['bajar-paquete'] = () => A.pedirCodigo({ que: 'Descargar el paquete fiscal de septiembre', det: 'Queda anotado en el registro de accesos.', boton: 'Descargar' }).then(() => { D.ACCESOS.unshift({ cuando: 'Hoy ' + D.HOY.hora, quien: S.usuario.nombre, que: 'Descargó el paquete fiscal de septiembre (con código)', donde: 'Este equipo' }); A.aviso('Descarga lista y anotada en el registro de accesos. (Simulado)'); }).catch(() => {});

  /* ---------- 9. preguntas para Cecilia ---------- */
  // las urgentes se nombran arriba sin cambiar el orden: los números se citan en otras pantallas
  const notaUrgentes = () => {
    const urg = D.PREGUNTAS.map((q, i) => ({ q, n: i + 1 })).filter(x => x.q.urgente && x.q.estado === 'abierta');
    return urg.length ? `<p class="nota aviso">${ic('alerta', 's')}<span><b>${urg.length === 1 ? 'Una no puede esperar' : urg.length + ' no pueden esperar'}:</b> ${urg.map(x => `la ${x.n} (${esc(x.q.corto || '')}${x.q.urgente !== 'Urgente' ? ', ' + esc(x.q.urgente.toLowerCase()) : ''})`).join(' y ')}.</span></p>` : '';
  };
  const tagsPregunta = q => (q.urgente && q.estado === 'abierta' ? tag(q.urgente, 'aviso') : '') + A.estadoTag(q.estado);
  const guardadoTxt = q => q.guardada ? `${ic('check', 'xs')}<span>Guardado ${esc(q.guardada)}</span>` : '<span>Se guarda sola al salir del cuadro.</span>';
  function preguntas() {
    const puedeResp = S.usuario.rol === 'fiscal_externo' || S.usuario.rol === 'dueno';
    return `<p class="desc">Antes de construir lo fiscal hacen falta estas respuestas. ${aCecilia('Las contestas', 'La contadora las contesta')} aquí mismo y Alejandro las ve al instante.</p>
      <div id="q-urgentes">${notaUrgentes()}</div>
      <ul class="lista">${D.PREGUNTAS.map((q, i) => `<li style="padding:14px;display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><b>${i + 1}. ${esc(q.texto)}</b><span class="fila-tags" id="qt-${q.id}">${tagsPregunta(q)}</span></div>
        ${puedeResp ? `<label class="campo" for="q-${q.id}"><span class="sr-only">Respuesta a la pregunta ${i + 1}</span><textarea id="q-${q.id}" data-pregunta="${q.id}" placeholder="Escribe tu respuesta" aria-describedby="qg-${q.id}">${esc(q.resp)}</textarea></label><p class="guardado" id="qg-${q.id}" aria-live="polite">${guardadoTxt(q)}</p>` : (q.resp ? `<p class="muted">${esc(q.resp)}</p>` : '<p class="muted">Sin respuesta todavía.</p>')}
      </li>`).join('')}</ul>`;
  }
  // cada respuesta se guarda sola al salir de su cuadro, sin volver a dibujar la página: las que se están escribiendo no se pierden
  // una respuesta que tenía texto y quedó vacía no se borra sola: al lado del cuadro pregunta «¿Borrar tu respuesta?» (Borrar · Dejarla)
  // el registro de cambios guarda el texto completo (se acorta solo al mostrarlo en la tabla)
  function guardarRespuesta(ta, { borrar = false } = {}) {
    const q = D.PREGUNTAS.find(x => x.id === ta.dataset.pregunta); if (!q) return;
    const v = ta.value.trim(); const antes = (q.resp || '').trim(); const g = $('#qg-' + q.id);
    if (v === antes) { if (g && g.dataset.borrar) { delete g.dataset.borrar; g.innerHTML = guardadoTxt(q); } return; }
    if (!v && antes && !borrar) {
      if (g) { g.dataset.borrar = '1'; g.innerHTML = `${ic('alerta', 'xs')}<span>¿Borrar tu respuesta?</span><button class="enlace" type="button" data-acc="q-borrar" data-arg="${q.id}">Borrar</button><button class="enlace" type="button" data-acc="q-dejar" data-arg="${q.id}">Dejarla</button>`; }
      return;
    }
    q.resp = v; q.estado = v ? 'respondida' : 'abierta'; q.guardada = D.HOY.hora;
    A.auditar({ modulo: 'Fiscal', registro: 'Pregunta ' + q.id.slice(1), campo: 'respuesta', antes: antes || '—', despues: v || '—' });
    const t = $('#qt-' + q.id); if (t) t.innerHTML = tagsPregunta(q);
    if (g) { delete g.dataset.borrar; g.innerHTML = guardadoTxt(q); }
    const u = $('#q-urgentes'); if (u) u.innerHTML = notaUrgentes();
    const n = D.PREGUNTAS.filter(x => x.estado === 'abierta').length; const sn = document.querySelector('#main .subnav [data-sub="preguntas"]');
    if (sn) { let c = sn.querySelector('.cuenta'); if (n) { if (!c) { c = document.createElement('span'); c.className = 'cuenta gris'; sn.appendChild(c); } c.textContent = n; } else if (c) c.remove(); }
  }
  // «Borrar» la deja vacía (vuelve a «Abierta») · «Dejarla» devuelve el texto al cuadro, completo, y el teclado vuelve ahí
  ACC['q-borrar'] = id => { const ta = $('#q-' + id); if (!ta) return; ta.value = ''; guardarRespuesta(ta, { borrar: true }); const g = $('#qg-' + id); if (g) g.innerHTML = `${ic('check', 'xs')}<span>Respuesta borrada ${esc(D.HOY.hora)}</span>`; ta.focus(); };
  ACC['q-dejar'] = id => { const q = D.PREGUNTAS.find(x => x.id === id); const ta = $('#q-' + id); if (!q || !ta) return; ta.value = q.resp || ''; const g = $('#qg-' + id); if (g) { delete g.dataset.borrar; g.innerHTML = guardadoTxt(q); } ta.focus(); };

  /* ---------- 10. configuración fiscal ---------- */
  // [nombre, ente, frecuencia, cómo vence, responsable, días de aviso (0 = inactiva)]
  const OBL_CONF = [
    ['IVA + anticipo + IGTF + ret. IVA', 'SENIAT', 'Quincenal', 'Calendario SPE, dígito 4', 'Cecilia', 5],
    ['Retenciones de ISLR', 'SENIAT', 'Mensual', 'Calendario SPE', 'Cecilia', 5],
    ['ISLR anual', 'SENIAT', 'Anual', 'Marzo, según el calendario SPE (en 2026 fue el 11)', 'Cecilia', 15],
    ['Pensiones (9 %)', 'SENIAT', 'Mensual', 'Calendario de pensiones', 'Jose', 5],
    ['IVSS y paro forzoso', 'IVSS', 'Mensual', 'Día fijo', 'Jose', 3],
    ['FAOV', 'BANAVIH', 'Mensual', 'Día fijo', 'Jose', 3],
    ['INCES', 'INCES', 'Trimestral', '5 días hábiles tras el trimestre', 'Jose', 5],
    ['INCES 0,5 % de las utilidades', 'INCES', 'Al pagar las utilidades', '10 días después de pagarlas (en diciembre)', 'Jose', 5],
    ['Declaración trimestral RNET', 'Ministerio del Trabajo', 'Trimestral', '15 días después del trimestre', 'Jose', 5],
    ['Patente', 'Alcaldía', 'Mensual', 'Primeros 20 días', 'Cecilia', 5],
    ['Definitiva de la patente', 'Alcaldía', 'Anual', 'Primeros 20 días de enero', 'Cecilia', 15],
    ['Aseo urbano', 'Alcaldía (IMA)', 'Mensual', 'Día fijo, antes de fin de mes', 'Jose', 5],
    ['LOCTI', 'SIDCAI', 'Mensual', 'No inscritos · gracia hasta abr 2027', '—', 30],
    ['Deporte (1 %)', 'IND', 'Anual', 'Omitida por decisión', '—', 0],
    ['Publicidad (aviso del toldo)', 'Alcaldía', 'Mensual', 'Cada mes, o el año entero antes del 31 mar con 15 % de rebaja', 'Cecilia', 5],
    ['Grandes Patrimonios', 'SENIAT', 'Anual · 2 fechas', '14 oct y 12 nov (RIF 1 y 4) · ¿declaración en cero? Por confirmar con Cecilia', 'Cecilia', 5],
    ['Asamblea con comisario', 'Registro Mercantil', 'Anual', 'Marzo (3 meses después del cierre)', 'Alejandro', 30],
    ['Estados financieros trimestrales', 'Para los socios', 'Trimestral', 'Al cerrar cada trimestre', 'Cecilia', 10],
  ];
  function config() {
    const filasObl = OBL_CONF;
    return `<div class="rejilla"><div class="c8 pila"><div class="sec"><h2>Obligaciones</h2>${A.boton('fiscal', 'Cargar el calendario 2027', 'data-acc="pronto"', { tono: 'sec', icono: 'calendario', chico: true })}</div>
        ${A.tabla({ cols: [{ t: 'Obligación', cls: 'p' }, { t: 'Frecuencia', cls: 'x' }, { t: 'Cómo vence', cls: 'x' }, { t: 'Responsable', cls: 'r' }, { t: 'Aviso', cls: 'e' }], filas: filasObl.map(f => ({ abrir: 'oblconf:' + f[0], celdas: [`<b>${esc(f[0])}</b><small>${esc(f[1])}</small>`, esc(f[2]), esc(f[3].replace('Por confirmar con Cecilia', conCecilia())), esc(f[4]), f[5] ? f[5] + ' días antes' : tag('Inactiva', '')] })) })}
        <p class="muted">Cada diciembre el SENIAT publica el calendario del año siguiente. Se carga una vez y la app arma todos los vencimientos.</p></div>
      <div class="c4 pila"><article class="hoja"><h2>Alícuotas</h2><dl class="kv">${D.PARAMS.alicuotas.map(a => `<div><dt>${esc(a[0])}</dt><dd>${esc(a[1])}</dd></div>`).join('')}</dl></article>
        <article class="hoja"><h2>Numeración</h2><dl class="kv"><div><dt>Retenciones de IVA</dt><dd class="mono">202609-00000041</dd></div><div><dt>Retenciones de ISLR</dt><dd class="mono">ISLR-2026-09-012</dd></div></dl><p class="muted">${aCecilia('Arranca en el número que usas hoy.', 'Arranca en el número que usa hoy Cecilia.')} Nunca deja huecos.</p></article>
        <article class="hoja"><h2>Períodos cerrados</h2><dl class="kv"><div><dt>Agosto</dt><dd>${tag('Bloqueado', '')}</dd></div><div><dt>1.ª quincena de septiembre</dt><dd>${tag('Declarado', 'info')}</dd></div><div><dt>2.ª quincena de septiembre</dt><dd>${tag('Abierto', 'aviso')}</dd></div></dl></article></div></div>`;
  }
  FICHAS.oblconf = nombre => {
    const f = OBL_CONF.find(x => x[0] === nombre) || [nombre, '', '—', '—', 'Cecilia', 5];
    return { titulo: nombre, sub: 'Configuración fiscal' + (f[1] ? ' · ' + esc(f[1]) : ''), mod: 'fiscal', obj: { resp: f[4], dias: f[5] }, registro: 'Obligación ' + nombre,
      bloques: [{ filas: [{ l: 'Frecuencia', v: esc(f[2]) }, { l: 'Cómo vence', v: esc(f[3].replace('Por confirmar con Cecilia', conCecilia())), largo: true }, { l: 'Responsable', v: f[4] === '—' ? 'Sin responsable' : esc(f[4]), campo: { k: 'resp', tipo: 'select', opciones: [['—', 'Sin responsable'], 'Cecilia', 'Jose', 'Alejandro'] } }, { l: 'Avisar con (días)', v: f[5] ? f[5] + ' días antes' : 'No avisa', campo: { k: 'dias', tipo: 'numero', entero: true } }, { l: 'Activa', v: f[5] ? 'Sí' : 'No' }] }],
      alGuardar: cambios => cambios.forEach(c => { if (c.r.campo.k === 'resp') f[4] = c.nuevo; if (c.r.campo.k === 'dias') f[5] = c.nuevo; }) };
  };

  /* ---------- la pantalla ---------- */
  PANT.fiscal = {
    titulo: 'Fiscal', grupo: 'Fiscal', icono: 'fiscal', mod: 'fiscal', palabras: 'seniat impuestos alcaldia declaracion',
    // los nombres largos van en el buscador («Fiscal › Permisos y máquina»); en la computadora las pestañas usan los cortos
    secciones: () => [['vence', 'Lo que vence', 'vencimientos calendario'], ['iva', 'Hoja de IVA', 'iva declaracion planilla'], ['z', 'Reportes Z y ventas', 'z maquina fiscal libro de ventas'], ['compras', 'Libro de compras', 'credito fiscal'],
      ['retenciones', 'Retenciones', 'retencion comprobante islr'], ['parafiscales', 'Nómina, IGTF y patente', 'ivss faov inces pensiones igtf patente parafiscales'], ['permisos', 'Permisos y máquina', 'licencia bomberos sanidad maquina fiscal'],
      ['paquete', 'Paquete del mes', 'paquete'], ['preguntas', aCecilia('Tus preguntas', 'Preguntas para la contadora'), 'preguntas contadora'], ['config', 'Configuración', 'configuracion obligaciones alicuotas numeracion']],
    cuenta: () => D.OBLIGACIONES.filter(o => o.faltan >= 0 && o.faltan <= 1 && o.estado !== 'pagada').length + 1,
    render: (sub = 'vence') => {
      const cuerpo = { vence, iva: hojaIva, z: zetas, compras, retenciones, parafiscales, permisos, paquete, preguntas, config }[sub]();
      // Configuración no es una pestaña más: es un botón con engranaje en la cabecera (así las pestañas caben a 1366 px)
      const conf = `<button class="btn sec chico" data-sub="config" aria-current="${sub === 'config'}">${ic('engranaje', 's')}Configuración</button>`;
      return `<div class="pagina">${A.cab('SENIAT, Alcaldía y parafiscales', 'Fiscal', aCecilia('Aquí llenas lo fiscal y lo dejas listo para declarar.', 'Aquí la contadora llena lo fiscal y lo deja listo para declarar.') + ' Cada cifra se abre para ver de dónde sale.', (esCecilia() ? tag('Trabajas como contadora externa', 'info') : '') + conf)}
        ${A.lectura('fiscal')}
        ${A.subnav([['vence', 'Lo que vence', 2], ['iva', 'Hoja de IVA', 0, false, 'IVA'], ['z', 'Reportes Z y ventas', 2, false, 'Z y ventas'], ['compras', 'Libro de compras', 0, false, 'Compras'], ['retenciones', 'Retenciones'], ['parafiscales', 'Nómina, IGTF y patente'], ['permisos', 'Permisos y máquina', 2, false, 'Permisos'], ['paquete', 'Paquete del mes', 0, false, 'Paquete'], ['preguntas', aCecilia('Tus preguntas', 'Preguntas para la contadora'), D.PREGUNTAS.filter(q => q.estado === 'abierta').length, true, aCecilia('Tus preguntas', 'Preguntas')]], sub)}
        ${cuerpo}</div>`;
    },
    montar: raiz => {
      const cr = $('#iva-credito', raiz);
      if (cr && !cr.readOnly) cr.addEventListener('change', () => { const n = leerNum(cr.value); if (n === null) return; const antes = F.credito; F.credito = n; A.auditar({ modulo: 'Fiscal', registro: 'Hoja de IVA 2.ª quinc. sep', campo: 'crédito de compras', antes: dinero(antes, 'bs'), despues: dinero(n, 'bs') }); syncIva(); A.pintarPagina(); A.aviso('Crédito actualizado. El resultado se recalculó.'); });
      $$('[data-desc]', raiz).forEach(ch => ch.addEventListener('change', () => { F.descontar[ch.dataset.desc] = ch.checked; syncIva(); A.pintarPagina(); }));
      $$('[data-pregunta]', raiz).forEach(ta => ta.addEventListener('change', () => guardarRespuesta(ta)));
    },
  };
})();
