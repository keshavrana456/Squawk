import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(
  buffer: Buffer,
  mimetype: string,
  folder = "squawk"
): Promise<string> {
  const resourceType = mimetype.startsWith("video/") ? "video" : "image";

  return new Promise((resolve, reject) => {
    const uploadOptions: Record<string, any> = {
      folder,
      resource_type: resourceType,
      quality: "auto",
      fetch_format: "auto",
    };

    if (resourceType === "video") {
      uploadOptions.video_codec = "auto";
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No result from Cloudinary"));
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
}

export { cloudinary };
