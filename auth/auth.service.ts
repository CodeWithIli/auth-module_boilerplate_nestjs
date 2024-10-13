import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user: User = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User with provided email was not found!');
    }

    const matchingPass: boolean = await bcrypt.compareSync(
      password,
      user.password,
    );
    if (!matchingPass) {
      throw new BadRequestException('Passwords do not match!');
    }
    return user;
  }

  async register(registerDto: SignUpDto) {
    const user = new this.userModel(registerDto);

    if (user.save()) {
      return this.jwtService.sign(
        { id: user._id },
        {
          secret: process.env.JWT_ACCESS_TOKEN_SECRET,
        },
      );
    } else {
      throw new BadRequestException('User could not be created!');
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) throw new ForbiddenException('Invalid Credentials!');

    const accessToken = this.jwtService.sign(
      { sub: user._id, email: user.email },
      { secret: process.env.JWT_ACCESS_TOKEN_SECRET },
    );

    return {
      accessToken,
      user: {
        username: user.username,
        email: user.email,
      },
    };
  }
}
