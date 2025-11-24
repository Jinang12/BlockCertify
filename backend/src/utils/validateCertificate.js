const Ajv = require('ajv');
const { certificateSchema } = require('../schemas/certificateSchema');

const ajv = new Ajv({ allErrors: true, removeAdditional: true });
const validate = ajv.compile(certificateSchema);

function validateCertificate(data) {
  const isValid = validate(data);
  return { isValid, errors: validate.errors || null };
}

module.exports = { validateCertificate };
