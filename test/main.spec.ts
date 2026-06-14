import { Reflector } from '@nestjs/core';

jest.mock('src/app.module', () => ({
  AppModule: class AppModule {},
}));

jest.mock('@nestjs/core', () => ({
  ...jest.requireActual<typeof import('@nestjs/core')>('@nestjs/core'),
  NestFactory: {
    create: jest.fn(),
  },
}));

const mockApp = {
  enableCors: jest.fn(),
  useGlobalInterceptors: jest.fn(),
  useGlobalFilters: jest.fn(),
  listen: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
};

async function runBootstrap() {
  await jest.isolateModulesAsync(async () => {
    // @ts-expect-error - resolved at runtime via jest moduleNameMappe
    await import('src/main');
  });
}

describe('Main bootstrap ...', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockApp.get.mockReturnValue(new Reflector());
    mockApp.listen.mockResolvedValue(undefined);
    const { NestFactory } = await import('@nestjs/core');
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
  });

  test('1. should create app with AppModule', async () => {
    const { NestFactory } = await import('@nestjs/core');
    await runBootstrap();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(NestFactory.create as jest.Mock).toHaveBeenCalledWith(expect.any(Function));
  });

  test('2. should enable CORS with correct options', async () => {
    await runBootstrap();
    expect(mockApp.enableCors).toHaveBeenCalledWith({ origin: true, credentials: true });
  });

  test('3. should register ResponseInterceptor with Reflector', async () => {
    await runBootstrap();
    const calls = mockApp.useGlobalInterceptors.mock.calls.flat();
    expect(calls.some((i: object) => i.constructor.name === 'ResponseInterceptor')).toBe(true);
  });

  test('4. should register ErrorInterceptor and LoggerInterceptor', async () => {
    await runBootstrap();
    const calls = mockApp.useGlobalInterceptors.mock.calls.flat();
    expect(calls.some((i: object) => i.constructor.name === 'ErrorInterceptor')).toBe(true);
    expect(calls.some((i: object) => i.constructor.name === 'LoggerInterceptor')).toBe(true);
  });

  test('5. should register HttpExceptionFilter', async () => {
    await runBootstrap();
    const calls = mockApp.useGlobalFilters.mock.calls.flat();
    expect(calls.some((i: object) => i.constructor.name === 'HttpExceptionFilter')).toBe(true);
  });

  test('6. should listen on PORT env variable when set', async () => {
    process.env.PORT = '3000';
    await runBootstrap();
    expect(mockApp.listen).toHaveBeenCalledWith('3000');
    delete process.env.PORT;
  });

  test('7. should listen on default port 8888 when PORT is not set', async () => {
    const original = process.env.PORT;
    delete process.env.PORT;
    await runBootstrap();
    expect(mockApp.listen).toHaveBeenCalledWith(8888);
    process.env.PORT = original;
  });
});
