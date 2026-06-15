import { MODULE_METADATA } from '@nestjs/common/constants';
import { AppModule } from 'src/app.module';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from 'src/features/auth/auth.module';
import { CategoryModule } from 'src/features/category/category.module';
import { EmailModule } from 'src/features/email/email.module';
import { MailerModule } from 'src/features/email/mailer/mailer.module';
import { RedisModule } from 'src/features/redis/redis.module';
import { ReportModule } from 'src/features/report/report.module';
import { TransactionModule } from 'src/features/transaction/transaction.module';
import { WalletModule } from 'src/features/wallet/wallet.module';

describe('App module ...', () => {
    test('0. should be app module defined ...', () => {
        expect(AppModule).toBeDefined();
    });

    test('1. should be registers imports ...', () => {
        const imports: unknown[] =
            (Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) as unknown[] | undefined) ?? [];

        expect(imports).toEqual(
            expect.
                arrayContaining([
                    DatabaseModule,
                    MailerModule,
                    RedisModule,
                    CategoryModule,
                    AuthModule,
                    WalletModule,
                    TransactionModule,
                    EmailModule,
                    ReportModule,
                ]),
        );
    });
});
