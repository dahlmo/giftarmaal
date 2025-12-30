import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { PrismaService } from "./prisma";
import { EventsService } from "./events.service";

@Controller("api/agenda")
export class AgendaController {
  constructor(
    private prisma: PrismaService,
    private events: EventsService
  ) {}

  @Get()
  async list() {
    const items = await this.prisma.agendaItem.findMany({
      orderBy: { order: "asc" },
    });
    return { items };
  }

  @Post()
  async create(
    @Body() body: { time: string; title: string; description?: string }
  ) {
    const order = await this.prisma.agendaItem.count();
    const item = await this.prisma.agendaItem.create({
      data: { ...body, order },
    });
    this.events.emit("agenda:changed", { id: item.id });
    return { item };
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body()
    body: Partial<{
      time: string;
      title: string;
      description?: string;
      order: number;
    }>
  ) {
    const item = await this.prisma.agendaItem.update({
      where: { id: Number(id) },
      data: body,
    });
    this.events.emit("agenda:changed", { id: item.id });
    return { item };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.prisma.agendaItem.delete({ where: { id: Number(id) } });
    this.events.emit("agenda:changed", { id: Number(id) });
    return { ok: true };
  }
}
