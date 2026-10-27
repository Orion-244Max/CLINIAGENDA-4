/**
 * app.js — Versión Spring Boot + Thymeleaf
 *
 * El renderizado de la agenda y la validación de formularios
 * ahora los maneja el servidor (PacienteController / UsuarioController).
 *
 * Este archivo solo maneja lógica de UI:
 *   1. Abrir el modal con los datos de la cita seleccionada
 *   2. Limpiar alertas al escribir en los campos
 */

// ─── 1. MODAL DE DETALLE ────────────────────────────────────────────────────
// Cada article.agenda-item tiene atributos data-* puestos por Thymeleaf.
// Al hacer clic en "Ver detalle", leemos esos datos y los mostramos en el modal.

document.querySelectorAll(".view-detail-btn").forEach(function (button) {
  button.addEventListener("click", function () {
    var card = button.closest("article");

    if (!card) return;

    // Leer los data-* que Thymeleaf escribió en el article
    document.getElementById("modalPatient").textContent  = card.dataset.patient  || "";
    document.getElementById("modalService").textContent  = card.dataset.service  || "";
    document.getElementById("modalDoctor").textContent   = card.dataset.doctor   || "";
    document.getElementById("modalSchedule").textContent = card.dataset.schedule || "";
    document.getElementById("modalMode").textContent     = card.dataset.mode     || "";
    document.getElementById("modalNotes").textContent    = card.dataset.notes    || "Sin observaciones registradas.";

    // Abrir el modal de Bootstrap
    var modalEl = document.getElementById("appointmentModal");
    if (modalEl) {
      new bootstrap.Modal(modalEl).show();
    }
  });
});

// ─── 2. LIMPIAR ALERTAS AL ESCRIBIR ─────────────────────────────────────────
// Oculta los mensajes de error/éxito cuando el usuario empieza a corregir.
// (Los mensajes de error del servidor se muestran solo al cargar la página.)

