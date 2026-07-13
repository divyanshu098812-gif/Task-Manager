# 💻 Command Cheat Sheet - Deployment

## 🚀 Quick Commands

### Git Commands

```bash
# Add all changes
git add .

# Commit with message
git commit -m "Deploy to Render with environment variables"

# Push to GitHub
git push origin main

# Check status
git status

# View recent commits
git log --oneline -5
```

---

### Database Export (Local)

```bash
# Windows Command Prompt
cd c:\Users\divya\OneDrive\Desktop\DEPLOY\Task-Manager-main

# Export database
mysqldump -u root -p task_manager_db > database_backup.sql

# You'll be prompted for MySQL password
```

---

### Database Import (Cloud)

```bash
# Import to Railway
mysql -h <RAILWAY_HOST> -P 3306 -u root -p<PASSWORD> railway < database_backup.sql

# Example with actual values
mysql -h containers-us-west-123.railway.app -P 3306 -u root -pmypassword railway < database_backup.sql
```

**Important:** No space between `-p` and password!

---

### Test Locally (Before Deploy)

```bash
# Set environment variables (Windows CMD)
set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=password
set DB_NAME=task_manager_db
set SECRET_KEY=test-secret-key
set FLASK_ENV=development

# Run app
python app.py

# Open browser
# http://localhost:5000
```

---

### Test Locally (PowerShell)

```powershell
# Set environment variables
$env:DB_HOST="localhost"
$env:DB_PORT="3306"
$env:DB_USER="root"
$env:DB_PASSWORD="password"
$env:DB_NAME="task_manager_db"
$env:SECRET_KEY="test-secret-key"
$env:FLASK_ENV="development"

# Run app
python app.py
```

---

### Test with Gunicorn (Production Simulation)

```bash
# Install gunicorn if not installed
pip install gunicorn

# Run with gunicorn
gunicorn app:app

# Run with specific port
gunicorn app:app --bind 0.0.0.0:8000

# Run with workers
gunicorn app:app --workers 4
```

---

## 🗄️ Railway MySQL Commands

### Get Database Connection String

```bash
# Railway provides MYSQL_URL environment variable
# Format: mysql://user:password@host:port/database

# Example
mysql://root:password@containers-us-west-123.railway.app:3306/railway
```

### Connect to Railway MySQL

```bash
# Connect via command line
mysql -h containers-us-west-123.railway.app -P 3306 -u root -p

# You'll be prompted for password
```

### List Tables

```sql
-- After connecting
USE railway;
SHOW TABLES;

-- Check table structure
DESCRIBE users;
DESCRIBE tasks;
DESCRIBE notifications;
```

### Verify Data

```sql
-- Count users
SELECT COUNT(*) FROM users;

-- Count tasks
SELECT COUNT(*) FROM tasks;

-- Count notifications
SELECT COUNT(*) FROM notifications;

-- View recent users
SELECT id, username, email, created_at FROM users ORDER BY created_at DESC LIMIT 5;
```

---

## 🔍 Debugging Commands

### Check Python Version

```bash
python --version
# Should show Python 3.9.x or higher
```

### Check Installed Packages

```bash
pip list

# Check specific packages
pip show Flask
pip show gunicorn
pip show mysql-connector-python
```

### Verify Requirements

```bash
# Install from requirements.txt
pip install -r requirements.txt

# Check for outdated packages
pip list --outdated
```

---

## 🌐 Render Commands

### View Logs (via Dashboard)

```
1. Go to Render Dashboard
2. Click your web service
3. Click "Logs" tab
4. View real-time logs
```

### Manual Deploy Trigger

```
1. Render Dashboard
2. Your web service
3. Click "Manual Deploy"
4. Select branch (main)
5. Deploy
```

### Restart Service

```
1. Render Dashboard
2. Your web service
3. Click "Restart"
```

---

## 🐛 Troubleshooting Commands

### Test Database Connection

Create `test_db.py`:
```python
import os
from db_config import get_db_connection

try:
    conn = get_db_connection()
    print("✅ Database connection successful!")
    cursor = conn.cursor()
    cursor.execute("SELECT VERSION()")
    version = cursor.fetchone()
    print(f"MySQL Version: {version[0]}")
    conn.close()
except Exception as e:
    print(f"❌ Database connection failed: {e}")
```

Run:
```bash
python test_db.py
```

---

### Check Flask App Syntax

