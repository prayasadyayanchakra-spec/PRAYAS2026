from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')

def get_db_connection():
    """Get PostgreSQL database connection"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'dpg-d62rk3ur433s73a1514g-a.oregon-postgres.render.com'),
        user=os.getenv('DB_USER', 'prayas2026_user'),
        password=os.getenv('DB_PASSWORD', 'IYI9rIK1xQTvt9zooJ844Bw4LN2ZQukS'),
        database=os.getenv('DB_NAME', 'prayas2026'),
        port=os.getenv('DB_PORT', '5432')
    )

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not all(k in data for k in ['username', 'password', 'loginType']):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    try:
        username = data['username']
        password = data['password']
        login_type = data['loginType']
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Query user by username or email
        cursor.execute("""
            SELECT id, name, username, email, password, role 
            FROM users 
            WHERE username = %s OR email = %s
        """, (username, username))
        
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        # Verify password
        if not check_password_hash(user['password'], password):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        # Determine redirect based on role
        redirect_map = {
            'superadmin': 'superadmin.html',
            'admin': 'admin.html',
            'student': 'bookstore.html',
            'teacher': 'bookstore.html'
        }
        
        token = jwt.encode(
            {
                'user_id': user['id'],
                'username': user['username'],
                'role': user['role'],
                'exp': datetime.utcnow() + timedelta(hours=24)
            },
            SECRET_KEY,
            algorithm='HS256'
        )
        
        return jsonify({
            'success': True,
            'token': token,
            'redirect': redirect_map.get(user['role'], 'bookstore.html'),
            'user_id': user['id'],
            'role': user['role'],
            'message': 'Login successful'
        }), 200
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    required_fields = ['fullName', 'fatherName', 'rollNumber', 'phone', 'caste', 'class', 'password', 'registerType']
    if not data or not all(k in data for k in required_fields):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    try:
        # Hash password
        hashed_password = generate_password_hash(data['password'])
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Check if user already exists
        cursor.execute(
            "SELECT id FROM users WHERE email = %s OR username = %s",
            (data.get('email', data['fullName'].lower()), data['fullName'].lower())
        )
        
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'User already exists'}), 409
        
        # Insert new user
        cursor.execute("""
            INSERT INTO users (name, username, email, password, role, caste, phone, current_roll_no, current_class, father_name)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            data['fullName'],
            data['fullName'].lower(),
            data.get('email', f"{data['fullName'].lower()}@prayas2026.com"),
            hashed_password,
            data['registerType'],
            data['caste'],
            data['phone'],
            data['rollNumber'],
            data['class'],
            data['fatherName']
        ))
        
        user_id = cursor.fetchone()['id']
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@bp.route('/validate-token', methods=['POST'])
def validate_token():
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'valid': False}), 401
    
    try:
        token = token.split(' ')[1]
        jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return jsonify({'valid': True}), 200
    except:
        return jsonify({'valid': False}), 401
