// pages/api/upload.js
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { getServerSession } from "next-auth/next";
import { checkPermission, PERMISSIONS, hasPermission } from "@/lib/rbac";
import { authOptions } from './auth/[...nextauth]';

const checkAuth = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  return session;
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const session = await checkAuth(req, res);
  if (!session) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    if (!hasPermission(session.user.userRole, PERMISSIONS.CREATE)) {
      return res.status(403).json({ message: "Permission denied" });
    }
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const folder = fields.folder?.[0] || 'uploads';
    const originalFolder = fields.originalFolder?.[0];
    const isEdit = fields.isEdit?.[0] === 'true';
    const oldPath = fields.path?.[0]; // example: /media/OldFolder/image.jpg
    const file = files.file?.[0];
    const imageUrl = fields.url?.[0];

    // Log the current working directory and environment
    console.log(`Current working directory: ${process.cwd()}`);
    console.log(`Node environment: ${process.env.NODE_ENV}`);
    
    // IMPORTANT: In production with Next.js, the 'public' directory structure matters
    // Use the correct absolute path depending on the environment
    let publicDir;
    if (process.env.NODE_ENV === 'production') {
      // In production, make sure we're using the correct public directory
      publicDir = path.join(process.cwd(), 'public');
      console.log(`Using production public directory: ${publicDir}`);
    } else {
      // In development, use the standard public directory
      publicDir = path.join(process.cwd(), 'public');
      console.log(`Using development public directory: ${publicDir}`);
    }

    // Get the full path to the media directory
    const mediaDir = path.join(publicDir, 'media');
    console.log(`Media directory path: ${mediaDir}`);
    
    // Create media directory if it doesn't exist
    if (!fs.existsSync(mediaDir)) {
      console.log(`Creating media directory at: ${mediaDir}`);
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    // Create folder directory if it doesn't exist
    const uploadDir = path.join(mediaDir, folder);
    console.log(`Upload directory path: ${uploadDir}`);
    
    if (!fs.existsSync(uploadDir)) {
      console.log(`Creating folder directory at: ${uploadDir}`);
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let buffer;
    let filename;

    if (file) {
      console.log(`Processing uploaded file: ${file.originalFilename}, size: ${file.size} bytes`);
      const ext = path.extname(file.originalFilename || '') || '.jpg';
      filename = `${uuidv4()}${ext}`;
      buffer = fs.readFileSync(file.filepath);
      console.log(`Generated filename: ${filename}`);
    } else if (imageUrl) {
      try {
        new URL(imageUrl);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid URL format' });
      }

      try {
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });

        const contentType = response.headers['content-type'];
        let ext = '.jpg';
        if (contentType.includes('png')) ext = '.png';
        else if (contentType.includes('gif')) ext = '.gif';
        else if (contentType.includes('webp')) ext = '.webp';

        const desiredName = fields.name?.[0];
        filename = desiredName ? `${desiredName}${ext}` : `${uuidv4()}${ext}`;
        buffer = Buffer.from(response.data, 'binary');
      } catch (error) {
        console.error('Error downloading image:', error);
        return res.status(400).json({ success: false, message: 'Failed to download image' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'No file or URL provided' });
    }

    // ✅ Delete original file if folder was changed during edit
    if (isEdit && oldPath) {
      try {
        const oldFilename = path.basename(oldPath);
        const oldFolder = path.dirname(oldPath).split('/').pop(); // extract old folder name
        const oldFilePath = path.join(mediaDir, oldFolder, oldFilename);
        console.log(`Checking for old file at: ${oldFilePath}`);

        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`Deleted old file: ${oldFilePath}`);
        } else {
          console.log(`Old file not found: ${oldFilePath}`);
        }
      } catch (error) {
        console.error('Error handling old file:', error);
        // Continue with the upload even if deleting the old file fails
      }
    }

    // Save the new file
    const filePath = path.join(uploadDir, filename);
    console.log(`Saving file to: ${filePath}`);
    
    try {
      // Use writeFile with a callback to handle any async issues
      fs.writeFileSync(filePath, buffer);
      console.log(`File saved successfully: ${filePath}`);
      
      // Verify the file was actually saved
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`Verified file exists. Size: ${stats.size} bytes`);
        
        // Check file permissions
        const perms = stats.mode.toString(8);
        console.log(`File permissions: ${perms}`);
        
        // List directory contents to verify
        console.log(`Directory contents of ${uploadDir}:`);
        const dirContents = fs.readdirSync(uploadDir);
        console.log(dirContents);
      } else {
        console.error(`!!! File was not saved: ${filePath}`);
        throw new Error(`File could not be verified: ${filePath}`);
      }
    } catch (saveError) {
      console.error(`Error saving file: ${saveError.message}`);
      throw saveError;
    }

    // Construct the relative URL that will be used by the client
    // Always use forward slashes for URLs, even on Windows
    const relativeUrl = `/media/${folder}/${filename}`.replace(/\\/g, '/');
    console.log(`Generated URL: ${relativeUrl}`);

    // Also construct a clean relative path for internal use
    const relativePath = `media/${folder}/${filename}`.replace(/\\/g, '/');
    console.log(`Relative path: ${relativePath}`);

    return res.status(200).json({
      success: true,
      url: relativeUrl,
      path: relativePath,
      fileName: filename,
      createdDate: new Date().toISOString(),
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
}
