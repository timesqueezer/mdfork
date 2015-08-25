"""Adding admin boolean field

Revision ID: 4c97d9a0443
Revises: 296dd24b869
Create Date: 2015-08-26 00:28:55.195675

"""

# revision identifiers, used by Alembic.
revision = '4c97d9a0443'
down_revision = '296dd24b869'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), nullable=False,
        server_default='false'))


def downgrade():
    op.drop_column('users', 'is_admin')
