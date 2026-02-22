import { Module } from "@nestjs/common";
import { AppController } from "./routes";
import { PrismaService } from "./prisma";
import { ContentController } from "./content.controller";
import { PostsController } from "./posts.controller";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";

import { PersonsController } from './persons.controller';

@Module({
  controllers: [
    AppController,
    ContentController,
    PostsController,
    EventsController,
    PersonsController,
  ],
  providers: [PrismaService, EventsService],
})
export class AppModule {}
