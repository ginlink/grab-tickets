import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// 加入环境变量
dotenv.config();

const port = 6030;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 开启跨域
  app.enableCors();

  await app.listen(port);
  console.log(`[app is running, http://localhost:${port}]`);
}
bootstrap();
