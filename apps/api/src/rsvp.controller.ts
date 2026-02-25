import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "./prisma";
import { SubmitRsvpDto } from "./rsvp.dto";

@Controller("api/rsvp")
export class RsvpController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async submit(@Body() body: SubmitRsvpDto, @Req() req: Request) {
    const code = (req as any).invitationCode as string | undefined;
    if (!code) throw new UnauthorizedException("Ikke autentisert");

    if (!Array.isArray(body.members) || body.members.length === 0) {
      throw new BadRequestException("Mangler members");
    }

    // Fetch all persons for this invitation to authorize the submitted IDs
    const authorizedPersons = await this.prisma.person.findMany({
      where: { invitationCode: code },
      select: { id: true },
    });

    const authorizedIds = new Set(authorizedPersons.map((p) => p.id));

    for (const member of body.members) {
      if (!authorizedIds.has(member.id)) {
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

    await Promise.all(
      body.members.map((member) =>
        this.prisma.person.update({
          where: { id: member.id },
          data: {
            rsvp: member.attending === "yes" ? "YES" : "NO",
            dietary: member.dietary,
            comment,
          },
        }),
      ),
    );

    return { ok: true };
  }
}
