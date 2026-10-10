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

- docker.ipynb
- Kernel picker → "Existing Jupyter Server..." → `http://localhost:8888`

### 1. EDA y KDD

#### 1.1 EDA

- 01_EDA_KDD/EDA/a_entendimiento.ipynb
- 01_EDA_KDD/EDA/b_exploracion.ipynb
- 01_EDA_KDD/EDA/c_justificacion.ipynb

#### 1.2 KDD

- 01_EDA_KDD/KDD/a_transformaciones.ipynb
- 01_EDA_KDD/KDD/b_recuento.ipynb

### 2. Similitud

- 02_Similitud/a_minhash.ipynb
- 02_Similitud/b_lsh.ipynb
- 02_Similitud/c_pares.ipynb
- 02_Similitud/d_entidades.ipynb
- 02_Similitud/e_analisis.ipynb

### 3. Vecinos aproximados (ANN)

- 03_ANN/a_tfidf.ipynb
- 03_ANN/b_ind_ivf.ipynb
- 03_ANN/c_bus_ivf.ipynb
- 03_ANN/d_faiss.ipynb
- 03_ANN/e_analisis.ipynb

### 4. Minería de flujos

- 04_Flujos/a_dgim.ipynb
- 04_Flujos/b_bloom.ipynb
- 04_Flujos/c_sketch.ipynb
- 04_Flujos/d_analisis.ipynb

### 5. Reglas de asociación

- 05_Asociacion/a_canastas.ipynb
- 05_Asociacion/b_itemsets.ipynb
- 05_Asociacion/c_reglas.ipynb
- 05_Asociacion/d_analisis.ipynb