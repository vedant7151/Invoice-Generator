import express from "express"
import cors from "cors"
import fs from "fs"
import path from "path"
import 'dotenv/config'
import {clerkMiddleware} from '@clerk/express'
import { connectDB } from "./config/db.js";
import invoiceRouter from "./routes/invoiceRouter.js";
import businessProfileRouter from "./routes/businessProfileRouter.js";
import aiInvoiceRouter from "./routes/aiInvoiceRouter.js";


const app = express();
const port = 4000;


//MIDDLEWARES - CORS: set CORS_ORIGIN when deploying (comma-separated for multiple origins)
// Example: CORS_ORIGIN=https://invoice-generator-ymle.vercel.app,http://localhost:5173
const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ["http://localhost:5173"];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        if (corsOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}))
app.use(express.json({ limit: '50mb' }))
app.use(clerkMiddleware())

// DB
connectDB()
// Ensure uploads dir exists (gitignored)
const uploadsDir = path.join(process.cwd(), "uploads")
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))
app.use('/api/invoice' , invoiceRouter)

app.use('/api/businessProfile' , businessProfileRouter)
app.use('/api/ai' , aiInvoiceRouter)

app.get('/' , (req,res) =>{
    res.send("API working")
})

app.listen(port , ()=>{
    console.log(`Server started on port ${port}`)
})