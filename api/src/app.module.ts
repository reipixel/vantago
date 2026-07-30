import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'liga_associados',
      entities: [
        Usuario, 
        Atividade, 
        Produto, 
        Troca, 
        Categoria, 
        HistoricoPontos, 
        Configuracao, 
        Organizacao, 
        Plano
      ], 
      synchronize: true, 
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