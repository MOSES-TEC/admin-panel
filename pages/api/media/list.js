import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { folder = 'uploads', page = 1, limit = 20 } = req.query;
    const mediaDir = path.join(process.cwd(), 'public', 'media', folder);

    if (!fs.existsSync(mediaDir)) {
      return res.status(200).json({ 
        success: true, 
        images: [], 
        total: 0,
        page: 1,
        totalPages: 0
      });
    }

    // Get all files in the directory
    const files = fs.readdirSync(mediaDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.mkv', '.webm', '.jfif'].includes(ext);
      })
      .map(file => ({
        name: file,
        url: `/media/${folder}/${file}`,
        path: path.join('media', folder, file)
      }));

    // Calculate pagination
    const total = files.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFiles = files.slice(startIndex, endIndex);

    return res.status(200).json({ 
      success: true, 
      images: paginatedFiles,
      total,
      page: parseInt(page),
      totalPages
    });
  } catch (error) {
    console.error('Error listing media:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to list media files' 
    });
  }
} 