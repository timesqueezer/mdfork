from enum import IntEnum, unique
from datetime import datetime

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


class EntryField(db.Model):
    __tablename__ = "entry_fields"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    type = db.Column(db.Integer, default=EntryFieldType.RANGE.value)


class EntryFieldAnswer(db.Model):
    __tablename__ = "entry_field_answers"
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(300))

    entry_id = db.Column(db.Integer, db.ForeignKey('entries.id'))
    entry = db.relationship('Entry', backref='answers')

    entry_field_id = db.Column(db.Integer, db.ForeignKey('entry_fields.id'))
    entry_field = db.relationship('EntryField', backref='answers')
