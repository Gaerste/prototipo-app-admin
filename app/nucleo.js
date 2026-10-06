/* Núcleo del prototipo: estado, permisos, armazón, ficha de detalle, código de 6 dígitos, registro de cambios. */
(() => {
  const D = window.DB;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  /* ---------- números en formato venezolano ---------- */
  // fmt y dinero viven al principio de los datos (datos.js): así los textos de ejemplo pasan por la misma pieza que las pantallas
  // dinero(monto, moneda, decimales) no tiene moneda por defecto: cada monto dice la suya ('bs', 'usd', 'eur' o 'usdt')
  const { fmt, dinero } = D;
  const NB = '\u00a0';
  // los montos que vienen escritos dentro de un texto también se juntan al dibujar la página o la ficha (el símbolo con su número)
  // (cada monto sale de dinero(); los únicos escritos a mano que quedan son los de la página «Lo que falta», que no se toca)
  // también «≈ $ 12»: el «≈» no se separa de su monto
  const RE_MONTO = /(\$|\bBs|€|≈) (?=[−-]?(?:\d|\$|Bs|€))|(\d) (?=USDT\b)/g;
  function juntarMontos(raiz) {
    if (!raiz) return;
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentNode && n.parentNode.nodeName === 'TEXTAREA' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    for (let n = w.nextNode(); n; n = w.nextNode()) { const t = n.nodeValue; if (t.length > 2 && / /.test(t)) { const r = t.replace(RE_MONTO, (m, s, d) => (s || d) + NB); if (r !== t) n.nodeValue = r; } }
  }
  // leer un número escrito a mano: la coma es la de los decimales (2,5); un punto con 1 o 2 cifras detrás también (2.5 = 2,5)
  // y con 3 cifras detrás es de miles (1.500 = mil quinientos); si vienen coma y punto, el último que aparece es el de los decimales
  const leerNum = v => {
    let t = String(v ?? '').trim().replace(/[^\d,.-]/g, '');
    const coma = t.lastIndexOf(','), punto = t.lastIndexOf('.');
    if (coma >= 0 && punto >= 0) t = coma > punto ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
    else if (coma >= 0) t = t.indexOf(',') !== coma ? t.replace(/,/g, '') : t.replace(',', '.');
    else if (punto >= 0) { const p = t.split('.'); if (p.length > 2 || p[1].length === 3) t = t.replace(/\./g, ''); }
    const n = parseFloat(t); return isNaN(n) ? null : n;
  };
  // un número como se ve en la app, con los decimales que tenga y sin ceros de más: 2,5 · 12 · 1.500 · 0,75 (sinMiles: 1488, para un número de Z)
  const numTxt = (n, sinMiles = false) => {
    if (n === null || n === undefined || n === '' || isNaN(n)) return '';
    const x = +n; const c = Math.round(Math.abs(x) * 100) % 100;
    const s = fmt(x, c ? (c % 10 ? 2 : 1) : 0);
    return sinMiles ? s.replace(/\./g, '') : s;
  };

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
    copiar: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    // la dirección exacta de una ficha (para mandarla por WhatsApp)
    enlace: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    senal: '<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>',
    // Personal: el libro del personal (Clientes tiene el de las dos personas) · Prestaciones: la alcancía de lo que se va guardando
    personal: '<path d="M15 13a3 3 0 1 0-6 0"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><circle cx="12" cy="8" r="2"/>',
    prestaciones: '<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/>',
    engranaje: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    // el radar de precios (la pestaña «Precios» de compras): una etiqueta de precio
    etiqueta: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  };
  const ic = (n, c = '') => `<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  function sprite() {
    const d = document.createElement('div');
    d.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      Object.entries(ICONOS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('') + '</defs></svg>';
    document.body.prepend(d.firstChild);
  }

  const tag = (t, tono = '') => `<span class="tag ${tono}">${esc(t)}</span>`;
  // con Cecilia adentro se le habla a ella («Aquí llenas lo fiscal», «tu pregunta 8», «contigo»); con los demás, se la nombra
  // aCecilia(tú, ella) es para los textos de las pantallas; paraCecilia(texto), para los textos guardados (una regla, una nota de los datos)
  const esCecilia = () => !!(S.usuario && S.usuario.rol === 'fiscal_externo');
  const aCecilia = (tu, ella) => (esCecilia() ? tu : ella);
  const paraCecilia = t => !esCecilia() ? t : String(t ?? '').replace(/\bpregunta (\d+) (?:a|para) Cecilia\b/g, 'tu pregunta $1')
    .replace(/\b(confirmar|revisar) con Cecilia o (?:con )?el abogado\b/g, '$1lo contigo o con el abogado').replace(/\bcon Cecilia\b/g, 'contigo');
  const iniciales = u => (u.nombre[0] + (u.apellido ? u.apellido[0] : (u.nombre.split(' ')[1] || ' ')[0])).toUpperCase();
  const nombreDe = u => (u.nombre + (u.apellido ? ' ' + u.apellido : '')).trim();

  /* ---------- estado ---------- */
  // borrador: el formulario en el que alguien escribió y todavía no guardó ({ ruta, sub, form, id }): id es su borrador guardado en el equipo
  // ponerBorrador: el borrador que vuelve al formulario la próxima vez que se dibuje («Seguir», al recargar, con Atrás y Adelante)
  // destino: la dirección que trajo el enlace cuando nadie había entrado todavía (al entrar, la app va ahí)
  // vista: la última pantalla y pestaña dibujadas, para saber cuándo se sale de un formulario (alSalir)
  const S = { usuario: null, ruta: 'inicio', sub: {}, formato: 'compu', menu: false, ficha: null, borrador: null, ponerBorrador: null, destino: null, vista: null, login: { paso: 'quien', u: null } };
  // pantallas registradas · además de titulo, render y montar, una pantalla puede traer:
  // transitorias: las pestañas que son formularios (la pestaña o el menú no vuelven ahí, sino a la vista principal)
  // alSalir(sub): lo que borra al dejar esa pestaña (la confirmación, el formulario: lo escrito ya quedó en su borrador)
  // borradores: { sub: { tomar, poner, txt, vacio } }: cómo se guarda en el equipo lo escrito en cada formulario (ver «borradores en el equipo»)
  // subs: otras secciones que valen en su dirección además de sus pestañas y sus formularios (la vista principal con nombre)
  const PANT = {};
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
  // quién aprueba en un módulo (para explicar un botón con candado a quien edita pero no aprueba)
  const quienAprueba = mod => {
    const nombres = D.USUARIOS.filter(u => !['por_confirmar', 'sin_acceso'].includes(u.estado) && puede(mod, 'aprobar', u)).map(u => u.nombre);
    return nombres.length ? nombres.join(', ').replace(/, ([^,]*)$/, ' o $1') : 'Alejandro';
  };

  /* ---------- una sola regla de quién puede hacer qué ----------
     La consultan el botón al dibujarse (A.boton y las acciones de las fichas), la acción al tocarla y la ficha al guardar: así no se
     muestra un botón que después dice «no puedes», ni se guarda de una vez lo que tenía que esperar otra firma.
     que: { mod, permiso ('editar' o 'aprobar'), plata (mueve plata), limite (un tope de Parámetros › Límites), monto (en la moneda del tope) }
     modo: 'oculto' (no ve el módulo) · 'leer' (solo mira: el botón no se le muestra) · 'candado' (edita, pero eso lo aprueba otra persona)
           · 'aprobar' (aprendiz: lo que mueve plata espera la firma de otra persona) · 'tope' (pasa su tope: queda pendiente de quien está arriba)
           · 'directo' (lo hace, y queda en el registro de cambios) */
  const activoDe = u => !['por_confirmar', 'sin_acceso', 'invitada'].includes(u.estado);
  // quien aprueba lo de un aprendiz: alguien activo que edite ese módulo y que ya no esté aprendiendo; primero quien no es el dueño (su tiempo vale)
  function aprobadorDe(mod, u = S.usuario) {
    const xs = D.USUARIOS.filter(x => x !== u && activoDe(x) && x.estado !== 'aprendiz' && puede(mod, 'editar', x));
    return xs.find(x => x.rol !== 'dueno') || xs.find(x => x.rol === 'dueno') || D.USUARIOS.find(x => x.rol === 'dueno');
  }
  // el tope de una persona en un tipo de movimiento (Parámetros › Límites): el dueño no tiene tope; quien está en la lista (ids), el suyo;
  // cualquier otra persona que edite tiene el tope «por decidir»: vale 0 y lo que haga queda pendiente de quien está arriba
  function topeDe(id, u = S.usuario) {
    const L = (D.LIMITES || []).find(l => l.id === id); if (!L || L.hasta == null || !u || u.rol === 'dueno') return null;
    return (L.ids || []).includes(u.id) ? L : { ...L, hasta: 0, sinTope: true };
  }
  function regla({ mod, permiso = 'editar', plata = false, limite = null, monto = null, u = S.usuario } = {}) {
    if (!u || !puede(mod, 'ver', u)) return { modo: 'oculto', quien: quienEdita(mod) };
    if (!puede(mod, 'editar', u)) return { modo: 'leer', quien: quienEdita(mod) };
    if (permiso === 'aprobar' && !puede(mod, 'aprobar', u)) return { modo: 'candado', quien: quienAprueba(mod) };
    if (plata && u.estado === 'aprendiz') { const a = aprobadorDe(mod, u); return { modo: 'aprobar', quien: a.nombre, para: a.id }; }
    const L = limite ? topeDe(limite, u) : null;
    if (L && monto != null && Math.abs(monto) > L.hasta + 0.005) {
      const a = D.USUARIOS.find(x => x.nombre === L.arriba) || D.USUARIOS.find(x => x.rol === 'dueno');
      return { modo: 'tope', quien: a.nombre, para: a.id, hasta: L.hasta, mon: L.mon || 'usd', monto: Math.abs(monto), limite: L, sinTope: !!L.sinTope };
    }
    return { modo: 'directo' };
  }
  // lo que dice una acción con candado al tocarla, o la de quien solo mira: lo mismo en el botón, en la ficha y en el pendiente
  const porQueNo = r => r.modo === 'candado' ? 'Esto lo aprueba ' + r.quien + '.' : 'Solo lectura: pídeselo a ' + r.quien + '.';
  // las acciones con nombre que mueven plata o piden un permiso: el clic se revisa aquí antes de llegar a la acción (la misma regla del botón)
  const REGLAS_ACC = {};
  const reglaAcc = (nombres, que) => [].concat(nombres).forEach(n => { REGLAS_ACC[n] = que; });
  // el «$ 80» de un tope: sin céntimos si no los tiene
  const montoTope = (n, mon) => dinero(n, mon, Math.round(n * 100) % 100 ? 2 : 0);

  /* ---------- el teclado no pierde su lugar ---------- */
  // la «clave» de un botón o una fila sirve para encontrar el mismo después de volver a dibujar la página
  const claveDe = el => {
    if (!el || !el.tagName || el === document.body) return '';
    if (el.id) return '#' + CSS.escape(el.id);
    const attrs = [...el.attributes].filter(a => a.name.startsWith('data-') && !['data-tocado', 'data-txt'].includes(a.name));
    return attrs.length ? el.tagName.toLowerCase() + attrs.map(a => `[${a.name}="${CSS.escape(a.value)}"]`).join('') : '';
  };
  // al cerrarse una ventana (con su botón, con Escape o al terminar), el teclado vuelve a donde estaba; si eso ya no existe, a la ficha abierta
  let ultimoFoco = null;
  document.addEventListener('focusin', e => { const t = e.target; if (t && t.closest && !t.closest('#modal-raiz')) ultimoFoco = t; });
  /* las capas: con una ficha, el buscador o una ventana abiertos, lo de atrás queda dormido (inert): el tabulador no entra ahí
     y el lector de pantalla tampoco · el orden de arriba hacia abajo es ventana → buscador → ficha → la página */
  const llena = id => { const r = document.getElementById(id); return !!(r && r.firstChild); };
  function capas() {
    if (!document.getElementById('app')) return;
    const modal = llena('modal-raiz'), bus = llena('buscador-raiz'), ficha = llena('ficha-raiz');
    const dormir = (el, si) => { if (el && el.inert !== si) el.inert = si; };
    $$('#app > .side, #app > .col, #app > .login, #app > .velo-menu').forEach(el => dormir(el, modal || bus || ficha));
    dormir(document.getElementById('ficha-raiz'), modal || bus);
    dormir(document.getElementById('buscador-raiz'), modal);
  }
  // lo que se puede alcanzar con el tabulador dentro de una capa (visible, sin desactivar, sin tabindex="-1")
  const enfocables = raiz => $$('a[href], button, input, select, textarea, [tabindex]', raiz)
    .filter(el => !el.disabled && el.tabIndex >= 0 && !el.closest('[inert]') && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
  const capaArriba = () => $('#modal-raiz .modal') || $('#buscador-raiz .buscador-caja') || $('#ficha-raiz .ficha');
  // el tabulador da la vuelta dentro de la capa de arriba: del último vuelve al primero, y al revés (nunca se va a lo de atrás)
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey) return;
    const capa = capaArriba(); if (!capa) return;
    const fs = enfocables(capa); e.preventDefault(); if (!fs.length) return;
    const a = document.activeElement; const dentro = a && capa.contains(a);
    const sig = !dentro ? null : e.shiftKey ? [...fs].reverse().find(el => el !== a && (a.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING))
      : fs.find(el => el !== a && (a.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING));
    (sig || (e.shiftKey ? fs[fs.length - 1] : fs[0])).focus();
  });
  function vigilarVentanas() {
    const raiz = document.getElementById('modal-raiz'); if (!raiz || raiz.dataset.vigilada) return; raiz.dataset.vigilada = '1';
    new MutationObserver(() => {
      capas(); // también las ventanas hechas a mano (las que se cierran vaciando la raíz)
      if (raiz.firstChild) return;
      const a = document.activeElement; if (a && a !== document.body && a.isConnected) return;
      const el = (ultimoFoco && ultimoFoco.isConnected && !ultimoFoco.closest('[inert]') && ultimoFoco) || document.getElementById('ficha-t') || document.getElementById('main');
      if (el) el.focus({ preventScroll: true });
    }).observe(raiz, { childList: true });
  }

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

  /* ---------- lo que espera otra firma ----------
     Lo que cambia un aprendiz y mueve plata (un monto, emitir un comprobante), o lo que pasa el tope de quien lo hace, no se guarda todavía:
     queda «por aprobar». En la ficha, el valor de antes sigue a la vista, tachado, y el nuevo va a lápiz con «Por aprobar · Jose»; el sello
     de tinta sale solo al aprobar. A quien aprueba le llega el pendiente con el antes → después y dos botones: «Aprobar» y «Devolver».
     Una propuesta: { clave: 'retrec:rr1' (la ficha), titulo, registro, modulo, cambios: [{ k, l, antes, nuevo, antesTxt, nuevoTxt }] o
     accion: { nombre, arg, txt }, quien, para, porque: 'aprobar' | 'tope', estado: 'por_aprobar' | 'aprobada' | 'devuelta' } */
  const POR_APROBAR = D.POR_APROBAR || (D.POR_APROBAR = []);
  const propuestaDe = clave => POR_APROBAR.find(p => p.clave === clave && p.estado === 'por_aprobar') || null;
  const aprobadaDe = clave => [...POR_APROBAR].reverse().find(p => p.clave === clave && p.estado !== 'por_aprobar') || null;
  // lo que hace una acción al aprobarse (EJECUTA) o al devolverse (DEVUELVE): cada pantalla registra las suyas
  const EJECUTA = {}, DEVUELVE = {};
  const detallePropuesta = p => p.cambios.length ? p.cambios.map(c => c.l + ': ' + c.antesTxt + ' → ' + c.nuevoTxt).join(' · ') : (p.accion ? p.accion.txt : '');
  function proponer({ clave, titulo, registro, modulo, cambios = [], accion = null, motivo = '', r }) {
    const u = S.usuario; const id = 'pa' + Date.now() + Math.floor(Math.random() * 1000);
    const p = { id, clave, titulo, registro, modulo, cambios, accion, motivo, quien: u.nombre, quienId: u.id, para: r.para, paraNombre: r.quien, porque: r.modo,
      tope: r.modo === 'tope' ? { hasta: r.hasta, mon: r.mon, monto: r.monto, sinTope: !!r.sinTope } : null, cuando: 'Hoy ' + D.HOY.hora, estado: 'por_aprobar' };
    POR_APROBAR.push(p);
    // el pendiente solo le llega a quien puede aprobarlo
    nuevoPendiente({ id: 'pe' + id, para: [r.para], tipo: 'info', titulo: (r.modo === 'tope' ? 'Aprobar un ajuste de ' : 'Aprobar un cambio de ') + u.nombre, sub: registro + ' · ' + detallePropuesta(p), de: u.nombre, edad: 'Ahora', propuesta: id, abrir: clave });
    auditar({ modulo, registro, campo: accion ? accion.campo || 'acción' : cambios.map(c => c.l.toLowerCase()).join(', '), antes: cambios.length ? cambios.map(c => c.antesTxt).join(' · ') : '—', despues: (cambios.length ? cambios.map(c => c.nuevoTxt).join(' · ') + ' · ' : (accion ? accion.txt + ' · ' : '')) + 'por aprobar (' + r.quien + ')', motivo });
    return p;
  }
  /* cada pendiente guarda dónde se resuelve: su pantalla (ir), su sección (sub2) y su ficha (abrir). Si el que lo crea solo nombra la ficha,
     la pantalla y la sección salen de dónde vive esa ficha (CASA) · nuevoPendiente es la única puerta para crearlos */
  function ubicarPend(p) {
    if (!p) return p;
    if (p.ir && String(p.ir).includes('/')) { const [a, b] = String(p.ir).split('/'); p.ir = a; if (b && !p.sub2) p.sub2 = b; }
    if (!p.ir && p.abrir) { const c = CASA[String(p.abrir).split(':')[0]]; if (c) { const [a, b] = c.split('/'); p.ir = a; if (b) p.sub2 = b; } }
    return p;
  }
  function nuevoPendiente(p) { D.PENDIENTES.unshift(ubicarPend(p)); return p; }
  const cierraPropuesta = (p, hecho) => D.PENDIENTES.filter(x => x.propuesta === p.id && !x.hecho).forEach(x => { x.hecho = hecho; });
  const minuscula = t => String(t || '').charAt(0).toLowerCase() + String(t || '').slice(1);
  // el dato que espera otra firma: el de antes tachado (sigue valiendo) y el nuevo a lápiz
  const porAprobarHtml = (c, p) => `<span class="por-aprobar"><s>${esc(c.antesTxt)}</s> <span class="lapiz">${esc(c.nuevoTxt)}</span><small>Por aprobar · ${esc(p.paraNombre)}</small></span>`;

  /* ---------- ventanas: código de 6 dígitos y motivo ---------- */
  // clase: la ventana del código lleva «firma» y la que abre con un campo para escribir lleva «teclado»: en el teléfono las dos suben
  // arriba, para que el campo y el botón queden sobre el teclado · el título lleva id="modal-t" (es el nombre de la ventana)
  function modal(html, clase = '') {
    const raiz = $('#modal-raiz');
    raiz.innerHTML = `<div class="modal-env${clase ? ' de-' + clase : ''}" role="presentation"><div class="modal${clase ? ' ' + clase : ''}" role="dialog" aria-modal="true"${/id="modal-t"/.test(html) ? ' aria-labelledby="modal-t"' : ''}${/id="modal-d"/.test(html) ? ' aria-describedby="modal-d"' : ''}>${html}</div></div>`;
    capas();
    return raiz.firstChild;
  }
  const cerrarModal = () => { const r = $('#modal-raiz'); if (r) { r.onclick = null; r.innerHTML = ''; } capas(); };
  /* el código de 6 números: una sola casilla dibujada como 6 cajitas. Acepta escribir, pegar (aunque traiga espacios o guiones),
     la sugerencia del teclado y el relleno automático del teléfono (autocomplete="one-time-code"): todo entra a la misma casilla.
     Es la misma pieza en la ventana del código, en la pantalla de entrar y al activar la cuenta. */
  const casillaCodigo = (id, msg = '') => `<div class="codigo" data-codigo><input id="${id}" class="codigo-in" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" spellcheck="false" autocorrect="off" autocapitalize="off" aria-label="Código de 6 números"${msg ? ` aria-describedby="${msg}"` : ''}><span class="codigo-cajas" aria-hidden="true">${'<i></i>'.repeat(6)}</span></div>`;
  // enviar: lo que pasa con el 6.º número o con Enter (la ventana revisa que estén los 6)
  // el cursor (que no se ve) va siempre al final, que es la cajita resaltada: tocar una cajita llena no cambia otro número;
  // escribir llena la siguiente y borrar quita la última
  function montarCodigo(raiz, { enviar } = {}) {
    const inp = raiz.querySelector('.codigo-in'); if (!inp) return null;
    const cajas = [...raiz.querySelectorAll('.codigo-cajas i')];
    const pinta = () => { const v = inp.value; const enFoco = document.activeElement === inp; cajas.forEach((c, i) => { c.textContent = v[i] || ''; c.classList.toggle('llena', !!v[i]); c.classList.toggle('activa', enFoco && i === Math.min(v.length, 5)); }); };
    const alFinal = () => { const n = inp.value.length; if (inp.selectionStart !== n || inp.selectionEnd !== n) { try { inp.setSelectionRange(n, n); } catch (_) { /* sin selección en este navegador */ } } };
    const limpia = () => { const v = inp.value.replace(/\D/g, '').slice(0, 6); if (inp.value !== v) inp.value = v; alFinal(); pinta(); if (v.length === 6 && enviar) enviar(v); };
    inp.addEventListener('input', limpia);
    // pegar «123 456» o «123-456» deja los 6 números; lo pegado sin números no borra lo que ya estaba escrito
    inp.addEventListener('paste', e => { e.preventDefault(); const d = ((e.clipboardData && e.clipboardData.getData('text')) || '').replace(/\D/g, '').slice(0, 6); if (!d) return; inp.value = d; limpia(); });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && enviar) { e.preventDefault(); enviar(inp.value); return; }
      // las flechas, Inicio y Fin no mueven el cursor: así no se escribe en medio
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) { e.preventDefault(); alFinal(); }
    });
    ['focus', 'click', 'pointerup', 'keyup', 'select'].forEach(ev => inp.addEventListener(ev, () => { alFinal(); if (ev === 'focus') pinta(); }));
    inp.addEventListener('blur', pinta);
    pinta(); return inp;
  }
  const errorCodigo = (msg, inp) => { if (msg) { msg.textContent = 'El código tiene 6 números.'; msg.classList.add('error'); } if (inp) inp.focus(); };
  // la ventana del código dice arriba qué se firma (qué, a quién y cuánto) y el botón dice la acción («Aprobar $ 200»), no «Confirmar»
  // op: un texto suelto, o { que, det, boton, tono } · que y det llegan ya escapados (pueden traer el resaltador de una cuenta)
  // un monto no se parte entre dos renglones: «$ 237,60» va junto
  const montoJunto = h => String(h || '').replace(/(\$|Bs|€) (?=[−\d])/g, (_, s) => s + '\u00a0');
  function pedirCodigo(op = 'Esta acción pide tu código.') {
    const o0 = typeof op === 'string' ? { que: esc(op) } : (op || {});
    const o = { ...o0, que: montoJunto(o0.que), det: montoJunto(o0.det) };
    return new Promise((ok, no) => {
      const env = modal(`<h2 id="modal-t">Tu código</h2>
        ${o.que || o.det ? `<div class="firma-que" id="modal-d">${o.que ? `<p class="firma-t">${o.que}</p>` : ''}${o.det ? `<p class="firma-det">${o.det}</p>` : ''}</div>` : ''}
        ${casillaCodigo('cod-in', 'cod-msg')}
        <p class="muted codigo-msg" id="cod-msg" aria-live="polite">Está en tu app de códigos. En el prototipo vale cualquier número.</p>
        <div class="modal-acc"><button class="btn sec" data-m="no">Cancelar</button><button class="btn ${o.tono || 'pri'}" data-m="si">${esc(o.boton || 'Firmar')}</button></div>`, 'firma');
      let hecho = false;
      const firmar = () => {
        if (hecho) return;
        if (!/^\d{6}$/.test(inp.value)) { errorCodigo($('#cod-msg', env), inp); return; }
        hecho = true; cerrarModal(); ok(true);
      };
      const inp = montarCodigo(env, { enviar: firmar }); inp.focus();
      env.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; if (b.dataset.m === 'si') firmar(); else { hecho = true; cerrarModal(); no(); } });
    });
  }
  // codigo: true (la ventana del código repite el título y el botón) o { que, det, boton, tono } · cancelar: el botón para salir («No, dejarla»)
  function pedirMotivo({ titulo, texto = '', boton = 'Confirmar', tono = 'pri', codigo = false, etiqueta = 'Motivo', obligatorio = true, valor = '', cancelar = 'Cancelar' }) {
    return new Promise((ok, no) => {
      const env = modal(`<h2 id="modal-t">${esc(titulo)}</h2>${texto ? `<div class="muted" id="modal-d">${texto}</div>` : ''}
        <label class="campo" for="motivo-txt"><span>${esc(etiqueta)}${obligatorio ? '' : ' (opcional)'}</span><textarea id="motivo-txt" placeholder="Escribe por qué. Queda en el registro de cambios.">${esc(valor)}</textarea><small class="ayuda" id="motivo-msg"></small></label>
        ${codigo ? `<p class="muted" style="display:flex;gap:6px;align-items:center">${ic('candado', 's')}Después te pide tu código.</p>` : ''}
        <div class="modal-acc"><button class="btn sec" data-m="no">${esc(cancelar)}</button><button class="btn ${tono}" data-m="si">${esc(boton)}</button></div>`, 'teclado');
      $('#motivo-txt', env).focus();
      env.addEventListener('click', async e => {
        const b = e.target.closest('[data-m]'); if (!b) return;
        if (b.dataset.m === 'no') { cerrarModal(); no(); return; }
        const m = $('#motivo-txt', env).value.trim();
        if (obligatorio && m.length < 4) { $('#motivo-msg', env).textContent = 'Escribe el motivo: sin él no se puede guardar.'; $('#motivo-txt', env).parentElement.classList.add('error'); return; }
        cerrarModal();
        if (codigo) { try { await pedirCodigo(codigo === true ? { que: esc(titulo), boton, tono } : codigo); } catch (_) { no(); return; } }
        ok(m);
      });
    });
  }
  function confirmar({ titulo, texto, boton = 'Confirmar', tono = 'pri', cancelar = 'Cancelar' }) {
    return new Promise((ok, no) => {
      const env = modal(`<h2 id="modal-t">${esc(titulo)}</h2><p class="muted" id="modal-d">${texto}</p><div class="modal-acc"><button class="btn sec" data-m="no">${esc(cancelar)}</button><button class="btn ${tono}" data-m="si">${esc(boton)}</button></div>`);
      // lo que no tiene vuelta atrás fácil (apagar un aviso) arranca con el teclado en el botón seguro: Enter no lo apaga sin querer
      $(tono === 'peligro' ? '[data-m="no"]' : '[data-m="si"]', env).focus();
      env.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; cerrarModal(); b.dataset.m === 'si' ? ok() : no(); });
    });
  }
  // abrir la cámara, la galería o los archivos ahí mismo: solo sigue si se eligió un archivo (sin archivo, no pasa nada)
  // en el teléfono, sin «capture», el sistema deja escoger entre la cámara y la galería
  // alElegir(archivo) corre en el acto, cuando se elige (así la prueba automática lo sigue sin esperar)
  function pedirArchivo(alElegir, { accept = 'image/*,application/pdf' } = {}) {
    const viejo = document.getElementById('archivo-pedido'); if (viejo) viejo.remove();
    const inp = document.createElement('input');
    Object.assign(inp, { type: 'file', id: 'archivo-pedido', accept, className: 'sr-only', tabIndex: -1 }); inp.setAttribute('aria-hidden', 'true');
    document.body.appendChild(inp);
    inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; inp.remove(); if (f) alElegir(f); });
    inp.addEventListener('cancel', () => inp.remove());
    inp.click();
  }

  /* ---------- la ficha de detalle ---------- */
  // spec: { titulo, sub, tags:[[txt,tono]], mod, obj, registro, bloques:[...], acciones:[...], aviso, bloqueada, bloqueo }
  // bloqueada: lo pagado, declarado o enviado no se edita · bloqueo: cómo se corrige (lo dice el botón Editar con candado)
  // bloque kv: { titulo, filas:[{ l, v, campo:{ k, tipo:'texto'|'dinero'|'numero'|'fecha'|'select'|'area', opciones, sensible, mon, sinMiles, entero, obligatorio } }] }
  // entero: un número sin coma (personas, días, cuotas, facturas, el número de un Z) · obligatorio: no puede quedar vacío (un monto, una tasa)
  // al editar, la app marca cada campo que alguien toca (escribe o elige) y solo guarda esos: lo que no se tocó no cambia
  /* una ficha abierta desde otra (el proveedor desde su factura) guarda el camino: arriba dice «‹ Factura N.º A-004512» y ese enlace, o el
     «Atrás» del teléfono, vuelve a ella · pila: las fichas de antes, de la primera a la última ({ tipo, id, t: su título })
     opciones: pila (el camino que trae un pendiente o una dirección) */
  // la regla propia de una ficha (además de ver su módulo): los montos por persona piden ver los sueldos
  const specPermitida = sp => !sp || sp.sensible !== 'sueldos' || puede('nomina', 'sueldos');
  function abrir(tipo, id, { pila = null } = {}) {
    if (!FICHAS[tipo]) { aviso('Esta ficha todavía no está dibujada.', 'info'); return; }
    // una ficha con montos por persona, para quien no ve los sueldos, no se abre (aunque llegue por un enlace de otra pantalla)
    try { const sp = FICHAS[tipo](id); if (sp && !specPermitida(sp)) { aviso('El detalle por persona lo ven el dueño, RRHH y contabilidad.', 'info'); return; } } catch (_) { /* la ficha dice lo suyo al dibujarse */ }
    // de dónde se abrió: al cerrarla, el teclado vuelve ahí (si desde esta se abre otra, se guarda la primera)
    const a = document.activeElement; const fr = $('#ficha-raiz'); const prev = S.ficha;
    const desde = prev ? prev.desde : (a && a !== document.body && !(fr && fr.contains(a)) ? { el: a, clave: claveDe(a) } : null);
    const igual = x => x && x.tipo === tipo && String(x.id) === String(id);
    let camino = [];
    if (pila) camino = pila.slice();
    else if (prev && igual(prev)) camino = prev.pila || [];
    else if (prev) {
      // si ya estaba en el camino (volver a la factura desde su proveedor), el camino se corta ahí; si no, la de ahora queda detrás
      const antes = prev.pila || []; const k = antes.findIndex(igual);
      // cada ficha del camino recuerda la pantalla donde estaba abierta (r, s): «‹» la devuelve sobre esa pantalla
      camino = k >= 0 ? antes.slice(0, k) : antes.concat([{ tipo: prev.tipo, id: prev.id, t: prev.spec ? textoPlano(prev.spec.titulo) : '', r: S.ruta, s: S.sub[S.ruta] }]);
    }
    S.ficha = { tipo, id, editando: false, desde, foco: 'titulo', pila: camino.slice(-4) };
    marcarNav('push');
    pintarFicha();
    // queda entre lo último que abrió la persona (el buscador vacío lo muestra); los pendientes ya salen aparte
    const sp = S.ficha && S.ficha.spec;
    if (sp && tipo !== 'pendiente') anotarReciente({ clave: 'abrir:' + tipo + ':' + id, t: textoPlano(sp.titulo), s: textoPlano(sp.sub) || 'Ficha', abrir: tipo + ':' + id });
  }
  // «‹ Factura N.º …» (o el «Atrás» del teléfono): vuelve a la ficha de antes, como estaba; sin camino, cierra la ficha
  // si el paso anterior del historial es esa misma ficha (el pendiente, abierto en Mis pendientes), es un paso atrás de verdad: vuelve también
  // su pantalla y el historial no guarda dos pasos seguidos con la misma ficha · si no, la ficha de antes vuelve sobre la pantalla donde se abrió
  function fichaAtras() {
    const f = S.ficha; if (!f) return;
    if (!f.pila || !f.pila.length) { cerrarFicha(); return; }
    const p = f.pila[f.pila.length - 1];
    const ant = HIST.pila[HIST.i - 1]; const st = ant && S.usuario && ant.u === S.usuario.id ? leerDir(ant.d) : null; const top = st && st.f && st.f[st.f.length - 1];
    if (top && top.tipo === p.tipo && String(top.id) === String(p.id) && accesible(st.r)) { aplicarEstado(st, { avisar: false }); marcarNav('atras'); programarSinc(); return; }
    if (p.r && accesible(p.r) && (p.r !== S.ruta || (p.s || undefined) !== S.sub[p.r])) { S.ruta = p.r; S.sub[p.r] = p.s || undefined; pintarPagina(); }
    S.ficha = { tipo: p.tipo, id: p.id, editando: false, desde: f.desde, foco: 'titulo', pila: f.pila.slice(0, -1) };
    marcarNav('atras'); pintarFicha();
  }
  // el título de una ficha del camino: el que tenía al abrirse; si vino en una dirección, se arma (y si ya no existe, no se nombra)
  const tituloDe = x => { if (x.t) return x.t; try { const sp = FICHAS[x.tipo] && FICHAS[x.tipo](x.id); x.t = sp ? textoPlano(sp.titulo) : ''; } catch (_) { x.t = ''; } return x.t; };
  function cerrarFicha({ volver = true, marca = true } = {}) {
    const f = S.ficha; S.ficha = null; const fr = $('#ficha-raiz'); if (fr) fr.innerHTML = '';
    capas(); // lo de atrás despierta antes de devolverle el teclado
    // cerrar es volver a la pantalla: si la entrada de antes en el historial es esa misma, la app da un paso atrás (no suma uno nuevo)
    if (f && marca) { marcarNav('cerrar'); programarSinc(); }
    if (!volver || !f) return;
    // el teclado vuelve a lo que abrió la ficha; si eso ya no está (o se abrió sin teclado), va a la página, nunca al fondo
    const d = f.desde; const el = d ? (d.el && d.el.isConnected ? d.el : d.clave ? $('#app ' + d.clave) : null) : null;
    const a = document.activeElement; const perdido = !a || a === document.body || !a.isConnected;
    const destino = el || (perdido ? $('#main') : null);
    if (destino) destino.focus({ preventScroll: true });
  }
  const esNum = c => c.tipo === 'dinero' || c.tipo === 'numero';
  const opcionesDe = c => (c.opciones || []).map(o => Array.isArray(o) ? o : [o, o]);
  // los números se llenan como se ven: con coma (2,5) y con el guion de siempre si son negativos
  // valor(obj): un dato que se guarda distinto de como se elige (el día de una reserva es [12, 9]; en el campo, «12-9»)
  const crudoDe = (obj, c) => (c.valor ? c.valor(obj) : obj[c.k]);
  function valorCampo(obj, c) {
    const v = crudoDe(obj, c);
    if (v === null || v === undefined) return '';
    if (c.tipo === 'dinero') return fmt(v).replace('−', '-');
    if (c.tipo === 'numero' && v !== '' && !isNaN(v)) return numTxt(v, c.sinMiles).replace('−', '-');
    return v;
  }
  // el día con sus botones: v es la clave del día elegido; forzar = 'otro' abre la lista sin cambiar el día (todavía no se escoge otro)
  function diaHtml(c, i, v, forzar) {
    const ops = opcionesDe(c); const [hoy, man] = ops; const es = (o, x) => !!o && String(o[0]) === x;
    const cual = forzar || (es(hoy, v) ? 'hoy' : es(man, v) ? 'man' : v ? 'otro' : '');
    const otroV = v && !es(hoy, v) && !es(man, v) ? v : '';
    const nombre = x => (ops.find(o => String(o[0]) === x) || [0, c.mostrar ? c.mostrar(x) : x])[1];
    const btn = (k, t, s) => `<button type="button" data-acc="fc-dia" data-arg="${i}|${k}" aria-pressed="${cual === k}">${cual === k ? ic('check', 's') : ''}<span>${t}${s ? `<small>${esc(s)}</small>` : ''}</span></button>`;
    const lista = ops.slice(2).filter(o => String(o[0]) !== otroV);
    return `<span class="fc-dia" data-dia="${i}"><input type="hidden" id="fc-${i}" data-k="${esc(c.k)}" data-ci="${i}" value="${esc(v)}">
      <span class="dias" role="group" aria-label="${esc(c.etq || 'Día')}">${btn('hoy', 'Hoy', hoy ? hoy[1] : '')}${btn('man', 'Mañana', man ? man[1] : '')}${btn('otro', 'Otro día', otroV ? nombre(otroV) : '')}</span>
      ${cual === 'otro' ? `<select class="fc-dia-lista" data-dia-de="${i}" aria-label="Qué día">${otroV ? `<option value="${esc(otroV)}" selected>${esc(nombre(otroV))}</option>` : '<option value="" selected>Elige el día</option>'}${lista.map(([x, t]) => `<option value="${esc(x)}">${esc(t)}</option>`).join('')}</select>` : ''}</span>`;
  }
  // tocar Hoy, Mañana u Otro día (o escoger en la lista) cambia el día sin volver a dibujar la ficha: el resto de lo escrito no se pierde
  function ponerDia(i, v, forzar = '') {
    const f = S.ficha; const r = f && f.campos && f.campos[+i]; const caja = $(`#ficha-raiz [data-dia="${i}"]`); if (!r || !caja) return;
    const antes = $('#fc-' + i); const tocado = antes && antes.dataset.tocado;
    caja.outerHTML = diaHtml(r.campo, +i, v, forzar);
    const inp = $('#fc-' + i); if (inp && (tocado || (antes && antes.value !== v))) { inp.dataset.tocado = '1'; actualizarGuardar(); }
  }
  ACC['fc-dia'] = arg => {
    const [i, k] = String(arg).split('|'); const f = S.ficha; const r = f && f.campos && f.campos[+i]; if (!r) return;
    const ops = opcionesDe(r.campo); const inp = $('#fc-' + i); const v = inp ? inp.value : '';
    if (k === 'otro') { ponerDia(i, v, 'otro'); const s = $(`#ficha-raiz [data-dia-de="${i}"]`); if (s) s.focus(); return; }
    const o = ops[k === 'hoy' ? 0 : 1]; if (!o) return; ponerDia(i, String(o[0]));
    const b = $(`#ficha-raiz [data-acc="fc-dia"][data-arg="${i}|${k}"]`); if (b) b.focus();
  };
  document.addEventListener('change', e => {
    const s = e.target; if (!s || !s.matches || !s.matches('#ficha-raiz [data-dia-de]') || !s.value) return;
    ponerDia(s.dataset.diaDe, s.value, 'otro'); const n = $(`#ficha-raiz [data-dia-de="${s.dataset.diaDe}"]`); if (n) n.focus();
  });
  // un dato que no está entre las opciones no se disfraza de la primera: sale arriba, ya elegido, como «Sin elegir» (o con su valor)
  function inputDe(obj, c, i) {
    const at = `id="fc-${i}" data-k="${esc(c.k)}" data-ci="${i}"`;
    // el día, con los mismos botones de la reserva nueva (Hoy · Mañana · Otro día y la lista de los días que siguen): nunca se escribe
    // opciones: [[clave, texto]] de los días que se pueden elegir, empezando por hoy y mañana · el valor viaja en una casilla escondida
    if (c.tipo === 'dia') return diaHtml(c, i, String(crudoDe(obj, c) ?? ''), '');
    if (c.tipo === 'select') {
      const ops = opcionesDe(c); const v = crudoDe(obj, c); const esta = ops.some(([x]) => String(x) === String(v ?? ''));
      const suelta = esta ? '' : `<option value="${esc(v ?? '')}" selected>${v === null || v === undefined || v === '' || v === '—' ? 'Sin elegir' : esc(v)}</option>`;
      return `<select ${at}>${suelta}${ops.map(([x, t]) => `<option value="${esc(x)}"${esta && String(x) === String(v ?? '') ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
    }
    if (c.tipo === 'area') return `<textarea ${at}>${esc(obj[c.k])}</textarea>`;
    // entero: personas, días, cuotas, facturas o el número de un Z (sin coma)
    return `<input ${at} value="${esc(valorCampo(obj, c))}" ${esNum(c) ? `inputmode="${c.entero ? 'numeric' : 'decimal'}"` : ''} autocomplete="off">`;
  }
  function pintarFicha() {
    const f = S.ficha; if (!f) return;
    const spec = FICHAS[f.tipo](f.id); if (!spec) { cerrarFicha(); return; }
    f.spec = spec;
    // si la ficha se vuelve a dibujar mientras se edita, no se pierde lo escrito ni el lugar del teclado
    const raiz = $('#ficha-raiz'); const escrito = {};
    if (f.editando) $$('#ficha-raiz [data-ci][data-tocado]').forEach(el => { escrito[el.dataset.k] = el.value; });
    const act = document.activeElement; const claveFoco = raiz && act && raiz.contains(act) ? claveDe(act) : null;
    const editable = spec.bloques.some(b => (b.filas || []).some(r => r.campo));
    // lo que espera otra firma: mientras tanto no se edita, el valor de antes sigue tachado y el nuevo va a lápiz con «Por aprobar · Jose»
    const clave = f.tipo + ':' + f.id; const prop = propuestaDe(clave); const ultima = prop ? null : aprobadaDe(clave);
    const aprueboYo = !!prop && S.usuario.id === prop.para;
    const bloqueada = spec.bloqueada || (!!prop && editable);
    const bloqueo = spec.bloqueada ? spec.bloqueo : prop ? 'Tiene un cambio por aprobar: no se edita hasta que ' + prop.paraNombre + ' lo apruebe o lo devuelva.' : spec.bloqueo;
    const puedeEditar = editable && puede(spec.mod, 'editar') && !bloqueada;
    let n = 0; f.campos = [];
    const cuerpo = spec.bloques.map(b => {
      if (b.oculto) return '';
      let inner = '';
      if (b.filas) {
        inner = '<dl class="kv">' + b.filas.map(r => {
          if (f.editando && r.campo && puedeEditar) {
            const i = n++; f.campos.push(r);
            // vivoDe: el aviso que se recalcula mientras se escribe (la mesa repetida) va debajo de su casilla, donde se escribe
            const vivoAqui = spec.vivo && spec.vivoDe === r.campo.k ? '<div class="ficha-vivo" id="ficha-vivo"></div>' : '';
            return `<div style="flex-direction:column;align-items:stretch;gap:5px"><dt><label for="fc-${i}">${esc(r.l)}${r.campo.sensible ? ' ' + ic('candado', 'xs') : ''}</label></dt><dd class="largo" style="justify-content:stretch;text-align:left"><span class="campo" style="width:100%">${inputDe(spec.obj, r.campo, i)}${r.campo.sensible ? '<small class="ayuda">Cambiar esto pide tu código y le avisa a Alejandro.</small>' : ''}${vivoAqui}</span></dd></div>`;
          }
          const pc = prop && r.campo ? prop.cambios.find(c => c.k === r.campo.k) : null;
          return `<div><dt>${esc(r.l)}</dt><dd${r.largo ? ' class="largo"' : ''}>${pc ? porAprobarHtml(pc, prop) : r.v ?? '—'}</dd></div>`;
        }).join('') + '</dl>';
      } else if (b.tiempo) {
        inner = '<ol class="tiempo">' + b.tiempo.map(t => `<li class="${t[2] || ''}"><time>${esc(t[0])}</time><span>${t[1]}</span></li>`).join('') + '</ol>';
      } else if (b.adjuntos) {
        inner = '<div class="adjuntos">' + b.adjuntos.map(a => `<button class="adjunto" data-acc="ver-archivo" data-arg="${esc(a)}">${ic(/\.pdf$/i.test(a) ? 'archivo' : 'imagen', 's')}<span>${esc(a)}</span></button>`).join('') + '</div>';
      } else if (b.html) inner = b.html;
      return `<section class="bloque">${b.titulo ? `<h3>${esc(b.titulo)}${b.extra || ''}</h3>` : ''}${inner}</section>`;
    }).join('');
    const SELLOS = { cuadra: 'Cuadra', pagada: 'Pagado', confirmado: 'Confirmado', declarada: 'Declarada', aprobada: 'Aprobado', entregada: 'Entregado', repuesta: 'Repuesto', enterada: 'Pagado', conciliada: 'Conciliada', llego: 'Llegó', justificada: 'Justificada', descontada: 'Descontado', disfrutada: 'Disfrutada', resuelta: 'Resuelta', perdonado: 'Perdonado', firmado: 'Firmado', rendida: 'Rendida', aclarada: 'Aclarado', revisado: 'Revisado' };
    // sin prueba no hay sello: lo que queda sin soporte («Justificada sin soporte») no está aquí y lleva su etiqueta de aviso
    const ROJOS = { no_vino: 'No vino', injustificada: 'Injustificada', cancelada: 'Anulada', rechazado: 'Rechazado', rechazada: 'Rechazada', no_va: 'No va' };
    const ob = spec.obj || {}; const est = ob.anulada ? 'anulada' : ob.estado;
    const selloTxt = ob.anulada ? 'Anulado' : (SELLOS[est] || ROJOS[est]);
    if (f.est0 === undefined) f.est0 = est;
    const recien = !!selloTxt && f.est0 !== est;
    const sello = selloTxt ? window.APP.sello(selloTxt, { rojo: !!ob.anulada || !!ROJOS[est], recien: recien && !f.animado, fecha: recien ? '05 OCT 2026' : '' }) : '';
    if (recien) f.animado = true;
    // lo que se reabrió: el sello de antes queda tachado, a la vista, no se borra · lo aprobado por otra persona lleva su sello de tinta
    const viejos = (ob.sellosViejos || []).map(s => window.APP.sello(s.txt, { rojo: !!s.rojo, fecha: s.fecha || '', tachado: true })).join('');
    const selloAprob = ultima && ultima.estado === 'aprobada' ? window.APP.sello('Aprobado', { recien: !!ultima.recien, fecha: ultima.fecha || '' }) : '';
    if (ultima && ultima.recien) ultima.recien = false;
    const tags = (spec.tags || []).filter(t => !(selloTxt && (t[1] === 'ok' || /anulad/i.test(t[0]) || t[0].toLowerCase() === selloTxt.toLowerCase())))
      .concat(prop ? [['Por aprobar · ' + prop.paraNombre, 'aviso']] : []);
    const notaLectura = editable && !puedeEditar && !bloqueada
      ? `<p class="nota gris">${ic('candado', 's')}<span><b>Solo lectura.</b> Para cambiar esto, pídeselo a ${esc(quienEdita(spec.mod))}.</span></p>` : '';
    // la nota de quien pidió el cambio, de quien lo aprueba y de quien solo mira; y la del cambio devuelto, para quien lo pidió
    const notaProp = !prop ? (ultima && ultima.estado === 'devuelta' && ultima.quienId === S.usuario.id ? `<p class="nota aviso">${ic('alerta', 's')}<span><b>${esc(ultima.devolvio.quien)} te devolvió el cambio:</b> «${esc(ultima.devolvio.motivo)}». Quedó como estaba; si hace falta, corrígelo y vuelve a enviarlo.</span></p>` : '')
      : `<p class="nota aviso">${ic('reloj', 's')}<span>${aprueboYo ? `<b>${esc(prop.quien)} pidió ${prop.accion ? esc(minuscula(prop.accion.txt)) : 'este cambio'}.</b> ${prop.porque === 'tope' ? (prop.tope.sinTope ? 'Su tope en esto está por decidir: lo apruebas tú.' : 'Pasa su tope de ' + esc(montoTope(prop.tope.hasta, prop.tope.mon)) + ': lo apruebas tú.') : 'Lo apruebas tú.'} Abajo: «Aprobar» o «Devolver».`
        : prop.quienId === S.usuario.id ? `<b>Enviado para aprobar.</b> ${prop.accion ? esc(prop.accion.txt) + ': lo aprueba ' + esc(prop.paraNombre) + '.' : 'Queda a lápiz hasta que ' + esc(prop.paraNombre) + ' lo apruebe: mientras tanto vale el dato de antes.'}`
        : `<b>${esc(prop.quien)} pidió ${prop.accion ? esc(minuscula(prop.accion.txt)) : 'este cambio'}.</b> Lo aprueba ${esc(prop.paraNombre)}.`}</span></p>`;
    // a un aprendiz se le dice antes de editar qué espera otra firma: los montos
    const plataEnFicha = f.campos.some(r => r.campo.tipo === 'dinero' || r.campo.plata);
    const rgPlata = plataEnFicha ? regla({ mod: spec.mod, plata: true }) : null;
    const notaEditando = f.editando ? `<p class="nota info">${ic('lapiz', 's')}<span>Cambia lo que haga falta: solo se guarda lo que toques. Al guardar te pedimos el motivo y queda el valor anterior, el nuevo y quién lo hizo.${rgPlata && rgPlata.modo === 'aprobar' ? ' Los montos los aprueba ' + esc(rgPlata.quien) + ' antes de valer.' : ''}</span></p>` : '';
    // mientras haya una propuesta, la acción que la creó no se repite; quien aprueba tiene sus dos botones aquí mismo
    const acciones = (spec.acciones || []).filter(a => (!a.solo || puede(spec.mod, a.solo)) && !(prop && a.plata))
      .map(a => { if (!a.plata || a.bloq) return a; const rg = regla({ mod: spec.mod, permiso: a.solo === 'aprobar' ? 'aprobar' : 'editar', plata: true }); return rg.modo === 'aprobar' ? { ...a, aprobar: rg.quien } : a; })
      .concat(aprueboYo ? [{ txt: 'Devolver', acc: 'prop-devolver', arg: prop.id, tono: 'ghost', icono: 'atras' }, { txt: 'Aprobar', acc: 'prop-aprobar', arg: prop.id, tono: 'pri', icono: 'candado' }] : []);
    // izq: lo que deshace (Anular reserva) va aparte, a la izquierda, lejos de la acción principal
    const izqAcc = acciones.filter(a => a.izq), derAcc = acciones.filter(a => !a.izq);
    // si la ficha ya tiene una acción principal (Aprobar, Llegó…), Editar pasa a secundario y va antes, para que la principal quede sola al final
    const hayPrincipal = derAcc.some(a => a.tono === 'pri');
    // lo cerrado lleva candado y dice cómo se corrige; a quien solo mira el módulo no se le muestra: ya tiene la nota de solo lectura
    const botonEditar = !editable ? '' : puedeEditar ? `<button class="btn ${spec.editarTono || (hayPrincipal ? 'sec' : 'pri')}" data-ficha="editar">${ic('lapiz', 's')}${esc(spec.editar || 'Editar')}</button>`
      : bloqueada && puede(spec.mod, 'editar') ? `<button class="btn bloq" data-ficha="cerrada" aria-disabled="true">${ic('candado', 's')}${esc(spec.editar || 'Editar')}</button>` : '';
    // una acción con candado (bloq: lo aprobado no se toca hasta reabrirlo) se ve, y al tocarla dice cómo se cambia
    // ut: el «Deshacer» de una decisión de un toque (lleva su cuenta atrás) · reabrir: el «Reabrir» que lo reemplaza a los 10 segundos
    // aprobar: lo que mueve plata, hecho por un aprendiz: el botón dice «Enviar para aprobar» y debajo, en chico, quién lo aprueba
    // data-ut y data-reabrir llevan la clave de su decisión (A.unToque): cada «Deshacer» cuenta sus segundos y el teclado pasa a su «Reabrir»
    // pressed: un botón que queda marcado (como «Pedido a Jose · 14:05»), igual que en las listas
    const marcas = a => (a.ut ? ` data-ut="${a.ut === true ? '' : esc(a.ut)}"` : '') + (a.reabrir ? ` data-reabrir="${a.reabrir === true ? '' : esc(a.reabrir)}"` : '') + (a.pressed !== undefined ? ` aria-pressed="${!!a.pressed}"` : '');
    const botonAcc = a => a.bloq
      ? `<button class="btn bloq" data-acc="${a.acc}" data-arg="${esc(a.arg ?? f.id)}" aria-disabled="true">${ic(a.iconoBloq || 'candado', 's')}${esc(a.txt)}</button>`
      : a.aprobar ? `<span class="btn-con-nota"><button class="btn ${a.tono || 'sec'}" data-acc="${a.acc}" data-arg="${esc(a.arg ?? f.id)}" aria-label="Enviar para aprobar: ${esc(minuscula(a.txt))}" aria-describedby="nota-${esc(a.acc)}">${ic('enviar', 's')}Enviar para aprobar</button><small class="btn-nota" id="nota-${esc(a.acc)}">Lo aprueba ${esc(a.aprobar)}</small></span>`
      : `<button class="btn ${a.tono || 'sec'}" data-acc="${a.acc}" data-arg="${esc(a.arg ?? f.id)}"${marcas(a)}>${a.icono ? ic(a.icono, 's') : ''}${a.html || esc(a.txt)}</button>`;
    const botonesAcc = derAcc.map(botonAcc).join('');
    const izq = (spec.anulable && puede(spec.mod, 'editar') && !prop ? `<button class="btn ghost" data-ficha="anular">${ic('anular', 's')}Anular</button>` : '') + izqAcc.map(botonAcc).join('');
    // debajo de los botones: enlaces de un paso más («No hay papel: justificar con el motivo») y una nota corta («No vino» desde las 20:00)
    const enlaces = (spec.enlaces || []).filter(a => (!a.solo || puede(spec.mod, a.solo)) && !(prop && a.plata)).map(a => `<button class="enlace" data-acc="${a.acc}" data-arg="${esc(a.arg ?? f.id)}">${a.icono ? ic(a.icono, 's') : ''}${esc(a.txt)}</button>`).join('');
    const bajo = (spec.pieNota ? `<span class="pie-nota">${spec.pieNota}</span>` : '') + enlaces;
    // Editar (también con candado) va antes de la acción principal, para que la principal quede sola al final
    // al editar, «Guardar» cambia solo a «Enviar para aprobar» o «Enviar a Alejandro» si lo tocado espera otra firma (actualizarGuardar)
    const pie = f.editando
      ? `<button class="btn sec" data-ficha="cancelar">Cancelar</button><span class="btn-con-nota"><button class="btn pri" data-ficha="guardar" aria-describedby="guardar-nota">${ic('check', 's')}<span class="guardar-txt">${esc(spec.guardar || 'Guardar cambios')}</span></button><small class="btn-nota" id="guardar-nota" hidden></small></span>`
      : (izq ? `<span class="pie-izq">${izq}</span>` : '') +
        (hayPrincipal ? botonEditar + botonesAcc : botonesAcc + botonEditar) + (bajo ? `<span class="pie-bajo">${bajo}</span>` : '');
    // el velo cierra con el dedo o el ratón; con el teclado se cierra con la X o con Escape (por eso no entra en el tabulador)
    const sellos = viejos + selloAprob + sello;
    // abierta desde otra ficha: arriba, en chico, «‹ Factura N.º A-004512» vuelve a ella (lo mismo que el «Atrás» del teléfono)
    const padre = f.pila && f.pila.length ? f.pila[f.pila.length - 1] : null; const tPadre = padre ? tituloDe(padre) : '';
    const migas = padre ? `<button class="enlace ficha-atras" data-ficha="atras" aria-label="Volver a ${esc(tPadre || 'la ficha de antes')}">‹ ${esc(tPadre || 'La ficha de antes')}</button>` : '';
    // mientras se edita, lo que conviene saber antes de guardar: se recalcula con cada cambio (arriba, salvo que la ficha diga debajo de qué casilla va)
    const vivo = f.editando && spec.vivo && !spec.vivoDe ? '<div class="ficha-vivo" id="ficha-vivo" aria-live="polite"></div>' : '';
    $('#ficha-raiz').innerHTML = `<div class="ficha-env"><button class="ficha-velo" data-ficha="cerrar" tabindex="-1" aria-hidden="true"></button>
      <aside class="ficha" role="dialog" aria-modal="true" aria-labelledby="ficha-t">
        <header class="ficha-cab"><div>${migas}${spec.sub ? `<span class="muted">${spec.sub}</span>` : ''}<h2 id="ficha-t" tabindex="-1">${esc(spec.titulo)}</h2>${tags.length || sellos ? `<div class="tags">${sellos}${tags.map(t => tag(t[0], t[1])).join('')}</div>` : ''}</div>
        <button class="ficha-icono" data-ficha="enlace" aria-label="Copiar el enlace de esta ficha" title="Copiar el enlace">${ic('enlace', 's')}</button>
        <button class="cerrar" data-ficha="cerrar" aria-label="Cerrar">${ic('x')}</button></header>
        <div class="ficha-cuerpo">${spec.aviso || ''}${notaProp}${notaEditando}${vivo}${notaLectura}${cuerpo}</div>
        ${pie ? `<footer class="ficha-pie">${pie}</footer>` : ''}
      </aside></div>`;
    f.bloqueo = bloqueo; // lo que dice el «Editar» con candado al tocarlo
    capas(); // con la ficha abierta, lo de atrás no recibe el teclado
    // los montos de los textos no se parten, y una tabla ancha avisa que se desliza
    juntarMontos($('#ficha-raiz')); if (window.APP && window.APP.deslizar) window.APP.deslizar($('#ficha-raiz'));
    // el día de una reserva se vuelve a dibujar con lo que ya se había escogido (sus botones siguen al valor, no al de antes)
    if (f.editando) { Object.entries(escrito).forEach(([k, v]) => { const el = $(`#ficha-raiz [data-ci][data-k="${CSS.escape(k)}"]`); if (el) { el.value = v; el.dataset.tocado = '1'; if (el.closest('.fc-dia')) ponerDia(el.dataset.ci, v); } }); actualizarGuardar(); }
    // el teclado: al abrir, al título (no a la X); al editar, al primer campo; si se volvió a dibujar, al mismo botón
    let foco = null;
    // focoEditar: el campo al que va el teclado al editar (al «Corregir» una reserva, el estado)
    if (f.foco === 'campo') foco = (spec.focoEditar && $(`#ficha-raiz [data-ci][data-k="${CSS.escape(spec.focoEditar)}"]`)) || $('#ficha-raiz [data-ci]');
    else if (f.foco !== 'titulo' && claveFoco) foco = $('#ficha-raiz ' + claveFoco);
    if (!foco && (f.foco || claveFoco !== null)) foco = $('#ficha-t');
    f.foco = null;
    if (foco) foco.focus({ preventScroll: true });
    if (f.editando) pintarVivo();
    programarSinc();
  }
  // lo que va en «ficha-vivo» mientras se edita: spec.vivo(leer) arma el aviso con lo que hay escrito (leer('mesa') → lo de la casilla o el dato de antes)
  // lo que hay escrito en un campo de la ficha (o el dato de antes, si no se está editando)
  const leerCampo = k => { const f = S.ficha; const el = $(`#ficha-raiz [data-ci][data-k="${CSS.escape(k)}"]`); if (el) return el.value; if (!f || !f.spec) return undefined; const r = (f.campos || []).find(x => x.campo.k === k); return r ? crudoDe(f.spec.obj, r.campo) : f.spec.obj[k]; };
  // lo que una ficha suma a la ventana del motivo y al botón según lo escrito (la mesa repetida): spec.notaGuardar(leer) · spec.guardarTxt(leer)
  const extraDe = (fn) => { try { return fn ? fn(leerCampo) || '' : ''; } catch (_) { return ''; } };
  function pintarVivo() {
    const f = S.ficha; const caja = $('#ficha-vivo'); if (!f || !f.spec || !f.spec.vivo || !caja) return;
    const h = extraDe(f.spec.vivo);
    if (caja.innerHTML !== h) caja.innerHTML = h;
  }
  // lo que cambió en la ficha: solo los campos que alguien tocó y que quedaron distintos; un número que no se puede leer es un error
  // un número que estaba vacío y sigue vacío no cuenta; uno que tenía valor y se vació cambia a «—», salvo que sea obligatorio
  const vacio = v => v === null || v === undefined || v === '';
  function cambiosFicha() {
    const f = S.ficha; const out = { cambios: [], errores: [] }; if (!f || !f.spec || !f.campos) return out;
    f.campos.forEach((r, i) => {
      const el = $('#fc-' + i); if (!el || !el.dataset.tocado) return;
      const c = r.campo; const antes = crudoDe(f.spec.obj, c); const crudo = el.value.trim(); let nuevo = crudo;
      if (esNum(c)) {
        if (crudo === '') {
          if (vacio(antes)) return;
          if (c.obligatorio) { out.errores.push({ r, el, msg: 'Este dato no puede quedar vacío.' }); return; }
          out.cambios.push({ r, antes, nuevo: null, el }); return;
        }
        nuevo = leerNum(crudo);
        if (nuevo === null) { out.errores.push({ r, el, msg: c.entero ? 'Escribe un número entero, por ejemplo 12.' : 'Escribe un número, por ejemplo 2,5.' }); return; }
        if (c.entero && !Number.isInteger(nuevo)) { out.errores.push({ r, el, msg: 'Va sin coma: escribe un número entero.' }); return; }
      } else if (c.tipo === 'select' && typeof antes === 'number' && crudo !== '' && !isNaN(crudo)) nuevo = +crudo;
      const igual = esNum(c) ? (vacio(antes) ? false : Math.abs(Number(antes) - nuevo) < 1e-9) : String(antes ?? '').trim() === String(nuevo).trim();
      if (!igual) out.cambios.push({ r, antes, nuevo, el });
    });
    return out;
  }
  // ¿quedó 10, 100 o 1.000 veces más grande o más chico? casi siempre es una coma o un punto que se corrió
  // (solo en los montos y en los números con decimales: en un entero, 2 → 20 personas no es una coma)
  const magnitud = (a, b) => {
    a = Number(a); if (!a || !b || !isFinite(a)) return '';
    const r = b / a;
    for (const k of [10, 100, 1000]) {
      if (Math.abs(r / k - 1) < 1e-6) return 'Quedó ' + fmt(k, 0) + ' veces más grande. ¿Era una coma?';
      if (Math.abs(r * k - 1) < 1e-6) return 'Quedó ' + fmt(k, 0) + ' veces más chico. ¿Se corrió la coma?';
    }
    return '';
  };
  // al guardar, la misma regla del botón: un monto que cambia un aprendiz espera otra firma, y lo que pasa el tope de quien guarda, también
  // spec.tope: { limite: 'l5', monto: cambios => lo que se compara con el tope (el ajuste, el límite nuevo), que: 'Este ajuste' }
  function reglaGuardar(spec, cambios) {
    const plata = cambios.some(c => c.r.campo.tipo === 'dinero' || c.r.campo.plata);
    const t = spec.tope; const m = t && cambios.length ? t.monto(cambios) : null;
    return { r: regla({ mod: spec.mod, plata, limite: t ? t.limite : null, monto: m }), t };
  }
  // mientras se edita, el botón dice lo que va a pasar con lo tocado: «Guardar cambios», «Enviar para aprobar» o «Enviar a Alejandro»
  function actualizarGuardar() {
    const f = S.ficha; if (!f || !f.editando || !f.spec) return;
    pintarVivo();
    const b = $('#ficha-raiz [data-ficha="guardar"] .guardar-txt'); const nota = $('#guardar-nota'); if (!b) return;
    const { r } = reglaGuardar(f.spec, cambiosFicha().cambios);
    b.textContent = r.modo === 'aprobar' ? 'Enviar para aprobar' : r.modo === 'tope' ? 'Enviar a ' + r.quien : (extraDe(f.spec.guardarTxt) || f.spec.guardar || 'Guardar cambios');
    if (nota) { nota.hidden = r.modo !== 'aprobar' && r.modo !== 'tope'; nota.textContent = r.modo === 'aprobar' ? 'Lo aprueba ' + r.quien : r.modo === 'tope' ? (r.sinTope ? 'Por decidir: tu tope en esto' : 'Pasa tu tope de ' + montoTope(r.hasta, r.mon)) : ''; }
  }
  function guardarFicha() {
    const f = S.ficha; const spec = f.spec; const obj = spec.obj;
    $$('#ficha-raiz .campo.error').forEach(x => { x.classList.remove('error'); const m = x.querySelector('.error-msg'); if (m) m.remove(); });
    const { cambios, errores } = cambiosFicha();
    if (errores.length) {
      errores.forEach(({ el, msg }) => { const caja = el.closest('.campo'); caja.classList.add('error'); caja.insertAdjacentHTML('beforeend', `<small class="ayuda error-msg">${esc(msg)}</small>`); });
      errores[0].el.focus(); return;
    }
    if (!cambios.length) { f.editando = false; f.foco = 'titulo'; pintarFicha(); aviso('No cambiaste nada.', 'info'); return; }
    const sensible = cambios.some(c => c.r.campo.sensible);
    // «antes → después» corto (un teléfono, una cuenta, un monto) va entero en su línea: no se parte por un guion
    const par = c => { const t = muestra(c.antes, c.r.campo) + ' → ' + muestra(c.nuevo, c.r.campo); return t.length <= 30 ? `<span class="nowrap">${esc(t)}</span>` : esc(t); };
    const lineas = cambios.map(c => { const m = esNum(c.r.campo) && !c.r.campo.entero && c.nuevo !== null ? magnitud(c.antes, c.nuevo) : ''; return `<li><span><b>${esc(c.r.l)}</b>: ${par(c)}</span>${m ? `<p class="nota alerta">${ic('alerta', 's')}<span>${esc(m)}</span></p>` : ''}</li>`; }).join('');
    // lo sensible (una cuenta, un límite) pide el código, y la ventana del código dice qué cambia: «Número: •••• 4821 → •••• 1234»
    const firma = sensible ? { que: 'Cambio en «' + esc(spec.titulo) + '»', det: cambios.filter(c => c.r.campo.sensible).map(c => `${esc(c.r.l)}: ${par(c)}`).join('<br>'), boton: 'Guardar el cambio' } : false;
    // lo que espera otra firma lo dice en la misma ventana del motivo, antes de guardar, y el botón dice a quién va
    const { r, t } = reglaGuardar(spec, cambios); const espera = r.modo === 'aprobar' || r.modo === 'tope';
    const notaEspera = r.modo === 'tope' ? `<p class="nota aviso">${ic('alerta', 's')}<span>${esc((t && t.que) || 'Este ajuste')} es de ${montoTope(r.monto, r.mon)} y ${r.sinTope ? 'tu tope en esto está <b>por decidir</b> (Parámetros › Límites)' : 'tu tope es ' + montoTope(r.hasta, r.mon)}: queda pendiente de ${esc(r.quien)}.</span></p>`
      : r.modo === 'aprobar' ? `<p class="nota aviso">${ic('reloj', 's')}<span>Mueve plata: lo aprueba ${esc(r.quien)}. Hasta que lo apruebe queda a lápiz y vale el dato de antes.</span></p>` : '';
    const boton = r.modo === 'tope' ? 'Enviar a ' + r.quien : r.modo === 'aprobar' ? 'Enviar para aprobar' : (extraDe(spec.guardarTxt) || spec.guardar || 'Guardar');
    const registro = spec.registro || spec.titulo; const modulo = spec.moduloNombre || nombreModulo(spec.mod);
    // la ventana repite lo que la ficha avisa debajo de una casilla (la mesa repetida), para que nadie lo guarde sin verlo
    const notaFicha = extraDe(spec.notaGuardar);
    // con window.APP la prueba automática puede contestar la ventana sin esperar · guardar/guardado: el botón dice lo que hace y el aviso usa el mismo verbo
    window.APP.pedirMotivo({ titulo: espera ? boton : 'Guardar ' + (cambios.length === 1 ? 'el cambio' : 'los ' + cambios.length + ' cambios'), texto: `<ul class="cambios">${lineas}</ul>${notaEspera}${notaFicha}`, boton, codigo: firma }).then(motivo => {
      if (espera) {
        proponer({ clave: f.tipo + ':' + f.id, titulo: (r.modo === 'tope' ? 'Ajuste en «' : 'Cambio en «') + spec.titulo + '»', registro, modulo, motivo, r,
          cambios: cambios.map(c => ({ k: c.r.campo.k, l: c.r.l, antes: c.antes, nuevo: c.nuevo, antesTxt: muestra(c.antes, c.r.campo), nuevoTxt: muestra(c.nuevo, c.r.campo) })) });
        f.editando = false; f.foco = 'titulo'; pintarFicha(); pintarPagina();
        aviso(r.modo === 'tope' ? 'Enviado a ' + r.quien + '. Le llegó para aprobar.' : 'Enviado para aprobar. Le llegó a ' + r.quien + '.');
        return;
      }
      cambios.forEach(c => {
        if (c.r.campo.aplicar) c.r.campo.aplicar(obj, c.nuevo); else obj[c.r.campo.k] = c.nuevo;
        auditar({ modulo, registro, campo: c.r.l.toLowerCase(), antes: muestra(c.antes, c.r.campo), despues: muestra(c.nuevo, c.r.campo), motivo });
      });
      if (spec.alGuardar) spec.alGuardar(cambios, motivo, {});
      f.editando = false; f.foco = 'titulo'; pintarFicha(); pintarPagina();
      // guardado: el texto de la confirmación (o una función que lo arma con lo que quedó guardado: «…, con la mesa repetida: …»)
      const listo = typeof spec.guardado === 'function' ? spec.guardado(cambios) : spec.guardado;
      aviso(sensible ? (S.usuario.rol === 'dueno' ? 'Guardado con tu código.' : 'Guardado con tu código. Le avisamos a Alejandro.') : listo || 'Guardado. Quedó en el registro de cambios.');
    }).catch(() => {});
  }
  // aprobar: lo propuesto se aplica como si se hubiera guardado (con el motivo de quien lo pidió); una acción hace lo suyo (EJECUTA)
  function aplicarPropuesta(p) {
    if (p.accion) { const fn = EJECUTA[p.accion.nombre]; if (fn) fn(p.accion.arg, p); return; }
    const [tipo, id] = p.clave.split(':'); const spec = FICHAS[tipo] && FICHAS[tipo](id); if (!spec) return;
    const filas = spec.bloques.flatMap(b => b.filas || []).filter(r => r.campo);
    const cambios = p.cambios.map(c => ({ r: filas.find(r => r.campo.k === c.k) || { l: c.l, campo: { k: c.k } }, antes: c.antes, nuevo: c.nuevo }));
    cambios.forEach(c => { if (c.r.campo.aplicar) c.r.campo.aplicar(spec.obj, c.nuevo); else spec.obj[c.r.campo.k] = c.nuevo; auditar({ modulo: p.modulo, registro: p.registro, campo: c.r.l.toLowerCase(), antes: muestra(c.antes, c.r.campo), despues: muestra(c.nuevo, c.r.campo), motivo: 'Lo pidió ' + p.quien + (p.motivo ? ': ' + p.motivo : '') }); });
    if (spec.alGuardar) spec.alGuardar(cambios, p.motivo, { propuesta: p });
  }
  ACC['prop-aprobar'] = id => {
    const p = POR_APROBAR.find(x => x.id === id); if (!p || p.estado !== 'por_aprobar') { aviso('Ya no está por aprobar.', 'info'); return; }
    if (S.usuario.id !== p.para) { aviso('Lo aprueba ' + p.paraNombre + '.', 'info'); return; }
    window.APP.pedirCodigo({ que: esc(p.titulo) + ' · lo pidió ' + esc(p.quien), det: esc(detallePropuesta(p)) + (p.motivo ? '<br>Motivo: «' + esc(p.motivo) + '»' : ''), boton: 'Aprobar' }).then(() => {
      aplicarPropuesta(p);
      Object.assign(p, { estado: 'aprobada', aprobo: S.usuario.nombre, fecha: '05 OCT ' + D.HOY.hora, recien: true });
      cierraPropuesta(p, 'Aprobado por ' + S.usuario.nombre);
      // a quien lo pidió le llega que se aprobó (lo mismo que cuando se devuelve): «Le avisamos a Cecilia» es verdad
      nuevoPendiente({ id: 'pe' + Date.now() + Math.floor(Math.random() * 1000), para: [p.quienId], tipo: 'info', titulo: S.usuario.nombre + ' aprobó tu cambio', sub: p.registro + ' · ' + detallePropuesta(p), de: S.usuario.nombre, edad: 'Ahora', abrir: p.clave });
      auditar({ modulo: p.modulo, registro: p.registro, campo: 'aprobación', antes: 'por aprobar', despues: 'aprobado', motivo: 'Lo pidió ' + p.quien + (p.motivo ? ': ' + p.motivo : '') });
      if (S.ficha) pintarFicha(); pintarPagina(); aviso('Aprobado. Le avisamos a ' + p.quien + '.');
    }).catch(() => {});
  };
  // devolver: queda como estaba y a quien lo pidió le llega el motivo, con la ficha para corregirlo
  ACC['prop-devolver'] = id => {
    const p = POR_APROBAR.find(x => x.id === id); if (!p || p.estado !== 'por_aprobar') { aviso('Ya no está por aprobar.', 'info'); return; }
    if (S.usuario.id !== p.para) { aviso('Lo aprueba ' + p.paraNombre + '.', 'info'); return; }
    window.APP.pedirMotivo({ titulo: 'Devolver ' + (p.accion ? minuscula(p.accion.txt) : 'el cambio'), texto: 'Queda como estaba. ' + esc(p.quien) + ' ve el motivo y puede corregirlo.', etiqueta: 'Por qué lo devuelves', boton: 'Devolver' }).then(m => {
      if (p.accion && DEVUELVE[p.accion.nombre]) DEVUELVE[p.accion.nombre](p.accion.arg, p);
      Object.assign(p, { estado: 'devuelta', devolvio: { quien: S.usuario.nombre, motivo: m } });
      cierraPropuesta(p, 'Devuelto por ' + S.usuario.nombre);
      nuevoPendiente({ id: 'pe' + Date.now() + Math.floor(Math.random() * 1000), para: [p.quienId], tipo: 'aviso', titulo: S.usuario.nombre + ' te devolvió un cambio', sub: p.registro + ' · «' + m + '»', de: S.usuario.nombre, edad: 'Ahora', abrir: p.clave });
      auditar({ modulo: p.modulo, registro: p.registro, campo: 'aprobación', antes: 'por aprobar', despues: 'devuelto', motivo: m });
      if (S.ficha) pintarFicha(); pintarPagina(); aviso('Devuelto a ' + p.quien + ' con el motivo.');
    }).catch(() => {});
  };
  // cómo se lee un valor en la ventana y en el registro de cambios: el nombre de la opción (no su código) y los números con coma
  // mostrar(v): cómo se lee un dato que se guarda distinto («12-9» → «Lun 12 oct»)
  const muestra = (v, c) => {
    if (c.mostrar && v !== null && v !== undefined && v !== '') return String(c.mostrar(v));
    if (c.tipo === 'select') { const o = opcionesDe(c).find(x => String(x[0]) === String(v ?? '')); if (o) return String(o[1]); }
    if (v === null || v === undefined || v === '') return '—';
    if (c.tipo === 'dinero') return dinero(v, c.mon); // cada campo de plata dice su moneda (mon)
    if (c.tipo === 'numero' && !isNaN(v)) return numTxt(v, c.sinMiles);
    return String(v);
  };
  const nombreModulo = mod => (D.MODULOS.find(m => m[0] === mod) || [0, mod])[1];

  /* ---------- pantallas y navegación ---------- */
  const GRUPOS = ['Hoy', 'Dinero que entra', 'Dinero que sale', 'Efectivo', 'Bancos', 'Fiscal', 'Recursos humanos', 'Para decidir', 'Sistema'];
  function visibles() { return Object.entries(PANT).filter(([id, p]) => !p.oculta && puede(p.mod) && (!p.visible || p.visible())).map(([id, p]) => ({ id, ...p })); }
  // las secciones (pestañas) de cada pantalla, con su nombre largo y unas pocas palabras de la casa para el buscador:
  // PANT[id].secciones = [[sub, nombre, palabras]] o una función que las devuelve (cuando dependen de los permisos de quien mira)
  // el camino corto de una pantalla («Nómina», «Caja chica», «Vacaciones») va delante: «Nómina › Propinas»
  const seccionesDe = id => { const p = PANT[id]; if (!p || !p.secciones) return []; return (typeof p.secciones === 'function' ? p.secciones() : p.secciones).filter(Boolean); };
  const caminoDe = id => { const p = PANT[id]; return p ? p.camino || p.tab || p.corto || p.titulo : ''; };
  const nombreSeccion = (id, sub) => { const x = seccionesDe(id).find(s => s[0] === sub); return x ? x[1] : ''; };
  // un texto con etiquetas (el «sub» de una ficha) pasado a letras: para el buscador
  const textoPlano = h => { const d = document.createElement('div'); d.innerHTML = String(h ?? ''); return d.textContent.replace(/\s+/g, ' ').trim(); };
  // lo último que abrió cada persona (secciones y fichas): el buscador vacío lo muestra arriba, con sus pendientes
  // se guardan en el equipo: sin señal (o después de recargar) el buscador igual los encuentra
  const RECIENTES = (() => { try { const x = JSON.parse(localStorage.getItem('proto-recientes') || '{}'); return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; } catch (_) { return {}; } })();
  function anotarReciente(x) {
    if (!S.usuario || !x.t) return;
    const l = (RECIENTES[S.usuario.id] || []).filter(y => y.clave !== x.clave); l.unshift({ clave: x.clave, t: x.t, s: x.s, ir: x.ir, abrir: x.abrir }); RECIENTES[S.usuario.id] = l.slice(0, 8);
    try { localStorage.setItem('proto-recientes', JSON.stringify(RECIENTES)); } catch (_) { /* sin almacenamiento: quedan mientras la página esté abierta */ }
  }
  // lo último que abrió y todavía se puede abrir (una ficha guardada de otro día puede ya no existir; una sección, ya no ser suya)
  const recientesVivos = () => (RECIENTES[S.usuario.id] || []).filter(x => {
    if (x.ir) return accesible(String(x.ir).split('/')[0]);
    const [t, i] = String(x.abrir || '').split(':'); if (!FICHAS[t]) return false;
    try { const sp = FICHAS[t](i); return !!sp && puede(sp.mod); } catch (_) { return false; }
  });

  /* ---------- no perder lo escrito ---------- */
  // una ficha en modo Editar con algo cambiado pregunta antes de salir; un formulario (data-form) no pregunta: lo escrito queda como borrador
  const fichaSucia = () => { const f = S.ficha; if (!f || !f.editando || !$('#ficha-raiz [data-ci]')) return false; const c = cambiosFicha(); return !!(c.cambios.length || c.errores.length); };
  const formSucio = () => !!(S.borrador && S.borrador.ruta === S.ruta && S.borrador.sub === S.sub[S.ruta] && $('#main [data-form]'));

  /* ---------- borradores en el equipo ----------
     Lo escrito en un formulario (sacar, meter y contar la bóveda, una reserva, una persona, un préstamo, unas vacaciones) se guarda en este
     equipo mientras se escribe. Salir no abre ninguna ventana: arriba de la pantalla queda una línea, «Tienes un retiro a medias de $ 300 ·
     Seguir · Descartar». Si se va la luz o el teléfono recarga la página, sigue ahí, y al seguir, los chequeos se recalculan con lo escrito.
     Cada pantalla dice cómo se guarda cada formulario: PANT[id].borradores[sub] = { tomar() → datos, poner(datos), txt(datos) → «un retiro
     a medias de $ 300», vacio(datos) → no hay nada escrito }. El borrador tiene su dirección: #boveda~sacar~b<su clave>.
     El almacenamiento del equipo puede no existir (ventana privada, sin permiso): todo va con try/catch y, si falla, vive mientras la
     página esté abierta. */
  const BORR_CLAVE = 'proto-borradores-v1';
  let BORR_MEM = null;
  // un borrador vence solo a los 7 días (lo escrito a medias no se queda para siempre en un equipo que se comparte)
  const BORR_VENCE = 7 * 864e5;
  const borrLeer = () => { if (BORR_MEM) return BORR_MEM; let xs = []; try { xs = JSON.parse(localStorage.getItem(BORR_CLAVE) || '[]'); } catch (_) { xs = []; } BORR_MEM = (Array.isArray(xs) ? xs : []).filter(b => !b.t || Date.now() - b.t < BORR_VENCE); return BORR_MEM; };
  const borrEscribir = xs => { BORR_MEM = xs; try { localStorage.setItem(BORR_CLAVE, JSON.stringify(xs)); } catch (_) { /* sin almacenamiento: queda en la memoria de la página */ } };
  const BORR = {
    mios: () => (S.usuario ? borrLeer().filter(b => b.u === S.usuario.id && (!b.t || Date.now() - b.t < BORR_VENCE)) : []),
    de: id => borrLeer().find(b => b.id === id) || null,
    poner: b => borrEscribir([b].concat(borrLeer().filter(x => x.id !== b.id)).slice(0, 30)),
    quitar: id => borrEscribir(borrLeer().filter(x => x.id !== id)),
    limpiar: u => borrEscribir(u ? borrLeer().filter(x => x.u !== u) : []),
  };
  const manejadorBorr = (ruta, sub) => { const b = PANT[ruta] && PANT[ruta].borradores; return (b && b[sub]) || null; };
  const accesible = r => !!PANT[r] && (PANT[r].libre || (puede(PANT[r].mod) && (!PANT[r].visible || PANT[r].visible())));
  function guardarBorrador() {
    const b = S.borrador; if (!b || !S.usuario) return;
    const h = manejadorBorr(b.ruta, b.sub); if (!h) return;
    let datos; try { datos = JSON.parse(JSON.stringify(h.tomar())); } catch (_) { return; }
    if (h.vacio && h.vacio(datos)) { if (b.id) { BORR.quitar(b.id); b.id = null; programarSinc(); } return; }
    if (!b.id) { b.id = Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); programarSinc(); }
    let txt = 'un formulario a medias'; try { txt = h.txt(datos) || txt; } catch (_) { /* el texto de siempre */ }
    BORR.poner({ id: b.id, u: S.usuario.id, ruta: b.ruta, sub: b.sub, form: b.form, txt, datos, t: Date.now() });
  }
  // empezar a llenar un formulario (escribir, tocar un botón de dos opciones, elegir un día) cuenta como borrador, y se guarda
  function marcarBorrador(form) {
    const b = S.borrador; const mismo = b && b.ruta === S.ruta && b.sub === S.sub[S.ruta] && b.form === form;
    S.borrador = mismo ? b : { ruta: S.ruta, sub: S.sub[S.ruta], form, id: null };
    guardarBorrador();
  }
  // lo guardó de verdad (o lo empezó otra vez en blanco): el borrador sale del equipo
  function borradorHecho() { const b = S.borrador; if (b && b.id) { BORR.quitar(b.id); programarSinc(); } S.borrador = null; }
  // la línea de arriba: con un borrador, su renglón (Seguir · Descartar); con más de uno, un solo renglón «Tienes 4 formularios a medias · Ver»
  // que abre la lista (así la franja no ocupa media pantalla del teléfono) · «Descartar» deja 10 segundos «Deshacer»
  let descartado = null; let borrVer = false;
  function pintarBorradores() {
    const caja = $('#borradores'); if (!caja) return;
    const actual = S.borrador && S.borrador.id;
    const xs = BORR.mios().filter(b => b.id !== actual && manejadorBorr(b.ruta, b.sub) && accesible(b.ruta));
    const des = descartado && S.usuario && descartado.b.u === S.usuario.id && Date.now() < descartado.hasta ? descartado : null;
    if (xs.length < 2) borrVer = false;
    const fila = b => `<p class="borr">${ic('lapiz', 's')}<span class="borr-t">Tienes ${esc(b.txt)}</span><span class="borr-acc"><button class="enlace" data-acc="borr-seguir" data-arg="${esc(b.id)}">Seguir</button><span aria-hidden="true">·</span><button class="enlace" data-acc="borr-descartar" data-arg="${esc(b.id)}">Descartar</button></span></p>`;
    const h = (xs.length > 1 ? `<p class="borr">${ic('lapiz', 's')}<span class="borr-t">Tienes ${xs.length} formularios a medias</span><span class="borr-acc"><button class="enlace" data-acc="borr-ver" aria-expanded="${borrVer}" aria-controls="borr-lista">${borrVer ? 'Esconder' : 'Ver'}</button></span></p>${borrVer ? `<div id="borr-lista" class="borr-lista">${xs.map(fila).join('')}</div>` : ''}` : xs.map(fila).join(''))
      + (des ? `<p class="borr">${ic('check', 's')}<span class="borr-t">Descartaste ${esc(des.b.txt)}</span><span class="borr-acc"><button class="enlace" data-acc="borr-deshacer">Deshacer</button></span></p>` : '');
    if (caja.innerHTML !== h) caja.innerHTML = h;
    caja.hidden = !h;
  }
  ACC['borr-ver'] = () => { borrVer = !borrVer; pintarBorradores(); const b = $('#borradores [data-acc="borr-ver"]'); if (b) b.focus({ preventScroll: true }); };
  ACC['borr-seguir'] = id => {
    const b = BORR.de(id); if (!b || !S.usuario || b.u !== S.usuario.id) { aviso('Ese borrador ya no está.', 'info'); pintarBorradores(); return; }
    if (!accesible(b.ruta)) { aviso('No tienes acceso a esa sección.', 'info'); return; }
    antesDeSalir(() => {
      S.ponerBorrador = b; ir(b.ruta + '/' + b.sub, true); S.ponerBorrador = null;
      const m = $('#main'); if (m) m.focus({ preventScroll: true });
      aviso('Sigues donde lo dejaste.');
    }, { form: true });
  };
  ACC['borr-descartar'] = id => {
    const b = BORR.de(id); if (!b) { pintarBorradores(); return; }
    BORR.quitar(id); descartado = { b, hasta: Date.now() + 10000 };
    pintarBorradores(); setTimeout(pintarBorradores, 10100);
    const d = $('#borradores [data-acc="borr-deshacer"]'); if (d) d.focus({ preventScroll: true });
  };
  ACC['borr-deshacer'] = () => {
    if (!descartado || Date.now() >= descartado.hasta) { pintarBorradores(); return; }
    BORR.poner(descartado.b); const id = descartado.b.id; descartado = null; pintarBorradores();
    const s = $(`#borradores [data-acc="borr-seguir"][data-arg="${CSS.escape(id)}"]`); if (s) s.focus({ preventScroll: true });
  };

  function antesDeSalir(seguir, { form = true } = {}) {
    // lo escrito en un formulario ya está en su borrador: salir no pregunta (arriba de la pantalla queda «Tienes … a medias»)
    if (form && formSucio()) guardarBorrador();
    const enFicha = fichaSucia();
    if (!enFicha) { seguir(); return; }
    if ($('#modal-raiz') && $('#modal-raiz').firstChild) return;
    const n = cambiosFicha().cambios.length;
    const txt = n > 1 ? `Cambiaste ${n} datos de esta ficha y no los guardaste. Si sales, se pierden.` : 'Cambiaste algo en esta ficha y no lo guardaste. Si sales, se pierde.';
    const env = modal(`<h2 id="modal-t">¿Salir sin guardar?</h2><p class="muted" id="modal-d">${txt}</p>
      <div class="modal-acc"><button class="btn sec" data-salir="si">Salir sin guardar</button><button class="btn pri" data-salir="no" data-esc>Seguir editando</button></div>`);
    $('[data-salir="no"]', env).focus();
    env.addEventListener('click', e => {
      const b = e.target.closest('[data-salir]'); if (!b) return;
      cerrarModal();
      if (b.dataset.salir === 'si') { if (S.ficha) S.ficha.editando = false; seguir(); return; }
      // seguir editando: se cierra el menú del teléfono si estaba abierto y el teclado vuelve al campo que se tocó
      if ($('#app').classList.contains('menu-abierto')) ACC.menu();
      const c = $('#ficha-raiz [data-tocado]'); if (c) c.focus();
    });
  }

  // modo: 'push' (un paso nuevo en el historial) · 'atras' («Volver»: si la entrada de antes es esa misma pantalla, es un paso atrás)
  function ir(ruta, sinPreguntar = false, { modo = 'push' } = {}) {
    const [r, s] = String(ruta).split('/');
    if (!accesible(r)) { aviso('No tienes acceso a esa sección.', 'info'); return; }
    // ir a otra sección con una ficha a medio editar pregunta antes; un formulario con algo escrito, no: queda como borrador
    if (!sinPreguntar && fichaSucia()) { antesDeSalir(() => ir(ruta, true, { modo })); return; }
    if (formSucio()) guardarBorrador();
    // tocar otra vez la pestaña (o el botón) de un formulario que muestra su confirmación lo abre en blanco, con el teclado en su primer
    // campo; un formulario a medias se deja como está (alRepetir devuelve dónde va el teclado, o nada)
    const foco = repetirForm(r, s);
    S.ruta = r; if (s) S.sub[r] = s;
    // un formulario (o una vista sin pestañas, como los billetes de la bóveda) no se recuerda: la pestaña o el menú
    // vuelven a la vista principal de esa pantalla
    else if ((PANT[r].transitorias || []).includes(S.sub[r])) S.sub[r] = undefined;
    S.menu = false; cerrarFicha({ volver: false, marca: false });
    $('#app').classList.remove('menu-abierto'); const vm = $('.velo-menu'); if (vm) vm.remove();
    const mas = $('.tab[data-acc="menu"]'); if (mas) mas.setAttribute('aria-expanded', 'false');
    marcarNav(modo);
    pintarPagina(); guardar();
    const sc = $('#main'); if (sc) sc.scrollTop = 0;
    if (foco) { const el = $('#main ' + foco); if (el) el.focus({ preventScroll: true }); }
  }
  // el mismo formulario que ya está en pantalla, mostrando su confirmación («Guardado y avisado al grupo»): la pantalla lo pone en blanco
  const repetirForm = (r, s) => (s && S.ruta === r && S.sub[r] === s && (PANT[r].transitorias || []).includes(s) && PANT[r].alRepetir ? PANT[r].alRepetir(s) : null);
  /* «Volver» de un formulario: un paso atrás, a donde estaba la persona antes de abrirlo (el Mes, la hoja de un día, un pendiente), con lo
     que tenía abierto; si antes no hay un paso de la app (llegó por un enlace), va a la vista que se le dice · lo escrito queda en su borrador */
  function volverAtras(ruta) {
    const ant = HIST.pila[HIST.i - 1]; const st = ant && S.usuario && ant.u === S.usuario.id ? leerDir(ant.d) : null;
    if (!st || !accesible(st.r) || dirDe(st) === direccion()) { volver(ruta); return; }
    antesDeSalir(() => { aplicarEstado(st, { avisar: false }); marcarNav('atras'); programarSinc(); });
  }
  // «Volver» (al terminar un formulario o desde una pantalla de paso): un paso atrás si la pantalla de antes es esa
  const volver = ruta => ir(ruta, false, { modo: 'atras' });

  /* ---------- la dirección de cada pantalla, sección y ficha ----------
     #pantalla~sección[~b<borrador>][.tipo~id][.tipo~id]…
     · la pantalla y su sección (#bancos~conciliacion); un formulario a medias lleva su borrador (#boveda~sacar~bk3f2)
     · después de cada punto, una ficha (#proveedores~facturas.factura~f17): la última es la que se ve; las de antes son el camino que
       vuelve con «‹ Factura N.º …» (#pendientes.pendiente~pe9.conciliacion~BNC)
     · un enlace con solo la ficha (#factura~f17) la abre sobre su pantalla: el parte de las 7:00 y los avisos del bot pueden llevarlo
     · solo letras, números, guion, guion bajo, punto y ~ (lo único que deja pasar el enlace de claude.ai): lo demás va con _ y su código
       («Luis Roberto» → Luis_20Roberto)
     Cada cambio de pantalla, de sección o de ficha es un paso en el historial: el «Atrás» del teléfono cierra primero la ficha (o vuelve a
     la de antes) y después vuelve a la pantalla anterior. Si el teléfono recarga la página o se va la luz, la app abre en el mismo sitio. */
  const codSeg = s => encodeURIComponent(String(s ?? '')).replace(/[_.!~*'()]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase()).replace(/%/g, '_');
  const desSeg = s => { try { return decodeURIComponent(String(s ?? '').replace(/_/g, '%')); } catch (_) { return ''; } };
  // dónde vive cada ficha: la pantalla y la sección donde se trabaja (para un enlace que trae solo la ficha y para los pendientes)
  const CASA = {
    pago: 'caja', cajatotal: 'caja', cliente: 'clientes/deben', ventaemp: 'clientes/empresas', devcliente: 'clientes/deben',
    lineapago: 'pagos/lunes', pagonom: 'pagos/nomina', capturas: 'pagos/lunes', pdf: 'pagos/lunes',
    factura: 'proveedores/facturas', facagente: 'proveedores/facturas', proveedor: 'proveedores/proveedores', devolucion: 'proveedores/devoluciones', cambio: 'auditoria/cambios',
    movboveda: 'boveda', billete: 'boveda/billetes', aportes: 'cajachica/socios', cajachica: 'cajachica/chica', consumosocio: 'cajachica/consumo', gasto: 'cajachica/chica', retiro: 'cajachica/socios', rendir: 'cajachica/rendir',
    cuenta: 'bancos/cuentas', conciliacion: 'bancos/conciliacion', diferencia: 'bancos/conciliacion', tasa: 'tasas',
    obligacion: 'fiscal/vence', oblsuma: 'fiscal/vence', zeta: 'fiscal/z', ivalinea: 'fiscal/iva', retrec: 'fiscal/retenciones', retemi: 'fiscal/retenciones', poremitir: 'fiscal/retenciones',
    permiso: 'fiscal/permisos', maquina: 'fiscal/z', paquete: 'fiscal/paquete', oblconf: 'fiscal/config', apagarmes: 'fiscal/vence',
    reserva: 'calendario/reservas', evento: 'calendario/eventos', agendadia: 'calendario/mes',
    empleado: 'personal/lista', fuero: 'personal/legal', amonestacion: 'personal/legal', dia: 'asistencia/semana', falta: 'asistencia/faltas', redoble: 'asistencia/redobles', incidencia: 'asistencia/horas',
    vacacion: 'ausencias/libro', reposo: 'ausencias/medicos', permisoemp: 'ausencias/permisos',
    recibo: 'nomina/quincena', corrida: 'nomina/corridas', concepto: 'nomina/reglas', turno: 'asistencia/semana', feriado: 'nomina/reglas', propina: 'nomina/propinas',
    prestamo: 'prestamos/prestamos', adelanto: 'prestamos/adelantos', consumoemp: 'prestamos/consumos', prestacion: 'prestaciones/garantia', liquidacion: 'prestaciones/egresos',
    archivo: 'documentos', termo: 'analisis/termometro', fuga: 'analisis/termometro', insumo: 'analisis/precios', decision: 'analisis/decisiones', semana: 'analisis/ventas', equilibrio: 'analisis/ventas', plato: 'analisis/ventas', fecha: 'calendario/personal', kpi: 'inicio',
    usuario: 'usuarios/personas', limite: 'usuarios/aprobaciones', servicio: 'usuarios/bots', param: 'parametros', salud: 'salud', pendiente: 'pendientes', aprobacion: 'inicio',
    // tanda 6: «¿Llegamos a la nómina?» y comida + personal viven en Inicio; el día de Fiscal, en Lo que vence
    llegamos: 'inicio', primo: 'inicio', fiscaldia: 'fiscal/vence',
  };
  // la sección de una pantalla vale si es una de sus pestañas, de sus formularios o de las que ella nombra (subs); si no, la vista principal
  const subValida = (r, s) => { const p = PANT[r]; return !!p && seccionesDe(r).map(x => x[0]).concat(p.transitorias || [], p.subs || []).includes(s); };
  function dirDe(st) {
    if (!st || !st.r) return '';
    return '#' + codSeg(st.r) + (st.s ? '~' + codSeg(st.s) + (st.b ? '~b' + codSeg(st.b) : '') : '') + (st.f || []).map(x => '.' + codSeg(x.tipo) + '~' + codSeg(x.id)).join('');
  }
  function leerDir(h) {
    const t = String(h || '').replace(/^#\/?/, '').replace(/\//g, '~'); if (!t) return null;
    const partes = t.split('.'); const pag = partes.shift().split('~');
    const st = { r: desSeg(pag[0]), s: pag[1] ? desSeg(pag[1]) : undefined, b: pag[2] && pag[2][0] === 'b' ? desSeg(pag[2].slice(1)) : '', f: [] };
    partes.forEach(p => { const [t2, i] = p.split('~'); if (t2) st.f.push({ tipo: desSeg(t2), id: desSeg(i || '') }); });
    // solo la ficha (#factura~f17): se abre sobre su pantalla
    if (!PANT[st.r] && FICHAS[st.r]) { st.f.unshift({ tipo: st.r, id: st.s || '' }); const c = (CASA[st.r] || 'inicio').split('/'); st.r = c[0]; st.s = c[1] || undefined; st.b = ''; }
    return st;
  }
  // dónde está ahora la persona: la pantalla, su sección, el borrador del formulario abierto y el camino de fichas
  function estadoActual() {
    if (!S.usuario) return null;
    const s = S.sub[S.ruta]; const b = S.borrador;
    return { r: S.ruta, s, b: b && b.id && b.ruta === S.ruta && b.sub === s ? b.id : '', f: S.ficha ? (S.ficha.pila || []).map(x => ({ tipo: x.tipo, id: x.id })).concat([{ tipo: S.ficha.tipo, id: S.ficha.id }]) : [] };
  }
  const direccion = () => dirDe(estadoActual());
  // el enlace completo que se copia o que manda el bot: esta misma página con la dirección
  const enlaceDe = d => { try { return location.href.split('#')[0] + d; } catch (_) { return d; } };

  /* el historial: un espejo de las entradas que la app puso (con su clave), guardado en la sesión del navegador para que sobreviva a una
     recarga · cada cambio se escribe una sola vez al terminar lo que se tocó (aunque abra una pantalla y una ficha a la vez) */
  const HIST = { pila: [], i: -1, modo: null, esperando: 0, programado: false, listo: false };
  const claveH = () => Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
  const guardarHist = () => { try { sessionStorage.setItem('proto-historial', JSON.stringify({ pila: HIST.pila, i: HIST.i })); } catch (_) { /* sin almacenamiento de sesión */ } };
  // cómo cuenta el próximo cambio: 'push' (un paso nuevo), 'cerrar' o 'atras' (si la entrada de antes es igual, un paso atrás), 'reemplazar'
  function marcarNav(modo) { HIST.modo = modo; }
  function programarSinc() {
    if (HIST.programado || !HIST.listo) return; HIST.programado = true;
    const f = () => { if (HIST.programado) sincronizar(); };
    if (window.queueMicrotask) queueMicrotask(f); else Promise.resolve().then(f);
  }
  function sincronizar() {
    HIST.programado = false;
    const st = estadoActual(); if (!HIST.listo || !st) return;
    const d = dirDe(st); const u = S.usuario.id; const sb = dirDe({ ...st, b: '' });
    const modo = HIST.modo || 'push'; HIST.modo = null;
    const act = HIST.pila[HIST.i];
    if (act && act.d === d && act.u === u) return;
    const ant = HIST.pila[HIST.i - 1];
    if ((modo === 'cerrar' || modo === 'atras') && ant && ant.d === d && ant.u === u) {
      HIST.i--; HIST.esperando++; guardarHist();
      try { history.back(); } catch (_) { HIST.esperando--; }
      guardar(); return;
    }
    // solo cambió el borrador (se empezó a escribir), o se cerró algo que no tenía paso propio: la misma entrada, con lo nuevo
    const reemplaza = !act || modo === 'reemplazar' || modo === 'cerrar' || modo === 'atras' || (act.u === u && act.sb === sb);
    const ent = { k: claveH(), d, sb, u };
    try {
      if (reemplaza) history.replaceState({ k: ent.k }, '', d); else history.pushState({ k: ent.k }, '', d);
    } catch (_) { guardar(); return; /* este navegador no deja cambiar la dirección (un marco sin permiso): la app sigue igual */ }
    if (reemplaza) { HIST.i = Math.max(HIST.i, 0); HIST.pila[HIST.i] = ent; }
    else { HIST.pila = HIST.pila.slice(0, HIST.i + 1).concat([ent]); HIST.i = HIST.pila.length - 1; if (HIST.pila.length > 120) { HIST.pila.shift(); HIST.i--; } }
    guardarHist(); guardar();
  }
  // lo que dice una dirección se pone en pantalla (al recargar, con Atrás y Adelante, con un enlace): con los permisos de quien mira
  // además del módulo, cada ficha trae su propia regla: la que lleva montos por persona (sensible: 'sueldos') solo se abre con ese permiso
  // (las fichas de recibos, prestaciones, consumos, préstamos y adelantos ya devuelven su versión «solo el total» a quien no lo tiene)
  const fichaPermitida = x => {
    try { const sp = FICHAS[x.tipo] && FICHAS[x.tipo](x.id); if (!sp || !puede(sp.mod) || !specPermitida(sp)) return false;
      return x.tipo !== 'pendiente' || !!D.PENDIENTES.find(p => p.id === x.id && p.para.includes(S.usuario.id)); } catch (_) { return false; }
  };
  function aplicarEstado(st, { avisar = true } = {}) {
    if (!st) return;
    if (!S.usuario) { S.destino = st; return; }
    let r = st.r, s = st.s;
    if (!accesible(r)) { if (r && avisar) aviso('No tienes acceso a esa sección.', 'info'); r = accesible(S.ruta) ? S.ruta : 'inicio'; s = S.sub[r]; }
    else if (s !== undefined && !subValida(r, s)) s = undefined;
    // el borrador de un formulario (si sigue en este equipo y es de quien mira) vuelve con lo escrito
    const bo = st.b && r === st.r ? BORR.de(st.b) : null;
    S.ponerBorrador = bo && bo.u === S.usuario.id && bo.ruta === r && bo.sub === s ? bo : null;
    if (formSucio()) guardarBorrador();
    S.ruta = r; S.sub[r] = s; S.menu = false;
    cerrarFicha({ volver: false, marca: false });
    $('#app').classList.remove('menu-abierto'); const vm = $('.velo-menu'); if (vm) vm.remove();
    pintarPagina(); S.ponerBorrador = null;
    const fs = (st.f || []).filter(x => x && FICHAS[x.tipo]);
    if (fs.length) {
      const top = fs[fs.length - 1];
      if (fichaPermitida(top)) abrir(top.tipo, top.id, { pila: fs.slice(0, -1).filter(fichaPermitida).map(x => ({ tipo: x.tipo, id: x.id })) });
      else if (avisar) aviso('Esa ficha ya no está o no tienes acceso a ella.', 'info');
    }
  }
  // cerrar lo que está encima sin moverse: la ventana (como Cancelar), el buscador o el menú «Más»
  function cancelarVentana() { const mr = $('#modal-raiz'); if (!mr || !mr.firstChild) return; const no = mr.querySelector('[data-esc]') || mr.querySelector('.modal-acc [data-m="no"]') || mr.querySelector('.modal-acc .btn.sec'); if (no) no.click(); else cerrarModal(); }
  // el navegador ya dio el paso atrás, pero lo que se cerró era lo de encima: la pantalla vuelve a su entrada
  const reponer = () => { marcarNav('push'); sincronizar(); };
  function alMoverHistorial(estado) {
    const k = estado && estado.k; let i = k ? HIST.pila.findIndex(x => x.k === k) : -1;
    if (i < 0) {
      // una entrada que la app no conoce: un enlace con # o la dirección escrita a mano
      const ent = { k: claveH(), d: location.hash, sb: location.hash, u: S.usuario ? S.usuario.id : '' };
      HIST.pila = HIST.pila.slice(0, HIST.i + 1).concat([ent]); i = HIST.pila.length - 1;
      try { history.replaceState({ k: ent.k }, '', location.hash); } catch (_) { /* sin permiso para cambiar la dirección */ }
    }
    HIST.i = i; guardarHist();
    // el paso atrás que pidió la propia app (cerrar una ficha, «Volver»): la pantalla ya está ahí
    if (HIST.esperando > 0) { HIST.esperando--; return; }
    if (!S.usuario) { S.destino = leerDir(location.hash); return; }
    const ent = HIST.pila[i];
    if (ent.u && ent.u !== S.usuario.id) { reponer(); return; } // de otra persona (antes de «Ver como»): se queda donde está
    // primero se cierra lo que está encima, y la pantalla se queda donde estaba
    if (llena('modal-raiz')) { cancelarVentana(); reponer(); return; }
    if (llena('buscador-raiz')) { cerrarBuscador(true); reponer(); return; }
    if ($('#app').classList.contains('menu-abierto')) { ACC.menu(); reponer(); return; }
    // la dirección de esa entrada (la que guardó la app; si no la conoce, la que trae el navegador)
    const st = leerDir(ent.d || location.hash); if (!st) return;
    if (dirDe(st) === direccion()) return;
    // una ficha a medio editar pregunta antes («¿Salir sin guardar?»): mientras tanto, la pantalla vuelve a su entrada
    if (fichaSucia()) { reponer(); antesDeSalir(() => aplicarEstado(st)); return; }
    // si algo de esa entrada ya no se puede abrir (una ficha que ya no está), la entrada se corrige en su sitio: no se suma un paso
    aplicarEstado(st); marcarNav('reemplazar');
  }
  window.addEventListener('popstate', e => alMoverHistorial(e.state));
  // si el navegador cambió la dirección sin avisar con popstate (una dirección escrita a mano), también se sigue
  window.addEventListener('hashchange', () => { if (S.usuario && HIST.listo && location.hash !== direccion() && !(HIST.pila[HIST.i] && HIST.pila[HIST.i].d === location.hash)) alMoverHistorial(history.state); });
  // al arrancar: se adopta la entrada en que está el navegador (con su espejo si la página se recargó) y se escribe la dirección de hoy
  function iniciarHistorial() {
    let espejo = null; try { espejo = JSON.parse(sessionStorage.getItem('proto-historial') || 'null'); } catch (_) { espejo = null; }
    const k = history.state && history.state.k; const i = espejo && Array.isArray(espejo.pila) && k ? espejo.pila.findIndex(x => x.k === k) : -1;
    if (i >= 0) { HIST.pila = espejo.pila; HIST.i = i; } else { HIST.pila = []; HIST.i = -1; }
    HIST.listo = true; marcarNav('reemplazar'); sincronizar();
  }
  // el número de una pantalla («caja») o de una de sus secciones («calendario/reservas»: PANT[id].cuentas[sección], si la tiene)
  function cuentaPend(id) {
    const [r, s] = String(id).split('/'); const p = PANT[r]; if (!p) return 0;
    if (s) return p.cuentas && p.cuentas[s] ? p.cuentas[s]() : 0;
    return p.cuenta ? p.cuenta() : 0;
  }
  /* las pestañas de abajo (teléfono), según el trabajo de cada quien: una pestaña lleva a una pantalla («caja») o directo a una sección
     ({ ir: 'analisis/precios', t: 'Precios', icono }) · accion: la que hace algo («Nueva reserva») · solo las que la persona puede abrir */
  const primeraSeccion = r => { const xs = seccionesDe(r); return xs.length ? xs[0][0] : undefined; };
  function tabsDe(u = S.usuario) {
    return ((u && u.tabs) || []).map(t => (typeof t === 'string' ? { ir: t } : t)).map(t => {
      const [r, s] = String(t.ir).split('/'); const p = PANT[r];
      return { ...t, r, s, p, t: t.t || (s ? nombreSeccion(r, s) : '') || (p ? p.tab || p.corto || p.titulo : ''), icono: t.icono || (p ? p.icono : 'info') };
    }).filter(t => t.p && accesible(t.r) && (!t.s || subValida(t.r, t.s)));
  }
  // la pestaña que corresponde a donde está la persona: la de su sección si la tiene; si no, la de su pantalla
  function tabActual(ir) {
    const [r, s] = String(ir).split('/'); if (r !== S.ruta) return false;
    const sub = S.sub[r] || primeraSeccion(r);
    if (s) return s === sub;
    return !tabsDe().some(t => t.r === r && t.s && t.s === sub);
  }
  // en «Más» se esconde lo que ya está abajo: la pantalla, o su primera sección (Calendario › Mes cubre el Calendario; Análisis › Precios, no)
  const enTabsDe = (id, tabs = tabsDe()) => tabs.some(t => t.r === id && (!t.s || t.s === primeraSeccion(id)));
  // el menú por grupos · a un grupo al que, por los permisos de quien mira, le queda una sola cosa se le quita el título y va en un
  // bloque propio, sin título, después de una raya (el «Fiscal» de Alejandro, el «Bancos» de Manuel): nunca debajo del título de otro
  // grupo · los sueltos seguidos comparten su bloque
  function gruposMenu(vis) {
    const out = [];
    GRUPOS.forEach(g => {
      const items = vis.filter(p => p.grupo === g); if (!items.length) return;
      if (items.length === 1 && out.length) { const u = out[out.length - 1]; if (u.sueltos) u.items.push(items[0]); else out.push({ g: '', items: [items[0]], sueltos: true }); }
      else out.push({ g, items, sueltos: false });
    });
    return out;
  }
  function pintarArmazon() {
    const u = S.usuario; const vis = visibles();
    const tabs = tabsDe(u);
    // en el teléfono, «Más» muestra solo lo que no está en las pestañas de abajo: lo que ya está ahí lleva «en-tabs» y se esconde
    const enTabs = p => enTabsDe(p.id, tabs);
    const item = p => {
      const c = cuentaPend(p.id);
      const lect = !puede(p.mod, 'editar') && p.mod !== 'caja' && p.mod !== 'inicio' && p.mod !== 'auditoria' && p.mod !== 'salud';
      return `<button class="nav-item${enTabs(p) ? ' en-tabs' : ''}" data-ir="${p.id}">${ic(p.icono)}<span>${esc(p.corto || p.titulo)}</span>${c ? `<span class="cuenta">${c}</span>` : (lect ? `<span class="candado" title="Solo lectura">${ic('ojo', 'xs')}<span class="sr-only">, solo lectura</span></span>` : '')}</button>`;
    };
    // en «Más», un grupo (o un bloque de sueltos) que ya está entero en las pestañas de abajo se esconde
    const nav = gruposMenu(vis).map(x => `<div class="nav-grupo${x.sueltos ? ' nav-sueltos' : ''}${x.items.every(enTabs) ? ' en-tabs' : ''}">${x.sueltos ? '' : `<p>${x.g}</p>`}${x.items.map(item).join('')}</div>`).join('');
    const rol = D.ROLES[u.rol];
    const lectura = !['e', 'a'].includes(nivel('pagos')) && !['e', 'a'].includes(nivel('fiscal')) && !['p', 'r', 'a'].includes(nivel('nomina')) && !['e', 'a'].includes(nivel('personal')) && !['e', 'a'].includes(nivel('calendario'));
    // la sede se escoge cuando haya más de una; mientras sea una sola, no se muestra
    const sedes = (D.PARAMS && D.PARAMS.sedes) || [];
    // la franja de aprendiz (o de acceso por confirmar): en el teléfono se recoge en una chapita de la barra que se toca para leerla
    const banda = u.estado === 'aprendiz' ? { chapa: 'Aprendiz', html: `<b>Modo aprendiz ${esc(u.aprendiz)}.</b> Lo que registres que mueva plata queda para que otra persona lo apruebe. <button class="enlace" data-abrir="aprobacion:aprendiz">Qué necesita aprobación</button>` }
      : u.estado === 'por_confirmar' ? { chapa: 'Por confirmar', html: `<b>Acceso por confirmar.</b> ${esc(u.confirmar || 'Alejandro todavía no lo decide.')}` } : null;
    // la pestaña: su ícono y su nombre · la de una acción («Nueva reserva») lleva el ícono en un círculo de tinta
    const tabHtml = t => { const c = cuentaPend(t.ir); return `<button class="tab${t.accion ? ' accion' : ''}" data-ir="${esc(t.ir)}">${t.accion ? `<span class="tab-circulo" aria-hidden="true">${ic(t.icono)}</span>` : ic(t.icono)}<span class="tab-t">${esc(t.t)}</span>${c ? `<span class="cuenta">${c}</span>` : ''}</button>`; };
    $('#app').innerHTML = `
      <aside class="side" aria-label="Menú">
        <div class="side-top">
          <div class="marca"><span class="marca-sello" aria-hidden="true">R</span><div><b>Administración</b><small>Restaurante · ejemplo</small></div></div>
          ${sedes.length > 1 ? `<button class="sede" data-acc="sede">Sede ${esc(sedes[0].nombre)} ${ic('abajo', 's')}</button>` : ''}
          <button class="side-buscar" data-acc="buscar-mas" type="button">${ic('buscar', 's')}<span>Buscar en toda la app</span></button>
        </div>
        <nav class="side-nav">${nav}</nav>
        <div class="side-pie"><button class="yo" data-ir="cuenta"><span class="avatar">${iniciales(u)}</span><span><b>${esc(nombreDe(u))}</b><small>${esc(rol.nombre)}</small></span></button></div>
      </aside>
      <div class="col">
        <header class="top">
          <div class="top-titulo"><small id="top-grupo"></small><b id="top-t"></b></div>
          <label class="buscar" for="buscar-top">${ic('buscar', 's')}<input id="buscar-top" placeholder="Buscar en toda la app…" autocomplete="off" readonly data-acc="buscar" aria-keyshortcuts="${ES_MAC ? 'Meta+K' : 'Control+K'}"><kbd>${ATAJO}</kbd></label>
          <div class="top-acc">
            ${banda ? `<button class="chapita solo-tel" type="button" data-acc="banda" aria-expanded="false" aria-controls="banda">${ic('info', 's')}<span>${esc(banda.chapa)}</span><span class="sr-only">: toca para leer</span></button>` : ''}
            ${lectura ? `<span class="lectura-chip">${ic('ojo', 's')}<span class="largo">Solo lectura</span><span class="corto">Solo ver</span></span>` : ''}
            <button class="redondo solo-tel" data-acc="buscar" aria-label="Buscar en toda la app">${ic('buscar')}</button>
            <button class="redondo" data-ir="pendientes" aria-label="Pendientes">${ic('campana')}${misPendientes().length ? `<span class="cuenta">${misPendientes().length}</span>` : ''}</button>
          </div>
        </header>
        ${banda ? `<div class="banda aprendiz" id="banda">${ic('info', 's')}<span>${banda.html}</span></div>` : ''}
        <div class="borradores" id="borradores" role="region" aria-label="Formularios a medias" aria-live="polite" hidden></div>
        <main class="scroll" id="main" tabindex="-1"></main>
        <nav class="tabs" aria-label="Secciones">${tabs.map(tabHtml).join('')}<button class="tab" data-acc="menu" aria-expanded="false">${ic('menu')}<span class="tab-t">Más</span></button></nav>
      </div>
      <div id="ficha-raiz"></div><div id="modal-raiz"></div><div id="buscador-raiz"></div>
      <div class="toast" id="toast" role="status" hidden></div>`;
    vigilarVentanas();
  }
  function pintarPagina() {
    if (!S.usuario) return;
    const p = PANT[S.ruta]; const main = $('#main'); if (!main) return;
    // al salir de una vista (a otra pantalla o a otra pestaña), la pantalla que se deja borra lo que no debe quedar:
    // la confirmación de «Retiro registrado» o «Reserva guardada» se ve una sola vez y el formulario vuelve en blanco
    const ahora = { ruta: S.ruta, sub: S.sub[S.ruta] }; const antes = S.vista;
    if (antes && (antes.ruta !== ahora.ruta || antes.sub !== ahora.sub)) {
      // lo escrito en el formulario que se deja queda en su borrador (con lo último, también lo que solo está en la página) y el formulario termina
      if (S.borrador && S.borrador.ruta === antes.ruta && S.borrador.sub === antes.sub) { guardarBorrador(); S.borrador = null; }
      const pa = PANT[antes.ruta]; if (pa && pa.alSalir) pa.alSalir(antes.sub);
    }
    // un borrador que vuelve («Seguir», al recargar, con Atrás o Adelante): el formulario se llena con lo que tenía antes de dibujarse
    const pb = S.ponerBorrador;
    if (pb && pb.ruta === ahora.ruta && pb.sub === ahora.sub) {
      S.ponerBorrador = null; const h = manejadorBorr(pb.ruta, pb.sub);
      if (h) { try { h.poner(JSON.parse(JSON.stringify(pb.datos))); S.borrador = { ruta: pb.ruta, sub: pb.sub, form: pb.form, id: pb.id }; } catch (_) { /* el borrador ya no sirve: el formulario sale como esté */ } }
    }
    // una sección nueva queda entre lo último que abrió la persona (Inicio no: siempre está a un toque); un formulario cuenta como su pantalla
    if (!antes || antes.ruta !== ahora.ruta || antes.sub !== ahora.sub) {
      const sub = (p.transitorias || []).includes(ahora.sub) ? '' : ahora.sub || ''; const ns = sub ? nombreSeccion(S.ruta, sub) : '';
      if (S.ruta !== 'inicio') anotarReciente({ clave: 'ir:' + S.ruta + '/' + (ns ? sub : ''), t: ns ? caminoDe(S.ruta) + ' › ' + ns : p.titulo, s: 'Sección', ir: S.ruta + (ns ? '/' + sub : '') });
    }
    S.vista = ahora;
    // después de un filtro, una pestaña o una acción, el teclado vuelve al mismo botón, no al principio. Si ese botón ya no está
    // («Entendido», «Guardar mi conteo»), va al siguiente que había; si tampoco, a su tarjeta; y solo al final, a la página
    const act = document.activeElement; const enMain = !!(act && act !== main && main.contains(act));
    const clave = enMain ? claveDe(act) : null; const clavesSig = []; let claveCaja = '';
    if (enMain) {
      const fs = enfocables(main); const i = fs.indexOf(act);
      for (let k = i + 1; k > 0 && k < fs.length && clavesSig.length < 6; k++) { const c = claveDe(fs[k]); if (c) clavesSig.push(c); }
      for (let x = act.parentElement; x && x !== main && !claveCaja; x = x.parentElement) claveCaja = claveDe(x);
    }
    main.innerHTML = p.render(S.sub[S.ruta]);
    if (p.montar) p.montar(main, S.sub[S.ruta]);
    juntarMontos(main);
    if (window.APP && window.APP.alMontar) window.APP.alMontar(main);
    // un formulario que se guardó (en su lugar quedó la confirmación) ya no es borrador: sale del equipo; si sigue, se guarda como está
    if (S.borrador && S.borrador.ruta === S.ruta && S.borrador.sub === S.sub[S.ruta]) { if (main.querySelector('[data-form]')) guardarBorrador(); else borradorHecho(); }
    else if (S.borrador && !main.querySelector('[data-form]')) S.borrador = null;
    if (enMain && !main.contains(document.activeElement)) {
      // lo que se puede enfocar de verdad: que exista, no esté desactivado (el testigo del conteo, en el paso 2) y se vea
      const tomar = c => { const el = c ? main.querySelector(c) : null; if (!el || el.disabled || !el.getClientRects().length) return false; el.focus({ preventScroll: true }); return document.activeElement === el; };
      const caja = () => { const el = claveCaja ? main.querySelector(claveCaja) : null; if (!el) return false; if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); return document.activeElement === el; };
      if (!tomar(clave) && !clavesSig.some(tomar) && !caja()) main.focus({ preventScroll: true });
    }
    refrescarCuentas();
    // el menú marca la pantalla; las pestañas de abajo, la sección si la pestaña lleva a una (Patricia: Reservas, Mes, Eventos)
    $$('[data-ir]').forEach(b => { const es = b.classList.contains('nav-item') ? b.dataset.ir === S.ruta : b.classList.contains('tab') ? tabActual(b.dataset.ir) : null; if (es === null) return; if (es) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    // la barra de arriba: el título sale cuando el grande ya no se ve, y el rótulo chico dice la sección donde se está («Reservas», «Avisos al
    // grupo»: el botón «Sección: …» ya no se ve al bajar); sin sección, el grupo del menú, salvo «Hoy» (se leía como una fecha) y sin repetir el título
    const subVista = (p.transitorias || []).includes(S.sub[S.ruta]) ? '' : (S.sub[S.ruta] || primeraSeccion(S.ruta) || ''); const nomSec = subVista ? nombreSeccion(S.ruta, subVista) : '';
    $('#top-t').textContent = p.titulo; $('#top-grupo').textContent = nomSec && sinTildes(nomSec) !== sinTildes(p.titulo) ? nomSec : p.grupo && p.grupo !== 'Hoy' && sinTildes(p.grupo) !== sinTildes(p.titulo) ? p.grupo : '';
    vigilarTitulo();
    document.title = p.titulo + ' · Administración';
    pintarBorradores();
    programarSinc();
  }
  // el título de la barra de arriba aparece solo cuando el título grande de la página ya salió de la vista (así no se lee dos veces)
  let ioTitulo = null;
  function vigilarTitulo() {
    const top = $('.top'); const main = $('#main'); if (!top || !main) return;
    if (ioTitulo) { ioTitulo.disconnect(); ioTitulo = null; }
    const h1 = main.querySelector('h1');
    if (!h1 || !window.IntersectionObserver) { top.classList.add('ver-titulo'); return; }
    top.classList.remove('ver-titulo');
    ioTitulo = new IntersectionObserver(es => { const e = es[es.length - 1]; if (e) top.classList.toggle('ver-titulo', !e.isIntersecting); }, { root: main, threshold: 0 });
    ioTitulo.observe(h1);
  }
  // la chapita de aprendiz (teléfono): se toca y se lee la franja entera; se toca otra vez y se recoge
  ACC.banda = (arg, el) => {
    const b = $('#banda'); if (!b) return; const abierta = b.classList.toggle('abierta');
    if (el) el.setAttribute('aria-expanded', String(abierta));
  };
  function refrescarCuentas() {
    $$('.nav-item[data-ir], .tab[data-ir]').forEach(b => {
      const c = cuentaPend(b.dataset.ir); let el = b.querySelector('.cuenta');
      if (c) { if (!el) { el = document.createElement('span'); el.className = 'cuenta'; const cand = b.querySelector('.candado'); if (cand) cand.remove(); b.appendChild(el); } el.textContent = c; } else if (el) el.remove();
    });
    const bell = $('.redondo[data-ir="pendientes"]'); if (bell) { const n = misPendientes().length; let el = bell.querySelector('.cuenta'); if (n) { if (!el) { el = document.createElement('span'); el.className = 'cuenta'; bell.appendChild(el); } el.textContent = n; } else if (el) el.remove(); }
  }
  function misPendientes() { return S.usuario ? D.PENDIENTES.filter(p => p.para.includes(S.usuario.id) && !p.hecho) : []; }
  // cada pendiente le llega solo a quien puede resolverlo, y le habla de su paso: a Andreina «Preparar la nómina», a Jose «Revisar la nómina»
  // (titulos y subs por persona: { jose: '…' }; si no trae el suyo, el de todos)
  const tituloPend = (p, u = S.usuario) => (p.titulos && u && p.titulos[u.id]) || p.titulo;
  // un pendiente que espera a otro (el de Jose espera que Andreina prepare la nómina): mientras tanto no se marca resuelto
  const enEspera = p => !!p && !!p.espera && !(D.PENDIENTES.find(x => x.id === p.espera) || {}).hecho;
  const subPendDe = (p, u = S.usuario) => (p.espera && !enEspera(p) && p.listo) || (p.subs && u && p.subs[u.id]) || p.sub;

  /* ---------- buscador: la lupa en el teléfono, la caja de arriba (⌘K o Ctrl K) en la computadora ---------- */
  // compara sin tildes y sin mayúsculas; cada palabra cuenta desde su inicio («iva» trae «Hoja de IVA» antes que a un apellido como «Rivas»);
  // los números, en cualquier parte y sin puntos ni comas («4.512» encuentra la factura A-004512). Siempre con los permisos de quien busca.
  // También montos y referencias: «33812», «33.812,47» o «3381247» encuentran el pago móvil de Bs 33.812,47 de Caja, y «1903» su referencia
  // …871903; lo mismo en las líneas del lunes, las diferencias del banco y las facturas. Y lo fiscal: un Z por su número, los comprobantes
  // de retención, los permisos y las preguntas para la contadora. Cada resultado dice qué es, de qué día y por cuánto.
  // Sin señal encuentra las secciones y lo último que se abrió (está en el equipo); los montos y las referencias necesitan conexión.
  const ES_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');
  const ATAJO = ES_MAC ? '⌘K' : 'Ctrl K';
  const sinTildes = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const soloCifras = s => s.replace(/(\d)[.,](?=\d)/g, '$1');
  const soloDig = s => String(s ?? '').replace(/\D/g, '');
  // dónde empieza una palabra que arranca con q (o −1)
  const alInicio = (h, q) => { for (let i = h.indexOf(q); i >= 0; i = h.indexOf(q, i + 1)) if (i === 0 || !/[a-z0-9]/.test(h[i - 1])) return i; return -1; };
  const ORDEN_BUS = { seccion: 0, reciente: 1, pendiente: 2, caja: 3, lunes: 4, nomina: 5, diferencia: 6, factura: 7, proveedor: 8, persona: 9, cliente: 10, reserva: 11, fiscal: 12, zeta: 13, retencion: 14, permiso: 15, pregunta: 16 };
  // sin señal (en el prototipo se prueba con su casilla; en la app, también cuando el teléfono avisa que no hay conexión)
  // alVolver: lo que espera la señal (un aviso al grupo guardado en el teléfono) sale cuando vuelve
  const RED = { sin: false, alVolver: [] };
  const sinRed = () => RED.sin || (typeof navigator !== 'undefined' && navigator.onLine === false);
  // cada pantalla suma lo suyo con BUSCABLES.push(() => [registros]), siempre con los permisos de quien busca. Un registro:
  // { t: qué es (el título), que: «Caja · pago móvil», dia: «hoy 13:42», monto: «Bs 33.812,47» (lo que se ve), montos: [números], refs: [textos],
  //   tipo (para el orden) y abrir: 'tipo:id', ir: 'pantalla/sección' o acc + arg (una acción con nombre) }
  const BUSCABLES = [];
  // el renglón de abajo de un resultado: qué es y de qué día (el monto va aparte, a la derecha)
  const queDia = x => [x.que, x.dia].filter(Boolean).join(' · ');
  // todo lo que se puede buscar: las secciones con su camino («Nómina › Propinas») y sus palabras de la casa, los pendientes y los registros
  function indiceBuscador() {
    const items = []; const sec = (t, ir, a, top) => items.push({ t, s: 'Sección', ir, a: a || '', tipo: 'seccion', top });
    visibles().forEach(p => { sec(p.titulo, p.id, p.palabras, true); seccionesDe(p.id).forEach(([sub, nombre, a]) => sec(caminoDe(p.id) + ' › ' + nombre, p.id + '/' + sub, a)); });
    sec('Mi cuenta', 'cuenta', 'clave contrasena codigo sesion respaldo', true);
    // sin señal: además de las secciones, solo lo último que abrió (eso sí está en el equipo)
    if (sinRed()) { recientesVivos().filter(x => !x.ir).forEach(x => items.push({ ...x, tipo: 'reciente', s: 'Lo último que abriste' })); return items; }
    misPendientes().forEach(p => items.push({ t: tituloPend(p), que: 'Pendiente', dia: p.edad, abrir: 'pendiente:' + p.id, tipo: 'pendiente' }));
    if (puede('proveedores')) D.PROVEEDORES.forEach(p => items.push({ t: p.nombre, que: 'Proveedor' + (p.deuda ? ' · les debemos' : ''), monto: p.deuda ? dinero(p.deuda, 'usd') : '', montos: p.deuda ? [p.deuda] : [], refs: [p.rif], abrir: 'proveedor:' + p.id, tipo: 'proveedor' }));
    if (puede('clientes')) D.CLIENTES.forEach(c => items.push({ t: c.nombre, que: 'Cliente' + (c.saldo ? ' · nos debe' : ''), monto: c.saldo ? dinero(c.saldo, c.mon) : '', montos: c.saldo ? [c.saldo] : [], refs: [c.rif], abrir: 'cliente:' + c.id, tipo: 'cliente' }));
    // las personas, por su nombre y su cargo: el sueldo no sale aquí (los sueldos por persona solo los ve quien puede verlos, en su ficha)
    if (puede('personal')) D.EMPLEADOS.forEach(e => items.push({ t: e.nombre, que: e.cargo + (e.estado === 'egresado' ? ' · ya no trabaja aquí' : ''), abrir: 'empleado:' + e.id, tipo: 'persona' }));
    if (puede('calendario')) D.RESERVAS.forEach(r => items.push({ t: r.nombre, que: 'Reserva · ' + r.personas + (r.personas === 1 ? ' persona' : ' personas'), dia: (r.d ? r.d[0] + ' ' + D.MESES[r.d[1]] + ' ' : '') + r.hora, abrir: 'reserva:' + r.id, tipo: 'reserva' }));
    if (puede('fiscal')) D.OBLIGACIONES.forEach(o => items.push({ t: o.corto, que: 'Fiscal · ' + o.ente, dia: 'vence ' + o.vence, monto: o.monto ? dinero(o.monto, 'bs') : '', montos: o.monto ? [o.monto] : [], abrir: 'obligacion:' + o.id, tipo: 'fiscal' }));
    BUSCABLES.forEach(f => { try { (f() || []).forEach(x => items.push(x)); } catch (_) { /* una pantalla que no pudo sumar lo suyo no rompe el buscador */ } });
    items.forEach(x => { if (x.s === undefined) x.s = queDia(x); });
    return items;
  }
  // un número escrito como monto o como referencia: «33812», «33.812,47», «$ 1.738,62» o los últimos números de una referencia
  // · el monto exacto vale más que sus mismas cifras sin coma («3381247»), y esas más que su parte entera («33812» → Bs 33.812,47);
  //   el principio de sus cifras solo cuenta con 6 números o más (con menos, «125» encontraría cualquier monto que empiece así)
  // · una referencia que termina con esos números vale más que una que solo los trae en el medio
  function puntosNumero(it, w) {
    const c = w.replace(/[.,]/g, ''); let p = it._nc.includes(c) ? 40 : it._sc.includes(c) ? 30 : 0;
    if (it._refs && c.length >= 3) it._refs.forEach(r => { if (r.endsWith(c)) p = Math.max(p, 52); else if (r.includes(c)) p = Math.max(p, 44); });
    if (it.montos && it.montos.length) {
      const v = leerNum(w); const conDec = /[.,]\d{1,2}$/.test(w);
      it.montos.forEach(m => {
        const a = Math.abs(+m); if (!a) return;
        const cifras = String(Math.round(a * 100));
        if (v !== null && Math.abs(a - v) < 0.005) p = Math.max(p, 60);
        else if (cifras === c) p = Math.max(p, 58);
        else if (v !== null && !conDec && Math.floor(a) === v) p = Math.max(p, 56);
        else if (c.length >= 6 && cifras.startsWith(c)) p = Math.max(p, 24);
      });
    }
    return p;
  }
  const esNumero = w => /\d/.test(w) && /^[\d.,]+$/.test(w);
  // ¿lo escrito es este monto? (exacto, sus cifras sin coma o su parte entera, como en puntosNumero)
  const coincideMonto = (m, palabras) => palabras.some(w => { if (!esNumero(w)) return false; const v = leerNum(w), c = w.replace(/[.,]/g, ''), a = Math.abs(+m);
    return (v !== null && Math.abs(a - v) < 0.005) || String(Math.round(a * 100)) === c || (v !== null && !/[.,]\d{1,2}$/.test(w) && Math.floor(a) === v); });
  // cuánto se parece: el inicio del nombre vale más que una palabra del medio, y esa más que el camino, las palabras de la casa o un pedazo
  // de palabra; una palabra de la casa escrita completa («sueldo», «retiro», «iva») sube su sección al primer lugar
  function puntaje(it, palabras, q) {
    if (it._n === undefined) { it._n = sinTildes(it.t); it._s = sinTildes(it.s); it._a = ' ' + sinTildes(it.a) + ' '; it._nc = soloCifras(it._n); it._sc = soloCifras(it._s); it._refs = it.refs ? it.refs.map(soloDig).filter(Boolean) : null; }
    let tot = 0;
    for (const w of palabras) {
      let p;
      if (esNumero(w)) p = puntosNumero(it, w);
      else {
        const i = alInicio(it._n, w);
        p = i === 0 ? 100 : i > 0 ? 80 : alInicio(it._s, w) >= 0 ? 50 : alInicio(it._a, w) >= 0 ? 45 : it._n.includes(w) ? 15 : it._s.includes(w) ? 10 : 0;
        // la palabra de la casa no suma si el nombre ya empieza con ella (si no, «caja» sumaba dos veces en «Caja chica › …»);
        // sí sube una sección cuyo nombre la trae en el medio («iva» → «Fiscal › Hoja de IVA», antes que cada declaración de IVA)
        if (p && p < 100 && it._a.includes(' ' + w + ' ')) p += 30;
      }
      if (!p) return 0;
      tot += p;
    }
    return tot + (it.tipo === 'seccion' ? 5 : 0) + (it.top ? 2 : 0) + (it._n === q ? 30 : 0);
  }
  // lo que se escribe para decir la moneda o «referencia» no cuenta como palabra: «Bs 33.812», «$1.738,62», «ref 1903»
  const palabrasDe = q => q.split(' ').map(w => w.replace(/^[$€#]+|[$€]+$/g, '')).filter(w => w && !/^(bs\.?|usdt?|ref\.?|n\.?º|no\.)$/.test(w));
  function buscar(items, texto) {
    const q = sinTildes(texto).replace(/\s+/g, ' ').trim(); if (!q) return [];
    const palabras = palabrasDe(q); if (!palabras.length) return [];
    // en un empate va primero lo que la persona tiene en sus pestañas de abajo (lo que más usa)
    const tabs = S.usuario ? tabsDe().map(t => t.r) : []; const enTabs = it => (it.ir && tabs.includes(it.ir.split('/')[0]) ? 0 : 1);
    return items.map(it => ({ it, p: puntaje(it, palabras, q) })).filter(x => x.p > 0)
      // en un empate, el orden de los números como se cuentan: «Pregunta 2» antes que «Pregunta 10»
      .sort((a, b) => b.p - a.p || enTabs(a.it) - enTabs(b.it) || ORDEN_BUS[a.it.tipo] - ORDEN_BUS[b.it.tipo] || a.it.t.localeCompare(b.it.t, 'es', { numeric: true })).slice(0, 20).map(x => x.it);
  }
  // lo que coincide se marca en el nombre (sin tildes también: «nomina» marca «Nómina»)
  function resaltar(t, texto) {
    const mapa = []; let n = '';
    [...t].forEach((ch, i) => { const x = sinTildes(ch); for (let k = 0; k < x.length; k++) { n += x[k]; mapa.push(i); } });
    const orig = [...t]; const marca = new Array(orig.length).fill(false);
    sinTildes(texto).split(/\s+/).filter(w => w && !/^[\d.,]+$/.test(w)).forEach(w => { let i = alInicio(n, w); if (i < 0) i = n.indexOf(w); if (i < 0) return; for (let k = i; k < i + w.length; k++) marca[mapa[k]] = true; });
    let out = '', abierto = false;
    orig.forEach((ch, i) => { if (marca[i] && !abierto) { out += '<mark>'; abierto = true; } if (!marca[i] && abierto) { out += '</mark>'; abierto = false; } out += esc(ch); });
    return out + (abierto ? '</mark>' : '');
  }
  let buscadorDesde = null;
  function abrirBuscador(inicial = '') {
    const raiz = $('#buscador-raiz'); if (!raiz) return;
    if (raiz.firstChild) { const i = $('#bus-in'); if (i) i.focus(); return; }
    const a = document.activeElement; buscadorDesde = a && a !== document.body ? a : null;
    let items = indiceBuscador();
    raiz.innerHTML = `<div class="buscador" data-bus="fuera"><div class="buscador-caja" role="dialog" aria-modal="true" aria-label="Buscar en toda la app">
      <div class="buscador-cab">${ic('buscar', 's')}<input id="bus-in" type="search" role="combobox" aria-expanded="true" aria-controls="bus-res" aria-autocomplete="list" placeholder="Sección, nombre, monto o referencia…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go">
        <button class="bus-cerrar" type="button" data-acc="bus-cerrar">Cerrar</button></div>
      <p class="bus-sin-red" id="bus-sin-red" hidden></p>
      <div class="buscador-res" id="bus-res" role="listbox" aria-label="Resultados"></div>
      <p class="sr-only" id="bus-estado" aria-live="polite"></p>
      <label class="proto-prueba bus-red"><input type="checkbox" data-red${RED.sin ? ' checked' : ''}><span><b>Solo en el prototipo</b>Buscar sin señal</span></label>
      <p class="buscador-pie" aria-hidden="true"><kbd>↑</kbd> <kbd>↓</kbd> para elegir · <kbd>Enter</kbd> para abrir · <kbd>Esc</kbd> para cerrar</p></div></div>`;
    const inp = $('#bus-in'); const res = $('#bus-res'); const estado = $('#bus-estado'); const nota = $('#bus-sin-red');
    let sel = 0;
    const ops = () => [...res.querySelectorAll('[role="option"]')];
    const elegir = (i, ver = true) => {
      const o = ops(); if (!o.length) { inp.removeAttribute('aria-activedescendant'); return; }
      sel = (i + o.length) % o.length;
      o.forEach((b, k) => { b.setAttribute('aria-selected', String(k === sel)); b.classList.toggle('sel', k === sel); });
      inp.setAttribute('aria-activedescendant', o[sel].id); if (ver) o[sel].scrollIntoView({ block: 'nearest' });
    };
    // cada resultado: qué es (con lo que coincide marcado), de qué día y por cuánto · una acción (ir a una pregunta) va con data-acc
    const destino = x => x.ir ? `data-ir="${esc(x.ir)}"` : x.acc ? `data-acc="${esc(x.acc)}" data-arg="${esc(x.arg || '')}"` : `data-abrir="${esc(x.abrir)}"`;
    // alt: otro monto del mismo registro (el saldo de una factura): si lo escrito es ese, el resultado lo dice («$ 980,00 · saldo $ 878,62»)
    const montoVer = (x, q) => { if (!x.alt || !q) return x.monto; const ws = palabrasDe(sinTildes(q)); const al = x.alt.find(a => coincideMonto(a.m, ws)); return al ? al.txt : x.monto; };
    const op = (x, k, q) => {
      const debajo = x.que !== undefined || x.dia !== undefined ? queDia(x) : '';
      return `<button type="button" class="bus-op${debajo ? ' bus-reg' : ''}" role="option" id="bus-op-${k}" aria-selected="false" ${destino(x)}>${debajo
        ? `<span class="bus-txt"><span class="bus-t">${q ? resaltar(x.t, q) : esc(x.t)}</span><small class="bus-que">${esc(debajo)}</small></span>${x.monto ? `<span class="bus-monto">${esc(montoVer(x, q))}</span>` : ''}`
        : `<span class="bus-t">${q ? resaltar(x.t, q) : esc(x.t)}</span><small>${esc(x.s)}</small>`}</button>`;
    };
    const pinta = () => {
      const q = inp.value.trim(); let k = 0;
      // sin señal: lo dice arriba; si lo escrito es un monto o una referencia, lo dice más claro
      const sin = sinRed(); const numero = palabrasDe(sinTildes(q)).some(esNumero);
      nota.hidden = !sin; nota.innerHTML = sin ? `${ic('senal', 's')}<span>${numero ? '<b>Para buscar montos y referencias hace falta conexión.</b> Mientras tanto busco en las secciones y en lo último que abriste.' : '<b>Sin señal.</b> Busco en las secciones y en lo último que abriste. Los montos y las referencias necesitan conexión.'}</span>` : '';
      if (!q) {
        // con la caja vacía: lo último que abrió y sus pendientes (sin señal, solo lo último que abrió)
        const rec = recientesVivos().slice(0, 5); const pend = sin ? [] : misPendientes();
        res.innerHTML = (rec.length ? `<p class="bus-grupo" aria-hidden="true">Lo último que abriste</p>${rec.map(x => op(x, k++)).join('')}` : '')
          + (pend.length ? `<p class="bus-grupo" aria-hidden="true">Tus pendientes</p>${pend.slice(0, 5).map(p => op({ t: tituloPend(p), s: p.edad, abrir: 'pendiente:' + p.id }, k++)).join('')}${pend.length > 5 ? `<button type="button" class="bus-op bus-mas" role="option" id="bus-op-${k++}" aria-selected="false" data-ir="pendientes"><span class="bus-t">Ver los ${pend.length} pendientes</span></button>` : ''}` : '')
          || '<p class="bus-vacio">Escribe una sección, un nombre, un monto o los últimos números de una referencia.</p>';
        estado.textContent = '';
      } else {
        const r = buscar(items, q);
        // sin resultados: lo dice con lo que se escribió y deja borrar la búsqueda de un toque (como el buscador de las tablas)
        res.innerHTML = r.length ? r.map(x => op(x, k++, q)).join('') : `<div class="bus-vacio sin-res"><p>${numero && sin ? `Sin señal no puedo buscar «${esc(q)}». Inténtalo cuando vuelva la conexión.` : `No hay nada con «${esc(q)}». ${numero ? 'Prueba con el monto entero o con los últimos números de la referencia.' : 'Prueba con otra palabra.'}`}</p><button type="button" class="btn sec chico" data-bus-borrar>${ic('x', 's')}Borrar la búsqueda</button></div>`;
        estado.textContent = r.length ? r.length + (r.length === 1 ? ' resultado' : ' resultados') : 'Sin resultados';
      }
      elegir(0, false);
    };
    inp.addEventListener('input', pinta);
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); elegir(sel + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); elegir(sel - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); const o = ops()[sel]; if (o) o.click(); }
    });
    res.addEventListener('mousemove', e => { const b = e.target.closest('[role="option"]'); if (b) { const i = ops().indexOf(b); if (i !== sel) elegir(i, false); } });
    // un resultado que hace una acción (ir a la pregunta 12): el buscador se cierra primero y la acción sigue sola
    res.addEventListener('click', e => { if (e.target.closest('[data-bus-borrar]')) { inp.value = ''; pinta(); inp.focus(); return; } const o = e.target.closest('.bus-op[data-acc]'); if (o) cerrarBuscador(); });
    // solo en el prototipo: buscar como si no hubiera señal (el índice se vuelve a armar)
    const red = raiz.querySelector('[data-red]'); if (red) red.addEventListener('change', () => { ponerRed(red.checked); items = indiceBuscador(); pinta(); });
    capas(); inp.value = inicial || ''; pinta(); inp.focus();
  }
  // sin señal (solo en el prototipo): lo mismo para el buscador y para la reserva nueva
  function ponerRed(sin) {
    const volvio = RED.sin && !sin; RED.sin = !!sin; document.querySelectorAll('input[data-red]').forEach(x => { x.checked = RED.sin; });
    if (volvio) RED.alVolver.forEach(f => { try { f(); } catch (_) { /* lo que no pudo salir sigue esperando */ } });
  }
  // cerrar sin abrir nada devuelve el teclado a donde estaba (la lupa, la caja de arriba o «Más»)
  const cerrarBuscador = (volver = false) => {
    const r = $('#buscador-raiz'); if (!r || !r.firstChild) return; r.innerHTML = ''; capas();
    // si se abrió sin nada enfocado (⌘K desde la página) o lo que lo abrió ya no está, el teclado va a la página
    if (volver) { const el = buscadorDesde && buscadorDesde.isConnected && !buscadorDesde.closest('[inert]') ? buscadorDesde : $('#main'); if (el) el.focus({ preventScroll: true }); }
    buscadorDesde = null;
  };
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
        ${casillaCodigo('lc-in', 'lc-msg')}
        <p class="muted codigo-msg" id="lc-msg" aria-live="polite">Puedes pegarlo. En el prototipo vale cualquier número.</p>
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
          ${casillaCodigo('ia-in', 'ia-msg')}
          <p class="muted codigo-msg" id="ia-msg" aria-live="polite">Puedes pegarlo. En el prototipo vale cualquier número.</p>
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
    vigilarVentanas();
    // la misma casilla del código que en las ventanas: con el 6.º número (escrito, pegado o rellenado por el teléfono) sigue sola
    if (L.paso === 'codigo' || (L.paso === 'invitacion' && L.inv === 1)) {
      const inp = montarCodigo($('#app'), { enviar: () => (L.paso === 'codigo' ? ACC['login-codigo'] : ACC['inv-sig'])() });
      if (inp) inp.focus();
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
    S.usuario = u; S.ruta = 'inicio'; S.sub = {}; S.login = { paso: 'quien', u: null }; S.ficha = null; S.borrador = null; S.ponerBorrador = null;
    // cada quien entra por su trabajo: quien toma las reservas, por Reservas › Libro de hoy; los demás, por Inicio
    if (u.entrada) { const [r, s] = String(u.entrada).split('/'); if (accesible(r)) { S.ruta = r; if (s) S.sub[r] = s; } }
    $('#ver-como').value = u.id;
    pintarArmazon(); pintarPagina();
    // el enlace que trajo a alguien que todavía no había entrado (el aviso del bot): al entrar, la app va ahí, con sus permisos
    if (S.destino) { const st = S.destino; S.destino = null; aplicarEstado(st); }
    marcarNav('reemplazar'); guardar(); // entrar (o «Ver como») no es un paso del historial
  }
  // cerrar sesión borra los formularios a medias de esa persona en este equipo (una cédula o un monto escritos no se quedan en la computadora
  // de la oficina); si hay alguno, avisa antes cuántos se borran · cambiar de persona con «Ver como» (solo en el prototipo) no los borra
  function salir() {
    const u = S.usuario; if (formSucio()) guardarBorrador(); const n = u ? BORR.mios().length : 0;
    const cerrar = () => { if (u) { BORR.limpiar(u.id); descartado = null; } S.usuario = null; S.login = { paso: 'quien', u: null }; S.ficha = null; S.borrador = null; S.destino = null; $('#ver-como').value = ''; pintarLogin(); guardar(); };
    if (!n) { cerrar(); return; }
    window.APP.confirmar({ titulo: 'Cerrar sesión', texto: (n === 1 ? 'Se borra 1 formulario a medias' : 'Se borran ' + n + ' formularios a medias') + ' de este equipo. Lo que no guardaste se pierde.', boton: 'Cerrar sesión y borrarlos', cancelar: 'Seguir aquí' }).then(cerrar).catch(() => { if ($('#ver-como')) $('#ver-como').value = u ? u.id : ''; });
  }

  /* ---------- guardar preferencias del visitante ---------- */
  // d: la dirección donde estaba (si la app se abre sin dirección, desde el ícono del teléfono, vuelve ahí)
  function guardar() { try { localStorage.setItem('proto-v2', JSON.stringify({ u: S.usuario && S.usuario.id, r: S.ruta, f: S.formato, d: direccion() })); } catch (_) {} }
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
    const mas = $('.tab[data-acc="menu"]'); if (mas) mas.setAttribute('aria-expanded', String(abierto));
    if (abierto) { const v = document.createElement('button'); v.className = 'velo-menu'; v.setAttribute('aria-label', 'Cerrar el menú'); v.dataset.acc = 'menu'; app.appendChild(v); const b = $('.side-buscar'); if (b) b.focus({ preventScroll: true }); }
    else {
      const v = $('.velo-menu'); if (v) v.remove();
      // al cerrar «Más» (con Escape, con el fondo o con la pestaña), el teclado vuelve a «Más», no a lo que quedó escondido
      const a = document.activeElement; if (mas && (!a || a === document.body || !a.isConnected || (a.closest && (a.closest('.side') || a.classList.contains('velo-menu'))))) mas.focus({ preventScroll: true });
    }
  };
  ACC.buscar = () => abrirBuscador();
  // la caja de arriba de «Más»: cierra el menú (el teclado pasa a «Más») y abre el buscador, que al cerrarse vuelve ahí
  ACC['buscar-mas'] = () => { if ($('#app').classList.contains('menu-abierto')) ACC.menu(); abrirBuscador(); };
  ACC['bus-cerrar'] = () => cerrarBuscador(true);
  ACC.sede = () => aviso('Hoy solo existe la sede Valencia. La tabla de sedes queda lista para cuando se venda la app a otro restaurante.', 'info');
  ACC['ver-archivo'] = arg => aviso('Abriría «' + arg + '» con un enlace que caduca en 5 minutos.', 'info');
  ACC['login-codigo'] = () => {
    const c = $('#lc-in'); // con el código de respaldo no hay casilla de 6 números
    if (c && !/^\d{6}$/.test(c.value)) { errorCodigo($('#lc-msg'), c); return; }
    entrar(S.login.u);
  };
  ACC['login-respaldo'] = () => { S.login.paso = 'respaldo'; pintarLogin(); };
  ACC['login-volver'] = () => { S.login.paso = 'codigo'; pintarLogin(); };
  ACC['inv-sig'] = () => {
    const c = S.login.inv === 1 ? $('#ia-in') : null; // activar el código pide los 6 números que muestra la app
    if (c && !/^\d{6}$/.test(c.value)) { errorCodigo($('#ia-msg'), c); return; }
    S.login.inv++; pintarLogin();
  };
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
      // el fondo y la X: con algo cambiado en modo Editar, primero pregunta
      if (a === 'cerrar') antesDeSalir(() => cerrarFicha(), { form: false });
      // «‹ Factura N.º …»: vuelve a la ficha de antes (si se estaba editando algo, primero pregunta)
      else if (a === 'atras') antesDeSalir(() => fichaAtras(), { form: false });
      // el enlace exacto de esta ficha, para mandarlo por WhatsApp: la pantalla de atrás y el camino de fichas van en él
      else if (a === 'enlace') { const d = direccion(); if (window.APP.copiar) window.APP.copiar(enlaceDe(d), { ok: 'Enlace copiado: abre esta misma ficha.' }); }
      else if (a === 'editar') { S.ficha.editando = true; S.ficha.foco = 'campo'; pintarFicha(); }
      else if (a === 'cancelar') { S.ficha.editando = false; S.ficha.foco = 'titulo'; pintarFicha(); }
      else if (a === 'guardar') guardarFicha();
      else if (a === 'sin-permiso') aviso('Solo lectura: pídeselo a ' + quienEdita(S.ficha.spec.mod) + '.', 'info');
      else if (a === 'cerrada') aviso(S.ficha.bloqueo || S.ficha.spec.bloqueo || 'Está cerrado: ya no se edita. Se corrige con un movimiento al revés.', 'info');
      else if (a === 'anular') {
        const spec = S.ficha.spec;
        pedirMotivo({ titulo: 'Anular «' + spec.titulo + '»', texto: 'No se borra: queda tachado, con el motivo, quién y cuándo.', boton: 'Anular', tono: 'peligro', codigo: { que: 'Anular «' + esc(spec.titulo) + '»', det: spec.sub || '', boton: 'Anular', tono: 'peligro' } }).then(m => {
          spec.obj.anulada = true; spec.obj.estado = 'anulada';
          auditar({ modulo: nombreModulo(spec.mod), registro: spec.registro || spec.titulo, campo: 'estado', antes: 'vigente', despues: 'anulada', motivo: m });
          pintarFicha(); pintarPagina(); aviso('Anulado. Sigue visible, tachado, en el registro.');
        }).catch(() => {});
      }
      return;
    }
    const bu = t.closest('[data-bus="fuera"]'); if (bu && t === bu) { cerrarBuscador(true); return; }
    // un botón con su propia acción dentro de una fila que se abre (copiar la referencia, por ejemplo) hace lo suyo y no abre la fila
    const ac = t.closest('[data-acc]'); const dentro = el => !!(ac && el !== ac && el.contains(ac));
    const go = t.closest('[data-ir]');
    if (go && !go.closest('.proto') && !dentro(go)) {
      e.preventDefault();
      // desde el buscador o desde «Más», lo que se tocó desaparece: el teclado va a la página (salvo que se abra una ventana)
      const pierde = !!go.closest('#buscador-raiz') || ($('#app').classList.contains('menu-abierto') && !!go.closest('.side'));
      cerrarBuscador(); ir(go.dataset.ir);
      if (pierde && !llena('modal-raiz') && !S.ficha) { const m = $('#main'); if (m) m.focus({ preventScroll: true }); }
      return;
    }
    // una ficha abierta desde el buscador recuerda la lupa o la caja de arriba: al cerrarla, el teclado vuelve ahí
    const ab = t.closest('[data-abrir]'); if (ab && !dentro(ab)) { cerrarBuscador(!!ab.closest('#buscador-raiz')); const [tp, id] = ab.dataset.abrir.split(':'); antesDeSalir(() => abrir(tp, id), { form: false }); return; }
    // data-volver: el «Volver» de un formulario: un paso atrás, a donde estaba antes de abrirlo (sin un paso de la app antes, a la sección que dice)
    // un botón al mismo formulario que muestra su confirmación lo abre en blanco (alRepetir)
    const sb = t.closest('[data-sub]'); if (sb && !dentro(sb)) { const sub = sb.dataset.sub; if (sb.hasAttribute('data-volver')) { volverAtras(S.ruta + '/' + sub); return; }
      antesDeSalir(() => { const foco = repetirForm(S.ruta, sub); S.sub[S.ruta] = sub; marcarNav('push'); pintarPagina(); if (foco) { const el = $('#main ' + foco); if (el) el.focus({ preventScroll: true }); } }); return; }
    if (ac && ACC[ac.dataset.acc]) {
      // la misma regla del botón, otra vez al tocarlo: quien solo mira o no tiene ese permiso no llega a la acción (lo que mueve plata
      // de un aprendiz sí llega: la acción lo manda a aprobar)
      const rq = REGLAS_ACC[ac.dataset.acc]; const rr = rq ? regla(typeof rq === 'function' ? rq(ac.dataset.arg) : rq) : null;
      if (rr && ['oculto', 'leer', 'candado'].includes(rr.modo)) { aviso(porQueNo(rr), 'info'); return; }
      ACC[ac.dataset.acc](ac.dataset.arg, ac, e); return;
    }
  });
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && S.usuario) { e.preventDefault(); abrirBuscador(); return; }
    if (e.key === 'Escape') {
      // en una ventana, Escape es Cancelar (o el botón seguro que ella marque con data-esc); al cerrarse, el teclado vuelve a la ficha
      const mr = $('#modal-raiz');
      if (mr && mr.firstChild) { e.preventDefault(); const no = mr.querySelector('[data-esc]') || mr.querySelector('.modal-acc [data-m="no"]') || mr.querySelector('.modal-acc .btn.sec'); if (no) no.click(); else cerrarModal(); return; }
      if ($('#buscador-raiz') && $('#buscador-raiz').innerHTML) { cerrarBuscador(true); return; }
      if (S.ficha) { e.preventDefault(); antesDeSalir(() => cerrarFicha(), { form: false }); return; }
      if ($('#app').classList.contains('menu-abierto')) ACC.menu();
    }
    // Enter (o espacio) sobre una fila abre su ficha; sin preventDefault, la misma tecla la cerraba al llegar a la ficha
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('tr[data-abrir], tr[data-ir]')) { e.preventDefault(); e.target.click(); }
    // la caja de arriba se abre con el teclado: Enter, espacio o ↓; una letra abre el buscador ya con esa letra escrita
    if (e.target && e.target.id === 'buscar-top' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (['Enter', ' ', 'ArrowDown'].includes(e.key)) { e.preventDefault(); abrirBuscador(); }
      else if (e.key.length === 1) { e.preventDefault(); abrirBuscador(e.key); }
    }
  });
  // la marca de «campo tocado»: alguien escribió o eligió algo en una ficha en modo Editar o en un formulario (data-form)
  const marcar = e => {
    const el = e.target; if (!el || !el.matches || !el.matches('input, select, textarea')) return;
    // lo que falta se marca en su campo (A.faltan): al escribir o escoger ahí, la marca se va
    const caja = el.closest('.campo.error'); if (caja) { caja.classList.remove('error'); const m = caja.querySelector('.error-msg'); if (m) m.remove(); el.removeAttribute('aria-invalid'); }
    if (el.dataset.ci !== undefined && el.closest('#ficha-raiz')) { el.dataset.tocado = '1'; actualizarGuardar(); return; }
    const fm = el.closest('#main [data-form]'); if (!fm || el.matches('[data-filtrar], [data-no-borrador]')) return;
    el.dataset.tocado = '1'; marcarBorrador(fm.dataset.form);
  };
  document.addEventListener('input', marcar); document.addEventListener('change', marcar);

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
    // la dirección manda (la recarga, un enlace del bot); si la app se abrió sin dirección, vuelve a donde estaba la última vez
    const h = location.hash && location.hash.length > 1 ? location.hash : '';
    S.destino = leerDir(h || g.d || '') || (g.r && PANT[g.r] ? { r: g.r, f: [] } : null);
    if (g.u && D.USUARIOS.find(u => u.id === g.u)) entrar(g.u);
    else pintarLogin();
    iniciarHistorial();
  }

  window.APP = { D, S, PANT, FICHAS, ACC, $, $$, esc, fmt, dinero, leerNum, numTxt, ic, tag, nivel, puede, quienEdita, quienAprueba, aviso, auditar, pedirCodigo, pedirMotivo, confirmar, pedirArchivo, casillaCodigo, montarCodigo, modal, cerrarModal, abrir, cerrarFicha, pintarFicha, pintarPagina, pintarArmazon, ir, antesDeSalir, misPendientes, provNombre, iniciales, nombreDe, nombreModulo, arrancar,
    visibles, seccionesDe, caminoDe, indiceBuscador, buscar, sinTildes, juntarMontos, abrirBuscador, cerrarBuscador, ATAJO, esCecilia, aCecilia, paraCecilia, capas,
    regla, reglaAcc, porQueNo, aprobadorDe, topeDe, montoTope, POR_APROBAR, propuestaDe, aprobadaDe, proponer, detallePropuesta, EJECUTA, DEVUELVE, minuscula, tituloPend, subPendDe, enEspera,
    // direcciones e historial (M10)
    fichaAtras, direccion, dirDe, leerDir, nombreSeccion, tituloFicha: tituloDe, estadoActual, aplicarEstado, sincronizarYa: sincronizar, alMoverHistorial, HIST, CASA, enlaceDe, accesible, volver, volverAtras,
    // borradores en el equipo (M10)
    BORR, borrador: marcarBorrador, borradorHecho, guardarBorrador, pintarBorradores,
    // buscador (M15)
    BUSCABLES, queDia, RED, sinRed, ponerRed,
    // pendientes con su sitio (M10)
    pendiente: nuevoPendiente, ubicarPend,
    // pestañas de abajo por persona y el número de cada sección (tanda 6)
    tabsDe, tabActual, cuentaPend, textoPlano };
})();
