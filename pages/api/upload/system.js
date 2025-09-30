import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
    const [fields, files] = await form.parse(req);
    
    const folder = fields.folder?.[0] || 'uploads';
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

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

    // Generate a unique filename
    const ext = path.extname(file.originalFilename || '') || '.jpg';
    const filename = `${uuidv4()}${ext}`;

    // Save the file
    const filePath = path.join(uploadDir, filename);
    fs.renameSync(file.filepath, filePath);

    // Return the relative URL
    const relativeUrl = `/media/${folder}/${filename}`;
    
    return res.status(200).json({ 
      success: true, 
      url: relativeUrl,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to upload file' 
    });
  }
} 