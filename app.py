from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, UserMixin, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from mysql.connector import Error as DBError
import datetime
import os

from db_config import get_db_connection, init_db

# ==========================================================================
# App Setup
# ==========================================================================
app = Flask(__name__)

# Secret key from environment variable (fallback for local dev)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Production settings
if os.environ.get('FLASK_ENV') == 'production':
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# ===== Flask-Login =====
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'


# ==========================================================================
# Context Processor — inject sidebar_task_count + unread_notif_count
# ==========================================================================
@app.context_processor
def inject_sidebar_data():
    """Inject sidebar_task_count and unread_notif_count into every template."""
    if current_user.is_authenticated:
        try:
            conn   = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM tasks WHERE user_id=%s", (current_user.id,))
            task_count = cursor.fetchone()[0]
            cursor.execute(
                "SELECT COUNT(*) FROM notifications WHERE user_id=%s AND is_read=0",
                (current_user.id,)
            )
            notif_count = cursor.fetchone()[0]
            conn.close()
            return {'sidebar_task_count': task_count, 'unread_notif_count': notif_count}
        except Exception:
            pass
    return {'sidebar_task_count': 0, 'unread_notif_count': 0}


# ==========================================================================
# User Model
# ==========================================================================
class User(UserMixin):
    def __init__(self, id, username, email):
        self.id       = id
        self.username = username
        self.email    = email


@login_manager.user_loader
def load_user(user_id):
    try:
        conn   = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE id=%s", (user_id,))
        user_data = cursor.fetchone()
        conn.close()
        if user_data:
            return User(user_data['id'], user_data['username'], user_data['email'])
        return None
    except DBError:
        return None


# ==========================================================================
# Notification Helper
# ==========================================================================
def create_notification(user_id: int, notif_type: str, title: str, message: str = '') -> None:
    """
    Silently insert a notification record.
    Never raises — the main request flow must not be blocked by notification errors.

    Types: task_created | task_completed | task_pending | task_updated |
           task_deleted | due_today | overdue
    """
    try:
        conn   = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO notifications (user_id, type, title, message) VALUES (%s, %s, %s, %s)",
            (user_id, notif_type, title, message)
        )
        conn.commit()
        conn.close()
    except Exception:
        pass


# ==========================================================================
# Helper: friendly DB error page
# ==========================================================================
def _db_error_response(e: DBError, context: str = ''):
    message = f"Database error{' (' + context + ')' if context else ''}: {e.msg}"
    return render_template('db_error.html', message=message), 500


# ==========================================================================
# Routes — Pages
# ==========================================================================

@app.route('/')
def home():
    if current_user.is_authenticated:
        return redirect(url_for('tasks'))
    return render_template('index.html')


@app.route('/tasks')
@login_required
def tasks():
    try:
        conn   = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM tasks WHERE user_id=%s ORDER BY deadline",
            (current_user.id,)
        )
        tasks_list = cursor.fetchall()

        # Auto-generate overdue notifications (deduplicated by checking last 24 h)
        today = datetime.date.today()
        for t in tasks_list:
            if t['status'] != 'Completed' and t.get('deadline') and t['deadline'] < today:
                cursor.execute(
                    """SELECT id FROM notifications
                       WHERE user_id=%s AND type='overdue'
                         AND message LIKE %s
                         AND created_at >= NOW() - INTERVAL 1 DAY""",
                    (current_user.id, f"%#{t['id']}%")
                )
                if not cursor.fetchone():
                    create_notification(
                        current_user.id,
                        'overdue',
                        f'🔥 Overdue: {t["title"]}',
                        f'This task is past its deadline. #{t["id"]}'
                    )

        # Due-today notifications
        for t in tasks_list:
            if t['status'] != 'Completed' and t.get('deadline') and t['deadline'] == today:
                cursor.execute(
                    """SELECT id FROM notifications
                       WHERE user_id=%s AND type='due_today'
                         AND message LIKE %s
                         AND created_at >= CURDATE()""",
                    (current_user.id, f"%#{t['id']}%")
                )
                if not cursor.fetchone():
                    create_notification(
                        current_user.id,
                        'due_today',
                        f'📅 Due Today: {t["title"]}',
                        f'This task is due today. #{t["id"]}'
                    )

        conn.close()
        return render_template('tasks.html', tasks=tasks_list)
    except DBError as e:
        return _db_error_response(e, 'loading tasks')


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username        = request.form.get('username', '').strip()
        email           = request.form.get('email', '').strip().lower()
        password        = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        # ---- Validation ----
        if not username or not email or not password or not confirm_password:
            return render_template('signup.html', error='All fields are required.')

        if len(username) < 3:
            return render_template('signup.html', error='Username must be at least 3 characters.',
                                   form_data={'username': username, 'email': email})

        if password != confirm_password:
            return render_template('signup.html', error='Passwords do not match.',
                                   form_data={'username': username, 'email': email})

        if len(password) < 6:
            return render_template('signup.html', error='Password must be at least 6 characters.',
                                   form_data={'username': username, 'email': email})

        hashed = generate_password_hash(password)

        try:
            conn   = get_db_connection()
            cursor = conn.cursor()

            # Check for duplicate username
            cursor.execute("SELECT id FROM users WHERE username=%s", (username,))
            if cursor.fetchone():
                conn.close()
                return render_template('signup.html', error='That username is already taken.',
                                       form_data={'username': username, 'email': email})

            cursor.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
                (username, email, hashed)
            )
            conn.commit()
            new_id = cursor.lastrowid
            conn.close()

            # Welcome notification
            create_notification(new_id, 'welcome', f'👋 Welcome to Nexus Task, {username}!',
                                 'Your account is ready. Start adding tasks to get productive!')

            return redirect(url_for('login', registered=1))

        except DBError as e:
            if e.errno == 1062:
                return render_template('signup.html', error='An account with that email already exists.',
                                       form_data={'username': username})
            return _db_error_response(e, 'signup')

    return render_template('signup.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email    = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')

        if not email or not password:
            return render_template('login.html', error='Please enter your email and password.')

        try:
            conn   = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
            user = cursor.fetchone()
            conn.close()
        except DBError as e:
            return _db_error_response(e, 'login')

        if user and check_password_hash(user['password_hash'], password):
            login_user(User(user['id'], user['username'], user['email']))
            return redirect(url_for('tasks'))

        return render_template('login.html', error='Invalid email or password.')

    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect('/login')


