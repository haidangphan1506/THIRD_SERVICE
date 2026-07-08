# AI Module (`src/features/ai`)

Trợ lý AI của **Gia Sư Pro**. Trả lời câu hỏi của người dùng (giáo viên / học sinh / phụ huynh)
dựa trên **dữ liệu thật trong database**, thông qua cơ chế **function-calling** qua OpenRouter.

Model không tự truy vấn DB. Thay vào đó nó được cung cấp một bộ **công cụ (tools)** read-only đã
định nghĩa sẵn; model chọn tool phù hợp, backend chạy query Drizzle **scope theo người dùng (JWT)**
rồi trả kết quả để model tổng hợp thành câu trả lời tiếng Việt.

## Luồng xử lý một lượt chat

```
POST /ai-chat/chat  (JwtAuthGuard → @CurrentUser)
        │
        ▼
   AiController ──► AiService.chat(dto, { userId, role })
        │
        ├─ IntentService.detectIntent()      → phân loại câu hỏi (advisory)
        ├─ PromptService.buildSystemPrompt()  → dựng system instruction theo role + intent
        ├─ RagService.retrieve()              → (đang tắt) bổ sung ngữ cảnh
        ├─ ProviderFactory.getProvider()      → chọn OpenRouter (mặc định) / OpenAI
        │
        ▼
   provider.generate({ systemInstruction, messages, tools, executeTool })
        │  vòng lặp function-calling:
        │  model gọi tool ──► ContextService.executeTool(name, args, ctx)
        │                         │ resolveScope(ctx) → classIds / studentIds theo role
        │                         └─► {class|schedule|session|exercise}.context → Drizzle
        │  ◄── kết quả JSON trả về cho model
        ▼
   reply (string) ──► ChatHistoryService.record() (best-effort) ──► { reply }
```

## Cấu trúc & chức năng từng file

### Gốc module

| File | Chức năng |
| --- | --- |
| `ai.module.ts` | Khai báo NestJS module: đăng ký toàn bộ provider/service của module và `AiController`. |
| `ai.controller.ts` | Route `POST /ai-chat/chat`. Validate body bằng `ZodValidationPipe`, lấy user từ JWT qua `@CurrentUser()` (dùng `user.id` + `user.role`), gọi `AiService`. |
| `ai.service.ts` | **Orchestrator**: nối intent → prompt → RAG → provider → tools → lưu history. Điểm vào logic của module. |
| `README.md` | Tài liệu này. |

### `dto/` — Hợp đồng request/response

| File | Chức năng |
| --- | --- |
| `ai-chat.dto.ts` | Zod schema `chatRequestSchema` (`message`, `history`) + type `ChatRequestDto`. |
| `ai-response.dto.ts` | Type `AiResponseDto` (`{ reply }`) — payload trả về (sẽ được `ResponseInterceptor` bọc lại). |

### `providers/` — Trừu tượng hoá nhà cung cấp AI

| File | Chức năng |
| --- | --- |
| `ai-provider.interface.ts` | Định nghĩa contract: `AiProvider.generate()`, `AiToolDeclaration`, `AiToolExecutor`, `AiGenerateParams`. Tách logic model khỏi phần còn lại. |
| `openrouter.provider.ts` | **Provider thật** (OpenRouter, endpoint OpenAI-compatible, model mặc định `x-ai/grok-4-fast` qua `OPENROUTER_MODEL`). Chạy vòng lặp function-calling: nhận tool-call → gọi `executeTool` → trả kết quả về model, tối đa `MAX_TOOL_ROUNDS` vòng. |
| `openai.provider.ts` | **Stub** OpenAI (chưa triển khai — `generate()` throw). Giữ chỗ để đổi provider qua config. |
| `provider.factory.ts` | Chọn provider theo env `AI_PROVIDER` (`openrouter` mặc định, `openai` nếu cấu hình). |

### `context/` — Công cụ dữ liệu (read-only, scope theo user)

| File | Chức năng |
| --- | --- |
| `context.service.ts` | **Trung tâm điều phối tool**: `getToolDeclarations()` (bộ tool cho model) + `executeTool()` (dispatch tới context service tương ứng). `resolveScope()` xác định `classIds`/`studentIds` mà user được phép xem dựa trên role (TUTOR/ADMIN theo lớp, STUDENT/PARENT theo học sinh). |
| `class.context.ts` | Query về **lớp học, chương trình học (curriculum), học phí**: `getMyClasses`, `getMyCurriculums`, `getMyTuitions`. |
| `schedule.context.ts` | Query **thời khóa biểu định kỳ** hàng tuần: `getMySchedule`. |
| `session.context.ts` | Query **buổi học cụ thể theo ngày giờ**: `getUpcomingSessions`. |
| `exercise.context.ts` | Query **bài tập & điểm số**: `getMyAssignments`, `getMyScores`. |

> Mỗi context service inject token `'DRIZZLE'` và chỉ nhận `classIds`/`studentIds` đã resolve sẵn —
> tách biệt rõ giữa "phân quyền" (ContextService) và "truy vấn" (các context con).

