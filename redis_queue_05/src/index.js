import express from 'express'
import Redis from 'ioredis'

// ------------------------------------------------------------
// Create an Express application.
// ------------------------------------------------------------
const app = express();

// Middleware to parse JSON request bodies.
//
// Example:
//
// {
//     "to":"abc@gmail.com",
//     "from":"admin@gmail.com",
//     "emailBody":"Hello!"
// }
//
// becomes
//
// req.body.to
// req.body.from
// req.body.emailBody
//
app.use(express.json());

// ------------------------------------------------------------
// Connect to Redis.
//
// If REDIS_URL exists in environment variables,
// use it.
//
// Otherwise connect to the local Redis server.
//
// redis://localhost:6379
// ------------------------------------------------------------
const redis = new Redis(
    process.env.REDIS_URL || "redis://localhost:6379"
);

// ------------------------------------------------------------
// Redis Queue Key.
//
// This key stores a Redis LIST.
//
// It is called queue_emails simply because we are
// using this List as an Email Queue.
//
// Redis itself does NOT know this is a queue.
// It only knows this is a LIST.
//
// Queue:
//
// queue_emails
//
// ↓
//
// Job 1
//
// Job 2
//
// Job 3
// ------------------------------------------------------------
const QUEUE_EMAIL_KEY = 'queue_emails';


// ============================================================
// POST /emails
//
// Purpose:
//
// Add a new Email Job into the Redis Queue.
//
// Redis Command:
//
// LPUSH
//
// LPUSH inserts a new element on the LEFT side
// of the Redis List.
//
// Example:
//
// Before
//
// Job A
//
// Job B
//
// After LPUSH(Job C)
//
// Job C
//
// Job A
//
// Job B
//
// We later remove jobs using RPOP,
// therefore the oldest job comes out first,
// giving FIFO (Queue behaviour).
// ============================================================
app.post('/emails', async (req, res) => {

    // Create one Email Job.
    //
    // Every job represents one email that
    // will be sent later by a worker.
    //
    const job = {

        to: req.body.to,

        from: req.body.from,

        emailBody: req.body.emailBody,

        // Timestamp showing when the job
        // entered the queue.
        createdAt: new Date().toISOString()

    }

    // Store the Email Job inside Redis.
    //
    // Since Redis Lists store strings,
    // convert the object into JSON.
    //
    // Equivalent Redis CLI:
    //
    // LPUSH queue_emails "{...}"
    //
    await redis.lpush(
        QUEUE_EMAIL_KEY,
        JSON.stringify(job)
    )

    // Return success response.
    res.status(200).json({

        "message": "Job added",

        "job": job

    })

})


// ============================================================
// GET /emails/processone
//
// Purpose:
//
// Process ONE email from the queue.
//
// Redis Commands:
//
// LRANGE
// RPOP
//
// Steps:
//
// 1. View all jobs currently inside queue.
//
// 2. Remove the oldest job.
//
// 3. Simulate sending the email.
//
// In production,
// a Worker Service would continuously call
// RPOP instead of exposing an API.
// ============================================================
app.get('/emails/processone', async (req, res) => {

    // View every job currently waiting
    // inside the queue.
    //
    // LRANGE
    //
    // 0
    // means first element.
    //
    // -1
    // means last element.
    //
    // Therefore
    //
    // LRANGE 0 -1
    //
    // returns the entire queue.
    //
    const a = await redis.lrange(
        QUEUE_EMAIL_KEY,
        0,
        -1
    );

    console.log(a)

    // Remove ONE job from the RIGHT side
    // of the list.
    //
    // Equivalent Redis CLI:
    //
    // RPOP queue_emails
    //
    // Because jobs are inserted using LPUSH,
    // RPOP removes the oldest job first.
    //
    // This gives FIFO behaviour.
    //
    const rawJob = await redis.rpop(
        QUEUE_EMAIL_KEY
    )

    console.log(rawJob)

    // If queue is empty,
    // Redis returns null.
    //
    if (!rawJob)

        return res.status(400).json({

            "message": "Error"

        })

    // Normally we would now:
    //
    // const job = JSON.parse(rawJob);
    //
    // sendEmail(job);
    //
    // Since this is just a demo,
    // we simply return success.
    //
    return res.status(200).json({

        "message": "Job popped. Email sent successully"

    })

})


// ============================================================
// Start Express Server.
//
// URL:
//
// http://localhost:3000
//
// Available APIs:
//
// POST /emails
//
// Adds a new Email Job.
//
// GET /emails/processone
//
// Removes one Email Job from the queue.
//
// ============================================================
app.listen(3000, () => {

    console.log("Server running on port 3000")

})

/* ====================================================================

                        THEORY : REDIS LIST AS A QUEUE

=======================================================================

Redis does NOT have a Queue data type.

Redis has a LIST data type.

A Queue is simply one way of using a Redis List.

-----------------------------------------------------------------------
FIFO
-----------------------------------------------------------------------

Queue follows

First In

First Out

Example

Insert

A

B

C

Remove

A

B

C

The first inserted element
is removed first.

-----------------------------------------------------------------------
How Redis creates Queue behaviour
-----------------------------------------------------------------------

Producer

LPUSH

↓

Redis List

↓

Worker

RPOP

Because insertion and removal happen
from opposite ends,

the oldest element comes out first.

-----------------------------------------------------------------------
Example
-----------------------------------------------------------------------

LPUSH A

Queue

A

LPUSH B

Queue

B

A

LPUSH C

Queue

C

B

A

Now

RPOP

returns

A

Queue becomes

C

B

Again

RPOP

returns

B

Again

RPOP

returns

C

FIFO achieved.

-----------------------------------------------------------------------
Useful Redis List Commands
-----------------------------------------------------------------------

LPUSH

Insert on LEFT.

RPUSH

Insert on RIGHT.

LPOP

Remove from LEFT.

RPOP

Remove from RIGHT.

LRANGE

View list contents.

Example

LRANGE queue 0 -1

returns every element.

LLEN

Returns number of items
inside queue.

LINDEX

Returns one element
using index.

LREM

Remove a particular item.

LTRIM

Keep only a specified range.

-----------------------------------------------------------------------
Real-world Uses
-----------------------------------------------------------------------

Email Queue

Video Encoding Queue

Image Processing Queue

Payment Queue

Notification Queue

Report Generation Queue

Background Jobs

-----------------------------------------------------------------------
Why use Queue?
-----------------------------------------------------------------------

Without Queue

User

↓

Server

↓

Send Email

↓

Wait

↓

Response

Slow.

With Queue

User

↓

Server

↓

Redis Queue

↓

Response immediately

↓

Worker sends email later.

Fast.

==================================================================== */