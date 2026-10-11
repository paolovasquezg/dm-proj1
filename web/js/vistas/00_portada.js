import { cifras } from "../comun.js";

export const diapos = [{
  etapa: "",
  render(el) {
    el.innerHTML = `<section class="portada">
      <span class="etiqueta">Proyecto de minería de datos</span>
      <h1>¿Dónde está el riesgo en las compras públicas del Perú?</h1>
      <p class="bajada">Similitud, vecinos aproximados, minería de flujos y reglas de asociación sobre 236 mil procesos de contratación pública entre 2023 y 2025</p>
      ${cifras([["235,954", "procesos analizados"], ["36", "meses (2023–2025)"], ["S/ 240 mil M", "adjudicados en 3 años"], ["3", "preguntas de riesgo"]])}
      <p class="pie">Fuente: Contrataciones Abiertas — OECE (estándar OCDS) · Usa ← → o las flechas laterales para avanzar</p>
    </section>`;
  },
}];
