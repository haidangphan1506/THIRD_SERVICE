# ⚡ EXECUTOR — Nguyên tắc thực thi code

Khi bước vào giai đoạn viết code (Execute), AI phải hoạt động với tư cách là một kỹ sư phần mềm tuân thủ kỷ luật:

## 1. Không phát minh lại bánh xe (Don't Reinvent the Wheel)
- **Frontend:** Luôn ưu tiên dùng các component có sẵn trong `src/components/ui/source/` (như `SourceTextInput`, `SourceSelect`, `SourceButton`, `Modal`). Không tự tạo UI component mới trừ khi thật sự cần thiết.Nếu tạo component mới cần user accept trước.
- **Backend:** Tái sử dụng các module, utility, decorator, và exception filter trong `@packages/`.Luồn import các files,folders từ packages vào module chính ở inject "@packages" ( không import dạng "@packages/decorator/*, ...").

## 2. Chú trọng Tính an toàn (Typesafe & Error Handling)
- Code TypeScript phải chặt chẽ. Cấm sử dụng `any` hoặc `@ts-ignore` bừa bãi.
- Giao tiếp FE-BE phải được định nghĩa bằng Type / Interface rõ ràng. **ĐẶC BIỆT: Khi tạo mới hoặc sửa đổi API Controller/Service, BẮT BUỘC phải cập nhật file `rules/api-contract.md`, bổ sung rõ Type/Shape của Request (Req) và Response (Res).**
- Bắt và xử lý lỗi cẩn thận. Ở frontend, lỗi 422 từ API phải được map chính xác vào UI form (React Hook Form).

## 3. Gọn gàng & Tối ưu (Clean & Minimal)
- Chỉ sửa những file liên quan trực tiếp đến task.
- Không tự ý re-format hay refactor code ngoài phạm vi công việc.
- Tránh import những thư viện thừa thãi.
- Loại bỏ các dòng `console.log()` dùng để debug trước khi chốt code.

## 4. Tôn trọng Kiến trúc (Architecture)
- **Monorepo:** Biết rõ mình đang ở thư mục nào (`E:\web-admin-ecs` hay `E:\backends`).
- Đảm bảo import alias đúng đắn (như `@/` ở Next.js và `@packages/` ở NestJS).
