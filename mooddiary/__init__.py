from flask import Flask

from mooddiary.core import db, manager
from mooddiary.views import *
from mooddiary.models import Entry, EntryField, EntryFieldAnswer


def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = '129iv3n91283nv9812n3v89q2nnv9iaszv978n98qwe7z897d'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/mooddiary.db'

    db.init_app(app)
    manager.init_app(app)

    manager.create_api(Entry, methods=['GET', 'POST', 'DELETE'], collection_name='entry', app=app)
    manager.create_api(EntryField, methods=['GET', 'POST', 'DELETE'], collection_name='entry_fields', app=app)

    app.add_url_rule('/templates/<path:partial>', 'render_partial', render_partial)
    app.add_url_rule('/', 'index', index)
    app.add_url_rule('/<path:path>', 'index', index)

    return app
