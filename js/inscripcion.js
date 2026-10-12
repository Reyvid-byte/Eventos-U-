/**
 * EventosU - Lógica de negocio de inscripciones (index.html)
 * Depende de: js/utilidades.js (obtener, guardar), js/eventos.js
 * (CLAVE_EVENTOS, CLAVE_ASISTENTES, eventos, contenedorEventos, aplicarFiltros)
 * y Bootstrap 5 (Modal, Alert).
 */

/* --------------------------------------------------------------------------
   Referencias al DOM
   -------------------------------------------------------------------------- */
const modalInscripcionEl = document.getElementById('modalInscripcion');
const modalInscripcion = new bootstrap.Modal(modalInscripcionEl);
const formInscripcion = document.getElementById('formInscripcion');
const inputEventoId = document.getElementById('inscripcionEventoId');
const inputNombre = document.getElementById('inscripcionNombre');
const inputEmail = document.getElementById('inscripcionEmail');
const inputTelefono = document.getElementById('inscripcionTelefono');
const textoEventoModal = document.getElementById('modalEventoNombre');
const contenedorAlertas = document.getElementById('contenedorAlertas');
const alertaModal = document.getElementById('alertaModal');

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const REGEX_TELEFONO = /^\d{10}$/;

/* --------------------------------------------------------------------------
   Alertas de Bootstrap (sustituyen a alert() nativo)
   -------------------------------------------------------------------------- */

/**
 * Muestra una alerta de Bootstrap descartable.
 * @param {string} mensaje  Texto a mostrar.
 * @param {'success'|'danger'|'warning'|'info'} tipo  Variante de color.
 * @param {HTMLElement} destino  Contenedor donde se inserta (global o del modal).
 * @param {number} duracion  Milisegundos antes de cerrarse sola (0 = no se cierra).
 */
