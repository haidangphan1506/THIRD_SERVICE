# Pages &amp; API Review

## Legend


| Icon | Meaning                                                             |
| ---- | ------------------------------------------------------------------- |
| ✅    | API exists, method/payload match                                    |
| ⚠️   | API exists but has issues (wrong method, payload shape, field name) |
| ❌    | API không tồn tại trên backend                                      |
| ➕    | Cần API mới (chưa có)                                               |


---

## 1. Auth — `(auth)`


| Page            | Route              | API Calls                    | Status | Notes                                     |
| --------------- | ------------------ | ---------------------------- | ------ | ----------------------------------------- |
| Login           | `/login`           | `POST /auth/login`           | ✅      | Login with admin/tutor                    |
|                 |                    | `POST /auth/login/user-code` | ✅      | Login with student/parent                 |
| Register        | `/register`        | `POST /auth/register`        | ✅      | Register to tutor                         |
| Forgot Password | `/forgot-password` | `POST /auth/forgot-password` | ✅      | All role can add email                    |
| Reset Password  | `/reset-password`  | `POST /auth/reset-password`  | ✅      | JWT guard — cần reset token? Đã Public OK |
| Verify OTP      | `/verify-otp`      | `POST /auth/verify-otp`      | ❌      | Backend chưa có endpoint này              |
|                 |                    | `POST /auth/resend-otp`      | ❌      | Backend chưa có                           |
| OAuth Callback  | `/oauth/callback`  | `GET /auth/google/callback`  | ✅      | Login/Register with Hoogle account        |


---

## 2. Dashboard


| Page      | Route | API Calls                 | Status | Notes |
| --------- | ----- | ------------------------- | ------ | ----- |
| Dashboard | `/`   | `GET /dashboard/overview` | ✅      |       |


---

## 3. Students


| Page           | Route            | API Calls                                   | Status | Notes                                                                          |
| -------------- | ---------------- | ------------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| Students List  | `/students`      | `GET /students?page&limit&search&classCode` | ✅      | Query param `classCode` không có trong API_ENDPOINTS (backend có `classId`) ⚠️ |
|                |                  | `DELETE /students/:id`                      | ✅      |                                                                                |
| Student Detail | `/students/[id]` | `GET /students/:id`                         | ✅      |                                                                                |
|                |                  | `GET /exercises?studentId=`                 | ✅      |                                                                                |


---

## 4. Tutors (Admin)


| Page        | Route     | API Calls                  | Status | Notes          |
| ----------- | --------- | -------------------------- | ------ | -------------- |
| Tutors List | `/tutors` | `GET /admin/tutors`        | ✅      | ADMIN role chỉ |
|             |           | `POST /admin/tutors`       | ✅      |                |
|             |           | `PUT /admin/tutors/:id`    | ✅      |                |
|             |           | `DELETE /admin/tutors/:id` | ✅      |                |


---

## 5. Users (Admin)


| Page       | Route    | API Calls                           | Status | Notes |
| ---------- | -------- | ----------------------------------- | ------ | ----- |
| Users List | `/users` | `GET /users?page&limit&search&role` | ✅      |       |
|            |          | `POST /users`                       | ✅      |       |
|            |          | `PUT /users/:id`                    | ✅      |       |
|            |          | `PUT /users/:id/status`             | ✅      |       |
|            |          | `DELETE /users/:id`                 | ✅      |       |


---

## 6. Classes &amp; Sessions


| Page             | Route                                            | API Calls                     | Status | Notes                                        |
| ---------------- | ------------------------------------------------ | ----------------------------- | ------ | -------------------------------------------- |
| Classes List     | `/classes`                                       | `GET /classes`                | ✅      |                                              |
|                  |                                                  | `POST /classes`               | ✅      |                                              |
|                  |                                                  | `DELETE /classes/:id`         | ✅      |                                              |
| Class Detail     | `/classes/[id]`                                  | `GET /classes/:id`            | ✅      |                                              |
|                  |                                                  | `GET /classes/:id/students`   | ✅      |                                              |
|                  |                                                  | `GET /lesson?curriculumId=`   | ✅      |                                              |
|                  |                                                  | `GET /sessions?classId=`      | ✅      |                                              |
|                  |                                                  | `PUT /sessions/:id`           | ✅      |                                              |
|                  |                                                  | `DELETE /sessions/:id`        | ✅      |                                              |
| Class Curriculum | `/classes/[id]/curriculum`                       | `GET /curriculum`             | ✅      |                                              |
|                  |                                                  | `GET /chapter?curriculumId=`  | ✅      |                                              |
|                  |                                                  | `GET /lesson?curriculumId=`   | ✅      |                                              |
|                  |                                                  | `POST /chapter/:id`           | ✅      |                                              |
|                  |                                                  | `PUT /lesson/:id`             | ✅      |                                              |
| Class Exercise   | `/classes/[id]/exercise`                         | `GET /exercises?classId=`     | ✅      |                                              |
| Session Detail   | `/classes/[id]/sessions/[sessionId]`             | `GET /sessions/:id`           | ✅      |                                              |
|                  |                                                  | `PUT /sessions/:id`           | ✅      |                                              |
|                  |                                                  | `PATCH /sessions/:id`         | ⚠️     | Frontend dùng PATCH nhưng backend chỉ có PUT |
| Session Exercise | `/classes/[id]/sessions/[sessionId]/exercise`    | `POST /exercises`             | ✅      |                                              |
|                  |                                                  | `PATCH /exercises/:id/submit` | ✅      |                                              |
| Submissions      | `/classes/[id]/sessions/[sessionId]/submissions` | `GET /exercises?sessionId=`   | ✅      |                                              |
|                  |                                                  | `PATCH /exercises/:id/grade`  | ✅      |                                              |


