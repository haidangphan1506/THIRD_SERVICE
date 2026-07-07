import type { JwtUserRole } from '@packages/helpers';

/** Identity of the person asking — always derived from the JWT, never from the model. */
export interface AiUserContext {
  userId: string;
  role: JwtUserRole;
}

/** Ids the current user is allowed to read data for, resolved once per request. */
export interface AiScope {
  /** Classes the user teaches / is enrolled in (or a child's classes for PARENT). */
  classIds: string[];
  /** Student ids the user may see (self, or children for PARENT). */
  studentIds: string[];
  /** True when data should be scoped by class (TUTOR/ADMIN) rather than by student. */
  byClass: boolean;
}
