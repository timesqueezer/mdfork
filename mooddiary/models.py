from enum import IntEnum, unique
from datetime import datetime

from flask.ext.scrypt import generate_random_salt, generate_password_hash, check_password_hash

from mooddiary.core import db


@unique
class EntryFieldType(IntEnum):
    STRING = 1
    RANGE = 2
    INTEGER = 3


class Entry(db.Model):
    __tablename__ = "entries"

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    user = db.relationship('User', backref='entries')


class EntryField(db.Model):
    __tablename__ = "entry_fields"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    type = db.Column(db.Integer, default=EntryFieldType.RANGE.value)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    user = db.relationship('User', backref='fields')


class EntryFieldAnswer(db.Model):
    __tablename__ = "entry_field_answers"

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(300))

    entry_id = db.Column(db.Integer, db.ForeignKey('entries.id'))
    entry = db.relationship('Entry', backref='answers')

    entry_field_id = db.Column(db.Integer, db.ForeignKey('entry_fields.id'))
    entry_field = db.relationship('EntryField', backref='answers')


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    email = db.Column(db.String(100), nullable=True, unique=True)

    password_salt = db.Column(db.LargeBinary, nullable=False)
    password_hash = db.Column(db.LargeBinary, nullable=False)

    # This gets set to true once user has been verified by email
    #email_verified = db.Column(db.Boolean, default=False)

    # Personal data
    first_name = db.Column(db.String(40))
    last_name = db.Column(db.String(40))

    #facebook_id = db.Column(db.String(50))
    #facebook_token = db.Column(db.String(300))
    #google_id = db.Column(db.String(50))
    #google_token = db.Column(db.String(300))

    @property
    def name(self):
        return "{} {}".format(self.first_name, self.last_name)

    def set_password(self, password_string):
        self.password_salt = generate_random_salt()
        self.password_hash = generate_password_hash(password_string, self.password_salt, 1 << 15)

        db.session.commit()

    def check_password(self, password):
        return check_password_hash(password, self.password_hash, self.password_salt, 1 << 15)
