// Rutas a los archivos JSON
const DATOS_DIR = './datos';

function formatoPeso(valor) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
}

function formatoNumero(valor) {
    return new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(valor);
}

async function cargarDatosGenerales() {
    try {
        const respuesta = await fetch('./datos_plazas.json');
        if (!respuesta.ok) throw new Error('No se pudo cargar datos_plazas.json');
        const datos = await respuesta.json();

        document.getElementById('numero-plazas-federal').textContent = formatoNumero(datos.numero_plazas_federal);
        document.getElementById('numero-trabajadores-federal').textContent = formatoNumero(datos.numero_trabajadores_federal);

        document.getElementById('estado-mas-trabajadores').textContent = `${datos.estado_con_mas_trabajadores.entidad_federativa} (${formatoNumero(datos.estado_con_mas_trabajadores.trabajadores_unicos)} trabajadores)`;
        document.getElementById('estado-mas-trabajadores-plazas').textContent = `${formatoNumero(datos.estado_con_mas_trabajadores.plazas_unicas)} plazas`;

        document.getElementById('estado-menos-trabajadores').textContent = `${datos.estado_con_menos_trabajadores.entidad_federativa} (${formatoNumero(datos.estado_con_menos_trabajadores.trabajadores_unicos)} trabajadores)`;
        document.getElementById('estado-menos-trabajadores-plazas').textContent = `${formatoNumero(datos.estado_con_menos_trabajadores.plazas_unicas)} plazas`;

        document.getElementById('estado-mas-percepciones').textContent = `${datos.estado_con_mas_percepciones.entidad_federativa} (${formatoPeso(datos.estado_con_mas_percepciones.percepciones_total)})`;
        document.getElementById('estado-menos-percepciones').textContent = `${datos.estado_con_menos_percepciones.entidad_federativa} (${formatoPeso(datos.estado_con_menos_percepciones.percepciones_total)})`;

        document.getElementById('estado-mas-centros-trabajo').textContent = `${datos.estado_con_mas_centros_trabajo.entidad_federativa} (${formatoNumero(datos.estado_con_mas_centros_trabajo.centros_trabajo)} centros)`;
        document.getElementById('estado-menos-centros-trabajo').textContent = `${datos.estado_con_menos_centros_trabajo.entidad_federativa} (${formatoNumero(datos.estado_con_menos_centros_trabajo.centros_trabajo)} centros)`;
    } catch (error) {
        console.error('Error cargando datos generales:', error);
    }
}

async function cargarEntidades() {
    try {
        // Cargar el índice para obtener la lista de entidades
        const respuesta = await fetch(`${DATOS_DIR}/index.json`);
        if (!respuesta.ok) throw new Error('No se pudo cargar index.json');
        const datos = await respuesta.json();
        
        const selectEstado = document.getElementById('estado');
        selectEstado.innerHTML = '';
        
        if (datos.entidades.length === 0) {
            selectEstado.innerHTML = '<option value="">No hay entidades disponibles</option>';
        } else {
            datos.entidades.forEach(entidad => {
                const option = document.createElement('option');
                option.value = entidad;
                option.textContent = entidad;
                selectEstado.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando entidades:', error);
        document.getElementById('estado').innerHTML = '<option value="">Error cargando entidades</option>';
    }
}

async function cargarTrimestresDelEstado() {
    const entidad = document.getElementById('estado').value;
    const selectTrimestre = document.getElementById('trimestre');
    
    if (!entidad) {
        selectTrimestre.innerHTML = '<option value="">Selecciona primero un estado</option>';
        return;
    }

    try {
        // Convertir nombre de entidad a nombre de archivo
        // Primero reemplazar acentos, luego espacios
        const nombreArchivo = entidad
            .replace(/Á/g, 'a').replace(/á/g, 'a')
            .replace(/É/g, 'e').replace(/é/g, 'e')
            .replace(/Í/g, 'i').replace(/í/g, 'i')
            .replace(/Ó/g, 'o').replace(/ó/g, 'o')
            .replace(/Ú/g, 'u').replace(/ú/g, 'u')
            .toLowerCase()
            .replace(/ /g, '_');
        
        const respuesta = await fetch(`${DATOS_DIR}/${nombreArchivo}.json`);
        
        if (!respuesta.ok) throw new Error(`No se pudo cargar datos de ${entidad} (buscando: ${nombreArchivo}.json)`);
        const datos = await respuesta.json();
        
        const trimestres = Object.keys(datos.trimestres).sort();
        selectTrimestre.innerHTML = '';
        
        if (trimestres.length === 0) {
            selectTrimestre.innerHTML = '<option value="">No hay trimestres disponibles</option>';
        } else {
            trimestres.forEach(trimestre => {
                const option = document.createElement('option');
                option.value = trimestre;
                option.textContent = trimestre;
                selectTrimestre.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando trimestres:', error);
        selectTrimestre.innerHTML = '<option value="">Error cargando trimestres</option>';
    }
}

document.getElementById('formulario-consulta').addEventListener('submit', (e) => {
    e.preventDefault();
    const entidad = document.getElementById('estado').value;
    const trimestre = document.getElementById('trimestre').value;
    
    if (entidad && trimestre) {
        // Redirigir a master.html con parámetros en URL
        window.location.href = `master.html?entidad=${encodeURIComponent(entidad)}&trimestre=${encodeURIComponent(trimestre)}`;
    } else {
        alert('Por favor selecciona un estado y un trimestre');
    }
});

// Cargar entidades y datos generales al abrir la página
window.addEventListener('DOMContentLoaded', async () => {
    await cargarEntidades();
    await cargarDatosGenerales();
    // Agregar event listener para cambios en estado
    document.getElementById('estado').addEventListener('change', cargarTrimestresDelEstado);
    // Cargar trimestres del primer estado automáticamente
    await cargarTrimestresDelEstado();
});
