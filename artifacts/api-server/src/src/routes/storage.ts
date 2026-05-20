import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const IS_VERCEL = process.env.VERCEL === "1" || !!process.env.BLOB_READ_WRITE_TOKEN;

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
if (!IS_VERCEL) {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

const storage = IS_VERCEL
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, UPLOADS_DIR);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${randomUUID()}${ext}`);
      },
    });

const upload = multer({
  storage,
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
      cb(new Error("Only image and video files are allowed. Audio files are not permitted."));
    }
  },
});

router.post("/storage/upload", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  if (IS_VERCEL) {
    try {
      const { put } = await import("@vercel/blob");
      const ext = path.extname(req.file.originalname);
      const filename = `uploads/${randomUUID()}${ext}`;
      const blob = await put(filename, req.file.buffer as Buffer, {
        access: "public",
        contentType: req.file.mimetype,
      });
      res.json({ mediaUrl: blob.url });
    } catch (err) {
      console.error("Vercel Blob upload error:", err);
      res.status(500).json({ error: "Failed to upload file. Make sure BLOB_READ_WRITE_TOKEN is set." });
    }
    return;
  }

  const mediaUrl = `/api/storage/files/${req.file.filename}`;
  res.json({ mediaUrl });
});

router.get("/storage/files/:filename", (req: Request, res: Response) => {
  if (IS_VERCEL) {
    res.status(410).json({ error: "Local file serving is not available on Vercel. Files are served directly from Vercel Blob URLs." });
    return;
  }

  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.sendFile(filePath);
});

export default router;
