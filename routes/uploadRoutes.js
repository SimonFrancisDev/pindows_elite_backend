import express from "express";
import multer from "multer";
import path from "path";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Define where files go and their names
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// ✅ Only accept image files
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb("Images only!");
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// ✅ Route: POST /api/uploads (Admin only)
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  upload.single("image"),
  (req, res) => {
    res.send({
      message: "Image uploaded successfully.",
      image: `/uploads/${req.file.filename}`,
    });
  }
);

export default router;
