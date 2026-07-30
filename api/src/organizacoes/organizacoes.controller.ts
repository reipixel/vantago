import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrganizacoesService } from './organizacoes.service';

@Controller('organizacoes')
export class OrganizacoesController {
  constructor(private readonly orgService: OrganizacoesService) {}

  @Get()
  listarTodas() { return this.orgService.findAll(); }

  @Post()
  criar(@Body() dados: any) { return this.orgService.create(dados); }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dados: any) { 
    return this.orgService.update(+id, dados); 
  }

  @Delete(':id')
  remover(@Param('id') id: string) { return this.orgService.delete(+id); }
}