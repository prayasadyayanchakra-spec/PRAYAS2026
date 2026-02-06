from flask import Blueprint, request, jsonify
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

load_dotenv()

bp = Blueprint('students', __name__, url_prefix='/api/students')

def get_db_connection():
    """Get PostgreSQL database connection"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'dpg-d62rk3ur433s73a1514g-a.oregon-postgres.render.com'),
        user=os.getenv('DB_USER', 'prayas2026_user'),
        password=os.getenv('DB_PASSWORD', 'IYI9rIK1xQTvt9zooJ844Bw4LN2ZQukS'),
        database=os.getenv('DB_NAME', 'prayas2026'),
        port=os.getenv('DB_PORT', '5432')
    )

@bp.route('', methods=['GET'])
def get_students():
    school = request.args.get('school')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        if school:
            cursor.execute("""
                SELECT id, name, current_roll_no as rollNumber, current_class as class, 
                       caste, phone, school_name as schoolName
                FROM users 
                WHERE school_name = %s
            """, (school,))
        else:
            cursor.execute("""
                SELECT id, name, current_roll_no as rollNumber, current_class as class, 
                       caste, phone, school_name as schoolName
                FROM users 
                WHERE role = 'student'
            """)
        
        students = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(students), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:student_id>', methods=['GET'])
def get_student(student_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cursor.execute("""
            SELECT * FROM users WHERE id = %s
        """, (student_id,))
        
        student = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if student:
            return jsonify(student), 200
        else:
            return jsonify({'error': 'Student not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
