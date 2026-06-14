import { AppService } from 'src/app.service';

describe('App Service ...', () => {
  let appService: AppService;

  beforeEach(() => {
    appService = new AppService();
  });

  describe('getHello ...', () => {
    test('1. should return "Hello World!"', () => {
      const result = appService.getHello();
      expect(result).toBe('Hello World!');
    });
  });
});
