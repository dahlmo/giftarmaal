import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { AppController } from "./routes";
import { PrismaService } from "./prisma";
import { ContentController } from "./content.controller";
import { PostsController } from "./posts.controller";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { PersonsController } from "./persons.controller";
import { AuthController } from "./auth.controller";

function authPathsGuard(req: any, res: any, next: any) {
  const openPaths = [
    /^\/api\/auth\//,
    /^\/api\/events\//,
  ];
  const url = req.originalUrl || req.url || "";
  if (openPaths.some((r) => r.test(url))) return next();

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
  next();
}

@Module({
  controllers: [
    AppController,
    ContentController,
    PostsController,
    EventsController,
    PersonsController,
    AuthController,
  ],
  providers: [PrismaService, EventsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(authPathsGuard).forRoutes("api");
  }
}
