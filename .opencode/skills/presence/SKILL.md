---
name: presence
description: Use when implementing the real-time user online/offline presence module using Socket.io + Redis in the backends NestJS API.
---

# Presence Module

## Architecture

- **Socket.io** (namespace `/presence`) for realtime push
- **Redis** as the single source of truth for online/offline state
- Admin users receive snapshots + live updates; regular users are tracked but don't receive broadcasts
- Login via REST API does NOT mark a user online — only opening a Socket.io connection does

## Dependencies

```bash
bun add @nestjs/websockets@^11 @nestjs/platform-socket.io@^11 socket.io
```

NestJS 11 auto-detects `IoAdapter` — no manual adapter setup in `main.ts`.

## Redis key design

| Key | Type | Purpose |
| --- | --- | --- |
| `presence:conns:{userId}` | SET of socketId | Track multi-tab/multi-device connections |
| `presence:online` | SET of userId | Quick snapshot of all online users |
| `presence:lastseen:{userId}` | string (ISO) | Last connect/disconnect timestamp |

## State transition rules

- `markOnline`: `SADD conns` → if `SCARD == 1` → user just came online → `SADD presence:online` + set `lastseen`
- `markOffline`: `SREM conns` → if `SCARD == 0` → user fully offline → `DEL conns` + `SREM presence:online` + set `lastseen`
- **Boot flush**: `OnModuleInit` → `KEYS presence:*` → `DEL` all (prevent stale state after restart)

## File structure

```
src/features/presence/
├── presence.constants.ts    # namespace, room, event names, Redis key helpers
├── presence.service.ts      # Redis operations + DB join for snapshot
├── presence.gateway.ts      # Socket.io gateway with JWT auth
├── presence.controller.ts   # GET /admin/users/status (AdminRoleGuard)
└── presence.module.ts       # Module wiring

src/packages/entities/presence/
├── presence.dto.ts          # UserPresenceDto, PresenceUpdateEvent, PresenceSocketUser
└── index.ts
```

## Gateway auth pattern

```ts
handleConnection(client: Socket) {
  const token = client.handshake.auth.token
    ?? client.handshake.headers.authorization?.replace('Bearer ', '');
  const payload = this.jwtService.verify(token, { secret: accessSecret });
  // Validate typ === 'access'
  client.data.user = { id: payload.sub, email: payload.email, role: payload.role };
  // Admin joins broadcast room
  if (payload.role === 'ADMIN') {
    client.join('admin');
    client.emit('presence:snapshot', await this.presenceService.getUsersStatus());
  }
}

handleDisconnect(client: Socket) { /* markOffline → broadcast to admin room */ }
```

## Service methods

```ts
markOnline(userId, socketId): { becameOnline: boolean; lastSeen: string }
markOffline(userId, socketId): { becameOffline: boolean; lastSeen: string }
getOnlineUserIds(): Promise<string[]>
getUsersStatus(): Promise<UserPresenceDto[]>  // joins DB users with Redis presence:online + lastseen
clearAll(): Promise<void>  // flush all presence:* keys
```

## Edge cases handled

- **Multi-tab/device**: SET `conns` with `SCARD` — broadcast only on 0↔1 transition
- **Server restart**: flush all keys in `OnModuleInit`
- **Invalid token on connect**: `client.disconnect(true)` immediately
- **Snapshot includes offline users**: SQL join of `users` table with Redis online set

## API surface

**REST** (admin only):
- `GET /admin/users/status` → `UserPresenceDto[]` (bearer ADMIN token)

**Socket** (`ws://host:8888/presence`):
- Client→Server: authenticate via `auth.token`
- Server→Admin: `presence:snapshot` (on connect), `presence:update` (on every status change)

## Admin room broadcast

```ts
this.server.to('admin').emit('presence:update', {
  userId, email, online: true, lastSeen: new Date().toISOString()
});
```
