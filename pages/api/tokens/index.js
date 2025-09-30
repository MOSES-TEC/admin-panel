import { dbConnect } from '@/lib/dbConnect';
import APIToken from '@/models/APIToken';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { checkPermission, PERMISSIONS, hasPermission } from "@/lib/rbac";

const checkAuth = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  return session;
};



export default async function handler(req, res) {
  await dbConnect();
  const session = await checkAuth(req, res);
  if (!session) return;

  switch (req.method) {
    case 'GET':

      try {
        const tokens = await APIToken.find().sort({ createdAt: -1 });
        res.status(200).json(tokens);
      } catch (error) {
        res.status(500).json({ error: 'Error fetching API tokens' });
      }
      break;

    case 'POST':
      if (!hasPermission(session.user.userRole, PERMISSIONS.CREATE)) {
        return res.status(403).json({ message: "Permission denied" });
      }

      try {
        const { name, description, tokenType, duration } = req.body;
        const token = uuidv4();

        const newToken = await APIToken.create({
          name,
          description,
          token,
          tokenType,
          duration
        });

        res.status(201).json(newToken);
      } catch (error) {
        res.status(500).json({ error: 'Error creating API token' });
      }
      break;


      try {
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({ error: 'Token ID is required' });
        }

        // Option 1: Hard delete
        const deletedToken = await APIToken.findByIdAndDelete(id);

        // Option 2: Soft delete (recommended)
        // const deletedToken = await APIToken.findByIdAndUpdate(
        //   id,
        //   { isActive: false },
        //   { new: true }
        // );

        if (!deletedToken) {
          return res.status(404).json({ error: 'Token not found' });
        }


        res.status(200).json({ message: 'Token deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Error deleting API token' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}