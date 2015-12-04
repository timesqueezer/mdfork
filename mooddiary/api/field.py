from marshmallow import fields, Schema
from marshmallow.validate import Length

from flask import request, abort
from flask.ext.restful import Resource
from flask.ext.jwt import jwt_required, current_user

from mooddiary.core import db
from mooddiary.models import EntryField
from mooddiary.schemas import EntryFieldSchema
from mooddiary.utils import resp


class EntryFieldDetail(Resource):
    @jwt_required()
    def get(self, field_id):
        field = EntryField.query.get_or_404(field_id)
        if field.user_id != current_user.id:
            abort(401)

        schema = EntryFieldSchema()
        return resp(field, schema)

    @jwt_required()
    def patch(self, field_id):
        field = EntryField.query.get_or_404(field_id)
        if field.user_id != current_user.id:
            abort(401)

        class FieldInputSchema(Schema):
            name = fields.String(required=True, validate=Length(min=1, max=100))
            color = fields.String(required=True, validate=Length(min=6, max=6))

        schema = FieldInputSchema()
        result, errors = schema.load(request.json)
        if errors:
            return resp({'errors': errors}, status_code=400)

        field.name = result['name']
        field.color = result['color']
        db.session.commit()

        schema = EntryFieldSchema()
        return resp(field, schema)

    @jwt_required()
    def delete(self, field_id):
        field = EntryField.query.get_or_404(field_id)
        if field.user_id != current_user.id:
            abort(401)
        db.session.delete(field)
        db.session.commit()
        return '', 204
