import { datos, encabezado, puntos, caja, cifras, proceso, graficar, barra, barraH, linea, puntosXY, pestanas, num, pct, C } from "../comun.js";

const D = "06_vecinos";
const elegido = (cond) => (r) => (cond(r) ? C.azul : C.gris);

export const diapos = [
  {
    etapa: "6 · Vecinos (P3)",
    async render(el) {
      el.innerHTML = encabezado("Análisis de Precios con ANN (P3)",
        "Para cada proceso se buscan los 10 más parecidos por su descripción y se compara su monto. El índice IVF evita compararlo con los 236 mil")
        + proceso([
          ["Texto", "palabras sin conectores (<code>tokens</code>)"],
          ["TF-IDF", "vector de 4,096 casillas: pesan más las palabras raras"],
          ["Índice IVF", "KMeans agrupa los vectores en 300 listas por tema", true],
          ["Búsqueda", "revisa las 2 listas más cercanas, misma categoría; top 10 por coseno"],
          ["Comparación", "vecinos con coseno ≥ 0.80 → monto / mediana de vecinos"],
        ])
        + cifras([["20,062", "procesos consultados"], ["97.3%", "comparaciones evitadas"], ["14.7x", "más rápido que la fuerza bruta"], ["75%", "de los vecinos exactos encontrados"]])
        + `<div class="fila">${caja("g-faiss", "IVF vs HNSW (faiss, 20 mil vectores)", "cada punto es una configuración; arriba a la izquierda es mejor")}<div>`
        + puntos([
          "<b>IVF:</b> Spark revisa listas temáticas sobre el corpus completo.",
          "<b>HNSW:</b> Logra 98% recall y 21× aceleración en memoria local.",
          "<b>Decisión P3:</b> IVF recupera eficazmente vecinos con coseno ≥0.80.",
        ]) + "</div></div>";
      const [ivf, hnsw, comp] = await Promise.all([datos(`${D}/d_faiss/ivf_nprobe`), datos(`${D}/d_faiss/hnsw_efsearch`), datos(`${D}/d_faiss/comparacion`)]);
      const fb = comp.find(r => r.metodo === "fuerza bruta");
      graficar("g-faiss", [
        puntosXY(ivf.map(r => r.ms_por_consulta), ivf.map(r => r.recall_at_k), { name: "IVF (nprobe)", text: ivf.map(r => `nprobe=${r.nprobe}`), hovertemplate: "%{text}: recall %{y:.0%} · %{x:.2f} ms<extra></extra>" }),
        puntosXY(hnsw.map(r => r.ms_por_consulta), hnsw.map(r => r.recall_at_k), { name: "HNSW (efSearch)", line: { color: C.naranja, width: 2 }, text: hnsw.map(r => `efSearch=${r.efSearch}`), hovertemplate: "%{text}: recall %{y:.0%} · %{x:.2f} ms<extra></extra>" }),
        { type: "scatter", mode: "markers", x: [fb.ms_por_consulta], y: [1], name: "fuerza bruta", marker: { color: C.tinta2, size: 10, symbol: "diamond" }, hovertemplate: "fuerza bruta: %{x:.1f} ms<extra></extra>" },
      ], { xaxis: { title: "ms por consulta (log)", type: "log", tickvals: [0.1, 0.2, 0.5, 1, 2, 5, 10], ticktext: ["0.1", "0.2", "0.5", "1", "2", "5", "10"] }, yaxis: { title: "recall@10", tickformat: ".0%" } });
    },
  },
  {
    etapa: "6 · Vecinos (P3)",
    async render(el) {
      el.innerHTML = encabezado("Sensibilidad de Parámetros ANN",
        "Cada parámetro se varió con los demás fijos. En azul, el valor elegido")
        + `<div class="pestanas" id="tabs"></div><div class="fila">${caja("g1", "")}${caja("g2", "")}</div><p class="lectura" id="lectura"></p>`;
      const [nf, np_, nl, us, vp] = await Promise.all(["a_tfidf/num_features", "c_bus_ivf/nprobe", "c_bus_ivf/nlist", "e_analisis/umbral_sim", "e_analisis/variacion_p3"].map(t => datos(`${D}/${t}`)));
      const titulo = (id, t) => (document.querySelector(`#${id}`).previousElementSibling.textContent = t);
      const vistas = {
        nf() {
          titulo("g1", "Error del coseno por colisiones del hashing"); titulo("g2", "Palabras que comparten casilla");
          const x = nf.map(r => num(r.NUM_FEATURES)), col = nf.map(elegido(r => r.NUM_FEATURES === 4096));
          graficar("g1", [barra(x, nf.map(r => r.MAE_coseno), { marker: { color: col } })]);
          graficar("g2", [barra(x, nf.map(r => r.tokens_por_dim), { marker: { color: col } })]);
          return "<b>4,096 dimensiones:</b> Reducen el error sin cuadruplicar memoria.";
        },
        np() {
          titulo("g1", "Recall@10 frente a la fuerza bruta"); titulo("g2", "% del índice revisado por consulta");
          const x = np_.map(r => `NPROBE=${r.NPROBE}`), col = np_.map(elegido(r => r.NPROBE === 2));
          graficar("g1", [barra(x, np_.map(r => r["recall@K"]), { marker: { color: col } })], { yaxis: { tickformat: ".0%", range: [0, 1] } });
          graficar("g2", [barra(x, np_.map(r => r.frac_indice_revisado * 100), { marker: { color: col } })], { yaxis: { ticksuffix: "%" } });
          return "<b>NPROBE=2:</b> Alcanza 75% recall revisando 2.7% del índice.";
        },
        nl() {
          titulo("g1", "Recall@10 según el número de listas"); titulo("g2", "Tiempo de KMeans (s)");
          const x = nl.map(r => `NLIST=${r.NLIST}`), col = nl.map(elegido(r => r.NLIST === 300));
          graficar("g1", [barra(x, nl.map(r => r["recall@K"]), { marker: { color: col } })], { yaxis: { tickformat: ".0%", range: [0, 1] } });
          graficar("g2", [barra(x, nl.map(r => r.seg_kmeans), { marker: { color: col } })]);
          return "<b>NLIST=300:</b> Equilibra recall, búsqueda y entrenamiento.";
        },
        us() {
          titulo("g1", "Pares “muy parecidos” según el umbral de coseno"); titulo("g2", "% de consultas que pagan ≥ 2x a sus vecinos");
          const x = us.map(r => `≥ ${r.UMBRAL_SIM}`), col = us.map(elegido(r => r.UMBRAL_SIM === 0.8));
          graficar("g1", [barra(x, us.map(r => r.pares), { marker: { color: col } })]);
          graficar("g2", [barra(x, us.map(r => r.frac_paga_2x * 100), { marker: { color: col } })], { yaxis: { ticksuffix: "%", range: [0, 20] } });
          return "<b>Mayor similitud:</b> Reduce de 15% a 8% los pagos ≥2×.";
        },
        vp() {
          titulo("g1", "% que paga ≥ 2x según K y NPROBE"); titulo("g2", "Diferencia mediana de monto (veces)");
          const x = vp.map(r => `${r.parametro}=${r.valor}`), col = vp.map(elegido(r => r.elegido));
          graficar("g1", [barra(x, vp.map(r => r.pct_paga_2x), { marker: { color: col } })], { yaxis: { ticksuffix: "%", range: [0, 15] } });
          graficar("g2", [barra(x, vp.map(r => r.ratio_misma_entidad), { name: "misma entidad", marker: { color: C.azul } }),
            barra(x, vp.map(r => r.ratio_otra_entidad), { name: "otra entidad", marker: { color: C.naranja } })], { barmode: "group" });
          return "<b>Resultado robusto:</b> ~11.5% paga ≥2× bajo cualquier configuración.";
        },
      };
      pestanas(document.getElementById("tabs"), [
        { id: "nf", texto: "Dimensiones TF-IDF" }, { id: "np", texto: "Listas revisadas (NPROBE)" }, { id: "nl", texto: "Número de listas (NLIST)" },
        { id: "us", texto: "Umbral de similitud" }, { id: "vp", texto: "Efecto en la respuesta" },
      ], id => (document.getElementById("lectura").innerHTML = vistas[id]()), "np");
    },
  },
  {
    etapa: "6 · Vecinos (P3)",
    async render(el) {
      el.innerHTML = encabezado("Dispersión de Precios entre Entidades",
        "Ratio = monto del proceso / mediana del monto de sus vecinos muy parecidos")
        + `<div class="fila">${caja("g-hist", "¿Cuánto paga cada proceso frente a sus vecinos?", "10,433 procesos con vecinos muy parecidos")}${caja("g-tipo", "Pares muy parecidos donde uno paga ≥ 2x que el otro")}</div>`
        + puntos([
          "<b>Mediana 1×:</b> La mitad paga entre 0.90× y 1.25×.",
          "<b>Cola crítica:</b> 12% paga ≥2× y 3% paga ≥5×.",
          "<b>Brecha institucional:</b> Entre entidades, 50–59% difiere ≥2×.",
          "<b>Límite:</b> Montos totales sin cantidades pueden simular sobreprecios.",
        ]);
      const [hist, tipo] = await Promise.all([datos(`${D}/e_analisis/ratio_hist`), datos(`${D}/e_analisis/otra_region`)]);
      const etq = { "-4": "1/16x", "-2": "1/4x", "-1": "1/2x", "0": "1x", "1": "2x", "2": "4x", "4": "16x" };
      const centros = hist.map(r => (r.log2_desde + r.log2_hasta) / 2);
      graficar("g-hist", [
        barra(centros, hist.map(r => r.log2_desde < 1 ? r.consultas : null), {
          name: "Rango normal", marker: { color: C.azul }, hovertemplate: "%{y:,} procesos<extra></extra>",
        }),
        barra(centros, hist.map(r => r.log2_desde >= 1 ? r.consultas : null), {
          name: "Alerta sobreprecio >2×", marker: { color: C.naranja }, hovertemplate: "%{y:,} procesos<extra></extra>",
        }),
      ], { barmode: "overlay", bargap: 0.05, xaxis: { range: [-4, 4], tickvals: Object.keys(etq).map(Number), ticktext: Object.values(etq), title: "monto frente a sus vecinos" } });
      const tipos = [["misma entidad", C.gris], ["otra entidad, misma región", C.azul], ["otra región", C.naranja]];
      const cats = [["GOODS", "Bienes"], ["SERVICES", "Servicios"]];
      graficar("g-tipo", tipos.map(([t, c]) => barra(cats.map(x => x[1]), cats.map(([k]) => (tipo.find(r => r.tipo === t && r.categoria === k) || {}).pct_2x_o_mas),
        { name: t, marker: { color: c }, hovertemplate: `${t}: %{y:.1f}%<extra></extra>` })), { barmode: "group", yaxis: { ticksuffix: "%", range: [0, 70] } });
    },
  },
];
