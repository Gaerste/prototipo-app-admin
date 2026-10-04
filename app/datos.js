/* Datos INVENTADOS para el prototipo. Ningún número, RIF, cuenta ni monto es real. */
window.DB = (() => {
  const HOY = { iso: '2026-10-05', largo: 'Lunes 5 de octubre', corto: 'lun 5 oct', hora: '14:05' };
  const TASA = { usd: 612.40, eur: 718.95, usdt: 948.10 };

  /* ---------- personas, roles y permisos ---------- */
  const ROLES = {
    dueno: { nombre: 'Dueño', desc: 'Ve todo, aprueba sin límite y maneja usuarios y parámetros.' },
    contabilidad: { nombre: 'Contabilidad', desc: 'Carga y corrige facturas, pagos, bancos y lo fiscal del día a día. Revisa la nómina.' },
    socia: { nombre: 'Socia con edición', desc: 'Edita lo operativo del dinero. Por confirmar con Alejandro.' },
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
  const SERVICIO = [
    { id: 's1', nombre: 'n8n-tasas', tipo: 'bot', responsable: 'Alejandro', puede: 'Cargar las tasas del BCV y del USDT', directo: true, vence: '31 dic 2026', ultimo: 'Hoy 7:30' },
    { id: 's2', nombre: 'bot-caja', tipo: 'bot', responsable: 'Alejandro', puede: 'Registrar los pagos de clientes del grupo Caja', directo: true, vence: '31 dic 2026', ultimo: 'Hoy 7:31' },
    { id: 's3', nombre: 'bot-boveda', tipo: 'bot', responsable: 'Jose', puede: 'Llevar a la app las fotos del grupo de bóveda (marcadas «sin doble factor»)', directo: false, vence: '31 dic 2026', ultimo: 'Sáb 3 oct' },
    { id: 's4', nombre: 'agente-facturas', tipo: 'agente', responsable: 'Jose', puede: 'Proponer facturas leídas de las fotos. Nunca aprueba.', directo: false, vence: '30 nov 2026', ultimo: 'Ayer 18:20' },
  ];
  const LIMITES = [
    { id: 'l1', que: 'Salidas de la bóveda', quien: 'Jose', hasta: 200, mon: 'usd', arriba: 'Alejandro' },
    { id: 'l2', que: 'Devoluciones a clientes', quien: 'Jose', hasta: 100, mon: 'usd', arriba: 'Alejandro' },
    { id: 'l3', que: 'Crédito a un cliente', quien: 'Jose o Luis', hasta: 100, mon: 'usd', arriba: 'Alejandro' },
    { id: 'l4', que: 'Lote de pagos del lunes', quien: 'Solo Alejandro', hasta: null, mon: 'usd', arriba: '—' },
    { id: 'l5', que: 'Ajuste de una factura', quien: 'Jose', hasta: 50, mon: 'usd', arriba: 'Alejandro' },
    { id: 'l6', que: 'Gasto de caja chica', quien: 'Jose', hasta: 40, mon: 'usd', arriba: 'Alejandro' },
    { id: 'l7', que: 'Préstamo a un empleado', quien: 'Solo Alejandro', hasta: null, mon: 'usd', arriba: '—' },
    { id: 'l8', que: 'Adelanto de quincena (propuesta)', quien: 'Jose', hasta: 60, mon: 'usd', arriba: 'Alejandro' },
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
    { id: 'ZEL', nombre: 'Zelle del negocio', tipo: 'Zelle', mon: 'usd', num: 'correo •••@ejemplo.com', titular: 'Socio en EE. UU.', saldo: 1389.56, ultimo: 'Ayer 20:15' },
    { id: 'BIN', nombre: 'Binance del negocio', tipo: 'Binance', mon: 'usdt', num: 'alias «Restaurante»', titular: 'Alejandro', saldo: 2310.44, ultimo: 'Ayer 21:48' },
    { id: 'BOV', nombre: 'Bóveda de dólares', tipo: 'Efectivo', mon: 'usd', num: '—', titular: 'Custodia: Jose', saldo: 12560, ultimo: 'Sáb 3 oct' },
    { id: 'CCH', nombre: 'Caja chica', tipo: 'Efectivo', mon: 'usd', num: '—', titular: 'Custodia: Jose', saldo: 86.50, ultimo: 'Sáb 3 oct' },
  ];

  /* ---------- caja del día ---------- */
  const CAJA = [
    { id: 'c1', hora: '13:42', banco: 'Banesco', tipo: 'Pago móvil', monto: 36346.94, mon: 'bs', estado: 'por_confirmar', motivo: 'La foto dice «en proceso»', ref: '000012344417', cajera: 'Caja 1', fuente: 'Captura', destino: 'BVCA', cerro: '—' },
    { id: 'c2', hora: '13:38', banco: 'Mercantil', tipo: 'Pago móvil', monto: 4668.86, mon: 'bs', estado: 'por_confirmar', motivo: 'Mercantil no manda correo', ref: '27691724', cajera: 'Caja 2', fuente: 'Captura', destino: 'BVCA', cerro: '—' },
    { id: 'c3', hora: '13:31', banco: 'Zelle', tipo: 'Zelle', monto: 41.37, mon: 'usd', estado: 'confirmado', motivo: '', ref: 'M. Pérez', cajera: 'Caja 1', fuente: 'Correo del banco', destino: 'ZEL', cerro: 'El bot' },
    { id: 'c4', hora: '13:20', banco: 'Binance', tipo: 'USDT', monto: 21.15, mon: 'usdt', estado: 'confirmado', motivo: '', ref: 'Orden 4402…118', cajera: 'Caja 2', fuente: 'Correo de Binance', destino: 'BIN', cerro: 'El bot' },
    { id: 'c5', hora: '13:05', banco: 'Venezolano', tipo: 'Pago móvil', monto: 22506.05, mon: 'bs', estado: 'confirmado', motivo: '', ref: '007428489', cajera: 'Caja 1', fuente: 'Reacción ✅ de Jose', destino: 'BVCA', cerro: 'Jose', doble: true },
    { id: 'c6', hora: '12:54', banco: 'Provincial', tipo: 'Transferencia', monto: 18436.16, mon: 'bs', estado: 'avisado', motivo: 'Pasaron 20 min sin correo: el bot avisó al grupo', ref: '000012374', cajera: 'Caja 2', fuente: 'Captura', destino: 'BVCJ', cerro: '—' },
    { id: 'c7', hora: '12:51', banco: 'Mercantil', tipo: 'Pago móvil', monto: 40421.22, mon: 'bs', estado: 'por_confirmar', motivo: 'Mercantil no manda correo', ref: '58817230', cajera: 'Caja 1', fuente: 'Captura', destino: 'BVCA', cerro: '—' },
    { id: 'c8', hora: '12:47', banco: 'BNC', tipo: 'Pago móvil', monto: 9120.00, mon: 'bs', estado: 'confirmado', motivo: '', ref: '0918273', cajera: 'Caja 2', fuente: 'Leído de la captura', destino: 'BNC', cerro: 'El bot' },
    { id: 'c9', hora: '12:40', banco: 'Banesco', tipo: 'Pago móvil', monto: 31350.32, mon: 'bs', estado: 'por_confirmar', motivo: 'No se leyó la referencia: el bot pidió los datos a la cajera', ref: '¿?', cajera: 'Caja 1', fuente: 'Captura', destino: 'BVCA', cerro: '—' },
    { id: 'c10', hora: '12:22', banco: 'Venezolano', tipo: 'Pago móvil', monto: 15890.40, mon: 'bs', estado: 'confirmado', motivo: '', ref: '007412203', cajera: 'Caja 2', fuente: 'Correo del banco', destino: 'BVCA', cerro: 'El bot' },
    { id: 'c11', hora: '12:10', banco: 'Bancaribe', tipo: 'Pago móvil', monto: 12240.00, mon: 'bs', estado: 'confirmado', motivo: '', ref: '33019287', cajera: 'Caja 1', fuente: 'Correo del banco', destino: 'BVCA', cerro: 'El bot' },
    { id: 'c13', hora: '11:40', banco: '—', tipo: 'Foto', monto: 0, mon: 'bs', estado: 'descartado', motivo: 'No era un comprobante: foto del fondo de caja', ref: '—', cajera: 'Caja 1', fuente: 'Captura', destino: '—', cerro: 'El bot (lectura 3 de 3)' },
    { id: 'c12', hora: '11:58', banco: 'Zelle', tipo: 'Zelle', monto: 53.68, mon: 'usd', estado: 'confirmado', motivo: '', ref: 'A. Rojas', cajera: 'Caja 2', fuente: 'Correo del banco', destino: 'ZEL', cerro: 'El bot' },
  ];

  /* ---------- pendientes ---------- */
  const PENDIENTES = [
    { id: 'pe1', para: ['alejandro', 'jose'], tipo: 'alerta', titulo: '4 pagos por confirmar en Caja', sub: 'El más viejo es de las 12:40', de: 'El bot', edad: '1 h', ir: 'caja' },
    { id: 'pe2', para: ['alejandro'], tipo: 'alerta', titulo: 'Un proveedor cambió de cuenta', sub: 'Hortalizas El Valle · pide tu código', de: 'Jose', edad: '3 días', ir: 'pagos' },
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
    { id: 'pe14', para: ['andreina', 'jose'], tipo: 'aviso', titulo: 'Clasificar la falta de Kevin Torres', sub: 'Sáb 3 oct · avisó que estaba enfermo, falta el justificativo', de: 'La app', edad: '2 días', abrir: 'falta:fa1' },
    { id: 'pe15', para: ['jose'], tipo: 'aviso', titulo: 'Revisar 3 redobles de esta quincena', sub: 'Kevin, José Gregorio y Jhonny · entran en la nómina del 15', de: 'La app', edad: 'Hoy', ir: 'asistencia', sub2: 'redobles' },
    { id: 'pe16', para: ['patricia', 'alejandro'], tipo: 'aviso', titulo: 'Falta el abono de Inversiones Delta', sub: 'Almuerzo de 12 personas mañana a la 13:00 · abono de $ 60', de: 'La app', edad: 'Hoy', abrir: 'reserva:rs3' },
    { id: 'pe11', para: ['luis', 'alejandro'], tipo: 'info', titulo: 'Tu retiro del sábado quedó registrado', sub: '$ 500 · se descuenta del reparto de utilidades', de: 'La app', edad: '2 días', ir: 'cajachica' },
  ];

  /* ---------- proveedores, facturas, devoluciones ---------- */
  const PROVEEDORES = [
    { id: 'p1', nombre: 'Carnes La Pradera', cat: 'Proteína', rif: 'J-40000101-1', plazo: 7, cuenta: 'Venezolano •••• 1101', contacto: 'Ramón (0414-000-0001)', deuda: 1840.00, estado: 'al_dia' },
    { id: 'p2', nombre: 'Quesera Los Andes', cat: 'Lácteos', rif: 'J-40000102-2', plazo: 7, cuenta: 'Banesco •••• 2202', contacto: 'Marta (0424-000-0002)', deuda: 612.50, estado: 'al_dia' },
    { id: 'p3', nombre: 'Distribuidora Central de Bebidas', cat: 'Bebidas', rif: 'J-40000103-3', plazo: 15, cuenta: 'Mercantil •••• 3303', contacto: 'Oficina (0241-000-0003)', deuda: 1120.00, estado: 'vencida' },
    { id: 'p4', nombre: 'Hortalizas El Valle', cat: 'Vegetales', rif: 'V-10000104-4', plazo: 0, cuenta: 'Provincial •••• 4404 (nueva)', contacto: 'Pedro (0412-000-0004)', deuda: 238.10, estado: 'cuenta_nueva' },
    { id: 'p5', nombre: 'Empaques del Centro', cat: 'Empaques', rif: 'J-40000105-5', plazo: 10, cuenta: 'BNC •••• 5505', contacto: 'Ventas (0241-000-0005)', deuda: 312.40, estado: 'al_dia' },
    { id: 'p6', nombre: 'Gas Carabobo', cat: 'Servicios', rif: 'J-40000106-6', plazo: 0, cuenta: 'Venezolano •••• 6606', contacto: 'Despacho (0241-000-0006)', deuda: 180.00, estado: 'al_dia' },
    { id: 'p7', nombre: 'Panadería San José', cat: 'Panadería', rif: 'J-40000107-7', plazo: 7, cuenta: 'Bancaribe •••• 7707', contacto: 'José (0414-000-0007)', deuda: 96.00, estado: 'al_dia' },
    { id: 'p8', nombre: 'Pollos El Granjero', cat: 'Proteína', rif: 'J-40000108-8', plazo: 7, cuenta: 'Banesco •••• 8808', contacto: 'Luisa (0424-000-0008)', deuda: 964.80, estado: 'al_dia' },
    { id: 'p9', nombre: 'Frutería La Esquina', cat: 'Vegetales', rif: 'V-10000109-9', plazo: 0, cuenta: 'Pago móvil 0414-000-0009', contacto: 'Ana (0414-000-0009)', deuda: 74.30, estado: 'al_dia' },
    { id: 'p10', nombre: 'Frío Total (mantenimiento)', cat: 'Servicios', rif: 'J-40000110-0', plazo: 15, cuenta: 'Venezolano •••• 1010', contacto: 'Técnico (0412-000-0010)', deuda: 450.00, estado: 'vencida' },
    { id: 'p11', nombre: 'Limpieza Integral', cat: 'Limpieza', rif: 'J-40000111-1', plazo: 0, cuenta: 'BNC •••• 1111', contacto: 'Ventas (0241-000-0011)', deuda: 268.90, estado: 'al_dia' },
    { id: 'p12', nombre: 'Charcutería Don Pepe', cat: 'Proteína', rif: 'J-40000112-2', plazo: 10, cuenta: 'Mercantil •••• 1212', contacto: 'Pepe (0414-000-0012)', deuda: 2263.00, estado: 'al_dia' },
  ];
  const FACTURAS = [
    { id: 'f1', prov: 'p1', num: 'A-004512', control: '00-118204', fecha: '28 sep', vence: '5 oct', monto: 980.00, saldo: 980.00, estado: 'abierta', origen: 'Odoo' },
    { id: 'f2', prov: 'p1', num: 'A-004533', control: '00-118260', fecha: '30 sep', vence: '7 oct', monto: 860.00, saldo: 860.00, estado: 'abierta', origen: 'Odoo' },
    { id: 'f3', prov: 'p2', num: '000781', control: '00-020781', fecha: '27 sep', vence: '4 oct', monto: 342.50, saldo: 342.50, estado: 'ajustada', origen: 'Odoo', ajuste: { campo: 'Monto', antes: 362.50, despues: 342.50, motivo: 'Devolvimos 2 kg de queso telita en mal estado', quien: 'Jose', cuando: 'Jue 1 oct 15:20' } },
    { id: 'f4', prov: 'p2', num: '000790', control: '00-020790', fecha: '1 oct', vence: '8 oct', monto: 270.00, saldo: 270.00, estado: 'abierta', origen: 'Odoo' },
    { id: 'f5', prov: 'p3', num: 'F-22019', control: '01-772019', fecha: '17 sep', vence: '2 oct', monto: 1120.00, saldo: 1120.00, estado: 'vencida', origen: 'Odoo' },
    { id: 'f6', prov: 'p4', num: '0112', control: 'sin control', fecha: '3 oct', vence: '3 oct', monto: 238.10, saldo: 238.10, estado: 'abierta', origen: 'Odoo', alerta: 'La factura no trae número de control' },
    { id: 'f7', prov: 'p8', num: 'PG-1180', control: '00-551180', fecha: '29 sep', vence: '6 oct', monto: 512.40, saldo: 512.40, estado: 'abierta', origen: 'Odoo' },
    { id: 'f8', prov: 'p8', num: 'PG-1191', control: '00-551191', fecha: '2 oct', vence: '9 oct', monto: 452.40, saldo: 452.40, estado: 'abierta', origen: 'Odoo' },
    { id: 'f9', prov: 'p12', num: 'DP-3301', control: '00-903301', fecha: '25 sep', vence: '5 oct', monto: 1263.00, saldo: 1263.00, estado: 'abierta', origen: 'Odoo' },
    { id: 'f10', prov: 'p12', num: 'DP-3322', control: '00-903322', fecha: '30 sep', vence: '10 oct', monto: 1000.00, saldo: 1000.00, estado: 'abierta', origen: 'Odoo' },
    { id: 'f11', prov: 'p10', num: '000044', control: '00-000044', fecha: '15 sep', vence: '30 sep', monto: 450.00, saldo: 450.00, estado: 'vencida', origen: 'Odoo' },
    { id: 'f12', prov: 'p5', num: 'E-8812', control: '00-338812', fecha: '26 sep', vence: '6 oct', monto: 312.40, saldo: 312.40, estado: 'abierta', origen: 'Odoo' },
    { id: 'f13', prov: 'p7', num: '1201', control: '00-001201', fecha: '28 sep', vence: '5 oct', monto: 96.00, saldo: 96.00, estado: 'abierta', origen: 'Odoo' },
    { id: 'f14', prov: 'p6', num: 'G-7710', control: '00-447710', fecha: '4 oct', vence: '4 oct', monto: 180.00, saldo: 180.00, estado: 'abierta', origen: 'Odoo' },
    { id: 'f15', prov: 'p9', num: '0088', control: 'sin control', fecha: '4 oct', vence: '4 oct', monto: 74.30, saldo: 74.30, estado: 'abierta', origen: 'Odoo' },
    { id: 'f16', prov: 'p11', num: 'L-2290', control: '00-112290', fecha: '3 oct', vence: '3 oct', monto: 268.90, saldo: 268.90, estado: 'abierta', origen: 'Odoo' },
    { id: 'f17', prov: 'p1', num: 'A-004480', control: '00-118150', fecha: '21 sep', vence: '28 sep', monto: 1120.00, saldo: 0, estado: 'pagada', origen: 'Odoo' },
  ];
  const DEVOLUCIONES = [
    { id: 'dv1', prov: 'p2', fecha: 'Jue 1 oct', que: '4 kg de queso telita', monto: 40.00, trato: 'Repone la mitad (2 kg); el resto es merma', estado: 'esperando', dias: 4, quien: 'Manuel' },
    { id: 'dv2', prov: 'p8', fecha: 'Lun 28 sep', que: '6 kg de pechuga con mal olor', monto: 33.60, trato: 'Repone todo', estado: 'repuesta', dias: 0, quien: 'Manuel' },
  ];

  /* ---------- pagos del lunes ---------- */
  const LUNES = [
    { p: 'p1', f: '2 facturas', v: 'Hoy', m: 1840.00, c: 'BVCA' },
    { p: 'p2', f: '2 facturas', v: 'Hoy', m: 612.50, c: 'BVCE' },
    { p: 'p3', f: '1 factura', v: 'Hace 3 días', tarde: true, m: 1120.00, c: 'BVCJ' },
    { p: 'p4', f: '1 factura', v: 'Hoy', m: 238.10, c: null, bloqueada: true },
    { p: 'p5', f: '1 factura', v: 'Mañana', m: 312.40, c: 'BVCA' },
    { p: 'p6', f: '1 factura', v: 'Hoy', m: 180.00, c: null },
    { p: 'p7', f: '1 factura', v: 'Hoy', m: 96.00, c: 'BVCE' },
    { p: 'p8', f: '2 facturas', v: 'Mañana', m: 964.80, c: 'BVCA', duda: 'pollos' },
    { p: 'p9', f: '1 factura', v: 'Hoy', m: 74.30, c: null },
    { p: 'p10', f: '1 factura', v: 'Hace 5 días', tarde: true, m: 450.00, c: 'BVCJ' },
    { p: 'p11', f: '1 factura', v: 'Hoy', m: 268.90, c: null },
    { p: 'p12', f: '2 facturas', v: 'Hoy', m: 2263.00, c: 'BVCJ' },
  ];

  /* ---------- clientes y cobranza ---------- */
  const CLIENTES = [
    { id: 'k1', nombre: 'Constructora Delta', tipo: 'Empresa', esp: true, rif: 'J-50000201-1', credito: 600, dias: 30, saldo: 482.40, antig: 34, ultimo: '1 sep', contacto: 'Administración', consiente: false },
    { id: 'k2', nombre: 'Clínica Los Mangos', tipo: 'Empresa', esp: true, rif: 'J-50000202-2', credito: 400, dias: 15, saldo: 215.00, antig: 12, ultimo: '22 sep', contacto: 'Compras', consiente: false },
    { id: 'k3', nombre: 'Laura Méndez', tipo: 'Cliente habitual', esp: false, rif: 'V-20000203-3', credito: 100, dias: 15, saldo: 64.20, antig: 19, ultimo: '27 sep', contacto: '0414-000-0203', consiente: true },
    { id: 'k4', nombre: 'Carlos Ibarra', tipo: 'Cliente habitual', esp: false, rif: 'V-20000204-4', credito: 100, dias: 15, saldo: 98.50, antig: 63, ultimo: '1 ago', contacto: '0424-000-0204', consiente: true },
    { id: 'k5', nombre: 'Colegio San Ignacio (eventos)', tipo: 'Empresa', esp: false, rif: 'J-50000205-5', credito: 800, dias: 30, saldo: 0, antig: 0, ultimo: '28 sep', contacto: 'Dirección', consiente: false },
    { id: 'k6', nombre: 'Rosa Pacheco', tipo: 'Cliente habitual', esp: false, rif: 'V-20000206-6', credito: 50, dias: 15, saldo: 31.00, antig: 92, ultimo: '4 jul', contacto: '0412-000-0206', consiente: true },
  ];
  const DEVCLIENTES = [
    { id: 'dc1', cliente: 'Pago doble de un cliente de mesa', monto: 25.00, motivo: 'Pagó por pago móvil y también en efectivo', preparo: 'Jose', estado: 'por_aprobar' },
  ];

  /* ---------- bóveda, caja chica, socios ---------- */
  const BOVEDA = {
    total: 12560, conteo: 'Jueves 1 de octubre, con testigo. Cuadró.',
    denoms: [[100, 98], [50, 34], [20, 41], [10, 15], [5, 12], [1, 30]],
    movs: [
      { id: 'b1', tipo: 'salida', titulo: 'Retiro de Luis', sub: 'Sáb 3 oct 18:05 · desde la app · 5 billetes', monto: -500, estado: 'ok', via: 'App con código', seriales: ['MB 44591022 A', 'MF 10293847 C', 'PL 55820193 B', 'MB 77120934 D', 'ME 30918275 A'] },
      { id: 'b2', tipo: 'entrada', titulo: 'Entrada del cierre', sub: 'Vie 2 oct 23:40 · Jose · 14 billetes', monto: 1140, estado: 'ok', via: 'App con código', seriales: [] },
      { id: 'b3', tipo: 'salida', titulo: 'Pago a proveedor', sub: 'Vie 2 oct 10:15 · grupo de bóveda · 1 serial sin leer', monto: -800, estado: 'revisar', via: 'Grupo de WhatsApp (sin doble factor)', seriales: [] },
      { id: 'b4', tipo: 'conteo', titulo: 'Conteo con testigo', sub: 'Jue 1 oct · Jose y Luis', monto: 0, estado: 'ok', via: 'App', seriales: [] },
    ],
  };
  const CAJACHICA = {
    fondo: 150, saldo: 86.50, reposicion: 'cada lunes',
    gastos: [
      { id: 'g1', fecha: 'Sáb 3 oct', que: 'Hielo (4 bolsas)', monto: 12.00, quien: 'Jose', soporte: true, estado: 'ok' },
      { id: 'g2', fecha: 'Sáb 3 oct', que: 'Taxi para buscar gas', monto: 8.00, quien: 'Jose', soporte: false, estado: 'sin_soporte' },
      { id: 'g3', fecha: 'Vie 2 oct', que: 'Limones (mercado)', monto: 18.50, quien: 'Manuel', soporte: true, estado: 'ok' },
      { id: 'g4', fecha: 'Jue 1 oct', que: 'Bombillos para el baño', monto: 25.00, quien: 'Jose', soporte: true, estado: 'ok' },
    ],
  };
  const SOCIOS = [
    { id: 'so1', nombre: 'Alejandro', pct: 50, retirado: 1200, porRendir: 0 },
    { id: 'so2', nombre: 'Luis Roberto', pct: 50, retirado: 1748, porRendir: 300 },
  ];
  const RETIROS = [
    { id: 'r1', socio: 'Luis Roberto', fecha: 'Sáb 3 oct', monto: 500, de: 'Bóveda', para: 'Retiro personal', via: 'App con código' },
    { id: 'r2', socio: 'Alejandro', fecha: 'Mié 30 sep', monto: 400, de: 'Bóveda', para: 'Retiro personal', via: 'App con código' },
    { id: 'r4', socio: 'Luis Roberto', fecha: 'Jue 1 oct', monto: 48, de: 'Consumo de septiembre', para: 'Lo que pasó del tope de consumo ($ 548 de $ 500)', via: 'Cierre automático del mes' },
    { id: 'r3', socio: 'Luis Roberto', fecha: 'Lun 28 sep', monto: 300, de: 'Bóveda', para: 'Plata para pagar (por rendir)', via: 'Grupo de bóveda' },
  ];

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
    corridas: [
      { id: 'n1', fecha: '30 sep', tipo: '2.ª quincena + 10 %', personas: 49, total: 18870.40, estado: 'pagada' },
      { id: 'n2', fecha: '15 sep', tipo: '1.ª quincena', personas: 48, total: 14210.00, estado: 'pagada' },
      { id: 'n3', fecha: '31 ago', tipo: '2.ª quincena + 10 %', personas: 49, total: 18420.10, estado: 'pagada' },
    ],
  };

  /* ---------- fiscal ---------- */
  // fechas de octubre 2026 del calendario SENIAT para RIF terminado en 4 (públicas)
  const OBLIGACIONES = [
    { id: 'o1', nombre: 'IVA + anticipo ISLR + IGTF + retenciones de IVA', corto: 'IVA 2.ª quinc. sep', ente: 'SENIAT', periodo: '2026-09 · 2.ª quincena', dia: 6, vence: 'Mar 6 oct', faltan: 1, resp: 'Cecilia', estado: 'revision', monto: 17150.30, paso: 1 },
    { id: 'o2', nombre: 'Retenciones de ISLR de septiembre', corto: 'Ret. ISLR sep', ente: 'SENIAT', periodo: '2026-09', dia: 6, vence: 'Mar 6 oct', faltan: 1, resp: 'Cecilia', estado: 'preparar', monto: 412.80, paso: 0 },
    { id: 'o3', nombre: 'INCES 3.er trimestre', corto: 'INCES T3', ente: 'INCES', periodo: '2026 · T3', dia: 5, vence: 'Hoy, lun 5 oct', faltan: 0, resp: 'Jose', estado: 'lista', monto: 236.40, paso: 2 },
    { id: 'o4', nombre: 'IVSS y paro forzoso', corto: 'IVSS sep', ente: 'IVSS (TIUNA)', periodo: '2026-09', dia: 9, vence: 'Vie 9 oct', faltan: 4, resp: 'Jose', estado: 'preparar', monto: 596.10, paso: 0 },
    { id: 'o5', nombre: 'FAOV (vivienda)', corto: 'FAOV sep', ente: 'BANAVIH', periodo: '2026-09', dia: 9, vence: 'Vie 9 oct', faltan: 4, resp: 'Jose', estado: 'preparar', monto: 118.20, paso: 0 },
    { id: 'o6', nombre: 'Patente municipal de septiembre', corto: 'Patente sep', ente: 'Alcaldía de Valencia', periodo: '2026-09', dia: 20, vence: 'Mar 20 oct', faltan: 15, resp: 'Cecilia', estado: 'preparar', monto: 3104.50, paso: 0 },
    { id: 'o7', nombre: 'IVA + anticipo ISLR + IGTF + retenciones de IVA', corto: 'IVA 1.ª quinc. oct', ente: 'SENIAT', periodo: '2026-10 · 1.ª quincena', dia: 22, vence: 'Jue 22 oct', faltan: 17, resp: 'Cecilia', estado: 'abierta', monto: null, paso: 0 },
    { id: 'o8', nombre: 'Pensiones (9 % sobre la nómina formal)', corto: 'Pensiones sep', ente: 'SENIAT', periodo: '2026-09', dia: 22, vence: 'Jue 22 oct', faltan: 17, resp: 'Jose', estado: 'preparar', monto: 354.60, paso: 0 },
    { id: 'o9', nombre: 'IVA 1.ª quincena de septiembre', corto: 'IVA 1.ª quinc. sep', ente: 'SENIAT', periodo: '2026-09 · 1.ª quincena', dia: 30, mes: 'sep', vence: 'Mié 30 sep', faltan: -5, resp: 'Cecilia', estado: 'pagada', monto: 16980.75, paso: 4 },
    { id: 'o10', nombre: 'Pensiones de agosto', corto: 'Pensiones ago', ente: 'SENIAT', periodo: '2026-08', dia: 16, mes: 'sep', vence: 'Mié 16 sep', faltan: -19, resp: 'Jose', estado: 'pagada', monto: 341.20, paso: 4 },
  ];
  const IVA_HOJA = {
    periodo: '2.ª quincena de septiembre (16 al 30)', vence: 'Mar 6 oct',
    debitos: [['Ventas a consumidor final (los Z)', 182340.00, 29174.40], ['Facturas a empresas', 9800.00, 1568.00], ['Alícuota adicional 31 % (lujo: va en cero)', 0, 0]],
    creditos: [['Compras del libro de Cecilia', 70412.50, 11266.00]],
    retRecibidas: 1240.80, excedente: 1085.30, igtf: 2318.40, anticipo: 1923.40,
  };
  const ZETAS = [
    { id: 'z30', dia: 30, fecha: 'Mié 30 sep', num: 1488, facturas: 241, base: 13210.00, iva: 2113.60, exento: 320.00, igtf: 164.20, estado: 'confirmado', por: 'Jose' },
    { id: 'z29', dia: 29, fecha: 'Mar 29 sep', num: 1487, facturas: 198, base: 10980.00, iva: 1756.80, exento: 210.00, igtf: 140.10, estado: 'confirmado', por: 'Jose' },
    { id: 'z28', dia: 28, fecha: 'Lun 28 sep', num: 1486, facturas: 176, base: 9640.00, iva: 1542.40, exento: 180.00, igtf: 122.80, estado: 'leido', por: '—' },
    { id: 'z27', dia: 27, fecha: 'Dom 27 sep', num: null, facturas: null, base: null, iva: null, exento: null, igtf: null, estado: 'falta', por: '—' },
    { id: 'z26', dia: 26, fecha: 'Sáb 26 sep', num: 1484, facturas: 288, base: 16220.00, iva: 2595.20, exento: 410.00, igtf: 205.60, estado: 'confirmado', por: 'Jose', alerta: 'Salto de número: falta el Z 1485' },
    { id: 'z25', dia: 25, fecha: 'Vie 25 sep', num: 1483, facturas: 262, base: 14900.00, iva: 2384.00, exento: 360.00, igtf: 188.40, estado: 'confirmado', por: 'Jose' },
    { id: 'z13', dia: 13, fecha: 'Dom 13 sep', num: null, facturas: null, base: null, iva: null, exento: null, igtf: null, estado: 'falta', por: '—' },
  ];
  const VENTAS_EMPRESAS = [
    { id: 'fv1', fecha: '18 sep', num: '00004410', cliente: 'Constructora Delta', base: 4200.00, iva: 672.00, esp: true, retencion: 'Esperando su comprobante' },
    { id: 'fv2', fecha: '22 sep', num: '00004433', cliente: 'Clínica Los Mangos', base: 3100.00, iva: 496.00, esp: true, retencion: 'Recibido: 372,00' },
    { id: 'fv3', fecha: '28 sep', num: '00004461', cliente: 'Colegio San Ignacio', base: 2500.00, iva: 400.00, esp: false, retencion: 'No retiene' },
  ];
  const RET_RECIBIDAS = [
    { id: 'rr1', comp: '20260900001877', cliente: 'Clínica Los Mangos', tipo: 'IVA', monto: 372.00, periodo: '2026-09', estado: 'por_descontar' },
    { id: 'rr2', comp: '20260900001231', cliente: 'Constructora Delta', tipo: 'IVA', monto: 504.00, periodo: '2026-09', estado: 'por_descontar' },
    { id: 'rr3', comp: '20260800000945', cliente: 'Constructora Delta', tipo: 'IVA', monto: 364.80, periodo: '2026-08', estado: 'por_descontar' },
    { id: 'rr4', comp: '20260800000512', cliente: 'Clínica Los Mangos', tipo: 'ISLR', monto: 62.00, periodo: '2026-08', estado: 'descontada' },
  ];
  const COMPRAS = [
    { id: 'lc1', fecha: '28 sep', prov: 'p1', num: 'A-004512', control: '00-118204', base: 844.83, iva: 135.17, retenido: 101.38, comp: '202609-00000041' },
    { id: 'lc2', fecha: '27 sep', prov: 'p2', num: '000781', control: '00-020781', base: 295.26, iva: 47.24, retenido: 35.43, comp: '202609-00000040' },
    { id: 'lc3', fecha: '25 sep', prov: 'p12', num: 'DP-3301', control: '00-903301', base: 1088.79, iva: 174.21, retenido: 130.66, comp: '202609-00000039' },
    { id: 'lc4', fecha: '3 oct', prov: 'p4', num: '0112', control: 'sin control', base: 205.26, iva: 32.84, retenido: 32.84, comp: 'pendiente', alerta: 'Sin número de control: se retiene el 100 %' },
  ];
  const RET_EMITIDAS = [
    { id: 're1', comp: '202609-00000041', tipo: 'IVA 75 %', prov: 'p1', factura: 'A-004512', monto: 101.38, estado: 'entregada' },
    { id: 're2', comp: '202609-00000040', tipo: 'IVA 75 %', prov: 'p2', factura: '000781', monto: 35.43, estado: 'entregada' },
    { id: 're3', comp: '202609-00000039', tipo: 'IVA 75 %', prov: 'p12', factura: 'DP-3301', monto: 130.66, estado: 'emitida' },
    { id: 're4', comp: 'ISLR-2026-09-012', tipo: 'ISLR 2 % servicios', prov: 'p10', factura: '000044', monto: 9.00, estado: 'borrador' },
  ];
  const PARAFISCALES = [
    { ente: 'Pensiones (9 %)', base: 3940, monto: 354.60, vence: '22 oct' },
    { ente: 'IVSS (riesgo medio 10 %) + paro (2 %)', base: 3940, monto: 472.80, vence: '9 oct' },
    { ente: 'FAOV (2 %)', base: 3940, monto: 78.80, vence: '9 oct' },
    { ente: 'INCES (2 % trimestral)', base: 11820, monto: 236.40, vence: 'Hoy' },
  ];
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
  const PAQUETE = [
    ['Reportes Z de septiembre', '28 de 30', 'aviso'],
    ['Facturas a empresas', '3 de 3', 'ok'],
    ['Facturas de proveedores (copia de Odoo)', '184', 'ok'],
    ['Retenciones recibidas', '2 nuevas', 'ok'],
    ['Estados de cuenta', '3 de 4 bancos', 'aviso'],
    ['Nómina agrupada por corrida', '2 corridas', 'ok'],
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
  ];

  /* ---------- documentos ---------- */
  const CARPETAS = [
    { id: 'legal', nombre: 'Legal y permisos', n: 14, ven: ['alejandro', 'jose', 'eliana', 'luis', 'cecilia'], restringida: false },
    { id: 'facturas', nombre: 'Facturas de proveedores', n: 1184, ven: ['alejandro', 'jose', 'eliana', 'luis', 'cecilia', 'manuel'], restringida: false },
    { id: 'comprobantes', nombre: 'Comprobantes de pago', n: 2310, ven: ['alejandro', 'jose', 'eliana', 'luis'], restringida: false },
    { id: 'fiscal', nombre: 'Fiscal (Z, declaraciones, retenciones)', n: 402, ven: ['alejandro', 'jose', 'eliana', 'luis', 'cecilia'], restringida: false },
    { id: 'bancos', nombre: 'Estados de cuenta', n: 48, ven: ['alejandro', 'jose', 'eliana', 'luis', 'cecilia'], restringida: false },
    { id: 'personal', nombre: 'Personal (expedientes)', n: 236, ven: ['alejandro', 'andreina', 'jose'], restringida: true },
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
    ['13 jul', 31800], ['20 jul', 32950], ['27 jul', 31200], ['3 ago', 30480], ['10 ago', 29900], ['17 ago', 28650],
    ['24 ago', 27980], ['31 ago', 28410], ['7 sep', 29120], ['14 sep', 28300], ['21 sep', 29760], ['28 sep', 30940],
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
  const EVENTOS = [
    { id: 'ev1', fecha: 'Lun 12 oct', nombre: 'Día de la Resistencia Indígena (feriado)', efecto: 'El año pasado vendimos +18 % ese día', tipo: 'feriado' },
    { id: 'ev2', fecha: 'Sáb 31 oct', nombre: 'Halloween', efecto: 'Noche fuerte en delivery', tipo: 'evento' },
    { id: 'ev3', fecha: 'Vie 27 nov', nombre: 'Viernes de quincena + inicio de aguinaldos', efecto: 'Suele ser el mejor viernes del año', tipo: 'evento' },
    { id: 'ev4', fecha: 'Jue 24 dic', nombre: 'Nochebuena (cerramos a las 17:00)', efecto: 'Pedidos de hallacas y pernil por encargo', tipo: 'feriado' },
  ];
  const DECISIONES = [
    { id: 'md1', nombre: 'Rebaja de precios del 18 de agosto', desde: '18 ago', estado: 'medida', resultado: 'Pedidos por día −8 % frente a julio. La rebaja no trajo más gente.', tono: 'alerta' },
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
    tiposMov: [['Retiro de socio', 'Aprobación: no · foto: sí'], ['Pago a proveedor', 'Aprobación: lote del lunes · comprobante: sí'], ['Traspaso entre cuentas', 'Aprobación: no · comprobante: sí'], ['Gasto de caja chica', 'Aprobación: más de $ 40 · soporte: sí'], ['Pago de impuesto', 'Aprobación: sí · planilla: sí'], ['Devolución a cliente', 'Aprobación: Jose o Alejandro · comprobante: sí'], ['Préstamo a empleado', 'Aprobación: Alejandro · autorización firmada: sí'], ['Consumo de socio', 'Viene del POS (método «Consumo socio»)']],
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
      ['Adelantos de quincena', 'Se descuentan completos en la quincena siguiente'],
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
      ['Grupo «Comprobantes de pago»', 'Resumen de los lunes y comprobantes'],
      ['Grupo «Pagos al Personal»', 'Resumen de la nómina'],
      ['Grupo de bóveda', 'Fotos de retiros y entradas'],
      ['Retiro de un socio', 'Avisa al otro socio y a quien custodia'],
      ['Grupo «Mesoneros del restaurante» (por crear)', 'Cada reserva nueva o cambiada · las reservas del día a las 11:00 · las de mañana a las 18:00 · eventos a 7 días y el día'],
      ['Cumpleaños del personal', 'Aviso a RRHH y a la supervisora 3 días antes'],
      ['Vacaciones y contratos', 'Aviso a RRHH 30 días antes de que venza un contrato o un período de prueba (al día 25)'],
    ],
    feriados: [['12 oct', 'Día de la Resistencia Indígena'], ['24 dic', 'Nochebuena (medio día)'], ['25 dic', 'Navidad'], ['31 dic', 'Fin de año (medio día)']],
    conceptos: [['Sueldo base', 'Salarial · quincenal'], ['Horas extra', 'Salarial · 1,5 ×'], ['Redoble', 'Salarial · 0,5 ×'], ['10 % de servicio', 'Salarial · del 28 al 27 a tasa euro'], ['Cestaticket', 'No salarial · mensual'], ['Incremento complementario del cestaticket', 'No salarial · mensual'], ['Cuota de préstamo', 'Descuento · desde el saldo del préstamo'], ['Adelanto de quincena', 'Descuento · completo en la quincena siguiente'], ['Consumo del personal', 'Descuento · corte el 27, en la 2.ª quincena']],
  };

  /* ---------- salud y auditoría ---------- */
  const SALUD = [
    { id: 'h1', nombre: 'Respaldo de anoche', estado: 'ok', detalle: '3:00 · cifrado y fuera del servidor', hace: 'hace 4 h' },
    { id: 'h2', nombre: 'Prueba de restaurar el respaldo', estado: 'ok', detalle: 'Domingo 4 oct · restauró en 3 min', hace: 'hace 1 día' },
    { id: 'h3', nombre: 'WhatsApp (bot de caja)', estado: 'ok', detalle: 'Conectado · último mensaje 7:31', hace: 'hace 9 min' },
    { id: 'h4', nombre: 'Copia de Odoo', estado: 'atencion', detalle: 'Automática en pausa. Se importa a mano los domingos (última: dom 4 oct).', hace: 'hace 1 día' },
    { id: 'h5', nombre: 'Saldo de la IA (visión)', estado: 'ok', detalle: 'Alcanza para unos 26 días', hace: 'hace 1 h' },
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

  return { HOY, TASA, ROLES, MODULOS, PERMISOS, USUARIOS, SERVICIO, LIMITES, SESIONES, CUENTAS, CAJA, PENDIENTES, PROVEEDORES, FACTURAS, DEVOLUCIONES, LUNES, CLIENTES, DEVCLIENTES, BOVEDA, CAJACHICA, SOCIOS, RETIROS, CONCILIACION, DIFERENCIAS, EMPLEADOS, NOMINA, OBLIGACIONES, IVA_HOJA, ZETAS, VENTAS_EMPRESAS, RET_RECIBIDAS, COMPRAS, RET_EMITIDAS, PARAFISCALES, MAQUINAS, PERMISOS_LIC, PAQUETE, PREGUNTAS, CARPETAS, ARCHIVOS, SEMANAS, PLATOS, INSUMOS, EVENTOS, DECISIONES, PARAMS, SALUD, FRESCURA, AUDITORIA, ACCESOS };
})();
