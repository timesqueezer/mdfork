import os
from flask import Flask
from flask.ext.assets import Bundle

from mooddiary.core import db, manager, migrate, assets
from mooddiary.bundles import js, css
from mooddiary.views import *
from mooddiary.models import Entry, EntryField, EntryFieldAnswer


def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = '129iv3n91283nv9812n3v89q2nnv9iaszv978n98qwe7z897d'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/mooddiary.db'

    app.config['DEBUG'] = True
    app.config['ASSETS_DEBUG'] = True
    app.config['LESS_BIN'] = os.path.realpath(os.path.join(os.path.dirname(__file__), '../node_modules/less/bin/lessc'))

    db.init_app(app)
    manager.init_app(app)
    migrate.init_app(app, db)
    assets.init_app(app)

    assets.register('js', js)
    assets.register('css', css)

    manager.create_api(Entry, methods=['GET', 'POST', 'DELETE'], collection_name='entry', app=app, results_per_page=0)
    manager.create_api(EntryField, methods=['GET', 'POST', 'DELETE'], collection_name='entry_field', app=app, results_per_page=0)
    manager.create_api(EntryFieldAnswer, methods=['POST'], collection_name='entry_field_answer', app=app, results_per_page=0)

    app.add_url_rule('/templates/<path:partial>', 'render_partial', render_partial)
    app.add_url_rule('/', 'index', index)
    app.add_url_rule('/<path:path>', 'index', index)

    return app
