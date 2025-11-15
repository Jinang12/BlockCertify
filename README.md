# BlockCertify - Blockchain Certificate Verification System

A production-ready full-stack application for issuing and verifying blockchain-secured certificates and documents.

## 🎯 Features

- **Issue Certificates**: Companies can upload PDFs and register them on the blockchain with SHA-256 hashing
- **Verify Authenticity**: Users can verify if a document is authentic by checking against the blockchain
- **Immutable Records**: All certificates are permanently stored on a secure local blockchain
- **Modern UI**: Beautiful glassmorphic design with animations similar to Vercel, Linear, and Stripe
- **Drag-and-Drop**: Easy file upload with drag-and-drop functionality
- **Real-time Notifications**: Toast notifications for user feedback
- **Fully Responsive**: Works perfectly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI**: React Components with custom styling

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Hashing**: crypto-js (SHA-256)
- **File Upload**: express-fileupload
- **Storage**: JSON file-based blockchain

## � Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup and installation guide
- **[API.md](./API.md)** - Comprehensive API documentation
- **[TESTING.md](./TESTING.md)** - Testing guide, deployment instructions, and troubleshooting

## 🚀 Quick Start

**Prerequisites**: Node.js 18+

### Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:5000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`

Visit `http://localhost:3000` in your browser!

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
NODE_ENV=development
```

4. Start the backend server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. The `.env.local` file is already configured to point to `http://localhost:5000/api`

4. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## 📡 API Endpoints

### Issue Certificate
**POST** `/api/issue`

Request:
```
FormData:
- certificate: File (PDF)
- companyName: string
```

Response:
```json
{
  "success": true,
  "message": "Certificate issued successfully",
  "data": {
    "index": 1,
    "timestamp": "2025-11-14T10:30:00Z",
    "hash": "abc123...",
    "previousHash": "genesis...",
    "data": {
      "certificate_hash": "def456...",
      "company_name": "Acme Corp"
    }
  }
}
```

### Verify Certificate
**POST** `/api/verify`

Request:
```
FormData:
- certificate: File (PDF)
```

Response (Valid):
```json
{
  "success": true,
  "message": "Certificate is valid",
  "data": {
    "valid": true,
    "index": 1,
    "timestamp": "2025-11-14T10:30:00Z",
    "companyName": "Acme Corp",
    "blockHash": "abc123..."
  }
}
```

Response (Invalid):
```json
{
  "success": true,
  "message": "Certificate not found in the blockchain",
  "data": {
    "valid": false
  }
}
```

### Get Blockchain
**GET** `/api/chain`

Response:
```json
{
  "success": true,
  "data": [
    {
      "index": 0,
      "timestamp": "2025-11-14T09:00:00Z",
      "data": {
        "certificate_hash": "0",
        "company_name": "Genesis Block"
      },
      "previousHash": "0",
      "hash": "genesis..."
    },
    ...
  ]
}
```

## 🔐 Security Features

- **SHA-256 Hashing**: All documents are hashed using SHA-256 algorithm
- **Immutable Blockchain**: Once a certificate is issued, it cannot be altered
- **No External Dependencies**: Everything runs locally - no third-party API calls
- **File Size Limits**: Enforces maximum file sizes for security

## 📝 Usage Examples

### Issue a Certificate

1. Go to `http://localhost:3000`
2. Click "Issue Certificate" button
3. Drag and drop a PDF or click to browse
4. Enter your company name
5. Click "Issue Certificate"
6. View the certificate details and block hash

### Verify a Certificate

1. Go to `http://localhost:3000`
2. Click "Verify Certificate" button
3. Upload the PDF you want to verify
4. The system will check if the document exists on the blockchain
5. View the verification result (Valid/Invalid)

## 🎨 UI Components

### FileUpload Component
- Drag-and-drop functionality
- Click to browse
- File size validation
- Visual feedback

### Toast System
- Success, error, and info notifications
- Auto-dismiss with customizable duration
- Queue management

### Modern Design Elements
- Glassmorphic cards
- Gradient backgrounds
- Smooth animations
- Responsive layout

## 🧪 Testing

### Test Workflow

1. **Backend Testing**: Use Postman or cURL to test API endpoints
2. **Frontend Testing**: Use the web interface
3. **Blockchain Verification**: Check `backend/blockchain.json` for stored certificates

### Example cURL Commands

Issue a certificate:
```bash
curl -X POST http://localhost:5000/api/issue \
  -F "certificate=@path/to/file.pdf" \
  -F "companyName=Test Company"
```

Verify a certificate:
```bash
curl -X POST http://localhost:5000/api/verify \
  -F "certificate=@path/to/file.pdf"
```

Get blockchain:
```bash
curl http://localhost:5000/api/chain
```

## 📦 Dependencies

### Backend
- express: Web framework
- cors: Cross-origin support
- express-fileupload: File upload handling
- crypto-js: SHA-256 hashing
- morgan: Logging

### Frontend
- next: React framework
- react: UI library
- tailwindcss: CSS framework
- typescript: Type safety

## 🚢 Deployment

### Backend Deployment (Heroku/Railway)
1. Create `.env` file with `NODE_ENV=production`
2. Deploy to your hosting platform
3. Update `NEXT_PUBLIC_API_URL` in frontend `.env.local`

### Frontend Deployment (Vercel)
1. Connect your repository to Vercel
2. Set `NEXT_PUBLIC_API_URL` environment variable
3. Deploy

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Support

For issues or questions, please create an issue in the repository.

## ✨ Future Enhancements

- [ ] Proof-of-Work implementation
- [ ] Database integration (MongoDB)
- [ ] User authentication
- [ ] Batch certificate verification
- [ ] Certificate templates
- [ ] Digital signatures
- [ ] Email notifications
- [ ] Analytics dashboard

---

**Built with ❤️ using blockchain technology**
