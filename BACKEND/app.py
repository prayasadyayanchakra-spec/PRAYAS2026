from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_mysqldb import MySQL
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import os
from datetime import datetime, timedelta
import MySQLdb

app = Flask(__name__)
CORS(app)

# Configuration
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', '')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'prayas2026')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')

mysql = MySQL(app)

# Import routes
from routes import auth_routes, student_routes, payment_routes, fee_routes, book_routes, publication_routes, ranker_routes, notification_routes

# Register blueprints
app.register_blueprint(auth_routes.bp)
app.register_blueprint(student_routes.bp)
app.register_blueprint(payment_routes.bp)
app.register_blueprint(fee_routes.bp)
app.register_blueprint(book_routes.bp)
app.register_blueprint(publication_routes.bp)
app.register_blueprint(ranker_routes.bp)
app.register_blueprint(notification_routes.bp)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'PRAYAS2026 Backend is running'}), 200

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
