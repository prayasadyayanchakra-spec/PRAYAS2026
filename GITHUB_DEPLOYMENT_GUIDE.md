# PRAYAS 2026 - GitHub Deployment Ready Setup

## 🚀 Complete Restructuring & GitHub Push Guide

### Current Location
```
c:\Users\SBENT\Downloads\PRAYAS2026
```

## ✅ Step 1: Create Folder Structure

### Windows Command Prompt:
```batch
cd c:\Users\SBENT\Downloads\PRAYAS2026

:: Create backend folder
mkdir backend
mkdir backend\routes

:: Create frontend folder
mkdir frontend
mkdir frontend\css
mkdir frontend\js
mkdir frontend\images

:: Create database folder
mkdir database

:: Create docs folder
mkdir docs

:: Create github workflows folder
mkdir .github\workflows
```

### Linux/Mac Terminal:
```bash
cd ~/Downloads/PRAYAS2026

# Create folders
mkdir -p backend/routes
mkdir -p frontend/{css,js,images}
mkdir -p database
mkdir -p docs
mkdir -p .github/workflows
```

## ✅ Step 2: Move Files to Proper Locations

### Backend Files (Move to `/backend`)
```
Move these files to: backend/
- app.py
- auth_routes.py
- student_routes.py
- payment_routes.py
- fee_routes.py
- book_routes.py
- publication_routes.py
- ranker_routes.py
- notification_routes.py
- requirements.txt
- .env.example
```

### Frontend Files (Move to `/frontend`)
```
Move to: frontend/
- index.html
- schools.html
- bookstore.html
- publication.html
- rankers.html
- about.html
- login.html
- admin1.html
- admin2.html
- admin3.html
- superadmin.html
- START_HERE.html

Move to: frontend/css/
- style.css
- navbar.css
- admin.css

Move to: frontend/js/
- carousel.js
- notifications.js
- auth.js
- schools.js
- bookstore.js
- publications.js
- rankers.js
- admin_functions.js
- superadmin.js
```

### Database Files (Move to `/database`)
```
Move to: database/
- database_schema.sql  (rename to: schema.sql)
```

### Documentation Files (Move to `/docs`)
```
Move to: docs/
- README.md
- INSTALLATION_GUIDE.md
- PROJECT_SUMMARY.md
- FILE_LISTING.md
- API_REFERENCE.md
- COMPLETION_SUMMARY.md
- QUICK_START.txt
- VERIFICATION.md
```

## ✅ Step 3: Create Deployment Configuration Files

### 3.1 Backend Configuration Files

#### File: `backend/Dockerfile`
Copy from DEPLOYMENT_FILES.md → Dockerfile section

#### File: `backend/render.yaml`
Copy from DEPLOYMENT_FILES.md → render.yaml section

#### File: `backend/Procfile`
Copy from DEPLOYMENT_FILES.md → Procfile section

#### File: `backend/.dockerignore`
Copy from DEPLOYMENT_FILES.md → .dockerignore section

#### File: `backend/.env.example`
Copy from DEPLOYMENT_FILES.md → backend/.env.example section

#### File: `backend/requirements.txt`
Update with gunicorn:
```
gunicorn==21.2.0
Flask==2.3.2
Flask-CORS==4.0.0
Flask-MySQLdb==1.0.1
PyJWT==2.8.0
python-dotenv==1.0.0
Werkzeug==2.3.6
MySQLdb-python==1.2.5
```

### 3.2 Frontend Configuration Files

#### File: `frontend/vercel.json`
Copy from DEPLOYMENT_FILES.md → vercel.json section

#### File: `frontend/config.js`
Copy from DEPLOYMENT_FILES.md → config.js section

#### File: `frontend/.vercelignore`
Copy from DEPLOYMENT_FILES.md → .vercelignore section

#### File: `frontend/.env.example`
```
NEXT_PUBLIC_API_URL=https://prayas-backend.onrender.com
```

### 3.3 Root Level Files

#### File: `.gitignore` (at project root)
Copy from DEPLOYMENT_FILES.md → .gitignore section

#### File: `.github/workflows/deploy.yml`
Copy from DEPLOYMENT_FILES.md → deploy.yml section (Optional - for auto-deploy)

#### File: `README.md` (at root - update)
```markdown
# PRAYAS 2026 - Educational Management System

Production-ready educational platform with multi-school support.

## Architecture

- **Backend**: Flask API on Render
- **Frontend**: Static site on Vercel  
- **Database**: MySQL on Hostinger
- **Domain**: Hostinger DNS

## Repository Structure

```
PRAYAS2026/
├── backend/       → Render deployment
├── frontend/      → Vercel deployment
├── database/      → Schema and migrations
├── docs/          → Documentation
└── .github/       → CI/CD workflows
```

## Quick Start

1. Clone repository
2. Configure environment variables
3. Deploy backend to Render
4. Deploy frontend to Vercel
5. Set up database on Hostinger

See `docs/DEPLOYMENT_GUIDE.md` for details.

## Documentation

- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [API Reference](docs/API_REFERENCE.md)
- [Installation Guide](docs/INSTALLATION_GUIDE.md)

## License

Created for PRAYAS Adhyan Chakra
```

## ✅ Step 4: Initialize Git Repository

### Windows (Command Prompt):
```batch
cd c:\Users\SBENT\Downloads\PRAYAS2026
git init
git config user.name "Your Name"
git config user.email "your-email@example.com"
git add .
git commit -m "Initial commit: PRAYAS2026 - Production ready full-stack application"
```

