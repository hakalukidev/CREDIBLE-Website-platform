/**
 * Users module placeholder — Phase 2 will add profile / preferences endpoints.
 */
import { Router } from 'express';

export const userRouter = Router();
userRouter.get('/me', (_req, res) => res.json({ success: true, data: null }));
export default userRouter;
