import { Router } from "express";
import { issueToken } from "../controllers/authController.js";
import { validateBody } from "../middlewares/validate.js";
import { authTokenSchema } from "../utils/validators.js";

const router = Router();
router.post("/token", validateBody(authTokenSchema), issueToken);
export default router;
