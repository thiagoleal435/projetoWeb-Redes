// =============================================
// Camada 1 — Física
// Verificação de integridade (hash) e conversão para binário
// =============================================

/**
 * Calcula CRC-32 (IEEE 802.3) de uma string — mesma implementação da camada de enlace.
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
 * Converte uma string para sua representação binária (UTF-8, 8 bits por char).
 * @param {string} str
 * @returns {string} String binária separada por espaços a cada 8 bits.
 */
function stringToBinary(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i).toString(2).padStart(8, '0'));
    }
    return bytes.join(' ');
}

/**
 * Converte uma string hexadecimal (sem 0x) para binário.
 * @param {string} hex
 * @returns {string}
 */
function hexToBinary(hex) {
    return hex.split('').map(c => parseInt(c, 16).toString(2).padStart(4, '0')).join(' ');
}

/**
 * Renderiza a camada Física.
 * Recebe o frameData da camada de enlace, recalcula o hash do payload
 * e verifica integridade comparando com o CRC original.
 * Se for válido, converte todos os dados para binário e exibe.
 *
 * @param {Object} frameData - Dados do frame da camada de enlace.
 * @returns {{ html: string }}
 */
export function renderFisica(frameData) {
    // Recalcular o CRC do payload para verificar integridade
    const crcRecalculado = crc32(frameData.payload);
    const integridadeOk = crcRecalculado === frameData.crc;

    // Converter campos do frame para binário
    const frameIdBin = hexToBinary(frameData.frameId);
    const macOrigemBin = frameData.macOrigem.split(':').map(b => parseInt(b, 16).toString(2).padStart(8, '0')).join(' ');
    const macDestinoBin = frameData.macDestino.split(':').map(b => parseInt(b, 16).toString(2).padStart(8, '0')).join(' ');
    const tipoBin = hexToBinary(frameData.tipo.code.replace('0x', ''));
    const crcBin = hexToBinary(frameData.crc);

    // Payload inteiro em binário (primeiros 64 bytes para exibição)
    const payloadPreview = frameData.payload.substring(0, 64);
    const payloadBin = stringToBinary(payloadPreview);
    const payloadTruncated = frameData.payload.length > 64;

    // Sinal elétrico visual (padrão de bits do preâmbulo Ethernet: 10101010...)
    const preambleBits = '10101010 10101010 10101010 10101010 10101010 10101010 10101010 10101011';

    const statusClass = integridadeOk ? 'fisica-ok' : 'fisica-error';
    const statusIcon = integridadeOk ? '✅' : '❌';
    const statusText = integridadeOk
        ? 'Integridade verificada — CRC válido'
        : 'ERRO — CRC inválido! Frame corrompido';

    const html = `
        <div class="osi-layer layer-1">
            <div class="osi-layer-header">
                <div class="osi-layer-badge">1</div>
                <div class="osi-layer-title">
                    <span>Camada Física</span>
                    <span>Transmissão de bits — Sinal elétrico/óptico</span>
                </div>
            </div>
            <div class="osi-layer-content">
                <div class="fisica-integrity ${statusClass}">
                    <div class="fisica-integrity-header">
                        <span class="fisica-integrity-icon">${statusIcon}</span>
                        <span class="fisica-integrity-text">${statusText}</span>
                    </div>
                    <div class="fisica-integrity-detail">
                        <div class="fisica-crc-compare">
                            <div class="fisica-crc-item">
                                <span class="fisica-crc-label">CRC Recebido (Enlace)</span>
                                <span class="fisica-crc-value">0x${frameData.crc}</span>
                            </div>
                            <div class="fisica-crc-separator">${integridadeOk ? '=' : '≠'}</div>
                            <div class="fisica-crc-item">
                                <span class="fisica-crc-label">CRC Calculado (Física)</span>
                                <span class="fisica-crc-value">0x${crcRecalculado}</span>
                            </div>
                        </div>
                    </div>
                </div>

                ${integridadeOk ? `
                <div class="fisica-signal">
                    <span class="fisica-signal-title">⚡ Preâmbulo — Sincronização do Sinal</span>
                    <div class="fisica-bits-container fisica-preamble-bits">
                        ${preambleBits.split(' ').map(byte =>
        `<span class="fisica-byte">${byte.split('').map((bit, i) =>
            `<span class="fisica-bit ${bit === '1' ? 'bit-high' : 'bit-low'}">${bit}</span>`
        ).join('')}</span>`
    ).join('')}
                    </div>
                </div>

                <div class="fisica-binary-section">
                    <span class="fisica-section-title">🔢 Frame ID em Binário</span>
                    <div class="fisica-bits-container">
                        ${frameIdBin.split(' ').map(nibble =>
        `<span class="fisica-byte">${nibble.split('').map(bit =>
            `<span class="fisica-bit ${bit === '1' ? 'bit-high' : 'bit-low'}">${bit}</span>`
        ).join('')}</span>`
    ).join('')}
                    </div>
                    <span class="fisica-hex-ref">Hex: 0x${frameData.frameId}</span>
                </div>

                <div class="fisica-binary-section">
                    <span class="fisica-section-title">🔢 MAC Origem em Binário</span>
                    <div class="fisica-bits-container">
                        ${macOrigemBin.split(' ').map(byte =>
        `<span class="fisica-byte">${byte.split('').map(bit =>
            `<span class="fisica-bit ${bit === '1' ? 'bit-high' : 'bit-low'}">${bit}</span>`
        ).join('')}</span>`
    ).join('')}
                    </div>
                    <span class="fisica-hex-ref">MAC: ${frameData.macOrigem}</span>
                </div>

                <div class="fisica-binary-section">
                    <span class="fisica-section-title">🔢 MAC Destino em Binário</span>
                    <div class="fisica-bits-container">
                        ${macDestinoBin.split(' ').map(byte =>
        `<span class="fisica-byte">${byte.split('').map(bit =>
            `<span class="fisica-bit ${bit === '1' ? 'bit-high' : 'bit-low'}">${bit}</span>`
        ).join('')}</span>`
    ).join('')}
                    </div>
                    <span class="fisica-hex-ref">MAC: ${frameData.macDestino}</span>
                </div>

                <div class="fisica-binary-section">
                    <span class="fisica-section-title">🔢 Tipo (EtherType) em Binário</span>
                    <div class="fisica-bits-container">
                        ${tipoBin.split(' ').map(nibble =>
        `<span class="fisica-byte">${nibble.split('').map(bit =>
            `<span class="fisica-bit ${bit === '1' ? 'bit-high' : 'bit-low'}">${bit}</span>`
        ).join('')}</span>`
    ).join('')}
                    </div>
                    <span class="fisica-hex-ref">Hex: ${frameData.tipo.code} (${frameData.tipo.label})</span>
                </div>

                <div class="fisica-binary-section">
                    <span class="fisica-section-title">🔢 CRC-32 em Binário</span>
                    <div class="fisica-bits-container">
                        ${crcBin.split(' ').map(nibble =>
        `<span class="fisica-byte">${nibble.split('').map(bit =>
            `<span class="fisica-bit ${bit === '1' ? 'bit-high' : 'bit-low'}">${bit}</span>`
        ).join('')}</span>`
    ).join('')}
                    </div>
                    <span class="fisica-hex-ref">Hex: 0x${frameData.crc}</span>
                </div>

                <div class="fisica-binary-section fisica-payload-section">
                    <span class="fisica-section-title">🔢 Payload em Binário ${payloadTruncated ? '(primeiros 64 bytes)' : ''}</span>
                    <div class="fisica-bits-container fisica-payload-bits">
                        ${payloadBin.split(' ').map(byte =>
        `<span class="fisica-byte">${byte.split('').map(bit =>
            `<span class="fisica-bit ${bit === '1' ? 'bit-high' : 'bit-low'}">${bit}</span>`
        ).join('')}</span>`
    ).join('')}
                    </div>
                    ${payloadTruncated ? `<span class="fisica-hex-ref">⋯ payload continua (${frameData.payload.length} bytes total)</span>` : ''}
                </div>

                <div class="fisica-wave">
                    <span class="fisica-wave-title">〰️ Representação do Sinal Digital</span>
                    <canvas id="fisica-wave-canvas" class="fisica-wave-canvas"></canvas>
                </div>
                ` : `
                <div class="fisica-error-box">
                    <span>⚠ Frame descartado — integridade comprometida. Nenhum dado transmitido.</span>
                </div>
                `}
            </div>
        </div>
    `;

    return { html, integridadeOk, frameData };
}

