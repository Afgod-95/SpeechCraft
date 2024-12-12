import multer from 'multer';
import path from 'path';

// Set storage options
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads'); // Ensure 'uploads' folder exists
        cb(null, uploadPath); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
        cb(null, true); 
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Configure Multer
const upload = multer({ storage, fileFilter });

// Export middleware
export const uploadMiddleware = upload.single('audio'); // Replace 'image' with your input field's name
