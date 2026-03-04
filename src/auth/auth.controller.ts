import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto, LoginSchema, RegisterDto, RegisterSchema } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() body: any) {
    const dto: RegisterDto = RegisterSchema.parse(body);
    return this.authService.register(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: any) {
    const dto: LoginDto = LoginSchema.parse(body);
    return this.authService.login(dto);
  }
}
