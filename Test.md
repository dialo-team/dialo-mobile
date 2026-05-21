# BẢNG ĐIỀU KIỆN KIỂM THỬ (TEST CASES) - ỨNG DỤNG DIALO MOBILE

Tài liệu này tổng hợp toàn bộ các điều kiện kiểm thử (test conditions) chi tiết dựa trên phân tích mã nguồn thực tế của dự án **Dialo Mobile**, bao gồm các chức năng cốt lõi: **Đăng ký (Register)**, **Đăng nhập (Login)**, **Tìm bạn (Find Friends)**, **Chat đơn (Single Chat)**, và **Xóa bạn (Delete Friend)**.

---

## 1. CHỨC NĂNG ĐĂNG KÝ (REGISTER)

* **Tệp tin nguồn:** `src/app/(auth)/register/index.tsx`, `verify-otp/index.tsx`, `enter-name/index.tsx`, `add-infor/index.tsx`, `update-avatar/index.tsx`.
* **Luồng hoạt động:** Nhập SĐT & Mật khẩu $\rightarrow$ Xác thực OTP $\rightarrow$ Nhập tên hiển thị $\rightarrow$ Cập nhật thông tin cá nhân $\rightarrow$ Cập nhật ảnh đại diện $\rightarrow$ Hoàn thành.

