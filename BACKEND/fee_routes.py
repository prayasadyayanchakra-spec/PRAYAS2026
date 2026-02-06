from flask import Blueprint, request, jsonify
import MySQLdb
import os

bp = Blueprint('fees', __name__, url_prefix='/api/fee-structure')

@bp.route('', methods=['GET'])
def get_fee_structure():
    school = request.args.get('school')
    fee_class = request.args.get('class')
    fee_type = request.args.get('type')
    
    try:
        conn = MySQLdb.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            passwd=os.getenv('MYSQL_PASSWORD', ''),
            db=os.getenv('MYSQL_DB', 'prayas2026')
        )
        cursor = conn.cursor(MySQLdb.cursors.DictCursor)
        
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
        conn = MySQLdb.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            passwd=os.getenv('MYSQL_PASSWORD', ''),
            db=os.getenv('MYSQL_DB', 'prayas2026')
        )
        cursor = conn.cursor()
        
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
        conn = MySQLdb.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            passwd=os.getenv('MYSQL_PASSWORD', ''),
            db=os.getenv('MYSQL_DB', 'prayas2026')
        )
        cursor = conn.cursor()
        
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
