"""Added color column for fields

Revision ID: 682f16031f
Revises: 4c97d9a0443
Create Date: 2015-11-24 01:35:38.377686

"""

# revision identifiers, used by Alembic.
revision = '682f16031f'
down_revision = '4c97d9a0443'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('entry_fields', sa.Column('color', sa.String(length=6), nullable=False, default='0a80ba', server_default='0a80ba'))


def downgrade():
    op.drop_column('entry_fields', 'color')
