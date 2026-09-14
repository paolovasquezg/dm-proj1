#!/usr/bin/env python3
"""
Diagnóstico de la estructura real de los JSON de la OECE.

Responde las preguntas que hacen falta para ajustar el notebook de la Parte I
y para decidir la representación de la Parte II:

  1. ¿Qué envoltorio traen los archivos?
  2. ¿Dónde viven los items y con qué frecuencia?
  3. ¿Qué esquemas de clasificación hay y con qué cardinalidad?
  4. ¿Qué campo de fecha sirve como eje temporal de 2025?
  5. ¿Son viables los conjuntos para Jaccard?

Uso:
    python3 diagnostico.py              # todos los archivos de data/
    python3 diagnostico.py data/1.json  # uno solo (más rápido)
"""

import os
import sys
from pathlib import Path

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import ArrayType, StructType

os.environ.setdefault("PYSPARK_PYTHON", sys.executable)
os.environ.setdefault("PYSPARK_DRIVER_PYTHON", sys.executable)


def schema_paths(schema, prefix=""):
    out = []
    for f in schema.fields:
        p = f"{prefix}{f.name}"
        out.append(p)
        dt = f.dataType
        if isinstance(dt, StructType):
            out += schema_paths(dt, p + ".")
        elif isinstance(dt, ArrayType) and isinstance(dt.elementType, StructType):
            out += schema_paths(dt.elementType, p + ".")
    return out


def has(df, path):
    return path.lower() in {p.lower() for p in schema_paths(df.schema)}


def titulo(t):
    print(f"\n{'='*72}\n{t}\n{'='*72}")


