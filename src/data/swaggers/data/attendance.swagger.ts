export const ATTENDANCE_SWAGGERS_DATA = {
  UPSERT_ATTENDANCE_SCHEMA: {
    type: 'object',
    required: ['sessionId', 'studentId', 'present'],
    properties: {
      sessionId: { type: 'string', format: 'uuid', description: 'Buoi hoc (class session) ID' },
      studentId: { type: 'string', format: 'uuid', description: 'Hoc sinh duoc diem danh' },
      present: { type: 'boolean', description: 'Co mat hay khong' },
      note: { type: 'string', nullable: true, description: 'Ghi chu (vd: ly do vang)' },
    },
  },
};
