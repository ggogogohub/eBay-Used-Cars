# Description: Global variables and constants
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables from .env file
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

# Secret Key
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    import secrets
    # Generate a secure random key if not provided in environment
    SECRET_KEY = secrets.token_hex(32)
    print("WARNING: SECRET_KEY not set in environment variables. Using a randomly generated key.")
    print("This key will change on restart, invalidating all existing tokens.")

