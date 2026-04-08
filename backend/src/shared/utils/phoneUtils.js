const { whatsapp } = require('../../config');

function formatPhoneNumber(number) {
    let sanitizedNumber = String(number || '').replace(/[^\d]/g, '');

    if (!/^\d+$/.test(sanitizedNumber)) {
        throw new Error('Número inválido. Use apenas dígitos.');
    }

    if (!sanitizedNumber.startsWith(whatsapp.countryCode)) {
        sanitizedNumber = `${whatsapp.countryCode}${sanitizedNumber}`;
    }

    return sanitizedNumber.replace(/^55(\d{2})9(\d{8})$/, '55$1$2');
}

module.exports = {
    formatPhoneNumber,
};
