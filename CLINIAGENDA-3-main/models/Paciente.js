/**
 * models/Paciente.js
 * ==========================================================
 * MODELO: Paciente (Entidad, Reglas de Validación y Persistencia)
 * ----------------------------------------------------------
 * Representa los expedientes de pacientes en la clínica.
 * Maneja las operaciones CRUD en localStorage ('pacientes') y
 * la gestión de solicitudes enviadas por pacientes ('solicitudesPaciente').
 * ==========================================================
 */

class PacienteModel {
  static STORAGE_KEY = 'pacientes';
  static SOLICITUDES_KEY = 'solicitudesPaciente';

  /**
   * Obtiene la lista completa de pacientes guardados
   * @returns {Array<Object>} Lista de pacientes
   */
  static obtenerTodos() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error al leer pacientes de localStorage:', e);
      return [];
    }
  }

  /**
   * Guarda la lista de pacientes en localStorage
   * @param {Array<Object>} lista Lista de pacientes
   * @returns {boolean}
   */
  static guardarTodos(lista) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
      return true;
    } catch (e) {
      console.error('Error al guardar pacientes en localStorage:', e);
      return false;
    }
  }

  /**
   * Busca un paciente por su DNI
   * @param {string} dni DNI de 8 dígitos
   * @returns {Object|null}
   */
  static buscarPorDni(dni) {
    if (!dni) return null;
    const lista = this.obtenerTodos();
    return lista.find(p => String(p.dni).trim() === String(dni).trim()) || null;
  }

  /**
   * Valida los datos del paciente según los requerimientos del sistema
   * Reglas:
   *   - Nombre: mínimo 3 caracteres
   *   - DNI: exactamente 8 dígitos
   *   - Correo: formato válido con @
   *   - Teléfono: exactamente 9 dígitos
   * @param {Object} datos
   * @param {string|null} dniOriginal DNI previo si es edición
   * @returns {{esValido: boolean, errores: Object}}
   */
  static validar(datos, dniOriginal = null) {
    const errores = {};

    // 1. Nombre completo
    const nombre = String(datos.nombre || '').trim();
    if (!nombre) {
      errores.nombre = 'Falta completar el nombre completo.';
    } else if (nombre.length < 3) {
      errores.nombre = 'El nombre completo debe tener mínimo 3 caracteres.';
    }

    // 2. DNI
    const dni = String(datos.dni || '').trim();
    if (!dni) {
      errores.dni = 'Falta completar el DNI.';
    } else if (!/^[0-9]{8}$/.test(dni)) {
      errores.dni = 'El DNI debe tener exactamente 8 números.';
    } else {
      // Verificar unicidad si es registro nuevo o cambio de DNI
      const existente = this.buscarPorDni(dni);
      if (existente && (!dniOriginal || String(dniOriginal).trim() !== dni)) {
        errores.dni = 'Ya existe un paciente registrado con este DNI.';
      }
    }

    // 3. Correo
    const email = String(datos.email || datos.correo || '').trim();
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errores.email = 'Falta completar el correo electrónico.';
    } else if (!regexEmail.test(email)) {
      errores.email = 'El correo electrónico no tiene un formato válido.';
    }

    // 4. Teléfono
    const telefono = String(datos.telefono || datos.phone || '').trim();
    if (!telefono) {
      errores.telefono = 'Falta completar el teléfono.';
    } else if (!/^[0-9]{9}$/.test(telefono)) {
      errores.telefono = 'El teléfono debe tener exactamente 9 números.';
    }

    return {
      esValido: Object.keys(errores).length === 0,
      errores
    };
  }

  /**
   * Registra un nuevo paciente
   * @param {Object} datos
   * @returns {{exito: boolean, mensaje: string, paciente?: Object, errores?: Object}}
   */
  static crear(datos) {
    const validacion = this.validar(datos);
    if (!validacion.esValido) {
      return { exito: false, mensaje: 'Datos no válidos.', errores: validacion.errores };
    }

    const nuevoPaciente = {
      nombre: datos.nombre.trim(),
      dni: datos.dni.trim(),
      email: (datos.email || datos.correo || '').trim().toLowerCase(),
      telefono: (datos.telefono || datos.phone || '').trim(),
      fechaNacimiento: datos.fechaNacimiento || '',
      direccion: datos.direccion || '',
      historial: datos.historial || '',
      creadoEn: new Date().toISOString()
    };

    const lista = this.obtenerTodos();
    lista.push(nuevoPaciente);

    if (this.guardarTodos(lista)) {
      return { exito: true, mensaje: 'Paciente registrado exitosamente.', paciente: nuevoPaciente };
    }
    return { exito: false, mensaje: 'Error al persistir el paciente en localStorage.' };
  }

  /**
   * Actualiza los datos de un paciente existente
   * @param {string} dni DNI del paciente a actualizar
   * @param {Object} nuevosDatos
   * @returns {{exito: boolean, mensaje: string, errores?: Object}}
   */
  static actualizar(dni, nuevosDatos) {
    const validacion = this.validar(nuevosDatos, dni);
    if (!validacion.esValido) {
      return { exito: false, mensaje: 'Datos no válidos.', errores: validacion.errores };
    }

    const lista = this.obtenerTodos();
    const index = lista.findIndex(p => String(p.dni).trim() === String(dni).trim());
    if (index === -1) {
      return { exito: false, mensaje: 'No se encontró el paciente solicitado.' };
    }

    lista[index] = {
      ...lista[index],
      nombre: nuevosDatos.nombre.trim(),
      dni: nuevosDatos.dni.trim(),
      email: (nuevosDatos.email || nuevosDatos.correo || '').trim().toLowerCase(),
      telefono: (nuevosDatos.telefono || nuevosDatos.phone || '').trim(),
      fechaNacimiento: nuevosDatos.fechaNacimiento !== undefined ? nuevosDatos.fechaNacimiento : lista[index].fechaNacimiento,
      direccion: nuevosDatos.direccion !== undefined ? nuevosDatos.direccion : lista[index].direccion,
      historial: nuevosDatos.historial !== undefined ? nuevosDatos.historial : lista[index].historial,
      actualizadoEn: new Date().toISOString()
    };

    if (this.guardarTodos(lista)) {
      return { exito: true, mensaje: 'Paciente actualizado exitosamente.', paciente: lista[index] };
    }
    return { exito: false, mensaje: 'Error al guardar los cambios en localStorage.' };
  }

  /**
   * Elimina un paciente por su DNI
   * @param {string} dni DNI del paciente
   * @returns {{exito: boolean, mensaje: string}}
   */
  static eliminar(dni) {
    const lista = this.obtenerTodos();
    const filtrada = lista.filter(p => String(p.dni).trim() !== String(dni).trim());

    if (filtrada.length === lista.length) {
      return { exito: false, mensaje: 'El paciente no existe en el sistema.' };
    }

    if (this.guardarTodos(filtrada)) {
      return { exito: true, mensaje: 'Paciente eliminado correctamente.' };
    }
    return { exito: false, mensaje: 'Error al eliminar el registro.' };
  }

  /* ----------------------------------------------------------
   * SOLICITUDES DE REGISTRO DE PACIENTES
   * ---------------------------------------------------------- */
  static obtenerSolicitudes() {
    try {
      const data = localStorage.getItem(this.SOLICITUDES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static guardarSolicitudes(solicitudes) {
    try {
      localStorage.setItem(this.SOLICITUDES_KEY, JSON.stringify(solicitudes));
      return true;
    } catch (e) {
      return false;
    }
  }
}

// Compatibilidad
if (typeof window !== 'undefined') {
  window.PacienteModel = PacienteModel;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PacienteModel;
}

