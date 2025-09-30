import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { dbConnect } from "./dbConnect";


// Cache to store model schemas and their last updated timestamps
const modelCache = new Map();

/*  
    * Dynamically loads or refreshes a model schema
    * @param {string} modelName - The name of the model to load/refresh
    * @returns {mongoose.Model} - The mongoose model
*/

export async function getdynamicModels(modelName) {
    await dbConnect();

    // Capitalize the first letter for model files
    const capitalizeModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    const modelFilePath = path.join(process.cwd(), "models", `${capitalizeModelName}.js`);

    // Check if the model file exists
    if(!fs.existsSync(modelFilePath)) {
        throw new Error(`Model file not found: ${modelFilePath}`);
    }

    // Get the file stats to check last modified time
    const stats = fs.statSync(modelFilePath);
    const lastModified = stats.mtime.getTime();

    // check if we have a cached version that's up-to-date
    const cachedModel = modelCache.get(modelName);
    if(cachedModel && cachedModel.lastModified === lastModified) {
        return cachedModel.model;
    }

    try {
        // check if the model already exists in mongoose
        if(mongoose.models[capitalizeModelName]) {
            const model = mongoose.models[capitalizeModelName];

            // update the cache
            modelCache.set(modelName, { model, lastModified });
            return model;
        }

        // if the model doesn't exist, create a sample schema with strict: false
        // this allows any fields to be stored without predefined schema

        console.log(`Creating flexible model for ${capitalizeModelName}`);
        const schema = new mongoose.Schema({}, {
            timestamps: true,
            strict: false // allow any fields to be stored
        });

        const model = mongoose.model(capitalizeModelName, schema);

        // update the cache
        modelCache.set(modelName, { model, lastModified });
        return model;

    } catch (error) {
        console.error(`Error in loading the model ${modelName}: `, error);

        // if anything fails, return a fallback model
        if(mongoose.models[capitalizeModelName]) {
            return mongoose.models[capitalizeModelName];
        }

        // Create a minimal model as a last resort
        const fallBackSchema = new mongoose.Schema({}, {
            timestamps: true,
            strict: false
        });

        const fallBackModel = mongoose.models[capitalizeModelName] || mongoose.model(capitalizeModelName, fallBackSchema);

        return fallBackModel;
    }

};


/*  
    * Refreshes all models in the models directory
    * @returns {Object} - Object containing all refreshed models
*/


export async function refreshAllModels() {
    await dbConnect();

    const modelDir = path.join(process.cwd(), "models");
    const modelFiles = fs.readdirSync(modelDir).filter(file => file.endsWith('.js') && file !== 'ModelSchema.js');

    const models = {};

    for(const file of modelFiles) {
        const modelName = file.replace('.js', '');

        const model = await getdynamicModels(modelName.toLowerCase());

        models[modelName] = model;
    }

    return models;
};



/*  
    * Check if a model schema has been updated and refreshes if it needed
    * @param {string} modelName - The name of the model to check and refresh
    * @returns {boolean} - True if the model was refreshed, otherwise false
*/

export async function checkAndRefreshModel(modelName) {
    const capitalizeModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    const modelFilePath = path.join(process.cwd(), "models", `${capitalizeModelName}.js`);

    if(!fs.existsSync(modelFilePath)) {
        return false;
    }

    const stats = fs.statSync(modelFilePath);
    const lastModified = stats.mtime.getTime();

    const cachedModel = modelCache.get(modelName);

    if(cachedModel || cachedModel.lastModified !== lastModified) {
        await getdynamicModels(modelName);
        return true;
    }

    return false;

};


