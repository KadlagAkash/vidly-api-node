import express from "express";

import logger from "./logs/logger.js";
import routes from "./startup/routes.js";
import db from "./startup/db.js";
import { handleUncaughtExceptions, handleUnhandledRejections } from "./middleware/handleErrors.js";


handleUncaughtExceptions();
handleUnhandledRejections();

const app = express();

routes(app);
db();

const port = process.env.PORT || 3000;
app.listen(port, () => logger.info(`Listening on Port ${port}...`));
