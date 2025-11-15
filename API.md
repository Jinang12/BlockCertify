# BlockCertify - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently, no authentication is required. All endpoints are public.

---

## Endpoints

### 1. POST /issue
Issues a new certificate and adds it to the blockchain.

**Request**
```
Method: POST
URL: /api/issue
Content-Type: multipart/form-data

FormData:
- certificate: File (PDF)
- companyName: string
```

**Example cURL**
```bash
curl -X POST http://localhost:5000/api/issue \
  -F "certificate=@diploma.pdf" \
  -F "companyName=Stanford University"
```

**Example JavaScript**
```javascript
const formData = new FormData();
formData.append('certificate', pdfFile);
formData.append('companyName', 'Stanford University');

const response = await fetch('http://localhost:5000/api/issue', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Success Response (200)**
```json
{
  "success": true,
  "message": "Certificate issued successfully",
  "data": {
    "index": 1,
    "timestamp": "2025-11-14T10:30:45.123Z",
    "hash": "abc123def456...",
    "previousHash": "genesis0hash...",
    "data": {
      "certificate_hash": "def456ghi789...",
      "company_name": "Stanford University"
    }
  }
}
```

**Error Response (400)**
```json
{
  "success": false,
  "error": "No certificate file uploaded"
}
```

**Error Response (400)**
```json
{
  "success": false,
  "error": "Valid company name is required"
}
```

**Error Response (500)**
```json
{
  "success": false,
  "error": "Failed to issue certificate"
}
```

---

### 2. POST /verify
Verifies if a certificate exists in the blockchain.

**Request**
```
Method: POST
URL: /api/verify
Content-Type: multipart/form-data

FormData:
- certificate: File (PDF)
```

**Example cURL**
```bash
curl -X POST http://localhost:5000/api/verify \
  -F "certificate=@diploma.pdf"
```

**Example JavaScript**
```javascript
const formData = new FormData();
formData.append('certificate', pdfFile);

const response = await fetch('http://localhost:5000/api/verify', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Success Response - Valid Certificate (200)**
```json
{
  "success": true,
  "message": "Certificate is valid",
  "data": {
    "valid": true,
    "index": 1,
    "timestamp": "2025-11-14T10:30:45.123Z",
    "companyName": "Stanford University",
    "blockHash": "abc123def456..."
  }
}
```

**Success Response - Invalid Certificate (200)**
```json
{
  "success": true,
  "message": "Certificate not found in the blockchain",
  "data": {
    "valid": false
  }
}
```

**Error Response (400)**
```json
{
  "success": false,
  "error": "No certificate file provided for verification"
}
```

**Error Response (500)**
```json
{
  "success": false,
  "error": "Failed to verify certificate"
}
```

---

### 3. GET /chain
Retrieves the entire blockchain.

**Request**
```
Method: GET
URL: /api/chain
```

**Example cURL**
```bash
curl http://localhost:5000/api/chain
```

**Example JavaScript**
```javascript
const response = await fetch('http://localhost:5000/api/chain');
const data = await response.json();
console.log(data.data); // Array of blocks
```

**Success Response (200)**
```json
{
  "success": true,
  "data": [
    {
      "index": 0,
      "timestamp": "2025-11-14T09:00:00.000Z",
      "data": {
        "certificate_hash": "0",
        "company_name": "Genesis Block"
      },
      "previousHash": "0",
      "hash": "genesis000hash..."
    },
    {
      "index": 1,
      "timestamp": "2025-11-14T10:30:45.123Z",
      "data": {
        "certificate_hash": "def456ghi789...",
        "company_name": "Stanford University"
      },
      "previousHash": "genesis000hash...",
      "hash": "abc123def456..."
    }
  ]
}
```

**Error Response (500)**
```json
{
  "success": false,
  "error": "Failed to retrieve blockchain"
}
```

---

## Data Models

### Block Structure
```typescript
interface Block {
  index: number;              // Block position in chain (0 = genesis)
  timestamp: string;          // ISO 8601 timestamp
  data: {
    certificate_hash: string; // SHA-256 hash of the PDF file
    company_name: string;     // Company/organization name
  };
  previousHash: string;       // Hash of previous block
  hash: string;               // SHA-256 hash of this block
}
```

### Genesis Block
```json
{
  "index": 0,
  "timestamp": "2025-11-14T09:00:00.000Z",
  "data": {
    "certificate_hash": "0",
    "company_name": "Genesis Block"
  },
  "previousHash": "0",
  "hash": "genesis..."
}
```

---

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation succeeded",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Optional error details (dev mode only)"
}
```

---

## Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 400 | No certificate file uploaded | File not included in request |
| 400 | Valid company name is required | companyName missing or empty |
| 400 | No certificate file provided for verification | File not included in request |
| 500 | Failed to issue certificate | Backend error during processing |
| 500 | Failed to verify certificate | Backend error during processing |
| 500 | Failed to retrieve blockchain | Backend error reading chain |

---

## Request/Response Examples

### Issue Certificate - Full Example

**Request**
```bash
POST /api/issue HTTP/1.1
Host: localhost:5000
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="certificate"; filename="degree.pdf"
Content-Type: application/pdf

