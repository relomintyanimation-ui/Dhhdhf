const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const projectId = req.body.projectId || 'default';
        const projectPath = path.join('uploads', projectId);
        const fullPath = path.join(__dirname, projectPath);
        
        // Create project directory if not exists
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
        
        cb(null, projectPath);
    },
    filename: function (req, file, cb) {
        // Clean filename: remove spaces, special chars
        const cleanName = file.originalname
            .replace(/[^a-zA-Z0-9.-]/g, '-')
            .replace(/\s+/g, '-');
        cb(null, cleanName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// IMPORTANT: MIME types for correct file rendering
const mimeTypes = {
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
    '.pdf': 'application/pdf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
};

// Serve uploaded files with correct MIME types
app.use('/uploads', (req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    if (mimeTypes[ext]) {
        res.setHeader('Content-Type', mimeTypes[ext]);
    }
    next();
}, express.static(path.join(__dirname, 'uploads')));

// Serve main static files
app.use(express.static(__dirname));

// Upload endpoint
app.post('/upload', upload.array('files'), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No files uploaded' 
            });
        }

        const projectId = req.body.projectId || Date.now().toString();
        const files = req.files.map(f => f.filename);
        
        // Find index.html or use first file
        const mainFile = files.find(f => f.toLowerCase() === 'index.html') || files[0];

        // Generate link
        const link = `${req.protocol}://${req.get('host')}/uploads/${projectId}/${mainFile}`;

        res.json({
            success: true,
            projectId: projectId,
            link: link,
            mainFile: mainFile,
            files: files
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during upload' 
        });
    }
});

// Handle 404
app.use((req, res) => {
    if (req.path.startsWith('/uploads/')) {
        res.status(404).send('File not found');
    } else {
        res.status(404).sendFile(path.join(__dirname, '404.html'));
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${uploadDir}`);
    console.log(`🔧 MIME types configured for ${Object.keys(mimeTypes).length} file types`);
});