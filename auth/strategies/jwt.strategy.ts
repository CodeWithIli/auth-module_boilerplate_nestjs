import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { UsersService } from "src/app-auth/users/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  @Inject(UsersService)
  private userService: UsersService;

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "testkey",
    });
  }

  async validate(payload: any) {
    return await this.userService.findOne({ _id: payload.sub });
  }
}
