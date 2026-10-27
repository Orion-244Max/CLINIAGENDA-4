# Arquitectura MVC de CliniAgenda

Este documento detalla la distribución de capas y carpetas bajo el patrón de diseño **MVC (Modelo - Vista - Controlador)** para el sistema **CliniAgenda**.

---

## 1. Resumen de la Estructura de Carpetas

```text
CLINIAGENDA-3-main/
│
├── index.html                        -> Redirección automática a views/index.html
│
├── models/                           📁 [MODELO] Entidades de datos y persistencia
│   ├── Usuario.js                    -> Entidad Usuario, roles, sesión y auth
│   ├── Paciente.js                   -> Entidad Paciente, validaciones y CRUD
│   ├── Cita.js                       -> Entidad Cita, horarios, estados y CRUD
│   └── index.js                      -> Exportador central (window.CliniModels)
│
├── views/                            📁 [VISTA] Interfaces de usuario (HTML)
│   ├── index.html                    -> Portada y presentación del sistema
│   ├── acceso.html                   -> Login y Registro de usuarios
│   ├── agenda.html                   -> Agenda general de recepción
│   ├── pacientes.html                -> Directorio y tabla de pacientes
│   ├── paciente-form.html            -> Formulario de registro/edición de paciente
│   ├── regiscita.html                -> Formulario de solicitud y reserva de citas
│   ├── agenda-medico.html            -> Agenda exclusiva para el médico del día
│   └── agenda-paciente.html          -> Portal del paciente (citas y recordatorios)
│
├── controllers/                      📁 [CONTROLADOR] Eventos, DOM y flujo (JS)
│   ├── app.js                        -> Control del tema oscuro, modales y alertas
│   ├── acceso.js                     -> Control del formulario de acceso/registro
│   ├── agenda.js                     -> Control de la agenda, filtros y WhatsApp
│   ├── pacientes.js                  -> Control de tabla y modal de edición de pacientes
│   ├── paciente-form.js              -> Control del formulario de alta de pacientes
│   ├── regiscita.js                  -> Control de reserva de citas y validación de turnos
│   ├── agenda-medico.js              -> Control de citas asignadas al médico logueado
│   ├── agenda-paciente.js            -> Control del historial del paciente logueado
│   └── permisos.js                   -> Middleware/control de autorización por roles
│
└── assets/                           📁 [RECURSOS ESTÁTICOS / ASSETS]
    ├── css/
    │   ├── styles.css                -> Estilos personalizados del sistema
    │   └── bootstrap_min.css         -> Framework CSS Bootstrap 5
    └── js/
        └── bootstrap_bundle_min.js   -> Scripts interactivos de Bootstrap
```

---

## 2. Detalle de Cada Componente del MVC

### 🟩 M — MODELO (`models/`)
**Responsabilidad:** Administrar los datos, las reglas de validación de negocio y el almacenamiento/persistencia (`localStorage`). No manipula el DOM ni conoce la interfaz visual.

1. **`models/Usuario.js` (`UsuarioModel`):**
   - Atributos: `nombre`, `dni` (8 dígitos), `email`, `phone` (9 dígitos), `password`, `rol` (`ADMIN`, `MEDICO`, `PACIENTE`).
   - Métodos principales:
     - `validar(datos, esRegistroNuevo)`: valida formatos y unicidad de DNI y correo.
     - `registrar(datos)`: guarda el nuevo usuario.
     - `autenticar(email, password)`: comprueba credenciales.
     - `obtenerSesion()` / `guardarSesion(usuario)` / `cerrarSesion()`: gestiona la sesión activa.
     - `sembrarUsuariosDemo()`: inicializa los usuarios de prueba.

2. **`models/Paciente.js` (`PacienteModel`):**
   - Atributos: `nombre`, `dni`, `email`, `telefono`, `fechaNacimiento`, `direccion`, `historial`.
   - Métodos principales:
     - `validar(datos, dniOriginal)`: valida DNI (8 dígitos exactos), teléfono (9 dígitos exactos), nombre (>= 3 chars) y correo.
     - `crear(datos)`: registra nuevo paciente en `localStorage['pacientes']`.
     - `actualizar(dni, nuevosDatos)`: actualiza datos de un expediente.
     - `eliminar(dni)`: borra un paciente del sistema.
     - `buscarPorDni(dni)` / `obtenerTodos()`: consultas de datos.

