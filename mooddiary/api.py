from datetime import date, timedelta
import requests
from flask import Blueprint, current_app, request, json, abort
from flask.ext.restful import Api, Resource
from flask.ext.jwt import current_user, jwt_required
from marshmallow import Schema, fields
from marshmallow.validate import Length, Email

from mooddiary.core import db
from mooddiary.models import User, Entry, EntryField, EntryFieldAnswer, EntryFieldType
from mooddiary.schemas import EntrySchema, EntryFieldSchema, EntryFieldAnswerSchema, UserSchema
from mooddiary.utils import resp, constant_validator

api = Blueprint('api', __name__)
restful = Api(api)


@api.route('/')
@api.route('/<path:path>')
def index(path):
    return json.dumps({'message': 'Endpoint not found'}), 404


class UserMeEntryList(Resource):
    @jwt_required()
    def get(self):
        query = Entry.query.filter_by(user_id=current_user.id)

        if 'timespan' in request.args:
            count, length = request.args.get('timespan').split('.')
            count = int(count)
            if length == 'w':
                delta = timedelta(weeks=count)
            elif length == 'm':
                delta = timedelta(weeks=count * 4)
            query = query.filter(db.func.date(Entry.date) >= date.today() - delta)

        if 'sort_by' in request.args and 'order' in request.args:
            sort_by = request.args.get('sort_by')
            order = request.args.get('order')

            if order not in ['asc', 'desc']:
                return resp({'message': 'Invalid value for order request parameter'}, 400)
            if sort_by not in ['date']:
                return resp({'message': 'Invalid value for order request parameter'}, 400)

            query = query.order_by('{} {}'.format(sort_by, order))

        if 'page' in request.args:
            page = int(request.args['page'])
            per_page = int(request.args.get('per_page', 4))
            entries = query.paginate(page, per_page).items
        else:
            entries = query.all()

        schema = EntrySchema(many=True)

        return resp(entries, schema)

    @jwt_required()
    def post(self):
        class EntryInputSchema(Schema):
            date = fields.DateTime(required=True)

        schema = EntryInputSchema()

        result, errors = schema.load(request.json)
        if errors:
            return resp({'message': 'form error'}, status_code=400)

        entry = Entry.query.filter_by(user_id=current_user. id).filter(db.func.date(Entry.date) == result['date']).first()
        if entry:
            return resp({'message': 'Entry this date already present.'}, status_code=400)

        entry = Entry(user=current_user, date=result['date'])
        db.session.add(entry)
        db.session.commit()
        schema = EntrySchema(exclude=['answers'])
        return resp(entry, schema)
restful.add_resource(UserMeEntryList, '/me/entries')


class UserEntryList(Resource):
    @jwt_required()
    def get(self, id):
        if not current_user.is_admin:
            abort(401)
        query = Entry.query.filter_by(user_id=id)

        if 'sort_by' in request.args and 'order' in request.args:
            sort_by = request.args.get('sort_by')
            order = request.args.get('order')

            if order not in ['asc', 'desc']:
                return resp({'message': 'Invalid value for order request parameter'}, 400)
            if sort_by not in ['date']:
                return resp({'message': 'Invalid value for order request parameter'}, 400)

            query = query.order_by('{} {}'.format(sort_by, order))

        entries = query.all()

        schema = EntrySchema(many=True)

        return resp(entries, schema)
restful.add_resource(UserEntryList, '/users/<int:id>/entries')


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
restful.add_resource(EntryDetail, '/entries/<int:id>')


class UserMeEntryFieldList(Resource):
    @jwt_required()
    def get(self):
        fields = EntryField.query.filter_by(user_id=current_user.id).all()
        schema = EntryFieldSchema(many=True)

        return resp(fields, schema)

    @jwt_required()
    def post(self):
        class FieldInputSchema(Schema):
            name = fields.String(required=True, validate=Length(max=100))
            type = fields.Integer(required=True, validate=constant_validator(EntryFieldType))
            color = fields.String(required=True, validate=Length(min=6, max=6))

        schema = FieldInputSchema()
        result, errors = schema.load(request.json)
        if errors:
            return resp({'message': 'form error'}, status_code=400)

        field = EntryField(name=result['name'], type=result['type'], user=current_user, color=result['color'])
        db.session.add(field)
        db.session.commit()
        schema = EntryFieldSchema()
        return resp(field, schema)
restful.add_resource(UserMeEntryFieldList, '/me/fields')


class UserEntryFieldList(Resource):
    @jwt_required()
    def get(self, id):
        if not current_user.is_admin:
            abort(401)
        fields = EntryField.query.filter_by(user_id=id).all()
        schema = EntryFieldSchema(many=True)

        return resp(fields, schema)
restful.add_resource(UserEntryFieldList, '/users/<int:id>/fields')


class EntryFieldDetail(Resource):
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

restful.add_resource(EntryFieldAnswerDetail, '/answers/<int:id>')


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

restful.add_resource(EntryAnswerList, '/entries/<int:id>/answers')


class UserMe(Resource):
    @jwt_required()
    def get(self):
        user = User.query.get(current_user.id)
        schema = UserSchema()

        return resp(user, schema)

    @jwt_required()
    def patch(self):
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
    @jwt_required()
    def get(self):
        if not current_user.is_admin:
            abort(401)

        users = User.query.all()
        schema = UserSchema(many=True)
        return resp(users, schema)

    def post(self):
        class UserInputSchema(Schema):
            email = fields.String(required=True, validate=Email())
            password = fields.String(required=True)
            captcha = fields.String(required=True if not current_app.debug else False)
        schema = UserInputSchema()
        result, errors = schema.load(request.json)

        if errors:
            return resp({'message': 'form error'}, status_code=400)

        # captcha stuff
        if not current_app.debug:
            url = "https://www.google.com/recaptcha/api/siteverify"
            args = {
                'secret': current_app.config['RECAPTCHA_SECRET_KEY'],
                'response': result['captcha'],
                'remoteip': request.remote_addr
            }

            response = requests.post(url, data=args)
            resp_data = response.json()
            if response.status_code != requests.codes.ok or not resp_data.get('success'):
                return resp({'message': 'Invalid captcha'})

        if User.query.filter_by(email=result['email']).count() >= 1:
            return resp({'message': 'email already in use'}, status_code=400)

        user = User(email=result['email'])
        user.set_password(result['password'])

        db.session.add(user)
        template_field_1 = EntryField(name='Stimmung', type=EntryFieldType.RANGE.value, user=user, color='0a80ba')
        db.session.add(template_field_1)
        template_field_2 = EntryField(name='Stunden Schlaf', type=EntryFieldType.INTEGER.value, user=user, color='F7464A')
        db.session.add(template_field_2)
        template_field_3 = EntryField(name='Text', type=EntryFieldType.STRING.value, user=user, color='39BF71')
        db.session.add(template_field_3)
        db.session.commit()

        schema = UserSchema()
        return resp(user, schema)
restful.add_resource(UserList, '/users')
