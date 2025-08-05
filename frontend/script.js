const BASE_URL = 'http://172.16.0.239:3000';
let uploadedImagePath = null;

document.addEventListener('DOMContentLoaded', () => {
    const savedMatricula = localStorage.getItem('matricula');
    if (savedMatricula) {
        document.getElementById('matricula').value = savedMatricula;
    }

    const messageBox = document.getElementById('messageBox');
    const uploadButton = document.getElementById('uploadButton');
    const imageInput = document.getElementById('imageInput');
    const previewImage = document.getElementById('previewImage');
    const removeImageButton = document.getElementById('removeImageButton');

    uploadButton.addEventListener('click', () => imageInput.click());

    messageBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        messageBox.classList.add('dragover');
    });

    messageBox.addEventListener('dragleave', () => {
        messageBox.classList.remove('dragover');
    });

    messageBox.addEventListener('drop', (e) => {
        e.preventDefault();
        messageBox.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        imageInput.files = e.dataTransfer.files;
        showPreview(file);
    });

    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        showPreview(file);
    });

    removeImageButton.addEventListener('click', () => {
        imageInput.value = '';
        previewImage.src = '';
        previewImage.style.display = 'none';
        removeImageButton.style.display = 'none';
        uploadButton.style.display = 'inline-block'; // Mostra o botão de clipe novamente
        uploadedImagePath = null;
    });

    function showPreview(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                previewImage.src = reader.result;
                previewImage.style.display = 'block';
                removeImageButton.style.display = 'inline-block';
                uploadButton.style.display = 'none'; // Esconde o botão de clipe
            };
            reader.readAsDataURL(file);
        }
    }

    const infoButton = document.getElementById('infoButton');
    const infoModal = document.getElementById('infoModal');
    const closeModal = document.getElementById('closeModal');

    infoButton.addEventListener('click', () => {
        infoModal.style.display = 'flex';
    });

    closeModal.addEventListener('click', () => {
        infoModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === infoModal) {
            infoModal.style.display = 'none';
        }
    });

});

