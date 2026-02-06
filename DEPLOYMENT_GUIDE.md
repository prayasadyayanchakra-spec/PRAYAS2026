# PRAYAS 2026 - Deployment Configuration Guide

## Deployment Architecture

```
PRAYAS2026 (GitHub Repository)
├── backend/           → Deploy to Render
├── frontend/          → Deploy to Vercel
├── database/          → MySQL on Hostinger
├── docs/              → Documentation
└── .github/           → GitHub Actions (optional)
```

## Platform Specific Configurations

### 1. RENDER (Backend Deployment)

**Environment Variables to Set:**
```
RENDER_INTERNAL_HOSTNAME=localhost
MYSQL_HOST=your-hostinger-host
MYSQL_USER=your-username
MYSQL_PASSWORD=your-password
MYSQL_DB=prayas2026
FLASK_ENV=production
SECRET_KEY=your-secure-random-key
CORS_ORIGINS=https://your-vercel-domain.vercel.app
DATABASE_URL=mysql://user:password@host/prayas2026
```

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
gunicorn -w 4 -b 0.0.0.0:10000 app:app
```

### 2. VERCEL (Frontend Deployment)

**vercel.json Configuration:**
```json
{
  "buildCommand": "echo 'Static site deployment'",
  "outputDirectory": ".",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "@api_url"
  }
}
```

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
```

### 3. HOSTINGER (Database & Domain)

**MySQL Setup:**
1. Create database: prayas2026
2. Create user with full permissions
3. Whitelist Render IP in firewall
4. Note down: Host, Port (usually 3306), Username, Password

**Domain Configuration:**
1. Point domain to Vercel nameservers
2. OR configure DNS records for both services

### 4. GITHUB Setup

**Repository Structure:**
```
https://github.com/yourusername/PRAYAS2026
├── backend/
├── frontend/
└── docs/
```

## Deployment Steps

### Step 1: GitHub Push
```bash
git init
git add .
git commit -m "Initial PRAYAS2026 commit"
git remote add origin https://github.com/yourusername/PRAYAS2026.git
git branch -M main
git push -u origin main
```

### Step 2: Render Deployment (Backend)

1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub repository
4. Settings:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn -w 4 -b 0.0.0.0:10000 app:app`
   - Environment: Add variables from above

### Step 3: Vercel Deployment (Frontend)

1. Go to https://vercel.com
2. Create new project
3. Import GitHub repository
4. Settings:
   - Framework: Other
   - Root Directory: `frontend`
   - Build Command: Leave blank
   - Output Directory: .
   - Environment: Add NEXT_PUBLIC_API_URL

### Step 4: Hostinger Database

1. MySQL Database
   - Create database: prayas2026
   - Import: database_schema.sql
   - Create user with all privileges

2. Domain Setup
   - Use Hostinger nameservers or configure DNS
   - Point to Vercel for frontend
   - Use custom domain for backend (Render)

## Post-Deployment Configuration

### 1. Update Frontend API URLs

In `frontend/js/auth.js` and other files, update:
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-render-backend.onrender.com';

fetch(`${API_URL}/api/auth/login`, {
  // ...
});
```

### 2. Update CORS in Backend

In `backend/app.py`:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://your-vercel-domain.vercel.app"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

### 3. Update Database Connection

In `backend/app.py`:
```python
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'your-hostinger-host')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'your-user')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', 'your-password')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'prayas2026')
```

## Testing Deployment

### Test API Endpoints
```bash
curl https://your-render-backend.onrender.com/api/health
```

### Test Frontend
```bash
Open https://your-vercel-domain.vercel.app
```

### Test Database Connection
```bash
mysql -h your-hostinger-host -u your-user -p your-password -D prayas2026
```

## Troubleshooting

### Backend Connection Issues
- Check Render logs: Dashboard → Logs
- Verify environment variables set
- Check MySQL whitelist IP
- Test: curl https://render-url/api/health

### Frontend Issues
- Check Vercel logs: Dashboard → Deployments
- Clear browser cache
- Check NEXT_PUBLIC_API_URL is set
- Verify CORS configuration

### Database Issues
- Test connection locally first
- Check Hostinger firewall
- Verify MySQL user permissions
- Check database exists

## Performance Optimization

### Render (Backend)
- Use gunicorn with 4 workers
- Enable caching headers
- Optimize database queries
- Monitor response times

### Vercel (Frontend)
- Enable edge caching
- Compress assets
- Minimize JavaScript
- Optimize images

### Hostinger (Database)
- Use connection pooling
- Optimize queries
- Regular backups
- Monitor performance

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS everywhere
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Enable database backups
- [ ] Configure rate limiting
- [ ] Monitor access logs
- [ ] Use environment variables
- [ ] Regular security updates

## Monitoring & Maintenance

### Set Up Alerts
- Render: Error rates
- Vercel: Build failures
- Hostinger: Database size

### Regular Tasks
- Monitor error logs
- Check performance metrics
- Update dependencies
- Backup database (daily)
- Review access logs
- Test critical paths

## DNS Configuration (Example)

```
Domain: yourdomain.com

A Record:
  Name: @
  Value: Vercel IP (from Vercel dashboard)

CNAME Record (for backend):
  Name: api
  Value: your-render-service.onrender.com

CNAME Record (for www):
  Name: www
  Value: yourdomain.com
```

## Git Workflow

### First Time Push
```bash
cd PRAYAS2026
git init
git add .
git commit -m "Initial commit: PRAYAS 2026 complete project"
git remote add origin https://github.com/yourusername/PRAYAS2026.git
git branch -M main
git push -u origin main
```

### Future Updates
```bash
git add .
git commit -m "Update: [description]"
git push origin main
```

Render and Vercel will automatically redeploy!

## Documentation Files Needed

- DEPLOYMENT_GUIDE.md (this file)
- RENDER_SETUP.md
- VERCEL_SETUP.md
- HOSTINGER_SETUP.md
- ENVIRONMENT_VARIABLES.md

---

**Created**: February 6, 2026
**Version**: 1.0.0
**Status**: Deployment Ready
