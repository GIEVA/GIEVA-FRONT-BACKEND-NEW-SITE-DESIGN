import multer from 'multer';
import { storage } from '../config/cloudinary.js';

const upload = multer({ storage: storage });


export default upload;


// import multer from "multer";
// import path from "path";

// const upload = multer({
//   storage: multer.diskStorage({}),
//   fileFilter: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
//       cb(new Error("Unsupported file type!"), false);
//       return;
//     }
//     cb(null, true);
//   },
// });