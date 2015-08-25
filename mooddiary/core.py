from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.migrate import Migrate
from flask.ext.assets import Environment
from flask.ext.jwt import JWT
from flask.ext.admin import Admin

db = SQLAlchemy()
migrate = Migrate()
assets = Environment()
jwt = JWT()
admin = Admin(name='mooddiary', template_mode='bootstrap3')
