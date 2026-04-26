import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
