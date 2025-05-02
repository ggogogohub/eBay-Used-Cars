from flask import Blueprint, request, jsonify, make_response
import cloudinary
import cloudinary.uploader
import cloudinary.api
from decorators import jwt_required
import os
import globals

# Initialize Blueprint
upload_bp = Blueprint('upload', __name__)

# Configure Cloudinary
cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
api_key = os.environ.get('CLOUDINARY_API_KEY')
api_secret = os.environ.get('CLOUDINARY_API_SECRET')

# Check if Cloudinary credentials are set
if not cloud_name or not api_key or not api_secret:
    print("WARNING: Cloudinary credentials not set in environment variables. Image upload functionality will not work.")
else:
    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret
    )

# Upload a single image
@upload_bp.route('/upload/image', methods=['POST'])
@jwt_required
def upload_image(current_user):
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file,
            folder=f"ebay_used_cars/{current_user['username']}",
            resource_type="auto"
        )

        # Return the Cloudinary URL and public_id
        return jsonify({
            "url": upload_result['secure_url'],
            "public_id": upload_result['public_id']
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Upload multiple images
@upload_bp.route('/upload/images', methods=['POST'])
@jwt_required
def upload_multiple_images(current_user):
    if 'files' not in request.files:
        return jsonify({"error": "No files part"}), 400

    files = request.files.getlist('files')

    if len(files) == 0 or files[0].filename == '':
        return jsonify({"error": "No selected files"}), 400

    try:
        upload_results = []

        for file in files:
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                file,
                folder=f"ebay_used_cars/{current_user['username']}",
                resource_type="auto"
            )

            upload_results.append({
                "url": upload_result['secure_url'],
                "public_id": upload_result['public_id']
            })

        # Return all Cloudinary URLs and public_ids
        return jsonify({
            "images": upload_results
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