document.querySelectorAll("input, select, textarea").forEach(function (el) {
  ["input", "change"].forEach(function (event) {
    el.addEventListener(event, function () {
      document.querySelectorAll(".alert:not(.d-none)").forEach(function (alert) {
        // Solo ocultamos alertas de error, no las de éxito (flash messages)
        if (alert.classList.contains("alert-danger")) {
          alert.classList.add("d-none");
        }
      });
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const htmlElement = document.documentElement;
  const navbarList = document.querySelector('.navbar-nav');

  // 1. Crear e inyectar el botón dinámicamente si existe el menú
  if (navbarList && !document.getElementById('btn-theme-toggle')) {
    navbarList.insertAdjacentHTML('beforeend', `
      <li class="nav-item theme-nav-item ms-lg-2">
        <button type="button" id="btn-theme-toggle" class="btn btn-outline-secondary btn-sm" aria-label="Alternar modo oscuro">
          🌙
        </button>
      </li>
    `);
  }

  const toggleBtn = document.getElementById('btn-theme-toggle');

    function actualizarBotonTema(theme) {
        if (!toggleBtn) return;
        const modoOscuro = theme === 'dark';
        toggleBtn.textContent = modoOscuro ? '☀️' : '🌙';
        toggleBtn.setAttribute('aria-label', modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
        toggleBtn.title = modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    }

  // 2. Aplicar tema guardado previamente
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    htmlElement.setAttribute('data-bs-theme', savedTheme);
  }
    actualizarBotonTema(htmlElement.getAttribute('data-bs-theme') || 'light');

  // 3. Evento para alternar el tema
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
});


document.addEventListener("DOMContentLoaded", function () {

    // ==========================================================
    // ELEMENTOS DEL REGISTRO
    // ==========================================================

    const registroForm = document.querySelector(
        'form[action*="/registro"]'
    );

    const nombre = document.getElementById("registerName");
    const dni = document.getElementById("registerDni");
    const correo = document.getElementById("registerEmail");
    const telefono = document.getElementById("registerPhone");
    const password = document.getElementById("registerPassword");
    const confirmar = document.getElementById("registerConfirm");


    // ==========================================================
    // ELEMENTOS DEL LOGIN
    // ==========================================================

    const loginForm = document.querySelector(
        'form[action*="/api/auth/login"]'
    );

    const loginCorreo = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");


    // ==========================================================
    // BOTÓN VALIDAR DEL REGISTRO
    // ==========================================================

    if (registroForm) {

        // Crear botón Validar sin cambiar el tamaño del formulario
        const botonRegistrar = registroForm.querySelector(
            'button[type="submit"]'
        );

        if (botonRegistrar) {

            const botonValidar = document.createElement("button");

            botonValidar.type = "button";
            botonValidar.id = "btnValidar";
            botonValidar.className = "btn btn-outline-primary mt-4 me-2";
            botonValidar.textContent = "Confirmar registro";

            botonRegistrar.parentNode.insertBefore(
                botonValidar,
                botonRegistrar
            );


            // Contenedor de mensajes
            const mensajes = document.createElement("div");
            mensajes.id = "mensajesValidacion";
            mensajes.className = "mt-3";

            botonRegistrar.parentNode.insertBefore(
                mensajes,
                botonRegistrar
            );


            // ==================================================
            // FUNCIÓN PARA MOSTRAR MENSAJES
            // ==================================================

            function mostrarMensaje(texto, correcto = false) {

                const mensaje = document.createElement("div");

                mensaje.className = correcto
                    ? "text-success small mt-1"
                    : "text-danger small mt-1";

                mensaje.textContent = correcto
                    ? "✓ " + texto
                    : "⚠ " + texto;

                mensajes.appendChild(mensaje);
            }


            // ==================================================
            // FUNCIÓN PARA VALIDAR EL REGISTRO
            // ==================================================

            function validarRegistro() {

                // Limpiar mensajes anteriores.
                // Esto evita que aparezcan repetidos.
                mensajes.innerHTML = "";

                let todoCorrecto = true;


                // ----------------------------------------------
                // NOMBRE
                // ----------------------------------------------

                if (!nombre.value.trim()) {

                    mostrarMensaje(
                        "Falta completar el nombre completo."
                    );

                    todoCorrecto = false;

                } else if (nombre.value.trim().length < 3) {

                    mostrarMensaje(
                        "El nombre completo debe tener mínimo 3 caracteres."
                    );

                    todoCorrecto = false;

                } else {

                    mostrarMensaje(
                        "Nombre completo correcto.",
                        true
                    );
                }


                // ----------------------------------------------
                // DNI
                // ----------------------------------------------

                if (!dni.value.trim()) {

                    mostrarMensaje(
                        "Falta completar el DNI."
                    );

                    todoCorrecto = false;

                } else if (!/^[0-9]{8}$/.test(dni.value.trim())) {

                    mostrarMensaje(
                        "El DNI debe tener exactamente 8 números."
                    );

                    todoCorrecto = false;

                } else {

                    mostrarMensaje(
                        "DNI correcto.",
                        true
                    );
                }


                // ----------------------------------------------
                // CORREO
                // ----------------------------------------------

                if (!correo.value.trim()) {

                    mostrarMensaje(
                        "Falta completar el correo electrónico."
                    );

                    todoCorrecto = false;

                } else if (!correo.validity.valid) {

                    mostrarMensaje(
                        "El correo electrónico no tiene un formato válido."
                    );

                    todoCorrecto = false;

                } else {

                    mostrarMensaje(
                        "Correo electrónico correcto.",
                        true
                    );
                }


                // ----------------------------------------------
                // TELÉFONO
                // ----------------------------------------------

                if (!telefono.value.trim()) {

                    mostrarMensaje(
                        "Falta completar el teléfono."
                    );

                    todoCorrecto = false;

                } else if (!/^[0-9]{9}$/.test(telefono.value.trim())) {

                    mostrarMensaje(
                        "El teléfono debe tener exactamente 9 números."
                    );

                    todoCorrecto = false;

                } else {

                    mostrarMensaje(
                        "Teléfono correcto.",
                        true
                    );
                }


                // ----------------------------------------------
                // CONTRASEÑA
                // ----------------------------------------------

                if (!password.value) {

                    mostrarMensaje(
                        "Falta completar la contraseña."
                    );

                    todoCorrecto = false;

                } else if (password.value.length < 6) {

                    mostrarMensaje(
                        "La contraseña debe tener mínimo 6 caracteres."
                    );

                    todoCorrecto = false;

                } else {

                    mostrarMensaje(
                        "Contraseña correcta.",
                        true
                    );
                }


                // ----------------------------------------------
                // CONFIRMAR CONTRASEÑA
                // ----------------------------------------------

                if (!confirmar.value) {

                    mostrarMensaje(
                        "Falta confirmar la contraseña."
                    );

                    todoCorrecto = false;

                } else if (confirmar.value !== password.value) {

                    mostrarMensaje(
                        "Las contraseñas no coinciden."
                    );

                    todoCorrecto = false;

                } else {

                    mostrarMensaje(
                        "Confirmación de contraseña correcta.",
                        true
                    );
                }


                // ----------------------------------------------
                // RESULTADO FINAL
                // ----------------------------------------------

                if (todoCorrecto) {

                    const correcto = document.createElement("div");

                    correcto.className =
                        "alert alert-success mt-3";

                    correcto.textContent =
                        "✓ Todos los datos del registro son correctos.";

                    mensajes.appendChild(correcto);
                }
            }


            // ==================================================
            // EVENTO DEL BOTÓN VALIDAR
            // ==================================================

            botonValidar.addEventListener(
                "click",
                validarRegistro
            );
        }
    }


    // ==========================================================
    // LOGIN
    // ==========================================================

    if (loginForm) {

        const botonLogin = loginForm.querySelector(
            'button[type="submit"]'
        );

        if (botonLogin) {

            const botonValidarLogin = document.createElement("button");

            botonValidarLogin.type = "button";
            botonValidarLogin.id = "btnValidarLogin";
            botonValidarLogin.className =
                "btn btn-outline-primary mt-4 me-2";

            botonValidarLogin.textContent = "Confirmar registro";

            botonLogin.parentNode.insertBefore(
                botonValidarLogin,
                botonLogin
            );


            const mensajesLogin = document.createElement("div");

            mensajesLogin.id = "mensajesLogin";
            mensajesLogin.className = "mt-3";

            botonLogin.parentNode.insertBefore(
                mensajesLogin,
                botonLogin
            );


            // ==================================================
            // VALIDAR LOGIN
            // ==================================================

            botonValidarLogin.addEventListener(
                "click",
                function () {

                    // Evita mensajes repetidos
                    mensajesLogin.innerHTML = "";

                    let loginCorrecto = true;


                    // ------------------------------------------
                    // CORREO
                    // ------------------------------------------

                    if (!loginCorreo.value.trim()) {

                        const mensaje = document.createElement("div");

                        mensaje.className =
                            "text-danger small mt-1";

                        mensaje.textContent =
                            "⚠ Falta completar el correo electrónico.";

                        mensajesLogin.appendChild(mensaje);

                        loginCorrecto = false;

                    } else if (!loginCorreo.validity.valid) {

                        const mensaje = document.createElement("div");

                        mensaje.className =
                            "text-danger small mt-1";

                        mensaje.textContent =
                            "⚠ El correo electrónico no tiene un formato válido.";

                        mensajesLogin.appendChild(mensaje);

                        loginCorrecto = false;

                    } else {

                        const mensaje = document.createElement("div");

                        mensaje.className =
                            "text-success small mt-1";

                        mensaje.textContent =
                            "✓ Correo electrónico correcto.";

                        mensajesLogin.appendChild(mensaje);
                    }


                    // ------------------------------------------
                    // CONTRASEÑA
                    // ------------------------------------------

                    if (!loginPassword.value) {

                        const mensaje = document.createElement("div");

                        mensaje.className =
                            "text-danger small mt-1";

                        mensaje.textContent =
                            "⚠ Falta completar la contraseña.";

                        mensajesLogin.appendChild(mensaje);

                        loginCorrecto = false;

                    } else {

                        const mensaje = document.createElement("div");

                        mensaje.className =
                            "text-success small mt-1";

                        mensaje.textContent =
                            "✓ Contraseña correcta.";

                        mensajesLogin.appendChild(mensaje);
                    }


                    // ------------------------------------------
                    // RESULTADO LOGIN
                    // ------------------------------------------

                    if (loginCorrecto) {

                        const correcto = document.createElement("div");

                        correcto.className =
                            "alert alert-success mt-3";

                        correcto.textContent =
                            "✓ Los datos de acceso están completos.";

                        mensajesLogin.appendChild(correcto);
                    }
                }
            );
        }
    }


    // ==========================================================
    // CONTROLAR DNI: SOLO NÚMEROS Y MÁXIMO 8
    // ==========================================================

    if (dni) {

        dni.addEventListener("input", function () {

            this.value = this.value
                .replace(/[^0-9]/g, "")
                .slice(0, 8);
        });
    }


    // ==========================================================
    // CONTROLAR TELÉFONO: SOLO NÚMEROS Y MÁXIMO 9
    // ==========================================================

    if (telefono) {

        telefono.addEventListener("input", function () {

            this.value = this.value
                .replace(/[^0-9]/g, "")
                .slice(0, 9);
        });
    }


    // ==========================================================
    // QUITAR MENSAJES ANTIGUOS CUANDO EL USUARIO CORRIGE
    // ==========================================================

    function limpiarMensajesAlEscribir(campo, contenedor) {

        if (!campo || !contenedor) return;

        campo.addEventListener("input", function () {

            // Si el usuario empieza a corregir,
            // se eliminan los mensajes anteriores.
            contenedor.innerHTML = "";
        });
    }


    const mensajesRegistro =
        document.getElementById("mensajesValidacion");

    limpiarMensajesAlEscribir(nombre, mensajesRegistro);
    limpiarMensajesAlEscribir(dni, mensajesRegistro);
    limpiarMensajesAlEscribir(correo, mensajesRegistro);
    limpiarMensajesAlEscribir(telefono, mensajesRegistro);
    limpiarMensajesAlEscribir(password, mensajesRegistro);
    limpiarMensajesAlEscribir(confirmar, mensajesRegistro);


    const mensajesDelLogin =
        document.getElementById("mensajesLogin");

    limpiarMensajesAlEscribir(
        loginCorreo,
        mensajesDelLogin
    );

    limpiarMensajesAlEscribir(
        loginPassword,
        mensajesDelLogin
    );

});


document.addEventListener('DOMContentLoaded', function () {
    var loginTab = document.getElementById('login-tab');
    var registerTab = document.getElementById('register-tab');
    var loginPane = document.getElementById('login-pane');
    var registerPane = document.getElementById('register-pane');
    if (!loginTab || !registerTab) return;

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

    // Si hay error del servidor, mostrar tab login
    if (document.querySelector('.alert-danger')) {
        showTab(loginPane, registerPane, loginTab, registerTab);
    }
});



const btnCrearCuenta = document.getElementById("btnCrearCuenta");
const registerTab = document.getElementById("register-tab");

if (btnCrearCuenta && registerTab) {
    btnCrearCuenta.addEventListener("click", function () {
        registerTab.click();
    });
}


document.addEventListener('DOMContentLoaded', function () {
  const formLogin = document.getElementById('formLogin');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const mensajeError = document.getElementById('mensajeErrorLogin');

  if (formLogin) {
    formLogin.addEventListener('submit', function (e) {
      // Verifica si alguno de los campos está vacío
      if (!loginEmail.value.trim() || !loginPassword.value.trim()) {
        e.preventDefault(); // Detiene el envío del formulario
        mensajeError.classList.remove('d-none'); // Muestra el mensaje
      } else {
        mensajeError.classList.add('d-none'); // Oculta si ya están llenos
      }
    });
  }
});
