import { Router } from 'express'
import multer from 'multer'
import { join } from 'path'
import { mkdir, readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { requireAuth, AuthRequest } from '../middleware/auth.js'

// Magic bytes for image file types
const IMAGE_MAGIC_BYTES: { [key: string]: Buffer[] } = {
  'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
  'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38])],
  'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46]), Buffer.from([0x57, 0x45, 0x42, 0x50])],
}

// Validate file is actually an image by checking magic bytes
async function validateImageFile(filePath: string, mimetype: string): Promise<boolean> {
  try {
    const buffer = await readFile(filePath)
    const magicBytes = IMAGE_MAGIC_BYTES[mimetype]
    
    if (!magicBytes) {
      return false
    }

    // Check if file starts with any of the expected magic bytes for this mimetype
    return magicBytes.some(magic => buffer.slice(0, magic.length).equals(magic))
  } catch (error) {
    console.error('Error validating image file:', error)
    return false
  }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const uploadsDir = join(__dirname, '../../uploads')

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await mkdir(uploadsDir, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

ensureUploadsDir()

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadsDir()
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = file.originalname.split('.').pop()
    cb(null, `product-${uniqueSuffix}.${ext}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only allow single file
    fields: 10, // Limit number of fields
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024, // Limit field value size (1KB)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop() || '')
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'))
    }
  },
})

export const uploadRouter = Router()

// POST /api/admin/upload - Upload product image (admin)
uploadRouter.post('/', requireAuth, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Validate file is actually an image using magic bytes
    const isValidImage = await validateImageFile(req.file.path, req.file.mimetype)
    if (!isValidImage) {
      // Delete the uploaded file if it's not a valid image
      const { unlink } = await import('fs/promises')
      await unlink(req.file.path).catch(() => {})
      return res.status(400).json({ error: 'Invalid image file. File content does not match the file type.' })
    }

    // In production, you'd want to upload to cloud storage (S3, Cloudinary, etc.)
    // For now, return the file path relative to the public directory
    const fileUrl = `/uploads/${req.file.filename}`

    res.json({
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
    })
  } catch (error) {
    console.error('Upload error:', error)
    // Clean up file on error
    if (req.file) {
      const { unlink } = await import('fs/promises')
      await unlink(req.file.path).catch(() => {})
    }
    res.status(500).json({ error: 'Failed to upload image' })
  }
})
