import createError from "http-errors";
import SavedSearch from "../models/SavedSearch.js";

export async function createOrUpdateSavedSearch(req, res, next) {
  try {
    // ✅ Use validatedBody (guaranteed by validateBody)
    const { name, query, sort } = req.validatedBody;

    const doc = await SavedSearch.findOneAndUpdate(
      { orgId: req.auth.org.orgId, name },
      { $set: { query, sort, createdBy: req.auth.userId } },
      { new: true, upsert: true }
    );

    res.status(201).json(doc);
  } catch (err) {
    console.error("🔥 SavedSearch createOrUpdate error:", err);
    next(err);
  }
}

export async function listSavedSearches(req, res, next) {
  try {
    const docs = await SavedSearch.find({ orgId: req.auth.org.orgId })
      .sort({ updatedAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error("🔥 listSavedSearches error:", err);
    next(err);
  }
}

export async function getSavedSearch(req, res, next) {
  try {
    const doc = await SavedSearch.findOne({
      orgId: req.auth.org.orgId,
      name: req.params.name,
    });
    if (!doc) throw createError(404, "Saved search not found");
    res.json(doc);
  } catch (err) {
    console.error("🔥 getSavedSearch error:", err);
    next(err);
  }
}

export async function deleteSavedSearch(req, res, next) {
  try {
    const result = await SavedSearch.deleteOne({
      orgId: req.auth.org.orgId,
      name: req.params.name,
    });
    if (result.deletedCount === 0) {
      throw createError(404, "Saved search not found");
    }
    res.status(204).send();
  } catch (err) {
    console.error("🔥 deleteSavedSearch error:", err);
    next(err);
  }
}
