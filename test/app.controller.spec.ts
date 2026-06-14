import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';

describe('App Controller ...', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  describe('get Hello ...', () => {
    test('1. should be return data from service return ...', () => {
      jest.spyOn(appService, 'getHello').mockReturnValue('Hello World!');
      const result = appController.getHello();
      expect(result).toBe('Hello World!');
    });
  });
});
