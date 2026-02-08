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

@Controller("api/agenda")
export class ProgramController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const items = await this.prisma.programItem.findMany({
      orderBy: { order: "asc" },
    });
    return { items };
  }

  @Post()
  async create(
    @Body()
    body: {
      time: string;
      title: string;
      detail?: string;
      order: number;
    },
  ) {
    body.order = Math.max(0, body.order);
    const item = await this.prisma.programItem.create({ data: body });
    return { item };
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body()
    body: Partial<{
      time: string;
      title: string;
      detail?: string;
      order: number;
    }>,
  ) {
    const item = await this.prisma.programItem.update({
      where: { id: Number(id) },
      data: body,
    });
    return { item };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.prisma.programItem.delete({ where: { id: Number(id) } });
    return { ok: true };
  }
}
