import json
import shutil
import sys
from pathlib import Path

import numpy as np
import pandas as pd

PROYECTO = Path(__file__).resolve().parents[1]
SALIDA = PROYECTO / "web" / "data"

VISTAS = {
    "02_dataset": [
        ("01_EDA_KDD", "a_entendimiento", "volumen_anio"),
        ("01_EDA_KDD", "a_transformaciones", "seleccion_columnas"),
        ("01_EDA_KDD", "b_exploracion", "texto_stats"),
        ("01_EDA_KDD", "b_exploracion", "monto_adjudicado_anio"),
    ],
    "03_eda": [
        ("01_EDA_KDD", "a_entendimiento", "nulos"),
        ("01_EDA_KDD", "a_entendimiento", "casi_duplicados_resumen"),
        ("01_EDA_KDD", "a_entendimiento", "inconsistencias"),
        ("01_EDA_KDD", "b_exploracion", "serie_mensual"),
        ("01_EDA_KDD", "b_exploracion", "por_anio"),
        ("01_EDA_KDD", "b_exploracion", "montos_hist_log10"),
        ("01_EDA_KDD", "b_exploracion", "monto_categoria"),
        ("01_EDA_KDD", "b_exploracion", "competencia_metodo"),
        ("01_EDA_KDD", "b_exploracion", "competencia_tramo"),
        ("01_EDA_KDD", "b_exploracion", "competencia_region"),
        ("01_EDA_KDD", "b_exploracion", "top_entidades"),
        ("01_EDA_KDD", "b_exploracion", "pares_entidad_proveedor"),
        ("01_EDA_KDD", "b_exploracion", "tiempos_rdd_df_sql"),
    ],
    "04_kdd": [
        ("01_EDA_KDD", "a_transformaciones", "pasos_limpieza"),
        ("01_EDA_KDD", "a_transformaciones", "seleccion_columnas"),
        ("01_EDA_KDD", "a_transformaciones", "postor_unico_tramo"),
        ("01_EDA_KDD", "a_transformaciones", "procesos_anio"),
    ],
    "05_similitud": [
        ("02_Similitud", "a_minhash", "representacion"),
        ("02_Similitud", "a_minhash", "longitud_T"),
        ("02_Similitud", "a_minhash", "minhash_vs_jaccard"),
        ("02_Similitud", "a_minhash", "resumen"),
        ("02_Similitud", "b_lsh", "configs_br"),
        ("02_Similitud", "b_lsh", "cubetas"),
        ("02_Similitud", "b_lsh", "umbral"),
        ("02_Similitud", "b_lsh", "por_mes"),
        ("02_Similitud", "b_lsh", "resumen"),
        ("02_Similitud", "c_pares", "pares_por_mes"),
        ("02_Similitud", "d_entidades", "tipos_pares"),
        ("02_Similitud", "d_entidades", "embudo_exclusivo"),
        ("02_Similitud", "d_entidades", "tamano_grupos"),
        ("02_Similitud", "d_entidades", "ranking"),
        ("02_Similitud", "d_entidades", "resumen"),
        ("02_Similitud", "e_analisis", "embudo_exclusivo_oefa"),
    ],
    "06_vecinos": [
        ("03_ANN", "a_tfidf", "representacion"),
        ("03_ANN", "a_tfidf", "num_features"),
        ("03_ANN", "a_tfidf", "resumen"),
        ("03_ANN", "b_ind_ivf", "tamano_listas"),
        ("03_ANN", "b_ind_ivf", "resumen"),
        ("03_ANN", "c_bus_ivf", "nprobe"),
        ("03_ANN", "c_bus_ivf", "nlist"),
        ("03_ANN", "c_bus_ivf", "resumen"),
        ("03_ANN", "d_faiss", "comparacion"),
        ("03_ANN", "d_faiss", "ivf_nprobe"),
        ("03_ANN", "d_faiss", "hnsw_efsearch"),
        ("03_ANN", "e_analisis", "umbral_sim"),
        ("03_ANN", "e_analisis", "variacion_p3"),
        ("03_ANN", "e_analisis", "otra_region"),
        ("03_ANN", "e_analisis", "regiones"),
        ("03_ANN", "e_analisis", "entidades"),
        ("03_ANN", "e_analisis", "tecnicas"),
    ],
    "07_flujos": [
        ("04_Flujos", "a_dgim", "llegadas_mes"),
        ("04_Flujos", "a_dgim", "serie"),
        ("04_Flujos", "a_dgim", "serie_ventanas"),
        ("04_Flujos", "a_dgim", "tradeoff"),
        ("04_Flujos", "a_dgim", "variacion"),
        ("04_Flujos", "a_dgim", "resumen"),
        ("04_Flujos", "b_bloom", "reincidencia_mes"),
        ("04_Flujos", "b_bloom", "postor_reincidencia"),
        ("04_Flujos", "b_bloom", "fpr_evolucion"),
        ("04_Flujos", "b_bloom", "tradeoff"),
        ("04_Flujos", "b_bloom", "variacion"),
        ("04_Flujos", "b_bloom", "resumen"),
        ("04_Flujos", "c_sketch", "heavy_hitters"),
        ("04_Flujos", "c_sketch", "error_dist"),
        ("04_Flujos", "c_sketch", "tradeoff"),
        ("04_Flujos", "c_sketch", "variacion"),
        ("04_Flujos", "c_sketch", "resumen"),
        ("04_Flujos", "d_analisis", "comparativa"),
    ],
    "08_reglas": [
        ("05_Asociacion", "d_analisis", "seleccion"),
        ("05_Asociacion", "d_analisis", "supervivencia"),
    ],
    "09_resumen": [
        ("06_Analisis", "a_recuento", "tecnicas_resumen"),
        ("06_Analisis", "b_hallazgos", "respuestas"),
        ("06_Analisis", "b_hallazgos", "reglas_p1"),
        ("06_Analisis", "c_insights", "valor_tecnicas"),
        ("06_Analisis", "c_insights", "donde_corre"),
        ("06_Analisis", "c_insights", "escalamiento"),
    ],
}


