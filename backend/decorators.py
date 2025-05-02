from flask import request, jsonify, make_response
import jwt
import datetime
from functools import wraps
import globals

# Use the existing MongoDB connection from globals
blacklist = globals.db.blacklist
users = globals.db.users
SECRET_KEY = globals.SECRET_KEY  # Use SECRET_KEY from globals.py

# JWT token required decorator
def jwt_required(func):
    @wraps(func)
    def jwt_required_wrapper(*args, **kwargs):
        token = None

        # Check for token in headers
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']

        # If no token found, return error
        if not token:
            response = make_response(jsonify({'error': 'Token is missing'}), 401)
            # Set headers to prevent caching
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            return response

        try:
            # Decode token with strict validation
            data = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=['HS256'],
                options={
                    'verify_signature': True,
                    'verify_exp': True,
                    'require': ['exp', 'user', 'role']
                }
            )

            # Add additional timestamp check for extra security
            if 'exp' in data:
                current_time = datetime.datetime.now(datetime.timezone.utc).timestamp()
                if data['exp'] < current_time:
                    response = make_response(jsonify({'error': 'Token has expired'}), 401)
                    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
                    return response

        except jwt.ExpiredSignatureError:
            response = make_response(jsonify({'error': 'Token has expired'}), 401)
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            return response
        except jwt.InvalidTokenError:
            response = make_response(jsonify({'error': 'Token is invalid'}), 401)
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            return response

        # Check if token is blacklisted
        bl_token = blacklist.find_one({'token': token})
        if bl_token is not None:
            response = make_response(jsonify({'error': 'Token is blacklisted'}), 401)
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            return response

        # Get user from database
        current_user = users.find_one({'username': data['user']})
        if not current_user:
            response = make_response(jsonify({'error': 'User not found'}), 401)
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            return response

        # Verify that the role in the token matches the user's current role
        if data.get('role') != current_user.get('role'):
            response = make_response(jsonify({'error': 'Token role mismatch'}), 401)
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            return response

        # Add request timestamp to help prevent replay attacks
        request.token_timestamp = datetime.datetime.now(datetime.timezone.utc).timestamp()
        request.token_data = data

        return func(current_user, *args, **kwargs)  # Pass current_user to the wrapped function
    return jwt_required_wrapper

def admin_required(func):
    @wraps(func)
    def admin_required_wrapper(*args, **kwargs):
        token = None
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']
        if not token:
            response = make_response(jsonify({'error': 'Token is missing'}), 401)
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            return response

        try:
            # Decode token with strict validation
            data = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=['HS256'],
                options={
                    'verify_signature': True,
                    'verify_exp': True,
                    'verify_iat': True,
                    'require': ['exp', 'user', 'role']
                }
            )

            # Add additional timestamp check for extra security
            if 'exp' in data:
                current_time = datetime.datetime.now(datetime.timezone.utc).timestamp()
                if data['exp'] < current_time:
                    response = make_response(jsonify({'error': 'Token has expired'}), 401)
                    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
                    return response
        except jwt.ExpiredSignatureError:
            response = make_response(jsonify({'error': 'Token has expired'}), 401)
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            return response
        except jwt.InvalidTokenError:
            response = make_response(jsonify({'error': 'Token is invalid'}), 401)
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            return response

        # Check if token is blacklisted
        bl_token = blacklist.find_one({'token': token})
        if bl_token is not None:
            response = make_response(jsonify({'error': 'Token is blacklisted'}), 401)
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            return response

        # Get user from database
        current_user = users.find_one({'username': data['user']})
        if not current_user:
            response = make_response(jsonify({'error': 'User not found'}), 401)
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            return response

        # Check if user is admin
        if not current_user.get('role') == 'admin':
            response = make_response(jsonify({'error': 'Admin access required'}), 403)
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            return response

        # Add request timestamp to help prevent replay attacks
        request.token_timestamp = datetime.datetime.now(datetime.timezone.utc).timestamp()
        request.token_data = data

        return func(current_user, *args, **kwargs)
    return admin_required_wrapper
