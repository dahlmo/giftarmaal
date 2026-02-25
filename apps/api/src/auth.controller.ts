import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  Res,
  Req,
} from "@nestjs/common";
import type { Response, Request } from "express";
import { PrismaService } from "./prisma";
import {
  clearFailures,
  getClientIp,
  isBlocked,
  registerFailure,
} from "./helpers/fail2ban";

@Controller("api/auth")
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("login")
  async login(
    @Body("invitationCode") invitationCode: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = getClientIp(req);

    if (isBlocked(ip)) {
      throw new UnauthorizedException(
        "For mange mislykkede forsøk. Prøv igjen senere.",
      );
    }

    const code = (invitationCode || "").trim();
    if (!code) {
      registerFailure(ip);
      throw new UnauthorizedException("Mangler invitasjonskode");
    }

    const persons = await this.prisma.person.findMany({
      where: { invitationCode: code },
    });

    if (!persons.length) {
      registerFailure(ip);
      throw new UnauthorizedException("Fant ikke invitasjonskode");
    }

    clearFailures(ip);

    res.cookie("invitationCode", code, {
      httpOnly: false,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 60,
      path: "/",
    });

    return {
      ok: true,
      members: persons.map((p) => ({
        id: p.id,
        friendlyName: p.friendlyName,
      })),
    };
  }

  @Get("me")
  async me(@Req() req: Request) {
    const raw = req.headers.cookie || "";
    const cookies = Object.fromEntries(
      raw
        .split(";")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => {
          const [k, ...v] = c.split("=");
          return [k, decodeURIComponent(v.join("="))];
        }),
    );

    const code = cookies["invitationCode"];
    if (!code) throw new UnauthorizedException("Ikke autentisert");

    const persons = await this.prisma.person.findMany({
      where: { invitationCode: code },
    });
    if (!persons.length) throw new UnauthorizedException("Ikke autentisert");

    return {
      ok: true,
      members: persons.map((p) => ({
        id: p.id,
        friendlyName: p.friendlyName,
        rsvp: p.rsvp,
        roles: p.roles,
        dietary: p.dietary,
        comment: p.comment,
      })),
    };
  }
}
