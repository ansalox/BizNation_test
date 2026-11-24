import { User } from '../../modules/users/user.model';
import { Course } from '../../modules/courses/course.model';
import { Lesson } from '../../modules/lessons/lesson.model';
import { LessonProgress } from '../../modules/progress/progress.model';
import { WebhookEvent } from '../../modules/webhooks/webhook.model';
import { SupportAlert } from '../../modules/automation/supportAlert.model';

let associationsInitialized = false;

export function initializeAssociations(): void {
  if (associationsInitialized) {
    return;
  }

  Course.hasMany(Lesson, {
    foreignKey: 'course_id',
    as: 'lessons',
  });
  Lesson.belongsTo(Course, {
    foreignKey: 'course_id',
    as: 'course',
  });

  User.hasMany(LessonProgress, {
    foreignKey: 'user_id',
    as: 'progressRecords',
  });
  LessonProgress.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
  });

  Course.hasMany(LessonProgress, {
    foreignKey: 'course_id',
    as: 'progressRecords',
  });
  LessonProgress.belongsTo(Course, {
    foreignKey: 'course_id',
    as: 'course',
  });

  Lesson.hasMany(LessonProgress, {
    foreignKey: 'lesson_id',
    as: 'progressRecords',
  });
  LessonProgress.belongsTo(Lesson, {
    foreignKey: 'lesson_id',
    as: 'lesson',
  });

  WebhookEvent.hasMany(SupportAlert, {
    foreignKey: 'webhook_event_id',
    as: 'alerts',
  });
  SupportAlert.belongsTo(WebhookEvent, {
    foreignKey: 'webhook_event_id',
    as: 'webhookEvent',
  });

  associationsInitialized = true;
}

initializeAssociations();

export { User, Course, Lesson, LessonProgress, WebhookEvent, SupportAlert };
