// Rutas a los archivos JSON
const DATOS_DIR = './datos';
let sueldoChart = null;
let plazasChart = null;

// Obtener parámetros de URL
function obtenerParametrosURL() {
    const params = new URLSearchParams(window.location.search);
    return {
        entidad: params.get('entidad'),
        trimestre: params.get('trimestre')
    };
}

// Función auxiliar para cargar trimestres de una entidad
async function cargarTrimestresDeEntidad(entidad) {
    const nombreArchivo = entidad.toLowerCase().replace(/ /g, '_').replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');
    
    try {
        const resp = await fetch(`${DATOS_DIR}/${nombreArchivo}.json`);
        if (!resp.ok) throw new Error(`No se pudo cargar datos de ${entidad}`);
        const datosEnt = await resp.json();
        
        const selectTrimestre = document.getElementById('trimestre');
        selectTrimestre.innerHTML = '';
        Object.keys(datosEnt.trimestres).forEach(trimestre => {
            const option = document.createElement('option');
            option.value = trimestre;
            option.textContent = trimestre;
            selectTrimestre.appendChild(option);
        });
        
        return datosEnt.trimestres;
    } catch (error) {
        console.error('Error cargando trimestres:', error);
        return {};
    }
}

// Cargar entidades y trimestres para el formulario de navegación
async function cargarEntidadesYTrimestres() {
    try {
        const respuesta = await fetch(`${DATOS_DIR}/index.json`);
        if (!respuesta.ok) throw new Error('No se pudo cargar index.json');
        const datos = await respuesta.json();

        const selectEstado = document.getElementById('estado');
        selectEstado.innerHTML = '';
        datos.entidades.forEach(entidad => {
            const option = document.createElement('option');
            option.value = entidad;
            option.textContent = entidad;
            selectEstado.appendChild(option);
        });

        // Cuando se selecciona una entidad, cargar sus trimestres
        selectEstado.addEventListener('change', async function() {
            await cargarTrimestresDeEntidad(this.value);
        });

        // Establecer valores seleccionados desde parámetros URL
        const params = obtenerParametrosURL();
        if (params.entidad) {
            selectEstado.value = params.entidad;
            
            // Cargar trimestres de la entidad y establecer el trimestre seleccionado
            await cargarTrimestresDeEntidad(params.entidad);
            
            if (params.trimestre) {
                const selectTrimestre = document.getElementById('trimestre');
                selectTrimestre.value = params.trimestre;
            }
        }
    } catch (error) {
        console.error('Error cargando opciones:', error);
    }
}

// Formatear moneda en pesos mexicanos
function formatoPeso(valor) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 2
    }).format(valor);
}

// Formatear número entero
function formatoNumero(valor) {
    return new Intl.NumberFormat('es-MX').format(valor);
}

