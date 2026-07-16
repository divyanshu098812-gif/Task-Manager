import os
import json
import datetime
from typing import Dict, List, Any
import requests

GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
MODEL_NAME = 'llama-3.3-70b-versatile'

class NexusAI:
    def __init__(self, user_id: int, username: str, db_connection):
        self.user_id = user_id
        self.username = username
        self.db_conn = db_connection
    
    def _get_user_tasks(self) -> List[Dict[str, Any]]:
        cursor = self.db_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM tasks WHERE user_id=%s ORDER BY deadline, created_at DESC", (self.user_id,))
        tasks = cursor.fetchall()
        
        for task in tasks:
            if task.get('deadline'):
                task['deadline'] = task['deadline'].strftime('%Y-%m-%d')
            if task.get('created_at'):
                task['created_at'] = task['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        
        return tasks
    
    def _get_task_statistics(self) -> Dict[str, int]:
        tasks = self._get_user_tasks()
        today = datetime.date.today()
        
        stats = {
            'total': len(tasks),
            'completed': len([t for t in tasks if t['status'] == 'Completed']),
            'pending': len([t for t in tasks if t['status'] != 'Completed']),
            'overdue': 0
        }
        
        for task in tasks:
            if task['status'] != 'Completed' and task.get('deadline'):
                deadline = datetime.datetime.strptime(task['deadline'], '%Y-%m-%d').date()
                if deadline < today:
                    stats['overdue'] += 1
        
        return stats
    
    def _create_system_prompt(self) -> str:
        stats = self._get_task_statistics()
        
        prompt = f"""You are Nexus AI, an intelligent productivity assistant for {self.username}.

Current Task Statistics:
- Total Tasks: {stats['total']}
- Completed: {stats['completed']}
- Pending: {stats['pending']}
- Overdue: {stats['overdue']}

Your capabilities:
1. Plan daily schedules based on tasks
2. Create task roadmaps from goals
3. Prioritize tasks intelligently
4. Analyze productivity patterns
5. Provide motivational guidance
6. Break down complex tasks
7. Generate study plans
8. Search and filter tasks
9. Parse natural language task creation

Guidelines:
- Be concise, friendly, and professional
- Focus on productivity and task management
- Provide actionable insights
- Use emojis appropriately (not excessively)
- When creating tasks, ask for confirmation first
- Explain your reasoning for recommendations
- Be encouraging and supportive

Current date: {datetime.date.today().strftime('%Y-%m-%d')}
User timezone: Assume user's local time

Remember: You can see user's tasks but cannot modify database directly. Always ask for confirmation before suggesting task creation."""
        
        return prompt
    
    def chat(self, user_message: str, conversation_history: List[Dict] = None) -> str:
        if not GROQ_API_KEY:
            return "⚠️ **Groq API Key Missing**\n\nThe AI chatbot requires a Groq API key to function.\n\n**For Local Development:**\n1. Get your API key from [console.groq.com/keys](https://console.groq.com/keys)\n2. Add it to your `.env` file:\n   ```\n   GROQ_API_KEY=your_key_here\n   ```\n3. Restart the Flask server\n\n**For Render Deployment:**\n1. Go to Render Dashboard → Your Service → Environment\n2. Add: `GROQ_API_KEY` with your key as the value\n3. Render will auto-deploy with the new variable"
        
        messages = [{"role": "system", "content": self._create_system_prompt()}]
        
        if conversation_history:
            messages.extend(conversation_history[-10:])
        
        messages.append({"role": "user", "content": user_message})
        
        try:
            response = requests.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": MODEL_NAME,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1024,
                    "top_p": 1,
                    "stream": False
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content']
            elif response.status_code == 401:
                return "⚠️ **Invalid Groq API Key**\n\nThe provided API key is invalid or expired.\n\n**Solution:**\n1. Verify your API key at [console.groq.com/keys](https://console.groq.com/keys)\n2. Update the `GROQ_API_KEY` in your `.env` file (local) or Render Environment Variables (production)\n3. Make sure there are no extra spaces or quotes around the key"
            elif response.status_code == 429:
                return "⚠️ **Rate Limit Exceeded**\n\nYou've exceeded the Groq API rate limit.\n\n**Solution:**\n- Wait a few minutes and try again\n- Check your usage at [console.groq.com](https://console.groq.com)\n- Consider upgrading your Groq plan for higher limits"
            elif response.status_code == 500:
                return "⚠️ **Groq API Server Error**\n\nThe Groq API is experiencing issues.\n\n**Solution:**\n- Wait a few minutes and try again\n- Check Groq's status page\n- The issue is on Groq's side, not your application"
            else:
                error_msg = f"⚠️ **AI Service Error (HTTP {response.status_code})**\n\n"
                try:
                    error_data = response.json()
                    error_msg += f"Details: {error_data.get('error', {}).get('message', 'Unknown error')}"
                except:
                    error_msg += f"Raw response: {response.text[:200]}"
                return error_msg
                
        except requests.exceptions.Timeout:
            return "⚠️ **Request Timeout**\n\nThe Groq API took too long to respond.\n\n**Solution:**\n- Check your internet connection\n- Try again in a few moments\n- The AI service might be experiencing high load"
        except requests.exceptions.ConnectionError:
            return "⚠️ **Connection Error**\n\nCannot connect to the Groq API.\n\n**Solution:**\n- Check your internet connection\n- Verify firewall/proxy settings\n- Ensure api.groq.com is accessible from your network"
        except requests.exceptions.RequestException as e:
            return f"⚠️ **Network Error**\n\nFailed to reach the Groq API.\n\nDetails: {str(e)[:200]}"
        except Exception as e:
            return f"⚠️ **Unexpected Error**\n\nAn unexpected error occurred.\n\nDetails: {str(e)[:200]}\n\nIf this persists, please check your configuration and server logs."
    
    def plan_my_day(self) -> str:
        tasks = self._get_user_tasks()
        pending = [t for t in tasks if t['status'] != 'Completed']
        
        if not pending:
            return "🎉 You have no pending tasks! Great job staying on top of things."
        
        prompt = f"""Create a daily plan for today. Pending tasks:
{json.dumps(pending[:10], indent=2)}

Focus on:
1. Tasks due today
2. High priority items
3. Quick wins to build momentum
4. Time management suggestions

Provide a structured daily schedule."""
        
        return self.chat(prompt)
    
    def which_task_first(self) -> str:
        tasks = self._get_user_tasks()
        pending = [t for t in tasks if t['status'] != 'Completed']
        
        if not pending:
            return "✅ No pending tasks! You're all caught up."
        
        prompt = f"""Analyze these pending tasks and recommend which ONE task I should do first:
{json.dumps(pending[:15], indent=2)}

Consider:
- Deadlines
- Task complexity
- Quick wins vs long-term impact
- Energy levels (assume morning/fresh start)

Provide ONE specific recommendation with reasoning."""
        
        return self.chat(prompt)
    
    def analyze_productivity(self) -> str:
        stats = self._get_task_statistics()
        tasks = self._get_user_tasks()
        
        prompt = f"""Analyze my productivity:

Statistics:
{json.dumps(stats, indent=2)}

Recent tasks:
{json.dumps(tasks[:20], indent=2)}

Provide:
1. Productivity score (0-100)
2. Strengths
3. Areas for improvement
4. Actionable suggestions
5. Weekly trend analysis"""
        
        return self.chat(prompt)
    
    def create_tasks_from_goal(self, goal: str) -> str:
        prompt = f"""User wants to achieve: "{goal}"

Create a comprehensive task breakdown with:
1. Main milestones (3-5 key phases)
2. Specific actionable tasks for each
3. Suggested deadlines (relative to today)
4. Priority levels

Format as a clear roadmap. Ask if they want to add these tasks to their list."""
        
        return self.chat(prompt)
    
    def get_todays_deadlines(self) -> str:
        tasks = self._get_user_tasks()
        today = datetime.date.today().strftime('%Y-%m-%d')
        
        today_tasks = [t for t in tasks if t.get('deadline') == today and t['status'] != 'Completed']
        
        if not today_tasks:
            return "📅 No tasks due today! You're ahead of schedule."
        
        result = f"📅 **Tasks Due Today ({len(today_tasks)}):**\n\n"
        for task in today_tasks:
            result += f"• **{task['title']}**\n"
            if task.get('description'):
                result += f"  _{task['description'][:100]}_\n"
        
        return result
    
    def weekly_summary(self) -> str:
        tasks = self._get_user_tasks()
        stats = self._get_task_statistics()
        
        week_ago = (datetime.date.today() - datetime.timedelta(days=7)).strftime('%Y-%m-%d')
        recent_completed = [t for t in tasks if t['status'] == 'Completed' and t.get('created_at', '').startswith(week_ago[:7])]
        
        prompt = f"""Generate a weekly summary:

Statistics:
{json.dumps(stats, indent=2)}

Recently completed tasks:
{json.dumps(recent_completed[:15], indent=2)}

Include:
1. Week's achievements
2. Completion rate
3. Best performing day
4. Upcoming priorities
5. Motivational message"""
        
        return self.chat(prompt)
    
    def task_breakdown(self, task_title: str) -> str:
        prompt = f"""Break down this task into smaller actionable steps: "{task_title}"

Provide:
1. 5-8 specific subtasks
2. Estimated time for each
3. Suggested order
4. Prerequisites
5. Success criteria

Make it practical and immediately actionable."""
        
        return self.chat(prompt)
    
    def create_study_plan(self, hours_available: float, subjects: str = "") -> str:
        tasks = self._get_user_tasks()
        pending = [t for t in tasks if t['status'] != 'Completed']
        
        context = f"User has {hours_available} hours available today."
        if subjects:
            context += f" Focusing on: {subjects}"
        
        prompt = f"""{context}

Pending tasks:
{json.dumps(pending[:10], indent=2)}

Create an optimized study schedule:
1. Time blocks with breaks
2. Prioritized subjects/tasks
3. Pomodoro technique suggestions
4. Energy management tips
5. Realistic daily goals"""
        
        return self.chat(prompt)
    
    def search_tasks(self, query: str) -> str:
        tasks = self._get_user_tasks()
        
        prompt = f"""Search query: "{query}"

Available tasks:
{json.dumps(tasks, indent=2)}

Find and present relevant tasks that match the query. Include task details and why they match."""
        
        return self.chat(prompt)
    
    def motivational_boost(self) -> str:
        stats = self._get_task_statistics()
        
        if stats['overdue'] > 5:
            context = "many overdue tasks"
        elif stats['completed'] > stats['pending']:
            context = "great completion rate"
        else:
            context = "average progress"
        
        prompt = f"""User has {context}. Stats: {json.dumps(stats)}

Provide a motivational message that:
1. Acknowledges current situation
2. Provides encouragement
3. Offers practical next steps
4. Ends with an inspiring quote

Keep it genuine and actionable."""
        
        return self.chat(prompt)