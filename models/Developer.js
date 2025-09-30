import { Schema, models, model } from "mongoose";
      import mongoose from "mongoose";
      
      const DeveloperSchema = new Schema({
      icon: {  type: String , datatype: "textinput", enum: [] }, 
seller: {  type: String , datatype: "textarea", enum: [] }, 
users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
Date: {  type: Date , datatype: "inputdate", enum: [] }, 
seoTitle: {  type: String , datatype: "textinput" }, 
seoDescription: {  type: String , datatype: "textarea" }, 
focusKeywords: [ { type: String, datatype: "creatableselectmulti" } ], 
canonicalUrl: {  type: String , datatype: "stringweblink" }, 
metaRobots: {  type: String , datatype: "singleselect" }, 
openGraphTitle: {  type: String , datatype: "textinput" }, 
openGraphDescription: {  type: String , datatype: "textarea" }
      }, { timestamps: true });
      
      // Add timestamps hook for model refreshing if needed
      DeveloperSchema.pre('save', function() {
        this.updatedAt = new Date();
      });
      
      // Support for dynamic model loading - export both the schema and model
      export { DeveloperSchema };
      
      // Use models.X pattern to prevent model redefinition errors
      export const Developer = models.Developer || model('Developer', DeveloperSchema, 'developers');