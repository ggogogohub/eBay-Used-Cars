from flask import Blueprint, request, jsonify, make_response
import secrets
import globals
from decorators import jwt_required

csrf_bp = Blueprint('csrf_bp', __name__)

# Use the existing MongoDB connection from globals
csrf_tokens = globals.db.csrf_tokens

# Generate a CSRF token
@csrf_bp.route('/auth/csrf-token', methods=['GET'])
@jwt_required
def get_csrf_token(current_user):
    # Generate a secure random token
    token = secrets.token_hex(32)
    
    # Store the token in the database with the user's ID
    csrf_tokens.insert_one({
        'username': current_user['username'],
        'token': token,
        'created_at': globals.datetime.now(globals.datetime.timezone.utc)
    })
    
    # Create a response
    response = make_response(jsonify({'csrfToken': token}), 200)
    
    # Set the CSRF token as a cookie
    response.set_cookie(
        'XSRF-TOKEN',
        token,
        httponly=False,  # Must be accessible to JavaScript
        secure=True,     # Only send over HTTPS
        samesite='Strict',
        max_age=3600     # 1 hour
    )
    
    return response

# Validate CSRF token
def validate_csrf_token(username, token):
    # Find the token in the database
    stored_token = csrf_tokens.find_one({
        'username': username,
        'token': token
    })
    
    if not stored_token:
        return False
    
    # Check if the token is not too old (e.g., 1 hour)
    token_age = globals.datetime.now(globals.datetime.timezone.utc) - stored_token['created_at']
    if token_age.total_seconds() > 3600:  # 1 hour
        # Remove expired token
        csrf_tokens.delete_one({'_id': stored_token['_id']})
        return False
    
    return True

# CSRF protection middleware
def csrf_protect(f):
    def decorated_function(*args, **kwargs):
        # Skip CSRF protection for GET, HEAD, OPTIONS, TRACE requests
        if request.method in ['GET', 'HEAD', 'OPTIONS', 'TRACE']:
            return f(*args, **kwargs)
        
        # Get the CSRF token from the request
        token = request.headers.get('X-CSRF-TOKEN') or request.form.get('_csrf_token')
        
        if not token:
            return jsonify({'error': 'CSRF token missing'}), 403
        
        # Get the current user
        current_user = kwargs.get('current_user')
        if not current_user:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Validate the CSRF token
        if not validate_csrf_token(current_user['username'], token):
            return jsonify({'error': 'Invalid CSRF token'}), 403
        
        return f(*args, **kwargs)
    
    return decorated_function
