import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "./prisma";
import { AdminGuard } from "./admin.guard";

@Controller("api/program-entries")
export class ProgramEntriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: Request) {
    const code = (req as any).invitationCode as string | undefined;

    const entries = await this.prisma.programEntry.findMany({
      include: {
        bookings: {
          select: { personId: true, status: true, personRole: true },
        },
      },
    });

    const myPersonIds = code
      ? (
          await this.prisma.person.findMany({
            where: { invitationCode: code },
            select: { id: true },
          })
        ).map((p) => p.id)
      : [];

    return entries.map((entry) => ({
      slug: entry.slug,
      bookableFrom: entry.bookableFrom,
      bookableTo: entry.bookableTo,
      bookableSlots: entry.bookableSlots,
      bookedCount: entry.bookings.filter((b) => b.status === "BOOKED").length,
      myBookings: entry.bookings
        .filter((b) => myPersonIds.includes(b.personId))
        .map((b) => ({ personId: b.personId, status: b.status })),
    }));
  }

  @Get("bookings")
  @UseGuards(AdminGuard)
  async adminBookings() {
    const entries = await this.prisma.programEntry.findMany({
      include: {
        bookings: {
          include: {
            person: { select: { id: true, friendlyName: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return entries
      .filter((e) => e.bookings.length > 0)
      .map((e) => ({
        slug: e.slug,
        bookableSlots: e.bookableSlots,
        bookedCount: e.bookings.filter((b) => b.status === "BOOKED").length,
        bookings: e.bookings.map((b) => ({
          personId: b.personId,
          personName: b.person.friendlyName,
          status: b.status,
          createdAt: b.createdAt,
          lastUpdatedAt: b.lastUpdatedAt,
        })),
      }));
  }

  @Put(":slug")
  @UseGuards(AdminGuard)
  async upsert(
    @Param("slug") slug: string,
    @Body()
    body: {
      bookableFrom?: string | null;
      bookableTo?: string | null;
      bookableSlots?: number | null;
    },
  ) {
    return this.prisma.programEntry.upsert({
      where: { slug },
      update: {
        bookableFrom: body.bookableFrom ? new Date(body.bookableFrom) : null,
        bookableTo: body.bookableTo ? new Date(body.bookableTo) : null,
        bookableSlots: body.bookableSlots ?? null,
      },
      create: {
        slug,
        bookableFrom: body.bookableFrom ? new Date(body.bookableFrom) : null,
        bookableTo: body.bookableTo ? new Date(body.bookableTo) : null,
        bookableSlots: body.bookableSlots ?? null,
      },
    });
  }

  @Post(":slug/book")
  async book(
    @Param("slug") slug: string,
    @Body() body: { personId: string },
    @Req() req: Request,
  ) {
    const code = (req as any).invitationCode as string | undefined;
    if (!code) throw new UnauthorizedException();

    const entry = await this.prisma.programEntry.findUnique({
      where: { slug },
      include: { bookings: { where: { status: "BOOKED" } } },
    });
    if (!entry) throw new NotFoundException("Program entry not found");

    const now = new Date();
    if (entry.bookableFrom && entry.bookableFrom > now)
      throw new BadRequestException("Booking har ikke åpnet ennå");
    if (entry.bookableTo && entry.bookableTo < now)
      throw new BadRequestException("Fristen for påmelding er passert");

    const person = await this.prisma.person.findFirst({
      where: { id: body.personId, invitationCode: code },
    });
    if (!person)
      throw new BadRequestException("Person tilhører ikke din invitasjon");

    const alreadyBooked = entry.bookings.filter(
      (b) => b.personId !== body.personId,
    ).length;
    if (entry.bookableSlots !== null && alreadyBooked >= entry.bookableSlots)
      throw new BadRequestException("Ingen ledige plasser");

    await this.prisma.programBooking.upsert({
      where: {
        programEntryId_personId: {
          programEntryId: entry.id,
          personId: body.personId,
        },
      },
      update: { status: "BOOKED", personRole: person.roles[0] ?? "GUEST" },
      create: {
        programEntryId: entry.id,
        personId: body.personId,
        status: "BOOKED",
        personRole: person.roles[0] ?? "GUEST",
      },
    });

    return { ok: true };
  }

  @Delete(":slug/book")
  async cancel(
    @Param("slug") slug: string,
    @Body() body: { personId: string },
    @Req() req: Request,
  ) {
    const code = (req as any).invitationCode as string | undefined;
    if (!code) throw new UnauthorizedException();

    const entry = await this.prisma.programEntry.findUnique({
      where: { slug },
    });
    if (!entry) throw new NotFoundException("Program entry not found");

    const person = await this.prisma.person.findFirst({
      where: { id: body.personId, invitationCode: code },
    });
    if (!person)
      throw new BadRequestException("Person tilhører ikke din invitasjon");

    await this.prisma.programBooking.updateMany({
      where: { programEntryId: entry.id, personId: body.personId },
      data: { status: "CANCELLED" },
    });

    return { ok: true };
  }
}
