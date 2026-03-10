import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "./prisma";

/**
 * Guard that restricts access to persons with the SPOUSE_TO_BE role.
 * Requires AuthMiddleware to have set req.invitationCode first.
 */
@Injectable()
export class SpouseGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const code: string | undefined = req.invitationCode;
    if (!code) throw new ForbiddenException("Ingen tilgang");

    const persons = await this.prisma.person.findMany({
      where: { invitationCode: code },
      select: { roles: true },
    });

    const isSpouse = persons.some((p) =>
      p.roles.includes("SPOUSE_TO_BE"),
    );

    if (!isSpouse) throw new ForbiddenException("Ingen tilgang");
    return true;
  }
}