function mostrarAlerta(mensaje, tipo = 'info', destino = contenedorAlertas, duracion = 4000) {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show shadow-sm`;
    alerta.setAttribute('role', 'alert');
    alerta.innerHTML = `
        <span class="alerta-texto"></span>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>`;
    alerta.querySelector('.alerta-texto').textContent = mensaje;

    destino.appendChild(alerta);

    if (duracion > 0) {
        setTimeout(() => {
            if (alerta.isConnected) new bootstrap.Alert(alerta).close();
        }, duracion);
    }
}

/** Elimina las alertas visibles dentro del modal. */
function limpiarAlertasModal() {
    alertaModal.innerHTML = '';
}

/* --------------------------------------------------------------------------
   Acceso a datos
   -------------------------------------------------------------------------- */

/** Obtiene la versión más reciente del evento desde localStorage. */
function buscarEventoGuardado(eventoId) {
    return obtener(CLAVE_EVENTOS).find(e => e.id === eventoId);
}

/** Indica si ya existe una inscripción con ese email para ese evento. */
function existeInscripcion(email, eventoId) {
    const emailNormalizado = email.trim().toLowerCase();
    return obtener(CLAVE_ASISTENTES).some(a =>
        a.eventoId === eventoId && a.email.toLowerCase() === emailNormalizado
    );
}

/* --------------------------------------------------------------------------
   Apertura del modal
   -------------------------------------------------------------------------- */
function abrirModalInscripcion(eventoId) {
    const evento = buscarEventoGuardado(eventoId);
    if (!evento) {
        mostrarAlerta('El evento seleccionado ya no existe.', 'danger');
        return;
    }

    // Validación 1: cupo disponible
    if (Number(evento.cupoDisponible) <= 0) {
        mostrarAlerta(`Cupo lleno: "${evento.titulo}" ya no tiene lugares disponibles.`, 'warning');
        return;
    }

    formInscripcion.reset();
    formInscripcion.classList.remove('was-validated');
    [inputNombre, inputEmail, inputTelefono].forEach(i => i.setCustomValidity(''));
    limpiarAlertasModal();

    inputEventoId.value = evento.id;
    textoEventoModal.textContent = evento.titulo;

    modalInscripcion.show();
}

/* --------------------------------------------------------------------------
   Validación del formulario
   -------------------------------------------------------------------------- */

/** Valida los campos y marca los inválidos. Devuelve true si todo es correcto. */
function validarFormulario() {
    inputNombre.setCustomValidity(inputNombre.value.trim().length >= 3 ? '' : 'Nombre inválido');
    inputEmail.setCustomValidity(REGEX_EMAIL.test(inputEmail.value.trim()) ? '' : 'Email inválido');
    inputTelefono.setCustomValidity(REGEX_TELEFONO.test(inputTelefono.value.trim()) ? '' : 'Teléfono inválido');

    formInscripcion.classList.add('was-validated');
    return formInscripcion.checkValidity();
}

/* --------------------------------------------------------------------------
   Registro de la inscripción
   -------------------------------------------------------------------------- */
function procesarInscripcion(e) {
    e.preventDefault();
    limpiarAlertasModal();

    const eventoId = Number(inputEventoId.value);
    const nombre = inputNombre.value.trim();
    const email = inputEmail.value.trim().toLowerCase();
    const telefono = inputTelefono.value.trim();

    // Validación de formato (nombre, email, teléfono)
    if (!validarFormulario()) {
        mostrarAlerta('Revisa los campos marcados en rojo.', 'danger', alertaModal, 0);
        return;
    }

    // Validación 1 (de nuevo): el cupo pudo agotarse mientras el modal estaba abierto
    const listaEventos = obtener(CLAVE_EVENTOS);
    const evento = listaEventos.find(ev => ev.id === eventoId);
    if (!evento || Number(evento.cupoDisponible) <= 0) {
        mostrarAlerta('Cupo lleno: este evento ya no tiene lugares disponibles.', 'warning', alertaModal, 0);
        return;
    }

    // Validación 3: inscripción duplicada (mismo email + mismo evento)
    if (existeInscripcion(email, eventoId)) {
        inputEmail.setCustomValidity('Duplicado');
        mostrarAlerta('Este correo ya está inscrito en este evento.', 'danger', alertaModal, 0);
        return;
    }

    // Guardado del asistente
    const asistente = {
        id: Date.now(),
        eventoId,
        nombre,
        email,
        telefono,
        estado: 'Pendiente'
    };
    const asistentes = obtener(CLAVE_ASISTENTES);
    asistentes.push(asistente);
    guardar(CLAVE_ASISTENTES, asistentes);

    // Actualización del cupo en localStorage
    evento.cupoDisponible = Number(evento.cupoDisponible) - 1;
    guardar(CLAVE_EVENTOS, listaEventos);

    // Sincroniza el arreglo en memoria y re-renderiza respetando los filtros activos
    const eventoEnMemoria = eventos.find(ev => ev.id === eventoId);
    if (eventoEnMemoria) eventoEnMemoria.cupoDisponible = evento.cupoDisponible;
    aplicarFiltros();

    modalInscripcion.hide();
    mostrarAlerta(`¡Listo, ${nombre}! Tu inscripción a "${evento.titulo}" quedó registrada con estado Pendiente.`, 'success');
}

/* --------------------------------------------------------------------------
   Eventos
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    // Delegación: un solo listener para todos los botones "Inscribirme"
    contenedorEventos.addEventListener('click', (e) => {
        const boton = e.target.closest('.btn-inscribirme');
        if (boton) abrirModalInscripcion(Number(boton.dataset.id));
    });

    formInscripcion.addEventListener('submit', procesarInscripcion);

    // Al corregir el email, se limpia la marca de duplicado
    inputEmail.addEventListener('input', () => inputEmail.setCustomValidity(''));

    // Solo dígitos en el teléfono
    inputTelefono.addEventListener('input', () => {
        inputTelefono.value = inputTelefono.value.replace(/\D/g, '').slice(0, 10);
    });

    // Enfoca el primer campo al abrir el modal
    modalInscripcionEl.addEventListener('shown.bs.modal', () => inputNombre.focus());
});
