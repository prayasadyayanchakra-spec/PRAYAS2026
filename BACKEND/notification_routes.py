from flask import Blueprint, request, jsonify
import MySQLdb
import os

bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@bp.route('', methods=['GET'])
def get_notifications():
    try:
        conn = MySQLdb.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            passwd=os.getenv('MYSQL_PASSWORD', ''),
            db=os.getenv('MYSQL_DB', 'prayas2026')
        )
        cursor = conn.cursor(MySQLdb.cursors.DictCursor)
        
        cursor.execute("""
            SELECT id, date, link
            FROM notification
            ORDER BY date DESC
        """)
        
        notifs = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(notifs), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
def create_notification():
    data = request.get_json()
    
    required_fields = ['date', 'link']
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
            INSERT INTO notification (date, link)
            VALUES (%s, %s)
        """, (data['date'], data['link']))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:notif_id>', methods=['DELETE'])
def delete_notification(notif_id):
    try:
        conn = MySQLdb.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            passwd=os.getenv('MYSQL_PASSWORD', ''),
            db=os.getenv('MYSQL_DB', 'prayas2026')
        )
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM notification WHERE id = %s", (notif_id,))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
