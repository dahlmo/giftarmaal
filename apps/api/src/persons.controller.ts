import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma';
import { CreatePersonDto, UpdatePersonDto } from './persons.dto';

@Controller('api/persons')
export class PersonsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('limit') limit = '100') {
    const take = Math.min(Number(limit) || 100, 500);
    const persons = await this.prisma.person.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });
    return { persons };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) throw new NotFoundException('Person not found');
    return { person };
  }

  @Post()
  async create(@Body() body: CreatePersonDto) {
    const person = await this.prisma.person.create({ data: body });
    return { person };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updates: UpdatePersonDto) {
    const person = await this.prisma.person.update({
      where: { id },
      data: updates,
    });
    return { person };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.prisma.person.delete({ where: { id } });
    return { ok: true };
  }
}