### Linux/Mac (Terminal):
```bash
cd ~/Downloads/PRAYAS2026
git init
git config user.name "Your Name"
git config user.email "your-email@example.com"
git add .
git commit -m "Initial commit: PRAYAS2026 - Production ready full-stack application"
```

## ✅ Step 5: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `PRAYAS2026`
3. Description: `Educational Management System for Multiple Schools`
4. Public or Private (your choice)
5. DO NOT initialize with README (you already have one)
6. Click "Create repository"

## ✅ Step 6: Add Remote and Push

### Get Your GitHub Repository URL
From GitHub, copy the HTTPS URL (e.g., https://github.com/yourusername/PRAYAS2026.git)

### Push to GitHub

**Windows:**
```batch
git remote add origin https://github.com/yourusername/PRAYAS2026.git
git branch -M main
git push -u origin main
```

**Linux/Mac:**
```bash
git remote add origin https://github.com/yourusername/PRAYAS2026.git
git branch -M main
git push -u origin main
```

If asked for credentials, use:
- Username: your GitHub username
- Password: your GitHub personal access token (not password!)

## ✅ Step 7: Deploy to Render (Backend)

1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub account
5. Select `PRAYAS2026` repository
6. Configure:
   - **Name**: prayas2026-backend
   - **Root Directory**: `backend`
   - **Runtime**: Python 3.11
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT app:app`
7. Set Environment Variables:
   ```
   FLASK_ENV=production
   MYSQL_HOST=your-hostinger-host
   MYSQL_USER=your-username
   MYSQL_PASSWORD=your-password
   MYSQL_DB=prayas2026
   SECRET_KEY=generate-a-secure-key
   CORS_ORIGINS=https://your-vercel-domain.vercel.app
   ```
8. Click "Deploy Web Service"
9. Wait for deployment to complete
10. Note your Render URL (e.g., https://prayas2026-backend.onrender.com)

## ✅ Step 8: Deploy to Vercel (Frontend)

1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click "Add New..." → "Project"
4. Import from GitHub
5. Select `PRAYAS2026`
6. Configure:
   - **Framework Preset**: Other (Static)
   - **Root Directory**: `frontend`
   - **Build Command**: Leave empty
   - **Output Directory**: `.`
7. Set Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
   ```
8. Click "Deploy"
9. Wait for deployment
10. Note your Vercel URL (e.g., https://prayas2026.vercel.app)

## ✅ Step 9: Configure Hostinger Database

### MySQL Setup:
1. Login to Hostinger cPanel
2. Go to MySQL Databases
3. Create Database:
   - Name: `prayas2026`
   - Click "Create Database"
4. Create User:
   - Name: `prayas_user`
   - Password: Generate strong password
   - Click "Create User"
5. Add User to Database:
   - Select user and database
   - Grant ALL privileges
6. Note these credentials for Render

### Import Database Schema:
```bash
mysql -h your-hostinger-host -u prayas_user -p prayas2026 < database/schema.sql
```
(Enter password when prompted)

### Whitelist Render IP:
1. In cPanel, go to Remote MySQL
2. Add Render's IP address
3. Test connection

## ✅ Step 10: Update Frontend Config

After Render deployment, update in `frontend/js/auth.js` and other files:

Change:
```javascript
fetch('/api/auth/login', {
```

To:
```javascript
const API_URL = 'https://your-render-backend.onrender.com';
fetch(`${API_URL}/api/auth/login`, {
```

Or use the config.js:
```javascript
import config from './config.js';
fetch(`${config.API_URL}/api/auth/login`, {
```

## ✅ Step 11: Configure Domain (Hostinger)

1. Add domain to Hostinger
2. Go to DNS Management
3. Update records:

```
Type    Name    Value
A       @       Vercel IP (from Vercel project settings)
CNAME   www     yourdomain.com
CNAME   api     prayas2026-backend.onrender.com
```

4. Wait for DNS propagation (5-48 hours)
5. Test: Visit https://yourdomain.com

## ✅ Step 12: Test Everything

### Test Backend API:
```bash
curl https://prayas2026-backend.onrender.com/api/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "PRAYAS2026-Backend",
  "version": "1.0.0",
  "database": "connected"
}
```

### Test Frontend:
Visit: https://prayas2026.vercel.app or https://yourdomain.com

### Test Login:
Use default credentials:
- Username: Superadmin
- Password: Superadmin@1341

### Test Database:
From Render, should connect to Hostinger MySQL

## 📋 Quick Reference URLs

After deployment, you'll have:

```
GitHub: https://github.com/yourusername/PRAYAS2026

Backend:
- Render: https://prayas2026-backend.onrender.com
- API Health: https://prayas2026-backend.onrender.com/api/health

Frontend:
- Vercel: https://prayas2026.vercel.app
- Custom Domain: https://yourdomain.com

Database:
- Host: your-hostinger-host
- User: prayas_user
```

## 🔒 Important Security Notes

1. **NEVER commit .env files** ✓ .gitignore handles this
2. **Use strong SECRET_KEY** in Render
3. **HTTPS everywhere** - Render & Vercel provide it
4. **Update CORS_ORIGINS** with actual Vercel URL
5. **Whitelist Render IP** in Hostinger
6. **Change default passwords** before going live
7. **Regular database backups** - Set up on Hostinger

## 🚀 Continuous Deployment

Once set up:
- Push to main branch on GitHub
- Render automatically redeploys backend
- Vercel automatically redeploys frontend
- No manual deployment needed!

## 📚 Additional Resources

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Hostinger Docs](https://www.hostinger.com/tutorials)
- [GitHub Docs](https://docs.github.com)

---

**Status**: ✅ Ready for production deployment
**Created**: February 6, 2026
**Architecture**: Render + Vercel + Hostinger
