const certificateSchema = {
  type: "object",
  required: [
    "certificateId",
    "issuer",
    "studentName",
    "role",
    "startDate",
    "endDate",
    "issuedOn"
  ],
  properties: {
    certificateId: { type: "string" },
    issuer: { type: "string" }, // Company Name
    studentName: { type: "string" },
    role: { type: "string" },
    startDate: { type: "string" }, // YYYY-MM-DD
    endDate: { type: "string" }, // YYYY-MM-DD
    issuedOn: { type: "string" }, // YYYY-MM-DD
    metadata: { type: "object" }
  },
  additionalProperties: false
};

module.exports = { certificateSchema };
