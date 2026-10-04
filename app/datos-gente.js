/* Datos INVENTADOS de recursos humanos, consumo de socios y calendario (reservas y eventos).
   Ningún nombre, cédula, cuenta ni monto es real. Se suman a window.DB antes de que arranque el núcleo. */
(() => {
  const DB = window.DB;
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* ---------- personal (14 de 49 en nómina) ----------
     sueldo = base QUINCENAL en $ (diario = sueldo ÷ 15) · por_dia = tarifa diaria · nac = [día, mes 0-11, año]
     pct = % del 10 % de servicio · turno: T-1 mañana, T-2 tarde, T-3 noche */
  const EMPLEADOS = [
    { id: 'e1', nombre: 'María Fernández', ci: 'V-•••• 3381', cargo: 'Jefa de cocina', area: 'Cocina', ingreso: '1 mar 2022', anios: 4, formal: true, estado: 'activo', turno: 'T-1', tipoSal: 'quincenal', sueldo: 420, pct: 3.0, nac: [14, 1, 1986], contrato: 'Indeterminado', contratoVence: null, prueba: null, cert: 'Vigente hasta mar 2027', certOk: true, cuenta: 'Banesco •••• 4410', titular: 'Ella misma', docs: 'Completo', vacaciones: '2 períodos sin disfrutar', emergencia: 'Hermana · 0412-•••-8812' },
    { id: 'e2', nombre: 'José Gregorio Rivas', ci: 'V-•••• 9054', cargo: 'Parrillero', area: 'Cocina', ingreso: '7 ago 2023', anios: 3, formal: true, estado: 'activo', turno: 'T-2', tipoSal: 'quincenal', sueldo: 360, pct: 2.5, nac: [9, 9, 1991], contrato: 'Indeterminado', contratoVence: null, prueba: null, cert: 'Venció el 20 sep 2026', certOk: false, cuenta: 'Mercantil •••• 1187', titular: 'Él mismo', docs: 'Falta certificado de salud', vacaciones: '17 días por programar', emergencia: 'Esposa · 0424-•••-3301' },
    { id: 'e3', nombre: 'Daniela Salas', ci: 'V-•••• 6620', cargo: 'Cajera', area: 'Caja', ingreso: '8 ene 2024', anios: 2, formal: false, estado: 'activo', turno: 'T-1', tipoSal: 'quincenal', sueldo: 300, pct: 1.5, nac: [22, 9, 1999], contrato: 'Indeterminado', contratoVence: null, prueba: null, cert: 'Vigente hasta jun 2027', certOk: true, cuenta: 'Venezuela •••• 7731', titular: 'Su mamá (V-•••• 1029)', docs: 'Completo', vacaciones: '16 días por programar', emergencia: 'Mamá · 0414-•••-5520' },
    { id: 'e4', nombre: 'Kevin Torres', ci: 'V-•••• 2287', cargo: 'Mesonero', area: 'Servicio', ingreso: '3 jun 2024', anios: 2, formal: false, estado: 'activo', turno: 'T-2', tipoSal: 'quincenal', sueldo: 260, pct: 2.0, nac: [5, 9, 2002], contrato: 'Indeterminado', contratoVence: null, prueba: null, cert: 'Vigente hasta ene 2027', certOk: true, cuenta: 'Banesco •••• 0921', titular: 'Él mismo', docs: 'Falta contrato firmado', vacaciones: 'Al día', emergencia: 'Papá · 0416-•••-7710' },
    { id: 'e5', nombre: 'Yohana Blanco', ci: 'V-•••• 4471', cargo: 'Ayudante de cocina', area: 'Cocina', ingreso: '10 feb 2025', anios: 1, formal: false, estado: 'activo', turno: 'T-1', tipoSal: 'quincenal', sueldo: 270, pct: 1.0, nac: [30, 10, 1997], contrato: 'Indeterminado', contratoVence: null, prueba: null, cert: 'Vigente hasta feb 2027', certOk: true, cuenta: 'Provincial •••• 5518', titular: 'Ella misma', docs: 'Completo', vacaciones: 'Al día', emergencia: 'Pareja · 0412-•••-1180' },
    { id: 'e6', nombre: 'Luis Ángel Mora', ci: 'V-•••• 8812', cargo: 'Delivery', area: 'Delivery', ingreso: '21 abr 2025', anios: 1, formal: false, estado: 'activo', turno: 'T-2', tipoSal: 'quincenal', sueldo: 250, pct: 1.0, nac: [17, 9, 2000], contrato: 'Indeterminado', contratoVence: null, prueba: null, cert: 'Vigente hasta abr 2027', certOk: true, cuenta: 'Pago móvil 0414-•••-3390', titular: 'Él mismo', docs: 'Completo', vacaciones: 'Al día', emergencia: 'Mamá · 0424-•••-6602' },
    { id: 'e7', nombre: 'Patricia Reyes', ci: 'V-•••• 1150', cargo: 'Supervisora de salón', area: 'Servicio', ingreso: '13 sep 2021', anios: 5, formal: true, estado: 'activo', turno: 'T-1', tipoSal: 'quincenal', sueldo: 450, pct: 3.0, nac: [2, 10, 1984], contrato: 'Indeterminado', contratoVence: null, prueba: null, cert: 'Vigente hasta dic 2026', certOk: true, cuenta: 'Banesco •••• 7702', titular: 'Ella misma', docs: 'Completo', vacaciones: 'Programadas del 19 oct al 12 nov', emergencia: 'Esposo · 0414-•••-2019', usuario: 'patricia' },
    { id: 'e8', nombre: 'Andrés Colmenares', ci: 'V-•••• 3019', cargo: 'Barra', area: 'Servicio', ingreso: '4 nov 2024', anios: 1, formal: false, estado: 'activo', turno: 'T-2', tipoSal: 'quincenal', sueldo: 280, pct: 1.5, nac: [28, 9, 1998], contrato: 'Determinado', contratoVence: [30, 10], prueba: null, cert: 'Vigente hasta nov 2026', certOk: true, cuenta: 'Mercantil •••• 6650', titular: 'Él mismo', docs: 'Completo', vacaciones: 'Al día', emergencia: 'Hermano · 0412-•••-4471' },
    { id: 'e9', nombre: 'Ramón Quintero', ci: '', cargo: 'Vigilante', area: 'Seguridad', ingreso: '14 jul 2025', anios: 1, formal: false, estado: 'activo', turno: 'T-3', tipoSal: 'por_dia', diaria: 20, sueldo: 300, pct: 0.5, nac: null, contrato: 'Determinado (2.ª prórroga)', contratoVence: [31, 9], prueba: null, cert: 'No aplica (no manipula alimentos)', certOk: true, cuenta: 'Pago móvil 0416-•••-9021', titular: 'Su hijo (V-•••• 7781)', docs: 'Falta la cédula y la fecha de nacimiento', vacaciones: 'Al día', emergencia: '—' },
    { id: 'e10', nombre: 'Rosa Medina', ci: 'V-•••• 5590', cargo: 'Mesonera', area: 'Servicio', ingreso: '14 sep 2026', anios: 0, formal: false, estado: 'activo', turno: 'T-2', tipoSal: 'quincenal', sueldo: 240, pct: 0, nac: [11, 11, 2003], contrato: 'Determinado', contratoVence: [13, 11], prueba: [14, 9], cert: 'En trámite (pidió cita)', certOk: false, cuenta: 'Banesco •••• 3398', titular: 'Ella misma', docs: 'Falta certificado de salud', vacaciones: 'Todavía no causa', emergencia: 'Mamá · 0424-•••-1137' },
    { id: 'e11', nombre: 'Jhonny Pérez', ci: 'V-•••• 7046', cargo: 'Asador', area: 'Cocina', ingreso: '15 may 2023', anios: 3, formal: false, estado: 'activo', turno: 'T-2', tipoSal: 'por_dia', diaria: 26, sueldo: 390, pct: 2.0, nac: [3, 0, 1989], contrato: 'Indeterminado', contratoVence: null, prueba: null, cert: 'Vigente hasta may 2027', certOk: true, cuenta: 'Venezuela •••• 4402', titular: 'Él mismo', docs: 'Completo', vacaciones: '17 días por programar', emergencia: 'Esposa · 0416-•••-8830' },
    { id: 'e12', nombre: 'Mariela Castillo', ci: 'V-•••• 2264', cargo: 'Cajera', area: 'Caja', ingreso: '17 oct 2022', anios: 3, formal: true, estado: 'reposo', turno: 'T-2', tipoSal: 'quincenal', sueldo: 300, pct: 1.5, nac: [19, 9, 1995], contrato: 'Indeterminado', contratoVence: null, prueba: null, cert: 'Vigente hasta oct 2026', certOk: true, cuenta: 'Bicentenario •••• 1009', titular: 'Ella misma', docs: 'Completo', vacaciones: 'Al día', emergencia: 'Mamá · 0412-•••-9930' },
    { id: 'e13', nombre: 'Wilmer Ortega', ci: 'V-•••• 6608', cargo: 'Mesonero', area: 'Servicio', ingreso: '6 feb 2023', anios: 3, formal: false, estado: 'vacaciones', turno: 'T-1', tipoSal: 'quincenal', sueldo: 260, pct: 2.0, nac: [8, 10, 1996], contrato: 'Indeterminado', contratoVence: null, prueba: null, cert: 'Vigente hasta feb 2027', certOk: true, cuenta: 'Banesco •••• 2290', titular: 'Él mismo', docs: 'Completo', vacaciones: 'Disfrutando hasta el 19 oct', emergencia: 'Mamá · 0414-•••-6031' },
    { id: 'e14', nombre: 'Gabriela Núñez', ci: 'V-•••• 9917', cargo: 'Mesonera', area: 'Servicio', ingreso: '11 mar 2024', anios: 2, formal: false, estado: 'egresado', egreso: 'Mié 30 sep 2026', motivoEgreso: 'Renuncia', turno: 'T-2', tipoSal: 'quincenal', sueldo: 250, pct: 1.5, nac: [6, 5, 2001], contrato: 'Indeterminado', contratoVence: null, prueba: null, cert: '—', certOk: true, cuenta: 'Provincial •••• 7703', titular: 'Ella misma', docs: 'Completo', vacaciones: 'Se pagan en la liquidación', emergencia: '—' },
  ];
  const TURNOS = { 'T-1': ['Mañana', '7:00 a 15:00'], 'T-2': ['Tarde', '15:00 a 23:00'], 'T-3': ['Noche', '23:00 a 7:00 (nocturno: +30 %)'] };

  /* ---------- asistencia ---------- */
  // semana del lun 5 al dom 11 oct · 1 2 3 = turno · D descanso · V vacaciones · R reposo
  const HORARIOS = {
    semana: 'Lunes 5 al domingo 11 de octubre', dias: ['Lun 5', 'Mar 6', 'Mié 7', 'Jue 8', 'Vie 9', 'Sáb 10', 'Dom 11'],
    filas: {
      e1: ['D', 'D', '1', '1', '1', '1', '1'], e2: ['2', '2', 'D', 'D', '2', '2', '2'], e3: ['1', '1', '1', 'D', 'D', '1', '1'],
      e4: ['2', '2', '2', '2', 'D', 'D', '2'], e5: ['1', 'D', 'D', '1', '1', '1', '1'], e6: ['D', 'D', '2', '2', '2', '2', '2'],
      e7: ['1', '1', '1', '1', 'D', 'D', '1'], e8: ['2', 'D', 'D', '2', '2', '2', '2'], e9: ['3', '3', '3', '3', '3', 'D', 'D'],
      e10: ['2', '2', 'D', 'D', '2', '2', '2'], e11: ['2', '2', '2', 'D', 'D', '2', '2'], e12: ['R', 'R', 'R', 'R', 'R', 'R', 'R'],
      e13: ['V', 'V', 'V', 'V', 'V', 'V', 'V'],
    },
    // lo que marcó el reloj hoy hasta las 14:05 (ejemplo)
    hoy: { e3: ['6:58', ''], e5: ['7:12', 'llegó 12 min tarde'], e7: ['6:50', ''], e9: ['', 'salió 7:04 del turno de anoche'] },
  };
  // horas de la 2.ª quincena de septiembre (16 al 30) · ejemplo de cómo se verá con el Excel del reloj
  const HORAS = {
    periodo: '16 al 30 de septiembre',
    filas: {
      e1: { prog: 96, trab: 98, extra: 2, noct: 0, tarde: 0, redobles: 0, faltas: 0 },
      e2: { prog: 96, trab: 104, extra: 8, noct: 0, tarde: 15, redobles: 1, faltas: 0 },
      e3: { prog: 96, trab: 95.5, extra: 0, noct: 0, tarde: 25, redobles: 0, faltas: 0 },
      e4: { prog: 88, trab: 92, extra: 0, noct: 0, tarde: 40, redobles: 2, faltas: 0 },
      e5: { prog: 96, trab: 96, extra: 0, noct: 0, tarde: 12, redobles: 0, faltas: 0 },
      e6: { prog: 88, trab: 80, extra: 0, noct: 0, tarde: 55, redobles: 0, faltas: 1 },
      e7: { prog: 96, trab: 97, extra: 1, noct: 0, tarde: 0, redobles: 0, faltas: 0 },
      e8: { prog: 88, trab: 94, extra: 0, noct: 0, tarde: 10, redobles: 1, faltas: 0 },
      e9: { prog: 96, trab: 96, extra: 0, noct: 96, tarde: 0, redobles: 0, faltas: 0 },
      e10: { prog: 72, trab: 70, extra: 0, noct: 0, tarde: 30, redobles: 0, faltas: 0 },
      e11: { prog: 96, trab: 81, extra: 0, noct: 0, tarde: 20, redobles: 0, faltas: 0 },
      e12: { prog: 96, trab: 88, extra: 0, noct: 0, tarde: 0, redobles: 0, faltas: 0 },
      e13: { prog: 88, trab: 88, extra: 0, noct: 0, tarde: 5, redobles: 1, faltas: 0 },
    },
  };
  const FALTAS = [
    { id: 'fa1', emp: 'e4', fecha: 'Sáb 3 oct', turno: 'T-2', estado: 'por_justificar', nota: 'Avisó por WhatsApp que amaneció con fiebre. Falta el justificativo médico.', mes: 0 },
    { id: 'fa2', emp: 'e6', fecha: 'Jue 1 oct', turno: 'T-2', estado: 'injustificada', nota: 'No avisó. Es la 2.ª en los últimos 30 días (la otra fue el sáb 26 sep).', mes: 2, clasifico: 'Jose' },
    { id: 'fa3', emp: 'e8', fecha: 'Mar 29 sep', turno: 'T-2', estado: 'justificada', nota: 'Justificativo médico de 1 día (gastroenteritis).', soporte: 'Justificativo médico 29 sep.jpg', mes: 0, clasifico: 'Jose' },
    { id: 'fa4', emp: 'e3', fecha: 'Vie 25 sep', turno: 'T-1', estado: 'justificada', nota: 'Permiso para una cita en el SAIME. Trajo la constancia.', soporte: 'Constancia SAIME 25 sep.pdf', mes: 0, clasifico: 'Jose' },
  ];
  const REDOBLES = [
    { id: 'rd1', emp: 'e4', fecha: 'Vie 2 oct', tipo: 'redoble', veces: 1, detalle: 'Cubrió el turno de la mañana de Wilmer (vacaciones) además del suyo', fuente: 'Lo anotó la supervisora', revisado: false },
    { id: 'rd2', emp: 'e2', fecha: 'Dom 4 oct', tipo: 'dia_extra', veces: 1, detalle: 'Trabajó en su día de descanso', fuente: 'Lo anotó la supervisora', revisado: false },
    { id: 'rd3', emp: 'e8', fecha: 'Sáb 3 oct', tipo: 'redoble', veces: 1, detalle: 'Se quedó al cierre por el evento de la terraza', fuente: 'Lo anotó la supervisora', revisado: true },
    { id: 'rd4', emp: 'e11', fecha: 'Jue 1 oct', tipo: 'redoble', veces: 1, detalle: 'Doble turno en la parrilla', fuente: 'Lo anotó la supervisora', revisado: false },
  ];
  const INCIDENCIAS = [
    { id: 'in1', emp: 'e11', periodo: '16 al 30 sep', esperadas: 96, reales: 81, estado: 'alertada', acuerdo: '', causa: '' },
    { id: 'in2', emp: 'e6', periodo: '16 al 30 sep', esperadas: 88, reales: 80, estado: 'resuelta', acuerdo: 'Se descuenta 1 día (la falta injustificada del 26 sep)', causa: 'Falta sin aviso' },
  ];

  /* ---------- vacaciones, reposos y justificativos ---------- */
  const VACACIONES = [
    { id: 'va1', emp: 'e1', periodo: 'Año 4 (mar 2025 – mar 2026)', dias: 18, bono: 18, estado: 'causada', acumulados: 2, nota: 'Tiene 2 períodos sin disfrutar, el máximo. Hay que darle vacaciones antes del 1 de marzo.' },
    { id: 'va2', emp: 'e7', periodo: 'Año 5 (sep 2025 – sep 2026)', dias: 19, bono: 19, estado: 'programada', desde: [19, 9], hasta: [12, 10], regresa: 'Vie 13 nov', cubre: 'Daniela Salas como encargada del turno de la mañana' },
    { id: 'va3', emp: 'e13', periodo: 'Año 3 (feb 2025 – feb 2026)', dias: 15, bono: 17, estado: 'disfrutando', desde: [28, 8], hasta: [19, 9], regresa: 'Mar 20 oct', cubre: 'Kevin Torres y Rosa Medina se reparten sus mesas' },
    { id: 'va4', emp: 'e2', periodo: 'Año 3 (ago 2025 – ago 2026)', dias: 17, bono: 17, estado: 'causada', acumulados: 1, nota: 'Por programar.' },
    { id: 'va5', emp: 'e3', periodo: 'Año 2 (ene 2025 – ene 2026)', dias: 16, bono: 16, estado: 'causada', acumulados: 1, nota: 'Por programar.' },
    { id: 'va6', emp: 'e11', periodo: 'Año 3 (may 2025 – may 2026)', dias: 17, bono: 17, estado: 'programada', desde: [16, 10], hasta: [8, 11], regresa: 'Mié 9 dic', cubre: 'Por definir' },
  ];
  const REPOSOS = [
    { id: 'rp1', emp: 'e12', tipo: 'reposo', emisor: 'Médico del IVSS', motivo: 'Esguince de tobillo', desde: [30, 8], hasta: [14, 9], dias: 15, convalidado: false, soporte: 'Reposo IVSS 30 sep.jpg', nota: 'Es de la nómina formal: desde el día 4 el IVSS paga 2/3 y el negocio 1/3.' },
    { id: 'rp2', emp: 'e8', tipo: 'justificativo', emisor: 'Clínica privada', motivo: 'Gastroenteritis', desde: [29, 8], hasta: [29, 8], dias: 1, convalidado: true, soporte: 'Justificativo médico 29 sep.jpg', nota: 'Un día: justifica la falta, no hace falta el IVSS.' },
    { id: 'rp3', emp: 'e4', tipo: 'justificativo', emisor: 'Por subir', motivo: 'Fiebre (avisó por WhatsApp)', desde: [3, 9], hasta: [3, 9], dias: 1, convalidado: false, soporte: '', nota: 'Si no trae el justificativo antes de la nómina, la falta queda injustificada.' },
  ];
  const PERMISOS_EMP = [
    { id: 'pm1', emp: 'e3', fecha: 'Vie 25 sep', horas: 'Turno completo', tipo: 'Remunerado', motivo: 'Cita en el SAIME', soporte: true },
    { id: 'pm2', emp: 'e10', fecha: 'Sáb 10 oct', horas: '15:00 a 18:00', tipo: 'No remunerado', motivo: 'Graduación de su hermano', soporte: false },
  ];

  /* ---------- préstamos, adelantos y consumos del personal ---------- */
  const QUINCENAS = ['15 jun', '30 jun', '15 jul', '31 jul', '15 ago', '31 ago', '15 sep', '30 sep', '15 oct', '31 oct', '15 nov', '30 nov', '15 dic', '31 dic'];
  const PRESTAMOS = [
    { id: 'pr1', emp: 'e4', monto: 300, cuotas: 6, cuota: 50, pagadas: 2, corridas: 0, inicio: '15 sep', fecha: 'Mié 2 sep', motivo: 'Reparar la moto para venir al trabajo', desde: 'BVCA', aprobo: 'Alejandro', registro: 'Jose', firmada: true, estado: 'activo' },
    { id: 'pr2', emp: 'e2', monto: 600, cuotas: 12, cuota: 50, pagadas: 8, corridas: 0, inicio: '15 jun', fecha: 'Vie 12 jun', motivo: 'Gastos médicos de su mamá', desde: 'BVCJ', aprobo: 'Alejandro', registro: 'Jose', firmada: true, estado: 'activo' },
    { id: 'pr3', emp: 'e5', monto: 150, cuotas: 3, cuota: 50, pagadas: 3, corridas: 0, inicio: '15 ago', fecha: 'Mar 28 jul', motivo: 'Útiles escolares', desde: 'Bóveda', aprobo: 'Alejandro', registro: 'Jose', firmada: true, estado: 'pagada' },
    { id: 'pr4', emp: 'e10', monto: 200, cuotas: 4, cuota: 50, pagadas: 0, corridas: 0, inicio: '15 oct', fecha: 'Hoy', motivo: 'Inscripción del colegio de su hijo', desde: 'BVCA', aprobo: '', registro: 'Jose', firmada: true, estado: 'por_aprobar' },
    { id: 'pr5', emp: 'e14', monto: 400, cuotas: 8, cuota: 50, pagadas: 6, corridas: 0, inicio: '15 jul', fecha: 'Vie 10 jul', motivo: 'Mudanza', desde: 'BVCA', aprobo: 'Alejandro', registro: 'Jose', firmada: true, estado: 'en_liquidacion' },
    { id: 'pr6', emp: 'e1', monto: 250, cuotas: 5, cuota: 50, pagadas: 1, corridas: 0, inicio: '30 sep', fecha: 'Vie 25 sep', motivo: 'Reparación de la nevera de su casa', desde: 'BVCE', aprobo: 'Alejandro', registro: 'Jose', firmada: true, estado: 'activo' },
    { id: 'pr7', emp: 'e11', monto: 120, cuotas: 4, cuota: 30, pagadas: 1, corridas: 1, corridaEn: ['30 sep'], inicio: '15 sep', fecha: 'Jue 10 sep', motivo: 'Lentes', desde: 'Bóveda', aprobo: 'Alejandro', registro: 'Jose', firmada: false, estado: 'activo', nota: 'La cuota del 30 sep se corrió al final: faltó 3 días y el pago no alcanzaba para descontarla sin pasar el tope.' },
  ];
  const ADELANTOS = [
    { id: 'ad1', emp: 'e8', monto: 60, fecha: 'Jue 1 oct', descuenta: '15 oct', motivo: 'Medicinas', aprobo: 'Jose', desde: 'Caja chica', estado: 'por_descontar' },
    { id: 'ad2', emp: 'e6', monto: 40, fecha: 'Sáb 3 oct', descuenta: '15 oct', motivo: 'Repuesto de la moto', aprobo: 'Jose', desde: 'Caja chica', estado: 'por_descontar' },
    { id: 'ad3', emp: 'e3', monto: 50, fecha: 'Mar 22 sep', descuenta: '30 sep', motivo: 'Pasaje para un viaje familiar', aprobo: 'Jose', desde: 'Caja chica', estado: 'descontada' },
  ];
  // consumos del personal: período 28 sep → 27 oct, se descuentan en la 2.ª quincena (31 oct)
  const CONSUMOEMP = [
    { id: 'ce1', emp: 'e4', fecha: 'Sáb 3 oct', que: 'Hamburguesa de la casa y refresco', monto: 9.80, pedido: 'POS 1288' },
    { id: 'ce2', emp: 'e4', fecha: 'Jue 1 oct', que: '2 refrescos', monto: 3.00, pedido: 'POS 1204' },
    { id: 'ce3', emp: 'e8', fecha: 'Vie 2 oct', que: 'Arepa armada', monto: 6.50, pedido: 'POS 1251' },
    { id: 'ce4', emp: 'e3', fecha: 'Mié 30 sep', que: 'Cachapa con queso para llevar', monto: 7.20, pedido: 'POS 1180' },
    { id: 'ce5', emp: 'e2', fecha: 'Dom 4 oct', que: 'Pabellón para llevar', monto: 11.40, pedido: 'POS 1305' },
    { id: 'ce6', emp: 'e6', fecha: 'Sáb 3 oct', que: 'Jarra de papelón y 3 empanadas', monto: 8.90, pedido: 'POS 1290' },
  ];

  /* ---------- nómina: 10 %, propinas, recibos, prestaciones, liquidaciones ---------- */
  const BOLSA = {
    anterior: { periodo: '28 ago al 27 sep', comision: 9120, tasaEur: 701.30, pagada: 'con la 2.ª quincena de septiembre', cargo: 'Jose' },
    actual: { periodo: '28 sep al 27 oct', comision: null, carga: 'Se carga el miércoles 28 de octubre' },
  };
  const PROPINAS = [
    { id: 'pp1', semana: '28 sep al 4 oct', pote: 412, regla: 'Partes iguales entre los que trabajaron la semana (servicio y cocina)', personas: 31, estado: 'por_repartir' },
    { id: 'pp2', semana: '21 al 27 sep', pote: 386, regla: 'Partes iguales entre los que trabajaron la semana (servicio y cocina)', personas: 32, estado: 'pagada' },
  ];
  const RECIBOS = [
    { corrida: 'n1', fecha: '30 sep', firmados: 41, total: 49 },
    { corrida: 'n2', fecha: '15 sep', firmados: 48, total: 48 },
    { corrida: 'n3', fecha: '31 ago', firmados: 49, total: 49 },
  ];
  // base mensual de prestaciones de los internos = mínimo + cestaticket + margen (dictado 29-ago; el margen está por confirmar)
  const PRESTA = {
    baseInterna: 100, margen: 60, baseFormal: 0.21, trimestres2026: 3,
    anticipos: { e2: 40 }, pagadoDic2025: { e1: 225, e2: 210, e3: 225, e4: 131, e7: 230, e8: 31, e11: 225, e12: 220, e13: 225, e6: 140, e5: 160 },
  };
  const LIQUIDACIONES = [
    { id: 'lq1', emp: 'e14', motivo: 'Renuncia', egreso: 'Mié 30 sep', vence: 'Hoy, lunes 5 de octubre', tiempo: '2 años, 6 meses y 19 días', preparo: 'Jose', estado: 'por_aprobar',
      lineas: [
        ['Garantía de prestaciones acumulada', 570.00, 'Gana la garantía: es mayor que el cálculo retroactivo ($ 337,50)'],
        ['Menos lo ya pagado en diciembre de 2024 y de 2025', -382.00, 'La liquidación anual es un pago a cuenta'],
        ['Vacaciones fraccionadas (7 de 12 meses)', 37.30, ''],
        ['Bono vacacional fraccionado', 37.30, ''],
        ['Utilidades fraccionadas (9 de 12 meses, 30 días)', 75.00, 'Días por confirmar con Cecilia'],
        ['Menos el saldo de su préstamo', -100.00, 'Préstamo de la mudanza: 6 de 8 cuotas pagadas'],
      ] },
  ];
  const DICIEMBRE = { liquidacionAnual: 6580, utilidades: 3900, intereses: 260, apartado: 7200, mensual: 1180 };

  /* ---------- disciplina y protección ---------- */
  const FUEROS = [
    { id: 'fu1', emp: 'e5', tipo: 'Maternal', desde: 'Embarazo (2025)', hasta: 'Mar 2028 (2 años después del parto)' },
    { id: 'fu2', emp: 'e7', tipo: 'Delegada de prevención', desde: 'Ene 2025', hasta: 'Mandato + 3 meses' },
    { id: 'fu3', emp: 'e12', tipo: 'Reposo médico', desde: '30 sep', hasta: '14 oct' },
  ];
  const AMONESTACIONES = [
    { id: 'am1', emp: 'e6', fecha: 'Jue 1 oct', hechos: 'Faltó sin avisar al turno de la tarde (2.ª en 30 días)', tipo: 'Escrita', firma: 'Se negó a firmar · firmaron 2 testigos', quedan: 26 },
  ];
  const ACUERDOS = [
    ['Acuerdo del incremento complementario del cestaticket', 31, 49, 'El monto fijo pactado, firmado por cada persona'],
    ['Autorización para descontar préstamos y adelantos', 6, 7, 'Una por préstamo: sin ella no se descuenta'],
    ['Elección de intereses de prestaciones', 12, 49, 'Cobrarlos o capitalizarlos, por escrito'],
  ];

  /* ---------- consumo de los socios (tope mensual) ---------- */
  const CONSUMO_SOCIOS = {
    tope: 500, base: 'precio de la carta', mes: 'Octubre', cierre: 'Se cierra el sábado 31 a las 23:59',
    socios: [
      { socio: 'Alejandro', usuario: 'alejandro', oct: 86.40, sep: 462.00, ago: 488.50 },
      { socio: 'Luis Roberto', usuario: 'luis', oct: 112.80, sep: 548.00, ago: 431.20 },
    ],
    lista: [
      { id: 'cs1', socio: 'Luis Roberto', fecha: 'Dom 4 oct · 14:20', pedido: 'POS 1302', que: 'Parrilla para dos y 2 jarras de papelón', carta: 58.40, costo: 19.30, tipo: 'personal' },
      { id: 'cs2', socio: 'Alejandro', fecha: 'Sáb 3 oct · 21:10', pedido: 'POS 1279', que: 'Cena con el proveedor de carnes', carta: 64.20, costo: 21.70, tipo: 'invitacion' },
      { id: 'cs3', socio: 'Luis Roberto', fecha: 'Vie 2 oct · 13:05', pedido: 'POS 1240', que: '2 almuerzos ejecutivos', carta: 24.80, costo: 8.10, tipo: 'personal' },
      { id: 'cs4', socio: 'Alejandro', fecha: 'Jue 1 oct · 20:30', pedido: 'POS 1201', que: 'Cachapas para llevar (familia)', carta: 42.60, costo: 13.90, tipo: 'personal' },
      { id: 'cs5', socio: 'Alejandro', fecha: 'Lun 5 oct · 12:40', pedido: 'POS 1311', que: 'Pabellón, ensalada y papelón', carta: 43.80, costo: 14.60, tipo: 'personal' },
      { id: 'cs6', socio: 'Luis Roberto', fecha: 'Sáb 3 oct · 22:15', pedido: 'POS 1283', que: 'Tequeños y 4 cervezas', carta: 29.60, costo: 10.20, tipo: 'personal' },
    ],
  };

  /* ---------- calendario: reservas y eventos ---------- */
  // d = [día, mes 0-11] · estado: confirmada, por_confirmar, llego, no_vino, cancelada
  const RESERVAS = [
    { id: 'rs1', d: [5, 9], hora: '19:30', nombre: 'Familia Rodríguez', tel: '0414-•••-2210', personas: 8, area: 'Terraza', mesa: 'T4 + T5', ocasion: 'Cumpleaños', notas: 'Traen su torta: tener velas, platos de postre y cuchillo', canal: 'WhatsApp del restaurante', estado: 'confirmada', abono: 0, tomo: 'Patricia', visitas: 6 },
    { id: 'rs2', d: [5, 9], hora: '20:00', nombre: 'Carolina Méndez', tel: '0424-•••-7781', personas: 2, area: 'Salón', mesa: 'S12', ocasion: 'Aniversario', notas: 'Mesa tranquila, lejos de la barra', canal: 'Instagram', estado: 'confirmada', abono: 0, tomo: 'Patricia', visitas: 1 },
    { id: 'rs3', d: [6, 9], hora: '13:00', nombre: 'Inversiones Delta (almuerzo de trabajo)', tel: '0241-•••-4400', personas: 12, area: 'Salón privado', mesa: 'Privado', ocasion: 'Negocios', notas: 'Piden factura a nombre de la empresa', canal: 'Teléfono', estado: 'por_confirmar', abono: 60, abonoOk: false, tomo: 'Alejandro', visitas: 2 },
    { id: 'rs4', d: [9, 9], hora: '20:30', nombre: 'Andrea Paz', tel: '0412-•••-3092', personas: 6, area: 'Terraza', mesa: 'T2', ocasion: 'Cumpleaños', notas: '', canal: 'WhatsApp del restaurante', estado: 'confirmada', abono: 0, tomo: 'Patricia', visitas: 3 },
    { id: 'rs5', d: [10, 9], hora: '21:00', nombre: 'José Luis Herrera', tel: '0414-•••-5527', personas: 4, area: 'Salón', mesa: 'S5', ocasion: '', notas: 'Una silla para bebé', canal: 'WhatsApp del restaurante', estado: 'por_confirmar', abono: 0, tomo: 'Patricia', visitas: 0 },
    { id: 'rs6', d: [11, 9], hora: '13:00', nombre: 'Familia Contreras', tel: '0416-•••-1180', personas: 5, area: 'Salón', mesa: 'S8', ocasion: '', notas: 'Alergia al maní (un niño)', canal: 'En persona', estado: 'confirmada', abono: 0, tomo: 'Patricia', visitas: 9 },
    { id: 'rs7', d: [17, 9], hora: '20:00', nombre: 'Promoción 2016 del liceo', tel: '0424-•••-9930', personas: 15, area: 'Terraza', mesa: 'T1 a T5', ocasion: 'Reencuentro', notas: 'Abono recibido por pago móvil (lo confirmó el bot de Caja)', canal: 'WhatsApp del restaurante', estado: 'confirmada', abono: 75, abonoOk: true, tomo: 'Patricia', visitas: 0 },
    { id: 'rs8', d: [3, 9], hora: '20:00', nombre: 'Familia Pérez', tel: '0412-•••-4410', personas: 10, area: 'Terraza', mesa: 'T3 + T4', ocasion: 'Cumpleaños', notas: '', canal: 'WhatsApp del restaurante', estado: 'llego', abono: 50, abonoOk: true, tomo: 'Patricia', visitas: 4 },
    { id: 'rs9', d: [4, 9], hora: '13:30', nombre: 'Mariana Gil', tel: '0414-•••-6609', personas: 4, area: 'Salón', mesa: 'S3', ocasion: '', notas: '', canal: 'Instagram', estado: 'no_vino', abono: 0, tomo: 'Patricia', visitas: 0 },
    { id: 'rs10', d: [24, 9], hora: '20:00', nombre: 'Daniel Ochoa', tel: '0424-•••-2231', personas: 3, area: 'Salón', mesa: 'S10', ocasion: 'Pedida de mano', notas: 'Quiere el postre con un mensaje escrito', canal: 'WhatsApp del restaurante', estado: 'confirmada', abono: 0, tomo: 'Patricia', visitas: 2 },
  ];
  // tipo: privado (alguien alquila o reserva un evento) · propio (lo organiza el restaurante)
  const EVENTOS_AG = [
    { id: 'evp1', tipo: 'privado', nombre: 'Cumpleaños 50 en el salón privado', d: [17, 9], hora: '19:00 a 23:00', personas: 40, cliente: 'Graciela T.', menu: 'Parrilla libre, tequeños de entrada y su torta (descorche de torta incluido)', porPersona: 28, abono: 500, abonoVia: 'Pago móvil a BVCA · confirmado por el bot de Caja', estado: 'confirmado',
      tareas: [['Compras: 18 kg de carne y 6 kg de queso (avisado a Manuel)', true], ['2 mesoneros de refuerzo (Kevin y Rosa)', true], ['Montaje del salón a las 17:00', false], ['Cobrar el saldo el día del evento', false]] },
    { id: 'evp2', tipo: 'privado', nombre: 'Almuerzo de fin de año de una empresa', d: [22, 9], hora: '12:30 a 15:30', personas: 25, cliente: 'Empresa de ejemplo C.A.', menu: 'Menú ejecutivo con entrada, plato fuerte y postre', porPersona: 16, abono: 0, abonoVia: '', estado: 'presupuesto',
      tareas: [['Presupuesto enviado el vie 2 oct', true], ['Esperando el abono del 50 % para confirmar', false]] },
    { id: 'evp3', tipo: 'propio', nombre: 'Noche de Halloween en la terraza', d: [31, 9], hora: 'Desde las 20:00', personas: 180, cliente: 'Evento del restaurante', menu: 'Carta normal + 2 cocteles de temporada · música en vivo', porPersona: 0, abono: 0, abonoVia: '', estado: 'confirmado',
      tareas: [['Contratar la música (Luis Roberto)', true], ['Arte para Instagram', false], ['Refuerzo de 4 personas en el turno de la noche', false]] },
    { id: 'evp4', tipo: 'propio', nombre: 'Día de la Resistencia Indígena (feriado)', d: [12, 9], hora: 'Todo el día', personas: 0, cliente: 'Feriado nacional', menu: 'El año pasado se vendió +18 % ese día', porPersona: 0, abono: 0, abonoVia: '', estado: 'confirmado', tareas: [['Recargo del 50 % para quien trabaje', true]] },
  ];
  const GRUPO_MESONEROS = { nombre: 'Mesoneros del restaurante', estado: 'por crear', miembros: 'Supervisora, mesoneros, barra y caja' };

  Object.assign(DB, { MESES, EMPLEADOS, TURNOS, HORARIOS, HORAS, FALTAS, REDOBLES, INCIDENCIAS, VACACIONES, REPOSOS, PERMISOS_EMP, QUINCENAS, PRESTAMOS, ADELANTOS, CONSUMOEMP, BOLSA, PROPINAS, RECIBOS, PRESTA, LIQUIDACIONES, DICIEMBRE, FUEROS, AMONESTACIONES, ACUERDOS, CONSUMO_SOCIOS, RESERVAS, EVENTOS_AG, GRUPO_MESONEROS });
})();
