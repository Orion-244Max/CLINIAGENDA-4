/**
 * models/Cita.js
 * ==========================================================
 * MODELO: Cita (Entidad, Reglas de Negocio y Persistencia)
 * ----------------------------------------------------------
 * Representa una cita médica en el sistema CliniAgenda.
 * Controla:
 *   - Estados: 'pending' (Por confirmar), 'confirmed' (Confirmada),
 *              'attended' (Atendida), 'cancelled' (Cancelada)
 *   - Validación de colisión de horarios por médico y fecha
 *   - Persistencia en localStorage ('citas')
 *   - Reglas de transición de estados según el rol
 * ==========================================================
 */

class CitaModel {
  static STORAGE_KEY = 'citas';

  static ESTADOS = {
    PENDIENTE: 'pending',     // Por confirmar (solicitada por paciente o modificada)
    CONFIRMADA: 'confirmed',   // Confirmada por recepción
    ATENDIDA: 'attended',     // Consulta médica realizada
    CANCELADA: 'cancelled'    // Cancelada
  };

  static MEDICOS_DISPONIBLES = [
    { nombre: 'Dr. Carlos Ramírez', especialidad: 'Cardiología' },
    { nombre: 'Dra. Lucía Flores', especialidad: 'Pediatría' },
    { nombre: 'Dr. Jorge Medina', especialidad: 'Medicina General' },
    { nombre: 'Dra. Andrea Salas', especialidad: 'Ginecología' },
    { nombre: 'Dr. Miguel Torres', especialidad: 'Odontología' },
    { nombre: 'Dra. Paola Rivas', especialidad: 'Laboratorio' }
  ];

