document.addEventListener('DOMContentLoaded', function () {

    // ==========================================================
    // 1. GESTIÓN DE PESTAÑAS (Registro / Login)
    // ==========================================================
    var loginTab = document.getElementById('login-tab');
    var registerTab = document.getElementById('register-tab');
    var loginPane = document.getElementById('login-pane');
    var registerPane = document.getElementById('register-pane');
    
    if (loginTab && registerTab && loginPane && registerPane) {
        function showTab(showPane, hidePane, showBtn, hideBtn) {
            hidePane.classList.remove('show', 'active');
            showPane.classList.add('show', 'active');
            hideBtn.classList.remove('active');
            showBtn.classList.add('active');
            showBtn.setAttribute('aria-selected', 'true');
            hideBtn.setAttribute('aria-selected', 'false');
        }
        
        loginTab.addEventListener('click', function (e) {
            e.preventDefault();
            showTab(loginPane, registerPane, loginTab, registerTab);
        });
        
        registerTab.addEventListener('click', function (e) {
            e.preventDefault();
            showTab(registerPane, loginPane, registerTab, loginTab);
        });

        if (document.querySelector('.alert-danger')) {
            showTab(loginPane, registerPane, loginTab, registerTab);
        }
    }

    // Botón "Crear cuenta" del login para ir al registro
    const btnCrearCuenta = document.getElementById("btnCrearCuenta");
    if (btnCrearCuenta && registerTab) {
        btnCrearCuenta.addEventListener("click", function (e) {
            e.preventDefault();
            registerTab.click();
        });
    }

    // ==========================================================
    // 2. MODAL DE DETALLE (Agenda)
    // ==========================================================
    document.querySelectorAll(".view-detail-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            var card = button.closest("article");
            if (!card) return;
            document.getElementById("modalPatient").textContent  = card.dataset.patient  || "";
            document.getElementById("modalService").textContent  = card.dataset.service  || "";
            document.getElementById("modalDoctor").textContent   = card.dataset.doctor   || "";
            document.getElementById("modalSchedule").textContent = card.dataset.schedule || "";
            document.getElementById("modalMode").textContent     = card.dataset.mode     || "";
            document.getElementById("modalNotes").textContent    = card.dataset.notes    || "Sin observaciones registradas.";
            
            var modalEl = document.getElementById("appointmentModal");
            if (modalEl) {
                new bootstrap.Modal(modalEl).show();
            }
        });
    });

    // ==========================================================
    // 3. TEMA OSCURO / CLARO (Dark Mode)
    // ==========================================================
    const htmlElement = document.documentElement;
    const navbarList = document.querySelector('.navbar-nav');
    
    if (navbarList && !document.getElementById('btn-theme-toggle')) {
        navbarList.insertAdjacentHTML('beforeend', '<li class="nav-item theme-nav-item ms-lg-2"><button type="button" id="btn-theme-toggle" class="btn btn-outline-secondary btn-sm" aria-label="Alternar modo oscuro">🌙</button></li>');
    }
    const toggleBtn = document.getElementById('btn-theme-toggle');

    function actualizarBotonTema(theme) {
        if (!toggleBtn) return;
        const modoOscuro = theme === 'dark';
        toggleBtn.textContent = modoOscuro ? '☀️' : '🌙';
        toggleBtn.setAttribute('aria-label', modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
        toggleBtn.title = modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-bs-theme', savedTheme);
    }
    actualizarBotonTema(htmlElement.getAttribute('data-bs-theme') || 'light');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentTheme = htmlElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            htmlElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            actualizarBotonTema(newTheme);
        });
    }

    // ==========================================================
    // 4. VALIDACIÓN DE REGISTRO AL ENVIAR EL FORMULARIO
    // ==========================================================
    const registroForm = document.querySelector('#register-pane form') || document.querySelector('form');
    const nombre = document.getElementById("registerName");
    const dni = document.getElementById("registerDni");
    const correo = document.getElementById("registerEmail");
    const telefono = document.getElementById("registerPhone");
    const password = document.getElementById("registerPassword");
    const confirmar = document.getElementById("registerConfirm");

    if (registroForm) {
        let mensajes = document.getElementById("mensajesValidacion");
        if (!mensajes) {
            mensajes = document.createElement("div");
            mensajes.id = "mensajesValidacion";
            mensajes.className = "mt-3 w-100";
            registroForm.appendChild(mensajes);
        }

        function mostrarMensajeErrorCampo(texto, campo) {
            if (!campo) return;
            let feedback = campo.parentElement.querySelector('.campo-error');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'campo-error small mt-1 text-danger fw-bold';
                campo.parentElement.appendChild(feedback);
            }
            feedback.innerHTML = '<span class="me-1">⚠</span>' + texto;
            campo.classList.add('is-invalid');
            campo.style.borderColor = '#dc3545';
            campo.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.15)';
        }

        function mostrarMensajeCorrectoCampo(campo) {
            if (!campo) return;
            let feedback = campo.parentElement.querySelector('.campo-error');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'campo-error small mt-1';
                campo.parentElement.appendChild(feedback);
            }
            feedback.className = 'campo-error small mt-1 text-success fw-bold';
            feedback.innerHTML = '<span class="me-1">✔</span>Campo completado correctamente';
            campo.classList.add('is-valid');
            campo.style.borderColor = '#198754';
            campo.style.boxShadow = '0 0 0 0.2rem rgba(25, 135, 84, 0.15)';
        }

        function validarRegistro() {
            // Limpiamos mensajes anteriores y estados de error
            mensajes.innerHTML = "";
            [nombre, dni, correo, telefono, password, confirmar].forEach(function (c) {
                if (!c) return;
                c.classList.remove("is-invalid", "is-valid");
                c.style.borderColor = "";
                c.style.boxShadow = "";
                const contenedor = c.parentElement;
                if (contenedor) {
                    const errorViejo = contenedor.querySelector('.campo-error');
                    if (errorViejo) errorViejo.remove();
                }
            });

            let todoCorrecto = true;

            if (!nombre || !dni || !correo || !telefono || !password || !confirmar) {
                return false;
            }

            if (!nombre.value.trim()) {
                mostrarMensajeErrorCampo("Falta completar el nombre completo.", nombre);
                todoCorrecto = false;
            } else if (nombre.value.trim().length < 3) {
                mostrarMensajeErrorCampo("El nombre completo debe tener mínimo 3 caracteres.", nombre);
                todoCorrecto = false;
            } else {
                mostrarMensajeCorrectoCampo(nombre);
            }

            if (!dni.value.trim()) {
                mostrarMensajeErrorCampo("Falta completar el DNI.", dni);
                todoCorrecto = false;
            } else if (!/^[0-9]{8}$/.test(dni.value.trim())) {
                mostrarMensajeErrorCampo("El DNI debe tener exactamente 8 números.", dni);
                todoCorrecto = false;
            } else {
                mostrarMensajeCorrectoCampo(dni);
            }

            if (!correo.value.trim()) {
                mostrarMensajeErrorCampo("Falta completar el correo electrónico.", correo);
                todoCorrecto = false;
            } else if (!correo.checkValidity()) {
                mostrarMensajeErrorCampo("El correo electrónico no tiene un formato válido.", correo);
                todoCorrecto = false;
            } else {
                mostrarMensajeCorrectoCampo(correo);
            }

            if (!telefono.value.trim()) {
                mostrarMensajeErrorCampo("Falta completar el teléfono.", telefono);
                todoCorrecto = false;
            } else if (!/^[0-9]{9}$/.test(telefono.value.trim())) {
                mostrarMensajeErrorCampo("El teléfono debe tener exactamente 9 números.", telefono);
                todoCorrecto = false;
            } else {
                mostrarMensajeCorrectoCampo(telefono);
            }

            if (!password.value) {
                mostrarMensajeErrorCampo("Falta completar la contraseña.", password);
                todoCorrecto = false;
            } else if (password.value.length < 6) {
                mostrarMensajeErrorCampo("La contraseña debe tener mínimo 6 caracteres.", password);
                todoCorrecto = false;
            } else {
                mostrarMensajeCorrectoCampo(password);
            }

            if (!confirmar.value) {
                mostrarMensajeErrorCampo("Falta completar la confirmación de la contraseña.", confirmar);
                todoCorrecto = false;
            } else if (confirmar.value !== password.value) {
                mostrarMensajeErrorCampo("Las contraseñas no coinciden.", confirmar);
                todoCorrecto = false;
            } else {
                mostrarMensajeCorrectoCampo(confirmar);
            }

            // ==================================================
            // REGISTRO REAL EN LOCALSTORAGE (rol PACIENTE)
            // Solo se ejecuta si TODOS los campos son válidos y
            // si permisos.js expuso las utilidades de CliniAuth.
            // ==================================================
            if (todoCorrecto && window.CliniAuth) {
                const usuarios = CliniAuth.obtenerUsuarios();

                const yaExiste = usuarios.some(function (u) {
                    return u.dni === dni.value.trim() ||
                        u.email.trim().toLowerCase() === correo.value.trim().toLowerCase();
                });

                if (yaExiste) {
                    const aviso = document.createElement('div');
                    aviso.className = 'alert alert-danger mt-3 mb-0';
                    aviso.textContent = 'Ya existe una cuenta registrada con ese DNI o correo electrónico.';
                    mensajes.appendChild(aviso);
                    return false;
                }

                const nuevoUsuario = {
                    nombre: nombre.value.trim(),
                    dni: dni.value.trim(),
                    email: correo.value.trim(),
                    phone: telefono.value.trim(),
                    password: password.value,
                    rol: 'PACIENTE'
                };

                usuarios.push(nuevoUsuario);
                CliniAuth.guardarUsuarios(usuarios);
                CliniAuth.guardarSesion(nuevoUsuario);

                const exito = document.createElement('div');
                exito.className = 'alert alert-success mt-3 mb-0';
                exito.textContent = '✔ Cuenta creada correctamente. Ingresando a CliniAgenda...';
                mensajes.appendChild(exito);

                setTimeout(function () {
                    window.location.href = 'regiscita.html';
                }, 900);
            }

            return todoCorrecto;
        }

        registroForm.addEventListener("keydown", function (event) {
            if (event.key !== "Enter" || event.target.tagName !== "INPUT") return;
            event.preventDefault();
            validarRegistro();
        });
    }

    // ==========================================================
    // 5. LOGIN REAL CONTRA LOCALSTORAGE (usuarios)
    // ==========================================================
    const loginForm = document.querySelector('#login-pane form');

    if (loginForm && window.CliniAuth) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const loginEmailEl = document.getElementById('loginEmail');
            const loginPasswordEl = document.getElementById('loginPassword');
            if (!loginEmailEl || !loginPasswordEl) return;

            let mensajesLogin = loginForm.querySelector('#mensajesLoginReal');
            if (!mensajesLogin) {
                mensajesLogin = document.createElement('div');
                mensajesLogin.id = 'mensajesLoginReal';
                mensajesLogin.className = 'mt-3';
                loginForm.appendChild(mensajesLogin);
            }
            mensajesLogin.innerHTML = '';

            if (!loginEmailEl.value.trim() || !loginPasswordEl.value) {
                mensajesLogin.innerHTML =
                    '<div class="alert alert-danger mb-0">Completa el correo y la contraseña para ingresar.</div>';
                return;
            }

            const usuarios = CliniAuth.obtenerUsuarios();
            const identificador = loginEmailEl.value.trim().toLowerCase();
            const encontrado = usuarios.find(function (u) {
                const email = String(u.email || '').trim().toLowerCase();
                const usuario = String(u.usuario || '').trim().toLowerCase();
                const dni = String(u.dni || '').trim().toLowerCase();
                return (email === identificador || usuario === identificador || dni === identificador) &&
                    u.password === loginPasswordEl.value;
            });

            if (!encontrado) {
                mensajesLogin.innerHTML =
                    '<div class="alert alert-danger mb-0">Correo o contraseña incorrectos.</div>';
                return;
            }

            CliniAuth.guardarSesion(encontrado);

            mensajesLogin.innerHTML =
                '<div class="alert alert-success mb-0">✔ Bienvenido(a), ' + encontrado.nombre + '. Ingresando...</div>';

            const paginasPorRol = {
                ADMIN: 'agenda.html',
                MEDICO: 'agenda-medico.html',
                PACIENTE: 'regiscita.html'
            };
            let paginaDestino = paginasPorRol[encontrado.rol] || 'index.html';
            setTimeout(function () {
                window.location.href = paginaDestino;
            }, 700);
        });
    }

});