import mongoose from "mongoose";

const SavedSearchSchema = new mongoose.Schema(
  {
    orgId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    query: { type: Object, required: true },
    sort: { type: Object, default: { timestamp: -1 } },
    createdBy: { type: String },
  },
  { timestamps: true }
);

// ✅ Prevent duplicates within same org
SavedSearchSchema.index({ orgId: 1, name: 1 }, { unique: true });

export default mongoose.model("SavedSearch", SavedSearchSchema);
