import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

// Map of common MIME types
const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

/**
 * Custom API handler for serving media files
 * This is needed because Next.js production builds have issues with accessing files
 * directly from the public directory
 */
export default function handler(req, res) {
  const { path: pathArr } = req.query;
  
  // Join all path segments to get the full path
  const relativePath = Array.isArray(pathArr) ? pathArr.join('/') : pathArr;
  console.log(`[media-serve] Request for: ${relativePath}`);
  
  // Check if this is a download request
  const isDownload = req.query.download === 'true';
  console.log(`[media-serve] Is download request: ${isDownload}`);
  
  // Construct the full file path
  const publicDir = path.join(process.cwd(), 'public');
  const filePath = path.join(publicDir, 'media', relativePath);
  console.log(`[media-serve] Full path: ${filePath}`);

  // Security check to prevent directory traversal
  if (!filePath.startsWith(path.join(publicDir, 'media'))) {
    console.error(`[media-serve] Security error - path traversal attempt: ${filePath}`);
    return res.status(403).end('Forbidden');
  }

  // Check if the file exists
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`[media-serve] File not found: ${filePath}`);
      return res.status(404).end('File not found');
    }

    // Get file stats
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      console.error(`[media-serve] Not a file: ${filePath}`);
      return res.status(404).end('Not a file');
    }

    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const fileName = path.basename(filePath);

    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);
    
    // If it's a download request, set download headers
    if (isDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    } else {
      // For regular viewing, set cache headers 
      res.setHeader('Cache-Control', 'no-store, must-revalidate');
      // Allow CORS for direct linking
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    console.log(`[media-serve] Successfully serving: ${filePath}`);
  } catch (error) {
    console.error(`[media-serve] Error serving file: ${error.message}`);
    res.status(500).end('Internal Server Error');
  }
} 