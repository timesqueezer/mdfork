from flask.ext.restless import APIManager
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.migrate import Migrate
from flask.ext.assets import Environment

db = SQLAlchemy()
migrate = Migrate()
manager = APIManager(flask_sqlalchemy_db=db)
assets = Environment()
