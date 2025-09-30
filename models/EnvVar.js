import mongoose from "mongoose";


const envVarSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: String, required: true },
    description: { type: String, trim: true }

}, { timestamps: true });

export default mongoose.models.EnvVar || mongoose.model('EnvVar', envVarSchema);