/**
 * Inicializa o canvas do sinal digital na camada física.
 * Desenha uma onda quadrada representando os primeiros bits do payload.
 */
export function initFisicaCanvas(frameData) {
    const canvas = document.getElementById('fisica-wave-canvas');
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = 850, ch = 120;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Pegar os primeiros 48 bytes do payload em bits
    const preview = frameData.payload.substring(0, 48);
    const bits = [];
    for (let i = 0; i < preview.length; i++) {
        const byte = preview.charCodeAt(i);
        for (let b = 7; b >= 0; b--) {
            bits.push((byte >> b) & 1);
        }
    }

    const totalBits = bits.length;
    const bitWidth = (cw - 40) / totalBits;
    const highY = 25;
    const lowY = ch - 25;
    const midY = (highY + lowY) / 2;

    // Fundo
    ctx.fillStyle = 'rgba(5, 10, 25, 0.9)';
    ctx.fillRect(0, 0, cw, ch);

    // Grid horizontal
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    [highY, midY, lowY].forEach(y => {
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(cw - 20, y);
        ctx.stroke();
    });
    ctx.setLineDash([]);

    // Labels
    ctx.font = '9px Courier New';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'right';
    ctx.fillText('HIGH (1)', 16, highY + 4);
    ctx.fillText('LOW (0)', 16, lowY + 4);

    // Onda quadrada com glow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 255, 180, 0.6)';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#00ffb4';
    ctx.lineWidth = 2;
    ctx.beginPath();

    let x = 20;
    let prevY = bits[0] === 1 ? highY : lowY;
    ctx.moveTo(x, prevY);

    for (let i = 0; i < totalBits; i++) {
        const currentY = bits[i] === 1 ? highY : lowY;
        // Transição vertical
        if (currentY !== prevY) {
            ctx.lineTo(x, currentY);
        }
        // Segmento horizontal
        ctx.lineTo(x + bitWidth, currentY);
        x += bitWidth;
        prevY = currentY;
    }

    ctx.stroke();
    ctx.restore();

    // Indicadores de bit (amostra a cada N bits)
    const step = Math.max(1, Math.floor(totalBits / 32));
    ctx.font = '7px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < totalBits; i += step) {
        const bx = 20 + i * bitWidth + bitWidth / 2;
        ctx.fillText(bits[i].toString(), bx, ch - 6);
    }
}
