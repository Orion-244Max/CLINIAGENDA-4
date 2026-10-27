/**
 * models/Usuario.js
 * ==========================================================
 * MODELO: Usuario (Entidad, Reglas de Validación y Persistencia)
 * ----------------------------------------------------------
 * Representa a los usuarios del sistema (ADMIN, MEDICO, PACIENTE).
 * Gestiona el almacenamiento en localStorage ('usuarios' y 'sesionActual'),
 * las validaciones de campos y el ciclo de autenticación / sesión.
 * ==========================================================
 */

class UsuarioModel {
  static STORAGE_KEY = 'usuarios';
  static SESION_KEY = 'sesionActual';
  static ROLES_VALIDOS = ['ADMIN', 'MEDICO', 'PACIENTE'];

  /**
   * Obtiene la lista completa de usuarios desde localStorage
   * @returns {Array<Object>} Lista de usuarios
   */
  static obtenerTodos() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error al leer usuarios de localStorage:', e);
      return [];
    }
  }

  /**
   * Guarda la lista completa de usuarios en localStorage
   * @param {Array<Object>} usuarios Lista de usuarios
   * @returns {boolean} true si se guardó con éxito
   */
  static guardarTodos(usuarios) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usuarios));
      return true;
    } catch (e) {
      console.error('Error al guardar usuarios en localStorage:', e);
      return false;
    }
  }

  /**
   * Busca un usuario por su DNI
   * @param {string} dni DNI de 8 dígitos
   * @returns {Object|null}
   */
  static buscarPorDni(dni) {
    if (!dni) return null;
    const lista = this.obtenerTodos();
    return lista.find(u => String(u.dni).trim() === String(dni).trim()) || null;
  }

  /**
   * Busca un usuario por su correo electrónico
   * @param {string} email Correo electrónico
   * @returns {Object|null}
   */
  static buscarPorEmail(email) {
    if (!email) return null;
    const lista = this.obtenerTodos();
    const buscado = String(email).trim().toLowerCase();
    return lista.find(u => String(u.email || '').trim().toLowerCase() === buscado) || null;
  }

  /**
   * Valida los datos de un usuario según las reglas de negocio
   * @param {Object} datos Datos del usuario a validar
   * @param {boolean} esRegistroNuevo Si es nuevo, verifica que no exista duplicado
   * @returns {{esValido: boolean, errores: Object}}
   */
  static validar(datos, esRegistroNuevo = false) {
    const errores = {};

    // 1. Nombre
    const nombre = String(datos.nombre || '').trim();
    if (!nombre) {
      errores.nombre = 'Falta completar el nombre completo.';
    } else if (nombre.length < 3) {
      errores.nombre = 'El nombre completo debe tener mínimo 3 caracteres.';
    }

    // 2. DNI (exactamente 8 dígitos numéricos)
    const dni = String(datos.dni || '').trim();
    if (!dni) {
      errores.dni = 'Falta completar el DNI.';
    } else if (!/^[0-9]{8}$/.test(dni)) {
      errores.dni = 'El DNI debe tener exactamente 8 números.';
    } else if (esRegistroNuevo && this.buscarPorDni(dni)) {
      errores.dni = 'Ya existe una cuenta registrada con este DNI.';
    }

    // 3. Correo electrónico
    const email = String(datos.email || '').trim();
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errores.email = 'Falta completar el correo electrónico.';
    } else if (!regexEmail.test(email)) {
      errores.email = 'El correo electrónico no tiene un formato válido.';
    } else if (esRegistroNuevo && this.buscarPorEmail(email)) {
      errores.email = 'Ya existe una cuenta registrada con este correo.';
    }

    // 4. Teléfono (exactamente 9 dígitos numéricos)
    const phone = String(datos.phone || datos.telefono || '').trim();
    if (!phone) {
      errores.phone = 'Falta completar el teléfono.';
    } else if (!/^[0-9]{9}$/.test(phone)) {
      errores.phone = 'El teléfono debe tener exactamente 9 números.';
    }

    // 5. Contraseña (mínimo 6 caracteres)
    if (datos.password !== undefined) {
      const password = String(datos.password || '');
      if (!password) {
        errores.password = 'Falta completar la contraseña.';
      } else if (password.length < 6) {
        errores.password = 'La contraseña debe tener mínimo 6 caracteres.';
      }
    }

    // 6. Confirmación de contraseña (si se envía)
    if (datos.confirmPassword !== undefined && datos.password !== undefined) {
      if (datos.confirmPassword !== datos.password) {
        errores.confirmPassword = 'Las contraseñas no coinciden.';
      }
    }

    // 7. Rol
    if (datos.rol && !this.ROLES_VALIDOS.includes(datos.rol)) {
      errores.rol = `Rol no válido. Debe ser uno de: ${this.ROLES_VALIDOS.join(', ')}`;
    }

    return {
      esValido: Object.keys(errores).length === 0,
      errores
    };
  }

  /**
   * Registra un nuevo usuario en el sistema
   * @param {Object} datos {nombre, dni, email, phone, password, rol}
   * @returns {{exito: boolean, mensaje: string, usuario?: Object, errores?: Object}}
   */
  static registrar(datos) {
    const validacion = this.validar(datos, true);
    if (!validacion.esValido) {
      return { exito: false, mensaje: 'Datos no válidos.', errores: validacion.errores };
    }

    const nuevoUsuario = {
      nombre: datos.nombre.trim(),
      dni: datos.dni.trim(),
      email: datos.email.trim().toLowerCase(),
      phone: (datos.phone || datos.telefono || '').trim(),
      password: datos.password,
      rol: datos.rol || 'PACIENTE'
    };

    const usuarios = this.obtenerTodos();
    usuarios.push(nuevoUsuario);

    if (this.guardarTodos(usuarios)) {
      return { exito: true, mensaje: 'Usuario registrado exitosamente.', usuario: nuevoUsuario };
    } else {
      return { exito: false, mensaje: 'No se pudo guardar el usuario en el almacenamiento local.' };
    }
  }

  /**
   * Autentica a un usuario con correo y contraseña
   * @param {string} email Correo
   * @param {string} password Contraseña
   * @returns {{exito: boolean, mensaje: string, usuario?: Object}}
   */
  static autenticar(email, password) {
    if (!email || !password) {
      return { exito: false, mensaje: 'Debe ingresar correo y contraseña.' };
    }

    this.sembrarUsuariosDemo(); // Asegurar usuarios base

    const emailLimpio = String(email).trim().toLowerCase();
    const usuario = this.buscarPorEmail(emailLimpio);

    if (!usuario) {
      return { exito: false, mensaje: 'El correo electrónico no se encuentra registrado.' };
    }

    if (usuario.password !== password) {
      return { exito: false, mensaje: 'La contraseña ingresada es incorrecta.' };
    }

    // Guardar sesión activa
    this.guardarSesion(usuario);

    return { exito: true, mensaje: 'Inicio de sesión exitoso.', usuario };
  }

  /**
   * Obtiene la sesión actual almacenada
   * @returns {Object|null}
   */
  static obtenerSesion() {
    try {
      const data = localStorage.getItem(this.SESION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Guarda los datos de la sesión actual (sin contraseña por seguridad)
   * @param {Object} usuario
   */
  static guardarSesion(usuario) {
    try {
      const sesionData = {
        nombre: usuario.nombre,
        email: usuario.email,
        dni: usuario.dni,
        phone: usuario.phone || usuario.telefono || '',
        rol: usuario.rol
      };
      localStorage.setItem(this.SESION_KEY, JSON.stringify(sesionData));
    } catch (e) {
      console.error('Error al guardar sesión:', e);
    }
  }

  /**
   * Cierra la sesión activa
   */
  static cerrarSesion() {
    localStorage.removeItem(this.SESION_KEY);
  }

  /**
   * Inicializa las 3 cuentas demo de prueba (Admin, Médico, Paciente) si no existen
   */
  static sembrarUsuariosDemo() {
    const existentes = this.obtenerTodos();
    if (existentes.length > 0) return;

    this.guardarTodos([
      {
        nombre: 'Administrador CliniAgenda',
        dni: '00000001',
        email: 'admin@cliniagenda.com',
        phone: '999999999',
        password: 'admin123',
        rol: 'ADMIN'
      },
      {
        nombre: 'Dr. Carlos Ramírez',
        dni: '00000002',
        email: 'medico@cliniagenda.com',
        phone: '999999998',
        password: 'medico123',
        rol: 'MEDICO'
      },
      {
        nombre: 'Paciente Demo',
        dni: '00000003',
        email: 'paciente@cliniagenda.com',
        phone: '999999997',
        password: 'paciente123',
        rol: 'PACIENTE'
      }
    ]);
  }
}

// Compatibilidad con navegador o Node.js
if (typeof window !== 'undefined') {
  window.UsuarioModel = UsuarioModel;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UsuarioModel;
}

