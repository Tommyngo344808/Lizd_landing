HƯỚNG DẪN TRIỂN KHAI (tóm tắt)

1) Tạo 2 biến môi trường trên Netlify (Site settings → Environment variables):
   - VERIFY_TOKEN = <chuỗi bạn tự đặt, dùng để verify webhook>
   - PAGE_ACCESS_TOKEN = <Page token lấy trong Meta for Developers → Messenger → Access Tokens>

2) Kết nối site với Git (khuyên dùng) hoặc dùng Netlify CLI để deploy.
   - Git: push toàn bộ folder này lên GitHub, sau đó "New site from Git" trên Netlify.
   - CLI: cài `npm i -g netlify-cli`, chạy `netlify deploy --prod` trong thư mục này.

3) Trong Facebook App → Messenger → Webhooks:
   - Callback URL: https://<site>.netlify.app/.netlify/functions/messenger
   - Verify Token: đặt giống VERIFY_TOKEN ở Netlify
   - Subscribe events: messages, messaging_postbacks

4) Test verify:
   curl -G "https://<site>.netlify.app/.netlify/functions/messenger"      --data-urlencode "hub.mode=subscribe"      --data-urlencode "hub.verify_token=<VERIFY_TOKEN>"      --data-urlencode "hub.challenge=OK"

   → Trả về 'OK' là thành công.

5) Gửi tin nhắn vào Page để thử, bot sẽ auto-reply.
