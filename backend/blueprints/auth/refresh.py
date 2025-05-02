from flask import Blueprint, request, jsonify, make_response
import jwt
import datetime
import globals
from decorators import jwt_required
import secrets

refresh_bp = Blueprint('refresh_bp', __name__)

# Use the existing MongoDB connection from globals
users = globals.db.users
refresh_tokens = globals.db.refresh_tokens
SECRET_KEY = globals.SECRET_KEY

# Generate a refresh token
def generate_refresh_token(username):
    # Generate a secure random token
    token = secrets.token_hex(64)

    # Generate a token ID (used for lookup)
    token_id = secrets.token_hex(16)

    # Set expiration (30 days from now)
    expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)

    # Current time for created_at and last_activity
    current_time = datetime.datetime.now(datetime.timezone.utc)

    # Store the token information in the database
    refresh_tokens.insert_one({
        'username': username,
        'token_id': token_id,  # Store token ID for lookup
        'expires_at': expiration,
        'created_at': current_time,
        'last_activity': current_time  # Track when the token was last used
    })

    # Return the combined token (token_id:actual_token)
    # This way we can easily extract the token_id for lookup
    return f"{token_id}:{token}"

# Verify a refresh token
def verify_refresh_token(username, token):
    print(f"Verifying refresh token for user: {username}")
    current_time = datetime.datetime.now(datetime.timezone.utc)

    try:
        # Parse the token to extract the token_id
        # Expected format: token_id:actual_token
        if ':' not in token:
            print("Token format is invalid (no token_id separator found)")
            return False

        token_parts = token.split(':', 1)
        if len(token_parts) != 2:
            print("Token format is invalid (incorrect number of parts)")
            return False

        token_id = token_parts[0]
        print(f"Extracted token_id: {token_id}")

        # Find the refresh token in the database using token_id
        # First try with username and token_id
        stored_token = refresh_tokens.find_one({
            'username': username,
            'token_id': token_id,
            'expires_at': {'$gt': current_time}
        })

        # If not found, try with just token_id (in case username was changed)
        if not stored_token:
            print(f"Token not found for user {username}, trying with token_id only")
            stored_token = refresh_tokens.find_one({
                'token_id': token_id,
                'expires_at': {'$gt': current_time}
            })

        if not stored_token:
            print(f"No valid token found for user {username} with token_id {token_id}")
            return False

        print(f"Found valid token in database with ID {token_id}")

        # Check if token has been inactive for more than 30 days
        last_activity = stored_token.get('last_activity', stored_token['created_at'])

        # Ensure both datetime objects have timezone information
        if last_activity.tzinfo is None:
            # Convert naive datetime to aware datetime with UTC timezone
            last_activity = last_activity.replace(tzinfo=datetime.timezone.utc)

        inactivity_period = current_time - last_activity
        print(f"Token last activity: {last_activity}, inactivity period: {inactivity_period.days} days")

        # If inactive for more than 30 days, invalidate the token
        if inactivity_period.days > 30:
            print(f"Token inactive for more than 30 days, invalidating")
            # Ensure we use timezone-aware datetime
            current_time_utc = datetime.datetime.now(datetime.timezone.utc)
            refresh_tokens.update_one(
                {'_id': stored_token['_id']},
                {'$set': {'expires_at': current_time_utc}}  # Expire the token
            )
            return False

        # Update the last_activity timestamp and extend expiration (sliding window)
        # Ensure we use timezone-aware datetime
        current_time_utc = datetime.datetime.now(datetime.timezone.utc)
        new_expiration = current_time_utc + datetime.timedelta(days=30)
        print(f"Updating token last_activity and extending expiration to {new_expiration}")
        refresh_tokens.update_one(
            {'_id': stored_token['_id']},
            {
                '$set': {
                    'last_activity': current_time_utc,
                    'expires_at': new_expiration  # Extend expiration by 30 days from now
                }
            }
        )

        return True
    except Exception as e:
        print(f"Exception in verify_refresh_token: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

# Refresh token endpoint
@refresh_bp.route('/auth/refresh-token', methods=['POST'])
def refresh_token():
    print("Refresh token endpoint called")
    data = request.json

    if not data:
        print("No JSON data in request")
        return jsonify({'error': 'No data provided in request'}), 400

    refresh_token = data.get('refreshToken')
    print(f"Request data: {data.keys()}")

    if not refresh_token:
        print("No refresh token in request")
        return jsonify({'error': 'Refresh token is required'}), 400

    print(f"Refresh token received (first 10 chars): {refresh_token[:10]}...")

    # Extract username from the refresh token
    try:
        # Parse the token to extract the token_id
        # Expected format: token_id:actual_token
        if ':' not in refresh_token:
            print("Legacy token format detected - handling gracefully")
            # This is likely a legacy token from before our format change
            # Generate a new token in the correct format and return it

            # First, try to find the user from the request data
            username = data.get('username')

            if not username:
                # If no username provided, we can't handle the legacy token
                print("No username provided with legacy token")
                return jsonify({'error': 'For legacy tokens, username is required'}), 400

            print(f"Handling legacy token for user: {username}")

            # Check if this is a username mismatch issue
            # Try to find any valid refresh token for this user
            current_time = datetime.datetime.now(datetime.timezone.utc)
            existing_token = refresh_tokens.find_one({
                'username': username,
                'expires_at': {'$gt': current_time}
            })

            if existing_token:
                print(f"Found existing valid token for user {username}, using that instead")
                # Use the existing token
                new_refresh_token = f"{existing_token['token_id']}:{secrets.token_hex(32)}"

                # Update the token's last_activity
                refresh_tokens.update_one(
                    {'_id': existing_token['_id']},
                    {'$set': {'last_activity': current_time}}
                )
            else:
                # Generate a new refresh token in the correct format
                print(f"No existing token found for user {username}, generating new one")
                new_refresh_token = generate_refresh_token(username)

            # Generate a new access token
            user = users.find_one({'username': username})
            if not user:
                return jsonify({'error': 'User not found'}), 404

            payload = {
                'user': username,
                'role': user.get('role', 'buyer'),
                'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=4)
            }

            token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
            if isinstance(token, bytes):
                token = token.decode('utf-8')

            # Return the new tokens
            return jsonify({
                'token': token,
                'refreshToken': new_refresh_token,
                'message': 'Legacy token upgraded to new format'
            }), 200

        token_parts = refresh_token.split(':', 1)
        if len(token_parts) != 2:
            print("Token format is invalid (incorrect number of parts)")
            return jsonify({'error': 'Invalid refresh token format'}), 400

        token_id = token_parts[0]
        print(f"Extracted token_id: {token_id}")

        # Find the refresh token in the database using token_id
        current_time = datetime.datetime.now(datetime.timezone.utc)
        stored_token = refresh_tokens.find_one({
            'token_id': token_id,
            'expires_at': {'$gt': current_time}
        })

        if not stored_token:
            print(f"No valid token found with token_id {token_id}")
            return jsonify({'error': 'Invalid or expired refresh token'}), 401

        # Get the username from the stored token
        token_username = stored_token.get('username')
        if not token_username:
            print("Token found but no username associated with it")
            return jsonify({'error': 'Invalid token data'}), 401

        print(f"Found valid token for user: {token_username}")

        # If the username in the request doesn't match the token's username,
        # use the token's username instead
        if username != token_username:
            print(f"Username mismatch: request has {username}, token has {token_username}")
            print(f"Using token's username: {token_username}")
            username = token_username

        # Verify the refresh token's validity (checks expiration and updates last_activity)
        if not verify_refresh_token(username, refresh_token):
            return jsonify({'error': 'Invalid refresh token'}), 401

        # Get the user from the database
        user = users.find_one({'username': username})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Generate a new access token with 4-hour expiration
        payload = {
            'user': username,
            'role': user.get('role', 'buyer'),
            'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=4)
        }

        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

        # Convert bytes to string if needed
        if isinstance(token, bytes):
            token = token.decode('utf-8')

        # Generate a new refresh token
        new_refresh_token = generate_refresh_token(username)

        # Invalidate the old refresh token by token_id
        # Ensure we use timezone-aware datetime
        current_time = datetime.datetime.now(datetime.timezone.utc)
        refresh_tokens.update_one(
            {'token_id': token_id},
            {'$set': {'expires_at': current_time}}
        )

        return jsonify({
            'token': token,
            'refreshToken': new_refresh_token
        }), 200
    except Exception as e:
        print(f"Error in refresh_token endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error refreshing token: {str(e)}'}), 500

# Store refresh token in HTTP-only cookie
@refresh_bp.route('/auth/store-refresh-token', methods=['POST'])
@jwt_required
def store_refresh_token(current_user):
    # We use the current_user parameter to ensure the user is authenticated
    # but we don't need to use it directly in this function
    data = request.json
    refresh_token = data.get('refreshToken')

    if not refresh_token:
        return jsonify({'error': 'Refresh token is required'}), 400

    # Create a response
    response = make_response(jsonify({'message': 'Refresh token stored successfully'}), 200)

    # Set the refresh token as an HTTP-only cookie with extended expiration
    response.set_cookie(
        'refresh_token',
        refresh_token,
        httponly=True,
        secure=True,  # Only send over HTTPS
        samesite='Strict',
        max_age=365 * 24 * 60 * 60  # 1 year (will be controlled by server-side sliding expiration)
    )

    return response

# Clear refresh token cookie
@refresh_bp.route('/auth/clear-refresh-token', methods=['POST'])
def clear_refresh_token():
    # Create a response
    response = make_response(jsonify({'message': 'Refresh token cleared successfully'}), 200)

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

    print("All auth cookies cleared successfully")
    return response

# Get refresh token from cookie
@refresh_bp.route('/auth/get-refresh-token', methods=['GET'])
@jwt_required
def get_refresh_token(current_user):
    # We use the current_user parameter to ensure the user is authenticated
    # but we don't need to use it directly in this function
    # Get the refresh token from the cookie
    refresh_token = request.cookies.get('refresh_token')

    if not refresh_token:
        return jsonify({'error': 'No refresh token found'}), 404

    return jsonify({'refreshToken': refresh_token}), 200
