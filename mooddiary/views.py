import os
from flask import flash, request, render_template, Blueprint, abort, send_file


main = Blueprint('main', __name__, template_folder='templates', static_folder='static/gen', static_url_path='/static')


@main.route('/templates/<path:partial>')
def render_partial(partial=None):
    return render_template(partial + '.html')


@main.route('/languages/<path:lang>')
def send_lang_json(lang=None):
    if '..' in lang or lang.startswith('/'):
        abort(404)
    return send_file('languages/' + lang)


@main.route('/static/flags/<path:flag>')
def send_flag(flag=None):
    if '..' in flag or flag.startswith('/'):
        abort(404)
    return send_file('static/bower_components/flag-icon-css/flags/' + flag)


@main.route('/')
@main.route('/<path:path>')
def index(path=None):
    return render_template('index.html')
