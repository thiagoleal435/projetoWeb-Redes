const USER_NAME = 'thiago.leal';
const user = document.querySelector('.header-user');
const protocol = document.querySelector('.main-result-protocol');

user.innerHTML = `usuário : ${USER_NAME}`;

const input = document.querySelector('.main-input');
const button = document.querySelector('.main-button');
const fileInput = document.querySelector('.main-file-input');

export const email = {
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

// Botão de requisição: se for e-mail, mostra o formulário
button.addEventListener('click', function() {
    const req = input.value.trim();
    if (getProtocol(req) === 'SMTP/POP3') {
        const now = new Date().toISOString();
        email.protocolo = 'SMTP/POP3';
        email.timestamp = now;
        section.style.display = 'flex';

        sectionForm.innerHTML = `
            <label>Remetente</label>
            <input name="remetente" type="text" value="${email.remetente}">
            <label>Destinatário</label>
            <input name="destinatario" type="text" value="${email.destinatario}">
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
    } else {
        section.style.display = 'none';
        sectionForm.innerHTML = '';
    }
});

// Submit handler do formulário da seção (adicionado uma vez)
sectionForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const fd = new FormData(sectionForm);
    email.remetente = fd.get('remetente') || '';
    email.destinatario = fd.get('destinatario') || '';
    email.assunto = fd.get('assunto') || '';
    email.corpo = fd.get('corpo') || '';
    email.protocolo = fd.get('protocolo') || email.protocolo;
    email.timestamp = fd.get('timestamp') || email.timestamp;
    window.emailData = email;
    //alert(JSON.stringify(email));
    section.style.display = 'none';
    sectionForm.innerHTML = '';
});
