import { z } from 'zod';

export const notificationTypeEnum = z.enum(['SYSTEM', 'TUITION', 'STUDENT', 'TUTOR']);

export const createNotificationSchema = z.object({
  type: notificationTypeEnum,
  subtype: z.string().max(50).optional(),
  title: z
    .string({ message: 'Title is required' })
    .min(1, 'Title is required')
    .max(255, 'Title too long'),
  content: z.string().optional(),
  userId: z.string().uuid().optional().nullable(),
  classId: z.string().uuid().optional().nullable(),
  studentId: z.string().uuid().optional().nullable(),
});

export const getNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: notificationTypeEnum.optional(),
  userId: z.string().uuid().optional(),
  isRead: z.coerce.boolean().optional(),
});
