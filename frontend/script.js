// Define a URL base da sua API
const BASE_URL = 'http://172.16.0.239:3000';
let pollingIntervalId = null;
let loadedRecipients = []; // Armazena contatos da planilha, se houver

// Executa quando o conteúdo da página é carregado
document.addEventListener('DOMContentLoaded', () => {
    // Carrega a matrícula salva, se existir
    const savedMatricula = localStorage.getItem('matricula');
    if (savedMatricula) {
        document.getElementById('matricula').value = savedMatricula;
    }

    // --- Lógica para upload e pré-visualização de imagem ---
    const messageBox = document.getElementById('messageBox');
    const uploadButton = document.getElementById('uploadButton');
    const imageInput = document.getElementById('imageInput');
    const previewImage = document.getElementById('previewImage');
    const removeImageButton = document.getElementById('removeImageButton');
    uploadButton.addEventListener('click', () => imageInput.click());
    messageBox.addEventListener('dragover', (e) => { e.preventDefault(); messageBox.classList.add('dragover'); });
    messageBox.addEventListener('dragleave', () => { messageBox.classList.remove('dragover'); });
    messageBox.addEventListener('drop', (e) => {
        e.preventDefault();
        messageBox.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) { imageInput.files = e.dataTransfer.files; showPreview(file); }
    });
    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) { showPreview(file); }
    });
    removeImageButton.addEventListener('click', () => {
        imageInput.value = '';
        previewImage.src = '';
        previewImage.style.display = 'none';
        removeImageButton.style.display = 'none';
        uploadButton.style.display = 'inline-block';
    });
    function showPreview(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                previewImage.src = reader.result;
                previewImage.style.display = 'block';
                removeImageButton.style.display = 'inline-block';
                uploadButton.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    }

    // --- Lógica para o modal de informações ---
    const infoButton = document.getElementById('infoButton');
    const infoModal = document.getElementById('infoModal');
    const closeModal = document.getElementById('closeModal');
    infoButton.addEventListener('click', () => { infoModal.style.display = 'flex'; });
    closeModal.addEventListener('click', () => { infoModal.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === infoModal) { infoModal.style.display = 'none'; } });


    // --- Lógica CORRIGIDA E VERIFICADA para ler a planilha ---
    const fileInput = document.getElementById('spreadsheet');
    const fileStatus = document.getElementById('fileStatus');
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];

        if (!file) {
            loadedRecipients = [];
            fileStatus.textContent = "Nenhum arquivo selecionado.";
            return;
        }

        const filename = file.name;
        fileStatus.textContent = `Lendo arquivo: ${filename}...`;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

                loadedRecipients = jsonData.map(row => {
                    const number = String(row[1] || '').replace(/\D/g, '');
                    return { name: row[0] || 'Contato', number: number, paciente: row[2] || '', data: row[3] || '', hora: row[4] || '' };
                }).filter(r => r.number);

                if (loadedRecipients.length > 0) {
                    fileStatus.textContent = `✅ ${loadedRecipients.length} contatos carregados! | Arquivo: ${filename}`;
                } else {
                    fileStatus.textContent = `❌ Nenhum contato válido no arquivo: ${filename}`;
                    loadedRecipients = [];
                }
            } catch (error) {
                console.error("Erro ao ler a planilha:", error);
                fileStatus.textContent = `❌ Erro ao processar o arquivo: ${filename}.`;
                loadedRecipients = [];
            }
        };
        reader.readAsArrayBuffer(file);
    });
});

