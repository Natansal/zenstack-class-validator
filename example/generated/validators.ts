import { Role } from "./models";
import { IntersectionType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import {
   IsBoolean,
   IsDate,
   IsEmail,
   IsEnum,
   IsNumber,
   IsOptional,
   IsString,
   Length,
   Max,
   ValidateNested,
} from "class-validator";
import { Gt, LowerCase, Trim } from "zenstack-validator";

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ██████╗ ████████╗ ██████╗    Data Transfer Objects • Auto-generated     ║
 * ║   ██╔══██╗╚══██╔══╝██╔═══██╗                                              ║
 * ║   ██║  ██║   ██║   ██║   ██║                                              ║
 * ║   ██║  ██║   ██║   ██║   ██║                                              ║
 * ║   ██████╔╝   ██║   ╚██████╔╝   🚀 AUTO-GENERATED — DO NOT EDIT MANUALLY   ║
 * ║   ╚═════╝    ╚═╝    ╚═════╝    ✨ Created By - zenstack-validator         ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */
export class CreatedUpdatedTypeDefDTO {
   @IsDate()
   @Type(() => Date)
   createdAt!: Date;

   @IsDate()
   @Type(() => Date)
   updatedAt!: Date;
}

export class UserDTO extends IntersectionType(CreatedUpdatedTypeDefDTO) {
   @IsString()
   id!: string;

   @IsString()
   @IsEmail()
   email!: string;

   @IsString()
   @Trim()
   @LowerCase()
   @IsOptional()
   name?: string;

   @IsNumber()
   @Gt(0)
   @Max(100)
   score!: number;

   @IsEnum(Role)
   role!: Role;

   @ValidateNested({ each: true })
   @Type(() => PostDTO)
   posts!: PostDTO[];
}

export class PostDTO extends IntersectionType(CreatedUpdatedTypeDefDTO) {
   @IsString()
   id!: string;

   @IsString()
   userId!: string;

   @ValidateNested()
   @Type(() => UserDTO)
   user!: UserDTO;

   @IsString()
   @Length(1, 200)
   title!: string;

   @IsString()
   @IsOptional()
   content?: string;

   @IsBoolean()
   published!: boolean;
}
