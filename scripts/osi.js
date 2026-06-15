// =============================================
// Orquestrador OSI
// Coordena a renderização sequencial das camadas 7 → 6 → 5
// =============================================

import { renderAplicacao, renderAplicacaoHTTP } from './aplicacao.js';
import { renderApresentacao } from './apresentacao.js';
import { renderSessao } from './sessao.js';

/**
 * Renderiza as 3 camadas OSI no container, com setas de conexão.
 * A animação sequencial é controlada via CSS animation-delay.
 * @param {Object} data - Dados da requisição (SMTP ou HTTP).
 * @param {'smtp'|'http'} tipo - Tipo de requisição para definir o render da camada de aplicação.
 */
export function renderOSILayers(data, tipo = 'smtp') {
    const container = document.getElementById('osi-layers-container');
    if (!container) return;

    // Camada 7 — Aplicação (varia conforme o tipo)
    let aplicacaoHTML;
    let payloadLabel;

    if (tipo === 'http') {
        aplicacaoHTML = renderAplicacaoHTTP(data);
        payloadLabel = 'Dados da requisição HTTP';
    } else {
        aplicacaoHTML = renderAplicacao(data);
        payloadLabel = 'Dados do e-mail';
    }

    // Camada 6 — Apresentação (retorna HTML + token JWT)
    const { html: apresentacaoHTML, token: jwtToken } = renderApresentacao(data, payloadLabel);

    // Camada 5 — Sessão (recebe o token JWT)
    const sessaoHTML = renderSessao(jwtToken);

    // Seta visual entre camadas
    const arrowHTML = `
        <div class="osi-arrow">
            <div class="osi-arrow-line"></div>
            <div class="osi-arrow-head"></div>
            <span class="osi-arrow-label">↓</span>
        </div>
    `;

    // Montar tudo no container
    container.innerHTML = `
        ${aplicacaoHTML}
        ${arrowHTML}
        ${apresentacaoHTML}
        ${arrowHTML}
        ${sessaoHTML}
        <button class="osi-reset-btn" id="osi-reset-btn">Nova Requisição</button>
    `;

    // Ativar container (torna visível)
    container.classList.add('active');

    // Botão de reset
    document.getElementById('osi-reset-btn').addEventListener('click', () => {
        container.classList.remove('active');
        container.innerHTML = '';
    });
}