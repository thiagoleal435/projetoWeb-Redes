const USER_NAME = 'thiago.leal';
const user = document.querySelector('.header-user');
const protocol = document.querySelector('.main-result-protocol');

user.innerHTML = `usuário : ${USER_NAME}`;

const input = document.querySelector('.main-input');
const button = document.querySelector('.main-button');
const fileInput = document.querySelector('.main-file-input');
const requestText = fileInput.value.trim();

function getProtocol(requestText) {
    const text = requestText.trim().toLowerCase();

    if (requestText.includes('www.')) {
        return 'HTTP/HTTPS';
    }
    else if (requestText.includes('@')) {
        return 'SMTP/POP3';
    }
    return 'WEBSOCKET';
}

input.addEventListener('input', function() {
    const value = input.value.trim();
    user.innerHTML = `usuário : ${value !== '' ? value : USER_NAME}`;
    protocol.textContent = getProtocol(value);
});

button.addEventListener('click', function() {
    const value = input.value.trim();
    alert(`Requisição realizada com o protocolo: ${getProtocol(value)}`);
});

fileInput.addEventListener('change', function() {
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            protocol.textContent = getProtocol(content);
        }
        reader.readAsText(file);
    }
});