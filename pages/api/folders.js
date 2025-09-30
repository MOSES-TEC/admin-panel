// pages/api/folders.js
import fs from 'fs';
import path from 'path';
import { checkPermission, PERMISSIONS, hasPermission } from "@/lib/rbac";
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

const checkAuth = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  return session;
};


export default async function handler(req, res) {
  const publicDir = path.join(process.cwd(), 'public');
  const mediaDir = path.join(publicDir, 'media');

  // Create media directory if it doesn't exist
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }

  // GET: List all folders
  if (req.method === 'GET') {
    try {
      const folders = fs.readdirSync(mediaDir)
        .filter(item => fs.statSync(path.join(mediaDir, item)).isDirectory());

      if (folders.length === 0) {
        const defaultFolders = ['Local', 'Personal', 'Website'];
        defaultFolders.forEach(folder => {
          const folderPath = path.join(mediaDir, folder);
          if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
          }
        });

        return res.status(200).json({ folders: defaultFolders });
      }

      return res.status(200).json({ folders });
    } catch (error) {
      console.error('Error reading folders:', error);
      return res.status(500).json({ error: 'Failed to read folders' });
    }
  }

  // POST: Create a new folder
  if (req.method === 'POST') {
    const session = await checkAuth(req, res);
    if (!session) return;

    try {
      if (!hasPermission(session.user.userRole, PERMISSIONS.CREATE)) {
        return res.status(403).json({ message: "Permission denied" });
      }
      const { folderName } = req.body;

      if (!folderName || typeof folderName !== 'string') {
        return res.status(400).json({ success: false, error: 'Invalid folder name' });
      }

      const sanitizedName = folderName.replace(/[\/\\?%*:|"<>]/g, '-');
      const folderPath = path.join(mediaDir, sanitizedName);

      if (fs.existsSync(folderPath)) {
        return res.status(400).json({ success: false, error: 'Folder already exists' });
      }

      fs.mkdirSync(folderPath, { recursive: true });
      return res.status(200).json({ success: true, folder: sanitizedName });
    } catch (error) {
      console.error('Error creating folder:', error);
      return res.status(500).json({ success: false, error: 'Failed to create folder' });
    }
  }

  // PUT: Rename a folder
  if (req.method === 'PUT') {
    const session = await checkAuth(req, res);
    if (!session) return;

    try {
      if (!hasPermission(session.user.userRole, PERMISSIONS.UPDATE)) {
        return res.status(403).json({ message: "Permission denied" });
      }
      const { oldName, newName } = req.body;

      if (!oldName || !newName || typeof oldName !== 'string' || typeof newName !== 'string') {
        return res.status(400).json({ success: false, error: 'Invalid folder names' });
      }

      const sanitizedOld = oldName.replace(/[\/\\?%*:|"<>]/g, '-');
      const sanitizedNew = newName.replace(/[\/\\?%*:|"<>]/g, '-');

      const oldPath = path.join(mediaDir, sanitizedOld);
      const newPath = path.join(mediaDir, sanitizedNew);

      if (!fs.existsSync(oldPath)) {
        return res.status(404).json({ success: false, error: 'Original folder does not exist' });
      }

      if (fs.existsSync(newPath)) {
        const isSame = sanitizedOld.toLowerCase() === sanitizedNew.toLowerCase();
        
        // Allow rename if it's just a case change (e.g. 'Local' → 'local')
        if (!isSame || sanitizedOld === sanitizedNew) {
          return res.status(400).json({ success: false, error: 'Folder already exists' });
        }
      }
      

      fs.renameSync(oldPath, newPath);
      return res.status(200).json({ success: true, oldName: sanitizedOld, newName: sanitizedNew });
    } catch (error) {
      console.error('Error renaming folder:', error);
      return res.status(500).json({ success: false, error: 'Failed to rename folder' });
    }
  }

   // DELETE: Delete a folder
   if (req.method === 'DELETE') {
    const session = await checkAuth(req, res);
    if (!session) return;

    try {
      if (!hasPermission(session.user.userRole, PERMISSIONS.DELETE)) {
        return res.status(403).json({ message: "Permission denied" });
      }
      const { folderName } = req.body;

      if (!folderName || typeof folderName !== 'string') {
        return res.status(400).json({ success: false, error: 'Invalid folder name' });
      }

      const sanitizedName = folderName.replace(/[\/\\?%*:|"<>]/g, '-');
      const folderPath = path.join(mediaDir, sanitizedName);

      if (!fs.existsSync(folderPath)) {
        return res.status(404).json({ success: false, error: 'Folder does not exist' });
      }

      // Recursively delete folder contents
      fs.rmSync(folderPath, { recursive: true, force: true });

      return res.status(200).json({ success: true, deleted: sanitizedName });
    } catch (error) {
      console.error('Error deleting folder:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete folder' });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
