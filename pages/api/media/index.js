import fs from 'fs';
import path from 'path';
import sizeOf from 'image-size';
import { checkPermission, PERMISSIONS, hasPermission } from "@/lib/rbac";
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  console.log(`API Request: ${req.method} ${req.url}`);
  console.log(`Node environment: ${process.env.NODE_ENV}`);
  
  // Use the standard public directory path
  const publicDir = path.join(process.cwd(), 'public');
  console.log(`Public directory: ${publicDir}`);
  
  const mediaDir = path.join(publicDir, 'media');
  console.log(`Media directory: ${mediaDir}`);
  
  // Create media directory if it doesn't exist
  if (!fs.existsSync(mediaDir)) {
    console.log(`Creating media directory: ${mediaDir}`);
    fs.mkdirSync(mediaDir, { recursive: true });
  }

  // DELETE: Delete a media item
  if (req.method === 'DELETE') {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      if (!hasPermission(session.user.userRole, PERMISSIONS.DELETE)) {
        return res.status(403).json({ message: "Permission denied" });
      }
      const { path: filePath, folder } = req.body;
      
      console.log(`Delete request for path: ${filePath}, folder: ${folder}`);
      
      if (!filePath || !folder) {
        return res.status(400).json({ success: false, error: 'Path and folder are required' });
      }
      
      // Sanitize and validate the path to prevent directory traversal
      // Handle paths with or without leading slash
      const normalizedPath = filePath.startsWith('/') 
        ? filePath.substring(1) // Remove leading slash if present
        : filePath;
        
      console.log(`Normalized path: ${normalizedPath}`);
      
      // Construct absolute path by joining with public directory
      const fullPath = path.join(publicDir, normalizedPath);
      console.log(`Full path: ${fullPath}`);
      
      // Additional security check - ensure the file is within the media directory
      if (!fullPath.startsWith(mediaDir)) {
        console.error(`Invalid file path: ${fullPath} is not within ${mediaDir}`);
        return res.status(403).json({ success: false, error: 'Invalid file path' });
      }
      
      // Check if file exists before trying to delete
      if (!fs.existsSync(fullPath)) {
        console.error(`File not found: ${fullPath}`);
        return res.status(404).json({ success: false, error: 'File not found' });
      }
      
      // Delete the file
      fs.unlinkSync(fullPath);
      console.log(`Successfully deleted file: ${fullPath}`);
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting file:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete file' });
    }
  }

  // GET: List media items with pagination
  if (req.method === 'GET') {
    try {
      const { folder = '', page = 1, limit = 20 } = req.query;
      
      console.log(`GET request for folder: ${folder}, page: ${page}, limit: ${limit}`);
      
      if (!folder) {
        return res.status(200).json({ 
          items: [],
          totalCount: 0,
          currentPage: 1,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        });
      }
      
      const folderPath = path.join(mediaDir, folder);
      console.log(`Folder path: ${folderPath}`);
      
      // Check if folder exists
      if (!fs.existsSync(folderPath)) {
        console.warn(`Media folder not found: ${folderPath}`);
        // Create the folder if it doesn't exist
        try {
          fs.mkdirSync(folderPath, { recursive: true });
          console.log(`Created media folder: ${folderPath}`);
        } catch (mkdirError) {
          console.error(`Failed to create media folder: ${mkdirError.message}`);
        }
        
        // Return empty list with proper pagination info
        return res.status(200).json({ 
          items: [],
          totalCount: 0,
          currentPage: 1,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        });
      }
      
      console.log(`Reading directory: ${folderPath}`);
      const files = fs.readdirSync(folderPath)
        .filter(file => {
          try {
            const filePath = path.join(folderPath, file);
            const isFile = fs.statSync(filePath).isFile();
            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file);
            return isFile && isImage;
          } catch (error) {
            console.error(`Error checking file ${file}:`, error);
            return false;
          }
        })
        .sort((a, b) => {
          try {
            const aStat = fs.statSync(path.join(folderPath, a));
            const bStat = fs.statSync(path.join(folderPath, b));
            return bStat.mtime.getTime() - aStat.mtime.getTime();
          } catch (error) {
            console.error('Error sorting files:', error);
            return 0;
          }
        });

      console.log(`Found ${files.length} files in ${folderPath}`);

      // Calculate pagination
      const totalCount = files.length;
      const totalPages = Math.ceil(totalCount / limit);
      const currentPage = Math.min(Math.max(1, parseInt(page)), totalPages || 1);
      const startIndex = (currentPage - 1) * limit;
      const endIndex = Math.min(startIndex + limit, totalCount);
      const paginatedFiles = files.slice(startIndex, endIndex);

      console.log(`Pagination: page ${currentPage} of ${totalPages}, showing ${paginatedFiles.length} items`);

      // Get file details
      const items = await Promise.all(paginatedFiles.map(async file => {
        try {
          const filePath = path.join(folderPath, file);
          const stats = fs.statSync(filePath);
          const dimensions = getImageDimensions(filePath);
          
          // Always use forward slashes for URLs
          const relativePath = `/media/${folder}/${file}`.replace(/\\/g, '/');
          const internalPath = `media/${folder}/${file}`.replace(/\\/g, '/');
          
          return {
            name: file,
            url: relativePath,
            path: internalPath,
            size: stats.size,
            dimensions,
            date: stats.mtime,
            folder
          };
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
          return null;
        }
      }));

      // Filter out any null items from errors
      const validItems = items.filter(item => item !== null);
      
      console.log(`Returning ${validItems.length} valid items`);

      return res.status(200).json({
        items: validItems,
        totalCount,
        currentPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      });
    } catch (error) {
      console.error('Error reading media items:', error);
      return res.status(500).json({ 
        error: 'Failed to read media items',
        message: error.message 
      });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}

// Helper function to get image dimensions
function getImageDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const dimensions = sizeOf(buffer);
    return {
      width: dimensions?.width || 0,
      height: dimensions?.height || 0
    };
  } catch (error) {
    console.error(`Error getting dimensions for ${filePath}:`, error);
    return { width: 0, height: 0 };
  }
} 