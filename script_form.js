// Função para exibir a notificação com esmaecimento
function showNotification(message) {
    const notificationBanner = document.getElementById("notificationBanner");
    notificationBanner.textContent = message;
    notificationBanner.classList.remove("hidden");
    notificationBanner.classList.add("show");

    // Esconder o banner após 3 segundos com fade-out
    setTimeout(() => {
        notificationBanner.classList.remove("show");
        notificationBanner.classList.add("hide");
        setTimeout(() => {
            notificationBanner.classList.add("hidden");
            notificationBanner.classList.remove("hide");
        }, 500); // Tempo para o fade-out
    }, 3000);
}

// Função para inicializar o input de telefone com intl-tel-input
function initializeTelephoneInput() {
    const input = document.querySelector("#telefone");
    window.intlTelInput(input, {
        initialCountry: "br",          // Define o país inicial para Brasil
        separateDialCode: false,       // Não exibe o código do país separadamente
        autoPlaceholder: false,        // Desabilita o placeholder automático
        formatOnDisplay: false,        // Desabilita formatação automática no display
        nationalMode: true,            // Mantém o número no formato nacional
        allowDropdown: false,          // Desabilita a mudança de país pelo usuário (opcional)
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js" // Script de utilidades
    });
}

// Função para formatar o número de telefone conforme o usuário digita
function formatPhoneNumber(value) {
    value = value.replace(/\D/g, '');

    if (value.length > 11) {
        value = value.slice(0, 11);
    }

    let formattedNumber;

    // Formata como (XX) 9 8765-4321
    formattedNumber = value.replace(/(\d{2})(\d)(\d{4})(\d{0,4})/, '($1) $2 $3-$4');

    return formattedNumber;
}

// Função para calcular a nova posição do cursor após a formatação
function getNewCursorPosition(oldPosition, oldValue, newValue) {
    // Conta o número de dígitos antes da posição antiga
    const digitsBeforeCursor = oldValue.slice(0, oldPosition).replace(/\D/g, '').length;

    // Encontra a posição na nova string que corresponde ao mesmo número de dígitos
    let newCursorPosition = 0;
    let digitsCount = 0;

    for (let i = 0; i < newValue.length; i++) {
        if (/\d/.test(newValue.charAt(i))) {
            digitsCount++;
        }
        if (digitsCount === digitsBeforeCursor) {
            newCursorPosition = i + 1; // +1 porque as posições são baseadas em 0
            break;
        }
    }

    // Se não alcançou o número desejado de dígitos, define o cursor no final
    if (digitsCount < digitsBeforeCursor) {
        newCursorPosition = newValue.length;
    }

    return newCursorPosition;
}

