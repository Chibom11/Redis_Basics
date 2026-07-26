import Redis from 'ioredis'
import express from 'express'


const app = express();


//
app.use(express.json());

// ---------------------------------------------------------------
// Create a connection to the Redis server.
//
// REDIS_URL
// -> Uses the environment variable if available.
//
// Otherwise:
//
// redis://localhost:6379
//
// connects to the Redis server running locally on port 6379.
// ---------------------------------------------------------------
const redis = new Redis(
    process.env.REDIS_URL || "redis://localhost:6379"
);

// ----------------------------------------------------------------
// POST /otp
//
// Purpose:
//
// Generate an OTP and store it in Redis.
//
// Redis Command Used:
//
// SET
//
// along with
//
// EX (Expiry)
//
// Redis internally stores:
//
// Key
// ↓
// Phone Number
//
// Value
// ↓
// OTP
//
// TTL
// ↓
// 16 seconds
//
// Example:
//
// "9876543210"
//
// ↓
//
// "563421"
//
// ↓
//
// Expires automatically after 16 seconds.
// ----------------------------------------------------------------
app.post('/otp', async (req, res) => {

    // Extract phone number from request body.
    const { phn } = req.body;

    // Generate a random 6-digit OTP.
    //
    // Example:
    //
    // 482361
    //
    const generated_otp = Math.floor(100000 + Math.random() * 900000);

    // Store OTP inside Redis.
    //
    // Equivalent Redis CLI:
    //
    // SET 9876543210 482361 EX 16
    //
    // EX = Expire after 16 seconds.
    //
    await redis.set(phn, generated_otp, 'EX', 16);

    // Return generated OTP.
    //
    // (Only for learning purposes.
    // In production this would be sent via SMS.)
    //
    res.json({
        otp: generated_otp
    });

});

// ----------------------------------------------------------------
// POST /verify
//
// Purpose:
//
// Verify whether the user entered the correct OTP.
//
// Steps:
//
// 1. Read OTP from Redis.
//
// 2. Check whether OTP exists.
//
// 3. Compare entered OTP with stored OTP.
//
// 4. Return success or failure.
// ----------------------------------------------------------------
app.post('/verify', async (req, res) => {

    // Extract phone number and OTP entered by user.
    const { phn, otp } = req.body;

    console.log(phn, otp);

    // Fetch stored OTP from Redis.
    //
    // Equivalent Redis CLI:
    //
    // GET 9876543210
    //
    const savedOtp = await redis.get(phn);

    console.log(savedOtp);

    // If Redis returns null,
    // the OTP either expired or never existed.
    //
    if (!savedOtp) {

        return res.status(400).json({
            "message": "OTP expired or not found"
        });

    }

    // Compare the entered OTP with the stored OTP.
    //
    // Redis stores values as strings.
    //
    // Number() converts both values into numbers
    // before comparison.
    //
    if (Number(otp) !== Number(savedOtp)) {

        return res.status(400).json({
            "message": "Invalid OTP"
        });

    }

    // Once OTP is successfully verified,
    // it is usually deleted immediately.
    //
    // This prevents the OTP from being reused.
    //
    // Equivalent Redis CLI:
    //
    // DEL 9876543210
    //
    // It is commented here only for demonstration.
    //
    // await redis.del(phn);

    return res.status(200).json({
        "message": "OTP verified successfully"
    });

});

// ---------------------------------------------------------------
// Start Express server.
//
// Server URL:
//
// http://localhost:3030
//
// Available APIs:
//
// POST /otp
//
// POST /verify
// ---------------------------------------------------------------
app.listen(3030, () => {

    console.log("Server is running on port 3030");

});