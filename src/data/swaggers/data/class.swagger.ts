export const CLASS_SWAGGERS_DATA = {
  CREATE_CLASS_SCHEMA: {
    type: 'object',
    required: ['name', 'subject', 'tutorId', 'startTime', 'endTime'],
    properties: {
      name: { type: 'string', maxLength: 255, example: 'Toan 12 - Co Ban' },
      code: {
        type: 'string',
        maxLength: 50,
        example: 'T12CB',
        description: 'Auto-generated if omitted',
      },
      subject: { type: 'string', maxLength: 255, example: 'Toan' },
      tuition: { type: 'number', minimum: 0, default: 0, example: 1500000 },
      description: { type: 'string', example: 'Lop toan 12 co ban, hoc 2 buoi/tuan' },
      status: { type: 'string', enum: ['OPEN', 'CLOSED', 'UPCOMING'], default: 'OPEN' },
      format: {
        type: 'string',
        enum: ['ONLINE', 'OFFLINE'],
        default: 'ONLINE',
        description: 'Hinh thuc hoc',
      },
      location: {
        type: 'string',
        example: 'https://meet.google.com/abc-defg-hij',
        description: 'Link hoc (ONLINE) hoac dia chi hoc (OFFLINE)',
      },
      startTime: {
        type: 'date',
        example: '2026-07-01T00:00:00.000Z',
        description: 'Thời gian bắt đầu  khóa học',
      },
      endTime: {
        type: 'date',
        example: '2026-10-01T00:00:00.000Z',
        description: 'Thời gian kết thúc khóa học',
      },
      curriculumId: { type: 'string', format: 'uuid', description: 'Optional curriculum ID' },
      tutorId: { type: 'string', format: 'uuid', description: 'Tutor (user) ID' },
      studentIds: {
        type: 'array',
        items: { type: 'string', format: 'uuid' },
        description: 'Optional list of student IDs to enroll',
      },
      parentsIds: {
        type: 'array',
        items: { type: 'string', format: 'uuid' },
        description: 'Optional list of parent IDs linked to the class',
      },
    },
  },
  ADD_STUDENTS_SCHEMA: {
    type: 'object',
    required: ['studentIds'],
    properties: {
      studentIds: {
        type: 'array',
        minItems: 1,
        maxItems: 100,
        items: { type: 'string', format: 'uuid' },
        description: 'One or many student (user) IDs to enroll into this class',
      },
    },
  },
  GET_CLASSES_SCHEMA: [
    { name: 'page', type: 'number', required: false, example: 1 },
    { name: 'limit', type: 'number', required: false, example: 10, maxLength: 100 },
    { name: 'search', type: 'string', required: false, example: '', maxLength: 255 },
  ],
  GET_DETAIL_CLASS: {
    name: 'id',
    type: 'string',
    required: true,
    example: 'df7bc078-24c3-416f-9572-f8e8662113c4',
  },
  DEL_DETAIL_CLASS: {
    name: 'id',
    type: 'string',
    required: true,
    example: 'df7bc078-24c3-416f-9572-f8e8662113c4',
  },
};
