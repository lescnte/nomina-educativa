# Sistema de Nómina Educativa Federalizada

Sistema web para consultar y visualizar datos agregados de plazas educativas por estado y trimestre.

## Estado actual del proyecto

- ✅ La portada [index.html](index.html) muestra indicadores generales del trimestre 2026/01.
- ✅ El script [generar_datos_plazas.py](generar_datos_plazas.py) genera un resumen consolidado de la portada.
- ✅ El script [generar_datos_json.py](generar_datos_json.py) genera un archivo JSON por entidad con sus trimestres.
- ✅ La vista detallada [master.html](master.html) se alimenta de los JSON por entidad en [datos](datos).
- ✅ Se verificó que la base de datos PostgreSQL contiene 31 entidades federativas, sin incluir Ciudad de México.

## Estructura del proyecto

```
cnte/
├── datos/                          # JSON por entidad y archivo índice
│   ├── index.json                 # Lista de entidades federativas
│   ├── aguascalientes.json        # Datos detallados de Aguascalientes
│   └── ...                        # Un JSON por cada entidad
├── datos_plazas.json              # Resumen general de la portada para 2026/01
├── generar_datos_json.py          # Genera los JSON por entidad y trimestre
├── generar_datos_plazas.py        # Genera el resumen de la portada para 2026/01
├── index.html                     # Portada con indicadores generales
├── index.js                       # Lógica de la portada
├── master.html                    # Vista detallada por entidad y trimestre
├── master.js                      # Lógica de la vista detallada
├── estilos.css                    # Estilos CSS
├── requirements.txt               # Dependencias Python
└── README.md                      # Este archivo
```

## Requisitos previos

- Python 3.10+
- PostgreSQL instalado y configurado
- Base de datos `plazas` creada y poblada

## Configuración

### 1. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 2. Verificar la conexión

El proyecto usa esta conexión:

```python
DB_URL = "postgresql+psycopg2://postgres:Iv3uv.miJppp9Ql@localhost:5432/plazas"
```

### 3. Generar los datos

#### Portada
```bash
python generar_datos_plazas.py
```

#### JSON por entidad
```bash
python generar_datos_json.py
```

## Flujo actual del proyecto

1. Se consulta la base de datos PostgreSQL `plazas`.
2. Se genera [datos_plazas.json](datos_plazas.json) con indicadores generales del trimestre 2026/01.
3. Se generan los JSON por entidad en [datos](datos) para la vista detallada.
4. La portada [index.html](index.html) consume [datos_plazas.json](datos_plazas.json).
5. La vista detallada [master.html](master.html) consume los archivos JSON de [datos](datos).

## Datos mostrados

### Portada
- Número total de trabajadores únicos del trimestre 2026/01
- Número total de plazas únicas del trimestre 2026/01
- Entidad con más trabajadores y sus plazas
- Entidad con menos trabajadores y sus plazas
- Entidad con más percepciones
- Entidad con menos percepciones
- Entidad con más centros de trabajo
- Entidad con menos centros de trabajo

### Vista detallada
Para cada entidad y trimestre se visualiza:
- Top 10 centros de trabajo por percepciones
- Centro con mayor y menor percepciones
- Número total de centros de trabajo
- Top 10 trabajadores por percepciones
- Trabajador con mayor y menor percepciones
- Número total de trabajadores únicos
- Distribución de sueldos
- Distribución de plazas por trabajador

## Solución de problemas

### No se conectan los datos
- Verifica que PostgreSQL esté activo.
- Confirma que exista la base `plazas`.
- Revisa que las credenciales en los scripts coincidan con tu entorno.

### No se cargan los JSON
- Ejecuta primero `generar_datos_plazas.py` para la portada.
- Luego ejecuta `generar_datos_json.py` para los archivos por entidad.
- Abre la aplicación desde un servidor local, por ejemplo:

```bash
python -m http.server 8000
```

## Siguientes pasos recomendados

- Validar la experiencia completa en navegador desde la portada hasta la vista detallada.
- Revisar si se desea extender el análisis a otros trimestres.
- Considerar una capa de caché o preprocesamiento si los archivos crecen demasiado.
| **Setup** | Genera 1 vez | Debe correr siempre |
| **Velocidad** | Rápido (local) | Depende del servidor |
| **Escalabilidad** | Bueno para <1GB datos | Mejor para datos dinámicos |
| **Dependencias** | Solo navegador | Necesita Python + Flask |
| **Hosting** | Cualquier servidor web | Necesita Python activo |
| **Mantenimiento** | Bajo | Más complejo |

## Actualizar los Datos

Cuando tengas nuevos datos en la base de datos, simplemente ejecuta:

```bash
python generar_datos_json.py
```

Sobrescribirá los JSONs existentes con los datos más recientes.

## Personalización

### Cambiar rangos de distribución de sueldos

Edita `generar_datos_json.py`, función `obtener_distribucion_sueldos()`:

```python
CASE 
    WHEN COALESCE("PERCEPCIONES", 0) < 10000 THEN '1_menos_10k'
    WHEN COALESCE("PERCEPCIONES", 0) < 20000 THEN '2_10k_20k'
    ...
```

### Cambiar número de resultados en Top 10

En `generar_datos_json.py`:

```python
# Cambiar el parámetro limite
obtener_top_centros_trabajo(conn, entidad, trimestre, limite=15)  # 15 en lugar de 10
```

### Cambiar formato de salida

Los JSONs usan `ensure_ascii=False` para preservar caracteres especiales. 
Para cambiar:

```python
with open(archivo_path, 'w', encoding='utf-8') as f:
    json.dump(datos_entidad, f, ensure_ascii=True, indent=2)  # ensure_ascii=True
```

## Notas de Seguridad

⚠️ Las credenciales de base de datos están en texto plano en `generar_datos_json.py`.

Para producción:
```python
import os
from dotenv import load_dotenv

load_dotenv()
DB_URL = f"postgresql+psycopg2://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
```

## Tamaño de Archivos Esperado

- `index.json`: ~2 KB
- Cada archivo de estado: 100 KB - 1 MB (depende del número de registros)
- **Total estimado**: 2-32 MB para 32 estados

## Performance

- ✅ Página carga instantáneamente (datos en RAM)
- ✅ Gráficos generados dinámicamente (Chart.js)
- ✅ Sin latencia de red (archivos locales)
- ✅ Escalable a 100+ millones de registros agregados

## Soporte

Para más información consulta:
- Base de datos: [PostgreSQL Docs](https://www.postgresql.org/docs/)
- Frontend: [Chart.js Docs](https://www.chartjs.org/)
- Python: [SQLAlchemy Docs](https://docs.sqlalchemy.org/)

