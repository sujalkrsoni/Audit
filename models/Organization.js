import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const OrganizationSchema = new mongoose.Schema(
  {
    orgId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    apiKeyHash: { type: String, required: true },
    jwtSecret: { type: String, required: true },
    emailForAlerts: { type: String },
  },
  { timestamps: true }
);

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

OrganizationSchema.methods.verifyApiKey = function (apiKey) {
  return bcrypt.compare(apiKey, this.apiKeyHash);
};

export default mongoose.model("Organization", OrganizationSchema);
