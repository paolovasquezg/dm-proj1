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

### 1. Levantar el entorno

- docker.ipynb
- Kernel picker → "Existing Jupyter Server..." → `http://localhost:8888`

### 2. EDA y KDD

#### 2.1 EDA

Ejecutar en orden:

- 01_EDA_KDD/EDA/a_entendimiento.ipynb
- 01_EDA_KDD/EDA/b_exploracion.ipynb
- 01_EDA_KDD/EDA/c_justificacion.ipynb

#### 2.2 KDD

Ejecutar en orden:

- 01_EDA_KDD/KDD/a_transformaciones.ipynb
- 01_EDA_KDD/KDD/b_recuento.ipynb