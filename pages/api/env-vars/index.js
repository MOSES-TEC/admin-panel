import { dbConnect } from '@/lib/dbConnect';
import EnvVar from '../../../models/EnvVar';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req, res) {
    await dbConnect();

    const checkAuth = async (req, res) => {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            res.status(401).json({ message: "Unauthorized" });
            return false;
        }
        return session;
    };

    const session = await checkAuth(req, res);
    if (!session) return;



    switch (req.method) {
        case 'GET':
            try {
                const envVars = await EnvVar.find({});
                res.status(200).json(envVars);
            } catch (error) {
                res.status(500).json({ error: 'Error fetching environment variables' });
            }
            break;

        case 'POST':
            try {
                const { key, value, description } = req.body;
                const envVar = new EnvVar({ key, value, description });
                await envVar.save();
                res.status(201).json(envVar);
            } catch (error) {
                res.status(500).json({ error: 'Error creating environment variable' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 