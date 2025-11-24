const pdfParse = require('pdf-parse');
const { extractPayloadFromText } = require('../utils/qrPayload');

async function extractPayloadFromPdf(buffer) {
  const data = await pdfParse(buffer);
  const text = data.text || '';
  const payload = extractPayloadFromText(text);
  return {
    payload,
    text,
  };
}

module.exports = {
  extractPayloadFromPdf,
};
