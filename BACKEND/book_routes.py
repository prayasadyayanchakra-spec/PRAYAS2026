from flask import Blueprint, request, jsonify
import MySQLdb
import os

bp = Blueprint('books', __name__, url_prefix='/api/books')

@bp.route('', methods=['GET'])
def get_books():
    try:
        conn = MySQLdb.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            passwd=os.getenv('MYSQL_PASSWORD', ''),
            db=os.getenv('MYSQL_DB', 'prayas2026')
        )
        cursor = conn.cursor(MySQLdb.cursors.DictCursor)
        
        cursor.execute("""
            SELECT id, title, author, price, available, cover_image_url as coverImage,
                   pdf_url_link as pdfUrl, description, category
            FROM bookstore
        """)
        
        books = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(books), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
def create_book():
    data = request.get_json()
    
    required_fields = ['title', 'author', 'price', 'category']
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
            INSERT INTO bookstore (title, author, price, category, available, cover_image_url, pdf_url_link, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (data['title'], data['author'], data['price'], data['category'],
              data.get('available', 1), data.get('coverImage', ''),
              data.get('pdfUrl', ''), data.get('description', '')))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    data = request.get_json()
    
    try:
        conn = MySQLdb.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            passwd=os.getenv('MYSQL_PASSWORD', ''),
            db=os.getenv('MYSQL_DB', 'prayas2026')
        )
        cursor = conn.cursor()
        
        update_query = "UPDATE bookstore SET "
        params = []
        updates = []
        
        if 'price' in data:
            updates.append("price = %s")
            params.append(data['price'])
        if 'available' in data:
            updates.append("available = %s")
            params.append(data['available'])
        
        if updates:
            update_query += ", ".join(updates) + " WHERE id = %s"
            params.append(book_id)
            
            cursor.execute(update_query, params)
            conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
