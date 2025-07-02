import express from 'express';
import multer from 'multer';
import { uploadPodcast } from '../controllers/uploadController';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('podcast'), uploadPodcast);

export default router;