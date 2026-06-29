import { SetMetadata } from '@nestjs/common';
import type { JwtUserRole } from '@packages/helpers';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: JwtUserRole[]) => SetMetadata(ROLES_KEY, roles);
