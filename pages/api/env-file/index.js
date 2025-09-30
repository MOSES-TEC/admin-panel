import fs from 'fs';
import path from 'path';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req, res) {
    const envFilePath = path.join(process.cwd(), '.env');

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
                if (!fs.existsSync(envFilePath)) {
                    return res.status(200).json({});
                }
                const content = fs.readFileSync(envFilePath, 'utf8');
                const lines = content.split('\n');
                const envVars = {};

                lines.forEach(line => {
                    if (line && !line.startsWith('#')) {
                        const [key, ...valueParts] = line.split('=');
                        if (key && valueParts.length > 0) {
                            envVars[key.trim()] = valueParts.join('=').trim();
                        }
                    }
                });

                res.status(200).json(envVars);
            } catch (error) {
                console.error('Error reading .env file:', error);
                res.status(500).json({ error: 'Error reading .env file' });
            }
            break;

        case 'POST':
            try {
                const { key, value } = req.body;
                let content = '';

                if (fs.existsSync(envFilePath)) {
                    content = fs.readFileSync(envFilePath, 'utf8');
                }

                const lines = content.split('\n');
                const envVars = {};

                lines.forEach(line => {
                    if (line && !line.startsWith('#')) {
                        const [k, ...vParts] = line.split('=');
                        if (k && vParts.length > 0) {
                            envVars[k.trim()] = vParts.join('=').trim();
                        }
                    }
                });

                envVars[key] = value;
                const newContent = Object.entries(envVars)
                    .map(([k, v]) => `${k}=${v}`)
                    .join('\n');

                fs.writeFileSync(envFilePath, newContent);
                res.status(200).json({ success: true });
            } catch (error) {
                console.error('Error writing to .env file:', error);
                res.status(500).json({ error: 'Error writing to .env file' });
            }
            break;

        case 'DELETE':
            try {
                const { key } = req.body;
                if (!fs.existsSync(envFilePath)) {
                    return res.status(404).json({ error: '.env file not found' });
                }

                const content = fs.readFileSync(envFilePath, 'utf8');
                const lines = content.split('\n');
                const envVars = {};

                lines.forEach(line => {
                    if (line && !line.startsWith('#')) {
                        const [k, ...vParts] = line.split('=');
                        if (k && vParts.length > 0) {
                            envVars[k.trim()] = vParts.join('=').trim();
                        }
                    }
                });

                delete envVars[key];
                const newContent = Object.entries(envVars)
                    .map(([k, v]) => `${k}=${v}`)
                    .join('\n');

                fs.writeFileSync(envFilePath, newContent);
                res.status(200).json({ success: true });
            } catch (error) {
                console.error('Error deleting from .env file:', error);
                res.status(500).json({ error: 'Error deleting from .env file' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 