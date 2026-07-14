# API Endpoints

- **Base URL**: `http://localhost:8888`
- **Auth**: JWT Bearer token (except `@Public` routes)
- **Global guard**: `JwtAuthGuard` — all routes require JWT unless marked Public
- **Swagger**: `/api-docs`
- **Response interceptor**: `{ statusCode, message, data, timestamp, method, path }`

---

## 1. Health

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| GET | `/` | JWT | — | `"Hello World!"` |

---

## 2. Auth — `/auth`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| POST | `/auth/register` | Public | `{ email, password, name }` | `{ user: { id, email, username, firstName, lastName } }` |
| POST | `/auth/login` | Public | `{ email, password }` | `{ accessToken, refreshToken, user: { id, email, userCode, username } }` |
| POST | `/auth/login/user-code` | Public | `{ userCode, role: PARENT\|STUDENT }` | `{ accessToken, refreshToken, user }` |
| POST | `/auth/refresh` | Public | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| POST | `/auth/forgot-password` | Public | `{ email }` | `{ ok: true }` |
| POST | `/auth/reset-password` | Public | `{ token, password }` | `{ ok: true }` |
| GET | `/auth/google` | Public | — | Redirect 302 → Google OAuth |
| GET | `/auth/google/callback` | Public | — | Redirect 302 → frontend with `?accessToken=&refreshToken=` |

---

## 3. Users — `/users`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| GET | `/users` | JWT | Query: `page, limit, search?, role?, status?` | `{ message, query, meta: { total, page, limit, totalPages }, data: User[] }` |
| GET | `/users/detail-user` | JWT | — | User detail (from current token) |
| GET | `/users/get-by-field` | JWT | Query: `field, value` | User found by field |
| POST | `/users` | JWT | `{ email, fullName, password, role?, userCode? }` | `{ message, data: { email, fullName, password } }` |
| PUT | `/users` | JWT | `{ fullName?, phone?, address?, dob?, gender? }` | Updated user |
| PUT | `/users/:id` | JWT | `{ fullName?, email?, phone?, role?, status? }` | Updated user |
| PUT | `/users/:id/status` | JWT | — | Toggled user |
| DELETE | `/users/:id` | JWT | — | Deleted user |
| POST | `/users/avatar` | JWT | Multipart: `avatar` | Uploaded avatar URL |
| GET | `/users/grades` | JWT+ADMIN,TUTOR | — | Grades list |
| PUT | `/users/grades/:id` | JWT+ADMIN,TUTOR | `{ name?, level? }` | Updated grade |
| PUT | `/users/grade` | JWT+ADMIN,TUTOR | `{ gradeIds: string[] }` | Updated user grades |
| POST | `/users/change-password` | JWT | `{ oldPassword, newPassword }` | Changed password |

---

## 4. Classes — `/classes`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| POST | `/classes` | JWT | `{ name, subject?, description?, maxStudents?, startDate?, endDate? }` | Created class |
| GET | `/classes/generate-code` | JWT | — | `{ code: string }` |
| GET | `/classes` | JWT | Query: `page, limit, search?, status? (OPEN\|CLOSED\|UPCOMING), subject?` | Paginated classes |
| GET | `/classes/:id` | JWT | — | Class detail |
| POST | `/classes/:id/students` | JWT | `{ studentIds: string[] }` | Added students |
| GET | `/classes/:id/students` | JWT | — | Students in class |
| GET | `/classes/:id/materials` | JWT | — | Theory + exercise materials |
| DELETE | `/classes/:id` | JWT | — | Deleted class |

---

## 5. Students — `/students`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| GET | `/students/get-student-code` | JWT | — | Generated student code |
| POST | `/students` | JWT | `{ fullName, dob?, gender?, address?, parentName?, parentPhone?, note?, classId? }` | Created student |
| GET | `/students` | JWT | Query: `page, limit, search?, classId?` | Paginated students |
| GET | `/students/:id` | JWT | — | Student detail (classes/scores/sessions) |
| PUT | `/students/:id` | JWT | `{ fullName?, dob?, gender?, address?, note? }` | Updated student |
| DELETE | `/students/:id` | JWT | — | Deleted student |

---

