import { Module } from '@nestjs/common';
import { AppController } from './routes';
import { PrismaService } from './prisma';

@Module({
  controllers: [AppController],
  providers: [PrismaService]
})
export class AppModule {}
