import express from "express";
// import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import { notFound, errorHandler } from "./middleware/errorMiddleware";

const app = express();
app.set("trust proxy", 1);
const client = require("./redisClient");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const frontend = process.env.FE_URL;

let redisStore = new RedisStore({
  client: client,
});
app.use(
  session({
    store: redisStore,
    secret: "blueberry juice",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    },
  })
);

// app.use(helmet());
app.use(
  cors({ origin: "https://acadbud.vercel.app" || "http://localhost:3000", credentials: true })
);
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
