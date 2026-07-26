import express from 'express'
import Redis from 'ioredis'

const app=express()
app.use(express.json())

const redis = new Redis(
    process.env.REDIS_URL || "redis://localhost:6379"
);

const QUEUE_EMAIL_KEY='queue_emails'

app.post('/emails',async(req,res)=>{

    const job={
        to: req.body.to,
        from:req.body.from,
        emailBody:req.body.emailBody,
        createdAt: new Date.toISOString()
    }

    await redis.lpush(QUEUE_EMAIL_KEY,JSON.stringify(job))

    res.status(200).json({"message":"Job added","job":job})

})