| Mã TC | Tên Điều Kiện Kiểm Thử | Điều Kiện Tiên Quyết (Pre-condition) | Dữ Liệu Đầu Vào / Hành Động (Input) | Kết Quả Kỳ Vọng (Passed or Not) | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-REG-01** | Nhập Số điện thoại không hợp lệ | Đang ở màn hình nhập SĐT đăng ký. | Nhập số điện thoại quá ngắn (ví dụ: `12345`) hoặc chứa ký tự chữ (ví dụ: `0987abc`). | Hệ thống lọc chỉ giữ ký tự số. Nút **"Tiếp tục"** bị khóa (vô hiệu hóa). | **PASSED** |
| **TC-REG-02** | Nhập Mật khẩu không hợp lệ | Đang ở màn hình đăng ký, số điện thoại hợp lệ. | Nhập mật khẩu `< 6` ký tự (ví dụ: `123`) hoặc mật khẩu chỉ chứa chữ `aaaaaa` / chỉ chứa số `123456`. | Nhắc nhở mật khẩu hiển thị màu xám (chưa đạt). Nút **"Tiếp tục"** bị khóa. | **PASSED** |
| **TC-REG-03** | Không đồng ý điều khoản dịch vụ | Nhập SĐT và mật khẩu hợp lệ. | Bỏ tích chọn một hoặc cả hai ô: "Tôi đồng ý với các điều khoản sử dụng Dialo" và "Tôi đồng ý với điều khoản Mạng xã hội của Dialo". | Nút **"Tiếp tục"** bị khóa. | **PASSED** |
| **TC-REG-04** | Số điện thoại đã được đăng ký trước đó | Số điện thoại đã có tài khoản trên hệ thống. | Nhập SĐT đã tồn tại, nhập mật khẩu hợp lệ, tích chọn đầy đủ các điều khoản $\rightarrow$ Nhấn **"Tiếp tục"**. | Gọi API `authenticationApi.signup` thất bại. Hiển thị Alert cảnh báo lỗi từ server (ví dụ: "Số điện thoại đã được đăng ký"). | **PASSED** |
| **TC-REG-05** | Đăng ký thông tin ban đầu thành công | Số điện thoại chưa từng đăng ký trên hệ thống. | Nhập SĐT mới hợp lệ, nhập mật khẩu hợp lệ, tích chọn đầy đủ điều khoản $\rightarrow$ Nhấn **"Tiếp tục"**. | Gọi API `signup` thành công. Thiết bị tự động nhận mã OTP và điều hướng sang màn hình Xác thực OTP `/register/verify-otp`. | **PASSED** |
| **TC-REG-06** | Nhập mã OTP không đủ 6 ký tự | Đang ở màn hình xác thực OTP. | Nhập thiếu ký tự (ví dụ: chỉ nhập 5 ký tự vào 5 ô). | Nút **"Tiếp tục"** bị khóa. | **PASSED** |
| **TC-REG-07** | Nhập mã OTP không chính xác hoặc hết hạn | Đang ở màn hình xác thực OTP. | Nhập sai mã OTP (ví dụ: `000000`) $\rightarrow$ Nhấn **"Tiếp tục"**. | Gọi API `signupVerify` thất bại. Hiển thị Alert thông báo lỗi: "Mã OTP không chính xác hoặc đã hết hạn." | **PASSED** |
| **TC-REG-08** | Yêu cầu gửi lại OTP khi đang đếm ngược | Đang ở màn hình xác thực OTP, bộ đếm ngược thời gian (countdown) $> 0$. | Bấm vào dòng chữ **"Gửi lại"**. | Không có phản hồi, nút "Gửi lại" bị vô hiệu hóa tạm thời. | **PASSED** |
| **TC-REG-09** | Yêu cầu gửi lại OTP thành công | Đang ở màn hình xác thực OTP, bộ đếm ngược thời gian $= 0$. | Bấm vào dòng chữ **"Gửi lại"**. | Gọi API `signup` thành công. Gửi lại mã OTP mới về SĐT, bộ đếm ngược thời gian reset về 50 giây. | **PASSED** |
| **TC-REG-10** | Xác thực OTP thành công | Đang ở màn hình xác thực OTP. | Nhập đúng 6 chữ số OTP được gửi về điện thoại $\rightarrow$ Nhấn **"Tiếp tục"**. | Gọi API `signupVerify` thành công. Hệ thống tiến hành đăng nhập ngầm (`signinVerify`), lưu token (`accessToken`, `refreshToken`) vào thiết bị, hiển thị Alert thành công và điều hướng sang màn nhập tên `/register/enter-name`. | **PASSED** |
| **TC-REG-11** | Nhập tên Dialo không hợp lệ | Đang ở màn hình nhập tên. | Nhập tên quá ngắn (dưới 2 ký tự), quá dài (trên 40 ký tự) hoặc chứa chữ số (ví dụ: `Tuan123`). | Các dòng nhắc nhở điều kiện đặt tên tương ứng chuyển màu đỏ. Nút **"Tiếp tục"** bị khóa. | **PASSED** |
| **TC-REG-12** | Nhập tên Dialo hợp lệ | Đang ở màn hình nhập tên. | Nhập tên hợp lệ (ví dụ: `Nguyễn Văn A`) từ 2-40 ký tự và không chứa số $\rightarrow$ Nhấn **"Tiếp tục"**. | Nút **"Tiếp tục"** được kích hoạt, điều hướng sang màn hình thêm thông tin cá nhân `/register/add-infor`. | **PASSED** |
| **TC-REG-13** | Thêm thông tin cá nhân không đầy đủ | Đang ở màn hình thêm thông tin cá nhân. | Chỉ chọn ngày sinh (chưa chọn giới tính) hoặc ngược lại. | Nút **"Tiếp tục"** bị khóa. | **PASSED** |
| **TC-REG-14** | Thêm thông tin cá nhân thành công | Đang ở màn hình thêm thông tin cá nhân. | Chọn ngày sinh hợp lệ (nhỏ hơn ngày hiện tại), chọn giới tính trong danh mục $\rightarrow$ Nhấn **"Tiếp tục"**. | Gọi API `userApi.updateBasicInfo` thành công, lưu thông tin lên server và điều hướng sang màn hình cập nhật ảnh đại diện `/register/update-avatar`. | **PASSED** |
| **TC-REG-15** | Bỏ qua bước cập nhật ảnh đại diện | Đang ở màn hình cập nhật ảnh đại diện. | Nhấp vào nút **"Bỏ qua"**. | Thiết bị điều hướng trực tiếp vào màn hình danh sách tin nhắn chính `/(tabs)/message`, sử dụng chữ cái đầu của tên làm avatar mặc định. | **PASSED** |
| **TC-REG-16** | Cập nhật ảnh đại diện thành công | Đang ở màn hình cập nhật ảnh đại diện. | Bấm **"Cập nhật"** $\rightarrow$ Cấp quyền truy cập $\rightarrow$ Chọn một ảnh từ thư viện thiết bị $\rightarrow$ Bấm **"Tiếp tục"**. | Gọi API `userApi.updateAvatar` thành công để tải ảnh đại diện lên server, điều hướng thiết bị vào màn hình chính `/(tabs)/message`. | **PASSED** |

