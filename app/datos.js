/* Datos INVENTADOS para el prototipo. Ningún número, RIF, cuenta ni monto es real. */
window.DB = (() => {
  const HOY = { iso: '2026-10-05', largo: 'Lunes 5 de octubre', corto: 'lun 5 oct', hora: '14:05' };
  const TASA = { usd: 612.40, eur: 718.95, usdt: 948.10 };
  const r2 = n => Math.round(n * 100) / 100;
  const pct = (monto, p) => Math.round(Math.round(monto * 100) * p / 100) / 100; // el p % de un monto, redondeado al céntimo

  /* ---------- personas, roles y permisos ---------- */
  const ROLES = {
    dueno: { nombre: 'Dueño', desc: 'Ve todo, aprueba sin límite y maneja usuarios y parámetros.' },
    contabilidad: { nombre: 'Contabilidad', desc: 'Carga y corrige facturas, pagos, bancos y lo fiscal del día a día. Revisa la nómina.' },
    socia: { nombre: 'Edición del dinero (por confirmar)', desc: 'Edita lo operativo del dinero. Por confirmar con Alejandro.' }, // el nombre no adelanta la Q4 (si las cuentas a su nombre son del negocio)
    consulta: { nombre: 'Consulta (socio)', desc: 'Ve todo lo del negocio sin poder cambiar nada. Puede registrar su propio retiro de la bóveda.' },
    fiscal_externo: { nombre: 'Contadora externa', desc: 'Llena todo lo fiscal, lee los bancos y ve la nómina agrupada.' },
    rrhh: { nombre: 'Recursos humanos', desc: 'Ficha del personal, expedientes y prepara la nómina.' },
    compras: { nombre: 'Compras', desc: 'Ve proveedores, facturas y el radar de precios.' },
    reservas: { nombre: 'Reservas y eventos', desc: 'Solo el calendario: toma reservas, arma eventos y avisa al grupo de mesoneros. Ve las vacaciones y los cumpleaños del personal, nada de plata.' },
  };
  // niveles: '' no ve · v ve · g ve agrupado (sin sueldos por persona) · e crea, edita y anula · a aprueba y edita
  // nómina tiene pasos: p prepara · r revisa · a aprueba (visto final)
  const MODULOS = [
    ['inicio', 'Inicio y pendientes'], ['calendario', 'Calendario, reservas y eventos'], ['caja', 'Caja del día'], ['clientes', 'Clientes y cobranza'],
    ['pagos', 'Pagos de los lunes'], ['proveedores', 'Proveedores y facturas'], ['personal', 'Personal, asistencia y vacaciones'], ['nomina', 'Nómina, préstamos y prestaciones'],
    ['boveda', 'Bóveda'], ['cajachica', 'Caja chica y socios'], ['bancos', 'Bancos y conciliación'], ['tasas', 'Tasas'],
    ['fiscal', 'Fiscal'], ['analisis', 'Análisis'], ['documentos', 'Documentos'],
    ['usuarios', 'Usuarios y permisos'], ['parametros', 'Parámetros'], ['auditoria', 'Registro de cambios'], ['salud', 'Salud del sistema'],
  ];
  const PERMISOS = {
    dueno:          { inicio: 'a', calendario: 'a', caja: 'v', clientes: 'a', pagos: 'a', proveedores: 'a', personal: 'a', nomina: 'a', boveda: 'a', cajachica: 'a', bancos: 'a', tasas: 'a', fiscal: 'a', analisis: 'a', documentos: 'a', usuarios: 'a', parametros: 'a', auditoria: 'v', salud: 'v' },
    contabilidad:   { inicio: 'e', calendario: 'v', caja: 'v', clientes: 'e', pagos: 'e', proveedores: 'e', personal: 'v', nomina: 'r', boveda: 'e', cajachica: 'e', bancos: 'e', tasas: 'e', fiscal: 'e', analisis: 'v', documentos: 'e', usuarios: '', parametros: 'e', auditoria: 'v', salud: 'v' },
    socia:          { inicio: 'e', calendario: 'e', caja: 'v', clientes: 'e', pagos: 'e', proveedores: 'e', personal: 'g', nomina: 'g', boveda: 'e', cajachica: 'e', bancos: 'e', tasas: 'v', fiscal: 'v', analisis: 'v', documentos: 'e', usuarios: '', parametros: 'v', auditoria: '', salud: '' },
    consulta:       { inicio: 'v', calendario: 'v', caja: 'v', clientes: 'v', pagos: 'v', proveedores: 'v', personal: 'g', nomina: 'g', boveda: 'v', cajachica: 'v', bancos: 'v', tasas: 'v', fiscal: 'v', analisis: 'v', documentos: 'v', usuarios: '', parametros: 'v', auditoria: '', salud: '' },
    fiscal_externo: { inicio: 'v', calendario: '', caja: '', clientes: 'v', pagos: '', proveedores: 'v', personal: '', nomina: 'g', boveda: '', cajachica: '', bancos: 'v', tasas: 'v', fiscal: 'e', analisis: '', documentos: 'v', usuarios: '', parametros: '', auditoria: '', salud: '' },
    rrhh:           { inicio: 'v', calendario: 'v', caja: '', clientes: '', pagos: '', proveedores: '', personal: 'e', nomina: 'p', boveda: '', cajachica: '', bancos: '', tasas: 'v', fiscal: '', analisis: '', documentos: 'v', usuarios: '', parametros: '', auditoria: '', salud: '' },
    reservas:       { inicio: 'v', calendario: 'e', caja: '', clientes: '', pagos: '', proveedores: '', personal: '', nomina: '', boveda: '', cajachica: '', bancos: '', tasas: '', fiscal: '', analisis: '', documentos: '', usuarios: '', parametros: '', auditoria: '', salud: '' },
    compras:        { inicio: 'v', calendario: 'v', caja: '', clientes: '', pagos: '', proveedores: 'v', personal: '', nomina: '', boveda: '', cajachica: '', bancos: '', tasas: 'v', fiscal: '', analisis: 'v', documentos: 'v', usuarios: '', parametros: '', auditoria: '', salud: '' },
  };
  const USUARIOS = [
    { id: 'alejandro', nombre: 'Alejandro', apellido: '', rol: 'dueno', correo: 'alejandro@ejemplo.com', estado: 'activo', ultimo: 'Hoy 7:38 · iPhone', dosfa: true, extra: [], tabs: ['inicio', 'caja', 'pagos', 'boveda'] },
    { id: 'jose', nombre: 'Jose', apellido: '', rol: 'contabilidad', correo: 'jose@ejemplo.com', estado: 'activo', ultimo: 'Hoy 7:12 · computadora', dosfa: true, extra: [], tabs: ['inicio', 'caja', 'pagos', 'fiscal'] },
    { id: 'eliana', nombre: 'Eliana', apellido: '', rol: 'socia', correo: 'eliana@ejemplo.com', estado: 'por_confirmar', confirmar: 'Alejandro todavía no decide si Eliana edita o solo ve. Así se vería si edita.', ultimo: 'Nunca ha entrado', dosfa: false, extra: [], tabs: ['inicio', 'caja', 'pagos', 'boveda'] },
    { id: 'luis', nombre: 'Luis Roberto', apellido: '', rol: 'consulta', correo: 'luis@ejemplo.com', estado: 'activo', ultimo: 'Ayer 21:05 · iPhone', dosfa: true, extra: ['Registrar su propio retiro de la bóveda'], tabs: ['inicio', 'caja', 'boveda', 'analisis'] },
    { id: 'cecilia', nombre: 'Cecilia', apellido: '', rol: 'fiscal_externo', correo: 'cecilia@ejemplo.com', estado: 'aprendiz', aprendiz: 'hasta el 12 de octubre', ultimo: 'Vie 2 oct · computadora', dosfa: true, extra: [], tabs: ['inicio', 'fiscal', 'bancos', 'documentos'] },
    { id: 'andreina', nombre: 'Andreina', apellido: '', rol: 'rrhh', correo: 'andreina@ejemplo.com', estado: 'invitada', ultimo: 'Invitación enviada el 3 oct', dosfa: false, extra: [], tabs: ['inicio', 'personal', 'asistencia', 'nomina'] },
    { id: 'manuel', nombre: 'Manuel', apellido: '', rol: 'compras', correo: 'manuel@ejemplo.com', estado: 'activo', ultimo: 'Sáb 3 oct · Android', dosfa: true, extra: [], tabs: ['inicio', 'proveedores', 'analisis', 'tasas'] },
    { id: 'patricia', nombre: 'Patricia', apellido: 'Reyes', rol: 'reservas', correo: 'patricia@ejemplo.com', estado: 'por_confirmar', confirmar: 'Propuesta: la supervisora toma las reservas y arma los eventos. Alejandro decide si se le da usuario.', ultimo: 'Nunca ha entrado', dosfa: false, extra: [], tabs: ['inicio', 'calendario'] },
  ];
  // modo: directo (escribe solo) · propone (una persona aprueba) · si_cuadra (la excepción de la bóveda, 3 oct: registra al instante si todo cuadra)
  const SERVICIO = [
    { id: 's1', nombre: 'n8n-tasas', tipo: 'bot', responsable: 'Alejandro', puede: 'Cargar las tasas del BCV y del USDT', modo: 'directo', vence: '31 dic 2026', ultimo: 'Hoy 7:30' },
    { id: 's2', nombre: 'bot-caja', tipo: 'bot', responsable: 'Alejandro', puede: 'Registrar los pagos de clientes del grupo Caja', modo: 'directo', vence: '31 dic 2026', ultimo: 'Hoy 7:31' },
    { id: 's3', nombre: 'bot-boveda', tipo: 'bot', responsable: 'Jose', puede: 'Registrar las fotos del grupo de bóveda: al instante si todo cuadra, a nombre de quien mandó la foto y marcado «sin doble factor». Si algo falla, queda «por revisar»', modo: 'si_cuadra', vence: '31 dic 2026', ultimo: 'Todavía no se usa: el grupo está por crear' },
    { id: 's4', nombre: 'agente-facturas', tipo: 'agente', responsable: 'Jose', puede: 'Proponer facturas leídas de las fotos. Nunca aprueba.', modo: 'propone', vence: '30 nov 2026', ultimo: 'Ayer 18:20' },
  ];
  const LIMITES = [
    { id: 'l1', que: 'Salidas de la bóveda', quien: 'Jose', hasta: 200, mon: 'usd', arriba: 'Alejandro' },
    { id: 'l2', que: 'Devoluciones a clientes', quien: 'Jose', hasta: 100, mon: 'usd', arriba: 'Alejandro' },
    { id: 'l3', que: 'Crédito a un cliente', quien: 'Jose o Luis', hasta: 100, mon: 'usd', arriba: 'Alejandro' },
    { id: 'l4', que: 'Lote de pagos del lunes', quien: 'Solo Alejandro', hasta: null, mon: 'usd', arriba: '—' },
    { id: 'l5', que: 'Ajuste de una factura', quien: 'Jose', hasta: 50, mon: 'usd', arriba: 'Alejandro' },
    { id: 'l6', que: 'Gasto de caja chica', quien: 'Jose', hasta: 40, mon: 'usd', arriba: 'Alejandro' },
    { id: 'l7', que: 'Préstamo a un empleado', quien: 'Solo Alejandro', hasta: null, mon: 'usd', arriba: '—' },
    { id: 'l8', que: 'Adelanto de quincena (propuesta)', quien: 'Jose', cond: 'si lo anota otra persona (si lo anota él, Alejandro)', hasta: 60, mon: 'usd', arriba: 'Alejandro' }, // quien prepara no aprueba
  ];
  const SESIONES = [
    { id: 'se1', disp: 'iPhone · Safari', donde: 'Valencia', desde: 'Hoy 7:38', actual: true },
    { id: 'se2', disp: 'Mac · Chrome', donde: 'Valencia', desde: 'Ayer 22:10', actual: false },
  ];

  /* ---------- cuentas del negocio ---------- */
  const CUENTAS = [
    { id: 'BVCA', nombre: 'Venezolano · Alejandro', tipo: 'Banco', mon: 'bs', num: '•••• 4821', titular: 'Alejandro', saldo: 2184330.15, ultimo: 'Hoy 7:31' },
    { id: 'BVCE', nombre: 'Venezolano · Eliana', tipo: 'Banco', mon: 'bs', num: '•••• 7305', titular: 'Eliana', saldo: 935410.80, ultimo: 'Ayer 22:40' },
    { id: 'BVCJ', nombre: 'Venezolano · la empresa', tipo: 'Banco', mon: 'bs', num: '•••• 1196', titular: 'La empresa', saldo: 1408220.42, ultimo: 'Hoy 6:58' },
    { id: 'BNC', nombre: 'BNC · Alejandro', tipo: 'Banco', mon: 'bs', num: '•••• 6640', titular: 'Alejandro', saldo: 512006.30, ultimo: 'Ayer 19:12' },
    { id: 'ZEL', nombre: 'Zelle del negocio', tipo: 'Zelle', mon: 'usd', num: 'correo •••@ejemplo.com', titular: 'Socio en EE. UU.', saldo: 1462.30, ultimo: 'Ayer 20:15' },
    { id: 'BIN', nombre: 'Binance del negocio', tipo: 'Binance', mon: 'usdt', num: 'alias «Restaurante»', titular: 'Alejandro', saldo: 2310.44, ultimo: 'Ayer 21:48' },
    { id: 'BOV', nombre: 'Bóveda de dólares', tipo: 'Efectivo', mon: 'usd', num: '—', titular: 'Custodia: Jose', saldo: 0, ultimo: 'Sáb 3 oct' }, // el saldo sale de los billetes de la bóveda (abajo)
    { id: 'CCH', nombre: 'Caja chica', tipo: 'Efectivo', mon: 'usd', num: '—', titular: 'Custodia: Jose', saldo: 86.50, ultimo: 'Sáb 3 oct' },
  ];

  /* ---------- caja del día ---------- */
  const CAJA = [
    { id: 'c1', hora: '13:42', banco: 'Banesco', tipo: 'Pago móvil', monto: 33812.47, mon: 'bs', estado: 'por_confirmar', motivo: 'La foto dice «en proceso»', ref: '000012871903', cajera: 'Caja 1', fuente: 'Captura', destino: 'BVCA', cerro: '—' },
    { id: 'c2', hora: '13:38', banco: 'Mercantil', tipo: 'Pago móvil', monto: 5214.30, mon: 'bs', estado: 'por_confirmar', motivo: 'Mercantil no manda correo', ref: '31580946', cajera: 'Caja 2', fuente: 'Captura', destino: 'BVCA', cerro: '—' },
    { id: 'c3', hora: '13:31', banco: 'Zelle', tipo: 'Zelle', monto: 46.20, mon: 'usd', estado: 'confirmado', motivo: '', ref: 'M. Pérez', cajera: 'Caja 1', fuente: 'Correo del banco', destino: 'ZEL', cerro: 'El bot' },
    { id: 'c4', hora: '13:20', banco: 'Binance', tipo: 'USDT', monto: 24.60, mon: 'usdt', estado: 'confirmado', motivo: '', ref: 'Orden 4402…118', cajera: 'Caja 2', fuente: 'Correo de Binance', destino: 'BIN', cerro: 'El bot' },
    { id: 'c5', hora: '13:05', banco: 'Venezolano', tipo: 'Pago móvil', monto: 19877.35, mon: 'bs', estado: 'confirmado', motivo: '', ref: '007431562', cajera: 'Caja 1', fuente: 'Reacción ✅ de Jose', destino: 'BVCA', cerro: 'Jose', doble: true },
    { id: 'c6', hora: '12:54', banco: 'Provincial', tipo: 'Transferencia', monto: 17290.84, mon: 'bs', estado: 'avisado', motivo: 'Pasaron 20 min sin correo: el bot avisó al grupo', ref: '000015208', cajera: 'Caja 2', fuente: 'Captura', destino: 'BVCJ', cerro: '—' },
    { id: 'c7', hora: '12:51', banco: 'Mercantil', tipo: 'Pago móvil', monto: 38604.15, mon: 'bs', estado: 'por_confirmar', motivo: 'Mercantil no manda correo', ref: '58817230', cajera: 'Caja 1', fuente: 'Captura', destino: 'BVCA', cerro: '—' },
    { id: 'c8', hora: '12:47', banco: 'BNC', tipo: 'Pago móvil', monto: 9120.00, mon: 'bs', estado: 'confirmado', motivo: '', ref: '0918273', cajera: 'Caja 2', fuente: 'Leído de la captura', destino: 'BNC', cerro: 'El bot' },
    { id: 'c9', hora: '12:40', banco: 'Banesco', tipo: 'Pago móvil', monto: 28945.66, mon: 'bs', estado: 'por_confirmar', motivo: 'No se leyó la referencia: el bot pidió los datos a la cajera', ref: '¿?', cajera: 'Caja 1', fuente: 'Captura', destino: 'BVCA', cerro: '—' },
    { id: 'c10', hora: '12:22', banco: 'Venezolano', tipo: 'Pago móvil', monto: 15890.40, mon: 'bs', estado: 'confirmado', motivo: '', ref: '007412203', cajera: 'Caja 2', fuente: 'Correo del banco', destino: 'BVCA', cerro: 'El bot' },
    { id: 'c11', hora: '12:10', banco: 'Bancaribe', tipo: 'Pago móvil', monto: 12240.00, mon: 'bs', estado: 'confirmado', motivo: '', ref: '33019287', cajera: 'Caja 1', fuente: 'Correo del banco', destino: 'BVCA', cerro: 'El bot' },
    { id: 'c13', hora: '11:40', banco: '—', tipo: 'Foto', monto: 0, mon: 'bs', estado: 'descartado', motivo: 'No era un comprobante: foto del fondo de caja', ref: '—', cajera: 'Caja 1', fuente: 'Captura', destino: '—', cerro: 'El bot (lectura 3 de 3)' },
    { id: 'c12', hora: '11:58', banco: 'Zelle', tipo: 'Zelle', monto: 58.90, mon: 'usd', estado: 'confirmado', motivo: '', ref: 'A. Rojas', cajera: 'Caja 2', fuente: 'Correo del banco', destino: 'ZEL', cerro: 'El bot' },
  ];

  /* ---------- pendientes ---------- */
  const PENDIENTES = [
    { id: 'pe1', para: ['alejandro', 'jose'], tipo: 'alerta', titulo: '4 pagos por confirmar en Caja', sub: 'El más viejo es de las 12:40', de: 'El bot', edad: '1 h', ir: 'caja' },
    { id: 'pe2', para: ['alejandro'], tipo: 'alerta', titulo: 'Un proveedor cambió de cuenta', sub: 'Hortalizas El Valle · pide tu código', de: 'Jose', edad: '3 días', ir: 'pagos', prov: 'p4' },
    { id: 'pe18', para: ['alejandro'], tipo: 'alerta', titulo: 'Una persona del personal cambió de cuenta', sub: 'Yohana Blanco · confírmala con ella antes de pagarle el 15', de: 'Andreina', edad: '4 días', ir: 'pagos', sub2: 'nomina', emp: 'e5' },
    { id: 'pe3', para: ['alejandro'], tipo: 'info', titulo: 'Aprobar una devolución a un cliente', sub: '$ 25,00 por un pago doble · la preparó Jose', de: 'Jose', edad: '1 día', abrir: 'devcliente:dc1' },
    { id: 'pe4', para: ['alejandro', 'manuel'], tipo: 'escalado', titulo: 'No llegó la reposición del queso', sub: 'Subió a ti hace 2 días · era de Manuel', de: 'Manuel', edad: '4 días', abrir: 'devolucion:dv1' },
    { id: 'pe5', para: ['cecilia', 'jose', 'alejandro'], tipo: 'aviso', titulo: 'IVA de la 2.ª quincena de septiembre', sub: 'Vence mañana · Jose tiene que revisarlo', de: 'Cecilia', edad: 'Hoy', abrir: 'obligacion:o1' },
    { id: 'pe6', para: ['cecilia', 'jose'], tipo: 'aviso', titulo: 'Faltan 2 reportes Z de septiembre', sub: 'Días 13 y 27 · sin el Z no cierra el libro de ventas', de: 'La app', edad: '2 días', ir: 'fiscal', sub2: 'z' },
    { id: 'pe7', para: ['alejandro', 'jose', 'cecilia'], tipo: 'alerta', titulo: 'Inspección de la máquina fiscal vencida', sub: 'Venció el 28 de septiembre', de: 'La app', edad: '7 días', abrir: 'maquina:m1' },
    { id: 'pe8', para: ['andreina', 'jose', 'alejandro'], tipo: 'aviso', titulo: 'Preparar la nómina del 15 de octubre', sub: 'Falta el reporte del reloj', de: 'La app', edad: 'Hoy', ir: 'nomina' },
    { id: 'pe9', para: ['jose', 'alejandro'], tipo: 'aviso', titulo: 'Subir el estado de cuenta de septiembre del BNC', sub: 'Los otros 3 bancos ya están conciliados', de: 'La app', edad: '3 días', ir: 'bancos' },
    { id: 'pe10', para: ['manuel', 'alejandro'], tipo: 'info', titulo: 'El queso telita subió 9 %', sub: 'Quesera Los Andes · otro proveedor lo vendió 6 % más barato', de: 'Radar de precios', edad: 'Hoy', ir: 'analisis' },
    { id: 'pe12', para: ['alejandro'], tipo: 'info', titulo: 'Aprobar un préstamo de $ 200', sub: 'Rosa Medina · 4 cuotas de $ 50 · está en período de prueba', de: 'Jose', edad: 'Hoy', abrir: 'prestamo:pr4' },
    { id: 'pe13', para: ['alejandro', 'jose'], tipo: 'alerta', titulo: 'La liquidación de Gabriela Núñez vence hoy', sub: 'Renunció el 30 sep · hay 5 días para pagarla · $ 237,60', de: 'La app', edad: 'Hoy', abrir: 'liquidacion:lq1' },
    { id: 'pe14', para: ['andreina', 'alejandro'], tipo: 'aviso', titulo: 'Clasificar la falta de Kevin Torres', sub: 'Sáb 3 oct · avisó que estaba enfermo, falta el justificativo', de: 'La app', edad: '2 días', abrir: 'falta:fa1' },
    { id: 'pe15', para: ['jose'], tipo: 'aviso', titulo: 'Revisar 3 redobles de esta quincena', sub: 'Kevin, José Gregorio y Jhonny · entran en la nómina del 15', de: 'La app', edad: 'Hoy', ir: 'asistencia', sub2: 'redobles' },
    { id: 'pe17', para: ['jose'], tipo: 'info', titulo: 'Facturas leídas por el agente', sub: '3 fotos de facturas · apruébalas, corrígelas o recházalas', de: 'agente-facturas', edad: 'Ayer', abrir: 'facagente:lote' },
    { id: 'pe16', para: ['patricia', 'alejandro'], tipo: 'aviso', titulo: 'Falta el abono de Inversiones Delta', sub: 'Almuerzo de 12 personas mañana a la 13:00 · abono de $ 60', de: 'La app', edad: 'Hoy', abrir: 'reserva:rs3' },
    { id: 'pe11', para: ['luis', 'alejandro'], tipo: 'info', titulo: 'Tu retiro del sábado quedó registrado', sub: '$ 500 · propuesta (Q5): se descuenta del reparto de utilidades', de: 'La app', edad: '2 días', ir: 'cajachica', sub2: 'socios' },
  ];

  /* ---------- proveedores, facturas, devoluciones ---------- */
  // cada proveedor puede tener varias cuentas (29 ago): banco, número tapado y titular (el nombre que sale en el banco)
  // otro: el titular no es el nombre del proveedor · nueva: está por verificar (quién y cuándo la puso) · baja: ya no se usa
  // la deuda de cada uno se calcula abajo con el saldo de sus facturas
  const PROVEEDORES = [
    { id: 'p1', nombre: 'Carnes La Pradera', cat: 'Proteína', rif: 'J-40000101-1', plazo: 7, cuentas: [{ banco: 'Venezolano', num: '•••• 1101', titular: 'Carnes La Pradera, C.A.' }], contacto: 'Ramón (0414-000-0001)', estado: 'al_dia' },
    { id: 'p2', nombre: 'Quesera Los Andes', cat: 'Lácteos', rif: 'J-40000102-2', plazo: 7, cuentas: [{ banco: 'Banesco', num: '•••• 2202', titular: 'Quesera Los Andes, C.A.' }], contacto: 'Marta (0424-000-0002)', estado: 'al_dia' },
    { id: 'p3', nombre: 'Distribuidora Central de Bebidas', cat: 'Bebidas', rif: 'J-40000103-3', plazo: 15, cuentas: [{ banco: 'Mercantil', num: '•••• 3303', titular: 'Distribuidora Central de Bebidas, C.A.' }], contacto: 'Oficina (0241-000-0003)', estado: 'vencida' },
    { id: 'p4', nombre: 'Hortalizas El Valle', cat: 'Vegetales', rif: 'V-10000104-4', plazo: 0, cuentas: [
      { banco: 'Provincial', num: '•••• 4404', titular: 'Pedro Lugo', otro: true, nota: 'el dueño: es persona natural', nueva: 'Jose la cambió el jueves 1 con su código' },
      { banco: 'Provincial', num: '•••• 9001', titular: 'Pedro Lugo', otro: true, baja: 'Jose la cambió por la 4404 el jueves 1' }], contacto: 'Pedro (0412-000-0004)', estado: 'cuenta_nueva' },
    { id: 'p5', nombre: 'Empaques del Centro', cat: 'Empaques', rif: 'J-40000105-5', plazo: 10, cuentas: [{ banco: 'BNC', num: '•••• 5505', titular: 'Empaques del Centro, C.A.' }], contacto: 'Ventas (0241-000-0005)', estado: 'al_dia' },
    { id: 'p6', nombre: 'Gas Carabobo', cat: 'Servicios', rif: 'J-40000106-6', plazo: 0, cuentas: [{ banco: 'Venezolano', num: '•••• 6606', titular: 'Gas Carabobo, C.A.' }], contacto: 'Despacho (0241-000-0006)', estado: 'al_dia' },
    { id: 'p7', nombre: 'Panadería San José', cat: 'Panadería', rif: 'J-40000107-7', plazo: 7, cuentas: [{ banco: 'Bancaribe', num: '•••• 7707', titular: 'Panadería San José, C.A.' }], contacto: 'José (0414-000-0007)', estado: 'al_dia' },
    { id: 'p8', nombre: 'Pollos El Granjero', cat: 'Proteína', rif: 'J-40000108-8', plazo: 7, cuentas: [{ banco: 'Banesco', num: '•••• 8808', titular: 'Pollos El Granjero, C.A.' }], contacto: 'Luisa (0424-000-0008)', estado: 'al_dia' },
    { id: 'p9', nombre: 'Frutería La Esquina', cat: 'Vegetales', rif: 'V-10000109-9', plazo: 0, cuentas: [{ banco: 'Banesco', num: 'pago móvil 0414-•••-0009', titular: 'Ana Rodríguez', otro: true, nota: 'la dueña: cobra a su nombre' }], contacto: 'Ana (0414-000-0009)', estado: 'al_dia' },
    { id: 'p10', nombre: 'Frío Total (mantenimiento)', cat: 'Servicios', rif: 'J-40000110-0', plazo: 15, cuentas: [{ banco: 'Venezolano', num: '•••• 1010', titular: 'Frío Total, C.A.' }], contacto: 'Técnico (0412-000-0010)', estado: 'vencida' },
    { id: 'p11', nombre: 'Limpieza Integral', cat: 'Limpieza', rif: 'J-40000111-1', plazo: 0, cuentas: [{ banco: 'BNC', num: '•••• 1111', titular: 'Limpieza Integral, C.A.' }], contacto: 'Ventas (0241-000-0011)', estado: 'al_dia' },
    { id: 'p12', nombre: 'Charcutería Don Pepe', cat: 'Proteína', rif: 'J-40000112-2', plazo: 10, cuentas: [
      { banco: 'Mercantil', num: '•••• 1212', titular: 'Charcutería Don Pepe, C.A.' },
      { banco: 'Banesco', num: '•••• 5521', titular: 'José Pérez', otro: true, nota: 'el dueño: a veces cobra a su nombre' }], contacto: 'Pepe (0414-000-0012)', estado: 'al_dia' },
  ];
  // saldo = lo que se le debe al proveedor: el monto menos las retenciones, que se le pagan al SENIAT (3 oct)
  // f1, f3 y f9 ya tienen su retención de IVA y f11 la de ISLR (ver RET_EMITIDAS abajo: se enlazan con «ret» y «retIslr»)
  // pago: en qué lote y desde qué cuenta se pagó (lo pone el envío del lote del lunes)
  const FACTURAS = [
    { id: 'f1', prov: 'p1', num: 'A-004512', control: '00-118204', fecha: '28 sep', vence: '5 oct', monto: 980.00, saldo: 878.62, estado: 'abierta', origen: 'Odoo' },
    { id: 'f2', prov: 'p1', num: 'A-004533', control: '00-118260', fecha: '30 sep', vence: '7 oct', monto: 860.00, saldo: 860.00, estado: 'abierta', origen: 'Odoo' },
    { id: 'f3', prov: 'p2', num: '000781', control: '00-020781', fecha: '27 sep', vence: '4 oct', monto: 342.50, saldo: 307.07, estado: 'ajustada', origen: 'Odoo', ajuste: { campo: 'Monto', antes: 362.50, despues: 342.50, motivo: 'Devolvimos 2 kg de queso telita en mal estado', quien: 'Jose', cuando: 'Jue 1 oct 15:20' } },
    { id: 'f4', prov: 'p2', num: '000790', control: '00-020790', fecha: '1 oct', vence: '8 oct', monto: 270.00, saldo: 270.00, estado: 'abierta', origen: 'Odoo' },
    { id: 'f5', prov: 'p3', num: 'F-22019', control: '01-772019', fecha: '17 sep', vence: '2 oct', monto: 1120.00, saldo: 1120.00, estado: 'vencida', origen: 'Odoo' },
    { id: 'f6', prov: 'p4', num: '0112', control: 'sin control', fecha: '3 oct', vence: '3 oct', monto: 238.10, saldo: 238.10, estado: 'abierta', origen: 'Odoo', alerta: 'La factura no trae número de control' },
    { id: 'f7', prov: 'p8', num: 'PG-1180', control: '00-551180', fecha: '29 sep', vence: '6 oct', monto: 512.40, saldo: 512.40, estado: 'abierta', origen: 'Odoo' },
    { id: 'f8', prov: 'p8', num: 'PG-1191', control: '00-551191', fecha: '2 oct', vence: '9 oct', monto: 452.40, saldo: 452.40, estado: 'abierta', origen: 'Odoo' },
    { id: 'f9', prov: 'p12', num: 'DP-3301', control: '00-903301', fecha: '25 sep', vence: '5 oct', monto: 1263.00, saldo: 1132.34, estado: 'abierta', origen: 'Odoo' },
    { id: 'f10', prov: 'p12', num: 'DP-3322', control: '00-903322', fecha: '30 sep', vence: '10 oct', monto: 1000.00, saldo: 1000.00, estado: 'abierta', origen: 'Odoo' },
    { id: 'f11', prov: 'p10', num: '000044', control: '00-000044', fecha: '15 sep', vence: '30 sep', monto: 450.00, saldo: 442.24, estado: 'vencida', origen: 'Odoo' }, // 450,00 − 7,76 de retención de ISLR
    { id: 'f12', prov: 'p5', num: 'E-8812', control: '00-338812', fecha: '26 sep', vence: '6 oct', monto: 312.40, saldo: 312.40, estado: 'abierta', origen: 'Odoo' },
    { id: 'f13', prov: 'p7', num: '1201', control: '00-001201', fecha: '28 sep', vence: '5 oct', monto: 96.00, saldo: 96.00, estado: 'abierta', origen: 'Odoo' },
    { id: 'f14', prov: 'p6', num: 'G-7710', control: '00-447710', fecha: '4 oct', vence: '4 oct', monto: 180.00, saldo: 180.00, estado: 'abierta', origen: 'Odoo' },
    { id: 'f15', prov: 'p9', num: '0088', control: 'sin control', fecha: '4 oct', vence: '4 oct', monto: 74.30, saldo: 74.30, estado: 'abierta', origen: 'Odoo' },
    { id: 'f16', prov: 'p11', num: 'L-2290', control: '00-112290', fecha: '3 oct', vence: '3 oct', monto: 268.90, saldo: 268.90, estado: 'abierta', origen: 'Odoo' },
    { id: 'f17', prov: 'p1', num: 'A-004480', control: '00-118150', fecha: '21 sep', vence: '28 sep', monto: 1120.00, saldo: 0, estado: 'pagada', origen: 'Odoo', pago: { lote: '28 sep', cta: 'BVCA', antes: 1120.00 } },
  ];
  PROVEEDORES.forEach(p => { p.deuda = r2(FACTURAS.filter(f => f.prov === p.id).reduce((s, f) => s + f.saldo, 0)); });
  // facturas que el agente leyó de las fotos: los agentes proponen (3 oct), así que no entran a las facturas hasta que Jose o Alejandro las aprueben
  // leido: lo que leyó el agente · si alguien corrige un dato, la ficha deja lo leído tachado al lado
  const FAC_AGENTE = [
    { id: 'fa1', prov: 'p5', num: 'E-8857', control: '00-338857', fecha: '3 oct', vence: '13 oct', monto: 197.20, leida: 'Ayer 18:20', estado: 'propuesta', lectura: 'Leyó todo. Base $ 170,00 + IVA $ 27,20 = $ 197,20: cuadra.' },
    { id: 'fa2', prov: 'p7', num: '1219', control: '00-001219', fecha: '4 oct', vence: '11 oct', monto: 1152.00, leida: 'Ayer 18:20', estado: 'propuesta', duda: 'El monto es 10 veces lo que suele facturar este proveedor (unos $ 100). Revisa la coma en la foto.' },
    { id: 'fa3', prov: 'p1', num: 'A-004533', control: '00-118260', fecha: '30 sep', vence: '7 oct', monto: 860.00, leida: 'Ayer 18:20', estado: 'propuesta', duda: 'Ya está en las facturas: llegó con la copia de Odoo del domingo.', repetida: 'f2' },
  ];
  FAC_AGENTE.forEach(x => { x.leido = { num: x.num, control: x.control, fecha: x.fecha, monto: x.monto }; });
  const DEVOLUCIONES = [
    { id: 'dv1', prov: 'p2', fecha: 'Jue 1 oct', que: '4 kg de queso telita', monto: 40.00, trato: 'Repone la mitad (2 kg); el resto es merma', estado: 'esperando', dias: 4, quien: 'Manuel' },
    { id: 'dv2', prov: 'p8', fecha: 'Lun 28 sep', que: '6 kg de pechuga con mal olor', monto: 33.60, trato: 'Repone todo', estado: 'repuesta', dias: 0, quien: 'Manuel' },
  ];

  /* ---------- pagos del lunes ---------- */
  // m: lo que se le paga = el saldo de sus facturas abiertas, ya sin las retenciones de IVA e ISLR (esa parte va al SENIAT)
  // c: la cuenta de donde salió · cap: lo que dice su captura, en $ a la tasa de ese pago (capBs si la captura dice otra cifra en Bs)
  // cta: la cuenta del proveedor a la que se paga; si falta, la primera que sigue en uso
  const LUNES = [
    { p: 'p1', f: '2 facturas', v: 'Hoy', m: 1738.62, c: 'BVCA', cap: 1738.62 },   // 1.840,00 − 101,38 de retención de IVA
    { p: 'p2', f: '2 facturas', v: 'Hoy', m: 577.07, c: 'BVCE', cap: 577.07 },     // 612,50 − 35,43
    { p: 'p3', f: '1 factura', v: 'Hace 3 días', tarde: true, m: 1120.00, c: 'BVCJ', capBs: 680000 }, // se pagó redondeado en Bs: la captura no da los 1.120,00
    { p: 'p4', f: '1 factura', v: 'Hoy', m: 238.10, c: null },                      // su cuenta nueva está por verificar: no se puede marcar
    { p: 'p5', f: '1 factura', v: 'Mañana', m: 312.40, c: 'BVCA', cap: 312.40 },
    { p: 'p6', f: '1 factura', v: 'Hoy', m: 180.00, c: null },
    { p: 'p7', f: '1 factura', v: 'Hoy', m: 96.00, c: 'BVCE', cap: 96.00 },
    { p: 'p8', f: '2 facturas', v: 'Mañana', m: 964.80, c: 'BVCA', cap: 964.80, duda: 'pollos' },
    { p: 'p9', f: '1 factura', v: 'Hoy', m: 74.30, c: null },
    { p: 'p10', f: '1 factura', v: 'Hace 5 días', tarde: true, m: 442.24, c: 'BVCJ', cap: 442.24 }, // 450,00 − 7,76 de retención de ISLR
    { p: 'p11', f: '1 factura', v: 'Hoy', m: 268.90, c: null },
    { p: 'p12', f: '2 facturas', v: 'Hoy', m: 2132.34, c: 'BVCJ', cap: 2132.34, cta: 'Banesco •••• 5521' }, // 2.263,00 − 130,66 · se le pagó a la cuenta del dueño
  ];
  LUNES.forEach(l => {
    if (l.capBs) l.cap = r2(l.capBs / TASA.usd);
    if (!l.cta) { const c = PROVEEDORES.find(p => p.id === l.p).cuentas.find(x => !x.baja); l.cta = c.banco + ' ' + c.num; }
  });

  /* ---------- clientes y cobranza ---------- */
  // mon: la moneda de los cargos · lo que consumen sale a precio de carta, que está en euros: la deuda va en € y un abono en Bs se convierte con el euro BCV del día
  // credito: el límite, en dólares (la moneda base de la app)
  const CLIENTES = [
    { id: 'k1', nombre: 'Constructora Delta', tipo: 'Empresa', esp: true, rif: 'J-50000201-1', credito: 600, dias: 30, saldo: 482.40, mon: 'eur', antig: 34, ultimo: '1 sep', contacto: 'Administración', consiente: false },
    { id: 'k2', nombre: 'Clínica Los Mangos', tipo: 'Empresa', esp: true, rif: 'J-50000202-2', credito: 400, dias: 15, saldo: 215.00, mon: 'eur', antig: 12, ultimo: '22 sep', contacto: 'Compras', consiente: false },
    { id: 'k3', nombre: 'Laura Méndez', tipo: 'Cliente habitual', esp: false, rif: 'V-20000203-3', credito: 100, dias: 15, saldo: 64.20, mon: 'eur', antig: 19, ultimo: '27 sep', contacto: '0414-000-0203', consiente: true },
    { id: 'k4', nombre: 'Carlos Ibarra', tipo: 'Cliente habitual', esp: false, rif: 'V-20000204-4', credito: 100, dias: 15, saldo: 84.50, mon: 'eur', antig: 63, ultimo: '1 ago', contacto: '0424-000-0204', consiente: true },
    { id: 'k5', nombre: 'Colegio San Ignacio (eventos)', tipo: 'Empresa', esp: false, rif: 'J-50000205-5', credito: 800, dias: 30, saldo: 0, mon: 'eur', antig: 0, ultimo: '28 sep', contacto: 'Dirección', consiente: false },
    { id: 'k6', nombre: 'Rosa Pacheco', tipo: 'Cliente habitual', esp: false, rif: 'V-20000206-6', credito: 50, dias: 15, saldo: 31.00, mon: 'eur', antig: 92, ultimo: '4 jul', contacto: '0412-000-0206', consiente: true },
  ];
  const DEVCLIENTES = [
    { id: 'dc1', cliente: 'Pago doble de un cliente de mesa', monto: 25.00, motivo: 'Pagó por pago móvil y también en efectivo', preparo: 'Jose', estado: 'por_aprobar' },
  ];

  /* ---------- bóveda, caja chica, socios ---------- */
  const BOVEDA = {
    conteo: 'Jueves 1 de octubre, con testigo. Cuadró.',
    denoms: [[100, 98], [50, 34], [20, 41], [10, 15], [5, 12], [1, 30]],
    // aNombre: de quién es el movimiento · sinDosfa: llegó por el grupo de bóveda, con foto y leyenda pero sin código: lo registra el bot a nombre de quien mandó la foto
    // ejemplo: el grupo de bóveda está por crear; b3 muestra cómo llegará lo que se mande por ahí
    movs: [
      { id: 'b1', tipo: 'salida', titulo: 'Retiro de Luis', sub: 'Sáb 3 oct 18:05 · desde la app · 5 billetes', monto: -500, estado: 'ok', via: 'App con código', aNombre: 'Luis Roberto', seriales: ['MB 44591022 A', 'MF 10293847 C', 'PL 55820193 B', 'MB 77120934 D', 'ME 30918275 A'] },
      { id: 'b5', tipo: 'salida', titulo: 'Por rendir · Manuel', sub: 'Sáb 3 oct 9:40 · Jose, desde la app · 2 billetes', monto: -200, estado: 'ok', via: 'App con código', aNombre: 'Manuel (la registró Jose)', seriales: [] },
      { id: 'b2', tipo: 'entrada', titulo: 'Entrada del cierre', sub: 'Vie 2 oct 23:40 · Jose · 14 billetes', monto: 1140, estado: 'ok', via: 'App con código', aNombre: 'Jose', seriales: [] },
      { id: 'b3', tipo: 'salida', titulo: 'Pago a proveedor', sub: 'Ejemplo del grupo de bóveda · 1 serial sin leer', monto: -800, estado: 'revisar', via: 'Grupo de WhatsApp (sin doble factor)', aNombre: 'Jose', sinDosfa: true, ejemplo: true, nota: 'Ejemplo: así llegará cuando exista el grupo', seriales: [] },
      { id: 'b4', tipo: 'conteo', titulo: 'Conteo con testigo', sub: 'Jue 1 oct · Jose y Luis', monto: 0, estado: 'ok', via: 'App', aNombre: 'Jose, con Luis Roberto de testigo', seriales: [] },
    ],
  };
  // el saldo se calcula con los billetes, nunca se teclea: al sacar, meter o devolver un vuelto se mueven los billetes y el total los sigue
  Object.defineProperty(BOVEDA, 'total', { enumerable: true, get() { return this.denoms.reduce((s, [d, n]) => s + d * n, 0); } });
  Object.defineProperty(CUENTAS.find(c => c.id === 'BOV'), 'saldo', { enumerable: true, get: () => BOVEDA.total });
  const CAJACHICA = {
    fondo: 150, saldo: 86.50, reposicion: 'cada lunes',
    gastos: [
      { id: 'g1', fecha: 'Sáb 3 oct', que: 'Hielo (4 bolsas)', monto: 12.00, quien: 'Jose', soporte: true, estado: 'ok' },
      { id: 'g2', fecha: 'Sáb 3 oct', que: 'Taxi para buscar gas', monto: 8.00, quien: 'Jose', soporte: false, estado: 'sin_soporte' },
      { id: 'g3', fecha: 'Vie 2 oct', que: 'Limones (mercado)', monto: 18.50, quien: 'Manuel', soporte: true, estado: 'ok' },
      { id: 'g4', fecha: 'Jue 1 oct', que: 'Bombillos para el baño', monto: 25.00, quien: 'Jose', soporte: true, estado: 'ok' },
    ],
  };
  // la parte de cada socio está por confirmar (Q4): el prototipo no la inventa · lo que cada uno tiene por rendir sale de POR_RENDIR
  const SOCIOS = [
    { id: 'so1', nombre: 'Alejandro', pct: null, retirado: 1200 },
    { id: 'so2', nombre: 'Luis Roberto', pct: null, retirado: 1748 },
  ];
  // solo retiros: la plata que alguien se lleva para pagar algo va aparte, en POR_RENDIR
  const RETIROS = [
    { id: 'r1', socio: 'Luis Roberto', fecha: 'Sáb 3 oct', monto: 500, de: 'Bóveda', para: 'Retiro personal', via: 'App con código' },
    { id: 'r2', socio: 'Alejandro', fecha: 'Mié 30 sep', monto: 400, de: 'Bóveda', para: 'Retiro personal', via: 'App con código' },
    { id: 'r4', socio: 'Luis Roberto', fecha: 'Jue 1 oct', monto: 48, de: 'Consumo de septiembre', para: 'Lo que pasó del tope de consumo ($ 548 de $ 500)', via: 'Cierre automático del mes' },
  ];
  // plata que alguien se lleva para pagar algo: se cierra con las facturas o con el vuelto, que registran Jose o Alejandro a nombre de quien rinde
  const POR_RENDIR = [
    { id: 'ren1', quien: 'Luis Roberto', usuario: 'luis', fecha: 'Lun 28 sep', dias: 7, de: 'Bóveda', via: 'App con código (la registró Jose)', para: 'Pagar al técnico del aire', monto: 300, facturas: [], vuelto: 0 },
    { id: 'ren2', quien: 'Manuel', usuario: 'manuel', fecha: 'Sáb 3 oct', dias: 2, de: 'Bóveda', via: 'App con código (la registró Jose)', para: 'Comprar carne en el mercado (reposición de urgencia)', monto: 200, facturas: [{ que: 'Carne de res, 22 kg (mercado)', monto: 165, fecha: 'Sáb 3 oct', quien: 'Jose', foto: true }], vuelto: 0 },
  ];
  POR_RENDIR.forEach(x => { x.estado = x.monto - x.facturas.reduce((s, f) => s + f.monto, 0) - x.vuelto > 0.005 ? 'abierta' : 'rendida'; });

  /* ---------- bancos y conciliación ---------- */
  const CONCILIACION = [
    { id: 'BVCA', mes: 'Septiembre', estado: 'conciliada', sinComp: 0, sinBanco: 0, sinId: 0, subido: 'Jue 1 oct', por: 'Jose' },
    { id: 'BVCE', mes: 'Septiembre', estado: 'conciliada', sinComp: 0, sinBanco: 0, sinId: 0, subido: 'Jue 1 oct', por: 'Jose' },
    { id: 'BVCJ', mes: 'Septiembre', estado: 'diferencias', sinComp: 2, sinBanco: 1, sinId: 3, subido: 'Vie 2 oct', por: 'Jose' },
    { id: 'BNC', mes: 'Septiembre', estado: 'falta', sinComp: 0, sinBanco: 0, sinId: 0, subido: '—', por: '—' },
  ];
  const DIFERENCIAS = [
    { id: 'd1', cuenta: 'BVCJ', tipo: 'Salió sin comprobante', fecha: '12 sep', desc: 'Transferencia a «Servicios Técnicos 2020»', monto: 145.00 },
    { id: 'd2', cuenta: 'BVCJ', tipo: 'Salió sin comprobante', fecha: '23 sep', desc: 'Comisión del banco', monto: 3.20 },
    { id: 'd3', cuenta: 'BVCJ', tipo: 'Comprobante que no aparece en el banco', fecha: '28 sep', desc: 'Pago a Frío Total ref. 00419921', monto: 450.00 },
    { id: 'd4', cuenta: 'BVCJ', tipo: 'Entró sin identificar', fecha: '14 sep', desc: 'Pago móvil de 0412-•••-4410', monto: 61.30 },
    { id: 'd5', cuenta: 'BVCJ', tipo: 'Entró sin identificar', fecha: '19 sep', desc: 'Transferencia de «Inversiones R&M»', monto: 220.00 },
    { id: 'd6', cuenta: 'BVCJ', tipo: 'Entró sin identificar', fecha: '29 sep', desc: 'Pago móvil de 0424-•••-9902', monto: 18.40 },
  ];

  /* ---------- personal y nómina ---------- */
  const EMPLEADOS = []; // se llena en datos-gente.js
  const NOMINA = {
    proxima: { fecha: 'Jueves 15 de octubre', personas: 49, paso: 'preparar', formal: { personas: 10, total: 3940 }, interna: { personas: 39, total: 10380 }, falta: 'El reporte del reloj (Excel)' },
    // cada fecha de pago lleva sus corridas por separado (29-ago): la formal (va a los entes), la interna y, con la 2.ª quincena,
    // el 10 % del mes, en euros a la tasa euro BCV · el premio del mes va en su propia corrida, con el ganador escogido a mano
    // tasa: dólar BCV del día de pago (la misma de NOMINA_FORMAL) · el total del 10 % de septiembre sale de la bolsa (datos-gente.js)
    // formalEur: lo que se llevaron las 10 personas de la nómina formal en esa corrida del 10 % (entra en las bases de los aportes):
    // el 6,9 % de la comisión, de un 23,4 % repartido (BOLSA en datos-gente.js) · en septiembre, € 9.120 × 6,9 % = € 629,28
    corridas: [
      { id: 'n1f', fecha: '30 sep', grupo: '2.ª quincena de septiembre', tipo: 'formal', personas: 10, total: 3940.00, mon: 'usd', tasa: 604.95, estado: 'pagada' },
      { id: 'n1i', fecha: '30 sep', grupo: '2.ª quincena de septiembre', tipo: 'interna', personas: 39, total: 10344.80, mon: 'usd', tasa: 604.95, estado: 'pagada' },
      { id: 'n1d', fecha: '30 sep', grupo: '2.ª quincena de septiembre', tipo: 'diez', mes: 'septiembre', periodo: '28 ago al 27 sep', personas: 49, total: null, mon: 'eur', tasaEur: 701.30, tasa: 604.95, formalEur: 629.28, estado: 'pagada' },
      { id: 'n1p', fecha: '30 sep', grupo: '2.ª quincena de septiembre', tipo: 'premio', mes: 'septiembre', personas: 1, total: 40.00, mon: 'usd', tasa: 604.95, ganador: 'e3', escogio: 'Alejandro', motivo: 'Cero descuadres en su caja en todo el mes', estado: 'pagada' },
      { id: 'n2f', fecha: '15 sep', grupo: '1.ª quincena de septiembre', tipo: 'formal', personas: 10, total: 3940.00, mon: 'usd', tasa: 589.12, estado: 'pagada' },
      { id: 'n2i', fecha: '15 sep', grupo: '1.ª quincena de septiembre', tipo: 'interna', personas: 38, total: 10270.00, mon: 'usd', tasa: 589.12, estado: 'pagada' },
      { id: 'n3f', fecha: '31 ago', grupo: '2.ª quincena de agosto', tipo: 'formal', personas: 10, total: 3940.00, mon: 'usd', tasa: 566.20, estado: 'pagada' },
      { id: 'n3i', fecha: '31 ago', grupo: '2.ª quincena de agosto', tipo: 'interna', personas: 39, total: 10315.60, mon: 'usd', tasa: 566.20, estado: 'pagada' },
      { id: 'n3d', fecha: '31 ago', grupo: '2.ª quincena de agosto', tipo: 'diez', mes: 'agosto', periodo: '28 jul al 27 ago', personas: 49, total: 2046.30, mon: 'eur', tasaEur: 681.40, tasa: 566.20, formalEur: 603.40, estado: 'pagada' },
    ],
    // el premio de octubre se paga el 31 en su propia corrida: el ganador lo escoge Alejandro a mano (la app no lo calcula)
    premio: { mes: 'octubre', paga: '31 oct', monto: 40, ganador: null, motivo: '', escogio: '' },
  };
  // pagar la nómina por el mismo camino que los proveedores (3 oct): Andreina sube el reporte de pago en Nómina, en el orden en que se paga
  // (primero la corrida formal y después la interna, cada una por banco), y la lista sale en Pagos › Pagar la nómina
  // ejemplo a medio pagar con la pre-nómina estimada del 15 de octubre: el monto de cada línea es el neto de su recibo (13 de las 49 personas)
  // c: la cuenta de donde salió · cap: la captura dice el neto · capBs: la captura dice otra cifra en Bs (se pagó redondeado)
  const PAGO_NOMINA = {
    fecha: 'Jueves 15 de octubre', corto: '15 oct',
    reporte: { archivo: 'Reporte de pago 15 oct (ejemplo).xlsx', subio: 'Andreina', cuando: 'Ejemplo con la pre-nómina estimada' },
    lineas: [
      { e: 'e1', c: 'BVCJ', cap: true }, { e: 'e7', c: 'BVCJ', cap: true }, { e: 'e12', c: 'BVCJ', cap: false }, { e: 'e2', c: null },
      { e: 'e4', c: 'BVCA', cap: true }, { e: 'e10', c: 'BVCA', cap: true }, { e: 'e13', c: 'BVCA', capBs: 170000 }, { e: 'e8', c: null },
      { e: 'e6', c: null }, { e: 'e9', c: null }, { e: 'e5', c: null }, { e: 'e3', c: null }, { e: 'e11', c: null },
    ],
  };

  /* ---------- fiscal ---------- */
  // nómina formal (10 personas): lo pagado en Bs a la tasa BCV de cada día de pago (inventado)
  // el salario es el mínimo (Bs 130 al mes) · el 10 % de servicio es salario · el incremento del cestaticket es un bono que no es salario
  // en septiembre la nómina no trajo recargos de noche ni de domingo: llegan con el motor de nómina (desde la quincena del 15 de octubre)
  // diezEur: la parte de la nómina formal en el 10 % de cada mes, en euros, con la tasa euro BCV del día en que se pagó (la de agosto y septiembre es la de su corrida)
  const corridaDiez = id => NOMINA.corridas.find(c => c.id === id);
  const NOMINA_FORMAL = {
    personas: 10, minimo: 130, pisoUsd: 240, tasaPago: 604.95, // piso de pensiones por persona (Parámetros) · tasa BCV del último pago (30 sep)
    diezEur: { jul: [588.60, 655.20], ago: [corridaDiez('n3d').formalEur, corridaDiez('n3d').tasaEur], sep: [corridaDiez('n1d').formalEur, corridaDiez('n1d').tasaEur] },
  };
  const NF = NOMINA_FORMAL, diezBs = m => r2(NF.diezEur[m][0] * NF.diezEur[m][1]);
  NF.sep = { minimo: 1300, incremento: 4703335.80, diez: diezBs('sep') }; // quincenas de $ 3.940 a Bs 589,12 (15 sep) y 604,95 (30 sep), menos el mínimo · 10 %: € 629,28 a Bs 701,30
  NF.t3 = { minimo: 3900, diez: r2(diezBs('jul') + diezBs('ago') + diezBs('sep')), utilidades: 0 }; // el 10 % de julio, agosto y septiembre · las utilidades se pagan en diciembre
  // cada aporte con su propia base, en Bs · el id es el de su obligación en OBLIGACIONES (u05 no tiene: se configura aparte)
  const normalSep = NF.sep.minimo + NF.sep.diez, pisoSep = r2(NF.personas * NF.pisoUsd * NF.tasaPago);
  const PARAFISCALES = [
    { id: 'o8', ente: 'Pensiones (9 %)', pct: 9, periodo: 'septiembre', base: Math.max(r2(NF.sep.minimo + NF.sep.incremento + NF.sep.diez), pisoSep), piso: pisoSep, corto: 'Septiembre · salario + bonos · piso de $ 240 por persona', que: 'Todo lo pagado en el mes: salario mínimo, incremento del cestaticket y 10 %, a la tasa BCV de cada pago. Nadie quedó por debajo del piso de $ 240.', parte: 'Lo paga todo el negocio', vence: '22 oct' },
    { id: 'o4', ente: 'IVSS y paro forzoso (16,5 %)', pct: 16.5, periodo: 'septiembre', base: NF.sep.minimo, corto: 'Septiembre · salario mínimo con tope · 12 % el negocio y 4,5 % el trabajador', que: '10 salarios mínimos de Bs 130. El tope es de 5 salarios mínimos por persona (10 en el paro forzoso). Da céntimos, igual que lo que descuenta el recibo.', parte: 'Negocio 12 % (IVSS 10 % y paro 2 %) · trabajador 4,5 % (IVSS 4 % y paro 0,5 %), se le descuenta en el recibo', nota: 'Base exacta: pregunta 8 a Cecilia', vence: '9 oct' },
    { id: 'o5', ente: 'FAOV (3 %)', pct: 3, periodo: 'septiembre', base: r2(normalSep * (1 + 15 / 360 + 30 / 360)), corto: 'Septiembre · salario integral · 2 % el negocio y 1 % el trabajador', que: 'Salario integral: salario mínimo y 10 %, más la parte del bono vacacional (15 días) y de las utilidades (30 días). No tiene tope. Los recargos de noche y de domingo también entran cuando se paguen (en septiembre no hubo).', parte: 'Negocio 2 % · trabajador 1 %. Al trabajador se le descuenta en cada recibo: el de la quincena (sobre su salario) y el del 10 % (sobre su parte del 10 %)', vence: '9 oct' },
    { id: 'o3', ente: 'INCES (2 %)', pct: 2, periodo: 'julio a septiembre', base: r2(NF.t3.minimo + NF.t3.diez), corto: 'Julio a septiembre · salario normal', que: 'Salario normal del trimestre: salario mínimo y 10 %. El incremento del cestaticket no entra.', parte: 'Lo paga todo el negocio', vence: 'Hoy' },
    { id: 'u05', ente: 'INCES (0,5 % de las utilidades)', pct: 0.5, periodo: 'julio a septiembre', base: NF.t3.utilidades, corto: 'Se le retiene a cada trabajador al pagarle las utilidades · en el trimestre no hubo', vence: 'Diciembre', conf: 'INCES 0,5 % de las utilidades' },
  ];
  PARAFISCALES.forEach(p => { p.monto = pct(p.base, p.pct); });
  const montoDe = id => PARAFISCALES.find(p => p.id === id).monto;
  // ventas del libro, en Bs y sin IVA (la parte que se declara; las del POS en dólares van en Análisis)
  // facturas a empresas, con el RIF del cliente: las tres son de la 2.ª quincena de septiembre
  const VENTAS_EMPRESAS = [
    { id: 'fv1', fecha: '18 sep', num: '00004410', cliente: 'Constructora Delta', base: 420000.00, iva: 67200.00, esp: true, retencion: 'Esperando su comprobante' },
    { id: 'fv2', fecha: '22 sep', num: '00004433', cliente: 'Clínica Los Mangos', base: 310000.00, iva: 49600.00, esp: true, retencion: 'Recibido: 37.200,00' },
    { id: 'fv3', fecha: '28 sep', num: '00004461', cliente: 'Colegio San Ignacio', base: 250000.00, iva: 40000.00, esp: false, retencion: 'No retiene' },
  ];
  const baseEmp = r2(VENTAS_EMPRESAS.reduce((s, v) => s + v.base, 0)), ivaEmp = r2(VENTAS_EMPRESAS.reduce((s, v) => s + v.iva, 0));
  // consumidor final (la suma de los Z) y exento de cada quincena de septiembre
  const VENTAS_SEP = { q1: { final: 18007000.00, exento: 389000.00 }, q2: { final: 18234000.00, exento: 442000.00 } };
  const LIBRO_VENTAS = { mes: 'septiembre', final: r2(VENTAS_SEP.q1.final + VENTAS_SEP.q2.final), empresas: baseEmp, ivaEmpresas: ivaEmp, exento: r2(VENTAS_SEP.q1.exento + VENTAS_SEP.q2.exento) };
  LIBRO_VENTAS.ivaFinal = pct(LIBRO_VENTAS.final, 16);
  // patente: se paga en Bs · el 4 % de las ventas del mes en el libro (sin IVA) o el mínimo de 20 euros BCV, lo que sea mayor
  const PATENTE = { mes: 'septiembre', ventas: r2(LIBRO_VENTAS.final + LIBRO_VENTAS.empresas + LIBRO_VENTAS.exento), pct: 4, minimoEur: 20, vence: '20 de octubre' };
  PATENTE.cuatro = pct(PATENTE.ventas, PATENTE.pct); PATENTE.minimo = r2(PATENTE.minimoEur * TASA.eur); PATENTE.monto = Math.max(PATENTE.cuatro, PATENTE.minimo);
  // aseo urbano: tarifa mensual del IMA en euros (sale de los m² del local y del tipo de actividad), a la tasa euro BCV
  const ASEO = { eur: 18 }; ASEO.monto = r2(ASEO.eur * TASA.eur);
  // la 1.ª quincena de septiembre, ya declarada y pagada (o9): débito de sus ventas − crédito de sus compras = IVA; no quedó excedente
  // la retención de IVA a proveedores es el 75 % de ese crédito; el anticipo de ISLR, el 1 % de los ingresos (ventas y exento)
  const IVA_Q1 = { credito: 202824.53, igtf: 210480.00 };
  IVA_Q1.iva = r2(pct(VENTAS_SEP.q1.final, 16) - IVA_Q1.credito);
  IVA_Q1.anticipo = pct(VENTAS_SEP.q1.final + VENTAS_SEP.q1.exento, 1);
  IVA_Q1.retProv = pct(IVA_Q1.credito, 75);
  IVA_Q1.total = r2(IVA_Q1.iva + IVA_Q1.igtf + IVA_Q1.anticipo + IVA_Q1.retProv);
  // pensiones de agosto (o10): las quincenas de $ 3.940 a Bs 548,60 (15 ago) y 566,20 (31 ago) y la parte formal del 10 % de agosto
  const pensionesAgo = pct(r2(3940 * 548.60 + 3940 * 566.20 + diezBs('ago')), 9);

  // fechas de octubre 2026 del calendario SENIAT para RIF terminado en 4 (públicas)
  const OBLIGACIONES = [
    // o1: el monto es el total de la planilla y lo recalcula la hoja de IVA (pantallas-fiscal.js)
    { id: 'o1', nombre: 'IVA + anticipo ISLR + IGTF + retenciones de IVA', corto: 'IVA 2.ª quinc. sep', ente: 'SENIAT', periodo: '2026-09 · 2.ª quincena', dia: 6, vence: 'Mar 6 oct', faltan: 1, resp: 'Cecilia', estado: 'revision', monto: 3325008.87, paso: 1 },
    // o2: la suma de las retenciones de ISLR de septiembre (RET_EMITIDAS, abajo)
    { id: 'o2', nombre: 'Retenciones de ISLR de septiembre', corto: 'Ret. ISLR sep', ente: 'SENIAT', periodo: '2026-09', dia: 6, vence: 'Mar 6 oct', faltan: 1, resp: 'Cecilia', estado: 'preparar', monto: null, paso: 0 },
    { id: 'o3', nombre: 'INCES 3.er trimestre', corto: 'INCES T3', ente: 'INCES', periodo: '2026 · T3', dia: 5, vence: 'Hoy, lun 5 oct', faltan: 0, resp: 'Jose', estado: 'lista', monto: montoDe('o3'), paso: 2 },
    { id: 'o4', nombre: 'IVSS y paro forzoso (16,5 %: parte del negocio y del trabajador)', corto: 'IVSS sep', ente: 'IVSS (TIUNA)', periodo: '2026-09', dia: 9, vence: 'Vie 9 oct', faltan: 4, resp: 'Jose', estado: 'preparar', monto: montoDe('o4'), paso: 0 },
    { id: 'o5', nombre: 'FAOV (vivienda)', corto: 'FAOV sep', ente: 'BANAVIH', periodo: '2026-09', dia: 9, vence: 'Vie 9 oct', faltan: 4, resp: 'Jose', estado: 'preparar', monto: montoDe('o5'), paso: 0 },
    { id: 'o6', nombre: 'Patente municipal de septiembre', corto: 'Patente sep', ente: 'Alcaldía de Valencia', periodo: '2026-09', dia: 20, vence: 'Mar 20 oct', faltan: 15, resp: 'Cecilia', estado: 'preparar', monto: PATENTE.monto, paso: 0 },
    { id: 'o7', nombre: 'IVA + anticipo ISLR + IGTF + retenciones de IVA', corto: 'IVA 1.ª quinc. oct', ente: 'SENIAT', periodo: '2026-10 · 1.ª quincena', dia: 22, vence: 'Jue 22 oct', faltan: 17, resp: 'Cecilia', estado: 'abierta', monto: null, paso: 0 },
    { id: 'o8', nombre: 'Pensiones (9 % sobre la nómina formal)', corto: 'Pensiones sep', ente: 'SENIAT', periodo: '2026-09', dia: 22, vence: 'Jue 22 oct', faltan: 17, resp: 'Jose', estado: 'preparar', monto: montoDe('o8'), paso: 0 },
    // o9: IVA 2.678.295,47 + IGTF 210.480,00 + anticipo 183.960,00 + retenciones a proveedores 152.118,40 (IVA_Q1, arriba)
    { id: 'o9', nombre: 'IVA + anticipo ISLR + IGTF + retenciones de IVA', corto: 'IVA 1.ª quinc. sep', ente: 'SENIAT', periodo: '2026-09 · 1.ª quincena', dia: 30, mes: 'sep', vence: 'Mié 30 sep', faltan: -5, resp: 'Cecilia', estado: 'pagada', monto: IVA_Q1.total, paso: 4 },
    // o10: 9 % de Bs 4.803.468,76 (quincenas de $ 3.940 a 548,60 y 566,20, y la parte formal del 10 % de agosto: € 603,40 a 681,40)
    { id: 'o10', nombre: 'Pensiones de agosto', corto: 'Pensiones ago', ente: 'SENIAT', periodo: '2026-08', dia: 16, mes: 'sep', vence: 'Mié 16 sep', faltan: -19, resp: 'Jose', estado: 'pagada', monto: pensionesAgo, paso: 4 },
    // sinPago: solo se declara · soloPago: solo se paga (no hay planilla que preparar)
    // revisa: quién la revisa, si no es la regla de siempre (prepara Jose → revisa Cecilia, y al revés); el RNET lleva sueldos y Cecilia ve la nómina agrupada
    { id: 'o11', nombre: 'Declaración trimestral RNET (3.er trimestre)', corto: 'RNET T3', ente: 'Ministerio del Trabajo', periodo: '2026 · T3', dia: 15, vence: 'Jue 15 oct', faltan: 10, resp: 'Jose', revisa: 'Alejandro', estado: 'preparar', monto: null, sinPago: true, paso: 0 },
    { id: 'o12', nombre: 'Aseo urbano de octubre', corto: 'Aseo oct', ente: 'Alcaldía (IMA)', periodo: '2026-10', dia: 30, vence: 'Vie 30 oct', faltan: 25, resp: 'Jose', estado: 'preparar', monto: ASEO.monto, soloPago: true, paso: 0 },
  ];
  // la 2.ª quincena de septiembre: el crédito de las compras sale del libro de compras de la quincena (abajo, con COMPRAS)
  // excedente: en la 1.ª quincena se pagó IVA, así que no quedó crédito para pasar a esta
  const IVA_HOJA = {
    periodo: '2.ª quincena de septiembre (16 al 30)', vence: 'Mar 6 oct',
    debitos: [['Ventas a consumidor final (los Z)', VENTAS_SEP.q2.final, pct(VENTAS_SEP.q2.final, 16)], ['Facturas a empresas', baseEmp, ivaEmp], ['Alícuota adicional 31 % (lujo: va en cero)', 0, 0]],
    creditos: [], excedente: 0, igtf: 231840.00,
    anticipo: pct(VENTAS_SEP.q2.final + baseEmp + VENTAS_SEP.q2.exento, 1), // 1 % de los ingresos de la quincena
  };
  const ZETAS = [
    { id: 'z30', dia: 30, fecha: 'Mié 30 sep', num: 1488, facturas: 241, base: 1321000.00, iva: 211360.00, exento: 32000.00, igtf: 16420.00, estado: 'confirmado', por: 'Jose' },
    { id: 'z29', dia: 29, fecha: 'Mar 29 sep', num: 1487, facturas: 198, base: 1098000.00, iva: 175680.00, exento: 21000.00, igtf: 14010.00, estado: 'confirmado', por: 'Jose' },
    { id: 'z28', dia: 28, fecha: 'Lun 28 sep', num: 1486, facturas: 176, base: 964000.00, iva: 154240.00, exento: 18000.00, igtf: 12280.00, estado: 'leido', por: '—' },
    { id: 'z27', dia: 27, fecha: 'Dom 27 sep', num: null, facturas: null, base: null, iva: null, exento: null, igtf: null, estado: 'falta', por: '—' },
    { id: 'z26', dia: 26, fecha: 'Sáb 26 sep', num: 1484, facturas: 288, base: 1622000.00, iva: 259520.00, exento: 41000.00, igtf: 20560.00, estado: 'confirmado', por: 'Jose', alerta: 'Salto de número: falta el Z 1485' },
    { id: 'z25', dia: 25, fecha: 'Vie 25 sep', num: 1483, facturas: 262, base: 1490000.00, iva: 238400.00, exento: 36000.00, igtf: 18840.00, estado: 'confirmado', por: 'Jose' },
    { id: 'z13', dia: 13, fecha: 'Dom 13 sep', num: null, facturas: null, base: null, iva: null, exento: null, igtf: null, estado: 'falta', por: '—' },
  ];
  const RET_RECIBIDAS = [
    { id: 'rr1', comp: '20260900001877', cliente: 'Clínica Los Mangos', tipo: 'IVA', monto: 37200.00, periodo: '2026-09', estado: 'por_descontar' },
    { id: 'rr2', comp: '20260900001231', cliente: 'Constructora Delta', tipo: 'IVA', monto: 50400.00, periodo: '2026-09', estado: 'por_descontar' },
    { id: 'rr3', comp: '20260800000945', cliente: 'Constructora Delta', tipo: 'IVA', monto: 36480.00, periodo: '2026-08', estado: 'por_descontar' },
    // las de ISLR rebajan el ISLR del año: esta se usó en el de 2025, que se declaró el 11 de marzo
    { id: 'rr4', comp: '20251100000512', cliente: 'Clínica Los Mangos', tipo: 'ISLR', monto: 6200.00, periodo: '2025-11', estado: 'descontada', usadaEn: 'ISLR de 2025 (declarado el 11 mar)' },
  ];
  // libro de compras en Bs: cada factura (en $) a la tasa BCV vigente el día de la factura
  // (el sábado, el domingo y el lunes vale la que el BCV publicó el viernes) · usd = [base, IVA]
  const COMPRAS = [
    { id: 'lc1', fecha: '28 sep', prov: 'p1', num: 'A-004512', control: '00-118204', tasa: 601.80, usd: [844.83, 135.17], pctRet: 75, comp: '202609-00000041' },
    { id: 'lc2', fecha: '27 sep', prov: 'p2', num: '000781', control: '00-020781', tasa: 601.80, usd: [295.26, 47.24], pctRet: 75, comp: '202609-00000040' },
    { id: 'lc3', fecha: '25 sep', prov: 'p12', num: 'DP-3301', control: '00-903301', tasa: 599.45, usd: [1088.79, 174.21], pctRet: 75, comp: '202609-00000039' },
    { id: 'lc4', fecha: '3 oct', prov: 'p4', num: '0112', control: 'sin control', tasa: 612.40, usd: [205.26, 32.84], pctRet: 100, comp: 'pendiente', alerta: 'Sin número de control: se retiene el 100 %' },
  ];
  COMPRAS.forEach(c => { c.base = r2(c.usd[0] * c.tasa); c.iva = r2(c.usd[1] * c.tasa); c.retenido = pct(c.iva, c.pctRet); });
  // el crédito de la hoja de IVA: el IVA de las compras de la 2.ª quincena de septiembre (16 al 30), que Cecilia escribe desde su libro
  const enQ2 = c => / sep$/.test(c.fecha) && parseInt(c.fecha, 10) >= 16;
  IVA_HOJA.creditos = [['Compras del libro de Cecilia', r2(COMPRAS.filter(enQ2).reduce((s, c) => s + c.base, 0)), r2(COMPRAS.filter(enQ2).reduce((s, c) => s + c.iva, 0))]];
  // las de IVA toman el monto del libro de compras (son las mismas que suma la hoja de IVA); la de ISLR es el 2 % de la base sin IVA, en Bs
  // la de ISLR nace al registrar la factura (pregunta 18 a Cecilia): va en la declaración de retenciones de ISLR de ese mes
  const RET_EMITIDAS = [
    { id: 're1', comp: '202609-00000041', tipo: 'IVA 75 %', prov: 'p1', factura: 'A-004512', estado: 'entregada' },
    { id: 're2', comp: '202609-00000040', tipo: 'IVA 75 %', prov: 'p2', factura: '000781', estado: 'entregada' },
    { id: 're3', comp: '202609-00000039', tipo: 'IVA 75 %', prov: 'p12', factura: 'DP-3301', estado: 'emitida' },
    { id: 're4', comp: 'ISLR-2026-09-012', tipo: 'ISLR 2 % servicios', prov: 'p10', factura: '000044', fecha: '15 sep', periodo: '2026-09', tasa: 589.12, baseUsd: 387.93, pctRet: 2, estado: 'emitida' },
  ];
  RET_EMITIDAS.forEach(r => { const c = COMPRAS.find(x => x.comp === r.comp); if (c) Object.assign(r, { monto: c.retenido, tasa: c.tasa, fecha: c.fecha }); else r.monto = pct(r2(r.baseUsd * r.tasa), r.pctRet); });
  // las retenciones de ISLR de septiembre se declaran juntas (o2)
  OBLIGACIONES.find(o => o.id === 'o2').monto = r2(RET_EMITIDAS.filter(r => r.tipo.startsWith('ISLR') && r.periodo === '2026-09').reduce((s, r) => s + r.monto, 0));
  // las retenciones se le pagan al SENIAT, no al proveedor: cada factura lleva la de IVA en «ret» y la de ISLR en «retIslr», en $ a la tasa
  // del día de la factura (la misma con que se calculó en Bs) · su saldo y la línea del lunes ya vienen sin ellas · la de IVA que falta emitir va en «retPend»
  RET_EMITIDAS.forEach(r => {
    const f = FACTURAS.find(x => x.prov === r.prov && x.num === r.factura); const c = COMPRAS.find(x => x.comp === r.comp);
    if (f) f[r.tipo.startsWith('IVA') ? 'ret' : 'retIslr'] = { id: r.id, comp: r.comp, pct: c ? c.pctRet : r.pctRet || 75, bs: r.monto, tasa: r.tasa, fecha: r.fecha, usd: r2(r.monto / r.tasa) };
  });
  COMPRAS.filter(c => c.comp === 'pendiente').forEach(c => { const f = FACTURAS.find(x => x.prov === c.prov && x.num === c.num); if (f) f.retPend = { pct: c.pctRet, bs: c.retenido, usd: r2(c.retenido / c.tasa) }; });
  const MAQUINAS = [
    { id: 'm1', serial: 'MF-0000-EJEMPLO', modelo: 'Impresora fiscal (Pos&Touch)', ubicacion: 'Caja principal', estado: 'operativa', ultimaZ: 'Z 1488 · 30 sep', inspeccion: '28 sep 2026', vencida: true },
  ];
  const PERMISOS_LIC = [
    { id: 'pl1', nombre: 'Permiso de bomberos', ente: 'Bomberos de Valencia', num: 'BV-0000', vence: '21 oct 2026', faltan: 16, estado: 'por_vencer', aviso: 30 },
    { id: 'pl2', nombre: 'Licencia de licores', ente: 'Alcaldía / SENIAT', num: 'LL-0000', vence: '15 nov 2026', faltan: 41, estado: 'por_vencer', aviso: 30, nota: 'Hay que pedirla 30 días antes' },
    { id: 'pl3', nombre: 'Licencia de actividades económicas', ente: 'Alcaldía de Valencia', num: 'LAE-0000', vence: '10 mar 2028', faltan: 522, estado: 'vigente', aviso: 60 },
    { id: 'pl4', nombre: 'Permiso sanitario', ente: 'Salud (SACS)', num: 'PS-0000', vence: '2 feb 2027', faltan: 120, estado: 'vigente', aviso: 30 },
    { id: 'pl5', nombre: 'Conformidad de uso', ente: 'Alcaldía de Valencia', num: 'CU-0000', vence: 'Sin vencimiento', faltan: null, estado: 'vigente', aviso: 0 },
    { id: 'pl6', nombre: 'Publicidad (aviso del toldo)', ente: 'Alcaldía de Valencia', num: '—', vence: '31 dic 2026', faltan: 87, estado: 'en_tramite', aviso: 30, nota: 'El impuesto va aparte: cada mes, o el año entero antes del 31 mar con 15 % de rebaja' },
  ];
  // [qué, cuánto, estado, pieza] · cada pieza se abre en su ficha (pantallas-fiscal.js)
  const PAQUETE = [
    ['Reportes Z de septiembre', '28 de 30', 'aviso', 'z'],
    ['Facturas a empresas', '3 de 3', 'ok', 'empresas'],
    ['Facturas de proveedores (copia de Odoo)', '184', 'ok', 'compras'],
    ['Retenciones recibidas', '2 nuevas', 'ok', 'retenciones'],
    ['Estados de cuenta', '3 de 4 bancos', 'aviso', 'bancos'],
    ['Nómina formal agrupada por corrida', '3 corridas: 15 sep, 30 sep y el 10 %', 'ok', 'nomina'],
  ];
  const PREGUNTAS = [
    { id: 'q1', texto: '¿Qué recibes cada mes, de quién y cómo?', resp: '', estado: 'abierta' },
    { id: 'q2', texto: '¿En qué programa llevas los libros y declaras? ¿Te sirve un Excel o un TXT?', resp: 'Excel para los libros; el TXT de retenciones lo subo al portal.', estado: 'respondida' },
    { id: 'q3', texto: '¿Hoy se hacen las retenciones de IVA e ISLR? ¿Quién emite el comprobante y en qué número va?', resp: '', estado: 'abierta' },
    { id: 'q4', texto: '¿Cómo separas las facturas con RIF del resumen del Z?', resp: '', estado: 'abierta' },
    { id: 'q5', texto: '¿Aplicas prorrata por las ventas exentas?', resp: '', estado: 'abierta' },
    { id: 'q6', texto: 'Patente: ¿qué rubro y qué % (3, 4 o 5 % por licor)?', resp: '', estado: 'abierta' },
    { id: 'q7', texto: 'IGTF: ¿sobre el total con IVA o sobre la base? ¿Se declara el IGTF propio?', resp: '', estado: 'abierta' },
    { id: 'q8', texto: '¿Quién declara IVSS, FAOV, INCES y pensiones, y con qué base? ¿Incluye el 10 %?', resp: '', estado: 'abierta' },
    { id: 'q9', texto: '¿Llevas Diario, Mayor e Inventarios sellados? ¿Hay asamblea y comisario?', resp: 'Sí, sellados. La asamblea se hace en marzo.', estado: 'respondida' },
    { id: 'q10', texto: '¿Cuántos días de utilidades? ¿LOCTI al 0,5 % o al 2 %?', resp: '', estado: 'abierta' },
    { id: 'q11', texto: '¿El consumo de los socios y del personal se declara en el IVA como retiro de bienes (autoconsumo)? ¿A precio de carta o a costo?', resp: '', estado: 'abierta' },
    { id: 'q12', texto: 'Grandes Patrimonios (14 oct y 12 nov): ¿hay que presentar la declaración aunque no lleguemos al mínimo? ¿Qué toca en cada fecha?', resp: '', estado: 'abierta', urgente: 'Antes del mié 14 oct', corto: 'Grandes Patrimonios' },
    { id: 'q13', texto: 'El delivery pedido por WhatsApp o Instagram y pagado por pago móvil, Zelle o Binance, ¿cuenta como venta por medios electrónicos y lleva factura digital?', resp: '', estado: 'abierta' },
    { id: 'q14', texto: 'Pensiones de agosto: vencían el miércoles 16 de septiembre, no el 30. Si se pagaron después del 16, ¿cuánto son la multa y los intereses y cómo se regulariza?', resp: '', estado: 'abierta', urgente: 'Urgente', corto: 'pensiones de agosto' },
    { id: 'q15', texto: 'RIF en la publicidad (norma de agosto): ¿qué piezas lo deben llevar? ¿Anuncios pagados, posts de venta, flyers, menú de delivery, carta de mesa, pendón del toldo?', resp: '', estado: 'abierta' },
    { id: 'q16', texto: 'Casilla de 31 % del Z: ¿confirmas que va siempre en cero y que los licores pagan el 16 %?', resp: '', estado: 'abierta' },
    { id: 'q17', texto: '¿El comprobante de retención se entrega en 2 días hábiles o en los 2 primeros días hábiles de la quincena siguiente?', resp: '', estado: 'abierta' },
    { id: 'q18', texto: '¿La retención nace al pagar o al registrar la factura?', resp: '', estado: 'abierta' },
  ];

  /* ---------- documentos ---------- */
  const CARPETAS = [
    { id: 'legal', nombre: 'Legal y permisos', n: 14, ven: ['alejandro', 'jose', 'eliana', 'luis', 'cecilia'], restringida: false },
    { id: 'facturas', nombre: 'Facturas de proveedores', n: 1184, ven: ['alejandro', 'jose', 'eliana', 'luis', 'cecilia', 'manuel'], restringida: false },
    { id: 'comprobantes', nombre: 'Comprobantes de pago', n: 2310, ven: ['alejandro', 'jose', 'eliana', 'luis'], restringida: false },
    { id: 'fiscal', nombre: 'Fiscal (Z, declaraciones, retenciones)', n: 402, ven: ['alejandro', 'jose', 'eliana', 'luis', 'cecilia'], restringida: false },
    { id: 'bancos', nombre: 'Estados de cuenta', n: 48, ven: ['alejandro', 'jose', 'eliana', 'luis', 'cecilia'], restringida: false },
    { id: 'personal', nombre: 'Personal (expedientes)', n: 236, ven: ['alejandro', 'andreina'], restringida: true }, // expedientes: solo dueño y RRHH (29-ago)
  ];
  const ARCHIVOS = [
    { id: 'a1', carpeta: 'legal', nombre: 'Permiso de bomberos 2025-2026.pdf', fecha: '21 oct 2025', vence: '21 oct 2026', vinculo: 'Permiso de bomberos', version: 1 },
    { id: 'a2', carpeta: 'legal', nombre: 'Registro mercantil (acta constitutiva).pdf', fecha: '2 feb 2019', vence: '—', vinculo: '—', version: 1 },
    { id: 'a3', carpeta: 'fiscal', nombre: 'Z 1488 · 30 sep.jpg', fecha: '1 oct 2026', vence: '—', vinculo: 'Reporte Z del 30 sep', version: 1 },
    { id: 'a4', carpeta: 'fiscal', nombre: 'Declaración IVA 1.ª quinc. sep.pdf', fecha: '30 sep 2026', vence: '—', vinculo: 'IVA 1.ª quincena sep', version: 1 },
    { id: 'a5', carpeta: 'facturas', nombre: 'Carnes La Pradera A-004512.jpg', fecha: '28 sep 2026', vence: '—', vinculo: 'Factura A-004512', version: 1 },
    { id: 'a6', carpeta: 'bancos', nombre: 'Estado de cuenta BVCJ septiembre.pdf', fecha: '2 oct 2026', vence: '—', vinculo: 'Conciliación BVCJ sep', version: 1 },
    { id: 'a7', carpeta: 'personal', nombre: 'Contrato María Fernández.pdf', fecha: '1 mar 2022', vence: '—', vinculo: 'Ficha de María Fernández', version: 2 },
    { id: 'a8', carpeta: 'comprobantes', nombre: 'Pagos del lunes 28 sep.pdf', fecha: '28 sep 2026', vence: '—', vinculo: 'Lote del 28 sep', version: 1 },
  ];

  /* ---------- análisis ---------- */
  const SEMANAS = [
    ['13 jul', 20670], ['20 jul', 21420], ['27 jul', 20280], ['3 ago', 19810], ['10 ago', 19440], ['17 ago', 18620],
    ['24 ago', 18190], ['31 ago', 18470], ['7 sep', 18930], ['14 sep', 18400], ['21 sep', 19340], ['28 sep', 20110],
  ];
  const PLATOS = [
    ['Parrilla para dos', 412, 18.9], ['Arepa armada', 980, 14.2], ['Cachapa con queso', 640, 8.8], ['Pabellón', 355, 7.1],
    ['Hamburguesa de la casa', 410, 6.5], ['Papelón con limón (jarra)', 520, 4.9], ['Chicharrón', 260, 4.1],
  ];
  const INSUMOS = [
    { id: 'i1', nombre: 'Queso telita', unidad: 'kg', antes: 6.40, ahora: 6.98, prov: 'Quesera Los Andes', mejor: 'Lácteos del Lago a 6,55' },
    { id: 'i2', nombre: 'Punta de ganso', unidad: 'kg', antes: 9.10, ahora: 9.35, prov: 'Carnes La Pradera', mejor: '' },
    { id: 'i3', nombre: 'Pechuga de pollo', unidad: 'kg', antes: 5.60, ahora: 5.48, prov: 'Pollos El Granjero', mejor: '' },
    { id: 'i4', nombre: 'Harina de maíz', unidad: 'bulto', antes: 21.00, ahora: 22.30, prov: 'Distribuidora Central', mejor: '' },
    { id: 'i5', nombre: 'Pernil', unidad: 'kg', antes: 7.20, ahora: 7.95, prov: 'Charcutería Don Pepe', mejor: 'Carnes La Pradera a 7,40' },
  ];
  // d = [día, mes 0-11] para abrir ese día en el calendario · preparar: lo que conviene tener listo
  const EVENTOS = [
    { id: 'ev1', fecha: 'Lun 12 oct', d: [12, 9], nombre: 'Día de la Resistencia Indígena (feriado)', efecto: 'El año pasado vendimos +18 % ese día', tipo: 'feriado',
      preparar: ['Es lunes y feriado bancario: los pagos del lunes pasan al martes 13', 'Quien trabaje ese día cobra 50 % más (es feriado)', 'Reforzar el almuerzo: es cuando más se vendió el año pasado'] },
    { id: 'ev2', fecha: 'Sáb 31 oct', d: [31, 9], nombre: 'Halloween', efecto: 'Noche fuerte en delivery', tipo: 'evento',
      preparar: ['Noche de Halloween en la terraza desde las 20:00 (está en el calendario)', 'Reforzar el delivery de la noche', 'Es día de pago: la 2.ª quincena, el 10 % de octubre y el premio del mes'] },
    { id: 'ev3', fecha: 'Vie 27 nov', d: [27, 10], nombre: 'Viernes de quincena + inicio de aguinaldos', efecto: 'Suele ser el mejor viernes del año', tipo: 'evento',
      preparar: ['Pedir más carne y queso esa semana (aviso a Manuel)', 'Revisar que los dos turnos estén completos'] },
    { id: 'ev4', fecha: 'Jue 24 dic', d: [24, 11], nombre: 'Nochebuena (cerramos a las 17:00)', efecto: 'Pedidos de hallacas y pernil por encargo', tipo: 'feriado',
      preparar: ['Abrir la lista de encargos de hallacas y pernil a principios de diciembre', 'Es feriado completo: quien trabaje cobra 50 % más el día entero, aunque se cierre a las 17:00'] },
  ];
  const DECISIONES = [
    { id: 'md1', nombre: 'Rebaja de precios del 18 de agosto', desde: '18 ago', estado: 'medida', resultado: 'Pedidos por día −7 % frente a julio. La rebaja no trajo más gente.', tono: 'alerta' },
    { id: 'md2', nombre: 'Combo almuerzo ejecutivo', desde: '21 sep', estado: 'midiendo', resultado: 'Faltan 2 semanas para tener el «después» completo (4 semanas).', tono: 'info' },
  ];

  /* ---------- parámetros ---------- */
  const PARAMS = {
    negocio: { nombre: 'Restaurante (nombre de ejemplo)', razon: 'Razón social de ejemplo, C.A.', rif: 'J-0000000-4', zona: 'America/Caracas (UTC−4)', monedaBase: 'Dólar (USD)', carta: 'Euro BCV', espec: 'Sí (contribuyente especial)' },
    sedes: [{ id: 'se1', nombre: 'Valencia', corte: '04:00', direccion: 'Dirección de ejemplo', activa: true }],
    tasas: { fuente: 'BCV por n8n a las 16:00 y 7:30', respaldo: 'Carga a mano si a las 9:00 no llegó', usdt: 'Promedio de compra P2P a las 7:30', finde: 'Vale la última publicada' },
    legales: [['Salario mínimo', 'Bs 130,00', 'desde mar 2022'], ['Unidad tributaria (UT)', 'Bs 43,00', 'desde 2 jun 2025'], ['Base de pensiones por trabajador', '$ 240', 'desde el período de abril 2026'], ['Cestaticket (bono)', '$ 40', 'a la tasa BCV del día de pago · nunca salió en Gaceta']],
    alicuotas: [['IVA general', '16 %'], ['IVA reducida', '8 %'], ['IVA de lujo (16 % + 15 %)', 'No aplica: su lista no trae licores ni comida'], ['IGTF (cobros en divisas)', '3 %'], ['Retención de IVA a proveedores', '75 % (100 % si la factura falla)']],
    metodos: [['Pago móvil Venezolano', 'BVCA'], ['Transferencia Venezolano', 'BVCJ'], ['Punto de venta (terminal 1)', 'BVCA'], ['Zelle', 'ZEL'], ['Binance', 'BIN'], ['Efectivo $', 'Caja → Bóveda'], ['Cuenta de cliente', 'Cobranza']],
    tiposMov: [['Retiro de socio', 'Aprobación: por decidir (Q1) · foto: sí'], ['Pago a proveedor', 'Aprobación: lote del lunes · comprobante: sí'], ['Traspaso entre cuentas', 'Aprobación: no · comprobante: sí'], ['Gasto de caja chica', 'Aprobación: más de $ 40 · soporte: sí'], ['Plata por rendir', 'Sale de la bóveda · se cierra con las facturas o el vuelto, que registran Jose o Alejandro a nombre de quien rinde'], ['Pasó por la cuenta de un socio', 'Plata del negocio que entró o salió por la cuenta personal de un socio · comprobante: sí · se dice qué socio'], ['Aporte o préstamo de un socio', 'El socio pone plata suya: queda en su cuenta de aportes y préstamos · comprobante: sí'], ['Pago de impuesto', 'Aprobación: sí · planilla: sí'], ['Devolución a cliente', 'Aprobación: Jose o Alejandro · comprobante: sí'], ['Préstamo a empleado', 'Aprobación: Alejandro · autorización firmada: sí'], ['Consumo de socio', 'Viene del POS (método «Consumo socio»)']],
    categorias: ['Proteína', 'Lácteos', 'Vegetales', 'Bebidas', 'Panadería', 'Empaques', 'Limpieza', 'Servicios'],
    reglas: [
      ['Lista de los lunes', 'Se arma sola el lunes a las 6:00 con todo lo que vence antes del lunes siguiente. Si ese lunes es feriado bancario (en 2026: 12 y 26 oct, 23 nov y 14 dic), lo avisa y propone pagar el martes'],
      ['Plazo por defecto', '7 días (cada proveedor puede tener el suyo)'],
      ['Ventana de deuda', 'Últimos 3 meses'],
      ['Devoluciones', 'Repone el 50 %, el resto es merma (editable por proveedor)'],
      ['Aviso de reposición', 'A los 3 días sin reponer, avisa a Jose y a Manuel'],
      ['Radar de precios', 'Avisa si un insumo sube más de 5 %'],
      ['Salida de Odoo', 'Paralelo cuadrado 2 semanas; precio de recepción igual a la factura ±2 % durante 4 semanas'],
      ['Pendientes', 'Si nadie lo resuelve en 2 días, sube al dueño'],
      ['Aprendiz', '14 días para cada persona nueva: lo que mueve plata pide otra firma'],
      ['Sesión', 'Se cierra a los 30 min sin uso o a las 12 h'],
      ['Bloqueo', '5 claves o códigos malos: 15 minutos bloqueado (propuesta)'],
      ['Cobranza', 'Recordatorio el lunes tras 15 días; avisos a Jose a los 30, 60 y 90 días'],
      ['Medir una decisión', '4 semanas antes contra 4 semanas después'],
      ['Consumo de los socios', '$ 500 al mes por socio, a precio de carta. Lo que pase se suma a sus retiros (propuesta). Las invitaciones del negocio no cuentan'],
      ['Préstamos a empleados', 'Hasta 12 cuotas, sin intereses. La suma de descuentos no pasa de un tercio del pago de la quincena (propuesta: confirmar con Cecilia o el abogado)'],
      ['Adelantos de quincena', 'Se descuentan completos en la quincena siguiente. Hasta $ 60 los aprueba Jose si los anota otra persona; si no, Alejandro'],
      ['Consumo del personal', 'Corte el 27 de cada mes; se descuenta en la 2.ª quincena'],
      ['Reservas', 'Abono de $ 5 por persona para grupos de 10 o más (propuesta)'],
    ],
    antifraude: [
      { id: 'af1', nombre: 'Misma cuenta en dos personas', detalle: 'Una cuenta bancaria en dos empleados, o en un empleado y un proveedor', activa: true },
      { id: 'af2', nombre: 'Pago grande a cuenta nueva', detalle: 'Más de $ 300 a una cuenta con menos de 7 días', activa: true },
      { id: 'af3', nombre: 'Pagos partidos', detalle: 'Varios pagos al mismo beneficiario en 48 h', activa: true },
      { id: 'af4', nombre: 'Cambio de cuenta de un proveedor', detalle: 'Pide código y avisa a Alejandro', activa: true },
      { id: 'af5', nombre: 'Descuadres repetidos', detalle: '3 descuadres de una cajera en 30 días', activa: true },
      { id: 'af6', nombre: 'Billete desconocido', detalle: 'Un serial que nunca entró a la bóveda', activa: true },
      { id: 'af7', nombre: 'Pago de nómina sin asistencia', detalle: 'Pago a alguien sin marcas en el reloj', activa: false },
    ],
    avisos: [
      ['Parte de la mañana', '7:00 · solo al chat de cada dueño · nunca el saldo de la bóveda'],
      ['Alarma del sistema', 'Al teléfono (ntfy) + vigilante externo'],
      ['Lista de los lunes', 'Lunes 6:00 · lo que hay que pagar, por tasa y con su promedio'],
      ['Grupo «Comprobantes de pago»', 'Resumen de los lunes y comprobantes'],
      ['Grupo «Pagos al Personal»', 'Resumen de la nómina'],
      ['Grupo de bóveda (por crear)', 'Fotos de retiros y entradas'],
      ['Retiro de un socio', 'Avisa al otro socio y a quien custodia'],
      ['Grupo «Mesoneros del restaurante» (por crear)', 'Cada reserva nueva o cambiada · las reservas del día a las 11:00 · las de mañana a las 18:00 · eventos a 7 días y el día'],
      ['Cumpleaños del personal', 'Aviso a RRHH y a la supervisora 3 días antes'],
      ['Vacaciones y contratos', 'Aviso a RRHH 30 días antes de que venza un contrato o un período de prueba (al día 25)'],
      ['Contrato a término con más de 1 año', 'Aviso a RRHH en cuanto pasa de 1 año o llega a la 2.ª prórroga: ya es indeterminado (fijo) y terminarlo sería un despido'],
    ],
    feriados: [['12 oct', 'Día de la Resistencia Indígena'], ['24 dic', 'Nochebuena'], ['25 dic', 'Navidad'], ['31 dic', 'Fin de año']], // el 24 y el 31 son feriados completos aunque se cierre temprano
    conceptos: [['Sueldo base', 'Salarial · quincenal'], ['Horas extra', 'Salarial · 1,5 ×'], ['Redoble', 'Salarial · 0,5 ×'], ['Bono nocturno', 'Salarial · 30 % más por hora, de 7 p. m. a 5 a. m. · línea aparte en el recibo'], ['Domingo o feriado trabajado', 'Salarial · 50 % más del día · línea aparte en el recibo'],['10 % de servicio', 'Salarial · del 28 al 27 a tasa euro'], ['Premio del mes', 'Por clasificar con el abogado · va en su propia corrida, con el ganador escogido a mano · si se paga cada mes por desempeño, cuenta como salario'], ['Bonificación extra', 'Por clasificar con el abogado · de vez en cuando (un evento, un esfuerzo puntual) · si se vuelve fija, cuenta como salario'], ['Cestaticket', 'No salarial · mensual'], ['Incremento complementario del cestaticket', 'No salarial · mensual'], ['Cuota de préstamo', 'Descuento · desde el saldo del préstamo'], ['Adelanto de quincena', 'Descuento · completo en la quincena siguiente'], ['Consumo del personal', 'Descuento · corte el 27, en la 2.ª quincena']],
  };

  /* ---------- salud y auditoría ---------- */
  const SALUD = [
    { id: 'h1', nombre: 'Respaldo de anoche', estado: 'ok', detalle: '3:00 · cifrado y fuera del servidor', hace: 'hace 4 h' },
    { id: 'h2', nombre: 'Prueba de restaurar el respaldo', estado: 'ok', detalle: 'Domingo 4 oct · restauró en 3 min', hace: 'hace 1 día' },
    { id: 'h3', nombre: 'WhatsApp (bot de caja)', estado: 'ok', detalle: 'Conectado · último mensaje 7:31', hace: 'hace 9 min' },
    { id: 'h4', nombre: 'Copia de Odoo', estado: 'atencion', detalle: 'Automática en pausa. Se importa a mano los domingos (última: dom 4 oct).', hace: 'hace 1 día' },
    { id: 'h5', nombre: 'Saldo de la IA (visión)', estado: 'ok', detalle: 'Alcanza para unos 21 días', hace: 'hace 1 h' },
    { id: 'h6', nombre: 'n8n (automatizaciones)', estado: 'ok', detalle: '6 flujos activos, 0 errores hoy', hace: 'hace 2 min' },
    { id: 'h7', nombre: 'Archivos (MinIO)', estado: 'ok', detalle: '38 % del disco usado', hace: 'hace 5 min' },
    { id: 'h8', nombre: 'Alarma al teléfono', estado: 'ok', detalle: 'Vigilante externo recibió el último latido', hace: 'hace 3 min' },
  ];
  const FRESCURA = [
    ['Pagos y facturas de Odoo', 'Dom 4 oct (copia a mano)', 'aviso'],
    ['Conciliación del mes', 'Septiembre: 3 de 4 bancos', 'aviso'],
    ['Cierre de caja', 'Todavía en papel (fase 5)', 'gris'],
    ['Tasas', 'Hoy 7:30', 'ok'],
  ];
  const AUDITORIA = [
    { id: 'au1', cuando: 'Hoy 7:31', quien: 'bot-caja', tipoActor: 'bot', modulo: 'Caja del día', registro: 'Pago de las 13:42', campo: 'estado', antes: '—', despues: 'por revisar', motivo: '' },
    { id: 'au2', cuando: 'Hoy 7:30', quien: 'n8n-tasas', tipoActor: 'bot', modulo: 'Tasas', registro: 'Dólar BCV 5 oct', campo: 'valor', antes: '—', despues: '612,40', motivo: '' },
    { id: 'au3', cuando: 'Sáb 3 oct 18:05', quien: 'Luis Roberto', tipoActor: 'persona', modulo: 'Bóveda', registro: 'Retiro de $ 500', campo: 'creado', antes: '—', despues: '$ 500 · 5 billetes', motivo: 'Retiro personal' },
    { id: 'au4', cuando: 'Jue 1 oct 15:20', quien: 'Jose', tipoActor: 'persona', modulo: 'Proveedores', registro: 'Factura 000781', campo: 'monto', antes: '$ 362,50', despues: '$ 342,50', motivo: 'Devolvimos 2 kg de queso telita en mal estado' },
    { id: 'au5', cuando: 'Jue 1 oct 11:02', quien: 'Jose', tipoActor: 'persona', modulo: 'Proveedores', registro: 'Hortalizas El Valle', campo: 'cuenta bancaria', antes: 'Provincial •••• 9001', despues: 'Provincial •••• 4404', motivo: 'El proveedor avisó que cambió de banco' },
    { id: 'au6', cuando: 'Mié 30 sep 16:40', quien: 'Cecilia', tipoActor: 'persona', modulo: 'Fiscal', registro: 'IVA 1.ª quinc. sep', campo: 'estado', antes: 'lista para declarar', despues: 'declarada', motivo: 'Planilla del portal adjunta' },
    { id: 'au7', cuando: 'Mar 29 sep 9:15', quien: 'Alejandro', tipoActor: 'persona', modulo: 'Usuarios', registro: 'Cecilia', campo: 'invitación', antes: '—', despues: 'rol Contadora externa', motivo: 'Para que trabaje lo fiscal en la app' },
  ];
  const ACCESOS = [
    { cuando: 'Hoy 7:38', quien: 'Alejandro', que: 'Entró con código', donde: 'iPhone · Valencia' },
    { cuando: 'Hoy 7:12', quien: 'Jose', que: 'Entró con código', donde: 'Computadora · Valencia' },
    { cuando: 'Vie 2 oct 15:02', quien: 'Cecilia', que: 'Descargó el paquete fiscal de septiembre (con código)', donde: 'Computadora' },
    { cuando: 'Jue 1 oct 22:41', quien: '¿?', que: '3 claves malas para «jose»', donde: 'IP desconocida' },
  ];

  return { HOY, TASA, ROLES, MODULOS, PERMISOS, USUARIOS, SERVICIO, LIMITES, SESIONES, CUENTAS, CAJA, PENDIENTES, PROVEEDORES, FACTURAS, FAC_AGENTE, DEVOLUCIONES, LUNES, CLIENTES, DEVCLIENTES, BOVEDA, CAJACHICA, SOCIOS, RETIROS, POR_RENDIR, CONCILIACION, DIFERENCIAS, EMPLEADOS, NOMINA, PAGO_NOMINA, OBLIGACIONES, IVA_HOJA, IVA_Q1, LIBRO_VENTAS, ZETAS, VENTAS_EMPRESAS, RET_RECIBIDAS, COMPRAS, RET_EMITIDAS, PARAFISCALES, NOMINA_FORMAL, PATENTE, ASEO, MAQUINAS, PERMISOS_LIC, PAQUETE, PREGUNTAS, CARPETAS, ARCHIVOS, SEMANAS, PLATOS, INSUMOS, EVENTOS, DECISIONES, PARAMS, SALUD, FRESCURA, AUDITORIA, ACCESOS };
})();
