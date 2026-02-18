import mongoose from "mongoose";
import BusinessProfile from "../models/businessModel.js";
import { getAuth } from "@clerk/express";
import cloudinary from "../config/cloudinary.js";

const CLOUDINARY_FOLDER =
  process.env.CLOUDINARY_FOLDER || "invoice-generator/business-profile";

async function uploadSingleToCloudinary(file, publicIdPrefix) {
  if (!file || !file.buffer) return null;

  const unique = `${publicIdPrefix}-${Date.now()}-${Math.round(
    Math.random() * 1e9,
  )}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        public_id: unique,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("[cloudinary] upload error:", error);
          return reject(error);
        }
        resolve(result.secure_url);
      },
    );

    stream.end(file.buffer);
  });
}

async function uploadedFilesToCloudinary(req, userId) {
  const urls = {};
  if (!req.files) return urls;

  const logoArr = req.files.logoName || req.files.logo || [];
  const stampArr = req.files.stampName || req.files.stamp || [];
  const sigArr = req.files.signatureNameMeta || req.files.signature || [];

  const [logoUrl, stampUrl, signatureUrl] = await Promise.all([
    uploadSingleToCloudinary(logoArr[0], `logo-${userId || "user"}`),
    uploadSingleToCloudinary(stampArr[0], `stamp-${userId || "user"}`),
    uploadSingleToCloudinary(sigArr[0], `signature-${userId || "user"}`),
  ]);

  if (logoUrl) urls.logoUrl = logoUrl;
  if (stampUrl) urls.stampUrl = stampUrl;
  if (signatureUrl) urls.signatureUrl = signatureUrl;

  return urls;
}

// Create a Business Profile
export async function createBusinessProfile(req, res) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const body = req.body || {};
    const fileUrls = await uploadedFilesToCloudinary(req, userId);
    const profile = new BusinessProfile({
      owner: userId,
      businessName: body.businessName || "ABC Solutions",
      email: body.email || "",
      address: body.address || "",
      phone: body.phone || "",
      gst: body.gst || "",
      logoUrl: fileUrls.logoUrl || body.logoUrl || null,
      stampUrl: fileUrls.stampUrl || body.stampUrl || null,
      signatureUrl: fileUrls.signatureUrl || body.signatureUrl || null,
      signatureOwnerName: body.signatureOwnerName || "",
      signatureOwnerTitle: body.signatureOwnerTitle || "",
      defaultTaxPercent:
        body.defaultTaxPercent !== undefined
          ? Number(body.defaultTaxPercent)
          : 18,
    });

    const saved = await profile.save();
    return res
      .status(201)
      .json({
        success: true,
        data: saved,
        message: "Business Profile Created",
      });

  } catch (error) {
    console.log(error)
    return res.status(500).json({
        success : false,
        message : "Server Error"
    })
  }
}


// Update A Business Profile

export async function updateBusinessProfile(req , res){
    try {
    
    const { userId } = getAuth(req);
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const {id} = req.params
    const body = req.body || {}
    const fileUrls = await uploadedFilesToCloudinary(req, userId)

    const exixsting = await BusinessProfile.findById(id)
    if(!exixsting){
        return res
        .status(402)
        .json({ success: false, message: "Business profile not found " });
    }

    if(exixsting.owner.toString() !== userId){
        return res
        .status(401)
        .json({ success: false, message: "You are forbidden for this profile" });
    }

    const update = {}
    if (body.businessName !== undefined) update.businessName = body.businessName;
    if (body.email !== undefined) update.email = body.email;
    if (body.address !== undefined) update.address = body.address;
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.gst !== undefined) update.gst = body.gst;

    if (fileUrls.logoUrl) update.logoUrl = fileUrls.logoUrl;
    else if (body.logoUrl !== undefined) update.logoUrl = body.logoUrl;

    if (fileUrls.stampUrl) update.stampUrl = fileUrls.stampUrl;
    else if (body.stampUrl !== undefined) update.stampUrl = body.stampUrl;

    if (fileUrls.signatureUrl) update.signatureUrl = fileUrls.signatureUrl;
    else if (body.signatureUrl !== undefined) update.signatureUrl = body.signatureUrl;

    if (body.signatureOwnerName !== undefined) update.signatureOwnerName = body.signatureOwnerName;
    
    if (body.signatureOwnerTitle !== undefined) update.signatureOwnerTitle = body.signatureOwnerTitle;
    if (body.defaultTaxPercent !== undefined) update.defaultTaxPercent = Number(body.defaultTaxPercent);

    const updated = await BusinessProfile.findByIdAndUpdate(id , update , {
        new : true,
        runValidators : true
    })

    return res.status(200).json({
        success : true,
        data : updated,
        message : "Profile Updated"
    })

    } catch (error) {
        console.log(error)
    return res.status(500).json({
        success : false,
        message : "Server Error"
    })
    }
}

//Get my Business Profile
export async function getMyBusinessProfile(req,res) {
    try {
        const { userId } = getAuth(req);
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    const profile = await BusinessProfile.findOne({owner : userId}).lean()
    if (!profile) {
        return res
        .status(204)
        .json({ success: false, message: "No Profile FOund" });
    }

    return res.status(200).json({success : true , data : profile})
    } catch (error) {
             console.log(error)
    return res.status(500).json({
        success : false,
        message : "Server Error"
    })
    }
}