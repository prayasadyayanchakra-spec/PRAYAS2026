from flask import Blueprint, request, jsonify
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

load_dotenv()

bp = Blueprint('publications', __name__, url_prefix='/api/publications')

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
def get_publications():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
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
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
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
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cursor.execute("UPDATE publication SET status = %s WHERE id = %s", ('rejected', pub_id))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
