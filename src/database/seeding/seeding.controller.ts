import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { skipAuth } from '@shared/helpers/skipAuth';

@ApiTags('Seed')
@skipAuth()
@Controller('seed')
export class SeedingController {
  constructor() {}
}
