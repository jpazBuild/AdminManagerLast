import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import testRoutes from "./routes/testRoutes";
import setupSwagger from "./swaggerConfig";

dotenv.config();
const app = express();

app.use(
    cors({
        origin: process.env.ORIGIN_URL,
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
    })
);

app.use(express.json());

setupSwagger(app);

app.use("/api", testRoutes);

export default app;
