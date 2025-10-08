const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const tourPackageUpload = require('../Middleware/tourPackageUploadMiddleware');
const { protect } = require('../Middleware/authMiddleware');

// Upload tour package images
router.post('/tour-package-images', protect, tourPackageUpload.array('images', 10), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const uploadedImages = req.files.map(file => ({
      url: `/uploads/tour-packages/${file.filename}`,
      caption: '',
      isPrimary: false
    }));

    res.json({ 
      message: 'Images uploaded successfully',
      images: uploadedImages
    });
  } catch (error) {
    console.error('Error uploading tour package images:', error);
    res.status(500).json({ message: 'Error uploading images' });
  }
});

// Delete tour package image
router.delete('/tour-package-images/:filename', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/tour-packages', filename);

    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ message: 'Image not found' });
    }
  } catch (error) {
    console.error('Error deleting tour package image:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

module.exports = router;
