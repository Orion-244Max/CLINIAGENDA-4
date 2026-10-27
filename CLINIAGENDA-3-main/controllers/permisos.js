/* ==========================================================
 * PERMISOS.JS
 * ----------------------------------------------------------
 * Sesión y roles (ADMIN, MEDICO, PACIENTE) simulados 100% en
 * localStorage. Se incluye en TODAS las páginas y se encarga de:
 *
 *   1. Crear 3 usuarios de prueba (admin / médico / paciente)
 *      la primera vez que se abre el sitio.
 *   2. Guardar / leer / cerrar la sesión actual.
 *   3. Mostrar u ocultar los enlaces del menú según el rol
 *      del usuario conectado.
 *
 * Debe cargarse ANTES que acceso.js, app.js, etc.
 * ========================================================== */

(function () {

    const USUARIOS_KEY = 'usuarios';
    const SESION_KEY = 'sesionActual';

    /* ----------------------------------------------------------
     * 1. USUARIOS (localStorage.usuarios)
     * ---------------------------------------------------------- */
    function obtenerUsuarios() {
        try { return JSON.parse(localStorage.getItem(USUARIOS_KEY)) || []; }
        catch (e) { return []; }
    }

    function guardarUsuarios(lista) {
        localStorage.setItem(USUARIOS_KEY, JSON.stringify(lista));
    }

    // Crea las 3 cuentas de demostración (una sola vez).
    function sembrarUsuariosDemo() {
        const existentes = obtenerUsuarios();
        if (existentes.length > 0) return;

        guardarUsuarios([
            {
                nombre: 'Administrador CliniAgenda',
                dni: '00000001',
                email: 'admin@cliniagenda.com',
                phone: '922068258',
                password: 'admin123',
                rol: 'ADMIN'
            },
            {
                nombre: 'Dr. Carlos Ramírez',
                dni: '00000002',
                email: 'medico@cliniagenda.com',
                phone: '922068258',
                password: 'medico123',
                rol: 'MEDICO'
            },
            {
                nombre: '',
                dni: '00000003',
                email: 'paciente@cliniagenda.com',
                phone: '922068258',
                password: 'paciente123',
                rol: 'PACIENTE'
            }
        ]);
    }

    function hoyISO(offsetDias = 0) {
        const d = new Date();
        if (offsetDias !== 0) d.setDate(d.getDate() + offsetDias);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    // Si no hay citas o pacientes, sembrar datos de prueba iniciales
    function sembrarDatosDemo() {
        sembrarUsuariosDemo();

        // 1. Pacientes iniciales
        try {
            const pacientesActuales = JSON.parse(localStorage.getItem('pacientes')) || [];
            if (pacientesActuales.length === 0) {
                localStorage.setItem('pacientes', JSON.stringify([
                    {
                        nombre: 'Ana Torres Mendoza',
                        dni: '72345678',
                        email: 'ana.torres@email.com',
                        telefono: '987654321',
                        fechaNacimiento: '1992-05-14',
                        direccion: 'Av. Las Flores 340, Miraflores',
                        historial: 'Alergia a la penicilina. Sin antecedentes quirúrgicos.'
                    },
                    {
                        nombre: 'Juan Carlos Paredes',
                        dni: '45678912',
                        email: 'juan.paredes@email.com',
                        telefono: '912345678',
                        fechaNacimiento: '1985-09-22',
                        direccion: 'Jr. Huancavelica 512, Lima Centro',
                        historial: 'Hipertensión arterial diagnosticada en 2021.'
                    },
                    {
                        nombre: 'María Salazar López',
                        dni: '12345678',
                        email: 'maria.salazar@email.com',
                        telefono: '998877665',
                        fechaNacimiento: '1978-11-30',
                        direccion: 'Calle Los Cedros 128, San Isidro',
                        historial: 'Colelitiasis. Programada para cirugía electiva.'
                    },
                    {
                        nombre: 'Roberto Gómez Díaz',
                        dni: '87654321',
                        email: 'roberto.gomez@email.com',
                        telefono: '945612378',
                        fechaNacimiento: '1990-03-18',
                        direccion: 'Av. Brasil 1450, Jesús María',
                        historial: 'Sin antecedentes patológicos de relevancia.'
                    }
                ]));
            }
        } catch (e) {
            console.error('Error al sembrar pacientes:', e);
        }

        // 2. Citas iniciales para la agenda del médico y general
        try {
            const citasActuales = JSON.parse(localStorage.getItem('citas')) || [];
            if (citasActuales.length === 0) {
                const hoy = hoyISO(0);
                const manana = hoyISO(1);
                localStorage.setItem('citas', JSON.stringify([
                    {
                        id: 'cita-101',
                        patient: 'Ana Torres Mendoza',
                        patientDni: '72345678',
                        patientEmail: 'ana.torres@email.com',
                        patientPhone: '987654321',
                        doctor: 'Dr. Carlos Ramírez',
                        service: 'Cardiología',
                        date: hoy,
                        time: '09:30',
                        mode: 'Presencial',
                        notes: 'Presenta palpitaciones frecuentes y dolor leve en el pecho tras esfuerzo físico. Solicita revisión de presión arterial y evaluación cardiovascular.',
                        status: 'confirmed',
                        reminderSent: true
                    },
                    {
                        id: 'cita-102',
                        patient: 'Juan Carlos Paredes',
                        patientDni: '45678912',
                        patientEmail: 'juan.paredes@email.com',
                        patientPhone: '912345678',
                        doctor: 'Dr. Carlos Ramírez',
                        service: 'Cardiología',
                        date: hoy,
                        time: '11:15',
                        mode: 'Teleconsulta',
                        notes: 'Paciente hipertenso en tratamiento con Enalapril 10mg. Solicita control mensual y renovación de receta médica.',
                        status: 'pending',
                        reminderSent: false
                    },
                    {
                        id: 'cita-103',
                        patient: 'María Salazar López',
                        patientDni: '12345678',
                        patientEmail: 'maria.salazar@email.com',
                        patientPhone: '998877665',
                        doctor: 'Dr. Carlos Ramírez',
                        service: 'Cardiología',
                        date: hoy,
                        time: '08:00',
                        mode: 'Presencial',
                        notes: 'Evaluación cardiológica prequirúrgica solicitada por cirugía general para colecistectomía.',
                        status: 'attended',
                        diagnosticoMedico: 'Examen físico sin soplos ni edema. FC: 72 lpm, PA: 120/75. ECG ritmo sinusal normal. Riesgo Quirúrgico: Clase I (Bajo riesgo). Apto para anestesia general.',
                        reminderSent: true
                    },
                    {
                        id: 'cita-104',
                        patient: 'Roberto Gómez Díaz',
                        patientDni: '87654321',
                        patientEmail: 'roberto.gomez@email.com',
                        patientPhone: '945612378',
                        doctor: 'Dr. Carlos Ramírez',
                        service: 'Cardiología',
                        date: manana,
                        time: '10:00',
                        mode: 'Presencial',
                        notes: 'Chequeo preventivo anual por antecedentes familiares directos de cardiopatía.',
                        status: 'confirmed',
                        reminderSent: false
                    }
                ]));
            }
        } catch (e) {
            console.error('Error al sembrar citas:', e);
        }
    }

    /* ----------------------------------------------------------
     * 2. SESIÓN ACTUAL (localStorage.sesionActual)
     * ---------------------------------------------------------- */
    function obtenerSesion() {
        try { return JSON.parse(localStorage.getItem(SESION_KEY)); }
        catch (e) { return null; }
    }

    function guardarSesion(usuario) {
        localStorage.setItem(SESION_KEY, JSON.stringify({
            nombre: usuario.nombre,
            email: usuario.email,
            dni: usuario.dni,
            phone: usuario.phone || '',
            rol: usuario.rol
        }));
    }

    function cerrarSesion() {
        localStorage.removeItem(SESION_KEY);
        window.location.href = 'index.html';
    }

    // Utilidades disponibles para acceso.js (login / registro).
    window.CliniAuth = {
        obtenerUsuarios: obtenerUsuarios,
        guardarUsuarios: guardarUsuarios,
        obtenerSesion: obtenerSesion,
        guardarSesion: guardarSesion,
        cerrarSesion: cerrarSesion
    };

    /* ----------------------------------------------------------
     * 3. VISIBILIDAD DEL MENÚ SEGÚN EL ROL
     * ----------------------------------------------------------
     *   ADMIN    -> Gestión completa
     *   PACIENTE -> Reserva sus propias citas
     *   MEDICO   -> Agenda propia
     *   (sin sesión) -> Inicio y Registro/Login únicamente
     * ---------------------------------------------------------- */
    const PAGINAS_POR_ROL = {
        'pacientes.html': ['ADMIN'],
        'agenda.html': ['ADMIN'],
        'paciente-form.html': ['ADMIN'],
        'regiscita.html': ['ADMIN', 'PACIENTE'],
        'agenda-paciente.html': [],
        'agenda-medico.html': ['MEDICO', 'ADMIN']
    };

    const PAGINA_INICIAL_POR_ROL = {
        ADMIN: 'agenda.html',
        MEDICO: 'agenda-medico.html',
        PACIENTE: 'regiscita.html'
    };

    function nombreArchivo(href) {
        if (!href) return '';
        return href.split('/').pop().split('?')[0].split('#')[0].toLowerCase();
    }

    function aplicarPermisosNavbar() {
        const sesion = obtenerSesion();
        const rol = sesion ? sesion.rol : null;
        const paginaActual = nombreArchivo(window.location.pathname);
        const rolesPagina = PAGINAS_POR_ROL[paginaActual];

        if (sesion && PAGINA_INICIAL_POR_ROL[rol] &&
            (paginaActual === 'index.html' || paginaActual === 'acceso.html')) {
            window.location.replace(PAGINA_INICIAL_POR_ROL[rol]);
            return;
        }

        if (rolesPagina && (!rol || rolesPagina.indexOf(rol) === -1)) {
            window.location.replace(PAGINA_INICIAL_POR_ROL[rol] ||
                (rol === 'ADMIN' ? 'agenda.html' : 'acceso.html'));
            return;
        }

        document.querySelectorAll('.navbar-nav > li.nav-item').forEach(function (li) {
            // No tocar el propio ítem de sesión (se gestiona aparte).
            if (li.id === 'navSesionActual') return;
            if (li.id === 'navNuevoPaciente' && rol !== 'ADMIN') {
                li.style.display = 'none';
                return;
            }

            const link = li.querySelector('a[href]');
            if (!link) return; // ej: el botón de tema, que no es un <a>

            const archivo = nombreArchivo(link.getAttribute('href'));

            // "Inicio" solo aparece cuando no hay sesión iniciada.
            if (archivo === 'index.html') {
                li.style.display = sesion ? 'none' : '';
                return;
            }

            // "Registro / Login": visible solo SIN sesión iniciada.
            if (archivo === 'acceso.html') {
                li.style.display = sesion ? 'none' : '';
                return;
            }

            // Enlaces sin regla específica (por compatibilidad, se dejan visibles).
            if (!PAGINAS_POR_ROL[archivo]) {
                return;
            }

            const rolesPermitidos = PAGINAS_POR_ROL[archivo];
            const visible = !!rol && rolesPermitidos.indexOf(rol) !== -1;
            li.style.display = visible ? '' : 'none';
        });

        insertarInfoSesion(sesion);
    }

    /* ----------------------------------------------------------
     * 4. ROL DEL USUARIO CONECTADO
     * ---------------------------------------------------------- */
    function insertarInfoSesion(sesion) {
        const navbarList = document.querySelector('.navbar-nav');
        if (!navbarList) return;

        let item = document.getElementById('navSesionActual');

        if (!sesion) {
            if (item) item.remove();
            return;
        }

        const etiquetaRol = {
            ADMIN: 'Admin',
            MEDICO: 'Médico',
            PACIENTE: 'Paciente'
        }[sesion.rol] || sesion.rol;

        if (!item) {
            item = document.createElement('li');
            item.className = 'nav-item ms-lg-2 session-nav-item';
            item.id = 'navSesionActual';
            navbarList.appendChild(item);
        }

        item.innerHTML =
            '<span class="session-role">' + escaparTexto(etiquetaRol) + '</span>' +
            '<button type="button" class="session-logout" aria-label="Cerrar sesión" title="Cerrar sesión">' +
            '<span class="session-logout-icon" aria-hidden="true">↪</span>' +
            '<span class="session-logout-label">Cerrar sesión</span>' +
            '</button>';

        item.querySelector('.session-logout').addEventListener('click', cerrarSesion);
    }

    function escaparTexto(texto) {
        return String(texto == null ? '' : texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    document.addEventListener('DOMContentLoaded', function () {
        sembrarDatosDemo();
        aplicarPermisosNavbar();
    });

})();