  /**
   * Obtiene la lista completa de citas desde localStorage
   * @returns {Array<Object>}
   */
  static obtenerTodas() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const citas = data ? JSON.parse(data) : [];
      return Array.isArray(citas) ? citas : [];
    } catch (e) {
      console.error('Error al leer citas de localStorage:', e);
      return [];
    }
  }

  /**
   * Guarda la lista completa de citas en localStorage
   * @param {Array<Object>} lista
   * @returns {boolean}
   */
  static guardarTodas(lista) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
      return true;
    } catch (e) {
      console.error('Error al guardar citas en localStorage:', e);
      return false;
    }
  }

  /**
   * Busca una cita por su identificador único
   * @param {string|number} id
   * @returns {Object|null}
   */
  static buscarPorId(id) {
    if (!id) return null;
    const lista = this.obtenerTodas();
    return lista.find(c => String(c.id) === String(id)) || null;
  }

  /**
   * Normaliza el nombre del doctor para comparaciones sin tildes ni prefijos
   * @param {string} nombre
   * @returns {string}
   */
  static normalizarDoctor(nombre) {
    return String(nombre || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/^(dr\.?\s*|dra\.?\s*)/, '')
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Verifica si un médico ya tiene un turno reservado en esa fecha y hora
   * @param {string} doctor Nombre del médico
   * @param {string} fecha YYYY-MM-DD
   * @param {string} hora HH:MM
   * @param {string|number|null} idExcluir ID de la cita actual al editar
   * @returns {boolean} true si el horario está ocupado
   */
  static horarioOcupado(doctor, fecha, hora, idExcluir = null) {
    const docNorm = this.normalizarDoctor(doctor);
    return this.obtenerTodas().some(cita => {
      return (
        cita.status !== this.ESTADOS.CANCELADA &&
        String(cita.id) !== String(idExcluir || '') &&
        cita.date === fecha &&
        cita.time === hora &&
        this.normalizarDoctor(cita.doctor) === docNorm
      );
    });
  }

  /**
   * Fecha actual en formato YYYY-MM-DD
   * @returns {string}
   */
  static hoyISO() {
    const d = new Date();
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  }

  /**
   * Valida los datos requeridos para registrar o editar una cita
   * @param {Object} datos
   * @param {string|number|null} idExcluir
   * @returns {{esValido: boolean, errores: Object}}
   */
  static validar(datos, idExcluir = null) {
    const errores = {};

    // 1. Paciente
    if (!datos.patient || !String(datos.patient).trim()) {
      errores.patient = 'Debe indicar el nombre del paciente.';
    }

    // 2. DNI del Paciente (8 dígitos)
    if (datos.patientDni && !/^[0-9]{8}$/.test(String(datos.patientDni).trim())) {
      errores.patientDni = 'El DNI debe tener 8 dígitos numéricos.';
    }

    // 3. Médico
    if (!datos.doctor || !String(datos.doctor).trim()) {
      errores.doctor = 'Debe seleccionar un médico asignado.';
    }

    // 4. Servicio / Especialidad
    if (!datos.service || !String(datos.service).trim()) {
      errores.service = 'Debe seleccionar una especialidad médica.';
    }

    // 5. Fecha
    if (!datos.date) {
      errores.date = 'Debe seleccionar una fecha para la cita.';
    } else if (datos.date < this.hoyISO()) {
      errores.date = 'La fecha de la cita no puede ser anterior al día de hoy.';
    }

    // 6. Hora
    if (!datos.time) {
      errores.time = 'Debe seleccionar una hora para la cita.';
    }

    // 7. Conflicto de horario
    if (datos.doctor && datos.date && datos.time) {
      if (this.horarioOcupado(datos.doctor, datos.date, datos.time, idExcluir)) {
        errores.horario = `El ${datos.doctor} ya tiene una cita programada para el ${datos.date} a las ${datos.time}. Por favor elija otro horario.`;
      }
    }

    return {
      esValido: Object.keys(errores).length === 0,
      errores
    };
  }

  /**
   * Registra una nueva cita médica
   * @param {Object} datos
   * @param {boolean} esAdmin Si es creada por Admin queda 'confirmed', si es Paciente queda 'pending'
   * @returns {{exito: boolean, mensaje: string, cita?: Object, errores?: Object}}
   */
  static crear(datos, esAdmin = false) {
    const validacion = this.validar(datos);
    if (!validacion.esValido) {
      return { exito: false, mensaje: 'Datos de la cita no válidos.', errores: validacion.errores };
    }

    const nuevaCita = {
      id: datos.id || Date.now().toString(),
      patient: String(datos.patient).trim(),
      patientDni: datos.patientDni ? String(datos.patientDni).trim() : '',
      patientEmail: datos.patientEmail ? String(datos.patientEmail).trim() : '',
      patientPhone: datos.patientPhone ? String(datos.patientPhone).trim() : '',
      doctor: String(datos.doctor).trim(),
      service: String(datos.service).trim(),
      date: datos.date,
      time: datos.time,
      mode: datos.mode || 'Presencial',
      notes: datos.notes ? String(datos.notes).trim() : '',
      reportado: false,
      status: esAdmin ? this.ESTADOS.CONFIRMADA : this.ESTADOS.PENDIENTE,
      reminderSent: false,
      creadaEn: new Date().toISOString()
    };

    const lista = this.obtenerTodas();
    lista.push(nuevaCita);

    if (this.guardarTodas(lista)) {
      const msg = esAdmin
        ? 'Cita registrada y confirmada correctamente.'
        : 'Solicitud de cita enviada. Queda pendiente de confirmación por recepción.';
      return { exito: true, mensaje: msg, cita: nuevaCita };
    }
    return { exito: false, mensaje: 'Error al persistir la cita en el sistema.' };
  }

  /**
   * Actualiza los datos de una cita existente
   * Si cambia el horario o médico, vuelve automáticamente al estado 'pending' (por confirmar)
   * @param {string|number} id
   * @param {Object} datosModificados
   * @returns {{exito: boolean, mensaje: string, cita?: Object, errores?: Object}}
   */
  static actualizar(id, datosModificados) {
    const validacion = this.validar(datosModificados, id);
    if (!validacion.esValido) {
      return { exito: false, mensaje: 'Datos no válidos.', errores: validacion.errores };
    }

    const lista = this.obtenerTodas();
    const index = lista.findIndex(c => String(c.id) === String(id));
    if (index === -1) {
      return { exito: false, mensaje: 'No se encontró la cita a modificar.' };
    }

    const citaActual = lista[index];
    const cambioHorario =
      citaActual.date !== datosModificados.date ||
      citaActual.time !== datosModificados.time ||
      this.normalizarDoctor(citaActual.doctor) !== this.normalizarDoctor(datosModificados.doctor);

    lista[index] = {
      ...citaActual,
      doctor: datosModificados.doctor,
      service: datosModificados.service,
      date: datosModificados.date,
      time: datosModificados.time,
      mode: datosModificados.mode || citaActual.mode,
      notes: datosModificados.notes !== undefined ? datosModificados.notes : citaActual.notes,
      // Si cambia fecha, hora o médico, vuelve a 'pending'
      status: cambioHorario ? this.ESTADOS.PENDIENTE : (datosModificados.status || citaActual.status),
      actualizadaEn: new Date().toISOString()
    };

    if (this.guardarTodas(lista)) {
      return { exito: true, mensaje: 'Cita actualizada correctamente.', cita: lista[index] };
    }
    return { exito: false, mensaje: 'Error al actualizar la cita.' };
  }

  /**
   * Cambia el estado de una cita
   * @param {string|number} id
   * @param {string} nuevoEstado
   * @returns {{exito: boolean, mensaje: string}}
   */
  static cambiarEstado(id, nuevoEstado) {
    const lista = this.obtenerTodas();
    const index = lista.findIndex(c => String(c.id) === String(id));
    if (index === -1) {
      return { exito: false, mensaje: 'Cita no encontrada.' };
    }

    lista[index].status = nuevoEstado;
    lista[index].actualizadaEn = new Date().toISOString();

    if (this.guardarTodas(lista)) {
      return { exito: true, mensaje: `Estado cambiado a ${nuevoEstado}.` };
    }
    return { exito: false, mensaje: 'Error al guardar el nuevo estado.' };
  }

  static confirmar(id) {
    return this.cambiarEstado(id, this.ESTADOS.CONFIRMADA);
  }

  static cancelar(id) {
    return this.cambiarEstado(id, this.ESTADOS.CANCELADA);
  }

  static marcarAtendida(id) {
    return this.cambiarEstado(id, this.ESTADOS.ATENDIDA);
  }

  /**
   * Filtra las citas de un médico para el día actual
   * @param {string} nombreMedico
   * @param {string} fecha YYYY-MM-DD (por defecto hoy)
   * @returns {Array<Object>}
   */
  static filtrarPorDoctor(nombreMedico, fecha = null) {
    const f = fecha || this.hoyISO();
    const norm = this.normalizarDoctor(nombreMedico);
    return this.obtenerTodas()
      .filter(c => this.normalizarDoctor(c.doctor) === norm && c.date === f && c.status !== this.ESTADOS.CANCELADA)
      .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
  }

  /**
   * Filtra las citas de un paciente por su DNI o Nombre
   * @param {string} dni
   * @param {string} nombre
   * @returns {Array<Object>}
   */
  static filtrarPorPaciente(dni, nombre = '') {
    const d = String(dni || '').trim();
    const n = String(nombre || '').trim().toLowerCase();
    return this.obtenerTodas().filter(c => {
      const matchDni = d && String(c.patientDni || '').trim() === d;
      const matchNombre = n && String(c.patient || '').trim().toLowerCase() === n;
      return matchDni || matchNombre;
    });
  }

  /**
   * Obtiene estadísticas generales del sistema para el Dashboard
   * @returns {Object}
   */
  static obtenerEstadisticas() {
    const todas = this.obtenerTodas();
    const activas = todas.filter(c => c.status !== this.ESTADOS.CANCELADA);
    const hoy = this.hoyISO();

    return {
      totalActivas: activas.length,
      citasHoy: activas.filter(c => c.date === hoy).length,
      pendientesConfirmacion: activas.filter(c => !c.status || c.status === this.ESTADOS.PENDIENTE).length,
      confirmadas: activas.filter(c => c.status === this.ESTADOS.CONFIRMADA).length,
      atendidas: todas.filter(c => c.status === this.ESTADOS.ATENDIDA).length,
      canceladas: todas.filter(c => c.status === this.ESTADOS.CANCELADA).length
    };
  }
}

// Compatibilidad
if (typeof window !== 'undefined') {
  window.CitaModel = CitaModel;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CitaModel;
}

