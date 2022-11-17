import express from "express";
import cors from "cors";
import joi from "joi";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);

try{
    await mongoClient.connect();
    console.log("MongoDB conectado!")
} catch (err) {
    console.log(err)
}

const db = mongoClient.db("mywallet");

app.post("/login", async (req, res) => {

})


app.listen(5000, () => console.log("Server runnig in port: 5000"));