/* Dinero que entra y que sale: Caja del día, Clientes, Pagos de los lunes, Proveedores. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, $, $$, esc, fmt, dinero, leerNum, ic, tag, puede } = A;
  const prov = id => D.PROVEEDORES.find(p => p.id === id) || {};
  const CTAS = { BVCA: 'Venezolano · Alejandro', BVCE: 'Venezolano · Eliana', BVCJ: 'Venezolano · la empresa', BNC: 'BNC · Alejandro', BOV: 'Bóveda (efectivo $)', BIN: 'Binance (USDT)' };
  const acct = c => c && c !== '—' ? `<span class="acct" data-c="${c}">${c}</span>` : '—';

  /* =============== CAJA DEL DÍA =============== */
  PANT.caja = {
    titulo: 'Caja del día', corto: 'Caja del día', tab: 'Caja', grupo: 'Dinero que entra', icono: 'caja', mod: 'caja',
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
        ${A.tabla({ id: 't-caja', cols: [{ t: 'Pago', cls: 'p' }, { t: 'Hora', cls: 'x' }, { t: 'Lo confirmó', cls: 'x' }, { t: 'Cuenta', cls: 'x' }, { t: 'Monto', cls: 'r' }, { t: 'Estado', cls: 'e' }],
          filas: filas.map(c => ({ abrir: 'pago:' + c.id, txt: c.ref + ' ' + c.monto, celdas: [`<b>${esc(c.banco)} · ${esc(c.tipo)}</b><small>${esc(c.hora)} · ${esc(c.cajera)}${c.motivo ? ' · ' + esc(c.motivo) : ''}</small>`, esc(c.hora), esc(c.fuente) + (c.doble ? ' · ' + tag('Doble check', 'ok') : ''), acct(c.destino), c.monto ? dinero(c.monto, c.mon) : '—', A.estadoTag(c.estado)] })) })}
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
        { html: `<figure class="captura"><div class="recibo"><span class="aro ${c.estado === 'confirmado' ? 'ok' : ''}">${ic(c.estado === 'confirmado' ? 'check' : 'reloj')}</span><strong>${esc(c.tipo)} ${c.estado === 'confirmado' ? 'exitoso' : c.motivo.includes('proceso') ? 'en proceso' : ''}</strong><span class="grande">${c.monto ? dinero(c.monto, c.mon) : '—'}</span><span class="mono muted">Ref. ${esc(c.ref)}</span><span class="mono muted">05/10/2026 ${esc(c.hora)}</span></div><figcaption class="muted">Captura simulada · la mandó ${esc(c.cajera)}</figcaption></figure>` },
        { titulo: 'Lo que leyó el bot', filas: [{ l: 'Banco que paga', v: esc(c.banco) }, { l: 'Monto', v: c.monto ? dinero(c.monto, c.mon) : '—' }, { l: 'Referencia', v: `<span class="mono">${esc(c.ref)}</span>` }, { l: 'Cuenta que recibe', v: acct(c.destino) + (c.destino !== '—' ? ' ' + tag('Coincide', 'ok') : '') }, { l: 'Cómo se confirmó', v: esc(c.fuente) }, { l: 'Lo cerró', v: esc(c.cerro) }] },
        { titulo: 'Qué pasó', tiempo: tl },
      ],
      aviso: c.estado === 'por_confirmar' ? `<p class="nota aviso">${ic('alerta', 's')}<span>Para confirmarlo, reacciona ✅ sobre la foto en el grupo Caja. En la fase 1 la app no confirma: solo muestra.</span></p>` : '',
    };
  };

  /* =============== CLIENTES Y COBRANZA =============== */
  PANT.clientes = {
    titulo: 'Clientes y cobranza', corto: 'Clientes y cobranza', grupo: 'Dinero que entra', icono: 'clientes', mod: 'clientes',
    render: (sub = 'deben') => {
      const deben = D.CLIENTES.filter(c => c.saldo > 0);
      const total = deben.reduce((s, c) => s + c.saldo, 0);
      const viejos = deben.filter(c => c.antig > 30);
      let cuerpo = '';
      if (sub === 'deben') cuerpo = A.filtros('t-cli', null, null, 'Buscar cliente') + A.tabla({ id: 't-cli', cols: [{ t: 'Cliente', cls: 'p' }, { t: 'Límite', cls: 'r x' }, { t: 'Días de atraso', cls: 'x' }, { t: 'Último pago', cls: 'x' }, { t: 'Debe', cls: 'r' }, { t: 'Estado', cls: 'e' }],
        filas: D.CLIENTES.map(c => ({ abrir: 'cliente:' + c.id, celdas: [`<b>${esc(c.nombre)}</b><small>${esc(c.tipo)}${c.esp ? ' · contribuyente especial' : ''}</small>`, dinero(c.credito, 'usd', 0), c.saldo ? c.antig + ' días' : '—', esc(c.ultimo), dinero(c.saldo), c.saldo === 0 ? tag('Al día', 'ok') : c.antig > 60 ? tag('Más de 60 días', 'alerta') : c.antig > 30 ? tag('Más de 30 días', 'aviso') : tag('Al día', '')] })),
        pie: ['Total', '', '', '', dinero(total), ''] });
      if (sub === 'empresas') cuerpo = `<p class="nota info">${ic('info', 's')}<span>Las empresas reciben factura con su RIF. Si son contribuyentes especiales nos pagan neto y nos mandan un comprobante de retención: esa plata se recupera en la declaración de IVA.</span></p>` +
        A.tabla({ cols: [{ t: 'Factura', cls: 'p' }, { t: 'Cliente', cls: 'x' }, { t: 'Base', cls: 'r x' }, { t: 'IVA', cls: 'r' }, { t: 'Retención', cls: 'e' }], filas: D.VENTAS_EMPRESAS.map(v => ({ abrir: 'ventaemp:' + v.id, celdas: [`<b>N.º ${esc(v.num)}</b><small>${esc(v.fecha)} · ${esc(v.cliente)}</small>`, esc(v.cliente), dinero(v.base, 'bs'), dinero(v.iva, 'bs'), tag(v.retencion, v.retencion.startsWith('Esperando') ? 'aviso' : v.retencion.startsWith('Recibido') ? 'ok' : '')] })) });
      if (sub === 'fieles') cuerpo = `<div class="rejilla"><div class="c6 pila"><article class="hoja"><h2>${ic('clientes')}Clientes que dejaron de venir</h2><p class="muted">Venían al menos una vez al mes y llevan más de 45 días sin venir. Solo los que dieron permiso para escribirles.</p>
          <ul class="lista">${D.CLIENTES.filter(c => c.consiente && c.antig > 45).map(c => `<li><button class="fila" data-abrir="cliente:${c.id}"><span class="lead">${ic('usuario')}</span><span class="medio"><b>${esc(c.nombre)}</b><small>Última visita ${esc(c.ultimo)}</small></span>${ic('derecha', 's chev')}</button></li>`).join('')}</ul></article></div>
          <div class="c6 pila"><article class="hoja"><h2>${ic('calendario')}Cumpleaños de octubre</h2><p class="muted">3 clientes con permiso para recibir un mensaje. Las campañas salen del número oficial, nunca del número del bot.</p>${A.boton('clientes', 'Preparar un mensaje', 'data-acc="pronto"', { tono: 'sec', icono: 'mensaje' })}</article>
          <p class="nota gris">${ic('candado', 's')}<span>Fase 8. Solo se escribe a quien dio permiso, y se guarda cuándo y cómo lo dio.</span></p></div></div>`;
      return `<div class="pagina">${A.cab('Cuentas por cobrar', 'Clientes y cobranza', 'Quién nos debe, cuánto y desde cuándo. Los abonos se aplican a la deuda más vieja.', A.boton('clientes', 'Cobrar un abono', 'data-acc="cobrar"', { icono: 'mas' }))}
        ${A.lectura('clientes')}
        <div class="cifras">
          ${A.cifra({ etq: 'Nos deben', valor: dinero(total, 'usd', 0), sub: deben.length + ' clientes', ir: 'clientes/deben' })}
          ${A.cifra({ etq: 'Más de 30 días', valor: dinero(viejos.reduce((s, c) => s + c.saldo, 0), 'usd', 0), sub: viejos.length + ' clientes · se les recuerda los lunes', tono: 'aviso', ir: 'clientes/deben' })}
          ${A.cifra({ etq: 'Retenciones que esperamos', valor: '1', sub: 'Constructora Delta · IVA', ir: 'clientes/empresas' })}
          ${A.cifra({ etq: 'Dejaron de venir', valor: D.CLIENTES.filter(c => c.consiente && c.antig > 45).length, sub: 'con permiso para escribirles', ir: 'clientes/fieles' })}
        </div>
        ${A.subnav([['deben', 'Quién nos debe'], ['empresas', 'Empresas y facturas'], ['fieles', 'Clientes fieles']], sub)}
        ${cuerpo}</div>`;
    },
  };
  FICHAS.cliente = id => {
    const c = D.CLIENTES.find(x => x.id === id);
    return {
      titulo: c.nombre, sub: esc(c.tipo) + ' · ' + esc(c.rif), mod: 'clientes', obj: c, registro: 'Cliente ' + c.nombre,
      tags: [[c.saldo ? 'Debe ' + dinero(c.saldo) : 'Al día', c.saldo ? (c.antig > 30 ? 'aviso' : '') : 'ok']].concat(c.esp ? [['Contribuyente especial', 'info']] : []),
      bloques: [
        { titulo: 'Crédito', filas: [{ l: 'Límite de crédito ($)', v: dinero(c.credito, 'usd', 0), campo: { k: 'credito', tipo: 'dinero' } }, { l: 'Días para pagar', v: c.dias + ' días', campo: { k: 'dias', tipo: 'numero' } }, { l: 'Lo autorizó', v: 'Alejandro' }, { l: 'Contacto', v: esc(c.contacto), campo: { k: 'contacto', tipo: 'texto' } }, { l: 'Permiso para escribirle', v: c.consiente ? tag('Sí, dado en caja el 2 ago', 'ok') : tag('No', '') }] },
        { titulo: 'Movimientos', tiempo: c.saldo ? [[c.ultimo, 'Último abono recibido.'], ['Hace ' + c.antig + ' d', 'Consumo a crédito que sigue abierto: ' + dinero(c.saldo) + '.', c.antig > 30 ? 'aviso' : '']] : [[c.ultimo, 'Pagó todo. Sin deuda.', 'ok']] },
        { html: '<p class="muted">Un límite de más de $ 100 lo aprueba Alejandro. Recordatorio automático los lunes a los que pasan de 15 días, desde el número oficial.</p>' },
      ],
      acciones: c.saldo ? [{ txt: 'Cobrar un abono', acc: 'cobrar', arg: c.id, icono: 'mas', solo: 'editar' }] : [],
    };
  };
  ACC.cobrar = id => {
    if (!puede('clientes', 'editar')) return ACC['sin-permiso']('clientes');
    const c = id ? D.CLIENTES.find(x => x.id === id) : D.CLIENTES.find(x => x.saldo > 0);
    const env = $('#modal-raiz');
    env.innerHTML = `<div class="modal-env"><div class="modal" role="dialog" aria-modal="true"><h2>Cobrar un abono</h2>
      <label class="campo" for="ab-cli"><span>Cliente</span><select id="ab-cli">${D.CLIENTES.filter(x => x.saldo > 0).map(x => `<option value="${x.id}"${x.id === c.id ? ' selected' : ''}>${esc(x.nombre)} · debe ${dinero(x.saldo)}</option>`).join('')}</select></label>
      <label class="campo" for="ab-monto"><span>Monto ($)</span><input id="ab-monto" inputmode="decimal" value="${fmt(Math.min(50, c.saldo))}"></label>
      <label class="campo" for="ab-met"><span>Cómo pagó</span><select id="ab-met"><option>Pago móvil</option><option>Zelle</option><option>Efectivo $</option><option>Transferencia</option></select></label>
      <div class="modal-acc"><button class="btn sec" data-ab="no">Cancelar</button><button class="btn pri" data-ab="si">Registrar el abono</button></div></div></div>`;
    env.onclick = e => {
      const b = e.target.closest('[data-ab]'); if (!b) return;
      if (b.dataset.ab === 'no') { env.innerHTML = ''; return; }
      const cl = D.CLIENTES.find(x => x.id === $('#ab-cli').value); const m = leerNum($('#ab-monto').value);
      if (!m || m <= 0) return;
      const antes = cl.saldo; cl.saldo = Math.max(0, +(cl.saldo - m).toFixed(2)); if (!cl.saldo) cl.antig = 0; cl.ultimo = '5 oct';
      A.auditar({ modulo: 'Clientes', registro: cl.nombre, campo: 'saldo', antes: dinero(antes), despues: dinero(cl.saldo), motivo: 'Abono de ' + dinero(m) + ' por ' + $('#ab-met').value.toLowerCase() });
      env.innerHTML = ''; A.pintarPagina(); if (S.ficha) A.pintarFicha(); A.aviso('Abono registrado. Se aplicó a la deuda más vieja.');
    };
  };
  ACC.pronto = () => A.aviso('Esta parte queda para su fase. En el prototipo se ve cómo será, sin funcionar.', 'info');
  FICHAS.ventaemp = id => {
    const v = D.VENTAS_EMPRESAS.find(x => x.id === id);
    return { titulo: 'Factura N.º ' + v.num, sub: esc(v.cliente) + ' · ' + esc(v.fecha), mod: 'clientes', obj: v,
      bloques: [{ filas: [{ l: 'Base', v: dinero(v.base, 'bs') }, { l: 'IVA 16 %', v: dinero(v.iva, 'bs') }, { l: 'Total', v: dinero(v.base + v.iva, 'bs') }, { l: 'Contribuyente especial', v: v.esp ? 'Sí: nos retiene el 75 % del IVA' : 'No' }, { l: 'Comprobante de retención', v: esc(v.retencion) }] }],
      acciones: v.retencion.startsWith('Esperando') ? [{ txt: 'Subir su comprobante', acc: 'pronto', icono: 'subir', solo: 'editar' }] : [] };
  };
  FICHAS.devcliente = id => {
    const d = D.DEVCLIENTES.find(x => x.id === id);
    return { titulo: 'Devolver ' + dinero(d.monto), sub: 'Devolución a un cliente', mod: 'clientes', obj: d, tags: [[d.estado === 'aprobada' ? 'Aprobada' : 'Por aprobar', d.estado === 'aprobada' ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'A quién', v: esc(d.cliente) }, { l: 'Motivo', v: esc(d.motivo), largo: true }, { l: 'La preparó', v: esc(d.preparo) }, { l: 'Cómo se devuelve', v: 'Pago móvil desde BVCA' }] }, { html: '<p class="muted">La aprueba Jose o Alejandro con su código, nunca quien la preparó. Si hubo factura fiscal, se hace la nota de crédito en la máquina fiscal.</p>' }],
      acciones: d.estado === 'por_aprobar' ? [{ txt: 'Aprobar con código', acc: 'aprobar-dev', arg: d.id, icono: 'check', tono: 'pri' }] : [] };
  };
  ACC['aprobar-dev'] = id => {
    const d = D.DEVCLIENTES.find(x => x.id === id);
    if (!(S.usuario.rol === 'dueno' || S.usuario.rol === 'contabilidad')) return A.aviso('La aprueban Jose o Alejandro.', 'info');
    if (d.preparo === S.usuario.nombre) return A.aviso('No puedes aprobar algo que preparaste tú. Lo aprueba otra persona.', 'info');
    A.pedirCodigo('Aprobar la devolución de ' + dinero(d.monto) + '.').then(() => {
      d.estado = 'aprobada'; const p = D.PENDIENTES.find(x => x.abrir === 'devcliente:' + id); if (p) p.hecho = 'Aprobada por ' + S.usuario.nombre;
      A.auditar({ modulo: 'Clientes', registro: 'Devolución ' + dinero(d.monto), campo: 'estado', antes: 'por aprobar', despues: 'aprobada' });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Devolución aprobada.');
    }).catch(() => {});
  };

  /* =============== PAGOS DE LOS LUNES =============== */
  const P = { menu: null, explica: null, recien: null, dudas: { pollos: false, traspaso: false }, aprobado: false, enviado: false };
  const total = () => D.LUNES.reduce((s, r) => s + r.m, 0);
  function filaLunes(r, i) {
    const pv = prov(r.p);
    const puedeMarcar = puede('pagos', 'editar');
    const marcada = !!r.c && i !== P.recien;
    let cuenta;
    if (r.bloqueada) cuenta = `<button class="alerta-btn" data-pl="explica" data-i="${i}" aria-expanded="${P.explica === i}">${ic('candado', 's')}Cuenta por verificar</button>`;
    else cuenta = `<button class="cta-btn${r.c ? '' : ' vacia'}" data-pl="menu" data-i="${i}" aria-haspopup="menu" aria-expanded="${P.menu === i}" ${puedeMarcar && !P.enviado ? '' : 'disabled title="Solo lectura"'}>${r.c ? `<span class="acct" data-c="${r.c}">${r.c}</span>` : 'Elegir cuenta'}${ic('abajo', 's')}</button>`;
    if (P.menu === i) cuenta += `<div class="menu" role="menu" aria-label="De qué cuenta salió">${Object.keys(CTAS).map(k => `<button role="menuitem" data-pl="pick" data-i="${i}" data-c="${k}"><span class="acct" data-c="${k}">${k}</span><small>${CTAS[k]}</small></button>`).join('')}${r.c ? `<button role="menuitem" class="quitar" data-pl="pick" data-i="${i}" data-c="">Quitar la marca</button>` : ''}</div>`;
    const estado = r.bloqueada ? tag('Por verificar', 'alerta') : !r.c ? tag('Sin pagar') : (r.duda && !P.dudas[r.duda]) ? tag('Por revisar', 'aviso') : tag('Pagado', 'ok');
    let h = `<div class="lfila${marcada ? ' pagada' : ''}" role="row" data-i="${i}">
      <div class="c-prov" role="cell"><button data-abrir="lineapago:${i}"><span class="subraya" ${r.c ? `style="--m: var(--res-${r.c === 'BOV' || r.c === 'BIN' ? 'efe' : r.c.toLowerCase()})"` : ''}>${esc(pv.nombre)}</span></button><small>${esc(r.f)}</small></div>
      <div class="c-vence${r.tarde ? ' tarde' : ''}" role="cell">${r.tarde ? 'Vencida, ' + r.v.toLowerCase() : r.v}</div>
      <div class="c-monto" role="cell">${dinero(r.m)}</div>
      <div class="c-cuenta" role="cell">${cuenta}</div>
      <div class="c-estado" role="cell">${estado}</div>`;
    if (r.bloqueada && P.explica === i) h += `<div class="explica" role="cell"><p><b>Jose cambió la cuenta de este proveedor el jueves 1, con su código.</b> Cambiar la cuenta es la forma más común de desviar un pago. Llama al proveedor a su número de siempre y confirma la cuenta nueva antes de pagarle.</p>${A.boton('pagos', 'Ya confirmé por teléfono', `data-pl="verificar" data-i="${i}"`, { tono: 'peligro', icono: 'candado', permiso: 'aprobar' })}</div>`;
    return h + '</div>';
  }
  function lunesProveedores() {
    const pagado = D.LUNES.filter(r => r.c).reduce((s, r) => s + r.m, 0); const sin = D.LUNES.filter(r => !r.c);
    const pend = Object.values(P.dudas).filter(v => !v).length;
    const subt = Object.keys(CTAS).map(k => { const s = D.LUNES.filter(r => r.c === k).reduce((a, r) => a + r.m, 0); return s ? `<div><span class="acct" data-c="${k}">${k}</span><b>${dinero(s)}</b></div>` : ''; }).join('');
    const esDueno = puede('pagos', 'aprobar');
    const paso = P.enviado ? `<div class="sello-linea">${A.sello('Enviado', { recien: P.selloRecien === 'enviado', fecha: '05 OCT 2026' })}<span class="muted">Salió al grupo «Comprobantes de pago» con el PDF. (Simulado)</span></div>`
      : P.aprobado ? `<div class="sello-linea">${A.sello('Aprobado', { recien: P.selloRecien === 'aprobado', fecha: '05 OCT 2026 · ' + D.HOY.hora })}<span class="muted">Lo aprobó Alejandro con su código.</span></div>${A.boton('pagos', 'Enviar al grupo', 'data-pl="enviar"', { icono: 'enviar' })}`
        : (esDueno ? `<button class="btn pri full" data-pl="aprobar" ${pend || !pagado ? 'disabled' : ''}>${ic('candado', 's')}Aprobar el lote</button>` : `<button class="btn bloq full" data-acc="sin-permiso" data-arg="pagos">${ic('candado', 's')}Aprobar el lote (lo aprueba Alejandro)</button>`);
    return `<div class="pila">
      <div class="hoja" style="gap:8px"><p class="progress-line" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><span>Pagado <b class="num">${dinero(pagado)}</b> de <b class="num">${dinero(total())}</b></span><span class="muted">${sin.length ? 'Faltan ' + sin.length + ' pagos' : 'Todo pagado'}</span></p><div class="pista" style="height:10px"><span style="width:${(pagado / total() * 100).toFixed(1)}%;background:var(--tinta)"></span></div></div>
      <div class="pagos-rej">
        <div class="libro" role="table" aria-label="Lista de pagos del lunes">
          <div class="lcab" role="row"><span role="columnheader">Proveedor</span><span role="columnheader">Vence</span><span role="columnheader" class="r">Monto</span><span role="columnheader">Sale de</span><span role="columnheader" class="r">Estado</span></div>
          ${D.LUNES.map(filaLunes).join('')}
        </div>
        <aside class="lado">
          <section class="hoja"><h2>Comprobantes</h2>
            <label class="soltar${puede('pagos', 'editar') ? '' : ' bloq'}" for="capturas">${ic('subir')}<span><b>Sube todas las capturas de una vez</b>La app las lee y las casa con cada línea.</span></label>
            <input type="file" id="capturas" accept="image/*,application/pdf" multiple class="sr-only" ${puede('pagos', 'editar') ? '' : 'disabled'}>
            <button class="enlace" data-abrir="capturas:lote">18 leídas · 16 casadas · ${pend} por revisar ${ic('derecha', 's')}</button>
            <div class="dudas">
              <div class="duda${P.dudas.pollos ? ' resuelta' : ''}"><p><b>Pollos El Granjero aparece dos veces.</b> ¿Fueron dos intentos del mismo pago?</p>${P.dudas.pollos ? `<p>${ic('check', 's')} ${esc(P.dudas.pollos)}</p>` : `<div class="btns">${A.boton('pagos', 'El 2.º se devolvió', 'data-pl="duda" data-d="pollos" data-r="El segundo intento se devolvió. Cuenta una sola vez."', { tono: 'sec', chico: true })}${A.boton('pagos', 'Fueron dos pagos', 'data-pl="duda" data-d="pollos" data-r="Quedan los dos pagos, cada uno con su factura."', { tono: 'sec', chico: true })}</div>`}</div>
              <div class="duda${P.dudas.traspaso ? ' resuelta' : ''}"><p><b>Traspaso de BVCA a BVCE</b> (ref. 00418822). Va en la nota del resumen y no suma en los totales.</p>${P.dudas.traspaso ? `<p>${ic('check', 's')} ${esc(P.dudas.traspaso)}</p>` : `<div class="btns">${A.boton('pagos', 'Entendido', 'data-pl="duda" data-d="traspaso" data-r="Anotado en la nota del resumen."', { tono: 'sec', chico: true })}</div>`}</div>
            </div>
          </section>
          <section class="hoja"><h2>Cuadre</h2>
            <dl class="kv"><div><dt>Lista del lunes</dt><dd>${dinero(total())}</dd></div><div><dt>Sin pagar (${sin.length})</dt><dd>− ${dinero(sin.reduce((s, r) => s + r.m, 0))}</dd></div><div class="total"><dt>Pagado</dt><dd>${dinero(pagado)}</dd></div></dl>
            <p class="muted">≈ ${dinero(pagado * D.TASA.usd, 'bs')} a la tasa BCV de hoy (${fmt(D.TASA.usd)}). Cada pago guarda su propia tasa y su comisión.</p>
            <div class="subtot">${subt}</div>
            <p>${pend ? tag('Resuelve ' + (pend === 1 ? 'lo que queda' : 'los ' + pend) + ' por revisar', 'aviso') : tag('Cuadra con las capturas', 'ok')}</p>
          </section>
          <div class="pila" style="gap:8px">
            <button class="btn sec full" data-abrir="pdf:lunes">${ic('archivo', 's')}Ver la hoja 1 del PDF</button>
            ${paso}
            <p class="muted" style="text-align:center">${P.enviado ? '' : pend ? 'Para aprobar, resuelve primero lo que está por revisar.' : P.aprobado ? 'Va al grupo «Comprobantes de pago». Te pedirá tu código.' : 'Primero se aprueba con código, después se envía.'}</p>
          </div>
        </aside>
      </div></div>`;
  }
  function lunesNomina() {
    const n = D.NOMINA.proxima; const ve = puede('nomina', 'sueldos');
    return `<div class="rejilla"><div class="c7 pila">
      <article class="hoja"><div class="hoja-cab"><h2>${ic('nomina')}Nómina del ${esc(n.fecha)}</h2>${tag('Paso 1 de 4', 'aviso')}</div>
        <ol class="pasos"><li class="actual">Prepara Andreina</li><li>Revisa Jose</li><li>Aprueba Alejandro</li><li>Se paga</li></ol>
        <p class="muted">Cada paso lo hace una persona distinta. Hoy falta: <b>${esc(n.falta)}</b>.</p>
        <dl class="kv"><div><dt>Nómina formal (${n.formal.personas} personas)</dt><dd>${ve ? dinero(n.formal.total) : 'Agrupada'}</dd></div><div><dt>Nómina interna (${n.interna.personas} personas)</dt><dd>${ve ? dinero(n.interna.total) : 'Agrupada'}</dd></div><div><dt>Total estimado</dt><dd>${dinero(n.formal.total + n.interna.total)}</dd></div></dl>
        ${ve ? '' : `<p class="nota gris">${ic('candado', 's')}<span>No ves sueldos por persona. Solo dueño, RRHH y contabilidad.</span></p>`}
      </article></div>
      <div class="c5 pila"><article class="hoja"><h2>Cómo se paga</h2><ol class="tiempo"><li><time>1</time><span>RRHH sube el reporte y la app arma la lista en el orden de RRHH.</span></li><li><time>2</time><span>Se marca cada pago con la cuenta de donde salió.</span></li><li><time>3</time><span>Se suben todas las capturas de una vez y la app las casa.</span></li><li class="ok"><time>4</time><span>Sale el PDF al grupo «Pagos al Personal», con código.</span></li></ol></article>
      <button class="btn sec" data-ir="nomina">Ir a la nómina ${ic('derecha', 's')}</button></div></div>`;
  }
  PANT.pagos = {
    titulo: 'Pagos de los lunes', corto: 'Pagos', tab: 'Pagos', grupo: 'Dinero que sale', icono: 'pagos', mod: 'pagos',
    cuenta: () => D.LUNES.filter(r => !r.c).length,
    render: (sub = 'lunes') => `<div class="pagina">
      ${A.cab(D.HOY.largo, 'Pagos de los lunes', 'La lista se armó sola a las 6:00 con todo lo que vence antes del lunes que viene. <b>Hoy usa las facturas importadas a mano el domingo 4</b>: la copia automática de Odoo sigue bloqueada hasta que se arregle el candado.', puede('pagos', 'editar') ? `<button class="btn sec chico" data-acc="linea-nueva">${ic('mas', 's')}Agregar una línea</button>` : '')}
      ${A.lectura('pagos')}
      ${A.subnav([['lunes', 'Proveedores', D.LUNES.filter(r => !r.c).length, true], ['nomina', 'Pagar la nómina'], ['anteriores', 'Lotes anteriores']], sub)}
      ${sub === 'lunes' ? lunesProveedores() : sub === 'nomina' ? lunesNomina() : A.tabla({ cols: [{ t: 'Lote', cls: 'p' }, { t: 'Pagos', cls: 'x' }, { t: 'Aprobó', cls: 'x' }, { t: 'Total', cls: 'r' }, { t: 'Estado', cls: 'e' }], filas: [['Lunes 28 sep', 14, 9310.40], ['Lunes 21 sep', 11, 7215.00], ['Lunes 14 sep', 15, 10102.75]].map(([f, n, t]) => ({ abrir: 'pdf:' + f, celdas: [`<b>${f}</b><small>PDF enviado al grupo</small>`, n, 'Alejandro', dinero(t), tag('Enviado', 'ok')] })) })}
    </div>`,
    montar: raiz => {
      const cap = $('#capturas', raiz);
      if (cap) cap.addEventListener('change', e => { if (e.target.files.length) A.aviso(e.target.files.length + ' capturas nuevas. En el prototipo no se leen.', 'info'); });
    },
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pl]');
    if (!b) { if (P.menu !== null && !e.target.closest('.c-cuenta') && S.ruta === 'pagos') { P.menu = null; A.pintarPagina(); } return; }
    const i = +b.dataset.i; const a = b.dataset.pl;
    if (a === 'menu') { P.menu = P.menu === i ? null : i; A.pintarPagina(); const f = $('.menu button'); if (f) f.focus(); }
    else if (a === 'pick') {
      const r = D.LUNES[i]; const k = b.dataset.c || null; const antes = r.c; r.c = k; P.menu = null; if (k && k !== antes) P.recien = i;
      A.auditar({ modulo: 'Pagos de los lunes', registro: prov(r.p).nombre, campo: 'sale de', antes: antes || 'sin pagar', despues: k || 'sin pagar' });
      A.pintarPagina(); A.pintarPagina();
      if (P.recien !== null) { const j = P.recien; P.recien = null; requestAnimationFrame(() => requestAnimationFrame(() => { const el = $(`.lfila[data-i="${j}"]`); if (el) el.classList.add('pagada'); })); }
    }
    else if (a === 'explica') { P.explica = P.explica === i ? null : i; A.pintarPagina(); }
    else if (a === 'verificar') A.pedirCodigo('Confirmas que llamaste al proveedor y que la cuenta nueva es suya.').then(() => { D.LUNES[i].bloqueada = false; prov(D.LUNES[i].p).estado = 'al_dia'; P.explica = null; A.auditar({ modulo: 'Proveedores', registro: prov(D.LUNES[i].p).nombre, campo: 'cuenta', antes: 'por verificar', despues: 'verificada por teléfono' }); A.pintarPagina(); A.aviso('Cuenta verificada. Ya puedes marcar el pago.'); }).catch(() => {});
    else if (a === 'duda') { P.dudas[b.dataset.d] = b.dataset.r; A.pintarPagina(); }
    else if (a === 'aprobar') A.pedirCodigo('Apruebas el lote de ' + D.LUNES.filter(r => r.c).length + ' pagos.').then(() => { P.aprobado = true; P.selloRecien = 'aprobado'; setTimeout(() => { P.selloRecien = null; }, 60); A.auditar({ modulo: 'Pagos de los lunes', registro: 'Lote del 5 oct', campo: 'estado', antes: 'preparado', despues: 'aprobado' }); A.pintarPagina(); A.aviso('Lote aprobado. Ahora puedes enviarlo.'); }).catch(() => {});
    else if (a === 'enviar') A.pedirCodigo('Se envía el PDF al grupo «Comprobantes de pago».').then(() => { P.enviado = true; P.selloRecien = 'enviado'; setTimeout(() => { P.selloRecien = null; }, 60); A.auditar({ modulo: 'Pagos de los lunes', registro: 'Lote del 5 oct', campo: 'estado', antes: 'aprobado', despues: 'enviado' }); A.pintarPagina(); A.aviso('Enviado al grupo. (Simulado)'); }).catch(() => {});
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && P.menu !== null) { P.menu = null; A.pintarPagina(); } });
  ACC['linea-nueva'] = () => A.aviso('Jose puede agregar o quitar líneas antes de pagar; queda el motivo. (Simulado)', 'info');
  FICHAS.lineapago = i => {
    const r = D.LUNES[i]; const pv = prov(r.p); const facts = D.FACTURAS.filter(f => f.prov === r.p && f.estado !== 'pagada');
    return { titulo: pv.nombre, sub: 'Línea del lunes · ' + esc(r.f), mod: 'pagos', obj: r, registro: 'Línea ' + pv.nombre,
      tags: [[r.c ? 'Pagado desde ' + r.c : 'Sin pagar', r.c ? 'ok' : '']],
      bloques: [
        { titulo: 'Facturas que cubre', html: `<ul class="lista">${facts.map(f => `<li><button class="fila" data-abrir="factura:${f.id}"><span class="lead">${ic('archivo')}</span><span class="medio"><b>N.º ${esc(f.num)}</b><small>Vence ${esc(f.vence)}</small></span><span class="monto">${dinero(f.saldo)}</span></button></li>`).join('')}</ul>` },
        { titulo: 'El pago', filas: [{ l: 'Monto a pagar ($)', v: dinero(r.m), campo: { k: 'm', tipo: 'dinero' } }, { l: 'Moneda del pago', v: 'Bolívares a tasa BCV' }, { l: 'Cuenta del proveedor', v: esc(pv.cuenta) }, { l: 'Comisión del banco', v: r.c ? 'Bs 0,00 (pago móvil)' : '—' }, { l: 'Captura casada', v: r.c ? 'Sí · ref. 004' + (1180 + +i) : 'Todavía no' }] },
      ],
      acciones: [{ txt: 'Dividir en dos cuentas', acc: 'pronto', icono: 'mas', solo: 'editar' }, { txt: 'Quitar de la lista', acc: 'quitar-linea', arg: i, icono: 'anular', solo: 'editar' }] };
  };
  ACC['quitar-linea'] = i => A.pedirMotivo({ titulo: 'Quitar de la lista', texto: 'La factura sigue abierta: solo sale de la lista de hoy.', boton: 'Quitar' }).then(m => { A.auditar({ modulo: 'Pagos de los lunes', registro: prov(D.LUNES[i].p).nombre, campo: 'lista', antes: 'en la lista', despues: 'quitada', motivo: m }); A.aviso('Quitada de la lista de hoy. (Simulado: la fila sigue para que la veas)'); A.cerrarFicha(); }).catch(() => {});
  FICHAS.capturas = () => ({
    titulo: 'Capturas del lote', sub: 'Pagos de los lunes · 18 leídas', mod: 'pagos',
    bloques: [{ html: A.tabla({ cols: [{ t: 'Captura', cls: 'p' }, { t: 'Casó con', cls: 'x' }, { t: 'Monto', cls: 'r' }, { t: 'Estado', cls: 'e' }], filas: D.LUNES.filter(r => r.c).slice(0, 8).map((r, k) => ({ celdas: [`<b>${esc(prov(r.p).nombre)}</b><small>Ref. 004${1180 + k} · desde ${r.c}</small>`, esc(prov(r.p).nombre), dinero(r.m), r.duda && !P.dudas[r.duda] ? tag('Duda', 'aviso') : tag('Casada', 'ok')] })) }) },
      { html: '<p class="muted">De cada captura se lee: beneficiario, cuenta que recibe, referencia, monto y comisión. Lo que no es comprobante (una planilla del SENIAT, por ejemplo) se separa. Si la cuenta de origen de la captura no es la que marcaste, avisa.</p>' }],
  });
  FICHAS.pdf = id => {
    const pag = D.LUNES.filter(r => r.c); const pagado = pag.reduce((s, r) => s + r.m, 0); const sin = D.LUNES.filter(r => !r.c);
    const html = `<div class="pdf"><header><div><h2>Comprobantes de pago</h2><p style="font-size:12px;color:#5A6372">${id === 'lunes' ? 'Lunes 5 de octubre de 2026' : esc(id)} · hoja 1 · datos inventados</p></div></header>
      <div class="pdf-cajas"><div>Pagado<b>${dinero(pagado)}</b></div><div>En bolívares<b>${dinero(pagado * D.TASA.usd, 'bs', 0)}</b></div><div>Comprobantes<b>${pag.length}</b></div></div>
      <div class="tabla-env"><table class="pdf-t"><thead><tr><th>#</th><th>Beneficiario</th><th class="r">Monto</th><th>Origen</th></tr></thead><tbody>${pag.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(prov(r.p).nombre)}</td><td class="r">${dinero(r.m)}</td><td><span class="acct" data-c="${r.c}">${r.c}</span></td></tr>`).join('')}</tbody></table></div>
      <ol class="pdf-nota"><li>Cuadre: lista ${dinero(total())} − sin pagar ${dinero(sin.reduce((s, r) => s + r.m, 0))} = pagado ${dinero(pagado)}.</li><li>Aparte: traspaso de BVCA a BVCE (ref. 00418822); no suma.</li><li>Queda por pagar: ${sin.length ? sin.map(r => esc(prov(r.p).nombre)).join(', ') : 'nada'}.</li></ol>
      <p style="font-size:11px;color:#5A6372">Las hojas siguientes llevan las capturas en 2 columnas, cada una con la etiqueta de color de su cuenta.</p></div>`;
    return { titulo: 'Hoja 1 del PDF', sub: 'Vista previa', mod: 'pagos', bloques: [{ html }], acciones: [{ txt: 'Descargar PDF', acc: 'descargar', arg: 'pdf', icono: 'descargar' }] };
  };
  ACC.descargar = () => A.aviso('Se descargaría el archivo y quedaría anotado quién lo bajó. (Simulado)', 'info');

  /* =============== PROVEEDORES Y FACTURAS =============== */
  PANT.proveedores = {
    titulo: 'Proveedores y facturas', corto: 'Proveedores', tab: 'Proveedores', grupo: 'Dinero que sale', icono: 'proveedores', mod: 'proveedores',
    render: (sub = 'facturas') => {
      const abiertas = D.FACTURAS.filter(f => f.saldo > 0);
      const deuda = abiertas.reduce((s, f) => s + f.saldo, 0);
      const vencidas = abiertas.filter(f => f.estado === 'vencida');
      let cuerpo = '';
      if (sub === 'facturas') {
        const f = A.filtroActual('abiertas');
        const lista = D.FACTURAS.filter(x => f === 'todas' || (f === 'abiertas' && x.saldo > 0) || x.estado === f || (f === 'vencidas' && x.estado === 'vencida'));
        cuerpo = A.filtros('t-fac', [['abiertas', 'Por pagar', abiertas.length], ['vencida', 'Vencidas', vencidas.length], ['ajustada', 'Ajustadas', D.FACTURAS.filter(x => x.estado === 'ajustada').length], ['pagada', 'Pagadas'], ['todas', 'Todas']], f, 'Buscar factura o proveedor') +
          A.tabla({ id: 't-fac', cols: [{ t: 'Factura', cls: 'p' }, { t: 'Proveedor', cls: 'x' }, { t: 'Fecha', cls: 'x' }, { t: 'Vence', cls: 'x' }, { t: 'Saldo', cls: 'r' }, { t: 'Estado', cls: 'e' }],
            filas: lista.map(x => ({ abrir: 'factura:' + x.id, clase: x.anulada ? 'anulada' : '', txt: prov(x.prov).nombre, celdas: [`<b>N.º ${esc(x.num)}</b><small>${esc(prov(x.prov).nombre)}${x.alerta ? ' · ' + ic('alerta', 'xs') + ' ' + esc(x.alerta) : ''}</small>`, esc(prov(x.prov).nombre), esc(x.fecha), esc(x.vence), dinero(x.saldo), A.estadoTag(x.estado)] })) });
      }
      if (sub === 'proveedores') cuerpo = A.filtros('t-prov', null, null, 'Buscar proveedor, RIF o categoría') + A.tabla({ id: 't-prov', cols: [{ t: 'Proveedor', cls: 'p' }, { t: 'Categoría', cls: 'x' }, { t: 'Plazo', cls: 'x' }, { t: 'Cuenta', cls: 'x' }, { t: 'Deuda', cls: 'r' }, { t: 'Estado', cls: 'e' }],
        filas: D.PROVEEDORES.map(p => ({ abrir: 'proveedor:' + p.id, txt: p.rif + ' ' + p.cat, celdas: [`<b>${esc(p.nombre)}</b><small>${esc(p.rif)}</small>`, esc(p.cat), p.plazo ? p.plazo + ' días' : 'De contado', esc(p.cuenta), dinero(p.deuda), A.estadoTag(p.estado)] })) });
      if (sub === 'ajustes') {
        const aj = D.AUDITORIA.filter(a => a.modulo === 'Proveedores');
        cuerpo = `<p class="nota info">${ic('info', 's')}<span>Jose corrige facturas y cuentas solo aquí. Queda el valor de Odoo, el nuevo, el motivo y quién lo hizo. La copia de Odoo nunca pisa un ajuste: si Odoo cambia ese dato después, aparece un aviso y Jose decide.</span></p>` +
          A.tabla({ cols: [{ t: 'Qué se cambió', cls: 'p' }, { t: 'Antes', cls: 'x' }, { t: 'Después', cls: 'r' }, { t: 'Quién', cls: 'e' }], filas: aj.map(a => ({ abrir: 'cambio:' + a.id, celdas: [`<b>${esc(a.registro)} · ${esc(a.campo)}</b><small>${esc(a.motivo)}</small>`, esc(a.antes), esc(a.despues), esc(a.quien) + '<br><small class="muted">' + esc(a.cuando) + '</small>'] })) });
      }
      if (sub === 'devoluciones') cuerpo = `<p class="nota info">${ic('info', 's')}<span>Mercancía mala que se devuelve. Cada proveedor tiene su trato (por ejemplo, repone la mitad y el resto es merma). Si pasan 3 días sin reponer, avisa a Jose y a Manuel.</span></p>` +
        A.tabla({ cols: [{ t: 'Devolución', cls: 'p' }, { t: 'Trato', cls: 'x' }, { t: 'Monto', cls: 'r' }, { t: 'Estado', cls: 'e' }], filas: D.DEVOLUCIONES.map(d => ({ abrir: 'devolucion:' + d.id, celdas: [`<b>${esc(d.que)}</b><small>${esc(prov(d.prov).nombre)} · ${esc(d.fecha)}</small>`, esc(d.trato), dinero(d.monto), A.estadoTag(d.estado) + (d.dias ? ` <small class="muted">${d.dias} días</small>` : '')] })) });
      return `<div class="pagina">${A.cab('Cuentas por pagar', 'Proveedores y facturas', 'Las facturas se copian de Odoo (hoy, a mano los domingos). Aquí se ven, se corrigen con motivo y se pagan el lunes.', A.boton('proveedores', 'Nuevo proveedor', 'data-acc="pronto"', { tono: 'sec', icono: 'mas' }))}
        ${A.lectura('proveedores')}
        <div class="cifras">
          ${A.cifra({ etq: 'Les debemos', valor: dinero(deuda, 'usd', 0), sub: abiertas.length + ' facturas de los últimos 3 meses', ir: 'proveedores/facturas' })}
          ${A.cifra({ etq: 'Vencido', valor: dinero(vencidas.reduce((s, f) => s + f.saldo, 0), 'usd', 0), sub: vencidas.length + ' facturas', tono: 'alerta', ir: 'proveedores/facturas' })}
          ${A.cifra({ etq: 'Facturas sin número de control', valor: '2', sub: 'se retiene el 100 % del IVA', tono: 'aviso', abrir: 'factura:f6' })}
          ${A.cifra({ etq: 'Esperando reposición', valor: D.DEVOLUCIONES.filter(d => d.estado === 'esperando').length, sub: 'queso telita · 4 días', ir: 'proveedores/devoluciones' })}
        </div>
        ${A.subnav([['facturas', 'Facturas', abiertas.length, true], ['proveedores', 'Proveedores', D.PROVEEDORES.length, true], ['ajustes', 'Ajustes de Jose'], ['devoluciones', 'Devoluciones', D.DEVOLUCIONES.filter(d => d.estado === 'esperando').length]], sub)}
        ${cuerpo}</div>`;
    },
  };
  FICHAS.factura = id => {
    const f = D.FACTURAS.find(x => x.id === id); const pv = prov(f.prov);
    const bloques = [
      { titulo: 'Datos', filas: [{ l: 'Proveedor', v: `<button class="enlace" data-abrir="proveedor:${pv.id}">${esc(pv.nombre)}</button>` }, { l: 'Número', v: esc(f.num) }, { l: 'Número de control', v: esc(f.control), campo: { k: 'control', tipo: 'texto' } }, { l: 'Fecha', v: esc(f.fecha) }, { l: 'Vence', v: esc(f.vence), campo: { k: 'vence', tipo: 'texto' } }, { l: 'Monto ($)', v: dinero(f.monto) + (f.ajuste ? `<span class="cambio"><s>${dinero(f.ajuste.antes)}</s> en Odoo</span>` : ''), campo: { k: 'monto', tipo: 'dinero' } }, { l: 'Saldo', v: dinero(f.saldo) }, { l: 'Viene de', v: esc(f.origen) + ' · importada el dom 4 oct' }] },
      { titulo: 'Historial', tiempo: [[f.fecha, 'Se registró en Odoo.']].concat(f.ajuste ? [[f.ajuste.cuando.split(' ').slice(0, 3).join(' '), `Ajuste de ${esc(f.ajuste.quien)}: ${esc(f.ajuste.campo.toLowerCase())} ${dinero(f.ajuste.antes)} → ${dinero(f.ajuste.despues)}. «${esc(f.ajuste.motivo)}»`, 'info']] : []).concat(f.estado === 'pagada' ? [['28 sep', 'Pagada en el lote del lunes 28 sep desde BVCA.', 'ok']] : []) },
      { titulo: 'Archivo', adjuntos: [pv.nombre + ' ' + f.num + '.jpg'] },
    ];
    return { titulo: 'Factura N.º ' + f.num, sub: esc(pv.nombre), mod: 'proveedores', obj: f, registro: 'Factura ' + f.num, tags: [[A.estadoTag(f.estado).replace(/<[^>]+>/g, ''), { vencida: 'alerta', ajustada: 'info', pagada: 'ok' }[f.estado] || '']],
      aviso: f.alerta ? `<p class="nota aviso">${ic('alerta', 's')}<span>${esc(f.alerta)}. Para lo fiscal hay que retenerle el 100 % del IVA o pedirle una factura bien hecha.</span></p>` : '',
      bloques, alGuardar: (cambios, motivo) => { const c = cambios.find(x => x.r.campo.k === 'monto'); if (c) { f.ajuste = { campo: 'Monto', antes: c.antes, despues: c.nuevo, motivo, quien: S.usuario.nombre, cuando: 'Hoy ' + D.HOY.hora }; f.saldo = c.nuevo; f.estado = 'ajustada'; } } };
  };
  FICHAS.proveedor = id => {
    const p = D.PROVEEDORES.find(x => x.id === id); const facts = D.FACTURAS.filter(f => f.prov === id && f.saldo > 0);
    return { titulo: p.nombre, sub: esc(p.cat) + ' · ' + esc(p.rif), mod: 'proveedores', obj: p, registro: p.nombre, tags: [[A.estadoTag(p.estado).replace(/<[^>]+>/g, ''), p.estado === 'cuenta_nueva' ? 'alerta' : p.estado === 'vencida' ? 'alerta' : 'ok']],
      aviso: p.estado === 'cuenta_nueva' ? `<p class="nota alerta">${ic('candado', 's')}<span><b>Cuenta por verificar.</b> Jose la cambió el jueves 1 con su código y le avisó a Alejandro. Queda así hasta que alguien confirme por teléfono.</span></p>` : '',
      bloques: [
        { titulo: 'Ficha', filas: [{ l: 'Nombre', v: esc(p.nombre), campo: { k: 'nombre', tipo: 'texto' } }, { l: 'Categoría', v: esc(p.cat), campo: { k: 'cat', tipo: 'select', opciones: D.PARAMS.categorias } }, { l: 'Plazo para pagar (días)', v: p.plazo ? p.plazo + ' días' : 'De contado', campo: { k: 'plazo', tipo: 'numero' } }, { l: 'Cuenta para pagarle', v: esc(p.cuenta), campo: { k: 'cuenta', tipo: 'texto', sensible: true } }, { l: 'Contacto', v: esc(p.contacto), campo: { k: 'contacto', tipo: 'texto' } }] },
        { titulo: 'Facturas abiertas (' + facts.length + ')', html: facts.length ? `<ul class="lista">${facts.map(f => `<li><button class="fila" data-abrir="factura:${f.id}"><span class="lead">${ic('archivo')}</span><span class="medio"><b>N.º ${esc(f.num)}</b><small>Vence ${esc(f.vence)}</small></span><span class="monto">${dinero(f.saldo)}</span></button></li>`).join('')}</ul>` : '<p class="muted">Sin facturas abiertas.</p>' },
      ],
      alGuardar: cambios => { if (cambios.some(c => c.r.campo.k === 'cuenta')) p.estado = 'cuenta_nueva'; } };
  };
  FICHAS.devolucion = id => {
    const d = D.DEVOLUCIONES.find(x => x.id === id);
    return { titulo: 'Devolución: ' + d.que, sub: esc(prov(d.prov).nombre) + ' · ' + esc(d.fecha), mod: 'proveedores', obj: d, registro: 'Devolución ' + d.que, tags: [[d.estado === 'esperando' ? 'Esperando reposición · ' + d.dias + ' días' : 'Repuesta', d.estado === 'esperando' ? 'aviso' : 'ok']],
      bloques: [{ filas: [{ l: 'Qué se devolvió', v: esc(d.que) }, { l: 'Valor', v: dinero(d.monto) }, { l: 'Trato con el proveedor', v: esc(d.trato), campo: { k: 'trato', tipo: 'texto' } }, { l: 'La registró', v: esc(d.quien) }, { l: 'Merma', v: d.trato.includes('mitad') ? dinero(d.monto / 2) + ' (2 kg)' : '—' }] }, { titulo: 'Foto', adjuntos: ['queso-telita-devuelto.jpg'] }],
      acciones: d.estado === 'esperando' ? [{ txt: 'Llegó la reposición', acc: 'repuesta', arg: d.id, icono: 'check', tono: 'pri', solo: 'editar' }] : [] };
  };
  ACC.repuesta = id => { const d = D.DEVOLUCIONES.find(x => x.id === id); d.estado = 'repuesta'; d.dias = 0; const p = D.PENDIENTES.find(x => x.abrir === 'devolucion:' + id); if (p) p.hecho = 'Repuesta, marcada por ' + S.usuario.nombre; A.auditar({ modulo: 'Proveedores', registro: 'Devolución ' + d.que, campo: 'estado', antes: 'esperando', despues: 'repuesta' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Marcada como repuesta.'); };
  FICHAS.cambio = id => {
    const a = D.AUDITORIA.find(x => x.id === id);
    return { titulo: a.registro, sub: 'Cambio · ' + esc(a.cuando), mod: 'auditoria', bloques: [{ filas: [{ l: 'Módulo', v: esc(a.modulo) }, { l: 'Qué', v: esc(a.campo) }, { l: 'Antes', v: esc(a.antes) }, { l: 'Después', v: esc(a.despues) }, { l: 'Quién', v: esc(a.quien) + (a.tipoActor !== 'persona' ? ' ' + tag(a.tipoActor === 'bot' ? 'Bot' : 'Agente', 'lila') : '') }, { l: 'Motivo', v: esc(a.motivo || '—'), largo: true }] }, { html: '<p class="muted">Este registro no se puede editar ni borrar. Lo escribe la propia base de datos.</p>' }] };
  };
})();
