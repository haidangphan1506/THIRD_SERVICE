# Plan triển khai — Module Presence (Realtime user online/offline cho Admin)

> Mục tiêu: Admin theo dõi **realtime** user nào đang online/offline. Cơ chế: **Socket.io push** + presence lưu trên **Redis**. Tài liệu này đủ để dựng lại feature từ đầu.

## 1. Quyết định kiến trúc

- **Realtime**: WebSocket (Socket.io) push — admin nhận update < 1s, không polling.
- **"Status" = presence online/offline** (không phải cột `is_active` của account).
- **Nguồn chân lý của presence = vòng đời socket**: user mở socket `/presence` sau khi login → online; socket đóng/timeout → offline. Login REST thuần (không mở socket) **không** tính là online.
- Presence state lưu **Redis** (đã có `RedisService` `@Global`).

## 2. Dependencies cần cài

```bash
bun add @nestjs/websockets@^11 @nestjs/platform-socket.io@^11 socket.io
```

NestJS 11 tự dùng `IoAdapter` khi có gateway + `@nestjs/platform-socket.io` (không cần set adapter thủ công trong `main.ts`).

## 3. Thiết kế key Redis

| Key | Kiểu | Ý nghĩa |
| --- | --- | --- |
| `presence:conns:{userId}` | SET các socketId | Tất cả socket đang mở của 1 user → hỗ trợ multi-tab/multi-device |
| `presence:online` | SET các userId | Danh sách user đang online (snapshot nhanh) |
| `presence:lastseen:{userId}` | string (ISO) | Thời điểm connect/disconnect gần nhất |

Quy tắc chuyển trạng thái:
- `markOnline`: `SADD conns`; nếu `SCARD == 1` → vừa online → `SADD presence:online`; set `lastseen`.
- `markOffline`: `SREM conns`; nếu `SCARD == 0` → vừa offline → `DEL conns` + `SREM presence:online`; set `lastseen`.
- **Boot flush**: `OnModuleInit` xoá toàn bộ key `presence:*` (key cũ sót lại sau khi server crash/restart sẽ sai).

## 4. Cấu trúc file cần tạo

```
src/features/presence/
├── presence.constants.ts    # namespace, room, event names, key Redis
├── presence.service.ts      # Redis presence store + join DB ra snapshot
├── presence.gateway.ts      # Socket.io gateway: auth JWT, track online/offline, broadcast
├── presence.controller.ts   # GET /admin/users/status (AdminRoleGuard)
└── presence.module.ts       # Module

src/packages/entities/presence/
├── presence.dto.ts          # UserPresenceDto, PresenceUpdateEvent, PresenceSocketUser
└── index.ts
```

### 4.1 `presence.constants.ts`
- `PRESENCE_NAMESPACE = '/presence'`
- `ADMIN_ROOM = 'admin'`
- `PRESENCE_EVENTS = { snapshot: 'presence:snapshot', update: 'presence:update' }`
- `presenceKeys = { conns(id), online, lastSeen(id), pattern: 'presence:*' }`

### 4.2 `presence.dto.ts` (entities)
```ts
export type UserPresenceDto = {
  userId: string; email: string; name: string;
  online: boolean; lastSeen: string | null;
};
export type PresenceUpdateEvent = {
  userId: string; email: string; online: boolean; lastSeen: string;
};
export type PresenceSocketUser = { id: string; email: string; role: JwtUserRole };
```

### 4.3 `presence.service.ts`
- Inject `RedisService` (dùng `.client` để gọi `sadd/srem/scard/smembers/mget/keys` — `RedisService` chỉ expose `get/set/del`) và `@Inject(DRIZZLE)`.
- Methods:
  - `onModuleInit()` → `clearAll()` (flush `presence:*`).
  - `markOnline(userId, socketId)` → `{ becameOnline, lastSeen }`.
  - `markOffline(userId, socketId)` → `{ becameOffline, lastSeen }`.
  - `getOnlineUserIds()` → `string[]`.
  - `getUsersStatus()` → `UserPresenceDto[]`: select toàn bộ `users` (id, email, firstName, lastName) join với `presence:online` + `lastseen`. Dùng cho cả REST snapshot lẫn socket snapshot.
  - `clearAll()` (private) → `KEYS presence:*` rồi `DEL`.

### 4.4 `presence.gateway.ts`
- `@WebSocketGateway({ namespace: PRESENCE_NAMESPACE, cors: { origin: true, credentials: true } })`.
- Inject `PresenceService`, `JwtService`, `ConfigService`.
- `handleConnection(client)`:
  1. `authenticate(client)` — lấy token từ `handshake.auth.token` hoặc header `Authorization: Bearer`, verify bằng `JWT_ACCESS_SECRET` (fallback `JWT_SECRET` → `dev-insecure-jwt-secret`), parse payload `{ sub, email, typ:'access', role }`. Sai → `client.disconnect(true)`.
  2. Gắn user vào `client.data.user`.
  3. `markOnline` → nếu `role === 'ADMIN'`: `client.join(ADMIN_ROOM)` + emit `presence:snapshot` (toàn bộ `getUsersStatus`).
  4. Nếu `becameOnline` → broadcast `presence:update {online:true}` tới room `admin`.
