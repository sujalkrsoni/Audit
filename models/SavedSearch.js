import mongoose from "mongoose";

const SavedSearchSchema = new mongoose.Schema(
  {
    orgId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    query: { type: mongoose.Schema.Types.Mixed, required: true },
    sort: { type: mongoose.Schema.Types.Mixed, default: { timestamp: -1 } },
    createdBy: { type: String },
  },
  { timestamps: true }
);

// ✅ Prevent duplicate saved searches per org
SavedSearchSchema.index({ orgId: 1, name: 1 }, { unique: true });

export default mongoose.model("SavedSearch", SavedSearchSchema);
