import express from "express";
import multer from "multer";
import { clerkMiddleware } from "@clerk/express";
import {
  createBusinessProfile,
  getMyBusinessProfile,
  updateBusinessProfile,
} from "../controllers/businessProfileController.js";

const businessProfileRouter = express.Router();

businessProfileRouter.use(clerkMiddleware());

// Use memory storage so we can stream directly to Cloudinary from buffers
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
});

// Create Business Profile
businessProfileRouter.post(
  "/",
  upload.fields([
    { name: "logoName", maxCount: 1 },
    { name: "stampName", maxCount: 1 },
    { name: "signatureNameMeta", maxCount: 1 },
  ]),
  createBusinessProfile,
);

// Update Business Profile
businessProfileRouter.put(
  "/:id",
  upload.fields([
    { name: "logoName", maxCount: 1 },
    { name: "stampName", maxCount: 1 },
    { name: "signatureNameMeta", maxCount: 1 },
  ]),
  updateBusinessProfile,
);

businessProfileRouter.get("/me", getMyBusinessProfile);

export default businessProfileRouter;
