import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { uploadToCloudinary } from "../lib/cloudinary";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ALLOWED_VIDEO_TYPES = [
      "video/mp4", "video/webm", "video/quicktime",
      "video/avi", "video/x-msvideo", "video/x-matroska",
      "video/3gpp", "video/x-flv",
    ];
    if (file.mimetype.startsWith("image/") || ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed."));
    }
  },
});

router.post("/storage/upload", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  if (!process.env.CLOUDINARY_API_KEY) {
    res.status(500).json({ error: "Cloudinary not configured" });
    return;
  }

  try {
    const mediaUrl = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      "squawk"
    );
    res.json({ mediaUrl });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ error: "Failed to upload file to Cloudinary" });
  }
});

export default router;
