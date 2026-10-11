import { datos, encabezado, puntos, caja, cifras, proceso, chips, graficar, barra, linea, puntosXY, tabla, num, pct, C } from "../comun.js";

const D = "07_flujos";
const $ = (id) => document.getElementById(id);
const opciones = (vals, sel, fmt = (v) => v) => vals.map(v => `<option value="${v}"${v === sel ? " selected" : ""}>${fmt(v)}</option>`).join("");

export const diapos = [
  {
    etapa: "7 · Minería de flujos (P1)",
    async render(el) {
      el.innerHTML = encabezado("Minería de flujos: vigilar los procesos a medida que llegan",
        "Los 236 mil procesos se tratan como un flujo ordenado por fecha. Tres estructuras responden preguntas en línea con memoria fija")
        + proceso([
          ["Flujo", "procesos ordenados por fecha, uno por uno"],
          ["DGIM", "¿cuántos procesos con <b>postor único</b> hubo en la última ventana?", true],
          ["Bloom Filter", "¿este par <b>entidad–proveedor</b> ya apareció antes?", true],
          ["Count-Min Sketch", "¿<b>cuántas veces</b> apareció cada par? (heavy hitters ≥ 50)", true],
        ])
        + `<div class="fila"><div id="t-comp" class="tarjeta"></div><div>`
        + puntos([
          "<b>Memoria fija:</b> no crece con el número de pares distintos (Bloom, Count-Min) o crece apenas con la ventana (DGIM)",
          "<b>El precio:</b> un error acotado y conocido — DGIM sub/sobreestima, Bloom solo da falsos positivos, Count-Min solo sobreestima",
          "En tiempo son 8–32x más lentas que el cálculo exacto (Python puro vs estructuras en C); su ventaja es la memoria",
        ]) + "</div></div>";
      const comp = await datos(`${D}/d_analisis/comparativa`);
      const kb = (b) => (b < 1024 ? `${num(b)} B` : b < 1024 ** 2 ? `${num(b / 1024)} KB` : `${num(b / 1024 ** 2, 1)} MB`);
      $("t-comp").innerHTML = "<h3>Lo que cuesta cada estructura</h3>" + tabla(comp, [
        ["estructura", "Estructura"], ["metrica_error", "Error"],
        ["error", "Valor", (v, r) => r.estructura === "Bloom Filter" ? pct(v * 100, 2) : r.estructura === "DGIM" ? pct(v * 100, 1) : num(v, 1)],
        ["memoria_bytes", "Memoria", kb], ["memoria_exacta_bytes", "Exacto", kb], ["ahorro_memoria", "Ahorro", v => `${num(v)}x`],
      ]);
    },
  },
  {
    etapa: "7 · Minería de flujos (P1)",
    async render(el) {
      el.innerHTML = encabezado("DGIM: postor único en la última ventana",
        "Cuenta los 1 de un flujo de bits en una ventana deslizante guardando solo ~20 cubetas. Elige la ventana y la precisión")
        + `<div class="controles">
            <label>Ventana <select id="c-ven">${opciones(["semana", "mes", "trimestre"], "mes")}</select></label>
            <label>Cubetas por tamaño <code>r</code> <select id="c-r">${opciones([2, 3, 5, 10], 2)}</select></label>
          </div>`
        + chips([["error medio", '<span id="k-err"></span>'], ["memoria DGIM", '<span id="k-bits"></span>'], ["memoria exacta", '<span id="k-exacto"></span>'], ["días con alerta (> 15%)", '<span id="k-alerta"></span>']])
        + caja("g-dgim", "% de procesos con postor único en la ventana", "gris: conteo exacto · azul: estimado DGIM · naranja: umbral de alerta 15%", "alto")
        + `<p class="lectura" id="lectura"></p>`;
      const [serie, trade, vari] = await Promise.all([datos(`${D}/a_dgim/serie_ventanas`), datos(`${D}/a_dgim/tradeoff`), datos(`${D}/a_dgim/variacion`)]);
      const dibujar = () => {
        const v = $("c-ven").value, r = +$("c-r").value;
        const s = serie.filter(x => x.ventana === v), t = trade.find(x => x.ventana === v && x.r === r), va = vari.find(x => x.ventana === v);
        $("k-err").textContent = pct(t.error_medio * 100); $("k-bits").textContent = `${num(t.bits_dgim)} bits`;
        $("k-exacto").textContent = `${num(t.bits_exacto)} bits`; $("k-alerta").textContent = num(va.dias_alerta_exacto);
        graficar("g-dgim", [
          linea(s.map(x => x.fecha), s.map(x => x.pct_exacto), { name: "exacto", line: { color: C.gris, width: 2 } }),
          linea(s.map(x => x.fecha), s.map(x => x.pct_dgim), { name: "DGIM (r=2)", line: { color: C.azul, width: 1.5 } }),
          linea([s[0].fecha, s[s.length - 1].fecha], [15, 15], { name: "alerta 15%", line: { color: C.naranja, dash: "dot", width: 2 }, hoverinfo: "skip" }),
        ], { yaxis: { ticksuffix: "%" }, hovermode: "x unified" });
        $("lectura").innerHTML = `Ventana de ${num(va.N)} procesos: promedio ${pct(va.pct_medio)}, pico ${pct(va.pct_max)}. `
          + `Con r=${r} el error medio es ${pct(t.error_medio * 100)} usando ${num(t.bits_dgim)} bits en vez de ${num(t.bits_exacto)}. `
          + (v === "semana" ? "La ventana corta muestra picos de hasta 30%." : v === "trimestre" ? "La ventana larga suaviza todo: ningún día pasa la alerta." : "El pico de enero 2024 es el más claro.");
      };
      ["c-ven", "c-r"].forEach(id => $(id).addEventListener("change", dibujar));
      dibujar();
    },
  },
  {
    etapa: "7 · Minería de flujos (P1)",
    async render(el) {
      el.innerHTML = encabezado("Bloom Filter: ¿el par entidad–proveedor ya se vio?",
        "Un vector de bits responde “sí, probablemente” o “no, seguro”. Más bits por par = menos falsos positivos")
        + `<div class="controles">
            <label>Bits por par <select id="c-bits">${opciones([2, 4, 8, 9.6, 16], 9.6)}</select></label>
            <label>Funciones hash <code>k</code> <select id="c-k">${opciones([1, 2, 3, 5, 7, 10], 7)}</select></label>
          </div>`
        + chips([["falsos positivos", '<span id="k-fpr"></span>'], ["memoria", '<span id="k-mem"></span>'], ["reincidencia estimada", '<span id="k-rei"></span>'], ["reincidencia real", "32.8%"]])
        + `<div class="fila">${caja("g-fpr", "Falsos positivos según la memoria", "una línea por número de hashes; el punto es tu elección")}${caja("g-rei", "Reincidencia por año: estimada vs real")}</div>`
        + `<p class="lectura" id="lectura"></p>`;
      const [trade, vari] = await Promise.all([datos(`${D}/b_bloom/tradeoff`), datos(`${D}/b_bloom/variacion`)]);
      const dibujar = () => {
        const bits = +$("c-bits").value, k = +$("c-k").value;
        const t = trade.find(x => x.bits_por_par === bits && x.k === k), v = vari.find(x => x.bits_por_par === bits && x.k === k);
        $("k-fpr").textContent = pct(t.fpr_final * 100, 2); $("k-mem").textContent = `${num(t.memoria_kb)} KB`; $("k-rei").textContent = pct(v.reincidencia);
        const ks = [1, 3, 7];
        graficar("g-fpr", [
          ...ks.map((kk, i) => { const f = trade.filter(x => x.k === kk); return puntosXY(f.map(x => x.bits_por_par), f.map(x => x.fpr_final),
            { name: `k=${kk}`, line: { color: [C.gris, C.aqua, C.azul][i], width: 2 }, marker: { size: 6 } }); }),
          { type: "scatter", mode: "markers", x: [bits], y: [t.fpr_final], name: "elegido", marker: { color: C.naranja, size: 13 }, hovertemplate: "FPR %{y:.2%}<extra></extra>" },
        ], { xaxis: { title: "bits por par" }, yaxis: { tickformat: ".0%", title: "falsos positivos" } });
        const anios = ["2023", "2024", "2025"];
        graficar("g-rei", [barra(anios, anios.map(a => v[`reincidencia_${a}`]), { name: "Bloom", marker: { color: C.azul } }),
          barra(anios, [19.0, 35.2, 41.2], { name: "real", marker: { color: C.gris } })], { barmode: "group", yaxis: { ticksuffix: "%", range: [0, 100] } });
        $("lectura").innerHTML = bits <= 4
          ? `Con ${bits} bits por par el filtro se satura: confunde pares nuevos con repetidos e infla la reincidencia a ${pct(v.reincidencia)} (real 32.8%)`
          : `Con ${bits} bits por par la estimación coincide con la real usando ${num(t.memoria_kb)} KB en vez de ~19 MB del conjunto exacto`;
      };
      ["c-bits", "c-k"].forEach(id => $(id).addEventListener("change", dibujar));
      dibujar();
    },
  },
  {
    etapa: "7 · Minería de flujos (P1)",
    async render(el) {
      el.innerHTML = encabezado("Count-Min Sketch: ¿cuántas veces aparece cada par?",
        "Una tabla de contadores de ancho w y profundidad d; nunca subestima. Los pares con ≥ 50 apariciones son heavy hitters")
        + `<div class="controles">
            <label>Ancho <code>w</code> <select id="c-w">${opciones([1024, 4096, 16384, 33390, 65536], 33390, v => num(v))}</select></label>
            <label>Profundidad <code>d</code> <select id="c-d">${opciones([1, 2, 3, 5, 7], 5)}</select></label>
            <label><input type="checkbox" id="c-cons"> actualización conservadora (solo con d = 5)</label>
          </div>`
        + chips([["sobreestimación media", '<span id="k-err"></span>'], ["memoria", '<span id="k-mem"></span>'], ["heavy hitters reportados", '<span id="k-hh"></span>'], ["reales", "16"]])
        + `<div class="fila">${caja("g-err", "Sobreestimación media según el ancho (apariciones, log)")}${caja("g-hh", "Heavy hitters reportados vs reales")}</div>`
        + `<p class="lectura" id="lectura"></p>`;
      const [trade, vari] = await Promise.all([datos(`${D}/c_sketch/tradeoff`), datos(`${D}/c_sketch/variacion`)]);
      const dibujar = () => {
        const w = +$("c-w").value, d = +$("c-d").value;
        $("c-cons").disabled = d !== 5; if (d !== 5) $("c-cons").checked = false;
        const cons = $("c-cons").checked;
        const t = trade.find(x => x.w === w && x.d === d && x.conservador === cons), v = vari.find(x => x.w === w && x.d === d && x.conservador === cons);
        $("k-err").textContent = num(t.error_medio, 2); $("k-mem").textContent = `${num(t.memoria_kb)} KB`; $("k-hh").textContent = num(v.hh_reportados);
        const serie = (dd, c, nombre, color) => { const f = trade.filter(x => x.d === dd && x.conservador === c).sort((a, b) => a.w - b.w);
          return puntosXY(f.map(x => x.w), f.map(x => x.error_medio), { name: nombre, line: { color, width: 2 }, marker: { size: 6 } }); };
        graficar("g-err", [serie(1, false, "d=1", C.gris), serie(5, false, "d=5", C.azul), serie(5, true, "d=5 conservador", C.aqua),
          { type: "scatter", mode: "markers", x: [w], y: [t.error_medio], name: "elegido", marker: { color: C.naranja, size: 13 } }],
          { xaxis: { type: "log", title: "ancho w", tickvals: [1024, 4096, 16384, 65536], ticktext: ["1,024", "4,096", "16,384", "65,536"] }, yaxis: { type: "log", tickvals: [0.1, 1, 10, 100], ticktext: ["0.1", "1", "10", "100"] } });
        graficar("g-hh", [barra(["reportados", "reales"], [v.hh_reportados, 16], { marker: { color: [C.azul, C.gris] }, text: [num(v.hh_reportados), "16"], textposition: "outside" })],
          { yaxis: { range: [0, Math.max(v.hh_reportados, 16) * 1.2] }, margin: { t: 24 } });
        $("lectura").innerHTML = v.hh_falsos > 100
          ? `Con w=${num(w)} los contadores se mezclan: ${num(v.hh_falsos)} pares parecen heavy hitters sin serlo`
          : `Con w=${num(w)} y d=${d} se detectan los 16 pares reales${v.hh_falsos ? ` con ${v.hh_falsos} falsos` : " sin falsos"}, usando ${num(t.memoria_kb)} KB en vez de ~22 MB`;
      };
      ["c-w", "c-d", "c-cons"].forEach(id => $(id).addEventListener("change", dibujar));
      dibujar();
    },
  },
  {
    etapa: "7 · Minería de flujos (P1)",
    async render(el) {
      el.innerHTML = encabezado("Resultado: la baja competencia tiene calendario y se repite",
        "Lo que las tres estructuras revelan sobre P1")
        + `<div class="fila">${caja("g-mes", "% postor único por mes", "enero y diciembre resaltados")}<div class="tarjeta"><h3>Pares más frecuentes (Count-Min)</h3><div class="scroll" id="t-hh"></div></div></div>`
        + puntos([
          "<b>Calendario:</b> el postor único sube en enero y diciembre (apertura y cierre del año fiscal)",
          "<b>Reincidencia:</b> un tercio de las llegadas repite un par entidad–proveedor, y sube cada año (19% → 35% → 41%)",
          "<b>Repetir va con menos competencia:</b> los pares reincidentes tienen 16.3% de postor único vs 11.9% la primera vez",
          "<b>Heavy hitters:</b> PROMPERÚ con Meta, Google y TikTok (100% postor único, publicidad digital); otros, como GORE Puno–Grupo Santa Fe, ganan en procesos competitivos",
        ]);
      const [mes, hh] = await Promise.all([datos(`${D}/a_dgim/llegadas_mes`), datos(`${D}/c_sketch/heavy_hitters`)]);
      graficar("g-mes", [barra(mes.map(r => `${r.anio}-${String(r.mes).padStart(2, "0")}`), mes.map(r => r.pct_postor_unico),
        { marker: { color: mes.map(r => (r.mes === 1 || r.mes === 12 ? C.naranja : C.azul)) }, hovertemplate: "%{x}: %{y:.1f}%<extra></extra>" })],
        { yaxis: { ticksuffix: "%" }, xaxis: { type: "category", nticks: 9 } });
      $("t-hh").innerHTML = tabla(hh.slice(0, 12).map(r => { const [e, p] = r.par.split("|"); return { ...r, e: e.slice(0, 32), p: p.slice(0, 28) }; }),
        [["e", "Entidad"], ["p", "Proveedor"], ["exacto", "Veces", v => num(v)], ["pct_postor_unico", "Postor único", v => pct(v, 0)]],
        { destacar: r => r.pct_postor_unico === 100 });
    },
  },
];
