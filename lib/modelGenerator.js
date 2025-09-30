// Model code generation utility functions

/* 
    * format model fields into mongoose schema format
*/

const formatFields = (fields) => {
    return fields.map(field => {
        const { name, type, datatype, required, refModel, enumValues } = field;

        let fieldCode = `${name}: {
            type: ${getTypeFromDataType(type, datatype)}
        }`

        if(required) {
            fieldCode += `, required: true`;
        }

        if(datatype) {
            fieldCode += `, datatype: "${datatype}"`;
        }

        if(enumValues && enumValues.length > 0) {
            fieldCode += `, enum: ${JSON.stringify(enumValues)}`;
        }

        if(refModel) {
            fieldCode += `, ref: "${refModel}"`;
        }

        fieldCode += ` }`;

        return fieldCode;

    }).join(",\n");

};


/* 
    * Map data type to Mongoose schema type
*/

const getTypeFromDataType = (type, datatype) => {
    switch(type) {
        case 'string':
            return 'String';
        case 'number':
            return 'Number';
        case 'boolean':
            return 'Boolean';
        case 'date':
            return 'Date';
        case 'array':
            return '[String]';
        case 'arrayrelation':
            return '[{ type: mongoose.Schema.Types.ObjectId }]';
        default:
            return 'String';
    }
};


/* 
    * Generate Mongoose model code
*/

export const generateModelCode = (model) => {
    const { name, fields } = model;
    const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);
    const ModelName = capitalizeFirstLetter();

    const formattedFields = formatFields(fields);

    return `
        import { Schema, model, models } from "mongoose";
        import mongoose from "mongoose";

        const ${ModelName}Schema = new Schema({
            ${formattedFields}
        }, { timestamps: true });

        export const ${ModelName} = models.${ModelName} || model('${ModelName}', ${ModelName}Schema, '${name.toLowerCase()}s');

    `.trim();

};


// Regenerate model code based on the model schema

export const regenerateModel = async (model) => {
    try {
        const modelCode = generateModelCode(model);
        return modelCode;
    } catch (error) {
        console.error("Error in regenerating model code: ", error);
        throw error;
    }
};






