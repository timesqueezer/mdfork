#!env/bin/python

from flask.ext.script import Manager

from mooddiary import db, create_app

manager = Manager(create_app)


@manager.shell
def make_shell_context():
    return dict(db=db)


@manager.command
def initdb():
    """Drops and recreates all tables"""

    print("Dropping tables")
    db.drop_all()

    print("Creating tables")
    db.create_all()


if __name__ == "__main__":
    manager.run()
