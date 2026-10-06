/* Dinero que entra y que sale: Caja del día, Clientes, Pagos de los lunes, Proveedores. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, $, $$, esc, fmt, dinero, leerNum, ic, tag, puede } = A;
  const prov = id => D.PROVEEDORES.find(p => p.id === id) || {};
  // de dónde salió cada pago: las cuentas del negocio, más lo que pasó por la cuenta de un socio o lo que puso un socio (aportes y préstamos)
  const CTAS = { BVCA: 'Venezolano · Alejandro', BVCE: 'Venezolano · Eliana', BVCJ: 'Venezolano · la empresa', BNC: 'BNC · Alejandro', BOV: 'Bóveda (efectivo $)', BIN: 'Binance (USDT)', SOCIO: 'Pasó por la cuenta de un socio', APORTE: 'Aporte o préstamo de un socio' };
  const DE_SOCIO = ['SOCIO', 'APORTE'];
  const resDe = c => c === 'BOV' || c === 'BIN' ? 'var(--res-efe)' : DE_SOCIO.includes(c) ? 'var(--hoja-3)' : 'var(--res-' + c.toLowerCase() + ')'; // el resaltador de cada cuenta
  const acct = c => c && c !== '—' ? `<span class="acct" data-c="${c}">${c}</span>` : '—';
  const r2 = n => Math.round(n * 100) / 100;
  // cuentas de cada proveedor (29 ago): puede tener varias, cada una con su titular, que es el nombre que sale en el banco
  const etiq = c => c.banco + ' ' + c.num;
  const activas = p => (p.cuentas || []).filter(c => !c.baja);
  const cuentaDe = r => { const p = prov(r.p); return (p.cuentas || []).find(c => etiq(c) === r.cta) || activas(p)[0] || null; };
  const bloq = r => !!(cuentaDe(r) || {}).nueva; // la cuenta a la que se le paga está por verificar
  const deudaDe = id => r2(D.FACTURAS.filter(f => f.prov === id && f.saldo > 0).reduce((s, f) => s + f.saldo, 0));
  const titularTxt = c => 'a nombre de ' + esc(c.titular) + (c.nota ? ' (' + esc(c.nota) + ')' : '');
  // las retenciones de una factura (IVA en «ret», ISLR en «retIslr»): se le pagan al SENIAT y bajan lo que se le paga al proveedor
  const retsDe = f => r2((f.ret ? f.ret.usd : 0) + (f.retIslr ? f.retIslr.usd : 0));
  // el lote de hoy: al enviarlo, sus facturas quedan pagadas con «pago» (lote, cuenta y lo que debían antes de pagarse)
  const LOTE = '5 oct';
  const saldoDelLote = f => f.pago && f.pago.lote === LOTE ? f.pago.antes : f.saldo;
  const facturasDe = r => D.FACTURAS.filter(f => f.prov === r.p && (f.estado !== 'pagada' || (f.pago && f.pago.lote === LOTE)));
  // de dónde salió un pago, dicho en palabras (para el historial de la factura)
  const desdeTxt = p => p.cta === 'BOV' ? 'en efectivo de la bóveda' : p.cta === 'BIN' ? 'desde Binance' : p.cta === 'SOCIO' ? 'por la cuenta de ' + (p.socio || 'un socio') : p.cta === 'APORTE' ? 'con plata de ' + (p.socio || 'un socio') + ' (aporte o préstamo)' : 'desde ' + p.cta;
  // una línea pagada por un socio tiene que decir cuál, o no se aprueba
  const faltaSocio = l => DE_SOCIO.includes(l.c) && !l.socio;

  /* =============== CAJA DEL DÍA =============== */
  // la referencia: Jose busca y cruza los pagos por ella · '¿?' = el bot no la pudo leer · '—' = no es un pago
  // el Zelle no trae número: lo que se ve es quién pagó («de M. Pérez»), sin botón de copiar · la orden de Binance se ve cortada
  // («Orden 4402…118») y se copia entera, solo el número
  const sinRef = c => c.ref === '—' || c.ref === '¿?';
  const esZelle = c => c.tipo === 'Zelle';
  const esOrden = c => c.tipo === 'USDT';
  const refVista = c => esOrden(c) ? 'Orden ' + c.ref.slice(0, 4) + '…' + c.ref.slice(-3) : c.ref;
  const conCopiar = (c, grande = false) => `<span class="ref"><span class="mono">${esc(refVista(c))}</span><button class="copiar${grande ? ' grande' : ''}" data-acc="copiar-ref" data-arg="${esc(c.ref)}" aria-label="${esOrden(c) ? 'Copiar el número de orden completo' : 'Copiar la referencia ' + esc(c.ref)}" title="${esOrden(c) ? 'Copiar el número de orden' : 'Copiar la referencia'}">${ic('copiar', 's')}</button></span>`;
  const refCelda = c => sinRef(c) ? `<span class="tenue">${c.ref === '¿?' ? 'No se leyó' : '—'}</span>` : esZelle(c) ? 'de ' + esc(c.ref) : conCopiar(c);
  // en el teléfono no cabe la columna: los últimos 6 dígitos van en la línea chica, para que al buscar se vea por qué salió el pago
  const refCorta = c => sinRef(c) ? '' : esZelle(c) ? 'de ' + esc(c.ref) : esOrden(c) ? `orden <span class="mono">…${c.ref.slice(-6)}</span>` : /^\d{7,}$/.test(c.ref) ? `ref. <span class="mono">…${c.ref.slice(-6)}</span>` : /^\d+$/.test(c.ref) ? `ref. <span class="mono">${c.ref}</span>` : esc(c.ref.charAt(0).toLowerCase() + c.ref.slice(1));
  // quién lo cerró: el bot o la persona que reaccionó ✅; mientras está por confirmar o avisado, nadie
  const cerrado = c => c.estado === 'confirmado' || c.estado === 'descartado';
  const cerroCelda = c => cerrado(c) ? esc(c.cerro.replace(/\s*\(.*\)$/, '')) + (c.doble ? ' · ' + tag('Doble check', 'ok') : '') : '<span class="tenue" aria-hidden="true">—</span><span class="sr-only">Todavía nadie</span>';
  // la misma manera de copiar que en Reservas: si el navegador no deja, la referencia queda seleccionada (entera) para copiarla a mano
  ACC['copiar-ref'] = (ref, btn) => { const el = btn && btn.closest('.ref') ? btn.closest('.ref').querySelector('.mono') : null; A.copiar(ref, { el, completo: true, ok: (/^\d{15,}$/.test(ref) ? 'Número de orden ' : 'Referencia ') + ref + ' copiada.' }); };
  PANT.caja = {
    titulo: 'Caja del día', corto: 'Caja del día', tab: 'Caja', grupo: 'Dinero que entra', icono: 'caja', mod: 'caja', palabras: 'cobros cobro pago movil zelle binance captura',
    cuenta: () => D.CAJA.filter(c => c.estado === 'por_confirmar').length,
    render: () => {
      const f = A.filtroActual('todos');
      const cuenta = e => D.CAJA.filter(c => c.estado === e).length;
      const bs = D.CAJA.filter(c => c.mon === 'bs' && c.estado === 'confirmado').reduce((s, c) => s + c.monto, 0);
      const usd = D.CAJA.filter(c => c.mon === 'usd' && c.estado === 'confirmado').reduce((s, c) => s + c.monto, 0);
      const usdt = D.CAJA.filter(c => c.mon === 'usdt' && c.estado === 'confirmado').reduce((s, c) => s + c.monto, 0);
      const filas = D.CAJA.filter(c => f === 'todos' || c.estado === f);
      return `<div class="pagina">
        ${A.cab(D.HOY.largo, 'Caja del día', 'Cada pago de un cliente con su captura, lo que leyó el bot y quién lo cerró.', `<label class="campo" for="caja-dia" style="flex-direction:row;align-items:center;gap:8px"><span>Día</span><select id="caja-dia" data-acc="caja-dia"><option>Hoy, lun 5 oct</option><option>Dom 4 oct</option><option>Sáb 3 oct</option><option>Vie 2 oct</option></select></label>`)}
        <p class="nota info">${ic('ojo', 's')}<span><b>Por ahora es para ver.</b> Los pagos se siguen confirmando en el grupo de WhatsApp con ✅ sobre la foto, como siempre. La app lo marca sola.</span></p>
        <div class="cifras">
          ${A.cifra({ etq: 'Cobros confirmados en Bs', valor: dinero(bs, 'bs', 0), sub: '≈ ' + dinero(bs / D.TASA.usd, 'usd', 0) + ' · es lo que dicen las capturas, no el saldo del banco', abrir: 'cajatotal:bs' })}
          ${A.cifra({ etq: 'Zelle', valor: dinero(usd, 'usd'), sub: D.CAJA.filter(c => c.mon === 'usd').length + ' pagos', abrir: 'cajatotal:usd' })}
          ${A.cifra({ etq: 'Binance', valor: dinero(usdt, 'usdt'), sub: '1 pago', abrir: 'cajatotal:usdt' })}
          ${A.cifra({ etq: 'Por confirmar', valor: cuenta('por_confirmar'), sub: 'tócalo para ver solo esos', tono: cuenta('por_confirmar') ? 'aviso' : '', acc: 'filtro', arg: 'por_confirmar' })}
        </div>
        ${A.filtros('t-caja', [['todos', 'Todos', D.CAJA.length], ['por_confirmar', 'Por confirmar', cuenta('por_confirmar')], ['avisado', 'Avisado', cuenta('avisado')], ['confirmado', 'Confirmado', cuenta('confirmado')], ['descartado', 'Descartado', cuenta('descartado')]], f, 'Buscar por monto o referencia')}
        ${A.tabla({ id: 't-caja', cols: [{ t: 'Pago', cls: 'p' }, { t: 'Referencia', cls: 'x' }, { t: 'Lo cerró', cls: 'x' }, { t: 'Cuenta', cls: 'x' }, { t: 'Monto', cls: 'r plata' }, { t: 'Estado', cls: 'e' }],
          filas: filas.map(c => ({ abrir: 'pago:' + c.id, txt: c.ref + ' ' + c.monto, celdas: [`<b>${esc(c.banco)} · ${esc(c.tipo)}</b><small>${esc(c.hora)} · ${esc(c.cajera)}${refCorta(c) ? `<span class="en-tel"> · ${refCorta(c)}</span>` : ''}${c.motivo ? ' · ' + esc(c.motivo) : ''}</small>`, refCelda(c), cerroCelda(c), acct(c.destino), c.monto ? dinero(c.monto, c.mon) : '—', A.estadoTag(c.estado)] })) })}
      </div>`;
    },
  };
  ACC['caja-dia'] = () => {};
  document.addEventListener('change', e => { if (e.target.id === 'caja-dia' && e.target.selectedIndex) { A.aviso('En el prototipo solo está dibujado el día de hoy.', 'info'); e.target.selectedIndex = 0; } });
  FICHAS.cajatotal = mon => {
    const filas = D.CAJA.filter(c => c.mon === mon && c.estado === 'confirmado');
    return { titulo: { bs: 'Cobros confirmados en bolívares', usd: 'Zelle de hoy', usdt: 'Binance de hoy' }[mon], sub: 'Caja del día', mod: 'caja',
      bloques: [{ filas: filas.map(c => ({ l: c.hora + ' · ' + c.banco, v: dinero(c.monto, c.mon) })) }, { html: '<p class="muted">Es la suma de las capturas confirmadas. El saldo real de cada cuenta se ve en Bancos, y cuadra con la conciliación del mes.</p>' }] };
  };
  FICHAS.pago = id => {
    const c = D.CAJA.find(x => x.id === id);
    const tl = [[c.hora, 'La cajera mandó la foto al grupo Caja.']];
    if (c.estado === 'confirmado') tl.push([c.hora, c.fuente.includes('Jose') ? 'Jose reaccionó ✅ sobre la foto en el grupo.' : 'El bot lo confirmó: ' + esc(c.fuente.toLowerCase()) + '.', 'ok']);
    if (c.doble) tl.push([c.hora, 'Doble check de Jose en su revisión diaria.', 'ok']);
    if (c.estado === 'por_confirmar') { tl.push([c.hora, 'El bot respondió: «Verifiquen antes de despachar».', 'aviso']); tl.push(['Ahora', esc(c.motivo) + '. Falta que Jose o Alejandro lo confirmen en el grupo.', 'info']); }
    if (c.estado === 'avisado') tl.push(['+20 min', esc(c.motivo) + '.', 'alerta']);
    if (c.estado === 'descartado') tl.push([c.hora, esc(c.motivo) + '. No se respondió nada en el grupo.']);
    return {
      titulo: c.monto ? dinero(c.monto, c.mon) : 'Foto descartada', sub: `Pago de las ${esc(c.hora)} · ${esc(c.banco)}`, mod: 'caja', obj: c, tags: [[{ confirmado: 'Confirmado', por_confirmar: 'Por confirmar', avisado: 'Avisado: no cayó', descartado: 'Descartado' }[c.estado], { confirmado: 'ok', por_confirmar: 'aviso', avisado: 'alerta', descartado: '' }[c.estado]]],
      bloques: [
        { html: `<figure class="captura"><div class="recibo"><span class="aro ${c.estado === 'confirmado' ? 'ok' : ''}">${ic(c.estado === 'confirmado' ? 'check' : 'reloj')}</span><strong>${esc(c.tipo)} ${c.estado === 'confirmado' ? 'exitoso' : c.motivo.includes('proceso') ? 'en proceso' : ''}</strong><span class="grande">${c.monto ? dinero(c.monto, c.mon) : '—'}</span><span class="mono muted">${esZelle(c) ? 'De ' + esc(c.ref) : esc(esOrden(c) ? refVista(c) : 'Ref. ' + c.ref)}</span><span class="mono muted">05/10/2026 ${esc(c.hora)}</span></div><figcaption class="muted">Captura simulada · la mandó ${esc(c.cajera)}</figcaption></figure>` },
        { titulo: 'Lo que leyó el bot', filas: [{ l: 'Banco que paga', v: esc(c.banco) }, { l: 'Monto', v: c.monto ? dinero(c.monto, c.mon) : '—' }, esZelle(c) ? { l: 'Quién pagó', v: esc(c.ref) + ' <small class="tenue">el correo del Zelle no trae número</small>' } : { l: esOrden(c) ? 'Número de orden' : 'Referencia', v: sinRef(c) ? (c.ref === '¿?' ? 'No se leyó' : '—') : conCopiar(c, true) }, { l: 'Cuenta que recibe', v: acct(c.destino) + (c.destino !== '—' ? ' ' + tag('Coincide', 'ok') : '') }, { l: 'Cómo se confirmó', v: c.estado === 'confirmado' ? esc(c.fuente) : c.estado === 'descartado' ? 'No se confirmó: no era un pago' : 'Todavía no se confirma' }, { l: 'Lo cerró', v: cerrado(c) ? esc(c.cerro) : 'Todavía nadie' }] },
        { titulo: 'Qué pasó', tiempo: tl },
      ],
      aviso: c.estado === 'por_confirmar' ? `<p class="nota aviso">${ic('alerta', 's')}<span>Para confirmarlo, reacciona ✅ sobre la foto en el grupo Caja. Por ahora la app solo muestra; se confirma en el grupo.</span></p>` : '',
    };
  };

  /* =============== CLIENTES Y COBRANZA =============== */
  // lo que consumen los clientes va a precio de carta, en euros: su deuda va en esa moneda (mon) y el límite de crédito, en dólares
  const monCli = c => c.mon || 'eur';
  const enUsd = (m, mon) => mon === 'usd' ? m : m * D.TASA[mon] / D.TASA.usd; // a dólares con las tasas BCV de hoy, para compararlo con el límite
  PANT.clientes = {
    titulo: 'Clientes y cobranza', corto: 'Clientes y cobranza', grupo: 'Dinero que entra', icono: 'clientes', mod: 'clientes', camino: 'Clientes', palabras: 'cobranza cuentas por cobrar deuda',
    secciones: [['deben', 'Quién nos debe', 'deuda fiado credito abono'], ['empresas', 'Empresas y facturas', 'rif retencion'], ['fieles', 'Clientes fieles', 'cumpleanos campana']],
    render: (sub = 'deben') => {
      const deben = D.CLIENTES.filter(c => c.saldo > 0);
      const total = r2(deben.reduce((s, c) => s + c.saldo, 0)); // todos los cargos van en euros
      const viejos = deben.filter(c => c.antig > 30);
      let cuerpo = '';
      if (sub === 'deben') cuerpo = A.filtros('t-cli', null, null, 'Buscar cliente') + A.tabla({ id: 't-cli', cols: [{ t: 'Cliente', cls: 'p' }, { t: 'Límite', cls: 'r x plata' }, { t: 'Días de atraso', cls: 'x' }, { t: 'Último pago', cls: 'x' }, { t: 'Debe', cls: 'r plata' }, { t: 'Estado', cls: 'e' }],
        filas: D.CLIENTES.map(c => ({ abrir: 'cliente:' + c.id, celdas: [`<b>${esc(c.nombre)}</b><small>${esc(c.tipo)}${c.esp ? ' · contribuyente especial' : ''}</small>`, dinero(c.credito, 'usd', 0), c.saldo ? c.antig + ' días' : '—', esc(c.ultimo), dinero(c.saldo, monCli(c)), c.saldo === 0 ? tag('Al día', 'ok') : c.antig > 60 ? tag('Más de 60 días', 'alerta') : c.antig > 30 ? tag('Más de 30 días', 'aviso') : tag('Al día', '')] })),
        pie: ['Total', '', '', '', dinero(total, 'eur'), ''] }) + `<p class="muted">Lo que deben va en euros, como la carta. El límite va en dólares y se compara a la tasa BCV de hoy.</p>`;
      if (sub === 'empresas') cuerpo = `<p class="nota info">${ic('info', 's')}<span>Las empresas reciben factura con su RIF. Si son contribuyentes especiales nos pagan neto y nos mandan un comprobante de retención: esa plata se recupera en la declaración de IVA.</span></p>` +
        A.tabla({ cols: [{ t: 'Factura', cls: 'p' }, { t: 'Cliente', cls: 'x' }, { t: 'Base (Bs)', cls: 'r x plata' }, { t: 'IVA (Bs)', cls: 'r plata' }, { t: 'Retención', cls: 'e' }], filas: D.VENTAS_EMPRESAS.map(v => ({ abrir: 'ventaemp:' + v.id, celdas: [`<b>N.º ${esc(v.num)}</b><small>${esc(v.fecha)} · ${esc(v.cliente)}</small>`, esc(v.cliente), A.bs(v.base, { tasa: v.tasa }), A.bs(v.iva, { tasa: v.tasa }), tag(v.retencion, v.retencion.startsWith('Esperando') ? 'aviso' : v.retencion.startsWith('Recibido') ? 'ok' : '')] })) });
      if (sub === 'fieles') cuerpo = `<div class="rejilla"><div class="c6 pila"><article class="hoja"><h2>${ic('clientes')}Clientes que dejaron de venir</h2><p class="muted">Venían al menos una vez al mes y llevan más de 45 días sin venir. Solo los que dieron permiso para escribirles.</p>
          <ul class="lista">${D.CLIENTES.filter(c => c.consiente && c.antig > 45).map(c => `<li><button class="fila" data-abrir="cliente:${c.id}"><span class="lead">${ic('usuario')}</span><span class="medio"><b>${esc(c.nombre)}</b><small>Última visita ${esc(c.ultimo)}</small></span>${ic('derecha', 's chev')}</button></li>`).join('')}</ul></article></div>
          <div class="c6 pila"><article class="hoja"><h2>${ic('calendario')}Cumpleaños de octubre</h2><p class="muted">3 clientes con permiso para recibir un mensaje. Las campañas salen del número oficial, nunca del número del bot.</p>${A.boton('clientes', 'Preparar un mensaje', 'data-acc="pronto"', { tono: 'sec', icono: 'mensaje' })}</article>
          <p class="nota gris">${ic('candado', 's')}<span>Más adelante. Solo se escribe a quien dio permiso, y se guarda cuándo y cómo lo dio.</span></p></div></div>`;
      return `<div class="pagina">${A.cab('Cuentas por cobrar', 'Clientes y cobranza', 'Quién nos debe, cuánto y desde cuándo. Lo que consumen va a precio de carta, en euros. Los abonos se aplican a la deuda más vieja.', A.boton('clientes', 'Cobrar un abono', 'data-acc="cobrar"', { icono: 'mas' }))}
        ${A.lectura('clientes')}
        <div class="cifras">
          ${A.cifra({ etq: 'Nos deben', valor: dinero(total, 'eur', 0), sub: '≈ ' + dinero(enUsd(total, 'eur'), 'usd', 0) + ' a la tasa de hoy · ' + deben.length + ' clientes', ir: 'clientes/deben' })}
          ${A.cifra({ etq: 'Más de 30 días', valor: dinero(viejos.reduce((s, c) => s + c.saldo, 0), 'eur', 0), sub: viejos.length + ' clientes · se les recuerda los lunes', tono: 'aviso', ir: 'clientes/deben' })}
          ${(esp => A.cifra({ etq: 'Retenciones que esperamos', valor: esp.length, sub: esp.length ? esc([...new Set(esp.map(v => v.cliente))].join(', ')) + ' · IVA' : 'ninguna: llegaron todas', ir: 'clientes/empresas' }))(D.VENTAS_EMPRESAS.filter(v => v.retencion.startsWith('Esperando')))}
          ${A.cifra({ etq: 'Dejaron de venir', valor: D.CLIENTES.filter(c => c.consiente && c.antig > 45).length, sub: 'con permiso para escribirles', ir: 'clientes/fieles' })}
        </div>
        ${A.subnav([['deben', 'Quién nos debe'], ['empresas', 'Empresas y facturas'], ['fieles', 'Clientes fieles']], sub)}
        ${cuerpo}</div>`;
    },
  };
  FICHAS.cliente = id => {
    const c = D.CLIENTES.find(x => x.id === id); const mon = monCli(c); const usd = r2(enUsd(c.saldo, mon));
    return {
      titulo: c.nombre, sub: esc(c.tipo) + ' · ' + esc(c.rif), mod: 'clientes', obj: c, registro: 'Cliente ' + c.nombre,
      tags: [[c.saldo ? 'Debe ' + dinero(c.saldo, mon) : 'Al día', c.saldo ? (c.antig > 30 ? 'aviso' : '') : 'ok']].concat(c.esp ? [['Contribuyente especial', 'info']] : []),
      bloques: [
        { titulo: 'Crédito', filas: [{ l: 'Debe', v: c.saldo ? `${dinero(c.saldo, mon)} <small class="tenue">≈ ${dinero(usd, 'usd')} a la tasa de hoy</small>` : dinero(0, mon) }, { l: 'Moneda de los cargos', v: mon === 'eur' ? 'Euros, como la carta' : 'Dólares' }, { l: 'Límite de crédito ($)', v: dinero(c.credito, 'usd', 0), campo: { k: 'credito', tipo: 'dinero', mon: 'usd', obligatorio: true } }, { l: 'Días para pagar', v: c.dias + ' días', campo: { k: 'dias', tipo: 'numero', entero: true, obligatorio: true } }, { l: 'Lo autorizó', v: 'Alejandro' }, { l: 'Contacto', v: esc(c.contacto), campo: { k: 'contacto', tipo: 'texto' } }, { l: 'Permiso para escribirle', v: c.consiente ? tag('Sí, dado en caja el 2 ago', 'ok') : tag('No', '') }] },
        { titulo: 'Movimientos', tiempo: c.saldo ? [[c.ultimo, 'Último abono recibido.'], ['Hace ' + c.antig + ' d', 'Consumo a crédito que sigue abierto: ' + dinero(c.saldo, mon) + '.', c.antig > 30 ? 'aviso' : '']] : [[c.ultimo, 'Pagó todo. Sin deuda.', 'ok']] },
        { html: '<p class="muted">Lo que consume va a precio de carta, en euros: un abono en bolívares se convierte con el euro BCV del día. Un límite de más de ' + dinero((D.LIMITES.find(l => l.id === 'l3') || {}).hasta, 'usd', 0) + ' lo aprueba Alejandro. Recordatorio automático los lunes a los que pasan de 15 días, desde el número oficial.</p>' },
      ],
      acciones: c.saldo ? [{ txt: 'Cobrar un abono', acc: 'cobrar', arg: c.id, icono: 'mas', solo: 'editar' }] : [],
      // subir el límite por encima del tope de quien lo cambia (Parámetros › Límites) queda pendiente de Alejandro; bajarlo no
      tope: { limite: 'l3', que: 'Este límite', monto: cambios => { const x = cambios.find(y => y.r.campo.k === 'credito'); return x && x.nuevo > (x.antes || 0) ? x.nuevo : 0; } },
    };
  };
  // el abono baja la deuda en la moneda del cargo (euros): se anota lo que llegó, en Bs o en $, y la tasa BCV de hoy lo convierte
  const METODOS = [['Pago móvil', 'bs'], ['Transferencia', 'bs'], ['Punto de venta', 'bs'], ['Zelle', 'usd'], ['Efectivo $', 'usd']];
  const aMonedaDe = (monto, desde, hacia) => { const bs = desde === 'bs' ? monto : monto * D.TASA[desde]; return hacia === 'bs' ? bs : bs / D.TASA[hacia]; };
  ACC.cobrar = id => {
    if (!puede('clientes', 'editar')) return ACC['sin-permiso']('clientes');
    const c = id ? D.CLIENTES.find(x => x.id === id) : D.CLIENTES.find(x => x.saldo > 0);
    const env = $('#modal-raiz');
    // lo que se propone cobrar: hasta 50 en la moneda del cargo, pasado a lo que llega
    const sugerido = (cl, desde) => r2(aMonedaDe(Math.min(50, cl.saldo), monCli(cl), desde));
    A.modal(`<h2 id="modal-t">Cobrar un abono</h2>
      <label class="campo" for="ab-cli"><span>Cliente</span><select id="ab-cli">${D.CLIENTES.filter(x => x.saldo > 0).map(x => `<option value="${x.id}"${x.id === c.id ? ' selected' : ''}>${esc(x.nombre)} · debe ${dinero(x.saldo, monCli(x))}</option>`).join('')}</select></label>
      <label class="campo" for="ab-met"><span>Cómo pagó</span><select id="ab-met">${METODOS.map(([t, m]) => `<option value="${m}">${t}</option>`).join('')}</select></label>
      <div class="campos"><label class="campo" for="ab-recibido"><span id="ab-rec-t">Bs recibidos</span><input id="ab-recibido" inputmode="decimal" value="${fmt(sugerido(c, 'bs'))}" autocomplete="off"></label>
        <label class="campo" for="ab-tasa"><span>Tasa BCV de hoy</span><input id="ab-tasa" readonly value=""></label></div>
      <p class="chequeo" id="ab-conv"></p>
      <p class="muted">Sus cargos son consumos a precio de carta, en euros. El abono baja la deuda en euros.</p>
      <div class="modal-acc"><button class="btn sec" data-ab="no">Cancelar</button><button class="btn pri" data-ab="si">Registrar el abono</button></div>`, 'teclado');
    const conv = () => {
      const cl = D.CLIENTES.find(x => x.id === $('#ab-cli').value); const mon = monCli(cl);
      const desde = $('#ab-met').value; const n = leerNum($('#ab-recibido').value); const el = $('#ab-conv');
      $('#ab-rec-t').textContent = desde === 'bs' ? 'Bs recibidos' : 'Dólares recibidos';
      $('#ab-tasa').value = desde === 'bs' ? 'Euro · Bs ' + fmt(D.TASA[mon]) : 'Dólar ' + fmt(D.TASA.usd) + ' · euro ' + fmt(D.TASA[mon]);
      // sin monto no se dice nada aquí: al tocar «Registrar el abono», «Escribe el monto» sale debajo de su campo
      if (n === null || n <= 0) { el.className = 'chequeo'; el.innerHTML = ''; return null; }
      const en = r2(aMonedaDe(n, desde, mon));
      const cuenta = desde === 'bs' ? `${dinero(n, 'bs')} ÷ ${fmt(D.TASA[mon])} = ${dinero(en, mon)}` : `${dinero(n, 'usd')} × ${fmt(D.TASA.usd)} = ${dinero(r2(n * D.TASA.usd), 'bs')} ÷ ${fmt(D.TASA[mon])} = ${dinero(en, mon)}`;
      const pasa = en > cl.saldo + 0.005;
      el.className = 'chequeo ' + (pasa ? 'aviso' : 'ok');
      el.innerHTML = ic(pasa ? 'alerta' : 'check', 's') + `<span>${cuenta}. ${pasa ? `Pasa lo que debe (${dinero(cl.saldo, mon)}): revisa el monto.` : `Le ${r2(cl.saldo - en) ? 'quedan ' + dinero(r2(cl.saldo - en), mon) : 'queda todo pagado'}.`}</span>`;
      return pasa ? null : { cl, mon, desde, n, en };
    };
    $('#ab-met').addEventListener('change', () => { const cl = D.CLIENTES.find(x => x.id === $('#ab-cli').value); $('#ab-recibido').value = fmt(sugerido(cl, $('#ab-met').value)); conv(); });
    $('#ab-cli').addEventListener('change', () => { const cl = D.CLIENTES.find(x => x.id === $('#ab-cli').value); $('#ab-recibido').value = fmt(sugerido(cl, $('#ab-met').value)); conv(); });
    $('#ab-recibido').addEventListener('input', conv);
    conv(); $('#ab-recibido').focus();
    env.onclick = e => {
      const b = e.target.closest('[data-ab]'); if (!b) return;
      if (b.dataset.ab === 'no') { A.cerrarModal(); return; }
      const v = conv(); const n = leerNum($('#ab-recibido').value); const cl = D.CLIENTES.find(x => x.id === $('#ab-cli').value);
      if (A.faltan(env, [[!(n > 0), 'ab-recibido', 'Escribe el monto.'], [n > 0 && !v, 'ab-recibido', 'Pasa lo que debe (' + dinero(cl.saldo, monCli(cl)) + '): revisa el monto.']])) return;
      const met = $('#ab-met').selectedOptions[0].textContent.replace(/^(?!Zelle)./, ch => ch.toLowerCase()); // Zelle es nombre propio
      const antes = v.cl.saldo; v.cl.saldo = Math.max(0, r2(v.cl.saldo - v.en)); if (!v.cl.saldo) v.cl.antig = 0; v.cl.ultimo = '5 oct';
      A.auditar({ modulo: 'Clientes', registro: v.cl.nombre, campo: 'saldo', antes: dinero(antes, v.mon), despues: dinero(v.cl.saldo, v.mon), motivo: 'Abono de ' + dinero(v.n, v.desde) + ' por ' + met + ' a la tasa BCV de hoy = ' + dinero(v.en, v.mon) });
      A.cerrarModal(); A.pintarPagina(); if (S.ficha) A.pintarFicha(); A.aviso('Abono de ' + dinero(v.en, v.mon) + ' registrado. Se aplicó a la deuda más vieja.');
    };
  };
  ACC.pronto = () => A.aviso('Esta parte llega más adelante. En el prototipo se ve cómo será, sin funcionar.', 'info');
  FICHAS.ventaemp = id => {
    const v = D.VENTAS_EMPRESAS.find(x => x.id === id);
    return { titulo: 'Factura N.º ' + v.num, sub: esc(v.cliente) + ' · ' + esc(v.fecha), mod: 'clientes', obj: v,
      // en bolívares, con su ≈ $ a la tasa del día de la factura · si ya llegó su comprobante de retención, se abre; si se espera, se registra aquí mismo
      bloques: [{ filas: [{ l: 'Base (Bs)', v: A.bs(v.base, { tasa: v.tasa }) }, { l: 'IVA 16 % (Bs)', v: A.bs(v.iva, { tasa: v.tasa }) }, { l: 'Total (Bs)', v: A.bs(v.base + v.iva, { tasa: v.tasa }) }, { l: 'Contribuyente especial', v: v.esp ? 'Sí: nos retiene el 75 % del IVA' : 'No' },
        { l: 'Comprobante de retención', v: (r => r && puede('fiscal') ? `<button class="enlace" data-abrir="retrec:${r.id}">${esc(v.retencion)}</button>` : esc(v.retencion))(D.RET_RECIBIDAS.find(x => x.factura === v.num && x.tipo === 'IVA')) }] }],
      acciones: v.retencion.startsWith('Esperando') ? [{ txt: 'Registrar su comprobante', acc: 'retrec-nueva', arg: v.id, icono: 'subir', solo: 'editar' }] : [] };
  };
  FICHAS.devcliente = id => {
    const d = D.DEVCLIENTES.find(x => x.id === id);
    return { titulo: 'Devolver ' + dinero(d.monto, 'usd'), sub: 'Devolución a un cliente', mod: 'clientes', obj: d, tags: [[d.estado === 'aprobada' ? 'Aprobada' : 'Por aprobar', d.estado === 'aprobada' ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'A quién', v: esc(d.cliente) + (d.mesa ? ' <small class="tenue">' + esc(d.mesa) + '</small>' : '') }, { l: 'Motivo', v: esc(d.motivo), largo: true }, { l: 'La preparó', v: esc(d.preparo) }, { l: 'Cómo se devuelve', v: 'Pago móvil desde ' + A.cta('BVCA') }] }, { html: '<p class="muted">La aprueba Jose o Alejandro con su código, nunca quien la preparó. Si hubo factura fiscal, se hace la nota de crédito en la máquina fiscal.</p>' }],
      acciones: d.estado === 'por_aprobar' ? [{ txt: 'Aprobar la devolución', acc: 'aprobar-dev', arg: d.id, icono: 'candado', tono: 'pri' }] : [] };
  };
  ACC['aprobar-dev'] = id => {
    const d = D.DEVCLIENTES.find(x => x.id === id);
    if (!(S.usuario.rol === 'dueno' || S.usuario.rol === 'contabilidad')) return A.aviso('La aprueban Jose o Alejandro.', 'info');
    if (d.preparo === S.usuario.nombre) return A.aviso('No puedes aprobar algo que preparaste tú. Lo aprueba otra persona.', 'info');
    A.pedirCodigo({ que: 'Devolución a ' + esc(d.cliente) + ' · ' + dinero(d.monto, 'usd') + ' · pago móvil desde ' + A.cta('BVCA'), det: esc(d.motivo) + ' · la preparó ' + esc(d.preparo), boton: 'Aprobar ' + dinero(d.monto, 'usd') }).then(() => {
      d.estado = 'aprobada'; const p = D.PENDIENTES.find(x => x.abrir === 'devcliente:' + id); if (p) p.hecho = 'Aprobada por ' + S.usuario.nombre;
      A.auditar({ modulo: 'Clientes', registro: 'Devolución ' + dinero(d.monto, 'usd'), campo: 'estado', antes: 'por aprobar', despues: 'aprobada' });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Devolución aprobada.');
    }).catch(() => {});
  };

  /* =============== PAGOS DE LOS LUNES =============== */
  // cada lote (el del lunes y el pago de la nómina) guarda en qué va:
  // · aprobadoEn: lo que firmó quien aprueba: el total, cuántos pagos, el día, la hora, quién, la «firma» del lote y la foto de cada línea
  // · enviadoEn: lo último que le llegó al grupo · porEnviar: lo aprobado que no salió porque se cayó la conexión («Reintentar el envío» no pide otro código)
  // · cambio: el lote reabierto con «Cambiar el lote»: desde qué aprobación, quién, cuándo y por qué · se aprueba solo la diferencia
  // · tachados: los sellos que dejaron de valer: no se borran, quedan tachados en rojo · mensajes: lo que salió (o no salió) al grupo
  // · sinRed: solo en el prototipo, para ver qué pasa si se cae la conexión al enviar
  const nuevoLote = () => ({ menu: null, explica: null, recien: null, aprobado: false, aprobadoEn: null, enviadoEn: null, porEnviar: null, cambio: null, tachados: [], mensajes: [], nota: null, selloRecien: null, sinRed: false });
  // la única duda del lote: Pollos El Granjero aparece dos veces · el traspaso entre cuentas nuestras ya no es una duda: es una nota que no frena nada
  const nuevoLunes = () => Object.assign(nuevoLote(), { dudas: { pollos: false }, pollos: null, dudaPor: '', dudaVieja: null });
  const P = nuevoLunes();
  const total = () => D.LUNES.reduce((s, r) => s + r.m, 0);
  // en qué va un lote: abierto (se prepara) · cambio (se reabrió para cambiarlo) · fallo (aprobado, pero no salió al grupo) · enviado
  const fase = X => X.cambio ? 'cambio' : X.aprobado ? (X.porEnviar ? 'fallo' : 'enviado') : 'abierto';
  // sus líneas se tocan mientras se prepara o mientras se cambia; aprobado (haya salido o no), todo queda con candado
  const editable = X => !!X.cambio || !X.aprobado;
  // la firma es lo que se va a pagar (cada línea marcada, de dónde sale, cuánto, qué socio, la captura y la cuenta del proveedor):
  // si al enviar no coincide con la aprobada, no sale nada al grupo
  const firmaLunes = () => JSON.stringify([D.LUNES.map(r => r.c ? [r.p, r.c, r.m, r.socio || '', r.cap ?? '', r.cta || ''] : [r.p]), P.pollos]);
  const CERRADO = {
    lunes: () => fase(P) === 'enviado' ? 'El lote ya salió al grupo. Para corregirlo, toca «Cambiar el lote»: la corrección también sale al grupo.' : 'El lote está aprobado. Para cambiar algo, toca «Cambiar el lote».',
    nomina: () => fase(PN) === 'enviado' ? 'El pago ya salió al grupo. Para corregirlo, toca «Cambiar el pago»: la corrección también sale al grupo.' : 'El pago está aprobado. Para cambiar algo, toca «Cambiar el pago».',
  };
  ACC['lote-cerrado'] = arg => A.aviso((CERRADO[arg] || CERRADO.lunes)(), 'info');
  // el sello dice el total, el día y la hora: así se ve de un vistazo si lo de abajo ya no es lo aprobado
  const diaHoy = () => D.HOY.iso.slice(8) + ' ' + D.MESES[+D.HOY.iso.slice(5, 7) - 1].toUpperCase();
  // la ventana del código del lote (y de la nómina): qué se aprueba y, en una línea, cuánto sale de cada cuenta con su resaltador
  const sumasPor = (ls, monto) => Object.keys(CTAS).map(k => [k, r2(ls.filter(x => x.c === k).reduce((a, x) => a + monto(x), 0))]).filter(x => x[1]);
  const pagosTxt = n => n + (n === 1 ? ' pago' : ' pagos');
  const selloAprobado = (a, recien) => A.sello('Aprobado · ' + dinero(a.total, 'usd'), { recien, fecha: a.dia + ' ' + a.hora });
  const selloTachado = a => A.sello('Aprobado · ' + dinero(a.total, 'usd'), { fecha: a.dia + ' ' + a.hora, tachado: true });
  const ctaCerrada = (c, cual) => `<button class="cta-btn bloq" data-acc="lote-cerrado" data-arg="${cual}" aria-disabled="true">${ic('candado', 's')}${c ? `<span class="acct" data-c="${c}">${c}</span>` : '<span>Sin elegir</span>'}<span class="sr-only">, con candado: ${cual === 'nomina' ? 'el pago' : 'el lote'} está aprobado</span></button>`;
  const soltarCerrado = cual => { const X = cual === 'nomina' ? PN : P;
    return `<button type="button" class="soltar bloq" data-acc="lote-cerrado" data-arg="${cual}" aria-disabled="true">${ic('candado')}<span><b>Las capturas quedaron cerradas</b>${cual === 'nomina' ? 'El pago' : 'El lote'} ${fase(X) === 'enviado' ? 'ya salió al grupo' : 'está aprobado'}. Para subir otra, toca «${cual === 'nomina' ? 'Cambiar el pago' : 'Cambiar el lote'}».</span></button>`; };
  // la zona punteada para subir las capturas: en la computadora también se arrastran ahí desde una carpeta o desde WhatsApp
  const zonaCapturas = (id, de) => `<label class="soltar" for="${id}">${ic('subir')}<span><b>Sube todas las capturas de una vez</b>La app las lee y las casa con cada ${de}.<span class="solo-raton"> También puedes arrastrarlas aquí desde una carpeta o desde WhatsApp.</span></span></label>
            <input type="file" id="${id}" accept="image/*,application/pdf" multiple class="sr-only">`;
  // cada pago guarda su moneda y su tasa (29 ago): la moneda sale de la cuenta de donde sale el pago
  const BANCO_DE = { BVCA: 'Venezolano', BVCE: 'Venezolano', BVCJ: 'Venezolano', BNC: 'BNC' };
  const monedaDe = c => c === 'BIN' ? 'USDT, a su tasa' : c === 'BOV' ? 'Dólares en efectivo' : c === 'SOCIO' ? 'La de la cuenta del socio' : c === 'APORTE' ? 'La que puso el socio' : 'Bolívares a tasa BCV';
  const enMoneda = (c, m) => c === 'BIN' ? `≈ ${dinero(m * D.TASA.usd / D.TASA.usdt, 'usdt')} a Bs ${fmt(D.TASA.usdt)}` : c === 'BOV' ? 'billetes de la bóveda' : c === 'SOCIO' ? 'es plata del negocio que pasó por la cuenta de un socio: se anota cuál' : c === 'APORTE' ? 'el negocio se lo debe al socio: va a su cuenta de aportes y préstamos' : `≈ ${dinero(m * D.TASA.usd, 'bs')} a Bs ${fmt(D.TASA.usd)}`;
  // lo que dice cada captura: el monto (en $ y en bolívares) y la comisión que cobró el banco
  const capBs = r => r.capBs ?? r2(r.cap * D.TASA.usd);
  // la app lee la comisión de la captura; en el prototipo sale de una regla inventada: 0,3 % entre bancos distintos y nada en el mismo banco
  const comDe = r => { if (r.cap == null || !BANCO_DE[r.c]) return 0; const dest = (cuentaDe(r) || {}).banco; return dest && dest !== BANCO_DE[r.c] ? r2(capBs(r) * 0.003) : 0; };
  const refDe = i => '004' + (1180 + +i);
  const pollos = () => D.LUNES.find(r => r.duda === 'pollos');
  const pendientes = () => Object.values(P.dudas).filter(v => !v).length;
  // capturas leídas: las de cada línea, más las que no casan con una línea (el 2.º intento de Pollos, el traspaso y una línea del estado de cuenta)
  const leidas = q => { const pl = pollos(); return q.con.length + (pl && pl.c ? 1 : 0) + 2; };
  // el cuadre de verdad: la lista menos lo que no se pagó, contra la suma de las capturas
  function cuadre() {
    const tot = r2(total()); const sin = D.LUNES.filter(r => !r.c); const sinM = r2(sin.reduce((s, r) => s + r.m, 0));
    const pag = D.LUNES.filter(r => r.c); const con = pag.filter(r => r.cap != null);
    const pl = pollos(); const doble = P.pollos === 'dos' && pl && pl.c && pl.cap != null ? pl : null; // si fueron dos pagos, el segundo también suma
    const caps = r2(con.reduce((s, r) => s + r.cap, 0) + (doble ? doble.cap : 0)); const lista = r2(tot - sinM);
    return { tot, sin, sinM, lista, caps, con, doble, n: con.length + (doble ? 1 : 0), faltan: pag.filter(r => r.cap == null), distintas: con.filter(r => Math.abs(r.cap - r.m) >= 0.005), dif: r2(caps - lista) };
  }
  const porQue = q => [...q.distintas.map(r => `${esc(prov(r.p).nombre)}: la captura dice ${dinero(r.cap, 'usd')} y la lista ${dinero(r.m, 'usd')}.`), ...q.faltan.map(r => `Falta la captura de ${esc(prov(r.p).nombre)}.`), ...(q.doble ? [`${esc(prov(q.doble.p).nombre)}: fueron dos pagos de ${dinero(q.doble.cap, 'usd')}.`] : [])].join(' ');
  // «Cuadra con las capturas» se vuelve a calcular cada vez: si una línea marcada no tiene su captura, dice cuántas faltan
  const faltanTxt = n => n === 1 ? 'Falta 1 captura' : 'Faltan ' + n + ' capturas';
  const retDeLista = (soloPagadas = false) => D.FACTURAS.filter(f => retsDe(f) && saldoDelLote(f) > 0 && D.LUNES.some(r => r.p === f.prov && (!soloPagadas || r.c)));
  // «sin la retención de IVA (…) a A y B, y sin la de ISLR (…) a C»: la de IVA va en la planilla de IVA y la de ISLR, en la declaración de retenciones de ISLR
  const enLista = arr => arr.join(', ').replace(/, ([^,]*)$/, ' y $1');
  const retTexto = fr => { const iva = fr.filter(f => f.ret), islr = fr.filter(f => f.retIslr); const nom = xs => esc(enLista([...new Set(xs.map(f => prov(f.prov).nombre))]));
    return [iva.length ? `la retención de IVA (${dinero(r2(iva.reduce((s, f) => s + f.ret.usd, 0)), 'usd')}) a ${nom(iva)}` : '', islr.length ? `la de ISLR (${dinero(r2(islr.reduce((s, f) => s + f.retIslr.usd, 0)), 'usd')}) a ${nom(islr)}` : ''].filter(Boolean).join(', y sin '); };
  // al enviar el lote, cada línea pagada cierra sus facturas: quedan pagadas, con el lote y la cuenta, y ya no se editan (se corrigen con un reverso)
  // si la captura dice menos que la lista, la diferencia queda como saldo de la última factura de la línea
  function pagarLinea(r) {
    const facts = D.FACTURAS.filter(f => f.prov === r.p && f.saldo > 0);
    let falta = r.cap != null ? Math.max(0, r2(r.m - r.cap)) : 0;
    [...facts].reverse().forEach(f => {
      const queda = Math.min(falta, f.saldo); falta = r2(falta - queda);
      f.pago = { lote: LOTE, cta: r.c, socio: r.socio || '', antes: f.saldo, estadoAntes: f.estado, parcial: queda > 0.005 };
      const antes = A.estadoTag(f.estado).replace(/<[^>]+>/g, '');
      if (queda > 0.005) { f.saldo = r2(queda); if (f.estado !== 'vencida') f.estado = 'parcial'; } else { f.saldo = 0; f.estado = 'pagada'; }
      A.auditar({ modulo: 'Proveedores', registro: 'Factura ' + f.num, campo: 'estado', antes, despues: (f.estado === 'pagada' ? 'pagada' : 'pago parcial: quedan ' + dinero(f.saldo, 'usd')) + ' · lote del ' + LOTE + ' ' + desdeTxt(f.pago) });
    });
    const p = prov(r.p); if (p.estado === 'vencida' && !D.FACTURAS.some(f => f.prov === p.id && f.saldo > 0 && f.estado === 'vencida')) p.estado = 'al_dia';
  }
  const pagarLote = () => D.LUNES.filter(r => r.c).forEach(pagarLinea);
  // una corrección que ya salió deshace el pago de la línea en este lote (sus facturas vuelven a lo que debían) y lo vuelve a hacer con lo nuevo
  function revertirLinea(r) {
    D.FACTURAS.filter(f => f.prov === r.p && f.pago && f.pago.lote === LOTE).forEach(f => {
      const antes = A.estadoTag(f.estado).replace(/<[^>]+>/g, '');
      f.saldo = f.pago.antes; f.estado = f.pago.estadoAntes || 'abierta'; delete f.pago;
      A.auditar({ modulo: 'Proveedores', registro: 'Factura ' + f.num, campo: 'estado', antes, despues: A.estadoTag(f.estado).replace(/<[^>]+>/g, '') + ' · corrección del lote del ' + LOTE });
    });
    const p = prov(r.p); if (D.FACTURAS.some(f => f.prov === p.id && f.saldo > 0 && f.estado === 'vencida')) p.estado = 'vencida';
  }
  const repagar = ixs => (ixs || []).forEach(i => { const r = D.LUNES[i]; if (!r) return; revertirLinea(r); if (r.c) pagarLinea(r); });

  /* ---------- la duda del lote, dentro de su línea ---------- */
  // las dos capturas que leyó la app (la 1.ª es la de la línea; la 2.ª, el otro intento), con la misma referencia que «Capturas del lote»
  const capturasDuda = i => { const r = D.LUNES[i]; const o = r.intento2 || {}; return [{ k: 1, hora: r.hora || '—', ref: refDe(i), monto: r.cap ?? r.m }, { k: 2, hora: o.hora || '—', ref: o.ref || '—', monto: o.monto ?? r.cap ?? r.m }]; };
  const DUDA_TXT = { devuelto: 'el 2.º se devolvió', dos: 'fueron dos pagos' };
  // donde: «linea» (en el teléfono, dentro de su línea) · «lado» (en la computadora, en el panel de al lado) · «ficha» (la ficha de la línea)
  // sin responder trae todo para decidir: las dos capturas (se abren en grande), las facturas de la línea y los dos botones;
  // respondida, en la lista queda la respuesta con «Deshacer» (sirve hasta que se aprueba el lote); la ficha siempre trae las capturas
  function dudaHtml(i, donde) {
    const r = D.LUNES[i]; const pv = prov(r.p); const resp = P.dudas[r.duda]; const ed = puede('pagos', 'editar') && editable(P);
    const caps = capturasDuda(i); const facts = facturasDe(r); const completa = !resp || donde === 'ficha';
    const tarjeta = c => `<button type="button" class="duda-cap" data-pl="ver-cap" data-i="${i}" data-k="${c.k}" aria-label="Captura ${c.k} de ${caps.length}: ${esc(c.hora)}, referencia ${esc(c.ref)}, ${dinero(c.monto, 'usd')}. Verla en grande"><span class="mini-cap" aria-hidden="true"><i></i><i></i><i></i></span><span class="duda-dato"><small>${c.k}.ª · ${esc(c.hora)}</small><span class="mono">${esc(c.ref)}</span><b>${dinero(c.monto, 'usd')}</b></span></button>`;
    const botones = `<div class="btns">${A.boton('pagos', 'El 2.º se devolvió', `data-pl="duda" data-d="${r.duda}" data-v="devuelto" data-r="El banco devolvió el segundo intento. Cuenta una sola vez."`, { tono: 'sec', chico: true })}${A.boton('pagos', 'Fueron dos pagos', `data-pl="duda" data-d="${r.duda}" data-v="dos" data-r="${esc(`Quedan los dos pagos de ${dinero(r.m, 'usd')}: el segundo suma a las capturas y va explicado en la nota.`)}"`, { tono: 'sec', chico: true })}</div>`;
    return `<div class="duda${resp ? ' resuelta' : ''}${donde === 'linea' ? ' duda-linea' : ''}"${donde === 'ficha' ? '' : ' id="duda-pollos"'}${donde === 'linea' ? ' role="cell"' : ''}>
      <p>${resp ? `<b>Duda resuelta:</b> ${esc(pv.nombre)} aparecía dos veces.` : `<b>${donde === 'lado' ? esc(pv.nombre) + ' aparece dos veces.' : 'Aparece dos veces.'}</b> Hay dos capturas iguales. ¿Fueron dos intentos del mismo pago?`}</p>
      ${completa ? `<p class="duda-pista">Lo que leyó la app de cada una (hora, referencia y monto). Tócalas para verlas en grande.</p><div class="duda-caps">${caps.map(tarjeta).join('')}</div>
      <div class="duda-facts"><small>Facturas de esta línea</small><ul>${facts.map(f => `<li><span>N.º ${esc(f.num)}</span><span>${dinero(saldoDelLote(f), 'usd')}</span></li>`).join('')}<li class="suma"><span>Suman</span><span>${dinero(r.m, 'usd')}</span></li></ul></div>` : ''}
      ${resp ? `<p class="duda-resp">${ic('check', 's')}<span>${esc(resp)}${P.dudaPor ? ` <small class="tenue">· ${esc(P.dudaPor)}</small>` : ''}</span></p>${ed ? `<div class="btns">${A.deshacible('duda:' + r.duda) ? `<button class="btn ghost chico" data-pl="duda-deshacer" data-d="${r.duda}" data-ut="duda:${r.duda}">${ic('refrescar', 's')}Deshacer<span aria-hidden="true">· <span class="quedan">${A.quedanUT('duda:' + r.duda)}</span> s</span></button>` : `<button class="btn ghost chico" data-pl="duda-reabrir" data-d="${r.duda}" data-reabrir="duda:${r.duda}">${ic('refrescar', 's')}Reabrir</button>`}</div>` : ''}`
        // reabierta: la respuesta de antes queda tachada, con el motivo, encima de los dos botones
        : (P.dudaVieja ? `<p class="duda-vieja"><s>${esc(DUDA_TXT[P.dudaVieja.v] || P.dudaVieja.v)}</s> <small class="tenue">· reabierta: ${esc(P.dudaVieja.motivo)}</small></p>` : '') + botones}
    </div>`;
  }
  // la captura en grande: lo que se ve en la foto y lo que leyó la app
  function verCaptura(i, k) {
    const r = D.LUNES[i]; const c = capturasDuda(i).find(x => x.k === +k); if (!c) return; const pv = prov(r.p); const cta = cuentaDe(r);
    const env = A.modal(`<h2 id="modal-t">Captura ${c.k} de 2 · ${esc(pv.nombre)}</h2>
      <figure class="captura"><div class="recibo"><span class="aro ok">${ic('check')}</span><strong>Transferencia exitosa</strong><span class="grande">${dinero(c.monto, 'usd')}</span><span class="mono muted">${dinero(r2(c.monto * D.TASA.usd), 'bs')}</span><span class="mono muted">Ref. ${esc(c.ref)}</span><span class="mono muted">05/10/2026 ${esc(c.hora)}</span></div><figcaption class="muted">Captura simulada</figcaption></figure>
      <dl class="kv" id="modal-d"><div><dt>Hora</dt><dd>${esc(c.hora)}</dd></div><div><dt>Referencia</dt><dd class="mono">${esc(c.ref)}</dd></div><div><dt>Monto</dt><dd>${dinero(c.monto, 'usd')}</dd></div><div><dt>Sale de</dt><dd>${acct(r.c)}</dd></div><div><dt>Cuenta que recibe</dt><dd>${cta ? esc(etiq(cta)) : '—'}</dd></div></dl>
      <div class="modal-acc"><button class="btn sec" data-m="no">Cerrar</button></div>`, 'captura-grande');
    env.addEventListener('click', e => { if (e.target === env || e.target.closest('[data-m="no"]')) A.cerrarModal(); });
    const b = env.querySelector('[data-m="no"]'); if (b) b.focus();
  }

  /* ---------- las líneas del lunes ---------- */
  // «Vence hoy» en el teléfono (y en la lista apilada), donde no hay columna «Vence»; con la columna, solo «Hoy»
  const venceHtml = r => r.tarde ? 'Vencida, ' + esc(r.v.toLowerCase()) : `<span class="v-corto">${esc(r.v)}</span><span class="v-largo">Vence ${esc(r.v.toLowerCase())}</span>`;
  const menuCuentas = (attr, i, c) => `<div class="menu" role="menu" aria-label="De qué cuenta salió">${Object.keys(CTAS).map(k => `<button role="menuitem" ${attr}="pick" data-i="${i}" data-c="${k}"><span class="acct" data-c="${k}">${k}</span><small>${CTAS[k]}</small></button>`).join('')}${c ? `<button role="menuitem" class="quitar" ${attr}="pick" data-i="${i}" data-c="">Quitar la marca</button>` : ''}</div>`;
  // el estado de una línea; con el lote reabierto, la que cambió dice «Cambio por aprobar»
  const estadoDe = (r, cambiada) => bloq(r) ? ['Por verificar', 'alerta'] : cambiada ? ['Cambio por aprobar', 'aviso'] : !r.c ? ['Sin pagar', ''] : faltaSocio(r) ? ['Falta decir qué socio', 'aviso'] : (r.duda && !P.dudas[r.duda]) ? ['Por revisar', 'aviso'] : r.cap == null ? ['Falta la captura', 'aviso'] : Math.abs(r.cap - r.m) >= 0.005 ? ['No cuadra', 'aviso'] : ['Pagado', 'ok'];
  // en el teléfono van arriba las líneas que piden algo (la duda, la cuenta por verificar, las sin pagar, la que no cuadra) y abajo las pagadas,
  // en un renglón compacto · la de la duda sigue arriba mientras se pueda deshacer la respuesta
  const pideAlgo = (r, cambiada) => cambiada || estadoDe(r, false)[0] !== 'Pagado' || (!!r.duda && editable(P));
  // en ese grupo va primero lo que frena la aprobación (la duda, aunque ya tenga respuesta, y el socio que falta), después la cuenta por verificar,
  // lo que cambió, la captura que falta o no cuadra y al final lo que queda sin pagar
  const prioridad = (r, cambiada) => (r.duda && editable(P)) || faltaSocio(r) ? 0 : bloq(r) ? 1 : cambiada ? 2 : r.c ? 3 : 4;
  const grupoFila = (t, n) => `<div class="lgrupo" role="row"><span role="cell">${esc(t)} · ${n}</span></div>`;
  function filaLunes(r, i, o = {}) {
    const pv = prov(r.p); const bl = bloq(r);
    const puedeMarcar = puede('pagos', 'editar'); const abierto = editable(P);
    const marcada = !!r.c && i !== P.recien;
    let cuenta;
    if (bl) cuenta = `<button class="alerta-btn" data-pl="explica" data-i="${i}" aria-expanded="${P.explica === i}">${ic('candado', 's')}Cuenta por verificar</button>`;
    // con el lote aprobado, quien edita ve la cuenta con candado: al tocarla le dice cómo se cambia
    else if (puedeMarcar && !abierto) cuenta = ctaCerrada(r.c, 'lunes');
    // quien solo mira ve la cuenta como dato, no como un botón que no responde
    else cuenta = puedeMarcar ? `<button class="cta-btn${r.c ? '' : ' vacia'}" data-pl="menu" data-i="${i}" aria-haspopup="menu" aria-expanded="${P.menu === i}">${r.c ? acct(r.c) : 'Elegir cuenta'}${ic('abajo', 's')}</button>`
      : r.c ? acct(r.c) : '<span class="tenue">Sin elegir</span>';
    if (P.menu === i) cuenta += menuCuentas('data-pl', i, r.c);
    const [et, tono] = estadoDe(r, o.cambiada);
    const nombre = `<button data-abrir="lineapago:${i}"><span class="subraya" ${r.c ? `style="--m: ${resDe(r.c)}"` : ''}>${esc(pv.nombre)}</span></button>`;
    // pagada y sin nada que hacer: un renglón con el nombre, la cuenta y el monto (lo demás lo lee el lector de pantalla)
    if (o.compacta) return `<div class="lfila compacta${marcada ? ' pagada' : ''}" role="row" data-i="${i}" id="lunes-l${i}">
      <div class="c-prov" role="cell">${nombre}<span class="sr-only">${esc(r.f)} · ${r.tarde ? 'vencida, ' + esc(r.v.toLowerCase()) : 'vence ' + esc(r.v.toLowerCase())} · ${et}</span></div>
      <div class="c-cuenta" role="cell">${cuenta}</div>
      <div class="c-monto" role="cell">${dinero(r.m, 'usd')}</div></div>`;
    let h = `<div class="lfila${marcada ? ' pagada' : ''}${o.cambiada ? ' cambiada' : ''}" role="row" data-i="${i}" id="lunes-l${i}">
      <div class="c-prov" role="cell">${nombre}<small>${esc(r.f)}</small></div>
      <div class="c-vence${r.tarde ? ' tarde' : ''}" role="cell">${venceHtml(r)}</div>
      <div class="c-monto" role="cell">${dinero(r.m, 'usd')}</div>
      <div class="c-cuenta" role="cell">${cuenta}</div>
      <div class="c-estado" role="cell">${tag(et, tono)}</div>`;
    if (bl && P.explica === i) h += `<div class="explica" role="cell"><p><b>${esc((cuentaDe(r) || {}).nueva)}.</b> Cambiar la cuenta es la forma más común de desviar un pago. Llama al proveedor a su número de siempre${pv.telNuevo ? ` (el de antes, ${esc(pv.telNuevo.antes)}: el teléfono también cambió)` : pv.tel ? ' (' + esc(pv.tel) + ')' : ''} y confirma la cuenta nueva antes de pagarle.</p>${pv.telNuevo && puede('pagos', 'aprobar') ? `<button class="btn bloq" data-pl="verificar" data-i="${i}" aria-disabled="true">${ic('candado', 's')}Ya confirmé por teléfono</button><p class="muted">Primero confirma el teléfono: llama al de antes (${esc(pv.telNuevo.antes)}).</p>` : A.boton('pagos', 'Ya confirmé por teléfono', `data-pl="verificar" data-i="${i}"`, { tono: 'peligro', icono: 'candado', permiso: 'aprobar' })}</div>`;
    // en el teléfono la duda va dentro de su línea, abierta como «Cuenta por verificar»
    if (o.tel && r.duda) h += dudaHtml(i, 'linea');
    return h + '</div>';
  }

  /* ---------- pagar la nómina: el mismo camino que los proveedores (3 oct) ---------- */
  // la lista sale del reporte que sube Andreina en Nómina (RRHH no ve Pagos), en su orden: primero la corrida formal y después la interna, por banco
  // el monto de cada línea es el neto de su recibo, la misma cifra de la pre-nómina · la lista por persona solo la ven quienes ven sueldos
  // con el mismo candado que el lote del lunes: aprobado, no se cambia nada hasta tocar «Cambiar el pago»
  const PN = nuevoLote();
  const PNL = () => D.PAGO_NOMINA.lineas;
  const empDe = id => D.EMPLEADOS.find(e => e.id === id) || { nombre: '—', cargo: '', cuenta: '—', titular: '' };
  const netoDe = l => r2(A.lineaNomina(empDe(l.e)).neto);
  // lo que dice cada captura: el neto, o la cifra en Bs si se pagó redondeado
  const capNom = l => l.capBs != null ? r2(l.capBs / D.TASA.usd) : l.cap ? netoDe(l) : null;
  const capNomBs = l => l.capBs ?? r2(capNom(l) * D.TASA.usd);
  const partesCta = e => { const m = String(e.cuenta).match(/^(Pago móvil|\S+)\s+(.*)$/); return m ? [m[1], m[2]] : [e.cuenta, '']; }; // [banco, número tapado]
  const familiar = e => /\([VE]-/.test(e.titular || '');
  const aNombreDe = e => familiar(e) ? 'a nombre de ' + esc(e.titular.replace(/^Su /, 'su ')) : 'a su nombre';
  const bloqNom = l => !!empDe(l.e).cuentaNueva; // su cuenta cambió hace poco y está por verificar
  // la comisión con la misma regla del lunes: 0,3 % entre bancos distintos (un pago móvil también la cobra)
  const comNom = l => (capNom(l) == null || !BANCO_DE[l.c] || partesCta(empDe(l.e))[0] === BANCO_DE[l.c]) ? 0 : r2(capNomBs(l) * 0.003);
  const refNom = i => '005' + (2210 + i);
  function cuadreNom() {
    const ls = PNL(); const tot = r2(ls.reduce((s, l) => s + netoDe(l), 0)); const sin = ls.filter(l => !l.c); const sinM = r2(sin.reduce((s, l) => s + netoDe(l), 0));
    const pag = ls.filter(l => l.c); const con = pag.filter(l => capNom(l) != null); const caps = r2(con.reduce((s, l) => s + capNom(l), 0)); const lista = r2(tot - sinM);
    return { tot, sin, sinM, lista, caps, con, n: con.length, faltan: pag.filter(l => capNom(l) == null), distintas: con.filter(l => Math.abs(capNom(l) - netoDe(l)) >= 0.005), dif: r2(caps - lista) };
  }
  const porQueNom = q => [...q.distintas.map(l => `${esc(empDe(l.e).nombre)}: la captura dice ${dinero(capNom(l), 'usd')} y la lista ${dinero(netoDe(l), 'usd')}.`), ...q.faltan.map(l => `Falta la captura de ${esc(empDe(l.e).nombre)}.`)].join(' ');
  const firmaNomina = () => JSON.stringify(PNL().map(l => l.c ? [l.e, l.c, netoDe(l), l.cap ? 1 : 0, l.capBs ?? '', l.socio || ''] : [l.e]));
  const estadoNom = (l, cambiada) => { const cap = capNom(l); return bloqNom(l) ? ['Por verificar', 'alerta'] : cambiada ? ['Cambio por aprobar', 'aviso'] : !l.c ? ['Sin pagar', ''] : faltaSocio(l) ? ['Falta decir qué socio', 'aviso'] : cap == null ? ['Falta la captura', 'aviso'] : Math.abs(cap - netoDe(l)) >= 0.005 ? ['No cuadra', 'aviso'] : ['Pagado', 'ok']; };
  function filaNom(l, i, o = {}) {
    const e = empDe(l.e); const bl = bloqNom(l); const marcada = !!l.c && i !== PN.recien; const [banco, num] = partesCta(e);
    const ed = puede('pagos', 'editar'); const abierto = editable(PN);
    let cuenta;
    if (bl) cuenta = `<button class="alerta-btn" data-pn="explica" data-i="${i}" aria-expanded="${PN.explica === i}">${ic('candado', 's')}Cuenta por verificar</button>`;
    // con el pago aprobado, quien edita ve la cuenta con candado: al tocarla le dice cómo se cambia
    else if (ed && !abierto) cuenta = ctaCerrada(l.c, 'nomina');
    // quien solo mira ve la cuenta como dato, no como un botón que no responde
    else cuenta = ed ? `<button class="cta-btn${l.c ? '' : ' vacia'}" data-pn="menu" data-i="${i}" aria-haspopup="menu" aria-expanded="${PN.menu === i}">${l.c ? acct(l.c) : 'Elegir cuenta'}${ic('abajo', 's')}</button>`
      : l.c ? acct(l.c) : '<span class="tenue">Sin elegir</span>';
    if (PN.menu === i) cuenta += menuCuentas('data-pn', i, l.c);
    const [et, tono] = estadoNom(l, o.cambiada);
    const nombre = `<button data-abrir="pagonom:${i}"><span class="subraya" ${l.c ? `style="--m: ${resDe(l.c)}"` : ''}>${esc(e.nombre)}</span></button>`;
    if (o.compacta) return `<div class="lfila compacta${marcada ? ' pagada' : ''}" role="row" data-n="${i}" id="nomina-l${i}">
      <div class="c-prov" role="cell">${nombre}<span class="sr-only">N.º ${i + 1} · ${esc(banco)} ${esc(num)} · ${et}</span></div>
      <div class="c-cuenta" role="cell">${cuenta}</div>
      <div class="c-monto" role="cell">${dinero(netoDe(l), 'usd')}</div></div>`;
    let h = `<div class="lfila${marcada ? ' pagada' : ''}${o.cambiada ? ' cambiada' : ''}" role="row" data-n="${i}" id="nomina-l${i}">
      <div class="c-prov" role="cell">${nombre}<small>N.º ${i + 1} · ${esc(num)}${familiar(e) ? ' · ' + aNombreDe(e) : ''}</small></div>
      <div class="c-vence" role="cell">${esc(banco)}</div>
      <div class="c-monto" role="cell">${dinero(netoDe(l), 'usd')}</div>
      <div class="c-cuenta" role="cell">${cuenta}</div>
      <div class="c-estado" role="cell">${tag(et, tono)}</div>`;
    if (bl && PN.explica === i) h += `<div class="explica" role="cell"><p><b>${esc(e.cuentaNueva)}.</b> Cambiar la cuenta de alguien es la forma más común de desviar un sueldo. Confírmala con ${esc(e.nombre.split(' ')[0])}, en persona o a su número de siempre, antes de pagarle.</p>${A.boton('pagos', 'Ya confirmé con la persona', `data-pn="verificar" data-i="${i}"`, { tono: 'peligro', icono: 'candado', permiso: 'aprobar' })}</div>`;
    return h + '</div>';
  }
  function verificarCuentaEmp(id) {
    const e = empDe(id); e.cuentaVerificada = 'confirmada con la persona (' + S.usuario.nombre + ')'; delete e.cuentaNueva;
    D.PENDIENTES.filter(x => x.emp === id && !x.hecho).forEach(x => { x.hecho = 'Verificada por ' + S.usuario.nombre; });
    A.auditar({ modulo: 'Pagar la nómina', registro: e.nombre, campo: 'cuenta', antes: 'por verificar', despues: 'verificada con la persona' });
  }

  /* ---------- aprobar y enviar de una vez, cambiar el lote y corregir lo enviado (iguales en los dos lotes) ---------- */
  const DEF = {
    lunes: { X: () => P, ls: () => D.LUNES, nom: r => prov(r.p).nombre, monto: r => r.m, cap: r => r.cap ?? null, cuadre: () => cuadre(), firma: () => firmaLunes(),
      el: 'el lote', El: 'El lote', cambiar: 'Cambiar el lote', titulo: 'Lote del lunes', delLote: 'del lote del lunes', registro: () => 'Lote del ' + LOTE, modulo: 'Pagos de los lunes',
      grupo: 'Comprobantes de pago', correccion: 'Corrección del lote del ' + LOTE, sub: 'lunes', pl: 'pl', fila: i => 'lunes-l' + i },
    nomina: { X: () => PN, ls: () => PNL(), nom: l => empDe(l.e).nombre, monto: l => netoDe(l), cap: l => capNom(l), cuadre: () => cuadreNom(), firma: () => firmaNomina(),
      el: 'el pago', El: 'El pago', cambiar: 'Cambiar el pago', titulo: 'Pago de la nómina del ' + D.PAGO_NOMINA.corto, delLote: 'del pago de la nómina', registro: () => 'Nómina del ' + D.PAGO_NOMINA.corto, modulo: 'Pagar la nómina',
      grupo: 'Pagos al Personal', correccion: 'Corrección del pago de la nómina del ' + D.PAGO_NOMINA.corto, sub: 'nomina', pl: 'pn', fila: i => 'nomina-l' + i },
  };
  const pagadas = cual => DEF[cual].ls().filter(r => r.c).length;
  let nPend = 0; const idPend = () => 'pe' + Date.now() + '-' + (++nPend); // un pendiente nuevo, con su número
  // la foto de cada línea al aprobar: con ella se ve solo lo que cambió y se puede dejar todo como estaba
  function foto(cual) {
    const d = DEF[cual]; const q = d.cuadre();
    return { total: q.lista, n: pagadas(cual), pollos: cual === 'lunes' ? P.pollos : null, dudas: cual === 'lunes' ? { ...P.dudas } : null, dudaPor: cual === 'lunes' ? P.dudaPor : '',
      lineas: d.ls().map(r => ({ c: r.c || null, m: r2(d.monto(r)), socio: r.socio || '', cap: d.cap(r), cta: r.cta || '', crudo: { cap: r.cap, capBs: r.capBs, cta: r.cta } })) };
  }
  function ponerFoto(cual, f) {
    DEF[cual].ls().forEach((r, i) => { const b = f.lineas[i]; if (!b) return; r.c = b.c; if (b.socio) r.socio = b.socio; else delete r.socio; if (cual === 'lunes') r.m = b.m;
      ['cap', 'capBs', 'cta'].forEach(k => { if (b.crudo[k] === undefined) delete r[k]; else r[k] = b.crudo[k]; }); });
    if (cual === 'lunes') { P.pollos = f.pollos; P.dudas = { ...f.dudas }; P.dudaPor = f.dudaPor; }
  }
  // solo la diferencia contra una foto: «+ 1 pago: Gas Carabobo $ 180,00 desde BVCA» o «Pollos El Granjero: BVCA → BNC»
  function difDe(cual, f) {
    const d = DEF[cual]; const out = [];
    d.ls().forEach((r, i) => {
      const b = f.lineas[i]; if (!b) return; const c = r.c || null; const m = r2(d.monto(r)); const cap = d.cap(r); const nom = d.nom(r);
      const sinCap = cap == null ? ' · falta la captura' : '';
      if (!b.c && c) out.push({ i, html: `+ 1 pago: <b>${esc(nom)}</b> ${dinero(m, 'usd')} desde ${acct(c)}${sinCap}`, txt: `+ 1 pago: ${nom} ${dinero(m, 'usd')} desde ${c}${sinCap}` });
      else if (b.c && !c) out.push({ i, html: `− 1 pago: <b>${esc(nom)}</b> ${dinero(b.m, 'usd')} <span class="tenue">(salía de ${acct(b.c)})</span>`, txt: `− 1 pago: ${nom} ${dinero(b.m, 'usd')} (salía de ${b.c})` });
      else if (b.c && c) {
        const h = [], t = []; const pon = (x, y = x) => { h.push(x); t.push(y); };
        if (b.c !== c) pon(`${acct(b.c)} → ${acct(c)}`, `${b.c} → ${c}`);
        if (Math.abs(b.m - m) >= 0.005) pon(`${dinero(b.m, 'usd')} → ${dinero(m, 'usd')}`);
        if (b.socio !== (r.socio || '')) { const s = `pagó ${b.socio || 'sin decir'} → ${r.socio || 'sin decir'}`; pon(esc(s), s); }
        if (cual === 'lunes' && b.cta !== (r.cta || '')) { const s = `a la cuenta ${b.cta} → ${r.cta || '—'}`; pon(esc(s), s); }
        if ((b.cap == null) !== (cap == null) || (cap != null && Math.abs(b.cap - cap) >= 0.005)) pon(cap == null ? 'falta la captura' : 'captura nueva: dice ' + dinero(cap, 'usd'));
        if (h.length) out.push({ i, html: `<b>${esc(nom)}</b>: ${h.join(' · ')}`, txt: `${nom}: ${t.join(' · ')}` });
      }
    });
    if (cual === 'lunes' && (f.pollos || null) !== (P.pollos || null)) { const pl = pollos(); const s = `${DUDA_TXT[f.pollos] || 'sin responder'} → ${DUDA_TXT[P.pollos] || 'sin responder'}`; out.push({ i: D.LUNES.indexOf(pl), html: `<b>${esc(prov(pl.p).nombre)}</b> (aparece dos veces): ${esc(s)}`, txt: `${prov(pl.p).nombre} (aparece dos veces): ${s}` }); }
    return out;
  }
  const difCambio = cual => { const X = DEF[cual].X(); return X.cambio ? difDe(cual, X.cambio.base.foto) : []; };
  // lo que frena la aprobación, dicho en palabras y con a dónde llevar (la barra del teléfono baja ahí)
  function bloqueoDe(cual) {
    const d = DEF[cual], X = d.X(); const ls = d.ls();
    if (cual === 'lunes' && pendientes()) { const pl = pollos(); const n = pendientes(); return { txt: n === 1 ? '1 duda por resolver' : n + ' dudas por resolver', sub: esc(prov(pl.p).nombre) + ' aparece dos veces', ir: 'duda-pollos', razon: 'Para aprobar, resuelve primero la duda.' }; }
    const ss = ls.filter(faltaSocio); if (ss.length) return { txt: 'Falta decir qué socio pagó', sub: esc(d.nom(ss[0])) + (ss.length > 1 ? ' y ' + (ss.length - 1) + ' más' : ''), ir: d.fila(ls.indexOf(ss[0])), razon: 'Para aprobar, abre ' + (ss.length === 1 ? (cual === 'nomina' ? 'el pago marcado' : 'la línea marcada') : (cual === 'nomina' ? 'los ' + ss.length + ' pagos marcados' : 'las ' + ss.length + ' líneas marcadas')) + ' con SOCIO o APORTE y di qué socio pagó.' };
    if (!pagadas(cual)) return { txt: 'Todavía no hay pagos marcados', sub: 'Elige de qué cuenta salió cada uno', razon: 'Para aprobar, marca de qué cuenta salió cada pago.' };
    if (X.cambio && !difCambio(cual).length) return { txt: 'Todavía no cambió nada', sub: 'Cambia lo que haga falta o déjalo como estaba', razon: 'Todavía no cambió nada: no hay diferencia que aprobar.' };
    return null;
  }
  // en el teléfono (la app a menos de 720 px) la lista cambia de orden, la duda va en su línea y lo que sigue va en una barra fija
  const enTel = () => { const dv = document.getElementById('device'); const w = dv ? dv.clientWidth : 0; return w > 0 && w < 720; };
  let telAntes = null;
  if (window.ResizeObserver && document.getElementById('device')) new ResizeObserver(() => { const t = enTel(); if (telAntes !== null && t !== telAntes && S.usuario && S.ruta === 'pagos') A.pintarPagina(); telAntes = t; }).observe(document.getElementById('device'));
  const suave = () => (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  // la barra lleva a la duda (o a la línea que frena): baja ahí, la marca un momento y el teclado queda en su primer botón
  function irA(id) {
    const el = document.getElementById(id); if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: suave() });
    const f = el.querySelector('.btns button:not([disabled]), .c-prov button') || el; if (f === el && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    f.focus({ preventScroll: true }); el.classList.remove('resalto'); void el.offsetWidth; el.classList.add('resalto');
  }
  // lo que le llega al grupo: el lote entero o la corrección, con el mismo total que se aprobó
  function mensajeLote(cual) {
    const d = DEF[cual]; const q = d.cuadre(); const sin = q.sin;
    return [`*${cual === 'nomina' ? 'Pago de la nómina del ' + D.PAGO_NOMINA.corto : 'Pagos del lunes ' + LOTE}*`, `${pagosTxt(pagadas(cual))} · ${dinero(q.lista, 'usd')}`, sumasPor(d.ls(), d.monto).map(([k, s]) => k + ' ' + dinero(s, 'usd')).join(' · '),
      sin.length ? 'Quedan por pagar: ' + (cual === 'nomina' ? sin.length : sin.map(r => d.nom(r)).join(', ')) : 'No queda nada por pagar.',
      q.faltan.length ? faltanTxt(q.faltan.length) + ': la nota va en el PDF.' : q.dif ? 'Las capturas suman ' + dinero(q.caps, 'usd') + ': la nota va en el PDF.' : 'Cuadra con las capturas.',
      `Va el PDF con el cuadre y las capturas. Lo aprobó ${S.usuario.nombre} a las ${D.HOY.hora}.`].join('\n');
  }
  function mensajeCorreccion(cual, dif, motivo) {
    const d = DEF[cual]; const q = d.cuadre(); const ant = d.X().enviadoEn;
    return [`*${d.correccion}*`, ...dif.map(x => x.txt), `Total nuevo: ${dinero(q.lista, 'usd')} · ${pagosTxt(pagadas(cual))} (antes ${dinero(ant.total, 'usd')} · ${pagosTxt(ant.n)})`, motivo ? `Por qué: «${motivo}»` : '', `Va el PDF corregido. Lo aprobó ${S.usuario.nombre} a las ${D.HOY.hora}.`].filter(Boolean).join('\n');
  }
  // la ventana del código: qué se aprueba, cuánto sale de cada cuenta y a qué grupo sale · un solo código aprueba y envía
  const codigoAprobar = (cual, q) => { const d = DEF[cual]; return { que: (cual === 'nomina' ? 'Pago de la nómina del ' + esc(D.PAGO_NOMINA.corto) : 'Lote del lunes') + ' · ' + pagosTxt(pagadas(cual)) + ' · ' + dinero(q.lista, 'usd'),
    det: A.porCuenta(sumasPor(d.ls(), d.monto)) + `<span class="firma-linea">Sale al grupo «${esc(d.grupo)}» con el PDF.</span>` + (q.dif ? '<span class="firma-linea">Las capturas suman ' + dinero(q.caps, 'usd') + ': va con tu nota.</span>' : ''), boton: 'Aprobar y enviar ' + dinero(q.lista, 'usd') }; };
  // la del cambio: solo la diferencia, con los pagos y el total de antes y de ahora
  const codigoCambio = (cual, q, dif) => { const d = DEF[cual], X = d.X(), b = X.cambio.base, corr = !!X.enviadoEn; const n = pagadas(cual);
    return { que: 'Cambio ' + d.delLote + ' · ' + (b.n !== n ? b.n + ' → ' + pagosTxt(n) : pagosTxt(n)) + ' · ' + (Math.abs(b.total - q.lista) >= 0.005 ? dinero(b.total, 'usd') + ' → ' : '') + dinero(q.lista, 'usd'),
      det: dif.map(x => `<span class="firma-linea">${x.html}</span>`).join('') + `<span class="firma-linea">${corr ? `Sale al grupo «${esc(d.grupo)}» como «${esc(d.correccion)}».` : `Sale al grupo «${esc(d.grupo)}» con el PDF.`}</span>` + (q.dif ? '<span class="firma-linea">Las capturas suman ' + dinero(q.caps, 'usd') + ': va con tu nota.</span>' : ''),
      boton: corr ? 'Aprobar y enviar la corrección' : 'Aprobar y enviar ' + dinero(q.lista, 'usd') }; };
  const botonAprobar = cual => { const X = DEF[cual].X(); return X.enviadoEn ? 'Aprobar y enviar la corrección' : X.cambio ? 'Aprobar el cambio y enviar' : 'Aprobar y enviar al grupo'; };
  // aprobar y enviar son un solo paso, con un solo código; con el lote reabierto, se aprueba solo la diferencia
  function aprobarYEnviar(cual) {
    const d = DEF[cual], X = d.X(); if (!editable(X)) return;
    if (!puede('pagos', 'aprobar')) { ACC['sin-permiso']('pagos|aprobar'); return; }
    const bq = bloqueoDe(cual); if (bq) { A.aviso(bq.razon, 'info'); return; }
    const q = d.cuadre(); const c = X.cambio; const dif = c ? difDe(cual, c.base.foto) : [];
    const firma = c ? codigoCambio(cual, q, dif) : codigoAprobar(cual, q);
    const listo = nota => {
      X.aprobado = true; X.nota = nota || null; X.cambio = null;
      X.aprobadoEn = { total: q.lista, n: pagadas(cual), dia: diaHoy(), hora: D.HOY.hora, quien: S.usuario.nombre, firma: d.firma(), foto: foto(cual), nota: X.nota };
      cierraReabierto(cual);
      A.auditar({ modulo: d.modulo, registro: d.registro(), campo: 'estado', antes: c ? 'aprobado · ' + dinero(c.base.total, 'usd') : 'por aprobar', despues: (c ? 'cambio aprobado · ' : 'aprobado · ') + dinero(q.lista, 'usd'),
        motivo: [c ? dif.map(x => x.txt).join(' · ') : '', nota ? 'Diferencia de ' + dinero(Math.abs(q.dif), 'usd') + ': ' + nota : ''].filter(Boolean).join(' · ') });
      // lo que sale: el lote entero o, si ya había salido, la corrección con la diferencia contra lo último que le llegó al grupo
      const dEnv = X.enviadoEn ? difDe(cual, X.enviadoEn.foto) : null;
      X.porEnviar = { tipo: dEnv ? 'correccion' : 'lote', texto: dEnv ? mensajeCorreccion(cual, dEnv, c && c.motivo) : mensajeLote(cual), lineas: dEnv ? dEnv.map(x => x.i) : null, dif: dEnv ? dEnv.map(x => x.txt) : null };
      const r = intentarEnvio(cual);
      X.selloRecien = r === 'ok' ? 'enviado' : 'aprobado'; setTimeout(() => { X.selloRecien = null; }, 60);
      A.pintarPagina(); if (S.ficha) { if (S.ficha.tipo === 'pendiente') A.cerrarFicha(); else A.pintarFicha(); }
      A.aviso(r === 'ok' ? (dEnv ? 'Cambio aprobado. La corrección salió al grupo. (Simulado)' : cual === 'nomina' ? 'Aprobado y enviado al grupo. Le avisamos a Andreina. (Simulado)' : 'Aprobado y enviado al grupo. Las facturas pagadas quedaron cerradas. (Simulado)')
        : r === 'cambio' ? 'El lote cambió mientras lo aprobabas: no salió nada. Hay que aprobarlo otra vez.' : 'Aprobado con tu firma, pero no salió al grupo: se cayó la conexión. «Reintentar el envío» no pide otro código.', r === 'ok' ? 'ok' : 'info');
    };
    const prev = (c && c.base.nota) || '';
    if (q.dif) A.pedirMotivo({ titulo: c ? 'Aprobar el cambio con una diferencia' : (cual === 'nomina' ? 'Aprobar el pago con una diferencia' : 'Aprobar el lote con una diferencia'), texto: `La lista menos lo que no se pagó da <b>${dinero(q.lista, 'usd')}</b> y las capturas suman <b>${dinero(q.caps, 'usd')}</b>${q.faltan.length ? ` (${faltanTxt(q.faltan.length).toLowerCase()})` : ''}. Explica la diferencia de <b>${dinero(Math.abs(q.dif), 'usd')}</b>: la nota sale en el PDF.`, etiqueta: 'Nota de la diferencia', valor: prev, boton: botonAprobar(cual), codigo: firma }).then(listo).catch(() => {});
    else A.pedirCodigo(firma).then(() => listo(null)).catch(() => {});
  }
  // el envío (simulado): al grupo solo sale lo que se aprobó · si se cae la conexión, queda aprobado y el mensaje espera a «Reintentar el envío»
  function intentarEnvio(cual) {
    const d = DEF[cual], X = d.X(), pe = X.porEnviar; if (!pe) return 'nada';
    if (X.aprobadoEn.firma !== d.firma()) { invalidar(cual); return 'cambio'; }
    let m = X.mensajes.find(x => x.pe === pe); if (!m) { m = { pe, tipo: pe.tipo, texto: pe.texto, hora: D.HOY.hora, estado: 'no_salio' }; X.mensajes.push(m); }
    m.hora = D.HOY.hora;
    if (X.sinRed) { m.estado = 'no_salio'; A.auditar({ modulo: d.modulo, registro: d.registro(), campo: 'envío al grupo', antes: 'aprobado', despues: 'no salió: se cayó la conexión' }); return 'fallo'; }
    m.estado = 'confirmado';
    if (cual === 'lunes') { if (pe.tipo === 'lote') pagarLote(); else repagar(pe.lineas); }
    else { const q = cuadreNom(); A.pendiente({ id: idPend(), para: ['andreina'], tipo: 'info', titulo: (pe.tipo === 'lote' ? 'Salió el pago de la nómina del ' : 'Se corrigió el pago de la nómina del ') + D.PAGO_NOMINA.corto, sub: 'El PDF llegó a «Pagos al Personal»' + (q.sin.length ? ' · quedan ' + q.sin.length + ' por pagar' : '') + ' · faltan los recibos firmados', de: 'La app', edad: 'Ahora', ir: 'nomina', sub2: 'recibos' }); }
    X.enviadoEn = { foto: X.aprobadoEn.foto, total: X.aprobadoEn.total, n: X.aprobadoEn.n, dia: diaHoy(), hora: D.HOY.hora };
    X.porEnviar = null;
    A.auditar({ modulo: d.modulo, registro: d.registro(), campo: 'estado', antes: 'aprobado', despues: pe.tipo === 'correccion' ? 'corrección enviada al grupo' : 'enviado al grupo' });
    return 'ok';
  }
  // si lo de abajo ya no es lo que se firmó (cambió después de aprobarlo), el sello se tacha y queda por aprobar otra vez
  function invalidar(cual) {
    const d = DEF[cual], X = d.X();
    X.tachados.push({ ...X.aprobadoEn, reabrio: 'la app', horaReabrio: D.HOY.hora, motivo: (cual === 'nomina' ? 'la lista cambió' : 'el lote cambió') + ' después de aprobarlo' });
    if (X.porEnviar) X.mensajes = X.mensajes.filter(x => x.pe !== X.porEnviar);
    X.aprobado = false; X.aprobadoEn = null; X.porEnviar = null; X.nota = null;
    A.auditar({ modulo: d.modulo, registro: d.registro(), campo: 'estado', antes: 'aprobado', despues: 'por aprobar: cambió después de aprobarlo' });
  }
  // reintentar no pide otro código: lo aprobado ya tiene su firma
  function reintentar(cual) {
    const d = DEF[cual], X = d.X(); if (fase(X) !== 'fallo') return;
    if (!puede('pagos', 'editar')) { ACC['sin-permiso']('pagos'); return; }
    const r = intentarEnvio(cual); X.selloRecien = r === 'ok' ? 'enviado' : null; setTimeout(() => { X.selloRecien = null; }, 60);
    A.pintarPagina(); if (S.ficha) A.pintarFicha();
    A.aviso(r === 'ok' ? 'Enviado al grupo, sin pedir otro código. (Simulado)' : r === 'cambio' ? (cual === 'nomina' ? 'La lista cambió después de aprobarla: no salió nada al grupo. Hay que aprobarla otra vez.' : 'El lote cambió después de aprobarlo: no salió nada al grupo. Hay que aprobarlo otra vez.') : 'Sigue sin conexión: no salió. Quedó aprobado; reintenta cuando vuelva la señal.', r === 'ok' ? 'ok' : 'info');
  }
  // «Cambiar el lote» (o «Cambiar el pago»): lo reabre con motivo. El sello se tacha en rojo (no se borra), no sale nada al grupo
  // y se aprueba solo la diferencia; si lo reabre alguien que no aprueba, a Alejandro le llega el pendiente con esa diferencia
  function reabrir(cual) {
    const d = DEF[cual], X = d.X(); if (!X.aprobado || X.cambio) return;
    if (!puede('pagos', 'editar')) { ACC['sin-permiso']('pagos'); return; }
    const yaSalio = !!X.enviadoEn; const quien = esc(A.quienAprueba('pagos'));
    A.pedirMotivo({ titulo: d.cambiar, texto: `${d.El} vuelve a abrirse para cambiarlo. El sello se tacha en rojo (no se borra) y no sale nada al grupo hasta que ${quien} apruebe solo la diferencia con su código.${yaSalio ? ` Como ya salió al grupo, la diferencia sale como «${esc(d.correccion)}».` : ''}`, etiqueta: 'Qué hay que cambiar', boton: d.cambiar }).then(m => {
      const t = { ...X.aprobadoEn, reabrio: S.usuario.nombre, horaReabrio: D.HOY.hora, motivo: m };
      // lo que esperaba la conexión ya no sale: se aprueba de nuevo con el cambio (si se deja como estaba, vuelve a esperar)
      const msg = X.porEnviar ? X.mensajes.find(x => x.pe === X.porEnviar) : null;
      X.cambio = { base: X.aprobadoEn, reabrio: S.usuario.nombre, hora: D.HOY.hora, motivo: m, tachado: t, porEnviar: X.porEnviar, msg };
      if (msg) X.mensajes = X.mensajes.filter(x => x !== msg);
      X.tachados.push(t); X.aprobado = false; X.aprobadoEn = null; X.porEnviar = null; X.nota = null;
      A.auditar({ modulo: d.modulo, registro: d.registro(), campo: 'estado', antes: 'aprobado', despues: 'se reabrió para cambiarlo', motivo: m });
      if (!puede('pagos', 'aprobar')) A.pendiente({ id: idPend(), para: ['alejandro'], tipo: 'aviso', titulo: cual === 'nomina' ? 'Aprobar el cambio del pago de la nómina' : 'Aprobar el cambio del lote del lunes', sub: S.usuario.nombre + ' lo reabrió: «' + m + '»', de: S.usuario.nombre, edad: 'Ahora', ir: 'pagos', sub2: d.sub, lote: cual });
      A.pintarPagina(); if (S.ficha) A.pintarFicha();
      A.aviso('Ya puedes cambiar ' + d.el + '. ' + (puede('pagos', 'aprobar') ? 'Al terminar, apruebas solo la diferencia.' : 'A ' + A.quienAprueba('pagos') + ' le llegó para aprobar solo la diferencia.'));
    }).catch(() => {});
  }
  // «Dejar como estaba»: deshace lo cambiado y vuelve a valer la aprobación de antes (es lo que ya estaba firmado: no pide código)
  function dejarComoEstaba(cual) {
    const d = DEF[cual], X = d.X(); const c = X.cambio; if (!c) return;
    if (!puede('pagos', 'editar')) { ACC['sin-permiso']('pagos'); return; }
    const dif = difDe(cual, c.base.foto);
    const hacer = () => {
      ponerFoto(cual, c.base.foto); P.menu = null; PN.menu = null;
      X.cambio = null; X.aprobado = true; X.aprobadoEn = c.base; X.nota = c.base.nota || null; X.tachados = X.tachados.filter(t => t !== c.tachado);
      if (c.porEnviar) { X.porEnviar = c.porEnviar; if (c.msg) X.mensajes.push(c.msg); }
      cierraReabierto(cual, 'Quedó como estaba (' + S.usuario.nombre + ')');
      A.auditar({ modulo: d.modulo, registro: d.registro(), campo: 'estado', antes: 'se reabrió para cambiarlo', despues: 'quedó como estaba: vale la aprobación de las ' + c.base.hora, motivo: dif.map(x => x.txt).join(' · ') });
      A.pintarPagina(); if (S.ficha) A.pintarFicha(); A.aviso('Quedó como estaba: vale otra vez la aprobación de las ' + c.base.hora + '.');
    };
    if (dif.length) A.confirmar({ titulo: 'Dejar como estaba', texto: 'Se deshace' + (dif.length === 1 ? ' el cambio' : 'n los ' + dif.length + ' cambios') + ' y vuelve a valer la aprobación de las ' + esc(c.base.hora) + '. No pide código: es lo que ya estaba firmado.', boton: 'Dejar como estaba', cancelar: 'Seguir cambiando' }).then(hacer).catch(() => {});
    else hacer();
  }
  // al aprobar el cambio (o dejarlo como estaba), el pendiente de Alejandro queda resuelto
  const cierraReabierto = (cual, txt) => D.PENDIENTES.filter(p => p.lote === cual && !p.hecho).forEach(p => { p.hecho = txt || 'Aprobado por ' + S.usuario.nombre; });

  /* ---------- cómo se ve: sellos, lo que cambió, lo que sigue y lo que le llegó al grupo ---------- */
  const sellosHtml = cual => { const X = DEF[cual].X(); return X.tachados.map(selloTachado).join('') + (X.aprobado && X.aprobadoEn ? selloAprobado(X.aprobadoEn, X.selloRecien === 'aprobado') : '') + (fase(X) === 'enviado' ? A.sello('Enviado', { recien: X.selloRecien === 'enviado', fecha: X.enviadoEn.dia + ' ' + X.enviadoEn.hora }) : ''); };
  function leyendaSellos(cual) {
    const d = DEF[cual], X = d.X(), f = fase(X); const t = X.tachados[X.tachados.length - 1];
    const reab = t ? `Se reabrió a las ${esc(t.horaReabrio)} para cambiarlo (${esc(t.reabrio)}): «${esc(t.motivo)}».` : '';
    if (f === 'cambio') return reab + ' Se aprueba solo la diferencia.';
    if (f === 'abierto') return t ? reab + ' Hay que aprobarlo otra vez.' : '';
    const quien = `Lo aprobó ${esc(X.aprobadoEn.quien)} con su código${X.nota ? ', con la nota de la diferencia' : ''}`;
    if (f === 'fallo') return quien + '. No salió al grupo: se cayó la conexión.';
    const corr = X.mensajes.filter(m => m.tipo === 'correccion' && m.estado === 'confirmado').length;
    return quien + ` y salió al grupo «${esc(d.grupo)}» con el PDF${corr ? (corr === 1 ? ', con una corrección' : ', con ' + corr + ' correcciones') : ''}.`;
  }
  function razonHtml(cual) {
    const d = DEF[cual], X = d.X(), f = fase(X); const q = d.cuadre(); const esDueno = puede('pagos', 'aprobar'); const quien = esc(A.quienAprueba('pagos'));
    if (f === 'enviado') return cual === 'lunes' ? 'Las facturas de las líneas pagadas quedaron pagadas: ya no se editan.' : 'Le avisamos a Andreina.';
    if (f === 'fallo') return `Quedó aprobado con la firma de ${esc(X.aprobadoEn.quien)}. Reintentar no pide otro código.`;
    const bq = bloqueoDe(cual); if (bq) return bq.razon;
    const dest = X.enviadoEn ? `sale al grupo como «${esc(d.correccion)}», solo con la diferencia` : `sale al grupo «${esc(d.grupo)}» con el PDF`;
    const nota = q.dif ? 'No cuadra: te pide una nota que explique la diferencia. ' : '';
    return f === 'cambio' ? nota + (esDueno ? 'Apruebas solo la diferencia con tu código y ' : 'Lo aprueba ' + quien + ', solo la diferencia, y ') + dest + '.'
      : nota + (esDueno ? 'Un solo código: queda aprobado con tu sello y ' : 'Lo aprueba ' + quien + ' con un solo código: queda aprobado y ') + dest + '.';
  }
  // en la computadora (y el iPad): el sello y lo que sigue, al pie del panel de al lado
  function accionHtml(cual) {
    const d = DEF[cual], X = d.X(), f = fase(X), pl = d.pl; const esDueno = puede('pagos', 'aprobar'), ed = puede('pagos', 'editar');
    const sellos = sellosHtml(cual), ley = leyendaSellos(cual);
    let h = sellos || ley ? `<div class="sello-linea">${sellos ? `<span class="sellos">${sellos}</span>` : ''}${ley ? `<span class="muted">${ley}</span>` : ''}</div>` : '';
    if (editable(X)) {
      const bq = bloqueoDe(cual);
      h += esDueno ? `<button class="btn pri full" data-${pl}="aprobar"${bq ? ' disabled' : ''}>${ic('candado', 's')}${botonAprobar(cual)}</button>`
        : ed ? `<button class="btn bloq full" data-acc="sin-permiso" data-arg="pagos|aprobar" aria-disabled="true">${ic('candado', 's')}${f === 'cambio' ? 'Aprobar el cambio' : 'Aprobar y enviar'} (lo aprueba ${esc(A.quienAprueba('pagos'))})</button>` : '';
    } else {
      if (ed) h += `<p class="nota gris">${ic('candado', 's')}<span>${f === 'enviado' ? `<b>Enviado.</b> Para corregir algo, toca «${d.cambiar}»: la corrección sale al grupo con la diferencia.` : `<b>Aprobado.</b> Para cambiar algo, toca «${d.cambiar}».`}</span></p>`;
      if (f === 'fallo' && ed) h += `<button class="btn pri full" data-${pl}="reintentar">${ic('refrescar', 's')}Reintentar el envío</button>`;
      h += A.boton('pagos', d.cambiar, `data-${pl}="reabrir"`, { tono: 'sec', icono: 'lapiz' });
    }
    return h + `<p class="muted" style="text-align:center">${razonHtml(cual)}</p>`;
  }
  // en el teléfono: una barra fija encima de las pestañas que avanza sola (la duda → aprobar y enviar → el sello)
  function barraHtml(cual) {
    const d = DEF[cual], X = d.X(), f = fase(X), pl = d.pl; const esDueno = puede('pagos', 'aprobar'), ed = puede('pagos', 'editar');
    const q = d.cuadre(); const sin = q.sin.length; const resumen = pagosTxt(pagadas(cual)) + ' · ' + dinero(q.lista, 'usd') + (sin ? ' · ' + sin + ' sin pagar' : '');
    const txt = (b, s) => `<span class="barra-txt">${b ? `<b>${b}</b>` : ''}${s ? `<small>${s}</small>` : ''}</span>`;
    const caja = (cls, h) => `<div class="barra-lote${cls ? ' ' + cls : ''}" role="region" aria-label="${esc(d.titulo)}: lo que sigue">${h}</div>`;
    // los sellos de antes (lo que se reabrió) quedan tachados junto al de ahora, como en la computadora
    const tachados = X.tachados.map(selloTachado).join('');
    if (f === 'enviado') return caja('', tachados + A.sello('Enviado', { recien: X.selloRecien === 'enviado', fecha: X.enviadoEn.hora }) + txt('Salió al grupo', esc(pagosTxt(X.enviadoEn.n)) + ' · ' + dinero(X.enviadoEn.total, 'usd')) + (ed ? `<button class="btn sec chico" data-${pl}="reabrir">${ic('lapiz', 's')}${d.cambiar}</button>` : ''));
    // aprobado pero sin salir: el sello «Aprobado» (no un ícono), «Reintentar el envío» y, debajo, «Cambiar el lote» (lo que dicen los candados)
    if (f === 'fallo') return caja('alerta', tachados + selloAprobado(X.aprobadoEn) + txt('No salió al grupo', 'Quedó aprobado con la firma de ' + esc(X.aprobadoEn.quien) + '. Reintentar no pide otro código.') + (ed ? `<button class="btn pri full" data-${pl}="reintentar">${ic('refrescar', 's')}Reintentar el envío</button><button class="btn sec chico barra-cambiar" data-${pl}="reabrir">${ic('lapiz', 's')}${d.cambiar}</button>` : ''));
    const bq = bloqueoDe(cual);
    if (bq && bq.ir) return `<button type="button" class="barra-lote aviso" data-${pl}="ir" data-arg="${bq.ir}"><span class="barra-ico">${ic('alerta')}</span>${txt(bq.txt, bq.sub)}<span class="barra-ver">Ver ${ic('abajo', 's')}</span></button>`;
    if (bq) return caja('', txt(bq.txt, bq.sub));
    let b = '', s = resumen + (q.faltan.length ? ' · ' + faltanTxt(q.faltan.length).toLowerCase() : q.dif ? ' · no cuadra por ' + dinero(Math.abs(q.dif), 'usd') + ': pide una nota' : '');
    if (f === 'cambio') { const dif = difCambio(cual); b = (dif.length === 1 ? '1 cambio' : dif.length + ' cambios') + ' por aprobar'; s = dinero(X.cambio.base.total, 'usd') + ' → ' + dinero(q.lista, 'usd') + ' · ' + dif[0].html + (dif.length > 1 ? ' y ' + (dif.length - 1) + ' más' : ''); }
    else if (!esDueno) b = 'Por aprobar';
    const btn = esDueno ? `<button class="btn pri full" data-${pl}="aprobar">${ic('candado', 's')}${botonAprobar(cual)}</button>`
      : ed ? `<button class="btn bloq full" data-acc="sin-permiso" data-arg="pagos|aprobar" aria-disabled="true">${ic('candado', 's')}Lo aprueba ${esc(A.quienAprueba('pagos'))}</button>` : '';
    return caja('', txt(b, s) + btn);
  }
  // con el lote reabierto: solo lo que cambió, el total de antes y el de ahora, y «Dejar como estaba»
  function cajaCambio(cual, { enFicha = false } = {}) {
    const d = DEF[cual], X = d.X(); const c = X.cambio; if (!c) return '';
    const dif = difDe(cual, c.base.foto); const q = d.cuadre(); const n = pagadas(cual); const ed = puede('pagos', 'editar') && !enFicha;
    const cuerpo = dif.length ? `<ul class="cambios-lote">${dif.map(x => `<li>${x.html}</li>`).join('')}</ul>
        <dl class="kv"><div><dt>Pagos</dt><dd>${c.base.n === n ? n : c.base.n + ' → ' + n}</dd></div><div class="total"><dt>Total aprobado</dt><dd>${Math.abs(c.base.total - q.lista) >= 0.005 ? `<s class="tenue">${dinero(c.base.total, 'usd')}</s> → ` : ''}${dinero(q.lista, 'usd')}</dd></div></dl>`
      : `<p class="muted">Todavía no cambió nada.${ed ? ' Marca, quita o corrige lo que haga falta; si no hace falta, toca «Dejar como estaba».' : ''}</p>`;
    const cab = dif.length ? tag(dif.length === 1 ? '1 cambio por aprobar' : dif.length + ' cambios por aprobar', 'aviso') : '';
    return `${enFicha ? `<div class="cambio-ficha">${cab}` : `<section class="hoja cambio-caja" id="cambio-${cual}"><div class="hoja-cab"><h2>${ic('lapiz')}Lo que cambió</h2>${cab}</div>`}
      ${X.tachados.length ? `<p class="sellos solo-tel">${X.tachados.map(selloTachado).join('')}</p>` : ''}<p class="muted">Lo reabrió ${esc(c.reabrio)} a las ${esc(c.hora)}: «${esc(c.motivo)}». ${X.enviadoEn ? `Ya había salido al grupo: al aprobarse, la diferencia sale como «${esc(d.correccion)}».` : 'Se aprueba solo esto: lo demás ya estaba aprobado.'}</p>
      ${cuerpo}${ed ? `<div class="fila-btns"><button class="btn sec chico" data-${d.pl}="dejar">${ic('refrescar', 's')}Dejar como estaba</button></div>` : ''}${enFicha ? '</div>' : '</section>'}`;
  }
  // solo en el prototipo: que el envío falle, para ver cómo queda (aprobado, con «Reintentar el envío»)
  const protoSinRed = cual => { const d = DEF[cual], X = d.X(); const f = fase(X);
    if (!((puede('pagos', 'aprobar') && editable(X)) || (f === 'fallo' && puede('pagos', 'editar')))) return '';
    return `<label class="proto-prueba"><input type="checkbox" data-${d.pl}="sinred"${X.sinRed ? ' checked' : ''}><span><b>Solo en el prototipo</b>Que el envío al grupo falle, como si se cayera la conexión.</span></label>`; };
  function mensajesHtml(cual) {
    const d = DEF[cual], X = d.X(); if (!X.mensajes.length || !A.wa) return '';
    const falla = `<div class="wa-falla"><p>${ic('alerta', 's')}<span><b>No salió: se cayó la conexión.</b> Quedó aprobado con su firma. «Reintentar el envío» no pide otro código.</span></p></div>`;
    return `<section class="hoja"><h2>${ic('mensaje')}Lo que le llega al grupo</h2>${X.mensajes.map(m => A.wa(m.texto, { grupo: d.grupo, hora: m.hora, estado: m.estado, falla })).join('')}</section>`;
  }
  const etiquetaCuadre = (cual, q) => { const pend = cual === 'lunes' ? pendientes() : 0; const ss = DEF[cual].ls().filter(faltaSocio).length;
    return pend ? tag(pend === 1 ? 'Resuelve la duda' : 'Resuelve las ' + pend + ' dudas', 'aviso') : ss ? tag('Falta decir qué socio pagó', 'aviso') : q.faltan.length ? tag(faltanTxt(q.faltan.length), 'aviso') : q.dif ? tag('No cuadra por ' + dinero(Math.abs(q.dif), 'usd'), 'aviso') : q.n ? tag('Cuadra con las capturas', 'ok') : tag('Todavía no hay capturas', ''); };
  const progreso = (pagado, tot, sinN) => `<div class="hoja" style="gap:8px"><p class="progress-line" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><span>Pagado <b class="num">${dinero(pagado, 'usd')}</b> de <b class="num">${dinero(tot, 'usd')}</b></span><span class="muted">${sinN ? 'Faltan ' + sinN + (sinN === 1 ? ' pago' : ' pagos') : 'Todo pagado'}</span></p><div class="pista" style="height:10px"><span style="width:${tot ? (pagado / tot * 100).toFixed(1) : 0}%;background:var(--tinta)"></span></div></div>`;

  function lunesProveedores() {
    const tel = enTel(); telAntes = tel;
    const q = cuadre(); const pagado = q.lista; const sin = q.sin; const pend = pendientes(); const ed = puede('pagos', 'editar');
    const cambiadas = new Set(difCambio('lunes').map(x => x.i));
    const subt = Object.keys(CTAS).map(k => { const s = D.LUNES.filter(r => r.c === k).reduce((a, r) => a + r.m, 0); return s ? `<div><span class="acct" data-c="${k}">${k}</span><b>${dinero(s, 'usd')}</b></div>` : ''; }).join('');
    const fr = retDeLista(); const retTot = r2(fr.reduce((s, f) => s + retsDe(f), 0));
    const idx = D.LUNES.map((r, i) => i);
    let filas;
    if (tel) {
      const pide = idx.filter(i => pideAlgo(D.LUNES[i], cambiadas.has(i))).sort((a, b) => prioridad(D.LUNES[a], cambiadas.has(a)) - prioridad(D.LUNES[b], cambiadas.has(b)) || a - b); const listas = idx.filter(i => !pide.includes(i));
      filas = (pide.length && listas.length ? grupoFila(editable(P) ? 'Revisa antes de aprobar' : 'Lo que quedó pendiente', pide.length) : '') + pide.map(i => filaLunes(D.LUNES[i], i, { tel, cambiada: cambiadas.has(i) })).join('')
        + (listas.length ? grupoFila('Pagadas', listas.length) : '') + listas.map(i => filaLunes(D.LUNES[i], i, { tel, compacta: true })).join('');
    } else filas = idx.map(i => filaLunes(D.LUNES[i], i, { cambiada: cambiadas.has(i) })).join('');
    const pl = pollos(); const caja = cajaCambio('lunes');
    return `<div class="pila">
      ${tel ? caja : ''}
      ${progreso(pagado, total(), sin.length)}
      <p class="nota gris">${ic('info', 's')}<span><b>Aparte: traspaso de ${acct('BVCA')} a ${acct('BVCE')}</b> (ref. 00418822). Es entre cuentas nuestras: no es un pago. Va en la nota del resumen y no suma en los totales.</span></p>
      <div class="pagos-rej">
        <div class="libro-pagos" role="table" aria-label="Lista de pagos del lunes">
          <div class="lcab" role="row"><span role="columnheader">Proveedor</span><span role="columnheader">Vence</span><span role="columnheader" class="r">Monto</span><span role="columnheader">Sale de</span><span role="columnheader" class="r">Estado</span></div>
          ${filas}
        </div>
        <aside class="lado">
          ${tel ? '' : caja}
          <section class="hoja"><h2>Comprobantes</h2>
            ${ed ? (editable(P) ? zonaCapturas('capturas', 'línea') : soltarCerrado('lunes')) : ''}
            <button class="enlace" data-abrir="capturas:lote">${leidas(q)} leídas · ${q.n} casadas · ${pend ? pend + ' por revisar' : 'nada por revisar'} ${ic('derecha', 's')}</button>
            ${!tel && pl ? `<div class="dudas">${dudaHtml(D.LUNES.indexOf(pl), 'lado')}</div>` : ''}
          </section>
          <section class="hoja"><h2>Cuadre</h2>
            <dl class="kv"><div><dt>Lista del lunes</dt><dd>${dinero(q.tot, 'usd')}</dd></div><div><dt>Sin pagar (${sin.length})</dt><dd>${dinero(-q.sinM, 'usd')}</dd></div><div class="total"><dt>Lista − sin pagar</dt><dd>${dinero(q.lista, 'usd')}</dd></div><div><dt>Suma de las capturas (${q.n})</dt><dd>${dinero(q.caps, 'usd')}</dd></div>${q.dif ? `<div><dt>Diferencia</dt><dd>${q.dif > 0 ? '+' : ''}${dinero(q.dif, 'usd')}</dd></div>` : ''}</dl>
            ${q.dif ? `<p class="muted">${porQue(q)}</p>` : ''}
            ${retTot ? `<p class="muted">La lista ya viene sin las retenciones de ${fr.length} ${fr.length === 1 ? 'factura' : 'facturas'} (${dinero(retTot, 'usd')}): sin ${retTexto(fr)}. Esa parte se le paga al SENIAT: la de IVA en la planilla de IVA y la de ISLR en la declaración de retenciones de ISLR.</p>` : ''}
            <p class="muted">≈ ${dinero(pagado * D.TASA.usd, 'bs')} a la tasa BCV de hoy (${fmt(D.TASA.usd)}). Cada pago guarda su propia tasa y su comisión.</p>
            <div class="subtot">${subt}</div>
            <p>${etiquetaCuadre('lunes', q)}</p>
            ${P.nota ? `<p class="nota gris">${ic('lapiz', 's')}<span><b>Nota de la diferencia:</b> ${esc(P.nota)}</span></p>` : ''}
          </section>
          <div class="pila" style="gap:8px">
            <button class="btn sec full" data-abrir="pdf:lunes">${ic('archivo', 's')}Ver la hoja 1 del PDF</button>
            ${tel ? '' : accionHtml('lunes')}
            ${protoSinRed('lunes')}
          </div>
          ${mensajesHtml('lunes')}
        </aside>
      </div>
      ${tel ? barraHtml('lunes') : ''}
    </div>`;
  }
  const pideNom = (l, cambiada) => cambiada || estadoNom(l, false)[0] !== 'Pagado';
  function lunesNomina() {
    const n = D.NOMINA.proxima; const ve = puede('nomina', 'sueldos'); const R = D.PAGO_NOMINA.reporte;
    const cabeza = `<article class="hoja"><div class="hoja-cab"><h2>${ic('nomina')}Nómina del ${esc(n.fecha)}</h2>${tag('Paso 1 de 4', 'aviso')}</div>
        <ol class="pasos"><li class="actual">Prepara Andreina</li><li>Revisa Jose</li><li>Aprueba Alejandro</li><li>Se paga</li></ol>
        <p class="muted">Cada paso lo hace una persona distinta. Hoy falta: <b>${esc(n.falta)}</b>.</p>`;
    const como = `<article class="hoja"><h2>Cómo se paga</h2><ol class="tiempo"><li><time>1</time><span>Andreina sube el reporte de pago en Nómina y la app arma la lista en ese orden. Ella no ve Pagos: le avisamos cuando todo esté pagado.</span></li><li><time>2</time><span>Se marca cada pago con la cuenta de donde salió.</span></li><li><time>3</time><span>Se suben todas las capturas de una vez y la app las casa.</span></li><li class="ok"><time>4</time><span>Se aprueba y sale el PDF al grupo «Pagos al Personal» de una vez, con un solo código.</span></li></ol></article>`;
    // quien ve la nómina agrupada (Luis, Eliana) no ve la lista por persona: solo cuántos pagos van hechos en cada corrida
    if (!ve) {
      const cuantos = f => { const ls = PNL().filter(l => empDe(l.e).formal === f); return ls.filter(l => l.c).length + ' de ' + ls.length + ' pagos hechos'; };
      const fN = fase(PN); const [et, tono] = { enviado: ['Enviado', 'ok'], fallo: ['Aprobado: no salió al grupo', 'alerta'], cambio: ['Cambio por aprobar', 'aviso'], abierto: ['Por aprobar', 'aviso'] }[fN];
      return `<div class="rejilla"><div class="c7 pila">${cabeza}
          <dl class="kv"><div><dt>Corrida formal (${n.formal.personas} personas)</dt><dd>Agrupada</dd></div><div><dt>Corrida interna (${n.interna.personas} personas)</dt><dd>Agrupada</dd></div><div><dt>Total estimado <small class="tenue">sin los recargos de noche y domingo</small></dt><dd>${dinero(n.formal.total + n.interna.total, 'usd')}</dd></div></dl>
          <p class="nota gris">${ic('candado', 's')}<span>No ves la lista por persona ni los sueldos. Solo dueño, RRHH y contabilidad.</span></p></article>
        <article class="hoja"><div class="hoja-cab"><h2>El pago del ejemplo</h2>${tag(et, tono)}</div>
          <dl class="kv"><div><dt>Corrida formal</dt><dd>${cuantos(true)}</dd></div><div><dt>Corrida interna</dt><dd>${cuantos(false)}</dd></div></dl></article></div>
        <div class="c5 pila">${como}<button class="btn sec" data-ir="nomina">Ir a la nómina ${ic('derecha', 's')}</button></div></div>`;
    }
    const tel = enTel(); telAntes = tel;
    const q = cuadreNom(); const pagado = q.lista; const puedeEd = puede('pagos', 'editar');
    const cambiadas = new Set(difCambio('nomina').map(x => x.i));
    // la nómina va siempre en el orden del reporte (es el orden en que se paga): en el teléfono las pagadas van compactas en su sitio
    const lista = f => { const ls = PNL().map((l, i) => ({ l, i })).filter(x => !!empDe(x.l.e).formal === f); const tot = r2(ls.reduce((s, x) => s + netoDe(x.l), 0));
      return `<div class="sec"><h2>${f ? 'Corrida formal' : 'Corrida interna'}</h2><span class="muted">${f ? 'va a los entes' : 'contrato interno'} · ${ls.length} personas · ${dinero(tot, 'usd')}</span></div>
        <div class="libro-pagos" role="table" aria-label="${f ? 'Corrida formal' : 'Corrida interna'}"><div class="lcab" role="row"><span role="columnheader">Persona</span><span role="columnheader">Cobra en</span><span role="columnheader" class="r">Monto</span><span role="columnheader">Sale de</span><span role="columnheader" class="r">Estado</span></div>
          ${ls.map(x => filaNom(x.l, x.i, { compacta: tel && !pideNom(x.l, cambiadas.has(x.i)), cambiada: cambiadas.has(x.i) })).join('')}</div>`; };
    const subt = Object.keys(CTAS).map(k => { const s = r2(PNL().filter(l => l.c === k).reduce((a, l) => a + netoDe(l), 0)); return s ? `<div><span class="acct" data-c="${k}">${k}</span><b>${dinero(s, 'usd')}</b></div>` : ''; }).join('');
    const caja = cajaCambio('nomina');
    return `<div class="pila">
      ${cabeza}<p class="nota info">${ic('info', 's')}<span><b>Así se verá el pago.</b> La lista de abajo es un ejemplo a medio pagar con la pre-nómina estimada. La de verdad sale del reporte que sube Andreina en Nómina después del visto final de Alejandro.</span></p></article>
      ${tel ? caja : ''}
      ${progreso(pagado, q.tot, q.sin.length)}
      <div class="pagos-rej">
        <div class="pila">${lista(true)}${lista(false)}
          <p class="muted">Se muestran ${PNL().length} de las 49 personas (datos inventados). El monto es el neto de cada recibo: la misma cifra de la pre-nómina. Se calcula en dólares y se paga en bolívares a la tasa BCV del día.</p></div>
        <aside class="lado">
          ${tel ? '' : caja}
          <section class="hoja"><h2>Reporte de RRHH</h2>
            <button class="adjunto" data-acc="ver-archivo" data-arg="${esc(R.archivo)}">${ic('archivo', 's')}<span>${esc(R.archivo)}</span></button>
            <p class="muted">Lo subió ${esc(R.subio)} en Nómina · ${esc(R.cuando.charAt(0).toLowerCase() + R.cuando.slice(1))}. La lista va en su orden: primero la corrida formal y después la interna, cada una por banco.</p></section>
          <section class="hoja"><h2>Comprobantes</h2>
            ${puedeEd ? (editable(PN) ? zonaCapturas('capturas-nom', 'persona') : soltarCerrado('nomina')) : ''}
            <button class="enlace" data-abrir="capturas:nomina">${q.n} leídas · ${q.n} casadas · ${q.faltan.length} por subir ${ic('derecha', 's')}</button></section>
          <section class="hoja"><h2>Cuadre</h2>
            <dl class="kv"><div><dt>Lista de la nómina</dt><dd>${dinero(q.tot, 'usd')}</dd></div><div><dt>Sin pagar (${q.sin.length})</dt><dd>${dinero(-q.sinM, 'usd')}</dd></div><div class="total"><dt>Lista − sin pagar</dt><dd>${dinero(q.lista, 'usd')}</dd></div><div><dt>Suma de las capturas (${q.n})</dt><dd>${dinero(q.caps, 'usd')}</dd></div>${q.dif ? `<div><dt>Diferencia</dt><dd>${q.dif > 0 ? '+' : ''}${dinero(q.dif, 'usd')}</dd></div>` : ''}</dl>
            ${q.dif ? `<p class="muted">${porQueNom(q)}</p>` : ''}
            <p class="muted">≈ ${dinero(pagado * D.TASA.usd, 'bs')} a la tasa BCV de hoy (${fmt(D.TASA.usd)}). Cada pago guarda su propia tasa y su comisión.</p>
            <div class="subtot">${subt}</div>
            <p>${etiquetaCuadre('nomina', q)}</p>
            ${PN.nota ? `<p class="nota gris">${ic('lapiz', 's')}<span><b>Nota de la diferencia:</b> ${esc(PN.nota)}</span></p>` : ''}
          </section>
          <div class="pila" style="gap:8px">
            <button class="btn sec full" data-abrir="pdf:nomina">${ic('archivo', 's')}Ver la hoja 1 del PDF</button>
            ${tel ? '' : accionHtml('nomina')}
            ${protoSinRed('nomina')}
          </div>
          ${mensajesHtml('nomina')}
        </aside>
      </div>
      ${tel ? barraHtml('nomina') : ''}
    </div>`;
  }
  const LOTES = [['Lunes 28 sep', 14, 9310.40], ['Lunes 21 sep', 11, 7215.00], ['Lunes 14 sep', 15, 10102.75]];
  // la nómina pagada también queda como lote: una fila por fecha de pago, con sus corridas
  const lotesNomina = () => [...new Set(D.NOMINA.corridas.map(c => c.fecha))].map(f => { const cs = D.NOMINA.corridas.filter(c => c.fecha === f); return { f, cs, personas: cs.filter(c => c.tipo === 'formal' || c.tipo === 'interna').reduce((s, c) => s + c.personas, 0), usd: r2(cs.reduce((s, c) => s + c.usd, 0)) }; });
  function anteriores() {
    return A.tabla({ cols: [{ t: 'Lote', cls: 'p' }, { t: 'Pagos', cls: 'x' }, { t: 'Aprobó', cls: 'x' }, { t: 'Total', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: LOTES.map(([f, n, t]) => ({ abrir: 'pdf:' + f, celdas: [`<b>${f}</b><small>PDF enviado al grupo</small>`, n, 'Alejandro', dinero(t, 'usd'), tag('Enviado', 'ok')] })) })
      + `<div class="sec"><h2>Nómina</h2><span class="muted">cada fecha con sus corridas: la formal, la interna, el 10 % y el premio</span></div>`
      + A.tabla({ cols: [{ t: 'Nómina', cls: 'p' }, { t: 'Personas', cls: 'x' }, { t: 'Aprobó', cls: 'x' }, { t: 'Total', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: lotesNomina().map(x => ({ abrir: 'pdf:nom|' + x.f, celdas: [`<b>Nómina del ${esc(x.f)}</b><small>${x.cs.length} corridas · PDF enviado a «Pagos al Personal»</small>`, x.personas, 'Alejandro', '≈ ' + dinero(x.usd, 'usd'), tag('Enviado', 'ok')] })) })
      + `<p class="muted">El total de la nómina va en dólares a la tasa de cada día de pago; el 10 % se paga en euros.</p>`;
  }
  PANT.pagos = {
    titulo: 'Pagos de los lunes', corto: 'Pagos', tab: 'Pagos', grupo: 'Dinero que sale', icono: 'pagos', mod: 'pagos', palabras: 'pagar lunes lote transferencia',
    secciones: [['lunes', 'Proveedores', 'lote capturas'], ['nomina', 'Pagar la nómina', 'sueldos quincena'], ['anteriores', 'Lotes anteriores', 'historial pdf']],
    cuenta: () => D.LUNES.filter(r => !r.c).length,
    render: (sub = 'lunes') => `<div class="pagina">
      ${A.cab(D.HOY.largo, 'Pagos de los lunes', 'La lista se armó sola a las 6:00 con todo lo que vence antes del lunes que viene. <b>Hoy usa las facturas importadas a mano el domingo 4</b>: la copia automática de Odoo sigue bloqueada hasta que se arregle el candado.', puede('pagos', 'editar') && sub === 'lunes' ? (!editable(P) ? `<button class="btn bloq chico" data-acc="lote-cerrado" data-arg="lunes" aria-disabled="true">${ic('candado', 's')}Agregar una línea</button>` : `<button class="btn sec chico" data-acc="linea-nueva">${ic('mas', 's')}Agregar una línea</button>`) : '')}
      ${A.lectura('pagos')}
      ${A.subnav([['lunes', 'Proveedores', D.LUNES.filter(r => !r.c).length, true], ['nomina', 'Pagar la nómina', PNL().filter(l => !l.c).length, true], ['anteriores', 'Lotes anteriores']], sub)}
      ${sub === 'lunes' ? lunesProveedores() : sub === 'nomina' ? lunesNomina() : anteriores()}
    </div>`,
    montar: raiz => {
      // con la barra fija abajo (teléfono), lo que recibe el teclado no queda escondido debajo de ella: #main guarda el alto de la barra
      const barra = $('.barra-lote', raiz); const main = $('#main'); if (main && barra && barra.getClientRects().length) main.style.setProperty('--barra-h', Math.ceil(barra.getBoundingClientRect().height) + 'px');
      const cap = $('#capturas', raiz);
      // simulado: las capturas nuevas casan con las líneas marcadas que todavía no tienen la suya
      if (cap) cap.addEventListener('change', e => {
        const n = e.target.files.length; if (!n) return;
        if (!editable(P)) { ACC['lote-cerrado']('lunes'); return; }
        const sinCap = D.LUNES.filter(r => r.c && r.cap == null); sinCap.forEach(r => { r.cap = r.m; });
        A.pintarPagina();
        A.aviso(n + (n === 1 ? ' captura nueva. ' : ' capturas nuevas. ') + (sinCap.length ? 'Casaron con ' + sinCap.map(r => prov(r.p).nombre).join(', ') + '. (Simulado)' : 'Ninguna línea marcada estaba sin captura. (Simulado)'), 'info');
      });
      // lo mismo en la nómina: casan con las personas marcadas que todavía no tienen la suya
      const capN = $('#capturas-nom', raiz);
      if (capN) capN.addEventListener('change', e => {
        const n = e.target.files.length; if (!n) return;
        if (!editable(PN)) { ACC['lote-cerrado']('nomina'); return; }
        const sinCap = PNL().filter(l => l.c && capNom(l) == null); sinCap.forEach(l => { l.cap = true; });
        A.pintarPagina();
        A.aviso(n + (n === 1 ? ' captura nueva. ' : ' capturas nuevas. ') + (sinCap.length ? 'Casaron con ' + sinCap.map(l => empDe(l.e).nombre).join(', ') + '. (Simulado)' : 'Ninguna persona marcada estaba sin captura. (Simulado)'), 'info');
      });
    },
  };
  // la duda de Pollos: la respuesta queda en el registro de cambios; es de un toque, con «Deshacer» durante 10 segundos y después
  // «Reabrir» (con un motivo de un toque), mientras el lote no esté aprobado
  function responderDuda(b) {
    const k = b.dataset.d; const v = b.dataset.v; const pl = pollos();
    P.dudas[k] = b.dataset.r; if (k === 'pollos') P.pollos = v; P.dudaPor = S.usuario.nombre + ' · ' + D.HOY.hora; P.dudaVieja = null;
    A.auditar({ modulo: 'Pagos de los lunes', registro: prov(pl.p).nombre, campo: 'duda: aparece dos veces', antes: 'por revisar', despues: DUDA_TXT[v] || v });
    A.unToque('duda:' + k, () => deshacerDuda(k));
    A.pintarPagina(); if (S.ficha) A.pintarFicha();
    const des = document.querySelector((S.ficha ? '#ficha-raiz' : '#main') + ' [data-pl="duda-deshacer"]'); if (des) des.focus({ preventScroll: true });
    A.aviso('Anotado: ' + (DUDA_TXT[v] || v) + '. Quedó en el registro de cambios. Puedes deshacerlo durante 10 segundos.');
  }
  function deshacerDuda(k, motivo = '') {
    const antes = P.pollos; const pl = pollos();
    if (motivo) P.dudaVieja = { v: antes, motivo };
    P.dudas[k] = false; if (k === 'pollos') P.pollos = null; P.dudaPor = '';
    A.auditar({ modulo: 'Pagos de los lunes', registro: prov(pl.p).nombre, campo: 'duda: aparece dos veces', antes: DUDA_TXT[antes] || 'respondida', despues: motivo ? 'por revisar (reabierta)' : 'por revisar (se deshizo)', motivo });
    A.pintarPagina(); if (S.ficha) A.pintarFicha();
    const b = document.querySelector((S.ficha ? '#ficha-raiz' : '#main') + ' [data-pl="duda"]'); if (b) b.focus({ preventScroll: true });
    A.aviso(motivo ? 'Reabierta: la duda vuelve a estar por resolver.' : 'Deshecho: la duda vuelve a estar por resolver.');
  }
  // reabrir: la respuesta de antes queda tachada, con el motivo, y la duda vuelve a frenar la aprobación
  const reabrirDuda = k => A.pedirReabrir({ titulo: 'Reabrir la duda de ' + prov(pollos().p).nombre, texto: 'Vuelve a estar por resolver y frena la aprobación del lote hasta que se responda otra vez.', opciones: ['Me equivoqué de botón', 'Llegó el comprobante del banco'] }).then(m => deshacerDuda(k, m)).catch(() => {});
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pl]');
    if (!b) { if (P.menu !== null && !e.target.closest('.c-cuenta') && S.ruta === 'pagos') { P.menu = null; A.pintarPagina(); } return; }
    const i = +b.dataset.i; const a = b.dataset.pl;
    // aprobado, el lote no se toca: ni la cuenta de una línea ni la duda de las capturas
    if (!editable(P) && ['menu', 'pick', 'duda', 'duda-deshacer', 'duda-reabrir'].includes(a)) { P.menu = null; ACC['lote-cerrado']('lunes'); return; }
    if (a === 'menu') { P.menu = P.menu === i ? null : i; A.pintarPagina(); const mm = $('#main .menu'); if (mm) mm.scrollIntoView({ block: 'nearest' }); const f = $('.menu button'); if (f) f.focus({ preventScroll: true }); }
    else if (a === 'pick') {
      const r = D.LUNES[i]; const k = b.dataset.c || null; const antes = r.c; r.c = k; P.menu = null; if (k && k !== antes) P.recien = i;
      // si cambia de dónde salió, la captura de la cuenta anterior ya no casa (queda «Falta la captura») y el socio solo vale para SOCIO o APORTE
      const soltada = k !== antes && r.cap != null; if (soltada) { delete r.cap; delete r.capBs; }
      if (k !== antes && !DE_SOCIO.includes(k)) delete r.socio;
      A.auditar({ modulo: 'Pagos de los lunes', registro: prov(r.p).nombre, campo: 'sale de', antes: antes || 'sin pagar', despues: k || 'sin pagar' });
      if (soltada) A.aviso(k ? 'La captura que había salió de ' + antes + ': ya no casa. Sube la de ' + k + '.' : 'Quitaste la marca: la captura que había ya no casa con esta línea.', 'info');
      A.pintarPagina(); A.pintarPagina();
      // en el teléfono la línea puede cambiar de grupo (de «Pagadas» a «Revisa antes de aprobar»): queda a la vista
      requestAnimationFrame(() => { const el = document.getElementById('lunes-l' + i); if (el && enTel()) el.scrollIntoView({ block: 'nearest', behavior: suave() }); });
      if (P.recien !== null) { const j = P.recien; P.recien = null; requestAnimationFrame(() => requestAnimationFrame(() => { const el = $(`.lfila[data-i="${j}"]`); if (el) el.classList.add('pagada'); })); }
    }
    else if (a === 'explica') { P.explica = P.explica === i ? null : i; A.pintarPagina(); }
    else if (a === 'verificar') verificarCon(prov(D.LUNES[i].p), cuentaDe(D.LUNES[i]), () => { verificarCuentas(D.LUNES[i].p); P.explica = null; A.pintarPagina(); A.aviso('Cuenta verificada. Ya puedes marcar el pago.'); });
    else if (a === 'duda') responderDuda(b);
    else if (a === 'duda-deshacer') { if (!A.deshacerUT('duda:' + b.dataset.d)) { A.aviso('Ya pasaron los 10 segundos: para cambiarlo, toca «Reabrir».', 'info'); A.pintarPagina(); if (S.ficha) A.pintarFicha(); } }
    else if (a === 'duda-reabrir') reabrirDuda(b.dataset.d);
    else if (a === 'ver-cap') verCaptura(i, b.dataset.k);
    else if (a === 'ir') irA(b.dataset.arg);
    else if (a === 'aprobar') aprobarYEnviar('lunes');
    else if (a === 'reintentar') reintentar('lunes');
    else if (a === 'reabrir') reabrir('lunes');
    else if (a === 'dejar') dejarComoEstaba('lunes');
    else if (a === 'sinred') { P.sinRed = !P.sinRed; A.pintarPagina(); A.aviso(P.sinRed ? 'Prototipo: el próximo envío al grupo va a fallar, como si se cayera la conexión.' : 'Prototipo: el envío al grupo vuelve a salir.', 'info'); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && P.menu !== null) { P.menu = null; A.pintarPagina(); } });
  // pagar la nómina: marcar persona por persona, verificar una cuenta nueva, aprobar y enviar de una vez, y cambiar el pago (como los proveedores)
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pn]');
    if (!b) { if (PN.menu !== null && !e.target.closest('.c-cuenta') && S.ruta === 'pagos') { PN.menu = null; A.pintarPagina(); } return; }
    const i = +b.dataset.i; const a = b.dataset.pn; const l = PNL()[i];
    // aprobado, el pago no se toca: la cuenta de cada persona queda con candado
    if (!editable(PN) && ['menu', 'pick'].includes(a)) { PN.menu = null; ACC['lote-cerrado']('nomina'); return; }
    if (a === 'menu') { PN.menu = PN.menu === i ? null : i; A.pintarPagina(); const mm = $('#main .menu'); if (mm) mm.scrollIntoView({ block: 'nearest' }); const f = $('.menu button'); if (f) f.focus({ preventScroll: true }); }
    else if (a === 'pick') {
      const k = b.dataset.c || null; const antes = l.c; l.c = k; PN.menu = null; if (k && k !== antes) PN.recien = i;
      // como en los proveedores: si cambia de dónde salió, la captura anterior ya no casa y el socio solo vale para SOCIO o APORTE
      const soltada = k !== antes && (l.cap || l.capBs != null); if (soltada) { delete l.cap; delete l.capBs; }
      if (k !== antes && !DE_SOCIO.includes(k)) delete l.socio;
      A.auditar({ modulo: 'Pagar la nómina', registro: empDe(l.e).nombre, campo: 'sale de', antes: antes || 'sin pagar', despues: k || 'sin pagar' });
      if (soltada) A.aviso(k ? 'La captura que había salió de ' + antes + ': ya no casa. Sube la de ' + k + '.' : 'Quitaste la marca: la captura que había ya no casa con este pago.', 'info');
      A.pintarPagina(); A.pintarPagina();
      if (PN.recien !== null) { const j = PN.recien; PN.recien = null; requestAnimationFrame(() => requestAnimationFrame(() => { const el = $(`.lfila[data-n="${j}"]`); if (el) el.classList.add('pagada'); })); }
    }
    else if (a === 'explica') { PN.explica = PN.explica === i ? null : i; A.pintarPagina(); }
    else if (a === 'verificar') A.pedirCodigo({ que: 'Cuenta nueva de ' + esc(empDe(l.e).nombre) + ' · ' + esc(empDe(l.e).cuenta), det: 'Confirmas que hablaste con ' + esc(empDe(l.e).nombre.split(' ')[0]) + ' y que la cuenta es suya (' + aNombreDe(empDe(l.e)) + ').', boton: 'Ya confirmé con la persona' }).then(() => { verificarCuentaEmp(l.e); PN.explica = null; A.pintarPagina(); A.aviso('Cuenta verificada. Ya puedes marcar el pago.'); }).catch(() => {});
    else if (a === 'ir') irA(b.dataset.arg);
    else if (a === 'aprobar') aprobarYEnviar('nomina');
    else if (a === 'reintentar') reintentar('nomina');
    else if (a === 'reabrir') reabrir('nomina');
    else if (a === 'dejar') dejarComoEstaba('nomina');
    else if (a === 'sinred') { PN.sinRed = !PN.sinRed; A.pintarPagina(); A.aviso(PN.sinRed ? 'Prototipo: el próximo envío al grupo va a fallar, como si se cayera la conexión.' : 'Prototipo: el envío al grupo vuelve a salir.', 'info'); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && PN.menu !== null) { PN.menu = null; A.pintarPagina(); } });
  // aprobar el cambio desde el pendiente de Alejandro (Mis pendientes o Inicio): la misma ventana del código, con solo la diferencia
  ACC['lote-aprobar'] = cual => aprobarYEnviar(DEF[cual] ? cual : 'lunes');
  ACC['linea-nueva'] = () => !editable(P) ? ACC['lote-cerrado']('lunes') : A.aviso('Jose puede agregar o quitar líneas antes de aprobar el lote; queda el motivo. (Simulado)', 'info');
  FICHAS.lineapago = i => {
    // las facturas que cubre: las abiertas y, si el lote ya salió, las que pagó (con lo que debían antes de pagarse)
    const r = D.LUNES[i]; const pv = prov(r.p); const facts = facturasDe(r);
    const retIva = r2(facts.reduce((s, f) => s + (f.ret ? f.ret.usd : 0), 0)), retIslr = r2(facts.reduce((s, f) => s + (f.retIslr ? f.retIslr.usd : 0), 0));
    const saldo = r2(facts.reduce((s, f) => s + saldoDelLote(f), 0)); const brutas = r2(saldo + retIva + retIslr);
    const c = cuentaDe(r); const ops = activas(pv); const pend = facts.filter(f => f.retPend);
    const distinta = r.cap != null && Math.abs(r.cap - r.m) >= 0.005; const com = comDe(r);
    const otra = r.duda && P.pollos !== 'devuelto' && r.intento2 ? ` <small class="tenue">y otra igual: ref. ${esc(r.intento2.ref)}</small>` : '';
    const capTxt = r.cap != null ? `Sí · ref. ${refDe(i)} · dice ${dinero(r.cap, 'usd')}${r.capBs ? ` <small class="tenue">(${dinero(r.capBs, 'bs')})</small>` : ''}${distinta ? ' ' + tag('No cuadra', 'aviso') : ''}${otra}` : r.c ? tag('Falta la captura', 'aviso') : 'Todavía no';
    // pagado en efectivo o por Binance no va a su cuenta del banco
    const ctaProv = r.c === 'BOV' ? { l: 'Cómo se le paga', v: 'Se le entrega en efectivo, con recibo firmado' }
      : r.c === 'BIN' ? { l: 'Cuenta del proveedor', v: 'Su Binance ' + tag('Falta en su ficha', 'aviso') }
      : { l: 'Cuenta del proveedor', v: c ? `<span><b>${esc(etiq(c))}</b>${c.nueva ? ' ' + tag('Por verificar', 'alerta') : ''}<br><small class="tenue">${titularTxt(c)}</small></span>` : '—', campo: ops.length > 1 ? { k: 'cta', tipo: 'select', opciones: ops.map(x => [etiq(x), etiq(x) + ' · ' + x.titular]), sensible: true } : undefined };
    const filas = (retIva || retIslr ? [{ l: 'Facturas', v: dinero(brutas, 'usd') }] : [])
      .concat(retIva ? [{ l: '− Retención de IVA', v: `${dinero(-retIva, 'usd')} <small class="tenue">se le paga al SENIAT</small>` }] : [])
      .concat(retIslr ? [{ l: '− Retención de ISLR', v: `${dinero(-retIslr, 'usd')} <small class="tenue">se le paga al SENIAT</small>` }] : []).concat([
      { l: 'A pagar ($)', v: dinero(r.m, 'usd') + (retIva || retIslr ? ` <small class="tenue">= facturas − ${retIva && retIslr ? 'retenciones' : 'retención'}</small>` : '') + (Math.abs(r.m - saldo) >= 0.005 ? ' ' + tag('Distinto de las facturas', 'aviso') : ''), campo: { k: 'm', tipo: 'dinero', mon: 'usd', obligatorio: true } },
      { l: 'Moneda del pago', v: r.c ? `${monedaDe(r.c)} <small class="tenue">${enMoneda(r.c, r.m)}</small>` : 'Depende de la cuenta de donde salga' },
      ...(DE_SOCIO.includes(r.c) ? [{ l: 'Qué socio', v: r.socio ? esc(r.socio) : tag('Falta decir cuál', 'aviso'), campo: { k: 'socio', tipo: 'select', opciones: [['', 'Falta decir cuál']].concat(D.SOCIOS.map(s => [s.nombre, s.nombre])) } }] : []),
      ctaProv,
      { l: 'Comisión del banco', v: r.cap == null ? '—' : com ? dinero(com, 'bs') : BANCO_DE[r.c] ? dinero(0, 'bs') + ' <small class="tenue">mismo banco</small>' : 'No aplica' },
      { l: 'Captura casada', v: capTxt }]);
    // con el lote aprobado la línea queda con candado: el monto, la cuenta, el socio, dividirla y quitarla, hasta tocar «Cambiar el lote»
    const cerrado = !editable(P); const fP = fase(P);
    // el estado, el mismo de la lista: con la duda sin resolver dice «Por revisar», no «Pagado»
    const cambiada = difCambio('lunes').some(x => x.i === +i);
    const [et, tono] = estadoDe(r, cambiada);
    const tagTxt = bloq(r) ? 'Cuenta por verificar' : et === 'Pagado' ? 'Pagado desde ' + r.c : et === 'Por revisar' ? 'Por revisar: aparece dos veces' : et;
    return { titulo: pv.nombre, sub: 'Línea del lunes · ' + esc(r.f), mod: 'pagos', obj: r, registro: 'Línea ' + pv.nombre,
      tags: [[tagTxt, tono]],
      aviso: (bloq(r) ? `<p class="nota alerta">${ic('candado', 's')}<span><b>Cuenta por verificar.</b> ${esc(c.nueva)}. Llama al proveedor a su número de siempre antes de pagarle.</span></p>` : '')
        // la misma duda de la lista, arriba de todo: las dos capturas con las mismas referencias de «Capturas del lote», las facturas y la respuesta
        + (r.duda ? dudaHtml(+i, 'ficha') : '')
        + (cerrado && puede('pagos', 'editar') ? `<p class="nota gris">${ic('candado', 's')}<span><b>${fP === 'enviado' ? 'El lote ya salió al grupo.' : 'El lote está aprobado.'}</b> Para cambiar esta línea, toca «Cambiar el lote» en la lista${fP === 'enviado' ? ': la corrección también sale al grupo' : ''}.</span></p>` : ''),
      bloques: [
        { titulo: 'Facturas que cubre', html: `<ul class="lista">${facts.map(f => `<li><button class="fila" data-abrir="factura:${f.id}"><span class="lead${f.pago && f.pago.lote === LOTE ? ' ok' : ''}">${ic(f.pago && f.pago.lote === LOTE ? 'check' : 'archivo')}</span><span class="medio"><b>N.º ${esc(f.num)}</b><small>Vence ${esc(f.vence)}${retsDe(f) ? ` · ${dinero(f.monto, 'usd')} − retención ${dinero(retsDe(f), 'usd')}` : ''}${f.pago && f.pago.lote === LOTE ? (f.pago.parcial ? ` · pagada en parte: quedan ${dinero(f.saldo, 'usd')}` : ' · pagada en este lote') : ''}</small></span><span class="monto">${dinero(saldoDelLote(f), 'usd')}</span></button></li>`).join('')}</ul>` },
        { titulo: 'El pago', filas },
        pend.length ? { html: `<p class="nota aviso">${ic('alerta', 's')}<span>Falta emitir la retención de IVA de la factura N.º ${pend.map(f => `${esc(f.num)} (${f.retPend.pct} %, ≈ ${dinero(f.retPend.usd, 'usd')})`).join(', ')}. Cuando se emita, baja de lo que se le paga.</span></p>` } : { oculto: true },
      ],
      bloqueada: cerrado, bloqueo: fP === 'enviado' ? 'El lote ya salió al grupo: esta línea no se edita. Para corregirla, toca «Cambiar el lote» en la lista: la corrección también sale al grupo.' : 'El lote está aprobado: esta línea no se edita. Para cambiar algo, toca «Cambiar el lote» en la lista.',
      acciones: [{ txt: 'Dividir en dos cuentas', acc: cerrado ? 'lote-cerrado' : 'pronto', arg: cerrado ? 'lunes' : undefined, icono: 'mas', solo: 'editar', bloq: cerrado }, { txt: 'Quitar de la lista', acc: cerrado ? 'lote-cerrado' : 'quitar-linea', arg: cerrado ? 'lunes' : i, icono: 'anular', solo: 'editar', bloq: cerrado }],
      alGuardar: cambios => { if (cambios.some(x => x.r.campo.k === 'cta') && bloq(r)) r.c = null; } };
  };
  ACC['quitar-linea'] = i => !editable(P) ? ACC['lote-cerrado']('lunes') : A.pedirMotivo({ titulo: 'Quitar de la lista', texto: 'La factura sigue abierta: solo sale de la lista de hoy.', boton: 'Quitar' }).then(m => { A.auditar({ modulo: 'Pagos de los lunes', registro: prov(D.LUNES[i].p).nombre, campo: 'lista', antes: 'en la lista', despues: 'quitada', motivo: m }); A.aviso('Quitada de la lista de hoy. (Simulado: la fila sigue para que la veas)'); A.cerrarFicha(); }).catch(() => {});
  // una persona de la lista de la nómina: el monto viene de la nómina aprobada y no se edita aquí
  const soloSueldos = (titulo, sub) => ({ titulo, sub, mod: 'pagos', bloques: [{ html: `<p class="nota gris">${ic('candado', 's')}<span>El detalle por persona lo ven el dueño, RRHH y contabilidad.</span></p>` }] });
  FICHAS.pagonom = i => {
    if (!puede('nomina', 'sueldos')) return soloSueldos('Pago de la nómina', 'Pagar la nómina');
    const l = PNL()[+i]; const e = empDe(l.e); const m = netoDe(l); const cap = capNom(l); const bl = bloqNom(l);
    const distinta = cap != null && Math.abs(cap - m) >= 0.005; const com = comNom(l);
    const capTxt = cap != null ? `Sí · ref. ${refNom(+i)} · dice ${dinero(cap, 'usd')}${l.capBs != null ? ` <small class="tenue">(${dinero(l.capBs, 'bs')})</small>` : ''}${distinta ? ' ' + tag('No cuadra', 'aviso') : ''}` : l.c ? tag('Falta la captura', 'aviso') : 'Todavía no';
    const cerrado = !editable(PN); const fN = fase(PN);
    const [et, tono] = estadoNom(l, difCambio('nomina').some(x => x.i === +i));
    return { titulo: e.nombre, sub: 'Pagar la nómina · ' + (e.formal ? 'corrida formal' : 'corrida interna') + ' · N.º ' + (+i + 1) + ' del reporte', mod: 'pagos', sensible: 'sueldos', obj: l, registro: 'Pago de nómina · ' + e.nombre,
      tags: [[bl ? 'Cuenta por verificar' : et === 'Pagado' ? 'Pagado desde ' + l.c : et, tono]],
      aviso: (bl ? `<p class="nota alerta">${ic('candado', 's')}<span><b>Cuenta por verificar.</b> ${esc(e.cuentaNueva)}. Confírmala con la persona antes de pagarle.</span></p>` : '')
        + (cerrado && puede('pagos', 'editar') ? `<p class="nota gris">${ic('candado', 's')}<span><b>${fN === 'enviado' ? 'El pago ya salió al grupo.' : 'El pago está aprobado.'}</b> Para cambiar algo, toca «Cambiar el pago» en la lista${fN === 'enviado' ? ': la corrección también sale al grupo' : ''}.</span></p>` : ''),
      bloques: [
        { titulo: 'El pago', filas: [
          { l: 'A pagar ($)', v: dinero(m, 'usd') + ' <small class="tenue">el neto de su recibo</small>' },
          { l: 'Moneda del pago', v: l.c ? `${monedaDe(l.c)} <small class="tenue">${enMoneda(l.c, m)}</small>` : 'Depende de la cuenta de donde salga' },
          ...(DE_SOCIO.includes(l.c) ? [{ l: 'Qué socio', v: l.socio ? esc(l.socio) : tag('Falta decir cuál', 'aviso'), campo: { k: 'socio', tipo: 'select', opciones: [['', 'Falta decir cuál']].concat(D.SOCIOS.map(s => [s.nombre, s.nombre])) } }] : []),
          { l: 'Cuenta de la persona', v: `<span><b>${esc(e.cuenta)}</b>${bl ? ' ' + tag('Por verificar', 'alerta') : ''}<br><small class="tenue">${aNombreDe(e)}${e.cuentaVerificada ? ' · ' + esc(e.cuentaVerificada) : ''}</small></span>` },
          { l: 'Comisión del banco', v: cap == null ? '—' : com ? dinero(com, 'bs') : BANCO_DE[l.c] ? dinero(0, 'bs') + ' <small class="tenue">mismo banco</small>' : 'No aplica' },
          { l: 'Captura casada', v: capTxt }] },
        { html: `<button class="enlace" data-abrir="recibo:${e.id}">Ver su recibo ${ic('derecha', 's')}</button><p class="muted">El monto sale de la nómina aprobada: si está mal, se corrige en la nómina, no aquí. La captura se casa con la persona por su cuenta, el titular y el monto.</p>` }],
      bloqueada: cerrado, bloqueo: fN === 'enviado' ? 'El pago ya salió al grupo: esta línea no se edita. Para corregirla, toca «Cambiar el pago» en la lista: la corrección también sale al grupo.' : 'El pago está aprobado: esta línea no se edita. Para cambiar algo, toca «Cambiar el pago» en la lista.' };
  };
  FICHAS.capturas = id => {
    if (id === 'nomina') {
      if (!puede('nomina', 'sueldos')) return soloSueldos('Capturas de la nómina', 'Pagar la nómina');
      const qn = cuadreNom();
      const filas = PNL().map((l, i) => ({ l, i })).filter(x => x.l.c).map(({ l, i }) => { const e = empDe(l.e); const cap = capNom(l); const dif = cap != null && Math.abs(cap - netoDe(l)) >= 0.005;
        return { celdas: [`<b>${esc(e.nombre)}</b><small>${cap != null ? 'Ref. ' + refNom(i) + ' · ' : ''}desde ${l.c} · a ${esc(e.cuenta)}${familiar(e) ? ' (' + esc(e.titular.replace(/^Su /, 'su ')) + ')' : ''}</small>`, cap != null ? dinero(cap, 'usd') : '—', cap == null ? tag('Falta la captura', 'aviso') : dif ? tag('No cuadra', 'aviso') : tag('Casada', 'ok')] }; });
      return { titulo: 'Capturas de la nómina', sub: 'Pagar la nómina · ' + qn.n + ' leídas', mod: 'pagos', sensible: 'sueldos',
        bloques: [{ html: A.tabla({ cols: [{ t: 'Captura', cls: 'p' }, { t: 'Monto', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas, vacio: 'Todavía no hay pagos marcados.' }) },
          { html: '<p class="muted">De cada captura se lee la cuenta que recibe, el titular, la referencia y el monto, y se casa con la persona por la cuenta de su ficha. Un pago a la cuenta de un familiar se reconoce por el titular anotado en la ficha. Si la cuenta que recibe no es la de la persona, avisa.</p>' }] };
    }
    const q = cuadre(); const pl = pollos();
    const filas = D.LUNES.map((r, i) => ({ r, i })).filter(x => x.r.c).map(({ r, i }) => {
      const c = cuentaDe(r); const dif = r.cap != null && Math.abs(r.cap - r.m) >= 0.005;
      const a = r.c === 'BOV' ? ' · en efectivo, con recibo' : r.c === 'BIN' ? ' · a su Binance' : c ? ' · a ' + esc(etiq(c)) + (c.otro ? ' (' + esc(c.titular) + ')' : '') : '';
      return { celdas: [`<b>${esc(prov(r.p).nombre)}</b><small>${r.cap != null ? 'Ref. ' + refDe(i) + ' · ' : ''}${r.hora ? esc(r.hora) + ' · ' : ''}desde ${r.c}${a}</small>`, r.cap != null ? dinero(r.cap, 'usd') : '—', r.cap == null ? tag('Falta la captura', 'aviso') : r.duda && !P.dudas[r.duda] ? tag('Duda', 'aviso') : dif ? tag('No cuadra', 'aviso') : tag('Casada', 'ok')] };
    });
    if (pl && pl.c) { const o = pl.intento2 || {}; filas.push({ celdas: [`<b>${esc(prov(pl.p).nombre)} · 2.º intento</b><small>Ref. ${esc(o.ref || '—')} · ${o.hora ? esc(o.hora) + ' · ' : ''}desde ${pl.c} · el mismo monto</small>`, dinero(pl.cap ?? pl.m, 'usd'), !P.pollos ? tag('Por revisar', 'aviso') : P.pollos === 'dos' ? tag('Segundo pago', 'aviso') : tag('Devuelto por el banco', '')] }); }
    filas.push({ celdas: ['<b>Traspaso de BVCA a BVCE</b><small>Ref. 00418822 · entre cuentas nuestras</small>', '—', tag('Aparte: no suma', '')] });
    filas.push({ celdas: ['<b>Línea del estado de cuenta</b><small>Una comisión del banco: no es un pago</small>', '—', tag('Separada', '')] });
    return { titulo: 'Capturas del lote', sub: 'Pagos de los lunes · ' + leidas(q) + ' leídas', mod: 'pagos',
      bloques: [{ html: A.tabla({ cols: [{ t: 'Captura', cls: 'p' }, { t: 'Monto', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas }) },
        { html: '<p class="muted">De cada captura se lee: beneficiario, cuenta que recibe, referencia, monto y comisión. Se separan las líneas del estado de cuenta y las pantallas que no son pagos; una planilla del SENIAT entra como pago de impuesto desde la cuenta de la empresa, con su número de planilla. Si la cuenta de origen de la captura no es la que marcaste, avisa.</p><p class="muted">Un pago a otra cuenta del proveedor, o a nombre de otra persona, se reconoce con las cuentas de su ficha.</p>' }] };
  };
  // la hoja 1 del PDF lleva el total que se aprobó (el mismo del sello y del mensaje) y, si se corrigió, la corrección
  const aprobadoPdf = cual => { const X = DEF[cual].X(); const q = DEF[cual].cuadre(); const t = X.tachados[X.tachados.length - 1];
    if (X.aprobado && X.aprobadoEn) return `<p class="pdf-aprobado">Aprobado: <b>${dinero(X.aprobadoEn.total, 'usd')}</b> · ${esc(X.aprobadoEn.quien)} · ${X.aprobadoEn.dia.toLowerCase()} ${X.aprobadoEn.hora}${t ? ` · antes ${dinero(t.total, 'usd')}` : ''}</p>`;
    return `<p class="pdf-aprobado por">${X.cambio ? 'Cambio por aprobar' : 'Por aprobar'}: <b>${dinero(q.lista, 'usd')}</b>${X.cambio ? ` · antes ${dinero(X.cambio.base.total, 'usd')}` : ''} · vista previa</p>`; };
  const correccionesPdf = cual => DEF[cual].X().mensajes.filter(m => m.tipo === 'correccion' && m.estado === 'confirmado' && m.pe.dif).map(m => `<li>Corrección de las ${esc(m.hora)}: ${esc(m.pe.dif.join(' · '))}.</li>`).join('');
  // para «¿Llegamos a la nómina?» del Inicio: lo que falta pagar del lunes de hoy (las líneas sin marcar, con el mismo cuadre de esta
  // pantalla), el total del lote de hoy y los lotes anteriores (los mismos de «Lotes anteriores»)
  A.faltaLunes = () => { const q = cuadre(); return { n: q.sin.length, m: q.sinM, lineas: q.sin.map(r => ({ nombre: prov(r.p).nombre, m: r.m, v: r.v })) }; };
  A.totalLunes = () => r2(total());
  A.lotesAnteriores = () => LOTES.map(([f, n, t]) => ({ f, n, t }));
  // lo que leen Inicio y Mis pendientes: en qué va el lote del lunes (lo mismo que dice la barra del teléfono) y el cambio por aprobar
  A.estadoLunes = () => {
    const f = fase(P); const q = cuadre(); const sin = q.sin.length; const resumen = pagosTxt(pagadas('lunes')) + ' · ' + dinero(q.lista, 'usd') + (sin ? ' · ' + sin + ' sin pagar' : '');
    if (f === 'enviado') return { txt: 'Enviado al grupo a las ' + P.enviadoEn.hora + ' · ' + resumen, tag: ['Enviado', 'ok'], corto: 'enviado a las ' + P.enviadoEn.hora, tono: '' };
    if (f === 'fallo') return { txt: 'Aprobado, pero no salió al grupo · falta reintentar el envío', tag: ['No salió', 'alerta'], corto: 'no salió al grupo', tono: 'alerta' };
    if (f === 'cambio') { const dif = difCambio('lunes'); return dif.length ? { txt: (dif.length === 1 ? '1 cambio' : dif.length + ' cambios') + ' por aprobar · ' + dinero(P.cambio.base.total, 'usd') + ' → ' + dinero(q.lista, 'usd'), tag: ['Por aprobar', 'aviso'], corto: 'cambio por aprobar', tono: 'aviso' } : { txt: 'Se reabrió para cambiarlo · todavía sin cambios', tag: ['Reabierto', 'aviso'], corto: 'reabierto para cambiarlo', tono: 'aviso' }; }
    const bq = bloqueoDe('lunes');
    if (bq) return { txt: bq.txt + ' · pagado ' + dinero(q.lista, 'usd') + ' de ' + dinero(total(), 'usd'), tag: ['Por resolver', 'aviso'], corto: bq.txt.charAt(0).toLowerCase() + bq.txt.slice(1), tono: 'aviso' };
    return { txt: (puede('pagos', 'aprobar') ? 'Aprobar y enviar ' : 'Por aprobar: ') + resumen, tag: ['Por aprobar', 'aviso'], corto: 'por aprobar', tono: 'aviso' };
  };
  A.cambioLote = cual => { const d = DEF[cual]; if (!d || !d.X().cambio) return null; const bq = bloqueoDe(cual); return { html: cajaCambio(cual, { enFicha: true }), puede: puede('pagos', 'aprobar') && !bq, razon: bq ? bq.razon : '', boton: botonAprobar(cual) }; };
  A.resumenCambio = (cual, sub) => { const d = DEF[cual]; if (!d || !d.X().cambio) return sub; const dif = difCambio(cual); return sub + (dif.length ? ' · ' + dif.map(x => x.txt).join(' · ') : ' · todavía sin cambios'); };
  // para la prueba automática: el estado de los dos lotes y cómo volverlos al principio
  A.PAGOS = { P, PN, fase, reiniciar: () => { Object.assign(P, nuevoLunes()); Object.assign(PN, nuevoLote()); } };
  FICHAS.pdf = id => {
    // la hoja 1 del pago de la nómina: lleva el monto de cada persona, así que solo la ven quienes ven sueldos
    if (id === 'nomina') {
      if (!puede('nomina', 'sueldos')) return soloSueldos('Hoja 1 del PDF', 'Pagar la nómina');
      const q = cuadreNom(); const con = PNL().filter(l => l.c);
      const bsTot = r2(con.filter(l => capNom(l) != null && BANCO_DE[l.c]).reduce((s, l) => s + capNomBs(l), 0)); const comTot = r2(con.reduce((s, l) => s + comNom(l), 0));
      const porCta = Object.keys(CTAS).map(k => [k, r2(con.filter(l => l.c === k && capNom(l) != null).reduce((s, l) => s + capNom(l), 0))]).filter(x => x[1]);
      const html = `<div class="pdf"><header><div><h2>Pagos al personal</h2><p style="font-size:12px;color:#5A6372">Nómina del ${esc(D.PAGO_NOMINA.fecha.toLowerCase())} · hoja 1 · ejemplo con datos inventados</p>${aprobadoPdf('nomina')}</div></header>
        <div class="pdf-cajas"><div>Pagado según las capturas<b>${dinero(q.caps, 'usd')}</b></div><div>En bolívares<b>${dinero(bsTot, 'bs', 0)}</b></div><div>Comprobantes<b>${q.n}</b></div><div>Comisiones cobradas<b>${dinero(comTot, 'bs')}</b><small style="display:block">sobre los ${q.n} comprobantes</small></div></div>
        <div class="tabla-env"><table class="pdf-t"><thead><tr><th>#</th><th>Persona</th><th>Corrida</th><th class="r">Monto</th><th>Origen</th></tr></thead><tbody>${con.map(l => { const e = empDe(l.e); const cap = capNom(l); return `<tr><td>${PNL().indexOf(l) + 1}</td><td>${esc(e.nombre)}${familiar(e) ? ` <small style="color:#5A6372">(a ${esc(e.titular.replace(/^Su /, 'su '))})</small>` : ''}</td><td>${e.formal ? 'Formal' : 'Interna'}</td><td class="r">${cap != null ? dinero(cap, 'usd') : 'falta la captura'}</td><td><span class="acct" data-c="${l.c}">${l.c}</span></td></tr>`; }).join('')}</tbody></table></div>
        <ol class="pdf-nota"><li>${q.dif ? `Cuadre: lista ${dinero(q.tot, 'usd')} − sin pagar ${dinero(q.sinM, 'usd')} = ${dinero(q.lista, 'usd')}; las capturas suman ${dinero(q.caps, 'usd')}. Diferencia de ${dinero(Math.abs(q.dif), 'usd')}: ${PN.nota ? '«' + esc(PN.nota) + '»' : 'falta la nota (se escribe al aprobar)'}.` : `Cuadre: lista ${dinero(q.tot, 'usd')} − sin pagar ${dinero(q.sinM, 'usd')} = suma de las capturas ${dinero(q.caps, 'usd')}.`}</li>
          ${porCta.length ? `<li>Por cuenta: ${porCta.map(([k, s]) => k + ' ' + dinero(s, 'usd')).join(' · ')}.</li>` : ''}
          <li>En el orden del reporte de RRHH: primero la corrida formal y después la interna.</li>
          ${correccionesPdf('nomina')}<li>Queda por pagar: ${q.sin.length ? q.sin.map(l => esc(empDe(l.e).nombre)).join(', ') : 'nadie'}.</li></ol>
        <p style="font-size:11px;color:#5A6372">Las hojas siguientes llevan las capturas en 2 columnas, cada una con la etiqueta de color de su cuenta.</p></div>`;
      return { titulo: 'Hoja 1 del PDF', sub: 'Pagar la nómina · vista previa', mod: 'pagos', sensible: 'sueldos', bloques: [{ html }], acciones: [{ txt: 'Descargar PDF', acc: 'descargar', arg: 'pdfnom|' + D.PAGO_NOMINA.corto, icono: 'descargar' }] };
    }
    // una nómina ya pagada: sus corridas, cada una con su total (eso sí se ve agrupado); el PDF trae el monto de cada persona
    if (String(id).startsWith('nom|')) {
      const f = id.slice(4); const x = lotesNomina().find(z => z.f === f) || { f, cs: [], personas: 0, usd: 0 }; const ve = puede('nomina', 'sueldos');
      return { titulo: 'Nómina del ' + f, sub: 'Pagos de los lunes · nómina enviada', mod: 'pagos', tags: [['Enviado', 'ok']],
        bloques: [{ titulo: 'Corridas', html: `<ul class="lista">${x.cs.map(c => `<li><button class="fila" data-abrir="corrida:${c.id}"><span class="lead">${ic(c.tipo === 'premio' ? 'estrella' : 'nomina')}</span><span class="medio"><b>${esc(A.corridas.nombre(c))}</b><small>${c.personas} ${c.personas === 1 ? 'persona' : 'personas'}</small></span><span class="monto">${A.corridas.monto(c)}</span></button></li>`).join('')}</ul>` },
          { filas: [{ l: 'Total', v: '≈ ' + dinero(x.usd, 'usd') + ' <small class="tenue">a la tasa de ese día</small>' }, { l: 'Lo aprobó', v: 'Alejandro, con su código' }, { l: 'Cuadre', v: tag('Cuadró con las capturas', 'ok') }] },
          ve ? { titulo: 'Archivo', adjuntos: ['Pagos al personal ' + f + '.pdf'] } : { html: '<p class="muted">El PDF trae el monto de cada persona: lo ven el dueño, RRHH y contabilidad.</p>' },
          { html: '<p class="muted">Un pago enviado ya no se edita. Si hubo un error, se hace una corrida de reemplazo enlazada a esta.</p>' }],
        acciones: ve ? [{ txt: 'Descargar PDF', acc: 'descargar', arg: 'pdfnom|' + f, icono: 'descargar' }] : [] };
    }
    // un lote que ya salió: su PDF quedó guardado y no se vuelve a armar
    if (id !== 'lunes') {
      const l = LOTES.find(x => x[0] === id) || [id, 0, 0];
      return { titulo: 'Lote del ' + l[0].toLowerCase(), sub: 'Pagos de los lunes · enviado', mod: 'pagos', tags: [['Enviado', 'ok']],
        bloques: [{ filas: [{ l: 'Pagos', v: l[1] }, { l: 'Total pagado', v: dinero(l[2], 'usd') }, { l: 'Lo aprobó', v: 'Alejandro, con su código' }, { l: 'Cuadre', v: tag('Cuadró con las capturas', 'ok') }] }, { titulo: 'Archivo', adjuntos: ['Pagos del ' + l[0].toLowerCase() + '.pdf'] },
          { html: '<p class="muted">Un lote enviado ya no se edita. El PDF guardado lleva la hoja 1 con el cuadre y las capturas en 2 columnas.</p>' }],
        acciones: [{ txt: 'Descargar PDF', acc: 'descargar', arg: 'pdf|' + l[0], icono: 'descargar' }] };
    }
    const q = cuadre(); const pl = pollos();
    const filas = D.LUNES.filter(r => r.c).map(r => ({ r, monto: r.cap })).concat(q.doble ? [{ r: q.doble, monto: q.doble.cap, seg: true }] : []);
    const con = filas.filter(x => x.monto != null);
    const bsTot = r2(con.filter(x => BANCO_DE[x.r.c]).reduce((s, x) => s + capBs(x.r), 0)); const comTot = r2(con.reduce((s, x) => s + comDe(x.r), 0));
    const porCta = Object.keys(CTAS).map(k => [k, r2(con.filter(x => x.r.c === k).reduce((s, x) => s + x.monto, 0))]).filter(x => x[1]);
    const fr = retDeLista(true);
    const quien = x => { const c = cuentaDe(x.r); return esc(prov(x.r.p).nombre) + (x.seg ? ' (2.º pago)' : '') + (c && c.otro ? ` <small style="color:#5A6372">(a ${esc(c.titular)})</small>` : ''); };
    const html = `<div class="pdf"><header><div><h2>Comprobantes de pago</h2><p style="font-size:12px;color:#5A6372">Lunes 5 de octubre de 2026 · hoja 1 · datos inventados</p>${aprobadoPdf('lunes')}</div></header>
      <div class="pdf-cajas"><div>Pagado según las capturas<b>${dinero(q.caps, 'usd')}</b></div><div>En bolívares<b>${dinero(bsTot, 'bs', 0)}</b></div><div>Comprobantes<b>${q.n}</b></div><div>Comisiones cobradas<b>${dinero(comTot, 'bs')}</b><small style="display:block">sobre los ${q.n} comprobantes</small></div></div>
      <div class="tabla-env"><table class="pdf-t"><thead><tr><th>#</th><th>Beneficiario</th><th class="r">Monto</th><th>Origen</th></tr></thead><tbody>${filas.map((x, k) => `<tr><td>${k + 1}</td><td>${quien(x)}</td><td class="r">${x.monto != null ? dinero(x.monto, 'usd') : 'falta la captura'}</td><td><span class="acct" data-c="${x.r.c}">${x.r.c}</span></td></tr>`).join('')}</tbody></table></div>
      <ol class="pdf-nota"><li>${q.dif ? `Cuadre: lista ${dinero(q.tot, 'usd')} − sin pagar ${dinero(q.sinM, 'usd')} = ${dinero(q.lista, 'usd')}; las capturas suman ${dinero(q.caps, 'usd')}. Diferencia de ${dinero(Math.abs(q.dif), 'usd')}: ${P.nota ? '«' + esc(P.nota) + '»' : 'falta la nota (se escribe al aprobar)'}.` : `Cuadre: lista ${dinero(q.tot, 'usd')} − sin pagar ${dinero(q.sinM, 'usd')} = suma de las capturas ${dinero(q.caps, 'usd')}.`}</li>
        ${porCta.length ? `<li>Por cuenta: ${porCta.map(([k, s]) => k + ' ' + dinero(s, 'usd')).join(' · ')}.</li>` : ''}
        ${fr.length ? `<li>Se pagó sin ${retTexto(fr)}: esa parte va al SENIAT (la de IVA en la planilla de IVA y la de ISLR en la declaración de retenciones de ISLR).</li>` : ''}
        <li>Aparte: traspaso de BVCA a BVCE (ref. 00418822); no suma.</li>
        ${P.pollos && pl ? `<li>${esc(prov(pl.p).nombre)}: ${P.pollos === 'dos' ? 'fueron dos pagos de ' + dinero(pl.cap ?? pl.m, 'usd') + '.' : 'el banco devolvió el 2.º intento; cuenta una vez.'}</li>` : ''}
        ${correccionesPdf('lunes')}<li>Queda por pagar: ${q.sin.length ? q.sin.map(r => esc(prov(r.p).nombre)).join(', ') : 'nada'}.</li></ol>
      <p style="font-size:11px;color:#5A6372">Las hojas siguientes llevan las capturas en 2 columnas, cada una con la etiqueta de color de su cuenta.</p></div>`;
    return { titulo: 'Hoja 1 del PDF', sub: 'Vista previa', mod: 'pagos', bloques: [{ html }], acciones: [{ txt: 'Descargar PDF', acc: 'descargar', arg: 'pdf|Lunes 5 oct', icono: 'descargar' }] };
  };
  // exportar pide el código y queda en el registro de accesos (como el paquete fiscal)
  function queSeBaja(arg, el) {
    const a = String(arg || '');
    if (a.startsWith('pdf|')) return 'el PDF de los pagos del ' + a.slice(4).toLowerCase();
    if (a.startsWith('pdfnom|')) return 'el PDF del pago de la nómina del ' + a.slice(7);
    const doc = D.ARCHIVOS.find(x => x.id === a); if (doc) return '«' + doc.nombre + '»';
    let b = el ? el.textContent.replace(/\s+/g, ' ').trim().replace(/^(Descargar|Exportar)\s*/i, '') : '';
    b = !b ? 'el archivo' : /^(el|la|los|las)\s/i.test(b) ? b : 'el ' + b;
    const sb = $('#main .subnav [aria-current="true"]');
    const sub = sb ? (sb.querySelector('.sn-largo') ? sb.querySelector('.sn-largo').textContent : [...sb.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('')).trim() : '';
    const donde = S.ficha && S.ficha.spec ? S.ficha.spec.titulo : [(PANT[S.ruta] || {}).titulo, sub].filter(Boolean).join(' › ');
    return b + (donde ? ' · ' + donde : '');
  }
  ACC.descargar = (arg, el) => {
    const que = queSeBaja(arg, el);
    A.pedirCodigo({ que: 'Descargar ' + esc(que), det: 'Queda anotado en el registro de accesos.', boton: 'Descargar' }).then(() => {
      D.ACCESOS.unshift({ cuando: 'Hoy ' + D.HOY.hora, quien: S.usuario.nombre, que: 'Descargó ' + que + ' (con código)', donde: 'Este equipo' });
      A.aviso('Descarga lista y anotada en el registro de accesos. (Simulado)');
    }).catch(() => {});
  };

  /* =============== PROVEEDORES Y FACTURAS =============== */
  PANT.proveedores = {
    titulo: 'Proveedores y facturas', corto: 'Proveedores', tab: 'Proveedores', grupo: 'Dinero que sale', icono: 'proveedores', mod: 'proveedores', palabras: 'cuentas por pagar compras',
    secciones: [['facturas', 'Facturas', 'factura deuda vencida'], ['proveedores', 'Lista de proveedores', 'rif cuenta bancaria'], ['ajustes', 'Correcciones a Odoo', 'ajuste ajustes corregir'], ['devoluciones', 'Devoluciones', 'reposicion merma']],
    render: (sub = 'facturas') => {
      const abiertas = D.FACTURAS.filter(f => f.saldo > 0);
      const deuda = abiertas.reduce((s, f) => s + f.saldo, 0);
      const vencidas = abiertas.filter(f => f.estado === 'vencida');
      let cuerpo = '';
      if (sub === 'facturas') {
        const f = A.filtroActual('abiertas');
        const lista = D.FACTURAS.filter(x => f === 'todas' || (f === 'abiertas' && x.saldo > 0) || x.estado === f || (f === 'vencidas' && x.estado === 'vencida'));
        const porRevisar = D.FAC_AGENTE.filter(x => x.estado === 'propuesta').length;
        cuerpo = (porRevisar ? `<p class="nota info">${ic('archivo', 's')}<span>El agente leyó ${porRevisar} ${porRevisar === 1 ? 'foto de factura' : 'fotos de facturas'}. No entran a esta lista hasta que Jose o Alejandro las revisen. <button class="enlace" data-abrir="facagente:lote">Revisarlas ${ic('derecha', 's')}</button></span></p>` : '') + A.filtros('t-fac', [['abiertas', 'Por pagar', abiertas.length], ['vencida', 'Vencidas', vencidas.length], ['ajustada', 'Corregidas', D.FACTURAS.filter(x => x.estado === 'ajustada').length], ['pagada', 'Pagadas'], ['todas', 'Todas']], f, 'Buscar factura o proveedor') +
          A.tabla({ id: 't-fac', cols: [{ t: 'Factura', cls: 'p' }, { t: 'Proveedor', cls: 'x' }, { t: 'Fecha', cls: 'x' }, { t: 'Vence', cls: 'x' }, { t: 'Saldo', cls: 'r plata' }, { t: 'Estado', cls: 'e' }],
            filas: lista.map(x => ({ abrir: 'factura:' + x.id, clase: x.anulada ? 'anulada' : '', txt: prov(x.prov).nombre, celdas: [`<b>N.º ${esc(x.num)}</b><small>${esc(prov(x.prov).nombre)}${x.alerta ? ' · ' + ic('alerta', 'xs') + ' ' + esc(x.alerta) : ''}</small>`, esc(prov(x.prov).nombre), esc(x.fecha), esc(x.vence), dinero(x.saldo, 'usd'), A.estadoTag(x.estado)] })) });
      }
      if (sub === 'proveedores') cuerpo = A.filtros('t-prov', null, null, 'Buscar proveedor, RIF o categoría') + A.tabla({ id: 't-prov', cols: [{ t: 'Proveedor', cls: 'p' }, { t: 'Categoría', cls: 'x' }, { t: 'Plazo', cls: 'x' }, { t: 'Cuenta', cls: 'x' }, { t: 'Deuda', cls: 'r plata' }, { t: 'Estado', cls: 'e' }],
        filas: D.PROVEEDORES.map(p => { const a = activas(p); const c = a[0];
          return { abrir: 'proveedor:' + p.id, txt: p.rif + ' ' + p.cat + ' ' + p.cuentas.map(x => x.titular).join(' '), celdas: [`<b>${esc(p.nombre)}</b><small>${esc(p.rif)}</small>`, esc(p.cat), p.plazo ? p.plazo + ' días' : 'De contado', c ? esc(etiq(c)) + (c.nueva ? ' (nueva)' : '') + (a.length > 1 ? ` <small class="tenue">y ${a.length - 1} más</small>` : '') : '—', dinero(deudaDe(p.id), 'usd'), A.estadoTag(p.estado)] }; }) });
      if (sub === 'ajustes') {
        const aj = D.AUDITORIA.filter(a => a.modulo === 'Proveedores');
        cuerpo = `<p class="nota info">${ic('info', 's')}<span>Las facturas y las cuentas que vienen de Odoo se corrigen solo aquí. Queda el valor de Odoo, el nuevo, el motivo y quién lo hizo. La copia de Odoo nunca pisa una corrección: si Odoo cambia ese dato después, aparece un aviso y quien la hizo decide.</span></p>` +
          A.tabla({ cols: [{ t: 'Qué se cambió', cls: 'p' }, { t: 'Antes', cls: 'x' }, { t: 'Después', cls: 'r' }, { t: 'Quién', cls: 'e' }], filas: aj.map(a => ({ abrir: 'cambio:' + a.id, celdas: [`<b>${esc(a.registro)} · ${esc(a.campo)}</b><small>${esc(a.motivo)}</small>`, esc(a.antes), esc(a.despues), esc(a.quien) + '<br><small class="muted">' + esc(a.cuando) + '</small>'] })) });
      }
      if (sub === 'devoluciones') cuerpo = `<p class="nota info">${ic('info', 's')}<span>Mercancía mala que se devuelve. Cada proveedor tiene su trato (por ejemplo, repone la mitad y el resto es merma). Si pasan 3 días sin reponer, avisa a Jose y a Manuel.</span></p>` +
        A.tabla({ cols: [{ t: 'Devolución', cls: 'p' }, { t: 'Trato', cls: 'x' }, { t: 'Monto', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: D.DEVOLUCIONES.map(d => ({ abrir: 'devolucion:' + d.id, celdas: [`<b>${esc(d.que)}</b><small>${esc(prov(d.prov).nombre)} · ${esc(d.fecha)}</small>`, esc(d.trato), dinero(d.monto, 'usd'), A.estadoTag(d.estado) + (d.dias ? ` <small class="muted">${d.dias} días</small>` : '')] })) });
      return `<div class="pagina">${A.cab('Cuentas por pagar', 'Proveedores y facturas', 'Las facturas se copian de Odoo (hoy, a mano los domingos). Aquí se ven, se corrigen con motivo y se pagan el lunes.', A.boton('proveedores', 'Nuevo proveedor', 'data-acc="pronto"', { tono: 'sec', icono: 'mas' }))}
        ${A.lectura('proveedores')}
        <div class="cifras">
          ${A.cifra({ etq: 'Les debemos', valor: dinero(deuda, 'usd', 0), sub: abiertas.length + ' facturas de los últimos 3 meses', ir: 'proveedores/facturas' })}
          ${A.cifra({ etq: 'Vencido', valor: dinero(vencidas.reduce((s, f) => s + f.saldo, 0), 'usd', 0), sub: vencidas.length + (vencidas.length === 1 ? ' factura' : ' facturas'), tono: 'alerta', ir: 'proveedores/facturas' })}
          ${A.cifra({ etq: 'Facturas sin número de control', valor: '2', sub: 'se retiene el 100 % del IVA', tono: 'aviso', abrir: 'factura:f6' })}
          ${A.cifra({ etq: 'Esperando reposición', valor: D.DEVOLUCIONES.filter(d => d.estado === 'esperando').length, sub: 'queso telita · 4 días', ir: 'proveedores/devoluciones' })}
        </div>
        ${A.subnav([['facturas', 'Facturas', abiertas.length, true], ['proveedores', 'Proveedores', D.PROVEEDORES.length, true], ['ajustes', 'Correcciones a Odoo'], ['devoluciones', 'Devoluciones', D.DEVOLUCIONES.filter(d => d.estado === 'esperando').length]], sub)}
        ${cuerpo}</div>`;
    },
  };
  // el monto que trajo Odoo (se guarda una sola vez): el tope de un ajuste se mide contra él, sumando los ajustes chicos
  const montoOdoo = f => f.montoOdoo != null ? f.montoOdoo : f.ajuste ? f.ajuste.antes : f.monto;
  const ajustesDe = f => f.ajustes || (f.ajuste ? [f.ajuste] : []);
  FICHAS.factura = id => {
    // con un pago encima (completo o en parte) ya no se edita: se corrige con un reverso enlazado a ella
    const f = D.FACTURAS.find(x => x.id === id); const pv = prov(f.prov); const pagada = f.estado === 'pagada'; const conPago = pagada || !!f.pago; const odoo = montoOdoo(f);
    // las retenciones bajan el saldo: esa parte se le paga al SENIAT, no al proveedor
    const enlaceRet = x => puede('fiscal') ? `<button class="enlace" data-abrir="retemi:${x.id}">comp. ${esc(x.comp)}</button>` : `<small class="tenue">comp. ${esc(x.comp)}</small>`;
    const ret = (f.ret ? [{ l: 'Retención de IVA (' + f.ret.pct + ' %)', v: `${dinero(-f.ret.usd, 'usd')} <small class="tenue">${dinero(f.ret.bs, 'bs')} a ${fmt(f.ret.tasa)}</small> ${enlaceRet(f.ret)}` }]
      : f.retPend ? [{ l: 'Retención de IVA (' + f.retPend.pct + ' %)', v: tag('Por emitir', 'aviso') + ` <small class="tenue">≈ ${dinero(f.retPend.usd, 'usd')}: baja el saldo cuando se emita</small>` + (puede('fiscal') && f.retPend.id ? ` <button class="enlace" data-abrir="retemi:${f.retPend.id}">Ver la retención por emitir</button>` : '') }] : [])
      .concat(f.retIslr ? [{ l: 'Retención de ISLR (' + f.retIslr.pct + ' %)', v: `${dinero(-f.retIslr.usd, 'usd')} <small class="tenue">${dinero(f.retIslr.bs, 'bs')} a ${fmt(f.retIslr.tasa)}</small> ${enlaceRet(f.retIslr)}` }] : []);
    const pagoTl = f.pago ? [[f.pago.lote, `${f.pago.parcial ? 'Pagada en parte' : 'Pagada'} en el lote del lunes ${esc(f.pago.lote)} ${esc(desdeTxt(f.pago))}${f.pago.parcial ? `: quedan ${dinero(f.saldo, 'usd')}, porque la captura dijo menos.` : '.'}`, f.pago.parcial ? 'aviso' : 'ok']] : [];
    const bloques = [
      { titulo: 'Datos', filas: [{ l: 'Proveedor', v: `<button class="enlace" data-abrir="proveedor:${pv.id}">${esc(pv.nombre)}</button>` }, { l: 'Número', v: esc(f.num) }, { l: 'Número de control', v: esc(f.control), campo: { k: 'control', tipo: 'texto' } }, { l: 'Fecha', v: esc(f.fecha) }, { l: 'Vence', v: esc(f.vence), campo: { k: 'vence', tipo: 'texto' } }, { l: 'Monto ($)', v: dinero(f.monto, 'usd') + (Math.abs(odoo - f.monto) >= 0.005 ? `<span class="cambio"><s>${dinero(odoo, 'usd')}</s> en Odoo</span>` : ''), campo: { k: 'monto', tipo: 'dinero', mon: 'usd', obligatorio: true } }, ...ret, { l: 'Saldo', v: dinero(f.saldo, 'usd') + (retsDe(f) && f.saldo > 0 && !f.pago ? ' <small class="tenue">lo que se le paga al proveedor</small>' : f.pago && f.pago.parcial ? ' <small class="tenue">lo que falta pagarle</small>' : '') }, ...(f.pago ? [{ l: 'Se pagó', v: `En el lote del ${esc(f.pago.lote)} · <span class="acct" data-c="${esc(f.pago.cta)}">${esc(f.pago.cta)}</span>${f.pago.socio ? ' · ' + esc(f.pago.socio) : ''}` }] : []), { l: 'Viene de', v: esc(f.origen) + ' · importada el dom 4 oct' }] },
      { titulo: 'Historial', tiempo: [[f.fecha, 'Se registró en Odoo' + (ajustesDe(f).length ? ' por ' + dinero(odoo, 'usd') : '') + '.']].concat(ajustesDe(f).map(a => [a.cuando.split(' ').slice(0, 3).join(' '), `Ajuste de ${esc(a.quien)}${a.aprobo ? ', aprobado por ' + esc(a.aprobo) : ''}: ${esc(a.campo.toLowerCase())} ${dinero(a.antes, 'usd')} → ${dinero(a.despues, 'usd')}. «${esc(a.motivo)}»`, 'info'])).concat(f.ret ? [[f.ret.fecha, `Retención de IVA de ${dinero(f.ret.bs, 'bs')}: se le paga al SENIAT y baja el saldo.`, 'info']] : []).concat(f.retIslr ? [[f.retIslr.fecha, `Retención de ISLR de ${dinero(f.retIslr.bs, 'bs')}: se le paga al SENIAT y baja el saldo.`, 'info']] : []).concat(pagoTl) },
      { titulo: 'Archivo', adjuntos: [pv.nombre + ' ' + f.num + '.jpg'] },
      conPago ? { html: `<p class="muted">${pagada ? 'Una factura pagada' : 'Una factura con un pago'} ya no se edita. Si algo está mal, se corrige con un reverso enlazado a ella: una nota de crédito del proveedor o el pago que se devolvió.</p>` } : { oculto: true },
    ];
    return { titulo: 'Factura N.º ' + f.num, sub: esc(pv.nombre), mod: 'proveedores', obj: f, registro: 'Factura ' + f.num, tags: [[A.estadoTag(f.estado).replace(/<[^>]+>/g, ''), { vencida: 'alerta', ajustada: 'info', pagada: 'ok', parcial: 'aviso' }[f.estado] || '']].concat(f.pago && f.pago.parcial && f.estado !== 'parcial' ? [['Pago parcial', 'aviso']] : []),
      aviso: f.alerta ? `<p class="nota aviso">${ic('alerta', 's')}<span>${esc(f.alerta)}. Para lo fiscal hay que retenerle el 100 % del IVA o pedirle una factura bien hecha.</span></p>` : '',
      bloques, bloqueada: conPago, bloqueo: pagada ? 'Está pagada: no se edita. Se corrige con un reverso.' : 'Ya tiene un pago: no se edita. Se corrige con un reverso.',
      acciones: conPago ? [{ txt: 'Corregir con un reverso', acc: 'fac-reverso', arg: f.id, icono: 'refrescar', solo: 'editar' }] : [],
      // el ajuste de una factura tiene tope (Parámetros › Límites): si pasa el de quien lo hace, la misma ventana del motivo lo dice y va a Alejandro
      // el ajuste se mide contra lo que trajo Odoo: tres ajustes de $ 45 suman $ 135 y pasan el tope de $ 50
      tope: { limite: 'l5', que: ajustesDe(f).length ? 'Con los ajustes de antes, el cambio sobre el monto de Odoo' : 'Este ajuste', monto: cambios => { const c = cambios.find(x => x.r.campo.k === 'monto'); return c ? Math.abs((c.nuevo || 0) - odoo) : 0; } },
      alGuardar: (cambios, motivo, ctx) => {
        const c = cambios.find(x => x.r.campo.k === 'monto'); if (!c) return; const pr = ctx && ctx.propuesta;
        if (f.montoOdoo == null) f.montoOdoo = odoo; // el de Odoo se guarda una sola vez (antes del primer ajuste)
        const previos = ajustesDe(f); // cada ajuste queda en el historial, no solo el último
        f.ajuste = { campo: 'Monto', antes: c.antes, despues: c.nuevo, motivo, quien: pr ? pr.quien : S.usuario.nombre, aprobo: pr ? S.usuario.nombre : '', cuando: 'Hoy ' + D.HOY.hora };
        f.ajustes = previos.concat([f.ajuste]);
        f.saldo = r2(c.nuevo - retsDe(f)); f.estado = 'ajustada';
        const l = D.LUNES.find(x => x.p === f.prov); if (l && !l.c) l.m = deudaDe(f.prov); // si no se ha pagado, la línea del lunes sigue a la factura
      } };
  };
  /* ---------- facturas que leyó el agente: los agentes proponen (3 oct); Jose o Alejandro las aprueban, las corrigen o las rechazan ---------- */
  const FA = () => D.FAC_AGENTE;
  const FA_ESTADO = { propuesta: ['Por revisar', 'aviso'], aprobada: ['Aprobada', 'ok'], rechazada: ['Rechazada', ''] };
  // la duda del monto se va sola cuando alguien lo corrige; la de una factura repetida se queda
  const dudaViva = x => x.duda && (x.repetida || x.monto === x.leido.monto);
  FICHAS.facagente = id => {
    if (id === 'lote') {
      const pend = FA().filter(x => x.estado === 'propuesta').length;
      return { titulo: 'Facturas leídas por el agente', sub: 'agente-facturas · leídas ' + esc(FA()[0].leida.toLowerCase()), mod: 'proveedores', tags: [[pend ? pend + ' por revisar' : 'Revisadas', pend ? 'aviso' : 'ok']],
        bloques: [{ html: A.tabla({ cols: [{ t: 'Factura', cls: 'p' }, { t: 'Monto', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: FA().map(x => ({ abrir: 'facagente:' + x.id, celdas: [`<b>${esc(prov(x.prov).nombre)} · N.º ${esc(x.num)}</b><small>${esc(x.fecha)}${dudaViva(x) && x.estado === 'propuesta' ? ' · ' + esc(x.repetida ? 'repetida' : 'revisa el monto') : ''}</small>`, dinero(x.monto, 'usd'), tag(...FA_ESTADO[x.estado])] })) }) },
          { html: '<p class="muted">El agente lee las fotos de las facturas y las propone. Nunca aprueba: ninguna entra a las facturas por pagar hasta que Jose o Alejandro la revisen. Toca una para aprobarla, corregirla o rechazarla.</p>' }] };
    }
    const x = FA().find(z => z.id === id); const pv = prov(x.prov); const abierta = x.estado === 'propuesta';
    const leido = (k, f) => String(x[k]) !== String(x.leido[k]) ? ` <span class="cambio"><s>${f(x.leido[k])}</s> leído</span>` : '';
    const rep = x.repetida ? D.FACTURAS.find(f => f.id === x.repetida) : null;
    return { titulo: 'Factura N.º ' + x.num, sub: esc(pv.nombre) + ' · leída por el agente', mod: 'proveedores', obj: x, registro: 'Factura leída ' + x.num, tags: [FA_ESTADO[x.estado]],
      aviso: abierta && dudaViva(x) ? `<p class="nota aviso">${ic('alerta', 's')}<span>${esc(x.duda)}</span></p>` : '',
      bloques: [{ titulo: 'Foto', adjuntos: ['Foto de la factura ' + x.num + '.jpg'] },
        { titulo: 'Lo que leyó', filas: [
          { l: 'Proveedor', v: `<button class="enlace" data-abrir="proveedor:${pv.id}">${esc(pv.nombre)}</button> <small class="tenue">por el RIF ${esc(pv.rif)}</small>` },
          { l: 'Número', v: esc(x.num) + leido('num', esc), campo: { k: 'num', tipo: 'texto' } },
          { l: 'Número de control', v: esc(x.control) + leido('control', esc), campo: { k: 'control', tipo: 'texto' } },
          { l: 'Fecha', v: esc(x.fecha) + leido('fecha', esc), campo: { k: 'fecha', tipo: 'texto' } },
          { l: 'Vence', v: esc(x.vence) + ` <small class="tenue">${pv.plazo ? 'plazo de ' + pv.plazo + ' días' : 'de contado'}</small>` },
          { l: 'Monto ($)', v: dinero(x.monto, 'usd') + leido('monto', v => dinero(v, 'usd')), campo: { k: 'monto', tipo: 'dinero', mon: 'usd', obligatorio: true } }]
          .concat(x.lectura ? [{ l: 'Cómo la leyó', v: esc(x.lectura), largo: true }] : [])
          .concat(rep ? [{ l: 'Ya está como', v: `<button class="enlace" data-abrir="factura:${rep.id}">factura N.º ${esc(rep.num)}</button> <small class="tenue">copia de Odoo</small>` }] : []) },
        { html: abierta ? `<p class="muted">Si leyó mal un dato, corrígelo antes de aprobarla: queda lo leído tachado al lado. Al aprobarla pasa a las facturas por pagar con su foto, a nombre de quien la aprobó.</p>`
          : `<p class="muted">${x.estado === 'aprobada' ? 'La aprobó ' + esc(x.reviso) + '. Pasó a las facturas por pagar con su foto.' : 'La rechazó ' + esc(x.reviso) + ': «' + esc(x.motivo) + '».'}</p>` }],
      editar: 'Corregir', editarTono: 'sec',
      bloqueada: !abierta, bloqueo: x.estado === 'aprobada' ? 'Ya está aprobada: se corrige como cualquier factura, en Proveedores y facturas.' : 'Está rechazada: ya no se corrige.',
      acciones: abierta ? [{ txt: 'Rechazar', acc: 'facag-rechazar', arg: x.id, icono: 'anular', tono: 'ghost', solo: 'editar' }].concat(rep ? [] : [{ txt: 'Aprobar', acc: 'facag-aprobar', arg: x.id, icono: 'candado', tono: 'pri', solo: 'editar' }]) : [] };
  };
  const facagListo = () => { if (FA().every(x => x.estado !== 'propuesta')) D.PENDIENTES.filter(p => p.abrir === 'facagente:lote' && !p.hecho).forEach(p => { p.hecho = 'Revisadas por ' + S.usuario.nombre; }); };
  ACC['facag-aprobar'] = id => {
    const x = FA().find(z => z.id === id); const pv = prov(x.prov);
    const aprobar = () => A.pedirCodigo({ que: 'Factura N.º ' + esc(x.num) + ' de ' + esc(pv.nombre) + ' · ' + dinero(x.monto, 'usd'), det: 'Leída por el agente. Pasa a las facturas por pagar, con su foto.', boton: 'Aprobar ' + dinero(x.monto, 'usd') }).then(() => {
      x.estado = 'aprobada'; x.reviso = S.usuario.nombre; facagListo();
      A.auditar({ modulo: 'Proveedores y facturas', registro: 'Factura leída ' + x.num, campo: 'estado', antes: 'propuesta por el agente', despues: 'aprobada · ' + dinero(x.monto, 'usd') });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Aprobada. Pasa a las facturas por pagar con su foto. (Simulado)');
    }).catch(() => {});
    // si la duda sigue (el monto no se corrigió), primero lo confirma
    if (dudaViva(x)) A.confirmar({ titulo: '¿Aprobarla con la duda?', texto: esc(x.duda) + ' Si el monto está bien así, apruébala igual.', boton: 'Aprobar igual' }).then(aprobar).catch(() => {});
    else aprobar();
  };
  ACC['facag-rechazar'] = id => {
    const x = FA().find(z => z.id === id);
    A.pedirMotivo({ titulo: 'Rechazar la factura N.º ' + x.num, texto: 'No entra a las facturas. El motivo queda en el registro de cambios.', boton: 'Rechazar', tono: 'peligro', valor: x.repetida ? 'Repetida: ya llegó con la copia de Odoo' : '' }).then(m => {
      x.estado = 'rechazada'; x.reviso = S.usuario.nombre; x.motivo = m; facagListo();
      A.auditar({ modulo: 'Proveedores y facturas', registro: 'Factura leída ' + x.num, campo: 'estado', antes: 'propuesta por el agente', despues: 'rechazada', motivo: m });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Rechazada. No entra a las facturas.');
    }).catch(() => {});
  };
  ACC['fac-reverso'] = id => {
    const f = D.FACTURAS.find(x => x.id === id);
    const pagada = f.estado === 'pagada';
    A.pedirMotivo({ titulo: 'Corregir con un reverso', texto: `La factura N.º ${esc(f.num)} ${pagada ? 'sigue pagada' : 'queda con su pago'} y no se toca. Se registra un movimiento al revés, enlazado a ella: una nota de crédito del proveedor o el pago que se devolvió.`, etiqueta: 'Qué hay que corregir', boton: 'Registrar el reverso', codigo: { que: 'Reverso de la factura N.º ' + esc(f.num) + ' · ' + esc(prov(f.prov).nombre), det: 'Queda enlazado a la factura, que no se toca.', boton: 'Registrar el reverso' } }).then(m => {
      A.auditar({ modulo: 'Proveedores', registro: 'Factura ' + f.num, campo: 'reverso', antes: pagada ? 'pagada' : 'con un pago', despues: 'reverso enlazado', motivo: m });
      A.aviso('Reverso registrado y enlazado a la factura, que queda como estaba. (Simulado)');
    }).catch(() => {});
  };
  FICHAS.proveedor = id => {
    const p = D.PROVEEDORES.find(x => x.id === id); const facts = D.FACTURAS.filter(f => f.prov === id && f.saldo > 0);
    const nueva = p.cuentas.find(c => c.nueva);
    const filaCta = c => `<li><div class="fila"><span class="lead ${c.nueva ? 'alerta' : ''}">${ic(c.nueva ? 'candado' : 'bancos')}</span><span class="medio"><b>${esc(etiq(c))}</b><small>A nombre de ${esc(c.titular)}${c.nota ? ' · ' + esc(c.nota) : ''}${c.baja ? ' · ' + esc(c.baja) : ''}${c.verificada ? ' · ' + esc(c.verificada) : ''}</small></span><span class="fila-tags">${c.nueva ? tag('Por verificar', 'alerta') : c.baja ? tag('Ya no se usa', '') : c.otro ? tag('A otro nombre', 'info') : ''}</span></div></li>`;
    return { titulo: p.nombre, sub: esc(p.cat) + ' · ' + esc(p.rif), mod: 'proveedores', obj: p, registro: p.nombre, tags: [[A.estadoTag(p.estado).replace(/<[^>]+>/g, ''), p.estado === 'cuenta_nueva' ? 'alerta' : p.estado === 'vencida' ? 'alerta' : 'ok']],
      aviso: nueva ? `<p class="nota alerta">${ic('candado', 's')}<span><b>Cuenta por verificar.</b> ${esc(nueva.nueva)} y le avisó a Alejandro. Queda así hasta que alguien confirme por teléfono${p.telNuevo ? `. <b>El teléfono también cambió:</b> primero confírmalo llamando al de antes (${esc(p.telNuevo.antes)}); el nuevo no sirve para verificar la cuenta` : ' al ' + esc(telConfirmado(p) || 'número de siempre')}.</span></p>` : '',
      bloques: [
        { titulo: 'Ficha', filas: [{ l: 'Nombre', v: esc(p.nombre), campo: { k: 'nombre', tipo: 'texto' } }, { l: 'Categoría', v: esc(p.cat), campo: { k: 'cat', tipo: 'select', opciones: D.PARAMS.categorias } }, { l: 'Plazo para pagar (días)', v: p.plazo ? p.plazo + ' días' : 'De contado', campo: { k: 'plazo', tipo: 'numero', entero: true } }, { l: 'Contacto', v: esc(p.contacto), campo: { k: 'contacto', tipo: 'texto' } },
          // con este número se verifica una cuenta nueva: cambiarlo se protege igual que la cuenta (pide el código y le avisa a Alejandro)
          { l: 'Teléfono (para verificar cuentas)', v: `<span class="mono">${esc(p.tel || '—')}</span>` + (p.telNuevo ? ' ' + tag('Cambió hoy · por confirmar', 'alerta') + ` <small class="tenue">antes: ${esc(p.telNuevo.antes)}</small>` : ''), campo: { k: 'tel', tipo: 'texto', sensible: true } }] },
        { titulo: 'Cuentas para pagarle (' + activas(p).length + ')', html: `<ul class="lista">${p.cuentas.map(filaCta).join('')}</ul><p class="muted">Un pago a cualquiera de estas cuentas, o a nombre de su titular, se reconoce como pago a ${esc(p.nombre)}. Agregar una cuenta pide tu código y le avisa a Alejandro.</p>` },
        { titulo: 'Facturas abiertas (' + facts.length + ')', html: facts.length ? `<ul class="lista">${facts.map(f => `<li><button class="fila" data-abrir="factura:${f.id}"><span class="lead">${ic('archivo')}</span><span class="medio"><b>N.º ${esc(f.num)}</b><small>Vence ${esc(f.vence)}${f.ret && f.retIslr ? ' · sin las retenciones' : f.ret ? ' · sin la retención de IVA' : f.retIslr ? ' · sin la retención de ISLR' : ''}${f.pago && f.pago.parcial ? ' · pagada en parte' : ''}</small></span><span class="monto">${dinero(f.saldo, 'usd')}</span></button></li>`).join('')}</ul>` : '<p class="muted">Sin facturas abiertas.</p>' },
      ],
      // con el teléfono por confirmar, la cuenta no se verifica: quien cambió la cuenta y el teléfono es quien contestaría esa llamada
      acciones: [{ txt: 'Agregar cuenta', acc: 'prov-cuenta', arg: p.id, icono: 'mas', solo: 'editar' }].concat(nueva ? [{ txt: 'Ya confirmé por teléfono', acc: 'prov-verificar', arg: p.id, icono: 'candado', tono: 'peligro', solo: 'aprobar', bloq: !!p.telNuevo }] : []).concat(p.telNuevo ? [{ txt: 'Ya confirmé el teléfono nuevo', acc: 'prov-tel-ok', arg: p.id, icono: 'candado', tono: 'peligro', solo: 'aprobar' }] : []),
      // un teléfono nuevo queda por confirmar y le llega a Alejandro: no sirve para verificar una cuenta hasta que alguien lo confirme
      alGuardar: cambios => {
        const c = cambios.find(x => x.r.campo.k === 'tel'); if (!c) return;
        if (S.usuario.rol === 'dueno') return; // lo cambió el dueño con su código: no se lo avisa a sí mismo
        p.telNuevo = { antes: c.antes || '—', quien: S.usuario.nombre };
        A.pendiente({ id: 'pe' + Date.now(), para: ['alejandro'], tipo: 'alerta', titulo: 'Un proveedor cambió de teléfono', telProv: p.id, sub: p.nombre + ' · llámalo al de antes (' + (c.antes || '—') + ') para confirmarlo: con ese número se verifica una cuenta', de: S.usuario.nombre, edad: 'Ahora', abrir: 'proveedor:' + p.id });
      } };
  };
  // una cuenta nueva queda por verificar: pide código, avisa a Alejandro y no se le paga hasta confirmarla por teléfono
  ACC['prov-cuenta'] = id => {
    if (!puede('proveedores', 'editar')) return ACC['sin-permiso']('proveedores');
    const p = D.PROVEEDORES.find(x => x.id === id); const env = $('#modal-raiz');
    A.modal(`<h2 id="modal-t">Agregar una cuenta</h2><p class="muted" id="modal-d">${esc(p.nombre)}</p>
      <label class="campo" for="pc-banco"><span>Banco</span><select id="pc-banco">${['Venezolano', 'Banesco', 'Mercantil', 'Provincial', 'BNC', 'Bancaribe'].map(b => `<option>${b}</option>`).join('')}</select></label>
      <label class="campo" for="pc-num"><span>Número de cuenta (20 dígitos) o teléfono del pago móvil</span><input id="pc-num" inputmode="numeric" autocomplete="off"></label>
      <label class="campo" for="pc-tit"><span>Titular: el nombre que sale en el banco</span><input id="pc-tit" autocomplete="off" placeholder="Puede ser otra persona, por ejemplo el dueño"></label>
      <p class="muted" style="display:flex;gap:6px;align-items:center">${ic('candado', 's')}Pide tu código y le avisa a Alejandro. No se le paga ahí hasta que alguien confirme por teléfono.</p>
      <div class="modal-acc"><button class="btn sec" data-pc="no">Cancelar</button><button class="btn pri" data-pc="si">Agregar la cuenta</button></div>`, 'teclado');
    $('#pc-num').focus();
    env.onclick = e => {
      const b = e.target.closest('[data-pc]'); if (!b) return;
      if (b.dataset.pc === 'no') { A.cerrarModal(); return; }
      const dig = $('#pc-num').value.replace(/\D/g, ''); const tit = $('#pc-tit').value.trim(); const banco = $('#pc-banco').value;
      const movil = /^04\d{9}$/.test(dig);
      if (A.faltan(env, [[!movil && dig.length !== 20, 'pc-num', 'Escribe los 20 dígitos de la cuenta o el teléfono del pago móvil.'], [tit.length < 3, 'pc-tit', 'Escribe el titular tal como sale en el banco.']])) return;
      A.cerrarModal();
      const num = movil ? 'pago móvil ' + dig.slice(0, 4) + '-•••-' + dig.slice(-4) : '•••• ' + dig.slice(-4);
      A.pedirCodigo({ que: 'Cuenta nueva para ' + esc(p.nombre) + ' · ' + esc(banco) + ' ' + esc(num), det: 'A nombre de ' + esc(tit) + '. No se le paga ahí hasta que alguien la confirme por teléfono.', boton: 'Agregar la cuenta' }).then(() => {
        const c = { banco, num, titular: tit, otro: !tit.toLowerCase().includes(p.nombre.toLowerCase().split(' (')[0]), nueva: S.usuario.nombre + ' la agregó hoy con su código' };
        p.cuentas.push(c); if (p.estado !== 'cuenta_nueva') p.estadoAntes = p.estado; p.estado = 'cuenta_nueva';
        A.auditar({ modulo: 'Proveedores', registro: p.nombre, campo: 'cuenta bancaria', antes: '—', despues: etiq(c) + ' · ' + tit, motivo: 'Cuenta nueva' });
        A.pendiente({ id: 'pe' + Date.now(), para: ['alejandro'], tipo: 'alerta', titulo: 'Un proveedor tiene una cuenta nueva', sub: p.nombre + ' · confírmala por teléfono', de: S.usuario.nombre, edad: 'Ahora', abrir: 'proveedor:' + p.id, prov: p.id });
        A.pintarFicha(); A.pintarPagina(); A.aviso('Guardado con tu código. Le avisamos a Alejandro.');
      }).catch(() => {});
    };
  };
  function verificarCuentas(id) {
    const p = D.PROVEEDORES.find(x => x.id === id);
    p.cuentas.forEach(c => { if (c.nueva) { c.verificada = 'confirmada por teléfono (' + S.usuario.nombre + ')'; delete c.nueva; } });
    p.estado = p.estadoAntes || 'al_dia'; delete p.estadoAntes;
    D.PENDIENTES.filter(x => x.prov === id && !x.hecho).forEach(x => { x.hecho = 'Verificada por ' + S.usuario.nombre; });
    A.auditar({ modulo: 'Proveedores', registro: p.nombre, campo: 'cuenta', antes: 'por verificar', despues: 'verificada por teléfono' });
  }
  ACC['prov-tel-ok'] = id => { const p = D.PROVEEDORES.find(x => x.id === id); if (!p || !p.telNuevo) return; A.pedirCodigo({ que: 'Teléfono nuevo de ' + esc(p.nombre) + ' · ' + esc(p.tel || ''), det: 'Confirmas que llamaste al de antes (' + esc(p.telNuevo.antes) + ') y que el número nuevo es suyo.', boton: 'Ya confirmé el teléfono nuevo' }).then(() => { const antes = p.telNuevo.antes; delete p.telNuevo; D.PENDIENTES.filter(x => x.telProv === id && !x.hecho).forEach(x => { x.hecho = 'Confirmado por ' + S.usuario.nombre; }); A.auditar({ modulo: 'Proveedores', registro: p.nombre, campo: 'teléfono', antes: 'por confirmar (antes ' + antes + ')', despues: 'confirmado' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Teléfono confirmado. Ya sirve para verificar una cuenta.'); }).catch(() => {}); };
  // con qué número se verifica una cuenta nueva: el confirmado, nunca uno que cambió y está por confirmar
  const telConfirmado = p => (p.telNuevo ? p.telNuevo.antes : p.tel) || '';
  // verificar una cuenta: si el teléfono también cambió, primero se confirma el teléfono (el nuevo no sirve); la ventana del código dice a qué número se llamó
  const verificarCon = (p, c, despues) => {
    if (p.telNuevo) { A.aviso('Primero confirma el teléfono: llama al de antes (' + p.telNuevo.antes + '). El nuevo no sirve para verificar la cuenta.', 'info'); return; }
    A.pedirCodigo({ que: 'Cuenta nueva de ' + esc(p.nombre) + (c ? ' · ' + esc(etiq(c)) : ''), det: 'Confirmas que llamaste al proveedor a su número de siempre' + (telConfirmado(p) ? ', el ' + esc(telConfirmado(p)) : '') + ', y que la cuenta es suya.' + (c && c.titular ? ' A nombre de ' + esc(c.titular) + '.' : ''), boton: 'Ya confirmé por teléfono' }).then(despues).catch(() => {});
  };
  ACC['prov-verificar'] = id => { const p = D.PROVEEDORES.find(x => x.id === id); if (!p) return; verificarCon(p, p.cuentas.find(x => x.nueva), () => { verificarCuentas(id); A.pintarFicha(); A.pintarPagina(); A.aviso('Cuenta verificada. Ya se le puede pagar ahí.'); }); };
  FICHAS.devolucion = id => {
    const d = D.DEVOLUCIONES.find(x => x.id === id);
    return { titulo: 'Devolución: ' + d.que, sub: esc(prov(d.prov).nombre) + ' · ' + esc(d.fecha), mod: 'proveedores', obj: d, registro: 'Devolución ' + d.que, tags: [[d.estado === 'esperando' ? 'Esperando reposición · ' + d.dias + ' días' : 'Repuesta', d.estado === 'esperando' ? 'aviso' : 'ok']],
      bloques: [{ filas: [{ l: 'Qué se devolvió', v: esc(d.que) }, { l: 'Valor', v: dinero(d.monto, 'usd') }, { l: 'Trato con el proveedor', v: esc(d.trato), campo: { k: 'trato', tipo: 'texto' } }, { l: 'La registró', v: esc(d.quien) }, { l: 'Merma', v: d.trato.includes('mitad') ? dinero(d.monto / 2, 'usd') + ' (2 kg)' : '—' }] }, { titulo: 'Foto', adjuntos: ['queso-telita-devuelto.jpg'] }],
      // «Llegó la reposición» es de un toque: «Deshacer» durante 10 segundos y después «Reabrir» (el sello «Repuesto» queda tachado)
      acciones: d.estado === 'esperando' ? [{ txt: 'Llegó la reposición', acc: 'repuesta', arg: d.id, icono: 'check', tono: 'pri', solo: 'editar' }]
        : [{ ...(A.deshacible('devolucion:' + d.id) ? A.accDeshacer('dev-deshacer', d.id, 'devolucion:' + d.id) : A.accReabrir('dev-reabrir', d.id, 'devolucion:' + d.id)), solo: 'editar' }] };
  };
  ACC.repuesta = id => {
    const d = D.DEVOLUCIONES.find(x => x.id === id); const antes = { estado: d.estado, dias: d.dias }; const ps = D.PENDIENTES.filter(x => x.abrir === 'devolucion:' + id && !x.hecho);
    d.estado = 'repuesta'; d.diasAntes = d.dias; d.dias = 0; ps.forEach(p => { p.hecho = 'Repuesta, marcada por ' + S.usuario.nombre; });
    A.auditar({ modulo: 'Proveedores', registro: 'Devolución ' + d.que, campo: 'estado', antes: 'esperando', despues: 'repuesta' });
    A.unToque('devolucion:' + id, () => {
      Object.assign(d, antes); ps.forEach(p => { p.hecho = ''; });
      A.auditar({ modulo: 'Proveedores', registro: 'Devolución ' + d.que, campo: 'estado', antes: 'repuesta', despues: 'esperando', motivo: 'Deshecho a los pocos segundos de marcarlo' });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Deshecho: vuelve a «Esperando reposición».');
    });
    A.pintarFicha(); A.pintarPagina(); const des = document.querySelector('#ficha-raiz [data-acc="dev-deshacer"]'); if (des) des.focus({ preventScroll: true });
    A.aviso('Anotado: llegó la reposición. Puedes deshacerlo durante 10 segundos.');
  };
  ACC['dev-deshacer'] = id => { if (!A.deshacerUT('devolucion:' + id)) { A.aviso('Ya pasaron los 10 segundos: para cambiarlo, toca «Reabrir».', 'info'); if (S.ficha) A.pintarFicha(); } };
  ACC['dev-reabrir'] = id => {
    const d = D.DEVOLUCIONES.find(x => x.id === id); if (!d || d.estado !== 'repuesta') return;
    A.pedirReabrir({ titulo: 'Reabrir la devolución de ' + d.que, texto: 'Vuelve a «Esperando reposición» y su aviso se abre otra vez. Lo de antes queda en el registro de cambios y su sello, tachado.', opciones: ['Me equivoqué de botón', 'No llegó completa'] }).then(m => {
      A.selloViejo(d, 'Repuesto'); d.estado = 'esperando'; d.dias = d.diasAntes || 0;
      D.PENDIENTES.filter(x => x.abrir === 'devolucion:' + id).forEach(p => { p.hecho = ''; });
      A.auditar({ modulo: 'Proveedores', registro: 'Devolución ' + d.que, campo: 'estado', antes: 'repuesta', despues: 'esperando (reabierta)', motivo: m });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Reabierta: vuelve a «Esperando reposición».');
    }).catch(() => {});
  };
  FICHAS.cambio = id => {
    const a = D.AUDITORIA.find(x => x.id === id);
    return { titulo: a.registro, sub: 'Cambio · ' + esc(a.cuando), mod: 'auditoria', bloques: [{ filas: [{ l: 'Módulo', v: esc(a.modulo) }, { l: 'Qué', v: esc(a.campo) }, { l: 'Antes', v: esc(a.antes), largo: true }, { l: 'Después', v: esc(a.despues), largo: true }, { l: 'Quién', v: esc(a.quien) + (a.tipoActor !== 'persona' ? ' ' + tag(a.tipoActor === 'bot' ? 'Bot' : 'Agente', 'lila') : '') }, { l: 'Motivo', v: esc(a.motivo || '—'), largo: true }] }, { html: '<p class="muted">Este registro no se puede editar ni borrar. Lo escribe la propia base de datos.</p>' }] };
  };
  /* ---------- lo que encuentra el buscador aquí: montos y referencias (siempre con los permisos de quien busca) ----------
     Caja (quien ve Caja: Cecilia no) · las líneas del lunes · lo que se le paga a cada persona en la nómina (solo quien ve los sueldos por
     persona: Luis no) · las facturas. Cada registro dice qué es, de qué día y por cuánto. */
  const titPago = c => esZelle(c) ? 'Zelle de ' + c.ref : esOrden(c) ? 'USDT por Binance' : c.tipo + ' de ' + c.banco;
  A.BUSCABLES.push(() => !puede('caja') ? [] : D.CAJA.filter(c => c.monto).map(c => ({ t: titPago(c), que: 'Caja · ' + A.estadoTxt(c.estado).toLowerCase(), dia: 'hoy ' + c.hora, monto: dinero(c.monto, c.mon), montos: [c.monto], refs: sinRef(c) || esZelle(c) ? [] : [c.ref], abrir: 'pago:' + c.id, tipo: 'caja' })));
  A.BUSCABLES.push(() => !puede('pagos') ? [] : D.LUNES.map((l, i) => ({ t: 'Pago a ' + (prov(l.p).nombre || '—'), que: 'Pagos del lunes' + (l.c ? ' · desde ' + l.c : ' · sin pagar'), dia: 'lun 5 oct', monto: dinero(l.m, 'usd'),
    montos: [l.m].concat(l.cap != null && Math.abs(l.cap - l.m) >= 0.005 ? [l.cap] : [], l.capBs ? [l.capBs] : []), refs: l.c && l.cap != null ? [refDe(i)].concat(l.intento2 ? [l.intento2.ref] : []) : [], abrir: 'lineapago:' + i, tipo: 'lunes' })));
  A.BUSCABLES.push(() => !(puede('pagos') && puede('nomina', 'sueldos')) ? [] : PNL().map((l, i) => { const m = netoDe(l); return { t: 'Pago de nómina a ' + empDe(l.e).nombre, que: 'Pagar la nómina' + (l.c ? ' · desde ' + l.c : ' · sin pagar'), dia: D.PAGO_NOMINA.corto, monto: dinero(m, 'usd'), montos: [m], refs: capNom(l) != null ? [refNom(i)] : [], abrir: 'pagonom:' + i, tipo: 'nomina' }; }));
  A.BUSCABLES.push(() => !puede('proveedores') ? [] : D.FACTURAS.map(f => ({ t: 'Factura N.º ' + f.num, que: (prov(f.prov).nombre || '—') + ' · ' + A.estadoTxt(f.estado).toLowerCase(), dia: f.fecha, monto: dinero(f.monto, 'usd'), montos: [f.monto, f.saldo].filter(Boolean), alt: f.saldo && Math.abs(f.saldo - f.monto) >= 0.005 ? [{ m: f.saldo, txt: dinero(f.monto, 'usd') + ' · saldo ' + dinero(f.saldo, 'usd') }] : null, refs: [f.num, f.control], abrir: 'factura:' + f.id, tipo: 'factura' })));

  // la misma regla del botón, al tocarlo (A.regla): quien solo mira el módulo, o no tiene ese permiso, no llega a la acción
  A.reglaAcc(['quitar-linea', 'linea-nueva'], { mod: 'pagos' });
  A.reglaAcc(['prov-cuenta', 'repuesta', 'dev-deshacer', 'dev-reabrir', 'fac-reverso', 'facag-aprobar', 'facag-rechazar'], { mod: 'proveedores' });
  A.reglaAcc(['prov-verificar', 'prov-tel-ok'], { mod: 'proveedores', permiso: 'aprobar' });
  A.reglaAcc(['cobrar', 'aprobar-dev'], { mod: 'clientes' });
})();
