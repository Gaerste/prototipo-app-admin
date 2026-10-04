/* Sistema: Usuarios y permisos, Parámetros, Registro de cambios, Salud del sistema. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, $, esc, fmt, dinero, leerNum, ic, tag, puede } = A;
  const estadoU = u => ({ activo: tag('Activo', 'ok'), aprendiz: tag('Aprendiz ' + (u.aprendiz || ''), 'lila'), invitada: tag('Invitación enviada', 'info'), por_confirmar: tag('Por confirmar', 'aviso'), sin_acceso: tag('Sin acceso', ''), bloqueado: tag('Bloqueado', 'alerta') }[u.estado] || '');
  const NIV = ['', 'v', 'g', 'e', 'a']; const NIVT = { '': 'No ve', v: 'Ve', g: 'Ve agrupado', e: 'Edita', a: 'Aprueba', p: 'Prepara', r: 'Revisa' };
  const NIVC = { '': 'no', v: 'ver', g: 'parcial', e: 'editar', a: 'aprobar', p: 'editar', r: 'editar' };
  let matrizCambios = 0;

  /* =============== USUARIOS Y PERMISOS =============== */
  function personas() {
    return `${A.tabla({ cols: [{ t: 'Persona', cls: 'p' }, { t: 'Rol', cls: 'x' }, { t: 'Código', cls: 'x' }, { t: 'Último acceso', cls: 'x' }, { t: 'Estado', cls: 'e' }],
      filas: D.USUARIOS.map(u => ({ abrir: 'usuario:' + u.id, clase: u.estado === 'sin_acceso' ? 'anulada' : '', celdas: [`<span style="display:flex;gap:10px;align-items:center"><span class="avatar">${A.iniciales(u)}</span><span><b>${esc(A.nombreDe(u))}</b><small>${esc(u.correo)}</small></span></span>`, esc(D.ROLES[u.rol].nombre), u.dosfa ? tag('Activo', 'ok') : tag('Sin activar', 'aviso'), esc(u.ultimo), estadoU(u)] })) })}
      <p class="nota info">${ic('info', 's')}<span>Cada persona entra con su usuario, su clave y el código de su teléfono. Las cajeras no usan la app: siguen en WhatsApp. Los primeros 14 días cada persona nueva está en modo aprendiz.</span></p>`;
  }
  function matriz() {
    const users = D.USUARIOS.filter(u => u.estado !== 'sin_acceso');
    const edita = puede('usuarios', 'aprobar');
    return `<p class="desc">Los permisos van por rol, no por persona: si cambia el administrativo, se le pasa el rol al nuevo y se desactiva al anterior. ${edita ? 'Toca una casilla para cambiarla; al final guardas con tu código.' : ''}</p>
      <div class="hoja plana"><div class="tabla-env"><table class="matriz"><thead><tr><th scope="col" style="text-align:left">Módulo</th>${users.map(u => `<th scope="col">${esc(u.nombre.split(' ')[0])}<br><small class="muted">${esc(D.ROLES[u.rol].nombre)}</small></th>`).join('')}</tr></thead>
      <tbody>${D.MODULOS.map(([m, n]) => `<tr><th scope="row">${esc(n)}</th>${users.map(u => { const v = (D.PERMISOS[u.rol] || {})[m] || ''; const extra = m === 'boveda' && u.extra.length ? '*' : ''; return `<td>${edita && u.rol !== 'dueno' ? `<button data-acc="perm" data-arg="${u.rol}|${m}" aria-label="${esc(u.nombre)}, ${esc(n)}: ${NIVT[v]}">` : ''}<span class="perm ${NIVC[v]}">${NIVT[v]}${extra}</span>${edita && u.rol !== 'dueno' ? '</button>' : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div></div>
      <p class="muted">* Luis además puede registrar su propio retiro de la bóveda. La nómina usa pasos: prepara, revisa y aprueba, cada uno una persona distinta.</p>
      ${edita ? `<div class="filtros"><button class="btn pri" data-acc="guardar-matriz" ${matrizCambios ? '' : 'disabled'}>${ic('candado', 's')}Guardar ${matrizCambios ? matrizCambios + ' cambio' + (matrizCambios > 1 ? 's' : '') : 'los cambios'}</button><span class="muted">Editar roles pide tu código.</span></div>` : ''}`;
  }
  ACC.perm = arg => {
    const [rol, m] = arg.split('|'); const p = D.PERMISOS[rol]; const act = p[m] || '';
    const sig = m === 'nomina' ? { '': 'g', g: 'p', p: 'r', r: '' }[act] ?? '' : NIV[(NIV.indexOf(act) + 1) % NIV.length];
    p[m] = sig; matrizCambios++; A.pintarPagina();
  };
  ACC['guardar-matriz'] = () => A.pedirCodigo('Guardar los cambios de permisos.').then(() => { A.auditar({ modulo: 'Usuarios', registro: 'Matriz de permisos', campo: 'permisos', despues: matrizCambios + ' cambios' }); matrizCambios = 0; A.pintarPagina(); A.aviso('Permisos guardados. Ya rigen para todos los que tienen esos roles.'); }).catch(() => {});
  function aprobaciones() {
    return `<div class="rejilla"><div class="c7 pila"><div class="sec"><h2>Quién aprueba qué</h2></div>
        ${A.tabla({ cols: [{ t: 'Qué', cls: 'p' }, { t: 'Aprueba hasta', cls: 'r' }, { t: 'Si pasa, aprueba', cls: 'e' }], filas: D.LIMITES.map(l => ({ abrir: 'limite:' + l.id, celdas: [`<b>${esc(l.que)}</b><small>${esc(l.quien)}${l.cond ? ', ' + esc(l.cond) : ''}</small>`, l.hasta === null ? 'Sin límite' : dinero(l.hasta, l.mon, 0), esc(l.arriba)] })) })}
        <p class="muted">Los montos son propuestas para arrancar; se ajustan con la app andando. Alejandro no tiene límite.</p></div>
      <div class="c5 pila"><article class="hoja"><h2>${ic('usuario')}Suplente</h2><dl class="kv"><div><dt>Suplente</dt><dd>Por ahora, Alejandro mismo</dd></div><div><dt>Si algo espera más de 24 horas</dt><dd>La app se lo recuerda</dd></div></dl><p class="muted">Otro se nombra con la app andando (decidido el 3-oct).</p></article>
        <article class="hoja"><h2>${ic('escudo')}Reglas que no se saltan</h2><ul class="tiempo"><li><time>1</time><span>Quien prepara, quien revisa y quien aprueba son personas distintas. Lo cumple la propia base de datos.</span></li><li><time>2</time><span>Los bots y los agentes proponen. Solo escriben directo las tasas y los pagos que lee el bot de caja. Excepción: el bot de la bóveda registra al instante si todo cuadra, a nombre de quien mandó la foto y marcado «sin doble factor»; si algo falla, queda «por revisar».</span></li><li><time>3</time><span>Aprobar, anular, mover la bóveda, cambiar una cuenta, editar roles o exportar pide el código otra vez.</span></li></ul></article></div></div>`;
  }
  // cómo escribe cada cuenta de servicio: la regla 2 de «Quién aprueba qué»
  const MODO = { directo: ['Escribe directo', 'info'], si_cuadra: ['Excepción: escribe si cuadra', 'info'], propone: ['Solo propone', 'lila'] };
  const modoTag = s => tag(...(MODO[s.modo] || MODO.propone));
  function bots() {
    return `<p class="desc">Los programas que trabajan con la app (n8n, el bot de caja, los agentes de IA) entran con su propia cuenta, como una persona más, y cada uno tiene un humano responsable.</p>
      ${A.tabla({ cols: [{ t: 'Cuenta', cls: 'p' }, { t: 'Puede', cls: 'x' }, { t: 'Responsable', cls: 'x' }, { t: 'Vence la clave', cls: 'r x' }, { t: 'Tipo', cls: 'e' }], filas: D.SERVICIO.map(s => ({ abrir: 'servicio:' + s.id, celdas: [`<b class="mono">${esc(s.nombre)}</b><small>${/^Todavía/.test(s.ultimo) ? esc(s.ultimo) : 'Último uso ' + esc(s.ultimo)}</small>`, esc(s.puede), esc(s.responsable), esc(s.vence), modoTag(s)] })) })}
      <p class="muted">Solo escriben directo las tasas y los pagos que lee el bot de caja. El bot de la bóveda es la excepción: registra al instante si todo cuadra; si algo falla, queda «por revisar». Las facturas que lee el agente esperan a que Jose o Alejandro las aprueben.</p>
      ${A.boton('usuarios', 'Crear una cuenta de servicio', 'data-acc="pronto"', { tono: 'sec', icono: 'llave', permiso: 'aprobar' })}`;
  }
  PANT.usuarios = {
    titulo: 'Usuarios y permisos', corto: 'Usuarios y permisos', grupo: 'Sistema', icono: 'usuarios', mod: 'usuarios',
    render: (sub = 'personas') => `<div class="pagina">${A.cab('Quién entra y qué ve', 'Usuarios y permisos', '', A.boton('usuarios', 'Invitar a alguien', 'data-acc="invitar"', { icono: 'mas', permiso: 'aprobar' }))}
      ${A.subnav([['personas', 'Personas', D.USUARIOS.length, true], ['matriz', 'Qué ve cada quien'], ['aprobaciones', 'Quién aprueba qué'], ['bots', 'Bots y agentes', D.SERVICIO.length, true]], sub)}
      ${{ personas, matriz, aprobaciones, bots }[sub]()}</div>`,
  };
  FICHAS.usuario = id => {
    const u = D.USUARIOS.find(x => x.id === id); const yo = S.usuario.id === id;
    const acc = [];
    if (!yo && u.estado !== 'sin_acceso') acc.push({ txt: 'Quitar acceso', acc: 'quitar-acceso', arg: id, icono: 'anular', tono: 'peligro', solo: 'aprobar' });
    if (u.dosfa && !yo) acc.push({ txt: 'Resetear su código', acc: 'reset-2fa', arg: id, icono: 'refrescar', solo: 'aprobar' });
    if (u.estado === 'invitada') acc.push({ txt: 'Reenviar invitación', acc: 'reenviar', arg: id, icono: 'enviar', solo: 'aprobar' });
    if (u.estado === 'por_confirmar') acc.push({ txt: 'Confirmar acceso', acc: 'confirmar-u', arg: id, icono: 'check', tono: 'pri', solo: 'aprobar' });
    // si el nombre del rol ya dice «por confirmar», no se repite la etiqueta del estado
    const repite = u.estado === 'por_confirmar' && /por confirmar/.test(D.ROLES[u.rol].nombre);
    return { titulo: A.nombreDe(u), sub: esc(u.correo), mod: 'usuarios', obj: u, registro: 'Usuario ' + A.nombreDe(u), tags: [[D.ROLES[u.rol].nombre, 'info']].concat(u.estado !== 'activo' && !repite ? [[estadoU(u).replace(/<[^>]+>/g, ''), u.estado === 'aprendiz' ? 'lila' : 'aviso']] : []),
      bloques: [
        { titulo: 'Acceso', filas: [{ l: 'Rol', v: esc(D.ROLES[u.rol].nombre), campo: { k: 'rol', tipo: 'select', opciones: Object.entries(D.ROLES).map(([k, r]) => [k, r.nombre]), sensible: true } }, { l: 'Qué puede', v: esc(D.ROLES[u.rol].desc), largo: true }, { l: 'Código (doble factor)', v: u.dosfa ? tag('Activo', 'ok') : tag('Sin activar', 'aviso') }, { l: 'Último acceso', v: esc(u.ultimo) }, { l: 'Sede', v: 'Valencia' }] },
        u.extra.length ? { titulo: 'Además', html: `<p>${esc(u.extra.join(', '))}.</p>` } : { oculto: true },
        { titulo: 'Lo que ve', html: `<dl class="kv">${D.MODULOS.filter(m => A.nivel(m[0], u)).map(m => `<div><dt>${esc(m[1])}</dt><dd>${A.nivelTag(A.nivel(m[0], u))}</dd></div>`).join('')}</dl>` },
      ], acciones: acc,
      alGuardar: () => A.aviso('Rol cambiado. Rige desde su próximo clic.') };
  };
  ACC['quitar-acceso'] = id => {
    const u = D.USUARIOS.find(x => x.id === id);
    const pend = D.PENDIENTES.filter(p => p.para.includes(id) && !p.hecho).length;
    const custodia = id === 'jose';
    A.pedirMotivo({ titulo: 'Quitar acceso a ' + u.nombre, texto: `Se cierran todas sus sesiones y se anula su código. ${pend ? `Sus ${pend} pendientes pasan a quien tenga su rol.` : ''} ${custodia ? '<b>Custodia la bóveda y la caja chica: antes hay que hacer un conteo de entrega con testigo.</b>' : ''} No se borra nada de lo que hizo.`, boton: 'Quitar acceso', tono: 'peligro', codigo: true }).then(m => {
      u.estado = 'sin_acceso'; u.ultimo = 'Acceso quitado hoy ' + D.HOY.hora;
      A.auditar({ modulo: 'Usuarios', registro: A.nombreDe(u), campo: 'acceso', antes: 'activo', despues: 'sin acceso', motivo: m });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Acceso quitado. Sus sesiones se cerraron.');
    }).catch(() => {});
  };
  ACC['reset-2fa'] = id => A.pedirCodigo('Resetear el código de ' + D.USUARIOS.find(x => x.id === id).nombre + '. Tendrá que activarlo de nuevo.').then(() => { const u = D.USUARIOS.find(x => x.id === id); u.dosfa = false; D.ACCESOS.unshift({ cuando: 'Hoy ' + D.HOY.hora, quien: S.usuario.nombre, que: 'Reseteó el código de ' + u.nombre, donde: 'Este equipo' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Código reseteado. Quedó en el registro de accesos.'); }).catch(() => {});
  ACC.reenviar = () => A.aviso('Invitación reenviada. El enlace vale 48 horas y sirve una sola vez. (Simulado)');
  ACC['confirmar-u'] = id => A.pedirCodigo('Confirmar el acceso de ' + D.USUARIOS.find(x => x.id === id).nombre + ' con el rol que tiene.').then(() => { const u = D.USUARIOS.find(x => x.id === id); u.estado = 'invitada'; u.ultimo = 'Invitación enviada hoy'; A.auditar({ modulo: 'Usuarios', registro: A.nombreDe(u), campo: 'estado', antes: 'por confirmar', despues: 'invitada' }); A.pintarFicha(); A.pintarPagina(); A.aviso('Le llegará la invitación por correo.'); }).catch(() => {});
  ACC.invitar = () => {
    const env = $('#modal-raiz');
    env.innerHTML = `<div class="modal-env"><div class="modal" role="dialog" aria-modal="true"><h2>Invitar a alguien</h2>
      <label class="campo" for="inv-nombre"><span>Nombre</span><input id="inv-nombre" placeholder="Nombre y apellido"></label>
      <label class="campo" for="inv-correo"><span>Correo</span><input id="inv-correo" type="email" placeholder="persona@correo.com"></label>
      <label class="campo" for="inv-rol"><span>Rol</span><select id="inv-rol">${Object.entries(D.ROLES).filter(([k]) => k !== 'dueno').map(([k, r]) => `<option value="${k}">${esc(r.nombre)}</option>`).join('')}</select></label>
      <p class="muted">Le llega un enlace de un solo uso (vale 48 horas). Crea su clave, activa el código y entra en modo aprendiz 14 días.</p>
      <div class="modal-acc"><button class="btn sec" data-inv="no">Cancelar</button><button class="btn pri" data-inv="si">Enviar invitación</button></div></div></div>`;
    $('#inv-nombre').focus();
    env.onclick = e => {
      const b = e.target.closest('[data-inv]'); if (!b) return;
      if (b.dataset.inv === 'no') { env.innerHTML = ''; return; }
      const nombre = $('#inv-nombre').value.trim(); const correo = $('#inv-correo').value.trim();
      if (!nombre || !correo.includes('@')) { $('#inv-nombre').focus(); return; }
      A.pedirCodigo('Invitar a ' + nombre + '.').then(() => {
        const rol = $('#inv-rol') ? $('#inv-rol').value : 'consulta';
        D.USUARIOS.push({ id: 'u' + Date.now(), nombre, apellido: '', rol, correo, estado: 'invitada', ultimo: 'Invitación enviada hoy', dosfa: false, extra: [], tabs: ['inicio'] });
        A.auditar({ modulo: 'Usuarios', registro: nombre, campo: 'invitación', despues: 'rol ' + D.ROLES[rol].nombre });
        A.pintarPagina(); A.aviso('Invitación enviada a ' + correo + '. (Simulado)');
      }).catch(() => {});
    };
  };
  FICHAS.limite = id => {
    const l = D.LIMITES.find(x => x.id === id);
    return { titulo: l.que, sub: 'Quién aprueba qué', mod: 'usuarios', obj: l, registro: 'Límite: ' + l.que,
      bloques: [{ filas: [{ l: 'Quién aprueba', v: esc(l.quien), campo: { k: 'quien', tipo: 'texto' } }, ...(l.cond ? [{ l: 'Condición', v: esc(l.cond) }] : []), { l: 'Hasta ($)', v: l.hasta === null ? 'Sin límite' : dinero(l.hasta, 'usd', 0), campo: l.hasta === null ? undefined : { k: 'hasta', tipo: 'dinero', sensible: true } }, { l: 'Si pasa del límite', v: esc(l.arriba) }] }] };
  };
  FICHAS.servicio = id => {
    const s = D.SERVICIO.find(x => x.id === id);
    // el bot de la bóveda registra a nombre de quien mandó la foto (3 oct); los demás, a su propio nombre
    const aNombre = s.modo === 'si_cuadra'
      ? 'Lo que registra queda a nombre de la persona que mandó la foto al grupo, marcado «sin doble factor». En el registro de cambios se ve que lo llevó el bot.'
      : s.modo === 'propone' ? 'No registra nada solo: lo que propone queda esperando a que una persona lo apruebe, y queda a nombre de quien lo aprobó.' : 'Todo lo que el bot registra queda a su nombre en el registro de cambios.';
    return { titulo: s.nombre, sub: s.tipo === 'bot' ? 'Bot' : 'Agente de IA', mod: 'usuarios', obj: s, tags: [MODO[s.modo] || MODO.propone],
      bloques: [{ filas: [{ l: 'Qué puede', v: esc(s.puede), largo: true }, { l: 'A nombre de quién queda', v: s.modo === 'si_cuadra' ? 'De quien mandó la foto' : s.modo === 'propone' ? 'De quien lo aprueba' : 'Del bot' }, { l: 'Humano responsable', v: esc(s.responsable) }, { l: 'Vence la clave', v: esc(s.vence) }, { l: 'Último uso', v: esc(s.ultimo) }, { l: 'Límite', v: '120 llamadas por minuto' }] }, { html: `<p class="muted">La clave se guarda cifrada y se ve una sola vez al crearla. ${aNombre}</p>` }],
      acciones: [{ txt: 'Revocar la clave', acc: 'revocar', arg: id, icono: 'anular', tono: 'peligro', solo: 'aprobar' }] };
  };
  ACC.revocar = id => A.pedirCodigo('Revocar la clave de ' + D.SERVICIO.find(x => x.id === id).nombre + '. Dejará de funcionar al instante.').then(() => A.aviso('Clave revocada. (Simulado)')).catch(() => {});

  /* =============== PARÁMETROS =============== */
  const P = D.PARAMS; P.costosFijos = 38060;
  const filaParam = (clave, etq, valor, extra = '') => `<li><button class="fila" data-abrir="param:${clave}"><span class="medio"><b>${esc(etq)}</b><small>${extra}</small></span><span class="fin"><span class="monto" style="font-weight:500;text-align:right">${valor}</span>${ic('derecha', 's chev')}</span></button></li>`;
  function negocio() {
    const N = P.negocio; const s = P.sedes[0];
    return `<div class="rejilla"><div class="c6 pila"><article class="hoja"><h2>Negocio</h2><ul class="lista" style="border:0">
        ${filaParam('n-nombre', 'Nombre', esc(N.nombre))}${filaParam('n-razon', 'Razón social', esc(N.razon))}${filaParam('n-rif', 'RIF', esc(N.rif), 'El último dígito decide el calendario del SENIAT')}${filaParam('n-espec', 'Contribuyente especial', esc(N.espec))}${filaParam('n-zona', 'Zona horaria', esc(N.zona))}${filaParam('n-moneda', 'Moneda base', esc(N.monedaBase))}${filaParam('n-carta', 'Precios de la carta en', esc(N.carta))}</ul></article></div>
      <div class="c6 pila"><article class="hoja"><h2>Sede</h2><ul class="lista" style="border:0">${filaParam('s-nombre', 'Sede', esc(s.nombre), 'Hoy solo existe una. La tabla queda para vender la app a otro restaurante.')}${filaParam('s-corte', 'Hora de corte del día', esc(s.corte), 'Lo vendido antes de las 4:00 cuenta para el día anterior')}</ul></article>
      <article class="hoja"><h2>Para la meta del día</h2><ul class="lista" style="border:0">${filaParam('costos', 'Costos fijos del mes', dinero(P.costosFijos, 'usd', 0), 'Alquiler, nómina, servicios. Sin este número no hay meta del día. Lo pone el dueño.')}</ul></article></div></div>`;
  }
  function cuentas() {
    return `${A.tabla({ cols: [{ t: 'Cuenta', cls: 'p' }, { t: 'Tipo', cls: 'x' }, { t: 'Titular o custodio', cls: 'x' }, { t: 'Moneda', cls: 'r' }, { t: 'Etiqueta', cls: 'e' }], filas: D.CUENTAS.map(c => ({ abrir: 'cuenta:' + c.id, celdas: [`<b>${esc(c.nombre)}</b><small>${esc(c.num)}</small>`, esc(c.tipo), esc(c.titular), { bs: 'Bs', usd: '$', usdt: 'USDT' }[c.mon], `<span class="acct" data-c="${c.id}">${c.id}</span>`] })) })}
      <p class="muted">El color de la etiqueta es el resaltador de cada cuenta en Pagos de los lunes y en el PDF. Cambiar un número de cuenta pide tu código.</p>`;
  }
  function tasas() {
    return `<div class="rejilla"><div class="c6 pila"><article class="hoja"><h2>Fuente de las tasas</h2><ul class="lista" style="border:0">${Object.entries({ fuente: 'De dónde salen', respaldo: 'Si no llegan', usdt: 'USDT', finde: 'Fines de semana y feriados' }).map(([k, t]) => filaParam('t-' + k, t, '', esc(P.tasas[k]))).join('')}</ul></article></div>
      <div class="c6 pila"><article class="hoja"><h2>Valores legales</h2><ul class="lista" style="border:0">${P.legales.map((l, i) => filaParam('leg-' + i, l[0], esc(l[1]), 'Vigente ' + esc(l[2]))).join('')}</ul><p class="muted">Cambiar un valor no pisa el anterior: se cierra su vigencia y empieza una nueva. Así los cálculos viejos no cambian.</p></article>
      <article class="hoja"><h2>Alícuotas</h2><ul class="lista" style="border:0">${P.alicuotas.map((a, i) => filaParam('ali-' + i, a[0], esc(a[1]))).join('')}</ul></article></div></div>`;
  }
  function catalogos() {
    const lista = (t, arr, k) => `<article class="hoja"><div class="hoja-cab"><h2>${t}</h2>${A.boton('parametros', 'Agregar', 'data-acc="pronto"', { tono: 'ghost', icono: 'mas', chico: true })}</div><ul class="lista" style="border:0">${arr.map((x, i) => filaParam(k + '-' + i, Array.isArray(x) ? x[0] : x, Array.isArray(x) ? esc(x[1]) : '')).join('')}</ul></article>`;
    return `<div class="rejilla"><div class="c6 pila">${lista('Métodos de pago del POS → cuenta', P.metodos, 'met')}${lista('Categorías de proveedor', P.categorias, 'cat')}</div><div class="c6 pila">${lista('Tipos de movimiento', P.tiposMov, 'tmov')}<article class="hoja"><h2>Billetes para los conteos</h2><p>$100 · $50 · $20 · $10 · $5 · $1</p></article></div></div>`;
  }
  function reglas() {
    return `<p class="desc">Cada regla se puede ajustar sin programar. Queda en el registro de cambios quién la cambió y por qué.</p><ul class="lista">${P.reglas.map((r, i) => filaParam('reg-' + i, r[0], '', esc(r[1]))).join('')}</ul>`;
  }
  function antifraude() {
    const edita = puede('parametros', 'aprobar');
    return `<p class="desc">Alertas fijas que avisan a Alejandro cuando algo huele mal. Apagar una pide tu código.</p>
      <ul class="lista">${P.antifraude.map(r => `<li><div class="fila"><span class="lead ${r.activa ? 'ok' : ''}">${ic('escudo')}</span><span class="medio"><b>${esc(r.nombre)}</b><small>${esc(r.detalle)}</small></span><label class="interruptor"><input type="checkbox" data-af="${r.id}" ${r.activa ? 'checked' : ''} ${edita ? '' : 'disabled'} aria-label="${esc(r.nombre)}"></label></div></li>`).join('')}</ul>`;
  }
  function avisos() {
    return `<div class="rejilla"><div class="c7 pila"><article class="hoja"><h2>Qué avisa la app y a dónde</h2><ul class="lista" style="border:0">${P.avisos.map((a, i) => filaParam('av-' + i, a[0], '', esc(a[1]))).join('')}</ul></article></div>
      <div class="c5 pila"><article class="hoja"><h2>${ic('celular')}Alarma al teléfono</h2><dl class="kv"><div><dt>Avisos al teléfono (ntfy)</dt><dd>${tag('Conectado', 'ok')}</dd></div><div><dt>Vigilante externo</dt><dd>${tag('Recibiendo latidos', 'ok')}</dd></div></dl><p class="muted">La dirección secreta de la alarma vive en el servidor, nunca en la app ni en el código.</p></article>
      <article class="hoja"><h2>Textos de los mensajes</h2><p class="muted">Los textos que manda el bot se pueden editar sin programar (por ejemplo, el aviso a las cajeras).</p>${A.boton('parametros', 'Editar los textos', 'data-acc="pronto"', { tono: 'sec', icono: 'lapiz' })}</article></div></div>`;
  }
  PANT.parametros = {
    titulo: 'Parámetros', grupo: 'Sistema', icono: 'parametros', mod: 'parametros',
    render: (sub = 'negocio') => `<div class="pagina">${A.cab('Cómo funciona la app', 'Parámetros', 'Todo lo que se puede ajustar sin programar: datos del negocio, cuentas, tasas, catálogos y reglas. Nada del restaurante está escrito en el código.')}
      ${A.lectura('parametros')}
      ${A.subnav([['negocio', 'Negocio y sede'], ['cuentas', 'Cuentas'], ['tasas', 'Tasas y valores legales'], ['catalogos', 'Catálogos'], ['reglas', 'Reglas'], ['antifraude', 'Antifraude'], ['avisos', 'Avisos'], puede('nomina') ? ['ir-nomina', 'Nómina →'] : null, puede('fiscal') ? ['ir-fiscal', 'Fiscal →'] : null], sub)}
      ${{ negocio, cuentas, tasas, catalogos, reglas, antifraude, avisos }[sub] ? { negocio, cuentas, tasas, catalogos, reglas, antifraude, avisos }[sub]() : ''}</div>`,
    montar: raiz => {
      if (S.sub.parametros === 'ir-nomina') { S.sub.parametros = 'negocio'; A.ir('nomina/reglas'); return; }
      if (S.sub.parametros === 'ir-fiscal') { S.sub.parametros = 'negocio'; A.ir('fiscal/config'); return; }
      raiz.querySelectorAll('[data-af]').forEach(ch => ch.addEventListener('change', () => {
        const r = P.antifraude.find(x => x.id === ch.dataset.af);
        const hacer = () => { r.activa = ch.checked; A.auditar({ modulo: 'Parámetros', registro: 'Alerta: ' + r.nombre, campo: 'activa', antes: ch.checked ? 'no' : 'sí', despues: ch.checked ? 'sí' : 'no' }); A.pintarPagina(); A.aviso(ch.checked ? 'Alerta encendida.' : 'Alerta apagada.'); };
        if (!ch.checked) A.pedirCodigo('Apagar la alerta «' + r.nombre + '».').then(hacer).catch(() => { ch.checked = true; }); else hacer();
      }));
    },
  };
  FICHAS.param = clave => {
    const N = P.negocio; const s = P.sedes[0];
    let etq, obj, k = 'valor', tipo = 'texto', nota = '', sensible = false, set, soloDueno = false;
    const [g, i] = clave.split('-');
    const arr = { leg: P.legales, ali: P.alicuotas, met: P.metodos, tmov: P.tiposMov, reg: P.reglas, av: P.avisos }[g];
    // los costos fijos los pone el dueño (decidido): nadie más los cambia, aunque edite parámetros
    if (clave === 'costos') { etq = 'Costos fijos del mes'; obj = { valor: P.costosFijos }; tipo = 'dinero'; set = v => { P.costosFijos = v; }; nota = 'La meta del día se recalcula sola con este número.'; soloDueno = true; }
    else if (g === 'n') { const map = { nombre: 'nombre', razon: 'razon', rif: 'rif', espec: 'espec', zona: 'zona', moneda: 'monedaBase', carta: 'carta' }; etq = { nombre: 'Nombre', razon: 'Razón social', rif: 'RIF', espec: 'Contribuyente especial', zona: 'Zona horaria', moneda: 'Moneda base', carta: 'Precios de la carta en' }[i]; obj = N; k = map[i]; sensible = i === 'rif'; }
    else if (g === 's') { etq = i === 'corte' ? 'Hora de corte del día' : 'Sede'; obj = s; k = i === 'corte' ? 'corte' : 'nombre'; nota = i === 'corte' ? 'Cada registro guarda su día al nacer: cambiar la hora no reescribe la historia.' : ''; }
    else if (g === 't') { etq = { fuente: 'De dónde salen', respaldo: 'Si no llegan', usdt: 'USDT', finde: 'Fines de semana y feriados' }[i]; obj = P.tasas; k = i; }
    else if (g === 'cat') { etq = 'Categoría'; obj = { valor: P.categorias[i] }; set = v => { P.categorias[i] = v; }; }
    else if (arr) { etq = arr[i][0]; obj = { valor: arr[i][1] }; set = v => { arr[i][1] = v; }; if (g === 'leg') nota = 'Vigente ' + arr[i][2] + '. Al cambiarlo, se cierra esta vigencia y empieza una nueva hoy.'; }
    const soloLee = soloDueno && !puede('parametros', 'aprobar');
    return { titulo: etq, sub: 'Parámetro', mod: 'parametros', obj, registro: 'Parámetro: ' + etq,
      bloques: [{ filas: [{ l: 'Valor', v: tipo === 'dinero' ? dinero(obj[k], 'usd', 0) : esc(obj[k]), campo: soloLee ? undefined : { k, tipo, sensible } }, { l: 'Último cambio', v: '3 oct · Alejandro' }] }]
        .concat(soloLee ? [{ html: `<p class="nota gris">${ic('candado', 's')}<span><b>Solo lo cambia el dueño.</b> Los costos fijos los pone Alejandro: si cambiaron, avísale.</span></p>` }] : [])
        .concat(nota ? [{ html: `<p class="muted">${esc(nota)}</p>` }] : []),
      alGuardar: cambios => { if (set) set(cambios[0].nuevo); } };
  };

  /* =============== REGISTRO DE CAMBIOS =============== */
  PANT.auditoria = {
    titulo: 'Registro de cambios', corto: 'Registro de cambios', grupo: 'Sistema', icono: 'auditoria', mod: 'auditoria',
    render: (sub = 'cambios') => {
      let cuerpo = '';
      if (sub === 'cambios') cuerpo = A.filtros('t-aud', null, null, 'Buscar por persona, módulo o registro') + A.tabla({ id: 't-aud', cols: [{ t: 'Cambio', cls: 'p' }, { t: 'Quién', cls: 'x' }, { t: 'Antes', cls: 'x' }, { t: 'Después', cls: 'r' }, { t: 'Cuándo', cls: 'e' }],
        filas: D.AUDITORIA.map(a => ({ abrir: 'cambio:' + a.id, celdas: [`<b>${esc(a.modulo)} · ${esc(a.registro)}</b><small>${esc(a.campo)}${a.motivo ? ' · «' + esc(a.motivo) + '»' : ''}</small>`, esc(a.quien) + (a.tipoActor !== 'persona' ? ' ' + tag('Bot', 'lila') : ''), esc(a.antes), esc(a.despues), `<span class="muted nowrap">${esc(a.cuando)}</span>`] })) });
      if (sub === 'accesos') cuerpo = A.tabla({ cols: [{ t: 'Qué pasó', cls: 'p' }, { t: 'Dónde', cls: 'x' }, { t: 'Cuándo', cls: 'e' }], filas: D.ACCESOS.map(a => ({ celdas: [`<b>${esc(a.quien)}</b><small>${esc(a.que)}</small>`, esc(a.donde), `<span class="muted nowrap">${esc(a.cuando)}</span>`], clase: a.quien === '¿?' ? '' : '' })) }) + `<p class="muted">Entradas, códigos reseteados, exportaciones y cada descarga de un archivo sensible.</p>`;
      if (sub === 'alertas') cuerpo = `<ul class="lista">
        <li><button class="fila" data-abrir="usuario:jose"><span class="lead alerta">${ic('alerta')}</span><span class="medio"><b>3 claves malas para la cuenta de Jose</b><small>Jue 1 oct 22:41 · desde una IP desconocida · la cuenta no llegó a bloquearse</small></span>${tag('Por revisar', 'aviso')}</button></li>
        <li><button class="fila" data-abrir="proveedor:p4"><span class="lead aviso">${ic('escudo')}</span><span class="medio"><b>Cambio de cuenta de Hortalizas El Valle</b><small>Jue 1 oct 11:02 · Jose, con código · avisado a Alejandro</small></span>${tag('Por verificar', 'aviso')}</button></li>
        <li><div class="fila"><span class="lead ok">${ic('check')}</span><span class="medio"><b>Billete desconocido en la bóveda</b><small>Vie 2 oct · era un serial mal leído; Jose lo corrigió</small></span>${tag('Resuelta', 'ok')}</div></li></ul>`;
      return `<div class="pagina">${A.cab('Nada se borra', 'Registro de cambios', 'Cada cambio con quién, cuándo, el valor anterior y el nuevo. Lo escribe la propia base de datos: nadie lo puede editar, ni siquiera el dueño.')}
        ${A.subnav([['cambios', 'Cambios', D.AUDITORIA.length, true], ['accesos', 'Accesos'], ['alertas', 'Alertas', 2]], sub)}${cuerpo}</div>`;
    },
  };

  /* =============== SALUD DEL SISTEMA =============== */
  PANT.salud = {
    titulo: 'Salud del sistema', corto: 'Salud del sistema', grupo: 'Sistema', icono: 'salud', mod: 'salud',
    cuenta: () => D.SALUD.filter(h => h.estado !== 'ok').length,
    render: () => `<div class="pagina">${A.cab('¿Está todo funcionando?', 'Salud del sistema', 'Cada pieza se revisa sola. Si algo se cae, suena una alarma en el teléfono de Alejandro, no un correo que nadie lee.')}
      <div class="cifras">${D.SALUD.map(h => `<button class="cifra ${h.estado === 'ok' ? '' : 'aviso'}" data-abrir="salud:${h.id}"><span class="etq">${esc(h.nombre)}</span><b style="font-size:19px;display:flex;align-items:center;gap:6px;color:var(--${h.estado === 'ok' ? 'ok' : 'aviso'})">${ic(h.estado === 'ok' ? 'check' : 'alerta', 's')}${h.estado === 'ok' ? 'Bien' : 'Mirar'}</b><small>${esc(h.detalle)}</small></button>`).join('')}</div>
      <div class="rejilla"><div class="c6"><article class="hoja"><h2>Qué tan frescos están los datos</h2><dl class="kv">${D.FRESCURA.map(f => `<div><dt>${esc(f[0])}</dt><dd>${tag(f[1], f[2] === 'gris' ? '' : f[2])}</dd></div>`).join('')}</dl></article></div>
      <div class="c6"><article class="hoja"><div class="hoja-cab"><h2>Recargas del saldo de IA</h2>${A.boton('salud', 'Anotar una recarga', 'data-acc="pronto"', { tono: 'ghost', icono: 'mas', chico: true, permiso: 'ver' })}</div><dl class="kv"><div><dt>14 sep</dt><dd>US$ 30</dd></div><div><dt>Gasto promedio</dt><dd>≈ US$ 0,70 por día</dd></div><div><dt>Alcanza hasta</dt><dd>≈ 26 de octubre</dd></div></dl></article></div></div></div>`,
  };
  FICHAS.salud = id => {
    const h = D.SALUD.find(x => x.id === id);
    return { titulo: h.nombre, sub: 'Salud del sistema · revisado ' + esc(h.hace), mod: 'salud', tags: [[h.estado === 'ok' ? 'Bien' : 'Mirar', h.estado === 'ok' ? 'ok' : 'aviso']],
      bloques: [{ html: `<p>${esc(h.detalle)}</p>` }, { titulo: 'Últimas revisiones', tiempo: [['Ahora', h.estado === 'ok' ? 'Bien.' : esc(h.detalle), h.estado === 'ok' ? 'ok' : 'aviso'], ['Hace 5 min', 'Bien.', 'ok'], ['Hace 10 min', 'Bien.', 'ok']] }] };
  };
})();
