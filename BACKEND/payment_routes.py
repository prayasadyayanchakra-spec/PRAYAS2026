from flask import Blueprint, request, jsonify
import MySQLdb
import os
import uuid

bp = Blueprint('payments', __name__, url_prefix='/api/payments')

@bp.route('', methods=['GET'])
def get_payments():
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
        
        conn = MySQLdb.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            passwd=os.getenv('MYSQL_PASSWORD', ''),
            db=os.getenv('MYSQL_DB', 'prayas2026')
        )
        cursor = conn.cursor()
        
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
        conn = MySQLdb.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            passwd=os.getenv('MYSQL_PASSWORD', ''),
            db=os.getenv('MYSQL_DB', 'prayas2026')
        )
        cursor = conn.cursor(MySQLdb.cursors.DictCursor)
        
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
