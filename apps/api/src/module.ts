import { Module } from '@nestjs/common';
import { AppController } from './routes';
import { PrismaService } from './prisma';
import { AgendaController } from './agenda.controller';
import { PostsController } from './posts.controller';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  controllers: [AppController, AgendaController, PostsController, EventsController],
  providers: [PrismaService, EventsService]
})
export class AppModule {}
