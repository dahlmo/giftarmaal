import { Injectable, Module, MiddlewareConsumer, NestModule, NestMiddleware } from "@nestjs/common";
import { AppController } from "./routes";
import { PrismaService } from "./prisma";
import { ContentController } from "./content.controller";
import { PostsController } from "./posts.controller";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { PersonsController } from "./persons.controller";
import { AuthController } from "./auth.controller";
import { RsvpController } from "./rsvp.controller";
import { ContactsController } from "./contacts.controller";

const OPEN_PATHS = [/^\/api\/auth\//, /^\/api\/events\//];

@Injectable()
class AuthMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: any, res: any, next: any) {
    const url = req.originalUrl || req.url || "";
    if (OPEN_PATHS.some((r) => r.test(url))) return next();

    const raw = req.headers.cookie || "";
    const map = Object.fromEntries(
      raw.split("; ").filter(Boolean).map((c: string) => {
        const [k, ...v] = c.split("=");
        return [k, decodeURIComponent(v.join("="))];
      }),
    );
    const code = map["invitationCode"];
    if (!code) return res.status(401).json({ message: "Unauthorized" });

    req.invitationCode = code;

    // Fire-and-forget: update lastSeen for all persons on this invitation code
    this.prisma.person.updateMany({
      where: { invitationCode: code },
      data: { lastSeen: new Date() },
    }).catch(() => {/* non-critical */});

    next();
  }
}

@Module({
  controllers: [
    AppController,
    ContentController,
    PostsController,
    EventsController,
    PersonsController,
    AuthController,
    RsvpController,
    ContactsController,
  ],
  providers: [PrismaService, EventsService, AuthMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes("api");
  }
}
