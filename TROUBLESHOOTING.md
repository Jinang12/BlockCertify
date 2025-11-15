# BlockCertify - Environment & Troubleshooting

## ✅ Environment Verification

### Prerequisites Check
Run this to verify your system is ready:

```bash
# Check Node.js version (need 18+)
node --version
# Expected: v18.0.0 or higher

# Check npm version (need 9+)
npm --version
# Expected: 9.0.0 or higher

# Check git (optional)
git --version
```

### Installation Verification
After `npm install`, verify:

```bash
# Backend dependencies
cd backend
npm list crypto-js express cors express-fileupload
# All should be listed

# Frontend dependencies
cd frontend
npm list next react tailwindcss typescript
# All should be listed
```

---

## 🔧 Common Issues & Solutions

### Issue 1: Node.js/npm Not Found

**Error**: `command not found: node` or `npm: command not found`

**Solution**:
1. Download Node.js from nodejs.org
2. Install LTS version (18+)
3. Restart terminal
4. Verify: `node --version`

---

### Issue 2: Port Already in Use

**Error**: `Error: listen EADDRINUSE :::5000`

**Solution (macOS/Linux)**:
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in backend/.env
PORT=8000
```

**Solution (Windows)**:
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F

# Or change port in backend/.env
PORT=8000
```

---

### Issue 3: CORS Error in Browser

**Error**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**:
1. Check backend/.env has correct CORS_ORIGIN
2. For localhost development: `CORS_ORIGIN=http://localhost:3000`
3. Restart backend server
4. Clear browser cache (Ctrl+Shift+Del or Cmd+Shift+Del)

---

### Issue 4: File Upload Not Working

**Error**: `No certificate file uploaded` or `Failed to process file`

**Solutions**:
1. Check file is PDF format (`.pdf` extension)
2. Check file size < 50MB
3. Check backend permissions on `blockchain.json`
4. Try uploading from different directory
5. Check console in DevTools for detailed error

---

### Issue 5: Frontend Can't Connect to Backend

**Error**: API requests failing, blank pages

**Solutions**:

**Step 1**: Verify backend is running
```bash
# Should see: Server running on port 5000
# In backend terminal
```

**Step 2**: Verify .env.local is correct
```bash
# frontend/.env.local should have:
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Step 3**: Restart frontend
```bash
# Kill frontend (Ctrl+C)
# Restart: npm run dev
```

**Step 4**: Check network requests
```
1. Open DevTools (F12)
2. Go to Network tab
3. Try action (issue/verify)
4. Look for failed requests
5. Click request, check error message
```

---

### Issue 6: Blockchain.json Permission Error

**Error**: `EACCES: permission denied, open '.../blockchain.json'`

**Solution (macOS/Linux)**:
```bash
# Give write permission
chmod 777 backend/src/blockchain.json

# Or entire directory
chmod -R 777 backend/
```

**Solution (Windows)**:
1. Right-click `blockchain.json`
2. Properties → Security
3. Edit → Select Users
4. Check "Full Control"
5. Click Apply

---

### Issue 7: npm install Fails

**Error**: `npm ERR! code ERESOLVE` or dependency conflicts

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Try installing with legacy peer deps
npm install --legacy-peer-deps

# Or use npm 7+ with force resolution
npm install --force
```

---

### Issue 8: TypeScript Compilation Errors

**Error**: `Cannot find module` or `Type error`

**Solutions**:
```bash
# Ensure tsconfig.json is correct
# Check frontend/tsconfig.json exists

# Clear cache and rebuild
rm -rf node_modules
npm install
npm run dev
```

---

### Issue 9: Tailwind CSS Not Applied

**Error**: Styles not showing, classes not working

**Solutions**:
1. Check `tailwind.config.js` exists
2. Check `globals.css` imports Tailwind
3. Restart frontend: `npm run dev`
4. Clear browser cache (Ctrl+Shift+R)
5. Check element in DevTools for classes

---

### Issue 10: Certificate Verification Always Invalid

**Error**: Always shows "Certificate Invalid" even after issuing

**Possible Causes & Solutions**:

1. **Different PDF file**
   - Must be exact same file
   - Even small edits change hash

2. **File corruption during upload**
   - Check file size before/after
   - Try with smaller PDF

3. **API not persisting certificates**
   - Check backend console for errors
   - Verify blockchain.json exists
   - Check file permissions
   - Restart backend

