import z from 'zod';
import { upsertAttendanceSchema } from './attendance.schema';

export type UpsertAttendanceDto = z.infer<typeof upsertAttendanceSchema>;

/** One roster row merged with its (possibly absent) attendance record for a session. */
export type AttendanceRecordDto = {
  studentId: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  userCode: string | null;
  present: boolean;
  note: string | null;
  markedAt: string | null;
};
