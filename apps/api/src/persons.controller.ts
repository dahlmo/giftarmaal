import {
  Controller,
  Put,
  Param,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { PrismaService } from "./prisma";
import { EventsService } from "./events.service";
import * as sharp from "sharp";
import * as path from "path";
import * as fs from "fs";

@Controller("api/persons")
export class PersonsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

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

    // Finn personen
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) throw new NotFoundException("Person not found");

    const finalPathFull = `/data/uploads/person-${id}-full.jpg`;
    const finalPathThumb = `/data/uploads/person-${id}-thumb.jpg`;

    // Resize & optimize
    await sharp(file.path)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(finalPathFull);

    await sharp(file.path)
      .resize(480, 480, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(finalPathThumb);

    // Fjern temp
    fs.unlinkSync(file.path);

    // Oppdater DB
    const publicUrlFull = `/uploads/person-${id}-full.jpg`;
    const publicUrlThumb = `/uploads/person-${id}-thumb.jpg`;

    await this.prisma.person.update({
      where: { id },
      data: { imagePath: publicUrlFull, thumbPath: publicUrlThumb },
    });

    // Emit SSE event så UI kan auto-oppdatere
    this.events.emit("person:image", { id });

    return { ok: true, image: publicUrlFull };
  }
}
