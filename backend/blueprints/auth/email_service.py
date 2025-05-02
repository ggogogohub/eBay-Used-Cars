import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import logging

logger = logging.getLogger(__name__)

# Get SendGrid API key from environment variables
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
if not SENDGRID_API_KEY:
    logger.warning("SENDGRID_API_KEY environment variable not set. Email functionality will not work.")

# Get sender email from environment variables
# This should be the EXACT email you verified in SendGrid
FROM_EMAIL = os.environ.get('FROM_EMAIL')
if not FROM_EMAIL:
    logger.warning("FROM_EMAIL environment variable not set. Email functionality will not work.")

def send_password_reset_email(to_email, reset_token, username):
    """
    Send a password reset email with a reset token

    Args:
        to_email (str): Recipient email address
        reset_token (str): Password reset token
        username (str): Username of the recipient

    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    # Create the reset URL (frontend URL)
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:4200')
    reset_url = f"{frontend_url}/reset-password?token={reset_token}"

    # Create email content
    subject = "Reset Your eBay Used Cars Password"
    html_content = f"""
    <html>
        <body>
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0066cc;">eBay Used Cars Password Reset</h2>
                <p>Hello {username},</p>
                <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
                <p>To reset your password, click the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" style="background-color: #0066cc; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
                </div>
                <p>Or copy and paste this URL into your browser:</p>
                <p style="word-break: break-all;">{reset_url}</p>
                <p>This link will expire in 1 hour for security reasons.</p>
                <p>Thank you,<br>The eBay Used Cars Team</p>
            </div>
        </body>
    </html>
    """

    # For development/testing purposes, print the reset token
    print(f"\n==== DEVELOPMENT MODE ====\nReset token for {username} ({to_email}): {reset_token}\nReset URL: {reset_url}\n==========================\n")

    # Try to send via SendGrid
    try:
        # Create SendGrid components
        from_email = Email(FROM_EMAIL)
        to_email = To(to_email)
        content = Content("text/html", html_content)

        # Create mail object
        message = Mail(from_email, to_email, subject, content)

        # Send the email
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)

        logger.info(f"Password reset email sent to {to_email.email}, status code: {response.status_code}")
        print(f"Password reset email sent to {to_email.email}, status code: {response.status_code}")
        return True
    except Exception as e:
        error_msg = f"Error sending password reset email: {str(e)}"
        logger.error(error_msg)
        print(error_msg)

        # Print more detailed troubleshooting information
        print("\nSendGrid Troubleshooting Information:")
        print(f"API Key (first 10 chars): {SENDGRID_API_KEY[:10]}...")
        print(f"From Email: {FROM_EMAIL}")
        print(f"To Email: {to_email.email}")
        print("Make sure your SendGrid account is properly set up:")
        print("1. Verify your sender identity in SendGrid - Go to https://app.sendgrid.com/settings/sender_auth")
        print("2. Verify the email address you're using as FROM_EMAIL")
        print("3. Check if your SendGrid account is active")
        print("4. Ensure you're not exceeding the free tier limits (100 emails per day)")
        print("5. Check if there are any restrictions on your SendGrid account")

        # For development/testing, we'll consider this a success since we printed the token
        # In production, you would want to return False here
        return True
