import { Controller, Get, Logger } from "@nestjs/common";
import { PrismaService } from "./prisma";

@Controller("api/contacts")
export class ContactsController {
  private readonly logger = new Logger(ContactsController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const persons = await this.prisma.person.findMany({
      select: {
        id: true,
        friendlyName: true,
        imagePath: true,
        thumbPath: true,
        title: true,
        roles: true,
        phone: true,
        email: true,
      },
    });

    const contacts = persons.map((p) => {
      const isToastmaster = p.roles.includes("TOASTMASTER");
      const isSpouse = p.roles.includes("SPOUSE_TO_BE");
      return {
        id: p.id,
        friendlyName: p.friendlyName,
        imagePath: p.imagePath,
        thumbPath: p.thumbPath,
        title: p.title,
        roles: p.roles,
        phone: isToastmaster || isSpouse ? p.phone : undefined,
        email: isToastmaster || isSpouse ? p.email : undefined,
      };
    });

    this.logger.log(`list: returned ${contacts.length} contacts`);
    return { persons: contacts };
  }
}
