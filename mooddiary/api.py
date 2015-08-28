from datetime import date, timedelta
from flask import Blueprint, current_app, request, json, abort
from flask.ext.restful import Api, Resource
from flask.ext.jwt import current_user, jwt_required
from marshmallow import Schema, fields
from marshmallow.validate import Length, Email

from mooddiary.core import db
from mooddiary.models import User, Entry, EntryField, EntryFieldAnswer, EntryFieldType
from mooddiary.schemas import EntrySchema, EntryFieldSchema, EntryFieldAnswerSchema, UserSchema

api = Blueprint('api', __name__)
restful = Api(api)


@api.route('/')
@api.route('/<path:path>')
def index(path):
    return json.dumps({'message': 'Endpoint not found'}), 404


def resp(data, schema=None, status_code=200):
    if schema:
        response = current_app.response_class(json.dumps(schema.dump(data).data), mimetype='application/json')
    else:
        response = current_app.response_class(json.dumps(data), mimetype='application/json')
    response.status_code = status_code
    return response


class UserEntryList(Resource):
    @jwt_required()
    def get(self):
        if 'timespan' in request.args:
            count, length = request.args.get('timespan').split('.')
            count = int(count)
            if length == 'w':
                delta = timedelta(weeks=count)
            elif length == 'm':
                delta = timedelta(weeks=count*4)
            entries = Entry.query.filter(db.func.date(Entry.date) >= date.today() - delta).order_by('date DESC').all()
        else:
            entries = Entry.query.filter_by(user_id=current_user.id).order_by('date DESC').all()
        schema = EntrySchema(many=True)

        return resp(entries, schema)

    @jwt_required()
    def post(self):
        class EntryInputSchema(Schema):
            date = fields.Date(required=True)

        schema = EntryInputSchema()

        result, errors = schema.load(request.json)
        if errors:
            return resp({'message': 'form error'}, status_code=400)

        entry = Entry.query.filter(db.func.date(Entry.date) == result['date']).first()
        if entry:
            return resp({'message': 'Entry this date already present.'}, status_code=400)

        entry = Entry(user=current_user, date=result['date'])
        db.session.add(entry)
        db.session.commit()
        schema = EntrySchema(exclude=['answers'])
        return resp(entry, schema)
restful.add_resource(UserEntryList, '/entries')


class EntryDetail(Resource):
    @jwt_required()
    def post(self, id):
        entry = Entry.query.get_or_404(id)

        class EntryInputSchema(Schema):
            date = fields.Date(required=True)

        schema = EntryInputSchema()

        result, errors = schema.load(request.json)
        if errors:
            return resp({'message': 'form error'}, status_code=400)

        entry_existing = Entry.query.filter(db.func.date(Entry.date) == result['date']).first()
        if entry_existing:
            return resp({'message': 'Entry this date already present.'}, status_code=400)

        entry.date = result['date']

        db.session.commit()
        schema = EntrySchema()
        return resp(entry, schema)
restful.add_resource(EntryDetail, '/entries/<int:id>')


class UserEntryFieldList(Resource):
    @jwt_required()
    def get(self):
        fields = EntryField.query.filter_by(user_id=current_user.id).all()
        schema = EntryFieldSchema(many=True)

        return resp(fields, schema)

    @jwt_required()
    def post(self):
        class FieldInputSchema(Schema):
            name = fields.String(required=True, validate=Length(max=100))
            type = fields.Select([item.value for item in list(EntryFieldType)], required=True)

        schema = FieldInputSchema()
        result, errors = schema.load(request.json)
        if errors:
            return resp({'message': 'form error'}, status_code=400)

        field = EntryField(name=result['name'], type=result['type'], user=current_user)
        db.session.add(field)
        db.session.commit()
        schema = EntryFieldSchema()
        return resp(field, schema)
restful.add_resource(UserEntryFieldList, '/fields')


class EntryFieldDetail(Resource):
    @jwt_required()
    def delete(self, field_id):
        field = EntryField.query.get_or_404(field_id)
        if field.user_id != current_user.id:
            abort(401)
        db.session.delete(field)
        db.session.commit()
        return '', 204
restful.add_resource(EntryFieldDetail, '/fields/<int:field_id>')


class EntryFieldAnswerDetail(Resource):
    @jwt_required()
    def get(self, id):
        answer = EntryFieldAnswer.query.get_or_404(id)
        if answer.entry.user_id != current_user.id:
            abort(401)

        schema = EntryFieldAnswerSchema()
        return resp(answer, schema)

    @jwt_required()
    def post(self, id):
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
        print(result['content'])
        db.session.commit()

        schema = EntryFieldAnswerSchema()
        return resp(answer, schema)

restful.add_resource(EntryFieldAnswerDetail, '/answers/<int:id>')


class EntryFieldAnswerList(Resource):
    @jwt_required()
    def post(self):
        class AnswerInputSchema(Schema):
            entry_field_id = fields.Integer(required=True)
            entry_id = fields.Integer(required=True)
            content = fields.String(required=True, validate=Length(max=300))

        schema = AnswerInputSchema()
        result, errors = schema.load(request.json)

        if errors:
            return resp({'message': 'form error'}, status_code=400)

        entry = Entry.query.get_or_404(result['entry_id'])
        entry_field = EntryField.query.get_or_404(result['entry_field_id'])
        answer = EntryFieldAnswer(entry=entry, entry_field=entry_field, content=result['content'])
        db.session.add(answer)
        db.session.commit()

        schema = EntryFieldAnswerSchema()
        return resp(answer, schema)

restful.add_resource(EntryFieldAnswerList, '/answers')


class UserMe(Resource):
    @jwt_required()
    def get(self):
        user = User.query.get(current_user.id)
        schema = UserSchema()

        return resp(user, schema)

    @jwt_required()
    def post(self):
        class UserInputSchema(Schema):
            email = fields.String(validate=Email())
            first_name = fields.String(validate=Length(min=2, max=40))
            last_name = fields.String(validate=Length(min=2, max=40))
            password = fields.String(validate=Length(min=7))
            language = fields.String(validate=Length(min=5, max=5))

        schema = UserInputSchema()
        result, errors = schema.load(request.json)

        if errors:
            return resp({'message': 'form error'}, status_code=400)

        user = User.query.get(current_user.id)
        if result.get('email'):
            user.email = result['email']
        if result.get('first_name'):
            user.first_name = result['first_name']
        if result.get('last_name'):
            user.last_name = result['last_name']
        if result.get('language'):
            user.language = result['language']
        if result.get('password'):
            user.set_password(result['password'])

        db.session.commit()

        schema = UserSchema()
        return resp(user, schema)

restful.add_resource(UserMe, '/me')


class UserList(Resource):
    def post(self):
        # captcha stuff
        class UserInputSchema(Schema):
            email = fields.String(required=True, validate=Email())
            password = fields.String(required=True)
        schema = UserInputSchema()
        result, errors = schema.load(request.json)

        if errors:
            return resp({'message': 'form error'}, status_code=400)

        if User.query.filter_by(email=result['email']).count() >= 1:
            return resp({'message': 'email already in use'}, status_code=400)

        user = User(email=result['email'])
        user.set_password(result['password'])

        db.session.add(user)
        db.session.commit()

        schema = UserSchema()
        return resp(user, schema)
restful.add_resource(UserList, '/users')
