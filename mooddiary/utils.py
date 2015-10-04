from flask import json, current_app
from marshmallow import ValidationError


def resp(data, schema=None, status_code=200):
    if schema:
        response = current_app.response_class(json.dumps(schema.dump(data).data), mimetype='application/json')
    else:
        response = current_app.response_class(json.dumps(data), mimetype='application/json')
    response.status_code = status_code
    return response


def constant_validator(enum):
    def constant_type(value):
        if int(value) in list(enum):
            return value
        else:
            raise ValidationError("{} is not a valid {}".format(value, enum.__name__))

    return constant_type
