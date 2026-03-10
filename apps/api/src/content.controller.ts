import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  NotFoundException,
  UseGuards,
} from "@nestjs/common";
import { PrismaService } from "./prisma";
import { EventsService } from "./events.service";
import { SpouseGuard } from "./spouse.guard";

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
  @UseGuards(SpouseGuard)
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
