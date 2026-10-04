/* Efectivo y bancos: Bóveda, Caja chica y socios, Bancos y conciliación, Tasas. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, $, $$, esc, fmt, dinero, leerNum, ic, tag, puede } = A;
  const puedeRetirar = () => puede('boveda', 'editar') || (S.usuario && S.usuario.extra.some(x => x.includes('retiro')));
  const B = { oculto: false, para: 'retiro', hecho: false, conteo: {} };

  /* =============== BÓVEDA =============== */
  function bovedaResumen() {
    const porRevisar = D.BOVEDA.movs.filter(m => m.estado === 'revisar').length;
    return `<div class="rejilla">
      <div class="c5 pila">
        <article class="hoja ${B.oculto ? 'oculto' : ''}">
          <div class="hoja-cab"><p class="etq">En la bóveda</p><button class="enlace" data-acc="ocultar-boveda">${ic(B.oculto ? 'ojo' : 'ojo-no', 's')}${B.oculto ? 'Mostrar' : 'Ocultar'}</button></div>
          <p class="grande ocultable">${dinero(D.BOVEDA.total, 'usd', 0)}</p>
          <p class="muted">Último conteo: ${esc(D.BOVEDA.conteo)}</p>
          <dl class="kv ocultable">${D.BOVEDA.denoms.map(([d, n]) => `<div><dt>${n} billetes de $${d}</dt><dd>${dinero(d * n, 'usd', 0)}</dd></div>`).join('')}</dl>
          <button class="enlace" data-sub="billetes">Ver los ${D.BOVEDA.denoms.reduce((s, x) => s + x[1], 0)} billetes con su serial ${ic('derecha', 's')}</button>
        </article>
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">
          ${puedeRetirar() ? `<button class="btn pri" data-sub="sacar">${ic('menos', 's')}Sacar</button>` : `<button class="btn bloq" data-acc="sin-permiso" data-arg="boveda">${ic('candado', 's')}Sacar</button>`}
          ${A.boton('boveda', 'Meter', 'data-sub="meter"', { tono: 'sec', icono: 'mas' })}
          ${A.boton('boveda', 'Contar', 'data-sub="contar"', { tono: 'sec', icono: 'check' })}
        </div>
        <p class="nota gris">${ic('candado', 's')}<span>Solo la ven los socios y quien la custodia. El total nunca sale en ningún grupo ni en el parte de la mañana.</span></p>
      </div>
      <div class="c7 pila">
        <div class="sec"><h2>Movimientos</h2>${porRevisar ? tag(porRevisar + ' por revisar', 'aviso') : ''}</div>
        ${A.tabla({ cols: [{ t: 'Movimiento', cls: 'p' }, { t: 'Cómo llegó', cls: 'x' }, { t: 'Monto', cls: 'r' }, { t: 'Estado', cls: 'e' }], filas: D.BOVEDA.movs.map(m => ({ abrir: 'movboveda:' + m.id, celdas: [`<b>${esc(m.titulo)}</b><small>${esc(m.sub)}</small>`, esc(m.via), m.monto ? `<span class="monto ${m.monto > 0 ? 'mas' : 'menos'}">${m.monto > 0 ? '+' : '−'}${dinero(Math.abs(m.monto), 'usd', 0)}</span>` : '—', m.estado === 'ok' ? tag(m.tipo === 'conteo' ? 'Cuadró' : 'Registrado', 'ok') : tag('Por revisar', 'aviso')] })) })}
        <p class="nota info">${ic('info', 's')}<span>Todo lo que entra o sale se registra por la app (con foto y código) o por el grupo de bóveda (con foto y leyenda, por ejemplo «Retiro 500»). Lo que llega por el grupo queda marcado «sin doble factor».</span></p>
      </div></div>`;
  }
  function bovedaSacar() {
    const soloRetiro = !puede('boveda', 'editar');
    if (soloRetiro) B.para = 'retiro';
    if (B.hecho) return `<div class="pila" style="max-width:620px"><div class="hecho-caja">${ic('check')}<span>Retiro de ${dinero(leerNum(B.monto || '500') || 0, 'usd', 0)} registrado. Les avisamos a ${S.usuario.id === 'luis' ? 'Alejandro' : 'Luis'} y a Jose. (Simulado)</span></div><button class="btn sec" data-acc="boveda-volver">Volver a la bóveda</button></div>`;
    return `<div class="rejilla"><div class="c6 pila">
      <div class="foto" role="img" aria-label="Foto simulada de 5 billetes de 100 dólares"><div class="billetes"><span></span><span></span><span></span><span></span><span></span></div><div class="foto-pie"><span style="display:inline-flex;align-items:center;gap:6px">${ic('check', 's')}Foto de los billetes</span><button class="enlace" style="color:inherit" data-acc="pronto">${ic('camara', 's')}Repetir</button></div></div>
      <article class="hoja"><h2><label for="sacar-monto">¿Cuánto sacas?</label></h2><div class="monto-campo"><span>$</span><input id="sacar-monto" inputmode="decimal" value="${esc(B.monto || '500')}" autocomplete="off"></div><p class="chequeo ok" id="sacar-check">${ic('check', 's')}<span>La foto muestra 5 billetes de $100: $ 500. Cuadra.</span></p></article>
      <article class="hoja"><h2>¿Para qué?</h2>
        <div class="seg" role="group" aria-label="Para qué">${[['retiro', 'Retiro personal'], ['pago', 'Pagar a un proveedor'], ['rendir', 'Plata para pagar (por rendir)']].map(([k, t]) => `<button data-acc="para" data-arg="${k}" aria-pressed="${B.para === k}" ${soloRetiro && k !== 'retiro' ? 'disabled title="Solo puedes registrar tu retiro"' : ''}>${t}</button>`).join('')}</div>
        ${B.para === 'pago' ? `<label class="campo" for="sacar-prov"><span>¿A quién?</span><select id="sacar-prov">${D.PROVEEDORES.map(p => `<option>${esc(p.nombre)}</option>`).join('')}</select></label>` : ''}
        ${B.para === 'rendir' ? `<label class="campo" for="sacar-quien"><span>¿Quién se lleva la plata?</span><select id="sacar-quien"><option>Manuel</option><option>Luis Roberto</option></select><small class="ayuda">Queda «por rendir» hasta que traiga las facturas o el vuelto.</small></label>` : ''}
        ${B.para === 'retiro' ? '<p class="muted">Se anota como anticipo de utilidades y se descuenta en el reparto.</p>' : ''}
      </article></div>
      <div class="c6 pila">
      <article class="hoja"><div class="hoja-cab"><h2>Seriales leídos de la foto</h2>${tag('5 de 5', 'ok')}</div>
        <ul class="seriales">${D.BOVEDA.movs[0].seriales.map(s => `<li><span class="mono">${s}</span><span class="num">$100</span>${tag('Estaba', 'ok')}</li>`).join('')}</ul>
        <p class="muted">Cada serial se busca en la lista de la bóveda. Si uno no estaba, queda «por revisar» y salta la alerta de billete desconocido.</p></article>
      <p class="nota aviso">${ic('info', 's')}<span><b>Por decidir (Q1):</b> ¿los retiros de más de $ 200 los aprueba Alejandro antes? Hoy se registran al instante y se avisa.</span></p>
      <p class="nota info">${ic('campana', 's')}<span>Al registrarlo avisamos al otro socio y a quien custodia.</span></p>
      <button class="btn pri full" data-acc="registrar-retiro">${ic('candado', 's')}Registrar el retiro</button>
      <p class="muted" style="text-align:center">Te pedirá tu código de 6 dígitos.</p>
      <button class="btn ghost" data-acc="boveda-volver">${ic('atras', 's')}Volver a la bóveda</button></div></div>`;
  }
  function bovedaMeter() {
    return `<div class="rejilla"><div class="c6 pila">
      <article class="hoja"><h2>¿De dónde viene?</h2><div class="seg" role="group" aria-label="Origen"><button aria-pressed="true">Entrada del cierre</button><button aria-pressed="false" data-acc="pronto">Compra de dólares</button><button aria-pressed="false" data-acc="pronto">Otro ingreso</button></div>
        <div class="campos"><label class="campo" for="m-caja"><span>Caja</span><select id="m-caja"><option>Caja 1 · turno noche</option><option>Caja 2 · turno noche</option></select></label><label class="campo" for="m-monto"><span>Monto ($)</span><input id="m-monto" inputmode="decimal" value="1.140"></label></div>
        <p class="muted">En una compra de dólares se anota la tasa negociada y de qué cuenta salieron los bolívares.</p></article>
      <label class="soltar" for="m-foto">${ic('camara')}<span><b>Foto de los billetes</b>Obligatoria. La app lee los seriales.</span></label><input id="m-foto" type="file" accept="image/*" class="sr-only">
      </div><div class="c6 pila"><article class="hoja"><h2>Lo que leyó la foto</h2><dl class="kv"><div><dt>Billetes</dt><dd>14</dd></div><div><dt>Total leído</dt><dd>$ 1.140</dd></div><div><dt>Seriales nuevos</dt><dd>14 de 14 ${tag('Ninguno repetido', 'ok')}</dd></div></dl></article>
      <button class="btn pri full" data-acc="meter-ok">${ic('candado', 's')}Meter a la bóveda</button><button class="btn ghost" data-acc="boveda-volver">${ic('atras', 's')}Volver</button></div></div>`;
  }
  function bovedaContar() {
    return `<div class="rejilla"><div class="c7 pila"><article class="hoja"><h2>Conteo con testigo</h2><p class="muted">Cuenten los billetes por denominación. La app compara con lo que debería haber.</p>
      ${A.tabla({ cols: [{ t: 'Billete', cls: 'p' }, { t: 'Debería haber', cls: 'r x' }, { t: 'Contaron', cls: 'r' }, { t: '', cls: 'e' }], filas: D.BOVEDA.denoms.map(([d, n]) => { const c = B.conteo[d] ?? n; return { celdas: [`<b>$${d}</b>`, n, `<input aria-label="Billetes de $${d} contados" data-contar="${d}" value="${c}" inputmode="numeric" style="width:76px;min-height:34px;border:1px solid var(--raya);border-radius:8px;padding:0 8px;text-align:right;background:var(--hoja)">`, c === n ? tag('Cuadra', 'ok') : tag((c - n > 0 ? '+' : '') + (c - n), 'alerta')] }; }) })}
      </article></div>
      <div class="c5 pila"><article class="hoja"><h2>Testigo</h2><label class="campo" for="c-testigo"><span>¿Quién cuenta contigo?</span><select id="c-testigo"><option>Luis Roberto</option><option>Alejandro</option><option>Jose</option></select></label><p class="muted">Cada uno confirma con su propio código. Si falta un billete, salta la alerta y queda «por revisar».</p></article>
      <label class="soltar" for="c-foto">${ic('camara')}<span><b>Foto del conteo</b>Opcional, recomendada.</span></label><input id="c-foto" type="file" accept="image/*" class="sr-only">
      <button class="btn pri full" data-acc="contar-ok">${ic('candado', 's')}Cerrar el conteo</button><button class="btn ghost" data-acc="boveda-volver">${ic('atras', 's')}Volver</button></div></div>`;
  }
  function bovedaBilletes() {
    const ser = ['MB 44591022 A', 'MF 10293847 C', 'PL 55820193 B', 'MB 77120934 D', 'ME 30918275 A', 'PB 11920384 E', 'MG 66012837 A', 'PF 20019384 C', 'MB 90011234 B', 'PL 33019284 A', 'ML 12093847 D', 'MC 55019283 B'];
    return `${A.filtros('t-bil', null, null, 'Buscar un serial')}${A.tabla({ id: 't-bil', cols: [{ t: 'Serial', cls: 'p' }, { t: 'Billete', cls: 'r' }, { t: 'Entró', cls: 'x' }, { t: 'Estado', cls: 'e' }], filas: ser.map((s, i) => ({ celdas: [`<span class="mono">${s}</span>`, '$' + (i < 9 ? 100 : 50), i < 5 ? 'Salió sáb 3 oct (retiro de Luis)' : 'Vie 2 oct · cierre', i < 5 ? tag('Salió', '') : tag('En la bóveda', 'ok')] })) })}
      <p class="muted">Se muestran 12 de ${D.BOVEDA.denoms.reduce((s, x) => s + x[1], 0)}. Cada noche la app verifica que la suma de los billetes sea igual al total.</p>
      <button class="btn ghost" data-acc="boveda-volver">${ic('atras', 's')}Volver</button>`;
  }
  PANT.boveda = {
    titulo: 'Bóveda', grupo: 'Efectivo', icono: 'boveda', mod: 'boveda',
    cuenta: () => D.BOVEDA.movs.filter(m => m.estado === 'revisar').length,
    render: (sub = 'resumen') => {
      const t = { resumen: ['Dólares en efectivo', 'Bóveda'], sacar: ['Bóveda', 'Sacar de la bóveda'], meter: ['Bóveda', 'Meter a la bóveda'], contar: ['Bóveda', 'Contar la bóveda'], billetes: ['Bóveda', 'Billetes con su serial'] }[sub];
      return `<div class="pagina">${A.cab(t[0], t[1], sub === 'resumen' ? 'Cada billete con su serial. El saldo se calcula, nunca se teclea.' : '')}
        ${sub === 'resumen' && !puede('boveda', 'editar') && puedeRetirar() ? `<p class="nota gris">${ic('ojo', 's')}<span><b>Ves la bóveda sin poder cambiarla.</b> Lo único que puedes registrar es tu propio retiro.</span></p>` : ''}
        ${{ resumen: bovedaResumen, sacar: bovedaSacar, meter: bovedaMeter, contar: bovedaContar, billetes: bovedaBilletes }[sub]()}</div>`;
    },
    montar: raiz => {
      const sm = $('#sacar-monto', raiz);
      if (sm) sm.addEventListener('input', () => {
        B.monto = sm.value; const n = leerNum(sm.value); const c = $('#sacar-check');
        const ok = n === 500;
        c.className = 'chequeo ' + (ok ? 'ok' : 'aviso');
        c.innerHTML = ic(ok ? 'check' : 'alerta', 's') + '<span>' + (ok ? 'La foto muestra 5 billetes de $100: $ 500. Cuadra.' : 'La foto muestra $ 500 y escribiste ' + dinero(n || 0, 'usd', 0) + '. Revisa la foto o el monto antes de registrar.') + '</span>';
      });
      $$('[data-contar]', raiz).forEach(inp => inp.addEventListener('change', () => { B.conteo[inp.dataset.contar] = parseInt(inp.value, 10) || 0; A.pintarPagina(); }));
    },
  };
  ACC['ocultar-boveda'] = () => { B.oculto = !B.oculto; A.pintarPagina(); };
  ACC.para = k => { B.para = k; A.pintarPagina(); };
  ACC['boveda-volver'] = () => { B.hecho = false; S.sub.boveda = 'resumen'; A.pintarPagina(); };
  ACC['registrar-retiro'] = () => A.pedirCodigo('Registrar el retiro de ' + dinero(leerNum(B.monto || '500') || 0, 'usd', 0) + '.').then(() => {
    const n = leerNum(B.monto || '500') || 0;
    D.BOVEDA.total -= n; D.BOVEDA.movs.unshift({ id: 'b' + Date.now(), tipo: 'salida', titulo: (B.para === 'retiro' ? 'Retiro de ' : B.para === 'pago' ? 'Pago a proveedor · ' : 'Por rendir · ') + S.usuario.nombre, sub: 'Hoy ' + D.HOY.hora + ' · desde la app · 5 billetes', monto: -n, estado: 'ok', via: 'App con código', seriales: [] });
    A.auditar({ modulo: 'Bóveda', registro: 'Salida de ' + dinero(n, 'usd', 0), campo: 'creado', despues: dinero(n, 'usd', 0), motivo: { retiro: 'Retiro personal', pago: 'Pago a proveedor', rendir: 'Plata por rendir' }[B.para] });
    B.hecho = true; A.pintarPagina();
  }).catch(() => {});
  ACC['meter-ok'] = () => A.pedirCodigo('Meter $ 1.140 a la bóveda.').then(() => { D.BOVEDA.total += 1140; A.auditar({ modulo: 'Bóveda', registro: 'Entrada del cierre', campo: 'creado', despues: '$ 1.140' }); S.sub.boveda = 'resumen'; A.pintarPagina(); A.aviso('Entraron $ 1.140 a la bóveda.'); }).catch(() => {});
  ACC['contar-ok'] = () => A.pedirCodigo('Cerrar el conteo. Después confirma el testigo con su código.').then(() => { A.auditar({ modulo: 'Bóveda', registro: 'Conteo con testigo', campo: 'creado', despues: 'cerrado' }); S.sub.boveda = 'resumen'; A.pintarPagina(); A.aviso('Conteo cerrado. Falta el código del testigo. (Simulado)'); }).catch(() => {});
  FICHAS.movboveda = id => {
    const m = D.BOVEDA.movs.find(x => x.id === id);
    return { titulo: m.titulo, sub: esc(m.sub), mod: 'boveda', obj: m, registro: m.titulo, tags: [[m.estado === 'ok' ? 'Registrado' : 'Por revisar', m.estado === 'ok' ? 'ok' : 'aviso']], anulable: true,
      aviso: m.estado === 'revisar' ? `<p class="nota aviso">${ic('alerta', 's')}<span>Un serial no se pudo leer en la foto. Márcalo a mano, corrige el total o pide otra foto.</span></p>` : '',
      bloques: [{ filas: [{ l: 'Monto', v: m.monto ? dinero(Math.abs(m.monto), 'usd', 0) : '—' }, { l: 'Cómo llegó', v: esc(m.via) }, { l: 'Nota', v: esc(m.nota || '—'), campo: { k: 'nota', tipo: 'texto' } }] },
        m.seriales.length ? { titulo: 'Seriales', html: `<ul class="seriales">${m.seriales.map(s => `<li><span class="mono">${s}</span><span>$100</span>${tag('Estaba', 'ok')}</li>`).join('')}</ul>` } : { oculto: true },
        { titulo: 'Foto', adjuntos: ['billetes-' + m.id + '.jpg'] }],
      acciones: m.estado === 'revisar' ? [{ txt: 'Marcar resuelto', acc: 'mov-ok', arg: m.id, icono: 'check', tono: 'pri', solo: 'editar' }] : [] };
  };
  ACC['mov-ok'] = id => A.pedirCodigo('Marcar el movimiento como revisado.').then(() => { const m = D.BOVEDA.movs.find(x => x.id === id); m.estado = 'ok'; A.auditar({ modulo: 'Bóveda', registro: m.titulo, campo: 'estado', antes: 'por revisar', despues: 'revisado' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Revisado.'); }).catch(() => {});

  /* =============== CAJA CHICA Y SOCIOS =============== */
  PANT.cajachica = {
    titulo: 'Caja chica y socios', corto: 'Caja chica y socios', grupo: 'Efectivo', icono: 'cajachica', mod: 'cajachica',
    render: (sub = 'chica') => {
      const C = D.CAJACHICA; let cuerpo = '';
      if (sub === 'chica') cuerpo = `<div class="cifras">${A.cifra({ etq: 'Saldo de caja chica', valor: dinero(C.saldo), sub: 'de un fondo de ' + dinero(C.fondo, 'usd', 0), tono: C.saldo < 60 ? 'aviso' : '' })}${A.cifra({ etq: 'Gastado esta semana', valor: dinero(C.fondo - C.saldo), sub: C.gastos.length + ' gastos' })}${A.cifra({ etq: 'Sin foto del soporte', valor: C.gastos.filter(g => !g.soporte).length, sub: 'hay que justificarlo', tono: 'aviso' })}${A.cifra({ etq: 'Próxima reposición', valor: 'Lunes 12', sub: 'se repone ' + C.reposicion })}</div>
        ${A.tabla({ cols: [{ t: 'Gasto', cls: 'p' }, { t: 'Quién', cls: 'x' }, { t: 'Monto', cls: 'r' }, { t: 'Soporte', cls: 'e' }], filas: C.gastos.map(g => ({ abrir: 'gasto:' + g.id, clase: g.anulada ? 'anulada' : '', celdas: [`<b>${esc(g.que)}</b><small>${esc(g.fecha)}</small>`, esc(g.quien), dinero(g.monto), g.soporte ? tag('Con foto', 'ok') : tag('Falta la foto', 'aviso')] })) })}`;
      if (sub === 'socios') cuerpo = `<p class="nota info">${ic('info', 's')}<span>Cada retiro de un socio es un anticipo de utilidades. En el reparto del trimestre se descuenta según el % de cada uno.</span></p>
        <div class="rejilla">${D.SOCIOS.map(s => `<div class="c6"><article class="hoja"><div class="hoja-cab"><h2>${ic('usuario')}${esc(s.nombre)}</h2>${tag(s.pct + ' %', '')}</div><dl class="kv"><div><dt>Retirado este trimestre</dt><dd>${dinero(s.retirado, 'usd', 0)}</dd></div><div><dt>Por rendir</dt><dd>${dinero(s.porRendir, 'usd', 0)}</dd></div></dl></article></div>`).join('')}</div>
        <div class="sec"><h2>Retiros</h2></div>${A.tabla({ cols: [{ t: 'Retiro', cls: 'p' }, { t: 'De dónde', cls: 'x' }, { t: 'Cómo', cls: 'x' }, { t: 'Monto', cls: 'r' }], filas: D.RETIROS.map(r => ({ abrir: 'retiro:' + r.id, celdas: [`<b>${esc(r.socio)}</b><small>${esc(r.fecha)} · ${esc(r.para)}</small>`, esc(r.de), esc(r.via), dinero(r.monto, 'usd', 0)] })) })}`;
      if (sub === 'consumo') cuerpo = consumoSocios();
      if (sub === 'rendir') cuerpo = `<p class="nota info">${ic('info', 's')}<span>Plata que alguien se lleva para pagar algo. Queda pendiente hasta que traiga las facturas o el vuelto.</span></p>
        ${A.tabla({ cols: [{ t: 'Quién', cls: 'p' }, { t: 'Para qué', cls: 'x' }, { t: 'Falta justificar', cls: 'r' }, { t: 'Estado', cls: 'e' }], filas: [{ abrir: 'retiro:r3', celdas: ['<b>Luis Roberto</b><small>Lun 28 sep · desde la bóveda</small>', 'Pagar al técnico del aire', dinero(300, 'usd', 0), tag('7 días sin rendir', 'aviso')] }] })}`;
      return `<div class="pagina">${A.cab('Efectivo', 'Caja chica y socios', 'Los gastos chicos del día, los retiros y el consumo de los socios, y la plata que alguien se llevó para pagar algo.', A.boton('cajachica', 'Gastar de caja chica', 'data-acc="gasto-nuevo"', { icono: 'mas' }))}
        ${A.lectura('cajachica')}${A.subnav([['chica', 'Caja chica'], ['socios', 'Retiros de socios'], ['consumo', 'Consumo de socios'], ['rendir', 'Por rendir', 1]], sub)}${cuerpo}</div>`;
    },
  };
  /* ---------- consumo de los socios ---------- */
  const CS = () => D.CONSUMO_SOCIOS;
  // lo que lleva un socio este mes (solo lo personal: las invitaciones del negocio no cuentan)
  A.consumoMes = socio => CS().lista.filter(c => c.socio === socio && c.tipo === 'personal').reduce((s2, c) => s2 + c.carta, 0);
  const costoMes = socio => CS().lista.filter(c => c.socio === socio && c.tipo === 'personal').reduce((s2, c) => s2 + c.costo, 0);
  A.tarjetaConsumo = (socio, { compacta = false } = {}) => {
    const T = CS().tope; const lleva = A.consumoMes(socio); const x = CS().socios.find(z => z.socio === socio); const pct = Math.min(100, lleva / T * 100);
    const exSep = Math.max(0, x.sep - T);
    return `<article class="hoja consumo"><div class="hoja-cab"><h2>${ic('cubiertos')}${compacta ? 'Tu consumo de octubre' : esc(socio)}</h2>${tag(lleva > T ? 'Pasó el tope' : 'Quedan ' + dinero(T - lleva, 'usd', 0), lleva > T ? 'alerta' : lleva > T * .8 ? 'aviso' : 'ok')}</div>
      <p class="consumo-cifra"><b>${dinero(lleva)}</b> <span class="muted">de ${dinero(T, 'usd', 0)} en octubre</span></p>
      <div class="medidor" role="img" aria-label="Lleva el ${fmt(pct, 0)} % del tope"><span style="width:${pct}%;background:${lleva > T ? 'var(--alerta)' : lleva > T * .8 ? 'var(--aviso)' : 'var(--ok)'}"></span><i style="left:calc(100% - 2px)"></i></div>
      ${compacta ? `<button class="enlace" data-ir="cajachica/consumo">Ver el detalle ${ic('derecha', 's')}</button>` : `<dl class="kv"><div><dt>Le costó al negocio (a costo de receta)</dt><dd>${dinero(costoMes(socio))}</dd></div><div><dt>Septiembre</dt><dd>${dinero(x.sep, 'usd', 0)}${exSep ? ' ' + tag('Pasó ' + dinero(exSep, 'usd', 0) + ': fue a sus retiros', 'aviso') : ' ' + tag('Dentro del tope', 'ok')}</dd></div><div><dt>Agosto</dt><dd>${dinero(x.ago)}</dd></div></dl>`}
    </article>`;
  };
  function consumoSocios() {
    const C2 = CS();
    return `<p class="nota info">${ic('info', 's')}<span>Lo que comen y beben los socios en el restaurante. La cajera cierra el pedido en el POS con el método «Consumo socio» y llega con la copia de Odoo. Tope: <b>${dinero(C2.tope, 'usd', 0)} al mes por socio, a precio de carta</b> ${tag('Por confirmar', 'aviso')}</span></p>
      <div class="rejilla">${C2.socios.map(x => `<div class="c6">${A.tarjetaConsumo(x.socio)}</div>`).join('')}</div>
      <div class="sec"><h2>Consumos de octubre</h2><span class="muted">${esc(C2.cierre)}</span></div>
      ${A.tabla({ cols: [{ t: 'Consumo', cls: 'p' }, { t: 'Socio', cls: 'x' }, { t: 'A precio de carta', cls: 'r' }, { t: 'A costo', cls: 'r x' }, { t: 'Cuenta para el tope', cls: 'e' }], filas: C2.lista.map(c => ({ abrir: 'consumosocio:' + c.id, celdas: [`<b>${esc(c.que)}</b><small>${esc(c.fecha)} · ${esc(c.pedido)}</small>`, esc(c.socio), dinero(c.carta), dinero(c.costo), c.tipo === 'personal' ? tag('Sí', 'info') : tag('No: invitación del negocio', '')] })) })}
      <div class="rejilla"><div class="c6"><p class="nota gris">${ic('termometro', 's')}<span>Como entra por el POS, la comida sale del inventario con su receta: el termómetro de la comida no la cuenta como merma.</span></p></div>
      <div class="c6"><p class="nota aviso">${ic('calendario', 's')}<span>Al cerrar el mes, si un socio pasa el tope, la diferencia se suma a sus retiros (anticipo de utilidades) y se le avisa al otro socio (propuesta). Lo que no se usa no se acumula.</span></p></div></div>`;
  }
  FICHAS.consumosocio = id => {
    const c = CS().lista.find(x => x.id === id);
    return { titulo: c.que, sub: esc(c.socio) + ' · ' + esc(c.fecha), mod: 'cajachica', obj: c, registro: 'Consumo de ' + c.socio,
      tags: [[c.tipo === 'personal' ? 'Cuenta para el tope' : 'Invitación del negocio', c.tipo === 'personal' ? 'info' : '']],
      bloques: [{ filas: [{ l: 'Socio', v: esc(c.socio), campo: { k: 'socio', tipo: 'select', opciones: CS().socios.map(x => x.socio) } }, { l: 'Pedido del POS', v: esc(c.pedido) }, { l: 'A precio de carta', v: dinero(c.carta) }, { l: 'A costo de receta', v: dinero(c.costo) },
        { l: '¿Cuenta para el tope?', v: c.tipo === 'personal' ? 'Sí, es consumo personal' : 'No, fue una invitación del negocio', campo: { k: 'tipo', tipo: 'select', opciones: [['personal', 'Sí, es consumo personal'], ['invitacion', 'No, fue una invitación del negocio']] } }] },
        { html: `<p class="muted">Si fue con un proveedor o un cliente, se marca como invitación del negocio: no cuenta para los ${dinero(CS().tope, 'usd', 0)} y va como gasto de atención. Cambiarlo pide el motivo y queda en el registro.</p>` }] };
  };
  FICHAS.gasto = id => {
    const g = D.CAJACHICA.gastos.find(x => x.id === id);
    return { titulo: g.que, sub: 'Caja chica · ' + esc(g.fecha), mod: 'cajachica', obj: g, registro: 'Gasto ' + g.que, anulable: true, tags: [[g.soporte ? 'Con foto' : 'Falta la foto', g.soporte ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'Qué', v: esc(g.que), campo: { k: 'que', tipo: 'texto' } }, { l: 'Monto ($)', v: dinero(g.monto), campo: { k: 'monto', tipo: 'dinero' } }, { l: 'Quién lo gastó', v: esc(g.quien) }] }, g.soporte ? { titulo: 'Soporte', adjuntos: ['soporte-' + g.id + '.jpg'] } : { html: `<label class="soltar" for="sop-${g.id}">${ic('camara')}<span><b>Subir la foto del soporte</b>Sin foto el gasto queda por justificar.</span></label><input id="sop-${g.id}" type="file" accept="image/*" class="sr-only">` }] };
  };
  ACC['gasto-nuevo'] = () => A.aviso('Gasto nuevo: monto, qué, foto obligatoria. Más de $ 40 lo aprueba Alejandro. (Simulado)', 'info');
  FICHAS.retiro = id => {
    const r = D.RETIROS.find(x => x.id === id);
    return { titulo: 'Retiro de ' + r.socio, sub: esc(r.fecha), mod: 'cajachica', obj: r, bloques: [{ filas: [{ l: 'Monto', v: dinero(r.monto, 'usd', 0) }, { l: 'De dónde', v: esc(r.de) }, { l: 'Para qué', v: esc(r.para) }, { l: 'Cómo se registró', v: esc(r.via) }, { l: 'Avisado a', v: r.socio === 'Alejandro' ? 'Luis Roberto y Jose' : 'Alejandro y Jose' }] }, { titulo: 'Foto de los billetes', adjuntos: ['retiro-' + r.id + '.jpg'] }] };
  };

  /* =============== BANCOS Y CONCILIACIÓN =============== */
  PANT.bancos = {
    titulo: 'Bancos y conciliación', corto: 'Bancos', tab: 'Bancos', grupo: 'Bancos', icono: 'bancos', mod: 'bancos',
    cuenta: () => D.CONCILIACION.filter(c => c.estado !== 'conciliada').length,
    render: (sub = 'cuentas') => {
      let cuerpo = '';
      if (sub === 'cuentas') cuerpo = A.tabla({ cols: [{ t: 'Cuenta', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Titular', cls: 'x' }, { t: 'Último movimiento', cls: 'x' }, { t: 'Saldo', cls: 'r' }], filas: D.CUENTAS.filter(c => S.usuario.rol !== 'fiscal_externo' || c.tipo === 'Banco').map(c => ({ abrir: 'cuenta:' + c.id, celdas: [`<span class="acct" data-c="${c.id}">${c.id}</span> <b style="display:inline">${esc(c.nombre)}</b><small>${esc(c.num)}</small>`, esc(c.tipo), esc(c.titular), esc(c.ultimo), dinero(c.saldo, c.mon, c.mon === 'bs' ? 0 : 2)] })) }) + `<p class="muted">El saldo sale del libro de movimientos y se verifica cada mes contra el estado de cuenta. Nadie lo teclea.</p>`;
      if (sub === 'conciliacion') cuerpo = `<div class="cifras">${D.CONCILIACION.map(c => A.cifra({ etq: c.id + ' · ' + c.mes, valor: A.estadoTag(c.estado).replace(/<[^>]+>/g, ''), sub: c.estado === 'diferencias' ? (c.sinComp + c.sinBanco + c.sinId) + ' cosas por aclarar' : c.estado === 'falta' ? 'sube el PDF del banco' : 'subido el ' + c.subido, abrir: 'conciliacion:' + c.id, tono: c.estado === 'falta' ? 'alerta' : c.estado === 'diferencias' ? 'aviso' : '' })).join('')}</div>
        ${puede('bancos', 'editar') ? `<label class="soltar" for="edo-cuenta">${ic('subir')}<span><b>Subir un estado de cuenta (PDF)</b>La app lo lee, comprueba que sus totales cuadran con los impresos y lo compara con el libro.</span></label><input id="edo-cuenta" type="file" accept="application/pdf" class="sr-only">` : ''}
        <div class="sec"><h2>Lo que hay que aclarar en BVCJ · septiembre</h2></div>
        ${A.tabla({ cols: [{ t: 'Qué pasó', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Monto', cls: 'r' }, { t: '', cls: 'e' }], filas: D.DIFERENCIAS.map(d => ({ abrir: 'diferencia:' + d.id, clase: d.resuelta ? 'anulada' : '', celdas: [`<b>${esc(d.desc)}</b><small>${esc(d.fecha)} · ${esc(d.tipo)}</small>`, esc(d.tipo), dinero(d.monto), d.resuelta ? tag('Aclarado', 'ok') : tag({ 'Salió sin comprobante': 'Falta comprobante', 'Comprobante que no aparece en el banco': 'No está en el banco', 'Entró sin identificar': 'Sin identificar' }[d.tipo], 'aviso')] })) })}`;
      return `<div class="pagina">${A.cab('Todas las cuentas', 'Bancos y conciliación', 'Cada mes se sube el estado de cuenta de cada banco y la app dice qué salió sin comprobante, qué comprobante no aparece en el banco y qué entró sin identificar.')}
        ${S.usuario.rol === 'fiscal_externo' ? `<p class="nota gris">${ic('ojo', 's')}<span>Ves los bancos para tu trabajo, sin poder cambiarlos. Los pagos de nómina salen agrupados por corrida, sin nombres ni sueldos.</span></p>` : A.lectura('bancos')}
        ${A.subnav([['cuentas', 'Cuentas'], ['conciliacion', 'Conciliación del mes', D.CONCILIACION.filter(c => c.estado !== 'conciliada').length]], sub)}${cuerpo}</div>`;
    },
    montar: raiz => { const f = $('#edo-cuenta', raiz); if (f) f.addEventListener('change', () => A.aviso('Estado de cuenta recibido. En el prototipo no se lee.', 'info')); },
  };
  FICHAS.cuenta = id => {
    const c = D.CUENTAS.find(x => x.id === id);
    return { titulo: c.nombre, sub: esc(c.tipo) + ' · ' + esc(c.num), mod: 'bancos', obj: c, registro: 'Cuenta ' + c.id,
      bloques: [{ filas: [{ l: 'Etiqueta', v: `<span class="acct" data-c="${c.id}">${c.id}</span>` }, { l: 'Saldo', v: dinero(c.saldo, c.mon) }, { l: 'Titular o custodio', v: esc(c.titular), campo: { k: 'titular', tipo: 'texto' } }, { l: 'Número', v: esc(c.num), campo: { k: 'num', tipo: 'texto', sensible: true } }, { l: 'Último movimiento', v: esc(c.ultimo) }] },
        { titulo: 'Últimos movimientos', tiempo: [['Hoy', 'Pago móvil recibido · Bs 22.506,05', 'ok'], ['Hoy', 'Pago a Carnes La Pradera · Bs 1.126.816,00', ''], ['Ayer', 'Traspaso a BVCE · Bs 50.000,00', '']] }] };
  };
  FICHAS.conciliacion = id => {
    const c = D.CONCILIACION.find(x => x.id === id);
    return { titulo: 'Conciliación ' + id + ' · ' + c.mes, sub: 'Bancos', mod: 'bancos', obj: c, tags: [[A.estadoTag(c.estado).replace(/<[^>]+>/g, ''), c.estado === 'conciliada' ? 'ok' : c.estado === 'falta' ? 'alerta' : 'aviso']],
      bloques: [{ filas: [{ l: 'Salió sin comprobante', v: c.sinComp }, { l: 'Comprobante que no aparece en el banco', v: c.sinBanco }, { l: 'Entró sin identificar', v: c.sinId }, { l: 'Estado de cuenta subido', v: esc(c.subido) + (c.por !== '—' ? ' por ' + esc(c.por) : '') }] }, c.estado !== 'falta' ? { titulo: 'Archivo', adjuntos: ['Estado de cuenta ' + id + ' ' + c.mes.toLowerCase() + '.pdf'] } : { oculto: true }],
      acciones: c.estado === 'falta' ? [{ txt: 'Subir el estado de cuenta', acc: 'pronto', icono: 'subir', tono: 'pri', solo: 'editar' }] : c.estado === 'diferencias' ? [{ txt: 'Ver lo que hay que aclarar', acc: 'ir-a', arg: 'bancos/conciliacion', icono: 'derecha' }] : [] };
  };
  FICHAS.diferencia = id => {
    const d = D.DIFERENCIAS.find(x => x.id === id);
    const opciones = { 'Salió sin comprobante': [['Es una comisión del banco', 'comision'], ['Subir el comprobante', 'comprobante']], 'Comprobante que no aparece en el banco': [['El pago se devolvió', 'devuelto'], ['Salió en octubre', 'octubre']], 'Entró sin identificar': [['Es de un cliente', 'cliente'], ['Es un traspaso nuestro', 'traspaso']] }[d.tipo];
    return { titulo: d.desc, sub: esc(d.cuenta) + ' · ' + esc(d.fecha), mod: 'bancos', obj: d, tags: [[d.resuelta ? 'Aclarado: ' + d.resuelta : d.tipo, d.resuelta ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'Monto', v: dinero(d.monto) }, { l: 'Qué dice el banco', v: esc(d.desc), largo: true }, { l: 'Qué falta', v: esc(d.tipo) }] }],
      acciones: d.resuelta ? [] : opciones.map(([t, k]) => ({ txt: t, acc: 'aclarar', arg: d.id + '|' + t, solo: 'editar' })) };
  };
  ACC.aclarar = arg => { const [id, t] = arg.split('|'); const d = D.DIFERENCIAS.find(x => x.id === id); d.resuelta = t; A.auditar({ modulo: 'Bancos', registro: d.desc, campo: 'conciliación', antes: d.tipo, despues: t }); A.pintarFicha(); A.pintarPagina(); A.aviso('Aclarado.'); };

  /* =============== TASAS =============== */
  PANT.tasas = {
    titulo: 'Tasas de hoy', corto: 'Tasas', tab: 'Tasas', grupo: 'Bancos', icono: 'tasas', mod: 'tasas',
    render: () => {
      const vals = []; const a = 571.30, b = D.TASA.usd;
      for (let i = 0; i < 30; i++) { const p = i / 29; vals.push(i === 29 ? b : a + (b - a) * Math.pow(p, 1.25) + Math.sin(i * 1.7) * 1.1 * (1 - p)); }
      const brecha = (D.TASA.usdt / D.TASA.usd - 1) * 100;
      return `<div class="pagina">${A.cab('Vigentes desde el viernes 2, 16:00', 'Tasas de hoy', 'Las carga el bot desde el BCV. Si a las 9:00 no llegaron, Jose o Alejandro las cargan a mano. Sábado, domingo y feriados vale la última publicada.', A.boton('tasas', 'Cargar a mano', 'data-acc="tasa-mano"', { tono: 'sec', icono: 'lapiz' }))}
        <div class="rejilla"><div class="c7 pila"><article class="hoja">
          ${[['Dólar BCV', D.TASA.usd, '+0,8 %', 'tasa:usd'], ['Euro BCV', D.TASA.eur, '+0,6 %', 'tasa:eur'], ['USDT (Binance)', D.TASA.usdt, '+1,2 %', 'tasa:usdt']].map(([n, v, c, ab], i) => `<button class="fila" data-abrir="${ab}" style="padding-inline:0;${i ? 'border-top:1px solid var(--raya-2)' : ''}"><span class="medio"><span class="etq">${n}</span><span class="grande" style="font-size:30px">${dinero(v, 'bs')}</span>${i === 0 ? A.spark(vals, { etqIni: '3 sep · Bs ' + fmt(vals[0]), etqFin: 'Hoy · Bs ' + fmt(b) }) : `<small>${i === 1 ? 'Los precios de la carta están en euros.' : 'Promedio de compra en P2P a las 7:30.'}</small>`}</span><span class="fin">${tag(c, 'aviso')}${ic('derecha', 's chev')}</span></button>`).join('')}
        </article><p class="nota aviso">${ic('alerta', 's')}<span>El USDT está ${fmt(brecha, 1)} % por encima del dólar BCV.</span></p></div>
        <div class="c5 pila"><article class="hoja"><h2>Calculadora</h2><div class="calc">
          <label for="calc-monto">Monto en $ o €<input id="calc-monto" inputmode="decimal" value="100" autocomplete="off"></label>
          <label for="calc-res">En bolívares<output id="calc-res" for="calc-monto calc-tasa">${dinero(100 * D.TASA.usd, 'bs')}</output></label>
          <label class="ancho" for="calc-tasa">A la tasa<select id="calc-tasa"><option value="${D.TASA.usd}">Dólar BCV · ${fmt(D.TASA.usd)}</option><option value="${D.TASA.eur}">Euro BCV · ${fmt(D.TASA.eur)}</option><option value="${D.TASA.usdt}">USDT · ${fmt(D.TASA.usdt)}</option></select></label></div></article>
          <article class="hoja"><h2>Valores legales</h2><dl class="kv">${D.PARAMS.legales.map(l => `<div><dt>${esc(l[0])}</dt><dd>${esc(l[1])}</dd></div>`).join('')}</dl><button class="enlace" data-ir="parametros/tasas">Ver con su vigencia en Parámetros ${ic('derecha', 's')}</button></article>
          <label class="campo" for="tasa-fecha"><span>Consultar la tasa de otra fecha</span><input id="tasa-fecha" type="date" value="2026-09-15"></label></div></div></div>`;
    },
    montar: raiz => {
      const calc = () => { const n = leerNum($('#calc-monto').value); const t = parseFloat($('#calc-tasa').value); $('#calc-res').textContent = n === null ? 'Escribe un monto' : dinero(n * t, 'bs'); };
      $('#calc-monto', raiz).addEventListener('input', calc); $('#calc-tasa', raiz).addEventListener('change', calc);
      $('#tasa-fecha', raiz).addEventListener('change', e => A.aviso('El ' + e.target.value.split('-').reverse().join('/') + ' el dólar BCV estaba en Bs 589,12. (Inventado)', 'info'));
    },
  };
  FICHAS.tasa = k => {
    const n = { usd: 'Dólar BCV', eur: 'Euro BCV', usdt: 'USDT (Binance)' }[k];
    const obj = { valor: D.TASA[k] };
    return { titulo: n, sub: 'Tasa de hoy · ' + D.HOY.corto, mod: 'tasas', obj, registro: n + ' ' + D.HOY.corto,
      bloques: [{ filas: [{ l: 'Valor (Bs)', v: dinero(D.TASA[k], 'bs'), campo: { k: 'valor', tipo: 'dinero', mon: 'bs' } }, { l: 'Fuente', v: k === 'usdt' ? 'Promedio P2P de Binance' : 'Banco Central de Venezuela' }, { l: 'La cargó', v: 'n8n-tasas (bot) a las 7:30' }] },
        { html: '<p class="muted">Una tasa por día y por tipo. Corregirla deja la anterior en el registro de cambios; nunca se pisa en silencio.</p>' }],
      alGuardar: cambios => { D.TASA[k] = cambios[0].nuevo; } };
  };
  ACC['tasa-mano'] = () => A.abrir('tasa', 'usd');
})();
