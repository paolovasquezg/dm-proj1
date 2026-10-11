import { cifras, encabezado, puntos } from "../comun.js";

export const diapos = [{
  etapa: "Fuentes",
  render(el) {
    el.innerHTML = encabezado("Fuentes y referencias", "Datos, métodos y herramientas usados en el proyecto")
      + `<div class="fila">
        <div class="tarjeta"><h3>Datos</h3>${puntos([
          'OECE — Contrataciones Abiertas, descargas OCDS 2023–2025: <a href="https://contratacionesabiertas.oece.gob.pe/descargas">contratacionesabiertas.oece.gob.pe</a>',
          'Open Contracting Data Standard (OCDS): <a href="https://standard.open-contracting.org/">standard.open-contracting.org</a>',
          'BCRP — tipo de cambio promedio mensual para convertir montos a soles: <a href="https://estadisticas.bcrp.gob.pe/">estadisticas.bcrp.gob.pe</a>',
        ])}</div>
        <div class="tarjeta"><h3>Métodos y herramientas</h3>${puntos([
          'Leskovec, Rajaraman y Ullman — <i>Mining of Massive Datasets</i>, cap. 3 (MinHash, LSH), 4 (DGIM, Bloom, flujos) y 6 (itemsets frecuentes): <a href="http://www.mmds.org/">mmds.org</a>',
          'Cormode y Muthukrishnan (2005) — <i>An improved data stream summary: the Count-Min Sketch</i>',
          'Malkov y Yashunin (2018) — <i>Efficient and robust approximate nearest neighbor search using HNSW graphs</i>',
          'Apache Spark 3.5 (DataFrame, MLlib: HashingTF, IDF, KMeans, FPGrowth) · faiss (Meta) · mlxtend (Apriori) · Plotly',
        ])}</div>
      </div>`;
  },
}, {
  etapa: "",
  render(el) {
    el.innerHTML = `<section class="portada">
      <span class="etiqueta">Gracias</span>
      <h1>Las señales de riesgo existen, son pocas y tienen nombre</h1>
      <p class="bajada">La minería de datos convierte 236 mil procesos en una lista corta para revisar: los métodos sin competencia, las compras divididas de unas pocas entidades y el 12% que paga el doble que compras parecidas</p>
      ${cifras([["11%", "procesos con un solo postor"], ["0.66%", "procesos con patrón de fraccionamiento"], ["12%", "paga ≥ 2x frente a compras parecidas"]])}
      <p class="pie">Código y notebooks: <a href="https://github.com/paolovasquezg/dm-proj1">github.com/paolovasquezg/dm-proj1</a> · Datos: Contrataciones Abiertas — OECE</p>
    </section>`;
  },
}];
