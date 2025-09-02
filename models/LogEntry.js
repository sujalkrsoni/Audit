import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const LogEntrySchema = new mongoose.Schema(
  {
    orgId: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    userEmail: { type: String, index: true },

    // Example: LOGIN, CREATE, UPDATE, DELETE
    eventType: { type: String, required: true, index: true },

    // Optional details
    resource: { type: String },
    description: { type: String },

    // Store raw metadata (flexible)
    metadata: { type: mongoose.Schema.Types.Mixed },

    // Store searchable string version of metadata
    metadataText: { type: String },

    // Log timestamp (defaults to now)
    timestamp: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

// Indexes for fast search
LogEntrySchema.index({ description: "text", metadataText: "text" }, { name: "text_search" });
LogEntrySchema.index({ orgId: 1, timestamp: -1 });
LogEntrySchema.index({ orgId: 1, eventType: 1, timestamp: -1 });
LogEntrySchema.index({ orgId: 1, userId: 1, timestamp: -1 });

// Before saving: stringify metadata into metadataText
LogEntrySchema.pre("save", function (next) {
  if (this.metadata && typeof this.metadata === "object") {
    try {
      this.metadataText = JSON.stringify(this.metadata);
    } catch (err) {
      this.metadataText = null;
    }
  }
  next();
});

// ✅ Add pagination plugin
LogEntrySchema.plugin(mongoosePaginate);

export default mongoose.model("LogEntry", LogEntrySchema);
