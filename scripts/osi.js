// =============================================
// Orquestrador OSI
// Coordena a renderização sequencial das camadas 7 → 6 → 5 → 4 → 3
// =============================================

import { renderAplicacao, renderAplicacaoHTTP } from './aplicacao.js';
import { renderApresentacao } from './apresentacao.js';
import { renderSessao, getSessionId } from './sessao.js';
import { renderTransporte } from './transporte.js';
import { renderRede, initRedeCanvas, stopRedeAnimation } from './rede.js';

/**
 * Renderiza as 5 camadas OSI no container, com setas de conexão.
 * @param {Object} data - Dados da requisição (SMTP ou HTTP).
 * @param {'smtp'|'http'} tipo - Tipo de requisição.
 */
export function renderOSILayers(data, tipo = 'smtp') {
    const container = document.getElementById('osi-layers-container');
    if (!container) return;

    // Parar animação anterior se existir
    stopRedeAnimation();

    // Camada 7 — Aplicação
    let aplicacaoHTML, payloadLabel;
    if (tipo === 'http') {
        aplicacaoHTML = renderAplicacaoHTTP(data);
        payloadLabel = 'Dados da requisição HTTP';
    } else {
        aplicacaoHTML = renderAplicacao(data);
        payloadLabel = 'Dados do e-mail';
    }

    // Camada 6 — Apresentação
    const { html: apresentacaoHTML, token: jwtToken } = renderApresentacao(data, payloadLabel);

    // Camada 5 — Sessão
    const sessaoHTML = renderSessao(jwtToken);
    const sessionId = getSessionId();

    // Camada 4 — Transporte
    const appProtocol = data.protocolo || 'HTTP/HTTPS';
    const { html: transporteHTML } = renderTransporte(sessionId, appProtocol);

    // Camada 3 — Rede
    const hostIP = data.hostIP || '';
    const { html: redeHTML, networkPacket } = renderRede(hostIP);

    // Seta visual entre camadas
    const arrowHTML = `
        <div class="osi-arrow">
            <div class="osi-arrow-line"></div>
            <div class="osi-arrow-head"></div>
            <span class="osi-arrow-label">↓</span>
        </div>
    `;

    container.innerHTML = `
        ${aplicacaoHTML}
        ${arrowHTML}
        ${apresentacaoHTML}
        ${arrowHTML}
        ${sessaoHTML}
        ${arrowHTML}
        ${transporteHTML}
        ${arrowHTML}
        ${redeHTML}
        <button class="osi-reset-btn" id="osi-reset-btn">Nova Requisição</button>
    `;

    container.classList.add('active');

    // Iniciar canvas da camada de rede APÓS inserção no DOM
    initRedeCanvas(networkPacket);

    // Botão de reset
    document.getElementById('osi-reset-btn').addEventListener('click', () => {
        stopRedeAnimation();
        container.classList.remove('active');
        container.innerHTML = '';
    });
}