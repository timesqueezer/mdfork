#!/usr/bin/env/python

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

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
            index = user.fields.index(field)
            index = index % len(defaultColors)
            field.color = defaultColors[index]

    #db.session.commit()
