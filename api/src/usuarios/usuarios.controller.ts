import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Delete, 
  Param, 
  Patch, 
  BadRequestException,
  UseInterceptors, 
  UploadedFile,
  Query,    
  Headers  
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('login-admin')
  async loginAdmin(@Body() credenciais: any) {
    return this.usuariosService.validarLoginAdmin(credenciais.identificador, credenciais.senha);
  }

  @Post('login-associado')
  async loginAssociado(
    @Body() body: any, 
    @Query('liga') slugQuery: string,
    @Headers('x-organization-slug') slugHeader: string
  ) {
    const slugLiga = slugHeader || slugQuery;
    
    // Aceita tanto body.email quanto body.identificador / body.login
    const identificador = body.email || body.identificador || body.login;

    return this.usuariosService.validarLoginAssociado(
      identificador, 
      body.senha, 
      slugLiga
    );
  }

  // ROTA CRÍTICA: Busca os administradores do Super Admin
  // Deve estar declarada ANTES de @Get(':id') para evitar capturar a palavra "admins" como parâmetro :id
  @Get('admins')
  async buscarAdmins() {
    return this.usuariosService.findAdmins();
  }

  // Listagem geral de associados com filtros multi-tenant
  @Get()
  async listarAssociados(
    @Query('liga') slugQuery: string,
    @Headers('x-organization-slug') slugHeader: string 
  ) {
    const slugLiga = slugHeader || slugQuery;
    return this.usuariosService.findAssociados(slugLiga);
  }

  // --- ROTAS DINÂMICAS COM PARÂMETROS (:id) ---

  @Get(':id')
  buscarUm(@Param('id') id: string) {
    const idNumerico = Number(id);
    if (isNaN(idNumerico)) {
      throw new BadRequestException('O ID informado deve ser um número válido.');
    }
    return this.usuariosService.findOne(idNumerico);
  }

  @Post()
  criarNovo(
    @Body() dados: any,
    @Query('liga') slugQuery: string,
    @Headers('x-organization-slug') slugHeader: string
  ) {
    const slugLiga = slugHeader || slugQuery;
    return this.usuariosService.create(dados, slugLiga);
  }

  @Post(':id/pontos')
  async ajustarPontos(
    @Param('id') id: string,
    @Body() corpo: any
  ) {
    const idNumerico = Number(id);
    const valor = Number(corpo.valor);
    const motivo = corpo.motivo;
    
    if (isNaN(idNumerico) || isNaN(valor)) {
      throw new BadRequestException('ID e valor devem ser numéricos.');
    }
    
    if (!motivo) {
      throw new BadRequestException('O motivo é obrigatório.');
    }

    return this.usuariosService.ajustarPontos(idNumerico, valor, motivo);
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dados: any) {
    const idNumerico = Number(id);
    if (isNaN(idNumerico)) throw new BadRequestException('ID inválido.');
    return this.usuariosService.update(idNumerico, dados);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    const idNumerico = Number(id);
    if (isNaN(idNumerico)) throw new BadRequestException('ID inválido.');
    return this.usuariosService.remove(idNumerico);
  }

  @Get(':id/historico')
  async verHistorico(@Param('id') id: string) {
    const idNumerico = Number(id);
    if (isNaN(idNumerico)) throw new BadRequestException('ID inválido.');
    return this.usuariosService.processarHistorico(idNumerico);
  }

  @Get(':id/extrato-completo')
  async verExtratoCompleto(@Param('id') id: string) {
    const idNumerico = Number(id);
    if (isNaN(idNumerico)) throw new BadRequestException('ID inválido.');
    return this.usuariosService.consultarHistoricoCompleto(idNumerico);
  }

  @Patch(':id/perfil')
  @UseInterceptors(FileInterceptor('foto'))
  async atualizarPerfil(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dados: any
  ) {
    const idNumerico = Number(id);
    if (isNaN(idNumerico)) throw new BadRequestException('ID inválido.');
    return this.usuariosService.atualizarPerfilComFoto(idNumerico, dados, file);
  }
}