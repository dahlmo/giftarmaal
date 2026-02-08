import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { PrismaService } from "./prisma";
import { EventsService } from "./events.service";

@Controller("api/posts")
export class PostsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  @Get()
  async list(@Query("limit") limit = "20") {
    const take = Math.min(Number(limit) || 20, 100);
    const posts = await this.prisma.post.findMany({
      orderBy: { id: "desc" },
      take,
    });
    return { posts };
  }

  @Post()
  async create(@Body() body: { text: string }) {
    if (!body.text || body.text.length > 280)
      return { error: "Text required, max 280 chars" } as any;
    const post = await this.prisma.post.create({ data: { text: body.text } });
    this.events.emit("post:created", { id: post.id });
    return { post };
  }
}
