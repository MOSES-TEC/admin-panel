import { Schema, models, model } from "mongoose";
      import mongoose from "mongoose";
      
      const UserSchema = new Schema({
      firstname: {  type: String , required: true, datatype: "textinput" }, 
lastname: {  type: String , required: true, datatype: "textinput" }, 
email: {  type: String , required: true, datatype: "textemail" }, 
password: {  type: String , required: true, datatype: "password" }, 
userRole: {  type: String , required: true, datatype: "singleselect", enum: ["superadmin", "contentmanager", "demo"] }, 
block: {  type: Boolean , datatype: "toggleinput" }, 
seoTitle: {  type: String , datatype: "textinput" }, 
seoDescription: {  type: String , datatype: "textarea" }, 
focusKeywords: [ { type: String, datatype: "creatableselectmulti" } ], 
canonicalUrl: {  type: String , datatype: "stringweblink" }, 
metaRobots: {  type: String , datatype: "singleselect" }, 
openGraphTitle: {  type: String , datatype: "textinput" }, 
openGraphDescription: {  type: String , datatype: "textarea" }
      }, { timestamps: true });
      
      // Add timestamps hook for model refreshing if needed
      UserSchema.pre('save', function() {
        this.updatedAt = new Date();
      });
      
      // Support for dynamic model loading - export both the schema and model
      export { UserSchema };
      
      // Use models.X pattern to prevent model redefinition errors
      export const User = models.User || model('User', UserSchema, 'users');