import { dbConnect } from '@/lib/dbConnect';
import EnvVar from '../../../models/EnvVar';

export default async function handler(req, res) {
    await dbConnect();
    const { id } = req.query;

    switch (req.method) {
        case 'PUT':
            try {
                const { key, value, description } = req.body;
                const envVar = await EnvVar.findByIdAndUpdate(
                    id,
                    { key, value, description },
                    { new: true }
                );
                if (!envVar) {
                    return res.status(404).json({ error: 'Environment variable not found' });
                }
                res.status(200).json(envVar);
            } catch (error) {
                res.status(500).json({ error: 'Error updating environment variable' });
            }
            break;

        case 'DELETE':
            try {
                const envVar = await EnvVar.findByIdAndDelete(id);
                if (!envVar) {
                    return res.status(404).json({ error: 'Environment variable not found' });
                }
                res.status(200).json({ message: 'Environment variable deleted successfully' });
            } catch (error) {
                res.status(500).json({ error: 'Error deleting environment variable' });
            }
            break;

        default:
            res.setHeader('Allow', ['PUT', 'DELETE']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 