def origen(modulo, nb, carpeta="web"):
    return PROYECTO / modulo / "temp" / nb / carpeta


def leer_parquet(modulo, nb, tabla):
    ruta = PROYECTO / modulo / "temp" / nb / tabla
    if not ruta.exists():
        sys.exit(f"Falta {ruta.relative_to(PROYECTO)}: corre {modulo}/{nb}.ipynb")
    return pd.read_parquet(ruta)


def escribir(df, vista, nombre, fuente, manifiesto):
    destino = SALIDA / vista / f"{nombre}.json"
    destino.parent.mkdir(parents=True, exist_ok=True)
    df.to_json(destino, orient="records", force_ascii=False, date_format="iso", indent=1)
    manifiesto.setdefault(vista, []).append({"archivo": f"{vista}/{nombre}.json", "origen": fuente, "filas": len(df)})


def lista_a_texto(df, columnas):
    return df.assign(**{c: df[c].map(list) for c in columnas})


def extras(manifiesto):
    for nb, tabla, nombre in [("c_reglas", "fpg_full", "reglas_completo"), ("c_reglas", "apriori_q4", "reglas_q4_2025"),
                              ("b_itemsets", "fpg_full", "itemsets_completo")]:
        df = leer_parquet("05_Asociacion", nb, tabla)
        df = lista_a_texto(df, [c for c in ("antecedente", "consecuente", "items") if c in df.columns])
        escribir(df.round(6), "08_reglas", f"{nb}/{nombre}", f"05_Asociacion/temp/{nb}/{tabla}", manifiesto)

    var = pd.read_json(origen("03_ANN", "e_analisis") / "variacion_monto.json")
    l2 = np.log2(var["ratio"]).clip(-6, 6)
    bordes = np.arange(-6, 6.25, .25)
    conteo, _ = np.histogram(l2, bins=bordes)
    hist = pd.DataFrame({"log2_desde": bordes[:-1], "log2_hasta": bordes[1:], "consultas": conteo})
    escribir(hist, "06_vecinos", "e_analisis/ratio_hist", "03_ANN/temp/e_analisis/web/variacion_monto.json (histograma)", manifiesto)
    resumen = pd.DataFrame([{"consultas": len(var), "mediana": var["ratio"].median(), "p25": var["ratio"].quantile(.25),
                             "p75": var["ratio"].quantile(.75), "pct_2x": (var["ratio"] >= 2).mean() * 100,
                             "pct_5x": (var["ratio"] >= 5).mean() * 100}]).round(3)
    escribir(resumen, "06_vecinos", "e_analisis/ratio_resumen", "03_ANN/temp/e_analisis/web/variacion_monto.json (resumen)", manifiesto)


def main():
    faltan = [f"{m}/temp/{nb}/web/{t}.json" for tablas in VISTAS.values() for m, nb, t in tablas
              if not (origen(m, nb) / f"{t}.json").exists()]
    if faltan:
        sys.exit("Faltan tablas (corre los notebooks correspondientes):\n  " + "\n  ".join(faltan))

    if SALIDA.exists():
        shutil.rmtree(SALIDA)
    manifiesto = {}
    for vista, tablas in VISTAS.items():
        for modulo, nb, tabla in tablas:
            # subcarpeta por notebook: varios notebooks exportan tablas con el mismo nombre (resumen, tradeoff, ...)
            destino = SALIDA / vista / nb / f"{tabla}.json"
            destino.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(origen(modulo, nb) / f"{tabla}.json", destino)
            filas = len(json.loads(destino.read_text()))
            manifiesto.setdefault(vista, []).append({"archivo": f"{vista}/{nb}/{tabla}.json", "origen": f"{modulo}/temp/{nb}/web/{tabla}.json", "filas": filas})
    extras(manifiesto)

    (SALIDA / "manifest.json").write_text(json.dumps(manifiesto, ensure_ascii=False, indent=1))
    n = sum(len(v) for v in manifiesto.values())
    mb = sum(p.stat().st_size for p in SALIDA.rglob("*.json")) / 1024 ** 2
    print(f"web/data: {n} archivos en {len(manifiesto)} vistas ({mb:.1f} MB)")
    for vista, archivos in manifiesto.items():
        print(f"  {vista}: {len(archivos)}")


if __name__ == "__main__":
    main()
