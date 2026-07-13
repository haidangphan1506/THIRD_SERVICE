const SCHEDULE_ITEM_PROPERTIES = {
  dayOfWeek: {
    type: 'string',
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    example: 'MONDAY',
  },
  startTime: { type: 'string', example: '18:00', description: 'Gio bat dau (HH:mm)' },
  endTime: { type: 'string', example: '20:00', description: 'Gio ket thuc (HH:mm)' },
  format: {
    type: 'string',
    enum: ['ONLINE', 'OFFLINE'],
    default: 'ONLINE',
    description: 'Hinh thuc buoi hoc',
  },
  location: {
    type: 'string',
    example: 'https://meet.google.com/abc-defg-hij',
    description: 'Link hoc (ONLINE) hoac dia chi hoc (OFFLINE)',
  },
};

export const SCHEDULE_SWAGGERS_DATA = {
  CREATE_SCHEDULE_SCHEMA: {
    type: 'object',
    required: ['classId', 'dayOfWeek', 'startTime', 'endTime'],
    properties: {
      classId: { type: 'string', format: 'uuid', description: 'Class (lop hoc) ID' },
      ...SCHEDULE_ITEM_PROPERTIES,
    },
  },
  CREATE_SCHEDULES_SCHEMA: {
    type: 'object',
    required: ['classId', 'schedules'],
    properties: {
      classId: { type: 'string', format: 'uuid', description: 'Class (lop hoc) ID' },
      schedules: {
        type: 'array',
        minItems: 1,
        maxItems: 7,
        description: 'Danh sach 1-7 lich hoc hang tuan',
        items: {
          type: 'object',
          required: ['dayOfWeek', 'startTime', 'endTime'],
          properties: SCHEDULE_ITEM_PROPERTIES,
        },
      },
    },
  },
  UPDATE_SCHEDULE_SCHEMA: {
    type: 'object',
    properties: SCHEDULE_ITEM_PROPERTIES,
  },
};
