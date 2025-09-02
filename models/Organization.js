import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const OrganizationSchema = new mongoose.Schema(
  {
    orgId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    apiKeyHash: { type: String, required: true }, // can add unique if you want strictness
    jwtSecret: { type: String, required: true },  // can add unique if only one per org
    emailForAlerts: { type: String },
  },
  { timestamps: true }
);

// 🔑 Static method to create org with hashed API key
OrganizationSchema.statics.createWithApiKey = async function ({
  orgId,
  name,
  apiKey,
  jwtSecret,
  emailForAlerts,
}) {
  const apiKeyHash = await bcrypt.hash(apiKey, 10);
  return this.create({ orgId, name, apiKeyHash, jwtSecret, emailForAlerts });
};

// 🔐 Instance method to verify API key
OrganizationSchema.methods.verifyApiKey = function (apiKey) {
  return bcrypt.compare(apiKey, this.apiKeyHash);
};

export default mongoose.model("Organization", OrganizationSchema);
