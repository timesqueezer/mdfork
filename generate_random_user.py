#!/usr/bin/env/python
import random
from datetime import datetime, timedelta
from mooddiary import create_app
from mooddiary.core import db
from mooddiary.models import *
from faker import Faker


app = create_app()
with app.app_context():

    print("Creating random data")

    demo_account = User(email='demo@mooddiary.org', first_name='Demo',
                last_name='Demo', is_admin=True)
    demo_account.set_password('demo123')
    db.session.add(demo_account)
    db.session.commit()
    faker = Faker()
    random_fields = [
        {'name': 'Overall Mood', 'type': EntryFieldType.RANGE.value},
        {'name': 'Cups of Coffee', 'type': EntryFieldType.INTEGER.value},
        {'name': 'Hours of Sleep', 'type': EntryFieldType.INTEGER.value},
        {'name': 'Quality of Sleep', 'type': EntryFieldType.RANGE.value},
        {'name': 'Comment', 'type': EntryFieldType.STRING.value},
        {'name': 'Energy Drinks', 'type': EntryFieldType.INTEGER.value},
        {'name': 'Concentration', 'type': EntryFieldType.RANGE.value},
        {'name': 'Stray Thougts Intensity', 'type': EntryFieldType.RANGE.value}
    ]
    for field in random_fields:
        color = str(hex(random.randint(0, 255)))[2:] + str(hex(random.randint(0, 255)))[2:] + str(hex(random.randint(0, 255)))[2:]
        new_entry_field = EntryField(name=field['name'], type=field['type'],
                user_id=demo_account.id, color=color)
        db.session.add(new_entry_field)
    db.session.commit()

    for i in range(150, 0, -1):
        new_entry = Entry(date=datetime.utcnow() - timedelta(days=i), user_id=demo_account.id)
        db.session.add(new_entry)
        for field in EntryField.query:
            if field.type == EntryFieldType.STRING.value:
                content = faker.sentence()
            elif field.type == EntryFieldType.RANGE.value:
                content = str(random.randint(0, 10))
            elif field.type == EntryFieldType.INTEGER.value:
                content = str(random.randint(0, 100))

            new_answer = EntryFieldAnswer(content=content, entry=new_entry, entry_field=field)
            db.session.add(new_answer)

    db.session.commit()
