import express from "express";
import helmet from "helmet";
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

const isProduction = process.env.NODE_ENV === "production";

app.use(
  session({
    store: redisStore,
    secret: "blueberry juice",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: isProduction,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: false,
    },
  })
);

app.use(helmet());

const allowedOrigins = ["https://acadbud.vercel.app", "http://localhost:3000", "https://saumay.shashstorm.in/login"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `cors issue`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true, 
  })
);

app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
