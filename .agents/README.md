# `.agents` — Hướng dẫn cho AI / Agent

Thư mục này định nghĩa toàn bộ **quy chuẩn, kỹ năng và quy trình** để AI hoạt động một cách chính xác trên monorepo này (admin Next.js + API NestJS).

Để đảm bảo chất lượng, AI **bắt buộc** phải hoạt động theo 5 khía cạnh cốt lõi: **Rules, Skills, Flow, Executor, Critic**.

---

## 1. 🛡️ RULES (Quy tắc cốt lõi)
Đọc và tuân thủ tuyệt đối các quy tắc trước khi phân tích hoặc lên kế hoạch.
| Rule | Áp dụng khi |
| --- | --- |
| [`rules/project-overview.md`](./rules/project-overview.md) | Luôn đọc — monorepo, alias, lệnh |
| [`rules/frontend-rules.md`](./rules/frontend-rules.md) | Sửa bất kỳ file trong `web-admin-ecs/src/` |
| [`rules/backend-rules.md`](./rules/backend-rules.md) | Sửa bất kỳ file trong `backends/src/` |
| [`rules/api-contract.md`](./rules/api-contract.md) | Thay đổi API endpoint, response shape, hoặc validation |

## 2. 🧰 SKILLS (Kỹ năng chuyên môn)
Sử dụng các pattern, component đã có sẵn thay vì tự viết lại (reinvent the wheel). Đọc chi tiết tại thư mục [`skills/`](./skills/).
**Frontend Next.js:**
- [`next-data-fetching.md`](./skills/next-data-fetching.md) \| [`tanstack-query.md`](./skills/tanstack-query.md)
- [`ui-form-input.md`](./skills/ui-form-input.md) \| [`next-forms.md`](./skills/next-forms.md)
- [`ui-modal.md`](./skills/ui-modal.md) \| [`next-components.md`](./skills/next-components.md) \| [`next-routing-auth.md`](./skills/next-routing-auth.md)
- [`fe-be-contracts.md`](./skills/fe-be-contracts.md)

**Backend NestJS:**
- [`nest-packages.md`](./skills/nest-packages.md)

## 3. 🌊 FLOW (Quy trình làm việc)
Mọi task do AI thực hiện phải tuân thủ luồng được định nghĩa tại **[`FLOW.md`](./FLOW.md)**:
1. Tiếp nhận & Phân tích
2. Nạp kiến thức (Rules & Skills)
3. Lên kế hoạch (Plan)
4. Thực thi (Execute)
5. Kiểm định (Critic)

## 4. ⚡ EXECUTOR (Nguyên tắc thực thi)
Khi viết hoặc sửa code, AI phải tuân thủ các nguyên tắc tại **[`EXECUTOR.md`](./EXECUTOR.md)**:
- Tái sử dụng component/module.
- Type-safe chặt chẽ.
- Không phá vỡ kiến trúc.

## 5. 🔍 CRITIC (Tự kiểm định)
Trước khi báo cáo hoàn tất tác vụ, AI phải đóng vai Reviewer để check lại theo **[`CRITIC.md`](./CRITIC.md)**.
Chỉ khi tất cả đều "Pass", AI mới được thông báo hoàn thành task.

---

## Mapping Role (Cơ sở phân loại)
Khi nhận yêu cầu, chọn 1 Role phù hợp để đọc hướng dẫn chi tiết tại [`ROLES.md`](./ROLES.md):
- **`backend-nest`**: Xử lý logic API, Drizzle (trong `E:\backends\...`)
- **`frontend-next-admin`**: Xử lý UI, component, hook (trong `E:\web-admin-ecs\...`)
- **`fullstack`**: Làm tính năng liên quan đến cả hai phần.

## Lưu ý Workspace & Dự án
- Đọc **[`PROJECT.md`](./PROJECT.md)** để nắm rõ cấu trúc project và lệnh chạy.
- Git root hiện tại: **`web-admin-ecs`**. Backend nằm **`E:\backends`** (workspace sibling).
- Khi mở chỉ một folder trong IDE, vẫn dùng đường dẫn tuyệt đối hoặc `../backends` nếu cấu trúc máy tương tự.
