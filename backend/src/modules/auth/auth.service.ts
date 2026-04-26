import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers (or re-registers) a user by their client-generated UUID.
   * This offline-first pattern trusts the client's UUID as the identifier.
   * Upserts the user so re-installs / re-onboarding are idempotent.
   */
  async register(userId: string): Promise<{ token: string }> {
    const now = BigInt(Date.now());

    await this.prisma.user.upsert({
      where: { id: userId },
      update: { updatedAt: now },
      create: {
        id: userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    const token = this.jwtService.sign({ sub: userId });
    return { token };
  }

  /**
   * Issues a new JWT for an existing user (e.g. after reinstall with backup).
   * Returns 401 if the user does not exist on the server.
   */
  async login(userId: string): Promise<{ token: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found. Please register first.');
    }

    const token = this.jwtService.sign({ sub: userId });
    return { token };
  }
}