- `handleDisconnect(client)`: `markOffline` → nếu `becameOffline` → broadcast `presence:update {online:false}`.
- Helper `parsePayload` tự viết (không phụ thuộc `parseAccessPayload` private trong `jwt-auth.guard.ts`).

### 4.5 `presence.controller.ts`
```ts
@Controller('admin/users')
export class PresenceController {
  @Get('status')
  @UseGuards(AdminRoleGuard)   // global JwtAuthGuard set req.user trước, guard này check role ADMIN
  @ApiResponse({ statusCode: 200, message: 'Fetched user status successfully' })
  getUsersStatus(): Promise<UserPresenceDto[]> { ... }
}
```

### 4.6 `presence.module.ts`
```ts
@Module({
  controllers: [PresenceController],
  providers: [PresenceGateway, PresenceService, JwtService, ConfigService],
  exports: [PresenceService],
})
export class PresenceModule {}
```
`RedisService` (@Global) và token `DRIZZLE` (@Global DatabaseModule) tự inject; `JwtService/ConfigService` provide trực tiếp cho socket auth (theo đúng pattern của `UserModule`).

## 5. Wiring

`src/app.module.ts`: thêm `import { PresenceModule }` và đưa `PresenceModule` vào mảng `imports`.

> Lưu ý phụ (không thuộc presence): `ReportModule` đang được `import` nhưng chưa nằm trong mảng `imports` → ESLint báo `no-unused-vars`. Nên thêm `ReportModule` vào `imports` để wire report feature + hết lỗi lint.

## 6. API surface

**REST** (Bearer ADMIN token):
- `GET /admin/users/status` → `UserPresenceDto[]` (đã được `ResponseInterceptor` bọc `{ statusCode, message, data, ... }`).

**Socket** (`ws://host:8888/presence`, auth qua `auth.token`):
- Client→Server: chỉ cần connect (auth ở handshake).
- Server→Admin: `presence:snapshot` (1 lần khi connect, chỉ ADMIN), `presence:update` (mỗi lần 1 user đổi trạng thái).

Frontend admin:
```js
const socket = io('http://host:8888/presence', { auth: { token: accessToken } });
socket.on('presence:snapshot', (list) => setUsers(list));
socket.on('presence:update', (u) => updateOne(u)); // { userId, email, online, lastSeen }
```

## 7. Edge cases đã xử lý

- **Multi-tab/device**: đếm socket bằng SET `conns` → chỉ broadcast khi 0↔1.
- **Server restart**: flush `presence:*` ở `OnModuleInit`.
- **Auth socket**: token sai/thiếu → disconnect ngay.
- **Snapshot có cả user offline**: join DB `users` với Redis online set (REST + socket snapshot dùng chung `getUsersStatus`).

## 8. Gotchas môi trường (đã gặp khi chạy local)

- **DB connect treo qua `localhost`**: máy resolve `localhost` → IPv6 `::1` (không có listener), Postgres podman chỉ nghe IPv4 cổng 5433. Khi chạy CLI (drizzle-kit/seed/app) override `DATABASE_URL` dùng `127.0.0.1`.
- **`bun run db:migrate` hỏng từ DB trống**: migration `0000` tạo `users.id` kiểu `serial`, `0001` ALTER sang `uuid` → Postgres không auto-cast → migrate treo. Local dev dùng `bunx drizzle-kit push --force` (dựng từ `src/database/schema.ts`).

## 9. Cách verify (đã chạy thành công)

1. `bun run build` (tsc) — pass.
2. `bunx eslint "src/features/presence/**/*.ts" "src/packages/entities/presence/**/*.ts" "src/app.module.ts"` — clean.
3. Boot server, check log: `PresenceController {/admin/users}` + `Mapped {/admin/users/status, GET}` + `PresenceModule dependencies initialized`.
4. Guard: no token → 401; USER token → 403; ADMIN token → 200 + list.
5. Socket smoke test (tạm cài `socket.io-client`): admin connect → nhận `snapshot`; user connect → admin nhận `update online=true`; user disconnect → admin nhận `update online=false`.

## 10. Thứ tự thực hiện đề xuất

1. Cài 3 package (mục 2).
2. Tạo `entities/presence/` (dto + index).
3. Tạo `presence.constants.ts`.
4. Tạo `presence.service.ts`.
5. Tạo `presence.gateway.ts`.
6. Tạo `presence.controller.ts`.
7. Tạo `presence.module.ts`.
8. Wire vào `app.module.ts` (+ fix `ReportModule`).
9. `bun run build` + `bun run lint:check`.
10. Boot + verify (mục 9).
