/* Efectivo y bancos: Bóveda, Caja chica y socios, Bancos y conciliación, Tasas. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, $, $$, esc, fmt, dinero, leerNum, ic, tag, puede } = A;
  const puedeRetirar = () => puede('boveda', 'editar') || (S.usuario && S.usuario.extra.some(x => x.includes('retiro')));
  const r2 = n => Math.round(n * 100) / 100;
  // conteo a ciegas: cada uno cuenta sin ver lo que debería haber ni el conteo del otro (paso 1 cuenta quien abre, paso 2 el testigo, paso 3 se ve todo)
  const conteoVacio = (tNombre = '') => ({ paso: 1, yo: {}, testigo: {}, msg: '', tNombre });
  // desglose: el detalle por billete arranca oculto, para que quien va a contar (y su testigo) no lo vea antes
  const B = { oculto: false, desglose: false, para: 'retiro', hecho: false, conteo: conteoVacio(), quien: 'Manuel', paraQue: '' };
  // «Sacar» en blanco: sin la confirmación del retiro anterior, con el monto que lee la foto y «retiro personal»
  const sacarVacio = () => { B.hecho = false; B.monto = undefined; B.para = 'retiro'; B.quien = 'Manuel'; B.paraQue = ''; };
  // quién puede llevarse plata por rendir: cada uno ve lo suyo en su Inicio
  const LLEVAN = ['Manuel', 'Luis Roberto'];
  // el total de la bóveda es la suma de sus billetes: sacar, meter o devolver un vuelto mueve los billetes y el total los sigue
  // enBilletes: un monto en dólares enteros, de los billetes más grandes a los más chicos (lo que «lee la foto» en el prototipo)
  const enBilletes = n => { const out = []; let r = Math.round(n); [100, 50, 20, 10, 5, 1].forEach(d => { const k = Math.floor(r / d); if (k) { out.push([d, k]); r -= k * d; } }); return out; };
  const hayBilletes = bs => bs.every(([d, k]) => (D.BOVEDA.denoms.find(x => x[0] === d) || [d, 0])[1] >= k);
  const moverBilletes = (bs, signo) => bs.forEach(([d, k]) => { const x = D.BOVEDA.denoms.find(z => z[0] === d); if (x) x[1] += signo * k; });
  const billetesTxt = bs => bs.map(([d, k]) => k + ' de $' + d).join(', ');
  const FOTO_RETIRO = [[100, 5]], FOTO_ENTRADA = [[100, 10], [50, 2], [20, 2]]; // lo que leen las fotos simuladas de Sacar ($ 500) y de Meter ($ 1.140)
  const sumaBilletes = bs => bs.reduce((s, [d, k]) => s + d * k, 0);

  /* =============== BÓVEDA =============== */
  function bovedaResumen() {
    const porRevisar = D.BOVEDA.movs.filter(m => m.estado === 'revisar').length;
    return `<div class="rejilla">
      <div class="c5 pila">
        <article class="hoja ${B.oculto ? 'oculto' : ''}">
          <div class="hoja-cab"><p class="etq">En la bóveda</p><button class="enlace" data-acc="ocultar-boveda">${ic(B.oculto ? 'ojo' : 'ojo-no', 's')}${B.oculto ? 'Mostrar' : 'Ocultar'}</button></div>
          <p class="grande ocultable">${dinero(D.BOVEDA.total, 'usd', 0)}</p>
          <p class="muted">Último conteo: ${esc(D.BOVEDA.conteo)}</p>
          ${B.desglose ? `<dl class="kv ocultable">${D.BOVEDA.denoms.map(([d, n]) => `<div><dt>${n} billetes de $${d}</dt><dd>${dinero(d * n, 'usd', 0)}</dd></div>`).join('')}</dl>` : `<p class="muted">El desglose por billete está oculto: si vas a contar, cuenta primero. El conteo es a ciegas.</p>`}
          <button class="enlace" data-acc="desglose-boveda">${ic(B.desglose ? 'ojo-no' : 'ojo', 's')}${B.desglose ? 'Ocultar el desglose' : 'Ver el desglose por billete'}</button>
          <button class="enlace" data-sub="billetes">Ver los ${D.BOVEDA.denoms.reduce((s, x) => s + x[1], 0)} billetes con su serial ${ic('derecha', 's')}</button>
        </article>
        ${(b => b ? `<div style="display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:8px">${b}</div>` : '')(
          // quien solo registra su retiro ve un solo botón, a lo ancho: Meter y Contar no le aparecen
          (puedeRetirar() ? `<button class="btn pri" data-sub="sacar">${ic('menos', 's')}${puede('boveda', 'editar') ? 'Sacar' : 'Registrar mi retiro'}</button>` : '') +
          A.boton('boveda', 'Meter', 'data-sub="meter"', { tono: 'sec', icono: 'mas' }) +
          A.boton('boveda', 'Contar', 'data-sub="contar"', { tono: 'sec', icono: 'check' }))}
        <p class="nota gris">${ic('candado', 's')}<span>Solo la ven los socios y quien la custodia. El total nunca sale en ningún grupo ni en el parte de la mañana.</span></p>
      </div>
      <div class="c7 pila">
        <div class="sec"><h2>Movimientos</h2>${porRevisar ? tag(porRevisar + ' por revisar', 'aviso') : ''}</div>
        ${A.tabla({ cols: [{ t: 'Movimiento', cls: 'p' }, { t: 'Cómo llegó', cls: 'x' }, { t: 'Monto', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: D.BOVEDA.movs.map(m => ({ abrir: 'movboveda:' + m.id, celdas: [`<b>${esc(m.titulo)}</b><small>${esc(m.sub)}</small>`, esc(m.via), m.monto ? `<span class="monto ${m.monto > 0 ? 'mas' : 'menos'}">${m.monto > 0 ? '+' : '−'}${dinero(Math.abs(m.monto), 'usd', 0)}</span>` : '—', (m.ejemplo ? tag('Ejemplo', '') + ' ' : '') + (m.estado === 'ok' ? tag(m.tipo === 'conteo' ? 'Cuadró' : 'Registrado', 'ok') : tag(m.tipo === 'conteo' ? 'No cuadró' : 'Por revisar', 'aviso'))] })) })}
        <p class="nota info">${ic('info', 's')}<span>Todo lo que entra o sale se registra por la app (con foto y código) o por el grupo de bóveda, que está por crear (con foto y leyenda, por ejemplo «Retiro 500»). Lo del grupo lo registra el bot al instante si todo cuadra, a nombre de quien mandó la foto y marcado «sin doble factor»; si algo falla, queda «por revisar». El pago a un proveedor de la lista es un ejemplo de cómo llegará.</span></p>
      </div></div>`;
  }
  function bovedaSacar() {
    const soloRetiro = !puede('boveda', 'editar');
    if (soloRetiro) B.para = 'retiro';
    const montoTxt = dinero(leerNum(B.monto || '500') || 0, 'usd', 0);
    if (B.hecho) return `<div class="pila" style="max-width:620px"><div class="hecho-caja">${ic('check')}<span>${B.hecho === 'rendir' ? `Salieron ${montoTxt} por rendir, a nombre de ${esc(B.quien)}. Quedan en Caja chica › Por rendir hasta que traiga las facturas o el vuelto. (Simulado)` : B.hecho === 'pago' ? `Pago de ${montoTxt} a un proveedor registrado. Les avisamos a Alejandro y a Jose. (Simulado)` : `Retiro de ${montoTxt} registrado. Les avisamos a ${S.usuario.id === 'luis' ? 'Alejandro' : 'Luis'} y a Jose. (Simulado)`}</span></div>${B.hecho === 'rendir' ? `<button class="btn sec" data-ir="cajachica/rendir">Ver lo que está por rendir</button>` : ''}<button class="btn sec" data-acc="boveda-volver">Volver a la bóveda</button></div>`;
    // data-form: lo que se escribe o se escoge aquí no se pierde sin preguntar (al tocar otra sección, una pestaña o «Volver a la bóveda»)
    return `<div class="rejilla" data-form="sacar"><div class="c6 pila">
      <div class="foto" role="img" aria-label="Foto simulada de 5 billetes de 100 dólares"><div class="billetes"><span></span><span></span><span></span><span></span><span></span></div><div class="foto-pie"><span style="display:inline-flex;align-items:center;gap:6px">${ic('check', 's')}Foto de los billetes</span><button class="enlace" style="color:inherit" data-acc="pronto">${ic('camara', 's')}Repetir</button></div></div>
      <article class="hoja"><h2><label for="sacar-monto">¿Cuánto sacas?</label></h2><div class="monto-campo"><span>$</span><input id="sacar-monto" inputmode="decimal" value="${esc(B.monto || '500')}" autocomplete="off"></div><p class="chequeo ok" id="sacar-check">${ic('check', 's')}<span>La foto muestra 5 billetes de $100: $ 500. Cuadra.</span></p></article>
      <article class="hoja"><h2>¿Para qué?</h2>
        ${soloRetiro
          // quien solo puede registrar su propio retiro no ve opciones que no responden: una línea fija dice qué es
          ? `<p class="para-fijo"><span><b>Retiro personal</b> · se descuenta de tus utilidades</span>${tag('Propuesta (Q5)', 'aviso')}</p>`
          : `<div class="seg" role="group" aria-label="Para qué">${[['retiro', 'Retiro personal'], ['pago', 'Pagar a un proveedor'], ['rendir', 'Plata para pagar (por rendir)']].map(([k, t]) => `<button data-acc="para" data-arg="${k}" aria-pressed="${B.para === k}">${t}</button>`).join('')}</div>`}
        ${B.para === 'pago' ? `<label class="campo" for="sacar-prov"><span>¿A quién?</span><select id="sacar-prov">${D.PROVEEDORES.map(p => `<option>${esc(p.nombre)}</option>`).join('')}</select></label>` : ''}
        ${B.para === 'rendir' ? `<div class="campos"><label class="campo" for="sacar-quien"><span>¿Quién se lleva la plata?</span><select id="sacar-quien">${LLEVAN.map(n => `<option${n === B.quien ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
          <label class="campo" for="sacar-para"><span>¿Para pagar qué?</span><input id="sacar-para" value="${esc(B.paraQue)}" placeholder="Por ejemplo: el técnico del aire" autocomplete="off"></label></div>
          <p class="muted">Queda «por rendir» a su nombre hasta que traiga las facturas o el vuelto. Lo ve en su Inicio.</p>` : ''}
        ${B.para === 'retiro' && !soloRetiro ? `<p class="muted">Se anota como anticipo de utilidades y se descuenta en el reparto. ${tag('Propuesta (Q5)', 'aviso')}</p>` : ''}
      </article></div>
      <div class="c6 pila">
      <article class="hoja"><div class="hoja-cab"><h2>Seriales leídos de la foto</h2>${tag('5 de 5', 'ok')}</div>
        <ul class="seriales">${(D.BOVEDA.movs.find(m => m.id === 'b1') || { seriales: [] }).seriales.map(s => `<li><span class="mono">${s}</span><span class="num">$100</span>${tag('Estaba', 'ok')}</li>`).join('')}</ul>
        <p class="muted">Cada serial se busca en la lista de la bóveda. Si uno no estaba, queda «por revisar» y salta la alerta de billete desconocido.</p></article>
      <p class="nota aviso">${ic('info', 's')}<span><b>Por decidir (Q1):</b> ¿los retiros de más de $ 200 los aprueba Alejandro antes? Hoy se registran al instante y se avisa.</span></p>
      <p class="nota info">${ic('campana', 's')}<span>Al registrarlo avisamos al otro socio y a quien custodia.</span></p>
      <button class="btn pri full" data-acc="registrar-retiro">${ic('candado', 's')}${{ retiro: 'Registrar el retiro', pago: 'Registrar el pago', rendir: 'Registrar la salida por rendir' }[B.para]}</button>
      <p class="muted" style="text-align:center">Te pedirá tu código de 6 dígitos.</p>
      <button class="btn ghost" data-acc="boveda-volver">${ic('atras', 's')}Volver a la bóveda</button></div></div>`;
  }
  function bovedaMeter() {
    return `<div class="rejilla" data-form="meter"><div class="c6 pila">
      <article class="hoja"><h2>¿De dónde viene?</h2><div class="seg" role="group" aria-label="Origen"><button aria-pressed="true">Entrada del cierre</button><button aria-pressed="false" data-acc="pronto">Compra de dólares</button><button aria-pressed="false" data-acc="pronto">Otro ingreso</button></div>
        <div class="campos"><label class="campo" for="m-caja"><span>Caja</span><select id="m-caja"><option>Caja 1 · turno noche</option><option>Caja 2 · turno noche</option></select></label><label class="campo" for="m-monto"><span>Monto ($)</span><input id="m-monto" inputmode="decimal" value="1.140"></label></div>
        <p class="muted">En una compra de dólares se anota la tasa negociada y de qué cuenta salieron los bolívares.</p></article>
      <label class="soltar" for="m-foto">${ic('camara')}<span><b>Foto de los billetes</b>Obligatoria. La app lee los seriales.</span></label><input id="m-foto" type="file" accept="image/*" class="sr-only">
      </div><div class="c6 pila"><article class="hoja"><h2>Lo que leyó la foto</h2><dl class="kv"><div><dt>Billetes</dt><dd>${FOTO_ENTRADA.reduce((s, x) => s + x[1], 0)} <small class="tenue">${billetesTxt(FOTO_ENTRADA)}</small></dd></div><div><dt>Total leído</dt><dd>${dinero(sumaBilletes(FOTO_ENTRADA), 'usd', 0)}</dd></div><div><dt>Seriales nuevos</dt><dd>${FOTO_ENTRADA.reduce((s, x) => s + x[1], 0)} de ${FOTO_ENTRADA.reduce((s, x) => s + x[1], 0)} ${tag('Ninguno repetido', 'ok')}</dd></div></dl><p class="muted">Entran estos billetes a la bóveda, uno por uno con su serial.</p></article>
      <button class="btn pri full" data-acc="meter-ok">${ic('candado', 's')}Meter a la bóveda</button><button class="btn ghost" data-acc="boveda-volver">${ic('atras', 's')}Volver</button></div></div>`;
  }
  // conteo a ciegas: las casillas arrancan vacías y «Debería haber» queda oculto hasta que contaron los dos; después se ve la diferencia
  const contado = q => D.BOVEDA.denoms.every(([d]) => Number.isInteger(B.conteo[q][d]));
  function resultadoConteo() {
    const C = B.conteo; const den = D.BOVEDA.denoms;
    const noCoinciden = den.filter(([d]) => C.yo[d] !== C.testigo[d]).map(([d]) => '$' + d);
    const dif = r2(den.reduce((s, [d, n]) => s + d * ((C.yo[d] ?? 0) - n), 0));
    return { noCoinciden, dif, cuadra: !noCoinciden.length && !dif };
  }
  function bovedaContar() {
    const C = B.conteo; const den = D.BOVEDA.denoms; const yo = S.usuario.nombre;
    const testigos = ['Luis Roberto', 'Alejandro', 'Jose'].filter(n => n !== yo);
    if (!testigos.includes(C.tNombre)) C.tNombre = testigos[0];
    const casilla = (q, d) => `<input aria-label="Billetes de $${d} que contó ${esc(q === 'yo' ? yo : C.tNombre)}" data-contar="${d}" data-quien="${q}" value="${C[q][d] ?? ''}" inputmode="numeric" autocomplete="off" style="width:76px;min-height:max(34px,var(--toque));border:1px solid var(--borde-campo);border-radius:8px;padding:0 8px;text-align:right;background:var(--hoja)">`;
    const gris = (icono, t) => `<span class="muted nowrap">${ic(icono, 'xs')} ${t}</span>`;
    const ve = C.paso === 3; const res = ve ? resultadoConteo() : null;
    const filas = den.map(([d, n]) => {
      const a = C.yo[d], b = C.testigo[d];
      const est = !ve ? '' : a !== b ? tag('No coinciden', 'alerta') : a === n ? tag('Cuadra', 'ok') : tag((a - n > 0 ? '+' : '−') + Math.abs(a - n), 'alerta');
      return { celdas: [`<b>$${d}</b>${ve && a !== b ? `<small>Tú ${a} · ${esc(C.tNombre)} ${b}</small>` : ''}`, C.paso === 1 ? casilla('yo', d) : ve ? String(a) : gris('check', 'Guardado'), C.paso === 2 ? casilla('testigo', d) : ve ? String(b) : gris('reloj', 'Después'), ve ? `<span data-esperado>${n}</span>` : gris('candado', 'Oculto'), est] };
    });
    // en el teléfono cada fila es una ficha con una sola cifra: la del paso (tu conteo, el del testigo y al final lo que debería haber)
    const col = p => C.paso === p ? 'r' : 'r x';
    const total = q => den.reduce((s, [d]) => s + d * (C[q][d] ?? 0), 0);
    const pie = ve ? ['Total', dinero(total('yo'), 'usd', 0), dinero(total('testigo'), 'usd', 0), dinero(den.reduce((s, [d, n]) => s + d * n, 0), 'usd', 0), ''] : null;
    const intro = { 1: `Cuenta los billetes de cada denominación y escribe cuántos hay. No ves lo que debería haber ni lo que cuente ${esc(C.tNombre)}: sale cuando hayan contado los dos.`, 2: `Ahora cuenta ${esc(C.tNombre)}, sin ver tus números. Pásale el teléfono o la computadora.`, 3: 'Contaron los dos. Ahora sí se ve lo que debería haber y la diferencia.' }[C.paso];
    const veredicto = !ve ? '' : res.noCoinciden.length ? `<p class="nota aviso">${ic('alerta', 's')}<span>Los dos conteos no coinciden en los billetes de ${res.noCoinciden.join(', ')}. Cuenten esos de nuevo, otra vez a ciegas.</span></p>`
      : res.dif ? `<p class="nota alerta">${ic('alerta', 's')}<span>Los dos contaron lo mismo, pero ${res.dif < 0 ? 'faltan ' + dinero(-res.dif, 'usd', 0) : 'sobran ' + dinero(res.dif, 'usd', 0)}. Al cerrar salta la alerta y queda «por revisar».</span></p>`
      : `<p class="nota ok">${ic('check', 's')}<span>Cuadra: los dos contaron lo mismo que debería haber.</span></p>`;
    const paso = C.paso === 1 ? `<button class="btn pri" data-acc="conteo-yo">${ic('check', 's')}Guardar mi conteo</button>` : C.paso === 2 ? `<button class="btn pri" data-acc="conteo-testigo">${ic('check', 's')}Guardar el conteo de ${esc(C.tNombre)}</button>` : `<button class="btn sec" data-acc="conteo-de-nuevo">${ic('refrescar', 's')}Contar de nuevo</button>`;
    // data-form: un conteo a medias (o ya guardado el primero) no se pierde sin preguntar
    return `<div class="rejilla" data-form="contar"><div class="c7 pila"><article class="hoja"><div class="hoja-cab"><h2>Conteo a ciegas</h2>${tag('Paso ' + C.paso + ' de 3', 'info')}</div><p class="muted">${intro}</p>
      ${A.tabla({ cols: [{ t: 'Billete', cls: 'p' }, { t: 'Contaste tú', cls: col(1) }, { t: 'Contó ' + C.tNombre, cls: col(2) }, { t: 'Debería haber', cls: col(3) }, { t: '', cls: 'e' }], filas, pie })}
      ${C.msg ? `<p class="chequeo aviso" id="conteo-msg">${ic('alerta', 's')}<span>${esc(C.msg)}</span></p>` : ''}${veredicto}
      <div class="filtros">${paso}</div></article></div>
      <div class="c5 pila"><article class="hoja"><h2>Testigo</h2><label class="campo" for="c-testigo"><span>¿Quién cuenta contigo?</span><select id="c-testigo" ${C.paso === 1 ? '' : 'disabled'}>${testigos.map(n => `<option${n === C.tNombre ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label><p class="muted">Cada uno cuenta por su lado y confirma con su propio código. Si falta un billete, salta la alerta y queda «por revisar».</p></article>
      <label class="soltar" for="c-foto">${ic('camara')}<span><b>Foto del conteo</b>Opcional, recomendada.</span></label><input id="c-foto" type="file" accept="image/*" class="sr-only">
      ${(c => `<button class="btn pri full" data-acc="contar-ok" ${c ? '' : 'disabled'}>${ic('candado', 's')}Cerrar el conteo</button>${c ? '' : `<p class="muted" style="text-align:center">${ve ? 'Antes de cerrar, cuenten de nuevo lo que no coincide.' : 'Se cierra cuando hayan contado los dos.'}</p>`}`)(ve && !res.noCoinciden.length)}<button class="btn ghost" data-acc="boveda-volver">${ic('atras', 's')}Volver</button></div></div>`;
  }
  // los 12 billetes que se muestran: los 5 del retiro de Luis ya salieron (estaban desde antes del conteo del jueves); el resto entró con el cierre del viernes
  const BILLETES = ['MB 44591022 A', 'MF 10293847 C', 'PL 55820193 B', 'MB 77120934 D', 'ME 30918275 A', 'PB 11920384 E', 'MG 66012837 A', 'PF 20019384 C', 'MB 90011234 B', 'PL 33019284 A', 'ML 12093847 D', 'MC 55019283 B']
    .map((serial, i) => ({ id: 'bi' + (i + 1), serial, den: i < 9 ? 100 : 50, entro: i < 5 ? 'Ya estaba en el conteo del jue 1 oct' : 'Vie 2 oct · entrada del cierre', movEntro: i < 5 ? 'b4' : 'b2', salio: i < 5 ? 'Sáb 3 oct · retiro de Luis' : '', movSalio: i < 5 ? 'b1' : '' }));
  const billeteDe = serial => BILLETES.find(b => b.serial === serial);
  const minus = t => t.charAt(0).toLowerCase() + t.slice(1);
  function bovedaBilletes() {
    return `${A.filtros('t-bil', null, null, 'Buscar un serial')}${A.tabla({ id: 't-bil', cols: [{ t: 'Serial', cls: 'p' }, { t: 'Billete', cls: 'r plata' }, { t: 'Último movimiento', cls: 'x' }, { t: 'Estado', cls: 'e' }], filas: BILLETES.map(b => ({ abrir: 'billete:' + b.id, txt: b.serial, celdas: [`<span class="mono">${esc(b.serial)}</span>`, '$' + b.den, b.salio ? 'Salió el ' + esc(minus(b.salio)) : 'Entró el ' + esc(minus(b.entro)), b.salio ? tag('Salió', '') : tag('En la bóveda', 'ok')] })) })}
      <p class="muted">Se muestran 12 de ${D.BOVEDA.denoms.reduce((s, x) => s + x[1], 0)}. Cada noche la app verifica que la suma de los billetes sea igual al total. Toca un billete para ver por dónde pasó.</p>
      <button class="btn ghost" data-acc="boveda-volver">${ic('atras', 's')}Volver</button>`;
  }
  // un billete: cuándo entró, si salió y con qué movimiento; un serial mal leído se corrige con motivo mientras el billete sigue en la bóveda
  FICHAS.billete = id => {
    const b = BILLETES.find(x => x.id === id) || BILLETES[0]; const mov = k => D.BOVEDA.movs.find(m => m.id === k);
    const enlaceMov = (k, txt) => mov(k) ? `<button class="enlace" data-abrir="movboveda:${k}">${esc(txt)}</button>` : esc(txt);
    return { titulo: 'Billete ' + b.serial, sub: '$' + b.den + ' · Bóveda', mod: 'boveda', obj: b, registro: 'Billete ' + b.serial, editar: 'Corregir el serial',
      tags: [[b.salio ? 'Salió' : 'En la bóveda', b.salio ? '' : 'ok']],
      bloques: [{ filas: [{ l: 'Serial', v: `<span class="mono">${esc(b.serial)}</span>`, campo: b.salio ? undefined : { k: 'serial', tipo: 'texto' } }, { l: 'Billete', v: '$' + b.den }, { l: 'Entró', v: enlaceMov(b.movEntro, b.entro) }, { l: 'Salió', v: b.salio ? enlaceMov(b.movSalio, b.salio) : 'Sigue en la bóveda' }, { l: 'Cómo se leyó', v: 'De la foto de los billetes' }] },
        { titulo: 'Foto', adjuntos: ['billetes-' + (b.movSalio || b.movEntro) + '.jpg'] },
        { html: `<p class="muted">Cada serial entra una sola vez. Si sale uno que nunca entró, salta la alerta de billete desconocido. ${b.salio ? 'Ya salió: si el serial estaba mal leído, se anota en el movimiento de salida.' : 'Si la foto se leyó mal, se corrige el serial con el motivo y queda en el registro de cambios.'}</p>` }] };
  };
  PANT.boveda = {
    titulo: 'Bóveda', grupo: 'Efectivo', icono: 'boveda', mod: 'boveda', palabras: 'dolares efectivo billetes caja fuerte',
    // no tiene pestañas, pero Sacar, Meter, Contar y los billetes se buscan por su nombre (cada quien, lo que puede hacer)
    secciones: () => [puedeRetirar() ? ['sacar', puede('boveda', 'editar') ? 'Sacar' : 'Registrar mi retiro', 'retiro retirar salida'] : null, puede('boveda', 'editar') ? ['meter', 'Meter', 'entrada cierre compra de dolares'] : null, puede('boveda', 'editar') ? ['contar', 'Contar', 'conteo arqueo'] : null, ['billetes', 'Billetes con su serial', 'serial seriales']],
    cuenta: () => D.BOVEDA.movs.filter(m => m.estado === 'revisar').length,
    // la bóveda no tiene pestañas: Sacar, Meter, Contar y los billetes se abren desde el resumen, y el menú vuelve a él
    transitorias: ['sacar', 'meter', 'contar', 'billetes'],
    // Sacar, Meter y Contar son formularios (data-form): con algo escrito o escogido, salir pregunta antes («¿Salir sin guardar?»)
    // y solo «Salir sin guardar» los deja en blanco · «Retiro registrado» se ve una sola vez: al salir, Sacar vuelve en blanco
    descartar: sub => { if (sub === 'sacar') sacarVacio(); if (sub === 'contar') B.conteo = conteoVacio(B.conteo.tNombre); },
    salirTxt: sub => sub === 'contar' ? (B.conteo.paso === 1 ? 'Tu conteo no está guardado. Si sales, se borra y hay que contar de nuevo.' : 'El conteo no está cerrado. Si sales, se borra lo que contaron y hay que contar de nuevo, los dos.') : '',
    alSalir: sub => { if (sub === 'sacar') sacarVacio(); if (sub === 'contar') B.conteo = conteoVacio(B.conteo.tNombre); },
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
      // el conteo se guarda al escribir, sin volver a dibujar: así se pasa de una casilla a otra con el tabulador
      $$('[data-contar]', raiz).forEach(inp => inp.addEventListener('input', () => {
        const v = inp.value.replace(/\D/g, '').slice(0, 5); if (inp.value !== v) inp.value = v;
        B.conteo[inp.dataset.quien][inp.dataset.contar] = v === '' ? undefined : parseInt(v, 10);
      }));
      const ct = $('#c-testigo', raiz); if (ct) ct.addEventListener('change', () => { B.conteo.tNombre = ct.value; borrador('contar'); A.pintarPagina(); });
      const sq = $('#sacar-quien', raiz); if (sq) sq.addEventListener('change', () => { B.quien = sq.value; });
      const sp = $('#sacar-para', raiz); if (sp) sp.addEventListener('input', () => { B.paraQue = sp.value; });
    },
  };
  ACC['ocultar-boveda'] = () => { B.oculto = !B.oculto; A.pintarPagina(); };
  ACC['desglose-boveda'] = () => { B.desglose = !B.desglose; A.pintarPagina(); };
  // escoger algo con un botón (no con una casilla) también cuenta como empezar a llenar el formulario
  const borrador = form => { S.borrador = { ruta: 'boveda', sub: S.sub.boveda, form }; };
  ACC.para = k => { B.para = k; borrador('sacar'); A.pintarPagina(); };
  // «Volver a la bóveda» pregunta antes si hay algo escrito, igual que «Volver» en la reserva y en el préstamo
  ACC['boveda-volver'] = () => A.antesDeSalir(() => { S.sub.boveda = 'resumen'; A.pintarPagina(); }); // al salir de Sacar o Contar, alSalir los deja en blanco
  ACC['conteo-yo'] = () => {
    if (!contado('yo')) { B.conteo.msg = 'Falta escribir cuántos billetes hay de cada uno. Si no hay, pon 0.'; A.pintarPagina(); return; }
    B.conteo.msg = ''; B.conteo.paso = 2; borrador('contar'); A.pintarPagina(); enfocar('[data-quien="testigo"]'); A.aviso('Guardado. Ahora cuenta ' + B.conteo.tNombre + ', sin ver tus números.', 'info');
  };
  // el teclado sigue el conteo: a la primera casilla de quien cuenta ahora, o al botón para cerrar cuando contaron los dos
  const enfocar = sel => { const el = $('#main ' + sel + ':not([disabled])'); if (el) el.focus({ preventScroll: true }); };
  ACC['conteo-testigo'] = () => {
    if (!contado('testigo')) { B.conteo.msg = 'Falta escribir cuántos billetes contó ' + B.conteo.tNombre + ' de cada uno. Si no hay, pon 0.'; A.pintarPagina(); return; }
    B.conteo.msg = ''; B.conteo.paso = 3; A.pintarPagina(); enfocar('[data-acc="contar-ok"]'); if (!$('#main').contains(document.activeElement)) enfocar('[data-acc="conteo-de-nuevo"]');
  };
  // contar de nuevo deja las casillas en blanco: ya no hay nada escrito que perder
  ACC['conteo-de-nuevo'] = () => { B.conteo = conteoVacio(B.conteo.tNombre); S.borrador = null; A.pintarPagina(); enfocar('[data-quien="yo"]'); A.aviso('Conteo nuevo: los dos cuentan otra vez, a ciegas.', 'info'); };
  ACC['registrar-retiro'] = () => {
    const n = leerNum(B.monto || '500') || 0; const para = B.para; const quien = para === 'rendir' ? B.quien : S.usuario.nombre;
    // salen los billetes de la foto: el monto tiene que ser el que leyó, y la bóveda tiene que tenerlos
    const foto = sumaBilletes(FOTO_RETIRO);
    if (Math.abs(n - foto) > 0.005) { A.aviso('La foto muestra ' + dinero(foto, 'usd', 0) + ': corrige el monto o repite la foto antes de registrar.', 'info'); return; }
    if (!hayBilletes(FOTO_RETIRO)) { A.aviso('La bóveda no tiene esos billetes: revisa la foto o haz un conteo.', 'info'); return; }
    A.pedirCodigo({ que: { retiro: 'Retiro de ' + esc(quien), pago: 'Pago a un proveedor', rendir: 'Plata por rendir a nombre de ' + esc(quien) }[para] + ' · ' + dinero(n, 'usd', 0) + ' · sale de ' + A.cta('Bóveda'), det: billetesTxt(FOTO_RETIRO) + (para === 'rendir' && B.paraQue.trim() ? ' · para ' + esc(B.paraQue.trim()) : ''), boton: { retiro: 'Registrar el retiro', pago: 'Registrar el pago', rendir: 'Registrar la salida' }[para] + ' de ' + dinero(n, 'usd', 0) }).then(() => {
      moverBilletes(FOTO_RETIRO, -1); D.BOVEDA.movs.unshift({ id: 'b' + Date.now(), tipo: 'salida', titulo: (para === 'retiro' ? 'Retiro de ' : para === 'pago' ? 'Pago a proveedor · ' : 'Por rendir · ') + quien, sub: 'Hoy ' + D.HOY.hora + ' · ' + (para === 'rendir' ? S.usuario.nombre + ', desde la app' : 'desde la app') + ' · ' + billetesTxt(FOTO_RETIRO), monto: -n, estado: 'ok', via: 'App con código', aNombre: quien + (quien !== S.usuario.nombre ? ' (la registró ' + S.usuario.nombre + ')' : ''), seriales: [] });
      // la plata por rendir queda a nombre de quien se la lleva, hasta que traiga las facturas o el vuelto
      if (para === 'rendir') { const u = D.USUARIOS.find(x => x.nombre === quien); D.POR_RENDIR.unshift({ id: 'ren' + Date.now(), quien, usuario: u ? u.id : '', fecha: 'Hoy', dias: 0, de: 'Bóveda', via: 'App con código (la registró ' + S.usuario.nombre + ')', para: B.paraQue.trim() || 'Pagar algo (lo dirá al rendir)', monto: n, facturas: [], vuelto: 0, estado: 'abierta' }); B.paraQue = ''; }
      A.auditar({ modulo: 'Bóveda', registro: 'Salida de ' + dinero(n, 'usd', 0), campo: 'creado', despues: dinero(n, 'usd', 0), motivo: { retiro: 'Retiro personal', pago: 'Pago a proveedor', rendir: 'Plata por rendir, a nombre de ' + quien }[para] });
      B.hecho = para; A.pintarPagina();
    }).catch(() => {});
  };
  ACC['meter-ok'] = () => {
    const n = sumaBilletes(FOTO_ENTRADA);
    A.pedirCodigo({ que: 'Entrada del cierre · ' + dinero(n, 'usd', 0) + ' · entra a ' + A.cta('Bóveda'), det: billetesTxt(FOTO_ENTRADA), boton: 'Meter ' + dinero(n, 'usd', 0) }).then(() => {
      moverBilletes(FOTO_ENTRADA, 1);
      D.BOVEDA.movs.unshift({ id: 'b' + Date.now(), tipo: 'entrada', titulo: 'Entrada del cierre', sub: 'Hoy ' + D.HOY.hora + ' · ' + S.usuario.nombre + ' · ' + billetesTxt(FOTO_ENTRADA), monto: n, estado: 'ok', via: 'App con código', aNombre: S.usuario.nombre, seriales: [] });
      A.auditar({ modulo: 'Bóveda', registro: 'Entrada del cierre', campo: 'creado', despues: dinero(n, 'usd', 0) + ' · ' + billetesTxt(FOTO_ENTRADA) });
      S.sub.boveda = 'resumen'; A.pintarPagina(); A.aviso('Entraron ' + dinero(n, 'usd', 0) + ' a la bóveda.');
    }).catch(() => {});
  };
  // al cerrar el conteo queda un movimiento de conteo («por revisar» si no cuadró, con la diferencia) y cambia el «Último conteo»
  ACC['contar-ok'] = () => {
    if (B.conteo.paso !== 3) { A.aviso('Primero cuentan los dos, cada uno sin ver lo del otro.', 'info'); return; }
    const t = B.conteo.tNombre; const res = resultadoConteo();
    if (res.noCoinciden.length) { A.aviso('Los dos conteos no coinciden: cuenten de nuevo antes de cerrar.', 'info'); return; }
    const dif = res.dif < 0 ? 'Faltan ' + dinero(-res.dif, 'usd', 0) : res.dif > 0 ? 'Sobran ' + dinero(res.dif, 'usd', 0) : '';
    A.pedirCodigo({ que: 'Conteo de la bóveda con ' + esc(t) + ' · ' + (res.cuadra ? 'cuadró' : esc(dif.toLowerCase())), det: 'Después confirma ' + esc(t) + ' con su código.' + (res.cuadra ? '' : ' Queda por revisar.'), boton: 'Cerrar el conteo' }).then(() => {
      D.BOVEDA.movs.unshift({ id: 'b' + Date.now(), tipo: 'conteo', titulo: 'Conteo a ciegas con ' + t, sub: 'Hoy ' + D.HOY.hora + ' · ' + S.usuario.nombre + ' y ' + t, monto: 0, estado: res.cuadra ? 'ok' : 'revisar', via: 'App con código', aNombre: S.usuario.nombre + ', con ' + t + ' de testigo', nota: res.cuadra ? 'Cuadró' : dif + ' contra lo que debería haber', seriales: [] });
      D.BOVEDA.conteo = 'Hoy, a ciegas con ' + t + '. ' + (res.cuadra ? 'Cuadró.' : dif + ': quedó por revisar.');
      A.auditar({ modulo: 'Bóveda', registro: 'Conteo a ciegas con ' + t, campo: 'creado', despues: res.cuadra ? 'cuadró' : 'no cuadró (' + dif.toLowerCase() + '): queda por revisar' });
      B.conteo = conteoVacio(t); S.sub.boveda = 'resumen'; A.pintarPagina(); A.aviso(res.cuadra ? 'Conteo cerrado: cuadró. Falta el código de ' + t + '. (Simulado)' : 'Conteo cerrado: ' + dif.toLowerCase() + '. Quedó por revisar y le avisamos a Alejandro. (Simulado)');
    }).catch(() => {});
  };
  FICHAS.movboveda = id => {
    const m = D.BOVEDA.movs.find(x => x.id === id);
    const aviso = m.estado !== 'revisar' ? '' : m.tipo === 'conteo' ? `<p class="nota aviso">${ic('alerta', 's')}<span>El conteo a ciegas no cuadró: ${esc((m.nota || '').toLowerCase())}. Revisen los movimientos desde el último conteo y, si hace falta, cuenten de nuevo.</span></p>`
      : `<p class="nota aviso">${ic('alerta', 's')}<span>Un serial no se pudo leer en la foto${m.sinDosfa ? ', así que el bot no lo dio por bueno' : ''}. Márcalo a mano, corrige el total o pide otra foto.</span></p>`;
    return { titulo: m.titulo, sub: esc(m.sub), mod: 'boveda', obj: m, registro: m.titulo, tags: [[m.estado === 'ok' ? (m.tipo === 'conteo' ? 'Cuadró' : 'Registrado') : m.tipo === 'conteo' ? 'No cuadró' : 'Por revisar', m.estado === 'ok' ? 'ok' : 'aviso']].concat(m.sinDosfa ? [['Sin doble factor', 'aviso']] : []).concat(m.ejemplo ? [['Ejemplo', '']] : []), anulable: true,
      aviso: (m.ejemplo ? `<p class="nota info">${ic('info', 's')}<span>Es un ejemplo: así llegará lo que se mande por el grupo de bóveda cuando exista (está por crear).</span></p>` : '') + aviso,
      // lo que llega por el grupo de bóveda queda a nombre de quien mandó la foto, sin doble factor (3 oct)
      bloques: [{ filas: [{ l: 'Monto', v: m.monto ? dinero(Math.abs(m.monto), 'usd', 0) : '—' }, { l: 'Cómo llegó', v: esc(m.via) }, { l: 'A nombre de', v: esc(m.aNombre || '—') + (m.sinDosfa ? ' <small class="tenue">mandó la foto al grupo; lo registró el bot</small>' : '') }, { l: 'Doble factor', v: m.sinDosfa ? tag('Sin doble factor', 'aviso') + ' <small class="tenue">llegó con foto y leyenda, sin código</small>' : 'Con código' }, { l: 'Nota', v: esc(m.nota || '—'), campo: { k: 'nota', tipo: 'texto' } }] },
        m.seriales.length ? { titulo: 'Seriales', html: `<ul class="seriales">${m.seriales.map(s => { const b = billeteDe(s); return `<li>${b ? `<button class="enlace mono" data-abrir="billete:${b.id}">${esc(s)}</button>` : `<span class="mono">${esc(s)}</span>`}<span>$100</span>${tag('Estaba', 'ok')}</li>`; }).join('')}</ul>` } : { oculto: true },
        { titulo: 'Foto', adjuntos: ['billetes-' + m.id + '.jpg'] }],
      acciones: m.estado === 'revisar' ? [{ txt: 'Marcar resuelto', acc: 'mov-ok', arg: m.id, icono: 'check', tono: 'pri', solo: 'editar' }] : [] };
  };
  ACC['mov-ok'] = id => { const m = D.BOVEDA.movs.find(x => x.id === id); A.pedirCodigo({ que: 'Marcar resuelto: ' + esc(m.titulo) + (m.monto ? ' · ' + dinero(Math.abs(m.monto), 'usd', 0) : ''), det: esc(m.nota || m.sub), boton: 'Marcar resuelto' }).then(() => { m.estado = 'ok'; A.auditar({ modulo: 'Bóveda', registro: m.titulo, campo: 'estado', antes: 'por revisar', despues: 'resuelto' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Marcado resuelto.'); }).catch(() => {}); };

  /* =============== CAJA CHICA Y SOCIOS =============== */
  // plata por rendir: se cierra con las facturas o con el vuelto, que registran Jose o Alejandro a nombre de quien rinde
  const R = () => D.POR_RENDIR;
  const traido = x => r2(x.facturas.reduce((s, f) => s + f.monto, 0) + x.vuelto);
  const faltaDe = x => r2(x.monto - traido(x));
  const recalcRendir = x => { x.estado = faltaDe(x) > 0.005 ? 'abierta' : 'rendida'; };
  const registraRendir = () => ['dueno', 'contabilidad'].includes(S.usuario.rol);
  const estadoRendir = x => x.estado === 'rendida' ? tag('Rendida', 'ok') : tag(x.dias ? x.dias + (x.dias === 1 ? ' día' : ' días') + ' sin rendir' : 'Desde hoy', 'aviso');
  A.porRendirDe = nombre => r2(R().filter(x => x.quien === nombre && x.estado === 'abierta').reduce((s, x) => s + faltaDe(x), 0));
  // cada quien ve lo suyo en su Inicio (Manuel no entra a Caja chica)
  A.tarjetaRendir = usuario => {
    const mias = R().filter(x => x.usuario === usuario && x.estado === 'abierta'); if (!mias.length) return '';
    const tot = r2(mias.reduce((s, x) => s + faltaDe(x), 0));
    return `<article class="hoja"><div class="hoja-cab"><h2>${ic('cajachica')}Tu plata por rendir</h2>${tag('Falta ' + dinero(tot), 'aviso')}</div>
      <ul class="lista">${mias.map(x => `<li><button class="fila" data-abrir="rendir:${x.id}"><span class="lead aviso">${ic('reloj')}</span><span class="medio"><b>${esc(x.para)}</b><small>Te llevaste ${dinero(x.monto)} · ${esc(x.fecha.toLowerCase())} · trajiste ${dinero(traido(x))}</small></span><span class="fin"><span class="monto">${dinero(faltaDe(x))}</span>${ic('derecha', 's chev')}</span></button></li>`).join('')}</ul>
      <p class="muted">Tráele a Jose las facturas o el vuelto: él lo registra a tu nombre.</p></article>`;
  };
  PANT.cajachica = {
    titulo: 'Caja chica y socios', corto: 'Caja chica y socios', grupo: 'Efectivo', icono: 'cajachica', mod: 'cajachica', camino: 'Caja chica',
    // el mismo nombre en la pestaña y en el buscador («Caja chica › Gastos»)
    secciones: [['chica', 'Gastos', 'gasto fondo reposicion soporte'], ['socios', 'Retiros de socios', 'retiro retiros anticipo utilidades'], ['consumo', 'Consumo de socios', 'comida tope'], ['rendir', 'Por rendir', 'vuelto facturas']],
    render: (sub = 'chica') => {
      const C = D.CAJACHICA; let cuerpo = '';
      if (sub === 'chica') cuerpo = `<div class="cifras">${A.cifra({ etq: 'Saldo de caja chica', valor: dinero(C.saldo), sub: 'de un fondo de ' + dinero(C.fondo, 'usd', 0) + ' ' + tag('Propuesta (Q3)', 'aviso'), tono: C.saldo < 60 ? 'aviso' : '', abrir: 'cajachica:fondo' })}${A.cifra({ etq: 'Gastado esta semana', valor: dinero(C.fondo - C.saldo), sub: C.gastos.length + ' gastos', abrir: 'cajachica:semana' })}${A.cifra({ etq: 'Sin foto del soporte', valor: C.gastos.filter(g => !g.soporte).length, sub: 'hay que justificarlo', tono: 'aviso', abrir: 'cajachica:sinfoto' })}${A.cifra({ etq: 'Próxima reposición', valor: 'Lunes 12', sub: 'se repone ' + C.reposicion, abrir: 'cajachica:fondo' })}</div>
        ${A.tabla({ cols: [{ t: 'Gasto', cls: 'p' }, { t: 'Quién', cls: 'x' }, { t: 'Monto', cls: 'r plata' }, { t: 'Soporte', cls: 'e' }], filas: C.gastos.map(g => ({ abrir: 'gasto:' + g.id, clase: g.anulada ? 'anulada' : '', celdas: [`<b>${esc(g.que)}</b><small>${esc(g.fecha)}</small>`, esc(g.quien), dinero(g.monto), g.soporte ? tag('Con foto', 'ok') : tag('Falta la foto', 'aviso')] })) })}`;
      // la parte de cada socio (Q4) y que los retiros sean anticipos de utilidades (Q5) siguen sin respuesta: se muestran como lo que son
      if (sub === 'socios') cuerpo = `<p class="nota aviso">${ic('info', 's')}<span><b>Propuesta (Q5):</b> cada retiro de un socio es un anticipo de utilidades y se descuenta en el reparto del trimestre, según la parte de cada uno. Esa parte también está por confirmar (Q4).</span></p>
        <div class="rejilla">${D.SOCIOS.map(s => { const pr = A.porRendirDe(s.nombre); const ap = A.aportesDe(s.nombre); const apTot = r2(ap.reduce((x, i) => x + i.monto, 0)); return `<div class="c6"><article class="hoja"><div class="hoja-cab"><h2>${ic('usuario')}${esc(s.nombre)}</h2></div><dl class="kv"><div><dt>Su parte</dt><dd>${tag('Por confirmar (Q4)', 'aviso')}</dd></div><div><dt>Retirado este trimestre</dt><dd>${dinero(s.retirado, 'usd', 0)}</dd></div><div><dt>Por rendir <small class="tenue">no es un retiro</small></dt><dd>${dinero(pr, 'usd', 0)}</dd></div><div><dt>Aportes y préstamos <small class="tenue">el negocio le debe</small></dt><dd>${dinero(apTot)}${ap.length ? ` <small class="tenue">${ap.length} ${ap.length === 1 ? 'movimiento' : 'movimientos'}</small>` : ''}</dd></div></dl><div class="filtros">${pr ? `<button class="enlace" data-sub="rendir">Ver lo que falta rendir ${ic('derecha', 's')}</button>` : ''}<button class="enlace" data-abrir="aportes:${esc(s.id)}">Ver sus aportes y préstamos ${ic('derecha', 's')}</button></div></article></div>`; }).join('')}</div>
        <div class="sec"><h2>Retiros</h2></div>${A.tabla({ cols: [{ t: 'Retiro', cls: 'p' }, { t: 'De dónde', cls: 'x' }, { t: 'Cómo', cls: 'x' }, { t: 'Monto', cls: 'r plata' }], filas: D.RETIROS.map(r => ({ abrir: 'retiro:' + r.id, celdas: [`<b>${esc(r.socio)}</b><small>${esc(r.fecha)} · ${esc(r.para)}</small>`, esc(r.de), esc(r.via), dinero(r.monto, 'usd', 0)] })) })}
        <p class="muted">La plata que un socio se lleva para pagar algo no es un retiro: va aparte, en «Por rendir», hasta que traiga las facturas o el vuelto.</p>`;
      if (sub === 'consumo') cuerpo = consumoSocios();
      if (sub === 'rendir') {
        // cada plata abierta con sus dos formas de cerrarla; las rendidas quedan abajo, para consultar
        const abiertas = R().filter(x => x.estado === 'abierta'), rendidas = R().filter(x => x.estado === 'rendida');
        cuerpo = `<p class="nota info">${ic('info', 's')}<span>Plata que alguien se lleva para pagar algo. Queda pendiente hasta que traiga las facturas o el vuelto. Los registran Jose o Alejandro, a nombre de quien rinde.</span></p>
        ${abiertas.length ? `<div class="rejilla">${abiertas.map(x => `<div class="c6"><article class="hoja"><div class="hoja-cab"><h2>${ic('usuario')}${esc(x.quien)}</h2>${estadoRendir(x)}</div>
          <p class="muted">${esc(x.fecha)} · desde la ${esc(x.de.toLowerCase())} · ${esc(x.para)}</p>
          <dl class="kv"><div><dt>Se llevó</dt><dd>${dinero(x.monto)}</dd></div><div><dt>Trajo en facturas y vuelto</dt><dd>${dinero(traido(x))}</dd></div><div class="total"><dt>Falta justificar</dt><dd>${dinero(faltaDe(x))}</dd></div></dl>
          <div class="filtros">${registraRendir() ? `<button class="btn pri chico" data-acc="rendir-factura" data-arg="${x.id}">${ic('subir', 's')}Subir factura</button><button class="btn sec chico" data-acc="rendir-vuelto" data-arg="${x.id}">${ic('candado', 's')}Devolver el vuelto</button>` : ''}<button class="enlace" data-abrir="rendir:${x.id}">Ver el detalle ${ic('derecha', 's')}</button></div></article></div>`).join('')}</div>`
          : `<p class="nota ok">${ic('check', 's')}<span>Nadie tiene plata por rendir.</span></p>`}
        ${rendidas.length ? `<div class="sec"><h2>Rendidas</h2></div>${A.tabla({ cols: [{ t: 'Quién', cls: 'p' }, { t: 'Para qué', cls: 'x' }, { t: 'Se llevó', cls: 'r plata' }, { t: 'Estado', cls: 'e' }], filas: rendidas.map(x => ({ abrir: 'rendir:' + x.id, celdas: [`<b>${esc(x.quien)}</b><small>${esc(x.fecha)} · desde la ${esc(x.de.toLowerCase())}</small>`, esc(x.para), dinero(x.monto), estadoRendir(x)] })) })}` : ''}`;
      }
      return `<div class="pagina">${A.cab('Efectivo', 'Caja chica y socios', 'Los gastos chicos del día, los retiros y el consumo de los socios, y la plata que alguien se llevó para pagar algo.', A.boton('cajachica', 'Gastar de caja chica', 'data-acc="gasto-nuevo"', { icono: 'mas' }))}
        ${A.lectura('cajachica')}${A.subnav([['chica', 'Gastos'], ['socios', 'Retiros de socios'], ['consumo', 'Consumo de socios'], ['rendir', 'Por rendir', R().filter(x => x.estado === 'abierta').length]], sub)}${cuerpo}</div>`;
    },
  };
  /* ---------- aportes y préstamos de los socios ---------- */
  // lo que un socio puso de su bolsillo y el negocio le debe: las líneas del lunes y de la nómina marcadas «Aporte o préstamo de un socio»
  // con su nombre, y lo que en la conciliación se aclaró así · el nombre de quien cobró en la nómina solo lo ven quienes ven sueldos
  A.aportesDe = nombre => {
    const out = [];
    D.LUNES.forEach((r, i) => { if (r.c === 'APORTE' && r.socio === nombre) out.push({ t: 'Pago a ' + A.provNombre(r.p), s: 'Pagos del lunes 5 oct', monto: r.cap ?? r.m, abrir: 'lineapago:' + i }); });
    D.PAGO_NOMINA.lineas.forEach((l, i) => { if (l.c === 'APORTE' && l.socio === nombre) { const e = D.EMPLEADOS.find(x => x.id === l.e); out.push({ t: puede('nomina', 'sueldos') ? 'Nómina de ' + e.nombre : 'Un pago de la nómina', s: 'Nómina del ' + D.PAGO_NOMINA.corto, monto: A.lineaNomina(e).neto, abrir: 'pagonom:' + i }); } });
    D.DIFERENCIAS.forEach(d => { if (d.tipoSocio === 'aporte' && d.socio === nombre) out.push({ t: d.desc, s: 'Banco ' + d.cuenta + ' · ' + d.fecha, monto: d.monto, abrir: 'diferencia:' + d.id }); });
    return out;
  };
  FICHAS.aportes = id => {
    const s = D.SOCIOS.find(x => x.id === id) || D.SOCIOS[0]; const ap = A.aportesDe(s.nombre); const tot = r2(ap.reduce((x, i) => x + i.monto, 0));
    return { titulo: 'Aportes y préstamos de ' + s.nombre, sub: 'Caja chica y socios · el negocio le debe', mod: 'cajachica', tags: [[tot ? 'Le debemos ' + dinero(tot) : 'No le debemos nada', tot ? 'info' : '']],
      bloques: [ap.length ? { html: `<ul class="lista">${ap.map(x => `<li><button class="fila" data-abrir="${x.abrir}"><span class="lead">${ic('usuario')}</span><span class="medio"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span><span class="monto">${dinero(x.monto)}</span></button></li>`).join('')}</ul><dl class="kv"><div class="total"><dt><b>El negocio le debe</b></dt><dd>${dinero(tot)}</dd></div></dl>` } : { html: '<p class="muted">Todavía nada.</p>' },
        { html: '<p class="muted">Sale de las líneas del lunes y de la nómina marcadas «Aporte o préstamo de un socio» con su nombre, y de lo que en la conciliación del banco se aclaró así. Cuando el negocio se lo devuelva, baja de aquí. No es un retiro ni plata por rendir.</p>' }] };
  };
  /* ---------- caja chica: el fondo, lo gastado y lo que falta justificar ---------- */
  FICHAS.cajachica = k => {
    const C = D.CAJACHICA; const gasto = g => `<li><button class="fila" data-abrir="gasto:${g.id}"><span class="lead ${g.soporte ? '' : 'aviso'}">${ic(g.soporte ? 'imagen' : 'camara')}</span><span class="medio"><b>${esc(g.que)}</b><small>${esc(g.fecha)} · ${esc(g.quien)}${g.soporte ? '' : ' · falta la foto'}</small></span><span class="monto">${dinero(g.monto)}</span></button></li>`;
    if (k === 'semana' || k === 'sinfoto') {
      const gs = k === 'semana' ? C.gastos : C.gastos.filter(g => !g.soporte);
      return { titulo: k === 'semana' ? 'Gastado esta semana' : 'Gastos sin foto del soporte', sub: 'Caja chica', mod: 'cajachica', tags: [[gs.length + (gs.length === 1 ? ' gasto' : ' gastos'), k === 'sinfoto' && gs.length ? 'aviso' : '']],
        bloques: [gs.length ? { html: `<ul class="lista">${gs.map(gasto).join('')}</ul>` } : { html: '<p class="muted">Ninguno.</p>' },
          k === 'semana' ? { html: `<dl class="kv"><div class="total"><dt><b>Total</b></dt><dd>${dinero(r2(gs.reduce((s, g) => s + g.monto, 0)))}</dd></div></dl><p class="muted">Es lo que falta del fondo de ${dinero(C.fondo, 'usd', 0)}: queda ${dinero(C.saldo)}.</p>` } : { html: '<p class="muted">Sin la foto del soporte el gasto queda por justificar. Se sube desde el gasto.</p>' }] };
    }
    return { titulo: 'Caja chica', sub: 'Efectivo · la custodia Jose', mod: 'cajachica', tags: [['Propuesta (Q3)', 'aviso']],
      bloques: [{ filas: [{ l: 'Fondo', v: dinero(C.fondo, 'usd', 0) + ' <small class="tenue">propuesta (Q3)</small>' }, { l: 'Saldo', v: dinero(C.saldo) }, { l: 'Gastado esta semana', v: `${dinero(r2(C.fondo - C.saldo))} <small class="tenue">${C.gastos.length} gastos</small>` }, { l: 'Se repone', v: 'Cada lunes · la próxima, el lunes 12' }, { l: 'Lo custodia', v: 'Jose' }] },
        { html: `<p class="muted">Se repone lo gastado, contra las fotos de los soportes, para volver a ${dinero(C.fondo, 'usd', 0)}. Un gasto de más de $ 40 lo aprueba Alejandro.</p>` }] };
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
  // la fecha de un consumo como número («Dom 4 oct · 14:20»): para ordenarlos del más nuevo al más viejo
  const claveFecha = f => { const m = /(\d{1,2}) (\w{3})\D+(\d{1,2}):(\d{2})/.exec(f || '') || []; return (((D.MESES.indexOf(m[2]) * 31 + +m[1]) * 24 + +m[3]) * 60 + +m[4]) || 0; };
  function consumoSocios() {
    const C2 = CS();
    // la tarjeta de quien mira va primero (Luis ve primero la suya) y los consumos van del más nuevo al más viejo
    const socios = [...C2.socios].sort((a, b) => (b.usuario === S.usuario.id) - (a.usuario === S.usuario.id));
    const lista = [...C2.lista].sort((a, b) => claveFecha(b.fecha) - claveFecha(a.fecha));
    return `<p class="nota info">${ic('info', 's')}<span>Lo que comen y beben los socios en el restaurante. La cajera cierra el pedido en el POS con el método «Consumo socio» y llega con la copia de Odoo. Tope: <b>${dinero(C2.tope, 'usd', 0)} al mes por socio, a precio de carta</b> ${tag('Por confirmar', 'aviso')}</span></p>
      <div class="rejilla">${socios.map(x => `<div class="c6">${A.tarjetaConsumo(x.socio)}</div>`).join('')}</div>
      <div class="sec"><h2>Consumos de octubre</h2><span class="muted">${esc(C2.cierre)} · todo cuenta para el tope, menos las invitaciones del negocio</span></div>
      ${A.tabla({ cols: [{ t: 'Consumo', cls: 'p' }, { t: 'Socio', cls: 'x' }, { t: 'A precio de carta', cls: 'r plata' }, { t: 'A costo', cls: 'r x plata' }, { t: '', sr: 'Para el tope', cls: 'e' }], filas: lista.map(c => ({ abrir: 'consumosocio:' + c.id, celdas: [`<b>${esc(c.que)}</b><small><span class="en-tel">${esc(c.socio)} · </span>${esc(minus(c.fecha))} · pedido ${esc(c.pedido)}</small>`, esc(c.socio), dinero(c.carta), dinero(c.costo), c.tipo === 'personal' ? '' : tag('Invitación: no cuenta', '')] })) })}
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
    // el monto de un gasto registrado no se edita: si está mal, se anula y se registra otro
    return { titulo: g.que, sub: 'Caja chica · ' + esc(g.fecha), mod: 'cajachica', obj: g, registro: 'Gasto ' + g.que, anulable: !g.anulada, tags: [[g.soporte ? 'Con foto' : 'Falta la foto', g.soporte ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'Qué', v: esc(g.que), campo: { k: 'que', tipo: 'texto' } }, { l: 'Monto ($)', v: dinero(g.monto) }, { l: 'Quién lo gastó', v: esc(g.quien) }] }, g.soporte ? { titulo: 'Soporte', adjuntos: ['soporte-' + g.id + '.jpg'] } : !puede('cajachica', 'editar') ? { oculto: true } : { html: `<label class="soltar" for="sop-${g.id}">${ic('camara')}<span><b>Subir la foto del soporte</b>Sin foto el gasto queda por justificar.</span></label><input id="sop-${g.id}" type="file" accept="image/*" class="sr-only">` },
        { html: `<p class="muted">${g.anulada ? 'Este gasto está anulado. Si el gasto sí ocurrió, se registra otro con el monto bien.' : 'El monto no se edita. Si está mal, se anula este gasto y se registra otro.'}</p>` }],
      bloqueada: !!g.anulada, bloqueo: 'Está anulado: no se edita. Si el gasto sí ocurrió, se registra otro.',
      acciones: g.anulada ? [{ txt: 'Registrar otro gasto', acc: 'gasto-nuevo', icono: 'mas', tono: 'pri', solo: 'editar' }] : [] };
  };
  ACC['gasto-nuevo'] = () => A.aviso('Gasto nuevo: monto, qué, foto obligatoria. Más de $ 40 lo aprueba Alejandro. (Simulado)', 'info');
  FICHAS.retiro = id => {
    const r = D.RETIROS.find(x => x.id === id);
    return { titulo: 'Retiro de ' + r.socio, sub: esc(r.fecha), mod: 'cajachica', obj: r, tags: [['Propuesta (Q5): anticipo de utilidades', 'aviso']],
      bloques: [{ filas: [{ l: 'Monto', v: dinero(r.monto, 'usd', 0) }, { l: 'De dónde', v: esc(r.de) }, { l: 'Para qué', v: esc(r.para) }, { l: 'Cómo se registró', v: esc(r.via) }, { l: 'Avisado a', v: r.socio === 'Alejandro' ? 'Luis Roberto y Jose' : 'Alejandro y Jose' }] },
        r.de === 'Bóveda' ? { titulo: 'Foto de los billetes', adjuntos: ['retiro-' + r.id + '.jpg'] } : { html: '<p class="muted">Sale del cierre del consumo del mes: no lleva foto de billetes.</p>' }] };
  };
  FICHAS.rendir = id => {
    const x = R().find(z => z.id === id); const f = faltaDe(x); const mio = S.usuario.id === x.usuario;
    // una factura sin foto queda marcada «Falta la foto», como los gastos de caja chica, y se sube después desde aquí
    const lista = x.facturas.map((fa, i) => `<li><div class="fila"><span class="lead ${fa.foto ? '' : 'aviso'}">${ic(fa.foto ? 'archivo' : 'camara')}</span><span class="medio"><b>${esc(fa.que)}</b><small>${esc(fa.fecha)} · la registró ${esc(fa.quien)} a nombre de ${esc(x.quien)}${fa.foto ? '' : ' · ' + tag('Falta la foto', 'aviso')}</small>${!fa.foto && registraRendir() ? `<button class="btn sec chico" data-acc="ren-foto" data-arg="${x.id}|${i}" style="margin-top:6px">${ic('camara', 's')}Subir la foto</button>` : ''}</span><span class="monto">${dinero(fa.monto)}</span></div></li>`)
      .concat(x.vuelto ? [`<li><div class="fila"><span class="lead ok">${ic('boveda')}</span><span class="medio"><b>Vuelto</b><small>Volvió a la bóveda, con la foto de los billetes</small></span><span class="monto">${dinero(x.vuelto)}</span></div></li>`] : []);
    const fotos = x.facturas.map((fa, i) => fa.foto ? (typeof fa.foto === 'string' ? fa.foto : 'factura-' + x.id + '-' + (i + 1) + '.jpg') : '').filter(Boolean);
    const quienRegistra = registraRendir() ? `<p class="muted">Lo que registres queda a nombre de ${esc(x.quien)}, con tu nombre en el registro de cambios. El vuelto vuelve a la bóveda con la foto de los billetes y pide tu código; si trae menos de lo que falta, el resto sigue por rendir.</p>`
      : `<p class="nota gris">${ic('candado', 's')}<span>${mio ? 'Tráele a Jose las facturas o el vuelto: él lo registra a tu nombre.' : 'Las facturas y el vuelto los registran Jose o Alejandro, a nombre de ' + esc(x.quien) + '.'}</span></p>`;
    return { titulo: 'Por rendir · ' + x.quien, sub: esc(x.fecha) + ' · desde la ' + esc(x.de.toLowerCase()), mod: 'cajachica', obj: x, registro: 'Por rendir · ' + x.quien,
      tags: [[x.estado === 'rendida' ? 'Rendida' : x.dias ? x.dias + (x.dias === 1 ? ' día' : ' días') + ' sin rendir' : 'Desde hoy', x.estado === 'rendida' ? 'ok' : 'aviso']],
      bloques: [{ filas: [{ l: 'Se la llevó', v: esc(x.quien) }, { l: 'Para qué', v: esc(x.para), largo: true }, { l: 'Cómo salió', v: esc(x.via) }] },
        { titulo: 'Lo que trajo', html: lista.length ? `<ul class="lista">${lista.join('')}</ul>` : '<p class="muted">Todavía nada.</p>' },
        fotos.length ? { titulo: 'Fotos de las facturas', adjuntos: fotos } : { oculto: true },
        { titulo: 'Cuadre', html: `<dl class="kv"><div><dt>Se llevó</dt><dd>${dinero(x.monto)}</dd></div><div><dt>Facturas (${x.facturas.length})</dt><dd>− ${dinero(r2(x.facturas.reduce((s, fa) => s + fa.monto, 0)))}</dd></div><div><dt>Vuelto</dt><dd>− ${dinero(x.vuelto)}</dd></div><div class="total"><dt>Falta justificar</dt><dd>${dinero(f)}</dd></div></dl>` },
        { html: quienRegistra }],
      acciones: registraRendir() && x.estado === 'abierta' ? [{ txt: 'Devolver el vuelto', acc: 'rendir-vuelto', arg: x.id, icono: 'candado' }, { txt: 'Subir factura', acc: 'rendir-factura', arg: x.id, icono: 'subir', tono: 'pri' }] : [] };
  };
  ACC['rendir-factura'] = id => {
    if (!registraRendir()) { A.aviso('Las facturas las registran Jose o Alejandro.', 'info'); return; }
    const x = R().find(z => z.id === id); const f = faltaDe(x); const env = $('#modal-raiz');
    A.modal(`<h2 id="modal-t">Subir factura</h2><p class="muted" id="modal-d">A nombre de ${esc(x.quien)} · falta justificar ${dinero(f)}</p>
      <label class="campo" for="ren-que"><span>¿Qué pagó?</span><input id="ren-que" autocomplete="off" placeholder="Por ejemplo: revisión del aire"></label>
      <label class="campo" for="ren-monto"><span>Monto de la factura ($)</span><input id="ren-monto" inputmode="decimal" value="${fmt(f)}" autocomplete="off"><small class="ayuda" id="ren-msg"></small></label>
      <label class="soltar" for="ren-foto">${ic('camara')}<span><b id="ren-foto-t">Foto de la factura</b>Se guarda con la rendición. Sin foto, la factura queda marcada «Falta la foto».</span></label><input id="ren-foto" type="file" accept="image/*" class="sr-only">
      <div class="modal-acc"><button class="btn sec" data-ren="no">Cancelar</button><button class="btn pri" data-ren="si">Guardar la factura</button></div>`, 'teclado');
    $('#ren-que').focus();
    $('#ren-foto').addEventListener('change', e => { if (e.target.files.length) $('#ren-foto-t').textContent = 'Foto lista: ' + e.target.files[0].name; });
    env.onclick = e => {
      const b = e.target.closest('[data-ren]'); if (!b) return;
      if (b.dataset.ren === 'no') { A.cerrarModal(); return; }
      const que = $('#ren-que').value.trim(); const m = leerNum($('#ren-monto').value); const msg = $('#ren-msg');
      if (que.length < 3) { msg.textContent = 'Escribe qué pagó: queda en la rendición.'; return; }
      if (!m || m <= 0) { msg.textContent = 'Escribe el monto de la factura.'; return; }
      if (m > f + 0.005) { msg.textContent = 'Pasa lo que falta justificar (' + dinero(f) + '). Si puso plata suya, se le devuelve aparte.'; return; }
      const fi = $('#ren-foto').files; const foto = fi.length ? fi[0].name : false; // el nombre del archivo, o false si no se subió
      A.cerrarModal();
      x.facturas.push({ que, monto: r2(m), fecha: 'Hoy', quien: S.usuario.nombre, foto }); recalcRendir(x);
      A.auditar({ modulo: 'Caja chica y socios', registro: 'Por rendir · ' + x.quien, campo: 'factura', antes: 'falta ' + dinero(f), despues: 'falta ' + dinero(faltaDe(x)), motivo: que + ' · a nombre de ' + x.quien + (foto ? '' : ' · sin foto') });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Factura guardada a nombre de ' + x.quien + (foto ? '' : ', marcada «Falta la foto»') + '. ' + (x.estado === 'rendida' ? 'Ya está rendida.' : 'Falta justificar ' + dinero(faltaDe(x)) + '.'));
    };
  };
  ACC['ren-foto'] = arg => {
    const [id, i] = arg.split('|'); const x = R().find(z => z.id === id); const fa = x && x.facturas[+i]; if (!fa) return;
    A.pedirArchivo(file => {
      fa.foto = file.name; A.auditar({ modulo: 'Caja chica y socios', registro: 'Por rendir · ' + x.quien, campo: 'foto de la factura', antes: 'falta', despues: 'subida: ' + file.name, motivo: fa.que });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Foto de la factura subida.');
    });
  };
  // el vuelto: cuánto trajo (lo que falta es el tope), la foto de los billetes, obligatoria, y el código · si trae menos, el resto sigue por rendir
  ACC['rendir-vuelto'] = id => {
    if (!registraRendir()) { A.aviso('El vuelto lo registran Jose o Alejandro.', 'info'); return; }
    const x = R().find(z => z.id === id); const f = faltaDe(x); const env = $('#modal-raiz'); const tope = Math.floor(f + 0.005);
    A.modal(`<h2 id="modal-t">Devolver el vuelto</h2><p class="muted" id="modal-d">A nombre de ${esc(x.quien)} · falta justificar ${dinero(f)}</p>
      <label class="campo" for="ren-vuelto"><span>¿Cuánto trajo de vuelto? ($)</span><input id="ren-vuelto" inputmode="numeric" value="${tope}" autocomplete="off"><small class="ayuda" id="ren-vmsg">Dólares enteros: la bóveda guarda billetes.</small></label>
      <label class="soltar" for="ren-vfoto">${ic('camara')}<span><b id="ren-vfoto-t">Foto de los billetes</b>Obligatoria: la bóveda no recibe plata sin foto. La app lee los seriales.</span></label><input id="ren-vfoto" type="file" accept="image/*" class="sr-only">
      <p class="chequeo" id="ren-vlee"></p>
      <div class="modal-acc"><button class="btn sec" data-rv="no">Cancelar</button><button class="btn pri" data-rv="si">${ic('candado', 's')}Meter a la bóveda</button></div>`, 'teclado');
    const lee = () => { const m = leerNum($('#ren-vuelto').value); const el = $('#ren-vlee'); if (!m || m <= 0 || !Number.isInteger(m)) { el.hidden = true; return; } el.hidden = false; el.innerHTML = ic('boveda', 's') + '<span>Entran a la bóveda: ' + billetesTxt(enBilletes(m)) + '.' + (m < f - 0.005 ? ' Sigue por rendir ' + dinero(r2(f - m)) + '.' : '') + '</span>'; };
    $('#ren-vuelto').addEventListener('input', lee); lee(); $('#ren-vuelto').focus();
    $('#ren-vfoto').addEventListener('change', e => { if (e.target.files.length) $('#ren-vfoto-t').textContent = 'Foto lista: ' + e.target.files[0].name; });
    env.onclick = e => {
      const b = e.target.closest('[data-rv]'); if (!b) return;
      if (b.dataset.rv === 'no') { A.cerrarModal(); return; }
      const m = leerNum($('#ren-vuelto').value); const msg = $('#ren-vmsg');
      if (!m || m <= 0) { msg.textContent = 'Escribe cuánto trajo de vuelto.'; return; }
      if (!Number.isInteger(m)) { msg.textContent = 'La bóveda guarda billetes: escribe dólares enteros. Los céntimos se justifican con una factura.'; return; }
      if (m > f + 0.005) { msg.textContent = 'Pasa lo que falta justificar (' + dinero(f) + '). Si trajo más, lo que sobra entra a la bóveda aparte.'; return; }
      if (!$('#ren-vfoto').files.length) { msg.textContent = 'Falta la foto de los billetes: la bóveda no recibe plata sin foto.'; return; }
      A.cerrarModal();
      const bs = enBilletes(m);
      A.pedirCodigo({ que: 'Vuelto de ' + esc(x.quien) + ' · ' + dinero(m, 'usd', 0) + ' · entra a ' + A.cta('Bóveda'), det: billetesTxt(bs) + (m < f - 0.005 ? ' · sigue por rendir ' + dinero(r2(f - m)) : ''), boton: 'Meter ' + dinero(m, 'usd', 0) }).then(() => {
        x.vuelto = r2(x.vuelto + m); recalcRendir(x); moverBilletes(bs, 1);
        D.BOVEDA.movs.unshift({ id: 'b' + Date.now(), tipo: 'entrada', titulo: 'Vuelto · ' + x.quien, sub: 'Hoy ' + D.HOY.hora + ' · ' + S.usuario.nombre + ', desde la app · ' + billetesTxt(bs), monto: m, estado: 'ok', via: 'App con código', aNombre: x.quien + ' (lo registró ' + S.usuario.nombre + ')', seriales: [] });
        A.auditar({ modulo: 'Bóveda', registro: 'Vuelto de ' + x.quien, campo: 'creado', despues: dinero(m, 'usd', 0) + ' · ' + billetesTxt(bs), motivo: x.estado === 'rendida' ? 'Cierra lo que tenía por rendir' : 'Sigue por rendir ' + dinero(faltaDe(x)) });
        A.pintarFicha(); A.pintarPagina(); A.aviso('Vuelto de ' + dinero(m, 'usd', 0) + ' en la bóveda, a nombre de ' + x.quien + '. ' + (x.estado === 'rendida' ? 'Ya está rendida.' : 'Sigue por rendir ' + dinero(faltaDe(x)) + '.'));
      }).catch(() => {});
    };
  };

  /* =============== BANCOS Y CONCILIACIÓN =============== */
  // lo que falta aclarar de una cuenta sale de sus diferencias (no de un número fijo): al aclarar una, baja; con todo aclarado, se cierra
  const porAclarar = cid => D.DIFERENCIAS.filter(d => d.cuenta === cid && !d.resuelta);
  const difsDe = cid => D.DIFERENCIAS.filter(d => d.cuenta === cid);
  // cómo quedó una diferencia aclarada: con el comprobante (verde, con su sello), sin comprobante (aviso, como «Justificada sin soporte»)
  // o explicada (lo que entró es de un cliente, el pago se devolvió…: informativo) · corto para la lista, largo para la ficha
  const aclaracion = d => !d.resuelta ? null : d.comprobante ? { corto: 'Aclarado con comprobante', largo: 'Aclarado con el comprobante', tono: 'ok' }
    : d.tipo === 'Salió sin comprobante' ? { corto: 'Aclarado sin comprobante', largo: d.comision && /comisi/i.test(d.resuelta) ? 'Aclarado sin comprobante: comisión del banco' : 'Aclarado sin comprobante', tono: 'aviso' }
    : { corto: 'Aclarado', largo: 'Aclarado: ' + minus(d.resuelta), tono: 'info' };
  const FALTA_DIF = { 'Salió sin comprobante': 'Falta comprobante', 'Comprobante que no aparece en el banco': 'No está en el banco', 'Entró sin identificar': 'Sin identificar' };
  const cifraConc = c => {
    const n = porAclarar(c.id).length; const listo = c.estado === 'diferencias' && !n;
    return A.cifra({ etq: c.id + ' · ' + c.mes, valor: listo ? 'Todo aclarado' : A.estadoTag(c.estado).replace(/<[^>]+>/g, ''), sub: c.estado === 'diferencias' ? (n ? n + (n === 1 ? ' cosa por aclarar' : ' cosas por aclarar') : 'falta cerrar la conciliación') : c.estado === 'falta' ? 'sube el PDF del banco' : 'subido el ' + c.subido, abrir: 'conciliacion:' + c.id, tono: c.estado === 'falta' ? 'alerta' : c.estado === 'diferencias' ? 'aviso' : '' });
  };
  // las diferencias de cada cuenta que las tiene: abiertas, aclaradas (sin tachar: tachado es anulado) y, con todo aclarado, el botón para cerrar
  const seccionDif = c => {
    const ds = difsDe(c.id); if (!ds.length) return ''; const n = porAclarar(c.id).length;
    const titulo = c.estado === 'conciliada' ? 'Lo que se aclaró en ' + c.id + ' · ' + c.mes.toLowerCase() : 'Lo que hay que aclarar en ' + c.id + ' · ' + c.mes.toLowerCase();
    const cierre = c.estado === 'diferencias' && !n ? `<div class="hoja"><p class="nota ok">${ic('check', 's')}<span><b>Todo aclarado en ${esc(c.id)}.</b> Falta cerrar la conciliación de ${esc(c.mes.toLowerCase())}: queda conciliada y ya no se cambia.</span></p><div class="fila-btns">${A.boton('bancos', 'Cerrar la conciliación', `data-acc="conc-cerrar" data-arg="${esc(c.id)}"`, { icono: 'candado' })}</div></div>` : '';
    return `<div class="sec"><h2>${esc(titulo)}</h2>${c.estado === 'conciliada' ? tag('Conciliada', 'ok') : n ? tag(n + ' por aclarar', 'aviso') : ''}</div>${cierre}
      ${A.tabla({ cols: [{ t: 'Qué pasó', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Monto', cls: 'r plata' }, { t: '', cls: 'e' }], filas: ds.map(d => { const a = aclaracion(d); return { abrir: 'diferencia:' + d.id, celdas: [`<b>${esc(d.desc)}</b><small>${esc(d.fecha)} · ${esc(d.tipo)}</small>`, esc(d.tipo), dinero(d.monto), a ? tag(a.corto, a.tono) : tag(FALTA_DIF[d.tipo], 'aviso')] }; }) })}`;
  };
  PANT.bancos = {
    titulo: 'Bancos y conciliación', corto: 'Bancos', tab: 'Bancos', grupo: 'Bancos', icono: 'bancos', mod: 'bancos', palabras: 'banco saldo cuenta',
    secciones: [['cuentas', 'Cuentas', 'saldos'], ['conciliacion', 'Conciliación del mes', 'estado de cuenta conciliar']],
    cuenta: () => D.CONCILIACION.filter(c => c.estado !== 'conciliada').length,
    render: (sub = 'cuentas') => {
      let cuerpo = '';
      if (sub === 'cuentas') cuerpo = A.tabla({ cols: [{ t: 'Cuenta', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Titular', cls: 'x' }, { t: 'Último movimiento', cls: 'x' }, { t: 'Saldo', cls: 'r plata' }], filas: D.CUENTAS.filter(c => S.usuario.rol !== 'fiscal_externo' || c.tipo === 'Banco').map(c => ({ abrir: 'cuenta:' + c.id, celdas: [`<span class="acct" data-c="${c.id}">${c.id}</span> <b style="display:inline">${esc(c.nombre)}</b><small>${esc(c.num)}</small>`, esc(c.tipo), esc(c.titular), esc(c.ultimo), dinero(c.saldo, c.mon, c.mon === 'bs' ? 0 : 2)] })) }) + `<p class="muted">El saldo sale del libro de movimientos y se verifica cada mes contra el estado de cuenta. Nadie lo teclea.</p>`;
      if (sub === 'conciliacion') cuerpo = `<div class="cifras">${D.CONCILIACION.map(cifraConc).join('')}</div>
        ${puede('bancos', 'editar') ? `<label class="soltar" for="edo-cuenta">${ic('subir')}<span><b>Subir un estado de cuenta (PDF)</b>La app lo lee, comprueba que sus totales cuadran con los impresos y lo compara con el libro.</span></label><input id="edo-cuenta" type="file" accept="application/pdf" class="sr-only">` : ''}
        ${D.CONCILIACION.map(seccionDif).join('')}`;
      return `<div class="pagina">${A.cab('Todas las cuentas', 'Bancos y conciliación', 'Cada mes se sube el estado de cuenta de cada banco y la app dice qué salió sin comprobante, qué comprobante no aparece en el banco y qué entró sin identificar.')}
        ${S.usuario.rol === 'fiscal_externo' ? `<p class="nota gris">${ic('ojo', 's')}<span>Ves los bancos para tu trabajo, sin poder cambiarlos. Los pagos de nómina salen agrupados por corrida, sin nombres ni sueldos.</span></p>` : A.lectura('bancos')}
        ${A.subnav([['cuentas', 'Cuentas'], ['conciliacion', 'Conciliación del mes', D.CONCILIACION.filter(c => c.estado !== 'conciliada').length]], sub)}${cuerpo}</div>`;
    },
    montar: raiz => { const f = $('#edo-cuenta', raiz); if (f) f.addEventListener('change', () => A.aviso('Estado de cuenta recibido. En el prototipo no se lee.', 'info')); },
  };
  FICHAS.cuenta = id => {
    const c = D.CUENTAS.find(x => x.id === id);
    const l1 = D.LUNES.find(l => l.p === 'p1') || { m: 0 }; // el pago de hoy a Carnes La Pradera: el mismo de Pagos de los lunes, ya sin la retención de IVA
    const bsL1 = l1.capBs ?? Math.round((l1.cap ?? l1.m) * D.TASA.usd * 100) / 100;
    return { titulo: c.nombre, sub: esc(c.tipo) + ' · ' + esc(c.num), mod: 'bancos', obj: c, registro: 'Cuenta ' + c.id,
      bloques: [{ filas: [{ l: 'Etiqueta', v: `<span class="acct" data-c="${c.id}">${c.id}</span>` }, { l: 'Saldo', v: dinero(c.saldo, c.mon) }, { l: 'Titular o custodio', v: esc(c.titular), campo: { k: 'titular', tipo: 'texto' } }, { l: 'Número', v: esc(c.num), campo: { k: 'num', tipo: 'texto', sensible: true } }, { l: 'Último movimiento', v: esc(c.ultimo) }] },
        { titulo: 'Últimos movimientos', tiempo: [['Hoy', 'Pago móvil recibido · Bs 19.877,35', 'ok'], ['Hoy', 'Pago a Carnes La Pradera · ' + dinero(bsL1, 'bs'), ''], ['Ayer', 'Traspaso a BVCE · Bs 50.000,00', '']] }] };
  };
  FICHAS.conciliacion = id => {
    const c = D.CONCILIACION.find(x => x.id === id);
    // si falta el estado de cuenta, la ficha trae dónde subirlo (la misma zona de la pantalla): el pendiente que la abre se resuelve aquí
    const subir = c.estado !== 'falta' ? { titulo: 'Archivo', adjuntos: ['Estado de cuenta ' + id + ' ' + c.mes.toLowerCase() + '.pdf'] }
      : puede('bancos', 'editar') ? { titulo: 'Estado de cuenta', html: `<label class="soltar" for="edo-${esc(id)}">${ic('subir')}<span><b>Subir el estado de cuenta de ${esc(c.mes.toLowerCase())} (PDF)</b>La app lo lee, comprueba que sus totales cuadran con los impresos y lo compara con el libro.</span></label><input id="edo-${esc(id)}" data-edo="${esc(id)}" type="file" accept="application/pdf" class="sr-only">` }
        : { html: `<p class="muted">Falta el estado de cuenta. Lo sube ${esc(A.quienEdita('bancos'))}.</p>` };
    // lo que queda por aclarar, contado de sus diferencias: con 0, «Todo aclarado» y el botón para cerrarla
    const pend = porAclarar(id); const cuenta = t => pend.filter(d => d.tipo === t).length; const listo = c.estado === 'diferencias' && !pend.length;
    return { titulo: 'Conciliación ' + id + ' · ' + c.mes, sub: 'Bancos', mod: 'bancos', obj: c, tags: [[listo ? 'Todo aclarado' : A.estadoTag(c.estado).replace(/<[^>]+>/g, ''), c.estado === 'conciliada' ? 'ok' : c.estado === 'falta' ? 'alerta' : 'aviso']],
      aviso: listo ? `<p class="nota ok">${ic('check', 's')}<span><b>Todo aclarado.</b> Falta cerrar la conciliación: queda conciliada y ya no se cambia.</span></p>` : '',
      bloques: [{ titulo: c.estado === 'conciliada' || listo ? 'Por aclarar: nada' : 'Por aclarar', filas: [{ l: 'Salió sin comprobante', v: cuenta('Salió sin comprobante') }, { l: 'Comprobante que no aparece en el banco', v: cuenta('Comprobante que no aparece en el banco') }, { l: 'Entró sin identificar', v: cuenta('Entró sin identificar') }, { l: 'Estado de cuenta subido', v: esc(c.subido) + (c.por !== '—' ? ' por ' + esc(c.por) : '') }].concat(c.cerro ? [{ l: 'La cerró', v: esc(c.cerro) + ' con su código' }] : []) }, subir],
      acciones: listo ? [{ txt: 'Cerrar la conciliación', acc: 'conc-cerrar', arg: id, icono: 'candado', tono: 'pri', solo: 'editar' }] : c.estado === 'diferencias' ? [{ txt: 'Ver lo que hay que aclarar', acc: 'ir-a', arg: 'bancos/conciliacion', icono: 'derecha' }] : [] };
  };
  // cerrar la conciliación pide el código: queda conciliada y la cuenta del menú baja
  ACC['conc-cerrar'] = id => {
    const c = D.CONCILIACION.find(x => x.id === id); if (!c || porAclarar(id).length) { A.aviso('Todavía hay diferencias por aclarar.', 'info'); return; }
    const n = difsDe(id).length;
    A.pedirCodigo({ que: 'Cerrar la conciliación de ' + A.cta(id) + ' · ' + esc(c.mes.toLowerCase()), det: n + (n === 1 ? ' diferencia aclarada' : ' diferencias aclaradas') + '. Queda conciliada y ya no se cambia.', boton: 'Cerrar la conciliación' }).then(() => {
      c.estado = 'conciliada'; c.cerro = S.usuario.nombre;
      A.auditar({ modulo: 'Bancos', registro: 'Conciliación ' + id + ' · ' + c.mes, campo: 'estado', antes: 'con diferencias (todo aclarado)', despues: 'conciliada' });
      if (S.ficha) A.pintarFicha(); A.pintarPagina(); A.aviso('Conciliación cerrada: ' + id + ' quedó conciliada.');
    }).catch(() => {});
  };
  document.addEventListener('change', e => { if (e.target.matches && e.target.matches('#ficha-raiz [data-edo]') && e.target.files.length) A.aviso('Estado de cuenta recibido. En el prototipo no se lee.', 'info'); });
  FICHAS.diferencia = id => {
    const d = D.DIFERENCIAS.find(x => x.id === id); const sinComp = d.tipo === 'Salió sin comprobante'; const a = aclaracion(d);
    // lo que entra puede venir de la cuenta personal de un socio o ser plata que pone un socio (aportes y préstamos: lo que hoy lleva la pestaña del socio)
    // «Es una comisión del banco» solo sale cuando la línea del banco es una comisión: cualquier otra salida sin comprobante pide el
    // comprobante, o el motivo («No hay comprobante: aclarar con el motivo»), igual que una falta sin papel
    const opciones = { 'Salió sin comprobante': (d.comision ? [['Es una comisión del banco', 'comision']] : []).concat([['Subir el comprobante', 'comprobante']]), 'Comprobante que no aparece en el banco': [['El pago se devolvió', 'devuelto'], ['Salió en octubre', 'octubre']], 'Entró sin identificar': [['Es de un cliente', 'cliente'], ['Es un traspaso nuestro', 'traspaso'], ['Pasó por la cuenta de un socio', 'socio'], ['Aporte o préstamo de un socio', 'aporte']] }[d.tipo];
    // sin prueba no hay sello: solo lo aclarado con el comprobante lo lleva (el estado se arma aquí, no se guarda en la diferencia)
    const obj = { ...d, estado: !d.resuelta ? 'por_aclarar' : d.comprobante ? 'aclarada' : 'aclarada_sin' };
    // «Subir el comprobante» abre el selector de archivos: solo aclara si se sube uno, y el archivo queda a la vista
    const como = !d.resuelta ? null : d.comprobante ? 'Con el comprobante' : d.comision && /comisi/i.test(d.resuelta) ? 'Es una comisión del banco' : esc(d.resuelta);
    return { titulo: d.desc, sub: esc(d.cuenta) + ' · ' + esc(d.fecha), mod: 'bancos', obj, tags: [a ? [a.largo, a.tono] : [d.tipo, 'aviso']],
      aviso: a && a.tono === 'aviso' ? `<p class="nota aviso">${ic('alerta', 's')}<span><b>Aclarado sin comprobante.</b> Cuenta como aclarado en la conciliación, pero no tiene el papel.${puede('bancos', 'editar') ? ' Si aparece, súbelo y queda con su sello.' : ''}</span></p>` : '',
      bloques: [{ filas: [{ l: 'Monto', v: dinero(d.monto) }, { l: 'Qué dice el banco', v: esc(d.desc), largo: true }, { l: d.resuelta ? 'Qué faltaba' : 'Qué falta', v: esc(d.tipo) }].concat(como ? [{ l: 'Cómo se aclaró', v: como, largo: true }] : []).concat(d.socio ? [{ l: 'Qué socio', v: esc(d.socio) + (d.tipoSocio === 'aporte' ? ` <small class="tenue">el negocio se lo debe</small>` : '') }] : []) }].concat(d.comprobante ? [{ titulo: 'Comprobante', adjuntos: [d.comprobante] }] : sinComp && !d.resuelta && puede('bancos', 'editar') ? [{ html: '<p class="muted">«Subir el comprobante» abre tus archivos o la cámara: queda aclarada cuando subes uno, y el archivo queda aquí a la vista.</p>' }] : []).concat(d.tipo === 'Entró sin identificar' && !d.resuelta ? [{ html: '<p class="muted">Si la plata es del negocio pero vino de la cuenta personal de un socio, es «Pasó por la cuenta de un socio». Si la puso un socio de su bolsillo, es «Aporte o préstamo de un socio» y queda en su cuenta de aportes y préstamos. En los dos casos te pregunta qué socio.</p>' }] : []),
      // aclarada sin comprobante: el comprobante se puede subir después, y entonces queda con su sello
      acciones: d.resuelta ? (sinComp && !d.comprobante ? [{ txt: 'Subir el comprobante', acc: 'dif-comprobante', arg: d.id, icono: 'subir', tono: 'pri', solo: 'editar' }] : [])
        : opciones.map(([t, k]) => k === 'comprobante' ? { txt: t, acc: 'dif-comprobante', arg: d.id, icono: 'subir', tono: d.comision ? 'sec' : 'pri', solo: 'editar' } : { txt: t, acc: 'aclarar', arg: d.id + '|' + t, tono: k === 'comision' ? 'pri' : 'sec', solo: 'editar' }),
      enlaces: sinComp && !d.resuelta && !d.comision ? [{ txt: 'No hay comprobante: aclarar con el motivo', acc: 'dif-sin', arg: d.id, solo: 'editar' }] : [] };
  };
  ACC['dif-comprobante'] = id => {
    const d = D.DIFERENCIAS.find(x => x.id === id);
    A.pedirArchivo(file => {
      const antes = d.resuelta ? 'aclarado sin comprobante' : d.tipo;
      d.comprobante = file.name; d.resuelta = d.resuelta || 'comprobante subido';
      A.auditar({ modulo: 'Bancos', registro: d.desc, campo: 'conciliación', antes, despues: 'aclarado con el comprobante ' + file.name });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Comprobante subido: quedó aclarado.');
    });
  };
  // sin el papel: se aclara con el motivo y queda «Aclarado sin comprobante», con su etiqueta de aviso y sin sello
  ACC['dif-sin'] = id => {
    const d = D.DIFERENCIAS.find(x => x.id === id);
    A.pedirMotivo({ titulo: 'Aclarar sin comprobante', texto: `${esc(d.desc)} · ${dinero(d.monto)}. Queda «Aclarado sin comprobante»: cuenta para cerrar la conciliación, pero sin el papel no lleva sello. Si aparece, se sube en esta ficha.`, etiqueta: 'Qué fue y por qué no hay comprobante', boton: 'Aclarar sin comprobante' })
      .then(m => { d.resuelta = m; A.auditar({ modulo: 'Bancos', registro: d.desc, campo: 'conciliación', antes: d.tipo, despues: 'aclarado sin comprobante', motivo: m }); A.pintarFicha(); A.pintarPagina(); A.aviso('Aclarado sin comprobante.'); }).catch(() => {});
  };
  // con los dos tipos de socio se pregunta cuál: lo que puso de su bolsillo va a su cuenta de aportes y préstamos (Caja chica y socios)
  ACC.aclarar = arg => {
    const [id, t] = arg.split('|'); const d = D.DIFERENCIAS.find(x => x.id === id);
    const tipoSocio = { 'Pasó por la cuenta de un socio': 'socio', 'Aporte o préstamo de un socio': 'aporte' }[t];
    const comision = t === 'Es una comisión del banco';
    const hecho = socio => {
      d.resuelta = comision ? 'Comisión del banco' : t + (socio ? ' (' + socio + ')' : ''); if (socio) { d.socio = socio; d.tipoSocio = tipoSocio; }
      A.auditar({ modulo: 'Bancos', registro: d.desc, campo: 'conciliación', antes: d.tipo, despues: comision ? 'aclarado sin comprobante: comisión del banco' : d.resuelta });
      A.pintarFicha(); A.pintarPagina(); A.aviso(tipoSocio === 'aporte' ? 'Aclarado. Quedó en los aportes y préstamos de ' + socio + '.' : comision ? 'Aclarado sin comprobante: es una comisión del banco.' : 'Aclarado.');
    };
    if (!tipoSocio) { hecho(''); return; }
    const env = $('#modal-raiz');
    A.modal(`<h2 id="modal-t">¿Qué socio?</h2><p class="muted" id="modal-d">${esc(t)}: ${esc(d.desc)} · ${dinero(d.monto)}</p>
      <label class="campo" for="acl-socio"><span>Socio</span><select id="acl-socio">${D.SOCIOS.map(s => `<option>${esc(s.nombre)}</option>`).join('')}</select></label>
      <p class="muted">${tipoSocio === 'aporte' ? 'Lo puso de su bolsillo: el negocio se lo debe y queda en su cuenta de aportes y préstamos.' : 'Es plata del negocio que entró por su cuenta personal.'}</p>
      <div class="modal-acc"><button class="btn sec" data-acl="no">Cancelar</button><button class="btn pri" data-acl="si">Aclarar</button></div>`, 'teclado');
    $('#acl-socio').focus();
    env.onclick = e => { const b = e.target.closest('[data-acl]'); if (!b) return; const socio = $('#acl-socio').value; A.cerrarModal(); if (b.dataset.acl === 'si') hecho(socio); };
  };

  /* =============== TASAS =============== */
  PANT.tasas = {
    titulo: 'Tasas de hoy', corto: 'Tasas', tab: 'Tasas', grupo: 'Bancos', icono: 'tasas', mod: 'tasas', palabras: 'dolar bcv euro usdt cambio calculadora',
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
      bloques: [{ filas: [{ l: 'Valor (Bs)', v: dinero(D.TASA[k], 'bs'), campo: { k: 'valor', tipo: 'dinero', mon: 'bs', obligatorio: true } }, { l: 'Fuente', v: k === 'usdt' ? 'Promedio P2P de Binance' : 'Banco Central de Venezuela' }, { l: 'La cargó', v: 'n8n-tasas (bot) a las 7:30' }] },
        { html: '<p class="muted">Una tasa por día y por tipo. Corregirla deja la anterior en el registro de cambios; nunca se pisa en silencio.</p>' }],
      alGuardar: cambios => { D.TASA[k] = cambios[0].nuevo; } };
  };
  ACC['tasa-mano'] = () => A.abrir('tasa', 'usd');
})();
