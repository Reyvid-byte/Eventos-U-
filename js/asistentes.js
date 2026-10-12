/**
 * EventosU - Administración de asistentes (asistentes.html)
 * Depende de: js/utilidades.js (obtener, guardar) y Bootstrap 5 (Modal, Alert).
 */

const CLAVE_EVENTOS = 'eventos';
const CLAVE_ASISTENTES = 'asistentes';

/* --------------------------------------------------------------------------
   Referencias al DOM
   -------------------------------------------------------------------------- */
const selectEvento = document.getElementById('selectEvento');
const btnExportar = document.getElementById('btnExportar');
const cuerpoTabla = document.getElementById('cuerpoTabla');
const resumenEvento = document.getElementById('resumenEvento');
const contenedorAlertas = document.getElementById('contenedorAlertas');

const modalEliminarEl = document.getElementById('modalEliminar');
const modalEliminar = new bootstrap.Modal(modalEliminarEl);
const nombreEliminar = document.getElementById('nombreEliminar');
const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');

let idAsistenteAEliminar = null;

/* --------------------------------------------------------------------------
   Íconos SVG (estilo Bootstrap Icons)
   -------------------------------------------------------------------------- */
const ICONO_CONFIRMAR = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
    </svg>`;

const ICONO_ELIMINAR = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
    </svg>`;

/* --------------------------------------------------------------------------
   Utilidades
   -------------------------------------------------------------------------- */

/** Escapa texto para insertarlo de forma segura en HTML (previene XSS). */
function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}

/** Convierte 'YYYY-MM-DD' en 'DD/MM/YYYY'. */
function formatearFechaCorta(fechaISO) {
    if (!fechaISO) return 'Por definir';
    const [anio, mes, dia] = fechaISO.split('-');
    return `${dia}/${mes}/${anio}`;
}

