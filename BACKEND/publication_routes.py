from flask import Blueprint, request, jsonify
import MySQLdb
import os

bp = Blueprint('publications', __name__, url_prefix='/api/publications')

@bp.route('', methods=['GET'])
def get_publications():
    try:
        conn = MySQLdb.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            passwd=os.getenv('MYSQL_PASSWORD', ''),
            db=os.getenv('MYSQL_DB', 'prayas2026')
        )
        cursor = conn.cursor(MySQLdb.cursors.DictCursor)
        
        cursor.execute("""
            SELECT id, title, author, category, abstract, image_url as image, 
                   image_url as imageUrl, status
            FROM publication
            WHERE status = 'approved'
        """)
        
        pubs = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(pubs), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:pub_id>/approve', methods=['POST'])
def approve_publication(pub_id):
    try:
        conn = MySQLdb.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            passwd=os.getenv('MYSQL_PASSWORD', ''),
            db=os.getenv('MYSQL_DB', 'prayas2026')
        )
        cursor = conn.cursor()
        
        cursor.execute("UPDATE publication SET status = %s WHERE id = %s", ('approved', pub_id))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:pub_id>/reject', methods=['POST'])
def reject_publication(pub_id):
    try:
        conn = MySQLdb.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            passwd=os.getenv('MYSQL_PASSWORD', ''),
            db=os.getenv('MYSQL_DB', 'prayas2026')
        )
        cursor = conn.cursor()
        
        cursor.execute("UPDATE publication SET status = %s WHERE id = %s", ('rejected', pub_id))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
