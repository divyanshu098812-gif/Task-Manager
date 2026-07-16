from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from db_config import get_db_connection
from ai_service import NexusAI
from mysql.connector import Error as DBError

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')

@chat_bp.route('/message', methods=['POST'])
@login_required
def send_message():
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        conversation = data.get('conversation', [])
        
        if not message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        conn = get_db_connection()
        ai = NexusAI(current_user.id, current_user.username, conn)
        response = ai.chat(message, conversation)
        conn.close()
        
        return jsonify({'success': True, 'response': response, 'timestamp': None})
        
    except DBError as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@chat_bp.route('/quick-action/<action>', methods=['POST'])
@login_required
def quick_action(action):
    try:
        conn = get_db_connection()
        ai = NexusAI(current_user.id, current_user.username, conn)
        
        response = ""
        
        if action == 'plan-day':
            response = ai.plan_my_day()
        elif action == 'analyze':
            response = ai.analyze_productivity()
        elif action == 'which-first':
            response = ai.which_task_first()
        elif action == 'todays-deadlines':
            response = ai.get_todays_deadlines()
        elif action == 'weekly-summary':
            response = ai.weekly_summary()
        elif action == 'motivate':
            response = ai.motivational_boost()
        else:
            conn.close()
            return jsonify({'error': 'Invalid action'}), 400
        
        conn.close()
        
        return jsonify({'success': True, 'response': response})
        
    except DBError as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@chat_bp.route('/create-goal', methods=['POST'])
@login_required
def create_from_goal():
    try:
        data = request.get_json()
        goal = data.get('goal', '').strip()
        
        if not goal:
            return jsonify({'error': 'Goal cannot be empty'}), 400
        
        conn = get_db_connection()
        ai = NexusAI(current_user.id, current_user.username, conn)
        response = ai.create_tasks_from_goal(goal)
        conn.close()
        
        return jsonify({'success': True, 'response': response})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/task-breakdown', methods=['POST'])
@login_required
def get_task_breakdown():
    try:
        data = request.get_json()
        task_title = data.get('task', '').strip()
        
        if not task_title:
            return jsonify({'error': 'Task title cannot be empty'}), 400
        
        conn = get_db_connection()
        ai = NexusAI(current_user.id, current_user.username, conn)
        response = ai.task_breakdown(task_title)
        conn.close()
        
        return jsonify({'success': True, 'response': response})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/study-plan', methods=['POST'])
@login_required
def create_study_plan():
    try:
        data = request.get_json()
        hours = float(data.get('hours', 5))
        subjects = data.get('subjects', '').strip()
        
        conn = get_db_connection()
        ai = NexusAI(current_user.id, current_user.username, conn)
        response = ai.create_study_plan(hours, subjects)
        conn.close()
        
        return jsonify({'success': True, 'response': response})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/search', methods=['POST'])
@login_required
def search_tasks():
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        
        if not query:
            return jsonify({'error': 'Search query cannot be empty'}), 400
        
        conn = get_db_connection()
        ai = NexusAI(current_user.id, current_user.username, conn)
        response = ai.search_tasks(query)
        conn.close()
        
        return jsonify({'success': True, 'response': response})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500