## 6. Sessions — `/sessions`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| POST | `/sessions` | JWT | `{ classId, title?, date, startTime, endTime, description?, location? }` | Created session |
| POST | `/sessions/bulk` | JWT | `{ classId, sessions: Array<{ date, startTime, endTime, title?, description? }> }` | Created sessions |
| GET | `/sessions` | JWT | Query: `page, limit, search?, status? (SCHEDULED\|ONGOING\|COMPLETED\|CANCELLED\|POSTPONED), classId?` | Paginated sessions |
| GET | `/sessions/class/:classId` | JWT | — | Sessions by class |
| GET | `/sessions/:id` | JWT | — | Session detail |
| PUT | `/sessions/:id` | JWT | `{ title?, date?, startTime?, endTime?, status?, description?, location? }` | Updated session |
| DELETE | `/sessions/:id` | JWT | — | Deleted session |

---

## 7. Schedules — `/schedules`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| POST | `/schedules` | JWT | `{ classId, dayOfWeek (1-7), startTime, endTime, room? }` | Created schedule |
| POST | `/schedules/bulk` | JWT | `{ classId, schedules: Array<{ dayOfWeek, startTime, endTime, room? }> }` | Created schedules |
| GET | `/schedules` | JWT | Query: `page, limit, search?, classId?` | Paginated schedules |
| GET | `/schedules/class/:classId` | JWT | — | Schedules by class |
| GET | `/schedules/:id` | JWT | — | Schedule detail |
| PATCH | `/schedules/:id` | JWT | `{ dayOfWeek?, startTime?, endTime?, room? }` | Updated schedule |
| DELETE | `/schedules/:id` | JWT | — | Deleted schedule |

---

## 8. Curriculum — `/curriculum`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| GET | `/curriculum/generate-code` | JWT | — | Curriculum code (string) |
| POST | `/curriculum` | JWT | `{ code, name, description?, subject?, grade?, isActive? }` | Created curriculum |
| GET | `/curriculum` | JWT | Query: `page, limit, search?` | Paginated curricula |
| GET | `/curriculum/:id` | JWT | — | Curriculum detail |
| PUT | `/curriculum/:id` | JWT | `{ code?, name?, description?, subject?, grade?, isActive? }` | Updated curriculum |
| DELETE | `/curriculum/:id` | JWT | — | Deleted curriculum |

---

## 9. Chapter — `/chapter`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| POST | `/chapter/:curriculumId` | JWT | `{ name, description?, order? }` | Created chapter |
| GET | `/chapter` | JWT | Query: `curriculumId (required), page, limit` | Paginated chapters |
| GET | `/chapter/:id` | JWT | — | Chapter detail |
| PUT | `/chapter/:id` | JWT | `{ name?, description?, order? }` | Updated chapter |
| DELETE | `/chapter/:id` | JWT | — | Deleted chapter |

---

## 10. Lesson — `/lesson`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| POST | `/lesson` | JWT | Query: `curriculumId, chapterId?`; Body: `{ name, content?, order?, lessonType? }` | Created lesson |
| GET | `/lesson` | JWT | Query: `curriculumId (required), chapterId?, page, limit` | Paginated lessons |
| GET | `/lesson/:id` | JWT | — | Lesson detail |
| PUT | `/lesson/:id` | JWT | `{ name?, content?, order?, lessonType? }` | Updated lesson |
| DELETE | `/lesson/:id` | JWT | — | Deleted lesson |
| PUT | `/lesson/:id/add-theory` | JWT | Multipart: `file` | Uploaded theory material |
| PUT | `/lesson/:id/exercises` | JWT | Multipart: `file` | Uploaded exercise material |

---

## 11. Exercises — `/exercises`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| POST | `/exercises` | JWT | `{ sessionId, studentId?, content?, attachments? }` | Created exercise |
| GET | `/exercises` | JWT | Query: `page, limit, sessionId?, studentId?, classId?, tutorId?` | Paginated exercises |
| GET | `/exercises/:id` | JWT | — | Exercise detail |
| PATCH | `/exercises/:id/submit` | JWT | `{ content?, attachments? }` | Resubmitted exercise |
| PATCH | `/exercises/:id/grade` | JWT | `{ score, comment? }` | Graded exercise |

---