3. **`models/Cita.js` (`CitaModel`):**
   - Atributos: `id`, `patient`, `patientDni`, `patientEmail`, `patientPhone`, `doctor`, `service`, `date`, `time`, `mode`, `notes`, `status`, `reminderSent`.
   - Estados de la cita:
     - `pending`: Por confirmar (solicitada por paciente o con horario modificado).
     - `confirmed`: Confirmada por recepción.
     - `attended`: Consulta completada.
     - `cancelled`: Cancelada.
   - Métodos principales:
     - `horarioOcupado(doctor, fecha, hora, idExcluir)`: evita cruce de citas para un mismo médico en el mismo bloque horario.
     - `crear(datos, esAdmin)`: aplica la regla de estado inicial (`confirmed` si es admin, `pending` si es paciente).
     - `actualizar(id, datos)`: si cambia el horario o médico, devuelve la cita a `pending`.
     - `cambiarEstado(id, nuevoEstado)`, `confirmar()`, `cancelar()`, `marcarAtendida()`.
     - `filtrarPorDoctor(nombreMedico, fecha)`: citas del día para el médico.
     - `filtrarPorPaciente(dni, nombre)`: citas del paciente.
     - `obtenerEstadisticas()`: métricas de citas activas, del día y pendientes.

---

### 🟦 V — VISTA (Archivos `.html`)
**Responsabilidad:** Renderizar la información al usuario final y recibir sus interacciones a través de formularios, botones, enlaces y modales.

- **`index.html`**: Presentación de especialidades médicas, servicios y métricas de bienvenida.
- **`acceso.html`**: Pestañas conmutables para registro de pacientes e inicio de sesión.
- **`agenda.html`**: Dashboard general para recepción con contadores, tarjetas de citas y modales de detalle, edición y WhatsApp.
- **`pacientes.html`**: Directorio tabular de pacientes registrados con opciones de edición y eliminación.
- **`paciente-form.html`**: Formulario con validaciones visuales para ingresar pacientes.
- **`regiscita.html`**: Formulario interactivo con pasos para elegir médico, especialidad, fecha y hora.
- **`Agenda-medico.html`**: Vista limpia y enfocada con las citas del día para el médico en turno.
- **`Agenda-paciente.html`**: Panel personal donde el paciente consulta el estado de sus solicitudes.

---

### 🟧 C — CONTROLADOR (Archivos `.js`)
**Responsabilidad:** Capturar los eventos del usuario en la Vista (clic en botones, envío de formularios `submit`, escritura `input`), consultar o actualizar el **Modelo**, y actualizar la **Vista** en consecuencia.

- **`acceso.js`**: Controla el cambio de tabs (login/registro), valida en vivo los campos y ejecuta `UsuarioModel.autenticar()` o `UsuarioModel.registrar()`.
- **`Agenda.js`**: Controla la agenda de recepción, llama a `CitaModel` para cargar las tarjetas, filtrar por estado, abrir modales de edición o generar enlace de WhatsApp.
- **`pacientes.js`**: Lee la lista de pacientes desde `PacienteModel`, renderiza las filas de la tabla y abre el modal de edición para administradores.
- **`paciente-form.js`**: Captura los datos del formulario de alta/edición, ejecuta las validaciones y llama a `PacienteModel.crear()` o `actualizar()`.
- **`regiscita.js`**: Escucha los cambios de servicio, doctor, fecha y hora, valida colisiones con `CitaModel.horarioOcupado()` y guarda la cita.
- **`Agenda-medico.js`**: Verifica la sesión del médico y renderiza cronológicamente sus citas del día usando `CitaModel.filtrarPorDoctor()`.
- **`Agenda-paciente.js`**: Consulta las citas del paciente conectado mediante `CitaModel.filtrarPorPaciente()` y muestra sus citas y recordatorios.
- **`permisos.js`**: Gestiona la visibilidad de los elementos del menú de navegación (`navbar`) y protege el acceso a páginas según el rol del usuario conectado.
- **`app.js`**: Maneja funcionalidades globales de UI (alternador de modo oscuro/claro con `data-bs-theme` y apertura del modal de detalle).

---

## 3. Equivalencia con Spring Boot (Backend Java)

Si este proyecto se traslada a la arquitectura **Spring Boot + Thymeleaf** (mencionada en los comentarios del código y en el `README.md` para el Entregable 2), la correspondencia de carpetas es:

| Capa MVC | En Frontend (Actual) | En Spring Boot (Java) |
| :--- | :--- | :--- |
| **Modelo** | Carpeta `models/` (`Usuario.js`, `Paciente.js`, `Cita.js`) | `src/main/java/com/cliniagenda/model/` (`Usuario.java`, `Paciente.java`, `Cita.java`) |
| **Vista** | Archivos `.html` en raíz o `views/` | `src/main/resources/templates/` (`index.html`, `agenda.html`, etc.) |
| **Controlador** | Archivos `.js` en raíz o `controllers/` | `src/main/java/com/cliniagenda/controller/` (`PacienteController.java`, `CitaController.java`) |
| **Estáticos** | `styles.css`, `bootstrap_min.css` | `src/main/resources/static/css/`, `static/js/` |

