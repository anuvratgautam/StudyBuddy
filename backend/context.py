# backend/context.py
import contextvars

# Create a ContextVar to hold the current user_id
# This ensures that if multiple users hit the API at the same time,
# their requests don't get mixed up.
_user_id_ctx = contextvars.ContextVar("user_id", default="default_user")

def set_current_user(user_id: str):
    """Set the user_id for the current request context."""
    return _user_id_ctx.set(user_id)

def get_current_user():
    """Get the user_id for the current request context."""
    return _user_id_ctx.get()