import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { PrismaService } from "./prisma";

@Controller("api/contact")
export class ContactController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const items = await this.prisma.contact.findMany();
    return { items };
  }

  @Post()
  async create(
    @Body()
    body: {
      name: string;
      role: string;
      phone?: string;
      email?: string;
      image?: string;
    },
  ) {
    const item = await this.prisma.contact.create({ data: body });
    return { item };
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body()
    body: Partial<{
      name: string;
      role: string;
      phone?: string;
      email?: string;
      image?: string;
    }>,
  ) {
    const item = await this.prisma.contact.update({
      where: { id: Number(id) },
      data: body,
    });
    return { item };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.prisma.contact.delete({ where: { id: Number(id) } });
    return { ok: true };
  }
}
