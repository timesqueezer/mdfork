from flask import json, current_app


def resp(data, schema=None, status_code=200):
    if schema:
        response = current_app.response_class(json.dumps(schema.dump(data).data), mimetype='application/json')
    else:
        response = current_app.response_class(json.dumps(data), mimetype='application/json')
    response.status_code = status_code
    return response
