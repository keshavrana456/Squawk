import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "../src/routes/storage";
import usersRouter from "../src/routes/users";
import postsRouter from "../src/routes/posts";
import storiesRouter from "../src/routes/stories";
import feedRouter from "../src/routes/feed";
import exploreRouter from "../src/routes/explore";
import messagesRouter from "../src/routes/messages";
import notificationsRouter from "../src/routes/notifications";
import botRouter from "../src/routes/bot";
import nftRouter from "../src/routes/nft";
import chirpsRouter from "../src/routes/chirps";
import contestsRouter from "../src/routes/contests";

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
