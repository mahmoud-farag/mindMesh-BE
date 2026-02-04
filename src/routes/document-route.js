import express from 'express';

import { documentController } from '../controllers/index.js';
import { checkAuth } from '../middlewares/index.js';
import uploadFiles from '../config/multer.js';

const router = express.Router();


// public routes



// protected routes
router.post('/init-upload', checkAuth, documentController.initUpload);
router.patch('/:documentId/confirm-upload', checkAuth, documentController.confirmUpload);
router.post('/upload-pdf', checkAuth, uploadFiles({ allowedMimeTypes: ['application/pdf'] }), documentController.uploadDocument);
router.get('/', checkAuth, documentController.getDocuments);
router.get('/:documentId', checkAuth, documentController.getDocument);
router.delete('/:documentId', checkAuth, documentController.deleteDocument);

export default router;
