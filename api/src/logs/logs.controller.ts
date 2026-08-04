import { Controller, Get, Query, Headers } from '@nestjs/common';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  obterLogs(
    @Query('liga') slugQuery?: string,
    @Headers('x-organization-slug') slugHeader?: string
  ) {
    const slugLiga = slugHeader || slugQuery;
    return this.logsService.obterLogsGerais(slugLiga);
  }
}