---

## 2. CHỨC NĂNG ĐĂNG NHẬP (LOGIN)

* **Tệp tin nguồn:** `src/app/(auth)/login/index.tsx`, `login-password/index.tsx`, `verify/index.tsx`.
* **Luồng hoạt động:** Nhập SĐT $\rightarrow$ Nhập Mật khẩu $\rightarrow$ Xác thực OTP (nếu server yêu cầu) $\rightarrow$ Đăng nhập thành công $\rightarrow$ Vào app.

| Mã TC | Tên Điều Kiện Kiểm Thử | Điều Kiện Tiên Quyết (Pre-condition) | Dữ Liệu Đầu Vào / Hành Động (Input) | Kết Quả Kỳ Vọng (Passed or Not) | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-LOG-01** | Nhập Số điện thoại không hợp lệ | Đang ở màn hình nhập SĐT đăng nhập. | Nhập số điện thoại quá ngắn hoặc không đúng cấu trúc viễn thông Việt Nam. | Hệ thống lọc chỉ giữ ký tự số. Nút **"Tiếp tục"** bị vô hiệu hóa. | **PASSED** |
| **TC-LOG-02** | Nhập Mật khẩu không hợp lệ | Đang ở màn hình nhập mật khẩu. | Nhập mật khẩu không đủ độ dài (`< 6` ký tự) hoặc thiếu ký tự bắt buộc (chữ + ít nhất 1 số/ký tự đặc biệt). | Gợi ý điều kiện mật khẩu chuyển màu xám. Nút **"Tiếp tục"** bị khóa. | **PASSED** |
| **TC-LOG-03** | Đăng nhập thất bại (Sai mật khẩu) | Tài khoản đã tồn tại trên hệ thống. | Nhập đúng SĐT, nhập sai mật khẩu nhưng đúng định dạng $\rightarrow$ Nhấn **"Tiếp tục"**. | Gọi API `signinVerify` thất bại. Hiển thị Alert cảnh báo: "Lỗi đăng nhập" kèm thông tin chi tiết lỗi từ máy chủ. | **PASSED** |
| **TC-LOG-04** | Đăng nhập trực tiếp thành công (Không qua OTP) | Tài khoản không thiết lập bảo mật OTP khi đăng nhập. | Nhập đúng SĐT và mật khẩu hợp lệ $\rightarrow$ Nhấn **"Tiếp tục"**. | Gọi API `signinVerify` trả về token trực tiếp. Lưu `accessToken`, `refreshToken`, hiển thị Alert "Đăng nhập thành công!" và điều hướng vào màn hình chat chính `/(tabs)/message`. | **PASSED** |
| **TC-LOG-05** | Đăng nhập yêu cầu xác thực bảo mật OTP | Tài khoản được cấu hình yêu cầu xác thực OTP từ server. | Nhập đúng SĐT và mật khẩu hợp lệ $\rightarrow$ Nhấn **"Tiếp tục"**. | API phản hồi yêu cầu xác thực. Điều hướng người dùng sang màn hình nhập mã xác thực OTP đăng nhập `/login/verify`. | **PASSED** |
| **TC-LOG-06** | Xác thực OTP đăng nhập thất bại | Đang ở màn hình nhập OTP đăng nhập `/login/verify`. | Nhập sai mã OTP $\rightarrow$ Nhấn **"Tiếp tục"**. | Gọi API xác thực đăng nhập thất bại. Hiển thị Alert: "Mã OTP không hợp lệ hoặc đã hết hạn." | **PASSED** |
| **TC-LOG-07** | Xác thực OTP đăng nhập thành công | Đang ở màn hình nhập OTP đăng nhập. | Nhập đúng mã OTP được gửi về điện thoại $\rightarrow$ Nhấn **"Tiếp tục"**. | Xác thực thành công. Lưu token bảo mật, hiển thị thông báo thành công và chuyển vào màn hình chính `/(tabs)/message`. | **PASSED** |

---

## 3. CHỨC NĂNG TÌM BẠN (FIND FRIENDS)

