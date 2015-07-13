from flask.ext import restless
from flask.ext.sqlalchemy import SQLAlchemy

db = SQLAlchemy()
manager = restless.APIManager(flask_sqlalchemy_db=db)
