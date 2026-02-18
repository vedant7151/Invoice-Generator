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
const port = process.env.PORT || 4000;

// Trust proxy (needed for Render/Heroku to detect HTTPS correctly)
app.set('trust proxy', true);

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

// Serve static uploads (before API routes)
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    // Allow CORS for images
    res.set('Access-Control-Allow-Origin', '*');
  }
}))

// Diagnostic route to check uploads directory
app.get('/uploads-check', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    res.json({
      uploadsDir,
      fileCount: files.length,
      files: files.slice(0, 10), // First 10 files
      message: 'Uploads directory is accessible'
    });
  } catch (err) {
    res.status(500).json({ error: err.message, uploadsDir });
  }
})
app.use('/api/invoice' , invoiceRouter)

app.use('/api/businessProfile' , businessProfileRouter)
app.use('/api/ai' , aiInvoiceRouter)

app.get('/' , (req,res) =>{
    res.send("API working")
})

app.listen(port , ()=>{
    console.log(`Server started on port ${port}`)
})