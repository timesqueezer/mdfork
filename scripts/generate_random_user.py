#!/usr/bin/env/python

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import random
from datetime import date, timedelta
from mooddiary import create_app
from mooddiary.core import db
from mooddiary.models import *
from faker import Factory

faker = Factory.create('de_DE')


app = create_app()
with app.app_context():
    print("Deleting old demo user if existing")

    existing = User.query.filter_by(email='demo@mooddiary.org').first()
    if existing:
        for entry in existing.entries:

            for answer in entry.answers:
                db.session.delete(answer)

            db.session.delete(entry)

            for field in existing.fields:
                db.session.delete(field)

        db.session.delete(existing)
        db.session.commit()

    print("Creating random data")

    demo_account = User(email='demo@mooddiary.org', first_name='Demo',
                        last_name='Demo', is_admin=True)
    demo_account.set_password('demo123')
    db.session.add(demo_account)
    db.session.commit()

    random_fields = [
        {'name': 'Stimmung', 'type': EntryFieldType.RANGE.value, 'color': '0a80ba'},
        {'name': 'Tassen Kaffee', 'type': EntryFieldType.INTEGER.value, 'color': 'F7464A'},
        {'name': 'Stunden Schlaf', 'type': EntryFieldType.INTEGER.value, 'color': '39BF71'},
        {'name': 'Schlafqualität', 'type': EntryFieldType.RANGE.value, 'color': 'FDB45C'},
        {'name': 'Texteintrag', 'type': EntryFieldType.STRING.value, 'color': '4D5360'},
        {'name': 'Energy Drinks', 'type': EntryFieldType.INTEGER.value, 'color': '460793'},
        {'name': 'Konzentration', 'type': EntryFieldType.RANGE.value, 'color': '390DFA'},
        {'name': 'Suchtdruck', 'type': EntryFieldType.RANGE.value, 'color': 'cc3f1a'}
    ]
    for field in random_fields:
        new_entry_field = EntryField(name=field['name'], type=field['type'],
                                     user_id=demo_account.id, color=field['color'])
        db.session.add(new_entry_field)
    db.session.commit()

    for i in range(150, 0, -1):
        new_entry = Entry(date=date.today() - timedelta(days=i), user_id=demo_account.id)
        db.session.add(new_entry)
        for field in EntryField.query:
            if field.type == EntryFieldType.STRING.value:
                content = faker.sentence()
            elif field.type == EntryFieldType.RANGE.value:
                content = str(int(random.gauss(7, 1.5)))
            elif field.type == EntryFieldType.INTEGER.value:
                content = str(int(random.gammavariate(5, 1)))

            new_answer = EntryFieldAnswer(content=content, entry=new_entry, entry_field=field)
            db.session.add(new_answer)

    db.session.commit()
