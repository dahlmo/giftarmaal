import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma';

@Controller('api')
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get('message')
  async getMessage() {
    const row = await this.prisma.message.findFirst();
    return { message: row?.text ?? 'No db row found' };
  }
}