def main():
    archivos = ([sys.argv[1]] if len(sys.argv) > 1
                else sorted((Path("data")).glob("*.json"),
                            key=lambda p: (len(p.stem), p.stem)))
    archivos = [str(a) for a in archivos]
    if not archivos:
        sys.exit("No hay JSON en data/")

    spark = (SparkSession.builder
             .appName("Diagnostico-OCDS")
             .master("local[*]")
             .config("spark.driver.memory", "8g")
             .config("spark.sql.caseSensitive", "false")
             .getOrCreate())
    spark.sparkContext.setLogLevel("ERROR")

    titulo("1. ENVOLTORIO DEL PAQUETE")
    raw = (spark.read.option("multiLine", "true").option("mode", "PERMISSIVE")
           .json(archivos))
    top = {f.name.lower() for f in raw.schema.fields}
    print(f"Archivos leídos      : {len(archivos)}")
    print(f"Claves de primer nivel: {sorted(top)}")

    if "records" in top:
        formato = "RECORD PACKAGE"
        rec = raw.select(F.explode("records").alias("rec"))
        if has(rec, "rec.compiledRelease"):
            df = rec.select("rec.compiledRelease.*")
            print("Formato              : record package con compiledRelease")
        else:
            df = rec.select(F.explode("rec.releases").alias("r")).select("r.*")
            print("Formato              : record package SIN compiledRelease")
    elif "releases" in top:
        formato = "RELEASE PACKAGE"
        df = raw.select(F.explode("releases").alias("r")).select("r.*")
        print("Formato              : release package")
    else:
        formato = "ARREGLO PLANO"
        df = raw
        print("Formato              : arreglo plano de releases")

    df.cache()
    n = df.count()
    print(f"Procesos (filas)     : {n:,}")
    print(f"Columnas             : {[f.name for f in df.schema.fields]}")

    # ----------------------------------------------------------------- #
    titulo("2. DÓNDE VIVEN LOS ITEMS")
    ubicaciones = ["tender.items", "awards.items", "contracts.items"]
    for u in ubicaciones:
        if not has(df, u):
            print(f"{u:<20} NO EXISTE")
            continue
        if u == "tender.items":
            cnt = F.size(F.coalesce(F.col(u), F.array()))
        else:
            # items dentro de un array: hay que aplanar dos niveles
            cnt = F.size(F.coalesce(F.flatten(F.col(u)), F.array()))
        r = df.select(cnt.alias("k")).agg(
            F.sum(F.when(F.col("k") > 0, 1).otherwise(0)).alias("procesos_con_items"),
            F.round(F.avg("k"), 2).alias("media"),
            F.expr("percentile_approx(k, 0.5)").alias("mediana"),
            F.max("k").alias("maximo"),
        ).first()
        print(f"{u:<20} procesos con items: {r['procesos_con_items']:>7,} "
              f"({100*r['procesos_con_items']/n:5.1f}%) | "
              f"media={r['media']:<6} mediana={r['mediana']:<4} max={r['maximo']}")

    # ----------------------------------------------------------------- #
    titulo("3. ESQUEMAS DE CLASIFICACIÓN Y CARDINALIDAD")

    def perfilar_items(expr_items, etiqueta):
        it = df.select(F.explode(expr_items).alias("i")).filter(F.col("i").isNotNull())
        if it.count() == 0:
            print(f"\n[{etiqueta}] sin items")
            return
        print(f"\n[{etiqueta}] {it.count():,} items")

        if has(it, "i.classification.scheme"):
            print("  classification.scheme:")
            it.groupBy("i.classification.scheme").count().orderBy(F.desc("count")).show(5, False)
            d = it.select("i.classification.id").distinct().count()
            print(f"  códigos distintos en classification: {d:,}")

        if has(it, "i.additionalClassifications.scheme"):
            ac = it.select(F.explode_outer("i.additionalClassifications").alias("ac")) \
                   .filter(F.col("ac").isNotNull())
            if ac.count() > 0:
                print("  additionalClassifications.scheme:")
                ac.groupBy("ac.scheme").count().orderBy(F.desc("count")).show(5, False)
                for esquema in [r[0] for r in ac.select("ac.scheme").distinct().collect()]:
                    sub = ac.where(F.col("ac.scheme") == esquema)
                    print(f"  [{esquema}] códigos distintos: "
                          f"{sub.select('ac.id').distinct().count():,}")
                    # Niveles jerárquicos UNSPSC: 2=segmento 4=familia 6=clase 8=commodity
                    if esquema and "UNSPSC" in esquema.upper():
                        for k in (2, 4, 6, 8):
                            c = sub.select(F.substring("ac.id", 1, k)).distinct().count()
                            print(f"      prefijo {k} dígitos -> {c:,} valores distintos")

    if has(df, "tender.items"):
        perfilar_items(F.col("tender.items"), "tender.items")
    if has(df, "contracts.items"):
        perfilar_items(F.flatten("contracts.items"), "contracts.items")
    if has(df, "awards.items"):
        perfilar_items(F.flatten("awards.items"), "awards.items")

    # ----------------------------------------------------------------- #
    titulo("4. CAMPOS DE FECHA — ¿CUÁL SIRVE COMO EJE DE 2025?")

    def anio(col):
        return F.year(F.to_timestamp(F.substring(col.cast("string"), 1, 19),
                                     "yyyy-MM-dd'T'HH:mm:ss"))

    candidatos = {
        "date (del compiledRelease)": F.col("date") if has(df, "date") else None,
        "tender.tenderPeriod.startDate":
            F.col("tender.tenderPeriod.startDate") if has(df, "tender.tenderPeriod.startDate") else None,
        "awards[0].date":
            F.element_at(F.col("awards.date"), 1) if has(df, "awards.date") else None,
        "contracts[0].dateSigned":
            F.element_at(F.col("contracts.dateSigned"), 1) if has(df, "contracts.dateSigned") else None,
        "contracts[0].period.startDate":
            F.element_at(F.col("contracts.period.startDate"), 1) if has(df, "contracts.period.startDate") else None,
    }
    for nombre, col in candidatos.items():
        if col is None:
            print(f"{nombre:<32} NO EXISTE")
            continue
        a = df.select(anio(col).alias("y"))
        nulos = a.where(F.col("y").isNull()).count()
        en2025 = a.where(F.col("y") == 2025).count()
        rango = a.where(F.col("y").isNotNull()).agg(F.min("y"), F.max("y")).first()
        print(f"{nombre:<32} nulos={100*nulos/n:5.1f}%  en 2025={100*en2025/n:5.1f}%  "
              f"rango={rango[0]}-{rango[1]}")

    # ----------------------------------------------------------------- #
    titulo("5. VIABILIDAD DE JACCARD (Parte II)")

    # Se construye el conjunto UNSPSC uniendo las tres ubicaciones de items.
    trozos = []
    for ruta, plano in [("tender.items", False), ("awards.items", True), ("contracts.items", True)]:
        if not has(df, f"{ruta}.additionalClassifications.id"):
            continue
        base = F.flatten(F.col(ruta)) if plano else F.col(ruta)
        trozos.append(F.expr(
            f"flatten(transform({'flatten(' + ruta + ')' if plano else ruta}, "
            f"  i -> transform(filter(i.additionalClassifications, "
            f"                        c -> upper(c.scheme) = 'UNSPSC'), c -> c.id)))"))

    if trozos:
        conj = df.withColumn("unspsc", F.array_distinct(
            F.array_except(F.concat(*trozos), F.array(F.lit(None).cast("string")))))
        r = conj.select(F.size("unspsc").alias("k")).agg(
            F.round(F.avg("k"), 2).alias("media"),
            F.expr("percentile_approx(k, 0.5)").alias("mediana"),
            F.max("k").alias("maximo"),
            F.sum(F.when(F.col("k") == 0, 1).otherwise(0)).alias("vacios"),
            F.sum(F.when(F.col("k") == 1, 1).otherwise(0)).alias("unitarios"),
            F.sum(F.when(F.col("k") >= 3, 1).otherwise(0)).alias("con_3_o_mas"),
        ).first()
        print(f"Códigos UNSPSC por proceso: media={r['media']}  mediana={r['mediana']}  max={r['maximo']}")
        print(f"  conjuntos vacíos   : {r['vacios']:>7,} ({100*r['vacios']/n:5.1f}%)")
        print(f"  conjuntos unitarios: {r['unitarios']:>7,} ({100*r['unitarios']/n:5.1f}%)")
        print(f"  con 3 o más        : {r['con_3_o_mas']:>7,} ({100*r['con_3_o_mas']/n:5.1f}%)")
        print("\nLECTURA:")
        pct_util = 100 * r["con_3_o_mas"] / n
        if pct_util >= 40:
            print("  -> Los conjuntos UNSPSC sirven para Jaccard tal cual.")
        elif pct_util >= 15:
            print("  -> Conjuntos pobres. Conviene una representación híbrida:")
            print("     UNSPSC + shingles del título + atributos categóricos.")
        else:
            print("  -> Conjuntos inservibles por sí solos. La Parte II debe apoyarse")
            print("     en shingles del título/descripción, no en UNSPSC.")
    else:
        print("No hay additionalClassifications con esquema UNSPSC.")

    # Longitud del texto disponible para shingling
    for campo in ["tender.title", "tender.description"]:
        if has(df, campo):
            r = df.select(F.length(F.col(campo)).alias("L")).agg(
                F.round(F.avg("L"), 1).alias("media"),
                F.expr("percentile_approx(L, 0.5)").alias("mediana")).first()
            print(f"\nLongitud de {campo:<20} media={r['media']}  mediana={r['mediana']} caracteres")

    titulo("FIN")
    spark.stop()


if __name__ == "__main__":
    main()
