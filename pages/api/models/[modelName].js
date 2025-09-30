import { dbConnect } from "@/lib/dbConnect";
import ModelSchema from "@/models/ModelSchema";


export default async function handler(req, res) {
    await dbConnect();

    const { modelName } = req.query;

    if (req.method === "GET") {
        try {
            const model = await ModelSchema.findOne({ name: modelName });
            if (!model) return res.status(404).json({ error: "Model not found" });
            res.status(200).json(model);
            
        } catch (error) {
            res.status(500).json({ message: "Error in fetching model", error });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }

};




