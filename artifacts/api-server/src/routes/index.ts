import { Router, type IRouter } from "express";
import beautyRouter from "./beauty";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(beautyRouter);

export default router;
