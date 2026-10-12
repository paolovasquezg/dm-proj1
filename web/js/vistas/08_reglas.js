import { datos, encabezado, puntos, caja, cifras, proceso, graficar, barra, barraH, tabla, num, pct, C } from "../comun.js";

const D = "08_reglas";
const $ = (id) => document.getElementById(id);
const texto = (items) => items.join(", ");
const regla = (r) => `${texto(r.antecedente)} → ${texto(r.consecuente)}`;
const esP1 = (r) => [...r.antecedente, ...r.consecuente].includes("comp=postor_unico");

export const diapos = [
  {
    etapa: "8 · Reglas de asociación (P1)",
    async render(el) {
      el.innerHTML = encabezado("Reglas de Asociación y Competencia",
        "Cada proceso es una “canasta” de características. Se buscan combinaciones frecuentes y las reglas del tipo {A, B} → {C}")
        + proceso([
          ["Canasta", "<code>met=CONTRATACIÓN DIRECTA</code>, <code>monto=2_50k-200k</code>, <code>reg=LIMA</code>, <code>comp=postor_unico</code>…"],
          ["Itemsets frecuentes", "combinaciones en ≥ 2% de los procesos (soporte)", true],
          ["Reglas", "{A} → {B} con confianza ≥ 50%"],
          ["Lift", "cuánto más probable es B dado A que en general"],
        ])
        + cifras([["304", "ítems distintos"], ["316", "itemsets frecuentes"], ["496", "reglas (FP-Growth, 3 años)"], ["36", "reglas con postor único"]])
        + `<div class="fila">${caja("g-tam", "Itemsets frecuentes por tamaño")}<div>`
        + puntos([
          "<b>Consistencia:</b> Apriori y FP-Growth coinciden en 304 itemsets trimestrales.",
          "<b>Soporte 2%:</b> Conserva combinaciones de volumen medio.",
          "<b>Confianza 50%:</b> Produce 496 reglas; 23–29% son redundantes.",
        ]) + "</div></div>";
      const its = await datos(`${D}/b_itemsets/itemsets_completo`);
      const tam = [1, 2, 3, 4, 5].map(n => its.filter(r => r.items.length === n).length);
      graficar("g-tam", [barra(["1", "2", "3", "4", "5"], tam, { text: tam.map(String), textposition: "outside", hovertemplate: "tamaño %{x}: %{y} itemsets<extra></extra>" })],
        { xaxis: { title: "ítems en el itemset" }, margin: { t: 24 } });
    },
  },
  {
    etapa: "8 · Reglas de asociación (P1)",
    async render(el) {
      el.innerHTML = encabezado("Explorador de Reglas de Asociación",
        "Filtra las reglas por soporte, confianza y lift. Cada punto es una regla; el color indica si involucra postor único")
        + `<div class="controles">
            <label>Datos <select id="c-datos"><option value="completo">2023–2025 (FP-Growth)</option><option value="q4">Q4 2025 (Apriori)</option></select></label>
            <label>Soporte ≥ <input type="range" id="c-sop" min="0.02" max="0.10" step="0.005" value="0.02"><output id="o-sop"></output></label>
            <label>Confianza ≥ <input type="range" id="c-conf" min="0.5" max="1" step="0.05" value="0.5"><output id="o-conf"></output></label>
            <label>Lift ≥ <input type="range" id="c-lift" min="1" max="10" step="0.5" value="1"><output id="o-lift"></output></label>
            <label><input type="checkbox" id="c-p1"> solo postor único</label>
            <label><input type="checkbox" id="c-red" checked> ocultar redundantes</label>
          </div>`
        + `<div class="fila">${caja("g-reglas", '<span id="n-reglas"></span>', "", "alto")}<div class="tarjeta"><h3>Top 10 por lift</h3><div class="scroll" id="t-top"></div></div></div>`;
      const [completo, q4] = await Promise.all([datos(`${D}/c_reglas/reglas_completo`), datos(`${D}/c_reglas/reglas_q4_2025`)]);
      const dibujar = () => {
        const base = $("c-datos").value === "q4" ? q4 : completo;
        const sop = +$("c-sop").value, conf = +$("c-conf").value, lift = +$("c-lift").value;
        $("o-sop").textContent = pct(sop * 100, 1); $("o-conf").textContent = pct(conf * 100, 0); $("o-lift").textContent = num(lift, 1);
        const f = base.filter(r => r.soporte >= sop && r.confianza >= conf && r.lift >= lift && (!$("c-p1").checked || esP1(r)) && (!$("c-red").checked || !r.redundante));
        $("n-reglas").textContent = `${num(f.length)} de ${num(base.length)} reglas cumplen los umbrales`;
        const grupo = (filtro, nombre, color) => { const g = f.filter(filtro);
          return { type: "scatter", mode: "markers", x: g.map(r => r.soporte), y: g.map(r => r.confianza), text: g.map(regla), name: nombre,
            marker: { color, size: g.map(r => 6 + r.lift * 1.6), line: { color: "#fff", width: 1 }, opacity: .85 },
            hovertemplate: "%{text}<br>soporte %{x:.1%} · confianza %{y:.0%}<extra></extra>" }; };
        graficar("g-reglas", [grupo(r => !esP1(r), "otras reglas", C.gris), grupo(esP1, "con postor único", C.naranja)],
          { xaxis: { title: "soporte (log)", type: "log", tickvals: [0.02, 0.03, 0.05, 0.1, 0.2, 0.4], ticktext: ["2%", "3%", "5%", "10%", "20%", "40%"] }, yaxis: { title: "confianza", tickformat: ".0%", range: [0.45, 1.03] } });
        $("t-top").innerHTML = f.length ? tabla([...f].sort((a, b) => b.lift - a.lift).slice(0, 10).map(r => ({ ...r, regla: regla(r) })),
          [["regla", "Regla"], ["confianza", "Conf.", v => pct(v * 100, 0)], ["lift", "Lift", v => num(v, 1)]], { destacar: esP1 }) : "<p>Ninguna regla cumple los umbrales</p>";
      };
      ["c-datos", "c-sop", "c-conf", "c-lift", "c-p1", "c-red"].forEach(id => $(id).addEventListener("input", dibujar));
      dibujar();
    },
  },
  {
    etapa: "8 · Reglas de asociación (P1)",
    async render(el) {
      el.innerHTML = encabezado("Predicción de Postor Único",
        "Las 14 reglas más fuertes: 7 sobre postor único y 7 de otras dimensiones para contrastar")
        + caja("g-sel", "Reglas seleccionadas por lift", "naranja: postor único · gris: otras dimensiones", "alto")
        + puntos([
          "<b>Regla principal:</b> Directa S/ 50–200 mil predice postor único con 93.6%.",
          "<b>Contexto:</b> Directa en Lima o servicios alcanza 89%.",
          "<b>Contraste:</b> Métodos competitivos en obras predicen varios postores con 93.5%.",
          "<b>Sensibilidad:</b> Con soporte 3% sobrevive solo 1 de 14 reglas.",
        ]);
      const sel = (await datos(`${D}/d_analisis/seleccion`)).sort((a, b) => a.lift - b.lift);
      graficar("g-sel", [barraH(sel.map(r => regla(r)), sel.map(r => r.lift), {
        marker: { color: sel.map(r => (r.grupo === "p1" ? C.naranja : C.gris)) }, text: sel.map(r => `conf ${pct(r.confianza * 100, 0)}`),
        textposition: "outside", hovertemplate: "%{y}<br>lift %{x:.1f}<extra></extra>" })],
        { margin: { l: 430 }, yaxis: { tickfont: { size: 10 } }, xaxis: { title: "lift", range: [0, 11.5] } });
    },
  },
];