[PDF file binary data]
------WebKitFormBoundary
Content-Disposition: form-data; name="companyName"

MIT
------WebKitFormBoundary--
```

**Response**
```
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "message": "Certificate issued successfully",
  "data": {
    "index": 42,
    "timestamp": "2025-11-14T15:45:30.456Z",
    "hash": "abcd1234efgh5678ijkl9012mnop3456...",
    "previousHash": "xyz9876uvwx5432tqrs1098oper9012...",
    "data": {
      "certificate_hash": "1a2b3c4d5e6f7g8h9i0j...",
      "company_name": "MIT"
    }
  }
}
```

### Verify Certificate - Full Example

**Request**
```bash
POST /api/verify HTTP/1.1
Host: localhost:5000
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="certificate"; filename="degree.pdf"
Content-Type: application/pdf

[PDF file binary data]
------WebKitFormBoundary--
```

**Response (Valid)**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Certificate is valid",
  "data": {
    "valid": true,
    "index": 42,
    "timestamp": "2025-11-14T15:45:30.456Z",
    "companyName": "MIT",
    "blockHash": "abcd1234efgh5678ijkl9012mnop3456..."
  }
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. Production deployments should add rate limiting to prevent abuse.

Example using `express-rate-limit`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## File Upload Limits

- **Max File Size**: 50MB (configurable in backend/.env)
- **Allowed Types**: PDF only
- **Max Field Size**: 50MB

---

## CORS Configuration

The backend allows requests from:
```
http://localhost:3000
```

Configure in `backend/.env`:
```
CORS_ORIGIN=http://localhost:3000
```

For production, update to your domain:
```
CORS_ORIGIN=https://yourdomain.com
```

---

## Blockchain Verification

The blockchain ensures data integrity through:

1. **Hash Chain**: Each block contains the hash of the previous block
2. **Immutability**: Once added, blocks cannot be modified
3. **SHA-256**: All hashes use SHA-256 algorithm
4. **Certificate Hash**: PDF files are hashed and stored, allowing exact verification

### Verification Process
```
1. User uploads PDF
2. Backend computes SHA-256(PDF)
3. Backend searches blockchain for matching certificate_hash
4. If found: Certificate is valid and authentic
5. If not found: Certificate is invalid or not issued
```

---

## Performance Notes

- **Issue Certificate**: O(n) where n = blockchain size (for hash computation)
- **Verify Certificate**: O(n) where n = blockchain size (linear search)
- **Get Blockchain**: O(1) (reads from file)
- **Recommended Index**: Implement blockchain search indexing for large datasets (> 100k blocks)

---

## Future Enhancements

- [ ] Add proof-of-work
- [ ] Implement database backend (MongoDB/PostgreSQL)
- [ ] Add authentication (OAuth, JWT)
- [ ] Add batch verification
- [ ] Add certificate revocation
- [ ] Add certificate metadata
- [ ] Add blockchain sync
- [ ] Add consensus mechanisms

---

## Support

For API issues or questions:
1. Check response status codes
2. Review error messages
3. Check browser console for network errors
4. Enable debug mode in backend
5. Check backend logs

---

**API Version**: 1.0.0
**Last Updated**: November 14, 2025
