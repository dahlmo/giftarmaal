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
import { AdminGuard } from "./admin.guard";

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
  @UseGuards(AdminGuard)
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

    if (slug === "program") {
      await this.syncProgramEntries(body.data);
    }

    this.events.emit("content-updated", { slug });
    return updated;
  }

  private async syncProgramEntries(data: any) {
    const blocks: any[] = data?.blocks ?? [];
    for (const block of blocks) {
      if (block?.type !== "agenda") continue;
      for (const item of block?.data?.items ?? []) {
        if (!item?.bookable) continue;
        const entrySlug = `${item.date}_${item.time}`;
        await this.prisma.programEntry.upsert({
          where: { slug: entrySlug },
          update: {
            bookableFrom: item.bookableFrom ? new Date(item.bookableFrom) : null,
            bookableTo: item.bookableTo ? new Date(item.bookableTo) : null,
            bookableSlots: item.bookableSlots ?? null,
          },
          create: {
            slug: entrySlug,
            bookableFrom: item.bookableFrom ? new Date(item.bookableFrom) : null,
            bookableTo: item.bookableTo ? new Date(item.bookableTo) : null,
            bookableSlots: item.bookableSlots ?? null,
          },
        });
      }
    }
  }
}
