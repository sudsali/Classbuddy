#!/bin/bash

sleep 20

# start the backend
python manage.py makemigrations

# create superuser with password
export DJANGO_SUPERUSER_EMAIL=admin@nyu.edu
export DJANGO_SUPERUSER_FIRST_NAME=admin
export DJANGO_SUPERUSER_LAST_NAME=admin
export DJANGO_SUPERUSER_PASSWORD=admin
python manage.py createsuperuser --noinput --first_name $DJANGO_SUPERUSER_FIRST_NAME --last_name "$DJANGO_SUPERUSER_LAST_NAME" --email $DJANGO_SUPERUSER_EMAIL

# run the backend
python manage.py runserver 0.0.0.0:8000
