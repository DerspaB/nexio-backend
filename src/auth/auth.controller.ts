import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  ForgotPasswordSchema,
  LoginDto,
  LoginSchema,
  RegisterDto,
  RegisterSchema,
  ResetPasswordDto,
  ResetPasswordSchema,
} from './dto';

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

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() body: any) {
    const dto: ForgotPasswordDto = ForgotPasswordSchema.parse(body);
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    const dto: ResetPasswordDto = ResetPasswordSchema.parse(body);
    return this.authService.resetPassword(dto);
  }
}