---

## 7. Sessions


| Page           | Route            | API Calls                                 | Status | Notes |
| -------------- | ---------------- | ----------------------------------------- | ------ | ----- |
| Sessions List  | `/sessions`      | `GET /sessions?page&limit&status&classId` | ✅      |       |
|                |                  | `POST /sessions`                          | ✅      |       |
|                |                  | `POST /sessions/bulk`                     | ✅      |       |
| Session Detail | `/sessions/[id]` | `GET /sessions/:id`                       | ✅      |       |
|                |                  | `PUT /sessions/:id`                       | ✅      |       |


---

## 8. Curriculum


| Page              | Route              | API Calls                       | Status | Notes                                                                |
| ----------------- | ------------------ | ------------------------------- | ------ | -------------------------------------------------------------------- |
| Curriculum List   | `/curriculum`      | `GET /curriculum`               | ✅      |                                                                      |
|                   |                    | `POST /curriculum`              | ✅      |                                                                      |
|                   |                    | `GET /curriculum/generate-code` | ✅      |                                                                      |
| Curriculum Detail | `/curriculum/[id]` | `GET /curriculum/:id`           | ✅      |                                                                      |
|                   |                    | `PUT /curriculum/:id`           | ✅      |                                                                      |
|                   |                    | `POST /chapter/:curriculumId`   | ✅      |                                                                      |
|                   |                    | `DELETE /curriculum/:id`        | ❌      | Frontend gọi `DELETE /curriculum/:id` (chỉ có `DELETE /chapter/:id`) |
|                   |                    | `PUT /lesson/:id`               | ✅      |                                                                      |
|                   |                    | `DELETE /lesson/:id`            | ✅      |                                                                      |


---

## 9. Schedule


| Page     | Route       | API Calls                  | Status | Notes            |
| -------- | ----------- | -------------------------- | ------ | ---------------- |
| Schedule | `/schedule` | `GET /schedules?limit=100` | ✅      |                  |
|          |             | `POST /schedules`          | ✅      |                  |
|          |             | `POST /schedules/bulk`     | ✅      |                  |
|          |             | `PATCH /schedules/:id`     | ✅      | Backend PATCH OK |
|          |             | `DELETE /schedules/:id`    | ✅      |                  |


---

## 10. Grades


| Page   | Route     | API Calls           | Status | Notes             |
| ------ | --------- | ------------------- | ------ | ----------------- |
| Grades | `/grades` | `GET /users/grades` | ✅      | ADMIN, TUTOR role |


---

## 11. Finance


| Page         | Route           | API Calls                                           | Status | Notes                |
| ------------ | --------------- | --------------------------------------------------- | ------ | -------------------- |
| Fees         | `/fees`         | `GET /tuitions?page&limit&status&classId&studentId` | ✅      |                      |
|              |                 | `GET /tuitions/summary`                             | ✅      |                      |
|              |                 | `POST /tuitions`                                    | ✅      |                      |
|              |                 | `PUT /tuitions/:id`                                 | ✅      |                      |
|              |                 | `DELETE /tuitions/:id`                              | ✅      |                      |
| Accounts     | `/accounts`     | `GET /tuitions`                                     | ✅      | Có thể dùng tuitions |
|              |                 | ➕ API cho account/wallet management                 | ❌      | Chưa có backend      |
| Transactions | `/transactions` | ➕ API cho transaction history                       | ❌      | Chưa có backend      |
| Budgets      | `/budgets`      | ➕ API cho budget management                         | ❌      | Chưa có backend      |
| Investments  | `/investments`  | ➕ API cho investment tracking                       | ❌      | Chưa có backend      |


---

## 12. Reports &amp; Analytics


| Page      | Route        | API Calls           | Status | Notes           |
| --------- | ------------ | ------------------- | ------ | --------------- |
| Reports   | `/reports`   | ➕ API cho reports   | ❌      | Chưa có backend |
| Analytics | `/analytics` | ➕ API cho analytics | ❌      | Chưa có backend |


---

## 13. Communication


