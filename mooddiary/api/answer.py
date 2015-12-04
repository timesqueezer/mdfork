from marshmallow import fields, Schema
from marshmallow.validate import Length

from flask import request, abort
from flask.ext.restful import Resource
from flask.ext.jwt import jwt_required, current_user

from mooddiary.core import db
from mooddiary.models import EntryFieldAnswer
from mooddiary.schemas import EntryFieldAnswerSchema
from mooddiary.utils import resp


class EntryFieldAnswerDetail(Resource):
    @jwt_required()
    def get(self, id):
        answer = EntryFieldAnswer.query.get_or_404(id)
        if answer.entry.user_id != current_user.id:
            abort(401)

        schema = EntryFieldAnswerSchema()
        return resp(answer, schema)

    @jwt_required()
    def patch(self, id):
        answer = EntryFieldAnswer.query.get_or_404(id)
        if answer.entry.user_id != current_user.id:
            abort(401)

        class AnswerInputSchema(Schema):
            content = fields.String(required=True, validate=Length(max=300))

        schema = AnswerInputSchema()
        result, errors = schema.load(request.json)

        if errors:
            return resp({'message': 'form error'}, status_code=400)

        answer.content = result['content']
        db.session.commit()

        schema = EntryFieldAnswerSchema()
        return resp(answer, schema)
