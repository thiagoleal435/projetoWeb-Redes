import { renderOSILayers } from './osi.js';

const USER_NAME = 'thiago.leal';
const user = document.querySelector('.header-user');
const protocol = document.querySelector('.main-result-protocol');

user.innerHTML = `usuário : ${USER_NAME}`;

const input = document.querySelector('.main-input');
const button = document.querySelector('.main-button');
const fileInput = document.querySelector('.main-file-input');

const email = {
    remetente: '',
    destinatario: '',
    assunto: '',
    corpo: '',
    protocolo: '',
    timestamp: ''
};

const section = document.querySelector('.section');
const sectionForm = document.querySelector('.section-form');

function getProtocol(requestText) {
    if (!requestText) return 'HTTP';
    const text = requestText.toLowerCase();
    if (text.includes('www.') || text.startsWith('http://') || text.startsWith('https://')) {
        return 'HTTP/HTTPS';
    }
    if (text.includes('@')) {
        return 'SMTP/POP3';
    }
    if (text.startsWith('ftp://') || text === 'ftp') {
        return 'FTP';
    }
    return 'WEBSOCKET';
}

/**
 * Extrai o hostname de uma string de URL (remove protocolo, www., e caminhos).
 * Ex: "https://www.ifpe.edu.br/pagina" → "ifpe.edu.br"
 */
function extractHostname(urlString) {
    let hostname = urlString.trim();
    // Remover protocolo
    hostname = hostname.replace(/^https?:\/\//i, '');
    // Remover www.
    hostname = hostname.replace(/^www\./i, '');
    // Remover caminho, query e fragmento
    hostname = hostname.split('/')[0];
    hostname = hostname.split('?')[0];
    hostname = hostname.split('#')[0];
    // Remover porta
    hostname = hostname.split(':')[0];
    return hostname;
}

/**
 * Consulta o DNS do Google para resolver o IP de um domínio.
 * @param {string} domain - Domínio a resolver.
 * @returns {Promise<Object>} Dados da resolução DNS.
 */
async function resolveDNS(domain) {
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
    const data = await response.json();
    return data;
}

/**
 * Renderiza o resultado da resolução DNS no container OSI.
 */
function renderDNSResult(domain, dnsData) {
    const container = document.getElementById('osi-layers-container');
    if (!container) return;

    const hasAnswer = dnsData.Answer && dnsData.Answer.length > 0;
    const ip = hasAnswer ? dnsData.Answer[0].data : null;
    const ttl = hasAnswer ? dnsData.Answer[0].TTL : null;
    const statusCode = dnsData.Status;
    const statusText = statusCode === 0 ? 'NOERROR' : `ERRO (código ${statusCode})`;

    // Renderizar todas as respostas DNS (pode haver múltiplos IPs)
    let answersHTML = '';
    if (hasAnswer) {
        answersHTML = dnsData.Answer.map((ans, i) => `
            <span class="smtp-line">
                <span class="smtp-command">Registro ${i + 1}:</span>
                <span class="smtp-value"> ${ans.data} (TTL: ${ans.TTL}s, Tipo: ${ans.type === 1 ? 'A' : ans.type})</span>
            </span>
        `).join('');
    } else {
        answersHTML = `
            <span class="smtp-line">
                <span class="smtp-command" style="color: #ff6b6b;">Nenhum registro encontrado para este domínio.</span>
            </span>
        `;
    }

    container.innerHTML = `
        <div class="osi-layer layer-7">
            <div class="osi-layer-header">
                <div class="osi-layer-badge">DNS</div>
                <div class="osi-layer-title">
                    <span>Resolução DNS</span>
                    <span>Tradução de domínio para endereço IP via Google DNS (8.8.8.8)</span>
                </div>
            </div>
            <div class="osi-layer-content">
                <span class="smtp-line">
                    <span class="smtp-command">Domínio:</span>
                    <span class="smtp-value"> ${domain}</span>
                </span>
                <span class="smtp-line">
                    <span class="smtp-command">Servidor DNS:</span>
                    <span class="smtp-value"> dns.google (8.8.8.8)</span>
                </span>
                <span class="smtp-line">
                    <span class="smtp-command">Tipo de consulta:</span>
                    <span class="smtp-value"> A (IPv4)</span>
                </span>
                <span class="smtp-line">
                    <span class="smtp-command">Status:</span>
                    <span class="smtp-value"> ${statusText}</span>
                </span>
                <span class="smtp-line" style="margin-top: 0.5rem; border-top: 1px dashed rgba(0,0,0,0.15); padding-top: 0.5rem;">
                    <span class="smtp-command">Respostas:</span>
                </span>
                ${answersHTML}
                ${ip ? `
                <span class="smtp-line" style="margin-top: 0.75rem; border-top: 1px dashed rgba(0,0,0,0.15); padding-top: 0.75rem;">
                    <span class="smtp-command" style="font-size: 1.1em;">IP Resolvido →</span>
                    <span class="smtp-value" style="font-size: 1.1em; font-weight: 700;"> ${ip}</span>
                </span>
                ` : ''}
            </div>
        </div>
        <button class="osi-reset-btn" id="osi-reset-btn">Nova Requisição</button>
    `;

    container.classList.add('active');

    document.getElementById('osi-reset-btn').addEventListener('click', () => {
        container.classList.remove('active');
        container.innerHTML = '';
    });
}

/**
 * Mostra estado de carregamento no container OSI.
 */
function renderDNSLoading(domain) {
    const container = document.getElementById('osi-layers-container');
    if (!container) return;

    container.innerHTML = `
        <div class="osi-layer layer-7" style="animation-delay: 0s;">
            <div class="osi-layer-header">
                <div class="osi-layer-badge">DNS</div>
                <div class="osi-layer-title">
                    <span>Resolução DNS</span>
                    <span>Consultando dns.google para ${domain}...</span>
                </div>
            </div>
            <div class="osi-layer-content">
                <span class="smtp-line">
                    <span class="smtp-command">Resolvendo</span>
                    <span class="smtp-value"> ${domain}...</span>
                </span>
            </div>
        </div>
    `;

    container.classList.add('active');
}

// Atualiza nome e protocolo ao digitar
input.addEventListener('input', function() {
    const value = input.value.trim();
    user.innerHTML = `usuário : ${value !== '' ? value : USER_NAME}`;
    protocol.textContent = getProtocol(value);
});

// Leitura de arquivo para detectar protocolo pelo conteúdo
fileInput.addEventListener('change', function() {
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            protocol.textContent = getProtocol(content);
        };
        reader.readAsText(file);
    }
});

