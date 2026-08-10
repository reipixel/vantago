import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS completo para aceitar requisições do Front-end
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // A Hostinger injeta a porta em process.env.PORT. Se nao houver, usa 3000.
  const port = process.env.PORT || 3000;
  
  // Escutar em '0.0.0.0' eh obrigatorio para servidores web/proxy reverso
  await app.listen(port, '0.0.0.0');
  console.log(`API Vantago ativa e escutando na porta ${port}`);
}
bootstrap();