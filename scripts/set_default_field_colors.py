#!/usr/bin/env/python
import random
from datetime import datetime, timedelta
from mooddiary import create_app
from mooddiary.core import db
from mooddiary.models import *
from faker import Faker


app = create_app()
with app.app_context():

    print("Generating default colors")

    defaultColors = [
        '0a80ba',
        'F7464A',
        '39BF71',
        'FDB45C',
        '4D5360',
        '460793',
        '390DFA',
        'cc3f1a'
    ]

    for user in User.query:
        for field in user.fields:
            field.color = defaultColors[user.fields.index(field)]

    db.session.commit()
