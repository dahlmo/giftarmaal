import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "./prisma";

export const SKIP_SPOUSE_GUARD = "skipSpouseGuard";
export const SkipSpouseGuard = () => SetMetadata(SKIP_SPOUSE_GUARD, true);

/**
 * Guard that restricts access to persons with the SPOUSE_TO_BE role.
 * Requires AuthMiddleware to have set req.invitationCode first.
 */
@Injectable()
export class SpouseGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_SPOUSE_GUARD, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

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
