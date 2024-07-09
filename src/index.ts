// Importing modules using ES6 syntax
import express from "express";
import helmet from "helmet";
// import cors from "cors";
// import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import { notFound, errorHandler } from "./middleware/errorMiddleware";

const app = express();

// Middleware
app.use(helmet());
// app.use(cors());
app.use(express.json());

// Routes
// app.use("/api/users", userRoutes);
app.use("/api", authRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
