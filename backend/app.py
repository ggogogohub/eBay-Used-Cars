# Description: This file is the entry point of the application. It creates the Flask app and registers the blueprints.
import os
from flask import Flask
from flask_cors import CORS
from flask_talisman import Talisman # type: ignore
from dotenv import load_dotenv
from blueprints.reviews.reviews import reviews_bp
from blueprints.auth.auth import auth_bp
from blueprints.auth.auth0 import auth0_bp
from blueprints.auth.refresh import refresh_bp
from blueprints.auth.csrf import csrf_bp
from blueprints.auth.password_reset import password_reset_bp
from blueprints.listings.listings import listings_bp
from blueprints.admin.admin import admin_bp
from blueprints.upload.upload import upload_bp

def create_app():
    # Load environment variables
    load_dotenv()

    app = Flask(__name__)
    Talisman(app,
        force_https=True,
        strict_transport_security=True,
        session_cookie_secure=True,
        content_security_policy={
            'default-src': "'self' res.cloudinary.com",
            'script-src': "'self'",
            'style-src': "'self'",
            'img-src': "'self' res.cloudinary.com data:"
        }
    )
    # Enable CORS for all routes
    CORS(app)

    # Register Blueprints
    app.register_blueprint(reviews_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(auth0_bp)
    app.register_blueprint(refresh_bp)
    app.register_blueprint(csrf_bp)
    app.register_blueprint(password_reset_bp)
    app.register_blueprint(listings_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(upload_bp)

    return app

# Run the application
if __name__ == '__main__':
    app = create_app()
    debug_mode = os.environ.get('DEBUG', 'True').lower() == 'true'
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=debug_mode, port=port)