/** Muestra una alerta de Bootstrap flotante que se cierra sola. */
function mostrarAlerta(mensaje, tipo = 'success', duracion = 4000) {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show shadow-sm`;
    alerta.setAttribute('role', 'alert');
    alerta.innerHTML = `
        <span class="alerta-texto"></span>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>`;
    alerta.querySelector('.alerta-texto').textContent = mensaje;
    contenedorAlertas.appendChild(alerta);

    setTimeout(() => {
        if (alerta.isConnected) new bootstrap.Alert(alerta).close();
    }, duracion);
}

/** Devuelve el evento actualmente seleccionado (o undefined). */
function obtenerEventoSeleccionado() {
    const id = Number(selectEvento.value);
    return obtener(CLAVE_EVENTOS).find(e => e.id === id);
}

/** Devuelve los asistentes de un evento. */
function obtenerAsistentesDeEvento(eventoId) {
    return obtener(CLAVE_ASISTENTES).filter(a => a.eventoId === eventoId);
}

/* --------------------------------------------------------------------------
   Selector de eventos
   -------------------------------------------------------------------------- */
function llenarSelectEventos() {
    const eventos = obtener(CLAVE_EVENTOS)
        .slice()
        .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));

    if (eventos.length === 0) {
        selectEvento.innerHTML = '<option value="">No hay eventos registrados</option>';
        selectEvento.disabled = true;
        return;
    }

    selectEvento.innerHTML = '<option value="" disabled>Selecciona un evento</option>' +
        eventos.map(e => `
            <option value="${e.id}">${escaparHTML(e.titulo)} (${formatearFechaCorta(e.fecha)})</option>`
        ).join('');

    // Preselecciona el primer evento para mostrar datos de inmediato
    selectEvento.value = String(eventos[0].id);
}

/* --------------------------------------------------------------------------
   Renderizado de la tabla
   -------------------------------------------------------------------------- */
function crearBadgeEstado(estado) {
    const clase = estado === 'Confirmado' ? 'bg-success' : 'bg-warning text-dark';
    return `<span class="badge rounded-pill ${clase}">${escaparHTML(estado)}</span>`;
}

function crearFilaAsistente(asistente) {
    const confirmado = asistente.estado === 'Confirmado';
    return `
        <tr>
            <td class="text-muted small">${asistente.id}</td>
            <td class="celda-nombre">${escaparHTML(asistente.nombre)}</td>
            <td><a href="mailto:${escaparHTML(asistente.email)}">${escaparHTML(asistente.email)}</a></td>
            <td>${crearBadgeEstado(asistente.estado)}</td>
            <td class="text-end text-nowrap">
                <button type="button" class="btn btn-sm btn-outline-success btn-accion" data-accion="confirmar"
                    data-id="${asistente.id}" ${confirmado ? 'disabled' : ''} title="Confirmar asistencia">
                    ${ICONO_CONFIRMAR}<span class="d-none d-md-inline">Confirmar</span>
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger btn-accion" data-accion="eliminar"
                    data-id="${asistente.id}" title="Eliminar inscripción">
                    ${ICONO_ELIMINAR}<span class="d-none d-md-inline">Eliminar</span>
                </button>
            </td>
        </tr>`;
}

function filaMensaje(texto) {
    return `<tr><td colspan="5" class="text-center text-muted py-5">${texto}</td></tr>`;
}

/** Actualiza el resumen de totales del evento. */
function actualizarResumen(evento, asistentes) {
    const confirmados = asistentes.filter(a => a.estado === 'Confirmado').length;
    document.getElementById('resumenTotal').textContent = asistentes.length;
    document.getElementById('resumenConfirmados').textContent = confirmados;
    document.getElementById('resumenPendientes').textContent = asistentes.length - confirmados;
    document.getElementById('resumenCupo').textContent = `${evento.cupoDisponible} de ${evento.cupoMaximo}`;
    resumenEvento.classList.remove('d-none');
}

/** Pinta las filas de asistentes del evento seleccionado. */
function renderizarTabla() {
    const evento = obtenerEventoSeleccionado();

    if (!evento) {
        cuerpoTabla.innerHTML = filaMensaje('Selecciona un evento para ver sus asistentes.');
        resumenEvento.classList.add('d-none');
        btnExportar.disabled = true;
        return;
    }

    const asistentes = obtenerAsistentesDeEvento(evento.id);
    actualizarResumen(evento, asistentes);
    btnExportar.disabled = asistentes.length === 0;

    cuerpoTabla.innerHTML = asistentes.length
        ? asistentes.map(crearFilaAsistente).join('')
        : filaMensaje('Este evento aún no tiene asistentes inscritos.');
}

/* --------------------------------------------------------------------------
   Acciones
   -------------------------------------------------------------------------- */

/** Cambia el estado de un asistente a "Confirmado". */
function confirmarAsistente(idAsistente) {
    const asistentes = obtener(CLAVE_ASISTENTES);
    const asistente = asistentes.find(a => a.id === idAsistente);
    if (!asistente) return;

    asistente.estado = 'Confirmado';
    guardar(CLAVE_ASISTENTES, asistentes);

    renderizarTabla();
    mostrarAlerta(`${asistente.nombre} fue confirmado.`, 'success');
}

/** Abre el modal de confirmación antes de eliminar. */
function solicitarEliminacion(idAsistente) {
    const asistente = obtener(CLAVE_ASISTENTES).find(a => a.id === idAsistente);
    if (!asistente) return;

    idAsistenteAEliminar = idAsistente;
    nombreEliminar.textContent = asistente.nombre;
    modalEliminar.show();
}

/** Elimina el asistente y libera un lugar en el cupo del evento. */
function eliminarAsistente(idAsistente) {
    const asistentes = obtener(CLAVE_ASISTENTES);
    const indice = asistentes.findIndex(a => a.id === idAsistente);
    if (indice === -1) return;

    const [eliminado] = asistentes.splice(indice, 1);
    guardar(CLAVE_ASISTENTES, asistentes);

    // +1 al cupo del evento (sin superar el cupo máximo)
    const eventos = obtener(CLAVE_EVENTOS);
    const evento = eventos.find(e => e.id === eliminado.eventoId);
    if (evento) {
        evento.cupoDisponible = Math.min(Number(evento.cupoDisponible) + 1, Number(evento.cupoMaximo));
        guardar(CLAVE_EVENTOS, eventos);
    }

    renderizarTabla();
    mostrarAlerta(`Se eliminó la inscripción de ${eliminado.nombre}.`, 'danger');
}

/* --------------------------------------------------------------------------
   Exportación a TXT
   -------------------------------------------------------------------------- */

/**
 * Genera y descarga un archivo de texto con los asistentes del evento.
 * @param {Object} evento  Evento seleccionado.
 */
function exportarAsistentesTxt(evento) {
    if (!evento) return;

    const asistentes = obtenerAsistentesDeEvento(evento.id);
    const confirmados = asistentes.filter(a => a.estado === 'Confirmado').length;
    const separador = '='.repeat(96);
    const linea = '-'.repeat(96);
    const ahora = new Date().toLocaleString('es-MX');

    const encabezadoTabla = [
        'N°'.padEnd(4),
        'ID'.padEnd(15),
        'Nombre'.padEnd(28),
        'Email'.padEnd(32),
        'Estado'
    ].join('');

    const filas = asistentes.map((a, i) => [
        String(i + 1).padEnd(4),
        String(a.id).padEnd(15),
        a.nombre.slice(0, 26).padEnd(28),
        a.email.slice(0, 30).padEnd(32),
        a.estado
    ].join(''));

    const contenido = [
        separador,
        '  EventosU - Lista de asistentes',
        separador,
        `Evento     : ${evento.titulo}`,
        `Tipo       : ${evento.tipo}`,
        `Fecha      : ${formatearFechaCorta(evento.fecha)}${evento.hora ? ` ${evento.hora} h` : ''}`,
        `Sede       : ${evento.sede}`,
        `Cupo       : ${evento.cupoDisponible} disponibles de ${evento.cupoMaximo}`,
        `Generado   : ${ahora}`,
        linea,
        `Total: ${asistentes.length}   |   Confirmados: ${confirmados}   |   Pendientes: ${asistentes.length - confirmados}`,
        linea,
        encabezadoTabla,
        linea,
        ...(filas.length ? filas : ['(Sin asistentes registrados)']),
        separador
    ].join('\r\n');

    // BOM UTF-8 para que acentos y ñ se vean bien en cualquier editor
    const blob = new Blob(['\uFEFF' + contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'asistentes_evento.txt';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    mostrarAlerta('Archivo asistentes_evento.txt generado.', 'info');
}

/* --------------------------------------------------------------------------
   Inicialización
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    llenarSelectEventos();
    renderizarTabla();

    selectEvento.addEventListener('change', renderizarTabla);

    // Delegación de eventos para los botones de cada fila
    cuerpoTabla.addEventListener('click', (e) => {
        const boton = e.target.closest('.btn-accion');
        if (!boton || boton.disabled) return;

        const id = Number(boton.dataset.id);
        if (boton.dataset.accion === 'confirmar') confirmarAsistente(id);
        if (boton.dataset.accion === 'eliminar') solicitarEliminacion(id);
    });

    btnConfirmarEliminar.addEventListener('click', () => {
        if (idAsistenteAEliminar !== null) eliminarAsistente(idAsistenteAEliminar);
        idAsistenteAEliminar = null;
        modalEliminar.hide();
    });

    modalEliminarEl.addEventListener('hidden.bs.modal', () => { idAsistenteAEliminar = null; });

    btnExportar.addEventListener('click', () => exportarAsistentesTxt(obtenerEventoSeleccionado()));
});
