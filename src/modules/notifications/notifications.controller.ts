import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { NotificationsService } from './notifications.service';

@ApiBearerAuth()
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated user's notifications" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: SYS_MSG.REQUEST_SUCCESSFUL })
  async list(
    @Req() request: Request,
    @Query('page') page: string,
    @Query('limit') limit: string
  ) {
    const user = request['user'] as { id: string };
    return this.notificationsService.listForUser(user.id, Number(page) || 1, Number(limit) || 10);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: HttpStatus.OK, description: SYS_MSG.REQUEST_SUCCESSFUL })
  async markRead(@Param('id', ParseUUIDPipe) id: string, @Req() request: Request) {
    const user = request['user'] as { id: string };
    return this.notificationsService.markRead(id, user.id);
  }
}
