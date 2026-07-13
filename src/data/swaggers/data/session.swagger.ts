const SESSION_ITEM_PROPERTIES = {
  lessonId: {
    type: 'string',
    format: 'uuid',
    nullable: true,
    description: 'Lesson (bai hoc) ID',
  },
  tutorId: {
    type: 'string',
    format: 'uuid',
    nullable: true,
    description: 'Tutor phu trach buoi hoc',
  },
  title: { type: 'string', example: 'Buoi 1: Gioi thieu', description: 'Tieu de buoi hoc' },
  description: { type: 'string', description: 'Mo ta buoi hoc' },
  sessionNumber: { type: 'number', example: 1, description: 'Thu tu buoi hoc trong lop' },
  theoryUrls: {
    type: 'array',
    description: 'Tai lieu ly thuyet',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        url: { type: 'string' },
        key: { type: 'string' },
      },
    },
  },
  exerciseUrls: {
    type: 'array',
    description: 'Tai lieu bai tap',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        url: { type: 'string' },
        key: { type: 'string' },
      },
    },
  },
  startAt: { type: 'string', format: 'date-time', description: 'Thoi gian bat dau (du kien)' },
  endAt: { type: 'string', format: 'date-time', description: 'Thoi gian ket thuc (du kien)' },
  location: {
    type: 'string',
    example: 'https://meet.google.com/abc-defg-hij',
    description: 'Link hoc (ONLINE) hoac dia chi hoc (OFFLINE)',
  },
  status: {
    type: 'string',
    enum: ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED'],
    default: 'SCHEDULED',
    description: 'Trang thai buoi hoc',
  },
  note: { type: 'string', description: 'Ghi chu buoi hoc' },
  actualStartAt: {
    type: 'string',
    format: 'date-time',
    nullable: true,
    description: 'Thoi gian bat dau thuc te',
  },
  actualEndAt: {
    type: 'string',
    format: 'date-time',
    nullable: true,
    description: 'Thoi gian ket thuc thuc te',
  },
};

export const SESSION_SWAGGERS_DATA = {
  CREATE_SESSION_SCHEMA: {
    type: 'object',
    required: ['classId', 'sessionNumber', 'startAt', 'endAt'],
    properties: {
      classId: { type: 'string', format: 'uuid', description: 'Class (lop hoc) ID' },
      ...SESSION_ITEM_PROPERTIES,
    },
  },
  CREATE_SESSIONS_SCHEMA: {
    type: 'object',
    required: ['classId', 'sessions'],
    properties: {
      classId: { type: 'string', format: 'uuid', description: 'Class (lop hoc) ID' },
      sessions: {
        type: 'array',
        minItems: 1,
        maxItems: 50,
        description: 'Danh sach cac buoi hoc',
        items: {
          type: 'object',
          required: ['sessionNumber', 'startAt', 'endAt'],
          properties: SESSION_ITEM_PROPERTIES,
        },
      },
    },
  },
  UPDATE_SESSION_SCHEMA: {
    type: 'object',
    properties: SESSION_ITEM_PROPERTIES,
  },
};