// Cargar datos del JSON
async function cargarDatos() {
    const params = obtenerParametrosURL();

    if (!params.entidad || !params.trimestre) {
        document.getElementById('titulo-principal').textContent = 'Error: No se especificaron parámetros';
        return;
    }

    try {
        const nombreArchivo = params.entidad.toLowerCase().replace(/ /g, '_').replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');
        const respuesta = await fetch(`${DATOS_DIR}/${nombreArchivo}.json`);

        if (!respuesta.ok) {
            throw new Error(`Error ${respuesta.status}: No se pudieron cargar los datos`);
        }

        const datosEntidad = await respuesta.json();
        const datos = datosEntidad.trimestres[params.trimestre];

        if (!datos) {
            throw new Error(`No hay datos para el trimestre: ${params.trimestre}`);
        }

        document.getElementById('titulo-principal').textContent = `${params.entidad} - ${params.trimestre}`;

        const centros = datos.centros_trabajo.top_10 || [];
        const trabajadores = datos.trabajadores.top_10 || [];

        const renderList = (items, type) => {
            const container = type === 'centros' ? document.getElementById('lista-top-centros') : document.getElementById('lista-top-trabajadores');
            const button = type === 'centros' ? document.getElementById('toggle-centros') : document.getElementById('toggle-trabajadores');
            const visibleItems = items.slice(0, 5);
            const hiddenItems = items.slice(5);

            container.innerHTML = '';
            visibleItems.forEach((item, idx) => {
                const li = document.createElement('li');
                if (type === 'centros') {
                    li.innerHTML = `<span class="badge">${idx + 1}</span><strong>${item.nombre}</strong>: ${formatoPeso(item.percepciones)}`;
                } else {
                    li.innerHTML = `<span class="badge">${idx + 1}</span><strong>${item.nombre}</strong><br><span class="muted">RFC: ${item.rfc || 'N/D'}</span><br>Percepciones: ${formatoPeso(item.percepciones)} | Plazas: ${item.plazas}`;
                }
                container.appendChild(li);
            });

            if (hiddenItems.length > 0) {
                hiddenItems.forEach((item, idx) => {
                    const li = document.createElement('li');
                    li.className = 'is-hidden';
                    li.hidden = true;
                    if (type === 'centros') {
                        li.innerHTML = `<span class="badge">${idx + 6}</span><strong>${item.nombre}</strong>: ${formatoPeso(item.percepciones)}`;
                    } else {
                        li.innerHTML = `<span class="badge">${idx + 6}</span><strong>${item.nombre}</strong><br><span class="muted">RFC: ${item.rfc || 'N/D'}</span><br>Percepciones: ${formatoPeso(item.percepciones)} | Plazas: ${item.plazas}`;
                    }
                    container.appendChild(li);
                });
                button.hidden = false;
            } else {
                button.hidden = true;
            }

            button.onclick = () => {
                const hiddenNodes = Array.from(container.querySelectorAll('li.is-hidden'));
                const expanded = button.getAttribute('aria-expanded') === 'true';
                hiddenNodes.forEach(node => {
                    node.hidden = expanded;
                });
                button.setAttribute('aria-expanded', String(!expanded));
                button.textContent = expanded ? 'Ver Top 10' : 'Ocultar extras';
            };
        };

        renderList(centros, 'centros');
        renderList(trabajadores, 'trabajadores');

        document.getElementById('centro-max').innerHTML = `
            <strong>${datos.centros_trabajo.min_max.max.nombre}</strong><br>
            <span class="valor-cifra">${formatoPeso(datos.centros_trabajo.min_max.max.percepciones)}</span>
        `;

        document.getElementById('centro-min').innerHTML = `
            <strong>${datos.centros_trabajo.min_max.min.nombre}</strong><br>
            <span class="valor-cifra">${formatoPeso(datos.centros_trabajo.min_max.min.percepciones)}</span>
        `;

        document.getElementById('num-centros').innerHTML = `
            <strong>${formatoNumero(datos.centros_trabajo.total)} centros de trabajo</strong> en ${params.entidad}
        `;

        document.getElementById('trabajador-max').innerHTML = `
            <strong>${datos.trabajadores.min_max.max.nombre}</strong><br>
            RFC: ${datos.trabajadores.min_max.max.rfc}<br>
            <span class="valor-cifra">${formatoPeso(datos.trabajadores.min_max.max.percepciones)}</span>
        `;

        document.getElementById('trabajador-min').innerHTML = `
            <strong>${datos.trabajadores.min_max.min.nombre}</strong><br>
            RFC: ${datos.trabajadores.min_max.min.rfc}<br>
            <span class="valor-cifra">${formatoPeso(datos.trabajadores.min_max.min.percepciones)}</span>
        `;

        document.getElementById('num-trabajadores').innerHTML = `
            <strong>${formatoNumero(datos.trabajadores.total)} trabajadores únicos</strong> en ${params.entidad}
        `;

        let htmlSueldos = '';
        let labels = [];
        let datosChart = [];
        const colores = ['#3d3b8e'];

        for (const [rango, cantidad] of Object.entries(datos.distribucion_sueldos)) {
            htmlSueldos += `<li><strong>${rango}:</strong> ${formatoNumero(cantidad)} trabajadores</li>`;
            labels.push(rango);
            datosChart.push(cantidad);
        }
        document.getElementById('lista-distribucion-sueldos').innerHTML = htmlSueldos || '<li>No hay datos</li>';

        const ctxSueldos = document.getElementById('sueldoChart');
        if (sueldoChart) sueldoChart.destroy();
        sueldoChart = new Chart(ctxSueldos, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Trabajadores',
                    data: datosChart,
                    backgroundColor: colores.slice(0, labels.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#000000' } },
                    y: { beginAtZero: true, ticks: { color: '#000000' } }
                }
            }
        });

        let htmlPlazas = '';
        let labelsPlazas = [];
        let datosPlazas = [];
        for (const [plazas, cantidad] of Object.entries(datos.distribucion_plazas)) {
            htmlPlazas += `<li><strong>${plazas}:</strong> ${formatoNumero(cantidad)} trabajadores</li>`;
            labelsPlazas.push(plazas);
            datosPlazas.push(cantidad);
        }
        document.getElementById('lista-distribucion-plazas').innerHTML = htmlPlazas || '<li>No hay datos</li>';

        const ctxPlazas = document.getElementById('plazasChart');
        if (plazasChart) plazasChart.destroy();
        plazasChart = new Chart(ctxPlazas, {
            type: 'bar',
            data: {
                labels: labelsPlazas,
                datasets: [{
                    label: 'Trabajadores',
                    data: datosPlazas,
                    backgroundColor: colores.slice(0, labelsPlazas.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#000000' } },
                    y: { beginAtZero: true, ticks: { color: '#000000' } }
                }
            }
        });

    } catch (error) {
        console.error('Error cargando datos:', error);
        document.getElementById('titulo-principal').textContent = `Error: ${error.message}`;
    }
}

// Manejar envío del formulario de navegación
document.getElementById('formulario-consulta').addEventListener('submit', (e) => {
    e.preventDefault();
    const entidad = document.getElementById('estado').value;
    const trimestre = document.getElementById('trimestre').value;
    if (entidad && trimestre) {
        window.location.href = `master.html?entidad=${encodeURIComponent(entidad)}&trimestre=${encodeURIComponent(trimestre)}`;
    }
});

// Inicializar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    cargarEntidadesYTrimestres();
    cargarDatos();
});
