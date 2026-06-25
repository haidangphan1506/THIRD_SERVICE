import { z } from 'zod';
import { createNotificationSchema, getNotificationsQuerySchema } from './notification.schema';

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;
export type GetNotificationsQueryDto = z.infer<typeof getNotificationsQuerySchema>;