@app.route('/add', methods=['GET', 'POST'])
@login_required
def add_task():
    if request.method == 'POST':
        title       = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        deadline    = request.form.get('deadline') or None

        if not title:
            return render_template('add_task.html', error='Task title is required.')

        try:
            conn   = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO tasks (title, description, deadline, user_id) VALUES (%s, %s, %s, %s)",
                (title, description, deadline, current_user.id)
            )
            conn.commit()
            conn.close()

            dl_str = f' — due {deadline}' if deadline else ''
            create_notification(
                current_user.id, 'task_created',
                f'✔ Task Created: {title}',
                f'Your new task has been added{dl_str}.'
            )

            return redirect(url_for('tasks'))
        except DBError as e:
            return _db_error_response(e, 'adding task')

    return render_template('add_task.html')


@app.route('/delete/<int:id>', methods=['POST'])
@login_required
def delete_task(id):
    try:
        conn   = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch title before deleting (for notification)
        cursor.execute("SELECT title FROM tasks WHERE id=%s AND user_id=%s", (id, current_user.id))
        task = cursor.fetchone()

        if task:
            cursor.execute("DELETE FROM tasks WHERE id=%s AND user_id=%s", (id, current_user.id))
            conn.commit()

        conn.close()

        if task:
            create_notification(
                current_user.id, 'task_deleted',
                f'🗑 Task Deleted: {task["title"]}',
                'The task has been permanently removed.'
            )

        return jsonify({'success': True})
    except DBError as e:
        return jsonify({'success': False, 'error': str(e.msg)}), 500


@app.route('/toggle/<int:id>', methods=['POST'])
@login_required
def toggle_status(id):
    try:
        conn   = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT title, status FROM tasks WHERE id=%s AND user_id=%s",
            (id, current_user.id)
        )
        task = cursor.fetchone()
        if not task:
            conn.close()
            return jsonify({'success': False, 'error': 'Task not found'}), 404

        new_status = 'Completed' if task['status'] == 'Pending' else 'Pending'
        cursor.execute(
            "UPDATE tasks SET status=%s WHERE id=%s AND user_id=%s",
            (new_status, id, current_user.id)
        )
        conn.commit()
        conn.close()

        if new_status == 'Completed':
            create_notification(
                current_user.id, 'task_completed',
                f'🏆 Task Completed: {task["title"]}',
                'Great work! Keep up the momentum.'
            )
        else:
            create_notification(
                current_user.id, 'task_pending',
                f'↩ Task Reopened: {task["title"]}',
                'Task has been moved back to pending.'
            )

        return jsonify({'success': True, 'status': new_status})
    except DBError as e:
        return jsonify({'success': False, 'error': str(e.msg)}), 500


