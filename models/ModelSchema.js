// models/ModelSchema.js

import mongoose from "mongoose";


const ModelSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    fields: { type: Array, required: true }
}, { timestamps: true });

export default mongoose.models.ModelSchema || mongoose.model("ModelSchema", ModelSchema);


