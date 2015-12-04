from marshmallow import fields, Schema

from flask import request, abort
from flask.ext.restful import Resource
from flask.ext.jwt import jwt_required, current_user

from mooddiary.core import db
from mooddiary.models import Entry, EntryField, EntryFieldAnswer
from mooddiary.schemas import EntrySchema, EntryFieldAnswerSchema
from mooddiary.utils import resp


class EntryDetail(Resource):
    @jwt_required()
    def patch(self, id):
        entry = Entry.query.get_or_404(id)

        if entry.user_id != current_user.id:
            abort(401)

        class EntryInputSchema(Schema):
            date = fields.Date(required=True)

        schema = EntryInputSchema()

        result, errors = schema.load(request.json)
        if errors:
            return resp({'message': 'form error'}, status_code=400)

        entry_existing = Entry.query.filter(db.func.date(Entry.date) == result['date']).first()
        if entry_existing and entry_existing.id != entry.id:
            return resp({'message': 'Entry at this date already present.'}, status_code=400)

        entry.date = result['date']

        db.session.commit()
        schema = EntrySchema()
        return resp(entry, schema)

    @jwt_required()
    def delete(self, id):
        entry = Entry.query.get_or_404(id)

        if entry.user_id != current_user.id:
            abort(401)

        for answer in entry.answers:
            db.session.delete(answer)
        db.session.delete(entry)
        db.session.commit()
        return "", 204


class EntryAnswerList(Resource):
    @jwt_required()
    def post(self, id):
        entry = Entry.query.get_or_404(id)
        if entry.user_id != current_user.id:
            abort(401)

        class AnswerInputSchema(Schema):
            entry_field_id = fields.Integer(required=True)
            content = fields.Raw(required=True)

        schema = AnswerInputSchema()
        result, errors = schema.load(request.json)

        if errors:
            return resp(errors, status_code=400)

        entry_field = EntryField.query.get_or_404(result['entry_field_id'])
        answer = EntryFieldAnswer(entry=entry, entry_field=entry_field, content=str(result['content']))
        db.session.add(answer)
        db.session.commit()

        schema = EntryFieldAnswerSchema()
        return resp(answer, schema)
