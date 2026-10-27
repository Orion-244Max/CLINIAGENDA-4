/* ==========================================================
 * PACIENTE-FORM.JS (Consolidado)
 * Maneja la validación del formulario y el guardado en
 * LocalStorage para simular el registro de pacientes.
 * ========================================================== */

document.addEventListener('DOMContentLoaded', function () {

    const btnValidar = document.getElementById('btnValidarPaciente');
    const form = document.querySelector('form');

    if (!form) return;

    const sesion = window.CliniAuth && CliniAuth.obtenerSesion();
    const esPaciente = !!sesion && sesion.rol === 'PACIENTE';
    const campoNombre = document.getElementById('nombrePaciente');
    const campoDni = document.getElementById('dniPaciente');
    const campoCorreo = document.getElementById('emailPaciente');
    const campoTelefono = document.getElementById('telPaciente');
    let solicitudAdminEnEdicion = null;

    if (esPaciente) {
        const titulo = document.querySelector('main h2');
        const eyebrow = document.querySelector('main .section-eyebrow');
        if (titulo) titulo.textContent = 'Mis datos de paciente';
        if (eyebrow) eyebrow.textContent = 'Registro de paciente';
        const botonGuardar = form.querySelector('button[type="submit"]');
        const enlaceCancelar = form.querySelector('a');
        if (botonGuardar) botonGuardar.textContent = 'Guardar mis datos';
        if (enlaceCancelar) {
            enlaceCancelar.href = 'agenda-paciente.html';
            enlaceCancelar.textContent = 'Volver a mi agenda';
        }

        const usuario = CliniAuth.obtenerUsuarios().find(function (u) {
            return String(u.dni) === String(sesion.dni);
        });
        const pacienteGuardado = (function () {
            try {
                const pacientes = JSON.parse(localStorage.getItem('pacientes')) || [];
                return pacientes.find(function (paciente) {
                    return String(paciente.dni) === String(sesion.dni);
                });
            } catch (error) {
                alert('No se pudieron cargar tus datos guardados.');
                return null;
            }
        })();

        if (campoNombre) {
            campoNombre.value = sesion.nombre || (usuario && usuario.nombre) || '';
            campoNombre.readOnly = true;
        }
        if (campoDni) {
            campoDni.value = sesion.dni || (usuario && usuario.dni) || '';
            campoDni.readOnly = true;
        }
        if (campoCorreo) {
            campoCorreo.value = sesion.email || (usuario && usuario.email) || '';
            campoCorreo.readOnly = true;
        }
        if (campoTelefono) {
            campoTelefono.value = (pacienteGuardado && pacienteGuardado.telefono) ||
                (usuario && usuario.phone) || '';
        }
        const campoFecha = document.getElementById('fechaNacPaciente');
        const campoSexo = document.getElementById('sexoPaciente');
        const campoDireccion = document.getElementById('dirPaciente');
        if (pacienteGuardado) {
            if (campoFecha) campoFecha.value = pacienteGuardado.fechaNacimiento || '';
            if (campoSexo) campoSexo.value = pacienteGuardado.sexo || '';
            if (campoDireccion) campoDireccion.value = pacienteGuardado.direccion || '';
        }
    }
    if (sesion && sesion.rol === 'ADMIN') {
        const solicitudJson = sessionStorage.getItem('solicitudPacienteNueva');
        if (solicitudJson) {
            try {
                solicitudAdminEnEdicion = JSON.parse(solicitudJson);
                if (campoNombre) campoNombre.value = solicitudAdminEnEdicion.paciente || '';
                if (campoDni) campoDni.value = solicitudAdminEnEdicion.dni || '';
                const titulo = document.querySelector('main h2');
                if (titulo) titulo.textContent = 'Completar ficha solicitada';
            } catch (error) {
                alert('No se pudo cargar la solicitud de actualización.');
                sessionStorage.removeItem('solicitudPacienteNueva');
            }
        }
    }

    // ==========================================================
    // 1. VALIDACIÓN VISUAL DE CAMPOS
    // ==========================================================
    if (btnValidar) {
        btnValidar.addEventListener('click', function () {
            let valido = true;

            const nombre = document.getElementById('nombrePaciente');
            const dni = document.getElementById('dniPaciente');
            const fecha = document.getElementById('fechaNacPaciente');
            const correo = document.getElementById('emailPaciente');
            const telefono = document.getElementById('telPaciente');
            const sexo = document.getElementById('sexoPaciente');

            // Limpiar mensajes anteriores
            form.querySelectorAll('.validacion-error, .validacion-correcto').forEach(e => e.remove());
            form.querySelectorAll('.is-invalid, .is-valid').forEach(c => {
                c.classList.remove('is-invalid');
                c.classList.remove('is-valid');
            });

            function error(campo, mensaje) {
                valido = false;
                campo.classList.add('is-invalid');
                const msj = document.createElement('div');
                msj.className = 'validacion-error text-danger mt-1 small';
                msj.textContent = '⚠ ' + mensaje;
                campo.parentNode.appendChild(msj);
            }

            function correcto(campo, mensaje) {
                campo.classList.add('is-valid');
                const msj = document.createElement('div');
                msj.className = 'validacion-correcto text-success mt-1 small';
                msj.textContent = '✓ ' + mensaje;
                campo.parentNode.appendChild(msj);
            }

            // Validaciones (Nombre, DNI, Fecha, Correo, Teléfono, Sexo)
            if (nombre.value.trim() === '') { error(nombre, 'Falta completar el nombre.'); } 
            else if (nombre.value.trim().length < 3) { error(nombre, 'Mínimo 3 caracteres.'); } 
            else { correcto(nombre, 'Correcto.'); }

            if (dni.value.trim() === '') { error(dni, 'Falta completar el DNI.'); } 
            else if (!/^\d{8}$/.test(dni.value.trim())) { error(dni, 'Exactamente 8 números.'); } 
            else { correcto(dni, 'Correcto.'); }

            if (fecha.value === '') { error(fecha, 'Falta la fecha.'); } 
            else { correcto(fecha, 'Correcto.'); }

            if (correo.value.trim() === '') { error(correo, 'Falta el correo.'); } 
            else if (!correo.validity.valid) { error(correo, 'Correo inválido.'); } 
            else { correcto(correo, 'Correcto.'); }

            if (telefono.value.trim() === '') { error(telefono, 'Falta el teléfono.'); } 
            else if (!/^\d{9}$/.test(telefono.value.trim())) { error(telefono, 'Exactamente 9 números.'); } 
            else { correcto(telefono, 'Correcto.'); }

            if (sexo.value === '') { error(sexo, 'Falta el sexo.'); } 
            else { correcto(sexo, 'Correcto.'); }
        });
    }

    // ==========================================================
    // 2. LIMPIAR ERRORES AL ESCRIBIR
    // ==========================================================
    const campos = ['nombrePaciente', 'dniPaciente', 'fechaNacPaciente', 'emailPaciente', 'telPaciente', 'sexoPaciente'];
    
    campos.forEach(function (id) {
        const campo = document.getElementById(id);
        if (!campo) return;

        function limpiar() {
            const errorMsj = campo.parentNode.querySelector('.validacion-error');
            const correctoMsj = campo.parentNode.querySelector('.validacion-correcto');
            if (errorMsj) errorMsj.remove();
            if (correctoMsj) correctoMsj.remove();
            campo.classList.remove('is-invalid', 'is-valid');
        }

        campo.addEventListener('input', limpiar);
        campo.addEventListener('change', limpiar);
    });

    // ==========================================================
    // 3. GUARDAR EN LOCALSTORAGE Y REDIRIGIR AL HACER SUBMIT
    // ==========================================================
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const nuevoPaciente = {
            id: Date.now(),
            nombre: document.getElementById('nombrePaciente')?.value || '',
            dni: document.getElementById('dniPaciente')?.value || '',
            email: document.getElementById('emailPaciente')?.value || '',
            telefono: document.getElementById('telPaciente')?.value || '',
            fechaNacimiento: document.getElementById('fechaNacPaciente')?.value || '',
            sexo: document.getElementById('sexoPaciente')?.value || 'Masculino',
            direccion: document.getElementById('dirPaciente')?.value || ''
        };

        let lista;
        try {
            lista = JSON.parse(localStorage.getItem('pacientes')) || [];
        } catch (error) {
            alert('No se pudieron leer los pacientes guardados. Intenta nuevamente.');
            return;
        }

        const existente = lista.findIndex(function (paciente) {
            return String(paciente.dni) === String(nuevoPaciente.dni);
        });
        if (existente >= 0) {
            if (!esPaciente) {
                alert('Ya existe un paciente registrado con ese DNI. Busca su ficha en el listado.');
                return;
            }
            nuevoPaciente.id = lista[existente].id || nuevoPaciente.id;
            lista[existente] = nuevoPaciente;
        } else {
            if (esPaciente && String(nuevoPaciente.dni) !== String(sesion.dni)) {
                alert('Solo puedes registrar tus propios datos.');
                return;
            }
            lista.push(nuevoPaciente);
        }

        try {
            localStorage.setItem('pacientes', JSON.stringify(lista));
        } catch (error) {
            alert('No se pudieron guardar tus datos en este navegador.');
            return;
        }

        if (solicitudAdminEnEdicion) {
            try {
                const solicitudes = JSON.parse(localStorage.getItem('solicitudesPaciente')) || [];
                const solicitud = solicitudes.find(function (item) {
                    return String(item.id) === String(solicitudAdminEnEdicion.id);
                });
                if (solicitud) {
                    solicitud.estado = 'resuelta';
                    solicitud.resueltaEn = new Date().toISOString();
                    solicitud.resueltaPor = sesion.nombre;
                    localStorage.setItem('solicitudesPaciente', JSON.stringify(solicitudes));
                }
                sessionStorage.removeItem('solicitudPacienteNueva');
            } catch (error) {
                alert('La ficha se guardó, pero no se pudo cerrar la solicitud. Recepción debe revisarla en el panel.');
                return;
            }
        }

        if (esPaciente && campoTelefono) {
            const usuarios = CliniAuth.obtenerUsuarios();
            const usuario = usuarios.find(function (u) {
                return String(u.dni) === String(sesion.dni);
            });
            if (usuario) {
                usuario.phone = campoTelefono.value.trim();
                try {
                    CliniAuth.guardarUsuarios(usuarios);
                } catch (error) {
                    alert('Tus datos de paciente se guardaron, pero no se pudo sincronizar el teléfono de tu cuenta.');
                    return;
                }
            }
        }

        window.location.href = esPaciente ? 'agenda-paciente.html' : 'pacientes.html';
    });

});