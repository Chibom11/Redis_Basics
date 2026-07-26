import Redis from 'ioredis'
import express from 'express'


const app = express()

// ------------------------------------------------------------------
// Create a connection to the Redis server.
//
// process.env.REDIS_URL
// -> If a REDIS_URL environment variable exists, use it.
//
// "redis://localhost:6379"
// -> Otherwise connect to a Redis server running locally on
//    port 6379.
//
// Redis uses the redis:// protocol.
// ------------------------------------------------------------------
const redis = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

// ------------------------------------------------------------------
// Redis stores data as:
//
// Key  ------->  Value
//
// Here we're creating a constant key.
//
// Redis:
//
// redis_key
//      ↓
// default_redis_value
//
// This is similar to:
//
// {
//    redis_key: "default_redis_value"
// }
//
// ------------------------------------------------------------------
const KEY = 'redis_key'

// ------------------------------------------------------------------
// POST /setkey
//
// Purpose:
// Store a value inside Redis.
//
// Redis Command Used:
// SET
//
// Equivalent Redis CLI command:
//
// SET redis_key default_redis_value
//
// If the key already exists,
// Redis simply overwrites the old value.
// ------------------------------------------------------------------
app.post('/setkey', async (req, res) => {

    // Store the value in Redis.
    await redis.set(KEY, "default_redis_value")

    // Send success response back to client.
    res.json({
        message: "Key set successfully"
    })
})

// ------------------------------------------------------------------
// GET /getkey
//
// Purpose:
// Read a value from Redis.
//
// Redis Command Used:
// GET
//
// Equivalent Redis CLI:
//
// GET redis_key
//
// If the key exists,
// Redis returns its value.
//
// If not,
// Redis returns null.
// ------------------------------------------------------------------
app.get('/getkey', async (req, res) => {

    // Fetch the value stored at KEY.
    const value = await redis.get(KEY);

    // Return the fetched value.
    res.json({
        value
    })
})

// ------------------------------------------------------------------
// DELETE /delkey
//
// Purpose:
// Remove a key completely from Redis.
//
// Redis Command Used:
// DEL
//
// Equivalent Redis CLI:
//
// DEL redis_key
//
// After deletion:
//
// GET redis_key
//
// returns null.
// ------------------------------------------------------------------
app.delete("/delkey", async (req, res) => {

    // Delete the key from Redis.
    await redis.del(KEY);

    // Return success response.
    res.json({
        success: true,
    });
});

// ------------------------------------------------------------------
// GET /keyexists
//
// Purpose:
// Check whether a key exists.
//
// Redis Command Used:
// EXISTS
//
// Equivalent Redis CLI:
//
// EXISTS redis_key
//
// Redis returns:
//
// 1 -> Key exists
//
// 0 -> Key doesn't exist
//
// Boolean(exists)
//
// converts
//
// 1 -> true
//
// 0 -> false
// ------------------------------------------------------------------
app.get("/keyexists", async (req, res) => {

    // Check if the key exists.
    const exists = await redis.exists(KEY);

    // Convert numeric response to boolean.
    res.json({
        exists: Boolean(exists),
    });
});

// ------------------------------------------------------------------
// Start the Express server.
//
// The API will be available at:
//
// http://localhost:3000
//
// Available Endpoints:
//
// POST    /setkey
// GET     /getkey
// DELETE  /delkey
// GET     /keyexists
// ------------------------------------------------------------------
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});