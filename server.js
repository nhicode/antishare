const express = require('express');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = 3000;

// CHÚ Ý: Khi đưa lên VPS/Hosting, hãy đổi thành domain thật của bạn (VD: https://webcuaban.com)
const YOUR_DOMAIN = `http://localhost:${PORT}`; 
const LINK4M_TOKEN = '686c94a4ea6afc1d963edcbe'; 

// Bộ nhớ RAM lưu trữ các token tạm thời
let secureTokens = {};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

/**
 * CÔNG CỤ 1: LỜI GỌI TẠO LINK (Dành cho bạn)
 * Bạn truy cập vào: http://localhost:3000/create-link để lấy link Link4m đi chia sẻ
 */
app.get('/create-link', async (req, res) => {
    try {
        const fileToDownload = 'aiduaemveremix.lua'; // File bạn gửi link cho mình

        // 1. Đẻ ra 1 token ngẫu nhiên không ai đoán được
        const randomToken = crypto.randomBytes(16).toString('hex');

        // 2. Lưu vào bộ nhớ hệ thống
        secureTokens[randomToken] = fileToDownload;

        // Đây là đường dẫn đích sau khi vượt Link4m (Trang index.html kèm token)
        const destinationUrl = `${YOUR_DOMAIN}/index.html?token=${randomToken}`;

        // 3. Gửi sang Link4m để lấy link rút gọn kiếm tiền
        const link4mApi = `https://link4m.com/api?api=${LINK4M_TOKEN}&url=${encodeURIComponent(destinationUrl)}`;
        const response = await axios.get(link4mApi);

        if (response.data && response.data.shortenedUrl) {
            return res.json({ success: true, link_rut_gon: response.data.shortenedUrl });
        } else {
            return res.json({ success: true, link_goc_phong_ho: destinationUrl });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi tạo link!" });
    }
});

/**
 * CÔNG CỤ 2: ĐƯỜNG DẪN TẢI FILE NGẦM VÀ XÓA SỔ LINK GỐC
 */
app.get('/download-core', (req, res) => {
    const token = req.query.token;

    // Nếu không có token hoặc token đã bị xóa trước đó -> Chặn đứng lập tức
    if (!token || !secureTokens[token]) {
        return res.status(403).send("Error: Link không tồn tại hoặc đã tự hủy!");
    }

    const fileName = secureTokens[token];
    const absolutePath = path.join(__dirname, 'secure_files', fileName);

    // BƯỚC THẦN TỐC: Xóa sổ hoàn toàn mã token này khỏi RAM ngay lập tức!
    // Link này chính thức biến mất hoàn toàn trên thế giới kể từ giây này.
    delete secureTokens[token];

    // Ép trình duyệt phải tải file xuống chứ không hiển thị nội dung text lên màn hình
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Đổ dữ liệu file Lua về máy user
    res.sendFile(absolutePath, (err) => {
        if (err) console.log("Hủy giữa chừng hoặc file lỗi:", err.message);
    });
});

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Hệ thống kích hoạt thành công tại: ${YOUR_DOMAIN}`);
    console.log(`🔗 Hãy vào link dưới đây để lấy link Link4m đem đi share:`);
    console.log(`${YOUR_DOMAIN}/create-link`);
    console.log(`====================================================`);
});