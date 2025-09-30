import { dbConnect } from "./dbConnect";
import { getdynamicModels } from "./dynamicModels";

/* 
    * Helper function to get a model dynamically for API routes
    * This ensures models are always up-to-date with schema changes
    * @param {string} modelName - The name of the model to retrieve/get
    * @returns {Promise<mongoose.Model>} - The requested mongoose model
*/

export async function getModelForApi(modelName) {
    await dbConnect();

    try {
        // First try to get the model dynamically
        const model = await getdynamicModels(modelName.toLowerCase());
        return model;
    } catch (error) {
        // if dynamic loading fails, try to import it directly
        console.warn(`Dynamic model loading failed for ${modelName}, attempting direct import:`, error);

        try {
            const capitalizedModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
            const modelModule = await import(`../models/${capitalizedModelName}.js`);
            return modelModule[capitalizedModelName];
        } catch (directError) {
            console.error(`Failed to load the model ${modelName}:`, directError);
            throw new Error(`Could not load the model: ${modelName}`);
        }
    }

};


/* 
    * wraps an API handler with dynamic model loading and error handling
    * @param {Function} handler - The API route handler function
    * @returns {Function} - Enhanced handler with dynamic model support
*/

export function withDynamicModels(handler) {
    return async (req, res) => {
        try {
            // Inject the getModel function into the request object
            req.getModel = getModelForApi;

            // Call the original handler
            return await handler(req, res);
        } catch (error) {
            console.error("API error with dynamic models: ", error);
            return res.status(500).json({ error: error.message || "Internal server error" });
        }
    }
};




