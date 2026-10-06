/* Piezas comunes de las pantallas. */
(() => {
  const A = window.APP; const { esc, ic, puede, quienEdita } = A;
  A.f = {}; // filtros por pantalla

  // en el teléfono la explicación va en una línea, con «más» para leerla entera (en el iPad y la computadora se lee completa)
  A.cab = (kicker, titulo, desc = '', acciones = '') => {
    const id = 'desc-' + (A.S.ruta || 'pagina');
    const d = !desc ? '' : A.textoPlano(desc).length > 56
      ? `<div class="desc-env"><p class="desc recogible" id="${id}">${desc}</p><button type="button" class="enlace desc-mas" data-acc="desc-mas" aria-expanded="false" aria-controls="${id}">más</button></div>`
      : `<p class="desc">${desc}</p>`;
    return `<header class="cabeza"><div>${kicker ? `<p class="kicker">${kicker}</p>` : ''}<h1>${esc(titulo)}</h1>${d}</div>${acciones ? `<div class="cabeza-acc">${acciones}</div>` : ''}</header>`;
  };
  A.ACC['desc-mas'] = (arg, el) => {
    const p = el && document.getElementById(el.getAttribute('aria-controls')); if (!p) return;
    const ab = p.classList.toggle('abierta'); el.setAttribute('aria-expanded', String(ab)); el.textContent = ab ? 'menos' : 'más';
  };

  // botón que respeta permisos, con la misma regla que la ficha al guardar y que la acción al tocarla (A.regla):
  // · a quien solo mira el módulo no se le muestra: ya tiene el ojo y la nota de solo lectura
  // · a quien edita pero no tiene ese permiso (por ejemplo, aprobar), sale con candado y, al tocarlo, dice quién lo hace
  // · plata: lo que mueve plata, hecho por un aprendiz, lleva debajo, en chico, quién lo aprueba (el formulario que abre termina en «Enviar para aprobar»)
  A.boton = (mod, txt, attrs, { tono = 'pri', icono = '', permiso = 'editar', chico = false, plata = false } = {}) => {
    const r = A.regla({ mod, permiso, plata });
    if (r.modo === 'oculto' || r.modo === 'leer') return '';
    if (r.modo === 'candado') return `<button class="btn bloq${chico ? ' chico' : ''}" data-acc="sin-permiso" data-arg="${mod}|${permiso}" aria-disabled="true">${ic('candado', 's')}${esc(txt)}</button>`;
    const btn = `<button class="btn ${tono}${chico ? ' chico' : ''}" ${attrs}>${icono ? ic(icono, 's') : ''}${esc(txt)}</button>`;
    return r.modo === 'aprobar' ? `<span class="btn-con-nota">${btn}<small class="btn-nota">Lo aprueba ${esc(r.quien)}</small></span>` : btn;
  };
  A.ACC['sin-permiso'] = arg => { const [mod, permiso] = String(arg).split('|'); A.aviso(A.porQueNo(A.regla({ mod, permiso })), 'info'); };

  /* ---------- decisiones de un toque: «Deshacer» 10 segundos y, después, «Reabrir» ----------
     Lo que se decide con un toque y cambia el cuadre o la nómina (aclarar una diferencia del banco, la duda del lote, un redoble, una falta,
     lo acordado en horas que no cuadran, llegó la reposición, llegó o no vino) sigue de un toque. Durante 10 segundos queda «Deshacer», sin
     motivo; después, la ficha trae «Reabrir»: pide un motivo de un toque y el sello de la decisión queda tachado, a la vista (no se borra).
     Es la misma pieza en todas: k es la clave de lo decidido ('falta:fa1') y deshacer, lo que lo deja como estaba. Cada decisión guarda su
     propio «Deshacer»: tomar otra antes de los 10 segundos no le quita el suyo a la primera.
     El botón lleva data-ut con la clave de su decisión (así cada uno cuenta sus segundos) y el «Reabrir» que lo reemplaza, data-reabrir con
     la misma clave (ahí vuelve el teclado a los 10 segundos). */
  const UT = new Map(); let utIv = null; let utUltima = null; // clave → { hasta, t, deshacer }
  A.UT_MS = 10000;
  A.deshacible = k => { const u = UT.get(k); return !!u && Date.now() < u.hasta; };
  // los segundos que le quedan a una decisión (sin clave, a la última que se tomó)
  A.quedanUT = k => { const u = UT.get(k || utUltima); return u ? Math.max(0, Math.ceil((u.hasta - Date.now()) / 1000)) : 0; };
  const contar = () => { document.querySelectorAll('[data-ut] .quedan').forEach(n => { const b = n.closest('[data-ut]'); n.textContent = A.quedanUT(b && b.dataset.ut); }); if (!UT.size) { clearInterval(utIv); utIv = null; } };
  A.unToque = (k, deshacer) => {
    const viejo = UT.get(k); if (viejo) clearTimeout(viejo.t);
    const u = { hasta: Date.now() + A.UT_MS, deshacer }; UT.set(k, u); utUltima = k;
    // la cuenta atrás de cada botón, sin volver a dibujar nada
    if (!utIv) utIv = setInterval(contar, 250);
    // a los 10 segundos, donde se veía su «Deshacer» queda «Reabrir» (solo se vuelve a dibujar lo que lo mostraba: un formulario a medias no se toca)
    u.t = setTimeout(() => vencer(k, u), A.UT_MS);
  };
  // se acabaron los 10 segundos de una decisión (la prueba automática lo llama sin esperar: A.vencerUT)
  const vencer = (k, u) => {
    if (UT.get(k) !== u) return; clearTimeout(u.t); UT.delete(k); if (utUltima === k) utUltima = null;
    const a = document.activeElement; const enDeshacer = !!(a && a.matches && a.matches('[data-ut]') && (a.dataset.ut === k || !a.dataset.ut));
    const suyo = raiz => `${raiz} [data-ut="${CSS.escape(k)}"], ${raiz} [data-ut=""]`;
    if (A.S.ficha && !A.S.ficha.editando && document.querySelector(suyo('#ficha-raiz'))) A.pintarFicha();
    if (document.querySelector(suyo('#main'))) A.pintarPagina();
    if (enDeshacer) { const r = document.querySelector(`#ficha-raiz [data-reabrir="${CSS.escape(k)}"], #main [data-reabrir="${CSS.escape(k)}"]`) || document.querySelector('#ficha-raiz [data-reabrir], #main [data-reabrir]'); if (r) r.focus({ preventScroll: true }); }
  };
  A.vencerUT = k => { const u = UT.get(k); if (u) vencer(k, u); };
  // deshace una decisión de un toque, si todavía está a tiempo (si no, devuelve false y quien llama dice que use «Reabrir»)
  A.deshacerUT = k => { if (!A.deshacible(k)) return false; const u = UT.get(k); clearTimeout(u.t); UT.delete(k); if (utUltima === k) utUltima = null; if (u.deshacer) u.deshacer(); return true; };
  // el botón «Deshacer» de una ficha, con su cuenta atrás (que no se lee en voz alta: el botón se llama «Deshacer»), y el «Reabrir» que lo reemplaza
  // k: la clave de la decisión (la de A.unToque), para que el botón cuente sus propios segundos
  A.accDeshacer = (acc, arg, k = '') => ({ txt: 'Deshacer', html: `Deshacer<span aria-hidden="true">· <span class="quedan">${A.quedanUT(k)}</span> s</span>`, acc, arg, tono: 'pri', icono: 'refrescar', ut: k || true });
  A.accReabrir = (acc, arg, k = '') => ({ txt: 'Reabrir', acc, arg, tono: 'sec', icono: 'refrescar', reabrir: k || true });
  // el sello de lo que se reabre queda tachado en la ficha (y el registro de cambios guarda el motivo)
  A.selloViejo = (obj, txt, rojo = false) => { if (!txt) return; (obj.sellosViejos = obj.sellosViejos || []).push({ txt, rojo, fecha: '05 OCT ' + A.D.HOY.hora }); };
  // «Reabrir»: el motivo es de un toque; «Otro…» abre el cuadro para escribirlo
  A.pedirReabrir = ({ titulo, texto = '', opciones = ['Me equivoqué de botón', 'Llegó el comprobante'] }) => new Promise((ok, no) => {
    const env = A.modal(`<h2 id="modal-t">${esc(titulo)}</h2>${texto ? `<p class="muted" id="modal-d">${texto}</p>` : ''}
      <p class="etq" id="ra-t">¿Por qué?</p>
      <div class="reabrir-ops" role="group" aria-labelledby="ra-t">${opciones.map(o => `<button type="button" class="btn sec" data-ra="${esc(o)}">${esc(o)}</button>`).join('')}<button type="button" class="btn sec" data-ra="" aria-expanded="false" aria-controls="ra-campo">Otro…</button></div>
      <label class="campo" for="ra-txt" id="ra-campo" hidden><span>Escribe por qué</span><textarea id="ra-txt" placeholder="Queda en el registro de cambios."></textarea><small class="ayuda" id="ra-msg"></small></label>
      <div class="modal-acc"><button class="btn sec" data-m="no">Cancelar</button><button class="btn pri" data-m="si" hidden>${ic('refrescar', 's')}Reabrir</button></div>`, 'teclado');
    const primero = env.querySelector('[data-ra]'); if (primero) primero.focus();
    env.addEventListener('click', e => {
      const o = e.target.closest('[data-ra]');
      if (o && o.dataset.ra) { A.cerrarModal(); ok(o.dataset.ra); return; }
      if (o) { o.setAttribute('aria-expanded', 'true'); env.querySelector('#ra-campo').hidden = false; env.querySelector('[data-m="si"]').hidden = false; env.querySelector('#ra-txt').focus(); return; }
      const b = e.target.closest('[data-m]'); if (!b) return;
      if (b.dataset.m === 'no') { A.cerrarModal(); no(); return; }
      const m = env.querySelector('#ra-txt').value.trim();
      if (m.length < 4) { A.faltan(env, [[true, 'ra-txt', 'Escribe por qué se reabre: queda en el registro de cambios.']]); return; }
      A.cerrarModal(); ok(m);
    });
  });

  /* ---------- lo que falta en un formulario ----------
     El error va debajo de su campo, en rojo, como en la ventana del motivo; la pantalla baja al primer campo que falta y el cursor queda ahí.
     lista: [[falta (true/false), id del campo, lo que hay que hacer]] · devuelve true si faltaba algo (y no hay que seguir) */
  const suaveA = () => (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  A.limpiarFaltas = raiz => A.$$('.campo.error', raiz).forEach(x => { x.classList.remove('error'); const m = x.querySelector('.error-msg'); if (m) m.remove(); A.$$('[aria-invalid]', x).forEach(i => i.removeAttribute('aria-invalid')); });
  A.faltan = (raiz, lista) => {
    A.limpiarFaltas(raiz);
    const faltan = lista.filter(x => x[0]); if (!faltan.length) return false;
    faltan.forEach(([, id, msg]) => {
      // la caja del campo: la etiqueta .campo, o la que envuelve una zona para soltar archivos (.campo.soltar-env)
      const el = document.getElementById(id); if (!el) return;
      const caja = el.classList.contains('campo') ? el : el.closest('.campo'); if (!caja) return;
      caja.classList.add('error'); caja.insertAdjacentHTML('beforeend', `<small class="ayuda error-msg" id="err-${esc(id)}">${esc(msg)}</small>`);
      const inp = el.matches('input, select, textarea, button') ? el : el.querySelector('input, select, textarea, button');
      if (inp) { inp.setAttribute('aria-invalid', 'true'); inp.setAttribute('aria-describedby', ((inp.getAttribute('aria-describedby') || '').replace(/\s*err-\S+/g, '') + ' err-' + id).trim()); }
    });
    // la casilla escondida de un archivo también recibe el cursor: su zona punteada se marca y Enter abre la cámara o los archivos
    const el = document.getElementById(faltan[0][1]); if (!el) return true;
    const activo = x => !!x && !x.disabled && x.getAttribute('aria-disabled') !== 'true';
    // en un grupo que se recorre con las flechas (los días del calendario), si el que tiene el turno no se puede elegir (hoy descansa), el turno
    // pasa al primero que sí: el cursor va a un día, no a «Mes anterior» o «Mes siguiente»
    const turno = () => { const t = el.querySelector('[tabindex="0"]'); if (!t || !t.parentElement) return null; const grupo = [...t.parentElement.querySelectorAll(':scope > [tabindex]')]; const sig = grupo.find(activo); if (sig) grupo.forEach(x => { x.tabIndex = x === sig ? 0 : -1; }); return sig || null; };
    const destino = el.matches('input, select, textarea, button') ? el : [...el.querySelectorAll('[tabindex="0"]')].find(activo) || turno() || [...el.querySelectorAll('input, select, textarea, button')].find(activo) || el;
    (destino.closest('.campo') || destino).scrollIntoView({ block: 'center', behavior: suaveA() });
    destino.focus({ preventScroll: true });
    return true;
  };

  /* ---------- la foto que se eligió: su miniatura y «Cambiar» ----------
     una casilla de archivo con data-mini muestra, en su zona punteada, la miniatura de la foto (o el ícono del PDF), el nombre y «Cambiar» */
  // lo de adentro de la zona con un archivo ya elegido (también lo usa un formulario que se vuelve a dibujar y guardó el nombre y la miniatura)
  A.miniHtml = (nombre, url = '', img = true, mas = 0) => `${img && url ? `<img class="mini-foto" src="${esc(url)}" alt="">` : `<span class="mini-foto icono">${ic(img ? 'imagen' : 'archivo')}</span>`}<span><b>${esc(nombre)}${mas ? ` <small class="tenue">y ${mas} más</small>` : ''}</b><span class="mini-cambiar">${ic('refrescar', 'xs')}Cambiar</span></span>`;
  A.urlDe = f => { try { return /^image\//.test(f.type || '') && window.URL && URL.createObjectURL ? URL.createObjectURL(f) : ''; } catch (_) { return ''; } };
  A.miniatura = inp => {
    const l = inp && inp.id ? document.querySelector(`label.soltar[for="${CSS.escape(inp.id)}"]`) : null; if (!l || !inp.files || !inp.files.length) return;
    const f = inp.files[0]; const img = /^image\//.test(f.type || '');
    l.classList.add('lista', 'con-mini'); l.innerHTML = A.miniHtml(f.name, A.urlDe(f), img, inp.files.length - 1);
    const c = l.closest('.campo.error'); if (c) { c.classList.remove('error'); const m = c.querySelector('.error-msg'); if (m) m.remove(); }
  };
  document.addEventListener('change', e => { const t = e.target; if (t && t.matches && t.matches('input[type="file"][data-mini]')) A.miniatura(t); });

  // tachado: lo que dejó de valer (un lote aprobado que se reabrió para cambiarlo) queda a la vista, con una raya encima
  A.sello = (txt, { rojo = false, recien = false, fecha = '', tachado = false } = {}) => `<span class="sello${rojo ? ' rojo' : ''}${recien ? ' recien' : ''}${tachado ? ' tachado' : ''}" role="img" aria-label="${tachado ? 'Sello tachado, ya no vale' : 'Sello'}: ${esc(txt)}${fecha ? ' · ' + esc(fecha) : ''}">${esc(txt)}${fecha ? `<small>${esc(fecha)}</small>` : ''}</span>`;

  A.lectura = mod => puede(mod, 'editar') ? '' : `<p class="nota gris">${ic('ojo', 's')}<span><b>Solo lectura.</b> Puedes abrir y ver todo; los cambios los hace ${esc(quienEdita(mod))}.</span></p>`;

  // [sub, nombre, cuenta, gris, corto] · con «corto», la computadora muestra el nombre corto para que quepan todas («IVA» por «Hoja de IVA»)
  // en el teléfono, un módulo con 4 secciones o más no las pone en una fila que se desliza (no caben: la última quedaba escondida a la derecha,
  // como en Personal, Ausencias o Préstamos): un botón «Sección: Lo que vence ▾» abre la lista
  // completa, siempre en el mismo orden y cada una con su número; el botón suma lo pendiente de las secciones que no se ven
  // (los enlaces «ir-…» a otra pantalla, como «Nómina →» en Parámetros, van aparte, debajo de la lista)
  A.subnav = (items, actual) => {
    const xs = items.filter(Boolean);
    const nav = `<nav class="subnav" aria-label="Secciones">${xs.map(([k, t, n, gris, corto]) => `<button data-sub="${k}" aria-current="${k === actual}">${corto ? `<span class="sn-largo">${esc(t)}</span><span class="sn-corto">${esc(corto)}</span>` : esc(t)}${n ? `<span class="cuenta${gris ? ' gris' : ''}">${n}</span>` : ''}</button>`).join('')}</nav>`;
    const secs = xs.filter(x => !String(x[0]).startsWith('ir-')), links = xs.filter(x => String(x[0]).startsWith('ir-'));
    if (secs.length < 4) return nav;
    const cur = secs.find(x => x[0] === actual) || secs[0];
    // lo pendiente de las otras secciones (los números en gris, como las preguntas abiertas, solo cuentan si no hay nada más)
    const otras = secs.filter(x => x !== cur && +x[2]); const urg = otras.filter(x => !x[3]); const gris = !urg.length; const suma = (gris ? otras : urg).reduce((s, x) => s + +x[2], 0);
    const id = 'secs-' + (A.S.ruta || 'pagina');
    const fila = (x, i) => `<li><button type="button" data-acc="sec-ir" data-arg="${esc(x[0])}" aria-current="${x[0] === cur[0]}"><span class="sec-n" aria-hidden="true">${i + 1}</span><span class="sec-t">${esc(x[1])}</span>${+x[2] ? `<span class="cuenta${x[3] ? ' gris' : ''}">${x[2]}<span class="sr-only"> pendientes</span></span>` : ''}${x[0] === cur[0] ? ic('check', 's') : ''}</button></li>`;
    return `<div class="secciones muchas">${nav}<div class="sec-tel">
      <button type="button" class="sec-boton" data-acc="sec-lista" aria-expanded="false" aria-controls="${id}"><span class="sec-boton-t">Sección: <b>${esc(cur[1])}</b></span>${suma ? `<span class="cuenta${gris ? ' gris' : ''}">${suma}<span class="sr-only"> pendientes en las otras secciones</span></span>` : ''}${ic('abajo', 's')}</button>
      <div class="sec-panel" id="${id}" hidden><ol class="sec-lista" aria-label="Secciones">${secs.map(fila).join('')}</ol>${links.length ? `<p class="sec-otras"><span>También en otra pantalla:</span>${links.map(x => `<button type="button" class="enlace" data-acc="sec-ir" data-arg="${esc(x[0])}">${esc(x[1])}</button>`).join('')}</p>` : ''}</div></div></div>`;
  };
  // abrir o cerrar la lista de secciones (sin volver a dibujar): al abrir, el teclado va a la sección elegida; Escape la cierra
  const cerrarSecciones = (volver = false) => {
    const p = document.querySelector('#main .sec-panel:not([hidden])'); if (!p) return false;
    const b = document.querySelector(`#main [aria-controls="${CSS.escape(p.id)}"]`); p.hidden = true;
    if (b) { b.setAttribute('aria-expanded', 'false'); if (volver) b.focus({ preventScroll: true }); }
    return true;
  };
  A.ACC['sec-lista'] = (arg, el) => {
    const p = el && document.getElementById(el.getAttribute('aria-controls')); if (!p) return;
    const abrir = p.hidden; p.hidden = !abrir; el.setAttribute('aria-expanded', String(abrir));
    if (abrir) { const c = p.querySelector('[aria-current="true"]') || p.querySelector('button'); if (c) c.focus({ preventScroll: true }); }
  };
  // escoger una sección de la lista: se dibuja esa sección y el teclado vuelve al botón «Sección: …»
  A.ACC['sec-ir'] = sub => A.antesDeSalir(() => {
    A.S.sub[A.S.ruta] = sub; A.pintarPagina();
    const b = document.querySelector('#main .sec-boton'); if (b && b.getClientRects().length) b.focus({ preventScroll: true });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !document.querySelector('#modal-raiz > *, #ficha-raiz > *, #buscador-raiz > *') && cerrarSecciones(true)) e.preventDefault(); });

  /* ---------- la suma de libro ----------
     Cada renglón con su signo en el margen (+, −, =), lo que es y su cifra a la derecha; el total, con doble subrayado. plata: la columna de
     la cifra lleva la raya roja del libro (solo cuando son montos; un porcentaje no la lleva). Cada renglón se abre (abrir) y dice cómo se
     calcula · filas: [{ signo, t (html), sub (html), v (html), abrir, clase: 'total' | 'rojo' }] */
  const SIGNO = { '+': 'más', '−': 'menos', '=': 'igual a' };
  A.sumaLibro = (filas, { plata = false, etiqueta = '' } = {}) => `<ol class="suma-libro${plata ? ' plata' : ''}"${etiqueta ? ` aria-label="${esc(etiqueta)}"` : ''}>${filas.filter(Boolean).map(f => {
    const dentro = `<span class="sl-signo">${f.signo ? `<span aria-hidden="true">${f.signo}</span><span class="sr-only">${SIGNO[f.signo] || ''} </span>` : ''}</span><span class="sl-t">${f.t}${f.sub ? `<small>${f.sub}</small>` : ''}</span><span class="sl-v">${f.v}</span>${f.abrir ? ic('derecha', 's chev') : '<span></span>'}`;
    return `<li class="${f.clase || ''}">${f.abrir ? `<button type="button" class="sl-fila" data-abrir="${esc(f.abrir)}">${dentro}</button>` : `<div class="sl-fila">${dentro}</div>`}</li>`;
  }).join('')}</ol>`;

  /* ---------- las opciones de un formulario ----------
     Una lista hacia abajo, nunca una fila que se desliza de lado (Bóveda › Sacar y Meter, el tipo de préstamo): cada opción a lo ancho,
     con su línea de abajo si la tiene; la escogida lleva su ✓ y el borde de tinta (no solo un color) · items: [{ k, t, sub, attrs }] */
  A.opciones = ({ etiqueta, items, actual }) => `<div class="opciones" role="group" aria-label="${esc(etiqueta)}">${items.map(o => `<button type="button" ${o.attrs || ''} aria-pressed="${o.k === actual}"><span class="op-marca" aria-hidden="true">${o.k === actual ? ic('check', 'xs') : ''}</span><span class="op-t">${esc(o.t)}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</span></button>`).join('')}</div>`;

  /* ---------- cada monto en su moneda ----------
     Lo fiscal va en bolívares, como se declara; cada cuenta del banco en su moneda, como su estado de cuenta; proveedores y pagos en la
     moneda del trato. Debajo de cada cifra en bolívares, en letra chica, su «≈ $»:
     · { tasa }: la tasa guardada del día del documento (una factura, un Z, una retención, un movimiento del banco): así coincide con Proveedores
     · { usd }: la suma ya hecha de varios documentos, cada uno a su tasa
     · { hoy: true }: lo que falta por pagar, a la tasa de hoy, y lo dice («a la tasa de hoy»)
     · { estimado: true }: todavía es un cálculo (queda fijo al declararse) y lo dice delante
     · { linea: true }: dentro de una frase (un movimiento de la cuenta), al lado de la cifra y no debajo
     El ≈ $ de un documento lleva céntimos, como en Proveedores; el de hoy, desde 100 $, va sin céntimos: es un estimado. Una cifra en cero no lo lleva. */
  A.equiv = (bs, { tasa = null, usd = null, hoy = false, estimado = false, linea = false } = {}) => {
    const u = bs === null || bs === undefined || !+bs ? null : usd !== null ? usd : hoy ? bs / A.D.TASA.usd : tasa ? bs / tasa : null;
    const cl = 'equiv' + (linea ? ' en-linea' : '');
    if (u === null) return estimado ? `<small class="${cl}">estimado</small>` : '';
    return `<small class="${cl}">${estimado ? 'estimado · ' : ''}≈\u00a0${A.dinero(u, 'usd', hoy && Math.abs(u) >= 100 ? 0 : 2)}${hoy ? ' a la tasa de hoy' : ''}</small>`;
  };
  // la cifra en Bs con su ≈ $ debajo · <span class="m"> lleva la cifra sola (la que se compara y se copia); la línea chica va aparte
  A.bs = (bs, op = {}) => { const m = `<span class="m">${A.dinero(bs, 'bs', op.d)}</span>`; const e = A.equiv(bs, op); return e ? `<span class="doble">${m}${e}</span>` : m; };
  // la moneda de una columna, para su encabezado en la computadora («Base (Bs)»): en el teléfono la tabla es de tarjetas y cada cifra lleva la suya
  A.monCorta = mon => ({ bs: 'Bs', usd: '$', eur: '€', usdt: 'USDT' }[mon] || '');

  A.cifra = ({ etq, valor, sub = '', abrir = '', ir = '', acc = '', arg = '', tono = '' }) => {
    const attr = abrir ? `data-abrir="${abrir}"` : ir ? `data-ir="${ir}"` : acc ? `data-acc="${acc}" data-arg="${arg}"` : '';
    const el = attr ? 'button' : 'div';
    // una cifra larga (un monto en bolívares) lleva «larga»: en el teléfono su letra es un poco más chica, para que no se corte
    const larga = A.textoPlano(String(valor)).length > 11 ? ' larga' : '';
    return `<${el} class="cifra ${tono}${larga}" ${attr}><span class="etq">${esc(etq)}</span><b>${valor}</b>${sub ? `<small>${sub}</small>` : ''}</${el}>`;
  };

  // tabla: en computadora es tabla; en teléfono cada fila es una ficha (clases p, r, e, s, x)
  // r alinea a la derecha (en el teléfono, arriba a la derecha) · plata lleva la raya roja del libro: solo en las columnas de plata
  A.tabla = ({ id = '', cols, filas, pie = null, vacio = 'No hay nada por aquí.' }) => {
    const abre = filas.some(f => f.abrir || f.ir);
    if (!filas.length) return `<div class="hoja"><p class="muted">${esc(vacio)}</p></div>`;
    return `<div class="hoja plana"><div class="tabla-env"><table class="t fichas" ${id ? `id="${id}"` : ''}>
      <thead><tr>${cols.map(c => `<th class="${c.cls || ''}" scope="col">${c.t ? esc(c.t) : c.sr ? `<span class="sr-only">${esc(c.sr)}</span>` : ''}</th>`).join('')}${abre ? '<th class="chev-c"><span class="sr-only">Abrir</span></th>' : ''}</tr></thead>
      <tbody>${filas.map(f => `<tr ${f.abrir ? `data-abrir="${f.abrir}" tabindex="0"` : f.ir ? `data-ir="${f.ir}" tabindex="0"` : ''} class="${f.clase || ''}" data-txt="${esc((f.txt || '').toLowerCase())}">${f.celdas.map((c, i) => `<td class="${cols[i].cls || ''}">${c ?? '—'}</td>`).join('')}${abre ? `<td class="chev-c">${ic('derecha', 's')}</td>` : ''}</tr>`).join('')}</tbody>
      ${pie ? `<tfoot><tr>${pie.map((c, i) => `<td class="${cols[i].cls || ''}">${c ?? ''}</td>`).join('')}${abre ? '<td class="chev-c"></td>' : ''}</tr></tfoot>` : ''}
    </table></div></div>`;
  };
  A.filtros = (tablaId, segs = null, actual = null, placeholder = 'Buscar…') => `<div class="filtros">
    ${segs ? `<div class="seg" role="group" aria-label="Filtrar">${segs.map(([k, t, n]) => `<button data-acc="filtro" data-arg="${k}" aria-pressed="${k === actual}">${esc(t)}${n !== undefined ? `<span class="n">${n}</span>` : ''}</button>`).join('')}</div>` : ''}
    <label class="filtro-buscar" for="buscar-${tablaId}">${ic('buscar', 's')}<input id="buscar-${tablaId}" data-filtrar="${tablaId}" placeholder="${esc(placeholder)}" autocomplete="off"></label>
  </div>`;
  A.ACC.filtro = arg => { A.f[A.S.ruta + ':' + (A.S.sub[A.S.ruta] || '')] = arg; A.pintarPagina(); };
  A.filtroActual = (def) => A.f[A.S.ruta + ':' + (A.S.sub[A.S.ruta] || '')] || def;

  // el filtro de una tabla compara sin tildes («nomina» encuentra «Nómina»), como el buscador
  // sin resultados dice «No hay nada con «…»», con «Borrar la búsqueda» (como el buscador de toda la app); mientras se busca, la línea
  // «Se muestran 14 de 49» (data-muestra) se esconde: ya no dice la verdad
  const filtrarTabla = (inp, raiz) => {
    const id = inp.dataset.filtrar; const q = A.sinTildes(inp.value).replace(/\s+/g, ' ').trim(); let n = 0;
    A.$$('#' + id + ' tbody tr', raiz).forEach(tr => { tr.hidden = !!q && !A.sinTildes(tr.dataset.txt + ' ' + tr.textContent).replace(/\s+/g, ' ').includes(q); if (!tr.hidden) n++; });
    const tabla = raiz.querySelector('#' + id); const hoja = tabla ? tabla.closest('.hoja') : null;
    let vacio = raiz.querySelector(`[data-sin="${id}"]`);
    if (q && !n && hoja) {
      if (!vacio) { hoja.insertAdjacentHTML('afterend', `<div class="hoja sin-res" data-sin="${esc(id)}" role="status"><p></p><button type="button" class="btn sec chico" data-acc="borrar-busqueda" data-arg="${esc(id)}">${ic('x', 's')}Borrar la búsqueda</button></div>`); vacio = raiz.querySelector(`[data-sin="${id}"]`); }
      vacio.querySelector('p').textContent = 'No hay nada con «' + inp.value.trim() + '».'; vacio.hidden = false; hoja.hidden = true;
    } else { if (vacio) vacio.hidden = true; if (hoja) hoja.hidden = false; }
    A.$$(`[data-muestra="${id}"]`, raiz).forEach(p => { p.hidden = !!q; });
  };
  A.alMontar = raiz => {
    A.$$('[data-filtrar]', raiz).forEach(inp => inp.addEventListener('input', () => filtrarTabla(inp, raiz)));
    A.deslizar(raiz);
    if (A.redibujarGrafs) A.redibujarGrafs(raiz);
    if (A.focoCalendario) A.focoCalendario(raiz);
  };
  A.ACC['borrar-busqueda'] = id => { const inp = document.querySelector(`[data-filtrar="${CSS.escape(id)}"]`); if (!inp) return; inp.value = ''; inp.dispatchEvent(new Event('input')); inp.focus(); };

  /* ---------- filas que se deslizan: pestañas, filtros y tablas anchas ----------
     · al dibujar la página (y al llegar por un enlace) la pestaña o el filtro elegido queda a la vista, moviendo solo la fila, nunca la página
     · cada fila recuerda dónde quedó entre un toque y otro
     · si hay más, un degradado del color del fondo con «›» en el borde, y «‹» del otro lado cuando ya se desplazó (se tocan para avanzar)
     · una tabla más ancha que la pantalla (el horario, la matriz de permisos, la hoja de IVA) lleva el degradado y «Desliza →» */
  const POS = {}; let ro = null; const vigiladas = new Set();
  const marcarBordes = (w, f) => { const max = f.scrollWidth - f.clientWidth; w.classList.toggle('hay-antes', f.scrollLeft > 2); w.classList.toggle('hay-despues', max - f.scrollLeft > 2); if (f.scrollLeft > 2) w.classList.add('ya-deslizo'); };
  // «Desliza →» va sobre la primera fila de datos, debajo de los encabezados (los de una tabla o los meses del calendario del personal):
  // así no tapa el nombre de ninguna columna · en el diagrama de «Programar vacaciones» va debajo de la fila de la vacación que se programa
  const ponerPista = (w, f) => { const p = w.querySelector('.desliza-pista'); if (!p) return; const propia = f.querySelector('.gantt-fila.propia'); const cab = propia && propia.nextElementSibling ? propia : f.querySelector('thead, .gantt-cab'); const alto = cab ? cab.getBoundingClientRect().bottom - w.getBoundingClientRect().top : 0; p.style.top = (alto > 0 ? Math.round(alto) + 8 : 7) + 'px'; };
  // lleva lo elegido a la vista con un margen para el degradado; si ya se ve entero, no mueve nada
  const aLaVista = f => {
    const el = f.querySelector('[aria-current="true"], [aria-pressed="true"]'); if (!el || f.scrollWidth <= f.clientWidth) return;
    const m = 40; const izq = el.offsetLeft - m, der = el.offsetLeft + el.offsetWidth + m;
    if (izq < f.scrollLeft) f.scrollLeft = Math.max(0, izq); else if (der > f.scrollLeft + f.clientWidth) f.scrollLeft = der - f.clientWidth;
  };
  const suave = () => (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  A.deslizar = raiz => {
    if (!raiz) return;
    // si la fila cambia de ancho (otro formato, la ventana más angosta), lo elegido vuelve a quedar a la vista
    if (!ro && window.ResizeObserver) ro = new ResizeObserver(es => es.forEach(e => { const f = e.target.firstElementChild; if (!f) return; if (!e.target.classList.contains('es-tabla')) aLaVista(f); else ponerPista(e.target, f); marcarBordes(e.target, f); }));
    vigiladas.forEach(w => { if (!w.isConnected) { if (ro) ro.unobserve(w); vigiladas.delete(w); } });
    const enFicha = raiz.id === 'ficha-raiz'; const cuenta = {};
    A.$$('.subnav, .seg, .tabla-env', raiz).forEach(f => {
      if (f.parentElement && f.parentElement.classList.contains('desliza')) return;
      const tipo = f.classList.contains('subnav') ? 'subnav' : f.classList.contains('seg') ? 'seg' : 'tabla';
      const w = document.createElement('div'); w.className = 'desliza es-' + tipo;
      f.replaceWith(w); w.appendChild(f);
      // con el dedo, «Desliza →»; con el ratón, «Más columnas →» (el ratón no desliza)
      w.insertAdjacentHTML('beforeend', tipo === 'tabla' ? '<span class="desliza-sig" aria-hidden="true"><span class="desliza-pista"><span class="con-dedo">Desliza →</span><span class="con-raton">Más columnas →</span></span></span>'
        : '<button type="button" class="desliza-ant" tabindex="-1" aria-hidden="true">‹</button><button type="button" class="desliza-sig" tabindex="-1" aria-hidden="true">›</button>');
      if (tipo === 'tabla') ponerPista(w, f);
      // la clave de la fila: la pantalla (y la pestaña, si la fila está dentro de una), qué fila es y cuántas iguales van antes
      const S = A.S; const nombre = f.getAttribute('aria-label') || tipo;
      const base = (enFicha ? 'ficha:' + (S.ficha ? S.ficha.tipo : '') : S.ruta + (tipo === 'subnav' ? '' : '/' + (S.sub[S.ruta] || ''))) + '|' + tipo + '|' + nombre;
      cuenta[base] = (cuenta[base] || 0) + 1; const clave = base + '|' + cuenta[base];
      if (POS[clave]) f.scrollLeft = POS[clave];
      if (tipo !== 'tabla') aLaVista(f);
      marcarBordes(w, f);
      f.addEventListener('scroll', () => { POS[clave] = f.scrollLeft; marcarBordes(w, f); }, { passive: true });
      // «‹», «›» y «Desliza →» también se tocan (o se les hace clic) para avanzar
      A.$$('button.desliza-ant, button.desliza-sig, .desliza-pista', w).forEach(b => b.addEventListener('click', () => f.scrollBy({ left: (b.classList.contains('desliza-ant') ? -1 : 1) * Math.max(120, f.clientWidth * .7), behavior: suave() })));
      if (ro) { ro.observe(w); vigiladas.add(w); }
    });
  };

  /* ---------- arrastrar archivos a una zona punteada (computadora) ----------
     · toda zona «label.soltar» con su casilla de archivo acepta archivos arrastrados desde una carpeta o desde WhatsApp
     · la zona se marca mientras el archivo pasa por encima; si se suelta fuera de una zona, la app no hace nada (el navegador tampoco lo abre)
     · lo que no es del tipo que pide la zona (una foto donde va un PDF) se avisa y no se sube; una zona con candado dice cómo se cambia */
  const conArchivos = e => !!(e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files'));
  const zonaDe = t => (t && t.closest ? t.closest('.soltar') : null);
  let zonaEncima = null;
  const marcarZona = z => { if (zonaEncima && zonaEncima !== z) zonaEncima.classList.remove('encima'); zonaEncima = z && !z.classList.contains('bloq') ? z : null; if (zonaEncima) zonaEncima.classList.add('encima'); };
  // «image/*,application/pdf», «.xls,.xlsx,.csv»…: lo mismo que deja escoger la casilla
  const acepta = (accept, f) => !accept || accept.split(',').map(x => x.trim().toLowerCase()).filter(Boolean).some(a => a.startsWith('.') ? f.name.toLowerCase().endsWith(a) : a.endsWith('/*') ? (f.type || '').startsWith(a.slice(0, -1)) : (f.type || '') === a);
  const queAcepta = accept => { const a = String(accept || ''); const img = /image/.test(a), pdf = /pdf/.test(a), xls = /xls|csv/.test(a); return [img ? 'fotos' : '', pdf ? 'PDF' : '', xls ? 'Excel' : ''].filter(Boolean).join(' o ').replace(/^fotos o PDF o Excel$/, 'fotos, PDF o Excel') || 'otro tipo de archivo'; };
  document.addEventListener('dragenter', e => { if (!conArchivos(e)) return; e.preventDefault(); marcarZona(zonaDe(e.target)); });
  document.addEventListener('dragover', e => { if (!conArchivos(e)) return; e.preventDefault(); const z = zonaDe(e.target); e.dataTransfer.dropEffect = z && !z.classList.contains('bloq') ? 'copy' : 'none'; marcarZona(z); });
  document.addEventListener('dragleave', e => { if (!conArchivos(e)) return; if (!e.relatedTarget || !document.documentElement.contains(e.relatedTarget)) marcarZona(null); });
  document.addEventListener('drop', e => {
    if (!conArchivos(e)) return; e.preventDefault(); const z = zonaDe(e.target); marcarZona(null);
    if (!z) return; // soltado fuera de una zona: se ignora
    if (z.classList.contains('bloq')) { z.click(); return; }
    const inp = z.htmlFor ? document.getElementById(z.htmlFor) : null; if (!inp || inp.type !== 'file' || inp.disabled) return;
    const fs = [...e.dataTransfer.files].filter(f => acepta(inp.accept, f));
    if (!fs.length) { A.aviso('Ese archivo no va aquí: esta zona recibe ' + queAcepta(inp.accept) + '.', 'info'); return; }
    const dt = new DataTransfer(); (inp.multiple ? fs : fs.slice(0, 1)).forEach(f => dt.items.add(f));
    inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
  });

  A.estadoTag = (est) => {
    const m = {
      confirmado: ['Confirmado', 'ok'], por_confirmar: ['Por confirmar', 'aviso'], avisado: ['Avisado: no cayó', 'alerta'], descartado: ['Descartado', ''],
      abierta: ['Abierta', ''], pagada: ['Pagada', 'ok'], vencida: ['Vencida', 'alerta'], ajustada: ['Corregida', 'info'], parcial: ['Pago parcial', 'aviso'], anulada: ['Anulada', ''],
      al_dia: ['Al día', 'ok'], cuenta_nueva: ['Cuenta por verificar', 'alerta'],
      preparar: ['Por preparar', ''], revision: ['En revisión', 'aviso'], lista: ['Lista para declarar', 'info'], declarada: ['Declarada', 'info'],
      vigente: ['Vigente', 'ok'], por_vencer: ['Por vencer', 'aviso'], vencido: ['Vencido', 'alerta'], en_tramite: ['En trámite', 'info'],
      por_descontar: ['Por descontar', 'aviso'], descontada: ['Descontada', 'ok'], borrador: ['Borrador', ''], emitida: ['Emitida', 'info'], entregada: ['Entregada', 'ok'], enterada: ['Pagada al SENIAT', 'ok'],
      conciliada: ['Conciliada', 'ok'], diferencias: ['Con diferencias', 'aviso'], falta: ['Falta el estado de cuenta', 'alerta'],
      confirmado_z: ['Confirmado', 'ok'], leido: ['Leído, falta confirmar', 'aviso'],
      activo: ['Activo', 'ok'], aprendiz: ['Aprendiz', 'lila'], invitada: ['Invitación enviada', 'info'], por_confirmar_u: ['Por confirmar', 'aviso'], sin_acceso: ['Sin acceso', ''],
      esperando: ['Esperando reposición', 'aviso'], repuesta: ['Repuesta', 'ok'], por_aprobar: ['Por aprobar', 'aviso'], aprobada: ['Aprobada', 'ok'], devuelta: ['Devuelto', ''], revisado: ['Revisado', 'ok'], no_va: ['No va', ''], por_revisar: ['Por revisar', 'aviso'], por_aclarar: ['Por aclarar', 'aviso'],
      ok: ['Al día', 'ok'], atencion: ['Atención', 'aviso'], caido: ['Caído', 'alerta'], revisar: ['Por revisar', 'aviso'], sin_soporte: ['Falta la foto', 'aviso'],
      respondida: ['Respondida', 'ok'], midiendo: ['Midiendo', 'info'], medida: ['Medida', 'ok'],
      reposo: ['De reposo', 'lila'], vacaciones: ['De vacaciones', ''], egresado: ['Egresado', ''], por_justificar: ['Por justificar', 'aviso'], justificada: ['Justificada', 'ok'], justificada_sin: ['Justificada sin soporte', 'aviso'], injustificada: ['Injustificada', 'alerta'],
      causada: ['Por programar', ''], programada: ['Programada', 'info'], disfrutando: ['Disfrutando', 'ok'], disfrutada: ['Disfrutada', 'ok'], en_liquidacion: ['Sale de su liquidación', 'aviso'], rechazado: ['Rechazado', ''], perdonado: ['Perdonado', 'lila'],
      por_repartir: ['Por repartir', 'aviso'], revisada: ['Revisada: falta el visto final', 'aviso'], alertada: ['Sin resolver', 'aviso'], resuelta: ['Resuelta', 'ok'], presupuesto: ['Presupuesto enviado', 'aviso'], confirmada: ['Confirmada', 'ok'], llego: ['Llegó', 'ok'], no_vino: ['No vino', 'alerta'], cancelada: ['Anulada', ''], firmado: ['Firmado', 'ok'], por_firmar: ['Por firmar', 'aviso'],
    };
    const [t, tono] = m[est] || [est, ''];
    return A.tag(t, tono);
  };
  // el resaltador de una cuenta, como en todas partes («Bóveda» y «Caja chica» llevan el del efectivo)
  const CODIGO_CTA = { 'Bóveda': 'BOV', 'Caja chica': 'CCH' };
  A.cta = c => `<span class="acct" data-c="${esc(CODIGO_CTA[c] || c)}">${esc(c)}</span>`;
  // una línea por cuenta con su resaltador y su monto (la ventana del código del lote: BVCA, BVCE y BVCJ con lo que sale de cada una)
  A.porCuenta = pares => pares.map(([c, m]) => `<span class="firma-cta">${A.cta(c)}<span>${A.dinero(m, 'usd')}</span></span>`).join('');
  // copiar un texto; si el navegador no deja, lo deja seleccionado en su sitio (el) para copiarlo a mano
  // completo: lo que se ve está cortado («Orden 4402…118»): antes de seleccionarlo se escribe entero, para que se copie lo que sirve
  A.copiar = (txt, { el = null, ok = 'Copiado.', completo = false } = {}) => {
    const aMano = () => {
      if (el) { if (completo) el.textContent = txt; const rg = document.createRange(); rg.selectNodeContents(el); const s = window.getSelection(); s.removeAllRanges(); s.addRange(rg); }
      A.aviso(el ? 'Texto seleccionado: cópialo con Cmd+C o manteniendo el dedo.' : 'No se pudo copiar. Es: ' + txt, 'info');
    };
    try { navigator.clipboard.writeText(txt).then(() => A.aviso(ok), aMano); } catch (_) { aMano(); }
  };
  // el nombre de un estado sin la etiqueta: el registro de cambios dice «No vino → Llegó», no «no_vino → llego»
  A.estadoTxt = est => A.estadoTag(est).replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  /* gráfico de barras (una serie) · abrir: i => 'tipo:id' hace que cada barra abra su ficha
     Se dibuja al ancho real de su caja (así la letra mide sus 12 px también en el teléfono, no se encoge con el dibujo) y se vuelve a dibujar
     si la caja cambia de ancho · una etiqueta cada «cada» barras, contando desde la última · la cifra de la barra resaltada (la última semana),
     escrita encima en la letra de los títulos · el valor sale al pasar el ratón o, en el teléfono, al tocar una barra (el segundo toque abre
     su ficha) · el lector de pantalla oye la barra más alta y la última, con sus montos */
  A.GRAF = {};
  function dibujarBarras(cfg, W) {
    const { datos, alto = 200, meta = null, etiquetaY = v => v, resaltar = -1, abrir = null, cada = 3, metaTxt = 'Equilibrio', titulo = 'Gráfico de barras', prefijo = '' } = cfg;
    // en una caja angosta la etiqueta de la meta no cabe al lado (taparía barras): la explica el texto de arriba del gráfico
    const angosto = W < 480; const H = alto, L = 46, R = meta && !angosto ? 78 : 8, T = 30, B = 26;
    // escalones redondos (1, 2, 2,5 o 5 × 10ⁿ) para que el eje nombre valores reales
    const crudo = Math.max(...datos.map(d => d[1]), meta || 0) * 1.04 || 1;
    const base = Math.pow(10, Math.floor(Math.log10(crudo / 4)));
    const escalon = [1, 2, 2.5, 5, 10, 20].map(k => k * base).find(e => Math.ceil(crudo / e) <= 6), ticks = Math.ceil(crudo / escalon);
    const max = escalon * ticks;
    const n = datos.length, paso = (W - L - R) / n, bw = Math.min(34, paso * .62);
    const y = v => T + (H - T - B) * (1 - v / max);
    const txt = d => d[2] || etiquetaY(d[1]);
    let g = '';
    for (let i = 0; i <= ticks; i++) { const v = escalon * i; const yy = y(v); g += `<line class="rej" x1="${L}" x2="${W - R}" y1="${yy.toFixed(1)}" y2="${yy.toFixed(1)}"/><text x="${L - 6}" y="${(yy + 4).toFixed(1)}" text-anchor="end">${etiquetaY(v)}</text>`; }
    const barras = datos.map((d, i) => {
      const x = L + paso * i + (paso - bw) / 2, yy = y(d[1]), h = H - B - yy;
      const r = Math.min(4, h / 2);
      const path = `M${x.toFixed(1)},${H - B} V${(yy + r).toFixed(1)} Q${x.toFixed(1)},${yy.toFixed(1)} ${(x + r).toFixed(1)},${yy.toFixed(1)} H${(x + bw - r).toFixed(1)} Q${(x + bw).toFixed(1)},${yy.toFixed(1)} ${(x + bw).toFixed(1)},${(yy + r).toFixed(1)} V${H - B} Z`;
      const etq = (n - 1 - i) % cada === 0 ? `<text x="${(x + bw / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(d[0])}</text>` : '';
      return `<g ${abrir ? `data-abrir="${esc(abrir(i))}" ` : ''}data-tip="${esc(prefijo + d[0])}: ${esc(txt(d))}" data-x="${((x + bw / 2) / W).toFixed(4)}" data-y="${(yy / H).toFixed(4)}"><rect class="hit" x="${(L + paso * i).toFixed(1)}" y="${T}" width="${paso.toFixed(1)}" height="${H - T - B}"/><path d="${path}" class="${i === resaltar ? 'resaltada' : ''}"/>${etq}</g>`;
    }).join('');
    // la cifra de la barra resaltada, encima de ella (si no cabe a la derecha, se alinea al borde)
    let cifra = '';
    if (resaltar >= 0 && datos[resaltar]) { const xc = L + paso * resaltar + paso / 2; const cabe = xc + 36 <= W - 2; cifra = `<text class="graf-cifra" x="${(cabe ? xc : W - 2).toFixed(1)}" y="${(y(datos[resaltar][1]) - 8).toFixed(1)}" text-anchor="${cabe ? 'middle' : 'end'}" aria-hidden="true">${esc(txt(datos[resaltar]))}</text>`; }
    const m = meta ? `<line class="meta" x1="${L}" x2="${W - R}" y1="${y(meta).toFixed(1)}" y2="${y(meta).toFixed(1)}"/>${angosto ? '' : `<text x="${W - R + 6}" y="${(y(meta) + 4).toFixed(1)}" class="graf-meta">${esc(metaTxt)}</text>`}` : '';
    // para el lector de pantalla: la más alta y la última, con sus montos (y la raya, si la hay)
    const alta = datos.reduce((a, d, i) => (d[1] > datos[a][1] ? i : a), 0);
    const nombre = d => (prefijo + d[0]).charAt(0).toLowerCase() + (prefijo + d[0]).slice(1);
    const resumen = `${titulo}. La más alta: ${nombre(datos[alta])}, ${txt(datos[alta])}. La última: ${nombre(datos[n - 1])}, ${txt(datos[n - 1])}.${meta && cfg.metaLeer ? ' ' + cfg.metaLeer + '.' : ''}`;
    return `<svg class="graf" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(resumen)}">${g}<line class="eje" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>${barras}${m}${cifra}</svg>`;
  }
  A.barrasSVG = cfg => { const id = cfg.id || 'g'; A.GRAF[id] = { ...cfg, id }; return `<div class="graf-env" data-graf="${esc(id)}" data-w="640">${dibujarBarras(A.GRAF[id], 640)}<span class="tip" hidden></span><span class="sr-only" aria-live="polite" data-graf-voz></span></div>`; };
  // al montar (y si la caja cambia de ancho): se vuelve a dibujar con el ancho de verdad
  let roGraf = null;
  const redibujar = el => {
    const cfg = A.GRAF[el.dataset.graf]; const w = Math.round(el.clientWidth); if (!cfg || !w || Math.abs(w - +el.dataset.w) < 2) return;
    const svg = el.querySelector('svg.graf'); if (!svg) return; svg.outerHTML = dibujarBarras(cfg, w); el.dataset.w = w;
    const tip = el.querySelector('.tip'); if (tip) tip.hidden = true;
  };
  A.redibujarGrafs = raiz => A.$$('[data-graf]', raiz).forEach(el => {
    redibujar(el);
    if (!roGraf && window.ResizeObserver) roGraf = new ResizeObserver(es => es.forEach(e => { if (e.target.isConnected) redibujar(e.target); }));
    if (roGraf) roGraf.observe(el);
  });
  // el valor de una barra, encima de ella, sin salirse de la caja del gráfico
  const ponerTip = (cont, g, txt) => {
    const tip = cont.querySelector('.tip'); if (!tip) return; tip.textContent = txt; tip.hidden = false;
    const cw = cont.clientWidth, tw = tip.offsetWidth; const x = parseFloat(g.dataset.x) * cw;
    tip.style.left = Math.max(0, Math.min(cw - tw, x - tw / 2)) + 'px'; tip.style.top = (parseFloat(g.dataset.y) * 100) + '%';
  };
  document.addEventListener('mouseover', e => {
    const g = e.target.closest('[data-tip]'); const cont = e.target.closest('[data-graf]');
    if (!cont) return; const tip = cont.querySelector('.tip');
    if (!g) { if (!cont.querySelector('g.tocada')) tip.hidden = true; return; }
    ponerTip(cont, g, g.dataset.tip);
  });
  document.addEventListener('mouseout', e => { const cont = e.target.closest('[data-graf]'); if (cont && !cont.contains(e.relatedTarget) && !cont.querySelector('g.tocada')) { const t = cont.querySelector('.tip'); if (t) t.hidden = true; } });
  // en el teléfono (o con el dedo): el primer toque muestra el valor de esa barra (y lo dice en voz alta); el segundo toque abre su ficha
  const conDedo = () => (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || ((document.getElementById('device') || {}).clientWidth || 9999) < 720;
  document.addEventListener('click', e => {
    const g = e.target.closest && e.target.closest('[data-graf] g[data-tip]'); if (!g || !conDedo() || g.classList.contains('tocada')) return;
    e.stopPropagation(); e.preventDefault();
    const cont = g.closest('[data-graf]'); cont.querySelectorAll('g.tocada').forEach(x => x.classList.remove('tocada')); g.classList.add('tocada');
    const txt = g.dataset.tip + (g.dataset.abrir ? ' · toca otra vez para abrirla' : '');
    ponerTip(cont, g, txt); const voz = cont.querySelector('[data-graf-voz]'); if (voz) voz.textContent = txt;
  }, true);

  /* ---------- fechas ----------
     Un día es [día, mes 0-11, año]; sin año es 2026 (el año del prototipo). Hoy sale de los datos (lunes 5 de octubre de 2026). */
  const MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DOWC = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'], DOWL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const F = A.F = {
    hoy: (() => { const [y, m, d] = A.D.HOY.iso.split('-').map(Number); return [d, m - 1, y]; })(),
    dt: ([d, m, y = 2026]) => new Date(y, m, d),
    dm: x => [x.getDate(), x.getMonth(), x.getFullYear()],
    sumar: (a, n) => F.dm(new Date(a[2] || 2026, a[1], a[0] + n)),
    // días de a hasta b (por defecto, desde hoy): negativo si a ya pasó
    dif: (a, b = F.hoy) => Math.round((F.dt(a) - F.dt(b)) / 864e5),
    igual: (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1] && (a[2] || 2026) === (b[2] || 2026),
    dow: a => (F.dt(a).getDay() + 6) % 7, // 0 = lunes … 6 = domingo
    // «lun 12 oct» · «lunes 12 de octubre» (con el año, si no es 2026) · «oct 2027»
    corta: a => DOWC[F.dt(a).getDay()] + ' ' + a[0] + ' ' + A.D.MESES[a[1]] + (a[2] && a[2] !== 2026 ? ' ' + a[2] : ''),
    larga: a => DOWL[F.dt(a).getDay()] + ' ' + a[0] + ' de ' + MESL[a[1]] + (a[2] && a[2] !== 2026 ? ' de ' + a[2] : ''),
    mesAnio: a => A.D.MESES[a[1]] + ' ' + (a[2] || 2026),
    clave: a => a[0] + '-' + a[1] + '-' + (a[2] || 2026),
    deClave: k => String(k).split('-').map(Number),
    // un mes más tarde (o n meses), el mismo día; si ese mes no tiene ese día, el último del mes
    meses: (a, n) => { const y = (a[2] || 2026), m = a[1] + n; const ult = new Date(y, m + 1, 0).getDate(); return F.dm(new Date(y, m, Math.min(a[0], ult))); },
    MESL, DOWC, DOWL,
  };

  /* ---------- un calendario para elegir un día ----------
     A.calendario({ id, mes: [m, año], sel, desde, hasta, dia, rango, etiqueta }) dibuja el mes con un botón por día; «‹» y «›» cambian de mes.
     · sel: el día elegido · desde/hasta: lo que se puede elegir · rango: [de, a], los días que quedan marcados (las vacaciones que se proponen)
     · dia(d) → { no: 'por qué no se puede', marca: 'feriado', nota: 'para el lector de pantalla', cls }
     Hoy va marcado con «hoy» debajo del número; el elegido, relleno de tinta (y aria-pressed): nunca solo por color.
     Quien lo usa registra A.CAL[id] = { elegir(d), mes(±1) } y vuelve a dibujar su pantalla. Con el teclado: las flechas mueven el día
     (← → un día, ↑ ↓ una semana), Inicio y Fin van al lunes y al domingo, Re Pág y Av Pág cambian de mes. Solo un día entra en el tabulador. */
  A.CAL = {};
  A.calendario = ({ id, mes, sel = null, desde = null, hasta = null, dia = () => ({}), rango = null, etiqueta = '' }) => {
    const [m, y] = mes; const off = F.dow([1, m, y]); const ult = new Date(y, m + 1, 0).getDate();
    const fuera = d => (desde && F.dif(d, desde) < 0) || (hasta && F.dif(d, hasta) > 0);
    const enRango = d => !!rango && F.dif(d, rango[0]) >= 0 && F.dif(d, rango[1]) <= 0;
    const atras = !desde || F.dif(F.dm(new Date(y, m, 0)), desde) >= 0, adelante = !hasta || F.dif([1, m + 1 > 11 ? 0 : m + 1, m + 1 > 11 ? y + 1 : y], hasta) <= 0;
    const dias = []; for (let d = 1; d <= ult; d++) { const x = [d, m, y]; dias.push({ x, info: dia(x) || {}, no: fuera(x) }); }
    // el día que entra en el tabulador: el elegido; si no está en este mes, hoy; si tampoco, el primero que se puede elegir
    const foco = (dias.find(o => sel && F.igual(o.x, sel)) || dias.find(o => F.igual(o.x, F.hoy) && !o.no) || dias.find(o => !o.no && !o.info.no) || dias[0]).x;
    const titulo = MESL[m][0].toUpperCase() + MESL[m].slice(1) + ' de ' + y;
    return `<div class="calp" id="calp-${esc(id)}" role="group" aria-label="${esc(etiqueta ? etiqueta + ' · ' + titulo : titulo)}">
      <div class="calp-cab"><button type="button" class="calp-nav" data-acc="calp-mes" data-arg="${esc(id)}|-1" aria-label="Mes anterior"${atras ? '' : ' aria-disabled="true"'}>${ic('atras', 's')}</button><b aria-live="polite">${titulo}</b><button type="button" class="calp-nav sig" data-acc="calp-mes" data-arg="${esc(id)}|1" aria-label="Mes siguiente"${adelante ? '' : ' aria-disabled="true"'}>${ic('atras', 's')}</button></div>
      <div class="calp-sem" aria-hidden="true">${['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(t => `<span>${t}</span>`).join('')}</div>
      <div class="calp-dias">${'<span class="calp-vacio"></span>'.repeat(off)}${dias.map(({ x, info, no }) => {
        const motivo = no ? 'Ese día no se puede elegir.' : info.no || ''; const esHoy = F.igual(x, F.hoy), esSel = !!sel && F.igual(x, sel), rg = enRango(x);
        const lab = F.larga(x) + (esHoy ? ', hoy' : '') + (info.nota ? ', ' + info.nota : '') + (rg && !esSel ? ', dentro de lo que se propone' : '') + (motivo ? ', no se puede elegir' : '');
        return `<button type="button" class="calp-dia${esHoy ? ' hoy' : ''}${esSel ? ' sel' : ''}${rg ? ' rango' : ''}${motivo ? ' no' : ''}${info.cls ? ' ' + info.cls : ''}" data-acc="calp-dia" data-arg="${esc(id)}|${F.clave(x)}" aria-pressed="${esSel}"${motivo ? ` aria-disabled="true" data-no="${esc(motivo)}"` : ''} aria-label="${esc(lab)}" tabindex="${F.igual(x, foco) ? 0 : -1}"><span>${x[0]}</span>${esHoy ? '<small>hoy</small>' : info.marca ? `<small>${esc(info.marca)}</small>` : ''}</button>`;
      }).join('')}</div></div>`;
  };
  A.ACC['calp-dia'] = (arg, el) => {
    const [id, k] = String(arg).split('|'); if (el && el.dataset.no) { A.aviso(el.dataset.no, 'info'); return; }
    if (A.CAL[id]) A.CAL[id].elegir(F.deClave(k));
  };
  A.ACC['calp-mes'] = (arg, el) => { const [id, n] = String(arg).split('|'); if (el && el.getAttribute('aria-disabled') === 'true') { A.aviso('No hay días para elegir en ese mes.', 'info'); return; } if (A.CAL[id]) A.CAL[id].mes(+n); };
  // el día que debe recibir el teclado después de cambiar de mes con las flechas (el dueño del calendario vuelve a dibujar la pantalla)
  let calFoco = null;
  document.addEventListener('keydown', e => {
    const b = e.target && e.target.closest ? e.target.closest('.calp-dia') : null; if (!b || e.altKey || e.ctrlKey || e.metaKey) return;
    const [id, k] = b.dataset.arg.split('|'); const d = F.deClave(k); const paso = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    const destino = paso ? F.sumar(d, paso) : e.key === 'Home' ? F.sumar(d, -F.dow(d)) : e.key === 'End' ? F.sumar(d, 6 - F.dow(d)) : e.key === 'PageUp' ? F.meses(d, -1) : e.key === 'PageDown' ? F.meses(d, 1) : null;
    if (!destino) return; e.preventDefault();
    const raiz = b.closest('.calp'); const sig = raiz.querySelector(`[data-arg="${CSS.escape(id + '|' + F.clave(destino))}"]`);
    if (sig) { raiz.querySelectorAll('.calp-dia').forEach(x => { x.tabIndex = x === sig ? 0 : -1; }); sig.focus(); return; }
    const nav = raiz.querySelector(`.calp-nav${destino[2] * 12 + destino[1] > d[2] * 12 + d[1] ? '.sig' : ':not(.sig)'}`);
    if (!nav || nav.getAttribute('aria-disabled') === 'true' || !A.CAL[id]) return;
    calFoco = id + '|' + F.clave(destino); A.CAL[id].mes(destino[2] * 12 + destino[1] > d[2] * 12 + d[1] ? 1 : -1);
  });
  // después de dibujar: el día al que se llegó con las flechas recibe el teclado (si no existe, el que entra en el tabulador)
  A.focoCalendario = raiz => {
    if (!calFoco || !raiz) return; const [id] = calFoco.split('|'); const el = raiz.querySelector(`[data-arg="${CSS.escape(calFoco)}"]`) || raiz.querySelector(`#calp-${CSS.escape(id)} .calp-dia[tabindex="0"]`);
    calFoco = null; if (el) { raiz.querySelectorAll(`#calp-${CSS.escape(id)} .calp-dia`).forEach(x => { x.tabIndex = x === el ? 0 : -1; }); el.focus({ preventScroll: true }); }
  };

  /* ---------- la cédula: V o E con un botón, y después solo números ----------
     A.campoCi({ id, etiqueta, letra, valor, ayuda, opcional }) · la letra queda en el campo (data-letra); al escribir o pegar «V-12.345.678»
     la app deja la letra en su botón y en la casilla solo los números · A.ciDe(id) → { letra, num, txt: 'V-12.345.678' } */
  A.campoCi = ({ id, etiqueta = 'Cédula', letra = 'V', valor = '', ayuda = 'Solo los números.', opcional = false, extra = '', attrs = '' }) =>
    `<div class="campo ci-campo" id="${esc(id)}-campo"><span id="${esc(id)}-t">${esc(etiqueta)}${opcional ? ' (opcional)' : ''}</span>
      <div class="ci-fila"><div class="seg ci-letra" role="group" aria-label="${esc(etiqueta)}: venezolana o extranjera">${['V', 'E'].map(l => `<button type="button" data-acc="ci-letra" data-arg="${esc(id)}|${l}" aria-pressed="${l === letra}" aria-label="${l === 'V' ? 'V, venezolana' : 'E, extranjera'}">${l}</button>`).join('')}</div>
        <input id="${esc(id)}" data-ci-num data-max="10" data-letra="${esc(letra)}" value="${esc(valor)}" inputmode="numeric" autocomplete="off" maxlength="16" placeholder="12345678" aria-labelledby="${esc(id)}-t"${ayuda ? ` aria-describedby="${esc(id)}-ay"` : ''} ${attrs}></div>
      ${ayuda ? `<small class="ayuda" id="${esc(id)}-ay">${esc(ayuda)}</small>` : ''}${extra}</div>`;
  const ponerLetra = (id, l) => {
    const inp = document.getElementById(id); if (!inp) return; inp.dataset.letra = l;
    document.querySelectorAll(`[data-acc="ci-letra"][data-arg^="${CSS.escape(id)}|"]`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.arg === id + '|' + l)));
  };
  A.ACC['ci-letra'] = arg => { const [id, l] = String(arg).split('|'); ponerLetra(id, l); const inp = document.getElementById(id); if (inp) inp.dispatchEvent(new Event('change', { bubbles: true })); };
  A.ciTxt = (letra, num) => { const n = String(num || '').replace(/\D/g, ''); return n ? letra + '-' + n.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''; };
  A.ciDe = id => { const inp = document.getElementById(id); if (!inp) return { letra: 'V', num: '', txt: '' }; const num = inp.value.replace(/\D/g, ''); return { letra: inp.dataset.letra || 'V', num, txt: A.ciTxt(inp.dataset.letra || 'V', num) }; };
  // la cédula tapada, como se ve en las fichas: «V-•••• 5678»
  A.ciTapada = (letra, num) => { const n = String(num || '').replace(/\D/g, ''); return n ? letra + '-•••• ' + n.slice(-4) : ''; };

  /* ---------- la fecha de nacimiento en tres casillas: día, mes y año ----------
     A.campoNac({ id, etiqueta, valor: [d, m, año], opcional, ayuda }) · A.leerNac(id) → { vacio, dm, msg } (msg: lo que está mal, para A.faltan) */
  A.campoNac = ({ id, etiqueta = 'Fecha de nacimiento', valor = null, opcional = true, ayuda = '' }) => {
    const [d, m, y] = valor || ['', '', ''];
    return `<fieldset class="campo nac-campo" id="${esc(id)}-campo"><legend>${esc(etiqueta)}${opcional ? ' (opcional)' : ''}</legend>
      <div class="nac-fila">
        <label class="nac-c" for="${esc(id)}-d"><span>Día</span><select id="${esc(id)}-d" data-nac="${esc(id)}"><option value="">—</option>${Array.from({ length: 31 }, (_, i) => `<option${d === i + 1 ? ' selected' : ''}>${i + 1}</option>`).join('')}</select></label>
        <label class="nac-c mes" for="${esc(id)}-m"><span>Mes</span><select id="${esc(id)}-m" data-nac="${esc(id)}"><option value="">—</option>${MESL.map((t, i) => `<option value="${i}"${m === i ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <label class="nac-c" for="${esc(id)}-y"><span>Año</span><input id="${esc(id)}-y" data-nac="${esc(id)}" data-solo-num maxlength="4" inputmode="numeric" autocomplete="off" placeholder="1995" value="${esc(y)}"></label>
      </div>${ayuda ? `<small class="ayuda">${esc(ayuda)}</small>` : ''}</fieldset>`;
  };
  A.leerNac = id => {
    const v = s => ((document.getElementById(id + '-' + s) || {}).value || '').trim();
    const d = v('d'), m = v('m'), y = v('y');
    if (!d && m === '' && !y) return { vacio: true, dm: null, msg: '' };
    if (!d || m === '' || y.length !== 4) return { vacio: false, dm: null, msg: 'Completa el día, el mes y el año (4 números).' };
    const dm = [+d, +m, +y]; const x = F.dt(dm);
    if (x.getDate() !== +d) return { vacio: false, dm: null, msg: 'Ese día no existe en ' + MESL[+m] + '.' };
    if (+y < 1940 || +y > (F.hoy[2] - 14)) return { vacio: false, dm: null, msg: 'Revisa el año: tiene que tener al menos 14 años.' };
    return { vacio: false, dm, msg: '' };
  };

  // solo números: la cédula, el teléfono, la cuenta de 20 dígitos y el año · corre antes que todo lo demás (en la captura),
  // así quien escucha el campo ya lee el número limpio · en la cédula, una V o una E al principio pasa a su botón
  // un teléfono copiado de WhatsApp trae el 58 del país («+58 416-3401180», «0058…», «+58 (0416)…»): pasa a ser el 0 de siempre (04163401180)
  A.telLocal = d => { const x = String(d || '').replace(/\D/g, ''); return /^0058\d{10}$/.test(x) ? '0' + x.slice(4) : /^580\d{10}$/.test(x) ? '0' + x.slice(3) : /^58\d{10}$/.test(x) ? '0' + x.slice(2) : x; };
  document.addEventListener('input', e => {
    const t = e.target; if (!t || !t.matches || !t.matches('[data-ci-num], [data-solo-num]')) return;
    const crudo = t.value; if (t.matches('[data-ci-num]')) { const l = /^\s*([VvEe])/.exec(crudo); if (l) ponerLetra(t.id, l[1].toUpperCase()); }
    const max = +(t.dataset.max || t.getAttribute('maxlength') || 30);
    // en un teléfono, el 58 del país se cambia por el 0 antes de cortar a sus 11 cifras (si no, se cortaba la última)
    const cifras = crudo.replace(/\D/g, ''); const limpio = (t.getAttribute('inputmode') === 'tel' ? A.telLocal(cifras) : cifras).slice(0, max);
    if (limpio !== crudo) t.value = limpio;
  }, true);

  // la línea va en el dibujo, que estira a lo ancho con su alto fijo; sus dos etiquetas van debajo, como texto
  // (dentro del dibujo crecían o encogían con su ancho: en el teléfono no se leían) · el punto de hoy es una raya de largo cero, siempre redonda
  A.spark = (vals, { w = 320, h = 54, etqIni = '', etqFin = '' } = {}) => {
    const min = Math.min(...vals), max = Math.max(...vals); const L = 4, R = 6, T = 6, B = 4;
    const x = i => L + (w - L - R) * i / (vals.length - 1); const y = v => T + (h - T - B) * (1 - (v - min) / ((max - min) || 1));
    const pts = vals.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1)); const xf = x(vals.length - 1).toFixed(1), yf = y(vals[vals.length - 1]).toFixed(1);
    return `<span class="spark-env"><svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(etqIni)} a ${esc(etqFin)}">
      <path d="M${pts.join(' L')} L${xf},${h - B} L${L},${h - B} Z" fill="currentColor" fill-opacity=".08"/>
      <polyline points="${pts.join(' ')}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      <line x1="${xf}" y1="${yf}" x2="${xf}" y2="${yf}" stroke="currentColor" stroke-width="7" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
      ${etqIni || etqFin ? `<span class="leyenda spark-ley" aria-hidden="true"><span>${esc(etqIni)}</span><span>${esc(etqFin)}</span></span>` : ''}</span>`;
  };
})();
