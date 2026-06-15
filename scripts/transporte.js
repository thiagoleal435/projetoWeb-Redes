// =============================================
// Camada 4 — Transporte
// Segmentação, controle de fluxo, portas e handshake TCP
// =============================================

function generatePacketId() {
    const arr = new Uint8Array(4);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getDestinationPort(appProtocol) {
    const map = { 'HTTP/HTTPS': 443, 'SMTP/POP3': 25, 'FTP': 21, 'WEBSOCKET': 443 };
    return map[appProtocol] || 80;
}

function generateSourcePort() {
    return Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;
}

/**
 * Renderiza a camada de Transporte.
 * @param {string} sessionId - Session ID da camada 5.
 * @param {string} appProtocol - Protocolo da aplicação.
 * @returns {{ html: string, transportData: Object }}
 */
export function renderTransporte(sessionId, appProtocol) {
    const packetId = generatePacketId();
    const sourcePort = generateSourcePort();
    const destPort = getDestinationPort(appProtocol);
    const transportProtocol = 'TCP';

    const destLabel = { 443: 'HTTPS (443)', 80: 'HTTP (80)', 25: 'SMTP (25)', 21: 'FTP (21)' }[destPort] || `${destPort}`;

    const transportData = { sessionId, packetId, protocolo: transportProtocol, portaOrigem: sourcePort, portaDestino: destPort, appProtocol };

    const html = `
        <div class="osi-layer layer-4">
            <div class="osi-layer-header">
                <div class="osi-layer-badge">4</div>
                <div class="osi-layer-title">
                    <span>Camada de Transporte</span>
                    <span>Segmentação e controle de fluxo — ${transportProtocol}</span>
                </div>
            </div>
            <div class="osi-layer-content">
                <div class="transport-grid">
                    <div class="transport-item">
                        <div class="transport-info">
                            <span class="transport-label">Session ID</span>
                            <span class="transport-value transport-session">${sessionId}</span>
                        </div>
                    </div>
                    <div class="transport-item">
                        <div class="transport-info">
                            <span class="transport-label">Packet ID</span>
                            <span class="transport-value transport-packet">0x${packetId}</span>
                        </div>
                    </div>
                    <div class="transport-item">
                        <div class="transport-info">
                            <span class="transport-label">Protocolo de Transporte</span>
                            <span class="transport-value transport-proto">${transportProtocol}</span>
                        </div>
                    </div>
                    <div class="transport-item">
                        <div class="transport-info">
                            <span class="transport-label">Porta de Origem</span>
                            <span class="transport-value">${sourcePort}</span>
                        </div>
                    </div>
                    <div class="transport-item">
                        <div class="transport-info">
                            <span class="transport-label">Porta de Destino</span>
                            <span class="transport-value">${destLabel}</span>
                        </div>
                    </div>
                </div>
                <div class="tcp-handshake">
                    <span class="tcp-handshake-title">Three-Way Handshake (${transportProtocol})</span>
                    <div class="tcp-handshake-steps">
                        <div class="tcp-step tcp-step-1">
                            <span class="tcp-step-badge">1</span>
                            <span class="tcp-step-label">SYN</span>
                            <span class="tcp-step-arrow">→</span>
                        </div>
                        <div class="tcp-step tcp-step-2">
                            <span class="tcp-step-badge">2</span>
                            <span class="tcp-step-label">SYN-ACK</span>
                            <span class="tcp-step-arrow">←</span>
                        </div>
                        <div class="tcp-step tcp-step-3">
                            <span class="tcp-step-badge">3</span>
                            <span class="tcp-step-label">ACK</span>
                            <span class="tcp-step-arrow">→</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return { html, transportData };
}
