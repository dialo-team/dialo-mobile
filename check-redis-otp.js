/**
 * Script để check OTP từ Redis
 * Chạy: node check-redis-otp.js
 */

const redis = require("redis");

async function checkRedisOTP() {
    const client = redis.createClient({
        socket: {
            host: "14.225.192.37",
            port: 6379,
        },
    });

    try {
        await client.connect();
        console.log("✅ Kết nối Redis thành công\n");

        // Scan để lấy tất cả keys
        let cursor = "0";
        let otpKeys = [];
        let allKeys = [];

        do {
            const result = await client.scan(cursor);
            cursor = result.cursor;
            allKeys.push(...(result.keys || []));

            for (const key of result.keys || []) {
                if (key.includes("otp") || key.includes("OTP")) {
                    otpKeys.push(key);
                }
            }
        } while (cursor !== "0");

        console.log("📋 Total keys in Redis:", allKeys.length);
        console.log("Sample keys:", allKeys.slice(0, 10));

        if (otpKeys.length > 0) {
            console.log('\n📌 Keys chứa "otp":', otpKeys);
            for (const key of otpKeys) {
                const value = await client.get(key);
                console.log(`\nKey: ${key}`);
                console.log(`Value: ${value}`);
            }
        } else {
            console.log("\n❌ Không tìm thấy key OTP");
        }

        // Kiểm tra một số key mẫu (phone-based)
        console.log("\n🔍 Kiểm tra các phone đã signup gần đây:");
        const testPhones = [
            "+84912000123",
            "+84991412034",
            "+84987654321",
            "0932610041",
        ];
        for (const phone of testPhones) {
            const ttl = await client.ttl(phone);
            const value = await client.get(phone);
            console.log(`Phone: ${phone}`);
            console.log(`  Value: ${value || "empty"}`);
            console.log(`  TTL: ${ttl}s`);
            console.log("");
        }

        await client.quit();
    } catch (error) {
        console.error("❌ Lỗi kết nối Redis:", error.message);
        console.error("Code:", error.code);
        console.error("\nCó thể Redis không chạy hoặc host/port không đúng");
        console.error("Hãy kiểm tra:");
        console.error("- Redis server đang chạy? telnet 14.225.192.37 6379");
        console.error("- Port mở trên firewall?");
    }
}

checkRedisOTP();
