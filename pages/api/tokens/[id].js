import { dbConnect } from "@/lib/dbConnect";
import APIToken from '@/models/APIToken';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
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
    const { id } = req.query;

    switch (req.method) {
        case 'DELETE':
            try {
                if (!hasPermission(session.user.userRole, PERMISSIONS.DELETE)) {
                    return res.status(403).json({ message: "Permission denied" });
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
                res.status(500).json({ error: 'Error deleting token' });
            }
            break;

        case 'PUT':
            try {
                if (!hasPermission(session.user.userRole, PERMISSIONS.UPDATE)) {
                    return res.status(403).json({ message: "Permission denied" });
                }
                const updatedToken = await APIToken.findByIdAndUpdate(
                    id,
                    {
                        name: req.body.name,
                        description: req.body.description,
                        tokenType: req.body.tokenType,
                        duration: req.body.duration,
                    },
                    { new: true, runValidators: true }
                );

                if (!updatedToken) {
                    return res.status(404).json({ error: 'Token not found' });
                }

                res.status(200).json(updatedToken);
            } catch (error) {
                res.status(500).json({ error: 'Error updating token' });
            }
            break;

        default:
            res.setHeader('Allow', ['DELETE', 'PUT']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