## 12. Tuitions — `/tuitions`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| POST | `/tuitions` | JWT | `{ classId, studentId, amount, dueDate?, note? }` | Created tuition |
| GET | `/tuitions` | JWT | Query: `page, limit, classId?, studentId?, status? (PAID\|UNPAID\|OVERDUE)` | Paginated tuitions |
| GET | `/tuitions/summary` | JWT | Query: `classId?` | `{ totalPaid, totalUnpaid, totalOverdue, totalRevenue }` |
| GET | `/tuitions/:id` | JWT | — | Tuition detail |
| PUT | `/tuitions/:id` | JWT | `{ amount?, dueDate?, status?, note? }` | Updated tuition |
| DELETE | `/tuitions/:id` | JWT | — | Deleted tuition |

---

## 13. Notifications — `/notifications`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| POST | `/notifications` | JWT | `{ title, content, type? (SYSTEM\|TUITION\|STUDENT\|TUTOR), receiverId? }` | Created notification |
| GET | `/notifications` | JWT | Query: `type?, isRead?` | Notifications for current user |
| GET | `/notifications/:id` | JWT | — | Notification detail |
| PATCH | `/notifications/:id/read` | JWT | — | Marked as read |
| PATCH | `/notifications/read-all` | JWT | — | All marked as read |
| DELETE | `/notifications/:id` | JWT | — | Deleted notification |

---

## 14. Dashboard — `/dashboard`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| GET | `/dashboard/overview` | JWT | — | `{ role, stats: { classesCount, studentsCount, sessionsThisWeek, sessionsCompletedThisWeek, revenueThisMonth, overdueTuitionCount, unpaidTuitionAmount }, todaySchedule, monthly, recentNotifications }` |

---

## 15. Redis — `/redis`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| GET | `/redis` | JWT | Query: `key` | `string \| null` |

---

## 16. Cloudinary — `/cloudinary`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| POST | `/cloudinary/image` | Public | Multipart: `file` | `{ url, publicId, ... }` (Cloudinary response) |
| DELETE | `/cloudinary/image/:publicId` | JWT | — | Deleted image |

---

## 17. Upload (Cloudflare R2) — `/upload`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| POST | `/upload` | Public | Multipart: `file` | `{ url, key, size, mimetype }` |
| POST | `/upload/multiple` | Public | Multipart: `files[]` (max 10) | `UploadResponse[]` |
| GET | `/upload/download` | Public | Query: `key` | File stream (Content-Type + Content-Disposition) |
| DELETE | `/upload/:key` | Public | — | `void` |

---

## 18. AI Chat — `/ai-chat`

| Method | Path | Auth | Payload | Response |
|--------|------|------|---------|----------|
| POST | `/ai-chat/chat` | JWT | `{ message }` | `{ reply }` (history is DB-backed, not client-supplied) |
| GET | `/ai-chat/history` | JWT | Query: `limit?` | `{ messages: [{ role, content }] }` |
| DELETE | `/ai-chat/history` | JWT | — | `{ cleared: true }` |

---

## Summary

| # | Controller | Base Path | Routes | Public |
|---|-----------|-----------|--------|--------|
| 1 | AppController | `/` | 1 | 0 |
| 2 | AuthController | `/auth` | 8 | 7 |
| 3 | UserController | `/users` | 13 | 0 |
| 4 | ClassController | `/classes` | 8 | 0 |
| 5 | StudentController | `/students` | 6 | 0 |
| 6 | SessionController | `/sessions` | 7 | 0 |
| 7 | ScheduleController | `/schedules` | 7 | 0 |
| 8 | CurriculumController | `/curriculum` | 6 | 0 |
| 9 | ChapterController | `/chapter` | 5 | 0 |
| 10 | LessonController | `/lesson` | 7 | 0 |
| 11 | ExerciseController | `/exercises` | 5 | 0 |
| 12 | TuitionController | `/tuitions` | 6 | 0 |
| 13 | NotificationController | `/notifications` | 6 | 0 |
| 14 | DashboardController | `/dashboard` | 1 | 0 |
| 15 | RedisController | `/redis` | 1 | 0 |
| 16 | CloudinaryController | `/cloudinary` | 2 | 1 |
| 17 | UploadController | `/upload` | 4 | 4 |
| 18 | AiController | `/ai-chat` | 3 | 0 |
| **Total** | | | **95** | **12** |
