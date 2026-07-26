import Redis from 'ioredis'
import express from 'express'

const app=express()
app.use(express.json());
const redis=new Redis(process.env.REDIS_URL || "redis://localhost:6379");



app.post('/otp',async (req,res)=>{
    const {phn}=req.body;
    const generated_otp=Math.floor(100000 + Math.random() * 900000);
    await redis.set(phn,generated_otp,'EX', 16);
    res.json({ otp: generated_otp });
    
})

app.post('/verify',async (req,res)=>{
    const { phn, otp } = req.body;
    console.log(phn,otp);
    const savedOtp=await redis.get(phn);
    console.log(savedOtp);

    if(!savedOtp){
        return res.status(400).json({"message":"OTP expired or not found"});
    }

    if(Number(otp)!==Number(savedOtp)){
        return res.status(400).json({"message":"Invalid OTP"});
    }

    // await redis.del(phn);
    return res.status(200).json({"message":"OTP verified successfully"});

})

app.listen(3030,()=>{
    console.log("Server is running on port 3030");
})