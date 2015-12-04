import requests
from datetime import date, timedelta

from marshmallow import fields, Schema
from marshmallow.validate import Email, Length

from flask import request, abort, current_app
from flask.ext.restful import Resource
from flask.ext.jwt import jwt_required, current_user

from mooddiary.core import db
from mooddiary.models import User, EntryField, EntryFieldType, Entry
from mooddiary.schemas import UserSchema, EntrySchema, EntryFieldSchema
from mooddiary.utils import resp, constant_validator


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
            return resp({'message': 'Fehler im Formular :('}, status_code=400)

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
            return resp({'message': 'Diese Email-Adresse wird bereits verwendet.'}, status_code=400)

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


class UserDetail(Resource):
    @jwt_required()
    def get(self, id):
        if current_user.id is not id and not current_user.is_admin:
            abort(401)

        user = User.query.get_or_404(id)
        schema = UserSchema()

        return resp(user, schema)

    @jwt_required()
    def patch(self, id):
        if current_user.id is not id and not current_user.is_admin:
            abort(401)

        class UserInputSchema(Schema):
            email = fields.String(validate=Email())
            first_name = fields.String(validate=Length(min=2, max=40))
            last_name = fields.String(validate=Length(min=2, max=40))
            password = fields.String(validate=Length(min=7))
            language = fields.String(validate=Length(min=5, max=5))
            use_colors = fields.Boolean()

        schema = UserInputSchema()
        result, errors = schema.load(request.json)

        if errors:
            return resp({'message': 'form error'}, status_code=400)

        user = User.query.get(id)
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
        if 'use_colors' in result:
            user.use_colors = result['use_colors']

        db.session.commit()

        schema = UserSchema()
        return resp(user, schema)

    @jwt_required()
    def delete(self, id):
        if not current_user.is_admin:
            abort(401)

        user = User.query.get_or_404(id)
        for entry in user.entries:

            for answer in entry.answers:
                db.session.delete(answer)

            db.session.delete(entry)

            for field in user.fields:
                db.session.delete(field)

        db.session.delete(user)
        db.session.commit()
        return "", 204


class UserEntryList(Resource):
    @jwt_required()
    def get(self, id):
        if current_user.id is not id and not current_user.is_admin:
            abort(401)

        query = Entry.query.filter_by(user_id=id)

        if 'timespan' in request.args:
            count, length = request.args.get('timespan').split('.')
            if (length != 'a'):
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
    def post(self, id):
        if current_user.id is not id and not current_user.is_admin:
            abort(401)

        class EntryInputSchema(Schema):
            date = fields.Date(required=True)

        schema = EntryInputSchema()

        result, errors = schema.load(request.json)
        if errors:
            return resp({'message': 'form error'}, status_code=400)

        entry = Entry.query.filter_by(user_id=id).filter(db.func.date(Entry.date) == result['date']).first()
        if entry:
            return resp({'message': 'Entry this date already present.'}, status_code=400)

        entry = Entry(user_id=id, date=result['date'])
        db.session.add(entry)
        db.session.commit()
        schema = EntrySchema(exclude=['answers'])
        return resp(entry, schema)


class UserEntryFieldList(Resource):
    @jwt_required()
    def get(self, id):
        if current_user.id is not id and not current_user.is_admin:
            abort(401)

        fields = EntryField.query.filter_by(user_id=id).all()
        schema = EntryFieldSchema(many=True)

        return resp(fields, schema)

    @jwt_required()
    def post(self, id):
        if current_user.id is not id and not current_user.is_admin:
            abort(401)

        class FieldInputSchema(Schema):
            name = fields.String(required=True, validate=Length(max=100))
            type = fields.Integer(required=True, validate=constant_validator(EntryFieldType))
            color = fields.String(required=True, validate=Length(min=6, max=6))

        schema = FieldInputSchema()
        result, errors = schema.load(request.json)
        if errors:
            return resp({'message': 'form error'}, status_code=400)

        field = EntryField(name=result['name'], type=result['type'], user_id=id, color=result['color'])
        db.session.add(field)
        db.session.commit()
        schema = EntryFieldSchema()
        return resp(field, schema)
