document.addEventListener('DOMContentLoaded', function () {

    const form = document.querySelector('form');
    if (!form) return;

    const sesion = window.CliniAuth && CliniAuth.obtenerSesion();
    const patient = document.getElementById('patientName');
    const patientDni = document.getElementById('patientDni');
    const doctor = document.getElementById('doctorName');
    const service = document.getElementById('serviceSelect');
    const date = document.getElementById('appointmentDate');
    const time = document.getElementById('appointmentTime');
    const mode = document.getElementById('appointmentMode');
    const hoy = new Date();
    const hoyISO = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
        String(hoy.getDate()).padStart(2, '0');
    let pacienteSeleccionado = null;

    date.min = hoyISO;

    if (sesion && sesion.rol === 'PACIENTE') {
        if (!sesion.nombre || !/^\d{8}$/.test(String(sesion.dni || ''))) {
            alert('La cuenta no tiene un nombre y un DNI válidos. Contacta con recepción para corregir tus datos.');
            window.location.replace('acceso.html');
            return;
        }
        patient.value = sesion.nombre;
        patientDni.value = sesion.dni;
        document.getElementById('bookingTitle').textContent = 'Solicitar una cita';
        document.getElementById('bookingExplanation').textContent =
            'Elige el servicio, el médico y un horario. La solicitud se registrará a tu nombre y quedará pendiente de confirmación por recepción.';
        document.getElementById('bookingStep1').textContent = 'Tu nombre y DNI se toman de tu cuenta.';
        document.getElementById('bookingStep2').textContent = 'Recepción confirmará o cancelará la solicitud.';
        document.getElementById('bookingStep3').textContent = 'Puedes solicitar más de una cita desde este formulario.';
        const cuenta = CliniAuth.obtenerUsuarios().find(function (usuario) {
            return String(usuario.dni) === String(sesion.dni);
        }) || {};
        pacienteSeleccionado = {
            email: sesion.email || cuenta.email || '',
            telefono: sesion.phone || cuenta.phone || ''
        };
        const buscarPaciente = patient.parentNode.querySelector('button');
        if (buscarPaciente) buscarPaciente.classList.add('d-none');
        document.getElementById('btnRegistrarCita').textContent = 'Enviar solicitud';
    }

    /* ==========================================================
     * 0. UTILIDADES DE VALIDACIÓN VISUAL (compartidas)
     * ========================================================== */
    function limpiarValidaciones() {
        form.querySelectorAll('.validacion-error, .validacion-correcto').forEach(el => el.remove());
        form.querySelectorAll('.is-invalid, .is-valid').forEach(c => {
            c.classList.remove('is-invalid');
            c.classList.remove('is-valid');
        });
    }

    function mostrarError(campo, mensaje) {
        campo.classList.add('is-invalid');
        const error = document.createElement('div');
        error.className = 'validacion-error';
        error.textContent = '⚠ ' + mensaje;
        campo.parentNode.appendChild(error);
    }

    function mostrarCorrecto(campo, mensaje) {
        campo.classList.add('is-valid');
        const correcto = document.createElement('div');
        correcto.className = 'validacion-correcto';
        correcto.textContent = '✓ ' + mensaje;
        campo.parentNode.appendChild(correcto);
    }

    function normalizarDoctor(nombre) {
        return String(nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/^(dr\.?\s*|dra\.?\s*)/, '').replace(/[^a-z0-9]/g, '');
    }

    function obtenerCitasGuardadas() {
        try {
            const citas = JSON.parse(localStorage.getItem('citas')) || [];
            if (!Array.isArray(citas)) throw new Error('Formato inválido');
            return citas;
        } catch (error) {
            alert('No se pudieron consultar las citas existentes. Intenta nuevamente.');
            return null;
        }
    }

    function horarioOcupado() {
        const citas = obtenerCitasGuardadas();
        if (!citas) return true;
        return citas.some(function (cita) {
            return cita.status !== 'cancelled' &&
                cita.date === date.value &&
                cita.time === time.value &&
                normalizarDoctor(cita.doctor) === normalizarDoctor(doctor.value);
        });
    }

    function mostrarEstadoHorario(ocupado) {
        const mensaje = document.getElementById('errorHorarioOcupado');
        if (mensaje) mensaje.classList.toggle('d-none', !ocupado);
    }

    function guardarCita() {
        const citas = obtenerCitasGuardadas();
        if (!citas) return false;
        const notes = document.getElementById('appointmentNotes');
        citas.push({
            id: Date.now(),
            patient: patient.value,
            patientDni: patientDni ? patientDni.value : '',
            patientEmail: pacienteSeleccionado ? pacienteSeleccionado.email || '' : '',
            patientPhone: pacienteSeleccionado ? pacienteSeleccionado.telefono || '' : '',
            doctor: doctor.value,
            service: service.value,
            date: date.value,
            time: time.value,
            mode: mode.value,
            notes: notes ? notes.value.trim() : '',
            reminderSent: false,
            status: sesion && sesion.rol === 'PACIENTE' ? 'pending' : 'confirmed'
        });
        try {
            localStorage.setItem('citas', JSON.stringify(citas));
            return true;
        } catch (error) {
            alert('No se pudo guardar la cita. Intenta nuevamente.');
            return false;
        }
    }

    // Valida todos los campos de la cita. Devuelve true/false.
    function validarFormularioCita(mostrarMensajes) {
        let formularioValido = true;

        if (mostrarMensajes) limpiarValidaciones();

        function chequear(campo, condicionValida, mensajeError, mensajeOk) {
            if (!condicionValida) {
                formularioValido = false;
                if (mostrarMensajes) mostrarError(campo, mensajeError);
            } else if (mostrarMensajes) {
                mostrarCorrecto(campo, mensajeOk);
            }
        }

        chequear(patient, patient.value.trim() !== '', 'Falta seleccionar al paciente.', 'Paciente correcto.');
        chequear(doctor, doctor.value.trim() !== '', 'Falta seleccionar al médico.', 'Médico correcto.');
        const medicoElegido = medicosDisponibles.find(function (medico) {
            return normalizarDoctor(medico.nombre) === normalizarDoctor(doctor.value);
        });
        const especialidadCoincide = !medicoElegido || medicoElegido.especialidad === service.value;
        chequear(service, service.value !== '' && especialidadCoincide,
            service.value ? 'El servicio debe coincidir con la especialidad del médico.' : 'Falta seleccionar la especialidad o el servicio.',
            'Especialidad seleccionada correctamente.');
        chequear(date, date.value !== '' && date.value >= hoyISO,
            'Selecciona la fecha de hoy o una fecha posterior.', 'Fecha seleccionada correctamente.');
        chequear(time, time.value !== '', 'Falta seleccionar la hora de la cita.', 'Hora seleccionada correctamente.');
        chequear(mode, mode.value !== '', 'Falta seleccionar la modalidad.', 'Modalidad seleccionada correctamente.');

        return formularioValido;
    }

    /* ==========================================================
     * 1. BOTÓN "VALIDAR"
     * ========================================================== */
    const btnValidar = document.getElementById('btnValidarCita');
    if (btnValidar) {
        btnValidar.addEventListener('click', function () {
            const valido = validarFormularioCita(true);
            if (valido) {
                alert('✓ La información de la cita está completa y correcta.');
            }
        });
    }

    // Limpiar mensajes al escribir/cambiar
    ['patientName', 'doctorName', 'serviceSelect', 'appointmentDate', 'appointmentTime', 'appointmentMode']
        .forEach(function (id) {
            const campo = document.getElementById(id);
            if (!campo) return;

            function limpiarMensaje() {
                const error = campo.parentNode.querySelector('.validacion-error');
                const correcto = campo.parentNode.querySelector('.validacion-correcto');
                if (error) error.remove();
                if (correcto) correcto.remove();
                campo.classList.remove('is-invalid', 'is-valid');
            }

            campo.addEventListener('input', limpiarMensaje);
            campo.addEventListener('change', limpiarMensaje);
        });

    /* ==========================================================
     * 2. BUSCADOR DE PACIENTES REGISTRADOS
     *    Toma la lista guardada por paciente-form.js en localStorage.
     * ========================================================== */
    const listaPacientesEl = document.getElementById('listaPacientes');
    const buscarPacienteInput = document.getElementById('buscarPacienteInput');
    const sinPacientesEl = document.getElementById('sinPacientes');
    const modalBuscarPacienteEl = document.getElementById('modalBuscarPaciente');

    function obtenerPacientesGuardados() {
        try {
            return JSON.parse(localStorage.getItem('pacientes')) || [];
        } catch (e) {
            return [];
        }
    }

    function renderPacientes(filtro) {
        if (!listaPacientesEl) return;

        const pacientes = obtenerPacientesGuardados();
        const filtroLower = (filtro || '').trim().toLowerCase();

        const filtrados = pacientes.filter(function (p) {
            const nombre = (p.nombre || '').toLowerCase();
            const dni = (p.dni || '').toLowerCase();
            return nombre.includes(filtroLower) || dni.includes(filtroLower);
        });

        listaPacientesEl.innerHTML = '';

        if (pacientes.length === 0) {
            if (sinPacientesEl) sinPacientesEl.classList.remove('d-none');
            return;
        }
        if (sinPacientesEl) sinPacientesEl.classList.add('d-none');

        if (filtrados.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'text-secondary text-center mb-0';
            vacio.textContent = 'No se encontraron pacientes con ese criterio.';
            listaPacientesEl.appendChild(vacio);
            return;
        }

        filtrados.forEach(function (p) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action';
            item.innerHTML =
                '<span class="fw-semibold">' + (p.nombre || 'Sin nombre') + '</span>' +
                '<br><span class="text-secondary small">DNI: ' + (p.dni || '-') + ' · ' + (p.telefono || 'sin teléfono') + '</span>';

            item.addEventListener('click', function () {
                patient.value = p.nombre || '';
                if (patientDni) patientDni.value = p.dni || '';
                pacienteSeleccionado = p;
                patient.dispatchEvent(new Event('change'));
                const modalInstance = bootstrap.Modal.getInstance(modalBuscarPacienteEl);
                if (modalInstance) modalInstance.hide();
            });

            listaPacientesEl.appendChild(item);
        });
    }

    if (modalBuscarPacienteEl) {
        modalBuscarPacienteEl.addEventListener('show.bs.modal', function () {
            if (buscarPacienteInput) buscarPacienteInput.value = '';
            renderPacientes('');
        });
    }

    if (buscarPacienteInput) {
        buscarPacienteInput.addEventListener('input', function () {
            renderPacientes(buscarPacienteInput.value);
        });
    }

    /* ==========================================================
     * 3. BUSCADOR DE MÉDICOS
     *    Lista fija de médicos disponibles por especialidad.
     * ========================================================== */
    const medicosDisponibles = [
        { nombre: 'Dr. Carlos Ramírez', especialidad: 'Cardiología' },
        { nombre: 'Dra. Lucía Flores', especialidad: 'Pediatría' },
        { nombre: 'Dr. Jorge Medina', especialidad: 'Medicina General' },
        { nombre: 'Dra. Andrea Salas', especialidad: 'Ginecología' },
        { nombre: 'Dr. Miguel Torres', especialidad: 'Odontología' },
        { nombre: 'Dra. Paola Rivas', especialidad: 'Laboratorio' }
    ];

    const listaMedicosEl = document.getElementById('listaMedicos');
    const buscarMedicoInput = document.getElementById('buscarMedicoInput');
    const modalBuscarMedicoEl = document.getElementById('modalBuscarMedico');

    function renderMedicos(filtro) {
        if (!listaMedicosEl) return;

        const filtroLower = (filtro || '').trim().toLowerCase();
        const filtrados = medicosDisponibles.filter(function (m) {
            return m.nombre.toLowerCase().includes(filtroLower) ||
                m.especialidad.toLowerCase().includes(filtroLower);
        });

        listaMedicosEl.innerHTML = '';

        if (filtrados.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'text-secondary text-center mb-0';
            vacio.textContent = 'No se encontraron médicos con ese criterio.';
            listaMedicosEl.appendChild(vacio);
            return;
        }

        filtrados.forEach(function (m) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action';
            item.innerHTML =
                '<span class="fw-semibold">' + m.nombre + '</span>' +
                '<br><span class="text-secondary small">' + m.especialidad + '</span>';

            item.addEventListener('click', function () {
                doctor.value = m.nombre;
                doctor.dispatchEvent(new Event('change'));

                if (service) {
                    const opcionCoincidente = Array.from(service.options)
                        .find(function (opt) { return opt.value === m.especialidad; });
                    if (opcionCoincidente) {
                        service.value = m.especialidad;
                        service.dispatchEvent(new Event('change'));
                    }
                }

                const modalInstance = bootstrap.Modal.getInstance(modalBuscarMedicoEl);
                if (modalInstance) modalInstance.hide();
            });

            listaMedicosEl.appendChild(item);
        });
    }

    if (modalBuscarMedicoEl) {
        modalBuscarMedicoEl.addEventListener('show.bs.modal', function () {
            if (buscarMedicoInput) buscarMedicoInput.value = '';
            renderMedicos('');
        });
    }

    if (buscarMedicoInput) {
        buscarMedicoInput.addEventListener('input', function () {
            renderMedicos(buscarMedicoInput.value);
        });
    }

    /* ==========================================================
     * 4. GUARDAR RESERVA
     * ========================================================== */
    const btnRegistrarCita = document.getElementById('btnRegistrarCita');
    if (btnRegistrarCita) {
        btnRegistrarCita.addEventListener('click', function () {
            const mensajeReserva = document.getElementById('mensajeReservaPaciente');
            if (mensajeReserva) mensajeReserva.classList.add('d-none');
            const valido = validarFormularioCita(true);

            if (!valido) return;
            if (horarioOcupado()) {
                mostrarEstadoHorario(true);
                return;
            }
            mostrarEstadoHorario(false);

            if (!guardarCita()) return;
            if (sesion && sesion.rol === 'PACIENTE') {
                mensajeReserva.textContent = 'Tu solicitud quedó registrada y está pendiente de confirmación por recepción. Puedes solicitar otra cita desde aquí.';
                mensajeReserva.classList.remove('d-none');
                limpiarValidaciones();
                doctor.value = '';
                service.value = '';
                date.value = '';
                time.value = '';
                mode.value = '';
                const notes = document.getElementById('appointmentNotes');
                if (notes) notes.value = '';
                return;
            }

            window.location.href = 'agenda.html';
        });
    }

});