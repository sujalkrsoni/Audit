// controllers/savedSearchController.js
import createError from "http-errors";
import SavedSearch from "../models/SavedSearch.js";

function success(message, data = null) {
  return { success: true, message, data };
}

// ✅ Create or update
export async function createOrUpdateSavedSearch(req, res, next) {
  try {
    const { name, query, sort } = req.validatedBody;

    const doc = await SavedSearch.findOneAndUpdate(
      { orgId: req.auth.org.orgId, name },
      {
        $set: {
          query,
          sort: sort || { timestamp: -1 },
          createdBy: req.auth.userId,
        },
      },
      { new: true, upsert: true }
    ).lean();

    res.status(201).json(success("Saved search created/updated successfully", doc));
  } catch (err) {
    console.error("🔥 SavedSearch createOrUpdate error:", err);
    next(err);
  }
}

// ✅ List all
export async function listSavedSearches(req, res, next) {
  try {
    const docs = await SavedSearch.find({ orgId: req.auth.org.orgId })
      .sort({ updatedAt: -1 })
      .lean();

    res.json(success("Saved searches fetched successfully", docs));
  } catch (err) {
    console.error("🔥 listSavedSearches error:", err);
    next(err);
  }
}

// ✅ Get one
export async function getSavedSearch(req, res, next) {
  try {
    const doc = await SavedSearch.findOne({
      orgId: req.auth.org.orgId,
      name: req.params.name,
    }).lean();

    if (!doc) throw createError(404, "Saved search not found");

    res.json(success("Saved search fetched successfully", doc));
  } catch (err) {
    console.error("🔥 getSavedSearch error:", err);
    next(err);
  }
}

// ✅ Delete
export async function deleteSavedSearch(req, res, next) {
  try {
    const result = await SavedSearch.deleteOne({
      orgId: req.auth.org.orgId,
      name: req.params.name,
    });

    if (result.deletedCount === 0) {
      throw createError(404, "Saved search not found");
    }

    res.json(success("Saved search deleted successfully"));
  } catch (err) {
    console.error("🔥 deleteSavedSearch error:", err);
    next(err);
  }
}
