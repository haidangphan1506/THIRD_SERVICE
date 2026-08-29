import z from 'zod';

export const upsertAttendanceSchema = z.object({
  sessionId: z
    .string({ message: 'sessionId must be string' })
    .uuid({ message: 'sessionId must be uuid' }),
  studentId: z
    .string({ message: 'studentId must be string' })
    .uuid({ message: 'studentId must be uuid' }),
  present: z.boolean({ message: 'present must be boolean' }),
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional().nullable(),
});