| Page          | Route            | API Calls                        | Status | Notes           |
| ------------- | ---------------- | -------------------------------- | ------ | --------------- |
| Discussions   | `/discussions`   | ➕ API cho discussions/forum      | ❌      | Chưa có backend |
| Notifications | `/notifications` | `GET /notifications?type&isRead` | ✅      |                 |
|               |                  | `PATCH /notifications/:id/read`  | ✅      |                 |
|               |                  | `PATCH /notifications/read-all`  | ✅      |                 |
|               |                  | `DELETE /notifications/:id`      | ✅      |                 |
| AI Chat       | `/ai-chat`       | `POST /ai-chat/chat`             | ✅      |                 |
|               |                  | `GET /ai-chat/history`           | ✅      |                 |
|               |                  | `DELETE /ai-chat/history`        | ✅      |                 |


---

## 14. Settings


| Page     | Route       | API Calls                     | Status | Notes                                                                                          |
| -------- | ----------- | ----------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| Settings | `/settings` | `GET /users/detail-user`      | ✅      |                                                                                                |
|          |             | `POST /users/avatar`          | ✅      |                                                                                                |
|          |             | `PUT /users`                  | ✅      |                                                                                                |
|          |             | `POST /users/change-password` | ⚠️     | Payload frontend: `{ currentPassword, newPassword }` — backend: `{ oldPassword, newPassword }` |
|          |             | `GET /users/grades`           | ✅      |                                                                                                |
|          |             | `PUT /users/grade`            | ⚠️     | Frontend gửi `{ gradesId }` — backend: `{ gradeIds }`                                          |


---

## Tổng hợp Issues

### 🚨 Critical — API missing trên backend


| #   | API                                         | Frontend File                                    | Gợi ý                                                           |
| --- | ------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| 1   | `POST /auth/verify-otp`                     | `auth.service.ts`                                | Thêm endpoint OTP + schema                                      |
| 2   | `POST /auth/resend-otp`                     | `auth.service.ts`                                | Thêm resend OTP                                                 |
| 3   | `GET /curriculum/grades`                    | `class.service.ts:useCurriculumGrades`           | Thêm endpoint hoặc gộp vào `/users/grades`                      |
| 4   | `GET /curriculum/lessons/by-curriculum/:id` | `class.service.ts:useChapterLessons`             | Frontend gọi sai URL, backend đã có `GET /lesson?curriculumId=` |
| 5   | `DELETE /curriculum/:id`                    | `class.service.ts:apiDeleteChapter`              | Frontend nhầm — phải là `DELETE /chapter/:id`                   |
| 6   | `DELETE /curriculum/lessons/:id`            | `class.service.ts:apiDeleteLesson`               | Frontend sai URL — phải là `DELETE /lesson/:id`                 |
| 7   | `PUT /curriculum/lessons/:id/theory`        | `class.service.ts:apiUploadCurriculumLessonFile` | Backend chỉ có `PUT /lesson/:id/add-theory`                     |
| 8   | `PUT /curriculum/lessons/:id/exercises`     | `class.service.ts:apiUploadCurriculumLessonFile` | Backend chỉ có `PUT /lesson/:id/exercises`                      |
| 9   | `DELETE /lesson/:id/add-theory`             | `class.service.ts:apiDeleteLessonFile`           | Backend chưa có delete file                                     |
| 10  | `DELETE /lesson/:id/exercises`              | `class.service.ts:apiDeleteLessonFile`           | Backend chưa có delete file                                     |
| 11  | `PATCH /sessions/:id`                       | `class.service.ts:apiPatchSession`               | Backend chỉ có `PUT /sessions/:id`                              |


### ⚠️ Payload Mismatch


| #   | Endpoint                      | Frontend                           | Backend (API_ENDPOINTS.md)     |
| --- | ----------------------------- | ---------------------------------- | ------------------------------ |
| 12  | `POST /users/change-password` | `{ currentPassword, newPassword }` | `{ oldPassword, newPassword }` |
| 13  | `PUT /users/grade`            | `{ gradesId }`                     | `{ gradeIds }`                 |
| 14  | `GET /students`               | Query: `classCode`                 | Query: `classId`               |


### 🧩 Pages thiếu backend hoàn toàn


| Page            | Backend cần                                       |
| --------------- | ------------------------------------------------- |
| `/discussions`  | Tạo feature `discussions` — CRUD topics, comments |
| `/reports`      | Tạo feature `reports` — export, summary stats     |
| `/analytics`    | Tạo feature `analytics` — charts, metrics         |
| `/accounts`     | Tạo feature `accounts` — nếu là wallet/balance    |
| `/transactions` | Finance — có thể dùng tuitions hoặc tạo mới       |
| `/budgets`      | Finance — chưa có                                 |
| `/investments`  | Finance — chưa có                                 |


---

## Summary


| Metric                       | Count |
| ---------------------------- | ----- |
| Total pages                  | 34    |
| API endpoints in backend     | 105   |
| API calls from frontend      | ~80   |
| ✅ Đúng method/payload        | ~60   |
| ⚠️ Mismatch (method/payload) | 4     |
| ❌ Frontend gọi sai URL       | 6     |
| ❌ Backend thiếu API          | 5     |
| ➕ Page chưa có backend       | 7     |


