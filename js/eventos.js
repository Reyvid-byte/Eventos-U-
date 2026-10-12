/**
 * EventosU - Lógica de eventos
 *  - index.html:   renderizado y filtrado del catálogo.
 *  - eventos.html: creación de eventos (formulario).
 * Cada bloque se inicializa solo si sus elementos existen en la página.
 * Depende de: js/utilidades.js (obtener, guardar).
 * La lógica de inscripción (modal, validaciones y guardado) vive en js/inscripcion.js.
 */

const CLAVE_EVENTOS = 'eventos';
const CLAVE_ASISTENTES = 'asistentes';

/* --------------------------------------------------------------------------
   Datos de prueba (se inyectan solo si no hay eventos guardados)
   -------------------------------------------------------------------------- */
const EVENTOS_PRUEBA = [
    {
        id: 1,
        titulo: 'Inteligencia Artificial en la Educación Superior',
        descripcion: 'Conferencia magistral sobre el impacto de la IA generativa en la enseñanza universitaria.',
        tipo: 'Conferencia',
        fecha: '2026-10-22',
        hora: '10:00',
        sede: 'Auditorio Principal',
        cupoMaximo: 120,
        cupoDisponible: 120
    },
    {
        id: 2,
        titulo: 'Desarrollo Web Responsivo con Bootstrap 5',
        descripcion: 'Taller práctico para construir interfaces modernas y accesibles desde cero.',
        tipo: 'Taller',
        fecha: '2026-11-10',
        hora: '16:00',
        sede: 'Laboratorio de Cómputo 3',
        cupoMaximo: 25,
        cupoDisponible: 25
    }
];

/* --------------------------------------------------------------------------
   Referencias al DOM
   -------------------------------------------------------------------------- */
const contenedorEventos = document.getElementById('contenedorEventos');
const contadorResultados = document.getElementById('contadorResultados');
const inputBusqueda = document.getElementById('busqueda');
const selectTipo = document.getElementById('filtroTipo');
const inputFecha = document.getElementById('filtroFecha');
const btnLimpiar = document.getElementById('btnLimpiar');

let eventos = [];

/* --------------------------------------------------------------------------
   Utilidades de presentación
   -------------------------------------------------------------------------- */

/** Escapa texto para insertarlo de forma segura en HTML (previene XSS). */
function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}

/** Convierte 'YYYY-MM-DD' en fecha legible en español sin desfase de zona horaria. */
function formatearFecha(fechaISO) {
    if (!fechaISO) return 'Por definir';
    const [anio, mes, dia] = fechaISO.split('-').map(Number);
    return new Date(anio, mes - 1, dia).toLocaleDateString('es-MX', {
        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
    });
}

/** Devuelve los lugares disponibles de un evento (nunca negativo). */
function obtenerCupoDisponible(evento) {
    return Math.max(Number(evento.cupoDisponible) || 0, 0);
}

/** Devuelve la clase y el texto del badge según el cupo restante. */
function obtenerBadgeCupo(restante, total) {
    if (restante === 0) return { clase: 'badge-cupo-agotado', texto: 'Agotado' };
    if (restante <= Math.max(5, total * 0.2)) return { clase: 'badge-cupo-bajo', texto: `¡Últimos ${restante}!` };
    return { clase: 'badge-cupo-ok', texto: `${restante} lugares` };
}

/* --------------------------------------------------------------------------
   Renderizado
   -------------------------------------------------------------------------- */

/** Construye el HTML de una card de evento. */
function crearCardEvento(evento) {
    const restante = obtenerCupoDisponible(evento);
    const badge = obtenerBadgeCupo(restante, Number(evento.cupoMaximo));
    const agotado = restante === 0;

    return `
        <div class="col-12 col-md-6 col-xl-4">
            <article class="card card-evento h-100" data-tipo="${escaparHTML(evento.tipo)}">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
                        <span class="etiqueta-tipo">${escaparHTML(evento.tipo)}</span>
                        <span class="badge badge-cupo ${badge.clase}">${badge.texto}</span>
                    </div>

                    <h3 class="card-evento-titulo">${escaparHTML(evento.titulo)}</h3>

                    <ul class="card-evento-datos list-unstyled">
                        <li>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar-event" viewBox="0 0 16 16" aria-hidden="true">
                                <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
                                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                            </svg>
                            <span>${formatearFecha(evento.fecha)}${evento.hora ? ` · ${escaparHTML(evento.hora)} h` : ''}</span>
                        </li>
                        <li>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt" viewBox="0 0 16 16" aria-hidden="true">
                                <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/>
                                <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                            </svg>
                            <span>${escaparHTML(evento.sede)}</span>
                        </li>
                    </ul>

                    ${evento.descripcion ? `<p class="card-evento-descripcion">${escaparHTML(evento.descripcion)}</p>` : ''}

                    <button type="button" class="btn ${agotado ? 'btn-secondary' : 'btn-primario'} w-100 mt-auto btn-inscribirme"
                        data-id="${evento.id}" ${agotado ? 'aria-disabled="true"' : ''}>
                        ${agotado ? 'Cupo lleno' : 'Inscribirme'}
                    </button>
                </div>
            </article>
        </div>`;
}

