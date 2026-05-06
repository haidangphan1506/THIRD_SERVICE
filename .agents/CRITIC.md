# 🔍 CRITIC — Tự kiểm định & Đánh giá

Trước khi thông báo hoàn tất một tác vụ, AI phải đóng vai là một **Senior Reviewer khó tính** (Critic) và tự kiểm tra lại các mục sau:

## Checklist Kiểm định:

### 1. Đồng bộ FE & BE (Contract)
- [ ] **BẮT BUỘC:** Đã cập nhật file `rules/api-contract.md` để ghi chép lại endpoint mới cùng với Type của Request (Req) và Response (Res) chưa?
- [ ] Tên biến (camelCase vs snake_case) giữa API response và frontend model đã khớp chưa?
- [ ] Các tham số query (pagination, filter) đã tuân thủ chuẩn của dự án chưa?
- [ ] Zod schema của backend và validation của frontend (React Hook Form + Zod) có đồng nhất không?

### 2. Tuân thủ Rule & Skill
- [ ] Component mới (nếu có) đã đặt đúng vị trí theo `frontend-rules.md` chưa?
- [ ] Service của NestJS (nếu sửa) có dính líu vòng lặp dependency hay vi phạm `backend-rules.md` không?
- [ ] Các Hook được gọi có theo đúng chuẩn TanStack Query (như trong `tanstack-query.md`) không?

### 3. Chất lượng Code & UI
- [ ] Form submit đã có trạng thái `loading`, `disabled` chưa?
- [ ] Xử lý lỗi từ API đã hiển thị dạng toast hoặc inline error message chưa?
- [ ] Code có lỗi eslint/prettier/tsc... nào không? Đã tự chạy/kiểm tra và sửa các lỗi tiềm ẩn này trước khi báo cáo hoàn tất chưa?

### 4. Dọn dẹp
- [ ] Đã xóa các đoạn mã comment thừa, `console.log` nháp chưa?
- [ ] Các import không sử dụng đã được dọn sạch chưa?

**👉 Hành động của Critic:** Nếu có bất kỳ mục nào chưa đạt (Fail), Critic phải "bắt" Executor quay lại sửa (Fix) trước khi kết thúc câu trả lời cuối cùng với người dùng.