async function authenticateWithMatricula() {
    const matricula = document.getElementById('matricula').value.trim();
    const statusElement = document.getElementById('qrStatus');
    const qrCodeImage = document.getElementById('qrCode');
    const clearAuthButton = document.getElementById('clearAuthButton');

    if (!matricula) {
        statusElement.textContent = "Por favor, insira a matrícula.";
        return;
    }

    localStorage.setItem('matricula', matricula);

    try {
        const response = await fetch(`${BASE_URL}/authenticate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matricula }),
        });

        if (response.ok) {
            statusElement.textContent = `Autenticação iniciada para matrícula: ${matricula}`;

            const interval = setInterval(async () => {
                const status = await checkAuthenticationStatus(matricula);
                if (status === 'authenticated') {
                    statusElement.textContent = 'Você foi autenticado com sucesso! ✅';
                    qrCodeImage.style.display = 'none';
                    clearAuthButton.style.display = 'none';
                    clearInterval(interval);
                } else if (status === 'qr') {
                    await generateQRCode(matricula);
                } else {
                    statusElement.textContent = 'Aguardando autenticação...';
                }
            }, 3000);
        } else {
            const message = await response.text();
            statusElement.textContent = `Erro: ${message}`;
        }
    } catch (error) {
        console.error('Erro ao autenticar:', error);
        statusElement.textContent = 'Erro ao conectar ao servidor.';
    }
}

async function generateQRCode(matricula) {
    const qrCodeImage = document.getElementById('qrCode');
    const statusElement = document.getElementById('qrStatus');
    const clearAuthButton = document.getElementById('clearAuthButton');

    try {
        const response = await fetch(`${BASE_URL}/get-qr/${matricula}`);

        if (response.ok) {
            const data = await response.json();

            if (data.qrCode) {
                qrCodeImage.src = data.qrCode;
                qrCodeImage.style.display = 'block';
                statusElement.textContent = 'Escaneie o QR Code para autenticar.';
                clearAuthButton.style.display = 'inline-block';
            }
        } else {
            statusElement.textContent = 'Aguardando autenticação...';
            qrCodeImage.style.display = 'none';
            clearAuthButton.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao obter QR Code:', error);
        statusElement.textContent = 'Erro ao conectar ao servidor.';
        qrCodeImage.style.display = 'none';
        clearAuthButton.style.display = 'none';
    }
}

async function checkAuthenticationStatus(matricula) {
    try {
        const response = await fetch(`${BASE_URL}/get-qr/${matricula}`);
        if (!response.ok) return 'pending';

        const data = await response.json();

        if (data.message === 'Já autenticado') return 'authenticated';
        if (data.qrCode) return 'qr';

        return 'pending';
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        return 'pending';
    }
}

function clearAuthentication() {
    const qrCodeImage = document.getElementById('qrCode');
    const statusElement = document.getElementById('qrStatus');
    const clearAuthButton = document.getElementById('clearAuthButton');

    qrCodeImage.style.display = 'none';
    clearAuthButton.style.display = 'none';
    statusElement.textContent = 'Autenticação limpa. Insira a matrícula novamente.';
}

async function sendMessage() {
    const matricula = document.getElementById('matricula').value.trim();
    const numbersField = document.getElementById('numbers');
    const rawNumbers = numbersField.value.trim();
    const messageTemplate = document.getElementById('message').value.trim();
    const statusElement = document.getElementById('status');
    const imageInput = document.getElementById('imageInput');

    if (!statusElement) {
        console.error('Elemento de status não encontrado no DOM!');
        return;
    }

    uploadedImagePath = null;

    if (!matricula) {
        statusElement.textContent = "Por favor, insira sua matrícula.";
        return;
    }

    if (!rawNumbers || (!messageTemplate && imageInput.files.length === 0)) {
        statusElement.textContent = "Insira ao menos uma mensagem ou uma imagem.";
        return;
    }

    if (imageInput.files.length > 0) {
        const formData = new FormData();
        formData.append('image', imageInput.files[0]);

        try {
            const uploadResponse = await fetch(`${BASE_URL}/upload`, {
                method: 'POST',
                body: formData
            });

            if (uploadResponse.ok) {
                const data = await uploadResponse.json();
                uploadedImagePath = data.path;
            } else {
                console.error('Erro ao enviar imagem');
            }
        } catch (err) {
            console.error('Erro ao fazer upload:', err);
        }
    }

    const recipients = rawNumbers.split(',').map(entry => {
        const [name, number] = entry.split(':').map(item => item.trim());
        return { name: name || 'Usuário', number };
    });

    let successCount = 0;
    let errorCount = 0;
    statusElement.textContent = "Iniciando envio de mensagens...";

    try {
        for (const { name, number } of recipients) {
            const personalizedMessage = messageTemplate.replace(/{nome}/g, name);

            try {
                const response = await fetch(`${BASE_URL}/send-message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        matricula,
                        recipients: [{ name, number }],
                        messageTemplate: personalizedMessage,
                        mediaUrl: uploadedImagePath
                    }),
                });

                if (response.ok) {
                    successCount++;
                    statusElement.textContent = `Mensagem enviada para ${name || number}.`;
                } else {
                    const message = await response.text();
                    errorCount++;
                    statusElement.textContent = `Erro ao enviar para ${name || number}: ${message}`;
                }
            } catch (error) {
                errorCount++;
                statusElement.textContent = `Erro ao conectar ao servidor ao enviar para ${name || number}.`;
            }

            await new Promise(resolve => setTimeout(resolve, 6000));
        }

        if (successCount > 0 && errorCount === 0) {
            statusElement.textContent = "Envio concluído para todos os destinatários!";
        } else if (successCount > 0) {
            statusElement.textContent = `Envio concluído com ${successCount} sucesso(s) e ${errorCount} erro(s).`;
        } else {
            statusElement.textContent = "Falha ao enviar mensagens para todos os destinatários.";
        }
    } catch (error) {
        console.error('Erro no envio geral:', error);
        statusElement.textContent = 'Erro inesperado ao conectar ao servidor.';
    }
}
