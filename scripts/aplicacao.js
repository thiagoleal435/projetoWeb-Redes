// =============================================
// Camada 7 — Aplicação
// Dados "puros" do usuário formatados como envelope SMTP
// =============================================

/**
 * Renderiza a camada de Aplicação com os dados do formulário
 * formatados como comandos de um envelope SMTP.
 * @param {Object} emailData - Dados do formulário (remetente, destinatario, assunto, corpo, protocolo, timestamp).
 * @returns {string} HTML da camada de Aplicação.
 */
export function renderAplicacao(emailData) {
    return `
        <div class="osi-layer layer-7">
            <div class="osi-layer-header">
                <div class="osi-layer-badge">7</div>
                <div class="osi-layer-title">
                    <span>Camada de Aplicação</span>
                    <span>Dados do usuário — Envelope SMTP</span>
                </div>
            </div>
            <div class="osi-layer-content">
                <span class="smtp-line">
                    <span class="smtp-command">Remetente:</span>
                    <span class="smtp-value"> &lt;${emailData.remetente}&gt;</span>
                </span>
                <span class="smtp-line">
                    <span class="smtp-command">Destinatário:</span>
                    <span class="smtp-value"> &lt;${emailData.destinatario}&gt;</span>
                </span>
                <span class="smtp-line">
                    <span class="smtp-command">Assunto:</span>
                    <span class="smtp-value"> ${emailData.assunto}</span>
                </span>
                <span class="smtp-line">
                    <span class="smtp-command">Data:</span>
                    <span class="smtp-value"> ${emailData.timestamp}</span>
                </span>
                <span class="smtp-line">
                    <span class="smtp-command">Protocolo:</span>
                    <span class="smtp-value"> ${emailData.protocolo}</span>
                </span>
                <span class="smtp-line" style="margin-top: 0.5rem; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 0.5rem;">
                    <span class="smtp-command">Corpo:</span>
                </span>
                <span class="smtp-line">
                    <span class="smtp-value">${emailData.corpo}</span>
                </span>
            </div>
        </div>
    `;
}