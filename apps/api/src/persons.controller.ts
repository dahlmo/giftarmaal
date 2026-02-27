import {
  Controller,
  Put,
  Param,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
  Delete,
  Patch,
  Body,
  Post,
  Get,
  Query,
  Res,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { PrismaService } from "./prisma";
import { EventsService } from "./events.service";
import * as sharp from "sharp";
import * as path from "path";
import * as fs from "fs";
import type { Response } from "express";
import { CreatePersonDto, UpdatePersonDto } from "./persons.dto";

@Controller("api/persons")
export class PersonsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  @Get()
  async list(@Query("limit") limit = "100") {
    const take = Math.min(Number(limit) || 100, 500);
    const persons = await this.prisma.person.findMany({
      orderBy: { createdAt: "desc" },
      take,
    });
    return { persons };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) throw new NotFoundException("Person not found");
    return { person };
  }

  @Post()
  async create(@Body() body: CreatePersonDto) {
    const person = await this.prisma.person.create({ data: body });
    return { person };
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() updates: UpdatePersonDto) {
    const person = await this.prisma.person.update({
      where: { id },
      data: updates,
    });
    return { person };
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    await this.prisma.person.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- BILDE-OPPLASTING ----------

  @Put(":id/image")
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: "/data/uploads",
        filename: (req, file, cb) => {
          // midlertidig filnavn – vi overskriver senere
          cb(null, `temp-${Date.now()}.jpg`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  async uploadImage(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new NotFoundException("No image uploaded");

    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) throw new NotFoundException(`Person with ID ${id} not found`);

    const uploadDir = "/data/uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fullFile = path.join(uploadDir, `person-${id}-full.jpg`);
    const thumbFile = path.join(uploadDir, `person-${id}-thumb.jpg`);

    // Resize & lagre
    await sharp(file.path)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(fullFile);

    await sharp(file.path)
      .resize(480, 480, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbFile);

    // Slett temp-fil
    fs.unlinkSync(file.path);

    // Vi lagrer nå API-URLer i databasen (ikke statiske /uploads-paths)
    const apiFullUrl = `/api/persons/${id}/image?size=full`;
    const apiThumbUrl = `/api/persons/${id}/image?size=thumb`;

    await this.prisma.person.update({
      where: { id },
      data: {
        imagePath: apiFullUrl,
        thumbPath: apiThumbUrl,
      },
    });

    this.events.emit("person:image", { id });

    return {
      ok: true,
      image: apiFullUrl,
      thumb: apiThumbUrl,
    };
  }

  @Get(":id/image")
  async getImage(
    @Param("id") id: string,
    @Query("size") size: "thumb" | "full" = "full",
    @Res() res: Response,
  ) {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) throw new NotFoundException("Person not found");

    const uploadDir = "/data/uploads";
    const filename =
      size === "thumb" ? `person-${id}-thumb.jpg` : `person-${id}-full.jpg`;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Image file not found: ${filePath}`);
    }

    res.setHeader("Content-Type", "image/jpeg");
    // legg gjerne til caching:
    res.setHeader("Cache-Control", "public, max-age=3600");

    return res.sendFile(path.resolve(filePath));
  }
}
