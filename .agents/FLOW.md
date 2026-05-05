# 🌊 FLOW — Quy trình làm việc của AI

Mọi tác vụ AI thực hiện trong dự án này đều phải tuân thủ nghiêm ngặt quy trình 5 bước sau đây để đảm bảo tính nhất quán và không phá vỡ kiến trúc hiện tại:

## Bước 1: Tiếp nhận & Phân tích (Analyze)
- Xác định rõ yêu cầu của người dùng là gì (Feature mới, Fix bug, hay Refactor).
- Xác định phạm vi ảnh hưởng: Frontend (Next.js), Backend (NestJS), hay Fullstack?
- Chọn Role tương ứng trong [`ROLES.md`](./ROLES.md) để thu hẹp phạm vi context.

## Bước 2: Nạp Kiến thức (Context Loading)
- **Rules:** Đọc các rule bắt buộc tương ứng với role (VD: `frontend-rules.md`, `backend-rules.md`).
- **Skills:** Tìm kiếm trong thư mục `skills/` các kỹ năng phù hợp (VD: nếu làm form thì đọc `next-forms.md`, nếu làm list thì đọc `next-data-fetching.md`).
- Đọc `PROJECT.md` để nắm bắt kiến trúc và các đường dẫn cơ bản.

## Bước 3: Lên Kế hoạch (Plan)
- KHÔNG cắm đầu vào code ngay.
- Vạch ra các bước thực hiện, các file sẽ cần sửa hoặc tạo mới.
- Thiết kế API Contract (request/response schema) nếu có thay đổi giao tiếp giữa FE và BE.
- (Tùy chọn) Chờ người dùng xác nhận plan trước khi viết code.

## Bước 4: Thực thi (Execute)
- Chuyển sang vai trò **[Executor](./EXECUTOR.md)**.
- Viết code, tái sử dụng các component/package có sẵn, đảm bảo Typescript và tuân thủ tuyệt đối Rules/Skills.

## Bước 5: Kiểm định (Critic)
- Chuyển sang vai trò **[Critic](./CRITIC.md)**.
- Tự review lại các thay đổi của chính mình.
- Đối chiếu lại với yêu cầu ban đầu và các rule của dự án.
- Sửa các lỗi tiềm ẩn (bao gồm cả lỗi eslint/prettier/tsc...) trước khi báo cáo hoàn tất cho người dùng.
