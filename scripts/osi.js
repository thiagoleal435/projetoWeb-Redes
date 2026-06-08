// =============================================
// Orquestrador OSI
// Coordena a renderização sequencial das camadas 7 → 6 → 5
// =============================================

import { renderAplicacao } from './aplicacao.js';
import { renderApresentacao } from './apresentacao.js';
import { renderSessao } from './sessao.js';

/**
 * Renderiza as 3 camadas OSI no container, com setas de conexão.
 * A animação sequencial é controlada via CSS animation-delay.
 * @param {Object} emailData - Dados do formulário SMTP.
 */
export function renderOSILayers(emailData) {
    const container = document.getElementById('osi-layers-container');
    if (!container) return;

    // Camada 7 — Aplicação
    const aplicacaoHTML = renderAplicacao(emailData);

    // Camada 6 — Apresentação (retorna HTML + token JWT)
    const { html: apresentacaoHTML, token: jwtToken } = renderApresentacao(emailData);

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