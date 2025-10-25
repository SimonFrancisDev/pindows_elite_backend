// /middleware/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1️⃣ Storage Configuration (Local Disk) ---
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Store uploaded files inside 'uploads/' directory
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename(req, file, cb) {
    // Create a unique filename: image-<timestamp>.jpg
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${file.fieldname}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

// --- 2️⃣ File Filter (Validate File Type) ---
const checkFileType = (file, cb) => {
  const allowedTypes = /jpe?g|png|webp/; // Added webp for modern image format

  const extValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowedTypes.test(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new Error('❌ Only images (JPEG, PNG, WEBP) are allowed!'));
  }
};

// --- 3️⃣ Multer Upload Setup ---
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

// --- 4️⃣ Middleware for Single Image Upload ---
export const uploadSingleImage = upload.single('image');