4. **Frontend caching issue**
   - Hard refresh: Ctrl+Shift+R
   - Clear cookies/cache
   - Try incognito mode

---

## 🔍 Debugging Techniques

### Backend Debugging

**1. Enable detailed logging**
```javascript
// In backend/src/index.js
app.use(morgan('dev')); // Already enabled
console.log('Debug info:', data);
```

**2. Check blockchain.json**
```bash
# View file contents
cat backend/blockchain.json

# Format nicely (macOS/Linux)
cat backend/blockchain.json | jq

# Format nicely (Windows)
# Or open in text editor
```

**3. Test API endpoints directly**
```bash
# Terminal or Postman
curl -X GET http://localhost:5000/api/chain
curl -X POST http://localhost:5000/api/issue \
  -F "certificate=@file.pdf" \
  -F "companyName=Test"
```

### Frontend Debugging

**1. Open DevTools**
- Chrome/Edge: F12
- Firefox: F12
- Safari: Cmd+Option+I

**2. Check Console tab**
- Look for red error messages
- JavaScript errors displayed here

**3. Check Network tab**
- Click action to trigger request
- Monitor network requests
- Check response status
- Review error messages

**4. React DevTools**
- Install React Developer Tools extension
- Inspect component state
- Track hooks and props

---

## 🔄 Reset & Clean Up

### Reset Blockchain
```bash
# Delete blockchain file (will recreate on restart)
rm backend/blockchain.json

# Restart backend
npm run dev
```

### Clear Cache
```bash
# npm cache
npm cache clean --force

# Browser cache
# DevTools → Application → Clear Site Data
```

### Full Clean Install
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev

# Frontend
cd frontend
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

---

## 📊 System Requirements

### Minimum Requirements
- **OS**: macOS, Linux, or Windows
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **RAM**: 2GB
- **Disk**: 500MB free space
- **Browser**: Chrome, Firefox, Safari, or Edge (latest)

### Recommended Setup
- **OS**: macOS or Linux (easier for dev)
- **Node.js**: 18.17.0 LTS or 20.x
- **npm**: 10.x
- **RAM**: 4GB+
- **Disk**: 1GB+ free space
- **Terminal**: VSCode integrated terminal

---

## 🚀 Performance Optimization

### Frontend Optimization
```bash
# Production build
npm run build
npm start

# Check bundle size
npm run analyze
```

### Backend Optimization
```bash
# Environment variable
NODE_ENV=production npm start

# Monitor memory usage
ps aux | grep node
```

---

## 🔐 Security Checklist

- [ ] No sensitive data in .env files checked into git
- [ ] `.env` and `blockchain.json` in `.gitignore`
- [ ] CORS_ORIGIN set to production domain
- [ ] File upload limits enforced
- [ ] Error messages don't expose paths
- [ ] No console.log of sensitive data in production

---

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=application/pdf
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🆘 Getting Help

### Check These First
1. This troubleshooting guide
2. SETUP.md installation guide
3. Backend console output
4. Browser DevTools console
5. Network tab in DevTools

### Collect Diagnostic Info
When reporting issues, include:
- Operating System
- Node.js version: `node --version`
- npm version: `npm --version`
- Error message (exact text)
- Steps to reproduce
- Screenshots if applicable

---

## 🎯 Verification Steps

### After Installation

**1. Backend Check**
```bash
cd backend
npm run dev

# Should show:
# Server running on port 5000
# Blockchain initialized with 1 blocks
```

**2. Frontend Check**
```bash
cd frontend
npm run dev

# Should show:
# - ready started server on 0.0.0.0:3000
```

**3. API Check**
```bash
curl http://localhost:5000/api/chain
# Should return JSON with blockchain data
```

**4. Browser Check**
- Open http://localhost:3000
- Should see landing page
- Navigation should work
- Buttons should be clickable

---

## 📞 Final Troubleshooting Checklist

- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] `npm install` completed without errors
- [ ] Backend starts without port errors
- [ ] Frontend starts without errors
- [ ] Browser can access http://localhost:3000
- [ ] Console tab shows no errors
- [ ] Network tab shows successful API calls
- [ ] All buttons are clickable
- [ ] File upload works

If all checked ✓, application is ready to use!

---

**Need help? Follow this guide step-by-step!**
