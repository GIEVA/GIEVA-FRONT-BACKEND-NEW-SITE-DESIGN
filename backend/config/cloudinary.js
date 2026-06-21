import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dqkgwscbl',
  api_key: process.env.CLOUDINARY_API_KEY || '439349238494229',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'kpXqydeHUdB351MY-9UlDNOeRys',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = "user_profiles"; // default folder
    let resourceType = "image";   // default type
    

    if (file.mimetype.startsWith("video")) {
      resourceType = "video";
      folder = "user_videos";
    } else if (file.mimetype.startsWith("image")) {
      resourceType = "image";
      folder = "user_images";
    } else if (file.mimetype === "application/pdf") {
      resourceType = "raw";
      folder = "user_documents";
    } else if (file.fieldname === "passport") {
        folder = "heals/passports";
      } else if (file.fieldname === "transcript") {
        folder = "heals/transcripts";
      } else if (file.fieldname === "sop") {
        folder = "heals/sop";
      } else if (file.fieldname === "recommendation") {
        folder = "heals/recommendations";
      } else if (file.fieldname === "bankStatement") {
        folder = "heals/bank_statements";
      } else if (file.fieldname === "otherDoc") {
        folder = "heals/others";
      }

    return {
      folder: folder,
      resource_type: resourceType,
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

export { cloudinary, storage };
