import { Controller, Get, Patch, Param, Body, Query, Headers } from '@nestjs/common';
import { ConfiguracoesService } from './configuracoes.service';

@Controller('configuracoes')
export class ConfiguracoesController {
  constructor(private readonly configService: ConfiguracoesService) {}

  @Get(':id')
  buscar(
    @Param('id') id: string,
    @Query('liga') slugQuery: string,
    @Headers('x-organization-slug') slugHeader: string
  ) {
    const slugLiga = slugHeader || slugQuery;
    return this.configService.findOne(+id, slugLiga);
  }

  @Patch(':id')
  atualizar(
    @Param('id') id: string, 
    @Body() dados: any,
    @Query('liga') slugQuery: string,
    @Headers('x-organization-slug') slugHeader: string
  ) {
    const slugLiga = slugHeader || slugQuery;
    return this.configService.update(+id, dados, slugLiga);
  }
}