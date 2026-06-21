import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<{ access_token: string; user: { id: string; email: string; role: string } }> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async createUser(email: string, password: string): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ email, password_hash });
    return this.userRepo.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }
}
