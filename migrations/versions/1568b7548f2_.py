"""Added user table and updated other tables accordingly

Revision ID: 1568b7548f2
Revises: 1b64df25658
Create Date: 2015-07-26 02:03:46.590328

"""

# revision identifiers, used by Alembic.
revision = '1568b7548f2'
down_revision = '1b64df25658'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('email', sa.String(100), nullable=True),
        sa.Column('password_salt', sa.LargeBinary, nullable=False),
        sa.Column('password_salt', sa.LargeBinary, nullable=False),
        sa.Column('first_name', sa.String(40)),
        sa.Column('last_name', sa.String(40)),
        sa.PrimaryKeyConstraint('id')
    )
    op.add_column('entries', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key('entries_user_id_fkey', 'entries', 'users', ['user_id'], ['id'])
    op.add_column('entry_fields', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key('entry_fields_user_id_fkey', 'entry_fields', 'users', ['user_id'], ['id'])


def downgrade():
    op.drop_table('users')
    op.drop_constraint('entry_fields_user_id_fkey', 'entry_fields', type_='foreignkey')
    op.drop_column('entry_fields', 'user_id')
    op.drop_constraint('entries_user_id_fkey', 'entries', type_='foreignkey')
    op.drop_column('entries', 'user_id')
