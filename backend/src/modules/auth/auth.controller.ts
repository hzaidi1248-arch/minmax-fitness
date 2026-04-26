import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Called by the mobile client during onboarding.
   * Accepts the client-generated userId, creates the server-side user record,
   * and returns a signed JWT.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<{ token: string }> {
    return this.authService.register(dto.userId);
  }

  /**
   * POST /auth/login
   * Called when an existing user reinstalls the app and restores their data.
   * Returns a new JWT if the userId exists on the server.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<{ token: string }> {
    return this.authService.login(dto.userId);
  }
}
