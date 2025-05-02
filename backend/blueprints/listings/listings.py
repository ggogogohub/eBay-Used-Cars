from flask import Blueprint, request, jsonify, make_response
from bson.objectid import ObjectId
from decorators import jwt_required
import globals
from utils import convert_object_ids

# Initialize Blueprint
listings_bp = Blueprint('listings', __name__)

# Use the existing MongoDB connection from globals
listings_collection = globals.db.listings

# Create a new car listing
@listings_bp.route('/listings', methods=['POST'])
@jwt_required
def create_listing(current_user):
    data = request.json
    required_fields = ["vehicle_model", "price", "mileage", "location", "car_type", "listing_age"]

    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # Ensure "reviews" field exists; if not, initialize with an empty list
    if "reviews" not in data:
        data["reviews"] = []

    # Auto-generate views field with default value of 0
    data["views"] = 0

    # Associate listing with current user and set default status
    data["user_id"] = str(current_user["_id"])
    data["status"] = "active"

    # Handle images if provided
    if "images" not in data:
        data["images"] = []

    listing_id = listings_collection.insert_one(data).inserted_id
    return jsonify({"message": "Listing created", "listing_id": str(listing_id)}), 201

# GET Listings with Pagination
@listings_bp.route('/listings', methods=['GET'])
def get_listings():
    filters = {}
    # For numeric fields
    for key in ["price", "mileage"]:
        if key in request.args:
            try:
                filters[key] = float(request.args[key])
            except ValueError:
                filters[key] = request.args[key]
    # For string fields - use case-insensitive partial matching
    for key in ["vehicle_model", "location", "car_type"]:
        if key in request.args and request.args[key].strip():
            # Use regex for partial text matching with case insensitivity
            filters[key] = {"$regex": request.args[key], "$options": "i"}

    # Filter by user_id or username if provided
    if "user_id" in request.args:
        filters["user_id"] = request.args["user_id"]
    elif "username" in request.args:
        # Find the user by username to get their ID
        username = request.args["username"]
        user = globals.db.users.find_one({"username": username})
        if user:
            filters["user_id"] = str(user["_id"])

    # Filter by status if provided (default to active and reported listings)
    if "status" in request.args:
        # If status is 'all', don't filter by status
        if request.args["status"] != "all":
            filters["status"] = request.args["status"]
    else:
        # Show active and reported listings by default, but hide sold listings
        filters["status"] = {"$in": ["active", "reported"]}

    # Pagination parameters: page (default 1) and page_size (default 10)
    try:
        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("page_size", 12))
    except ValueError:
        return make_response(jsonify({"error": "Invalid pagination parameters"}), 400)

    # Sorting parameters
    sort_by = request.args.get("sort_by", "")
    sort_order = int(request.args.get("sort_order", -1))  # Default to descending (-1)

    # Define sort options
    sort_options = {
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "newest": [("_id", -1)],  # Assuming newer items have higher ObjectIDs
        "popular": [("views", -1)],  # Sort by view count
    }

    # Apply sorting if valid sort option provided
    sort_criteria = sort_options.get(sort_by, [("_id", -1)])  # Default to newest

    skip = (page - 1) * page_size
    cursor = listings_collection.find(filters).sort(sort_criteria).skip(skip).limit(page_size)
    listings_list = list(cursor)

    listings_list = [convert_object_ids(listing) for listing in listings_list]

    total_count = listings_collection.count_documents(filters)
    response = {
        "listings": listings_list,
        "page": page,
        "page_size": page_size,
        "total_count": total_count,
        "total_pages": (total_count + page_size - 1) // page_size
    }
    return make_response(jsonify(response), 200)

# Aggregation Endpoint: Average Price by Car Type for Active Listings
@listings_bp.route('/listings/stats/average_price_by_type', methods=['GET'])
def average_price_by_type():
    try:
        pipeline = [
            {"$match": {"status": "active"}},
            {"$group": {"_id": "$car_type", "average_price": {"$avg": "$price"}}},
            {"$sort": {"average_price": 1}}
        ]
        stats = list(listings_collection.aggregate(pipeline))
        # Convert ObjectId to string and round average_price to 2 decimal places
        for stat in stats:
            stat["_id"] = str(stat["_id"])
            stat["average_price"] = round(stat["average_price"], 2)
        return jsonify({"stats": stats}), 200
    except Exception as e:
        return jsonify({"error": "Aggregation error", "details": str(e)}), 500

