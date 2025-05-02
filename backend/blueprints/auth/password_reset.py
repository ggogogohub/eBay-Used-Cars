from flask import Blueprint, request, jsonify
import secrets
import globals
from bson.objectid import ObjectId
from .email_service import send_password_reset_email
from utils import convert_object_ids
import bcrypt
from datetime import datetime, timedelta

# Initialize Blueprint
password_reset_bp = Blueprint('password_reset_bp', __name__)

# Use the existing MongoDB connection from globals
users = globals.db.users
reset_tokens = globals.db.reset_tokens

# Request password reset
@password_reset_bp.route('/auth/request-password-reset', methods=['POST'])
def request_password_reset():
    data = request.json

    if not data or 'email' not in data:
        return jsonify({"error": "Email is required"}), 400

    email = data['email'].lower().strip()

    # Find user by email
    user = users.find_one({"email": email})
    if not user:
        # For security reasons, don't reveal that the email doesn't exist
        # Just return success even though no email will be sent
        return jsonify({"message": "If your email is registered, you will receive a password reset link"}), 200

    # Generate a secure token
    token = secrets.token_urlsafe(32)

    # Set expiration time (1 hour from now)
    expiration = datetime.now() + timedelta(hours=1)

    # Store token in database
    reset_tokens.insert_one({
        "user_id": str(user["_id"]),
        "token": token,
        "expiration": expiration
    })

    # Send email with reset token
    try:
        email_sent = send_password_reset_email(email, token, user["username"])

        if email_sent:
            print(f"Password reset email sent successfully to {email}")
        else:
            print(f"Failed to send password reset email to {email}")
            # Log the error but don't expose it to the user for security reasons
    except Exception as e:
        print(f"Exception in request_password_reset: {str(e)}")
        # Log the error but don't expose it to the user for security reasons

    # Always return success for security reasons (don't reveal if email exists)
    return jsonify({"message": "If your email is registered, you will receive a password reset link"}), 200

# Verify reset token
@password_reset_bp.route('/auth/verify-reset-token', methods=['POST'])
def verify_reset_token():
    data = request.json

    if not data or 'token' not in data:
        return jsonify({"error": "Token is required"}), 400

    token = data['token']

    # Find token in database
    token_record = reset_tokens.find_one({
        "token": token,
        "expiration": {"$gt": datetime.now()}
    })

    if not token_record:
        return jsonify({"error": "Invalid or expired token"}), 400

    # Convert ObjectId to string
    token_record = convert_object_ids(token_record)

    # Token is valid
    return jsonify({"valid": True}), 200

# Reset password with token
@password_reset_bp.route('/auth/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.json

        if not data or 'token' not in data or 'password' not in data:
            return jsonify({"error": "Token and password are required"}), 400

        token = data['token']
        password = data['password']

        # Validate password
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters long"}), 400

        # Find token in database
        token_record = reset_tokens.find_one({
            "token": token,
            "expiration": {"$gt": datetime.now()}
        })

        if not token_record:
            return jsonify({"error": "Invalid or expired token"}), 400

        # Convert ObjectId to string
        token_record = convert_object_ids(token_record)

        # Get user ID from token
        user_id = token_record["user_id"]

        # Print debug info
        print(f"Resetting password for user_id: {user_id}")

        # Update user's password using bcrypt (consistent with auth.py)
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        update_result = users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password": hashed_password}}
        )

        print(f"Update result: {update_result.modified_count} document(s) modified")

        if update_result.modified_count == 0:
            # Check if user exists
            user = users.find_one({"_id": ObjectId(user_id)})
            if not user:
                print(f"User with ID {user_id} not found")
                return jsonify({"error": "User not found"}), 404
            else:
                print(f"User exists but password was not updated")
                return jsonify({"error": "Failed to update password"}), 500

        # Delete all reset tokens for this user
        delete_result = reset_tokens.delete_many({"user_id": user_id})
        print(f"Deleted {delete_result.deleted_count} token(s) for user {user_id}")

        return jsonify({"message": "Password reset successful"}), 200
    except Exception as e:
        print(f"Error in reset_password: {str(e)}")
        return jsonify({"error": "An error occurred while resetting your password"}), 500
