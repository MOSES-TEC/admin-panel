import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const form = formidable({});
    const [fields] = await form.parse(req);
    
    const imageUrl = fields.url?.[0];
    const folder = fields.folder?.[0] || 'uploads';

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image URL is required' });
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid URL format' });
    }

    // Download the image
    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.data) {
      return res.status(400).json({ success: false, message: 'Failed to download image' });
    }

    const buffer = Buffer.from(response.data, 'binary');

    // Generate a unique filename
    const ext = path.extname(imageUrl) || '.jpg';
    const filename = `${uuidv4()}${ext}`;

    // Create the media directory if it doesn't exist
    const mediaDir = path.join(process.cwd(), 'public', 'media');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    // Create the specific folder inside media if it doesn't exist
    const uploadDir = path.join(mediaDir, folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save the file
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    // Return the relative URL
    const relativeUrl = `/media/${folder}/${filename}`;
    
    return res.status(200).json({ 
      success: true, 
      url: relativeUrl,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading external image:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to upload image' 
    });
  }
} 