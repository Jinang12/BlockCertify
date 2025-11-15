# BlockCertify - Complete Test & Deployment Guide

## 🧪 Testing Guide

### Prerequisites
- Both backend and frontend servers running
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- A PDF file for testing

### 1. Landing Page Test
**Expected Result**: Beautiful landing page with hero section, animations, and 3 buttons
- [ ] Visit `http://localhost:3000`
- [ ] See animated gradient background
- [ ] See hero title: "Verify Authentic Documents with Blockchain Security"
- [ ] See 3 buttons: Issue, Verify, Dashboard
- [ ] See 3 feature cards
- [ ] Click buttons and verify navigation works

### 2. Issue Certificate Flow
**Expected Result**: Successfully issue a certificate and see it on blockchain
- [ ] Click "Issue Certificate" button
- [ ] See file upload component with drag-drop
- [ ] Drag and drop a PDF file
- [ ] Enter company name: "Test Corporation"
- [ ] Click "Issue Certificate" button
- [ ] See loading spinner
- [ ] See success message with green checkmark
- [ ] See block details:
  - Block Index (should be 1 for first certificate)
  - Certificate Hash (long hex string)
  - Block Hash (long hex string)
  - Timestamp (current date/time)
- [ ] Click "Issue Another Certificate" to test again
- [ ] Can issue multiple certificates

### 3. Verify Certificate Flow - Valid
**Expected Result**: Verify the same certificate comes back as valid
- [ ] Go back to the same PDF file used in Issue flow
- [ ] Click "Verify Certificate" button
- [ ] Upload the SAME PDF file
- [ ] See "Certificate Valid ✓" with green status
- [ ] See block information displayed:
  - Company name matches
  - Block index matches
  - Block hash matches

### 4. Verify Certificate Flow - Invalid
**Expected Result**: Different PDF shows as invalid
- [ ] Use a different PDF file
- [ ] Click "Verify Certificate" button
- [ ] Upload the DIFFERENT PDF file
- [ ] See "Certificate Invalid ✗" with red status
- [ ] See error message: "This document is not found in the blockchain"

### 5. Dashboard Tests
**Expected Result**: View all blockchain data
- [ ] Click "View Dashboard" button or navigate to `/dashboard`
- [ ] See 3 stats cards:
  - Total Blocks (should match certificates issued + 1)
  - Certificates Issued (count)
  - Unique Companies (count)
- [ ] See list of all blocks
- [ ] Click on a block to expand
- [ ] See full block details including hashes
- [ ] Data updates when new certificates are issued

### 6. Navigation Tests
**Expected Result**: Seamless navigation across pages
- [ ] All pages have navigation bar
- [ ] Logo always links back to home
- [ ] All links work without errors
- [ ] Mobile menu works (resize to test)

### 7. Toast Notifications
**Expected Result**: User feedback appears correctly
- [ ] Try uploading without selecting file → "Please select a PDF file" (error toast)
- [ ] Try issuing without company name → "Please enter company name" (error toast)
- [ ] Success actions show green toast
- [ ] Toasts auto-dismiss after 4 seconds

### 8. Error Handling
**Expected Result**: Graceful error handling
- [ ] Stop backend server and try to issue certificate → error toast
- [ ] Upload file > 50MB → file size error
- [ ] Upload non-PDF file → file type error

## 🚀 Deployment Guide

### Backend Deployment (Heroku Example)

1. **Create Heroku Account**
```bash
heroku login
heroku create your-app-name
```

2. **Add Procfile in backend/**
```
web: npm start
```

3. **Configure environment**
```bash
heroku config:set NODE_ENV=production
```

4. **Deploy**
```bash
git push heroku main
```

### Frontend Deployment (Vercel)

1. **Connect Repository**
   - Go to vercel.com
   - Import your GitHub repository
   - Select `/frontend` as root directory

2. **Configure Environment**
   - Set `NEXT_PUBLIC_API_URL` to your deployed backend URL
   - Example: `https://your-backend.herokuapp.com/api`

3. **Deploy**
   - Vercel auto-deploys on push to main

### Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g next
COPY --from=builder /app/.next .next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./backend/blockchain.json:/app/blockchain.json

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000/api
    depends_on:
      - backend
```

## 📊 Performance Benchmarks

### Expected Performance
- Landing page load: < 2s
- Issue certificate: 1-3s (depends on file size)
- Verify certificate: < 1s
- Dashboard load: < 2s

### Load Testing
```bash
# Using Apache Bench
ab -n 100 -c 10 http://localhost:5000/api/chain

# Using Artillery
artillery quick --count 100 --num 10 http://localhost:5000/api/chain
```

## 📝 Monitoring Checklist

- [ ] Backend server health (`GET /api/chain`)
- [ ] Blockchain file size doesn't grow too large
- [ ] Memory usage stays stable
- [ ] No console errors on frontend
- [ ] Toast notifications show correctly
- [ ] Blockchain persists across restarts

## 🔒 Security Testing

- [ ] CORS properly configured
- [ ] No sensitive data in logs
- [ ] File upload validation works
- [ ] File size limits enforced
- [ ] No direct access to blockchain.json from frontend
- [ ] API validates all inputs

## 📱 Browser Compatibility

Test on:
- [x] Chrome (latest)
- [x] Firefox (latest)
- [x] Safari (latest)
- [x] Edge (latest)
- [x] Mobile browsers

## 🎯 User Acceptance Testing

### Scenario 1: Company Issues Certificate
```
1. Company visits http://localhost:3000
2. Clicks "Issue Certificate"
3. Uploads company diploma PDF
4. Enters "ABC University"
5. Receives confirmation with block hash
✅ PASS: Certificate registered on blockchain
```

### Scenario 2: Student Verifies Certificate
```
1. Student visits verification page
2. Uploads the same diploma PDF
3. Sees "Valid ✓" with company name
4. Takes screenshot as proof
✅ PASS: Certificate verified successfully
```

### Scenario 3: Fraudulent Certificate
```
1. Attacker tries to verify fake diploma
2. Uploads modified/different PDF
3. Sees "Invalid ✗" with error
✅ PASS: Fraud detected
```

## 📊 Regression Test Cases

After any changes, verify:
1. Issue certificate still works
2. Verify certificate still works
3. Dashboard updates correctly
4. Navigation works on all pages
5. Error handling unchanged
6. Performance maintained

## 🐛 Known Issues & Resolutions

### Issue: Backend won't start
**Solution**: Check if port 5000 is in use
```bash
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows
```

### Issue: Frontend can't connect to backend
**Solution**: Check CORS configuration in backend
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
```

### Issue: File upload fails
**Solution**: Check file size limit in backend
```bash
# Max file size in backend/.env
MAX_FILE_SIZE=50MB
```

## ✅ Pre-Launch Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] No warnings in build
- [ ] SETUP.md reviewed
- [ ] README.md complete
- [ ] Environment variables configured
- [ ] Blockchain initializes with genesis block
- [ ] Database backups working
- [ ] Performance acceptable
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Team trained

## 📞 Support & Troubleshooting

**Issue**: Certificate not appearing in blockchain
- Check backend console for errors
- Verify blockchain.json has write permissions
- Restart backend server

**Issue**: Dashboard shows stale data
- Check browser cache (Cmd+Shift+R or Ctrl+Shift+R)
- Verify API endpoint is correct
- Check network tab in DevTools

**Issue**: Verification always shows invalid
- Ensure exact same PDF file is uploaded
- Check for file corruption during transfer
- Verify file size doesn't exceed limit

---

**Ready for production! 🚀**
