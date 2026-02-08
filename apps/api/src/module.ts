import { Module } from '@nestjs/common';
import { AppController } from './routes';
import { PrismaService } from './prisma';
import { ProgramController } from './program.controller';
import { ContactController } from './contact.controller';
import { PostsController } from './posts.controller';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  controllers: [AppController, ProgramController, ContactController, PostsController, EventsController],
  providers: [PrismaService, EventsService]
})
export class AppModule {}
