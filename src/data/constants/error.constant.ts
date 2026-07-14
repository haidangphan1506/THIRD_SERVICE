export const ERROR_MESSAGES = {
  // Auth
  EMAIL_EXISTS: 'Email already exists',
  USERNAME_EXISTS: 'Username already exists',
  USER_NOT_FOUND: 'User not found',
  INVALID_PASSWORD: 'Invalid password',
  INVALID_RESET_PASSWORD_TOKEN: 'Invalid reset password token',
  USER_NOT_ACTIVE: 'User is not active',
  FAILED_TO_RESET_PASSWORD: 'Failed to reset password',
  FAILED_TO_UPDATE_PASSWORD: 'Failed to update password',
  INVALID_USER_ID: 'Invalid user ID',
  USER_ALREADY_LOGGED_OUT: 'User already logged out',
  INVALID_TOKEN_PAYLOAD: 'Invalid token payload',
  INVALID_TOKEN_TYPE: 'Invalid token type',
  INVALID_OR_EXPIRED_REFRESH_TOKEN: 'Invalid or expired refresh token',
  USER_NO_LONGER_EXISTS: 'User no longer exists',

  // UUID
  USER_ID_MUST_BE_UUID: 'User Id must be uuid',
  CLASS_ID_MUST_BE_UUID: 'Class Id must be uuid',
  SCHEDULE_ID_MUST_BE_UUID: 'Schedule Id must be uuid',
  SESSION_ID_MUST_BE_UUID: 'Session Id must be uuid',
  CURRICULUM_ID_MUST_BE_UUID: 'curriculumId must be a valid UUID',
  CHAPTER_ID_MUST_BE_UUID: 'chapterId must be a valid UUID',
  LESSON_ID_INVALID: 'Invalid lesson id',
  CHAPTER_ID_INVALID: 'Invalid chapter id',
  CURRICULUM_ID_INVALID: 'Invalid curriculum id',
  TUTOR_ID_MUST_BE_UUID: 'Tutor Id must be uuid',
  ID_MUST_BE_UUID: 'id must be uuid',
  TUTOR_ID_INVALID: 'tutorId must be uuid',
  CLASS_ID_INVALID: 'classId must be uuid',

  // Class
  CLASS_NAME_EXISTS: 'Name class is exist',
  CLASS_CODE_EXISTS: 'Code class is exist',
  CLASS_NOT_FOUND: 'Class not found',
  USER_NOT_EXIST: 'User not exist',
  TUTOR_NOT_FOUND: 'Tutor not found',
  STUDENT_NOT_FOUND: 'Student not found',
  UNABLE_TO_GENERATE_UNIQUE_CODE: 'Unable to generate unique code, please try again',

  // Curriculum
  CURRICULUM_NOT_FOUND: 'Curriculum not found',

  // Chapter
  CHAPTER_NOT_FOUND: 'Chapter not found',

  // Lesson
  LESSON_NOT_FOUND: 'Lesson not found',
  UPLOAD_THEORY_FAILED: 'Upload theory failed',
  UPLOAD_EXERCISES_FAILED: 'Upload exercises failed',

  // Exercise
  EXERCISE_NOT_FOUND: 'Exercise not found',
  EXERCISE_ALREADY_SUBMITTED: 'Exercise already submitted for this session',
  EXERCISE_ALREADY_GRADED: 'Exercise already graded — cannot re-submit',
  EXERCISE_SUBMIT_NOT_ALLOWED: 'You cannot submit this exercise',
  EXERCISE_RE_SUBMIT_NOT_ALLOWED: 'You can only re-submit your own exercise',
  EXERCISE_GRADE_NOT_ALLOWED: 'Only the assigned tutor can grade this exercise',

  // Session
  SESSION_NOT_FOUND: 'Session not found',

  // Schedule
  SCHEDULE_NOT_FOUND: 'Schedule not found',

  // Notification
  NOTIFICATION_NOT_FOUND: 'Notification not found',
  USER_ID_NOT_VALID: 'UserId not valid',
  CLASS_ID_NOT_VALID: 'classId not valid',
  STUDENT_ID_NOT_VALID: 'studentId not valid',

  // Tuition
  TUITION_RECORD_NOT_FOUND: 'Tuition record not found',

  // User
  UNSUPPORTED_FIELD: 'Unsupported field',
  GRADE_NOT_FOUND: 'Grade not found',
  INVALID_GRADE_IDS: 'One or more grade IDs are invalid',
  CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',
  UNABLE_TO_GENERATE_USERNAME: 'Cannot generate unique username',
  UNABLE_TO_GENERATE_USER_CODE: 'Cannot generate a unique user code after 5 attempts',

  // Admin
  ADMIN_INVALID_ID: 'Invalid id',

  // Upload
  KEY_QUERY_PARAM_REQUIRED: 'key query param is required',
  FILE_NOT_FOUND: 'File not found',
  CLOUDFLARE_R2_NOT_CONFIGURED: 'Cloudflare R2 not configured',
  BAD_GATEWAY: 'endpoint|accessKeyId|secretAccessKey not found',

  // Auth guards
  CHECK_ROLE_USER_FAILED: 'Check role user failed',
  UNAUTHORIZED: 'Unauthorized',
  ADMIN_ROLE_REQUIRED: 'Admin role required',
  PERMISSION_DENIED: 'You do not have permission to access this resource',

  // Student
  STUDENT_CODE_EXISTS: 'Student code already exists',

  // Generic
  VALIDATION_FAILED: 'Validation failed',

  // Mail
  MAIL_NOT_CONFIGURED: 'Mail is not configured',
  MAIL_FROM_NOT_SET: 'MAIL_FROM is not set',

  // Google
  GOOGLE_NO_PUBLIC_EMAIL: 'Google account has no public email',

  // Hasher
  FAILED_TO_HASH_DATA: 'Failed to hash data',
  FAILED_TO_VERIFY_DATA: 'Failed to verify data',
};
