import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "./prisma";

const ADMIN_ROLES = ["SPOUSE_TO_BE", "TOASTMASTER"];

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const code: string | undefined = req.invitationCode;
    if (!code) throw new ForbiddenException("Ingen tilgang");

    const persons = await this.prisma.person.findMany({
      where: { invitationCode: code },
      select: { roles: true },
    });

    const allowed = persons.some((p) =>
      p.roles.some((r) => ADMIN_ROLES.includes(r)),
    );

    if (!allowed) throw new ForbiddenException("Ingen tilgang");
    return true;
  }
}