// Botão de requisição
button.addEventListener('click', async function() {
    const req = input.value.trim();
    const detectedProtocol = getProtocol(req);

    // Esconder container OSI caso esteja visível de um envio anterior
    const osiContainer = document.getElementById('osi-layers-container');
    if (osiContainer) {
        osiContainer.classList.remove('active');
        osiContainer.innerHTML = '';
    }

    if (detectedProtocol === 'SMTP/POP3') {
        const now = new Date().toISOString();
        email.protocolo = 'SMTP/POP3';
        email.timestamp = now;
        section.style.display = 'flex';

        sectionForm.innerHTML = `
            <label>Remetente</label>
            <input name="remetente" type="email" value="${email.remetente}">
            <label>Destinatário</label>
            <input name="destinatario" type="email" value="${email.destinatario}">
            <label>Assunto</label>
            <input name="assunto" type="text" value="${email.assunto}">
            <label>Corpo</label>
            <textarea name="corpo">${email.corpo}</textarea>
            <label>Protocolo</label>
            <input name="protocolo" type="text" value="${email.protocolo}" readonly>
            <label>Timestamp</label>
            <input name="timestamp" type="text" value="${email.timestamp}" readonly>
            <button type="submit">Enviar</button>
        `;
    } else if (detectedProtocol === 'HTTP/HTTPS') {
        section.style.display = 'none';
        sectionForm.innerHTML = '';

        const hostname = extractHostname(req);
        if (!hostname) return;

        // Mostrar loading
        renderDNSLoading(hostname);

        try {
            const dnsData = await resolveDNS(hostname);
            renderDNSResult(hostname, dnsData);
        } catch (err) {
            const container = document.getElementById('osi-layers-container');
            if (container) {
                container.innerHTML = `
                    <div class="osi-layer layer-7">
                        <div class="osi-layer-header">
                            <div class="osi-layer-badge">DNS</div>
                            <div class="osi-layer-title">
                                <span>Resolução DNS</span>
                                <span>Erro na consulta</span>
                            </div>
                        </div>
                        <div class="osi-layer-content">
                            <span class="smtp-line">
                                <span class="smtp-command" style="color: #ff6b6b;">Erro:</span>
                                <span class="smtp-value"> Não foi possível resolver ${hostname}. Verifique a URL e tente novamente.</span>
                            </span>
                        </div>
                    </div>
                    <button class="osi-reset-btn" id="osi-reset-btn">Nova Requisição</button>
                `;
                container.classList.add('active');
                document.getElementById('osi-reset-btn').addEventListener('click', () => {
                    container.classList.remove('active');
                    container.innerHTML = '';
                });
            }
        }
    } else {
        section.style.display = 'none';
        sectionForm.innerHTML = '';
    }
});

// Submit handler do formulário da seção
sectionForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const fd = new FormData(sectionForm);
    email.remetente = fd.get('remetente') || '';
    email.destinatario = fd.get('destinatario') || '';
    email.assunto = fd.get('assunto') || '';
    email.corpo = fd.get('corpo') || '';
    email.protocolo = fd.get('protocolo') || email.protocolo;
    email.timestamp = fd.get('timestamp') || email.timestamp;

    // Esconder o formulário
    section.style.display = 'none';
    sectionForm.innerHTML = '';

    // Renderizar as camadas OSI com os dados capturados
    renderOSILayers(email);
});
