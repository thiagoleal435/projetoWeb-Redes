// =============================================
// Camada 5 — Sessão
// Gerencia o estabelecimento e controle da sessão
// =============================================

let lastSessionId = '';

/**
 * Retorna o último Session ID gerado.
 * @returns {string}
 */
export function getSessionId() {
    return lastSessionId;
}

/**
 * Gera os dados da camada de Sessão e retorna o HTML da visualização.
 * @param {string} jwtToken - Token JWT completo gerado pela camada de Apresentação.
 * @returns {string} HTML da camada de Sessão.
 */
export function renderSessao(jwtToken) {
    const sessionID = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
    lastSessionId = sessionID;

    const now = new Date();
    const expiration = new Date(now.getTime() + 60 * 60 * 1000);

    const sessionData = {
        sessionID,
        status: 'ESTABLISHED',
        timestamp: now.toISOString(),
        expiration: expiration.toISOString(),
        token: jwtToken
    };

    return `
        <div class="osi-layer layer-5">
            <div class="osi-layer-header">
                <div class="osi-layer-badge">5</div>
                <div class="osi-layer-title">
                    <span>Camada de Sessão</span>
                    <span>Gerenciamento de sessão de comunicação</span>
                </div>
            </div>
            <div class="osi-layer-content">
                <div class="session-grid">
                    <span class="session-label">Session ID</span>
                    <span class="session-value">${sessionData.sessionID}</span>

                    <span class="session-label">Status</span>
                    <span class="session-value">
                        <span class="session-status">
                            <span class="session-status-dot"></span>
                            ${sessionData.status}
                        </span>
                    </span>

                    <span class="session-label">Início</span>
                    <span class="session-value">${sessionData.timestamp}</span>

                    <span class="session-label">Expiração</span>
                    <span class="session-value">${sessionData.expiration}</span>
                </div>
                <div class="session-token-full">
                    <span class="token-label">Token JWT da sessão</span>
                    ${sessionData.token}
                </div>
            </div>
        </div>
    `;
}
