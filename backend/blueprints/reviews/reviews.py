from flask import Blueprint, request, jsonify, make_response
from decorators import jwt_required, admin_required
from bson import ObjectId
import globals
import datetime
import jwt
from utils import convert_object_ids


reviews_bp = Blueprint('reviews_bp', __name__)

# Use globals.db for database access
listings = globals.db.listings

# Function to fetch user details from JWT token
def get_current_user_from_token():
    token = request.headers.get('x-access-token')
    try:
        data = jwt.decode(token, globals.SECRET_KEY, algorithms=['HS256'])
        user = globals.db.users.find_one({
            'username': {'$regex': f'^{data.get("user")}$', '$options': 'i'}
        })
        return user
    except Exception:
        return None

# Get reviews for a specific car listing
@reviews_bp.route('/listings/<string:l_id>/reviews', methods=['GET'])
def get_reviews(l_id):
    try:
        listing = listings.find_one({'_id': ObjectId(l_id)}, {'reviews': 1, '_id': 0})
    except Exception as e:
        return make_response(jsonify({'error': 'Invalid listing ID', 'details': str(e)}), 400)

    if not listing:
        return make_response(jsonify({'error': 'Listing not found'}), 404)

    reviews_list = convert_object_ids(listing.get('reviews', []))


    return make_response(jsonify(reviews_list), 200)

# Add a review to a car listing
@reviews_bp.route('/listings/<string:l_id>/reviews', methods=['POST'])
@jwt_required
def add_review(current_user, l_id):
    print(f"\n\n=== Add Review Endpoint Called ===\nListing ID: {l_id}")
    print(f"Headers: {dict(request.headers)}")
    print(f"Current user: {current_user['username'] if current_user else 'None'}")

    # Check if listing ID is provided and not "null"
    if not current_user:
        print("No current_user from decorator, trying to get from token")
        current_user = get_current_user_from_token()
        if not current_user:
            print("Failed to get user from token")
            return make_response(jsonify({'error': 'User not found'}), 401)

    print(f"User authenticated: {current_user['username']}")

    # Get and validate request data
    data = request.json
    print(f"Request data: {data}")

    review_text = data.get('review_text')
    rating = data.get('rating')

    print(f"Review text: {review_text}")
    print(f"Rating: {rating}, Type: {type(rating)}")

    # Convert rating to int if it's a string
    if isinstance(rating, str):
        try:
            rating = int(rating)
            print(f"Converted rating to int: {rating}")
        except ValueError:
            print(f"Failed to convert rating to int: {rating}")

    # Validate review data
    if not review_text:
        print("Missing review text")
        return make_response(jsonify({'error': 'Review text is required'}), 400)

    if not isinstance(rating, int) or rating < 1 or rating > 5:
        print(f"Invalid rating: {rating}, Type: {type(rating)}")
        return make_response(jsonify({'error': 'Rating must be an integer between 1 and 5'}), 400)

    # Create review object
    review = {
        '_id': ObjectId(),
        'user': current_user['username'],
        'review_text': review_text,
        'rating': rating,
        'created_at': datetime.datetime.now(datetime.timezone.utc)
    }
    print(f"Created review object: {review}")

    # Update the listing with the new review
    try:
        print(f"Attempting to update listing {l_id} with new review")
        update_result = listings.update_one({'_id': ObjectId(l_id)}, {'$push': {'reviews': review}})
        print(f"Update result: matched={update_result.matched_count}, modified={update_result.modified_count}")
    except Exception as e:
        print(f"Error updating listing: {str(e)}")
        return make_response(jsonify({'error': 'Invalid listing ID', 'details': str(e)}), 400)

    if update_result.matched_count == 0:
        print(f"No listing found with ID: {l_id}")
        return make_response(jsonify({'error': 'Listing not found'}), 404)

    print("Review added successfully")
    return make_response(jsonify({
        'message': 'Review added successfully',
        'review_id': str(review['_id'])
    }), 201)

# Update a review (only review creator can update)
@reviews_bp.route('/listings/<string:l_id>/reviews/<string:r_id>', methods=['PUT'])
@jwt_required
def update_review(current_user, l_id, r_id):
    # Check if listing ID and review ID are provided and not "null"
    if not l_id or l_id.lower() == "null":
        return make_response(jsonify({'error': 'Listing ID is missing or invalid'}), 400)
    if not r_id or r_id.lower() == "null":
        return make_response(jsonify({'error': 'Review ID is missing or invalid'}), 400)

    # Fallback: if current_user is not found, try to fetch it using the fallback
    if not current_user:
        current_user = get_current_user_from_token()
        if not current_user:
            return make_response(jsonify({'error': 'User not found'}), 401)

    data = request.json
    new_review_text = data.get('review_text')
    new_rating = data.get('rating')

    if not new_review_text or not isinstance(new_rating, int) or new_rating < 1 or new_rating > 5:
        return make_response(jsonify({'error': 'Invalid review data'}), 400)

    try:
        listing = listings.find_one({'_id': ObjectId(l_id), 'reviews._id': ObjectId(r_id)})
    except Exception as e:
        return make_response(jsonify({'error': 'Invalid ID format', 'details': str(e)}), 400)

    if not listing:
        return make_response(jsonify({'error': 'Listing or review not found'}), 404)

    # Verify that the current user is the creator of the review
    review_found = False
    for review in listing.get('reviews', []):
        if str(review['_id']) == r_id and review.get('user') == current_user.get('username'):
            review_found = True
            break

    if not review_found:
        return make_response(jsonify({'error': 'Unauthorized to update this review'}), 403)

    try:
        update_result = listings.update_one(
            {'_id': ObjectId(l_id), 'reviews._id': ObjectId(r_id)},
            {'$set': {
                'reviews.$.review_text': new_review_text,
                'reviews.$.rating': new_rating,
                'reviews.$.created_at': datetime.datetime.now(datetime.timezone.utc)
            }}
        )
    except Exception as e:
        return make_response(jsonify({'error': 'Invalid ID format', 'details': str(e)}), 400)

    if update_result.modified_count > 0:
        return make_response(jsonify({'message': 'Review updated successfully'}), 200)
    else:
        return make_response(jsonify({'error': 'No changes made'}), 400)

# Delete a review from a listing (only admin)
@reviews_bp.route('/listings/<string:l_id>/reviews/<string:r_id>', methods=['DELETE'])
@admin_required
def delete_review(current_user, l_id, r_id):
    try:
        listing = listings.find_one({'_id': ObjectId(l_id)})
    except Exception as e:
        return make_response(jsonify({'error': 'Invalid listing ID', 'details': str(e)}), 400)

    if not listing:
        return make_response(jsonify({'error': 'Listing not found'}), 404)

    review_exists = any(str(review["_id"]) == r_id for review in listing.get("reviews", []))
    if not review_exists:
        return make_response(jsonify({'error': 'Review not found'}), 404)

    try:
        update_result = listings.update_one(
            {'_id': ObjectId(l_id)},
            {'$pull': {'reviews': {'_id': ObjectId(r_id)}}}
        )
    except Exception as e:
        return make_response(jsonify({'error': 'Invalid ID format', 'details': str(e)}), 400)

    if update_result.modified_count == 0:
        return make_response(jsonify({'error': 'Review not deleted'}), 400)

    return make_response(jsonify({'message': 'Review deleted successfully'}), 200)
