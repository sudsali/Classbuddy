# Generated by Django 4.2.20 on 2025-05-14 16:18

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='File',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('file_type', models.CharField(max_length=50)),
                ('file_path', models.FileField(upload_to='uploads/%Y/%m/%d/', validators=[django.core.validators.MaxValueValidator(26214400, message='File size must be ≤25MB')])),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
