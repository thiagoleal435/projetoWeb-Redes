// =============================================
// Camada 6 — Apresentação
// Codificação, serialização e integridade dos dados (JWT)
// =============================================

/**
 * Codifica uma string em Base64 URL-safe (padrão JWT).
 * @param {string} str
 * @returns {string}
 */
function base64UrlEncode(str) {
    return btoa(unescape(encodeURIComponent(str)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Gera uma assinatura HMAC-SHA256 simulada (determinística, para fins didáticos).
 * Em produção, usaríamos crypto.subtle, mas aqui simulamos para manter sincronia.
 * @param {string} input - String header.payload
 * @param {string} secret - Chave secreta
 * @returns {string} Assinatura simulada em Base64 URL-safe
 */
function simulateHmacSignature(input, secret) {
    let hash = 0;
    const combined = input + secret;
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // Gerar uma string que pareça uma assinatura real
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    const fakeSignature = base64UrlEncode(
        hex.repeat(4) + combined.length.toString(16).padStart(4, '0')
    );
    return fakeSignature;
}

/**
 * Gera um JWT simplificado a partir dos dados do e-mail.
 * @param {Object} emailData - Dados do formulário.
 * @returns {Object} { token, headerObj, payloadObj, headerB64, payloadB64, signature }
 */
function generateJWT(emailData) {
    const headerObj = {
        alg: "HS256",
        typ: "JWT"
    };

    const payloadObj = {
        sub: emailData.remetente,
        to: emailData.destinatario,
        subject: emailData.assunto,
        body: emailData.corpo,
        protocol: emailData.protocolo,
        iat: Math.floor(new Date(emailData.timestamp).getTime() / 1000),
        exp: Math.floor(new Date(emailData.timestamp).getTime() / 1000) + 3600
    };

    const headerB64 = base64UrlEncode(JSON.stringify(headerObj));
    const payloadB64 = base64UrlEncode(JSON.stringify(payloadObj));
    const signature = simulateHmacSignature(
        headerB64 + '.' + payloadB64,
        'osi-model-secret-key'
    );

    const token = `${headerB64}.${payloadB64}.${signature}`;

    return { token, headerObj, payloadObj, headerB64, payloadB64, signature };
}

/**
 * Renderiza a camada de Apresentação com o JWT decomposto.
 * @param {Object} emailData - Dados do formulário.
 * @returns {{ html: string, token: string }} HTML da camada + token JWT completo.
 */
export function renderApresentacao(emailData) {
    const jwt = generateJWT(emailData);

    const html = `
        <div class="osi-layer layer-6">
            <div class="osi-layer-header">
                <div class="osi-layer-badge">6</div>
                <div class="osi-layer-title">
                    <span>Camada de Apresentação</span>
                    <span>Codificação e serialização — JWT (JSON Web Token)</span>
                </div>
            </div>
            <div class="osi-layer-content">
                <div class="jwt-display">
                    <div class="jwt-part jwt-header">
                        <span class="jwt-part-label">Cabeçalho</span>
                        <div class="jwt-part-value">${jwt.headerB64}</div>
                        <div class="jwt-decoded">
                            <pre>${JSON.stringify(jwt.headerObj, null, 2)}</pre>
                        </div>
                    </div>
                    <div class="jwt-part jwt-payload">
                        <span class="jwt-part-label">Dados do e-mail</span>
                        <div class="jwt-part-value">${jwt.payloadB64}</div>
                        <div class="jwt-decoded">
                            <pre>${JSON.stringify(jwt.payloadObj, null, 2)}</pre>
                        </div>
                    </div>
                    <div class="jwt-part jwt-signature">
                        <span class="jwt-part-label">Assinatura (HMAC-SHA256)</span>
                        <div class="jwt-part-value">${jwt.signature}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return { html, token: jwt.token };
}