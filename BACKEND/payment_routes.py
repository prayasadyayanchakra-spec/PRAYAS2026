from flask import Blueprint, request, jsonify
import psycopg2
import psycopg2.extras
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

bp = Blueprint('payments', __name__, url_prefix='/api/payments')

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
def get_payments():
    school = request.args.get('school')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        if school:
            cursor.execute("""
                SELECT * FROM payment_receipts 
                WHERE school_name = %s
            """, (school,))
        else:
            cursor.execute("SELECT * FROM payment_receipts")
        
        payments = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(payments), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
def create_payment():
    data = request.get_json()
    
    required_fields = ['userId', 'name', 'fatherName', 'feeType', 'amount', 'class']
    if not data or not all(k in data for k in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        payment_id = str(uuid.uuid4())
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cursor.execute("""
            INSERT INTO payment_receipts 
            (payment_id, user_id, name, father_name, fee_type, amount, class, date_created)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
        """, (payment_id, data['userId'], data['name'], data['fatherName'], 
              data['feeType'], data['amount'], data['class']))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'paymentId': payment_id}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:payment_id>', methods=['GET'])
def get_payment(payment_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cursor.execute("SELECT * FROM payment_receipts WHERE id = %s", (payment_id,))
        payment = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if payment:
            return jsonify(payment), 200
        else:
            return jsonify({'error': 'Payment not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
