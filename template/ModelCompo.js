
export const generateModelCode = (modelName, fields) => {
  const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);
  const ModelName = capitalizeFirstLetter(modelName);
    return `
      import { Schema, models, model } from "mongoose";
      import mongoose from "mongoose";
      
      const ${ModelName}Schema = new Schema({
      ${fields}
      }, { timestamps: true });
      
      // Add timestamps hook for model refreshing if needed
      ${ModelName}Schema.pre('save', function() {
        this.updatedAt = new Date();
      });
      
      // Support for dynamic model loading - export both the schema and model
      export { ${ModelName}Schema };
      
      // Use models.X pattern to prevent model redefinition errors
      export const ${ModelName} = models.${ModelName} || model('${ModelName}', ${ModelName}Schema, '${modelName.toLowerCase()}s');
    `.trim();
};


