from flask import Blueprint, request, jsonify, make_response
from decorators import jwt_required
import jwt
import datetime
import bcrypt
import globals
import secrets
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from marshmallow import Schema, fields, validate # type: ignore

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

auth_bp = Blueprint('auth_bp', __name__)

blacklist = globals.db.blacklist
users = globals.db.users
refresh_tokens = globals.db.refresh_tokens
SECRET_KEY = globals.SECRET_KEY

# Generate a refresh token
def generate_refresh_token(username):
    # Generate a secure random token
    token = secrets.token_hex(64)

    # Hash the token before storing it
    hashed_token = bcrypt.hashpw(token.encode('utf-8'), bcrypt.gensalt())

    # Set expiration (30 days from now)
    expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)

    # Current time for created_at and last_activity
    current_time = datetime.datetime.now(datetime.timezone.utc)

    # Store the hashed token in the database with last_activity field
    refresh_tokens.insert_one({
        'username': username,
        'token': hashed_token,
        'expires_at': expiration,
        'created_at': current_time,
        'last_activity': current_time  # Track when the token was last used
    })

    return token

class LoginSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    password = fields.Str(required=True, validate=validate.Length(min=8))

# User Registration
@auth_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    role = data.get("role", "buyer")  # Default role is "buyer"

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    if users.find_one({"username": username}):
        return jsonify({"error": "User already exists"}), 400

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    users.insert_one({"username": username, "password": hashed_pw, "role": role})
    return jsonify({"message": "User registered successfully"}), 201

# User Login
@auth_bp.route('/auth/login', methods=['GET'])
@limiter.limit("10 per minute")  # Prevent brute force attacks
def login():
    # Get authorization headers
    auth = request.authorization

    # Ensure authentication headers are provided
    if not auth or not auth.username or not auth.password:
        print("Missing authentication credentials")
        return make_response(jsonify({'message': 'Missing authentication credentials'}), 401)

    # Validate credentials format
    schema = LoginSchema()
    errors = schema.validate({"username": auth.username, "password": auth.password})
    if errors:
        print(f"Validation errors: {errors}")
        return jsonify({"errors": errors}), 400

    print("Authorization:", auth)

    print(f"Attempting login for user: {auth.username}")

    # Find user in the database
    user = users.find_one({'username': auth.username})
    if not user:
        print(f"User not found: {auth.username}")
        return make_response(jsonify({'error': 'User not found'}), 404)

    print(f"User found: {user['username']}, role: {user['role']}")

    # Verify password
    try:
        password_matches = bcrypt.checkpw(auth.password.encode('utf-8'), user['password'])
        print(f"Password check result: {password_matches}")

        if not password_matches:
            print("Invalid password")
            return make_response(jsonify({'message': 'Invalid password'}), 401)
    except Exception as e:
        print(f"Error checking password: {str(e)}")
        return make_response(jsonify({'message': 'Error verifying password'}), 500)

    # Generate JWT token
    try:
        print(f"Attempting to generate token for {auth.username}")
        print(f"User role: {user['role']}")
        print(f"SECRET_KEY type: {type(globals.SECRET_KEY)}, value: {globals.SECRET_KEY}")

        payload = {
            'user': auth.username,
            'role': user['role'],
            'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=4)  # Token valid for 4 hours
        }
        print(f"Token payload: {payload}")

        token = jwt.encode(payload, globals.SECRET_KEY, algorithm='HS256')
        print(f"Token type: {type(token)}")
        print(f"Generated token for {auth.username}: {token[:20]}...")

        # Convert bytes to string if needed
        if isinstance(token, bytes):
            token = token.decode('utf-8')
            print("Converted token from bytes to string")

        # Generate a refresh token
        refresh_token = generate_refresh_token(auth.username)

        return make_response(jsonify({
            'token': token,
            'refreshToken': refresh_token
        }), 200)
    except Exception as e:
        import traceback
        print(f"Error generating token: {str(e)}")
        print(traceback.format_exc())
        return make_response(jsonify({'message': f'Error generating token: {str(e)}'}), 500)


# Get User Profile
@auth_bp.route('/auth/profile', methods=['GET'])
@limiter.limit("300 per minute")  # Increased from 60 to 300 per minute
@jwt_required
def profile(current_user):
    # Add a timestamp to prevent caching
    timestamp = datetime.datetime.now(datetime.timezone.utc).timestamp()

    # Add a unique request ID to ensure uniqueness
    request_id = secrets.token_hex(8)

    # Create response with user data and anti-caching measures
    response = jsonify({
        "username": current_user["username"],
        "role": current_user["role"],
        "timestamp": timestamp,
        "request_id": request_id
    })

    # Set headers to prevent caching
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    return response

# Change Password
@auth_bp.route('/auth/change-password', methods=['POST'])
@jwt_required
def change_password(current_user):
    data = request.json

    # Validate request data
    if not data or 'current_password' not in data or 'new_password' not in data:
        return jsonify({"error": "Current password and new password are required"}), 400

    current_password = data.get('current_password')
    new_password = data.get('new_password')

    # Validate new password
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters long"}), 400

    # Get user from database
    user = users.find_one({"username": current_user["username"]})
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Verify current password
    try:
        password_matches = bcrypt.checkpw(current_password.encode('utf-8'), user['password'])
        if not password_matches:
            return jsonify({"error": "Current password is incorrect"}), 401
    except Exception as e:
        print(f"Error checking password: {str(e)}")
        return jsonify({"error": "Error verifying password"}), 500

    # Hash and update new password
    try:
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        update_result = users.update_one(
            {"username": current_user["username"]},
            {"$set": {"password": hashed_password}}
        )

        if update_result.modified_count == 0:
            return jsonify({"error": "Failed to update password"}), 500

        return jsonify({"message": "Password changed successfully"}), 200
    except Exception as e:
        print(f"Error updating password: {str(e)}")
        return jsonify({"error": "Error updating password"}), 500

# User Account Deletion
@auth_bp.route('/auth/delete', methods=['DELETE'])
@jwt_required
def delete_account(current_user):
    users.delete_one({"username": current_user["username"]})
    return jsonify({"message": "User account deleted"}), 200

# User Logout
@auth_bp.route('/auth/logout', methods=['GET'])
@jwt_required
def logout(current_user):
    token = request.headers.get('x-access-token')
    if not token:
        # Even if token is missing, proceed with logout
        print("Warning: Token missing during logout, proceeding anyway")
        token = "unknown-token"

    # Blacklist the access token if provided
    if token != "unknown-token":
        blacklist.insert_one({'token': token})

    # Invalidate all refresh tokens for this user
    refresh_tokens.update_many(
        {'username': current_user['username']},  # Invalidate ALL tokens, not just unexpired ones
        {'$set': {'expires_at': datetime.datetime.now(datetime.timezone.utc)}}
    )

    # Create a response
    response = make_response(jsonify({'message': 'Logged out successfully'}), 200)

    # Clear all possible auth-related cookies
    cookies_to_clear = [
        'refresh_token',
        'access_token',
        'auth0_token',
        'XSRF-TOKEN',
        'auth0.is.authenticated'
    ]

    for cookie_name in cookies_to_clear:
        # Clear with multiple domain/path combinations to ensure complete removal
        response.delete_cookie(cookie_name)
        response.delete_cookie(cookie_name, path='/')
        response.delete_cookie(cookie_name, domain=request.host.split(':')[0])
        response.delete_cookie(cookie_name, path='/', domain=request.host.split(':')[0])

    print(f"User {current_user['username']} logged out successfully")
    return response



