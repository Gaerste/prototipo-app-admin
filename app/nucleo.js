/* Núcleo del prototipo: estado, permisos, armazón, ficha de detalle, código de 6 dígitos, registro de cambios. */
(() => {
  const D = window.DB;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  /* ---------- números en formato venezolano ---------- */
  const fmt = (n, d = 2) => {
    if (n === null || n === undefined || isNaN(n)) return '—';
    const neg = n < 0; const s = Math.abs(n).toFixed(d); let [i, f] = s.split('.');
    i = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '−' : '') + i + (d ? ',' + f : '');
  };
  const dinero = (n, mon = 'usd', d) => {
    if (n === null || n === undefined) return '—';
    const dd = d ?? 2;
    if (mon === 'bs') return 'Bs ' + fmt(n, dd);
    if (mon === 'eur') return '€ ' + fmt(n, dd);
    if (mon === 'usdt') return fmt(n, dd) + ' USDT';
    return '$ ' + fmt(n, dd);
  };
  const leerNum = v => { const t = String(v).trim().replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'); const n = parseFloat(t); return isNaN(n) ? null : n; };

  /* ---------- íconos ---------- */
  const ICONOS = {
    inicio: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    caja: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
    pagos: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    boveda: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M12 9V7"/><path d="M12 17v-2"/><path d="M9 12H7"/><path d="M17 12h-2"/>',
    tasas: '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
    campana: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alerta: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    subir: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    descargar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    derecha: '<path d="m9 18 6-6-6-6"/>',
    abajo: '<path d="m6 9 6 6 6-6"/>',
    atras: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    imagen: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    enviar: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
    escudo: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    reloj: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    candado: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    ojo: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    'ojo-no': '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
    archivo: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
    termometro: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
    mas: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    menos: '<path d="M5 12h14"/>',
    usuario: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    camara: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    buscar: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    clientes: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    proveedores: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    nomina: '<rect width="20" height="14" x="2" y="5" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M14 10h4"/><path d="M14 14h4"/><path d="M5 16a3 3 0 0 1 6 0"/>',
    cajachica: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    bancos: '<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 20 7H4z"/>',
    fiscal: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    analisis: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    documentos: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    parametros: '<path d="M21 4h-7"/><path d="M10 4H3"/><path d="M21 12h-9"/><path d="M8 12H3"/><path d="M21 20h-5"/><path d="M12 20H3"/><path d="M14 2v4"/><path d="M8 10v4"/><path d="M16 18v4"/>',
    usuarios: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><circle cx="12" cy="10" r="2.5"/><path d="M8 16.5a4.5 4.5 0 0 1 8 0"/>',
    auditoria: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    salud: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
    lapiz: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    salir: '<path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>',
    llave: '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r="1"/>',
    pantalla: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    lista: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    calendario: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    anular: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    refrescar: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    mensaje: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    celular: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    puntos: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    pastel: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>',
    maleta: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    pulso: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
    cubiertos: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    estrella: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    prestamo: '<path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 16 6 6"/><circle cx="16" cy="9" r="2.9"/><circle cx="6" cy="5" r="3"/>',
    equipo: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  };
  const ic = (n, c = '') => `<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  function sprite() {
    const d = document.createElement('div');
    d.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      Object.entries(ICONOS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('') + '</defs></svg>';
    document.body.prepend(d.firstChild);
  }

  const tag = (t, tono = '') => `<span class="tag ${tono}">${esc(t)}</span>`;
  const iniciales = u => (u.nombre[0] + (u.apellido ? u.apellido[0] : (u.nombre.split(' ')[1] || ' ')[0])).toUpperCase();
  const nombreDe = u => (u.nombre + (u.apellido ? ' ' + u.apellido : '')).trim();

  /* ---------- estado ---------- */
  const S = { usuario: null, ruta: 'inicio', sub: {}, formato: 'compu', menu: false, ficha: null, login: { paso: 'quien', u: null } };
  const PANT = {};   // pantallas registradas
  const FICHAS = {}; // tipo -> función(id) que arma la ficha
  const ACC = {};    // acciones con nombre

  /* ---------- permisos ---------- */
  const nivel = (mod, u = S.usuario) => (u ? (D.PERMISOS[u.rol] || {})[mod] || '' : '');
  function puede(mod, acc = 'ver', u = S.usuario) {
    const n = nivel(mod, u);
    if (acc === 'ver') return n !== '';
    if (acc === 'editar') return ['e', 'a', 'p', 'r'].includes(n);
    if (acc === 'aprobar') return n === 'a';
    if (acc === 'sueldos') return ['a', 'r', 'p'].includes(n);
    return false;
  }
  // quién hace los cambios: no se nombra a quien está «por confirmar» (su acceso no se ha decidido) ni a quien se le quitó el acceso;
  // sí a quien está invitado, porque su rol ya está decidido
  const quienEdita = mod => {
    const nombres = D.USUARIOS.filter(u => !['por_confirmar', 'sin_acceso'].includes(u.estado) && puede(mod, 'editar', u)).map(u => u.nombre);
    return nombres.length ? nombres.join(', ').replace(/, ([^,]*)$/, ' o $1') : 'Alejandro';
  };

  /* ---------- avisos y registro de cambios ---------- */
  let tToast;
  function aviso(txt, tono = 'ok') {
    let t = $('#toast'); if (!t) return;
    t.innerHTML = (tono === 'ok' ? ic('check', 's') : ic('info', 's')) + '<span>' + esc(txt) + '</span>';
    t.hidden = false; clearTimeout(tToast); tToast = setTimeout(() => { t.hidden = true; }, 3200);
  }
  function auditar({ modulo, registro, campo, antes = '—', despues = '—', motivo = '' }) {
    D.AUDITORIA.unshift({ id: 'au' + Date.now() + Math.random(), cuando: 'Hoy ' + D.HOY.hora, quien: S.usuario ? nombreDe(S.usuario) : '—', tipoActor: 'persona', modulo, registro, campo, antes: String(antes), despues: String(despues), motivo });
  }

  /* ---------- ventanas: código de 6 dígitos y motivo ---------- */
  function modal(html) {
    const raiz = $('#modal-raiz');
    raiz.innerHTML = `<div class="modal-env" role="presentation"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
    return raiz.firstChild;
  }
  const cerrarModal = () => { $('#modal-raiz').innerHTML = ''; };
  function pedirCodigo(texto = 'Esta acción pide tu código de 6 dígitos.') {
    return new Promise((ok, no) => {
      const env = modal(`<h2>Tu código</h2><p class="muted">${esc(texto)}</p>
        <div class="codigo" role="group" aria-label="Código de 6 dígitos">${Array.from({ length: 6 }, (_, i) => `<input id="cod-${i}" inputmode="numeric" maxlength="1" autocomplete="${i ? 'off' : 'one-time-code'}" aria-label="Dígito ${i + 1}">`).join('')}</div>
        <p class="muted" id="cod-msg" style="text-align:center">Míralo en la app de códigos de tu teléfono. En el prototipo vale cualquier número.</p>
        <div class="modal-acc"><button class="btn sec" data-m="no">Cancelar</button><button class="btn pri" data-m="si">Confirmar</button></div>`);
      const ins = $$('.codigo input', env); ins[0].focus();
      ins.forEach((inp, i) => {
        inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(-1); if (inp.value && ins[i + 1]) ins[i + 1].focus(); if (ins.every(x => x.value)) listo(); });
        inp.addEventListener('keydown', e => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus(); if (e.key === 'Enter') listo(); });
        inp.addEventListener('paste', e => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (t.length) { e.preventDefault(); t.split('').forEach((c, j) => { if (ins[j]) ins[j].value = c; }); if (t.length === 6) listo(); } });
      });
      function listo() {
        if (!ins.every(x => /\d/.test(x.value))) { $('#cod-msg', env).textContent = 'El código tiene 6 números.'; return; }
        cerrarModal(); ok(true);
      }
      env.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; if (b.dataset.m === 'si') listo(); else { cerrarModal(); no(); } });
    });
  }
  function pedirMotivo({ titulo, texto = '', boton = 'Confirmar', tono = 'pri', codigo = false, etiqueta = 'Motivo', obligatorio = true, valor = '' }) {
    return new Promise((ok, no) => {
      const env = modal(`<h2>${esc(titulo)}</h2>${texto ? `<p class="muted">${texto}</p>` : ''}
        <label class="campo" for="motivo-txt"><span>${esc(etiqueta)}${obligatorio ? '' : ' (opcional)'}</span><textarea id="motivo-txt" placeholder="Escribe por qué. Queda en el registro de cambios.">${esc(valor)}</textarea><small class="ayuda" id="motivo-msg"></small></label>
        ${codigo ? `<p class="muted" style="display:flex;gap:6px;align-items:center">${ic('candado', 's')}Después te pide tu código.</p>` : ''}
        <div class="modal-acc"><button class="btn sec" data-m="no">Cancelar</button><button class="btn ${tono}" data-m="si">${esc(boton)}</button></div>`);
      $('#motivo-txt', env).focus();
      env.addEventListener('click', async e => {
        const b = e.target.closest('[data-m]'); if (!b) return;
        if (b.dataset.m === 'no') { cerrarModal(); no(); return; }
        const m = $('#motivo-txt', env).value.trim();
        if (obligatorio && m.length < 4) { $('#motivo-msg', env).textContent = 'Escribe el motivo: sin él no se puede guardar.'; $('#motivo-txt', env).parentElement.classList.add('error'); return; }
        cerrarModal();
        if (codigo) { try { await pedirCodigo(); } catch (_) { no(); return; } }
        ok(m);
      });
    });
  }
  function confirmar({ titulo, texto, boton = 'Confirmar', tono = 'pri' }) {
    return new Promise((ok, no) => {
      const env = modal(`<h2>${esc(titulo)}</h2><p class="muted">${texto}</p><div class="modal-acc"><button class="btn sec" data-m="no">Cancelar</button><button class="btn ${tono}" data-m="si">${esc(boton)}</button></div>`);
      $('[data-m="si"]', env).focus();
      env.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; cerrarModal(); b.dataset.m === 'si' ? ok() : no(); });
    });
  }

  /* ---------- la ficha de detalle ---------- */
  // spec: { titulo, sub, tags:[[txt,tono]], mod, obj, registro, bloques:[...], acciones:[...], aviso, bloqueada, bloqueo }
  // bloqueada: lo pagado, declarado o enviado no se edita · bloqueo: cómo se corrige (lo dice el botón Editar con candado)
  // bloque kv: { titulo, filas:[{ l, v, campo:{ k, tipo:'texto'|'dinero'|'numero'|'fecha'|'select'|'area', opciones, sensible, mon } }] }
  function abrir(tipo, id) {
    if (!FICHAS[tipo]) { aviso('Esta ficha todavía no está dibujada.', 'info'); return; }
    S.ficha = { tipo, id, editando: false };
    pintarFicha();
  }
  function cerrarFicha() { S.ficha = null; $('#ficha-raiz').innerHTML = ''; }
  function valorCampo(obj, c) {
    const v = obj[c.k];
    if (c.tipo === 'dinero') return v === null || v === undefined ? '' : fmt(v);
    return v ?? '';
  }
  function inputDe(obj, c, i) {
    const id = 'fc-' + i;
    if (c.tipo === 'select') return `<select id="${id}" data-k="${c.k}">${c.opciones.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(obj[c.k]) ? ' selected' : ''}>${esc(t)}</option>`; }).join('')}</select>`;
    if (c.tipo === 'area') return `<textarea id="${id}" data-k="${c.k}">${esc(obj[c.k])}</textarea>`;
    return `<input id="${id}" data-k="${c.k}" value="${esc(valorCampo(obj, c))}" ${c.tipo === 'dinero' || c.tipo === 'numero' ? 'inputmode="decimal"' : ''} autocomplete="off">`;
  }
  function pintarFicha() {
    const f = S.ficha; if (!f) return;
    const spec = FICHAS[f.tipo](f.id); if (!spec) { cerrarFicha(); return; }
    f.spec = spec;
    const editable = spec.bloques.some(b => (b.filas || []).some(r => r.campo));
    const puedeEditar = editable && puede(spec.mod, 'editar') && !spec.bloqueada;
    let n = 0;
    const cuerpo = spec.bloques.map(b => {
      if (b.oculto) return '';
      let inner = '';
      if (b.filas) {
        inner = '<dl class="kv">' + b.filas.map(r => {
          if (f.editando && r.campo && puedeEditar) {
            const i = n++;
            return `<div style="flex-direction:column;align-items:stretch;gap:5px"><dt><label for="fc-${i}">${esc(r.l)}${r.campo.sensible ? ' ' + ic('candado', 'xs') : ''}</label></dt><dd class="largo" style="justify-content:stretch;text-align:left"><span class="campo" style="width:100%">${inputDe(spec.obj, r.campo, i)}${r.campo.sensible ? '<small class="ayuda">Cambiar esto pide tu código y le avisa a Alejandro.</small>' : ''}</span></dd></div>`;
          }
          return `<div><dt>${esc(r.l)}</dt><dd${r.largo ? ' class="largo"' : ''}>${r.v ?? '—'}</dd></div>`;
        }).join('') + '</dl>';
      } else if (b.tiempo) {
        inner = '<ol class="tiempo">' + b.tiempo.map(t => `<li class="${t[2] || ''}"><time>${esc(t[0])}</time><span>${t[1]}</span></li>`).join('') + '</ol>';
      } else if (b.adjuntos) {
        inner = '<div class="adjuntos">' + b.adjuntos.map(a => `<button class="adjunto" data-acc="ver-archivo" data-arg="${esc(a)}">${ic(/\.pdf$/i.test(a) ? 'archivo' : 'imagen', 's')}<span>${esc(a)}</span></button>`).join('') + '</div>';
      } else if (b.html) inner = b.html;
      return `<section class="bloque">${b.titulo ? `<h3>${esc(b.titulo)}${b.extra || ''}</h3>` : ''}${inner}</section>`;
    }).join('');
    const SELLOS = { pagada: 'Pagado', confirmado: 'Confirmado', declarada: 'Declarada', aprobada: 'Aprobado', entregada: 'Entregado', repuesta: 'Repuesto', enterada: 'Pagado', conciliada: 'Conciliada', llego: 'Llegó', justificada: 'Justificada', descontada: 'Descontado', disfrutada: 'Disfrutada', resuelta: 'Resuelta', perdonado: 'Perdonado', firmado: 'Firmado', rendida: 'Rendida' };
    const ROJOS = { no_vino: 'No vino', injustificada: 'Injustificada', cancelada: 'Cancelada', rechazado: 'Rechazado', rechazada: 'Rechazada' };
    const ob = spec.obj || {}; const est = ob.anulada ? 'anulada' : ob.estado;
    const selloTxt = ob.anulada ? 'Anulado' : (SELLOS[est] || ROJOS[est]);
    if (f.est0 === undefined) f.est0 = est;
    const recien = !!selloTxt && f.est0 !== est;
    const sello = selloTxt ? window.APP.sello(selloTxt, { rojo: !!ob.anulada || !!ROJOS[est], recien: recien && !f.animado, fecha: recien ? '05 OCT 2026' : '' }) : '';
    if (recien) f.animado = true;
    const tags = (spec.tags || []).filter(t => !(selloTxt && (t[1] === 'ok' || /anulad/i.test(t[0]) || t[0].toLowerCase() === selloTxt.toLowerCase())));
    const notaLectura = editable && !puedeEditar && !spec.bloqueada
      ? `<p class="nota gris">${ic('candado', 's')}<span><b>Solo lectura.</b> Para cambiar esto, pídeselo a ${esc(quienEdita(spec.mod))}.</span></p>` : '';
    const notaEditando = f.editando ? `<p class="nota info">${ic('lapiz', 's')}<span>Cambia lo que haga falta. Al guardar te pedimos el motivo: queda el valor anterior, el nuevo y quién lo hizo.</span></p>` : '';
    const acciones = (spec.acciones || []).filter(a => !a.solo || puede(spec.mod, a.solo));
    const pie = f.editando
      ? `<button class="btn sec" data-ficha="cancelar">Cancelar</button><button class="btn pri" data-ficha="guardar">${ic('check', 's')}Guardar cambios</button>`
      : (spec.anulable && puede(spec.mod, 'editar') ? `<button class="btn ghost izq" data-ficha="anular">${ic('anular', 's')}Anular</button>` : '') +
        acciones.map(a => `<button class="btn ${a.tono || 'sec'}" data-acc="${a.acc}" data-arg="${esc(a.arg ?? f.id)}">${a.icono ? ic(a.icono, 's') : ''}${esc(a.txt)}</button>`).join('') +
        (editable ? (puedeEditar ? `<button class="btn ${spec.editarTono || 'pri'}" data-ficha="editar">${ic('lapiz', 's')}${esc(spec.editar || 'Editar')}</button>` : `<button class="btn bloq" data-ficha="${spec.bloqueada ? 'cerrada' : 'sin-permiso'}" aria-disabled="true">${ic('candado', 's')}${esc(spec.editar || 'Editar')}</button>`) : '');
    $('#ficha-raiz').innerHTML = `<div class="ficha-env"><button class="ficha-velo" data-ficha="cerrar" aria-label="Cerrar la ficha"></button>
      <aside class="ficha" role="dialog" aria-modal="true" aria-labelledby="ficha-t">
        <header class="ficha-cab"><div>${spec.sub ? `<span class="muted">${spec.sub}</span>` : ''}<h2 id="ficha-t">${esc(spec.titulo)}</h2>${tags.length || sello ? `<div class="tags">${sello}${tags.map(t => tag(t[0], t[1])).join('')}</div>` : ''}</div>
        <button class="cerrar" data-ficha="cerrar" aria-label="Cerrar">${ic('x')}</button></header>
        <div class="ficha-cuerpo">${spec.aviso || ''}${notaEditando}${notaLectura}${cuerpo}</div>
        ${pie ? `<footer class="ficha-pie">${pie}</footer>` : ''}
      </aside></div>`;
    const foco = f.editando ? $('#ficha-raiz input, #ficha-raiz select, #ficha-raiz textarea') : $('#ficha-raiz .cerrar');
    if (foco) foco.focus();
  }
  async function guardarFicha() {
    const f = S.ficha; const spec = f.spec; const obj = spec.obj;
    const campos = []; spec.bloques.forEach(b => (b.filas || []).forEach(r => { if (r.campo) campos.push(r); }));
    const cambios = [];
    campos.forEach(r => {
      const el = $(`#ficha-raiz [data-k="${r.campo.k}"]`); if (!el) return;
      let nuevo = el.value.trim(); const antes = obj[r.campo.k];
      if (r.campo.tipo === 'dinero' || r.campo.tipo === 'numero') { nuevo = leerNum(nuevo); if (nuevo === null) return; }
      if (String(nuevo) !== String(antes ?? '')) cambios.push({ r, antes, nuevo });
    });
    if (!cambios.length) { f.editando = false; pintarFicha(); aviso('No cambiaste nada.', 'info'); return; }
    const sensible = cambios.some(c => c.r.campo.sensible);
    let motivo;
    try {
      motivo = await pedirMotivo({ titulo: 'Guardar ' + (cambios.length === 1 ? 'el cambio' : 'los ' + cambios.length + ' cambios'), texto: cambios.map(c => `<b>${esc(c.r.l)}</b>: ${esc(muestra(c.antes, c.r.campo))} → ${esc(muestra(c.nuevo, c.r.campo))}`).join('<br>'), boton: 'Guardar', codigo: sensible });
    } catch (_) { return; }
    cambios.forEach(c => {
      obj[c.r.campo.k] = c.nuevo;
      auditar({ modulo: spec.moduloNombre || nombreModulo(spec.mod), registro: spec.registro || spec.titulo, campo: c.r.l.toLowerCase(), antes: muestra(c.antes, c.r.campo), despues: muestra(c.nuevo, c.r.campo), motivo });
    });
    if (spec.alGuardar) spec.alGuardar(cambios, motivo);
    f.editando = false; pintarFicha(); pintarPagina();
    aviso(sensible ? 'Guardado con tu código. Le avisamos a Alejandro.' : 'Guardado. Quedó en el registro de cambios.');
  }
  const muestra = (v, c) => (v === null || v === undefined || v === '') ? '—' : (c.tipo === 'dinero' ? dinero(v, c.mon || 'usd') : String(v));
  const nombreModulo = mod => (D.MODULOS.find(m => m[0] === mod) || [0, mod])[1];

  /* ---------- pantallas y navegación ---------- */
  const GRUPOS = ['Hoy', 'Dinero que entra', 'Dinero que sale', 'Efectivo', 'Bancos', 'Fiscal', 'Recursos humanos', 'Para decidir', 'Sistema'];
  function visibles() { return Object.entries(PANT).filter(([id, p]) => !p.oculta && puede(p.mod) && (!p.visible || p.visible())).map(([id, p]) => ({ id, ...p })); }
  function ir(ruta) {
    const [r, s] = String(ruta).split('/');
    if (!PANT[r] || (!PANT[r].libre && (!puede(PANT[r].mod) || (PANT[r].visible && !PANT[r].visible())))) { aviso('No tienes acceso a esa sección.', 'info'); return; }
    S.ruta = r; if (s) S.sub[r] = s;
    S.menu = false; cerrarFicha();
    $('#app').classList.remove('menu-abierto'); const vm = $('.velo-menu'); if (vm) vm.remove();
    pintarPagina(); guardar();
    const sc = $('#main'); if (sc) sc.scrollTop = 0;
  }
  function cuentaPend(id) {
    const p = PANT[id]; return p && p.cuenta ? p.cuenta() : 0;
  }
  function pintarArmazon() {
    const u = S.usuario; const vis = visibles();
    const nav = GRUPOS.map(g => {
      const items = vis.filter(p => p.grupo === g); if (!items.length) return '';
      return `<div class="nav-grupo"><p>${g}</p>${items.map(p => {
        const c = cuentaPend(p.id);
        const lect = !puede(p.mod, 'editar') && p.mod !== 'caja' && p.mod !== 'inicio' && p.mod !== 'auditoria' && p.mod !== 'salud';
        return `<button class="nav-item" data-ir="${p.id}">${ic(p.icono)}<span>${esc(p.corto || p.titulo)}</span>${c ? `<span class="cuenta">${c}</span>` : (lect ? `<span class="candado" title="Solo lectura">${ic('ojo', 'xs')}</span>` : '')}</button>`;
      }).join('')}</div>`;
    }).join('');
    const tabsIds = (u.tabs || []).filter(t => PANT[t] && puede(PANT[t].mod));
    const rol = D.ROLES[u.rol];
    const lectura = !['e', 'a'].includes(nivel('pagos')) && !['e', 'a'].includes(nivel('fiscal')) && !['p', 'r', 'a'].includes(nivel('nomina')) && !['e', 'a'].includes(nivel('personal')) && !['e', 'a'].includes(nivel('calendario'));
    $('#app').innerHTML = `
      <aside class="side" aria-label="Menú">
        <div class="side-top">
          <div class="marca"><span class="marca-sello" aria-hidden="true">R</span><div><b>Administración</b><small>Restaurante · ejemplo</small></div></div>
          <button class="sede" data-acc="sede">Sede Valencia ${ic('abajo', 's')}</button>
        </div>
        <nav class="side-nav">${nav}</nav>
        <div class="side-pie"><button class="yo" data-ir="cuenta"><span class="avatar">${iniciales(u)}</span><span><b>${esc(nombreDe(u))}</b><small>${esc(rol.nombre)}</small></span></button></div>
      </aside>
      <div class="col">
        <header class="top">
          <button class="redondo solo-tel" data-acc="menu" aria-label="Abrir el menú">${ic('menu')}</button>
          <div class="top-titulo"><small id="top-grupo"></small><b id="top-t"></b></div>
          <label class="buscar" for="buscar-top">${ic('buscar', 's')}<input id="buscar-top" placeholder="Buscar proveedor, factura, persona…" autocomplete="off" readonly data-acc="buscar"><kbd>⌘K</kbd></label>
          <div class="top-acc">
            ${lectura ? `<span class="lectura-chip">${ic('ojo', 's')}<span>Solo lectura</span></span>` : ''}
            <button class="redondo" data-ir="pendientes" aria-label="Pendientes">${ic('campana')}${misPendientes().length ? `<span class="cuenta">${misPendientes().length}</span>` : ''}</button>
          </div>
        </header>
        ${u.estado === 'aprendiz' ? `<div class="banda aprendiz">${ic('info', 's')}<span><b>Modo aprendiz ${esc(u.aprendiz)}.</b> Lo que registres que mueva plata queda para que otra persona lo apruebe.</span></div>` : ''}
        ${u.estado === 'por_confirmar' ? `<div class="banda aprendiz">${ic('info', 's')}<span><b>Acceso por confirmar.</b> ${esc(u.confirmar || 'Alejandro todavía no lo decide.')}</span></div>` : ''}
        <main class="scroll" id="main" tabindex="-1"></main>
        <nav class="tabs" aria-label="Secciones">${tabsIds.map(t => { const c = cuentaPend(t); return `<button class="tab" data-ir="${t}">${ic(PANT[t].icono)}${esc(PANT[t].tab || PANT[t].corto || PANT[t].titulo)}${c ? `<span class="cuenta">${c}</span>` : ''}</button>`; }).join('')}<button class="tab" data-acc="menu">${ic('menu')}Más</button></nav>
      </div>
      <div id="ficha-raiz"></div><div id="modal-raiz"></div><div id="buscador-raiz"></div>
      <div class="toast" id="toast" role="status" hidden></div>`;
  }
  function pintarPagina() {
    if (!S.usuario) return;
    const p = PANT[S.ruta]; const main = $('#main'); if (!main) return;
    main.innerHTML = p.render(S.sub[S.ruta]);
    if (p.montar) p.montar(main, S.sub[S.ruta]);
    if (window.APP && window.APP.alMontar) window.APP.alMontar(main);
    refrescarCuentas();
    $$('[data-ir]').forEach(b => { if (b.classList.contains('nav-item') || b.classList.contains('tab')) { if (b.dataset.ir === S.ruta) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); } });
    $('#top-t').textContent = p.titulo; $('#top-grupo').textContent = p.grupo || '';
    document.title = p.titulo + ' · Administración';
  }
  function refrescarCuentas() {
    $$('.nav-item[data-ir], .tab[data-ir]').forEach(b => {
      const c = cuentaPend(b.dataset.ir); let el = b.querySelector('.cuenta');
      if (c) { if (!el) { el = document.createElement('span'); el.className = 'cuenta'; const cand = b.querySelector('.candado'); if (cand) cand.remove(); b.appendChild(el); } el.textContent = c; } else if (el) el.remove();
    });
    const bell = $('.redondo[data-ir="pendientes"]'); if (bell) { const n = misPendientes().length; let el = bell.querySelector('.cuenta'); if (n) { if (!el) { el = document.createElement('span'); el.className = 'cuenta'; bell.appendChild(el); } el.textContent = n; } else if (el) el.remove(); }
  }
  function misPendientes() { return S.usuario ? D.PENDIENTES.filter(p => p.para.includes(S.usuario.id) && !p.hecho) : []; }

  /* ---------- buscador (⌘K) ---------- */
  function abrirBuscador() {
    const raiz = $('#buscador-raiz'); if (!raiz) return;
    const items = [];
    visibles().forEach(p => items.push({ t: p.titulo, s: 'Sección', ir: p.id }));
    if (puede('proveedores')) { D.PROVEEDORES.forEach(p => items.push({ t: p.nombre, s: 'Proveedor', abrir: 'proveedor:' + p.id })); D.FACTURAS.forEach(f => items.push({ t: 'Factura ' + f.num, s: provNombre(f.prov), abrir: 'factura:' + f.id })); }
    if (puede('clientes')) D.CLIENTES.forEach(c => items.push({ t: c.nombre, s: 'Cliente', abrir: 'cliente:' + c.id }));
    if (puede('personal')) D.EMPLEADOS.forEach(e => items.push({ t: e.nombre, s: e.cargo + (e.estado === 'egresado' ? ' · egresada' : ''), abrir: 'empleado:' + e.id }));
    if (puede('calendario')) D.RESERVAS.forEach(r => items.push({ t: r.nombre, s: 'Reserva · ' + r.d[0] + ' ' + D.MESES[r.d[1]] + ' ' + r.hora, abrir: 'reserva:' + r.id }));
    if (puede('fiscal')) D.OBLIGACIONES.forEach(o => items.push({ t: o.corto, s: 'Fiscal · vence ' + o.vence, abrir: 'obligacion:' + o.id }));
    raiz.innerHTML = `<div class="buscador" data-bus="fuera"><div class="buscador-caja" role="dialog" aria-label="Buscar"><input id="bus-in" placeholder="Escribe un nombre, una factura o una sección" autocomplete="off"><div class="buscador-res" id="bus-res"></div></div></div>`;
    const inp = $('#bus-in'); const res = $('#bus-res');
    const pinta = () => {
      const q = inp.value.trim().toLowerCase();
      const f = items.filter(i => !q || (i.t + ' ' + i.s).toLowerCase().includes(q)).slice(0, 12);
      res.innerHTML = f.length ? f.map((i, k) => `<button class="${k ? '' : 'sel'}" ${i.ir ? `data-ir="${i.ir}"` : `data-abrir="${i.abrir}"`}>${esc(i.t)}<small>${esc(i.s)}</small></button>`).join('') : '<p class="muted" style="padding:10px">No hay nada con ese nombre.</p>';
    };
    inp.addEventListener('input', pinta);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { const b = $('#bus-res button'); if (b) b.click(); } });
    pinta(); inp.focus();
  }
  const cerrarBuscador = () => { const r = $('#buscador-raiz'); if (r) r.innerHTML = ''; };
  const provNombre = id => (D.PROVEEDORES.find(p => p.id === id) || {}).nombre || '—';

  /* ---------- entrar ---------- */
  function pintarLogin() {
    const L = S.login;
    const u = L.u ? D.USUARIOS.find(x => x.id === L.u) : null;
    let paso = '';
    if (L.paso === 'quien') {
      paso = `<div class="login-paso">
        <form class="form" id="f-login" novalidate>
          <label class="campo" for="l-correo"><span>Correo</span><input id="l-correo" type="email" autocomplete="username" placeholder="tu@correo.com" value="${u ? esc(u.correo) : ''}"></label>
          <label class="campo" for="l-clave"><span>Clave</span><input id="l-clave" type="password" autocomplete="current-password" placeholder="Tu clave" value="${u ? '••••••••••' : ''}"></label>
          <p class="muted" id="l-msg"></p>
          <button class="btn pri full" type="submit">Entrar</button>
        </form>
        <div class="hoja" style="gap:10px"><p class="etq">Prototipo: elige quién entra</p><div class="quien">${D.USUARIOS.map(x => `<button data-login="${x.id}"><span class="avatar">${iniciales(x)}</span><span><b>${esc(nombreDe(x))}</b><small>${esc(D.ROLES[x.rol].nombre)}${x.estado === 'invitada' ? ' · invitación nueva' : x.estado === 'aprendiz' ? ' · aprendiz' : x.estado === 'por_confirmar' && !/por confirmar/.test(D.ROLES[x.rol].nombre) ? ' · por confirmar' : ''}</small></span></button>`).join('')}</div></div>
      </div>`;
    } else if (L.paso === 'codigo') {
      paso = `<div class="login-paso">
        <p>Hola, <b>${esc(u.nombre)}</b>. Escribe el código de 6 números de la app de códigos de tu teléfono.</p>
        <div class="codigo" role="group" aria-label="Código de 6 dígitos">${Array.from({ length: 6 }, (_, i) => `<input id="lc-${i}" inputmode="numeric" maxlength="1" aria-label="Dígito ${i + 1}" autocomplete="${i ? 'off' : 'one-time-code'}">`).join('')}</div>
        <p class="muted" id="lc-msg" style="text-align:center">En el prototipo vale cualquier número.</p>
        <button class="btn pri full" data-acc="login-codigo">Entrar</button>
        <button class="enlace" data-acc="login-respaldo" style="align-self:center">Perdí el teléfono: usar un código de respaldo</button>
        <p class="login-pie">Con 5 códigos o claves malas la cuenta se bloquea 15 minutos y le avisamos a Alejandro. La sesión se cierra sola a los 30 minutos sin uso o a las 12 horas.</p>
      </div>`;
    } else if (L.paso === 'invitacion') {
      paso = `<div class="login-paso">
        <ol class="pasos" aria-label="Pasos"><li class="${L.inv > 0 ? 'hecho' : 'actual'}">Clave</li><li class="${L.inv > 1 ? 'hecho' : L.inv === 1 ? 'actual' : ''}">Código</li><li class="${L.inv === 2 ? 'actual' : ''}">Respaldo</li></ol>
        ${L.inv === 0 ? `<p>Bienvenida, <b>${esc(u.nombre)}</b>. Alejandro te invitó como <b>${esc(D.ROLES[u.rol].nombre)}</b>. Crea tu clave.</p>
          <label class="campo" for="i-c1"><span>Clave nueva</span><input id="i-c1" type="password" autocomplete="new-password" value="••••••••••••"><small class="ayuda">Mínimo 12 caracteres. Una frase sirve.</small></label>
          <button class="btn pri full" data-acc="inv-sig">Seguir</button>` : ''}
        ${L.inv === 1 ? `<p>Abre la app de códigos (Google Authenticator, por ejemplo) y escanea este cuadro. Después escribe el código que te muestra.</p>${qr()}
          <div class="codigo">${Array.from({ length: 6 }, (_, i) => `<input inputmode="numeric" maxlength="1" aria-label="Dígito ${i + 1}">`).join('')}</div>
          <button class="btn pri full" data-acc="inv-sig">Activar el código</button>` : ''}
        ${L.inv === 2 ? `<p>Guarda estos 8 códigos de respaldo en un lugar seguro. Sirven una sola vez cada uno si pierdes el teléfono. No los volvemos a mostrar.</p>
          <div class="hoja mono" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:15px">${['4821-0093', '7710-2286', '0193-5547', '6602-1180', '3348-9021', '9015-4472', '2276-8810', '5530-0641'].map(c => `<span>${c}</span>`).join('')}</div>
          <button class="btn pri full" data-acc="inv-fin">Ya los guardé, entrar</button>
          <p class="login-pie">Los primeros 14 días entras en modo aprendiz: lo que registres que mueva plata lo aprueba otra persona.</p>` : ''}
      </div>`;
    } else if (L.paso === 'respaldo') {
      paso = `<div class="login-paso"><p>Escribe uno de tus 8 códigos de respaldo. Cada uno sirve una sola vez.</p>
        <label class="campo" for="l-resp"><span>Código de respaldo</span><input id="l-resp" class="mono" placeholder="0000-0000" autocomplete="off"></label>
        <button class="btn pri full" data-acc="login-codigo">Entrar</button>
        <p class="login-pie">Si no tienes ni el teléfono ni los códigos, pídele a Alejandro que te resetee el doble factor. Queda registrado.</p>
        <button class="enlace" data-acc="login-volver">Volver</button></div>`;
    }
    $('#app').innerHTML = `<div class="login">
      <div class="login-arte"><div class="marca"><span class="marca-sello" style="background:var(--sobre-tinta);color:var(--tinta)">R</span><div><b>Administración</b><small style="color:inherit;opacity:.7">Restaurante · ejemplo</small></div></div>
        <blockquote>El libro de la casa, con cada cifra en su sitio y cada cambio firmado.</blockquote>
        <p>Cada persona entra con su usuario y su código. Cada uno ve solo lo suyo. Nada se borra: se anula con motivo.</p></div>
      <div class="login-caja"><div><p class="kicker">${L.paso === 'invitacion' ? 'Activar tu cuenta' : 'Entrar'}</p><h1>${L.paso === 'codigo' ? 'Tu código' : L.paso === 'invitacion' ? 'Tu cuenta nueva' : 'Buenas tardes'}</h1></div>${paso}</div>
    </div><div id="modal-raiz"></div><div class="toast" id="toast" role="status" hidden></div>`;
    if (L.paso === 'codigo' || (L.paso === 'invitacion' && L.inv === 1)) {
      const ins = $$('.codigo input'); ins[0] && ins[0].focus();
      ins.forEach((inp, i) => inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(-1); if (inp.value && ins[i + 1]) ins[i + 1].focus(); }));
    }
    const fl = $('#f-login');
    if (fl) fl.addEventListener('submit', e => {
      e.preventDefault();
      const c = $('#l-correo').value.trim().toLowerCase();
      const x = D.USUARIOS.find(z => z.correo === c);
      if (!x) { $('#l-msg').textContent = 'Ese correo no tiene cuenta. Elige una persona de la lista de abajo.'; return; }
      S.login = { paso: x.estado === 'invitada' ? 'invitacion' : 'codigo', u: x.id, inv: 0 }; pintarLogin();
    });
  }
  function qr() {
    let cells = ''; let seed = 7;
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
      seed = (seed * 9301 + 49297) % 233280;
      const ojo = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      let on = seed / 233280 > .5;
      if (ojo) { const lx = x > 13 ? x - 14 : x, ly = y > 13 ? y - 14 : y; on = lx === 0 || ly === 0 || lx === 6 || ly === 6 || (lx > 1 && lx < 5 && ly > 1 && ly < 5); }
      if (on) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    return `<svg class="qr" viewBox="0 0 21 21" role="img" aria-label="Cuadro para la app de códigos (simulado)"><g fill="#18202E">${cells}</g></svg>`;
  }
  function entrar(id) {
    const u = D.USUARIOS.find(x => x.id === id); if (!u) return;
    S.usuario = u; S.ruta = 'inicio'; S.sub = {}; S.login = { paso: 'quien', u: null };
    $('#ver-como').value = u.id;
    pintarArmazon(); pintarPagina(); guardar();
  }
  function salir() { S.usuario = null; S.login = { paso: 'quien', u: null }; $('#ver-como').value = ''; pintarLogin(); guardar(); }

  /* ---------- guardar preferencias del visitante ---------- */
  function guardar() { try { localStorage.setItem('proto-v2', JSON.stringify({ u: S.usuario && S.usuario.id, r: S.ruta, f: S.formato })); } catch (_) {} }
  function leer() { try { return JSON.parse(localStorage.getItem('proto-v2') || '{}'); } catch (_) { return {}; } }

  /* ---------- formato (teléfono, iPad, computadora) ---------- */
  function ponerFormato(f) {
    S.formato = f; $('#stage').dataset.formato = f;
    $$('[data-formato]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.formato === f)));
    guardar();
  }

  /* ---------- eventos ---------- */
  ACC.menu = () => {
    const app = $('#app'); const abierto = app.classList.toggle('menu-abierto');
    if (abierto) { const v = document.createElement('button'); v.className = 'velo-menu'; v.setAttribute('aria-label', 'Cerrar el menú'); v.dataset.acc = 'menu'; app.appendChild(v); }
    else { const v = $('.velo-menu'); if (v) v.remove(); }
  };
  ACC.buscar = abrirBuscador;
  ACC.sede = () => aviso('Hoy solo existe la sede Valencia. La tabla de sedes queda lista para cuando se venda la app a otro restaurante.', 'info');
  ACC['ver-archivo'] = arg => aviso('Abriría «' + arg + '» con un enlace que caduca en 5 minutos.', 'info');
  ACC['login-codigo'] = () => {
    const ins = $$('.codigo input');
    if (ins.length && !ins.every(x => /\d/.test(x.value))) { const m = $('#lc-msg'); if (m) m.textContent = 'El código tiene 6 números.'; return; }
    entrar(S.login.u);
  };
  ACC['login-respaldo'] = () => { S.login.paso = 'respaldo'; pintarLogin(); };
  ACC['login-volver'] = () => { S.login.paso = 'codigo'; pintarLogin(); };
  ACC['inv-sig'] = () => { S.login.inv++; pintarLogin(); };
  ACC['inv-fin'] = () => {
    const u = D.USUARIOS.find(x => x.id === S.login.u); u.estado = 'aprendiz'; u.aprendiz = 'hasta el 19 de octubre'; u.dosfa = true; u.ultimo = 'Hoy ' + D.HOY.hora;
    entrar(u.id); aviso('Cuenta activada. Bienvenida.');
  };

  document.addEventListener('click', e => {
    const t = e.target;
    const lg = t.closest('[data-login]'); if (lg) { const u = D.USUARIOS.find(x => x.id === lg.dataset.login); S.login = { paso: u.estado === 'invitada' ? 'invitacion' : 'codigo', u: u.id, inv: 0 }; pintarLogin(); return; }
    const fi = t.closest('[data-ficha]');
    if (fi) {
      const a = fi.dataset.ficha;
      if (a === 'cerrar') cerrarFicha();
      else if (a === 'editar') { S.ficha.editando = true; pintarFicha(); }
      else if (a === 'cancelar') { S.ficha.editando = false; pintarFicha(); }
      else if (a === 'guardar') guardarFicha();
      else if (a === 'sin-permiso') aviso('Solo lectura: pídeselo a ' + quienEdita(S.ficha.spec.mod) + '.', 'info');
      else if (a === 'cerrada') aviso(S.ficha.spec.bloqueo || 'Está cerrado: ya no se edita. Se corrige con un movimiento al revés.', 'info');
      else if (a === 'anular') {
        const spec = S.ficha.spec;
        pedirMotivo({ titulo: 'Anular «' + spec.titulo + '»', texto: 'No se borra: queda tachado, con el motivo, quién y cuándo.', boton: 'Anular', tono: 'peligro', codigo: true }).then(m => {
          spec.obj.anulada = true; spec.obj.estado = 'anulada';
          auditar({ modulo: nombreModulo(spec.mod), registro: spec.registro || spec.titulo, campo: 'estado', antes: 'vigente', despues: 'anulada', motivo: m });
          pintarFicha(); pintarPagina(); aviso('Anulado. Sigue visible, tachado, en el registro.');
        }).catch(() => {});
      }
      return;
    }
    const bu = t.closest('[data-bus="fuera"]'); if (bu && t === bu) { cerrarBuscador(); return; }
    const go = t.closest('[data-ir]'); if (go && !go.closest('.proto')) { e.preventDefault(); cerrarBuscador(); ir(go.dataset.ir); return; }
    const ab = t.closest('[data-abrir]'); if (ab) { cerrarBuscador(); const [tp, id] = ab.dataset.abrir.split(':'); abrir(tp, id); return; }
    const sb = t.closest('[data-sub]'); if (sb) { S.sub[S.ruta] = sb.dataset.sub; pintarPagina(); return; }
    const ac = t.closest('[data-acc]'); if (ac && ACC[ac.dataset.acc]) { ACC[ac.dataset.acc](ac.dataset.arg, ac, e); return; }
  });
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && S.usuario) { e.preventDefault(); abrirBuscador(); return; }
    if (e.key === 'Escape') {
      if ($('#modal-raiz') && $('#modal-raiz').innerHTML) return;
      if ($('#buscador-raiz') && $('#buscador-raiz').innerHTML) { cerrarBuscador(); return; }
      if (S.ficha) { cerrarFicha(); return; }
      if ($('#app').classList.contains('menu-abierto')) ACC.menu();
    }
    if (e.key === 'Enter' && e.target.matches('tr[data-abrir]')) e.target.click();
  });

  /* ---------- arranque ---------- */
  function arrancar() {
    sprite();
    // barra del prototipo
    $('#ver-como').innerHTML = '<option value="">Nadie (pantalla de entrar)</option>' + D.USUARIOS.map(u => `<option value="${u.id}">${esc(nombreDe(u))} · ${esc(D.ROLES[u.rol].nombre)}</option>`).join('');
    $('#ver-como').addEventListener('change', e => { if (e.target.value) entrar(e.target.value); else salir(); });
    $$('[data-formato]').forEach(b => b.addEventListener('click', () => ponerFormato(b.dataset.formato)));
    $('#pantalla-completa').addEventListener('click', () => {
      const el = document.documentElement;
      if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
      ponerFormato('compu');
      if (el.requestFullscreen) el.requestFullscreen().catch(() => aviso('Este navegador no deja poner pantalla completa desde aquí. Prueba con la tecla F11 o Ctrl+Cmd+F.', 'info'));
    });
    $('#ver-revision').addEventListener('click', () => { if (!S.usuario) entrar('alejandro'); ir('revision'); });
    $('#salir').addEventListener('click', salir);
    const g = leer();
    const ancho = window.innerWidth;
    ponerFormato(g.f || (ancho >= 1100 ? 'compu' : ancho >= 760 ? 'ipad' : 'compu'));
    if (g.u && D.USUARIOS.find(u => u.id === g.u)) { entrar(g.u); if (g.r && PANT[g.r] && (PANT[g.r].libre || puede(PANT[g.r].mod))) ir(g.r); }
    else pintarLogin();
  }

  window.APP = { D, S, PANT, FICHAS, ACC, $, $$, esc, fmt, dinero, leerNum, ic, tag, nivel, puede, quienEdita, aviso, auditar, pedirCodigo, pedirMotivo, confirmar, abrir, cerrarFicha, pintarFicha, pintarPagina, pintarArmazon, ir, misPendientes, provNombre, iniciales, nombreDe, nombreModulo, arrancar };
})();
