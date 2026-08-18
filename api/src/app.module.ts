import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsuariosModule } from './usuarios/usuarios.module';
import { AtividadesModule } from './atividades/atividades.module';
import { CatalogoModule } from './catalogo/catalogo.module';
import { ConfiguracoesModule } from './configuracoes/configuracoes.module';
import { OrganizacoesModule } from './organizacoes/organizacoes.module';
import { PlanosModule } from './planos/planos.module';
import { LogsModule } from './logs/logs.module';

// Entidades
import { Usuario } from './usuarios/usuario.entity';
import { HistoricoPontos } from './usuarios/historico-pontos.entity';
import { Atividade } from './atividades/atividade.entity';
import { Produto } from './catalogo/produto.entity';
import { Categoria } from './catalogo/categoria.entity';
import { Troca } from './catalogo/troca.entity';
import { Configuracao } from './configuracoes/configuracao.entity';
import { Organizacao } from './organizacoes/organizacao.entity';
import { Plano } from './planos/plano.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host:
          configService.get<string>('DATABASE_HOST') ||
          configService.get<string>('TYPEORM_HOST') ||
          '127.0.0.1',
        port: Number(
          configService.get<number>('DATABASE_PORT') ||
            configService.get<number>('TYPEORM_PORT') ||
            3306,
        ),
        username:
          configService.get<string>('DATABASE_USER') ||
          configService.get<string>('TYPEORM_USERNAME') ||
          'root',
        password:
          configService.get<string>('DATABASE_PASSWORD') ||
          configService.get<string>('TYPEORM_PASSWORD') ||
          '',
        database:
          configService.get<string>('DATABASE_NAME') ||
          configService.get<string>('TYPEORM_DATABASE') ||
          'u943276235_vantago',
        entities: [
          Usuario,
          Atividade,
          Produto,
          Troca,
          Categoria,
          HistoricoPontos,
          Configuracao,
          Organizacao,
          Plano,
        ],
        synchronize: true, // Cria e atualiza as tabelas no MySQL automaticamente
        retryAttempts: 10,  // Tenta reconectar 10 vezes para evitar crash no startup
        retryDelay: 3000,   // Aguarda 3s entre tentativas
        ssl: false,         // Desativa exigencia de SSL para conexoes locais 127.0.0.1 na Hostinger
      }),
    }),
    UsuariosModule,
    AtividadesModule,
    CatalogoModule,
    ConfiguracoesModule,
    OrganizacoesModule,
    PlanosModule,
    LogsModule,
  ],
})
export class AppModule {}