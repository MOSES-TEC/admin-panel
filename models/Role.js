import { Schema, models, model } from "mongoose";

const RoleSchema = new Schema({
    name: { type: String, required: true, unique: true, lowercase: true, datatype: "textinput" },
    permissions: {
        create: { type: Boolean, default: false, datatype: "toggleinput" },
        read: { type: Boolean, default: true, datatype: "toggleinput" },
        update: { type: Boolean, default: false, datatype: "toggleinput" },
        delete: { type: Boolean, default: false, datatype: "toggleinput" },
    },
    routes: { type: [String], default: [], datatype: "creatableselectmulti" },
    description: { type: String, datatype: "textarea", default: function() { return `${this.name} role` } },
    isSystemRole: { type: Boolean, default: false, datatype: "toggleinput" }

}, { timestamps: true });



// Middleware to ensure role name is always lowercase
RoleSchema.pre('save', function(next) {
    if(this.name) {
        this.name = this.name.toLowerCase();
    }
    next();
});


// Virtual getter for display name with proper capitalization
RoleSchema.virtual('displayName').get(function() {
    return this.name.charAt(0).toUpperCase() + this.name.slice(1);
});


// Static method to find system roles 
RoleSchema.statics.findSystemRoles = function() {
    return this.find({ isSystemRole: true });
};


export const Role = models.Role || model("Role", RoleSchema, "roles");



