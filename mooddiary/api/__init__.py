from flask import Blueprint, json
from flask.ext.restful import Api

from mooddiary.api.user import UserList, UserDetail, UserEntryList, UserEntryFieldList
from mooddiary.api.entry import EntryDetail, EntryAnswerList
from mooddiary.api.field import EntryFieldDetail
from mooddiary.api.answer import EntryFieldAnswerDetail

api = Blueprint('api', __name__)
restful = Api(api)


@api.route('/')
@api.route('/<path:path>')
def index(path):
    return json.dumps({'message': 'Endpoint not found'}), 404

# User
restful.add_resource(UserList, '/users')
restful.add_resource(UserDetail, '/users/<int:id>')
restful.add_resource(UserEntryList, '/users/<int:id>/entries')
restful.add_resource(UserEntryFieldList, '/users/<int:id>/fields')

# Entry
restful.add_resource(EntryDetail, '/entries/<int:id>')
restful.add_resource(EntryAnswerList, '/entries/<int:id>/answers')

# Field
restful.add_resource(EntryFieldDetail, '/fields/<int:field_id>')

# Answer
restful.add_resource(EntryFieldAnswerDetail, '/answers/<int:id>')
