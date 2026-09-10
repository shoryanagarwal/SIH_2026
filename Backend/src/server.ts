import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import reportRoutes from "./Routes/report.routes.js";
import screeningRoutes from "./Routes/screening.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { pingMlService } from "./services/ml.service.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
connectDB();

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Trace X AI backend is running"
    });
});


app.use("/api/reports", reportRoutes);
app.use("/api/v1", screeningRoutes);


app.use(errorMiddleware);

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    
    const mlServiceUp = await pingMlService();
    if (!mlServiceUp) {
        console.warn("WARNING: ml_service is not reachable. /analyze will fail until it's running.");
    }
});