### `prompt/` — Xây dựng system prompt

| File | Chức năng |
| --- | --- |
| `system.prompt.ts` | Hàm thuần `buildSystemPrompt(role, nowIso)` — chỉ dẫn cốt lõi cho trợ lý (bắt buộc gọi tool khi hỏi dữ liệu, không bịa số liệu, trả lời tiếng Việt...). |
| `prompt.template.ts` | `INTENT_HINTS` — gợi ý ngắn thêm vào prompt theo intent (map intent → tool nên dùng). |
| `prompt.service.ts` | `PromptService.buildSystemPrompt(ctx, intent?)` — ghép prompt gốc + hint theo intent. |

### `intent/` — Phân loại ý định (heuristic nhẹ)

| File | Chức năng |
| --- | --- |
| `intent.enum.ts` | Enum `Intent` (GENERAL, CLASSES, CURRICULUM, SCHEDULE, SESSIONS, TUITION, ASSIGNMENTS, SCORES). |
| `intent.type.ts` | Type `IntentResult` (`{ intent, confidence }`). |
| `intent.service.ts` | `detectIntent(message)` — so khớp từ khoá tiếng Việt/Anh để đoán intent. Chỉ mang tính *advisory* (model vẫn tự quyết định gọi tool). |

### `rag/` — Retrieval-Augmented Generation (đã nối, đang tắt)

| File | Chức năng |
| --- | --- |
| `rag.service.ts` | `retrieve(query)` — điểm vào RAG. Hiện `enabled = false` nên trả `[]`; khi bật sẽ embed câu hỏi và lấy đoạn văn liên quan để chèn vào prompt. |
| `embedding.service.ts` | **Stub** tạo vector embedding (trả `[]`). Chờ nối embedding model. |
| `vector-search.service.ts` | **Stub** tìm kiếm vector gần nhất (trả `[]`). Chờ nối vector store (vd pgvector). |

### `chat/` — Lịch sử hội thoại

| File | Chức năng |
| --- | --- |
| `chat-history.service.ts` | API cấp cao để ghi/đọc lịch sử chat (`record`, `getRecent`, `clear`) — ủy quyền lưu trữ cho repository. |
| `chat.repository.ts` | **Lưu tạm in-memory** (Map theo userId). Giữ dạng repository để sau này thay bằng bảng DB mà không đụng `ChatHistoryService`. |

### `interfaces/` — Kiểu dùng chung

| File | Chức năng |
| --- | --- |
| `ai-context.interface.ts` | `AiUserContext` (`userId`, `role` từ JWT) và `AiScope` (`classIds`, `studentIds`, `byClass`). |
| `ai-message.interface.ts` | `AiMessage` (`role: user\|assistant`, `content`) — định dạng hội thoại provider-agnostic. |
| `ai-response.interface.ts` | `AiResponse` (`reply`, `intent?`) — kết quả nội bộ của một lượt chat. |

### `utils/` — Tiện ích

| File | Chức năng |
| --- | --- |
| `token-counter.ts` | Ước lượng số token (~4 ký tự/token) cho message — phục vụ cắt/ngân sách context. |
| `markdown.ts` | `stripMarkdown` / `normalizeWhitespace` — làm sạch output Markdown khi cần plain-text. |

## Bảo mật & scope dữ liệu

- **Danh tính luôn từ JWT**, không bao giờ từ model: `AiController` lấy `user.id` + `user.role`
  (guard `JwtAuthGuard` map `sub` → `id`) và truyền xuống `AiService` → `ContextService`.
- `ContextService.resolveScope()` quyết định phạm vi dữ liệu theo role:
  - `TUTOR`/`ADMIN`: theo các lớp mình dạy (`classIds`).
  - `STUDENT`: theo chính mình.
  - `PARENT`: theo các con (`users.parentId`).
- Model không thể tự đặt `userId`/`classId` để đọc dữ liệu người khác.

## Cấu hình (env)

| Biến | Ý nghĩa | Mặc định |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | API key OpenRouter (https://openrouter.ai/keys) | (bắt buộc để chat hoạt động) |
| `OPENROUTER_MODEL` | Model dùng qua OpenRouter | `x-ai/grok-4-fast` |
| `AI_PROVIDER` | Chọn provider: `openrouter` \| `openai` | `openrouter` |

## Hướng mở rộng

- **OpenAI**: cài `openai`, hiện thực `OpenAiProvider.generate()`, đặt `AI_PROVIDER=openai`.
- **Bật RAG**: đặt `enabled = true` trong `RagService`, nối `EmbeddingService` + `VectorSearchService`
  vào embedding model và vector store (vd pgvector).
- **Lịch sử bền vững**: thêm bảng (vd `ai_chat_messages`) và thay phần in-memory trong
  `ChatRepository` bằng Drizzle (theo `.claude/rules/database-changes.md`).
- **Thêm tool mới**: thêm method vào context service phù hợp → khai báo trong
  `ContextService.getToolDeclarations()` → thêm nhánh `case` trong `executeTool()`.
```
