import getFormData from "./aplicacao";

const email = getFormData();

function aplicarCifraDeCesar(email, deslocamento) {
    return email.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const codigo = char.charCodeAt(0);
            const base = (codigo >= 97) ? 97 : 65;
            return String.fromCharCode((codigo - base + deslocamento) % 26 + base);
        }
        return char;
    }).join('');
}

const formulario = document.querySelector('form');
formulario.addEventListener('submit', (event) => {
    event.preventDefault();
    const emailCriptografado = aplicarCifraDeCesar(email, 3);
    alert(`Email criptografado: ${emailCriptografado}`);
});