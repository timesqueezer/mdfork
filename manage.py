#!env/bin/python
import random
from datetime import datetime, timedelta
from faker import Faker

from flask.ext.script import Manager

from mooddiary import create_app
from mooddiary.core import db
from mooddiary.models import *

manager = Manager(create_app)


@manager.shell
def make_shell_context():
    return dict(db=db)


@manager.command
def initdb(random_data=False):
    """Drops and recreates all tables"""

    print("Dropping tables")
    db.drop_all()

    print("Creating tables")
    db.create_all()

    if random_data:
        print("Creating random data")
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
            new_entry_field = EntryField(name=field['name'], type=field['type'])
            db.session.add(new_entry_field)
        db.session.commit()

        for i in range(50, 0, -1):
            new_entry = Entry(date=datetime.utcnow() - timedelta(days=i))
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

if __name__ == "__main__":
    manager.run()
