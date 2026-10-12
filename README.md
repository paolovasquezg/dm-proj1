# Proyecto 01: Data Mining

Mineria y análisis en las contrataciones abiertas de la compra pública en Perú durante los años 2023 a 2025

Fuente: https://contratacionesabiertas.oece.gob.pe/descargas?page=1&paginateBy=10

## Requerimientos

- Tener Docker Desktop (o Docker Engine + plugin compose) abierto y corriendo

## Dependencias

Para instalar las dependencias:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Data

Para descargar la data:

```bash
python3 data/download.py
```

## Pipeline

Ejecutar todo el flujo en orden, o alternativamente correr:

```bash
sh pipeline.sh
```

### 0. Levantar el entorno

Levanta el cluster de Spark y Jupyter con Docker

- docker.ipynb
- Kernel picker → "Existing Jupyter Server..." → `http://localhost:8888`

### 1. EDA y KDD

#### 1.1 EDA

Entiende la data, revisa su calidad y explora variables y relaciones

- 01_EDA_KDD/EDA/a_entendimiento.ipynb
- 01_EDA_KDD/EDA/b_exploracion.ipynb
- 01_EDA_KDD/EDA/c_justificacion.ipynb

#### 1.2 KDD

Limpia y transforma la data, y crea las columnas usadas en `data/final`

- 01_EDA_KDD/KDD/a_transformaciones.ipynb
- 01_EDA_KDD/KDD/b_recuento.ipynb

### 2. Similitud

Procesos casi idénticos con MinHash y LSH

- 02_Similitud/a_minhash.ipynb
- 02_Similitud/b_lsh.ipynb
- 02_Similitud/c_pares.ipynb
- 02_Similitud/d_entidades.ipynb
- 02_Similitud/e_analisis.ipynb

### 3. Vecinos aproximados (ANN)

Compras parecidas con TF-IDF, IVF y HNSW para comparar montos

- 03_ANN/a_tfidf.ipynb
- 03_ANN/b_ind_ivf.ipynb
- 03_ANN/c_bus_ivf.ipynb
- 03_ANN/d_faiss.ipynb
- 03_ANN/e_analisis.ipynb

### 4. Minería de flujos

Procesos como un flujo con DGIM, Bloom Filter y Count-Min Sketch

- 04_Flujos/a_dgim.ipynb
- 04_Flujos/b_bloom.ipynb
- 04_Flujos/c_sketch.ipynb
- 04_Flujos/d_analisis.ipynb

### 5. Reglas de asociación

Combinaciones de método, monto, región y rubro asociadas a un solo postor

- 05_Asociacion/a_canastas.ipynb
- 05_Asociacion/b_itemsets.ipynb
- 05_Asociacion/c_reglas.ipynb
- 05_Asociacion/d_analisis.ipynb

### 6. Análisis

Pproceso, los hallazgos y los insights

- 06_Analisis/a_recuento.ipynb
- 06_Analisis/b_hallazgos.ipynb
- 06_Analisis/c_insights.ipynb

### 7. Datos para la web

Exporta a `web/data/` los JSON que usa la página:

```bash
python data/exportar.py
```

## Web interactiva

Presentación por etapas del proceso y los resultados, en `web/`

```bash
python3 -m http.server -d web 8000
```

Abrir `http://localhost:8000`


## Acceso publico

Acceder a la web con los resultados en [paolovasquezg.github.io/dm-proj1](https://paolovasquezg.github.io/dm-proj1/)


## Reporte técnico

Documento con la metodología, los resultados y las conclusiones del proyecto, en [reporte.html](reporte.html)


```bash
python3 -m http.server 8001
```

Abrir `http://localhost:8001/reporte.html`

