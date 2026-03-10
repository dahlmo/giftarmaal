import {
  Body,
  Controller,
  Get,
  Logger,
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
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post("login")
  async login(
    @Body("invitationCode") invitationCode: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = getClientIp(req);

    if (isBlocked(ip)) {
      this.logger.warn(`Login blocked for IP ${ip} (too many failures)`);
      throw new UnauthorizedException(
        "For mange mislykkede forsøk. Prøv igjen senere.",
      );
    }

    const code = (invitationCode || "").trim();
    if (!code) {
      registerFailure(ip);
      this.logger.warn(`Login attempt with empty code from IP ${ip}`);
      throw new UnauthorizedException("Mangler invitasjonskode");
    }

    const persons = await this.prisma.person.findMany({
      where: { invitationCode: code },
    });

    if (!persons.length) {
      registerFailure(ip);
      this.logger.warn(`Login attempt with unknown code "${code}" from IP ${ip}`);
      throw new UnauthorizedException("Fant ikke invitasjonskode");
    }

    clearFailures(ip);

    const now = new Date();
    const names = persons.map((p) => p.friendlyName).join(", ");

    // Set firstSeen only on the very first login
    await this.prisma.person.updateMany({
      where: { invitationCode: code, firstSeen: null },
      data: { firstSeen: now },
    });

    this.logger.log(`Login: code="${code}" persons=[${names}] ip=${ip}`);

    res.cookie("invitationCode", code, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
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

  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("invitationCode", { path: "/" });
    return { ok: true };
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
