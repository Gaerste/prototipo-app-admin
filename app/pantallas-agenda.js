/* Calendario: el mes con capas (reservas, eventos, personal, fiscal y pagos), reservas que avisan al grupo de
   mesoneros, eventos privados y propios, y el calendario del personal. Datos en datos-gente.js. */
(() => {
  const A = window.APP; const { D, S, PANT, FICHAS, ACC, $, $$, esc, fmt, dinero, leerNum, ic, tag, puede } = A;
  const M = D.MESES; const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']; const DOWL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const HOY = [5, 9];
  // con el año, si no es 2026 (unas vacaciones que terminan en enero)
  const fdl = ([d, m, y = 2026]) => DOW[new Date(y, m, d).getDay()] + ' ' + d + ' ' + M[m] + (y !== 2026 ? ' ' + y : '');
  const fLarga = ([d, m]) => DOWL[new Date(2026, m, d).getDay()] + ' ' + d + ' de ' + MESL[m];
  const dif = ([d, m]) => Math.round((new Date(2026, m, d) - new Date(2026, 9, 5)) / 864e5);
  const igual = (a, b) => a[0] === b[0] && a[1] === b[1];
  const sumar = ([d, m], n) => { const x = new Date(2026, m, d + n); return [x.getDate(), x.getMonth()]; };
  const sens = () => puede('personal', 'editar') || puede('nomina', 'sueldos');
  const verPlata = () => puede('calendario', 'editar') || puede('nomina', 'sueldos');
  const vigentes = () => D.RESERVAS.filter(r => r.estado !== 'cancelada');
  const personasDe = xs => xs.reduce((s2, r) => s2 + r.personas, 0);
  const ini = n => { const p = n.split(' '); return p[0] + (p[1] ? ' ' + p[1][0] + '.' : ''); };
  const corto = n => n.length > 22 ? n.split(' (')[0].split(' ').slice(0, 2).join(' ') : n;
  // la hora en minutos: «19:45» → 1185 (una hora que no se puede leer da null y va al final, nunca se esconde)
  const minDe = h => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(h || '').trim()); return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null; };
  const hhmm = n => Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
  const porHora = (a, b) => (minDe(a.hora) ?? 9999) - (minDe(b.hora) ?? 9999);
  const AHORA = minDe(D.HOY.hora); // en el prototipo siempre son las 14:05 del lunes 5
  // «No vino» se puede marcar desde media hora después de la hora de la reserva (un día que ya pasó, siempre)
  const noVinoDesde = r => { const m = minDe(r.hora); return m === null ? null : m + 30; };
  const puedeNoVino = r => dif(r.d) < 0 || (dif(r.d) === 0 && noVinoDesde(r) !== null && AHORA >= noVinoDesde(r));

  /* ---------- mensajes al grupo y al cliente ---------- */
  const personasTxt = n => n ? n + ' ' + (n === 1 ? 'persona' : 'personas') : 'personas por anotar';
  // dónde: el área y la mesa, sin repetir la mesa si el área ya la nombra («Salón privado», no «Salón privado · Privado»)
  const donde = (r, sep = ' · ') => r.area + (r.mesa && !String(r.area).toLowerCase().includes(String(r.mesa).toLowerCase()) ? sep + r.mesa : '');
  // al grupo no van montos (ni teléfonos): del abono solo va si está pendiente o recibido · si va el monto, está por decidir (Avisos al grupo)
  const msgReserva = (r, tipo = 'Reserva nueva') => `🍽️ *${tipo}*\n*${r.d ? fdl(r.d) : 'Día por elegir'} · ${r.hora || 'hora por elegir'}*\n${r.nombre} · ${personasTxt(r.personas)}\n${donde(r)}${r.ocasion ? '\n' + r.ocasion : ''}${r.notas ? '\nOjo: ' + r.notas : ''}${r.abono ? '\n' + (r.abonoOk ? 'Abono recibido' : 'Abono pendiente') : ''}\nTomó: ${r.tomo}`;
  const msgDia = (dia, titulo) => { const xs = vigentes().filter(r => igual(r.d, dia) && r.estado !== 'no_vino').sort(porHora); return xs.length ? `📅 *${titulo} · ${fdl(dia).toLowerCase()}*\n${xs.map(r => `• ${r.hora} · ${r.nombre} · ${r.personas} · ${donde(r, ' ')}${r.ocasion ? ' · ' + r.ocasion.toLowerCase() : ''}${r.confirmo ? ' · confirmó' : ''}`).join('\n')}\n*Total: ${personasDe(xs)} personas*` : `📅 *${titulo} · ${fdl(dia).toLowerCase()}*\nNo hay reservas.`; };
  const msgCliente = r => `Hola, ${r.nombre.split(' (')[0]}. Le confirmamos su reserva para el ${fLarga(r.d)} a las ${r.hora}, ${r.personas} ${r.personas === 1 ? 'persona' : 'personas'}, en ${r.area.toLowerCase()}.${r.abono && !r.abonoOk ? ` Para dejarla firme falta el abono de $ ${r.abono}.` : ''} Si algo cambia, escríbanos por aquí. ¡Los esperamos!`;
  /* los signos de WhatsApp dicen la verdad:
     previa: lo que todavía no sale (una reserva sin guardar) va sin palomitas y dice «Así le llegará al grupo»
     programado: lleva un reloj y la hora en que sale («Sale a las 18:00») · enviando: «Enviando…», mientras el bot no confirma
     confirmado: las dos palomitas, solo cuando el bot confirma que salió · no_salio: en rojo, con «Copiar para mandarlo a mano»
     a_mano: lo mandó una persona desde su teléfono (sin palomitas: el bot no lo vio salir) */
  const PIE_WA = {
    previa: () => '',
    programado: h => `${ic('reloj', 'xs')}<span>Sale a las ${esc(h)}</span>`,
    enviando: () => `${ic('reloj', 'xs')}<span>Enviando…</span>`,
    // guardado sin señal: espera en el teléfono, sin palomitas, hasta que vuelva la conexión
    espera: () => `${ic('senal', 'xs')}<span>Enviando… sale cuando vuelva la señal</span>`,
    confirmado: h => `<span>${esc(h)}</span><span class="tics" aria-hidden="true">✓✓</span><span class="sr-only">, el bot confirmó que salió</span>`,
    no_salio: h => `${ic('alerta', 'xs')}<span>No salió · ${esc(h)}</span>`,
    a_mano: h => `${ic('celular', 'xs')}<span>Mandado a mano · ${esc(h)}</span>`,
  };
  const burbuja = (txt, hora = D.HOY.hora, estado = 'confirmado') => { const pie = (PIE_WA[estado] || PIE_WA.confirmado)(hora); return `<div class="wa-burbuja ${estado}">${esc(txt).replace(/\*([^*\n]+)\*/g, '<b>$1</b>')}${pie ? `<time>${pie}</time>` : ''}</div>`; };
  // copiar: la reserva cuyo mensaje no salió (con «Copiar para mandarlo a mano» y, para quien toma reservas, «Ya lo mandé») · por: por qué no salió
  // falla: el aviso propio de otra pantalla cuando no salió (el lote del lunes dice «Reintentar el envío», no «Cópialo»)
  const wa = (txt, { grupo = D.GRUPO_MESONEROS.nombre, hora = D.HOY.hora, estado = 'confirmado', copiar = '', por = '', falla: fallaPropia = null, previa = 'Así le llegará al grupo' } = {}) => {
    const falla = estado !== 'no_salio' ? '' : fallaPropia !== null ? fallaPropia : `<div class="wa-falla"><p>${ic('alerta', 's')}<span>${esc(por || 'El bot no lo pudo mandar.')}${puede('calendario', 'editar') ? ' Cópialo y mándalo desde un teléfono que esté en el grupo.' : ' Lo manda a mano quien toma las reservas.'}</span></p>
      ${copiar && puede('calendario', 'editar') ? `<div class="fila-btns"><button class="btn sec chico" data-acc="wa-copiar" data-arg="${esc(copiar)}">${ic('copiar', 's')}Copiar para mandarlo a mano</button><button class="btn ghost chico" data-acc="wa-mandado" data-arg="${esc(copiar)}">${ic('check', 's')}Ya lo mandé</button></div>` : ''}</div>`;
    return `<div class="wa" data-estado="${estado}" role="group" aria-label="${estado === 'previa' ? 'Vista previa del mensaje: todavía no sale' : 'Mensaje de WhatsApp al grupo ' + esc(grupo)}"><div class="wa-cab">${ic('mensaje', 's')}<span>${esc(grupo)}</span>${estado === 'previa' ? `<span class="wa-previa">${ic('ojo', 'xs')}${esc(previa)}</span>` : ''}</div>${burbuja(txt, hora, estado)}${falla}</div>`;
  };
  // el último mensaje de una reserva al grupo (si no se guardó, el de cuando se tomó: salió y el bot lo confirmó)
  const avisoDe = r => r.aviso || { estado: 'confirmado', tipo: 'Reserva nueva', hora: igual(r.d, HOY) ? '11:00' : 'Vie 2 oct' };
  // cada mensaje que le llegó al grupo por esa reserva (nueva, cambio, anulada…), con su hora y el texto tal como salió
  // r.avisosPrevios guarda los de antes; r.aviso, el último (el que puede no haber salido)
  const avisosDe = r => (r.avisosPrevios || []).concat([avisoDe(r)]);
  // el texto de un mensaje es el de cuando salió: los que vienen de antes lo guardan al nacer
  D.RESERVAS.forEach(r => {
    (r.avisosPrevios || []).forEach(a => { if (!a.txt) a.txt = msgReserva({ ...r, mesa: a.mesa || r.mesa }, a.tipo); });
    if (!r.aviso) r.aviso = { ...avisoDe(r) }; if (!r.aviso.txt) r.aviso.txt = msgReserva(r, r.aviso.tipo);
  });
  /* los avisos al grupo se pueden apagar (Calendario › Avisos al grupo): «cambios» es el de cada reserva nueva, cambiada o anulada y «eventos»,
     el de los eventos. Con el aviso apagado no sale nada: el botón dice «Guardar sin avisar al grupo», la vista previa dice que está apagado
     (sin burbuja ni ✓✓), la confirmación usa el mismo verbo y «Lo que le llegó al grupo» dice que no salió porque está apagado */
  const reglaGrupo = id => ((D.GRUPO_MESONEROS.reglas || []).find(x => x.id === id) || { on: true }).on;
  const avisosOn = () => reglaGrupo('cambios');
  // lo que dice la confirmación según cómo quedó el aviso: salió (enviándose), apagado o esperando la señal
  const trasAviso = est => est === 'apagado' ? 'El aviso al grupo está apagado.' : est === 'sin_senal' ? 'El aviso al grupo sale cuando vuelva la señal.' : 'Avisamos al grupo.';
  const apagadoHtml = (que = 'Este aviso') => `<p class="nota gris wa-apagado">${ic('anular', 's')}<span><b>Apagado:</b> ${esc(que.charAt(0).toLowerCase() + que.slice(1))} no le llega al grupo.${puede('calendario', 'editar') ? ' Se enciende en Calendario › Avisos al grupo.' : ''}</span></p>`;
  // los mensajes guardados sin señal esperan en el teléfono: salen (y el bot los confirma) cuando vuelve la conexión
  const confirmarLuego = r => setTimeout(() => {
    if (!D.RESERVAS.includes(r) || !r.aviso || r.aviso.estado !== 'enviando' || r.aviso.sinSenal) return;
    r.aviso.estado = 'confirmado';
    if (S.ficha && S.ficha.tipo === 'reserva' && S.ficha.id === r.id && !S.ficha.editando) A.pintarFicha();
    if (S.usuario && S.ruta === 'calendario' && S.sub.calendario === 'nueva' && C.hecho === r.id) A.pintarPagina();
  }, 1600);
  if (A.RED && A.RED.alVolver) A.RED.alVolver.push(() => D.RESERVAS.filter(r => r.aviso && r.aviso.sinSenal).forEach(r => { delete r.aviso.sinSenal; confirmarLuego(r); }));
  // al guardar, cambiar o anular, el mensaje sale «Enviando…» y el bot lo confirma (simulado: 1,6 s después); recién ahí lleva ✓✓
  // devuelve cómo quedó: 'enviando', 'apagado' (no sale nada) o 'sin_senal' (queda en el teléfono, «Enviando…», hasta que vuelva la señal)
  const avisar = (r, tipo) => {
    // el mensaje de antes queda en la lista (una reserva recién tomada no tiene ninguno)
    if (r.aviso) r.avisosPrevios = (r.avisosPrevios || []).concat([{ ...r.aviso, txt: r.aviso.txt || msgReserva(r, r.aviso.tipo) }]);
    if (!avisosOn()) { r.aviso = { estado: 'apagado', tipo, hora: D.HOY.hora, txt: msgReserva(r, tipo) }; return 'apagado'; }
    const sin = A.sinRed();
    r.aviso = { estado: 'enviando', tipo, hora: D.HOY.hora, txt: msgReserva(r, tipo), ...(sin ? { sinSenal: true } : {}) };
    if (sin) return 'sin_senal';
    confirmarLuego(r); return 'enviando';
  };
  const noSalieron = () => D.RESERVAS.filter(r => r.aviso && r.aviso.estado === 'no_salio');
  A.msgDia = msgDia; A.wa = wa; A.noSalieron = noSalieron;
  // todos los mensajes de una reserva, en un solo chat: cada burbuja con su hora y su signo (✓✓, «Enviando…», «No salió», «Mandado a mano»)
  // lo que no salió trae «Copiar para mandarlo a mano» (y, el último, «Ya lo mandé»)
  // el signo de un mensaje: el guardado sin señal dice que espera la conexión
  const estadoWa = a => (a.sinSenal && a.estado === 'enviando' ? 'espera' : a.estado);
  const waLista = r => {
    const xs = avisosDe(r); const ed = puede('calendario', 'editar');
    // con el aviso apagado no hubo mensaje: queda la línea que lo dice, con su hora
    const una = (a, k) => a.estado === 'apagado' ? `<p class="wa-apagado-linea">${ic('anular', 's')}<span><b>${esc(a.tipo)} · ${esc(a.hora)}:</b> no salió porque el aviso al grupo estaba apagado.</span></p>` : `${burbuja(a.txt || msgReserva(r, a.tipo), a.hora, estadoWa(a))}${a.estado === 'no_salio' ? `<div class="wa-falla"><p>${ic('alerta', 's')}<span>${esc(a.por || 'El bot no lo pudo mandar.')}${ed ? ' Cópialo y mándalo desde un teléfono que esté en el grupo.' : ' Lo manda a mano quien toma las reservas.'}</span></p>
      ${ed ? `<div class="fila-btns"><button class="btn sec chico" data-acc="wa-copiar" data-arg="${esc(r.id + '|' + k)}">${ic('copiar', 's')}Copiar para mandarlo a mano</button>${k === xs.length - 1 ? `<button class="btn ghost chico" data-acc="wa-mandado" data-arg="${esc(r.id)}">${ic('check', 's')}Ya lo mandé</button>` : ''}</div>` : ''}</div>` : ''}`;
    const n = xs.filter(a => a.estado !== 'apagado').length;
    return `<div class="wa wa-lista" role="group" aria-label="Mensajes de WhatsApp al grupo ${esc(D.GRUPO_MESONEROS.nombre)} por esta reserva"><div class="wa-cab">${ic('mensaje', 's')}<span>${esc(D.GRUPO_MESONEROS.nombre)}</span><span class="wa-n">${n === 1 ? '1 mensaje' : n ? n + ' mensajes' : 'Ningún mensaje'}</span></div>${xs.map(una).join('')}</div>`;
  };

  /* ---------- la mesa: ¿ya la tiene otra reserva? ----------
     «S12», «T4 + T5», «T1 a T5» o «Privado» se leen como mesas · dos reservas chocan si comparten una mesa el mismo día con menos de
     2 horas de diferencia (el salón privado, sin mesa escrita, cuenta como la mesa «Privado») · sin señal no se puede revisar */
  const mesasDe = (txt, area = '') => {
    const t = A.sinTildes(String(txt || '')).toUpperCase(); const out = new Set();
    if (/PRIVAD/.test(t) || (!t.trim() && area === 'Salón privado')) out.add('PRIVADO');
    const resto = t.replace(/\b([A-Z])\s?(\d{1,2})\s*(?:A|AL|-)\s*(?:[A-Z]\s?)?(\d{1,2})\b/g, (m, l, a, b) => { for (let k = +a; k <= +b && k - +a < 40; k++) out.add(l + k); return ' '; });
    resto.replace(/\b([A-Z])\s?(\d{1,2})\b/g, (m, l, n) => { out.add(l + +n); return ''; });
    return out;
  };
  const choquesDe = ({ fecha, hora, mesa, area }, excepto = null) => {
    const dia = Array.isArray(fecha) ? fecha : diaDe(fecha); const m = minDe(hora); const ms = mesasDe(mesa, area);
    if (!dia || m === null || !ms.size) return [];
    return vigentes().filter(r => r.id !== excepto && r.estado !== 'no_vino' && igual(r.d, dia) && minDe(r.hora) !== null && Math.abs(minDe(r.hora) - m) < 120)
      .map(r => ({ r, mesas: [...mesasDe(r.mesa, r.area)].filter(x => ms.has(x)) })).filter(x => x.mesas.length);
  };
  const nombreMesa = x => (x === 'PRIVADO' ? 'El salón privado' : x);
  const choqueTxt = c => `${c.mesas.map(nombreMesa).join(' y ')} ya ${c.mesas.length > 1 ? 'las' : 'la'} tiene ${c.r.nombre} a las ${c.r.hora}`;
  // el aviso en rojo (o, sin señal, que no se pudo revisar)
  const avisoMesa = ch => A.sinRed() ? `<p class="chequeo aviso" role="status">${ic('senal', 's')}<span>No pude revisar si la mesa está libre: no hay señal.</span></p>`
    : ch.length ? `<p class="chequeo alerta" role="alert">${ic('alerta', 's')}<span>${ch.map(c => esc(choqueTxt(c))).join('<br>')}.</span></p>` : '';

  /* ---------- el recordatorio al cliente: «Recordado» y «Confirmó» ----------
     El recordatorio se manda desde el WhatsApp del restaurante (ese número no se conecta al bot): «Abrir en WhatsApp» abre el chat del
     cliente con el texto listo (en la app, el enlace https://wa.me/58…?text=…; en el prototipo no se abre nada) y «Copiar» es la segunda
     opción. Abrir o copiar todavía no es mandarlo: después sale «Ya lo mandé», que lo deja «Recordado». Cuando el cliente contesta que
     viene, «Marcar que confirmó» lo deja «Confirmó» (solo la marca dice «Confirmó»). Las dos marcas se deshacen durante 10 segundos, como
     Llegó y No vino (A.unToque). Un teléfono fijo (02…) no tiene WhatsApp: «Abrir en WhatsApp» queda con candado. */
  const marcasTxt = r => [r.recordado ? 'recordado ' + r.recordado.hora : '', r.confirmo ? 'confirmó' : ''].filter(Boolean).join(' · ');
  const marcasTag = r => (r.recordado ? tag('Recordado ' + r.recordado.hora, 'info') : '') + (r.confirmo ? tag('Confirmó', 'ok') : '');
  const soloDig = t => String(t || '').replace(/\D/g, '');
  const conTel = r => !!soloDig(r.telNum || '') && soloDig(r.telNum).length >= 10;
  const esFijo = r => conTel(r) && /^02/.test(soloDig(r.telNum));
  const porWa = r => conTel(r) && !esFijo(r);
  const FIJO_TXT = 'Es un teléfono fijo: llama o copia el recordatorio.';
  // «Deshacer» de una marca, con su cuenta atrás (no se lee en voz alta: el botón se llama «Deshacer»)
  const btnDeshacerRec = (k, c) => `<button class="btn pri${c}" data-acc="rec-deshacer" data-arg="${esc(k)}" data-ut="${esc(k)}">${ic('refrescar', 's')}Deshacer<span aria-hidden="true"> · <span class="quedan">${A.quedanUT(k)}</span> s</span></button>`;
  // los botones del recordatorio: «Abrir en WhatsApp» y «Copiar» (y, después de usar uno, «Ya lo mandé»); recordado, «Marcar que confirmó»
  const botonesRec = (r, chico = true) => {
    if (!puede('calendario', 'editar')) return ''; const c = chico ? ' chico' : ''; const kRec = 'recordado:' + r.id, kConf = 'confirmo:' + r.id;
    if (r.confirmo) return A.deshacible(kConf) ? `<span class="rec-btns">${btnDeshacerRec(kConf, c)}</span>` : '';
    if (r.recordado) return `<span class="rec-btns">${A.deshacible(kRec) ? btnDeshacerRec(kRec, c) : ''}<button class="btn sec${c}" data-acc="res-confirmo" data-arg="${r.id}">Marcar que confirmó</button></span>`;
    const wa = porWa(r) ? `<button class="btn sec${c}" data-acc="res-wa" data-arg="${r.id}">${ic('mensaje', 's')}Abrir en WhatsApp</button>`
      : `<button class="btn bloq${c}" data-acc="res-wa" data-arg="${r.id}" aria-disabled="true" aria-describedby="rec-nota-${r.id}">${ic('candado', 's')}Abrir en WhatsApp</button>`;
    return `<span class="rec-btns">${wa}<button class="btn ghost${c}" data-acc="res-copiar" data-arg="${r.id}">${ic('copiar', 's')}Copiar</button>${r.recAbierto ? `<button class="btn pri${c}" data-acc="res-mandado" data-arg="${r.id}">${ic('check', 's')}Ya lo mandé</button>` : ''}</span>`;
  };
  // por qué «Abrir en WhatsApp» tiene candado (un fijo o sin teléfono), en una línea chica junto al botón
  const notaRec = r => !puede('calendario', 'editar') || r.recordado || porWa(r) ? '' : `<small class="rec-nota" id="rec-nota-${r.id}">${esc(esFijo(r) ? FIJO_TXT : 'Sin teléfono: copia el recordatorio y mándalo como puedas.')}</small>`;

  // la lista de mañana: cada reserva con sus marcas y, para quien toma reservas, el recordatorio a un toque
  function recordarManana(man) {
    const xs = man.filter(r => r.estado !== 'no_vino').slice().sort(porHora); const rec = xs.filter(r => r.recordado).length;
    return `<article class="hoja recordar" aria-labelledby="rec-t"><div class="hoja-cab"><h2 id="rec-t">${ic('celular')}Recordar las de mañana</h2><span class="muted">${xs.length ? rec + ' de ' + xs.length + ' recordadas' : ''}</span></div>
      ${xs.length ? `<ul class="lista rec-lista">${xs.map(r => `<li class="rec-item"><span class="lead info">${ic('cubiertos')}</span><span class="medio"><button class="enlace rec-nombre" data-abrir="reserva:${r.id}">${esc(r.hora)} · ${esc(r.nombre)}</button><small>${personasTxt(r.personas)} · ${esc(donde(r))}${r.estado === 'por_confirmar' ? ' · a lápiz' : ''}${r.abono && !r.abonoOk ? ' · falta el abono' : ''}</small>${notaRec(r)}</span><span class="rec-fin">${marcasTag(r)}${botonesRec(r)}</span></li>`).join('')}</ul>`
        : '<p class="muted">Mañana no hay reservas.</p>'}
      ${puede('calendario', 'editar') ? '<p class="muted">El recordatorio sale del WhatsApp del restaurante, no del bot: «Abrir en WhatsApp» abre el chat del cliente con el texto listo. Revisa que se abrió el WhatsApp del restaurante y, cuando lo mandes, toca «Ya lo mandé».</p>' : ''}</article>`;
  }

  /* ---------- lo que hay cada día, por capa ---------- */
  const C = { mes: 9, capas: { reservas: true, eventos: true, personal: true, fiscal: true, pagos: true }, hecho: null, form: null, vista: 'libro', dia: [5, 9] };
  const cap = t => t[0].toUpperCase() + t.slice(1);
  // una página del libro de reservas: las horas en el margen rojo, cada reserva en su renglón
  // cualquier hora tiene su renglón (19:45 va debajo de 19:30) y ninguna reserva se esconde: una hora que no se puede leer va al final
  function paginaLibro(dia) {
    const ed = puede('calendario', 'editar');
    const xs = D.RESERVAS.filter(r => igual(r.d, dia)).sort(porHora);
    const base = []; for (let h = 12; h <= 22; h++) base.push(h * 60);
    const slots = [...new Set(base.concat(xs.map(r => minDe(r.hora)).filter(m => m !== null)))].sort((a, b) => a - b);
    const sinHora = xs.filter(r => minDe(r.hora) === null);
    const vivas = xs.filter(r => !['cancelada', 'no_vino'].includes(r.estado));
    const ESTADO = { confirmada: 'confirmada', por_confirmar: 'por confirmar, anotada a lápiz', llego: 'llegó', no_vino: 'no vino', cancelada: 'anulada' };
    const renglon = r => {
      const extra = [r.estado === 'no_vino' ? '<b class="lr-rojo">No vino</b>' : '', r.estado === 'cancelada' ? '<b>Anulada</b>' : '', r.estado === 'por_confirmar' ? 'por confirmar' : '', minDe(r.hora) === null ? `<b class="lr-abono">hora por revisar: «${esc(r.hora)}»</b>` : '', r.ocasion ? esc(r.ocasion.toLowerCase()) : '', r.notas ? esc(r.notas) : '', r.abono && !r.abonoOk ? `<b class="lr-abono">falta el abono de $ ${r.abono}</b>` : '', marcasTxt(r)].filter(Boolean).join(' · ');
      return `<button class="libro-res" data-abrir="reserva:${r.id}"><span class="lr-nombre">${esc(r.nombre)}</span><span class="lr-pers" title="Personas">${r.personas}</span><span class="lr-mesa">${esc(r.mesa || r.area)}</span>${extra ? `<small>${extra}</small>` : ''}<span class="sr-only">, ${r.personas} personas, ${ESTADO[r.estado]}</span></button>`;
    };
    const filas = rs => rs.map((r, i) => `<li class="${r.estado}"><time>${i === 0 ? (minDe(r.hora) === null ? '¿?' : hhmm(minDe(r.hora))) : ''}${r.estado === 'llego' ? ic('check', 'xs') : ''}</time>${renglon(r)}</li>`).join('');
    return `<section class="libro-pag${igual(dia, HOY) ? ' es-hoy' : ''}" aria-label="Reservas del ${fLarga(dia)}">
      <header class="libro-cab"><h3>${cap(fLarga(dia))}</h3><span>${igual(dia, HOY) ? 'Hoy · ' : dif(dia) === 1 ? 'Mañana · ' : ''}${vivas.length} ${vivas.length === 1 ? 'reserva' : 'reservas'}</span></header>
      <ol class="libro-lineas">${slots.map(m => { const h = hhmm(m); const rs = xs.filter(r => minDe(r.hora) === m);
        if (!rs.length) return `<li class="vacia"><time>${h}</time>${ed && dif(dia) >= 0 ? `<button class="libro-escribir" data-acc="res-hora" data-arg="${dia[0]}-${dia[1]}|${h}"><span>Anotar a las ${h}</span></button>` : '<span></span>'}</li>`;
        return filas(rs); }).join('')}${filas(sinHora)}</ol>
      <footer class="libro-pie"><span>Total del día</span><b>${personasDe(vivas)} ${personasDe(vivas) === 1 ? 'persona' : 'personas'}</b></footer>
    </section>`;
  }
  const libro = () => `<div class="libro-nav"><div class="seg" role="group" aria-label="Día"><button data-acc="libro-dia" data-arg="-1">‹ Día anterior</button><button data-acc="libro-dia" data-arg="0" aria-pressed="${igual(C.dia, HOY)}">Hoy</button><button data-acc="libro-dia" data-arg="1">Día siguiente ›</button></div>
      <div class="seg" role="group" aria-label="Ver como"><button data-acc="res-vista" data-arg="libro" aria-pressed="true">Libro</button><button data-acc="res-vista" data-arg="lista" aria-pressed="false">Lista</button></div></div>
    <div class="libro-reservas">${paginaLibro(C.dia)}${paginaLibro(sumar(C.dia, 1))}</div>
    <p class="leyenda libro-ley"><span><span class="lm tinta">Con tinta</span> confirmada</span><span><span class="lm lapiz">A lápiz</span> por confirmar</span><span>${ic('check', 'xs')} llegó</span><span><span class="lm tachada">Tachada en rojo</span> no vino</span>${puede('calendario', 'editar') ? '<span>Toca un renglón vacío para anotar a esa hora</span>' : ''}</p>`;
  const capasDisp = () => [['reservas', 'Reservas', true], ['eventos', 'Eventos', true], ['personal', 'Personal', true], ['fiscal', 'Fiscal', puede('fiscal')], ['pagos', 'Pagos y nómina', puede('pagos') || puede('nomina')]].filter(c => c[2]);
  function itemsDia(dia, todas = false) {
    const on = k => todas || C.capas[k]; const out = [];
    if (on('reservas')) vigentes().filter(r => igual(r.d, dia)).sort(porHora).forEach(r => out.push({ capa: 'reservas', tono: r.estado === 'no_vino' ? 'tachado' : r.estado === 'por_confirmar' ? 'info punteado' : 'info', txt: `${r.hora} ${corto(r.nombre)} · ${r.personas}`, largo: `${r.hora} · ${r.nombre} · ${r.personas} personas · ${r.area}`, abrir: 'reserva:' + r.id, icono: 'cubiertos' }));
    if (on('eventos')) D.EVENTOS_AG.filter(e => igual(e.d, dia)).forEach(e => out.push({ capa: 'eventos', tono: e.tipo === 'propio' && !e.personas ? 'gris' : 'evento', txt: e.nombre, largo: `${e.nombre} · ${e.hora}${e.personas ? ' · ' + e.personas + ' personas' : ''}`, abrir: 'evento:' + e.id, icono: 'estrella' }));
    if (on('personal')) {
      A.rh.activos().forEach(e => {
        if (e.nac && e.nac[0] === dia[0] && e.nac[1] === dia[1]) out.push({ capa: 'personal', tono: 'lila', txt: 'Cumple ' + ini(e.nombre), largo: `Cumpleaños de ${e.nombre} (${A.rh.cumpleAnios(e)})`, abrir: sens() ? 'empleado:' + e.id : '', icono: 'pastel' });
        if (sens() && e.contratoVence && igual(e.contratoVence, dia)) out.push(A.rh.yaFijo(e)
          ? { capa: 'personal', tono: 'alerta', txt: 'Ya es fijo: ' + ini(e.nombre), largo: `${e.nombre}: ${A.rh.fijoTxt(e).toLowerCase()}, ya es indeterminado (fijo) y esta fecha no lo termina`, abrir: 'empleado:' + e.id, icono: 'archivo' }
          : { capa: 'personal', tono: 'alerta', txt: 'Vence contrato: ' + ini(e.nombre), largo: `Vence el contrato de ${e.nombre}`, abrir: 'empleado:' + e.id, icono: 'archivo' });
        if (sens() && e.prueba && igual(e.prueba, dia)) out.push({ capa: 'personal', tono: 'alerta', txt: 'Fin de prueba: ' + ini(e.nombre), largo: `Termina el período de prueba de ${e.nombre}`, abrir: 'empleado:' + e.id, icono: 'reloj' });
      });
      D.VACACIONES.filter(v => v.desde).forEach(v => {
        const n = A.rh.emp(v.emp).nombre;
        if (igual(v.desde, dia)) out.push({ capa: 'personal', tono: 'ausencia', txt: 'Vacaciones: ' + ini(n), largo: `Empieza vacaciones ${n} · regresa el ${v.regresa}`, abrir: sens() ? 'vacacion:' + v.id : '', icono: 'maleta' });
        if (igual(sumar(v.hasta, 1), dia)) out.push({ capa: 'personal', tono: 'gris', txt: 'Regresa ' + ini(n), largo: `Regresa de vacaciones ${n}`, abrir: sens() ? 'vacacion:' + v.id : '', icono: 'maleta' });
      });
      D.REPOSOS.filter(r => r.tipo === 'reposo').forEach(r => { const n = A.rh.emp(r.emp).nombre; if (igual(sumar(r.hasta, 1), dia)) out.push({ capa: 'personal', tono: 'gris', txt: 'Vuelve ' + ini(n), largo: `Vuelve ${n}${sens() ? ' (termina su reposo)' : ''}`, abrir: sens() ? 'reposo:' + r.id : '', icono: 'usuario' }); });
    }
    if (on('fiscal') && puede('fiscal')) D.OBLIGACIONES.filter(o => o.dia === dia[0] && (o.mes || 'oct') === M[dia[1]] && o.estado !== 'pagada').forEach(o => out.push({ capa: 'fiscal', tono: 'gris', txt: o.corto, largo: `${o.corto} · ${o.ente}`, abrir: 'obligacion:' + o.id, icono: 'fiscal' }));
    if (on('pagos') && (puede('pagos') || puede('nomina'))) {
      if (puede('pagos') && new Date(2026, dia[1], dia[0]).getDay() === 1) out.push({ capa: 'pagos', tono: 'gris', txt: 'Pagos del lunes', largo: 'Pagos de los lunes a proveedores', ir: 'pagos', icono: 'pagos' });
      if (puede('nomina') && ((dia[0] === 15) || (dia[1] === 9 && dia[0] === 31) || (dia[1] === 10 && dia[0] === 30))) out.push({ capa: 'pagos', tono: 'gris', txt: 'Nómina', largo: dia[0] === 15 ? 'Nómina: 1.ª quincena' : 'Nómina: 2.ª quincena, 10 % y premio, cada uno en su corrida', ir: 'nomina', icono: 'nomina' });
    }
    return out;
  }
  const evBtn = x => x.abrir ? `<button class="ev ${x.tono}" data-abrir="${x.abrir}" title="${esc(x.largo)}">${esc(x.txt)}</button>` : x.ir ? `<button class="ev ${x.tono}" data-ir="${x.ir}" title="${esc(x.largo)}">${esc(x.txt)}</button>` : `<span class="ev ${x.tono}" title="${esc(x.largo)}">${esc(x.txt)}</span>`;
  // lo que tiene un día, en palabras, para el botón del día: «3 reservas, 1 evento y 2 del personal»
  const CAPA_N = { reservas: ['reserva', 'reservas'], eventos: ['evento', 'eventos'], personal: ['del personal', 'del personal'], fiscal: ['vencimiento', 'vencimientos'], pagos: ['pago', 'pagos'] };
  const resumenDia = its => { const c = {}; its.forEach(x => { c[x.capa] = (c[x.capa] || 0) + 1; }); const xs = Object.entries(c).map(([k, n]) => n + ' ' + CAPA_N[k][n === 1 ? 0 : 1]); return xs.length ? xs.join(', ').replace(/, ([^,]*)$/, ' y $1') : 'nada'; };
  /* el mes: en la computadora y el iPad, cada cosa del día se toca (abre su ficha) y el número abre el día entero · en el teléfono toda la
     celda es un solo botón (48 × 56) que abre la hoja del día, y lo que tiene se ve como marcas de color sólido (contraste de 3 a 1 o más)
     que no se tocan · las marcas son solo para ver: el botón dice en palabras lo que hay ese día */
  function mes(m) {
    const off = (new Date(2026, m, 1).getDay() + 6) % 7; const ult = new Date(2026, m + 1, 0).getDate(); const celdas = Math.ceil((off + ult) / 7) * 7;
    let html = `<div class="cal agenda" role="group" aria-label="${MESL[m]} de 2026">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(x => `<div class="dsem" aria-hidden="true">${x}</div>`).join('')}`;
    for (let k = 0; k < celdas; k++) {
      const dt = new Date(2026, m, 1 - off + k); const dia = [dt.getDate(), dt.getMonth()]; const fuera = dt.getMonth() !== m;
      const its = itemsDia(dia); const max = 3; const esHoy = igual(dia, HOY);
      const marcas = its.length ? `<span class="marcas" aria-hidden="true">${its.slice(0, max).map(x => `<i class="marca-dia ${x.tono}"></i>`).join('')}</span>${its.length > max ? `<small class="marcas-mas" aria-hidden="true">+${its.length - max}</small>` : ''}` : '';
      html += `<div class="dia${fuera ? ' fuera' : ''}${esHoy ? ' hoy' : ''}"><button class="n" data-abrir="agendadia:${dia[0]}-${dia[1]}" aria-label="${fLarga(dia)}${esHoy ? ', hoy' : ''}: ${resumenDia(its)}"><span class="n-num">${dia[0]}</span></button>${marcas}${its.slice(0, max).map(evBtn).join('')}${its.length > max ? `<button class="ev mas" data-abrir="agendadia:${dia[0]}-${dia[1]}">+${its.length - max} más</button>` : ''}</div>`;
    }
    return html + '</div>';
  }
  const agendaLista = (dias) => dias.map(dia => { const its = itemsDia(dia); return its.length ? `<div class="sec"><h2>${igual(dia, HOY) ? 'Hoy' : dif(dia) === 1 ? 'Mañana' : fdl(dia)}</h2></div><ul class="lista">${its.map(x => `<li>${x.abrir || x.ir ? `<button class="fila" ${x.abrir ? `data-abrir="${x.abrir}"` : `data-ir="${x.ir}"`}>` : '<div class="fila">'}<span class="lead ${['info', 'evento', 'lila', 'ok', 'alerta'].includes(x.tono.split(' ')[0]) ? x.tono.split(' ')[0] : ''}">${ic(x.icono)}</span><span class="medio"><b>${esc(x.largo)}</b></span><span class="fin">${x.abrir || x.ir ? ic('derecha', 's chev') : ''}</span>${x.abrir || x.ir ? '</button>' : '</div>'}</li>`).join('')}</ul>` : ''; }).join('');

  /* =============== CALENDARIO =============== */
  PANT.calendario = {
    titulo: 'Calendario', corto: 'Calendario', tab: 'Calendario', grupo: 'Hoy', icono: 'calendario', mod: 'calendario', palabras: 'reserva reservas evento cumpleanos agenda',
    secciones: [['mes', 'Mes', 'capas'], ['reservas', 'Reservas', 'reserva mesa libro'], ['eventos', 'Eventos', 'evento salon privado'], ['personal', 'Personal', 'cumpleanos vacaciones'], ['avisos', 'Avisos al grupo', 'mesoneros whatsapp']],
    cuenta: () => puede('calendario', 'editar') ? D.RESERVAS.filter(r => r.estado === 'por_confirmar' && dif(r.d) >= 0).length : 0,
    // el número de cada sección, para las pestañas de abajo que llevan directo a ella (las de quien toma reservas)
    cuentas: { reservas: () => puede('calendario', 'editar') ? D.RESERVAS.filter(r => r.estado === 'por_confirmar' && dif(r.d) >= 0).length : 0, avisos: () => noSalieron().length },
    // la reserva nueva es un formulario: la pestaña o el menú vuelven al mes, y al salir se borra «Reserva guardada»
    // (así «Nueva reserva» abre siempre en blanco; «Anotar a las…» y «Nueva reserva este día» llenan el día y la hora a propósito)
    transitorias: ['nueva'],
    alSalir: sub => { if (sub === 'nueva') { C.form = null; C.hecho = null; } },
    // tocar otra vez «Nueva reserva» después de guardar una: en blanco, con el teclado en el teléfono del cliente (una a medias se queda)
    alRepetir: sub => { if (sub !== 'nueva' || !C.hecho) return null; C.hecho = null; C.form = null; return '#rf-tel'; },
    render: (sub = 'mes') => {
      let cuerpo = '';
      if (sub === 'mes') {
        const prox = Array.from({ length: 7 }, (_, i) => sumar(HOY, i));
        cuerpo = `<div class="filtros"><div class="seg capas" role="group" aria-label="Qué mostrar">${capasDisp().map(([k, t]) => `<button data-acc="cal-capa" data-arg="${k}" aria-pressed="${C.capas[k]}"><i class="punto ${k}"></i>${t}</button>`).join('')}</div>
          <div class="seg" role="group" aria-label="Mes"><button data-acc="cal-mes" data-arg="9" aria-pressed="${C.mes === 9}">Octubre</button><button data-acc="cal-mes" data-arg="10" aria-pressed="${C.mes === 10}">Noviembre</button></div></div>
          <div class="rejilla"><div class="c4 pila cal-prox"><div class="sec"><h2>Los próximos 7 días</h2></div>${agendaLista(prox) || '<p class="muted">Nada en los próximos 7 días.</p>'}</div>
          <div class="c8 pila"><div class="sec"><h2>${MESL[C.mes][0].toUpperCase() + MESL[C.mes].slice(1)} de 2026</h2><span class="muted">Toca un día para ver todo lo que tiene</span></div>${mes(C.mes)}</div></div>`;
      }
      if (sub === 'reservas') {
        const filtro = A.filtroActual('proximas');
        const lista = D.RESERVAS.filter(r => filtro === 'todas' || (filtro === 'proximas' && dif(r.d) >= 0 && r.estado !== 'cancelada') || (filtro === 'hoy' && igual(r.d, HOY)) || (filtro === 'pasadas' && dif(r.d) < 0)).sort((a, b) => (filtro === 'pasadas' ? -1 : 1) * (dif(a.d) - dif(b.d) || porHora(a, b)));
        const hoy = vigentes().filter(r => igual(r.d, HOY)), man = vigentes().filter(r => igual(r.d, sumar(HOY, 1))), sem = vigentes().filter(r => dif(r.d) >= 0 && dif(r.d) <= 6);
        const pasadas = D.RESERVAS.filter(r => ['llego', 'no_vino'].includes(r.estado));
        // arriba del libro, solo Hoy y Mañana (en una fila de dos): «Hoy ›» baja al libro de hoy y «Mañana ›» abre el libro de mañana;
        // Esta semana y No vinieron van debajo del libro (así la primera página del libro se ve sin bajar tanto en el teléfono)
        cuerpo = `<div class="cifras dos">${A.cifra({ etq: 'Hoy', valor: hoy.length + (hoy.length === 1 ? ' reserva' : ' reservas'), sub: personasDe(hoy) + ' personas · la primera a las ' + (hoy.sort(porHora)[0] || { hora: '—' }).hora, acc: 'libro-ir', arg: '0' })}${A.cifra({ etq: 'Mañana', valor: man.length + (man.length === 1 ? ' reserva' : ' reservas'), sub: personasDe(man) + ' personas · ' + man.filter(r => r.recordado).length + ' de ' + man.length + ' recordadas' + (man.some(r => r.abono && !r.abonoOk) ? ' · falta un abono' : ''), tono: man.some(r => r.abono && !r.abonoOk) ? 'aviso' : '', acc: 'libro-ir', arg: '1' })}</div>
          ${C.vista === 'libro' ? libro() : `<div class="libro-nav"><span></span><div class="seg" role="group" aria-label="Ver como"><button data-acc="res-vista" data-arg="libro" aria-pressed="false">Libro</button><button data-acc="res-vista" data-arg="lista" aria-pressed="true">Lista</button></div></div>
          ${A.filtros('t-res', [['proximas', 'Próximas', vigentes().filter(r => dif(r.d) >= 0).length], ['hoy', 'Hoy', hoy.length], ['pasadas', 'Pasadas', D.RESERVAS.filter(r => dif(r.d) < 0).length], ['todas', 'Todas', D.RESERVAS.length]], filtro, 'Buscar nombre, mesa u ocasión')}
          ${A.tabla({ id: 't-res', cols: [{ t: 'Reserva', cls: 'p' }, { t: 'Personas', cls: 'r x' }, { t: 'Dónde', cls: 'x' }, { t: 'Ocasión', cls: 'x' }, { t: 'Estado', cls: 'e' }], filas: lista.map(r => ({ abrir: 'reserva:' + r.id, clase: r.estado === 'cancelada' ? 'anulada' : '', celdas: [`<b>${esc(r.nombre)}</b><small>${igual(r.d, HOY) ? 'Hoy' : esc(fdl(r.d))} · ${esc(r.hora)}<span class="en-tel"> · ${esc(donde(r))} · ${personasTxt(r.personas)}</span>${r.notas ? ' · ' + esc(r.notas) : ''}${marcasTxt(r) ? ' · ' + esc(marcasTxt(r)) : ''}</small>`, r.personas, esc(donde(r)), esc(r.ocasion || '—'), r.abono && !r.abonoOk ? tag('Falta el abono', 'aviso') : A.estadoTag(r.estado)] })) })}`}
          <div class="cifras">${A.cifra({ etq: 'Esta semana', valor: sem.length + (sem.length === 1 ? ' reserva' : ' reservas'), sub: personasDe(sem) + ' personas' })}${A.cifra({ etq: 'No vinieron (octubre)', valor: pasadas.filter(r => r.estado === 'no_vino').length + ' de ' + pasadas.length, sub: 'se anota en cada reserva' })}</div>
          ${recordarManana(man)}
          <p class="muted">${avisosOn() ? 'Cada reserva nueva, cambiada o anulada avisa al grupo «' + esc(D.GRUPO_MESONEROS.nombre) + '».' : 'El aviso de cada reserva nueva, cambiada o anulada está apagado: no le llega al grupo.'} ${reglaGrupo('hoy') ? 'A las 11:00 sale la lista del día' : 'La lista del día (11:00) está apagada'}${reglaGrupo('manana') ? '; a las 18:00, la de mañana.' : '; la de mañana (18:00) está apagada.'}</p>`;
      }
      if (sub === 'nueva') cuerpo = !puede('calendario', 'editar') ? A.lectura('calendario') : C.hecho ? hechoReserva(D.RESERVAS.find(r => r.id === C.hecho)) : formReserva();
      if (sub === 'eventos') {
        const xs = [...D.EVENTOS_AG].sort((a, b) => dif(a.d) - dif(b.d));
        cuerpo = `<p class="desc">Eventos privados (alguien reserva el salón o un menú para un grupo) y eventos propios del restaurante. Compras los ve con tiempo para pedir la mercancía.</p>
          <div class="rejilla">${xs.map(e => { const hechas = e.tareas.filter(t => t[1]).length; return `<div class="c6"><button class="hoja evento-tarjeta" data-abrir="evento:${e.id}"><div class="hoja-cab"><h2>${ic(e.tipo === 'propio' ? 'estrella' : 'cubiertos')}${esc(e.nombre)}</h2>${A.estadoTag(e.estado)}</div>
            <dl class="kv"><div><dt>Cuándo</dt><dd>${esc(fdl(e.d))} · ${esc(e.hora)}</dd></div>${e.personas ? `<div><dt>Personas</dt><dd>${e.personas}</dd></div>` : ''}${e.tipo === 'privado' && verPlata() ? `<div><dt>Total · abono</dt><dd>${dinero(e.personas * e.porPersona, 'usd', 0)} · ${e.abono ? dinero(e.abono, 'usd', 0) : 'sin abono'}</dd></div>` : ''}<div><dt>Listo</dt><dd>${hechas} de ${e.tareas.length} tareas</dd></div></dl>
            <div class="pista"><span class="${hechas === e.tareas.length ? 'ok' : 'aviso'}" style="width:${hechas / e.tareas.length * 100}%"></span></div></button></div>`; }).join('')}</div>
          ${A.boton('calendario', 'Nuevo evento', 'data-acc="pronto"', { tono: 'sec', icono: 'mas' })}`;
      }
      if (sub === 'personal') {
        const cumples = A.rh.activos().filter(e => e.nac && A.rh.proxCumple(e) <= 60).sort((a, b) => A.rh.proxCumple(a) - A.rh.proxCumple(b));
        cuerpo = `<p class="desc">Vacaciones, ausencias y cumpleaños de octubre y noviembre${sens() ? ', más los contratos y períodos de prueba que vencen' : ''}. Sirve para armar los turnos sin sorpresas.</p>
          <article class="hoja">${A.gantt(A.filasPersonal({ conContratos: sens() }))}</article>
          <div class="rejilla"><div class="c6"><article class="hoja"><h2>${ic('pastel')}Cumpleaños que vienen</h2><ul class="lista">${cumples.map(e => `<li>${sens() ? `<button class="fila" data-abrir="empleado:${e.id}">` : '<div class="fila">'}<span class="lead lila">${ic('pastel')}</span><span class="medio"><b>${esc(e.nombre)}</b><small>${esc(fdl([e.nac[0], e.nac[1]]))} · cumple ${A.rh.cumpleAnios(e)} · ${esc(e.cargo)}</small></span><span class="fin">${A.rh.proxCumple(e) === 0 ? tag('Hoy', 'lila') : tag('En ' + A.rh.proxCumple(e) + ' días', '')}</span>${sens() ? '</button>' : '</div>'}</li>`).join('')}</ul>
            <p class="muted">RRHH y la supervisora reciben el aviso 3 días antes.</p></article></div>
          <div class="c6"><article class="hoja"><h2>${ic('maleta')}Vacaciones y ausencias</h2><ul class="lista">${D.VACACIONES.filter(v => v.desde).map(v => `<li><div class="fila"><span class="lead rayado">${ic('maleta')}</span><span class="medio"><b>${esc(A.rh.emp(v.emp).nombre)}</b><small>${esc(fdl(v.desde))} al ${esc(fdl(v.hasta))} · regresa el ${esc(v.regresa)}</small></span><span class="fin">${A.estadoTag(v.estado)}</span></div></li>`).join('')}${D.REPOSOS.filter(r => r.tipo === 'reposo').map(r => `<li><div class="fila"><span class="lead rayado">${ic('usuario')}</span><span class="medio"><b>${esc(A.rh.emp(r.emp).nombre)}</b><small>${sens() ? 'De reposo' : 'Ausente'} hasta el ${esc(fdl(r.hasta))}</small></span><span></span></div></li>`).join('')}</ul></article>
          ${sens() ? `<article class="hoja"><h2>${ic('archivo')}Contratos y períodos de prueba</h2><ul class="lista">${A.rh.activos().filter(e => e.contratoVence || e.prueba).map(e => { const fijo = !e.prueba && A.rh.yaFijo(e); return `<li><button class="fila" data-abrir="empleado:${e.id}"><span class="lead alerta">${ic('archivo')}</span><span class="medio"><b>${esc(e.nombre)}</b><small>${e.prueba ? 'Termina la prueba el ' + esc(fdl(e.prueba)) : fijo ? esc(A.rh.fijoTxt(e)) + ': ya es indeterminado (fijo). Terminarlo sería un despido y necesita permiso de la Inspectoría' : 'Vence el contrato el ' + esc(fdl(e.contratoVence))}${/2\.ª/.test(e.contrato) ? ' · 2.ª prórroga' : ''}</small></span><span class="fin">${fijo ? tag('Ya es fijo', 'alerta') : tag('En ' + dif(e.prueba || e.contratoVence) + ' días', 'aviso')}</span></button></li>`; }).join('')}</ul></article>` : ''}</div></div>`;
      }
      if (sub === 'avisos') {
        const G = D.GRUPO_MESONEROS; const ed = puede('calendario', 'editar'); const regla = id => (G.reglas || []).find(x => x.id === id) || { on: true };
        // lo que no salió va primero: es lo único que pide algo (mandarlo a mano)
        const fallas = noSalieron().map(r => { const a = avisoDe(r); return `<div class="sec"><h2>${esc(a.tipo)} · ${esc(r.nombre)}</h2>${tag('No salió', 'alerta')}</div>${wa(a.txt || msgReserva(r, a.tipo), { hora: a.hora, estado: 'no_salio', copiar: r.id, por: a.por })}`; }).join('');
        // un aviso apagado no sale: en su lugar lo dice, y cómo se vuelve a encender
        const apagado = t => `<p class="nota gris">${ic('anular', 's')}<span><b>Apagado:</b> ${esc(t)} no le llega al grupo.${ed ? ' Se enciende con su interruptor, al lado.' : ''}</span></p>`;
        // los mensajes van primero (en el teléfono, lo que no salió queda arriba); la configuración del grupo, al lado o debajo
        cuerpo = `<div class="rejilla"><div class="c6 pila">${fallas}
            <div class="sec"><h2>Hoy a las 11:00</h2>${regla('hoy').on ? tag('Enviado (simulado)', 'ok') : tag('Apagado', '')}</div>${regla('hoy').on ? wa(msgDia(HOY, 'Reservas de hoy'), { hora: '11:00', estado: 'confirmado' }) : apagado('la lista del día')}
            <div class="sec"><h2>Hoy a las 18:00</h2>${regla('manana').on ? tag('Programado', 'info') : tag('Apagado', '')}</div>${regla('manana').on ? wa(msgDia(sumar(HOY, 1), 'Reservas de mañana'), { hora: '18:00', estado: 'programado' }) : apagado('la lista de mañana')}</div>
          <div class="c6 pila"><article class="hoja"><div class="hoja-cab"><h2>${ic('mensaje')}Grupo «${esc(G.nombre)}»</h2>${tag('Por crear', 'aviso')}</div><p class="muted">${esc(G.miembros)}. Hay que crear el grupo en WhatsApp y meter al número del bot (el de automatización, que ya está en los otros grupos).</p>
            <ul class="lista lista-reglas">${(G.reglas || []).map(x => `<li><div class="fila"><span class="medio"><b>${esc(x.t)}</b><small>${esc(x.h)}</small></span>${ed ? `<label class="interruptor"><input type="checkbox" ${x.on ? 'checked' : ''} data-acc="aviso-grupo" data-arg="${esc(x.id)}" aria-label="${esc(x.t)}"><span class="sr-only">${x.on ? 'Encendido' : 'Apagado'}</span></label>` : `<span class="tenue">${x.on ? 'Encendido' : 'Apagado'}</span>`}</div></li>`).join('')}</ul>
            ${ed ? `<p class="muted">Apagar un aviso pide confirmar y queda en el registro de cambios.</p>` : ''}
            <p class="nota aviso">${ic('info', 's')}<span><b>Por decidir:</b> ¿los apaga quien toma las reservas, así, con la confirmación y quedando en el registro, o solo Alejandro desde Parámetros?</span></p></article>
          <p class="nota gris">${ic('candado', 's')}<span>Al grupo no van teléfonos de clientes ni montos: solo nombre, hora, personas, mesa y lo que hay que preparar. Del abono va «Abono pendiente» o «Abono recibido». Al cliente no le escribe el bot: el recordatorio se abre en el WhatsApp del restaurante, que no se conecta al bot.</span></p>
          <p class="nota aviso">${ic('info', 's')}<span><b>Por decidir:</b> ¿va también el monto del abono en el aviso al grupo? Mientras Alejandro no lo decida, no va.</span></p>
          <p class="leyenda wa-ley"><span><span class="tics" aria-hidden="true">✓✓</span> el bot confirmó que salió</span><span>${ic('reloj', 'xs')} programado o enviándose</span><span>${ic('alerta', 'xs')} no salió: hay que mandarlo a mano</span><span>${ic('ojo', 'xs')} vista previa: todavía no sale</span></p></div></div>`;
      }
      return `<div class="pagina">${A.cab(D.HOY.largo, 'Calendario', 'Reservas, eventos y las fechas del personal en un solo lugar. ' + (avisosOn() ? 'Cada reserva nueva o cambiada avisa al grupo de mesoneros.' : 'El aviso de las reservas al grupo de mesoneros está apagado.'), sub !== 'nueva' ? A.boton('calendario', 'Nueva reserva', 'data-sub="nueva"', { icono: 'mas' }) : '')}
        ${sub === 'nueva' ? '' : A.lectura('calendario') + A.subnav([['mes', 'Mes'], ['reservas', 'Reservas', D.RESERVAS.filter(r => r.estado === 'por_confirmar' && dif(r.d) >= 0).length], ['eventos', 'Eventos'], ['personal', 'Personal'], ['avisos', 'Avisos al grupo', noSalieron().length]], sub)}${cuerpo}</div>`;
    },
    montar: (raiz, sub) => {
      if (sub !== 'nueva' || C.hecho || !puede('calendario', 'editar')) return;
      // mientras se escribe se actualizan, sin volver a dibujar la página: la vista previa del aviso, quién es el cliente, la página del
      // libro de ese día, si la mesa ya está tomada y lo que dice el botón
      raiz.querySelectorAll('[data-rf]').forEach(el => el.addEventListener(el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input', () => {
        C.form[el.dataset.rf] = el.type === 'checkbox' ? el.checked : el.value;
        const caja = el.closest('.campo.error'); if (caja) { caja.classList.remove('error'); const m = caja.querySelector('.error-msg'); if (m) m.remove(); }
        if (el.dataset.rf === 'tel') buscarCliente(raiz);
        refrescarReserva(raiz);
      }));
      // solo en el prototipo: sin señal no se puede revisar la mesa ni traer la página del libro
      const red = $('[data-red]', raiz); if (red) red.addEventListener('change', () => { A.ponerRed(red.checked); refrescarReserva(raiz); });
      refrescarReserva(raiz);
    },
    // la reserva nueva a medias se guarda en el equipo: arriba queda «Tienes una reserva a medias: Familia Contreras · Seguir · Descartar»
    borradores: {
      nueva: {
        tomar: () => ({ ...(C.form || formVacio()) }),
        poner: d => { C.form = { ...formVacio(), ...d }; C.hecho = null; },
        txt: d => { const dia = diaDe(d.fecha); const cuando = !dia ? '' : igual(dia, HOY) ? 'hoy' : dif(dia) === 1 ? 'mañana' : fdl(dia).toLowerCase(); return 'una reserva a medias' + (d.nombre.trim() ? ': ' + d.nombre.trim() : '') + (cuando ? ' · ' + cuando + (d.hora ? ' ' + d.hora : '') : ''); },
        vacio: d => !d.nombre.trim() && !soloDig(d.tel) && !d.fecha && !d.hora && !String(d.personas).trim() && !d.mesa.trim() && !d.ocasion && !d.notas.trim() && !d.lapiz,
      },
    },
  };
  ACC['libro-dia'] = n => { if (+n === 0) C.dia = HOY; else { const x = sumar(C.dia, +n); if (dif(x) >= -4 && dif(x) <= 55) C.dia = x; } A.pintarPagina(); };
  // «Hoy ›» y «Mañana ›» (arriba del libro): abren el libro de ese día y bajan hasta él; el teclado queda en su página
  ACC['libro-ir'] = n => {
    C.vista = 'libro'; C.dia = +n === 1 ? sumar(HOY, 1) : HOY; A.pintarPagina();
    const main = $('#main'); const pag = $('#main .libro-reservas .libro-pag'); if (!pag || !main) return;
    // se mueve solo la página (no el marco de la app), hasta que el libro quede arriba
    const top = pag.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 12;
    pag.setAttribute('tabindex', '-1'); main.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); pag.focus({ preventScroll: true });
  };
  ACC['res-vista'] = v => { C.vista = v; A.pintarPagina(); };
  // desde un renglón del libro, el día y la hora ya vienen puestos (las personas, no: se escriben)
  ACC['res-hora'] = arg => { const [f, h] = arg.split('|'); C.form = { ...formVacio(), fecha: f, hora: h }; C.hecho = null; A.ir('calendario/nueva'); };
  ACC['cal-capa'] = k => { C.capas[k] = !C.capas[k]; A.pintarPagina(); };
  ACC['cal-mes'] = m => { C.mes = +m; A.pintarPagina(); };
  // encender un aviso automático es directo; apagarlo pide confirmar (el grupo deja de recibirlo) y los dos quedan en el registro de cambios
  ACC['aviso-grupo'] = (id, el) => {
    const x = (D.GRUPO_MESONEROS.reglas || []).find(r => r.id === id); if (!x || !el) return;
    const anotar = on => A.auditar({ modulo: 'Calendario', registro: 'Aviso al grupo: ' + x.t, campo: 'aviso automático', antes: on ? 'apagado' : 'encendido', despues: on ? 'encendido' : 'apagado' });
    if (el.checked) { x.on = true; anotar(true); A.pintarPagina(); A.aviso('Encendido: «' + x.t + '» vuelve a salir al grupo.'); return; }
    el.checked = true; // todavía sigue encendido: primero se confirma
    A.confirmar({ titulo: 'Apagar «' + x.t + '»', texto: 'El grupo «' + esc(D.GRUPO_MESONEROS.nombre) + '» deja de recibir este aviso (' + esc(x.h.charAt(0).toLowerCase() + x.h.slice(1)) + '). Queda en el registro de cambios y se puede volver a encender.', boton: 'Apagar el aviso', tono: 'peligro', cancelar: 'No, dejarlo' })
      .then(() => { x.on = false; anotar(false); A.pintarPagina(); A.aviso('Apagado: «' + x.t + '» ya no sale. Quedó en el registro de cambios.'); }).catch(() => {});
  };
  // lo que no salió: copiar el mensaje tal cual (con los * de las negritas de WhatsApp) y, cuando se mandó a mano, anotarlo
  ACC['wa-copiar'] = arg => { const [id, k] = String(arg).split('|'); const r = D.RESERVAS.find(x => x.id === id); if (!r) return; const xs = avisosDe(r); const a = k !== undefined && xs[+k] ? xs[+k] : avisoDe(r); const el = document.querySelector(`[data-acc="wa-copiar"][data-arg="${CSS.escape(arg)}"]`); const bur = el ? el.closest('.wa-falla') : null; A.copiar(a.txt || msgReserva(r, a.tipo), { el: bur && bur.previousElementSibling && bur.previousElementSibling.classList.contains('wa-burbuja') ? bur.previousElementSibling : el && el.closest('.wa') ? el.closest('.wa').querySelector('.wa-burbuja') : null, ok: 'Copiado. Pégalo en el grupo «' + D.GRUPO_MESONEROS.nombre + '» y después toca «Ya lo mandé».' }); };
  ACC['wa-mandado'] = id => {
    const r = D.RESERVAS.find(x => x.id === id); if (!r || !r.aviso) return;
    Object.assign(r.aviso, { estado: 'a_mano', hora: D.HOY.hora, quien: S.usuario.nombre });
    A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'aviso al grupo', antes: 'no salió', despues: 'mandado a mano por ' + S.usuario.nombre });
    if (S.ficha) A.pintarFicha(); A.pintarPagina(); A.aviso('Anotado: lo mandaste a mano.');
  };

  /* ---------- nueva reserva ----------
     Empieza por el teléfono del cliente: si ya vino, dice «Vino 9 veces · Alergia al maní» y llena solos el nombre y las notas.
     Arranca sin día, sin hora y sin personas: nada que parezca escogido sin que nadie lo escogiera (desde un renglón del libro o desde un día
     del mes, el día y la hora ya vienen puestos). Debajo del día, la hora y las personas, la página de ese día del libro en pequeño; si la mesa
     ya la tiene otra reserva con menos de 2 horas de diferencia, lo dice en rojo y el botón pasa a «Guardar igual y avisar al grupo».
     «A lápiz (por confirmar)» la anota a lápiz. En «Más detalles» va solo «Llegó por»: la ocasión y las notas quedan a la vista. */
  const formVacio = () => ({ tel: '', nombre: '', fecha: '', hora: '', personas: '', area: 'Salón', mesa: '', lapiz: false, ocasion: '', notas: '', canal: 'WhatsApp del restaurante', otroDia: false, mas: false, cliente: '', relleno: false });
  const diaDe = f => { const [d, m] = String(f || '').split('-').map(Number); return f && !isNaN(d) && !isNaN(m) ? [d, m] : null; };
  function desdeForm() { const F = C.form; const n = parseInt(F.personas, 10); return { d: diaDe(F.fecha), hora: F.hora, nombre: F.nombre.trim() || 'Nombre del cliente', tel: F.tel, telNum: soloDig(F.tel), personas: n > 0 ? n : 0, area: F.area, mesa: F.mesa.trim(), ocasion: F.ocasion, notas: F.notas.trim(), canal: F.canal, abono: 0, tomo: S.usuario.nombre }; }
  // horas de 12:00 a 22:00 cada 15 minutos (se escogen, no se escriben)
  const HORAS = []; for (let m = 12 * 60; m <= 22 * 60; m += 15) HORAS.push(hhmm(m));
  // quien ya vino, por su teléfono (los inventados de CLIENTES_RES): su nombre, cuántas veces vino y la nota que sirve siempre (una alergia)
  const clienteDe = tel => { const t = soloDig(tel); return t.length >= 10 ? (D.CLIENTES_RES || []).find(c => c.tel === t) || null : null; };
  const clienteHtml = F => {
    const c = clienteDe(F.tel); const t = soloDig(F.tel);
    if (c) return `<p class="cliente-ficha">${ic('usuario', 's')}<span><b>${esc(c.nombre)}</b><span>Vino ${c.visitas} ${c.visitas === 1 ? 'vez' : 'veces'}${c.nota ? ' · ' + esc(c.nota) : ''}</span>${c.ultima ? `<small>La última vez: ${esc(c.ultima)}</small>` : ''}</span></p>${F.relleno ? '<small class="ayuda">Llenamos el nombre y las notas con lo que ya sabíamos. Cámbialos si hace falta.</small>' : ''}`;
    return t.length >= 11 ? '<small class="ayuda">Primera vez: no hay reservas con ese teléfono.</small>' : '';
  };
  // al reconocer el teléfono, el nombre y las notas se llenan solos (lo que ya se escribió no se pisa)
  function buscarCliente(raiz) {
    const F = C.form; const c = clienteDe(F.tel);
    if (!c) { F.cliente = ''; F.relleno = false; return; }
    if (F.cliente === c.tel) return; F.cliente = c.tel; let lleno = false;
    if (!F.nombre.trim()) { F.nombre = c.nombre; const n = $('#rf-nombre', raiz); if (n) n.value = c.nombre; lleno = true; }
    if (!F.notas.trim() && c.nota) { F.notas = c.nota; const t = $('#rf-notas', raiz); if (t) t.value = c.nota; lleno = true; }
    F.relleno = lleno;
  }
  // la página de ese día del libro, en pequeño: la reserva que se escribe va en su hora, marcada «nueva», y la que tiene la misma mesa, marcada en rojo
  function libroMini(F) {
    const dia = diaDe(F.fecha);
    if (!dia) return '<p class="muted libro-mini-vacio">Elige el día: aquí sale su página del libro, para ver qué mesas ya están tomadas.</p>';
    if (A.sinRed()) return `<p class="nota gris">${ic('senal', 's')}<span>Sin señal: no pude traer la página del ${esc(fLarga(dia))}.</span></p>`;
    const xs = vigentes().filter(r => igual(r.d, dia) && r.estado !== 'no_vino'); const choca = new Set(choquesDe(F).map(c => c.r.id));
    const nueva = F.hora ? [{ id: '', hora: F.hora, nombre: F.nombre.trim() || 'Esta reserva', personas: parseInt(F.personas, 10) || '', mesa: F.mesa.trim(), area: F.area, nueva: true }] : [];
    const filas = xs.concat(nueva).sort(porHora);
    return `<section class="libro-mini" aria-label="El libro del ${esc(fLarga(dia))}"><header class="libro-mini-cab"><b>${esc(cap(fLarga(dia)))}</b><span>${xs.length ? xs.length + (xs.length === 1 ? ' reserva · ' : ' reservas · ') + personasDe(xs) + ' personas' : 'Sin reservas'}</span></header>
      ${filas.length ? `<ol>${filas.map(r => `<li class="${r.nueva ? 'nueva' : r.estado}${choca.has(r.id) ? ' choca' : ''}"><time>${minDe(r.hora) === null ? '¿?' : hhmm(minDe(r.hora))}</time><span class="lm-nombre">${esc(r.nombre)}${r.nueva ? ' <small>nueva</small>' : ''}</span><span class="lm-pers">${r.personas}</span><span class="lm-mesa">${esc(r.mesa || r.area || '')}</span>${choca.has(r.id) ? '<span class="sr-only">, tiene la misma mesa</span>' : ''}</li>`).join('')}</ol>` : '<p class="muted">Ese día todavía no hay nada anotado.</p>'}</section>`;
  }
  // la mesa: el aviso en rojo y, como propuesta, las mesas de esa área para tocarlas (las tomadas a esa hora dicen quién las tiene)
  function mesasHtml(F) {
    const aviso = avisoMesa(choquesDe(F));
    const lista = (((D.PARAMS.mesas || {}).areas || []).find(x => x[0] === F.area) || [0, []])[1];
    if (!lista.length) return aviso;
    const dia = diaDe(F.fecha); const m = minDe(F.hora); const listo = !!dia && m !== null && !A.sinRed();
    const ocup = {}; if (listo) vigentes().filter(r => r.estado !== 'no_vino' && igual(r.d, dia) && minDe(r.hora) !== null && Math.abs(minDe(r.hora) - m) < 120).forEach(r => mesasDe(r.mesa, r.area).forEach(x => { ocup[x] = ocup[x] || r; }));
    const elegidas = mesasDe(F.mesa, F.area); const libres = lista.filter(x => !ocup[x.toUpperCase()]).length;
    return aviso + `<div class="mesas-prop"><p class="mesas-cab"><span>${listo ? 'Toca una mesa · libres a esa hora: ' + libres + ' de ' + lista.length : 'Toca una mesa · elige el día y la hora para ver cuáles están libres'}</span>${tag('Propuesta', 'aviso')}</p>
      <div class="mesas" role="group" aria-label="Mesas de ${esc(F.area.toLowerCase())}">${lista.map(x => { const k = x.toUpperCase(); const oc = ocup[k]; const el = elegidas.has(k); return `<button type="button" class="mesa${oc ? ' ocupada' : ''}${el ? ' elegida' : ''}" data-acc="rf-mesa" data-arg="${esc(x)}" aria-pressed="${el}"${oc ? ` title="La tiene ${esc(oc.nombre)} a las ${esc(oc.hora)}"` : ''}><span>${esc(x)}</span>${oc ? `<small>${esc(oc.hora)}</small>` : ''}<span class="sr-only">${oc ? ', la tiene ' + esc(oc.nombre) + ' a las ' + esc(oc.hora) : listo ? ', libre' : ''}</span></button>`; }).join('')}</div>
      <p class="muted">Las mesas se tocarán así cuando su lista esté en Parámetros: la de aquí es de ejemplo.</p></div>`;
  }
  // lo que cambia mientras se escribe, sin volver a dibujar la página (el teclado no se mueve del campo)
  function refrescarReserva(raiz = document) {
    const F = C.form; if (!F) return; const r = desdeForm();
    // con el aviso apagado, la vista previa lo dice (sin burbuja ni palomitas): este aviso no le llega al grupo
    const v = $('#rf-vista', raiz); if (v) v.innerHTML = (avisosOn() ? wa(msgReserva(r, F.lapiz ? 'Reserva nueva · por confirmar' : 'Reserva nueva'), { estado: 'previa' }) : apagadoHtml('Este aviso')) + (r.personas >= 10 ? `<p class="chequeo aviso">${ic('info', 's')}<span>Grupo de ${r.personas}: pide un abono de ${dinero(r.personas * 5, 'usd', 0)} (propuesta: ${dinero(5, 'usd', 0)} por persona).</span></p>` : '');
    const poner = (id, h) => { const el = $('#' + id, raiz); if (el && el.innerHTML !== h) el.innerHTML = h; };
    poner('rf-cliente', clienteHtml(F)); poner('rf-libro', libroMini(F)); poner('rf-mesas', mesasHtml(F));
    const t = $('#rf-guardar-t', raiz); if (t) t.textContent = guardarResTxt(F);
    const mas = $('#rf-mas-resumen', raiz); if (mas) mas.textContent = !F.mas && F.canal !== 'WhatsApp del restaurante' ? ' · llegó por ' + F.canal.toLowerCase() : '';
  }
  // lo que dice el botón: «Guardar y avisar al grupo», «Guardar igual…» con la mesa repetida, «… sin avisar al grupo» con el aviso apagado
  const guardarResTxt = F => (!A.sinRed() && choquesDe(F).length ? 'Guardar igual ' : 'Guardar ') + (avisosOn() ? 'y avisar al grupo' : 'sin avisar al grupo');
  function formReserva() {
    if (!C.form) C.form = formVacio(); const F = C.form;
    const dia = diaDe(F.fecha); const cual = !dia ? '' : igual(dia, HOY) ? 'hoy' : dif(dia) === 1 ? 'man' : 'otro';
    const otro = cual === 'otro' || F.otroDia;
    const dias = Array.from({ length: 54 }, (_, i) => sumar(HOY, i + 2));
    // el día que viene escogido (un renglón del libro o un día del mes) siempre está en la lista, aunque pase de los 54 que se ofrecen
    if (dia && dif(dia) >= 2 && !dias.some(d => igual(d, dia))) { dias.push(dia); dias.sort((a, b) => dif(a) - dif(b)); }
    const horas = HORAS.includes(F.hora) || !F.hora ? HORAS : [...HORAS, F.hora].sort((a, b) => minDe(a) - minDe(b));
    const sel = (k, ops, vacio = '') => `<select id="rf-${k}" data-rf="${k}">${vacio ? `<option value=""${F[k] ? '' : ' selected'}>${esc(vacio)}</option>` : ''}${ops.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(F[k]) ? ' selected' : ''}>${esc(t)}</option>`; }).join('')}</select>`;
    const btnDia = (k, t, sub) => `<button type="button" data-acc="rf-dia" data-arg="${k}" aria-pressed="${k === 'otro' ? otro : cual === k}">${(k === 'otro' ? otro : cual === k) ? ic('check', 's') : ''}<span>${t}${sub ? `<small>${esc(sub)}</small>` : ''}</span></button>`;
    return `<div class="rejilla" data-form="reserva"><div class="c6 pila"><article class="hoja form"><h2>Nueva reserva</h2><div class="campos">
        <label class="campo ancho"><span>Teléfono del cliente (opcional)</span><input id="rf-tel" data-rf="tel" data-solo-num data-max="11" maxlength="16" value="${esc(F.tel)}" inputmode="tel" autocomplete="off" placeholder="04141234567" aria-describedby="rf-tel-ay"><small class="ayuda" id="rf-tel-ay">Empieza por aquí: si ya vino, la app llena su nombre y sus notas. No sale en el grupo.</small></label>
        <div class="campo ancho rf-cliente" id="rf-cliente" aria-live="polite">${clienteHtml(F)}</div>
        <label class="campo ancho"><span>Nombre</span><input id="rf-nombre" data-rf="nombre" value="${esc(F.nombre)}" autocomplete="off" placeholder="Como lo dijo el cliente"></label>
        <div class="campo ancho" id="rf-dia-campo"><span id="rf-dia-t">Día</span><div class="dias" role="group" aria-labelledby="rf-dia-t">${btnDia('hoy', 'Hoy', fdl(HOY).toLowerCase())}${btnDia('man', 'Mañana', fdl(sumar(HOY, 1)).toLowerCase())}${btnDia('otro', 'Otro día', otro && dia ? fdl(dia).toLowerCase() : '')}</div>
          ${otro ? `<label class="campo" id="rf-fecha-campo"><span class="sr-only">Qué día</span>${sel('fecha', dias.map(d => [d[0] + '-' + d[1], fdl(d)]), 'Elige el día')}</label>` : ''}</div>
        <label class="campo"><span>Hora</span>${sel('hora', horas, 'Elige la hora')}</label>
        <label class="campo"><span>Personas</span><input id="rf-personas" data-rf="personas" value="${esc(F.personas)}" inputmode="numeric" autocomplete="off" placeholder="¿Cuántas?"></label>
        <div class="campo ancho" id="rf-libro">${libroMini(F)}</div>
        <label class="campo"><span>Dónde</span>${sel('area', ['Salón', 'Terraza', 'Salón privado', 'Barra'])}</label>
        <label class="campo"><span>Mesa (opcional)</span><input id="rf-mesa" data-rf="mesa" value="${esc(F.mesa)}" placeholder="S5, T2…" autocomplete="off" aria-describedby="rf-mesas"></label>
        <div class="campo ancho rf-mesas" id="rf-mesas">${mesasHtml(F)}</div>
        <label class="interruptor rf-lapiz ancho"><input type="checkbox" id="rf-lapiz" data-rf="lapiz"${F.lapiz ? ' checked' : ''}><span>A lápiz (por confirmar)<small>Va a lápiz en el libro hasta que el cliente confirme.</small></span></label>
        <label class="campo"><span>Ocasión</span>${sel('ocasion', [['', 'Ninguna'], 'Cumpleaños', 'Aniversario', 'Negocios', 'Reencuentro', 'Otra'])}</label>
        <label class="campo ancho"><span>Notas para el equipo (opcional)</span><textarea id="rf-notas" data-rf="notas" placeholder="Alergias, traen torta, silla de bebé…">${esc(F.notas)}</textarea></label>
        <div class="campo ancho rf-mas"><button type="button" class="enlace" data-acc="rf-mas" aria-expanded="${!!F.mas}" aria-controls="rf-mas-c">${ic(F.mas ? 'abajo' : 'derecha', 's')}Más detalles<span class="tenue" id="rf-mas-resumen">${!F.mas && F.canal !== 'WhatsApp del restaurante' ? ' · llegó por ' + esc(F.canal.toLowerCase()) : ''}</span></button>
          <div class="campos" id="rf-mas-c"${F.mas ? '' : ' hidden'}><label class="campo"><span>Llegó por</span>${sel('canal', ['WhatsApp del restaurante', 'Instagram', 'Teléfono', 'En persona'])}</label></div></div>
      </div></article></div>
      <div class="c6 pila"><div class="sec"><h2>El aviso al grupo</h2></div><div id="rf-vista"></div>
        <button class="btn pri full" data-acc="res-guardar">${ic(avisosOn() ? 'enviar' : 'check', 's')}<span id="rf-guardar-t">${esc(guardarResTxt(F))}</span></button>
        <button class="btn ghost" data-acc="res-volver">${ic('atras', 's')}Volver</button>
        <label class="proto-prueba"><input type="checkbox" data-red data-no-borrador${A.RED.sin ? ' checked' : ''}><span><b>Solo en el prototipo</b>Sin señal: así se ve cuando no se puede revisar la mesa.</span></label></div></div>`;
  }
  // el día: Hoy y Mañana lo dejan puesto; Otro día abre la lista de los días que siguen
  ACC['rf-dia'] = k => {
    if (!C.form) C.form = formVacio();
    if (k === 'otro') { C.form.otroDia = true; const d = diaDe(C.form.fecha); if (d && dif(d) < 2) C.form.fecha = ''; }
    else { C.form.otroDia = false; const d = k === 'hoy' ? HOY : sumar(HOY, 1); C.form.fecha = d[0] + '-' + d[1]; }
    A.borrador('reserva'); // escoger el día ya cuenta como empezar a escribir
    A.pintarPagina();
    if (k === 'otro') { const s = $('#rf-fecha'); if (s) s.focus(); }
  };
  // «Más detalles»: se abre y se cierra sin volver a dibujar (lo escrito no se mueve)
  ACC['rf-mas'] = (a, b) => {
    if (!C.form) return; C.form.mas = !C.form.mas; const c = $('#rf-mas-c'); if (c) c.hidden = !C.form.mas;
    if (b) { b.setAttribute('aria-expanded', String(C.form.mas)); const i = b.querySelector('.ic use'); if (i) i.setAttribute('href', '#i-' + (C.form.mas ? 'abajo' : 'derecha')); }
    refrescarReserva(); if (C.form.mas) { const s = $('#rf-canal'); if (s) s.focus(); }
  };
  // tocar una mesa la suma a «Mesa» (o la quita si ya estaba): así quedan «T4 + T5»
  ACC['rf-mesa'] = x => {
    if (!C.form) return; const F = C.form; const k = String(x).toUpperCase();
    if (mesasDe(F.mesa, F.area).has(k)) F.mesa = F.mesa.split(/\s*\+\s*/).filter(t => !mesasDe(t, F.area).has(k)).join(' + ');
    else F.mesa = (F.mesa.trim() ? F.mesa.trim() + ' + ' : '') + x;
    const inp = $('#rf-mesa'); if (inp) inp.value = F.mesa;
    A.borrador('reserva'); refrescarReserva();
    const b = $(`[data-acc="rf-mesa"][data-arg="${CSS.escape(x)}"]`); if (b) b.focus({ preventScroll: true });
  };
  // el aviso del grupo sale «Enviando…» y, cuando el bot confirma, con las dos palomitas · el recordatorio, a un toque
  // con el aviso apagado no sale nada (lo dice, sin burbuja) · sin señal queda en el teléfono, «Enviando…», y la mesa se revisa al volver
  function hechoReserva(r) {
    const a = avisoDe(r); const apagado = a.estado === 'apagado'; const espera = !!a.sinSenal;
    const ch = espera ? [] : choquesDe({ fecha: r.d, hora: r.hora, mesa: r.mesa, area: r.area }, r.id);
    const lapiz = r.estado === 'por_confirmar' ? ', a lápiz' : '';
    const hecho = apagado ? `Guardado${lapiz}. El aviso al grupo está apagado. (Simulado)` : espera ? `Guardada en el teléfono${lapiz}. El aviso al grupo sale cuando vuelva la señal. (Simulado)` : `Guardado y avisado al grupo «${esc(D.GRUPO_MESONEROS.nombre)}»${lapiz}. (Simulado)`;
    return `<div class="rejilla"><div class="c6 pila"><div class="hecho-caja">${ic(espera ? 'senal' : 'check')}<span>${hecho}</span></div>${ch.length ? `<p class="nota alerta">${ic('alerta', 's')}<span><b>Ojo con la mesa:</b> ${ch.map(c => esc(choqueTxt(c))).join('; ')}.</span></p>` : ''}${espera ? `<p class="nota gris">${ic('senal', 's')}<span>Sin señal no pude revisar si la mesa está libre: lo reviso cuando vuelva la conexión.</span></p>` : ''}
      ${apagado ? apagadoHtml('El aviso de esta reserva') : wa(a.txt || msgReserva(r, a.tipo), { hora: a.hora, estado: estadoWa(a) })}
      <div class="fila-btns"><button class="btn sec" data-acc="res-ver">Ver las reservas</button><button class="btn sec" data-acc="res-otra">Tomar otra</button></div></div>
      <div class="c6 pila"><article class="hoja">${recordatorioHtml(r)}</article></div></div>`;
  }
  // el recordatorio para el cliente: el texto, «Abrir en WhatsApp», «Copiar» y la línea para revisar que se abrió el WhatsApp del restaurante
  const recordatorioHtml = r => `<h2>${ic('celular')}Recordatorio para el cliente</h2><p class="cita" id="rec-${r.id}">${esc(msgCliente(r))}</p>
    ${marcasTag(r) ? `<p class="rec-marcas">${marcasTag(r)}${r.recordado ? `<small class="tenue">${r.recordado.via === 'copiado' ? 'copiado' : 'abierto en WhatsApp'} y mandado por ${esc(r.recordado.quien)}</small>` : ''}</p>` : ''}
    ${botonesRec(r, false)}${notaRec(r)}
    ${r.recordado || !porWa(r) ? '' : `<p class="rec-ojo">${ic('alerta', 's')}<span>Revisa que se abrió el WhatsApp del restaurante, no el tuyo. Cuando lo mandes, toca «Ya lo mandé».</span></p>`}`;
  // lo que falta se marca en su casilla, con lo que hay que hacer, y el teclado va a la primera
  ACC['res-guardar'] = () => {
    const F = C.form || formVacio(); const r = desdeForm();
    const otro = !!$('#rf-fecha'); // con «Otro día» tocado, lo que falta es escoger el día en la lista
    // la misma pieza de todos los formularios: el error debajo de su campo, la pantalla baja al primero y el cursor queda ahí
    if (A.faltan($('#main'), [[!F.nombre.trim(), 'rf-nombre', 'Escribe el nombre de quien reserva.'], [!r.d, otro ? 'rf-fecha-campo' : 'rf-dia-campo', otro ? 'Escoge el día en la lista.' : 'Toca Hoy, Mañana u Otro día.'], [!F.hora, 'rf-hora', 'Escoge la hora.'], [!r.personas, 'rf-personas', 'Escribe cuántas personas vienen.']])) return;
    // sin señal la mesa no se revisa (se revisa cuando vuelva la conexión) y el aviso queda en el teléfono hasta entonces
    const ch = A.sinRed() ? [] : choquesDe(F); const cli = clienteDe(F.tel);
    const id = 'rs' + (D.RESERVAS.length + 1 + Math.floor(Math.random() * 1000)); Object.assign(r, { id, estado: F.lapiz ? 'por_confirmar' : 'confirmada', visitas: cli ? cli.visitas : 0, abonoOk: false, abono: r.personas >= 10 ? r.personas * 5 : 0, tel: r.telNum.length >= 10 ? r.telNum.slice(0, 4) + '-•••-' + r.telNum.slice(-4) : '' });
    D.RESERVAS.push(r); A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'creada', despues: fdl(r.d) + ' ' + r.hora + ' · ' + r.personas + ' personas' + (F.lapiz ? ' · a lápiz' : '') + (ch.length ? ' · con la mesa repetida: ' + ch.map(choqueTxt).join('; ') : '') });
    const est = avisar(r, F.lapiz ? 'Reserva nueva · por confirmar' : 'Reserva nueva');
    A.borradorHecho(); C.hecho = id; A.pintarPagina();
    // la confirmación usa el verbo del botón: «Guardar y avisar» → «Guardado y avisado»; «Guardar sin avisar» → «Guardado» (el aviso está apagado)
    A.aviso(est === 'apagado' ? 'Guardado. El aviso al grupo está apagado.' + (ch.length ? ' Ojo: la mesa está repetida.' : '')
      : est === 'sin_senal' ? 'Guardada en el teléfono. El aviso al grupo sale cuando vuelva la señal.'
      : ch.length ? 'Guardado y avisado al grupo, con la mesa repetida.' : 'Guardado y avisado al grupo.');
  };
  // «Volver»: un paso atrás, a donde estaba antes de abrir el formulario (el Mes, la hoja de un día, el libro); si no hay paso de la app
  // antes, a Reservas · lo escrito queda en su borrador (arriba de la pantalla, «Tienes una reserva a medias»)
  ACC['res-volver'] = () => { C.hecho = null; A.volverAtras('calendario/reservas'); };
  // «Ver las reservas» (después de guardar): a la lista, como dice el botón
  ACC['res-ver'] = () => { C.hecho = null; A.volver('calendario/reservas'); };
  ACC['res-otra'] = () => { C.hecho = null; C.form = null; A.pintarPagina(); const t = $('#rf-tel'); if (t) t.focus(); };
  const repintarRes = r => { if (S.ficha && S.ficha.tipo === 'reserva' && S.ficha.id === r.id && !S.ficha.editando) A.pintarFicha(); A.pintarPagina(); };
  // el teclado va al botón que sigue en esa reserva (Ya lo mandé, Deshacer), en la ficha o en la lista
  const enRaiz = (raiz, sel) => document.querySelector(sel.split(', ').map(s => raiz + ' ' + s).join(', '));
  const focoRec = (r, acc) => { const sel = `[data-acc="${acc}"][data-arg="${CSS.escape(r.id)}"], [data-acc="${acc}"][data-arg$=":${CSS.escape(r.id)}"]`; const b = (S.ficha ? enRaiz('#ficha-raiz', sel) : null) || enRaiz('#main', sel); if (b) b.focus({ preventScroll: true }); };
  // abrir el chat o copiar el texto todavía no es mandarlo: sale «Ya lo mandé» (que lo deja «Recordado»)
  const abierto = (r, via) => { r.recAbierto = { via, hora: D.HOY.hora }; repintarRes(r); focoRec(r, 'res-mandado'); };
  ACC['res-copiar'] = id => { const r = D.RESERVAS.find(x => x.id === id); if (!r) return; const txt = msgCliente(r); abierto(r, 'copiado'); A.copiar(txt, { el: document.getElementById('rec-' + id), ok: 'Copiado. Pégalo en el chat del cliente, desde el WhatsApp del restaurante, y después toca «Ya lo mandé».' }); };
  // en la app: <a href="https://wa.me/58{teléfono sin el 0}?text={el recordatorio}"> · en el prototipo no se abre nada (los números son inventados)
  ACC['res-wa'] = id => {
    const r = D.RESERVAS.find(x => x.id === id); if (!r) return;
    if (esFijo(r)) { A.aviso(FIJO_TXT, 'info'); return; }
    if (!porWa(r)) { A.aviso('Esta reserva no tiene teléfono: copia el recordatorio y mándalo como puedas.', 'info'); return; }
    abierto(r, 'WhatsApp'); A.aviso('Abriría el chat de ' + r.tel + ' con el recordatorio listo. Revisa que sea el WhatsApp del restaurante y, al volver, toca «Ya lo mandé». (Simulado)', 'info');
  };
  // «Ya lo mandé»: queda «Recordado» (con su «Deshacer» de 10 segundos)
  ACC['res-mandado'] = id => {
    const r = D.RESERVAS.find(x => x.id === id); if (!r || r.recordado) return; const ab = r.recAbierto || { via: 'copiado' };
    r.recordado = { hora: D.HOY.hora, quien: S.usuario.nombre, via: ab.via }; delete r.recAbierto;
    A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'recordatorio', antes: '—', despues: 'mandado (' + (ab.via === 'copiado' ? 'copiado' : 'abierto en WhatsApp') + ')' });
    A.unToque('recordado:' + r.id, () => {
      delete r.recordado; r.recAbierto = ab;
      A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'recordatorio', antes: 'mandado', despues: '—', motivo: 'Deshecho a los pocos segundos de marcarlo' });
      repintarRes(r); focoRec(r, 'res-mandado'); A.aviso('Deshecho: vuelve a «sin recordar».');
    });
    repintarRes(r); focoRec(r, 'rec-deshacer'); A.aviso('Anotado: lo mandaste. Puedes deshacerlo durante 10 segundos.');
  };
  // «Marcar que confirmó»: el cliente contestó que viene · si estaba a lápiz, pasa a tinta y el grupo lo sabe (con el aviso encendido)
  // deshacerlo la devuelve a lápiz y, si el aviso salió, el grupo recibe que vuelve a «por confirmar»
  ACC['res-confirmo'] = id => {
    const r = D.RESERVAS.find(x => x.id === id); if (!r || r.confirmo) return; r.confirmo = { hora: D.HOY.hora, quien: S.usuario.nombre };
    const lapiz = r.estado === 'por_confirmar'; if (lapiz) r.estado = 'confirmada';
    A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'recordatorio', antes: 'recordado', despues: 'confirmó' + (lapiz ? ' · pasa a tinta' : '') });
    const est = lapiz ? avisar(r, 'Reserva confirmada') : '';
    A.unToque('confirmo:' + r.id, () => {
      delete r.confirmo; if (lapiz) { r.estado = 'por_confirmar'; if (est && est !== 'apagado') avisar(r, 'Reserva por confirmar'); }
      A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'recordatorio', antes: 'confirmó', despues: 'recordado' + (lapiz ? ' · vuelve a lápiz' : ''), motivo: 'Deshecho a los pocos segundos de marcarlo' });
      repintarRes(r); focoRec(r, 'res-confirmo'); A.aviso(lapiz && est && est !== 'apagado' ? 'Deshecho: vuelve a lápiz. Avisamos al grupo.' : 'Deshecho: todavía no confirmó.');
    });
    repintarRes(r); focoRec(r, 'rec-deshacer');
    A.aviso('Marcado: confirmó.' + (lapiz ? ' Pasa a tinta en el libro. ' + trasAviso(est) : '') + ' Puedes deshacerlo durante 10 segundos.');
  };
  ACC['rec-deshacer'] = k => { if (!A.deshacerUT(k)) { A.aviso('Ya pasaron los 10 segundos.', 'info'); A.pintarPagina(); if (S.ficha) A.pintarFicha(); } };
  /* Llegó, No vino, Confirmar y Anular reserva:
     Llegó se marca todo el día; No vino, desde media hora después de la hora. Los dos van de un toque y se pueden deshacer
     durante 10 segundos (la misma pieza de todas las decisiones de un toque, A.unToque); después queda «Reabrir»: pide un motivo
     de un toque, la devuelve a «Confirmada» y su sello («Llegó» o «No vino») queda tachado.
     Confirmar pasa de lápiz a tinta sin pedir motivo. Anular reserva pide el motivo, y su ventana sale con «No, dejarla». */
  const deshacible = r => A.deshacible('reserva:' + r.id);
  function marcar(r, est) {
    const antes = r.estado; r.estado = est;
    A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'estado', antes: A.estadoTxt(antes), despues: A.estadoTxt(est) });
    A.unToque('reserva:' + r.id, () => {
      const ahora = r.estado; r.estado = antes;
      A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'estado', antes: A.estadoTxt(ahora), despues: A.estadoTxt(r.estado), motivo: 'Deshecho a los pocos segundos de marcarlo' });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Deshecho: vuelve a «' + A.estadoTxt(r.estado) + '».');
    });
    A.pintarFicha(); A.pintarPagina();
    // el teclado va a «Deshacer», que se vence a los 10 segundos (no al título, lejos del botón)
    const d = document.querySelector('#ficha-raiz [data-acc="res-deshacer"]'); if (d) d.focus({ preventScroll: true });
    A.aviso((est === 'llego' ? 'Anotado: llegó.' : 'Anotado: no vino.') + ' Puedes deshacerlo durante 10 segundos.');
  }
  ACC['res-estado'] = arg => {
    const [id, est] = arg.split('|'); const r = D.RESERVAS.find(x => x.id === id); const antes = r.estado;
    if (est === 'llego' || est === 'no_vino') {
      if (est === 'no_vino' && !puedeNoVino(r)) { A.aviso('«No vino» se puede marcar desde las ' + (noVinoDesde(r) !== null ? hhmm(noVinoDesde(r)) : 'media hora después de la hora') + ', media hora después de la hora de la reserva.', 'info'); return; }
      marcar(r, est); return;
    }
    const hacer = (m = '') => {
      r.estado = est; A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'estado', antes: A.estadoTxt(antes), despues: A.estadoTxt(est), motivo: m });
      const av = avisar(r, est === 'cancelada' ? 'Reserva anulada' : 'Reserva confirmada');
      A.pintarFicha(); A.pintarPagina();
      A.aviso(est === 'cancelada' ? (av === 'enviando' ? 'Reserva anulada. Avisamos al grupo que la mesa queda libre.' : 'Reserva anulada. ' + trasAviso(av)) : 'Confirmada: pasa a tinta en el libro. ' + trasAviso(av));
    };
    if (est === 'cancelada') A.pedirMotivo({ titulo: 'Anular la reserva de ' + r.nombre, texto: (avisosOn() ? 'El grupo recibe el aviso de que la mesa queda libre.' : 'El aviso al grupo está apagado: el grupo no se entera de que la mesa queda libre.') + ' En el libro queda tachada, con el motivo.', boton: 'Anular reserva', tono: 'peligro', cancelar: 'No, dejarla' }).then(hacer).catch(() => {});
    else hacer();
  };
  ACC['res-deshacer'] = id => { if (!A.deshacerUT('reserva:' + id)) { A.aviso('Ya pasaron los 10 segundos: para cambiarlo, toca «Reabrir».', 'info'); if (S.ficha) A.pintarFicha(); } };
  // reabrir más tarde: un motivo de un toque; vuelve a «Confirmada» y el sello de «Llegó» o «No vino» queda tachado (no avisa al grupo)
  ACC['res-reabrir'] = id => {
    const r = D.RESERVAS.find(x => x.id === id); if (!r || !['llego', 'no_vino'].includes(r.estado)) return;
    A.pedirReabrir({ titulo: 'Reabrir la reserva de ' + r.nombre, texto: 'Vuelve a «Confirmada», para marcarla otra vez. Lo de antes queda en el registro de cambios y su sello, tachado.', opciones: ['Me equivoqué de botón'] }).then(m => {
      const antes = r.estado; A.selloViejo(r, antes === 'llego' ? 'Llegó' : 'No vino', antes === 'no_vino'); r.estado = 'confirmada';
      A.auditar({ modulo: 'Calendario', registro: 'Reserva ' + r.nombre, campo: 'estado', antes: A.estadoTxt(antes), despues: 'Confirmada (reabierta)', motivo: m });
      A.pintarFicha(); A.pintarPagina(); A.aviso('Reabierta: vuelve a «Confirmada».');
    }).catch(() => {});
  };
  // el aviso de un evento: con la regla «Eventos» apagada no sale (el botón lleva candado y lo dice)
  ACC['res-avisar'] = () => { if (!reglaGrupo('eventos')) { A.aviso('El aviso de eventos está apagado: no sale al grupo. Se enciende en Calendario › Avisos al grupo.', 'info'); return; } A.aviso('Avisado al grupo «' + D.GRUPO_MESONEROS.nombre + '». (Simulado)'); };
  ACC['ev-tarea'] = arg => { if (!puede('calendario', 'editar')) { A.aviso('Solo lectura: pídeselo a ' + A.quienEdita('calendario') + '.', 'info'); return; } const [id, k] = arg.split('|'); const e = D.EVENTOS_AG.find(x => x.id === id); e.tareas[+k][1] = !e.tareas[+k][1]; A.pintarFicha(); A.pintarPagina(); };

  FICHAS.reserva = id => {
    const r = D.RESERVAS.find(x => x.id === id); const ed = puede('calendario', 'editar'); const futura = dif(r.d) >= 0;
    const pendiente = ['confirmada', 'por_confirmar'].includes(r.estado); const marcada = ['llego', 'no_vino'].includes(r.estado);
    const acc = [];
    // anular va aparte, a la izquierda, lejos de Llegó o Confirmar
    if (pendiente && futura) acc.push({ txt: 'Anular reserva', acc: 'res-estado', arg: r.id + '|cancelada', tono: 'ghost', icono: 'anular', izq: true, solo: 'editar' });
    // a lápiz: Confirmar, de un toque y sin motivo (es la principal si la reserva no es de hoy)
    if (r.estado === 'por_confirmar' && futura) acc.push({ txt: 'Confirmar', acc: 'res-estado', arg: r.id + '|confirmada', icono: 'check', tono: dif(r.d) > 0 ? 'pri' : 'sec', solo: 'editar' });
    // el día de la reserva (o después, si quedó sin marcar): Llegó todo el día; No vino, desde media hora después de la hora
    if (pendiente && dif(r.d) <= 0) { if (puedeNoVino(r)) acc.push({ txt: 'No vino', acc: 'res-estado', arg: r.id + '|no_vino', solo: 'editar' }); acc.push({ txt: 'Llegó', acc: 'res-estado', arg: r.id + '|llego', tono: 'pri', icono: 'check', solo: 'editar' }); }
    // recién marcada: «Deshacer» durante 10 segundos (la cuenta atrás no se lee en voz alta: el botón se llama «Deshacer»); después, «Reabrir»
    if (marcada) acc.push(deshacible(r) ? { ...A.accDeshacer('res-deshacer', r.id, 'reserva:' + r.id), solo: 'editar' } : { ...A.accReabrir('res-reabrir', r.id, 'reserva:' + r.id), solo: 'editar' });
    const desde = ed && pendiente && dif(r.d) === 0 && !puedeNoVino(r) && noVinoDesde(r) !== null ? hhmm(noVinoDesde(r)) : '';
    const a = avisoDe(r); const n = avisosDe(r).length;
    const tituloAviso = n > 1 ? 'Lo que le llegó al grupo' : { enviando: 'Enviando al grupo', no_salio: 'No le llegó al grupo', a_mano: 'Se mandó a mano al grupo', apagado: 'No le llegó al grupo' }[a.estado] || 'Lo que le llegó al grupo';
    // mientras se edita: el choque de mesa con lo que hay escrito (el mismo de la reserva nueva) · sin el aviso encendido, «sin avisar»
    const choqueEd = leer => A.sinRed() ? [] : choquesDe({ fecha: leer('dia') || (r.d[0] + '-' + r.d[1]), hora: leer('hora'), mesa: leer('mesa'), area: leer('area') }, r.id);
    const guardarRes = marcada ? 'Guardar' : avisosOn() ? 'Guardar y avisar al grupo' : 'Guardar sin avisar al grupo';
    // en Editar, el día y la hora se eligen con los mismos botones y listas de la reserva nueva: nunca se escriben a mano
    const opsDia = [HOY, sumar(HOY, 1)].concat(Array.from({ length: 54 }, (_, i) => sumar(HOY, i + 2))); if (futura && !opsDia.some(d => igual(d, r.d))) opsDia.push(r.d);
    const campoDia = futura && pendiente ? { k: 'dia', tipo: 'dia', etq: 'Día de la reserva', opciones: opsDia.map((d, i) => [d[0] + '-' + d[1], i < 2 ? fdl(d).toLowerCase() : fdl(d)]), valor: o => o.d[0] + '-' + o.d[1], aplicar: (o, v) => { const d = diaDe(v); if (d) o.d = d; }, mostrar: v => { const d = diaDe(v); return d ? fdl(d) : v; } } : undefined;
    // el abono no se marca a mano: lo que se ve es lo que confirmó el bot de Caja (o que todavía no llegó)
    const abonoHtml = r.abonoOk ? `<p>${tag('Recibido', 'ok')} ${dinero(r.abono, 'usd', 0)}${r.abonoCaja ? ` · lo confirmó el bot de Caja: ${esc(r.abonoCaja.via)}${r.abonoCaja.ref ? ' · ref. …' + esc(r.abonoCaja.ref.slice(-6)) : ''} · ${esc(r.abonoCaja.cuando)}` : ' · lo confirmó el bot de Caja.'}</p>`
      : `<p>${tag('Falta', 'aviso')} ${dinero(r.abono, 'usd', 0)} · grupos de 10 o más dejan abono (propuesta: ${dinero(5, 'usd', 0)} por persona).</p><p class="muted">No se marca a mano: cuando el pago llegue a Caja, el bot lo confirma y sale aquí.</p>`;
    return { titulo: r.nombre, sub: (igual(r.d, HOY) ? 'Hoy' : esc(fdl(r.d))) + ' · ' + esc(r.hora) + ' · ' + r.personas + ' personas', mod: 'calendario', obj: r, registro: 'Reserva ' + r.nombre,
      tags: [[A.estadoTag(r.estado).replace(/<[^>]+>/g, ''), r.estado === 'por_confirmar' ? 'aviso' : r.estado === 'confirmada' ? 'ok' : ''], ...(r.abono && !r.abonoOk ? [['Falta el abono', 'aviso']] : []), ...(a.estado === 'no_salio' ? [['El aviso no salió', 'alerta']] : []), ...(a.estado === 'apagado' ? [['Aviso al grupo apagado', '']] : [])],
      aviso: a.estado === 'no_salio' && ed ? `<p class="nota alerta">${ic('alerta', 's')}<span><b>El último aviso no le llegó al grupo.</b> Más abajo está listo para copiarlo y mandarlo a mano.</span></p>` : '',
      bloques: [{ titulo: 'Reserva', filas: [{ l: 'Día', v: esc(fdl(r.d)), campo: campoDia }, { l: 'Hora', v: esc(r.hora), campo: futura && pendiente ? { k: 'hora', tipo: 'select', opciones: HORAS } : undefined }, { l: 'Personas', v: r.personas, campo: { k: 'personas', tipo: 'numero', entero: true, obligatorio: true } }, { l: 'Dónde', v: esc(r.area), campo: { k: 'area', tipo: 'select', opciones: ['Salón', 'Terraza', 'Salón privado', 'Barra'] } }, { l: 'Mesa', v: esc(r.mesa || '—'), campo: { k: 'mesa', tipo: 'texto' } }, { l: 'Ocasión', v: esc(r.ocasion || '—'), campo: { k: 'ocasion', tipo: 'texto' } }, { l: 'Notas para el equipo', v: esc(r.notas || '—'), largo: true, campo: { k: 'notas', tipo: 'area' } }, { l: 'Estado', v: A.estadoTag(r.estado), campo: marcada ? undefined : { k: 'estado', tipo: 'select', opciones: estadosEditar(r, marcada) } }] },
        { titulo: 'Cliente', filas: [{ l: 'Teléfono', v: ed ? esc(r.tel || '—') : '<span class="tenue">Solo quien toma reservas</span>' }, { l: 'Llegó por', v: esc(r.canal) }, { l: 'Ha venido antes', v: r.visitas ? r.visitas + (r.visitas === 1 ? ' vez' : ' veces') : 'Primera vez' }, { l: 'La tomó', v: esc(r.tomo) }, ...(r.recordado || r.confirmo ? [{ l: 'Recordatorio', v: marcasTag(r) }] : [])] },
        r.abono ? { titulo: 'Abono', html: abonoHtml } : { oculto: true },
        // cada mensaje real que le llegó al grupo (nueva, cambio, anulada…), con su hora
        { titulo: tituloAviso, html: waLista(r) },
        ...(futura && ed && pendiente ? [{ html: recordatorioHtml(r) }] : [])],
      // mientras se edita: si la mesa (en ese día y esa hora) ya la tiene otra reserva, lo dice en rojo debajo de la casilla Mesa (vivoDe), el
      // botón pasa a «Guardar igual y avisar al grupo» y la ventana del motivo repite la línea roja, como en la reserva nueva
      vivoDe: 'mesa',
      vivo: leer => avisoMesa(choqueEd(leer)),
      guardarTxt: leer => marcada || !choqueEd(leer).length ? '' : avisosOn() ? 'Guardar igual y avisar al grupo' : 'Guardar igual sin avisar al grupo',
      notaGuardar: leer => { const ch = choqueEd(leer); return ch.length ? `<p class="nota alerta">${ic('alerta', 's')}<span><b>Mesa repetida:</b> ${ch.map(c => esc(choqueTxt(c))).join('; ')}.</span></p>` : ''; },
      acciones: acc, pieNota: desde ? `${ic('reloj', 'xs')}«No vino» se puede marcar desde las ${desde}.` : '',
      // marcada (llegó o no vino): el estado se cambia con «Reabrir»; al editar quedan los datos de la reserva, y eso no avisa al grupo
      editarTono: marcada ? 'sec' : undefined,
      guardar: guardarRes,
      // la confirmación usa el verbo del botón y dice si la mesa quedó repetida (lo mismo queda en el registro de cambios)
      guardado: () => {
        if (marcada) return 'Guardado. Quedó en el registro de cambios.';
        const a2 = avisoDe(r); const ch = a2.sinSenal ? [] : choquesDe({ fecha: r.d, hora: r.hora, mesa: r.mesa, area: r.area }, r.id); const rep = ch.length ? ', con la mesa repetida: ' + ch.map(choqueTxt).join('; ') : '';
        return a2.estado === 'apagado' ? 'Guardado' + rep + '. El aviso al grupo está apagado.' : a2.sinSenal ? 'Guardado en el teléfono' + rep + '. El aviso al grupo sale cuando vuelva la señal.' : 'Guardado y avisado al grupo «' + D.GRUPO_MESONEROS.nombre + '»' + rep + '. (Simulado)';
      },
      // el aviso dice lo que pasó: «Reserva confirmada», «Reserva por confirmar» o, si cambió la hora, las personas, el lugar o las notas,
      // «Cambio en la reserva» (anular, Llegó y No vino van por sus botones, con «No, dejarla» y «Deshacer»)
      alGuardar: cambios => {
        if (marcada) return; const ce = cambios.find(c => c.r.campo.k === 'estado');
        avisar(r, ce ? ({ confirmada: 'Reserva confirmada', por_confirmar: 'Reserva por confirmar', cancelada: 'Reserva anulada' }[ce.nuevo] || 'Cambio en la reserva') : 'Cambio en la reserva');
        // con la mesa repetida, el registro de cambios lo dice en lo que se guardó
        const ch = A.sinRed() ? [] : choquesDe({ fecha: r.d, hora: r.hora, mesa: r.mesa, area: r.area }, r.id);
        if (ch.length) { const au = D.AUDITORIA.find(x => x.registro === 'Reserva ' + r.nombre); if (au) au.despues += ' · con la mesa repetida: ' + ch.map(choqueTxt).join('; '); }
      } };
  };
  // el estado que se puede escoger al editar: en una reserva por venir, solo Confirmada o Por confirmar (anular, Llegó y No vino tienen
  // sus botones); una anulada se puede volver a activar; al «Corregir» una ya marcada, todos los que valen para ese día
  const estadosEditar = (r, marcada) => {
    const todos = [['confirmada', 'Confirmada'], ['por_confirmar', 'Por confirmar'], ['llego', 'Llegó'], ['no_vino', 'No vino'], ['cancelada', 'Anulada']];
    if (!marcada) return todos.filter(([k]) => k === 'confirmada' || k === 'por_confirmar' || k === r.estado);
    return todos.filter(([k]) => k === r.estado || (k === 'no_vino' ? puedeNoVino(r) : k === 'llego' ? dif(r.d) <= 0 : true));
  };
  FICHAS.evento = id => {
    const e = D.EVENTOS_AG.find(x => x.id === id); const total = e.personas * e.porPersona; const plata = e.tipo === 'privado' && verPlata(); const ed = puede('calendario', 'editar');
    return { titulo: e.nombre, sub: esc(fdl(e.d)) + ' · ' + esc(e.hora), mod: 'calendario', obj: e, registro: 'Evento ' + e.nombre,
      tags: [[A.estadoTag(e.estado).replace(/<[^>]+>/g, ''), e.estado === 'presupuesto' ? 'aviso' : 'ok'], [e.tipo === 'propio' ? 'Del restaurante' : 'Privado', 'info']],
      bloques: [{ titulo: 'Evento', filas: [{ l: 'Cuándo', v: esc(fdl(e.d)) + ' · ' + esc(e.hora) }, ...(e.personas ? [{ l: 'Personas', v: e.personas, campo: { k: 'personas', tipo: 'numero', entero: true, obligatorio: true } }] : []), { l: e.tipo === 'propio' ? 'Qué es' : 'Cliente', v: esc(e.cliente) }, { l: e.tipo === 'propio' ? 'Detalle' : 'Menú', v: esc(e.menu), largo: true, campo: { k: 'menu', tipo: 'area' } }, { l: 'Estado', v: A.estadoTag(e.estado), campo: { k: 'estado', tipo: 'select', opciones: [['confirmado', 'Confirmado'], ['presupuesto', 'Presupuesto enviado'], ['cancelada', 'Anulado']] } }] },
        plata ? { titulo: 'Plata', html: `<dl class="kv"><div><dt>Por persona</dt><dd>${dinero(e.porPersona, 'usd')}</dd></div><div><dt>Total</dt><dd>${dinero(total, 'usd', 0)}</dd></div><div><dt>Abono</dt><dd>${e.abono ? dinero(e.abono, 'usd', 0) : 'Sin abono'}</dd></div><div class="total"><dt><b>Se cobra el día del evento</b></dt><dd>${dinero(total - e.abono, 'usd', 0)}</dd></div></dl>${e.abonoVia ? `<p class="muted">${esc(e.abonoVia)}.</p>` : ''}` } : { oculto: true },
        // quien solo mira ve la lista de tareas como dato: sin botones que no responden
        { titulo: 'Tareas', html: `<ul class="tareas">${e.tareas.map(([t, h], k) => `<li class="${h ? 'hecha' : ''}">${ed ? `<button data-acc="ev-tarea" data-arg="${e.id}|${k}" aria-pressed="${h}">${ic(h ? 'check' : 'reloj', 's')}<span>${esc(t)}</span></button>` : `<span class="tarea">${ic(h ? 'check' : 'reloj', 's')}<span>${esc(t)}<span class="sr-only">${h ? ', hecha' : ', pendiente'}</span></span></span>`}</li>`).join('')}</ul>` },
        // con la regla «Eventos» apagada, los avisos no salen: lo dice aquí y «Avisar al grupo» lleva candado
        reglaGrupo('eventos') ? { titulo: 'Avisos', tiempo: [[esc(fdl(sumar(e.d, -7))), 'Aviso al grupo de mesoneros y a Compras (7 días antes).'], [esc(fdl(e.d)), 'Aviso del día a las 11:00.']] } : { titulo: 'Avisos', html: apagadoHtml('El aviso de eventos') }],
      acciones: (e.tipo === 'privado' && !e.abono ? [{ txt: 'Registrar el abono', acc: 'pronto', icono: 'mas', solo: 'editar' }] : []).concat([{ txt: 'Avisar al grupo', acc: 'res-avisar', icono: 'enviar', solo: 'editar', bloq: !reglaGrupo('eventos') }]) };
  };
  FICHAS.agendadia = id => {
    const [d, m] = id.split('-').map(Number); const its = itemsDia([d, m], true);
    return { titulo: fLarga([d, m])[0].toUpperCase() + fLarga([d, m]).slice(1), sub: 'Calendario', mod: 'calendario', obj: {},
      bloques: [{ html: its.length ? `<ul class="lista">${its.map(x => `<li>${x.abrir || x.ir ? `<button class="fila" ${x.abrir ? `data-abrir="${x.abrir}"` : `data-ir="${x.ir}"`}>` : '<div class="fila">'}<span class="lead ${['info', 'evento', 'lila', 'ok', 'alerta'].includes(x.tono.split(' ')[0]) ? x.tono.split(' ')[0] : ''}">${ic(x.icono)}</span><span class="medio"><b>${esc(x.largo)}</b></span><span class="fin">${x.abrir || x.ir ? ic('derecha', 's chev') : ''}</span>${x.abrir || x.ir ? '</button>' : '</div>'}</li>`).join('')}</ul>` : '<p class="muted">Nada este día.</p>' },
        // un día que ya pasó no recibe reservas nuevas
        ...(puede('calendario', 'editar') && dif([d, m]) >= 0 ? [{ html: `<button class="btn sec" data-acc="res-dia" data-arg="${d}-${m}">${ic('mas', 's')}Nueva reserva este día</button>` }] : [])] };
  };
  ACC['res-dia'] = arg => { C.form = { ...formVacio(), fecha: arg }; C.hecho = null; A.cerrarFicha(); A.ir('calendario/nueva'); };
  void leerNum; void fmt;
  // la misma regla del botón, al tocarlo (A.regla): quien solo mira el módulo, o no tiene ese permiso, no llega a la acción
  A.reglaAcc(['res-estado', 'res-deshacer', 'res-reabrir', 'ev-tarea', 'res-avisar', 'wa-mandado', 'res-guardar', 'res-wa', 'res-copiar', 'res-confirmo', 'aviso-grupo', 'rf-mesa'], { mod: 'calendario' });
})();