// Aguarda o DOM ser carregado antes de executar o código
window.addEventListener("DOMContentLoaded", (event) => {
    initializeForm();

    // Seleciona o elemento do formulário
    const nameForm = document.getElementById("nameForm");
    if (!nameForm) {
        console.error("Elemento 'nameForm' não encontrado.");
        return;
    }

    // Evento para aplicar a formatação conforme o usuário digita
    const telefoneInputElement = document.getElementById("telefone");
    if (telefoneInputElement) {
        telefoneInputElement.addEventListener('input', function (e) {
            const input = e.target;
            const cursorPosition = input.selectionStart;
            const unformattedValue = input.value;

            // Obtém apenas os dígitos do valor do input
            const numbers = unformattedValue.replace(/\D/g, '');

            // Formata o número
            const formattedNumber = formatPhoneNumber(numbers);

            // Define o novo valor
            input.value = formattedNumber;

            // Calcula a nova posição do cursor
            const newCursorPosition = getNewCursorPosition(cursorPosition, unformattedValue, formattedNumber);

            // Define a posição do cursor
            input.setSelectionRange(newCursorPosition, newCursorPosition);
        });

        // Exibir a mensagem de telefone válido quando o usuário começa a digitar
        telefoneInputElement.addEventListener("input", function () {
            const telefoneInfo = document.getElementById("telefoneInfo");
            if (telefoneInfo && !telefoneInfo.innerHTML) {
                // Exibe a mensagem apenas uma vez
                telefoneInfo.innerHTML = "Por favor, insira um telefone que possa receber SMS.";
            }
        });
    } else {
        console.error("Elemento 'telefone' não encontrado.");
    }

    // Função para processar o envio do formulário
    nameForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent the default form submission behavior
    
        const nomeElement = document.getElementById("nome");
        const sobrenomeElement = document.getElementById("sobrenome");
        const telefoneInput = document.getElementById("telefone");
    
        // Verify that the elements exist
        if (!nomeElement) {
            console.error("Elemento 'nome' não encontrado.");
        }
        if (!sobrenomeElement) {
            console.error("Elemento 'sobrenome' não encontrado.");
        }
        if (!telefoneInput) {
            console.error("Elemento 'telefone' não encontrado.");
        }
    
        // Retrieve the values from the input elements
        const nome = nomeElement.value;
        const sobrenome = sobrenomeElement.value;
        const telefone = telefoneInput.value;
    
        // Process the phone number
        // Remove all non-digit characters
        let digitsOnly = telefone.replace(/\D/g, '');
        // Remove leading zeros
        digitsOnly = digitsOnly.replace(/^0+/, '');
        // Remove leading '55' if present
        if (digitsOnly.startsWith('55')) {
            digitsOnly = digitsOnly.substring(2);
        }
        // Prepend '+55' to the digits
        let sanitizedTelefone = '+55' + digitsOnly;
    
        // Store the sanitized phone number and other details in sessionStorage
        sessionStorage.setItem("nome", nome);
        sessionStorage.setItem("sobrenome", sobrenome);
        sessionStorage.setItem("telefone", sanitizedTelefone);
    
        // Retrieve the CPF/CNPJ from sessionStorage
        const cpfCnpj = sessionStorage.getItem("cpfCnpj");
    
        if (!cpfCnpj) {
            showNotification("CPF/CNPJ não encontrado. Por favor, reinicie o processo.");
            return;
        }
    
        // Show loading animation on the button
        const spinner = document.getElementById("spinner");
        const btnText = document.getElementById("btnText");
        const checkmark = document.getElementById("checkmark");
    
        spinner.classList.remove("hidden");
        spinner.classList.add("show");
        btnText.classList.add("hidden");
    
        // Send the data to the backend, including the CPF/CNPJ
        fetch('https://django-server-production-f3c5.up.railway.app/api/send_verification_code/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone_number: sanitizedTelefone
            }),
        })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(({ status, body }) => {
            if (status === 200) {
                // Success: show the checkmark and redirect
                spinner.classList.add("hidden");
                checkmark.classList.remove("hidden");
                checkmark.classList.add("show");
    
                // Redirect to the code verification page after a brief interval
                setTimeout(() => {
                    window.location.href = "index_code.html";
                }, 1000); // Waits 1 second to show the checkmark
            } else {
                // Error: show the error message
                spinner.classList.add("hidden");
                btnText.classList.remove("hidden");
                showNotification(body.detail || "Erro ao enviar o código de verificação.");
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
            spinner.classList.add("hidden");
            btnText.classList.remove("hidden");
            showNotification("Erro ao enviar o código de verificação.");
        });
    });
});

// Função para exibir a saudação personalizada
function displayGreeting() {
    const saudacao = sessionStorage.getItem("saudacao") || "";
    const nomePessoa = sessionStorage.getItem("nomePessoa") || "";
    const empresaPessoa = sessionStorage.getItem("empresaPessoa") || "";

    let mensagem = "Olá";

    if (empresaPessoa) {
        mensagem += `, ${empresaPessoa}`;
    } else if (nomePessoa) {
        mensagem += `, ${nomePessoa}`;
    }

    const nomeDiv = document.getElementById("nomePessoa");
    if (nomeDiv) {
        nomeDiv.textContent = mensagem;
    }
}

// Função para inicializar o formulário
function initializeForm() {
    // Verifica se o CPF/CNPJ está disponível no sessionStorage
    const cpfCnpj = sessionStorage.getItem("cpfCnpj");

    if (!cpfCnpj) {
        // Se não estiver disponível, redireciona para a página inicial
        window.location.href = 'index.html';
        return;
    }

    displayGreeting();
    initializeTelephoneInput();
}
