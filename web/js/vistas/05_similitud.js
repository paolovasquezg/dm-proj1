import { datos, encabezado, puntos, caja, cifras, proceso, chips, graficar, barra, barraH, linea, puntosXY, pestanas, num, pct, C } from "../comun.js";

const D = "05_similitud";
const elegido = (cond) => (r) => (cond(r) ? C.azul : C.gris);

// curva S de LSH: probabilidad de ser candidato según la similitud
function curvaS(b, r) {
  const s = Array.from({ length: 101 }, (_, i) => i / 100);
  return { s, p: s.map(x => 1 - Math.pow(1 - Math.pow(x, r), b)), umbral: Math.pow(1 / b, 1 / r) };
}

export const diapos = [
  {
    etapa: "5 · Similitud (P2)",
    async render(el) {
      el.innerHTML = encabezado("Similitud: encontrar compras casi idénticas sin comparar todo",
        "Comparar cada proceso con todos los de su entidad son 3.3 millones de pares. MinHash + LSH reduce eso a los candidatos que probablemente se parecen")
        + proceso([
          ["Texto", "descripción + ítems, normalizado"],
          ["Shingles k=5", "trozos de 5 caracteres"],
          ["MinHash", "firma de <code>T</code>=100 números que resume el texto"],
          ["LSH", "<code>b</code>=10 bandas × <code>r</code>=10 filas: solo se comparan firmas que coinciden en alguna banda", true],
          ["Verificación", "misma entidad, ≤ 15 días y Jaccard exacto ≥ 0.90"],
          ["Filtros P2", "montos bajos, salto de tramo y método menos exigente"],
        ])
        + cifras([["3.3 M", "pares por fuerza bruta"], ["163 mil", "candidatos LSH (−95%)"], ["131 mil", "pares casi idénticos"], ["99.99%", "recall (pierde 9 pares)"]])
        + `<div class="fila"><div>
            <h2>Prueba la curva de LSH</h2>
            <div class="controles">
              <label>bandas <code>b</code> <input type="range" id="s-b" min="2" max="25" value="10"><output id="o-b"></output></label>
              <label>filas <code>r</code> <input type="range" id="s-r" min="2" max="20" value="10"><output id="o-r"></output></label>
            </div>
            ${puntos([
              "Cada proceso con similitud <code>s</code> pasa como candidato con probabilidad <code>1 − (1 − sʳ)ᵇ</code>",
              "<b>Umbral</b> ≈ <code>(1/b)^(1/r)</code>: debe quedar bajo 0.90 para no perder pares reales",
              "Más bandas → más candidatos (más trabajo); más filas → curva más empinada (más riesgo de perder pares)",
            ])}
            <p class="lectura" id="lectura-s"></p>
          </div>${caja("g-curva", "Probabilidad de ser candidato según la similitud")}</div>`;
      const dibujar = () => {
        const b = +document.getElementById("s-b").value, r = +document.getElementById("s-r").value;
        document.getElementById("o-b").textContent = b; document.getElementById("o-r").textContent = r;
        const { s, p, umbral } = curvaS(b, r), p90 = 1 - Math.pow(1 - Math.pow(0.9, r), b);
        graficar("g-curva", [
          linea(s, p, { name: `b=${b}, r=${r}`, hovertemplate: "similitud %{x:.2f} → %{y:.1%}<extra></extra>" }),
          linea([0.9, 0.9], [0, 1], { line: { color: C.naranja, dash: "dot", width: 2 }, name: "Jaccard 0.90 (casi idéntico)", hoverinfo: "skip" }),
        ], { xaxis: { title: "similitud de Jaccard", range: [0, 1] }, yaxis: { title: "P(candidato)", tickformat: ".0%", range: [0, 1.02] } });
        document.getElementById("lectura-s").innerHTML = `Firma de <b>${b * r}</b> hashes · umbral <b>${umbral.toFixed(2)}</b> · un par con similitud 0.90 entra con probabilidad <b>${pct(p90 * 100, 1)}</b>`
          + (umbral > 0.9 ? " — <b>se perderían pares reales</b>" : "");
      };
      ["s-b", "s-r"].forEach(id => document.getElementById(id).addEventListener("input", dibujar));
      dibujar();
    },
  },
  {
    etapa: "5 · Similitud (P2)",
    async render(el) {
      el.innerHTML = encabezado("Similitud: ¿qué pasa si cambiamos los parámetros?",
        "Cada parámetro se varió manteniendo los demás fijos, evaluando contra la fuerza bruta de los 36 meses. En azul, el valor elegido")
        + `<div class="pestanas" id="tabs"></div><div class="fila">${caja("g1", "", "", "")}${caja("g2", "", "", "")}</div><p class="lectura" id="lectura"></p>`;
      const [rep, T, br, cub, umb] = await Promise.all(["a_minhash/representacion", "a_minhash/longitud_T", "b_lsh/configs_br", "b_lsh/cubetas", "b_lsh/umbral"].map(t => datos(`${D}/${t}`)));
      const titulo = (id, t) => (document.querySelector(`#${id}`).previousElementSibling.textContent = t);
      const vistas = {
        k() {
          titulo("g1", "Similitud falsa: Jaccard p99 entre pares al azar"); titulo("g2", "Casi idénticos no idénticos detectados (J ≥ 0.90)");
          const col = rep.map(elegido(r => r.representacion === "k=5"));
          graficar("g1", [barra(rep.map(r => r.representacion), rep.map(r => r.azar_p99), { marker: { color: col }, hovertemplate: "%{x}: %{y:.2f}<extra></extra>" })]);
          graficar("g2", [barra(rep.map(r => r.representacion), rep.map(r => r.ventana_no_identicos_ge_umbral), { marker: { color: col }, hovertemplate: "%{x}: %{y:,}<extra></extra>" })]);
          return "k=3 confunde textos distintos; k=7 pierde 29% de casi-duplicados; palabras junta textos como “con/sin ficha técnica”. <b>k=5</b> equilibra ambos";
        },
        T() {
          titulo("g1", "Error de MinHash vs Jaccard exacto"); titulo("g2", "Tiempo de firmar los 236 mil procesos (s)");
          graficar("g1", [puntosXY(T.map(r => r.T), T.map(r => r.MAE), { name: "error medido" }),
            puntosXY(T.map(r => r.T), T.map(r => r.error_teorico), { name: "teórico 1/(2√T)", line: { color: C.tenue, dash: "dot", width: 2 } })], { xaxis: { title: "T" } });
          graficar("g2", [barra(T.map(r => `T=${r.T}`), T.map(r => r.seg_firmas), { marker: { color: T.map(elegido(r => r.T === 100)) }, hovertemplate: "%{x}: %{y:.0f} s<extra></extra>" })]);
          return "Duplicar <code>T</code> de 100 a 200 casi duplica el tiempo para bajar el error solo de 0.027 a 0.016. <b>T=100</b> es suficiente";
        },
        br() {
          titulo("g1", "Precisión y recall de LSH"); titulo("g2", "Candidatos a verificar (miles)");
          const x = br.map(r => `(${r.b}, ${r.r})`);
          graficar("g1", [barra(x, br.map(r => r.recall), { name: "recall", marker: { color: C.azul } }),
            barra(x, br.map(r => r.precision), { name: "precisión", marker: { color: C.aqua } })], { yaxis: { tickformat: ".0%", range: [0, 1.05] }, barmode: "group" });
          graficar("g2", [barra(x, br.map(r => r.candidatos / 1e3), { marker: { color: br.map(elegido(r => r.b === 10)) }, hovertemplate: "%{x}: %{y:,.0f} mil<extra></extra>" })]);
          return "(20, 5) duplica los candidatos; (5, 20) pierde 945 pares reales. <b>(10, 10)</b> no pierde casi nada con 95% menos comparaciones";
        },
        cub() {
          titulo("g1", "Candidatos (miles)"); titulo("g2", "Precisión");
          const x = cub.map(r => r.cubetas === "2^32" ? "2³²" : num(+r.cubetas));
          const col = cub.map(elegido(r => r.cubetas === "2^32"));
          graficar("g1", [barra(x, cub.map(r => r.candidatos / 1e3), { marker: { color: col } })]);
          graficar("g2", [barra(x, cub.map(r => r.precision), { marker: { color: col } })], { yaxis: { tickformat: ".0%" } });
          return "Con solo 100 cubetas, textos distintos chocan y los candidatos se triplican. Con <b>2³²</b> (el hash completo) casi no hay choques";
        },
        umb() {
          titulo("g1", "Pares casi idénticos según el umbral"); titulo("g2", "Recall de LSH");
          const x = umb.map(r => String(r.UMBRAL)), col = umb.map(elegido(r => r.UMBRAL === 0.9));
          graficar("g1", [barra(x, umb.map(r => r.GT), { marker: { color: col }, hovertemplate: "J ≥ %{x}: %{y:,} pares<extra></extra>" })]);
          graficar("g2", [barra(x, umb.map(r => r.recall), { marker: { color: col } })], { yaxis: { tickformat: ".1%", range: [0.97, 1.001] } });
          return "Con 0.80 el umbral queda pegado al de LSH (0.79) y se pierden 1,694 pares; con 0.95 casi no cambia. <b>0.90</b> es estable";
        },
      };
      pestanas(document.getElementById("tabs"), [
        { id: "k", texto: "Shingles k" }, { id: "T", texto: "Firma T" }, { id: "br", texto: "Bandas (b, r)" },
        { id: "cub", texto: "Cubetas" }, { id: "umb", texto: "Umbral Jaccard" },
      ], id => (document.getElementById("lectura").innerHTML = vistas[id]()), "br");
    },
  },
  {
    etapa: "5 · Similitud (P2)",
    async render(el) {
      el.innerHTML = encabezado("Resultado P2: repetir compras es común, fraccionar es raro",
        "Sobre los pares casi idénticos se aplican las condiciones del fraccionamiento, una tras otra")
        + `<div class="fila">${caja("g-embudo", "Procesos que pasan cada filtro", "", "alto")}${caja("g-rank", "Entidades con más procesos repetidos (≥ 50 procesos)", "gris: casi idénticos · azul: exclusivos (patrón completo)", "alto")}</div>`
        + puntos([
          "<b>1 de cada 6 procesos</b> tiene un gemelo casi idéntico de la misma entidad en 15 días: plantillas y compras rutinarias",
          "<b>Solo 1,549 (0.66%)</b> cumplen todo el patrón: montos bajos, la suma sube de tramo y el método sería raro para el total",
          "<b>OEFA concentra el 90%:</b> cientos de servicios de terceros el mismo día por Régimen Especial; sin OEFA quedan 161 procesos",
          "<b>Repetir no es fraccionar:</b> institutos viales repiten 55–67% de sus procesos, pero ninguno cumple el patrón",
        ]);
      const [emb, rank] = await Promise.all([datos(`${D}/d_entidades/embudo_exclusivo`), datos(`${D}/d_entidades/ranking`)]);
      const e = [...emb].reverse(), nivel = e.map(r => r.nivel.replace(/^\d\. /, ""));
      graficar("g-embudo", [barraH(nivel, e.map(r => r.procesos), {
        marker: { color: e.map((_, i) => (i === 0 ? C.naranja : C.azul)) }, text: e.map(r => `${num(r.procesos)} (${pct(r.pct_procesos, 2)})`),
        textposition: "outside", hovertemplate: "%{y}: %{x:,} procesos<extra></extra>" })], { margin: { l: 230 }, xaxis: { range: [0, 68000], tickvals: [0, 20000, 40000], ticktext: ['0', '20 mil', '40 mil'] } });
      const r = rank.slice(0, 10).reverse(), n = r.map(x => x.entidad.slice(0, 34));
      graficar("g-rank", [barraH(n, r.map(x => x.rate * 100), { name: "casi idénticos", marker: { color: C.gris } }),
        barraH(n, r.map(x => x.rate_exclusivo * 100), { name: "exclusivos", marker: { color: C.azul } })],
        { barmode: "overlay", xaxis: { ticksuffix: "%" }, margin: { l: 230 }, yaxis: { tickfont: { size: 10 } } });
    },
  },
];
