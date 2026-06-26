import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "./prisma";
import { EventsService } from "./events.service";
import { AdminGuard } from "./admin.guard";

const ALLOWED_EMOJIS = new Set(["❤️", "👍", "👎", "🎉"]);

@Controller("api/posts")
export class PostsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  @Get()
  async list(@Req() req: Request, @Query("limit") limit = "20") {
    const code = (req as any).invitationCode as string | undefined;
    const take = Math.min(Number(limit) || 20, 100);

    const posts = await this.prisma.post.findMany({
      orderBy: { id: "desc" },
      take,
      include: { reactions: true, views: true },
    });

    // Batch-fetch viewer friendly names — only friendlyName, no other PII
    type RawView = { invitationCode: string };
    const allCodes = [
      ...new Set(
        posts.flatMap((p) =>
          ((p as any).views as RawView[]).map((v) => v.invitationCode),
        ),
      ),
    ];
    const codeToNames = new Map<string, string[]>();
    if (allCodes.length) {
      const persons = await this.prisma.person.findMany({
        where: { invitationCode: { in: allCodes } },
        select: { invitationCode: true, friendlyName: true },
      });
      for (const person of persons) {
        if (person.invitationCode) {
          const list = codeToNames.get(person.invitationCode) ?? [];
          list.push(person.friendlyName);
          codeToNames.set(person.invitationCode, list);
        }
      }
    }

    return {
      posts: posts.map((p) => {
        const reactionCounts: Record<string, number> = {};
        for (const r of p.reactions) {
          reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1;
        }
        const authorId = (p as any).authorId;
        return {
          id: p.id,
          text: p.text,
          authorName: p.authorName,
          authorThumbPath: authorId
            ? `/api/persons/${authorId}/image?size=thumb`
            : null,
          createdAt: p.createdAt,
          viewCount: p.views.length,
          reactionCounts,
          myReactions: code
            ? p.reactions
                .filter((r) => r.invitationCode === code)
                .map((r) => r.emoji)
            : [],
          seen: code ? p.views.some((v) => v.invitationCode === code) : false,
          viewers: ((p as any).views as RawView[])
            .map((v) => (codeToNames.get(v.invitationCode) ?? []).join(" / "))
            .filter((n) => !!n),
        };
      }),
    };
  }

  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() body: { text: string }, @Req() req: Request) {
    if (!body.text || body.text.length > 2000)
      return { error: "Text required, max 2000 chars" } as any;

    const code = (req as any).invitationCode as string | undefined;
    const author = code
      ? await this.prisma.person.findFirst({
          where: { invitationCode: code },
          select: { id: true, fullName: true },
        })
      : null;

    const post = await this.prisma.post.create({
      data: {
        text: body.text,
        authorName: author?.fullName ?? "Brudeparet",
        authorId: author?.id ?? null,
      },
    });
    this.events.emit("post:created", { id: post.id });
    return { post };
  }

  @Post(":id/react")
  async react(
    @Param("id") id: string,
    @Body() body: { emoji: string },
    @Req() req: Request,
  ) {
    const code = (req as any).invitationCode as string | undefined;
    if (!code) throw new UnauthorizedException();
    if (!body.emoji || !ALLOWED_EMOJIS.has(body.emoji))
      throw new BadRequestException("Invalid emoji");

    const postId = Number(id);
    const existing = await this.prisma.postReaction.findUnique({
      where: {
        postId_invitationCode_emoji: {
          postId,
          invitationCode: code,
          emoji: body.emoji,
        },
      },
    });

    if (existing) {
      await this.prisma.postReaction.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.postReaction.create({
        data: { postId, invitationCode: code, emoji: body.emoji },
      });
    }

    return { ok: true };
  }

  @Post(":id/view")
  async view(@Param("id") id: string, @Req() req: Request) {
    const code = (req as any).invitationCode as string | undefined;
    if (!code) return { ok: true };

    const postId = Number(id);
    await this.prisma.postView.upsert({
      where: { postId_invitationCode: { postId, invitationCode: code } },
      update: {},
      create: { postId, invitationCode: code },
    });

    return { ok: true };
  }
}
