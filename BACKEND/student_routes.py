from flask import Blueprint, request, jsonify
import MySQLdb
import os

bp = Blueprint('students', __name__, url_prefix='/api/students')

@bp.route('', methods=['GET'])
def get_students():
    school = request.args.get('school')
    
    try:
        conn = MySQLdb.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            passwd=os.getenv('MYSQL_PASSWORD', ''),
            db=os.getenv('MYSQL_DB', 'prayas2026')
        )
        cursor = conn.cursor(MySQLdb.cursors.DictCursor)
        
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
        conn = MySQLdb.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            passwd=os.getenv('MYSQL_PASSWORD', ''),
            db=os.getenv('MYSQL_DB', 'prayas2026')
        )
        cursor = conn.cursor(MySQLdb.cursors.DictCursor)
        
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
