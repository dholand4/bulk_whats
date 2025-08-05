function formatPhoneNumber(number) {
    number = number.replace(/[^\d]/g, '');
    if (!/^\d+$/.test(number)) {
        throw new Error('Número inválido. Use apenas dígitos.');
    }
    if (!number.startsWith('55')) {
        number = `55${number}`;
    }
    return number.replace(/^55(\d{2})9(\d{8})$/, '55$1$2');
}

module.exports = { formatPhoneNumber };
