import 'reflect-metadata';
import { IS_PUBLIC_KEY, Public } from '@packages/decorators';

describe('public decorator ...', () => {
  test('1. should be set public decorator ...', () => {
    class TestControler {
      @Public()
      test(this: void) {}
    }

    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestControler.prototype.test) as boolean;

    expect(metadata).toBe(true);
  });

  test('1. should be set public decorator ...', () => {
    class TestControler {
      test(this: void) {}
    }

    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestControler.prototype.test) as boolean;

    expect(metadata).toBe(undefined);
  });
});
