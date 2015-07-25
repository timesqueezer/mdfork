from flask import Blueprint, current_app, request, json
from flask.ext.restful import Api, Resource
from flask.ext.jwt import current_user, jwt_required

from mooddiary.schemas import EntrySchema, EntryFieldSchema, EntryFieldAnswerSchema, UserSchema

api = Blueprint('api', __name__)
restful = Api(api)


def resp(data, schema, status_code=200):
    response = current_app.response_class(json.dumps(schema.dump(data).data), mimetype='application/json')
    response.status_code = status_code
    return response


class UserEntryList(Resource):
    @jwt_required()
    def get(self):
        entries = Entry.query.filter_by(user_id=current_user.id).all()
        schema = EntrySchema(many=True)

        return resp(entries, schema)
restful.add_resource(UserEntryList, '/entries')


class UserEntryFieldList(Resource):
    @jwt_required()
    def get(self):
        fields = EntryField.query.filter_by(user_id=current_user.id).all()
        schema = EntryFieldSchema(many=True)

        return resp(fields, schema)
restful.add_resource(UserEntryFieldList, '/fields')