// --- FUNÇÕES DE AUTENTICAÇÃO (Completas) ---
async function authenticateWithMatricula() {
    if (pollingIntervalId) { clearInterval(pollingIntervalId); }
    const matricula = document.getElementById('matricula').value.trim();
    const statusElement = document.getElementById('qrStatus');
    const qrCodeImage = document.getElementById('qrCode');
    if (!matricula) { statusElement.textContent = "Por favor, insira a matrícula."; return; }
    localStorage.setItem('matricula', matricula);
    statusElement.textContent = "Autenticando, por favor aguarde...";
    qrCodeImage.style.display = 'none';
    try {
        const response = await fetch(`${BASE_URL}/authenticate`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matricula }),
        });
        const data = await response.json();
        if (!response.ok) { statusElement.textContent = `Erro: ${data.message}`; return; }
        statusElement.textContent = data.message;
        pollingIntervalId = setInterval(() => { verificarStatus(matricula); }, 3000);
    } catch (error) {
        console.error('Erro ao autenticar:', error);
        statusElement.textContent = 'Erro de conexão: não foi possível conectar ao servidor.';
    }
}
async function verificarStatus(matricula) {
    const statusElement = document.getElementById('qrStatus');
    const qrCodeImage = document.getElementById('qrCode');
    const clearAuthButton = document.getElementById('clearAuthButton');
    try {
        const response = await fetch(`${BASE_URL}/get-qr/${matricula}`);
        if (!response.ok) throw new Error('Resposta do servidor não foi OK');
        const data = await response.json();
        switch (data.status) {
            case 'AUTHENTICATED':
                statusElement.textContent = data.message;
                qrCodeImage.style.display = 'none';
                clearAuthButton.style.display = 'none';
                clearInterval(pollingIntervalId);
                break;
            case 'QR_CODE_READY':
                statusElement.textContent = data.message;
                qrCodeImage.src = data.qrCode;
                qrCodeImage.style.display = 'block';
                clearAuthButton.style.display = 'inline-block';
                break;
            case 'INITIALIZING':
                statusElement.textContent = data.message;
                break;
        }
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        statusElement.textContent = 'Perda de conexão com o servidor. Tentando novamente...';
    }
}
function clearAuthentication() {
    if (pollingIntervalId) { clearInterval(pollingIntervalId); }
    document.getElementById('qrCode').style.display = 'none';
    document.getElementById('clearAuthButton').style.display = 'none';
    document.getElementById('qrStatus').textContent = 'Autenticação limpa. Insira a matrícula novamente.';
}

// --- FUNÇÃO DE ENVIO DE MENSAGEM (Com a Lógica de Prioridade) ---
async function sendMessage() {
    const matricula = document.getElementById('matricula').value.trim();
    const messageTemplate = document.getElementById('message').value.trim();
    const imageInput = document.getElementById('imageInput');
    const statusElement = document.getElementById('status');
    const sendButton = document.getElementById('sendButton');

    let recipients = [];
    const rawNumbers = document.getElementById('numbers').value.trim();

    // LÓGICA DE PRIORIDADE: Planilha > Texto
    if (loadedRecipients.length > 0) {
        recipients = loadedRecipients;
    } else if (rawNumbers) {
        recipients = rawNumbers.split('\n').filter(line => line.trim() !== '').map(line => {
            const [contactPart, ...detailsParts] = line.split(';');
            const [name, number] = contactPart.split(':').map(item => item.trim());
            const details = detailsParts.map(item => item.trim());
            return {
                name: name || 'Contato', number: number ? number.replace(/\D/g, '') : '', paciente: details[0] || '', data: details[1] || '', hora: details[2] || ''
            };
        }).filter(r => r.number);
    }

    // Validação
    if (!matricula || recipients.length === 0 || (!messageTemplate && imageInput.files.length === 0)) {
        statusElement.textContent = "Preencha matrícula, contatos (na área de texto ou planilha) e a mensagem ou imagem.";
        return;
    }

    sendButton.disabled = true;
    statusElement.textContent = "Iniciando processo de envio...";

    try {
        let uploadedImagePath = null;
        if (imageInput.files.length > 0) {
            statusElement.textContent = "Enviando imagem para o servidor...";
            const formData = new FormData();
            formData.append('image', imageInput.files[0]);
            const uploadResponse = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: formData });
            if (!uploadResponse.ok) throw new Error('Falha no upload da imagem.');
            const data = await uploadResponse.json();
            uploadedImagePath = data.path;
        }
        statusElement.textContent = `Preparando para enviar ${recipients.length} mensagens...`;
        const response = await fetch(`${BASE_URL}/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matricula, recipients, messageTemplate, mediaUrl: uploadedImagePath
            }),
        });
        const responseData = await response.text();
        if (response.ok) {
            statusElement.textContent = `✅ Sucesso! ${responseData}`;
        } else {
            statusElement.textContent = `❌ Erro no servidor: ${responseData}`;
        }
    } catch (error) {
        console.error('Erro no envio geral:', error);
        statusElement.textContent = `❌ Erro: ${error.message}`;
    } finally {
        sendButton.disabled = false;
    }
}