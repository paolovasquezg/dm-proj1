import { datos, encabezado, puntos, caja, graficar, barra, num, C, tabla } from "../comun.js";

const COLUMNAS = [
  ["ocid", "Identificador único del proceso"],
  ["fecha", "Inicio de convocatoria (o adjudicación)"],
  ["entidad · region", "Quién compra y dónde"],
  ["descripcion · items_desc", "Qué se compra (texto libre)"],
  ["metodo_detalle", "Método de contratación"],
  ["categoria", "Bienes, servicios u obras"],
  ["monto_referencial · monto_adjudicado", "Monto estimado y final"],
  ["n_postores · proveedor", "Competencia y ganador"],
];

export const diapos = [
  {
    etapa: "1 · Situación",
    async render(el) {
      el.innerHTML = encabezado("Las compras públicas mueven ~S/ 80 mil millones al año",
        "Cada proceso de contratación es público. Revisarlos uno por uno es imposible; la minería de datos permite vigilarlos a escala")
        + `<div class="fila">
          <div>${puntos([
            "<b>Qué son:</b> procesos con los que entidades del Estado (ministerios, gobiernos regionales, municipios) compran bienes, servicios y obras",
            "<b>Dónde se publican:</b> portal de Contrataciones Abiertas del OECE, en formato OCDS, un archivo por mes",
            "<b>El reto:</b> ~80 mil procesos por año con texto libre, montos muy dispares y datos incompletos",
            "<b>Qué buscamos:</b> señales de riesgo — poca competencia, compras divididas y precios fuera de rango",
          ])}</div>
          ${caja("g-monto", "Monto adjudicado por año (S/ millones)")}
        </div>`;
      const m = (await datos("02_dataset/b_exploracion/monto_adjudicado_anio")).filter(r => r.anio <= 2025);
      graficar("g-monto", [barra(m.map(r => String(r.anio)), m.map(r => r.monto_adjudicado / 1e6),
        { hovertemplate: "%{x}: S/ %{y:,.0f} M<extra></extra>", text: m.map(r => `S/ ${num(r.monto_adjudicado / 1e9, 1)} mil M`), textposition: "outside" })],
        { xaxis: { type: "category" }, yaxis: { title: "S/ millones", range: [0, 100000] }, margin: { t: 24 } });
    },
  },
  {
    etapa: "2 · Dataset y preguntas",
    async render(el) {
      el.innerHTML = encabezado("El dataset y las tres preguntas",
        "Un proceso = una fila. De los datos OCDS se extraen las columnas que describen quién compra, qué, cuánto y con cuánta competencia")
        + `<div class="fila">
          <div class="tarjeta"><h3>Columnas principales</h3>${tabla(COLUMNAS.map(([c, d]) => ({ c: `<code>${c}</code>`, d })), [["c", "Columna"], ["d", "Significado"]])}</div>
          <div style="display:grid; gap:14px">
            <div class="tarjeta"><span class="etiqueta">P1 · Competencia</span><p>¿Qué combinaciones de método, monto, rubro y región se asocian a procesos con <b>un solo postor</b>?</p></div>
            <div class="tarjeta"><span class="etiqueta">P2 · Fraccionamiento</span><p>¿Hay procesos <b>casi idénticos</b> de una misma entidad, en fechas cercanas y montos bajos, que sugieran dividir una compra para evitar un método más exigente?</p></div>
            <div class="tarjeta"><span class="etiqueta">P3 · Precios de referencia</span><p>Para compras de <b>objeto parecido</b>, ¿cuánto varía el monto? Una diferencia grande es indicio de sobreprecio</p></div>
          </div>
        </div>`;
    },
  },
];
