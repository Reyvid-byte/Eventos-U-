/**
 * EventosU - Capa de persistencia (localStorage)
 */

/**
 * Obtiene y parsea los datos almacenados en una clave.
 * @param {string} clave
 * @returns {Array|Object} Datos parseados o [] si la clave no existe.
 */
function obtener(clave) {
    const datos = localStorage.getItem(clave);
    return datos ? JSON.parse(datos) : [];
}

/**
 * Guarda los datos serializados en la clave indicada.
 * @param {string} clave
 * @param {*} datos
 */
function guardar(clave, datos) {
    localStorage.setItem(clave, JSON.stringify(datos));
}
