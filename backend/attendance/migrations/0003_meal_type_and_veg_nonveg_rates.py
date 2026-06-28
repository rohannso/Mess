# Generated for veg/non-veg meal selection and rates.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0002_mealrate'),
    ]

    operations = [
        migrations.AddField(
            model_name='attendance',
            name='afternoon_meal_type',
            field=models.CharField(choices=[('veg', 'Veg'), ('nonveg', 'Non-veg')], default='veg', max_length=10),
        ),
        migrations.AddField(
            model_name='attendance',
            name='night_meal_type',
            field=models.CharField(choices=[('veg', 'Veg'), ('nonveg', 'Non-veg')], default='veg', max_length=10),
        ),
        migrations.AddField(
            model_name='mealrate',
            name='afternoon_nonveg_rate',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='mealrate',
            name='afternoon_veg_rate',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='mealrate',
            name='night_nonveg_rate',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='mealrate',
            name='night_veg_rate',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
    ]