```bash
# Check for Python syntax errors
python -m py_compile app.py
python -m py_compile db_config.py

# If no output = no syntax errors
```

---

### Test Specific Route

```bash
# Start app
python app.py

# In another terminal, test with curl
curl http://localhost:5000/
curl http://localhost:5000/signup
curl http://localhost:5000/login
```

---

## 📊 Environment Variable Commands

### Windows CMD

```cmd
# Set variables
set DB_HOST=containers-us-west-123.railway.app
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=yourpassword
set DB_NAME=railway
set SECRET_KEY=your-secret-key
set FLASK_ENV=production

# View variable
echo %DB_HOST%

# View all environment variables
set
```

### PowerShell

```powershell
# Set variables
$env:DB_HOST="containers-us-west-123.railway.app"
$env:DB_PORT="3306"
$env:DB_USER="root"
$env:DB_PASSWORD="yourpassword"
$env:DB_NAME="railway"
$env:SECRET_KEY="your-secret-key"
$env:FLASK_ENV="production"

# View variable
$env:DB_HOST

# View all environment variables
Get-ChildItem Env:
```

### Linux/Mac

```bash
# Set variables
export DB_HOST=containers-us-west-123.railway.app
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=yourpassword
export DB_NAME=railway
export SECRET_KEY=your-secret-key
export FLASK_ENV=production

# View variable
echo $DB_HOST

# View all environment variables
printenv
```

---

## 🔄 Update Workflow

### Make Changes and Redeploy

```bash
# 1. Make your changes to code

# 2. Test locally
python app.py

# 3. Add changes
git add .

# 4. Commit
git commit -m "Description of changes"

# 5. Push to GitHub
git push origin main

# 6. Render auto-deploys (wait 2-3 minutes)

# 7. Check Render logs to verify
```

---

## 💾 Backup Commands

### Backup Database

```bash
# Full backup
mysqldump -h <RAILWAY_HOST> -P 3306 -u root -p<PASSWORD> railway > backup_$(date +%Y%m%d).sql

# Specific table
mysqldump -h <RAILWAY_HOST> -P 3306 -u root -p<PASSWORD> railway users > users_backup.sql

# With date in filename (Windows)
mysqldump -h <RAILWAY_HOST> -P 3306 -u root -p<PASSWORD> railway > backup.sql
```

### Restore Database

```bash
# Restore full backup
mysql -h <RAILWAY_HOST> -P 3306 -u root -p<PASSWORD> railway < backup_20240101.sql

# Restore specific table
mysql -h <RAILWAY_HOST> -P 3306 -u root -p<PASSWORD> railway < users_backup.sql
```

---

## 🎯 Quick Test Checklist

```bash
# 1. Check Python version
python --version

# 2. Install dependencies
pip install -r requirements.txt

# 3. Test database config
python test_db.py

# 4. Run app locally
python app.py

# 5. Test in browser
# http://localhost:5000

# 6. Push to GitHub
git add .
git commit -m "Deploy"
git push origin main

# 7. Deploy on Render
# (via dashboard)

# 8. Test production URL
# https://your-app.onrender.com
```

---

## 📱 Useful URLs

```
Local Development:
http://localhost:5000

Render Dashboard:
https://dashboard.render.com

Railway Dashboard:
https://railway.app/dashboard

GitHub Repository:
https://github.com/your-username/Task-Manager-main

Production App:
https://your-app-name.onrender.com
```

---

## 🔑 Generate Secret Key

```python
# Python command to generate secret key
python -c "import secrets; print(secrets.token_hex(32))"

# Or
python -c "import os; print(os.urandom(24).hex())"
```

---

## ✅ Final Deployment Commands

```bash
# Complete workflow
cd c:\Users\divya\OneDrive\Desktop\DEPLOY\Task-Manager-main

# Add all files
git add .

# Commit
git commit -m "Configure for Render deployment with environment variables"

# Push to GitHub
git push origin main

# Now go to Render dashboard and deploy
# Add environment variables
# Wait for deployment
# Test your app!
```

---

## 🎉 Success Commands

```bash
# Check deployment status
curl https://your-app-name.onrender.com

# Test API endpoint
curl https://your-app-name.onrender.com/api/notifications/count

# Monitor logs in real-time (via Render dashboard)
# Dashboard → Your Service → Logs → Enable auto-scroll
```

---

**All set! Use these commands to deploy and maintain your app.** 🚀
