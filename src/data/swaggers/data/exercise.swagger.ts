const FILE_URL_ITEMS = {
  type: 'array',
  description: 'Danh sach tep (name/url/key)',
  items: {
    type: 'object',
    required: ['name', 'url', 'key'],
    properties: {
      name: { type: 'string', example: 'baitap.pdf' },
      url: { type: 'string', example: 'https://cdn.example.com/baitap.pdf' },
      key: { type: 'string', example: 'uploads/baitap.pdf' },
    },
  },
};

export const EXERCISE_SWAGGERS_DATA = {
  CREATE_EXERCISE_SCHEMA: {
    type: 'object',
    required: ['tutorId', 'studentId'],
    properties: {
      tutorId: { type: 'string', format: 'uuid', description: 'Tutor phu trach' },
      studentId: { type: 'string', format: 'uuid', description: 'Hoc sinh nop bai' },
      sessionId: {
        type: 'string',
        format: 'uuid',
        nullable: true,
        description: 'Buoi hoc lien quan',
      },
      lessonId: {
        type: 'string',
        format: 'uuid',
        nullable: true,
        description: 'Bai hoc lien quan',
      },
      issueUrls: FILE_URL_ITEMS,
      exerciseUrls: FILE_URL_ITEMS,
      status: {
        type: 'string',
        enum: ['SUBMITTED', 'GRADED', 'RESUBMIT'],
        default: 'SUBMITTED',
        description: 'Trang thai bai nop',
      },
    },
  },
  SUBMIT_EXERCISE_SCHEMA: {
    type: 'object',
    required: ['exerciseUrls'],
    properties: {
      exerciseUrls: FILE_URL_ITEMS,
    },
  },
  GRADE_EXERCISE_SCHEMA: {
    type: 'object',
    required: ['score'],
    properties: {
      score: { type: 'number', example: 8.5, minimum: 0, maximum: 10, description: 'Diem (0-10)' },
      comment: { type: 'string', nullable: true, description: 'Nhan xet cua gia su' },
    },
  },
};
