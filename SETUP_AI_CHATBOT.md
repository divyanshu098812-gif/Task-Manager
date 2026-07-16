# 🤖 Nexus AI Chatbot Setup Guide

This guide will help you configure the AI chatbot feature in your Nexus Task Manager.

---

## 📋 Prerequisites

1. **Groq API Account**: Get a free account at [console.groq.com](https://console.groq.com)
2. **Python 3.8+**: Ensure you have Python installed
3. **MySQL Database**: Your database should be running

---

## 🔧 Local Development Setup

### Step 1: Get Your Groq API Key

1. Go to [console.groq.com/keys](https://console.groq.com/keys)
2. Sign up or log in
3. Click **"Create API Key"**
4. Copy your API key (starts with `gsk_...`)

### Step 2: Configure Environment Variables

Open the `.env` file in your project root and update it:

```env
# AI Service Configuration
GROQ_API_KEY=gsk_your_actual_api_key_here

# Database Configuration (update if needed)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=task_manager_db

# Flask Configuration
SECRET_KEY=generate-a-strong-random-key
FLASK_ENV=development
```

**To generate a strong SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Run the Application

```bash
python app.py
```

The server will start at `http://localhost:5000`

### Step 5: Test the Chatbot

1. Open your browser and go to `http://localhost:5000`
2. Log in to your account
3. Click the **🤖 AI button** in the bottom-right corner
4. Try sending a message or use one of the Quick Actions

---

## 🚀 Render Deployment Setup

### Important Notes:
- **DO NOT** commit your `.env` file to Git (it's already in `.gitignore`)
- Render ignores `.env` files automatically
- You must configure environment variables in Render Dashboard

### Step 1: Configure Environment Variables in Render

1. Go to your Render Dashboard
2. Select your **nexus-task-manager** service
3. Go to **Environment** tab
4. Add the following environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `GROQ_API_KEY` | `gsk_your_key_here` | Get from console.groq.com/keys |
| `FLASK_ENV` | `production` | Sets production mode |
| `SECRET_KEY` | (generate strong key) | Use `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DB_HOST` | (your MySQL host) | Provided by your database service |
| `DB_PORT` | `3306` | Default MySQL port |
| `DB_USER` | (your db username) | Provided by your database service |
| `DB_PASSWORD` | (your db password) | Provided by your database service |
| `DB_NAME` | `task_manager_db` | Your database name |

### Step 2: Deploy

1. Click **"Manual Deploy"** or push to your Git repository
2. Render will automatically rebuild with new environment variables
3. Wait for deployment to complete

### Step 3: Verify

1. Go to your live Render URL
2. Open the AI chatbot
3. Test with a message or Quick Action

---

## ✅ Testing the Chatbot

### Test Checklist:

- [ ] Chatbot button appears in bottom-right
- [ ] Clicking button opens chat window
- [ ] Quick Actions respond correctly:
  - [ ] 📅 Plan My Day
  - [ ] 📊 Analyze Productivity
  - [ ] 🎯 Which Task First?
  - [ ] ⏰ Today's Deadlines
  - [ ] 📈 Weekly Report
  - [ ] 💪 Motivate Me
- [ ] Custom messages get AI responses
- [ ] No JavaScript errors in console (F12)
- [ ] Messages display with proper formatting

---

## 🐛 Troubleshooting

### Issue 1: "Groq API Key Missing" Error

**Symptoms:**
- Chatbot shows: "⚠️ Groq API Key Missing"

**Solutions:**
1. **Local Development:**
   - Check if `.env` file exists in project root
   - Verify `GROQ_API_KEY` is set in `.env`
   - Restart Flask server: `Ctrl+C` then `python app.py`

2. **Render Deployment:**
   - Go to Render Dashboard → Environment
   - Verify `GROQ_API_KEY` variable exists
   - Redeploy if you just added it

### Issue 2: "Invalid Groq API Key" Error

**Symptoms:**
- Chatbot shows: "⚠️ Invalid Groq API Key" (HTTP 401)

**Solutions:**
1. Verify your API key at [console.groq.com/keys](https://console.groq.com/keys)
2. Ensure no extra spaces or quotes around the key
3. Generate a new API key if the old one expired
4. Update in `.env` (local) or Render Environment (production)

### Issue 3: "Rate Limit Exceeded" Error

**Symptoms:**
- Chatbot shows: "⚠️ Rate Limit Exceeded" (HTTP 429)

**Solutions:**
1. Wait 5-10 minutes before trying again
2. Check your usage at [console.groq.com](https://console.groq.com)
3. Groq free tier has rate limits:
   - 30 requests per minute
   - 14,400 requests per day
4. Consider upgrading to a paid plan for higher limits

### Issue 4: Chatbot Not Loading

**Symptoms:**
- No AI button appears
- Console shows JavaScript errors

**Solutions:**
1. Clear browser cache and reload
2. Check if `chat.js` and `chat.css` are loading (Network tab in DevTools)
3. Verify no JavaScript errors in Console (F12)
4. Ensure you're logged in (chatbot only shows for authenticated users)

### Issue 5: Connection Error

**Symptoms:**
- "⚠️ Connection Error" or "Cannot connect to Groq API"

**Solutions:**
1. Check your internet connection
2. Verify `api.groq.com` is accessible from your network
3. Check firewall/proxy settings
4. For Render: Check if service has internet access

### Issue 6: Environment Variables Not Loading

**Symptoms:**
- Flask shows database connection errors
- Chatbot shows "API Key Missing" even after setting it

**Solutions:**
1. Verify `python-dotenv` is installed: `pip install python-dotenv`
2. Check that `load_dotenv()` is called **before** importing other modules in `app.py`
3. Restart Flask server completely
4. On Windows, use PowerShell: `$env:GROQ_API_KEY="your_key"; python app.py`

---

## 🔍 Verifying Configuration

### Check if .env is loaded:

```python
# Add this temporarily to app.py after load_dotenv()
import os
print("GROQ_API_KEY loaded:", bool(os.environ.get('GROQ_API_KEY')))
print("DB_HOST:", os.environ.get('DB_HOST'))
```

### Check Groq API directly:

```python
import requests
import os

api_key = os.environ.get('GROQ_API_KEY')
response = requests.post(
    'https://api.groq.com/openai/v1/chat/completions',
    headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
    json={
        'model': 'llama-3.3-70b-versatile',
        'messages': [{'role': 'user', 'content': 'Hello'}],
        'max_tokens': 50
    }
)
print("Status:", response.status_code)
print("Response:", response.json() if response.status_code == 200 else response.text)
```

---

## 📚 Additional Resources

- **Groq Documentation**: [console.groq.com/docs](https://console.groq.com/docs)
- **Groq Models**: [console.groq.com/docs/models](https://console.groq.com/docs/models)
- **Flask-Login Docs**: [flask-login.readthedocs.io](https://flask-login.readthedocs.io)
- **Render Environment Variables**: [render.com/docs/environment-variables](https://render.com/docs/environment-variables)

---

## 💡 Tips

1. **API Key Security**: Never commit your `.env` file or hardcode API keys
2. **Rate Limits**: The free Groq tier is generous but has limits
3. **Model Selection**: The app uses `llama-3.3-70b-versatile` (fast and capable)
4. **Conversation Context**: The chatbot remembers the last 10 messages
5. **Error Messages**: Improved error messages guide users to solutions

---

## ✨ Features

The Nexus AI chatbot can:
- 📅 **Plan your day** based on pending tasks
- 📊 **Analyze productivity** patterns
- 🎯 **Prioritize tasks** intelligently
- ⏰ **Show deadlines** and overdue tasks
- 📈 **Generate reports** on your progress
- 💪 **Provide motivation** and encouragement
- 🔍 **Search tasks** using natural language
- 📝 **Break down** complex tasks
- 🎓 **Create study plans** optimized for your time

---

**Need Help?** If you're still having issues, check the Flask server logs or browser console for detailed error messages.
