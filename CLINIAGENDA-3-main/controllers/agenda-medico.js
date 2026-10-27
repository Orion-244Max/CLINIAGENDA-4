document.addEventListener('DOMContentLoaded', function () {
    const sesion = window.CliniAuth && CliniAuth.obtenerSesion();
    const grid = document.getElementById('citasMedicoGrid');
    const vacioEl = document.getElementById('citasMedicoVacio');
    const nombreEl = document.getElementById('medicoActualNombre');

    if (!sesion || sesion.rol !== 'MEDICO') {
        window.location.replace('acceso.html');
        return;
    }
    function obtenerLista(clave) {
        try {
            return JSON.parse(localStorage.getItem(clave)) || [];
        } catch (error) {
            alert('No se pudieron leer los datos guardados. Revisa el almacenamiento del navegador.');
            return [];
        }
    }

    function escapar(texto) {
        return String(texto == null ? '' : texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizarNombre(nombre) {
        return String(nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/^(dr\.?\s*|dra\.?\s*)/, '').replace(/[^a-z0-9]/g, '');
    }

    function hoyISO() {
        const hoy = new Date();
        return hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
            String(hoy.getDate()).padStart(2, '0');
    }

    function citasDelMedico() {
        const nombre = normalizarNombre(sesion.nombre);
        return obtenerLista('citas').filter(function (cita) {
            return normalizarNombre(cita.doctor) === nombre && cita.date === hoyISO();
        }).sort(function (a, b) {
            return String(a.time || '').localeCompare(String(b.time || ''));
        });
    }

    function buscarPaciente(cita, pacientes) {
        const registrado = pacientes.find(function (paciente) {
            if (cita.patientDni && paciente.dni) {
                return String(paciente.dni) === String(cita.patientDni);
            }
            return String(paciente.nombre || '').trim().toLowerCase() ===
                String(cita.patient || '').trim().toLowerCase();
        });
        return {
            nombre: registrado ? registrado.nombre : cita.patient,
            dni: registrado ? registrado.dni : cita.patientDni,
            email: (registrado && registrado.email) || cita.patientEmail,
            telefono: (registrado && (registrado.telefono || registrado.phone)) || cita.patientPhone
        };
    }

    function etiquetaEstado(cita) {
        if (cita.status === 'cancelled') return '<span class="badge bg-danger">Cancelada</span>';
        if (cita.status === 'attended') return '<span class="badge bg-primary">Atendida</span>';
        if (cita.status === 'confirmed') return '<span class="badge bg-success">Confirmada</span>';
        return '<span class="badge bg-warning text-dark">Pendiente de confirmación</span>';
    }

    function render() {
        const citas = citasDelMedico();
        const pacientes = obtenerLista('pacientes');
        nombreEl.textContent = sesion.nombre || 'Médico';
        grid.innerHTML = '';
        actualizarStats(citas);

        if (citas.length === 0) {
            vacioEl.classList.remove('d-none');
            vacioEl.querySelector('p').textContent = 'No tienes citas asignadas todavía.';
            return;
        }
        vacioEl.classList.add('d-none');

        citas.sort(function (a, b) {
            return (a.date + ' ' + a.time).localeCompare(b.date + ' ' + b.time);
        }).forEach(function (cita) {
            const paciente = buscarPaciente(cita, pacientes);
            const col = document.createElement('div');
            col.className = 'col-md-6 col-xl-4';
            col.innerHTML =
                '<article class="agenda-item shadow-sm">' +
                '<div class="d-flex justify-content-between align-items-start gap-2">' +
                '<span class="agenda-hour">' + escapar(cita.time) + '</span>' +
                etiquetaEstado(cita) +
                '</div>' +
                '<h3 class="h5 mt-3 mb-2">' + escapar(cita.service) + '</h3>' +
                '<p class="mb-1 fw-semibold">' + escapar(cita.patient) + '</p>' +
                '<div class="agenda-meta"><span>' + escapar(cita.date) + '</span><span>' + escapar(cita.mode) + '</span></div>' +
                '<div class="d-flex flex-wrap gap-2 mt-3">' +
                    '<button type="button" class="btn btn-outline-danger btn-sm btn-med-reportar" data-id="' + escapar(cita.id) + '">Reportar</button>' +

                    '</div>' +
                '</article>';

            const detalle = col.querySelector('.btn-med-detalle');
            detalle.dataset.paciente = JSON.stringify(paciente || {});
            detalle.dataset.cita = JSON.stringify(cita);
            grid.appendChild(col);
        });
    }

    function actualizarStats(citas) {
        const activas = citas.filter(function (cita) { return cita.status !== 'cancelled'; });
        document.getElementById('statCitasMedico').textContent = activas.length;
        document.getElementById('statCitasHoyMedico').textContent =
            activas.filter(function (cita) { return cita.status === 'confirmed'; }).length;
        const proximas = activas.filter(function (cita) { return cita.status !== 'attended'; })
            .sort(function (a, b) { return String(a.time || '').localeCompare(String(b.time || '')); });
        document.getElementById('statProximaCitaMedico').textContent =
            proximas.length ? proximas[0].time : '—';
    }

    function mostrarExpediente(button) {
        let paciente;
        let cita;
        try {
            paciente = JSON.parse(button.dataset.paciente || '{}');
            cita = JSON.parse(button.dataset.cita || '{}');
        } catch (error) {
            alert('No se pudo cargar el detalle de esta cita.');
            return;
        }
        document.getElementById('medModalPatient').textContent = cita.patient || '';
        document.getElementById('medModalService').textContent = cita.service || '';
        document.getElementById('medModalSchedule').textContent = (cita.date || '') + ' · ' + (cita.time || '');
        document.getElementById('medModalMode').textContent = cita.mode || '';
        document.getElementById('medModalNotes').textContent = cita.notes || 'Sin observaciones registradas.';
        document.getElementById('medModalPatientDni').textContent = paciente.dni || 'No disponible';
        document.getElementById('medModalPatientEmail').textContent = paciente.email || 'No indicado';
        document.getElementById('medModalPatientPhone').textContent = paciente.telefono || 'No indicado';
        new bootstrap.Modal(document.getElementById('citaMedicoModal')).show();
    }

    grid.addEventListener('click', function (event) {
        const button = event.target.closest('button[data-id]');
        if (!button) return;
        if (button.classList.contains('btn-med-detalle')) {
            mostrarExpediente(button);
        }
    });

    render();
});
