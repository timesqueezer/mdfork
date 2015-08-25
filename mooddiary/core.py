from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.migrate import Migrate
from flask.ext.assets import Environment
from flask.ext.jwt import JWT

db = SQLAlchemy()
migrate = Migrate()
assets = Environment()
jwt = JWT()