/** Pinta en el DOM el arreglo de eventos recibido. */
function renderizarEventos(lista) {
    contadorResultados.textContent = `${lista.length} ${lista.length === 1 ? 'evento' : 'eventos'}`;

    if (lista.length === 0) {
        contenedorEventos.innerHTML = `
            <div class="col-12">
                <div class="estado-vacio">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-calendar-x" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M6.146 7.146a.5.5 0 0 1 .708 0L8 8.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 9l1.147 1.146a.5.5 0 0 1-.708.708L8 9.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 9 6.146 7.854a.5.5 0 0 1 0-.708z"/>
                        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                    </svg>
                    <p class="mb-0">No se encontraron eventos con los filtros seleccionados.</p>
                </div>
            </div>`;
        return;
    }

    contenedorEventos.innerHTML = lista.map(crearCardEvento).join('');
}

/* --------------------------------------------------------------------------
   Filtrado
   -------------------------------------------------------------------------- */

/** Normaliza texto: minúsculas y sin acentos, para búsquedas tolerantes. */
function normalizar(texto) {
    return (texto ?? '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Aplica búsqueda + filtros sobre el arreglo y vuelve a renderizar. */
function aplicarFiltros() {
    const termino = normalizar(inputBusqueda.value.trim());
    const tipo = selectTipo.value;
    const fecha = inputFecha.value;

    const filtrados = eventos.filter(evento => {
        const coincideTexto = !termino ||
            normalizar(`${evento.titulo} ${evento.sede} ${evento.descripcion} ${evento.tipo}`).includes(termino);
        const coincideTipo = !tipo || evento.tipo === tipo;
        const coincideFecha = !fecha || evento.fecha === fecha;
        return coincideTexto && coincideTipo && coincideFecha;
    });

    renderizarEventos(filtrados);
}

/* --------------------------------------------------------------------------
   Inicialización
   -------------------------------------------------------------------------- */
function cargarEventos() {
    eventos = obtener(CLAVE_EVENTOS);

    if (eventos.length === 0) {
        eventos = EVENTOS_PRUEBA;
        guardar(CLAVE_EVENTOS, eventos);
    }

    // Migraciones de datos guardados con versiones anteriores
    const asistentes = obtener(CLAVE_ASISTENTES);
    let huboCambios = false;
    eventos.forEach(evento => {
        // 'cupo' → 'cupoMaximo'
        if (evento.cupoMaximo === undefined && evento.cupo !== undefined) {
            evento.cupoMaximo = Number(evento.cupo);
            delete evento.cupo;
            huboCambios = true;
        }
        // Sin 'cupoDisponible' → se calcula a partir de sus inscritos
        if (evento.cupoDisponible === undefined) {
            const inscritos = asistentes.filter(a => a.eventoId === evento.id).length;
            evento.cupoDisponible = Math.max(Number(evento.cupoMaximo) - inscritos, 0);
            huboCambios = true;
        }
    });
    if (huboCambios) guardar(CLAVE_EVENTOS, eventos);

    // Orden cronológico ascendente
    eventos.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
}

/** Inicializa el catálogo (solo en index.html). */
function iniciarCatalogo() {
    renderizarEventos(eventos);

    // Filtros en tiempo real
    inputBusqueda.addEventListener('input', aplicarFiltros);
    selectTipo.addEventListener('change', aplicarFiltros);
    inputFecha.addEventListener('change', aplicarFiltros);

    btnLimpiar.addEventListener('click', () => {
        document.getElementById('formFiltros').reset();
        aplicarFiltros();
        inputBusqueda.focus();
    });
}

/* ==========================================================================
   CREACIÓN DE EVENTOS (eventos.html)
   ========================================================================== */

/** Devuelve 'YYYY-MM-DD' de la fecha local actual (para el atributo min). */
function fechaLocalISO(fecha = new Date()) {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Construye un Date local a partir de 'YYYY-MM-DD' y 'HH:MM' (sin desfase UTC). */
function construirFechaHora(fechaISO, horaHHMM) {
    const [anio, mes, dia] = fechaISO.split('-').map(Number);
    const [horas, minutos] = horaHHMM.split(':').map(Number);
    return new Date(anio, mes - 1, dia, horas, minutos);
}

/** Genera un id numérico único que no colisione con los existentes. */
function generarIdEvento(lista) {
    let id = Date.now();
    while (lista.some(e => e.id === id)) id++;
    return id;
}

/** Muestra una alerta de Bootstrap dentro del contenedor indicado. */
function mostrarAlertaFormulario(contenedor, mensajeHTML, tipo = 'success') {
    contenedor.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show d-flex align-items-start gap-2" role="alert">
            <div>${mensajeHTML}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        </div>`;
    contenedor.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function iniciarFormularioEvento(form) {
    const campos = {
        titulo: document.getElementById('eventoTitulo'),
        tipo: document.getElementById('eventoTipo'),
        fecha: document.getElementById('eventoFecha'),
        hora: document.getElementById('eventoHora'),
        sede: document.getElementById('eventoSede'),
        cupo: document.getElementById('eventoCupo'),
        descripcion: document.getElementById('eventoDescripcion')
    };
    const feedbackFecha = document.getElementById('feedbackFecha');
    const contadorDescripcion = document.getElementById('contadorDescripcion');
    const alertaEvento = document.getElementById('alertaEvento');

    // UX: no permitir elegir días pasados en el selector
    campos.fecha.min = fechaLocalISO();

    const actualizarContador = () => {
        contadorDescripcion.textContent = `${campos.descripcion.value.length}/500`;
    };
    campos.descripcion.addEventListener('input', actualizarContador);

    // Al corregir fecha u hora, se limpia el error de "fecha pasada"
    [campos.fecha, campos.hora].forEach(c =>
        c.addEventListener('input', () => campos.fecha.setCustomValidity(''))
    );

    form.addEventListener('reset', () => {
        form.classList.remove('was-validated');
        campos.fecha.setCustomValidity('');
        setTimeout(actualizarContador, 0); // tras el reset nativo
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        alertaEvento.innerHTML = '';

        // Validaciones de contenido (espacios en blanco no cuentan)
        ['titulo', 'sede', 'descripcion'].forEach(clave => {
            const valor = campos[clave].value.trim();
            const minimo = clave === 'titulo' ? 3 : 1;
            campos[clave].setCustomValidity(valor.length >= minimo ? '' : 'Campo inválido');
        });

        const cupoMaximo = Number(campos.cupo.value);
        campos.cupo.setCustomValidity(Number.isInteger(cupoMaximo) && cupoMaximo > 0 ? '' : 'Cupo inválido');

        // Validación crítica: la fecha/hora debe ser futura
        campos.fecha.setCustomValidity('');
        feedbackFecha.textContent = 'Selecciona una fecha.';
        if (campos.fecha.value && campos.hora.value) {
            const fechaEvento = construirFechaHora(campos.fecha.value, campos.hora.value);
            if (fechaEvento <= new Date()) {
                campos.fecha.setCustomValidity('Fecha pasada');
                feedbackFecha.textContent = 'La fecha y hora deben ser posteriores al momento actual.';
            }
        }

        form.classList.add('was-validated');
        if (!form.checkValidity()) {
            mostrarAlertaFormulario(alertaEvento, 'Revisa los campos marcados en rojo antes de continuar.', 'danger');
            form.querySelector(':invalid')?.focus();
            return;
        }

        // Creación del evento
        const listaEventos = obtener(CLAVE_EVENTOS);
        const nuevoEvento = {
            id: generarIdEvento(listaEventos),
            titulo: campos.titulo.value.trim(),
            tipo: campos.tipo.value,
            fecha: campos.fecha.value,
            hora: campos.hora.value,
            sede: campos.sede.value.trim(),
            cupoMaximo,
            cupoDisponible: cupoMaximo,
            descripcion: campos.descripcion.value.trim()
        };

        listaEventos.push(nuevoEvento);
        guardar(CLAVE_EVENTOS, listaEventos);
        eventos = listaEventos;

        form.reset();
        mostrarAlertaFormulario(
            alertaEvento,
            `<strong>¡Evento publicado!</strong> "${escaparHTML(nuevoEvento.titulo)}" ya está disponible.
             <a href="index.html" class="alert-link">Ver en el catálogo</a>.`,
            'success'
        );
        campos.titulo.focus();
    });
}

/* ==========================================================================
   Arranque según la página
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    cargarEventos();

    if (contenedorEventos) iniciarCatalogo();

    const formEvento = document.getElementById('formEvento');
    if (formEvento) iniciarFormularioEvento(formEvento);
});

