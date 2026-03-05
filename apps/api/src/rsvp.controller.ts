import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "./prisma";
import { SubmitRsvpDto } from "./rsvp.dto";

@Controller("api/rsvp")
export class RsvpController {
  private readonly logger = new Logger(RsvpController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async submit(@Body() body: SubmitRsvpDto, @Req() req: Request) {
    const code = (req as any).invitationCode as string | undefined;
    if (!code) throw new UnauthorizedException("Ikke autentisert");

    if (!Array.isArray(body.members) || body.members.length === 0) {
      throw new BadRequestException("Mangler members");
    }

    // Fetch current state to authorize IDs and detect rsvp changes
    const authorizedPersons = await this.prisma.person.findMany({
      where: { invitationCode: code },
      select: { id: true, rsvp: true },
    });

    const authorizedMap = new Map(authorizedPersons.map((p) => [p.id, p]));

    for (const member of body.members) {
      if (!authorizedMap.has(member.id)) {
        throw new BadRequestException(
          `Person ${member.id} tilhører ikke din invitasjon`,
        );
      }
      if (member.attending !== "yes" && member.attending !== "no") {
        throw new BadRequestException(
          `Ugyldig attending-verdi for ${member.id}`,
        );
      }
    }

    const comment = typeof body.comment === "string" ? body.comment : null;
    const now = new Date();

    this.logger.log(
      `RSVP submit: code="${code}" comment="${comment ?? ""}" members=${JSON.stringify(
        body.members.map((m) => ({ id: m.id, attending: m.attending, dietary: m.dietary })),
      )}`,
    );

    await Promise.all(
      body.members.map((member) => {
        const newRsvp = member.attending === "yes" ? "YES" : "NO";
        const current = authorizedMap.get(member.id)!;
        const rsvpChanged = current.rsvp !== newRsvp;

        return this.prisma.person.update({
          where: { id: member.id },
          data: {
            rsvp: newRsvp,
            dietary: member.dietary,
            comment,
            ...(rsvpChanged ? { rsvpUpdatedAt: now } : {}),
          },
        });
      }),
    );

    return { ok: true };
  }
}
