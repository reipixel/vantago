import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();

  // Exemplo se estiver usando prefixo global:
  // app.setGlobalPrefix('api', { exclude: ['/'] });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Aplicação rodando na porta: ${port}`);
}
bootstrap();