# Aggregation Endpoint: Summary Statistics for Active Listings
@listings_bp.route('/listings/stats/summary', methods=['GET'])
def listings_summary():
    try:
        pipeline = [
            {"$match": {"status": "active"}},
            {"$group": {
                "_id": None,
                "total_listings": {"$sum": 1},
                "average_price": {"$avg": "$price"},
                "max_price": {"$max": "$price"},
                "min_price": {"$min": "$price"}
            }},
            {"$project": {
                "_id": 0,
                "total_listings": 1,
                "average_price": {"$round": ["$average_price", 2]},
                "max_price": {"$round": ["$max_price", 2]},
                "min_price": {"$round": ["$min_price", 2]}
            }}
        ]
        summary = list(listings_collection.aggregate(pipeline))

        # Additionally, count listings per car type
        pipeline_by_type = [
            {"$match": {"status": "active"}},
            {"$group": {"_id": "$car_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        counts_by_type = list(listings_collection.aggregate(pipeline_by_type))
        for item in counts_by_type:
            item["_id"] = str(item["_id"])

        return make_response(jsonify({"summary": summary[0] if summary else {}, "counts_by_type": counts_by_type}), 200)
    except Exception as e:
        return make_response(jsonify({"error": "Aggregation error", "details": str(e)}), 500)


@listings_bp.route('/listings/<id>', methods=['GET'])
def get_listing(id):
    try:
        listing = listings_collection.find_one({"_id": ObjectId(id)})
        if not listing:
            return jsonify({"error": "Listing not found"}), 404

        # Increment views
        listings_collection.update_one({"_id": ObjectId(id)}, {"$inc": {"views": 1}})

        listing = convert_object_ids(listing)

        return jsonify(listing), 200
    except Exception as e:
        return jsonify({"error": "Invalid listing ID", "details": str(e)}), 400

# Update a listing
@listings_bp.route('/listings/<id>', methods=['PUT'])
@jwt_required
def update_listing(current_user, id):
    try:
        listing = listings_collection.find_one({"_id": ObjectId(id)})
        if not listing:
            return jsonify({"error": "Listing not found"}), 404

        if listing.get("user_id") != str(current_user["_id"]):
            return jsonify({"error": "Unauthorized"}), 403

        data = request.json
        update_result = listings_collection.update_one({"_id": ObjectId(id)}, {"$set": data})
        if update_result.modified_count == 0:
            return jsonify({"error": "No updates made"}), 400

        return jsonify({"message": "Listing updated"}), 200
    except Exception as e:
        return jsonify({"error": "Invalid listing ID", "details": str(e)}), 400

# Mark a listing as sold
@listings_bp.route('/listings/<id>/mark_sold', methods=['PUT'])
@jwt_required
def mark_listing_sold(current_user, id):
    try:
        listing = listings_collection.find_one({"_id": ObjectId(id)})
        if not listing:
            return jsonify({"error": "Listing not found"}), 404

        if listing.get("user_id") != str(current_user["_id"]):
            return jsonify({"error": "Unauthorized"}), 403

        update_result = listings_collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"status": "sold"}}
        )
        if update_result.modified_count == 0:
            return jsonify({"error": "No changes made"}), 400

        return jsonify({"message": "Listing marked as sold"}), 200
    except Exception as e:
        return jsonify({"error": "Invalid listing ID", "details": str(e)}), 400

# Delete a listing
@listings_bp.route('/listings/<id>', methods=['DELETE'])
@jwt_required
def delete_listing(current_user, id):
    try:
        listing = listings_collection.find_one({"_id": ObjectId(id)})
        if not listing:
            return jsonify({"error": "Listing not found"}), 404

        if listing.get("user_id") != str(current_user["_id"]):
            return jsonify({"error": "Unauthorized"}), 403

        delete_result = listings_collection.delete_one({"_id": ObjectId(id)})
        return jsonify({"message": "Listing deleted"}), 200
    except Exception as e:
        return jsonify({"error": "Invalid listing ID", "details": str(e)}), 400

# Report a listing
@listings_bp.route('/listings/<id>/report', methods=['POST'])
@jwt_required
def report_listing(current_user, id):
    try:
        listing = listings_collection.find_one({"_id": ObjectId(id)})
        if not listing:
            return jsonify({"error": "Listing not found"}), 404

        update_result = listings_collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": {
                "status": "reported",
                "reported_by": str(current_user["_id"])
            }}
        )
        return jsonify({"message": "Listing reported successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Invalid listing ID", "details": str(e)}), 400

