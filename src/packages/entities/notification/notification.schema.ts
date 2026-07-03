import { z } from 'zod';

export const notificationTypeEnum = z.enum(['SYSTEM', 'TUITION', 'STUDENT', 'TUTOR']);
export const notificationActionEnum = z.enum(['VIEW', 'CONTACT', 'PAYMENT', 'UPDATE']);

export const createNotificationSchema = z.object({
  type: notificationTypeEnum,
  title: z
    .string({ message: 'Title is required' })
    .min(1, 'Title is required')
    .max(255, 'Title too long'),
  senderId: z.string().uuid('senderId must be uuid ...').optional().nullable(),
  content: z.string({ message: 'Content must be string ...' }),
  subContent: z.string({ message: 'subContent must be string ...' }).max(255).optional(),
  userId: z.string().uuid('userId must be uuid ...').optional().nullable(),
  classId: z.string().uuid('classId must be uuid ...').optional().nullable(),
  studentId: z.string().uuid('studentId must be uuid ...').optional().nullable(),
  redirectUrl: z.string().max(500).optional(),
  actionLabel: z.string().max(100).optional(),
  actionType: notificationActionEnum.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const getNotificationsQuerySchema = z.object({
  type: notificationTypeEnum.optional(),
  isRead: z.coerce.boolean().optional(),
});
