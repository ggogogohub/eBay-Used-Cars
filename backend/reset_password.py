from pymongo import MongoClient
import bcrypt
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB Connection
MONGODB_URI = os.environ.get('MONGODB_URI')
MONGODB_DB = os.environ.get('MONGODB_DB')

# Check if MongoDB credentials are set
if not MONGODB_URI:
    MONGODB_URI = 'mongodb://localhost:27017'
    print("WARNING: MONGODB_URI not set in environment variables. Using default localhost connection.")

if not MONGODB_DB:
    MONGODB_DB = 'ebay_used_cars'
    print("WARNING: MONGODB_DB not set in environment variables. Using default database name 'ebay_used_cars'.")

client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB]
users = db.users

# This script is a utility for resetting passwords
# It should be run with command line arguments for username and password
# Example: python reset_password.py username new_password

import sys

if len(sys.argv) < 3:
    print("Usage: python reset_password.py <username> <new_password>")
    sys.exit(1)

# Get username and password from command line arguments
username = sys.argv[1]
new_password = sys.argv[2]

# Hash the new password
hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())

# Update the user's password
result = users.update_one(
    {"username": username},
    {"$set": {"password": hashed_pw}}
)

if result.modified_count > 0:
    print(f"Password updated successfully for user: {username}")
else:
    print(f"Failed to update password for user: {username}")
    print("User may not exist or password may be the same as current password.")
