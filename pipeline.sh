#!/bin/sh
set -e
cd "$(dirname "$0")"

TIMEOUT=7200

echo "== Activar ambiente =="
python3 -m venv venv
source venv/bin/activate

echo "== Instalar dependencias =="
pip3 install -r "requirements.txt"

echo "== 0. Levantar contenedores =="
jupyter nbconvert --to notebook --execute --inplace docker.ipynb

echo "== 1.EDA Y KDD =="

# 1. EDA y KDD
docker compose exec -T jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 01_EDA_KDD/EDA/a_entendimiento.ipynb
docker compose exec -T jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 01_EDA_KDD/EDA/b_exploracion.ipynb
docker compose exec -T jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 01_EDA_KDD/EDA/c_justificacion.ipynb
docker compose exec -T jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 01_EDA_KDD/KDD/a_transformaciones.ipynb
docker compose exec -T jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 01_EDA_KDD/KDD/b_recuento.ipynb

echo "== 4. Minería de flujos =="

# 4. Minería de flujos
docker compose exec -T jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 04_Flujos/a_dgim.ipynb
docker compose exec -T jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 04_Flujos/b_bloom.ipynb
docker compose exec -T jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 04_Flujos/c_sketch.ipynb
docker compose exec -T jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 04_Flujos/d_analisis.ipynb

echo "== 5. Reglas de asociación =="

# 5. Reglas de asociación
docker compose exec -T jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 05_Asociacion/a_canastas.ipynb
docker compose exec -T jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 05_Asociacion/b_itemsets.ipynb
docker compose exec -T jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 05_Asociacion/c_reglas.ipynb
docker compose exec -T jupyter jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=$TIMEOUT 05_Asociacion/d_analisis.ipynb

echo "== Pipeline terminado =="
