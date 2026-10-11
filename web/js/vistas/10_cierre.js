import { cifras } from "../comun.js";

export const diapos = [{
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
