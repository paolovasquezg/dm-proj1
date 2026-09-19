# Proyecto 01: Data Mining

Minería y análisis de las contrataciones públicas del Perú (**2023, 2024 y 2025**, estándar OCDS).

**Fuente:** Contrataciones Abiertas OCDS — OECE/OSCE (<https://contratacionesabiertas.osce.gob.pe/>),
descarga masiva: <https://data.open-contracting.org/es/publication/135>

## Requisitos

Solo **Docker** (y Docker Compose, que viene incluido en Docker Desktop). No hace falta instalar Java,
Python, Spark ni Jupyter en la máquina. Se recomiendan ~8 GB de RAM disponibles para Docker.

## 1. Data

Los JSON van en `data/`, una carpeta por año y un archivo por mes:

```
data/
├── 2023/   1.json ... 12.json
├── 2024/   1.json ... 12.json
└── 2025/   1.json ... 12.json
```

Para descargarlos: `pip install -r requirements.txt && python3 download/download.py`

## 2. Levantar Spark + Jupyter

**Opción A — desde un notebook** (sin usar la terminal): abrir `00_Levantar_Docker.ipynb` en tu máquina
(Jupyter o VS Code) y ejecutarlo. Ese notebook corre `docker compose` tal cual, comprueba que Docker esté
encendido, espera a que el worker se registre en el master y, si quieres, ejecuta el análisis completo y
guarda `Parte1_EDA_KDD_ejecutado.ipynb`. Requiere solo Docker y Jupyter (`pip install notebook`).

**Opción B — desde la terminal:**

```bash
docker compose up -d --build   # Spark master + worker + Jupyter
docker compose ps              # los 3 contenedores deben estar "Up"
```

| Servicio | URL |
|---|---|
| Jupyter (sin token) | http://localhost:8888 |
| Spark Master | http://localhost:8080 |
| Spark Worker | http://localhost:8081 |
| Job en ejecución | http://localhost:4040 |

Abrir `Parte1_EDA_KDD.ipynb` y ejecutar **Run All**. La primera celda del notebook repite estos comandos,
y la sección 0 verifica que el driver esté conectado al cluster (master, executors y cores).

Apagar: `docker compose down` · Ver logs: `docker compose logs -f spark-worker`

### Ajustes según la máquina

```bash
HOST_UID=$(id -u) docker compose up -d --build                        # Linux con UID != 1000
SPARK_WORKER_CORES=1 docker compose up -d                             # si hay OutOfMemory
SPARK_WORKER_MEMORY=10g SPARK_EXECUTOR_MEMORY=8g docker compose up -d # máquina con más RAM
```

Para trabajar con un solo año mientras se desarrolla, cambiar en el notebook:
`ANIOS = [2025]` (o `docker compose run -e ANIOS=2025 ...`).

### Por qué es replicable

- **Imagen fijada** (`quay.io/jupyter/pyspark-notebook:spark-3.5.0`): misma versión de Spark, Java y Python
  en cualquier máquina. Tiene builds para x86_64 y ARM (Apple Silicon).
- **Una sola imagen para master, worker y Jupyter**: evita el error clásico de PySpark cuando el driver y los
  executors tienen versiones distintas de Python.
- **Rutas relativas** dentro de `/home/jovyan/work`: no depende de dónde esté clonado el repo.
- **Memoria y cores por variables de entorno**, con valores por defecto que funcionan en una laptop de 8 GB.

Lo único que no viaja en la imagen es la data (pesa GB): se descarga con `download/download.py`.

## 3. Parte I — EDA + KDD (`Parte1_EDA_KDD.ipynb`)

| Notebook | Dónde corre | Para qué |
|---|---|---|
| `00_Levantar_Docker.ipynb` | En tu máquina | Levanta, verifica, monitorea y apaga el cluster |
| `Parte1_EDA_KDD.ipynb` | Dentro del contenedor | El EDA y el KDD |

| Sección | Qué hace |
|---|---|
| 0. Entorno | Conexión a Spark y verificación del cluster |
| 1. Carga | Lee `data/<año>/*.json` y guarda una vista plana sin limpiar en `parquet/staging/` |
| 2. EDA | Nulos, serie mensual por año, comparación entre años, categóricas, montos, entidades/proveedores, viabilidad del texto → dictamen de aptitud |
| 3. Preguntas y técnicas | Qué se busca con MinHash, LSH, ANN, Bloom, Count-Min, DGIM y FP-Growth |
| 4. KDD | Selección → limpieza → transformación (texto concatenado, tokens, shingles, tramos, canasta) |

**Salida:** `parquet/procesos/` particionado por `anio` y `mes`, y las figuras en `outputs/parte1/`.

```python
procesos = spark.read.parquet("parquet/procesos")                           # los 3 años
procesos_2025 = spark.read.parquet("parquet/procesos").where("anio = 2025") # un año
```

| Columna | Parte que la usa |
|---|---|
| `shingles` | II — Jaccard, MinHash, LSH |
| `tokens`, `monto_final` | III — ANN (IVF / HNSW) |
| `fecha`, `anio`, `entidad`, `proveedor`, `postor_unico` | IV — Bloom, Count-Min, DGIM |
| `canasta` | V — Apriori / FP-Growth |

Sin Docker también corre (usa `local[*]`): `pip install pyspark==3.5.0 pandas matplotlib pyarrow jupyter` (requiere Java 17).
