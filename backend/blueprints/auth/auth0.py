from flask import Blueprint, request, jsonify, make_response
import jwt
import datetime
import bcrypt
import globals
import secrets
from decorators import jwt_required
import json

auth0_bp = Blueprint('auth0_bp', __name__)

users = globals.db.users
refresh_tokens = globals.db.refresh_tokens
SECRET_KEY = globals.SECRET_KEY

# Generate a refresh token
def generate_refresh_token(username):
    # Generate a secure random token
    token = secrets.token_hex(64)

    # Hash the token before storing it
    hashed_token = bcrypt.hashpw(token.encode('utf-8'), bcrypt.gensalt())

    # Set expiration (30 days)
    expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)

    # Store the hashed token in the database
    refresh_tokens.insert_one({
        'username': username,
        'token': hashed_token,
        'expires_at': expiration,
        'created_at': datetime.datetime.now(datetime.timezone.utc)
    })

    return token

# Check if a user exists by email
@auth0_bp.route('/auth/check-user/<email>', methods=['GET'])
def check_user(email):
    user = users.find_one({"username": email})
    return jsonify({"exists": user is not None}), 200

# Login with Auth0
@auth0_bp.route('/auth/login-auth0', methods=['POST'])
def login_auth0():
    data = request.json
    auth0_id = data.get('auth0_id')

    if not auth0_id:
        return jsonify({"error": "Auth0 ID is required"}), 400

    # Find user by Auth0 ID
    user = users.find_one({"auth0_id": auth0_id})
    if not user:
        # If user doesn't exist, create a new one
        email = data.get('email')
        name = data.get('name')

        if not email:
            return jsonify({"error": "Email is required"}), 400

        # Check if user exists with this email
        existing_user = users.find_one({"username": email})
        if existing_user:
            # Update existing user with Auth0 ID
            users.update_one(
                {"username": email},
                {"$set": {"auth0_id": auth0_id}}
            )
            user = users.find_one({"username": email})
        else:
            # Create new user
            new_user = {
                "username": email,
                "email": email,
                "name": name,
                "auth0_id": auth0_id,
                "role": "buyer",  # Default role
                "password": bcrypt.hashpw(str(datetime.datetime.now()).encode('utf-8'), bcrypt.gensalt())
            }
            users.insert_one(new_user)
            user = users.find_one({"auth0_id": auth0_id})

        if not user:
            return jsonify({"error": "Failed to create or find user"}), 500

    # Generate JWT token
    try:
        payload = {
            'user': user['username'],
            'role': user.get('role', 'buyer'),
            'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
        }

        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

        # Convert bytes to string if needed
        if isinstance(token, bytes):
            token = token.decode('utf-8')

        # Generate a refresh token
        refresh_token = generate_refresh_token(user['username'])

        # Create a response
        response = make_response(jsonify({
            "token": token,
            "refreshToken": refresh_token
        }), 200)

        # Set the refresh token as an HTTP-only cookie
        response.set_cookie(
            'refresh_token',
            refresh_token,
            httponly=True,
            secure=True,  # Only send over HTTPS
            samesite='Strict',
            max_age=30 * 24 * 60 * 60  # 30 days
        )

        return response
    except Exception as e:
        return jsonify({"error": f"Error generating token: {str(e)}"}), 500
