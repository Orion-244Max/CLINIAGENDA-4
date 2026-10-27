/* ==========================================================
 * AGENDA.JS
 * Gestión de citas de recepción en localStorage (clave "citas"):
 * confirmación, edición, cancelación, atención y recordatorios.
 * ========================================================== */

document.addEventListener('DOMContentLoaded', function () {

    const STORAGE_KEY = 'citas';

    const grid = document.getElementById('agendaGrid');
    const vacioEl = document.getElementById('agendaVacio');

    const medicosDisponibles = [
        { nombre: 'Dr. Carlos Ramírez', especialidad: 'Cardiología' },
        { nombre: 'Dra. Lucía Flores', especialidad: 'Pediatría' },
        { nombre: 'Dr. Jorge Medina', especialidad: 'Medicina General' },
        { nombre: 'Dra. Andrea Salas', especialidad: 'Ginecología' },
        { nombre: 'Dr. Miguel Torres', especialidad: 'Odontología' },
        { nombre: 'Dra. Paola Rivas', especialidad: 'Laboratorio' }
    ];

    /* ---------------------------------------------------------- */
    function obtenerCitas() {
        try {
            const citas = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            if (!Array.isArray(citas)) throw new Error('Formato inválido');
            return citas;
        }
        catch (e) { return []; }
    }
    function guardarCitas(lista) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
            return true;
        } catch (error) {
            alert('No se pudieron guardar los cambios de la cita. Intenta nuevamente.');
            return false;
        }
    }
    function normalizarDoctor(nombre) {
        return String(nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/^(dr\.?\s*|dra\.?\s*)/, '').replace(/[^a-z0-9]/g, '');
    }
    function horarioOcupado(doctor, fecha, hora, idExcluir) {
        return obtenerCitas().some(function (cita) {
            return cita.status !== 'cancelled' &&
                String(cita.id) !== String(idExcluir || '') &&
                cita.date === fecha &&
                cita.time === hora &&
                normalizarDoctor(cita.doctor) === normalizarDoctor(doctor);
        });
    }
    function obtenerPacientesGuardados() {
        try { return JSON.parse(localStorage.getItem('pacientes')) || []; }
        catch (e) { return []; }
    }
    function obtenerDatosPaciente(cita) {
        const registrado = obtenerPacientesGuardados().find(function (paciente) {
            return cita.patientDni && String(paciente.dni) === String(cita.patientDni);
        });
        return {
            nombre: (registrado && registrado.nombre) || cita.patient || '',
            dni: (registrado && registrado.dni) || cita.patientDni || '',
            email: (registrado && registrado.email) || cita.patientEmail || '',
            telefono: (registrado && (registrado.telefono || registrado.phone)) || cita.patientPhone || ''
        };
    }
    function escapar(texto) {
        return String(texto == null ? '' : texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function hoyISO() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    /* ----------------------------------------------------------
     * DASHBOARD SUPERIOR (métricas generales)
     * ---------------------------------------------------------- */
    function renderDashboard() {
        const statTotalPacientes = document.getElementById('statTotalPacientes');
        if (!statTotalPacientes) return; // esta vista no tiene dashboard

        const citas = obtenerCitas();
        const pacientes = obtenerPacientesGuardados();
        const hoy = hoyISO();

        statTotalPacientes.textContent = pacientes.length;
        const citasActivas = citas.filter(function (c) { return c.status !== 'cancelled'; });
        document.getElementById('statTotalCitas').textContent = citasActivas.length;
        document.getElementById('statCitasHoy').textContent =
            citasActivas.filter(function (c) { return c.date === hoy; }).length;
        document.getElementById('statCitasPendientesConfirmacion').textContent =
            citasActivas.filter(function (c) { return !c.status || c.status === 'pending'; }).length;
    }

    /* ----------------------------------------------------------
     * RENDER PRINCIPAL DE LA AGENDA
     * ---------------------------------------------------------- */
    function renderAgenda() {
        renderDashboard();

        const citas = obtenerCitas();
        if (!grid) return;

        grid.innerHTML = '';

        if (citas.length === 0) {
            if (vacioEl) vacioEl.classList.remove('d-none');
            return;
        }
        if (vacioEl) vacioEl.classList.add('d-none');

        // Ordenar por fecha y hora
        citas.sort(function (a, b) {
            return (a.date + ' ' + a.time).localeCompare(b.date + ' ' + b.time);
        });

        citas.forEach(function (cita) {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-xl-4';
            const paciente = obtenerDatosPaciente(cita);

            const notas = cita.notes && cita.notes.trim() !== '' ? cita.notes : 'Sin observaciones registradas.';
            const badgeEstado = cita.status === 'cancelled'
                ? '<span class="badge bg-danger">Cancelada</span>'
                : cita.status === 'attended'
                    ? '<span class="badge bg-primary">Atendida</span>'
                : cita.status === 'confirmed'
                    ? '<span class="badge bg-success">Confirmada</span>'
                    : '<span class="badge bg-warning text-dark">Por confirmar</span>';

            const botonRecordatorio = cita.status !== 'confirmed'
                ? ''
                : '<button type="button" class="btn btn-success btn-sm btn-enviar-recordatorio" data-id="' + escapar(cita.id) + '">Abrir WhatsApp</button>';
            const botonConfirmar = !cita.status || cita.status === 'pending'
                ? '<button type="button" class="btn btn-success btn-sm btn-confirmar-cita" data-id="' + escapar(cita.id) + '">Confirmar cita</button>'
                : '';
            const botonAtendida = cita.status === 'confirmed' && cita.date <= hoyISO()
                ? '<button type="button" class="btn btn-primary btn-sm btn-marcar-atendida" data-id="' + escapar(cita.id) + '">Marcar atendida</button>'
                : '';
            const botonCancelar = cita.status !== 'cancelled' && cita.status !== 'attended'
                ? '<button type="button" class="btn btn-outline-danger btn-sm btn-cancelar-cita" data-id="' + escapar(cita.id) + '">Cancelar cita</button>'
                : '';
            const botonEditar = cita.status !== 'cancelled' && cita.status !== 'attended'
                ? '<button type="button" class="btn btn-warning btn-sm btn-editar-cita" data-id="' + escapar(cita.id) + '">Editar</button>'
                : '';
            const botonEditarReporte = cita.reportado ? '<button type="button" class="btn btn-danger btn-sm btn-editar-reporte" data-id="' + escapar(cita.id) + '">Editar reporte</button>' : '';

            col.innerHTML =
                '<article class="agenda-item shadow-sm" ' +
                'data-patient="' + escapar(paciente.nombre) + '" ' +
                'data-patient-dni="' + escapar(paciente.dni) + '" ' +
                'data-patient-email="' + escapar(paciente.email) + '" ' +
                'data-patient-phone="' + escapar(paciente.telefono) + '" ' +
                'data-service="' + escapar(cita.service) + '" ' +
                'data-doctor="' + escapar(cita.doctor) + '" ' +
                'data-schedule="' + escapar(cita.date + ' · ' + cita.time) + '" ' +
                'data-mode="' + escapar(cita.mode) + '" ' +
                'data-notes="' + escapar(notas) + '">' +

                '<div class="d-flex justify-content-between align-items-start">' +
                '  <span class="agenda-hour">' + escapar(cita.time) + '</span>' +
                '  ' + badgeEstado +
                '</div>' +

                '<h3 class="h5 mt-3 mb-2">' + escapar(cita.service) + '</h3>' +
                '<p class="mb-1 fw-semibold">' + escapar(paciente.nombre) + '</p>' +
                '<p class="text-secondary mb-0">' + escapar(cita.doctor) + '</p>' +

                '<div class="agenda-meta">' +
                '  <span>' + escapar(cita.date) + '</span>' +
                '  <span>' + escapar(cita.mode) + '</span>' +
                '</div>' +

                '<p class="text-secondary">' + escapar(notas) + '</p>' +

                '<div class="d-flex flex-wrap gap-2 mt-2">' +
                '  <button type="button" class="btn btn-outline-dark btn-sm view-detail-btn">Ver detalle</button>' +
                '  ' + botonConfirmar +
                '  ' + botonEditar +
                '  ' + botonAtendida +
                '  ' + botonCancelar +
                '  ' + botonRecordatorio +
                '</div>' +

                '</article>';

            grid.appendChild(col);
        });

        enlazarBotonesTarjetas();
    }

    /* ----------------------------------------------------------
     * BOTONES DE CADA TARJETA (ver, confirmar, editar, cancelar y recordar)
     * ---------------------------------------------------------- */
    function enlazarBotonesTarjetas() {

        // Ver detalle
        grid.querySelectorAll('.view-detail-btn').forEach(function (button) {
            button.addEventListener('click', function () {
                const card = button.closest('article');
                if (!card) return;

                document.getElementById('modalPatient').textContent = card.dataset.patient || '';
                document.getElementById('modalPatientDni').textContent = card.dataset.patientDni || 'No disponible';
                document.getElementById('modalPatientEmail').textContent = card.dataset.patientEmail || 'No indicado';
                document.getElementById('modalPatientPhone').textContent = card.dataset.patientPhone || 'No indicado';
                document.getElementById('modalService').textContent = card.dataset.service || '';
                document.getElementById('modalDoctor').textContent = card.dataset.doctor || '';
                document.getElementById('modalSchedule').textContent = card.dataset.schedule || '';
                document.getElementById('modalMode').textContent = card.dataset.mode || '';
                document.getElementById('modalNotes').textContent = card.dataset.notes || '';

                const modalEl = document.getElementById('appointmentModal');
                if (modalEl) new bootstrap.Modal(modalEl).show();
            });
        });

        function cambiarEstadoCita(button, nuevoEstado, mensajeConfirmacion) {
            const id = button.getAttribute('data-id');
            if (!confirm(mensajeConfirmacion)) return;
            const citas = obtenerCitas();
            const cita = citas.find(function (item) { return String(item.id) === String(id); });
            if (!cita) {
                alert('No se encontró la cita seleccionada.');
                return;
            }
            cita.status = nuevoEstado;
            cita[nuevoEstado === 'confirmed' ? 'confirmedAt' :
                nuevoEstado === 'attended' ? 'attendedAt' : 'cancelledAt'] = new Date().toISOString();
            if (guardarCitas(citas)) renderAgenda();
        }

        grid.querySelectorAll('.btn-confirmar-cita').forEach(function (button) {
            button.addEventListener('click', function () {
                cambiarEstadoCita(button, 'confirmed', '¿Confirmar esta cita? Después podrás preparar un recordatorio por WhatsApp.');
            });
        });

        grid.querySelectorAll('.btn-marcar-atendida').forEach(function (button) {
            button.addEventListener('click', function () {
                cambiarEstadoCita(button, 'attended', '¿Registrar esta cita como atendida?');
            });
        });

        grid.querySelectorAll('.btn-cancelar-cita').forEach(function (button) {
            button.addEventListener('click', function () {
                cambiarEstadoCita(button, 'cancelled', '¿Cancelar esta cita? Se conservará en la agenda como cancelada.');
            });
        });

        // Editar
        grid.querySelectorAll('.btn-editar-cita').forEach(function (button) {
            button.addEventListener('click', function () {
                const id = button.getAttribute('data-id');
                const citas = obtenerCitas();
                const cita = citas.find(function (c) { return String(c.id) === String(id); });
                if (!cita) return;

                document.getElementById('edit-cita-id').value = cita.id;
                const paciente = obtenerDatosPaciente(cita);
                document.getElementById('edit-cita-patient').value = paciente.nombre;
                document.getElementById('edit-cita-patient-dni').value = paciente.dni;
                document.getElementById('edit-cita-patient-email').value = paciente.email;
                document.getElementById('edit-cita-patient-phone').value = paciente.telefono;
                document.getElementById('edit-cita-doctor').value = cita.doctor || '';
                document.getElementById('edit-cita-service').value = cita.service || '';
                document.getElementById('edit-cita-date').value = cita.date || '';
                document.getElementById('edit-cita-time').value = cita.time || '';
                document.getElementById('edit-cita-mode').value = cita.mode || '';
                document.getElementById('edit-cita-notes').value = cita.notes || '';

                new bootstrap.Modal(document.getElementById('modalEditarCita')).show();
            });
        });

        // Enviar recordatorio
        grid.querySelectorAll('.btn-enviar-recordatorio').forEach(function (button) {
            button.addEventListener('click', function () {
                citaIdParaRecordatorio = button.getAttribute('data-id');

                const cita = obtenerCitas().find(function (item) {
                    return String(item.id) === String(citaIdParaRecordatorio);
                });
                if (recordatorioNumeroInput) {
                    recordatorioNumeroInput.value = cita ? obtenerDatosPaciente(cita).telefono : '';
                }
                if (recordatorioErrorEl) recordatorioErrorEl.classList.add('d-none');

                modalRecordatorioInstance.show();
            });
        });
    }

    /* ----------------------------------------------------------
     * FORMULARIO EDITAR CITA
     * ---------------------------------------------------------- */
    const formEditarCita = document.getElementById('formEditarCita');
    const modalEditarCitaEl = document.getElementById('modalEditarCita');

    if (formEditarCita) {
        formEditarCita.addEventListener('submit', function (e) {
            e.preventDefault();

            const id = document.getElementById('edit-cita-id').value;
            let citas = obtenerCitas();
            const idx = citas.findIndex(function (c) { return String(c.id) === String(id); });
            if (idx === -1) return;

            if (!formEditarCita.reportValidity()) return;
            const doctor = document.getElementById('edit-cita-doctor').value;
            const fecha = document.getElementById('edit-cita-date').value;
            const hora = document.getElementById('edit-cita-time').value;
            const errorHorario = document.getElementById('errorHorarioEditarCita');
            if (horarioOcupado(doctor, fecha, hora, id)) {
                errorHorario.classList.remove('d-none');
                return;
            }
            errorHorario.classList.add('d-none');

            citas[idx].patient = document.getElementById('edit-cita-patient').value;
            citas[idx].patientDni = document.getElementById('edit-cita-patient-dni').value;
            citas[idx].patientEmail = document.getElementById('edit-cita-patient-email').value;
            citas[idx].patientPhone = document.getElementById('edit-cita-patient-phone').value;
            citas[idx].doctor = doctor;
            citas[idx].service = document.getElementById('edit-cita-service').value;
            citas[idx].date = fecha;
            citas[idx].time = hora;
            citas[idx].mode = document.getElementById('edit-cita-mode').value;
            citas[idx].notes = document.getElementById('edit-cita-notes').value;
            citas[idx].status = 'pending';
            citas[idx].confirmedAt = null;
            citas[idx].reminderSent = false;

            if (!guardarCitas(citas)) return;
            renderAgenda();

            const modalInstance = bootstrap.Modal.getInstance(modalEditarCitaEl);
            if (modalInstance) modalInstance.hide();
        });
    }

    /* ----------------------------------------------------------
     * BUSCADOR DE PACIENTES (dentro del modal Editar cita)
     * ---------------------------------------------------------- */
    const listaPacientesAgendaEl = document.getElementById('listaPacientesAgenda');
    const buscarPacienteAgendaInput = document.getElementById('buscarPacienteAgendaInput');
    const sinPacientesAgendaEl = document.getElementById('sinPacientesAgenda');
    const modalBuscarPacienteAgendaEl = document.getElementById('modalBuscarPacienteAgenda');

    function renderPacientesAgenda(filtro) {
        if (!listaPacientesAgendaEl) return;

        const pacientes = obtenerPacientesGuardados();
        const filtroLower = (filtro || '').trim().toLowerCase();
        const filtrados = pacientes.filter(function (p) {
            return (p.nombre || '').toLowerCase().includes(filtroLower) ||
                   (p.dni || '').toLowerCase().includes(filtroLower);
        });

        listaPacientesAgendaEl.innerHTML = '';

        if (pacientes.length === 0) {
            if (sinPacientesAgendaEl) sinPacientesAgendaEl.classList.remove('d-none');
            return;
        }
        if (sinPacientesAgendaEl) sinPacientesAgendaEl.classList.add('d-none');

        if (filtrados.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'text-secondary text-center mb-0';
            vacio.textContent = 'No se encontraron pacientes con ese criterio.';
            listaPacientesAgendaEl.appendChild(vacio);
            return;
        }

        filtrados.forEach(function (p) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action';
            item.innerHTML =
                '<span class="fw-semibold">' + escapar(p.nombre || 'Sin nombre') + '</span>' +
                '<br><span class="text-secondary small">DNI: ' + escapar(p.dni || '-') + '</span>';

            item.addEventListener('click', function () {
                document.getElementById('edit-cita-patient').value = p.nombre || '';
                document.getElementById('edit-cita-patient-dni').value = p.dni || '';
                document.getElementById('edit-cita-patient-email').value = p.email || '';
                document.getElementById('edit-cita-patient-phone').value = p.telefono || p.phone || '';
                const modalInstance = bootstrap.Modal.getInstance(modalBuscarPacienteAgendaEl);
                if (modalInstance) modalInstance.hide();
            });

            listaPacientesAgendaEl.appendChild(item);
        });
    }

    if (modalBuscarPacienteAgendaEl) {
        modalBuscarPacienteAgendaEl.addEventListener('show.bs.modal', function () {
            if (buscarPacienteAgendaInput) buscarPacienteAgendaInput.value = '';
            renderPacientesAgenda('');
        });
    }
    if (buscarPacienteAgendaInput) {
        buscarPacienteAgendaInput.addEventListener('input', function () {
            renderPacientesAgenda(buscarPacienteAgendaInput.value);
        });
    }

    /* ----------------------------------------------------------
     * BUSCADOR DE MÉDICOS (dentro del modal Editar cita)
     * ---------------------------------------------------------- */
    const listaMedicosAgendaEl = document.getElementById('listaMedicosAgenda');
    const buscarMedicoAgendaInput = document.getElementById('buscarMedicoAgendaInput');
    const modalBuscarMedicoAgendaEl = document.getElementById('modalBuscarMedicoAgenda');

    function renderMedicosAgenda(filtro) {
        if (!listaMedicosAgendaEl) return;

        const filtroLower = (filtro || '').trim().toLowerCase();
        const filtrados = medicosDisponibles.filter(function (m) {
            return m.nombre.toLowerCase().includes(filtroLower) ||
                   m.especialidad.toLowerCase().includes(filtroLower);
        });

        listaMedicosAgendaEl.innerHTML = '';

        if (filtrados.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'text-secondary text-center mb-0';
            vacio.textContent = 'No se encontraron médicos con ese criterio.';
            listaMedicosAgendaEl.appendChild(vacio);
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
                document.getElementById('edit-cita-doctor').value = m.nombre;
                const modalInstance = bootstrap.Modal.getInstance(modalBuscarMedicoAgendaEl);
                if (modalInstance) modalInstance.hide();
            });

            listaMedicosAgendaEl.appendChild(item);
        });
    }

    if (modalBuscarMedicoAgendaEl) {
        modalBuscarMedicoAgendaEl.addEventListener('show.bs.modal', function () {
            if (buscarMedicoAgendaInput) buscarMedicoAgendaInput.value = '';
            renderMedicosAgenda('');
        });
    }
    if (buscarMedicoAgendaInput) {
        buscarMedicoAgendaInput.addEventListener('input', function () {
            renderMedicosAgenda(buscarMedicoAgendaInput.value);
        });
    }

    /* ----------------------------------------------------------
     * ENVIAR RECORDATORIO POR WHATSAPP
     * ---------------------------------------------------------- */
    let citaIdParaRecordatorio = null;

    const modalRecordatorioEl = document.getElementById('modalRecordatorio');
    const recordatorioNumeroInput = document.getElementById('recordatorioNumero');
    const recordatorioErrorEl = document.getElementById('recordatorioError');
    const btnConfirmarRecordatorio = document.getElementById('btnConfirmarRecordatorio');

    const modalRecordatorioInstance = modalRecordatorioEl ? new bootstrap.Modal(modalRecordatorioEl) : null;

    if (btnConfirmarRecordatorio) {
        btnConfirmarRecordatorio.addEventListener('click', function () {
            const numero = (recordatorioNumeroInput.value || '').trim();

            if (!/^\d{9}$/.test(numero)) {
                recordatorioErrorEl.classList.remove('d-none');
                recordatorioNumeroInput.classList.add('is-invalid');
                return;
            }
            recordatorioErrorEl.classList.add('d-none');
            recordatorioNumeroInput.classList.remove('is-invalid');

            let citas = obtenerCitas();
            const idx = citas.findIndex(function (c) { return String(c.id) === String(citaIdParaRecordatorio); });
            if (idx === -1) return;

            const cita = citas[idx];
            const mensaje =
                'Hola ' + obtenerDatosPaciente(cita).nombre + '! Este es un recordatorio de tu cita:\n' +
                'Servicio: ' + cita.service + '\n' +
                'Médico: ' + cita.doctor + '\n' +
                'Fecha: ' + cita.date + '\n' +
                'Hora: ' + cita.time + '\n' +
                'Modalidad: ' + cita.mode +
                '\n\n¡Te esperamos en CliniAgenda!';

            const enlaceWhatsapp = 'https://wa.me/51' + numero + '?text=' + encodeURIComponent(mensaje);
            window.open(enlaceWhatsapp, '_blank');

            modalRecordatorioInstance.hide();
        });
    }

    if (recordatorioNumeroInput) {
        recordatorioNumeroInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (btnConfirmarRecordatorio) btnConfirmarRecordatorio.click();
            }
        });
    }

    // Primer render
    renderAgenda();
});