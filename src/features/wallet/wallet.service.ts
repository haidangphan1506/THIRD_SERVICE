import { Inject, Injectable, Logger } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/singlestore';
import { DRIZZLE } from 'src/database/database.module';

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);
    constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}
}
