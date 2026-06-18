import { z } from 'zod';

export const createWalletSchema = z.object({
  name: z
    .string({ message: 'Name wallet must be a string' })
    .min(1, 'Name is required')
    .max(25, 'Name too long'),
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
    .min(0, 'Balance must be greater than 0')
    .default(0),
  note: z.string({ message: 'Note must be a string' }).optional().default(''),
  isDefault: z.boolean({ message: 'Is default must be a boolean' }).optional().default(true),
  isActive: z.boolean({ message: 'Is active must be a boolean' }).optional().default(true),
});

export const getWalletsQuerySchema = z.preprocess(
  (val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const o = val as Record<string, unknown>;
      if (o.pageSize != null && o.limit == null) {
        return { ...o, limit: o.pageSize };
      }
    }
    return val;
  },
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().min(1).optional(),
  }),
);
