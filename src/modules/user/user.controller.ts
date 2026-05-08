import { Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import UserService from './user.service';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate the authenticated user account' })
  @ApiResponse({ status: HttpStatus.OK, description: SYS_MSG.ACCOUNT_DEACTIVATED_SUCCESSFULLY })
  async deactivate(@Req() request: Request) {
    const user = request['user'] as { id: string };
    return this.userService.deactivateUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: HttpStatus.OK, description: SYS_MSG.REQUEST_SUCCESSFUL })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: SYS_MSG.USER_NOT_FOUND })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.userService.getUserById(id);
    return {
      status_code: HttpStatus.OK,
      message: SYS_MSG.REQUEST_SUCCESSFUL,
      data: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        country: user.country,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
        is_verified: user.is_verified,
        created_at: user.created_at,
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete the authenticated user account' })
  @ApiResponse({ status: HttpStatus.OK, description: SYS_MSG.USER_DELETED })
  async softDelete(@Param('id', ParseUUIDPipe) id: string, @Req() request: Request) {
    const requester = request['user'] as { id: string };
    return this.userService.softDeleteUser(id, requester.id);
  }
}
