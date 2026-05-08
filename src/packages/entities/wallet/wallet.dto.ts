import { z } from 'zod';
import { createWalletSchema } from './wallet.schema';

export type CreateWalletDto = {
  userId: string;
  name: string;
  type: 'CASH' | 'BANK' | 'E_WALLET' | 'CREDIT';
  currency: string;
  categoriesId: string[];
  balance: number;
  note?: string;
  isDefault?: boolean;
  isActive?: boolean;
};

export const updateWalletSchema = createWalletSchema.partial();
export type UpdateWalletDto = z.infer<typeof updateWalletSchema>;
