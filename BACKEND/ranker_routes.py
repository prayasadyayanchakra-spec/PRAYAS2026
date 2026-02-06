from flask import Blueprint, request, jsonify
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

load_dotenv()

bp = Blueprint('rankers', __name__, url_prefix='/api/rankers')

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
def get_rankers():
    year = request.args.get('year')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        if year:
            cursor.execute("""
                SELECT id, name, school_name as schoolName, rank, class, year, image
                FROM rankers
                WHERE year = %s
                ORDER BY rank ASC
            """, (year,))
        else:
            cursor.execute("""
                SELECT id, name, school_name as schoolName, rank, class, year, image
                FROM rankers
                ORDER BY rank ASC
            """)
        
        rankers = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(rankers), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
def create_ranker():
    data = request.get_json()
    
    required_fields = ['name', 'schoolName', 'rank', 'class', 'year']
    if not data or not all(k in data for k in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cursor.execute("""
            INSERT INTO rankers (name, school_name, rank, class, year, image)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (data['name'], data['schoolName'], data['rank'], data['class'], 
              data['year'], data.get('image', '')))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:ranker_id>', methods=['PUT'])
def update_ranker(ranker_id):
    data = request.get_json()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        update_query = "UPDATE rankers SET "
        params = []
        updates = []
        
        if 'rank' in data:
            updates.append("rank = %s")
            params.append(data['rank'])
        if 'image' in data:
            updates.append("image = %s")
            params.append(data['image'])
        
        if updates:
            update_query += ", ".join(updates) + " WHERE id = %s"
            params.append(ranker_id)
            
            cursor.execute(update_query, params)
            conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
