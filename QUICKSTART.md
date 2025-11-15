# BlockCertify - Quick Reference

## 🚀 Start Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

---

## 📍 Application URLs

| Page | URL | Purpose |
|------|-----|---------|
| Landing | http://localhost:3000 | Home page with CTA |
| Issue | http://localhost:3000/issue | Issue new certificates |
| Verify | http://localhost:3000/verify | Verify certificate |
| Dashboard | http://localhost:3000/dashboard | View blockchain |

---

## 🔗 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/issue | Issue new certificate |
| POST | /api/verify | Verify certificate |
| GET | /api/chain | Get entire blockchain |

---

## 📝 API Quick Examples

### Issue Certificate
```bash
curl -X POST http://localhost:5000/api/issue \
  -F "certificate=@file.pdf" \
  -F "companyName=MyCompany"
```

### Verify Certificate
```bash
curl -X POST http://localhost:5000/api/verify \
  -F "certificate=@file.pdf"
```

### Get Blockchain
```bash
curl http://localhost:5000/api/chain
```

---

## 📁 Key Files

**Backend**
- `backend/src/blockchain.js` - Blockchain logic
- `backend/src/index.js` - Server setup
- `backend/src/controllers/certificateController.js` - API handlers
- `backend/blockchain.json` - Blockchain storage

**Frontend**
- `frontend/app/page.tsx` - Landing page
- `frontend/app/issue/page.tsx` - Issue page
- `frontend/app/verify/page.tsx` - Verify page
- `frontend/app/dashboard/page.tsx` - Dashboard
- `frontend/lib/api.ts` - API client
- `frontend/src/components/ui/` - Components

---

## 🧪 Quick Test Flow

1. **Issue Certificate**
   - Visit http://localhost:3000/issue
   - Upload any PDF file
   - Enter company name: "Test Inc"
   - Click "Issue Certificate"
   - Note the Block Index (e.g., 1)

2. **Verify Same File**
   - Visit http://localhost:3000/verify
   - Upload the SAME PDF
   - Should show "Certificate Valid ✓"

3. **Verify Different File**
   - Upload a DIFFERENT PDF
   - Should show "Certificate Invalid ✗"

4. **View Dashboard**
   - Visit http://localhost:3000/dashboard
   - Should show 1 certificate issued
   - Should list "Test Inc" as company

---

## 🔧 Configuration

**Backend** - `backend/.env`
```
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Frontend** - `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 📊 File Sizes

- Single Certificate: ~1KB in blockchain.json
- 100 Certificates: ~100KB
- 1000 Certificates: ~1MB

---

## ⚡ Performance

- Issue Certificate: 1-3s
- Verify Certificate: < 1s
- Dashboard Load: < 2s
- Page Load: < 2s

---

## 🛠️ Troubleshooting

**Backend won't start?**
```bash
# Check if port 5000 is in use
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows
```

**Frontend can't connect?**
- Ensure backend is running
- Check `.env.local` has correct API URL
- Clear browser cache (Cmd+Shift+R)

**File upload fails?**
- File must be PDF
- File must be < 50MB
- Check backend console for errors

**Dashboard shows old data?**
- Refresh page (F5)
- Check network tab (DevTools)
- Ensure API returns data

---

## 📚 Full Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide
- **[API.md](./API.md)** - API reference
- **[TESTING.md](./TESTING.md)** - Testing & deployment
- **[FEATURES.md](./FEATURES.md)** - Feature list
- **[README.md](./README.md)** - Project overview

---

## 🚀 Deployment

### Heroku (Backend)
```bash
heroku login
heroku create app-name
git push heroku main
```

### Vercel (Frontend)
1. Import repo to Vercel
2. Set `NEXT_PUBLIC_API_URL` env var
3. Deploy

---

## 💾 Data Storage

- **Blockchain**: `backend/blockchain.json`
- **Frontend Config**: `frontend/.env.local`
- **Backend Config**: `backend/.env`

### Reset Blockchain
```bash
# Delete blockchain.json to reset to genesis block
rm backend/blockchain.json

# Restart backend - new blockchain.json will be created
npm run dev
```

---

## 🔐 Security Notes

- ✅ SHA-256 hashing
- ✅ Local processing only
- ✅ No external APIs
- ✅ CORS protected
- ✅ File size limits
- ✅ Type validation

---

## 📞 Support

See individual documentation files:
- SETUP.md - Installation issues
- API.md - API issues
- TESTING.md - Testing & deployment
- README.md - General info

---

## ✨ Quick Customization

**Change Port**
- Backend: Edit `backend/.env` → `PORT=8000`
- Frontend: Update `.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:8000/api`

**Change Max File Size**
- Backend: Edit `backend/.env` → `MAX_FILE_SIZE=100MB`

**Change Company**
- Just enter different name in Issue form

**Change Colors**
- Edit Tailwind CSS classes in React components
- Change gradient colors in `.tsx` files

---

**Ready to use! Start with Terminal 1 & 2 commands above. 🎉**
