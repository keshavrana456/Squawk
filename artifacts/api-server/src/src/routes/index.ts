import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import usersRouter from "./users";
import postsRouter from "./posts";
import storiesRouter from "./stories";
import feedRouter from "./feed";
import exploreRouter from "./explore";
import messagesRouter from "./messages";
import notificationsRouter from "./notifications";
import botRouter from "./bot";
import nftRouter from "./nft";
import chirpsRouter from "./chirps";
import contestsRouter from "./contests";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(usersRouter);
router.use(postsRouter);
router.use(storiesRouter);
router.use(feedRouter);
router.use(exploreRouter);
router.use(messagesRouter);
router.use(notificationsRouter);
router.use(botRouter);
router.use(nftRouter);
router.use(chirpsRouter);
router.use(contestsRouter);

export default router;