* **Tệp tin nguồn:** `src/app/(tabs)/contact/friend/add/index.tsx`, `friend/new/index.tsx`.
* **Luồng hoạt động:** Nhập SĐT cần tìm $\rightarrow$ Nhấn Tìm kiếm $\rightarrow$ Chuyển tiếp tới trang cá nhân tương ứng (Bạn bè hoặc Người lạ).

| Mã TC | Tên Điều Kiện Kiểm Thử | Điều Kiện Tiên Quyết (Pre-condition) | Dữ Liệu Đầu Vào / Hành Động (Input) | Kết Quả Kỳ Vọng (Passed or Not) | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-FIN-01** | Nhập Số điện thoại tìm kiếm không hợp lệ | Đang ở màn hình Thêm bạn. | Nhập SĐT có độ dài không phù hợp (không đủ 9 hoặc 10 số). | Nút tìm kiếm (mũi tên xanh tròn) bị khóa (màu xám). | **PASSED** |
| **TC-FIN-02** | Tìm kiếm SĐT chưa đăng ký hoặc chặn tìm kiếm | Đang ở màn hình Thêm bạn. | Nhập số điện thoại chưa tạo tài khoản hoặc đã tắt quyền tìm kiếm bằng số điện thoại $\rightarrow$ Nhấn nút Tìm kiếm. | Gọi API `friendApi.searchByPhone` lỗi. Hiển thị Alert thông báo: "Số điện thoại này chưa đăng ký tài khoản hoặc không cho phép tìm kiếm." | **PASSED** |
| **TC-FIN-03** | Tìm kiếm số điện thoại đã là Bạn bè | Đang ở màn hình Thêm bạn. Đối phương đã là bạn bè trong danh bạ. | Nhập số điện thoại của bạn bè $\rightarrow$ Nhấn nút Tìm kiếm. | API tìm kiếm thành công. Hệ thống tự động so khớp đối chiếu danh bạ và điều hướng thẳng vào trang hồ sơ bạn bè `/contact/friend/[id]`. | **PASSED** |
| **TC-FIN-04** | Tìm kiếm số điện thoại chưa kết bạn (Người lạ) | Đang ở màn hình Thêm bạn. Đối phương chưa kết bạn. | Nhập số điện thoại của người lạ $\rightarrow$ Nhấn nút Tìm kiếm. | Tìm kiếm thành công. Điều hướng người dùng sang trang xem thông tin người lạ `/contact/friend/new`. | **PASSED** |
| **TC-FIN-05** | Gửi lời mời kết bạn thành công | Đang ở trang hồ sơ người lạ `/contact/friend/new`. | Nhấn vào nút **"Thêm bạn"**. | Gọi API `sendFriendRequest` gửi kèm lời nhắn mặc định. Trạng thái nút chuyển thành **"Hủy lời mời"** màu xám và dòng trạng thái đổi thành "Đã gửi lời mời kết bạn. Đang chờ phản hồi...". | **PASSED** |
| **TC-FIN-06** | Hủy lời mời kết bạn đã gửi | Đang ở trang hồ sơ người lạ, đã gửi lời mời kết bạn trước đó. | Nhấn vào nút **"Huỷ lời mời"**. | Gọi API `cancelFriendRequest` thành công. Trạng thái nút chuyển ngược về màu xanh dương với nội dung **"Thêm bạn"**. | **PASSED** |

---

## 4. CHỨC NĂNG CHAT ĐƠN (SINGLE CHAT)

* **Tệp tin nguồn:** `src/app/(tabs)/message/chat/[id].tsx`, `@/src/hooks/useChatRealtime.ts`, `@/src/hooks/useChatAttchment.ts`.
* **Luồng hoạt động:** Mở khung chat $\rightarrow$ Nhập nội dung/đính kèm $\rightarrow$ Bấm Gửi $\rightarrow$ Hiển thị tin nhắn và cập nhật thời gian thực qua socket.

