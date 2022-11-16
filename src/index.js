import express from "express";
import cors from "cors";
import joi from "joi";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

const app = express();
const mongoClient = new MongoClient("mongodb://localhost:27017");
app.use(cors());
app.use(express.json());
let db;

mongoClient.connect().then(() => {db = mongoClient.db("mywallet")});


app.listen(5000, () => console.log("Server runnig in port: 5000"));