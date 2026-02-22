import { PersonRole, RsvpStatus } from '@prisma/client';
import { IsArray, IsEmail, IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreatePersonDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  invitationCode?: string;

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  zipcode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(PersonRole, {each: true})
  roles?: PersonRole[];

  @IsOptional()
  @IsEnum(RsvpStatus)
  rsvp?: RsvpStatus;

  @IsOptional()
  @IsBoolean()
  saveTheDateSent?: boolean;
}

export class UpdatePersonDto extends CreatePersonDto {}
