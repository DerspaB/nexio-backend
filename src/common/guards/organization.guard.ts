import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class OrganizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceOrgId =
      request.params?.organizationId ||
      request.body?.organizationId ||
      request.query?.organizationId;

    if (resourceOrgId && resourceOrgId !== user.organizationId) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }

    return true;
  }
}
