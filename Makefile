.PHONY: setup virtualenv node-packages bower-packages

default: setup

setup: virtualenv node-packages bower-packages

virtualenv:
	virtualenv -p python3 env
	env/bin/pip install --upgrade -r requirements.txt

node-packages:
	npm install --quiet

bower-packages:
	node_modules/.bin/bower --quiet install
	node_modules/.bin/bower --quiet update

clean:
	rm -rf env
	rm -rf node_modules
	rm -rf mooddiary/static/bower_components
