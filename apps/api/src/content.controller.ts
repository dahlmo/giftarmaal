import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "./prisma";
import { EventsService } from "./events.service";

@Controller("api/content")
export class ContentController {
  constructor(
    private prisma: PrismaService,
    private events: EventsService,
  ) {}

  @Get(":slug")
  async get(@Param("slug") slug: string) {
    const block = await this.prisma.contentBlock.findUnique({
      where: { slug },
    });
    if (!block) throw new NotFoundException("Content section not found");
    return block;
  }

  @Put(":slug")
  async set(
    @Param("slug") slug: string,
    @Body() body: { title?: string; data: any },
  ) {
    const updated = await this.prisma.contentBlock.upsert({
      where: { slug },
      update: {
        title: body.title ?? slug,
        data: body.data,
      },
      create: {
        slug,
        title: body.title ?? slug,
        data: body.data,
      },
    });
    this.events.emit("content-updated", { slug });
    return updated;
  }
}