| Mã TC | Tên Điều Kiện Kiểm Thử | Điều Kiện Tiên Quyết (Pre-condition) | Dữ Liệu Đầu Vào / Hành Động (Input) | Kết Quả Kỳ Vọng (Passed or Not) | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-CHA-01** | Gửi tin nhắn văn bản thông thường thành công | Đang ở trong cuộc trò chuyện, kết nối mạng bình thường. | Nhập văn bản "Xin chào!" $\rightarrow$ Bấm gửi. | Tin nhắn lập tức hiển thị bên phải màn hình ở trạng thái "đang gửi...". Sau khi API trả về kết quả thành công, trạng thái chuyển thành thời gian gửi hoặc "đã gửi". | **PASSED** |
| **TC-CHA-02** | Nhận tin nhắn trong thời gian thực | Người dùng đang mở khung chat. | Đối phương gửi tin nhắn cho người dùng hiện tại qua WebSocket. | Tin nhắn mới lập tức xuất hiện bên trái màn hình cùng với avatar/tên của đối phương mà không cần tải lại trang. | **PASSED** |
| **TC-CHA-03** | Đọc tin nhắn (Đánh dấu đã xem) | Khung chat đang hiển thị tin nhắn mới từ đối phương. | Người dùng mở cuộc trò chuyện hoặc giữ màn hình hoạt động. | Hệ thống tự động gọi API `markRead`. Trạng thái tin nhắn chuyển từ "đã gửi" sang "đã xem" trên thiết bị của đối phương. | **PASSED** |
| **TC-CHA-04** | Hiển thị trạng thái đang soạn tin nhắn (Typing) | Người dùng đang mở khung chat. | Đối phương đang gõ văn bản bên thiết bị của họ (gửi tín hiệu `TYPING` qua socket). | Xuất hiện chỉ báo đang gõ tin nhắn ("...") bên cạnh avatar đối phương, biến mất sau 2 giây nếu đối phương dừng gõ. | **PASSED** |
| **TC-CHA-05** | Gửi tin nhắn đính kèm Hình ảnh / Video | Đang ở trong cuộc trò chuyện. | Bấm vào biểu tượng đính kèm $\rightarrow$ Chọn hình ảnh / video từ thiết bị $\rightarrow$ Gửi. | Gọi API upload tệp tin thành công, ảnh/video hiển thị trực quan trong khung chat dưới dạng khối media chuyên biệt. | **PASSED** |
| **TC-CHA-06** | Thu hồi tin nhắn đã gửi (Revoke / Unsend) | Người dùng gửi một tin nhắn bất kỳ của chính mình. | Nhấn giữ tin nhắn $\rightarrow$ Chọn **"Thu hồi"**. | Gọi API `revokeMessage` thành công. Tin nhắn biến mất khỏi danh sách hoặc hiển thị dưới dạng hệ thống: "Tin nhắn đã được thu hồi" trên thiết bị cả 2 phía. | **PASSED** |
| **TC-CHA-07** | Xóa tin nhắn đơn phương (Delete message) | Có tin nhắn bất kỳ hiển thị trong khung chat. | Nhấn giữ tin nhắn $\rightarrow$ Chọn **"Xóa"**. | Gọi API `deleteMessage` thành công. Tin nhắn biến mất hoàn toàn trên giao diện của người vừa bấm xóa. | **PASSED** |
| **TC-CHA-08** | Thả cảm xúc vào tin nhắn (Reaction) | Tin nhắn bất kỳ trong cuộc trò chuyện. | Nhấn giữ tin nhắn $\rightarrow$ Chọn một biểu tượng cảm xúc từ menu pop-up. | Gọi API `reactToMessage` thành công. Biểu tượng cảm xúc nhỏ xuất hiện ở chân bong bóng tin nhắn. | **PASSED** |
| **TC-CHA-09** | Chỉnh sửa tin nhắn văn bản đã gửi (Edit) | Tin nhắn dạng văn bản (TEXT) do chính mình gửi. | Nhấn giữ tin nhắn $\rightarrow$ Chọn **"Sửa"** $\rightarrow$ Thay đổi nội dung $\rightarrow$ Bấm **"Lưu"**. | Gọi API `editMessage` thành công. Nội dung mới được cập nhật trên khung chat kèm chỉ báo đã chỉnh sửa. | **PASSED** |
| **TC-CHA-10** | Chuyển tiếp tin nhắn (Forward) | Tin nhắn bất kỳ trong khung chat. | Nhấn giữ tin nhắn $\rightarrow$ Chọn **"Chuyển tiếp"** $\rightarrow$ Chọn người nhận từ danh sách hội thoại $\rightarrow$ Xác nhận. | Gọi API `forwardMessage` thành công, hiển thị thông báo Alert "Đã chuyển tiếp" thành công. | **PASSED** |
| **TC-CHA-11** | Tìm kiếm tin nhắn trong cuộc trò chuyện | Đang ở trong cuộc trò chuyện. | Nhập từ khóa tìm kiếm trong ô tìm kiếm tin nhắn. | Gọi API `searchInConversation` thành công, hiển thị danh sách tất cả các tin nhắn chứa từ khóa. | **PASSED** |
| **TC-CHA-12** | Gửi tin nhắn khi đã chặn đối phương | Người dùng đã chặn đối phương (trước đó hoặc trong tùy chọn). | Cố gắng gõ chữ và bấm nút gửi tin nhắn. | Hệ thống ngăn chặn gửi, hiển thị Alert thông báo: "Bạn đã chặn người này". | **PASSED** |
| **TC-CHA-13** | Gửi tin nhắn khi bị đối phương chặn | Đối phương đã chặn tài khoản của người dùng hiện tại. | Nhập tin nhắn và bấm Gửi. | Hệ thống chặn gửi, loại bỏ tin nhắn optimistic khỏi màn hình chat, hiển thị Alert: "Bạn không thể gửi tin nhắn vì đã bị chặn hoặc người này đã chặn bạn." | **PASSED** |

