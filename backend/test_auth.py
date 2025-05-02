from pymongo import MongoClient
import bcrypt
import sys
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

def test_user_auth(username, password):
    print(f"Testing authentication for user: {username}")

    # Find user in the database
    user = users.find_one({'username': username})
    if not user:
        print(f"User not found: {username}")
        return False

    print(f"User found: {user['username']}, role: {user.get('role', 'unknown')}")

    # Verify password
    try:
        password_matches = bcrypt.checkpw(password.encode('utf-8'), user['password'])
        print(f"Password check result: {password_matches}")
        return password_matches
    except Exception as e:
        print(f"Error checking password: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python test_auth.py <username> <password>")
        sys.exit(1)

    username = sys.argv[1]
    password = sys.argv[2]

    result = test_user_auth(username, password)
    print(f"Authentication {'successful' if result else 'failed'}")
