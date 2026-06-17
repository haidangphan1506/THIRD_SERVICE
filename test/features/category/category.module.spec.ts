import { MODULE_METADATA } from '@nestjs/common/constants';
import { CategoryController } from 'src/features/category/category.controller';
import { CategoryModule } from 'src/features/category/category.module';
import { CategoryRepository } from 'src/features/category/category.repository';
import { CategoryService } from 'src/features/category/category.service';

describe('Category module ...', () => {
  test('0. should be module can defined ...', () => {
    expect(CategoryModule).toBeDefined();
  });

  test('1. should be registers all imports ...', () => {
    const imports: unknown[] =
      (Reflect.getMetadata(MODULE_METADATA.IMPORTS, CategoryModule) as unknown[] | undefined) ?? [];
    expect(imports).toEqual(expect.arrayContaining([]));
  });

  test('2. should be register controller ...', () => {
    const controllers: unknown[] =
      (Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, CategoryModule) as unknown[] | undefined) ??
      [];

    expect(controllers).toContain(CategoryController);
  });

  it('should register provider', () => {
    const providers =
      (Reflect.getMetadata(MODULE_METADATA.PROVIDERS, CategoryModule) as unknown[] | undefined) ??
      [];

    expect(providers).toContain(CategoryService);
    expect(providers).toContain(CategoryRepository);
  });

  it('should export AuthService', () => {
    const exportsMetadata =
      (Reflect.getMetadata(MODULE_METADATA.EXPORTS, CategoryModule) as unknown[] | undefined) ?? [];

    expect(exportsMetadata).toContain(CategoryService);
  });
});
