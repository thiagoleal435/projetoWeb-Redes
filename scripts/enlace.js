// =============================================
// Camada 2 — Enlace de Dados
// Encapsulamento em frame Ethernet: MAC, tipo e CRC
// =============================================

/**
 * Gera um endereço MAC aleatório no formato AA:BB:CC:DD:EE:FF.
 * @returns {string}
 */
function generateMAC() {
    const bytes = new Uint8Array(6);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    } else {
        for (let i = 0; i < 6; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join(':');
}

/**
 * Gera um Frame ID hexadecimal de 8 caracteres.
 * @returns {string}
 */
function generateFrameId() {
    const bytes = new Uint8Array(4);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    } else {
        for (let i = 0; i < 4; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join('');
}

/**
 * Calcula CRC-32 (IEEE 802.3) de uma string.
 * @param {string} str
 * @returns {string} CRC em hexadecimal (8 chars)
 */
function crc32(str) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i);
        for (let j = 0; j < 8; j++) {
            if (crc & 1) {
                crc = (crc >>> 1) ^ 0xEDB88320;
            } else {
                crc = crc >>> 1;
            }
        }
    }
    return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Determina o EtherType com base no protocolo da aplicação.
 * @param {string} appProtocol
 * @returns {{ code: string, label: string }}
 */
function getEtherType(appProtocol) {
    const proto = (appProtocol || '').toUpperCase();
    if (proto.includes('HTTP') || proto.includes('HTTPS') || proto.includes('WEBSOCKET')) {
        return { code: '0x0800', label: 'IPv4' };
    }
    if (proto.includes('SMTP') || proto.includes('POP3')) {
        return { code: '0x0800', label: 'IPv4' };
    }
    if (proto.includes('FTP')) {
        return { code: '0x0800', label: 'IPv4' };
    }
    return { code: '0x0800', label: 'IPv4' };
}

/**
 * Renderiza a camada de Enlace de Dados.
 * @param {Object} networkPacket - Pacote da camada de rede (ipOrigem, ipDestino, etc.).
 * @param {string} appProtocol - Protocolo da aplicação.
 * @returns {{ html: string, frameData: Object }}
 */
export function renderEnlace(networkPacket, appProtocol) {
    const frameId = generateFrameId();
    const macOrigem = generateMAC();
    const macDestino = generateMAC();
    const etherType = getEtherType(appProtocol);

    // Payload para cálculo do CRC: concatenação dos dados do frame
    const payloadStr = `${frameId}${macOrigem}${macDestino}${etherType.code}${networkPacket.ipOrigem}${networkPacket.ipDestino}`;
    const crcValue = crc32(payloadStr);

    const frameData = {
        frameId,
        macOrigem,
        macDestino,
        tipo: etherType,
        crc: crcValue,
        payload: payloadStr
    };

    const html = `
        <div class="osi-layer layer-2">
            <div class="osi-layer-header">
                <div class="osi-layer-badge">2</div>
                <div class="osi-layer-title">
                    <span>Camada de Enlace de Dados</span>
                    <span>Encapsulamento em Frame Ethernet — IEEE 802.3</span>
                </div>
            </div>
            <div class="osi-layer-content">
                <div class="enlace-grid">
                    <div class="enlace-item">
                        <div class="enlace-info">
                            <span class="enlace-label">Frame ID</span>
                            <span class="enlace-value enlace-frameid">0x${frameId}</span>
                        </div>
                    </div>
                    <div class="enlace-item">
                        <div class="enlace-info">
                            <span class="enlace-label">MAC Origem</span>
                            <span class="enlace-value enlace-mac-src">${macOrigem}</span>
                        </div>
                    </div>
                    <div class="enlace-item">
                        <div class="enlace-info">
                            <span class="enlace-label">MAC Destino</span>
                            <span class="enlace-value enlace-mac-dst">${macDestino}</span>
                        </div>
                    </div>
                    <div class="enlace-item">
                        <div class="enlace-info">
                            <span class="enlace-label">Tipo (EtherType)</span>
                            <span class="enlace-value enlace-type">${etherType.code} — ${etherType.label}</span>
                        </div>
                    </div>
                    <div class="enlace-item enlace-item-full">
                        <div class="enlace-info">
                            <span class="enlace-label">CRC-32 (Verificação de Integridade)</span>
                            <span class="enlace-value enlace-crc">0x${crcValue}</span>
                        </div>
                    </div>
                </div>
                <div class="enlace-frame-visual">
                    <span class="enlace-frame-title">📦 Estrutura do Frame Ethernet</span>
                    <div class="enlace-frame-bar">
                        <div class="frame-segment frame-preamble">
                            <span class="frame-seg-label">Preâmbulo</span>
                            <span class="frame-seg-value">7 bytes</span>
                        </div>
                        <div class="frame-segment frame-sfd">
                            <span class="frame-seg-label">SFD</span>
                            <span class="frame-seg-value">1 byte</span>
                        </div>
                        <div class="frame-segment frame-mac-dst">
                            <span class="frame-seg-label">MAC Dest</span>
                            <span class="frame-seg-value">6 bytes</span>
                        </div>
                        <div class="frame-segment frame-mac-src">
                            <span class="frame-seg-label">MAC Orig</span>
                            <span class="frame-seg-value">6 bytes</span>
                        </div>
                        <div class="frame-segment frame-etype">
                            <span class="frame-seg-label">Tipo</span>
                            <span class="frame-seg-value">2 bytes</span>
                        </div>
                        <div class="frame-segment frame-payload">
                            <span class="frame-seg-label">Dados (Payload)</span>
                            <span class="frame-seg-value">46–1500 bytes</span>
                        </div>
                        <div class="frame-segment frame-fcs">
                            <span class="frame-seg-label">CRC/FCS</span>
                            <span class="frame-seg-value">4 bytes</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return { html, frameData };
}
