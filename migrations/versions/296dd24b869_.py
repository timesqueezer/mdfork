"""Added language field to User model

Revision ID: 296dd24b869
Revises: 1568b7548f2
Create Date: 2015-08-25 19:44:38.382525

"""

# revision identifiers, used by Alembic.
revision = '296dd24b869'
down_revision = '1568b7548f2'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('users', sa.Column('language', sa.String(length=5),
        nullable=False, server_default='de-DE'))


def downgrade():
    op.drop_column('users', 'language')
