'use strict';

const qrcode = require('qrcode');

/**
 * Generate a QR code data URL from the given payload.
 * @param {object} payload - Data to encode in QR
 * @returns {Promise<string>} - Base64 data URL
 */
const generateQRCode = async (payload) => {
  const data = JSON.stringify(payload);
  const qrDataUrl = await qrcode.toDataURL(data, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.92,
    margin: 1,
    width: 300,
  });
  return qrDataUrl;
};

module.exports = { generateQRCode };
