const START_MARKER = 'BEGIN_BLOCKCERTIFY_JSON';
const END_MARKER = 'END_BLOCKCERTIFY_JSON';

function buildPayload(certificateJson, signature) {
  return {
    certificateJson,
    signature,
  };
}

function encodePayload(certificateJson, signature) {
  return JSON.stringify(buildPayload(certificateJson, signature));
}

function wrapPayloadForPdf(payloadJson) {
  return `${START_MARKER}\n${payloadJson}\n${END_MARKER}`;
}

function extractPayloadFromText(text) {
  if (!text) return null;
  const startIndex = text.indexOf(START_MARKER);
  const endIndex = text.indexOf(END_MARKER, startIndex + START_MARKER.length);

  if (startIndex === -1 || endIndex === -1) {
    return null;
  }

  const payloadString = text
    .slice(startIndex + START_MARKER.length, endIndex)
    .trim();

  if (!payloadString) {
    return null;
  }

  try {
    return JSON.parse(payloadString);
  } catch (error) {
    console.warn('Failed to parse embedded payload from PDF:', error.message);
    return null;
  }
}

module.exports = {
  START_MARKER,
  END_MARKER,
  encodePayload,
  wrapPayloadForPdf,
  extractPayloadFromText,
};
