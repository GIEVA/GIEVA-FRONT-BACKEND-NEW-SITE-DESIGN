import { cloudinary } from "../config/cloudinary.js";

export const generateSecureUrl = (lesson) => {
  if (!lesson.cloudinaryPublicId) return lesson.contentUrl;

  return cloudinary.url(lesson.cloudinaryPublicId, {
    resource_type: lesson.cloudinaryResourceType || "image",
    type: "authenticated",
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 300, // 5 mins
  });
};