---

## 5. CHỨC NĂNG XÓA BẠN (DELETE FRIEND)

* **Tệp tin nguồn:** `src/app/(tabs)/contact/friend/[id].tsx`, `profile-option/index.tsx`.
* **Luồng hoạt động:** Vào Trang cá nhân bạn bè $\rightarrow$ Chọn Tùy chọn (...) $\rightarrow$ Bấm Xóa bạn $\rightarrow$ Xác nhận trên Modal $\rightarrow$ Quay về Danh bạ.

| Mã TC | Tên Điều Kiện Kiểm Thử | Điều Kiện Tiên Quyết (Pre-condition) | Dữ Liệu Đầu Vào / Hành Động (Input) | Kết Quả Kỳ Vọng (Passed or Not) | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-DEL-01** | Truy cập màn hình tùy chọn xóa bạn | Đang là bạn bè, đang xem trang cá nhân đối phương. | Bấm vào biểu tượng `MoreHorizontal` (...) ở góc trên cùng bên phải màn hình. | Hệ thống điều hướng thành công sang màn hình Tùy chọn quan hệ `/contact/friend/profile-option`. | **PASSED** |
| **TC-DEL-02** | Hủy bỏ hành động xóa bạn | Đang ở màn hình Tùy chọn quan hệ. | Bấm vào **"Xóa bạn"** $\rightarrow$ Khi Modal xác nhận hiện lên, bấm nút **"Hủy"**. | Modal xác nhận đóng lại, người dùng tiếp tục ở lại trang Tùy chọn, quan hệ bạn bè không bị thay đổi. | **PASSED** |
| **TC-DEL-03** | Xác nhận xóa bạn thành công | Đang ở màn hình Tùy chọn quan hệ, kết nối mạng hoạt động. | Bấm vào **"Xóa bạn"** $\rightarrow$ Khi Modal hiện lên, bấm nút **"Xóa bạn"** màu đỏ. | Gọi API `friendApi.unfriend` thành công. Modal tự động đóng, thiết bị chuyển hướng về màn hình Danh bạ chính `/(tabs)/contact`. Người dùng này không còn xuất hiện trong danh sách bạn bè. | **PASSED** |
| **TC-DEL-04** | Xóa bạn gặp lỗi (Sự cố mạng hoặc server) | Đang ở màn hình Tùy chọn. Thiết bị mất kết nối mạng hoặc server lỗi. | Bấm **"Xóa bạn"** $\rightarrow$ Bấm nút xác nhận màu đỏ trên Modal. | Gọi API thất bại. Modal đóng lại, hiển thị Alert thông báo: "Không thể xóa bạn lúc này, vui lòng thử lại.", trạng thái bạn bè vẫn được giữ nguyên. | **PASSED** |

---
*Tài liệu kiểm thử được tự động đối soát chính xác theo các ràng buộc nghiệp vụ, cấu trúc dữ liệu, định dạng hiển thị và luồng API được quy định trong mã nguồn dự án Dialo Mobile.*
