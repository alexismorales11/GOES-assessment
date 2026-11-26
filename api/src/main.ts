import { NestFactory } from '@nestjs/core';
import { loadEnv } from './config/load-env.js';

loadEnv();

async function bootstrap() {
  // Import dinámico: los módulos se evalúan después de cargar el .env.
  const { AppModule } = await import('./app.module.js');
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
