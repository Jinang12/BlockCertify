# BlockCertify Setup Guide

## 🎯 Complete Setup Instructions

This guide will help you get BlockCertify running on your local machine.

### System Requirements
- Node.js v18.0.0 or higher
- npm v9.0.0 or higher
- 200MB free disk space

## Step 1: Clone & Install Dependencies

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Verify installation
npm list
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Verify installation
npm list
```

## Step 2: Environment Configuration

### Backend
The `.env` file is pre-configured at `backend/.env`:
```
PORT=5000
NODE_ENV=development
MAX_FILE_SIZE=5MB
ALLOWED_FILE_TYPES=application/pdf
CORS_ORIGIN=http://localhost:3000
```

No changes needed unless you want to:
- Change the port (modify `PORT`)
- Enable/disable debug logging (modify `NODE_ENV`)

### Frontend
The `.env.local` file is pre-configured at `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Update this if:
- Backend is running on a different port
- You're deploying to production

## Step 3: Start the Application

### Terminal 1 - Start Backend
```bash
cd backend
npm run dev
```

Expected output:
```
Server running on port 5000
Blockchain initialized with 1 blocks
```

### Terminal 2 - Start Frontend
```bash
cd frontend
npm run dev
```

Expected output:
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

## Step 4: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the BlockCertify landing page with:
- Hero section with title and buttons
- Feature cards
- Navigation bar

## 🧪 Quick Test Workflow

### Test 1: Issue a Certificate
1. Click "Issue Certificate" button
2. Upload a PDF file (you can use any PDF)
3. Enter company name: "Test Company"
4. Click "Issue Certificate"
5. Verify success message displays with:
   - Block Index
   - Certificate Hash
   - Block Hash
   - Timestamp

### Test 2: Verify the Same Certificate
1. Click "Verify Certificate" button
2. Upload the SAME PDF file
3. Should show "Certificate Valid ✓" with green status
4. Display block information

### Test 3: Verify Different Certificate
1. Click "Verify Certificate" button
2. Upload a DIFFERENT PDF file
3. Should show "Certificate Invalid ✗" with red status
4. Display error message

## 📁 Blockchain Storage

The blockchain is stored in: `backend/blockchain.json`

### Sample blockchain.json Structure
```json
[
  {
    "index": 0,
    "timestamp": "2025-11-14T10:00:00Z",
    "data": {
      "certificate_hash": "0",
      "company_name": "Genesis Block"
    },
    "previousHash": "0",
    "hash": "abc123..."
  },
  {
    "index": 1,
    "timestamp": "2025-11-14T10:05:30Z",
    "data": {
      "certificate_hash": "def456...",
      "company_name": "Test Company"
    },
    "previousHash": "abc123...",
    "hash": "ghi789..."
  }
]
```

You can:
- Inspect this file to see all issued certificates
- Delete it to reset the blockchain (will recreate with genesis block)
- Share it as a backup

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
# On Windows:
netstat -ano | findstr :5000

# Solution: Either free the port or change PORT in .env
```

### Frontend won't connect to backend
```bash
# Verify backend is running on port 5000
curl http://localhost:5000/api/chain

# If fails, check:
1. Backend is running
2. CORS_ORIGIN in backend/.env includes http://localhost:3000
3. NEXT_PUBLIC_API_URL in frontend/.env.local is correct
```

### File upload fails
```bash
# Check file size is under 5MB
# Check file is PDF format (.pdf)
# Verify backend/src/controllers/certificateController.js has proper error handling
```

### Blockchain.json not updating
```bash
# Verify backend has write permissions to backend/src/ directory
# Check backend console for errors
# Restart backend: npm run dev
```

## 🚀 Running in Production

### Backend
```bash
NODE_ENV=production npm start
```

### Frontend
```bash
npm run build
npm run start
```

## 📊 API Testing with cURL

### Get entire blockchain
```bash
curl -X GET http://localhost:5000/api/chain
```

### Issue certificate
```bash
curl -X POST http://localhost:5000/api/issue \
  -F "certificate=@test.pdf" \
  -F "companyName=My Company"
```

### Verify certificate
```bash
curl -X POST http://localhost:5000/api/verify \
  -F "certificate=@test.pdf"
```

## 📚 Project Files Overview

### Key Backend Files
- `src/blockchain.js` - Blockchain and Block classes
- `src/index.js` - Express server configuration
- `src/controllers/certificateController.js` - API handlers
- `src/routes/index.js` - Route definitions

### Key Frontend Files
- `app/page.tsx` - Landing page with hero section
- `app/issue/page.tsx` - Issue certificate page
- `app/verify/page.tsx` - Verify certificate page
- `src/components/ui/FileUpload.tsx` - File upload component
- `src/components/ui/Toast.tsx` - Notification system
- `lib/api.ts` - API client functions

## 🎨 UI Features

- **Modern Design**: Glassmorphic cards with blur effects
- **Animations**: Smooth fade-ins and blob animations
- **Responsive**: Works on mobile, tablet, and desktop
- **Drag-and-Drop**: Easy file upload
- **Toast Notifications**: Real-time user feedback
- **Dark Mode**: Built-in dark theme

## 💾 Data Persistence

- Certificates are persisted to `blockchain.json`
- Blockchain survives server restarts
- Data is never sent to external services
- All processing happens locally

## 🔐 Security Notes

- SHA-256 hashing ensures document authenticity
- No private keys or sensitive data stored
- No external API calls or tracking
- CORS configured to allow frontend only
- File size limits prevent abuse

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all dependencies are installed: `npm list`
3. Ensure correct Node.js version: `node --version`
4. Check browser console for frontend errors (F12)
5. Check terminal for backend errors

---

**You're all set! Start issuing and verifying certificates with blockchain security! 🎉**
