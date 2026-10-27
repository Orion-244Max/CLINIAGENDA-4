# CLINIAGENDA-3

## Flujo por rol

- **Paciente:** crea una cuenta con nombre, DNI, correo y teléfono; solicita citas para sí mismo y puede registrar más de una. No consulta la agenda ni edita su expediente desde estas pantallas.
- **Recepción/administrador:** registra pacientes y citas, revisa las solicitudes de pacientes, confirma, modifica o cancela citas y consulta la agenda general. Las citas creadas directamente por recepción quedan confirmadas; una modificación vuelve la cita al estado «Por confirmar».
- **Médico:** consulta únicamente sus citas del día, ordenadas por hora, y revisa los datos de contacto disponibles del paciente. No reserva, edita ni cambia el estado de las citas.
- **Estados de una cita:** la solicitud del paciente queda «Por confirmar»; recepción la confirma o cancela. Después de la consulta, recepción registra si fue atendida. Un cambio de horario devuelve la cita a «Por confirmar».

Esta carpeta contiene únicamente páginas HTML, CSS y JavaScript. Los datos y las restricciones que se ejecutan aquí usan `localStorage` y JavaScript del navegador; no son controles de seguridad del servidor ni evitan colisiones simultáneas. Para cumplir la autorización y la validación obligatorias en Java, se necesita el proyecto backend con sus controladores, modelos, repositorios y `build.gradle`.