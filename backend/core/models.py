# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin


class Class(models.Model):
    class_id = models.SmallAutoField(primary_key=True, db_comment='Unique identifier for a class under a unit')
    unit_id_unit = models.ForeignKey('Unit', models.DO_NOTHING, db_column='unit_id_unit')
    class_size = models.SmallIntegerField(db_comment='current number of students in the class')

    class Meta:
        managed = False
        db_table = 'class'
        db_table_comment = 'A table for class entity'


class Enrollment(models.Model):
    enrollment_id = models.AutoField(primary_key=True, db_comment='Unique identifier for each enrollment')
    user_id_user = models.ForeignKey('User', models.DO_NOTHING, db_column='user_id_user')
    class_id_class = models.ForeignKey(Class, models.DO_NOTHING, db_column='class_id_class')
    unit_id_unit = models.ForeignKey('Unit', models.DO_NOTHING, db_column='unit_id_unit')
    enrollment_time = models.DateTimeField(db_comment='The time when the student is enrolled in the DBMS')

    class Meta:
        managed = False
        db_table = 'enrollment'
        unique_together = (('user_id_user', 'class_id_class', 'unit_id_unit'),)
        db_table_comment = 'The enrollment of student to a specific class. A student can only have one enrollment to one class of one unit anytime.'


class Feedback(models.Model):
    feedback_id = models.AutoField(primary_key=True)
    submission_id_submission = models.OneToOneField('Submission', models.DO_NOTHING, db_column='submission_id_submission')
    user_id_user = models.ForeignKey('User', models.DO_NOTHING, db_column='user_id_user')

    class Meta:
        managed = False
        db_table = 'feedback'


class FeedbackItem(models.Model):
    feedback_item_id = models.AutoField(primary_key=True, db_comment='unique identifier for feedback item')
    feedback_id_feedback = models.ForeignKey(Feedback, models.DO_NOTHING, db_column='feedback_id_feedback')
    rubric_item_id_rubric_item = models.ForeignKey('RubricItem', models.DO_NOTHING, db_column='rubric_item_id_rubric_item')
    feedback_item_score = models.SmallIntegerField(db_comment='actual score of the item')
    feedback_item_comment = models.TextField(blank=True, null=True, db_comment='short description to the sub-item grade')
    feedback_item_source = models.CharField(max_length=10, db_comment='the source of feedback: \nai, human, or revised if ai feedback is slightly modifed by human')

    class Meta:
        managed = False
        db_table = 'feedback_item'
        unique_together = (('feedback_id_feedback', 'rubric_item_id_rubric_item'),)
        db_table_comment = 'A section in the feedback as per the rubric'


class MarkingRubric(models.Model):
    rubric_id = models.AutoField(primary_key=True, db_comment='unique identifier for rubrics')
    user_id_user = models.ForeignKey('User', models.DO_NOTHING, db_column='user_id_user')
    rubric_create_time = models.DateTimeField(db_comment='timestamp when the rubirc is created')
    rubric_desc = models.CharField(max_length=100, blank=True, null=True, db_comment='description to the rubrics')

    class Meta:
        managed = False
        db_table = 'marking_rubric'
        db_table_comment = 'entity for a marking rubric. A marking rubric has many items.'


class RubricItem(models.Model):
    rubric_item_id = models.AutoField(primary_key=True, db_comment='unique identifier for item')
    rubric_id_marking_rubric = models.ForeignKey(MarkingRubric, models.DO_NOTHING, db_column='rubric_id_marking_rubric')
    rubric_item_name = models.CharField(max_length=50, db_comment='Title(header) name for the item')
    rubric_item_weight = models.DecimalField(max_digits=3, decimal_places=1, db_comment='the weight of the item on a scale of 100%, using xx.x')

    class Meta:
        managed = False
        db_table = 'rubric_item'
        db_table_comment = 'An item(dimension) under one rubric'


class RubricLevelDesc(models.Model):
    level_desc_id = models.AutoField(primary_key=True, db_comment='unique identifier for each level desc under one rubric')
    rubric_item_id_rubric_item = models.ForeignKey(RubricItem, models.DO_NOTHING, db_column='rubric_item_id_rubric_item')
    level_min_score = models.SmallIntegerField(db_comment='min for the item')
    level_max_score = models.SmallIntegerField(db_comment='max for the item')
    level_desc = models.TextField()

    class Meta:
        managed = False
        db_table = 'rubric_level_desc'
        db_table_comment = 'The detailed description to each of the score range under a rubric item under a rubric.'


class Submission(models.Model):
    submission_id = models.AutoField(primary_key=True, db_comment='unique identifier for submission')
    submission_time = models.DateTimeField(db_comment='time/date of submission')
    task_id_task = models.ForeignKey('Task', models.DO_NOTHING, db_column='task_id_task')
    user_id_user = models.ForeignKey('User', models.DO_NOTHING, db_column='user_id_user')
    submission_txt = models.TextField(db_comment='complete content of the essay submission')

    class Meta:
        managed = False
        db_table = 'submission'
        db_table_comment = 'A weal entity for task submissions.'


class Task(models.Model):
    task_id = models.AutoField(primary_key=True, db_comment='Unique identifier for task.')
    unit_id_unit = models.ForeignKey('Unit', models.DO_NOTHING, db_column='unit_id_unit')
    rubric_id_marking_rubric = models.ForeignKey(MarkingRubric, models.DO_NOTHING, db_column='rubric_id_marking_rubric')
    task_publish_datetime = models.DateTimeField(db_comment='time/date when the task is published')
    task_due_datetime = models.DateTimeField(db_comment='time/date when the task is due')

    class Meta:
        managed = False
        db_table = 'task'
        db_table_comment = 'Task created by lecturer/admin for students in some classes/units to complete'


class TeachingAssn(models.Model):
    teaching_assn_id = models.SmallAutoField(primary_key=True, db_comment='unique identifier')
    user_id_user = models.ForeignKey('User', models.DO_NOTHING, db_column='user_id_user')
    class_id_class = models.ForeignKey(Class, models.DO_NOTHING, db_column='class_id_class')

    class Meta:
        managed = False
        db_table = 'teaching_assn'
        unique_together = (('user_id_user', 'class_id_class'),)
        db_table_comment = 'A weak entity for assignment of teacher to classes'


class Unit(models.Model):
    unit_id = models.CharField(primary_key=True, max_length=10, db_comment='Unique identifier for each unit, same as the unit code')
    unit_name = models.CharField(max_length=50, db_comment='Full name of the unit')
    unit_desc = models.TextField(blank=True, null=True, db_comment='details of the unit')

    class Meta:
        managed = False
        db_table = 'unit'
        db_table_comment = 'A table for unit entity'


class CoreUserManager(BaseUserManager):
    def create_user(self, user_email, password=None, **extra_fields):
        if not user_email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(user_email)
        user = self.model(user_email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, user_email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(user_email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    user_id = models.IntegerField(primary_key=True, db_column='user_id')
    user_email = models.EmailField(unique=True, db_column='user_email')
    user_fname = models.CharField(max_length=20, blank=True, null=True, db_column='user_fname')
    user_lname = models.CharField(max_length=20, blank=True, null=True, db_column='user_lname')
    user_role = models.CharField(max_length=10, blank=True, null=True, db_column='user_role')
    user_status = models.CharField(max_length=15, blank=True, null=True, db_column='user_status')
    password = models.CharField(max_length=255, db_column='user_credential')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CoreUserManager()

    USERNAME_FIELD = 'user_email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'user'
        managed = False
        db_table_comment = 'A table for all user entities, including student, teacher, and admins.'
