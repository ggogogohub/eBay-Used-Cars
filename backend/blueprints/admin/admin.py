from flask import Blueprint, request, jsonify, make_response
from bson.objectid import ObjectId
from decorators import admin_required
import globals
from utils import convert_object_ids


admin_bp = Blueprint('admin_bp', __name__)

# Use the existing MongoDB connection from globals
listings = globals.db.listings
users = globals.db.users

# Retrieve all reported or sold listings (excluding active listings)
@admin_bp.route('/admin/listings', methods=['GET'])
@admin_required
def get_reported_listings(current_user):
    # Query to retrieve all listings except active ones
    query = {"status": {"$in": ["reported", "sold"]}}

    # Filter by seller ID if provided
    seller_id = request.args.get("seller_id")
    if seller_id:
        query["user_id"] = seller_id

    # Fetch listings from MongoDB
    results = list(listings.find(query, {
        "vehicle_model": 1,
        "price": 1,
        "status": 1,
        "user_id": 1  # Include seller reference
    }))

    results = convert_object_ids(results)

    # Get usernames for all user IDs
    user_ids = [result.get("user_id") for result in results if "user_id" in result]
    user_map = {}
    if user_ids:
        user_records = list(users.find({"_id": {"$in": [ObjectId(uid) for uid in user_ids if uid]}}, {"_id": 1, "username": 1}))
        for user in user_records:
            user_map[str(user["_id"])] = user["username"]

    # Add seller username to each listing
    for result in results:
        user_id = result.pop("user_id", "Unknown")
        result["seller"] = user_map.get(user_id, "Unknown User")

    return make_response(jsonify(results), 200)


# Remove a specific reported or inactive listing by ID
@admin_bp.route('/admin/listings/<id>', methods=['DELETE'])
@admin_required
def delete_listing(current_user, id):
    try:
        # Check if the listing exists
        listing = listings.find_one({"_id": ObjectId(id)})
        if not listing:
            return make_response(jsonify({"error": "Listing not found"}), 404)

        # Ensure listing is either "reported" or "inactive" (sold)
        if listing["status"] not in ["reported", "sold"]:
            return make_response(jsonify({"error": "Only reported or inactive listings can be deleted"}), 403)

        # Delete the listing
        delete_result = listings.delete_one({"_id": ObjectId(id)})
        if delete_result.deleted_count == 0:
            return make_response(jsonify({"error": "Failed to delete listing"}), 500)

        return make_response(jsonify({"message": "Listing deleted successfully"}), 200)

    except Exception as e:
        return make_response(jsonify({"error": "Invalid listing ID", "details": str(e)}), 400)


# Retrieve all users
@admin_bp.route('/admin/users', methods=['GET'])
@admin_required
def get_users(current_user):
    user_list = list(users.find({}, {
        "_id": 1,
        "username": 1,
        "role": 1
    }))

    user_list = convert_object_ids(user_list)

    return make_response(jsonify(user_list), 200)

# Delete a user account
@admin_bp.route('/admin/users/<id>', methods=['DELETE'])
@admin_required
def delete_user(current_user, id):
    try:
        delete_result = users.delete_one({"_id": ObjectId(id)})
        if delete_result.deleted_count == 0:
            return make_response(jsonify({"error": "User not found"}), 404)

        return make_response(jsonify({"message": "User deleted"}), 200)
    except Exception as e:
        return make_response(jsonify({"error": "Invalid user ID", "details": str(e)}), 400)

# Update user role (e.g., promote to admin)
@admin_bp.route('/admin/users/<id>/role', methods=['PUT'])
@admin_required
def update_user_role(current_user, id):
    data = request.json
    new_role = data.get("role")

    if not new_role or new_role not in ["buyer", "seller", "admin"]:
        return make_response(jsonify({"error": "Invalid role"}), 400)

    try:
        update_result = users.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"role": new_role}}
        )

        if update_result.modified_count == 0:
            return make_response(jsonify({"error": "User not found or no changes made"}), 404)

        return make_response(jsonify({"message": "User role updated"}), 200)
    except Exception as e:
        return make_response(jsonify({"error": "Invalid user ID", "details": str(e)}), 400)