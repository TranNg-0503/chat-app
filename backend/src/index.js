import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.route.js";
import { connectDB } from "./lib/db.js";
const app = express();
const PORT =process.env.PORT;
app.use(express.json());
app.use("",authRoutes);
app.listen(PORT,()=>
{
    console.log('server is running on ${PORT}');
    connectDB();
});