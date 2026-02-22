import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn", "debug", "verbose"],
  });
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;

  // Enkel request-logging rett i main.ts
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    console.log(`[REQ] ${req.method} ${req.originalUrl || req.url}`);

    res.on("finish", () => {
      const ms = Date.now() - start;
      console.log(
        `[RES] ${req.method} ${req.originalUrl || req.url} -> ${res.statusCode} (${ms}ms)`,
      );
    });

    next();
  });

  app.enableCors({ origin: true });
  await app.listen(port);
}
bootstrap();
