from flask import flash, request, render_template


def index(path=None):
    return render_template('index.html')


def render_partial(partial=None):
    return render_template(partial + '.html')
