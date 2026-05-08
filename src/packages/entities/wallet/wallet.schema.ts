import { z } from 'zod';

export const createWalletSchema = z.object({
  userId: z.uuid({ message: 'User ID must be a valid UUID' }),
  name: z
    .string({ message: 'Name wallet must be a string' })
    .min(1, 'Name is required')
    .max(100, 'Name too long'),
  type: z
    .enum(['CASH', 'BANK', 'E_WALLET', 'CREDIT'], {
      message: 'Type wallet must be a valid type',
    })
    .default('CASH'),
  currency: z
    .string({ message: 'Currency must be a string' })
    .min(3, 'Currency is required')
    .max(3, 'Currency too long')
    .default('VND'),
  categoriesId: z
    .array(z.string().uuid({ message: 'Categories ID must be a valid UUID' }), {
      message: 'Categories ID must be an array of valid UUIDs',
    })
    .default([]),
  balance: z.coerce
    .number({ message: 'Balance must be a number' })
    .min(0, 'Balance must be greater than 0'),
  note: z.string({ message: 'Note must be a string' }).optional(),
  isDefault: z.boolean({ message: 'Is default must be a boolean' }).optional(),
  isActive: z.boolean({ message: 'Is active must be a boolean' }).optional(),
});
