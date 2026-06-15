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
 * Mostra estado de carregamento no container OSI.
 */
function showLoading(message) {
    const container = document.getElementById('osi-layers-container');
    if (!container) return;

    container.innerHTML = `
        <div class="osi-layer layer-7" style="animation-delay: 0s;">
            <div class="osi-layer-header">
                <div class="osi-layer-badge">7</div>
                <div class="osi-layer-title">
                    <span>Camada de Aplicação</span>
                </div>
            </div>
            <div class="osi-layer-content">
                <span class="smtp-line">
                    <span class="smtp-command">${message}</span>
                </span>
            </div>
        </div>
    `;

    container.classList.add('active');
}

// Atualiza nome e protocolo ao digitar
input.addEventListener('input', function () {
    const value = input.value.trim();
    user.innerHTML = `usuário : ${value !== '' ? value : USER_NAME}`;
    protocol.textContent = getProtocol(value);
});

// Leitura de arquivo para detectar protocolo pelo conteúdo
fileInput.addEventListener('change', function () {
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const content = e.target.result;
            protocol.textContent = getProtocol(content);
        };
        reader.readAsText(file);
    }
});

// Botão de requisição
button.addEventListener('click', async function () {
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

        // Mostrar loading enquanto resolve DNS
        showLoading(`Resolvendo DNS para ${hostname}...`);

        try {
            const dnsData = await resolveDNS(hostname);
            const hasAnswer = dnsData.Answer && dnsData.Answer.length > 0;
            const ip = hasAnswer ? dnsData.Answer[0].data : 'Não resolvido';

            // Montar objeto HTTP para as camadas OSI
            const httpData = {
                dominio: hostname,
                metodo: 'GET',
                hostIP: ip,
                protocolo: detectedProtocol,
                usuario: USER_NAME
            };

            // Renderizar as 3 camadas OSI com os dados HTTP
            renderOSILayers(httpData, 'http');
        } catch (err) {
            // Em caso de erro de rede, montar com IP desconhecido
            const httpData = {
                dominio: hostname,
                metodo: 'GET',
                hostIP: 'Erro na resolução DNS',
                protocolo: detectedProtocol,
                usuario: USER_NAME
            };

            renderOSILayers(httpData, 'http');
        }
    } else {
        section.style.display = 'none';
        sectionForm.innerHTML = '';
    }
});

// Submit handler do formulário da seção (SMTP)
sectionForm.addEventListener('submit', function (e) {
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
    renderOSILayers(email, 'smtp');
});

