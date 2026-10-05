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
          ${A.cifra({ etq: 'Zelle', valor: dinero(usd), sub: D.CAJA.filter(c => c.mon === 'usd').length + ' pagos', abrir: 'cajatotal:usd' })}
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
        A.tabla({ cols: [{ t: 'Factura', cls: 'p' }, { t: 'Cliente', cls: 'x' }, { t: 'Base', cls: 'r x plata' }, { t: 'IVA', cls: 'r plata' }, { t: 'Retención', cls: 'e' }], filas: D.VENTAS_EMPRESAS.map(v => ({ abrir: 'ventaemp:' + v.id, celdas: [`<b>N.º ${esc(v.num)}</b><small>${esc(v.fecha)} · ${esc(v.cliente)}</small>`, esc(v.cliente), dinero(v.base, 'bs'), dinero(v.iva, 'bs'), tag(v.retencion, v.retencion.startsWith('Esperando') ? 'aviso' : v.retencion.startsWith('Recibido') ? 'ok' : '')] })) });
      if (sub === 'fieles') cuerpo = `<div class="rejilla"><div class="c6 pila"><article class="hoja"><h2>${ic('clientes')}Clientes que dejaron de venir</h2><p class="muted">Venían al menos una vez al mes y llevan más de 45 días sin venir. Solo los que dieron permiso para escribirles.</p>
          <ul class="lista">${D.CLIENTES.filter(c => c.consiente && c.antig > 45).map(c => `<li><button class="fila" data-abrir="cliente:${c.id}"><span class="lead">${ic('usuario')}</span><span class="medio"><b>${esc(c.nombre)}</b><small>Última visita ${esc(c.ultimo)}</small></span>${ic('derecha', 's chev')}</button></li>`).join('')}</ul></article></div>
          <div class="c6 pila"><article class="hoja"><h2>${ic('calendario')}Cumpleaños de octubre</h2><p class="muted">3 clientes con permiso para recibir un mensaje. Las campañas salen del número oficial, nunca del número del bot.</p>${A.boton('clientes', 'Preparar un mensaje', 'data-acc="pronto"', { tono: 'sec', icono: 'mensaje' })}</article>
          <p class="nota gris">${ic('candado', 's')}<span>Más adelante. Solo se escribe a quien dio permiso, y se guarda cuándo y cómo lo dio.</span></p></div></div>`;
      return `<div class="pagina">${A.cab('Cuentas por cobrar', 'Clientes y cobranza', 'Quién nos debe, cuánto y desde cuándo. Lo que consumen va a precio de carta, en euros. Los abonos se aplican a la deuda más vieja.', A.boton('clientes', 'Cobrar un abono', 'data-acc="cobrar"', { icono: 'mas' }))}
        ${A.lectura('clientes')}
        <div class="cifras">
          ${A.cifra({ etq: 'Nos deben', valor: dinero(total, 'eur', 0), sub: '≈ ' + dinero(enUsd(total, 'eur'), 'usd', 0) + ' a la tasa de hoy · ' + deben.length + ' clientes', ir: 'clientes/deben' })}
          ${A.cifra({ etq: 'Más de 30 días', valor: dinero(viejos.reduce((s, c) => s + c.saldo, 0), 'eur', 0), sub: viejos.length + ' clientes · se les recuerda los lunes', tono: 'aviso', ir: 'clientes/deben' })}
          ${A.cifra({ etq: 'Retenciones que esperamos', valor: '1', sub: 'Constructora Delta · IVA', ir: 'clientes/empresas' })}
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
        { titulo: 'Crédito', filas: [{ l: 'Debe', v: c.saldo ? `${dinero(c.saldo, mon)} <small class="tenue">≈ ${dinero(usd)} a la tasa de hoy</small>` : dinero(0, mon) }, { l: 'Moneda de los cargos', v: mon === 'eur' ? 'Euros, como la carta' : 'Dólares' }, { l: 'Límite de crédito ($)', v: dinero(c.credito, 'usd', 0), campo: { k: 'credito', tipo: 'dinero', obligatorio: true } }, { l: 'Días para pagar', v: c.dias + ' días', campo: { k: 'dias', tipo: 'numero', entero: true, obligatorio: true } }, { l: 'Lo autorizó', v: 'Alejandro' }, { l: 'Contacto', v: esc(c.contacto), campo: { k: 'contacto', tipo: 'texto' } }, { l: 'Permiso para escribirle', v: c.consiente ? tag('Sí, dado en caja el 2 ago', 'ok') : tag('No', '') }] },
        { titulo: 'Movimientos', tiempo: c.saldo ? [[c.ultimo, 'Último abono recibido.'], ['Hace ' + c.antig + ' d', 'Consumo a crédito que sigue abierto: ' + dinero(c.saldo, mon) + '.', c.antig > 30 ? 'aviso' : '']] : [[c.ultimo, 'Pagó todo. Sin deuda.', 'ok']] },
        { html: '<p class="muted">Lo que consume va a precio de carta, en euros: un abono en bolívares se convierte con el euro BCV del día. Un límite de más de $ 100 lo aprueba Alejandro. Recordatorio automático los lunes a los que pasan de 15 días, desde el número oficial.</p>' },
      ],
      acciones: c.saldo ? [{ txt: 'Cobrar un abono', acc: 'cobrar', arg: c.id, icono: 'mas', solo: 'editar' }] : [],
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
      if (n === null || n <= 0) { el.className = 'chequeo aviso'; el.innerHTML = ic('alerta', 's') + '<span>Escribe cuánto llegó.</span>'; return null; }
      const en = r2(aMonedaDe(n, desde, mon));
      const cuenta = desde === 'bs' ? `${dinero(n, 'bs')} ÷ ${fmt(D.TASA[mon])} = ${dinero(en, mon)}` : `${dinero(n)} × ${fmt(D.TASA.usd)} = ${dinero(r2(n * D.TASA.usd), 'bs')} ÷ ${fmt(D.TASA[mon])} = ${dinero(en, mon)}`;
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
      const v = conv(); if (!v) { $('#ab-recibido').focus(); return; }
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
      bloques: [{ filas: [{ l: 'Base', v: dinero(v.base, 'bs') }, { l: 'IVA 16 %', v: dinero(v.iva, 'bs') }, { l: 'Total', v: dinero(v.base + v.iva, 'bs') }, { l: 'Contribuyente especial', v: v.esp ? 'Sí: nos retiene el 75 % del IVA' : 'No' }, { l: 'Comprobante de retención', v: esc(v.retencion) }] }],
      acciones: v.retencion.startsWith('Esperando') ? [{ txt: 'Subir su comprobante', acc: 'pronto', icono: 'subir', solo: 'editar' }] : [] };
  };
  FICHAS.devcliente = id => {
    const d = D.DEVCLIENTES.find(x => x.id === id);
    return { titulo: 'Devolver ' + dinero(d.monto), sub: 'Devolución a un cliente', mod: 'clientes', obj: d, tags: [[d.estado === 'aprobada' ? 'Aprobada' : 'Por aprobar', d.estado === 'aprobada' ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'A quién', v: esc(d.cliente) + (d.mesa ? ' <small class="tenue">' + esc(d.mesa) + '</small>' : '') }, { l: 'Motivo', v: esc(d.motivo), largo: true }, { l: 'La preparó', v: esc(d.preparo) }, { l: 'Cómo se devuelve', v: 'Pago móvil desde ' + A.cta('BVCA') }] }, { html: '<p class="muted">La aprueba Jose o Alejandro con su código, nunca quien la preparó. Si hubo factura fiscal, se hace la nota de crédito en la máquina fiscal.</p>' }],
      acciones: d.estado === 'por_aprobar' ? [{ txt: 'Aprobar la devolución', acc: 'aprobar-dev', arg: d.id, icono: 'candado', tono: 'pri' }] : [] };
  };
  ACC['aprobar-dev'] = id => {
    const d = D.DEVCLIENTES.find(x => x.id === id);
    if (!(S.usuario.rol === 'dueno' || S.usuario.rol === 'contabilidad')) return A.aviso('La aprueban Jose o Alejandro.', 'info');
    if (d.preparo === S.usuario.nombre) return A.aviso('No puedes aprobar algo que preparaste tú. Lo aprueba otra persona.', 'info');
    A.pedirCodigo({ que: 'Devolución a ' + esc(d.cliente) + ' · ' + dinero(d.monto) + ' · pago móvil desde ' + A.cta('BVCA'), det: esc(d.motivo) + ' · la preparó ' + esc(d.preparo), boton: 'Aprobar ' + dinero(d.monto) }).then(() => {
      d.estado = 'aprobada'; const p = D.PENDIENTES.find(x => x.abrir === 'devcliente:' + id); if (p) p.hecho = 'Aprobada por ' + S.usuario.nombre;
      A.auditar({ modulo: 'Clientes', registro: 'Devolución ' + dinero(d.monto), campo: 'estado', antes: 'por aprobar', despues: 'aprobada' });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Devolución aprobada.');
    }).catch(() => {});
  };

  /* =============== PAGOS DE LOS LUNES =============== */
  // aprobadoEn: lo que se aprobó (total, hora, quién y la «firma» del lote) · reabierto: el sello que se tachó al tocar «Cambiar el lote»
  const P = { menu: null, explica: null, recien: null, dudas: { pollos: false, traspaso: false }, pollos: null, aprobado: false, enviado: false, nota: null, aprobadoEn: null, reabierto: null };
  const total = () => D.LUNES.reduce((s, r) => s + r.m, 0);
  // al aprobar, el lote queda con candado: lo de abajo es lo aprobado hasta que alguien toque «Cambiar el lote», con motivo.
  // la firma es lo que se va a pagar (cada línea marcada, de dónde sale, cuánto, qué socio, la captura y la cuenta del proveedor):
  // si al enviar no coincide con la aprobada, no sale nada al grupo
  const firmaLunes = () => JSON.stringify([D.LUNES.map(r => r.c ? [r.p, r.c, r.m, r.socio || '', r.cap ?? '', r.cta || ''] : [r.p]), P.pollos]);
  const CERRADO = {
    lunes: () => P.enviado ? 'El lote ya salió al grupo: ya no se cambia.' : 'El lote está aprobado. Para cambiar algo, toca «Cambiar el lote».',
    nomina: () => PN.enviado ? 'El pago ya salió al grupo: ya no se cambia.' : 'El pago está aprobado. Para cambiar algo, toca «Cambiar el pago».',
  };
  ACC['lote-cerrado'] = arg => A.aviso((CERRADO[arg] || CERRADO.lunes)(), 'info');
  // el sello dice el total, el día y la hora: así se ve de un vistazo si lo de abajo ya no es lo aprobado
  const aprobacion = total => ({ total, dia: D.HOY.iso.slice(8) + ' ' + D.MESES[+D.HOY.iso.slice(5, 7) - 1].toUpperCase(), hora: D.HOY.hora, quien: S.usuario.nombre });
  // la ventana del código del lote (y de la nómina): qué se aprueba y, en una línea, cuánto sale de cada cuenta con su resaltador
  const sumasPor = (ls, monto) => Object.keys(CTAS).map(k => [k, r2(ls.filter(x => x.c === k).reduce((a, x) => a + monto(x), 0))]).filter(x => x[1]);
  const pagosTxt = n => n + (n === 1 ? ' pago' : ' pagos');
  const codigoLote = (q, n) => ({ que: 'Lote del lunes · ' + pagosTxt(n) + ' · ' + dinero(q.lista), det: A.porCuenta(sumasPor(D.LUNES, r => r.m)) + (q.dif ? '<span>Las capturas suman ' + dinero(q.caps) + ': va con tu nota.</span>' : ''), boton: 'Aprobar ' + dinero(q.lista) });
  const codigoNom = (q, n) => ({ que: 'Pago de la nómina del ' + esc(D.PAGO_NOMINA.corto) + ' · ' + pagosTxt(n) + ' · ' + dinero(q.lista), det: A.porCuenta(sumasPor(PNL(), netoDe)) + (q.dif ? '<span>Las capturas suman ' + dinero(q.caps) + ': va con tu nota.</span>' : ''), boton: 'Aprobar ' + dinero(q.lista) });
  const selloAprobado = (a, recien) => A.sello('Aprobado · ' + dinero(a.total), { recien, fecha: a.dia + ' ' + a.hora });
  const selloTachado = a => A.sello('Aprobado · ' + dinero(a.total), { fecha: a.dia + ' ' + a.hora, tachado: true });
  const ctaCerrada = (c, cual) => `<button class="cta-btn bloq" data-acc="lote-cerrado" data-arg="${cual}" aria-disabled="true">${ic('candado', 's')}${c ? `<span class="acct" data-c="${c}">${c}</span>` : '<span>Sin elegir</span>'}<span class="sr-only">, con candado: ${cual === 'nomina' ? 'el pago' : 'el lote'} está aprobado</span></button>`;
  const soltarCerrado = cual => `<button type="button" class="soltar bloq" data-acc="lote-cerrado" data-arg="${cual}" aria-disabled="true">${ic('candado')}<span><b>Las capturas quedaron cerradas</b>${cual === 'nomina' ? 'El pago está aprobado. Para subir otra, toca «Cambiar el pago».' : 'El lote está aprobado. Para subir otra, toca «Cambiar el lote».'}</span></button>`;
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
  const porQue = q => [...q.distintas.map(r => `${esc(prov(r.p).nombre)}: la captura dice ${dinero(r.cap)} y la lista ${dinero(r.m)}.`), ...q.faltan.map(r => `Falta la captura de ${esc(prov(r.p).nombre)}.`), ...(q.doble ? [`${esc(prov(q.doble.p).nombre)}: fueron dos pagos de ${dinero(q.doble.cap)}.`] : [])].join(' ');
  const retDeLista = (soloPagadas = false) => D.FACTURAS.filter(f => retsDe(f) && saldoDelLote(f) > 0 && D.LUNES.some(r => r.p === f.prov && (!soloPagadas || r.c)));
  // «sin la retención de IVA (…) a A y B, y sin la de ISLR (…) a C»: la de IVA va en la planilla de IVA y la de ISLR, en la declaración de retenciones de ISLR
  const enLista = arr => arr.join(', ').replace(/, ([^,]*)$/, ' y $1');
  const retTexto = fr => { const iva = fr.filter(f => f.ret), islr = fr.filter(f => f.retIslr); const nom = xs => esc(enLista([...new Set(xs.map(f => prov(f.prov).nombre))]));
    return [iva.length ? `la retención de IVA (${dinero(r2(iva.reduce((s, f) => s + f.ret.usd, 0)))}) a ${nom(iva)}` : '', islr.length ? `la de ISLR (${dinero(r2(islr.reduce((s, f) => s + f.retIslr.usd, 0)))}) a ${nom(islr)}` : ''].filter(Boolean).join(', y sin '); };
  // al enviar el lote, cada línea pagada cierra sus facturas: quedan pagadas, con el lote y la cuenta, y ya no se editan (se corrigen con un reverso)
  // si la captura dice menos que la lista, la diferencia queda como saldo de la última factura de la línea
  function pagarLote() {
    D.LUNES.filter(r => r.c).forEach(r => {
      const facts = D.FACTURAS.filter(f => f.prov === r.p && f.saldo > 0);
      let falta = r.cap != null ? Math.max(0, r2(r.m - r.cap)) : 0;
      [...facts].reverse().forEach(f => {
        const queda = Math.min(falta, f.saldo); falta = r2(falta - queda);
        f.pago = { lote: LOTE, cta: r.c, socio: r.socio || '', antes: f.saldo, parcial: queda > 0.005 };
        const antes = A.estadoTag(f.estado).replace(/<[^>]+>/g, '');
        if (queda > 0.005) { f.saldo = r2(queda); if (f.estado !== 'vencida') f.estado = 'parcial'; } else { f.saldo = 0; f.estado = 'pagada'; }
        A.auditar({ modulo: 'Proveedores', registro: 'Factura ' + f.num, campo: 'estado', antes, despues: (f.estado === 'pagada' ? 'pagada' : 'pago parcial: quedan ' + dinero(f.saldo)) + ' · lote del ' + LOTE + ' ' + desdeTxt(f.pago) });
      });
      const p = prov(r.p); if (p.estado === 'vencida' && !D.FACTURAS.some(f => f.prov === p.id && f.saldo > 0 && f.estado === 'vencida')) p.estado = 'al_dia';
    });
  }
  function filaLunes(r, i) {
    const pv = prov(r.p); const bl = bloq(r);
    const puedeMarcar = puede('pagos', 'editar');
    const marcada = !!r.c && i !== P.recien;
    let cuenta;
    if (bl) cuenta = `<button class="alerta-btn" data-pl="explica" data-i="${i}" aria-expanded="${P.explica === i}">${ic('candado', 's')}Cuenta por verificar</button>`;
    // con el lote aprobado, quien edita ve la cuenta con candado: al tocarla le dice cómo se cambia
    else if (puedeMarcar && P.aprobado && !P.enviado) cuenta = ctaCerrada(r.c, 'lunes');
    // quien solo mira, o con el lote ya enviado, ve la cuenta como dato, no como un botón que no responde
    else cuenta = puedeMarcar && !P.enviado ? `<button class="cta-btn${r.c ? '' : ' vacia'}" data-pl="menu" data-i="${i}" aria-haspopup="menu" aria-expanded="${P.menu === i}">${r.c ? `<span class="acct" data-c="${r.c}">${r.c}</span>` : 'Elegir cuenta'}${ic('abajo', 's')}</button>`
      : r.c ? `<span class="acct" data-c="${r.c}">${r.c}</span>` : '<span class="tenue">Sin elegir</span>';
    if (P.menu === i) cuenta += `<div class="menu" role="menu" aria-label="De qué cuenta salió">${Object.keys(CTAS).map(k => `<button role="menuitem" data-pl="pick" data-i="${i}" data-c="${k}"><span class="acct" data-c="${k}">${k}</span><small>${CTAS[k]}</small></button>`).join('')}${r.c ? `<button role="menuitem" class="quitar" data-pl="pick" data-i="${i}" data-c="">Quitar la marca</button>` : ''}</div>`;
    const estado = bl ? tag('Por verificar', 'alerta') : !r.c ? tag('Sin pagar') : faltaSocio(r) ? tag('Falta decir qué socio', 'aviso') : (r.duda && !P.dudas[r.duda]) ? tag('Por revisar', 'aviso') : r.cap == null ? tag('Falta la captura', 'aviso') : Math.abs(r.cap - r.m) >= 0.005 ? tag('No cuadra', 'aviso') : tag('Pagado', 'ok');
    let h = `<div class="lfila${marcada ? ' pagada' : ''}" role="row" data-i="${i}">
      <div class="c-prov" role="cell"><button data-abrir="lineapago:${i}"><span class="subraya" ${r.c ? `style="--m: ${resDe(r.c)}"` : ''}>${esc(pv.nombre)}</span></button><small>${esc(r.f)}</small></div>
      <div class="c-vence${r.tarde ? ' tarde' : ''}" role="cell">${r.tarde ? 'Vencida, ' + r.v.toLowerCase() : r.v}</div>
      <div class="c-monto" role="cell">${dinero(r.m)}</div>
      <div class="c-cuenta" role="cell">${cuenta}</div>
      <div class="c-estado" role="cell">${estado}</div>`;
    if (bl && P.explica === i) h += `<div class="explica" role="cell"><p><b>${esc((cuentaDe(r) || {}).nueva)}.</b> Cambiar la cuenta es la forma más común de desviar un pago. Llama al proveedor a su número de siempre y confirma la cuenta nueva antes de pagarle.</p>${A.boton('pagos', 'Ya confirmé por teléfono', `data-pl="verificar" data-i="${i}"`, { tono: 'peligro', icono: 'candado', permiso: 'aprobar' })}</div>`;
    return h + '</div>';
  }
  function lunesProveedores() {
    const q = cuadre(); const pagado = q.lista; const sin = q.sin;
    const pend = pendientes(); const pl = pollos();
    const subt = Object.keys(CTAS).map(k => { const s = D.LUNES.filter(r => r.c === k).reduce((a, r) => a + r.m, 0); return s ? `<div><span class="acct" data-c="${k}">${k}</span><b>${dinero(s)}</b></div>` : ''; }).join('');
    const fr = retDeLista(); const retTot = r2(fr.reduce((s, f) => s + retsDe(f), 0));
    const esDueno = puede('pagos', 'aprobar'); const sinSocio = D.LUNES.filter(faltaSocio).length;
    const paso = P.enviado ? `<div class="sello-linea">${A.sello('Enviado', { recien: P.selloRecien === 'enviado', fecha: '05 OCT 2026' })}<span class="muted">Salió al grupo «Comprobantes de pago» con el PDF. (Simulado)</span></div>`
      // aprobado: el sello con el total y la hora, la nota fija y «Cambiar el lote» (lo reabre con motivo)
      : P.aprobado ? `<div class="sello-linea">${selloAprobado(P.aprobadoEn, P.selloRecien === 'aprobado')}<span class="muted">Lo aprobó ${esc(P.aprobadoEn.quien)} con su código${P.nota ? ', con la nota de la diferencia' : ''}.</span></div>
          ${puede('pagos', 'editar') ? `<p class="nota gris">${ic('candado', 's')}<span><b>Aprobado.</b> Para cambiar algo, toca «Cambiar el lote».</span></p>` : ''}
          ${A.boton('pagos', 'Enviar al grupo', 'data-pl="enviar"', { icono: 'enviar' })}${A.boton('pagos', 'Cambiar el lote', 'data-pl="reabrir"', { tono: 'sec', icono: 'lapiz' })}`
        // reabierto: el sello de antes queda tachado, con quién lo reabrió y para qué, hasta que se apruebe otra vez
        : (P.reabierto ? `<div class="sello-linea">${selloTachado(P.reabierto)}<span class="muted">Se reabrió a las ${esc(P.reabierto.horaReabrio)} para cambiarlo (${esc(P.reabierto.reabrio)}): «${esc(P.reabierto.motivo)}». Hay que aprobarlo otra vez.</span></div>` : '')
          + (esDueno ? `<button class="btn pri full" data-pl="aprobar" ${pend || sinSocio || !pagado ? 'disabled' : ''}>${ic('candado', 's')}Aprobar el lote</button>` : puede('pagos', 'editar') ? `<button class="btn bloq full" data-acc="sin-permiso" data-arg="pagos|aprobar" aria-disabled="true">${ic('candado', 's')}Aprobar el lote (lo aprueba Alejandro)</button>` : '');
    const dosPollos = `Quedan los dos pagos de ${pl ? dinero(pl.m) : ''}: el segundo suma a las capturas y va explicado en la nota.`;
    return `<div class="pila">
      <div class="hoja" style="gap:8px"><p class="progress-line" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><span>Pagado <b class="num">${dinero(pagado)}</b> de <b class="num">${dinero(total())}</b></span><span class="muted">${sin.length ? 'Faltan ' + sin.length + ' pagos' : 'Todo pagado'}</span></p><div class="pista" style="height:10px"><span style="width:${(pagado / total() * 100).toFixed(1)}%;background:var(--tinta)"></span></div></div>
      <div class="pagos-rej">
        <div class="libro-pagos" role="table" aria-label="Lista de pagos del lunes">
          <div class="lcab" role="row"><span role="columnheader">Proveedor</span><span role="columnheader">Vence</span><span role="columnheader" class="r">Monto</span><span role="columnheader">Sale de</span><span role="columnheader" class="r">Estado</span></div>
          ${D.LUNES.map(filaLunes).join('')}
        </div>
        <aside class="lado">
          <section class="hoja"><h2>Comprobantes</h2>
            ${puede('pagos', 'editar') && !P.enviado ? (P.aprobado ? soltarCerrado('lunes') : `<label class="soltar" for="capturas">${ic('subir')}<span><b>Sube todas las capturas de una vez</b>La app las lee y las casa con cada línea.</span></label>
            <input type="file" id="capturas" accept="image/*,application/pdf" multiple class="sr-only">`) : ''}
            <button class="enlace" data-abrir="capturas:lote">${leidas(q)} leídas · ${q.n} casadas · ${pend} por revisar ${ic('derecha', 's')}</button>
            <div class="dudas">
              <div class="duda${P.dudas.pollos ? ' resuelta' : ''}"><p><b>Pollos El Granjero aparece dos veces.</b> ¿Fueron dos intentos del mismo pago?</p>${P.dudas.pollos ? `<p>${ic('check', 's')} ${esc(P.dudas.pollos)}</p>` : `<div class="btns">${A.boton('pagos', 'El 2.º se devolvió', 'data-pl="duda" data-d="pollos" data-v="devuelto" data-r="El banco devolvió el segundo intento. Cuenta una sola vez."', { tono: 'sec', chico: true })}${A.boton('pagos', 'Fueron dos pagos', `data-pl="duda" data-d="pollos" data-v="dos" data-r="${esc(dosPollos)}"`, { tono: 'sec', chico: true })}</div>`}</div>
              <div class="duda${P.dudas.traspaso ? ' resuelta' : ''}"><p><b>Traspaso de BVCA a BVCE</b> (ref. 00418822). Va en la nota del resumen y no suma en los totales.</p>${P.dudas.traspaso ? `<p>${ic('check', 's')} ${esc(P.dudas.traspaso)}</p>` : `<div class="btns">${A.boton('pagos', 'Entendido', 'data-pl="duda" data-d="traspaso" data-r="Anotado en la nota del resumen."', { tono: 'sec', chico: true })}</div>`}</div>
            </div>
          </section>
          <section class="hoja"><h2>Cuadre</h2>
            <dl class="kv"><div><dt>Lista del lunes</dt><dd>${dinero(q.tot)}</dd></div><div><dt>Sin pagar (${sin.length})</dt><dd>− ${dinero(q.sinM)}</dd></div><div class="total"><dt>Lista − sin pagar</dt><dd>${dinero(q.lista)}</dd></div><div><dt>Suma de las capturas (${q.n})</dt><dd>${dinero(q.caps)}</dd></div>${q.dif ? `<div><dt>Diferencia</dt><dd>${q.dif > 0 ? '+' : '−'} ${dinero(Math.abs(q.dif))}</dd></div>` : ''}</dl>
            ${q.dif ? `<p class="muted">${porQue(q)}</p>` : ''}
            ${retTot ? `<p class="muted">La lista ya viene sin las retenciones de ${fr.length} ${fr.length === 1 ? 'factura' : 'facturas'} (${dinero(retTot)}): sin ${retTexto(fr)}. Esa parte se le paga al SENIAT: la de IVA en la planilla de IVA y la de ISLR en la declaración de retenciones de ISLR.</p>` : ''}
            <p class="muted">≈ ${dinero(pagado * D.TASA.usd, 'bs')} a la tasa BCV de hoy (${fmt(D.TASA.usd)}). Cada pago guarda su propia tasa y su comisión.</p>
            <div class="subtot">${subt}</div>
            <p>${pend ? tag('Resuelve ' + (pend === 1 ? 'lo que queda' : 'los ' + pend) + ' por revisar', 'aviso') : sinSocio ? tag('Falta decir qué socio pagó', 'aviso') : q.dif ? tag('No cuadra por ' + dinero(Math.abs(q.dif)), 'aviso') : tag('Cuadra con las capturas', 'ok')}</p>
            ${P.nota ? `<p class="nota gris">${ic('lapiz', 's')}<span><b>Nota de la diferencia:</b> ${esc(P.nota)}</span></p>` : ''}
          </section>
          <div class="pila" style="gap:8px">
            <button class="btn sec full" data-abrir="pdf:lunes">${ic('archivo', 's')}Ver la hoja 1 del PDF</button>
            ${paso}
            <p class="muted" style="text-align:center">${P.enviado ? 'Las facturas de las líneas pagadas quedaron pagadas: ya no se editan.' : pend ? 'Para aprobar, resuelve primero lo que está por revisar.' : sinSocio ? 'Para aprobar, abre ' + (sinSocio === 1 ? 'la línea marcada' : 'las ' + sinSocio + ' líneas marcadas') + ' con SOCIO o APORTE y di qué socio pagó.' : P.aprobado ? 'Va al grupo «Comprobantes de pago». Te pedirá tu código.' : q.dif ? 'No cuadra: al aprobar te pide una nota que explique la diferencia.' : 'Primero se aprueba con código, después se envía.'}</p>
          </div>
        </aside>
      </div></div>`;
  }
  /* ---------- pagar la nómina: el mismo camino que los proveedores (3 oct) ---------- */
  // la lista sale del reporte que sube Andreina en Nómina (RRHH no ve Pagos), en su orden: primero la corrida formal y después la interna, por banco
  // el monto de cada línea es el neto de su recibo, la misma cifra de la pre-nómina · la lista por persona solo la ven quienes ven sueldos
  // con el mismo candado que el lote del lunes: aprobado, no se cambia nada hasta tocar «Cambiar el pago»
  const PN = { menu: null, explica: null, recien: null, aprobado: false, enviado: false, nota: null, selloRecien: null, aprobadoEn: null, reabierto: null };
  const PNL = () => D.PAGO_NOMINA.lineas;
  const empDe = id => D.EMPLEADOS.find(e => e.id === id) || { nombre: '—', cargo: '', cuenta: '—', titular: '' };
  const netoDe = l => r2(A.lineaNomina(empDe(l.e)).neto);
  // lo que dice cada captura: el neto, o la cifra en Bs si se pagó redondeado
  const capNom = l => l.capBs != null ? r2(l.capBs / D.TASA.usd) : l.cap ? netoDe(l) : null;
  const capNomBs = l => l.capBs ?? r2(capNom(l) * D.TASA.usd);
  const partesCta = e => { const m = String(e.cuenta).match(/^(Pago móvil|\S+)\s+(.*)$/); return m ? [m[1], m[2]] : [e.cuenta, '']; }; // [banco, número tapado]
  const familiar = e => /\(V-/.test(e.titular || '');
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
  const porQueNom = q => [...q.distintas.map(l => `${esc(empDe(l.e).nombre)}: la captura dice ${dinero(capNom(l))} y la lista ${dinero(netoDe(l))}.`), ...q.faltan.map(l => `Falta la captura de ${esc(empDe(l.e).nombre)}.`)].join(' ');
  const firmaNomina = () => JSON.stringify(PNL().map(l => l.c ? [l.e, l.c, netoDe(l), l.cap ? 1 : 0, l.capBs ?? '', l.socio || ''] : [l.e]));
  function filaNom(l, i) {
    const e = empDe(l.e); const bl = bloqNom(l); const marcada = !!l.c && i !== PN.recien; const cap = capNom(l); const [banco, num] = partesCta(e);
    let cuenta;
    if (bl) cuenta = `<button class="alerta-btn" data-pn="explica" data-i="${i}" aria-expanded="${PN.explica === i}">${ic('candado', 's')}Cuenta por verificar</button>`;
    // con el pago aprobado, quien edita ve la cuenta con candado: al tocarla le dice cómo se cambia
    else if (puede('pagos', 'editar') && PN.aprobado && !PN.enviado) cuenta = ctaCerrada(l.c, 'nomina');
    // quien solo mira, o con el pago ya enviado, ve la cuenta como dato, no como un botón que no responde
    else cuenta = puede('pagos', 'editar') && !PN.enviado ? `<button class="cta-btn${l.c ? '' : ' vacia'}" data-pn="menu" data-i="${i}" aria-haspopup="menu" aria-expanded="${PN.menu === i}">${l.c ? `<span class="acct" data-c="${l.c}">${l.c}</span>` : 'Elegir cuenta'}${ic('abajo', 's')}</button>`
      : l.c ? `<span class="acct" data-c="${l.c}">${l.c}</span>` : '<span class="tenue">Sin elegir</span>';
    if (PN.menu === i) cuenta += `<div class="menu" role="menu" aria-label="De qué cuenta salió">${Object.keys(CTAS).map(k => `<button role="menuitem" data-pn="pick" data-i="${i}" data-c="${k}"><span class="acct" data-c="${k}">${k}</span><small>${CTAS[k]}</small></button>`).join('')}${l.c ? `<button role="menuitem" class="quitar" data-pn="pick" data-i="${i}" data-c="">Quitar la marca</button>` : ''}</div>`;
    const estado = bl ? tag('Por verificar', 'alerta') : !l.c ? tag('Sin pagar') : faltaSocio(l) ? tag('Falta decir qué socio', 'aviso') : cap == null ? tag('Falta la captura', 'aviso') : Math.abs(cap - netoDe(l)) >= 0.005 ? tag('No cuadra', 'aviso') : tag('Pagado', 'ok');
    let h = `<div class="lfila${marcada ? ' pagada' : ''}" role="row" data-n="${i}">
      <div class="c-prov" role="cell"><button data-abrir="pagonom:${i}"><span class="subraya" ${l.c ? `style="--m: ${resDe(l.c)}"` : ''}>${esc(e.nombre)}</span></button><small>N.º ${i + 1} · ${esc(num)}${familiar(e) ? ' · ' + aNombreDe(e) : ''}</small></div>
      <div class="c-vence" role="cell">${esc(banco)}</div>
      <div class="c-monto" role="cell">${dinero(netoDe(l))}</div>
      <div class="c-cuenta" role="cell">${cuenta}</div>
      <div class="c-estado" role="cell">${estado}</div>`;
    if (bl && PN.explica === i) h += `<div class="explica" role="cell"><p><b>${esc(e.cuentaNueva)}.</b> Cambiar la cuenta de alguien es la forma más común de desviar un sueldo. Confírmala con ${esc(e.nombre.split(' ')[0])}, en persona o a su número de siempre, antes de pagarle.</p>${A.boton('pagos', 'Ya confirmé con la persona', `data-pn="verificar" data-i="${i}"`, { tono: 'peligro', icono: 'candado', permiso: 'aprobar' })}</div>`;
    return h + '</div>';
  }
  function verificarCuentaEmp(id) {
    const e = empDe(id); e.cuentaVerificada = 'confirmada con la persona (' + S.usuario.nombre + ')'; delete e.cuentaNueva;
    D.PENDIENTES.filter(x => x.emp === id && !x.hecho).forEach(x => { x.hecho = 'Verificada por ' + S.usuario.nombre; });
    A.auditar({ modulo: 'Pagar la nómina', registro: e.nombre, campo: 'cuenta', antes: 'por verificar', despues: 'verificada con la persona' });
  }
  function lunesNomina() {
    const n = D.NOMINA.proxima; const ve = puede('nomina', 'sueldos'); const R = D.PAGO_NOMINA.reporte;
    const cabeza = `<article class="hoja"><div class="hoja-cab"><h2>${ic('nomina')}Nómina del ${esc(n.fecha)}</h2>${tag('Paso 1 de 4', 'aviso')}</div>
        <ol class="pasos"><li class="actual">Prepara Andreina</li><li>Revisa Jose</li><li>Aprueba Alejandro</li><li>Se paga</li></ol>
        <p class="muted">Cada paso lo hace una persona distinta. Hoy falta: <b>${esc(n.falta)}</b>.</p>`;
    const como = `<article class="hoja"><h2>Cómo se paga</h2><ol class="tiempo"><li><time>1</time><span>Andreina sube el reporte de pago en Nómina y la app arma la lista en ese orden. Ella no ve Pagos: le avisamos cuando todo esté pagado.</span></li><li><time>2</time><span>Se marca cada pago con la cuenta de donde salió.</span></li><li><time>3</time><span>Se suben todas las capturas de una vez y la app las casa.</span></li><li class="ok"><time>4</time><span>Sale el PDF al grupo «Pagos al Personal», con código.</span></li></ol></article>`;
    // quien ve la nómina agrupada (Luis, Eliana) no ve la lista por persona: solo cuántos pagos van hechos en cada corrida
    if (!ve) {
      const cuantos = f => { const ls = PNL().filter(l => empDe(l.e).formal === f); return ls.filter(l => l.c).length + ' de ' + ls.length + ' pagos hechos'; };
      return `<div class="rejilla"><div class="c7 pila">${cabeza}
          <dl class="kv"><div><dt>Corrida formal (${n.formal.personas} personas)</dt><dd>Agrupada</dd></div><div><dt>Corrida interna (${n.interna.personas} personas)</dt><dd>Agrupada</dd></div><div><dt>Total estimado <small class="tenue">sin los recargos de noche y domingo</small></dt><dd>${dinero(n.formal.total + n.interna.total)}</dd></div></dl>
          <p class="nota gris">${ic('candado', 's')}<span>No ves la lista por persona ni los sueldos. Solo dueño, RRHH y contabilidad.</span></p></article>
        <article class="hoja"><div class="hoja-cab"><h2>El pago del ejemplo</h2>${tag(PN.enviado ? 'Enviado' : PN.aprobado ? 'Aprobado' : 'Por aprobar', PN.enviado || PN.aprobado ? 'ok' : 'aviso')}</div>
          <dl class="kv"><div><dt>Corrida formal</dt><dd>${cuantos(true)}</dd></div><div><dt>Corrida interna</dt><dd>${cuantos(false)}</dd></div></dl></article></div>
        <div class="c5 pila">${como}<button class="btn sec" data-ir="nomina">Ir a la nómina ${ic('derecha', 's')}</button></div></div>`;
    }
    const q = cuadreNom(); const pagado = q.lista; const esDueno = puede('pagos', 'aprobar'); const puedeEd = puede('pagos', 'editar') && !PN.enviado; const sinSocio = PNL().filter(faltaSocio).length;
    const lista = f => { const ls = PNL().map((l, i) => ({ l, i })).filter(x => !!empDe(x.l.e).formal === f); const tot = r2(ls.reduce((s, x) => s + netoDe(x.l), 0));
      return `<div class="sec"><h2>${f ? 'Corrida formal' : 'Corrida interna'}</h2><span class="muted">${f ? 'va a los entes' : 'contrato interno'} · ${ls.length} personas · ${dinero(tot)}</span></div>
        <div class="libro-pagos" role="table" aria-label="${f ? 'Corrida formal' : 'Corrida interna'}"><div class="lcab" role="row"><span role="columnheader">Persona</span><span role="columnheader">Cobra en</span><span role="columnheader" class="r">Monto</span><span role="columnheader">Sale de</span><span role="columnheader" class="r">Estado</span></div>
          ${ls.map(x => filaNom(x.l, x.i)).join('')}</div>`; };
    const subt = Object.keys(CTAS).map(k => { const s = r2(PNL().filter(l => l.c === k).reduce((a, l) => a + netoDe(l), 0)); return s ? `<div><span class="acct" data-c="${k}">${k}</span><b>${dinero(s)}</b></div>` : ''; }).join('');
    const paso = PN.enviado ? `<div class="sello-linea">${A.sello('Enviado', { recien: PN.selloRecien === 'enviado', fecha: '05 OCT 2026' })}<span class="muted">Salió al grupo «Pagos al Personal» con el PDF y le avisamos a Andreina. (Simulado)</span></div>`
      : PN.aprobado ? `<div class="sello-linea">${selloAprobado(PN.aprobadoEn, PN.selloRecien === 'aprobado')}<span class="muted">Lo aprobó ${esc(PN.aprobadoEn.quien)} con su código${PN.nota ? ', con la nota de la diferencia' : ''}.</span></div>
          ${puede('pagos', 'editar') ? `<p class="nota gris">${ic('candado', 's')}<span><b>Aprobado.</b> Para cambiar algo, toca «Cambiar el pago».</span></p>` : ''}
          ${A.boton('pagos', 'Enviar al grupo', 'data-pn="enviar"', { icono: 'enviar' })}${A.boton('pagos', 'Cambiar el pago', 'data-pn="reabrir"', { tono: 'sec', icono: 'lapiz' })}`
        : (PN.reabierto ? `<div class="sello-linea">${selloTachado(PN.reabierto)}<span class="muted">Se reabrió a las ${esc(PN.reabierto.horaReabrio)} para cambiarlo (${esc(PN.reabierto.reabrio)}): «${esc(PN.reabierto.motivo)}». Hay que aprobarlo otra vez.</span></div>` : '')
          + (esDueno ? `<button class="btn pri full" data-pn="aprobar" ${pagado && !sinSocio ? '' : 'disabled'}>${ic('candado', 's')}Aprobar el pago</button>` : puede('pagos', 'editar') ? `<button class="btn bloq full" data-acc="sin-permiso" data-arg="pagos|aprobar" aria-disabled="true">${ic('candado', 's')}Aprobar el pago (lo aprueba Alejandro)</button>` : '');
    return `<div class="pila">
      ${cabeza}<p class="nota info">${ic('info', 's')}<span><b>Así se verá el pago.</b> La lista de abajo es un ejemplo a medio pagar con la pre-nómina estimada. La de verdad sale del reporte que sube Andreina en Nómina después del visto final de Alejandro.</span></p></article>
      <div class="hoja" style="gap:8px"><p class="progress-line" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><span>Pagado <b class="num">${dinero(pagado)}</b> de <b class="num">${dinero(q.tot)}</b></span><span class="muted">${q.sin.length ? 'Faltan ' + q.sin.length + (q.sin.length === 1 ? ' pago' : ' pagos') : 'Todo pagado'}</span></p><div class="pista" style="height:10px"><span style="width:${q.tot ? (pagado / q.tot * 100).toFixed(1) : 0}%;background:var(--tinta)"></span></div></div>
      <div class="pagos-rej">
        <div class="pila">${lista(true)}${lista(false)}
          <p class="muted">Se muestran ${PNL().length} de las 49 personas (datos inventados). El monto es el neto de cada recibo: la misma cifra de la pre-nómina. Se calcula en dólares y se paga en bolívares a la tasa BCV del día.</p></div>
        <aside class="lado">
          <section class="hoja"><h2>Reporte de RRHH</h2>
            <button class="adjunto" data-acc="ver-archivo" data-arg="${esc(R.archivo)}">${ic('archivo', 's')}<span>${esc(R.archivo)}</span></button>
            <p class="muted">Lo subió ${esc(R.subio)} en Nómina · ${esc(R.cuando.charAt(0).toLowerCase() + R.cuando.slice(1))}. La lista va en su orden: primero la corrida formal y después la interna, cada una por banco.</p></section>
          <section class="hoja"><h2>Comprobantes</h2>
            ${puedeEd ? (PN.aprobado ? soltarCerrado('nomina') : `<label class="soltar" for="capturas-nom">${ic('subir')}<span><b>Sube todas las capturas de una vez</b>La app las lee y las casa con cada persona.</span></label>
            <input type="file" id="capturas-nom" accept="image/*,application/pdf" multiple class="sr-only">`) : ''}
            <button class="enlace" data-abrir="capturas:nomina">${q.n} leídas · ${q.n} casadas · ${q.faltan.length} por subir ${ic('derecha', 's')}</button></section>
          <section class="hoja"><h2>Cuadre</h2>
            <dl class="kv"><div><dt>Lista de la nómina</dt><dd>${dinero(q.tot)}</dd></div><div><dt>Sin pagar (${q.sin.length})</dt><dd>− ${dinero(q.sinM)}</dd></div><div class="total"><dt>Lista − sin pagar</dt><dd>${dinero(q.lista)}</dd></div><div><dt>Suma de las capturas (${q.n})</dt><dd>${dinero(q.caps)}</dd></div>${q.dif ? `<div><dt>Diferencia</dt><dd>${q.dif > 0 ? '+' : '−'} ${dinero(Math.abs(q.dif))}</dd></div>` : ''}</dl>
            ${q.dif ? `<p class="muted">${porQueNom(q)}</p>` : ''}
            <p class="muted">≈ ${dinero(pagado * D.TASA.usd, 'bs')} a la tasa BCV de hoy (${fmt(D.TASA.usd)}). Cada pago guarda su propia tasa y su comisión.</p>
            <div class="subtot">${subt}</div>
            <p>${q.dif ? tag('No cuadra por ' + dinero(Math.abs(q.dif)), 'aviso') : q.n ? tag('Cuadra con las capturas', 'ok') : tag('Todavía no hay capturas', '')}</p>
            ${PN.nota ? `<p class="nota gris">${ic('lapiz', 's')}<span><b>Nota de la diferencia:</b> ${esc(PN.nota)}</span></p>` : ''}
          </section>
          <div class="pila" style="gap:8px">
            <button class="btn sec full" data-abrir="pdf:nomina">${ic('archivo', 's')}Ver la hoja 1 del PDF</button>
            ${paso}
            <p class="muted" style="text-align:center">${PN.enviado ? '' : sinSocio ? 'Para aprobar, abre ' + (sinSocio === 1 ? 'el pago marcado' : 'los ' + sinSocio + ' pagos marcados') + ' con SOCIO o APORTE y di qué socio pagó.' : PN.aprobado ? 'Va al grupo «Pagos al Personal». Te pedirá tu código.' : q.dif ? 'No cuadra: al aprobar te pide una nota que explique la diferencia.' : 'Primero se aprueba con código, después se envía.'}</p>
          </div>
        </aside>
      </div></div>`;
  }
  const LOTES = [['Lunes 28 sep', 14, 9310.40], ['Lunes 21 sep', 11, 7215.00], ['Lunes 14 sep', 15, 10102.75]];
  // la nómina pagada también queda como lote: una fila por fecha de pago, con sus corridas
  const lotesNomina = () => [...new Set(D.NOMINA.corridas.map(c => c.fecha))].map(f => { const cs = D.NOMINA.corridas.filter(c => c.fecha === f); return { f, cs, personas: cs.filter(c => c.tipo === 'formal' || c.tipo === 'interna').reduce((s, c) => s + c.personas, 0), usd: r2(cs.reduce((s, c) => s + c.usd, 0)) }; });
  function anteriores() {
    return A.tabla({ cols: [{ t: 'Lote', cls: 'p' }, { t: 'Pagos', cls: 'x' }, { t: 'Aprobó', cls: 'x' }, { t: 'Total', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: LOTES.map(([f, n, t]) => ({ abrir: 'pdf:' + f, celdas: [`<b>${f}</b><small>PDF enviado al grupo</small>`, n, 'Alejandro', dinero(t), tag('Enviado', 'ok')] })) })
      + `<div class="sec"><h2>Nómina</h2><span class="muted">cada fecha con sus corridas: la formal, la interna, el 10 % y el premio</span></div>`
      + A.tabla({ cols: [{ t: 'Nómina', cls: 'p' }, { t: 'Personas', cls: 'x' }, { t: 'Aprobó', cls: 'x' }, { t: 'Total', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: lotesNomina().map(x => ({ abrir: 'pdf:nom|' + x.f, celdas: [`<b>Nómina del ${esc(x.f)}</b><small>${x.cs.length} corridas · PDF enviado a «Pagos al Personal»</small>`, x.personas, 'Alejandro', '≈ ' + dinero(x.usd), tag('Enviado', 'ok')] })) })
      + `<p class="muted">El total de la nómina va en dólares a la tasa de cada día de pago; el 10 % se paga en euros.</p>`;
  }
  PANT.pagos = {
    titulo: 'Pagos de los lunes', corto: 'Pagos', tab: 'Pagos', grupo: 'Dinero que sale', icono: 'pagos', mod: 'pagos', palabras: 'pagar lunes lote transferencia',
    secciones: [['lunes', 'Proveedores', 'lote capturas'], ['nomina', 'Pagar la nómina', 'sueldos quincena'], ['anteriores', 'Lotes anteriores', 'historial pdf']],
    cuenta: () => D.LUNES.filter(r => !r.c).length,
    render: (sub = 'lunes') => `<div class="pagina">
      ${A.cab(D.HOY.largo, 'Pagos de los lunes', 'La lista se armó sola a las 6:00 con todo lo que vence antes del lunes que viene. <b>Hoy usa las facturas importadas a mano el domingo 4</b>: la copia automática de Odoo sigue bloqueada hasta que se arregle el candado.', puede('pagos', 'editar') && sub === 'lunes' ? (P.aprobado ? `<button class="btn bloq chico" data-acc="lote-cerrado" data-arg="lunes" aria-disabled="true">${ic('candado', 's')}Agregar una línea</button>` : `<button class="btn sec chico" data-acc="linea-nueva">${ic('mas', 's')}Agregar una línea</button>`) : '')}
      ${A.lectura('pagos')}
      ${A.subnav([['lunes', 'Proveedores', D.LUNES.filter(r => !r.c).length, true], ['nomina', 'Pagar la nómina', PNL().filter(l => !l.c).length, true], ['anteriores', 'Lotes anteriores']], sub)}
      ${sub === 'lunes' ? lunesProveedores() : sub === 'nomina' ? lunesNomina() : anteriores()}
    </div>`,
    montar: raiz => {
      const cap = $('#capturas', raiz);
      // simulado: las capturas nuevas casan con las líneas marcadas que todavía no tienen la suya
      if (cap) cap.addEventListener('change', e => {
        const n = e.target.files.length; if (!n) return;
        if (P.aprobado) { ACC['lote-cerrado']('lunes'); return; }
        const sinCap = D.LUNES.filter(r => r.c && r.cap == null); sinCap.forEach(r => { r.cap = r.m; });
        A.pintarPagina();
        A.aviso(n + (n === 1 ? ' captura nueva. ' : ' capturas nuevas. ') + (sinCap.length ? 'Casaron con ' + sinCap.map(r => prov(r.p).nombre).join(', ') + '. (Simulado)' : 'Ninguna línea marcada estaba sin captura. (Simulado)'), 'info');
      });
      // lo mismo en la nómina: casan con las personas marcadas que todavía no tienen la suya
      const capN = $('#capturas-nom', raiz);
      if (capN) capN.addEventListener('change', e => {
        const n = e.target.files.length; if (!n) return;
        if (PN.aprobado) { ACC['lote-cerrado']('nomina'); return; }
        const sinCap = PNL().filter(l => l.c && capNom(l) == null); sinCap.forEach(l => { l.cap = true; });
        A.pintarPagina();
        A.aviso(n + (n === 1 ? ' captura nueva. ' : ' capturas nuevas. ') + (sinCap.length ? 'Casaron con ' + sinCap.map(l => empDe(l.e).nombre).join(', ') + '. (Simulado)' : 'Ninguna persona marcada estaba sin captura. (Simulado)'), 'info');
      });
    },
  };
  // «Cambiar el lote» (o «Cambiar el pago» de la nómina): reabre lo aprobado con motivo. El sello queda tachado, «Enviar al grupo»
  // se apaga y vuelve a quedar por aprobar; si lo reabre alguien que no aprueba, a Alejandro le llega el pendiente
  // (la versión que muestra solo lo que cambió llega en otra ronda)
  function reabrir(cual) {
    const X = cual === 'nomina' ? PN : P; const que = cual === 'nomina' ? 'el pago' : 'el lote'; const boton = cual === 'nomina' ? 'Cambiar el pago' : 'Cambiar el lote';
    if (!X.aprobado || X.enviado) return;
    A.pedirMotivo({ titulo: boton, texto: `${que.charAt(0).toUpperCase() + que.slice(1)} vuelve a quedar por aprobar: el sello se tacha y «Enviar al grupo» se apaga hasta que ${esc(A.quienAprueba('pagos'))} lo apruebe otra vez.`, etiqueta: 'Qué hay que cambiar', boton }).then(m => {
      X.reabierto = { ...X.aprobadoEn, reabrio: S.usuario.nombre, horaReabrio: D.HOY.hora, motivo: m };
      X.aprobado = false; X.aprobadoEn = null; X.nota = null;
      A.auditar({ modulo: cual === 'nomina' ? 'Pagar la nómina' : 'Pagos de los lunes', registro: cual === 'nomina' ? 'Nómina del ' + D.PAGO_NOMINA.corto : 'Lote del ' + LOTE, campo: 'estado', antes: 'aprobado', despues: 'por aprobar: se reabrió para cambiarlo', motivo: m });
      if (!puede('pagos', 'aprobar')) D.PENDIENTES.unshift({ id: 'pe' + Date.now(), para: ['alejandro'], tipo: 'aviso', titulo: cual === 'nomina' ? 'Aprobar otra vez el pago de la nómina' : 'Aprobar otra vez el lote del lunes', sub: S.usuario.nombre + ' lo reabrió para cambiarlo: «' + m + '»', de: S.usuario.nombre, edad: 'Ahora', ir: 'pagos', sub2: cual === 'nomina' ? 'nomina' : 'lunes', lote: cual });
      A.pintarPagina(); A.aviso('Ya puedes cambiar ' + que + '. Quedó por aprobar otra vez.');
    }).catch(() => {});
  }
  // al aprobar otra vez, el pendiente de «aprobar otra vez» queda resuelto
  const cierraReabierto = cual => D.PENDIENTES.filter(p => p.lote === cual && !p.hecho).forEach(p => { p.hecho = 'Aprobado otra vez por ' + S.usuario.nombre; });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pl]');
    if (!b) { if (P.menu !== null && !e.target.closest('.c-cuenta') && S.ruta === 'pagos') { P.menu = null; A.pintarPagina(); } return; }
    const i = +b.dataset.i; const a = b.dataset.pl;
    // aprobado, el lote no se toca: ni la cuenta de una línea ni las dudas de las capturas
    if (P.aprobado && ['menu', 'pick', 'duda'].includes(a)) { P.menu = null; ACC['lote-cerrado']('lunes'); return; }
    if (a === 'menu') { P.menu = P.menu === i ? null : i; A.pintarPagina(); const f = $('.menu button'); if (f) f.focus(); }
    else if (a === 'pick') {
      const r = D.LUNES[i]; const k = b.dataset.c || null; const antes = r.c; r.c = k; P.menu = null; if (k && k !== antes) P.recien = i;
      // si cambia de dónde salió, la captura de la cuenta anterior ya no casa (queda «Falta la captura») y el socio solo vale para SOCIO o APORTE
      const soltada = k !== antes && r.cap != null; if (soltada) { delete r.cap; delete r.capBs; }
      if (k !== antes && !DE_SOCIO.includes(k)) delete r.socio;
      A.auditar({ modulo: 'Pagos de los lunes', registro: prov(r.p).nombre, campo: 'sale de', antes: antes || 'sin pagar', despues: k || 'sin pagar' });
      if (soltada) A.aviso(k ? 'La captura que había salió de ' + antes + ': ya no casa. Sube la de ' + k + '.' : 'Quitaste la marca: la captura que había ya no casa con esta línea.', 'info');
      A.pintarPagina(); A.pintarPagina();
      if (P.recien !== null) { const j = P.recien; P.recien = null; requestAnimationFrame(() => requestAnimationFrame(() => { const el = $(`.lfila[data-i="${j}"]`); if (el) el.classList.add('pagada'); })); }
    }
    else if (a === 'explica') { P.explica = P.explica === i ? null : i; A.pintarPagina(); }
    else if (a === 'verificar') A.pedirCodigo((c => ({ que: 'Cuenta nueva de ' + esc(prov(D.LUNES[i].p).nombre) + (c ? ' · ' + esc(etiq(c)) : ''), det: 'Confirmas que llamaste al proveedor a su número de siempre y que la cuenta es suya.' + (c && c.titular ? ' A nombre de ' + esc(c.titular) + '.' : ''), boton: 'Ya confirmé por teléfono' }))(cuentaDe(D.LUNES[i]))).then(() => { verificarCuentas(D.LUNES[i].p); P.explica = null; A.pintarPagina(); A.aviso('Cuenta verificada. Ya puedes marcar el pago.'); }).catch(() => {});
    else if (a === 'duda') { P.dudas[b.dataset.d] = b.dataset.r; if (b.dataset.d === 'pollos') P.pollos = b.dataset.v; A.pintarPagina(); }
    else if (a === 'aprobar') {
      const q = cuadre(); const n = D.LUNES.filter(r => r.c).length;
      if (D.LUNES.some(faltaSocio)) { A.aviso('Di qué socio pagó en las líneas marcadas con SOCIO o APORTE antes de aprobar.', 'info'); return; }
      const listo = nota => {
        P.aprobado = true; P.nota = nota || null; P.selloRecien = 'aprobado'; setTimeout(() => { P.selloRecien = null; }, 60);
        P.aprobadoEn = { ...aprobacion(q.lista), firma: firmaLunes() }; P.reabierto = null; cierraReabierto('lunes');
        A.auditar({ modulo: 'Pagos de los lunes', registro: 'Lote del 5 oct', campo: 'estado', antes: 'preparado', despues: 'aprobado · ' + dinero(q.lista), motivo: nota ? 'Diferencia de ' + dinero(Math.abs(q.dif)) + ': ' + nota : '' }); A.pintarPagina(); A.aviso('Lote aprobado. Ahora puedes enviarlo.');
      };
      // si la lista menos lo que no se pagó no da la suma de las capturas, no se aprueba sin una nota
      if (q.dif) A.pedirMotivo({ titulo: 'Aprobar el lote con una diferencia', texto: `La lista menos lo que no se pagó da <b>${dinero(q.lista)}</b> y las capturas suman <b>${dinero(q.caps)}</b>. Explica la diferencia de <b>${dinero(Math.abs(q.dif))}</b>: la nota sale en el PDF.`, etiqueta: 'Nota de la diferencia', boton: 'Aprobar el lote', codigo: codigoLote(q, n) }).then(listo).catch(() => {});
      else A.pedirCodigo(codigoLote(q, n)).then(() => listo(null)).catch(() => {});
    }
    else if (a === 'enviar') {
      if (!P.aprobado) return;
      // al grupo solo sale lo que se aprobó: si el lote ya no es el de la firma, queda por aprobar otra vez
      if (P.aprobadoEn.firma !== firmaLunes()) { P.reabierto = { ...P.aprobadoEn, reabrio: 'la app', horaReabrio: D.HOY.hora, motivo: 'el lote cambió después de aprobarlo' }; P.aprobado = false; P.aprobadoEn = null; P.nota = null; A.pintarPagina(); A.aviso('El lote cambió después de aprobarlo: no salió nada al grupo. Hay que aprobarlo otra vez.', 'info'); return; }
      A.pedirCodigo({ que: 'Enviar el lote del lunes · ' + pagosTxt(D.LUNES.filter(r => r.c).length) + ' · ' + dinero(P.aprobadoEn.total), det: 'Va al grupo «Comprobantes de pago» con el PDF. Las facturas de las líneas pagadas quedan pagadas.', boton: 'Enviar al grupo' }).then(() => { P.enviado = true; P.selloRecien = 'enviado'; setTimeout(() => { P.selloRecien = null; }, 60); A.auditar({ modulo: 'Pagos de los lunes', registro: 'Lote del 5 oct', campo: 'estado', antes: 'aprobado', despues: 'enviado' }); pagarLote(); A.pintarPagina(); A.aviso('Enviado al grupo. Las facturas pagadas quedaron cerradas. (Simulado)'); }).catch(() => {});
    }
    else if (a === 'reabrir') reabrir('lunes');
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && P.menu !== null) { P.menu = null; A.pintarPagina(); } });
  // pagar la nómina: marcar persona por persona, verificar una cuenta nueva, aprobar y enviar (como los proveedores)
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pn]');
    if (!b) { if (PN.menu !== null && !e.target.closest('.c-cuenta') && S.ruta === 'pagos') { PN.menu = null; A.pintarPagina(); } return; }
    const i = +b.dataset.i; const a = b.dataset.pn; const l = PNL()[i];
    // aprobado, el pago no se toca: la cuenta de cada persona queda con candado
    if (PN.aprobado && ['menu', 'pick'].includes(a)) { PN.menu = null; ACC['lote-cerrado']('nomina'); return; }
    if (a === 'menu') { PN.menu = PN.menu === i ? null : i; A.pintarPagina(); const f = $('.menu button'); if (f) f.focus(); }
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
    else if (a === 'aprobar') {
      const q = cuadreNom(); const n = PNL().filter(x => x.c).length;
      if (PNL().some(faltaSocio)) { A.aviso('Di qué socio pagó en los pagos marcados con SOCIO o APORTE antes de aprobar.', 'info'); return; }
      const listo = nota => {
        PN.aprobado = true; PN.nota = nota || null; PN.selloRecien = 'aprobado'; setTimeout(() => { PN.selloRecien = null; }, 60);
        PN.aprobadoEn = { ...aprobacion(q.lista), firma: firmaNomina() }; PN.reabierto = null; cierraReabierto('nomina');
        A.auditar({ modulo: 'Pagar la nómina', registro: 'Nómina del ' + D.PAGO_NOMINA.corto, campo: 'estado', antes: 'por aprobar', despues: 'aprobada · ' + dinero(q.lista), motivo: nota ? 'Diferencia de ' + dinero(Math.abs(q.dif)) + ': ' + nota : '' }); A.pintarPagina(); A.aviso('Pago aprobado. Ahora puedes enviarlo.');
      };
      // si la lista menos lo que no se pagó no da la suma de las capturas, no se aprueba sin una nota
      if (q.dif) A.pedirMotivo({ titulo: 'Aprobar el pago con una diferencia', texto: `La lista menos lo que no se pagó da <b>${dinero(q.lista)}</b> y las capturas suman <b>${dinero(q.caps)}</b>. Explica la diferencia de <b>${dinero(Math.abs(q.dif))}</b>: la nota sale en el PDF.`, etiqueta: 'Nota de la diferencia', boton: 'Aprobar el pago', codigo: codigoNom(q, n) }).then(listo).catch(() => {});
      else A.pedirCodigo(codigoNom(q, n)).then(() => listo(null)).catch(() => {});
    }
    // al enviar, le avisamos a Andreina: ella no ve Pagos · al grupo solo sale lo que se aprobó
    else if (a === 'enviar') {
      if (!PN.aprobado) return;
      if (PN.aprobadoEn.firma !== firmaNomina()) { PN.reabierto = { ...PN.aprobadoEn, reabrio: 'la app', horaReabrio: D.HOY.hora, motivo: 'la lista cambió después de aprobarla' }; PN.aprobado = false; PN.aprobadoEn = null; PN.nota = null; A.pintarPagina(); A.aviso('La lista cambió después de aprobarla: no salió nada al grupo. Hay que aprobarla otra vez.', 'info'); return; }
      A.pedirCodigo({ que: 'Enviar el pago de la nómina del ' + esc(D.PAGO_NOMINA.corto) + ' · ' + pagosTxt(PNL().filter(x => x.c).length) + ' · ' + dinero(PN.aprobadoEn.total), det: 'Va al grupo «Pagos al Personal» con el PDF. Le avisamos a Andreina.', boton: 'Enviar al grupo' }).then(() => {
        const q = cuadreNom(); PN.enviado = true; PN.selloRecien = 'enviado'; setTimeout(() => { PN.selloRecien = null; }, 60);
        A.auditar({ modulo: 'Pagar la nómina', registro: 'Nómina del ' + D.PAGO_NOMINA.corto, campo: 'estado', antes: 'aprobada', despues: 'enviada' });
        D.PENDIENTES.unshift({ id: 'pe' + Date.now(), para: ['andreina'], tipo: 'info', titulo: 'Salió el pago de la nómina del ' + D.PAGO_NOMINA.corto, sub: 'El PDF llegó a «Pagos al Personal»' + (q.sin.length ? ' · quedan ' + q.sin.length + ' por pagar' : '') + ' · faltan los recibos firmados', de: 'La app', edad: 'Ahora', ir: 'nomina', sub2: 'recibos' });
        A.pintarPagina(); A.aviso('Enviado al grupo. Le avisamos a Andreina. (Simulado)');
      }).catch(() => {});
    }
    else if (a === 'reabrir') reabrir('nomina');
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && PN.menu !== null) { PN.menu = null; A.pintarPagina(); } });
  ACC['linea-nueva'] = () => P.aprobado ? ACC['lote-cerrado']('lunes') : A.aviso('Jose puede agregar o quitar líneas antes de aprobar el lote; queda el motivo. (Simulado)', 'info');
  FICHAS.lineapago = i => {
    // las facturas que cubre: las abiertas y, si el lote ya salió, las que pagó (con lo que debían antes de pagarse)
    const r = D.LUNES[i]; const pv = prov(r.p); const facts = facturasDe(r);
    const retIva = r2(facts.reduce((s, f) => s + (f.ret ? f.ret.usd : 0), 0)), retIslr = r2(facts.reduce((s, f) => s + (f.retIslr ? f.retIslr.usd : 0), 0));
    const saldo = r2(facts.reduce((s, f) => s + saldoDelLote(f), 0)); const brutas = r2(saldo + retIva + retIslr);
    const c = cuentaDe(r); const ops = activas(pv); const pend = facts.filter(f => f.retPend);
    const distinta = r.cap != null && Math.abs(r.cap - r.m) >= 0.005; const com = comDe(r);
    const capTxt = r.cap != null ? `Sí · ref. ${refDe(i)} · dice ${dinero(r.cap)}${r.capBs ? ` <small class="tenue">(${dinero(r.capBs, 'bs')})</small>` : ''}${distinta ? ' ' + tag('No cuadra', 'aviso') : ''}` : r.c ? tag('Falta la captura', 'aviso') : 'Todavía no';
    // pagado en efectivo o por Binance no va a su cuenta del banco
    const ctaProv = r.c === 'BOV' ? { l: 'Cómo se le paga', v: 'Se le entrega en efectivo, con recibo firmado' }
      : r.c === 'BIN' ? { l: 'Cuenta del proveedor', v: 'Su Binance ' + tag('Falta en su ficha', 'aviso') }
      : { l: 'Cuenta del proveedor', v: c ? `<span><b>${esc(etiq(c))}</b>${c.nueva ? ' ' + tag('Por verificar', 'alerta') : ''}<br><small class="tenue">${titularTxt(c)}</small></span>` : '—', campo: ops.length > 1 ? { k: 'cta', tipo: 'select', opciones: ops.map(x => [etiq(x), etiq(x) + ' · ' + x.titular]), sensible: true } : undefined };
    const filas = (retIva || retIslr ? [{ l: 'Facturas', v: dinero(brutas) }] : [])
      .concat(retIva ? [{ l: '− Retención de IVA', v: `− ${dinero(retIva)} <small class="tenue">se le paga al SENIAT</small>` }] : [])
      .concat(retIslr ? [{ l: '− Retención de ISLR', v: `− ${dinero(retIslr)} <small class="tenue">se le paga al SENIAT</small>` }] : []).concat([
      { l: 'A pagar ($)', v: dinero(r.m) + (retIva || retIslr ? ` <small class="tenue">= facturas − ${retIva && retIslr ? 'retenciones' : 'retención'}</small>` : '') + (Math.abs(r.m - saldo) >= 0.005 ? ' ' + tag('Distinto de las facturas', 'aviso') : ''), campo: { k: 'm', tipo: 'dinero', obligatorio: true } },
      { l: 'Moneda del pago', v: r.c ? `${monedaDe(r.c)} <small class="tenue">${enMoneda(r.c, r.m)}</small>` : 'Depende de la cuenta de donde salga' },
      ...(DE_SOCIO.includes(r.c) ? [{ l: 'Qué socio', v: r.socio ? esc(r.socio) : tag('Falta decir cuál', 'aviso'), campo: { k: 'socio', tipo: 'select', opciones: [['', 'Falta decir cuál']].concat(D.SOCIOS.map(s => [s.nombre, s.nombre])) } }] : []),
      ctaProv,
      { l: 'Comisión del banco', v: r.cap == null ? '—' : com ? dinero(com, 'bs') : BANCO_DE[r.c] ? 'Bs 0,00 <small class="tenue">mismo banco</small>' : 'No aplica' },
      { l: 'Captura casada', v: capTxt }]);
    // con el lote aprobado la línea queda con candado: el monto, la cuenta, el socio, dividirla y quitarla, hasta tocar «Cambiar el lote»
    const cerrado = P.aprobado && !P.enviado;
    return { titulo: pv.nombre, sub: 'Línea del lunes · ' + esc(r.f), mod: 'pagos', obj: r, registro: 'Línea ' + pv.nombre,
      tags: [[bloq(r) ? 'Cuenta por verificar' : r.c ? 'Pagado desde ' + r.c : 'Sin pagar', bloq(r) ? 'alerta' : r.c ? 'ok' : '']],
      aviso: (bloq(r) ? `<p class="nota alerta">${ic('candado', 's')}<span><b>Cuenta por verificar.</b> ${esc(c.nueva)}. Llama al proveedor a su número de siempre antes de pagarle.</span></p>` : '')
        + (cerrado && puede('pagos', 'editar') ? `<p class="nota gris">${ic('candado', 's')}<span><b>El lote está aprobado.</b> Para cambiar esta línea, toca «Cambiar el lote» en la lista.</span></p>` : ''),
      bloques: [
        { titulo: 'Facturas que cubre', html: `<ul class="lista">${facts.map(f => `<li><button class="fila" data-abrir="factura:${f.id}"><span class="lead${f.pago && f.pago.lote === LOTE ? ' ok' : ''}">${ic(f.pago && f.pago.lote === LOTE ? 'check' : 'archivo')}</span><span class="medio"><b>N.º ${esc(f.num)}</b><small>Vence ${esc(f.vence)}${retsDe(f) ? ` · ${dinero(f.monto)} − retención ${dinero(retsDe(f))}` : ''}${f.pago && f.pago.lote === LOTE ? (f.pago.parcial ? ` · pagada en parte: quedan ${dinero(f.saldo)}` : ' · pagada en este lote') : ''}</small></span><span class="monto">${dinero(saldoDelLote(f))}</span></button></li>`).join('')}</ul>` },
        { titulo: 'El pago', filas },
        pend.length ? { html: `<p class="nota aviso">${ic('alerta', 's')}<span>Falta emitir la retención de IVA de la factura N.º ${pend.map(f => `${esc(f.num)} (${f.retPend.pct} %, ≈ ${dinero(f.retPend.usd)})`).join(', ')}. Cuando se emita, baja de lo que se le paga.</span></p>` } : { oculto: true },
      ],
      bloqueada: P.aprobado || P.enviado, bloqueo: P.enviado ? 'El lote ya salió al grupo: esta línea no se edita.' : 'El lote está aprobado: esta línea no se edita. Para cambiar algo, toca «Cambiar el lote» en la lista.',
      acciones: P.enviado ? [] : [{ txt: 'Dividir en dos cuentas', acc: cerrado ? 'lote-cerrado' : 'pronto', arg: cerrado ? 'lunes' : undefined, icono: 'mas', solo: 'editar', bloq: cerrado }, { txt: 'Quitar de la lista', acc: cerrado ? 'lote-cerrado' : 'quitar-linea', arg: cerrado ? 'lunes' : i, icono: 'anular', solo: 'editar', bloq: cerrado }],
      alGuardar: cambios => { if (cambios.some(x => x.r.campo.k === 'cta') && bloq(r)) r.c = null; } };
  };
  ACC['quitar-linea'] = i => P.aprobado ? ACC['lote-cerrado']('lunes') : A.pedirMotivo({ titulo: 'Quitar de la lista', texto: 'La factura sigue abierta: solo sale de la lista de hoy.', boton: 'Quitar' }).then(m => { A.auditar({ modulo: 'Pagos de los lunes', registro: prov(D.LUNES[i].p).nombre, campo: 'lista', antes: 'en la lista', despues: 'quitada', motivo: m }); A.aviso('Quitada de la lista de hoy. (Simulado: la fila sigue para que la veas)'); A.cerrarFicha(); }).catch(() => {});
  // una persona de la lista de la nómina: el monto viene de la nómina aprobada y no se edita aquí
  const soloSueldos = (titulo, sub) => ({ titulo, sub, mod: 'pagos', bloques: [{ html: `<p class="nota gris">${ic('candado', 's')}<span>El detalle por persona lo ven el dueño, RRHH y contabilidad.</span></p>` }] });
  FICHAS.pagonom = i => {
    if (!puede('nomina', 'sueldos')) return soloSueldos('Pago de la nómina', 'Pagar la nómina');
    const l = PNL()[+i]; const e = empDe(l.e); const m = netoDe(l); const cap = capNom(l); const bl = bloqNom(l);
    const distinta = cap != null && Math.abs(cap - m) >= 0.005; const com = comNom(l);
    const capTxt = cap != null ? `Sí · ref. ${refNom(+i)} · dice ${dinero(cap)}${l.capBs != null ? ` <small class="tenue">(${dinero(l.capBs, 'bs')})</small>` : ''}${distinta ? ' ' + tag('No cuadra', 'aviso') : ''}` : l.c ? tag('Falta la captura', 'aviso') : 'Todavía no';
    return { titulo: e.nombre, sub: 'Pagar la nómina · ' + (e.formal ? 'corrida formal' : 'corrida interna') + ' · N.º ' + (+i + 1) + ' del reporte', mod: 'pagos', obj: l, registro: 'Pago de nómina · ' + e.nombre,
      tags: [[bl ? 'Cuenta por verificar' : l.c ? 'Pagado desde ' + l.c : 'Sin pagar', bl ? 'alerta' : l.c ? 'ok' : '']],
      aviso: (bl ? `<p class="nota alerta">${ic('candado', 's')}<span><b>Cuenta por verificar.</b> ${esc(e.cuentaNueva)}. Confírmala con la persona antes de pagarle.</span></p>` : '')
        + (PN.aprobado && !PN.enviado && puede('pagos', 'editar') ? `<p class="nota gris">${ic('candado', 's')}<span><b>El pago está aprobado.</b> Para cambiar algo, toca «Cambiar el pago» en la lista.</span></p>` : ''),
      bloques: [
        { titulo: 'El pago', filas: [
          { l: 'A pagar ($)', v: dinero(m) + ' <small class="tenue">el neto de su recibo</small>' },
          { l: 'Moneda del pago', v: l.c ? `${monedaDe(l.c)} <small class="tenue">${enMoneda(l.c, m)}</small>` : 'Depende de la cuenta de donde salga' },
          ...(DE_SOCIO.includes(l.c) ? [{ l: 'Qué socio', v: l.socio ? esc(l.socio) : tag('Falta decir cuál', 'aviso'), campo: { k: 'socio', tipo: 'select', opciones: [['', 'Falta decir cuál']].concat(D.SOCIOS.map(s => [s.nombre, s.nombre])) } }] : []),
          { l: 'Cuenta de la persona', v: `<span><b>${esc(e.cuenta)}</b>${bl ? ' ' + tag('Por verificar', 'alerta') : ''}<br><small class="tenue">${aNombreDe(e)}${e.cuentaVerificada ? ' · ' + esc(e.cuentaVerificada) : ''}</small></span>` },
          { l: 'Comisión del banco', v: cap == null ? '—' : com ? dinero(com, 'bs') : BANCO_DE[l.c] ? 'Bs 0,00 <small class="tenue">mismo banco</small>' : 'No aplica' },
          { l: 'Captura casada', v: capTxt }] },
        { html: `<button class="enlace" data-abrir="recibo:${e.id}">Ver su recibo ${ic('derecha', 's')}</button><p class="muted">El monto sale de la nómina aprobada: si está mal, se corrige en la nómina, no aquí. La captura se casa con la persona por su cuenta, el titular y el monto.</p>` }],
      bloqueada: PN.aprobado || PN.enviado, bloqueo: PN.enviado ? 'El pago ya salió al grupo: esta línea no se edita.' : 'El pago está aprobado: esta línea no se edita. Para cambiar algo, toca «Cambiar el pago» en la lista.' };
  };
  FICHAS.capturas = id => {
    if (id === 'nomina') {
      if (!puede('nomina', 'sueldos')) return soloSueldos('Capturas de la nómina', 'Pagar la nómina');
      const qn = cuadreNom();
      const filas = PNL().map((l, i) => ({ l, i })).filter(x => x.l.c).map(({ l, i }) => { const e = empDe(l.e); const cap = capNom(l); const dif = cap != null && Math.abs(cap - netoDe(l)) >= 0.005;
        return { celdas: [`<b>${esc(e.nombre)}</b><small>${cap != null ? 'Ref. ' + refNom(i) + ' · ' : ''}desde ${l.c} · a ${esc(e.cuenta)}${familiar(e) ? ' (' + esc(e.titular.replace(/^Su /, 'su ')) + ')' : ''}</small>`, cap != null ? dinero(cap) : '—', cap == null ? tag('Falta la captura', 'aviso') : dif ? tag('No cuadra', 'aviso') : tag('Casada', 'ok')] }; });
      return { titulo: 'Capturas de la nómina', sub: 'Pagar la nómina · ' + qn.n + ' leídas', mod: 'pagos',
        bloques: [{ html: A.tabla({ cols: [{ t: 'Captura', cls: 'p' }, { t: 'Monto', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas, vacio: 'Todavía no hay pagos marcados.' }) },
          { html: '<p class="muted">De cada captura se lee la cuenta que recibe, el titular, la referencia y el monto, y se casa con la persona por la cuenta de su ficha. Un pago a la cuenta de un familiar se reconoce por el titular anotado en la ficha. Si la cuenta que recibe no es la de la persona, avisa.</p>' }] };
    }
    const q = cuadre(); const pl = pollos();
    const filas = D.LUNES.map((r, i) => ({ r, i })).filter(x => x.r.c).map(({ r, i }) => {
      const c = cuentaDe(r); const dif = r.cap != null && Math.abs(r.cap - r.m) >= 0.005;
      const a = r.c === 'BOV' ? ' · en efectivo, con recibo' : r.c === 'BIN' ? ' · a su Binance' : c ? ' · a ' + esc(etiq(c)) + (c.otro ? ' (' + esc(c.titular) + ')' : '') : '';
      return { celdas: [`<b>${esc(prov(r.p).nombre)}</b><small>${r.cap != null ? 'Ref. ' + refDe(i) + ' · ' : ''}desde ${r.c}${a}</small>`, r.cap != null ? dinero(r.cap) : '—', r.cap == null ? tag('Falta la captura', 'aviso') : r.duda && !P.dudas[r.duda] ? tag('Duda', 'aviso') : dif ? tag('No cuadra', 'aviso') : tag('Casada', 'ok')] };
    });
    if (pl && pl.c) filas.push({ celdas: [`<b>${esc(prov(pl.p).nombre)} · 2.º intento</b><small>Ref. 0041207 · desde ${pl.c} · el mismo monto</small>`, dinero(pl.cap ?? pl.m), !P.pollos ? tag('Por revisar', 'aviso') : P.pollos === 'dos' ? tag('Segundo pago', 'aviso') : tag('Devuelto por el banco', '')] });
    filas.push({ celdas: ['<b>Traspaso de BVCA a BVCE</b><small>Ref. 00418822 · entre cuentas nuestras</small>', '—', P.dudas.traspaso ? tag('Aparte: no suma', '') : tag('Por revisar', 'aviso')] });
    filas.push({ celdas: ['<b>Línea del estado de cuenta</b><small>Una comisión del banco: no es un pago</small>', '—', tag('Separada', '')] });
    return { titulo: 'Capturas del lote', sub: 'Pagos de los lunes · ' + leidas(q) + ' leídas', mod: 'pagos',
      bloques: [{ html: A.tabla({ cols: [{ t: 'Captura', cls: 'p' }, { t: 'Monto', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas }) },
        { html: '<p class="muted">De cada captura se lee: beneficiario, cuenta que recibe, referencia, monto y comisión. Se separan las líneas del estado de cuenta y las pantallas que no son pagos; una planilla del SENIAT entra como pago de impuesto desde la cuenta de la empresa, con su número de planilla. Si la cuenta de origen de la captura no es la que marcaste, avisa.</p><p class="muted">Un pago a otra cuenta del proveedor, o a nombre de otra persona, se reconoce con las cuentas de su ficha.</p>' }] };
  };
  FICHAS.pdf = id => {
    // la hoja 1 del pago de la nómina: lleva el monto de cada persona, así que solo la ven quienes ven sueldos
    if (id === 'nomina') {
      if (!puede('nomina', 'sueldos')) return soloSueldos('Hoja 1 del PDF', 'Pagar la nómina');
      const q = cuadreNom(); const con = PNL().filter(l => l.c);
      const bsTot = r2(con.filter(l => capNom(l) != null && BANCO_DE[l.c]).reduce((s, l) => s + capNomBs(l), 0)); const comTot = r2(con.reduce((s, l) => s + comNom(l), 0));
      const porCta = Object.keys(CTAS).map(k => [k, r2(con.filter(l => l.c === k && capNom(l) != null).reduce((s, l) => s + capNom(l), 0))]).filter(x => x[1]);
      const html = `<div class="pdf"><header><div><h2>Pagos al personal</h2><p style="font-size:12px;color:#5A6372">Nómina del ${esc(D.PAGO_NOMINA.fecha.toLowerCase())} · hoja 1 · ejemplo con datos inventados</p></div></header>
        <div class="pdf-cajas"><div>Pagado según las capturas<b>${dinero(q.caps)}</b></div><div>En bolívares<b>${dinero(bsTot, 'bs', 0)}</b></div><div>Comprobantes<b>${q.n}</b></div><div>Comisiones cobradas<b>${dinero(comTot, 'bs')}</b><small style="display:block">sobre los ${q.n} comprobantes</small></div></div>
        <div class="tabla-env"><table class="pdf-t"><thead><tr><th>#</th><th>Persona</th><th>Corrida</th><th class="r">Monto</th><th>Origen</th></tr></thead><tbody>${con.map(l => { const e = empDe(l.e); const cap = capNom(l); return `<tr><td>${PNL().indexOf(l) + 1}</td><td>${esc(e.nombre)}${familiar(e) ? ` <small style="color:#5A6372">(a ${esc(e.titular.replace(/^Su /, 'su '))})</small>` : ''}</td><td>${e.formal ? 'Formal' : 'Interna'}</td><td class="r">${cap != null ? dinero(cap) : 'falta la captura'}</td><td><span class="acct" data-c="${l.c}">${l.c}</span></td></tr>`; }).join('')}</tbody></table></div>
        <ol class="pdf-nota"><li>${q.dif ? `Cuadre: lista ${dinero(q.tot)} − sin pagar ${dinero(q.sinM)} = ${dinero(q.lista)}; las capturas suman ${dinero(q.caps)}. Diferencia de ${dinero(Math.abs(q.dif))}: ${PN.nota ? '«' + esc(PN.nota) + '»' : 'falta la nota (se escribe al aprobar)'}.` : `Cuadre: lista ${dinero(q.tot)} − sin pagar ${dinero(q.sinM)} = suma de las capturas ${dinero(q.caps)}.`}</li>
          ${porCta.length ? `<li>Por cuenta: ${porCta.map(([k, s]) => k + ' ' + dinero(s)).join(' · ')}.</li>` : ''}
          <li>En el orden del reporte de RRHH: primero la corrida formal y después la interna.</li>
          <li>Queda por pagar: ${q.sin.length ? q.sin.map(l => esc(empDe(l.e).nombre)).join(', ') : 'nadie'}.</li></ol>
        <p style="font-size:11px;color:#5A6372">Las hojas siguientes llevan las capturas en 2 columnas, cada una con la etiqueta de color de su cuenta.</p></div>`;
      return { titulo: 'Hoja 1 del PDF', sub: 'Pagar la nómina · vista previa', mod: 'pagos', bloques: [{ html }], acciones: [{ txt: 'Descargar PDF', acc: 'descargar', arg: 'pdfnom|' + D.PAGO_NOMINA.corto, icono: 'descargar' }] };
    }
    // una nómina ya pagada: sus corridas, cada una con su total (eso sí se ve agrupado); el PDF trae el monto de cada persona
    if (String(id).startsWith('nom|')) {
      const f = id.slice(4); const x = lotesNomina().find(z => z.f === f) || { f, cs: [], personas: 0, usd: 0 }; const ve = puede('nomina', 'sueldos');
      return { titulo: 'Nómina del ' + f, sub: 'Pagos de los lunes · nómina enviada', mod: 'pagos', tags: [['Enviado', 'ok']],
        bloques: [{ titulo: 'Corridas', html: `<ul class="lista">${x.cs.map(c => `<li><button class="fila" data-abrir="corrida:${c.id}"><span class="lead">${ic(c.tipo === 'premio' ? 'estrella' : 'nomina')}</span><span class="medio"><b>${esc(A.corridas.nombre(c))}</b><small>${c.personas} ${c.personas === 1 ? 'persona' : 'personas'}</small></span><span class="monto">${A.corridas.monto(c)}</span></button></li>`).join('')}</ul>` },
          { filas: [{ l: 'Total', v: '≈ ' + dinero(x.usd) + ' <small class="tenue">a la tasa de ese día</small>' }, { l: 'Lo aprobó', v: 'Alejandro, con su código' }, { l: 'Cuadre', v: tag('Cuadró con las capturas', 'ok') }] },
          ve ? { titulo: 'Archivo', adjuntos: ['Pagos al personal ' + f + '.pdf'] } : { html: '<p class="muted">El PDF trae el monto de cada persona: lo ven el dueño, RRHH y contabilidad.</p>' },
          { html: '<p class="muted">Un pago enviado ya no se edita. Si hubo un error, se hace una corrida de reemplazo enlazada a esta.</p>' }],
        acciones: ve ? [{ txt: 'Descargar PDF', acc: 'descargar', arg: 'pdfnom|' + f, icono: 'descargar' }] : [] };
    }
    // un lote que ya salió: su PDF quedó guardado y no se vuelve a armar
    if (id !== 'lunes') {
      const l = LOTES.find(x => x[0] === id) || [id, 0, 0];
      return { titulo: 'Lote del ' + l[0].toLowerCase(), sub: 'Pagos de los lunes · enviado', mod: 'pagos', tags: [['Enviado', 'ok']],
        bloques: [{ filas: [{ l: 'Pagos', v: l[1] }, { l: 'Total pagado', v: dinero(l[2]) }, { l: 'Lo aprobó', v: 'Alejandro, con su código' }, { l: 'Cuadre', v: tag('Cuadró con las capturas', 'ok') }] }, { titulo: 'Archivo', adjuntos: ['Pagos del ' + l[0].toLowerCase() + '.pdf'] },
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
    const html = `<div class="pdf"><header><div><h2>Comprobantes de pago</h2><p style="font-size:12px;color:#5A6372">Lunes 5 de octubre de 2026 · hoja 1 · datos inventados</p></div></header>
      <div class="pdf-cajas"><div>Pagado según las capturas<b>${dinero(q.caps)}</b></div><div>En bolívares<b>${dinero(bsTot, 'bs', 0)}</b></div><div>Comprobantes<b>${q.n}</b></div><div>Comisiones cobradas<b>${dinero(comTot, 'bs')}</b><small style="display:block">sobre los ${q.n} comprobantes</small></div></div>
      <div class="tabla-env"><table class="pdf-t"><thead><tr><th>#</th><th>Beneficiario</th><th class="r">Monto</th><th>Origen</th></tr></thead><tbody>${filas.map((x, k) => `<tr><td>${k + 1}</td><td>${quien(x)}</td><td class="r">${x.monto != null ? dinero(x.monto) : 'falta la captura'}</td><td><span class="acct" data-c="${x.r.c}">${x.r.c}</span></td></tr>`).join('')}</tbody></table></div>
      <ol class="pdf-nota"><li>${q.dif ? `Cuadre: lista ${dinero(q.tot)} − sin pagar ${dinero(q.sinM)} = ${dinero(q.lista)}; las capturas suman ${dinero(q.caps)}. Diferencia de ${dinero(Math.abs(q.dif))}: ${P.nota ? '«' + esc(P.nota) + '»' : 'falta la nota (se escribe al aprobar)'}.` : `Cuadre: lista ${dinero(q.tot)} − sin pagar ${dinero(q.sinM)} = suma de las capturas ${dinero(q.caps)}.`}</li>
        ${porCta.length ? `<li>Por cuenta: ${porCta.map(([k, s]) => k + ' ' + dinero(s)).join(' · ')}.</li>` : ''}
        ${fr.length ? `<li>Se pagó sin ${retTexto(fr)}: esa parte va al SENIAT (la de IVA en la planilla de IVA y la de ISLR en la declaración de retenciones de ISLR).</li>` : ''}
        <li>Aparte: traspaso de BVCA a BVCE (ref. 00418822); no suma.</li>
        ${P.pollos && pl ? `<li>${esc(prov(pl.p).nombre)}: ${P.pollos === 'dos' ? 'fueron dos pagos de ' + dinero(pl.cap ?? pl.m) + '.' : 'el banco devolvió el 2.º intento; cuenta una vez.'}</li>` : ''}
        <li>Queda por pagar: ${q.sin.length ? q.sin.map(r => esc(prov(r.p).nombre)).join(', ') : 'nada'}.</li></ol>
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
            filas: lista.map(x => ({ abrir: 'factura:' + x.id, clase: x.anulada ? 'anulada' : '', txt: prov(x.prov).nombre, celdas: [`<b>N.º ${esc(x.num)}</b><small>${esc(prov(x.prov).nombre)}${x.alerta ? ' · ' + ic('alerta', 'xs') + ' ' + esc(x.alerta) : ''}</small>`, esc(prov(x.prov).nombre), esc(x.fecha), esc(x.vence), dinero(x.saldo), A.estadoTag(x.estado)] })) });
      }
      if (sub === 'proveedores') cuerpo = A.filtros('t-prov', null, null, 'Buscar proveedor, RIF o categoría') + A.tabla({ id: 't-prov', cols: [{ t: 'Proveedor', cls: 'p' }, { t: 'Categoría', cls: 'x' }, { t: 'Plazo', cls: 'x' }, { t: 'Cuenta', cls: 'x' }, { t: 'Deuda', cls: 'r plata' }, { t: 'Estado', cls: 'e' }],
        filas: D.PROVEEDORES.map(p => { const a = activas(p); const c = a[0];
          return { abrir: 'proveedor:' + p.id, txt: p.rif + ' ' + p.cat + ' ' + p.cuentas.map(x => x.titular).join(' '), celdas: [`<b>${esc(p.nombre)}</b><small>${esc(p.rif)}</small>`, esc(p.cat), p.plazo ? p.plazo + ' días' : 'De contado', c ? esc(etiq(c)) + (c.nueva ? ' (nueva)' : '') + (a.length > 1 ? ` <small class="tenue">y ${a.length - 1} más</small>` : '') : '—', dinero(deudaDe(p.id)), A.estadoTag(p.estado)] }; }) });
      if (sub === 'ajustes') {
        const aj = D.AUDITORIA.filter(a => a.modulo === 'Proveedores');
        cuerpo = `<p class="nota info">${ic('info', 's')}<span>Las facturas y las cuentas que vienen de Odoo se corrigen solo aquí. Queda el valor de Odoo, el nuevo, el motivo y quién lo hizo. La copia de Odoo nunca pisa una corrección: si Odoo cambia ese dato después, aparece un aviso y quien la hizo decide.</span></p>` +
          A.tabla({ cols: [{ t: 'Qué se cambió', cls: 'p' }, { t: 'Antes', cls: 'x' }, { t: 'Después', cls: 'r' }, { t: 'Quién', cls: 'e' }], filas: aj.map(a => ({ abrir: 'cambio:' + a.id, celdas: [`<b>${esc(a.registro)} · ${esc(a.campo)}</b><small>${esc(a.motivo)}</small>`, esc(a.antes), esc(a.despues), esc(a.quien) + '<br><small class="muted">' + esc(a.cuando) + '</small>'] })) });
      }
      if (sub === 'devoluciones') cuerpo = `<p class="nota info">${ic('info', 's')}<span>Mercancía mala que se devuelve. Cada proveedor tiene su trato (por ejemplo, repone la mitad y el resto es merma). Si pasan 3 días sin reponer, avisa a Jose y a Manuel.</span></p>` +
        A.tabla({ cols: [{ t: 'Devolución', cls: 'p' }, { t: 'Trato', cls: 'x' }, { t: 'Monto', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: D.DEVOLUCIONES.map(d => ({ abrir: 'devolucion:' + d.id, celdas: [`<b>${esc(d.que)}</b><small>${esc(prov(d.prov).nombre)} · ${esc(d.fecha)}</small>`, esc(d.trato), dinero(d.monto), A.estadoTag(d.estado) + (d.dias ? ` <small class="muted">${d.dias} días</small>` : '')] })) });
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
  FICHAS.factura = id => {
    // con un pago encima (completo o en parte) ya no se edita: se corrige con un reverso enlazado a ella
    const f = D.FACTURAS.find(x => x.id === id); const pv = prov(f.prov); const pagada = f.estado === 'pagada'; const conPago = pagada || !!f.pago;
    // las retenciones bajan el saldo: esa parte se le paga al SENIAT, no al proveedor
    const enlaceRet = x => puede('fiscal') ? `<button class="enlace" data-abrir="retemi:${x.id}">comp. ${esc(x.comp)}</button>` : `<small class="tenue">comp. ${esc(x.comp)}</small>`;
    const ret = (f.ret ? [{ l: 'Retención de IVA (' + f.ret.pct + ' %)', v: `− ${dinero(f.ret.usd)} <small class="tenue">${dinero(f.ret.bs, 'bs')} a ${fmt(f.ret.tasa)}</small> ${enlaceRet(f.ret)}` }]
      : f.retPend ? [{ l: 'Retención de IVA (' + f.retPend.pct + ' %)', v: tag('Por emitir', 'aviso') + ` <small class="tenue">≈ ${dinero(f.retPend.usd)}: baja el saldo cuando se emita</small>` }] : [])
      .concat(f.retIslr ? [{ l: 'Retención de ISLR (' + f.retIslr.pct + ' %)', v: `− ${dinero(f.retIslr.usd)} <small class="tenue">${dinero(f.retIslr.bs, 'bs')} a ${fmt(f.retIslr.tasa)}</small> ${enlaceRet(f.retIslr)}` }] : []);
    const pagoTl = f.pago ? [[f.pago.lote, `${f.pago.parcial ? 'Pagada en parte' : 'Pagada'} en el lote del lunes ${esc(f.pago.lote)} ${esc(desdeTxt(f.pago))}${f.pago.parcial ? `: quedan ${dinero(f.saldo)}, porque la captura dijo menos.` : '.'}`, f.pago.parcial ? 'aviso' : 'ok']] : [];
    const bloques = [
      { titulo: 'Datos', filas: [{ l: 'Proveedor', v: `<button class="enlace" data-abrir="proveedor:${pv.id}">${esc(pv.nombre)}</button>` }, { l: 'Número', v: esc(f.num) }, { l: 'Número de control', v: esc(f.control), campo: { k: 'control', tipo: 'texto' } }, { l: 'Fecha', v: esc(f.fecha) }, { l: 'Vence', v: esc(f.vence), campo: { k: 'vence', tipo: 'texto' } }, { l: 'Monto ($)', v: dinero(f.monto) + (f.ajuste ? `<span class="cambio"><s>${dinero(f.ajuste.antes)}</s> en Odoo</span>` : ''), campo: { k: 'monto', tipo: 'dinero', obligatorio: true } }, ...ret, { l: 'Saldo', v: dinero(f.saldo) + (retsDe(f) && f.saldo > 0 && !f.pago ? ' <small class="tenue">lo que se le paga al proveedor</small>' : f.pago && f.pago.parcial ? ' <small class="tenue">lo que falta pagarle</small>' : '') }, ...(f.pago ? [{ l: 'Se pagó', v: `En el lote del ${esc(f.pago.lote)} · <span class="acct" data-c="${esc(f.pago.cta)}">${esc(f.pago.cta)}</span>${f.pago.socio ? ' · ' + esc(f.pago.socio) : ''}` }] : []), { l: 'Viene de', v: esc(f.origen) + ' · importada el dom 4 oct' }] },
      { titulo: 'Historial', tiempo: [[f.fecha, 'Se registró en Odoo.']].concat(f.ajuste ? [[f.ajuste.cuando.split(' ').slice(0, 3).join(' '), `Ajuste de ${esc(f.ajuste.quien)}: ${esc(f.ajuste.campo.toLowerCase())} ${dinero(f.ajuste.antes)} → ${dinero(f.ajuste.despues)}. «${esc(f.ajuste.motivo)}»`, 'info']] : []).concat(f.ret ? [[f.ret.fecha, `Retención de IVA de ${dinero(f.ret.bs, 'bs')}: se le paga al SENIAT y baja el saldo.`, 'info']] : []).concat(f.retIslr ? [[f.retIslr.fecha, `Retención de ISLR de ${dinero(f.retIslr.bs, 'bs')}: se le paga al SENIAT y baja el saldo.`, 'info']] : []).concat(pagoTl) },
      { titulo: 'Archivo', adjuntos: [pv.nombre + ' ' + f.num + '.jpg'] },
      conPago ? { html: `<p class="muted">${pagada ? 'Una factura pagada' : 'Una factura con un pago'} ya no se edita. Si algo está mal, se corrige con un reverso enlazado a ella: una nota de crédito del proveedor o el pago que se devolvió.</p>` } : { oculto: true },
    ];
    return { titulo: 'Factura N.º ' + f.num, sub: esc(pv.nombre), mod: 'proveedores', obj: f, registro: 'Factura ' + f.num, tags: [[A.estadoTag(f.estado).replace(/<[^>]+>/g, ''), { vencida: 'alerta', ajustada: 'info', pagada: 'ok', parcial: 'aviso' }[f.estado] || '']].concat(f.pago && f.pago.parcial && f.estado !== 'parcial' ? [['Pago parcial', 'aviso']] : []),
      aviso: f.alerta ? `<p class="nota aviso">${ic('alerta', 's')}<span>${esc(f.alerta)}. Para lo fiscal hay que retenerle el 100 % del IVA o pedirle una factura bien hecha.</span></p>` : '',
      bloques, bloqueada: conPago, bloqueo: pagada ? 'Está pagada: no se edita. Se corrige con un reverso.' : 'Ya tiene un pago: no se edita. Se corrige con un reverso.',
      acciones: conPago ? [{ txt: 'Corregir con un reverso', acc: 'fac-reverso', arg: f.id, icono: 'refrescar', solo: 'editar' }] : [],
      alGuardar: (cambios, motivo) => {
        const c = cambios.find(x => x.r.campo.k === 'monto'); if (!c) return;
        f.ajuste = { campo: 'Monto', antes: c.antes, despues: c.nuevo, motivo, quien: S.usuario.nombre, cuando: 'Hoy ' + D.HOY.hora };
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
        bloques: [{ html: A.tabla({ cols: [{ t: 'Factura', cls: 'p' }, { t: 'Monto', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: FA().map(x => ({ abrir: 'facagente:' + x.id, celdas: [`<b>${esc(prov(x.prov).nombre)} · N.º ${esc(x.num)}</b><small>${esc(x.fecha)}${dudaViva(x) && x.estado === 'propuesta' ? ' · ' + esc(x.repetida ? 'repetida' : 'revisa el monto') : ''}</small>`, dinero(x.monto), tag(...FA_ESTADO[x.estado])] })) }) },
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
          { l: 'Monto ($)', v: dinero(x.monto) + leido('monto', v => dinero(v)), campo: { k: 'monto', tipo: 'dinero', obligatorio: true } }]
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
    const aprobar = () => A.pedirCodigo({ que: 'Factura N.º ' + esc(x.num) + ' de ' + esc(pv.nombre) + ' · ' + dinero(x.monto), det: 'Leída por el agente. Pasa a las facturas por pagar, con su foto.', boton: 'Aprobar ' + dinero(x.monto) }).then(() => {
      x.estado = 'aprobada'; x.reviso = S.usuario.nombre; facagListo();
      A.auditar({ modulo: 'Proveedores y facturas', registro: 'Factura leída ' + x.num, campo: 'estado', antes: 'propuesta por el agente', despues: 'aprobada · ' + dinero(x.monto) });
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
      aviso: nueva ? `<p class="nota alerta">${ic('candado', 's')}<span><b>Cuenta por verificar.</b> ${esc(nueva.nueva)} y le avisó a Alejandro. Queda así hasta que alguien confirme por teléfono.</span></p>` : '',
      bloques: [
        { titulo: 'Ficha', filas: [{ l: 'Nombre', v: esc(p.nombre), campo: { k: 'nombre', tipo: 'texto' } }, { l: 'Categoría', v: esc(p.cat), campo: { k: 'cat', tipo: 'select', opciones: D.PARAMS.categorias } }, { l: 'Plazo para pagar (días)', v: p.plazo ? p.plazo + ' días' : 'De contado', campo: { k: 'plazo', tipo: 'numero', entero: true } }, { l: 'Contacto', v: esc(p.contacto), campo: { k: 'contacto', tipo: 'texto' } }] },
        { titulo: 'Cuentas para pagarle (' + activas(p).length + ')', html: `<ul class="lista">${p.cuentas.map(filaCta).join('')}</ul><p class="muted">Un pago a cualquiera de estas cuentas, o a nombre de su titular, se reconoce como pago a ${esc(p.nombre)}. Agregar una cuenta pide tu código y le avisa a Alejandro.</p>` },
        { titulo: 'Facturas abiertas (' + facts.length + ')', html: facts.length ? `<ul class="lista">${facts.map(f => `<li><button class="fila" data-abrir="factura:${f.id}"><span class="lead">${ic('archivo')}</span><span class="medio"><b>N.º ${esc(f.num)}</b><small>Vence ${esc(f.vence)}${f.ret && f.retIslr ? ' · sin las retenciones' : f.ret ? ' · sin la retención de IVA' : f.retIslr ? ' · sin la retención de ISLR' : ''}${f.pago && f.pago.parcial ? ' · pagada en parte' : ''}</small></span><span class="monto">${dinero(f.saldo)}</span></button></li>`).join('')}</ul>` : '<p class="muted">Sin facturas abiertas.</p>' },
      ],
      acciones: [{ txt: 'Agregar cuenta', acc: 'prov-cuenta', arg: p.id, icono: 'mas', solo: 'editar' }].concat(nueva ? [{ txt: 'Ya confirmé por teléfono', acc: 'prov-verificar', arg: p.id, icono: 'candado', tono: 'peligro', solo: 'aprobar' }] : []) };
  };
  // una cuenta nueva queda por verificar: pide código, avisa a Alejandro y no se le paga hasta confirmarla por teléfono
  ACC['prov-cuenta'] = id => {
    if (!puede('proveedores', 'editar')) return ACC['sin-permiso']('proveedores');
    const p = D.PROVEEDORES.find(x => x.id === id); const env = $('#modal-raiz');
    A.modal(`<h2 id="modal-t">Agregar una cuenta</h2><p class="muted" id="modal-d">${esc(p.nombre)}</p>
      <label class="campo" for="pc-banco"><span>Banco</span><select id="pc-banco">${['Venezolano', 'Banesco', 'Mercantil', 'Provincial', 'BNC', 'Bancaribe'].map(b => `<option>${b}</option>`).join('')}</select></label>
      <label class="campo" for="pc-num"><span>Número de cuenta (20 dígitos) o teléfono del pago móvil</span><input id="pc-num" inputmode="numeric" autocomplete="off"></label>
      <label class="campo" for="pc-tit"><span>Titular: el nombre que sale en el banco</span><input id="pc-tit" autocomplete="off" placeholder="Puede ser otra persona, por ejemplo el dueño"><small class="ayuda" id="pc-msg"></small></label>
      <p class="muted" style="display:flex;gap:6px;align-items:center">${ic('candado', 's')}Pide tu código y le avisa a Alejandro. No se le paga ahí hasta que alguien confirme por teléfono.</p>
      <div class="modal-acc"><button class="btn sec" data-pc="no">Cancelar</button><button class="btn pri" data-pc="si">Agregar la cuenta</button></div>`, 'teclado');
    $('#pc-num').focus();
    env.onclick = e => {
      const b = e.target.closest('[data-pc]'); if (!b) return;
      if (b.dataset.pc === 'no') { A.cerrarModal(); return; }
      const dig = $('#pc-num').value.replace(/\D/g, ''); const tit = $('#pc-tit').value.trim(); const banco = $('#pc-banco').value;
      const movil = /^04\d{9}$/.test(dig);
      if (!movil && dig.length !== 20) { $('#pc-msg').textContent = 'Escribe los 20 dígitos de la cuenta o el teléfono del pago móvil.'; return; }
      if (tit.length < 3) { $('#pc-msg').textContent = 'Escribe el titular tal como sale en el banco.'; return; }
      A.cerrarModal();
      const num = movil ? 'pago móvil ' + dig.slice(0, 4) + '-•••-' + dig.slice(-4) : '•••• ' + dig.slice(-4);
      A.pedirCodigo({ que: 'Cuenta nueva para ' + esc(p.nombre) + ' · ' + esc(banco) + ' ' + esc(num), det: 'A nombre de ' + esc(tit) + '. No se le paga ahí hasta que alguien la confirme por teléfono.', boton: 'Agregar la cuenta' }).then(() => {
        const c = { banco, num, titular: tit, otro: !tit.toLowerCase().includes(p.nombre.toLowerCase().split(' (')[0]), nueva: S.usuario.nombre + ' la agregó hoy con su código' };
        p.cuentas.push(c); if (p.estado !== 'cuenta_nueva') p.estadoAntes = p.estado; p.estado = 'cuenta_nueva';
        A.auditar({ modulo: 'Proveedores', registro: p.nombre, campo: 'cuenta bancaria', antes: '—', despues: etiq(c) + ' · ' + tit, motivo: 'Cuenta nueva' });
        D.PENDIENTES.unshift({ id: 'pe' + Date.now(), para: ['alejandro'], tipo: 'alerta', titulo: 'Un proveedor tiene una cuenta nueva', sub: p.nombre + ' · confírmala por teléfono', de: S.usuario.nombre, edad: 'Ahora', abrir: 'proveedor:' + p.id, prov: p.id });
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
  ACC['prov-verificar'] = id => A.pedirCodigo((p => (c => ({ que: 'Cuenta nueva de ' + esc(p.nombre) + (c ? ' · ' + esc(etiq(c)) : ''), det: 'Confirmas que llamaste al proveedor a su número de siempre y que la cuenta es suya.' + (c ? ' A nombre de ' + esc(c.titular) + '.' : ''), boton: 'Ya confirmé por teléfono' }))(p.cuentas.find(x => x.nueva)))(D.PROVEEDORES.find(x => x.id === id))).then(() => { verificarCuentas(id); A.pintarFicha(); A.pintarPagina(); A.aviso('Cuenta verificada. Ya se le puede pagar ahí.'); }).catch(() => {});
  FICHAS.devolucion = id => {
    const d = D.DEVOLUCIONES.find(x => x.id === id);
    return { titulo: 'Devolución: ' + d.que, sub: esc(prov(d.prov).nombre) + ' · ' + esc(d.fecha), mod: 'proveedores', obj: d, registro: 'Devolución ' + d.que, tags: [[d.estado === 'esperando' ? 'Esperando reposición · ' + d.dias + ' días' : 'Repuesta', d.estado === 'esperando' ? 'aviso' : 'ok']],
      bloques: [{ filas: [{ l: 'Qué se devolvió', v: esc(d.que) }, { l: 'Valor', v: dinero(d.monto) }, { l: 'Trato con el proveedor', v: esc(d.trato), campo: { k: 'trato', tipo: 'texto' } }, { l: 'La registró', v: esc(d.quien) }, { l: 'Merma', v: d.trato.includes('mitad') ? dinero(d.monto / 2) + ' (2 kg)' : '—' }] }, { titulo: 'Foto', adjuntos: ['queso-telita-devuelto.jpg'] }],
      acciones: d.estado === 'esperando' ? [{ txt: 'Llegó la reposición', acc: 'repuesta', arg: d.id, icono: 'check', tono: 'pri', solo: 'editar' }] : [] };
  };
  ACC.repuesta = id => { const d = D.DEVOLUCIONES.find(x => x.id === id); d.estado = 'repuesta'; d.dias = 0; const p = D.PENDIENTES.find(x => x.abrir === 'devolucion:' + id); if (p) p.hecho = 'Repuesta, marcada por ' + S.usuario.nombre; A.auditar({ modulo: 'Proveedores', registro: 'Devolución ' + d.que, campo: 'estado', antes: 'esperando', despues: 'repuesta' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Marcada como repuesta.'); };
  FICHAS.cambio = id => {
    const a = D.AUDITORIA.find(x => x.id === id);
    return { titulo: a.registro, sub: 'Cambio · ' + esc(a.cuando), mod: 'auditoria', bloques: [{ filas: [{ l: 'Módulo', v: esc(a.modulo) }, { l: 'Qué', v: esc(a.campo) }, { l: 'Antes', v: esc(a.antes), largo: true }, { l: 'Después', v: esc(a.despues), largo: true }, { l: 'Quién', v: esc(a.quien) + (a.tipoActor !== 'persona' ? ' ' + tag(a.tipoActor === 'bot' ? 'Bot' : 'Agente', 'lila') : '') }, { l: 'Motivo', v: esc(a.motivo || '—'), largo: true }] }, { html: '<p class="muted">Este registro no se puede editar ni borrar. Lo escribe la propia base de datos.</p>' }] };
  };
})();
