import os
from datetime import timedelta

from flask import Flask
from flask.ext.assets import Bundle

from mooddiary.core import db, migrate, assets, jwt
from mooddiary.bundles import js, css
from mooddiary.views import main
from mooddiary.api import api
from mooddiary.auth import auth
from mooddiary.models import Entry, EntryField, EntryFieldAnswer, User


def create_app(config=None):
    app = Flask(__name__)

    app.config['SECRET_KEY'] = '129iv3n91283nv9812n3v89q2nnv9iaszv978n98qwe7z897d'
    #app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres@localhost/mooddiaryDb'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/mooddiary.db'

    app.config['DEBUG'] = True
    app.config['ASSETS_DEBUG'] = True
    app.config['LESS_BIN'] = os.path.realpath(os.path.join(os.path.dirname(__file__), '../node_modules/less/bin/lessc'))

    app.config['JWT_EXPIRATION_DELTA'] = timedelta(days=28)
    app.config['JWT_ALGORITHM'] = 'HS512'

    if config:
        app.config.from_object(config)

    db.init_app(app)
    migrate.init_app(app, db)
    assets.init_app(app)
    jwt.init_app(app)

    assets.register('js', js)
    assets.register('css', css)

    app.register_blueprint(main)
    app.register_blueprint(api, url_prefix='/api')
    app.register_blueprint(auth, url_prefix='/auth')

    return app