@app.route('/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_task(id):
    try:
        conn   = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM tasks WHERE id=%s AND user_id=%s",
            (id, current_user.id)
        )
        task = cursor.fetchone()
    except DBError as e:
        return _db_error_response(e, 'loading task for edit')

    if not task:
        conn.close()
        return redirect(url_for('tasks'))

    if request.method == 'POST':
        title       = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        deadline    = request.form.get('deadline') or None

        if not title:
            conn.close()
            return render_template('edit_task.html', task=task, error='Task title is required.')

        try:
            cursor.execute(
                "UPDATE tasks SET title=%s, description=%s, deadline=%s WHERE id=%s AND user_id=%s",
                (title, description, deadline, id, current_user.id)
            )
            conn.commit()
            conn.close()

            create_notification(
                current_user.id, 'task_updated',
                f'✏ Task Updated: {title}',
                'Task details have been updated.'
            )

            return redirect(url_for('tasks'))
        except DBError as e:
            return _db_error_response(e, 'updating task')

    conn.close()
    return render_template('edit_task.html', task=task)


# ==========================================================================
# Analytics Route
# ==========================================================================
@app.route('/analytics')
@login_required
def analytics():
    try:
        conn   = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM tasks WHERE user_id=%s ORDER BY created_at DESC",
            (current_user.id,)
        )
        tasks = cursor.fetchall()
        conn.close()
        for t in tasks:
            if t.get('deadline') and hasattr(t['deadline'], 'strftime'):
                t['deadline'] = t['deadline'].strftime('%Y-%m-%d')
            if t.get('created_at') and hasattr(t['created_at'], 'strftime'):
                t['created_at'] = t['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        return render_template('analytics.html', tasks=tasks)
    except DBError as e:
        return _db_error_response(e, 'analytics')


# ==========================================================================
# Calendar Route
# ==========================================================================
@app.route('/calendar')
@login_required
def calendar_view():
    try:
        conn   = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, title, deadline, status FROM tasks WHERE user_id=%s",
            (current_user.id,)
        )
        tasks = cursor.fetchall()
        conn.close()
        for t in tasks:
            if t.get('deadline') and hasattr(t['deadline'], 'strftime'):
                t['deadline'] = t['deadline'].strftime('%Y-%m-%d')
        return render_template('calendar.html', tasks=tasks)
    except DBError as e:
        return _db_error_response(e, 'calendar')


# ==========================================================================
# Notification API Routes
# ==========================================================================

@app.route('/api/notifications')
@login_required
def api_get_notifications():
    """Return all notifications for the current user, newest first."""
    try:
        conn   = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """SELECT id, type, title, message, is_read,
                      DATE_FORMAT(created_at, '%%Y-%%m-%%d %%H:%%i:%%s') AS created_at
               FROM notifications
               WHERE user_id=%s
               ORDER BY created_at DESC
               LIMIT 50""",
            (current_user.id,)
        )
        notifications = cursor.fetchall()
        cursor.execute(
            "SELECT COUNT(*) AS cnt FROM notifications WHERE user_id=%s AND is_read=0",
            (current_user.id,)
        )
        unread = cursor.fetchone()['cnt']
        conn.close()
        return jsonify({'notifications': notifications, 'unread': unread})
    except DBError as e:
        return jsonify({'error': str(e.msg)}), 500


@app.route('/api/notifications/<int:notif_id>/read', methods=['POST'])
@login_required
def api_mark_read(notif_id):
    """Mark a single notification as read."""
    try:
        conn   = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE notifications SET is_read=1 WHERE id=%s AND user_id=%s",
            (notif_id, current_user.id)
        )
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except DBError as e:
        return jsonify({'success': False, 'error': str(e.msg)}), 500


@app.route('/api/notifications/read-all', methods=['POST'])
@login_required
def api_mark_all_read():
    """Mark all notifications as read for the current user."""
    try:
        conn   = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE notifications SET is_read=1 WHERE user_id=%s",
            (current_user.id,)
        )
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except DBError as e:
        return jsonify({'success': False, 'error': str(e.msg)}), 500


@app.route('/api/notifications/clear', methods=['DELETE'])
@login_required
def api_clear_notifications():
    """Delete all notifications for the current user."""
    try:
        conn   = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM notifications WHERE user_id=%s", (current_user.id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except DBError as e:
        return jsonify({'success': False, 'error': str(e.msg)}), 500


@app.route('/api/notifications/count')
@login_required
def api_notif_count():
    """Lightweight poll endpoint — just returns the unread count."""
    try:
        conn   = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM notifications WHERE user_id=%s AND is_read=0",
            (current_user.id,)
        )
        count = cursor.fetchone()[0]
        conn.close()
        return jsonify({'unread': count})
    except DBError as e:
        return jsonify({'unread': 0}), 500


# ==========================================================================
# Startup: initialise DB tables before first request
# ==========================================================================
with app.app_context():
    ok = init_db()
    if not ok:
        print("\n⚠️  WARNING: App started but the database is not connected.", flush=True)
        print("   Routes that need the DB will return a 500 error page.", flush=True)


if __name__ == '__main__':
    # Get port from environment variable (Render provides PORT)
    port = int(os.environ.get('PORT', 5000))
    # Debug mode off in production
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)