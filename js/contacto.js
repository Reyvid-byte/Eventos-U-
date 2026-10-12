/**
 * contacto.js - Lógica y validación del formulario de contacto para EventosU
 */
document.addEventListener('DOMContentLoaded', () => {
    const formContacto = document.getElementById('formContacto');
    const alertaContacto = document.getElementById('alertaContacto');
    const mensajeTextarea = document.getElementById('contactoMensaje');
    const contadorMensaje = document.getElementById('contadorMensaje');

    // Contador en tiempo real para el mensaje (0/500)
    if (mensajeTextarea && contadorMensaje) {
        mensajeTextarea.addEventListener('input', () => {
            const longitud = mensajeTextarea.value.length;
            contadorMensaje.textContent = `${longitud}/500`;
        });
    }

    // Limpiar alertas y reiniciar contador con el botón Limpiar
    if (formContacto) {
        formContacto.addEventListener('reset', () => {
            formContacto.classList.remove('was-validated');
            if (contadorMensaje) contadorMensaje.textContent = '0/500';
            if (alertaContacto) alertaContacto.innerHTML = '';
        });

        // Envío del formulario
        formContacto.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validación con Bootstrap
            if (!formContacto.checkValidity()) {
                e.stopPropagation();
                formContacto.classList.add('was-validated');
                mostrarAlerta('Por favor, completa correctamente los campos obligatorios antes de enviar.', 'danger');
                return;
            }

            // Extracción de datos
            const nombre = document.getElementById('contactoNombre').value.trim();
            const email = document.getElementById('contactoEmail').value.trim();
            const asunto = document.getElementById('contactoAsunto').value;
            const telefono = document.getElementById('contactoTelefono').value.trim();
            const mensaje = document.getElementById('contactoMensaje').value.trim();

            // Guardar en localStorage
            const nuevoMensaje = {
                id: Date.now(),
                nombre,
                email,
                asunto,
                telefono,
                mensaje,
                fecha: new Date().toLocaleString()
            };

            const mensajesGuardados = JSON.parse(localStorage.getItem('mensajesContacto') || '[]');
            mensajesGuardados.push(nuevoMensaje);
            localStorage.setItem('mensajesContacto', JSON.stringify(mensajesGuardados));

            // Resetear formulario ANTES de pintar el mensaje de éxito
            formContacto.reset();
            formContacto.classList.remove('was-validated');
            if (contadorMensaje) contadorMensaje.textContent = '0/500';

            // Mostrar feedback positivo usando tu función existente
            mostrarAlerta(`¡Mensaje enviado! Gracias, ${nombre}. Te responderemos a la brevedad.`, 'success');
        });
    }

    /**
     * Muestra alertas en pantalla con soporte accesible
     */
    function mostrarAlerta(mensaje, tipo = 'success') {
        if (!alertaContacto) return;

        const icono = tipo === 'success'
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-check-circle-fill me-2" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-exclamation-triangle-fill me-2" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>`;

        alertaContacto.innerHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show d-flex align-items-center mb-3" role="alert">
                ${icono}
                <div>${mensaje}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
            </div>
        `;

        alertaContacto.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});