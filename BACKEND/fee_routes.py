from flask import Blueprint, request, jsonify
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

load_dotenv()

bp = Blueprint('fees', __name__, url_prefix='/api/fee-structure')

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
def get_fee_structure():
    school = request.args.get('school')
    fee_class = request.args.get('class')
    fee_type = request.args.get('type')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        query = "SELECT * FROM fee_structure WHERE 1=1"
        params = []
        
        if school:
            query += " AND school_name = %s"
            params.append(school)
        
        if fee_class:
            query += " AND class = %s"
            params.append(fee_class)
        
        if fee_type:
            query += " AND fee_type = %s"
            params.append(fee_type)
        
        cursor.execute(query, params)
        fees = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(fees), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
def create_fee_structure():
    data = request.get_json()
    
    required_fields = ['class', 'schoolName', 'feeType', 'amount']
    if not data or not all(k in data for k in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cursor.execute("""
            INSERT INTO fee_structure (class, school_name, fee_type, amount)
            VALUES (%s, %s, %s, %s)
        """, (data['class'], data['schoolName'], data['feeType'], data['amount']))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:fee_id>', methods=['PUT'])
def update_fee_structure(fee_id):
    data = request.get_json()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        update_query = "UPDATE fee_structure SET "
        params = []
        
        if 'amount' in data:
            update_query += "amount = %s"
            params.append(data['amount'])
        
        update_query += " WHERE id = %s"
        params.append(fee_id)
        
        cursor.execute(update_query, params)
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
