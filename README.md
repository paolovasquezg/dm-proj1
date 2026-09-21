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
python3 download.py
```

## Pipeline

### 1. Levantar el entorno

- docker.ipynb
- Kernel picker → "Existing Jupyter Server..." → `http://localhost:8888`

### 2. EDA y KDD

Ejecutar en orden:

- 01_EDA_KDD/a_eda.ipynb
- 01_EDA_KDD/b_kdd.ipynb