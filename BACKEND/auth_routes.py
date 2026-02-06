from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
import os

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not all(k in data for k in ['username', 'password', 'loginType']):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    try:
        # This is a simplified version - implement actual database lookup
        username = data['username']
        password = data['password']
        login_type = data['loginType']
        
        # Hardcoded credentials for demo (replace with database query)
        credentials = {
            'Superadmin': {'password': 'Superadmin@1341', 'type': 'superadmin', 'redirect': 'superadmin.html'},
            'Schooladmin1': {'password': 'Schooladmin@13', 'type': 'admin', 'redirect': 'admin1.html'},
            'Schooladmin2': {'password': 'Schooladmin@93', 'type': 'admin', 'redirect': 'admin2.html'},
            'Schooladmin3': {'password': 'Schooladmin@390', 'type': 'admin', 'redirect': 'admin3.html'},
        }
        
        if username in credentials and credentials[username]['password'] == password:
            token = jwt.encode(
                {
                    'username': username,
                    'type': login_type,
                    'exp': datetime.utcnow() + timedelta(hours=24)
                },
                SECRET_KEY,
                algorithm='HS256'
            )
            
            return jsonify({
                'success': True,
                'token': token,
                'redirect': credentials[username]['redirect'],
                'message': 'Login successful'
            }), 200
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
            
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
        
        # Insert into database (implement actual database insert)
        # For now, return success
        
        return jsonify({
            'success': True,
            'message': 'Registration successful'
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
