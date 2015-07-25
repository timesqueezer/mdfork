from flask import flash, request, render_template, Blueprint
from mooddiary.core import jwt
from mooddiary.models import User


auth = Blueprint('auth', __name__)


@jwt.authentication_handler
def authenticate(username, password):
    user = User.query.filter_by(email=username.lower()).one()
    if user.check_password(password):
        return user


@jwt.user_handler
def load_user(payload):
    return User.query.filter_by(id=payload['user_id']).one()
