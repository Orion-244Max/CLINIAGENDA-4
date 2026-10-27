/**
 * models/index.js
 * ==========================================================
 * Punto de entrada del MODELO (M de MVC) para CliniAgenda
 * ----------------------------------------------------------
 * Agrupa y expone las entidades del modelo:
 *   - UsuarioModel: models/Usuario.js
 *   - PacienteModel: models/Paciente.js
 *   - CitaModel: models/Cita.js
 * ==========================================================
 */

const CliniModels = {
  Usuario: (typeof UsuarioModel !== 'undefined') ? UsuarioModel : null,
  Paciente: (typeof PacienteModel !== 'undefined') ? PacienteModel : null,
  Cita: (typeof CitaModel !== 'undefined') ? CitaModel : null
};

if (typeof window !== 'undefined') {
  window.CliniModels = CliniModels;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CliniModels;
}

