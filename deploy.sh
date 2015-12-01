#!/usr/bin/bash
cd /srv/mooddiary
git pull
sudo cp uwsgi_config.ini /etc/uwsgi/vassals/mooddiary.ini
sudo chown http:http /etc/uwsgi/vassals/mooddiary.ini
sudo chmod 640 /etc/uwsgi/vassals/mooddiary.ini
