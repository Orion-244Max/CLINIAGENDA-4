/* ==========================================================
 * PACIENTES.JS
 * Maneja el listado, edición y eliminación de pacientes.
 * Toda la información vive en localStorage bajo la clave
 * "pacientes" (la crea paciente-form.js al registrar).
 * ========================================================== */

document.addEventListener('DOMContentLoaded', function () {

    const STORAGE_KEY = 'pacientes';

    const tbody = document.getElementById('tablaPacientesBody');
    const totalEl = document.getElementById('totalRegistrados');
    const estadoVacio = document.getElementById('estadoVacio');
    const contenedorTabla = document.getElementById('contenedorTabla');
    const modalEditar = document.getElementById('modalEditarPaciente');
    const formEditar = modalEditar ? modalEditar.querySelector('form') : null;
    const sesion = window.CliniAuth && CliniAuth.obtenerSesion();
    const esAdmin = !!sesion && sesion.rol === 'ADMIN';
    let solicitudEnEdicion = null;

    if (!esAdmin) {
        const encabezadoAcciones = document.querySelector('#contenedorTabla thead th:last-child');
        if (encabezadoAcciones) encabezadoAcciones.classList.add('d-none');
        if (modalEditar) modalEditar.remove();
        const enlaceRegistro = estadoVacio && estadoVacio.querySelector('a');
        if (enlaceRegistro) enlaceRegistro.remove();
    }

    function obtenerPacientes() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function guardarPacientes(lista) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    }

    function escapar(texto) {
        return String(texto == null ? '' : texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function obtenerSolicitudes() {
        try {
            const solicitudes = JSON.parse(localStorage.getItem('solicitudesPaciente')) || [];
            return Array.isArray(solicitudes) ? solicitudes : [];
        } catch (error) {
            alert('No se pudieron cargar las solicitudes de pacientes.');
            return [];
        }
    }

    function renderSolicitudes() {
        const panel = document.getElementById('solicitudesPacientesPanel');
        const listaEl = document.getElementById('listaSolicitudesPacientes');
        const totalElSolicitudes = document.getElementById('totalSolicitudesPacientes');
        if (!esAdmin || !panel || !listaEl || !totalElSolicitudes) return;

        const pendientes = obtenerSolicitudes().filter(function (solicitud) {
            return solicitud.estado === 'pendiente';
        });
        listaEl.innerHTML = '';
        panel.classList.toggle('d-none', pendientes.length === 0);
        totalElSolicitudes.textContent = pendientes.length + ' pendiente' + (pendientes.length === 1 ? '' : 's');

        pendientes.forEach(function (solicitud) {
            const paciente = obtenerPacientes().find(function (item) {
                return solicitud.dni
                    ? String(item.dni) === String(solicitud.dni)
                    : String(item.nombre || '').toLowerCase() === String(solicitud.paciente || '').toLowerCase();
            });
            const tarjeta = document.createElement('article');
            tarjeta.className = 'border rounded p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3';
            const datos = document.createElement('div');
            const titulo = document.createElement('strong');
            titulo.textContent = solicitud.paciente || 'Paciente sin nombre';
            const detalle = document.createElement('p');
            detalle.className = 'mb-0 text-secondary small';
            detalle.textContent = 'DNI: ' + (solicitud.dni || 'no indicado') + ' · Solicita: ' +
                (solicitud.doctor || 'médico') + ' · Motivo: ' + (solicitud.motivo || 'No indicado');
            datos.appendChild(titulo);
            datos.appendChild(detalle);
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'btn btn-primary btn-sm';
            boton.textContent = paciente ? 'Revisar y editar ficha' : 'Registrar ficha del paciente';
            boton.addEventListener('click', function () {
                solicitudEnEdicion = solicitud.id;
                if (paciente) {
                    abrirEdicionPaciente(paciente);
                } else {
                    sessionStorage.setItem('solicitudPacienteNueva', JSON.stringify(solicitud));
                    window.location.href = 'paciente-form.html';
                }
            });
            tarjeta.appendChild(datos);
            tarjeta.appendChild(boton);
            listaEl.appendChild(tarjeta);
        });
    }

    function abrirEdicionPaciente(paciente, mostrarModal) {
        document.getElementById('edit-id').value = paciente.id || '';
        document.getElementById('edit-nombre').value = paciente.nombre || '';
        document.getElementById('edit-dni').value = paciente.dni || '';
        document.getElementById('edit-email').value = paciente.email || '';
        document.getElementById('edit-telefono').value = paciente.telefono || '';
        document.getElementById('edit-fecha').value = paciente.fechaNacimiento || '';
        document.getElementById('edit-sexo').value = paciente.sexo || '';
        document.getElementById('edit-direccion').value = paciente.direccion || '';
        if (mostrarModal !== false) bootstrap.Modal.getOrCreateInstance(modalEditar).show();
    }

    /* ----------------------------------------------------------
     * RENDERIZAR TABLA COMPLETA DESDE LOCALSTORAGE
     * ---------------------------------------------------------- */
    function renderTabla() {
        const pacientes = obtenerPacientes();

        if (totalEl) totalEl.textContent = pacientes.length;

        if (!tbody) return;
        tbody.innerHTML = '';

        if (pacientes.length === 0) {
            if (contenedorTabla) contenedorTabla.classList.add('d-none');
            if (estadoVacio) estadoVacio.classList.remove('d-none');
            return;
        }

        if (contenedorTabla) contenedorTabla.classList.remove('d-none');
        if (estadoVacio) estadoVacio.classList.add('d-none');

        pacientes.forEach(function (p, index) {
            const badgeClass = p.sexo === 'Femenino' ? 'badge-femenino' : 'badge-masculino';

            const tr = document.createElement('tr');
            const acciones = esAdmin
                ? '<td><div class="d-flex justify-content-center gap-2">' +
                  '<button type="button" class="btn btn-warning btn-sm fw-medium px-3 btn-editar-paciente" ' +
                  'data-bs-toggle="modal" data-bs-target="#modalEditarPaciente" ' +
                  'data-id="' + escapar(p.id) + '" data-nombre="' + escapar(p.nombre) + '" data-dni="' + escapar(p.dni) + '" ' +
                  'data-email="' + escapar(p.email) + '" data-telefono="' + escapar(p.telefono) + '" ' +
                  'data-fecha="' + escapar(p.fechaNacimiento) + '" data-sexo="' + escapar(p.sexo) + '" data-direccion="' + escapar(p.direccion) + '">' +
                  'Editar</button>' +
                  '<button type="button" class="btn btn-danger btn-sm fw-medium px-3 btn-eliminar-paciente" data-id="' + escapar(p.id) + '">' +
                  'Eliminar</button></div></td>'
                : '';

            tr.innerHTML =
                '<td>' + (index + 1) + '</td>' +
                '<td class="fw-semibold">' + escapar(p.nombre) + '</td>' +
                '<td>' + escapar(p.dni) + '</td>' +
                '<td>' + escapar(p.email) + '</td>' +
                '<td>' + escapar(p.telefono) + '</td>' +
                '<td>' + escapar(p.fechaNacimiento) + '</td>' +
                '<td><span class="badge ' + badgeClass + '">' + escapar(p.sexo || 'No especificado') + '</span></td>' +
                acciones;

            tbody.appendChild(tr);
        });

        // Enlazar botones "Eliminar" recién creados
        tbody.querySelectorAll('.btn-eliminar-paciente').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const id = btn.getAttribute('data-id');
                const confirmar = confirm(
                    '¿Estás seguro de que deseas eliminar a este paciente?\n\nEsta acción no se puede deshacer.'
                );
                if (!confirmar) return;

                let lista = obtenerPacientes();
                lista = lista.filter(function (p) { return String(p.id) !== String(id); });
                guardarPacientes(lista);
                renderTabla();
            });
        });
    }

    /* ----------------------------------------------------------
     * MODAL EDITAR: precargar datos al abrir
     * ---------------------------------------------------------- */
    if (esAdmin && modalEditar) {
        modalEditar.addEventListener('show.bs.modal', function (evento) {
            const boton = evento.relatedTarget;
            if (!boton) return;

            const paciente = obtenerPacientes().find(function (item) {
                return String(item.id) === String(boton.getAttribute('data-id'));
            });
            if (paciente) abrirEdicionPaciente(paciente, false);
        });
    }

    /* ----------------------------------------------------------
     * MODAL EDITAR: guardar cambios en localStorage
     * ---------------------------------------------------------- */
    if (esAdmin && formEditar) {
        formEditar.addEventListener('submit', function (e) {
            e.preventDefault();

            const id = document.getElementById('edit-id').value;
            let lista = obtenerPacientes();
            const idx = lista.findIndex(function (p) { return String(p.id) === String(id); });

            const actualizado = {
                id: id,
                nombre: document.getElementById('edit-nombre').value.trim(),
                dni: document.getElementById('edit-dni').value.trim(),
                email: document.getElementById('edit-email').value.trim(),
                telefono: document.getElementById('edit-telefono').value.trim(),
                fechaNacimiento: document.getElementById('edit-fecha').value,
                sexo: document.getElementById('edit-sexo').value,
                direccion: document.getElementById('edit-direccion').value.trim()
            };

            const dniDuplicado = lista.some(function (paciente) {
                return String(paciente.dni) === actualizado.dni && String(paciente.id) !== String(id);
            });
            if (dniDuplicado) {
                alert('No se puede guardar: el DNI ya pertenece a otro paciente.');
                return;
            }

            if (idx >= 0) {
                lista[idx] = actualizado;
            } else {
                lista.push(actualizado);
            }

            guardarPacientes(lista);
            renderTabla();
            if (solicitudEnEdicion !== null) {
                const solicitudes = obtenerSolicitudes();
                const solicitud = solicitudes.find(function (item) {
                    return String(item.id) === String(solicitudEnEdicion);
                });
                if (solicitud) {
                    solicitud.estado = 'resuelta';
                    solicitud.resueltaEn = new Date().toISOString();
                    solicitud.resueltaPor = sesion.nombre;
                    localStorage.setItem('solicitudesPaciente', JSON.stringify(solicitudes));
                }
                solicitudEnEdicion = null;
                renderSolicitudes();
            }

            const modalInstance = bootstrap.Modal.getInstance(modalEditar);
            if (modalInstance) modalInstance.hide();
        });
    }

    /* ----------------------------------------------------------
     * EVITAR DOBLE ENVÍO EN CUALQUIER FORM DE LA PÁGINA
     * ---------------------------------------------------------- */
    document.querySelectorAll('form').forEach(function (formulario) {
        formulario.addEventListener('submit', function () {
            const boton = formulario.querySelector('button[type="submit"]');
            if (!boton) return;
            boton.disabled = true;
            const textoOriginal = boton.textContent;
            boton.textContent = 'Procesando...';
            setTimeout(function () {
                boton.disabled = false;
                boton.textContent = textoOriginal;
            }, 1500);
        });
    });

    // Primer render al cargar la página
    renderTabla();
    renderSolicitudes();
});