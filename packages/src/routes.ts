import express, { type Request, type Response } from "express";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

router.post("/upload", async (req: Request, res: Response) => {
  try {
    const { buffer, public_id } = req.body;

    // public_id is optional => will be used to remove the older image from cloudinary
    if (public_id) {
      await cloudinary.uploader.destroy(public_id);
    }

    const cloud = await cloudinary.uploader.upload(buffer, {
      resource_type: "auto",
    });

    res.json({
      url: cloud.secure_url,
      public_id: cloud.public_id,
    });
  } catch (error: any) {
    console.error("[PACKAGES SERVICE] Error uploading image:", error);
    res
      .status(500)
      .json({ error: "Internal server error", stack: error.message });
  }
});

export default router;
