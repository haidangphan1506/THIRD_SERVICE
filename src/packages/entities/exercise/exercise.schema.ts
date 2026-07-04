import z from 'zod';

const fileUrlSchema = z.object({
  name: z.string(),
  url: z.string(),
  key: z.string(),
});

export const createExerciseSchema = z.object({
  tutorId: z
    .string({
      message: 'tutorId must be string ...',
    })
    .uuid({
      message: 'tutorId must be uuid ...',
    }),
  sessionId: z.string().uuid({ message: 'Session id must be uuid' }).optional().nullable(),
  lessonId: z.string().uuid({ message: 'Lesson id must be uuid' }).optional().nullable(),
  studentId: z
    .string({
      message: 'studentId id must be string ...',
    })
    .uuid({
      message: 'studentId Id must be uuid ...',
    }),
  issueUrls: z.array(fileUrlSchema).optional().nullable(),
  exerciseUrls: z.array(fileUrlSchema).optional().nullable(),
});

export const getExerciseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sessionId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
});
