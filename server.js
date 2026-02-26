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

// Serve static files
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

        // Generate link - automatically handles any domain
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
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${uploadDir}`);
});