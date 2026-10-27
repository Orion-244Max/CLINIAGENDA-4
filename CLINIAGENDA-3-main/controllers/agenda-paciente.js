document.addEventListener('DOMContentLoaded', function () {
    const sesion = window.CliniAuth && CliniAuth.obtenerSesion();
    const grid = document.getElementById('misCitasGrid');
    const vacioEl = document.getElementById('misCitasVacio');
    const nombreEl = document.getElementById('pacienteActualNombre');

    if (!sesion || sesion.rol !== 'PACIENTE') {
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

    function render() {
        const pacientes = obtenerLista('pacientes');
        const paciente = pacientes.find(function (item) {
            return String(item.dni) === String(sesion.dni);
        });
        const citas = obtenerLista('citas').filter(function (cita) {
            return (cita.patientDni && String(cita.patientDni) === String(sesion.dni)) ||
                (!cita.patientDni && paciente &&
                    String(cita.patient || '').trim().toLowerCase() ===
                    String(paciente.nombre || '').trim().toLowerCase());
        });

        nombreEl.textContent = paciente ? paciente.nombre : sesion.nombre;
        grid.innerHTML = '';
        document.getElementById('statMisCitas').textContent =
            citas.filter(function (cita) { return cita.status !== 'cancelled'; }).length;
        document.getElementById('statMisRecordatorios').textContent =
            citas.filter(function (cita) {
                return !cita.reminderSent && cita.status !== 'cancelled' && cita.status !== 'attended';
            }).length;
        const hoy = new Date();
        const hoyISO = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
            String(hoy.getDate()).padStart(2, '0');
        const proximas = citas.filter(function (cita) {
            return cita.status !== 'cancelled' && cita.status !== 'attended' && cita.date >= hoyISO;
        }).sort(function (a, b) {
            return (a.date + ' ' + a.time).localeCompare(b.date + ' ' + b.time);
        });
        document.getElementById('statProximaCita').textContent =
            proximas.length ? proximas[0].date + ' ' + proximas[0].time : '—';

        if (!citas.length) {
            vacioEl.classList.remove('d-none');
            vacioEl.querySelector('p').textContent = 'No tienes citas registradas todavía.';
            return;
        }

        vacioEl.classList.add('d-none');
        citas.sort(function (a, b) {
            return (a.date + ' ' + a.time).localeCompare(b.date + ' ' + b.time);
        }).forEach(function (cita) {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-xl-4';
            const estado = cita.status === 'attended' ? 'Atendida' :
                cita.status === 'cancelled' ? 'Cancelada' :
                    cita.status === 'confirmed' ? 'Confirmada' : 'Pendiente';
            const colorEstado = cita.status === 'attended' ? 'bg-primary' :
                cita.status === 'cancelled' ? 'bg-danger' :
                    cita.status === 'confirmed' ? 'bg-success' : 'bg-warning text-dark';
            col.innerHTML =
                '<article class="agenda-item shadow-sm">' +
                '<div class="d-flex justify-content-between align-items-start gap-2">' +
                '<span class="agenda-hour">' + escapar(cita.time) + '</span>' +
                '<span class="badge ' + colorEstado + '">' + estado + '</span>' +
                '</div>' +
                '<h3 class="h5 mt-3 mb-2">' + escapar(cita.service) + '</h3>' +
                '<p class="text-secondary mb-0">' + escapar(cita.doctor) + '</p>' +
                '<div class="agenda-meta"><span>' + escapar(cita.date) + '</span><span>' + escapar(cita.mode) + '</span></div>' +
                '<p class="text-secondary mb-0">' + escapar(cita.notes || 'Sin observaciones registradas.') + '</p>' +
                '</article>';
            grid.appendChild(col);
        });
    }

    render();
});
