#!/usr/bin/bash

psql -U postgres -d mooddiaryDb -t -c "select 'drop table \"' || tablename || '\" cascade;' from pg_tables where schemaname = 'public'" | psql -U postgres -d mooddiaryDb

ssh -p1337 mooddiary.org 'pg_dump -U postgres -Fc mooddiaryDb' | pg_restore -U postgres -n public -1 -d mooddiaryDb