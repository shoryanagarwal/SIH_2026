import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import reportRoutes from "./Routes/report.routes.js";




dotenv.config();

const app = express();
const PORT=process.env.PORT 

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


app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);

})



