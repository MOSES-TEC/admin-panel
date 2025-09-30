import mongoose from "mongoose";
import fs from "fs";
import path from "path";


const MONGODB_URI = process.env.MONGODB_URI;

if(!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environmental variable in .env file");
}

let cached = global.mongoose || { conn: null, promise: null };

/* 
    * Reload a model module from disk
    * @param {string} modelName - The name of the model to reload
    * @returns {Object} - The reloaded model
*/

const reloadModel = async (modelName) => {
    const capitalizedName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    const modulePath = path.join(process.cwd(), "models", `${capitalizedName}.js`);

    // check if file exists
    if(!fs.existsSync(modulePath)) {
        return null;
    }

    try {
        // Delete the model from mongoose models collection to allow re-registration
        if(mongoose.models[capitalizedName]) {
            delete mongoose.models[capitalizedName];
        }

        // clear the module from require cache to force reload
        const fullPath = require.resolve(modulePath);
        if(require.cache[fullPath]) {
            delete require.cache[fullPath];
        }

        // Dynamically import the model module
        const modelModule = await import(`../models/${capitalizedName}.js`);
        return modelModule[capitalizedName];

    } catch (error) {
        console.error(`Error in reloading model ${modelName}:`, error);
        return null;
    }

};


export async function dbConnect() {
    if(cached.conn) return cached.conn;

    /* if(!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then((mongoose) => mongoose)
    }

    cached.conn = await cached.promise;
    return cached.conn; */

    if(!cached.promise) {
        const opts = {
            useNewUrlParser: true,
            useUnifiedTopology: true
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose);
    }


    cached.conn = await cached.promise;

    // check if the .needs-restart file exists and if so, try to clear it
    const needsRestartPath = path.join(process.cwd(), ".needs-restart");
    if(fs.existsSync(needsRestartPath)) {
        try {
            // Read the content to see what model needs refreshing
            const content = fs.readFileSync(needsRestartPath, "utf-8").trim();
            if(content) {
                await reloadModel(content);
                console.log(`Reloaded model ${content} during DB connection`);
            }

            // remove the file 
            fs.unlinkSync(needsRestartPath);

        } catch (error) {
            console.warn('Failed to handle model refresh', error);
        }

        return cached.conn;
    }
};





