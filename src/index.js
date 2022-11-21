import express from "express";
import cors from "cors";
import joi from "joi";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { v4 as uuidV4} from "uuid";

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
const userCollection = db.collection("users");
const sessionCollection = db.collection("sessions");
const movementCollection = db.collection("movements");

const userRegisterSchema = joi.object({
    name: joi.string().required().min(3).max(100),
    password: joi.string().required(),
    email: joi.string().email().required()
})

const userLoginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required()
})

const movementSchema = joi.object({
    date: joi.string().required(),
    description: joi.string().required(),
    value: joi.number().required(),
    type: joi.string().required()
})

app.post("/register", async (req, res) => {
    const user = req.body;
    const {error} = userRegisterSchema.validate(user, {abortEarly: false});
    if (error){
        const errors = error.details.map((detail) => detail.message);
        return res.status(400).send(errors);
    }

    const passwordHash = bcrypt.hashSync(user.password, 10);

    try{
        const userExists = await userCollection.findOne({email: user.email});
        if(userExists){
            return res.sendStatus(409);
        }
        await userCollection.insertOne({...user, password: passwordHash});
        res.sendStatus(201);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

app.post("/login", async (req, res) => {
    const {email, password} = req.body;
    const token = uuidV4();

    try{
        const userExists = await userCollection.findOne({email});
        console.log(userExists._id);
        if(!userExists){
            return res.sendStatus(401);
        }
        const isPasswordOk = bcrypt.compareSync(password, userExists.password);
        
        if(!isPasswordOk){
            return res.sendStatus(401);
        }

        await sessionCollection.insertOne({"token": token, "userId": userExists._id})

        return res.send({token});

    } catch(err){
        console.log(err);
        res.sendStatus(500)
    }
})

app.get("/home", async (req, res) => {
    const {authorization} = req.headers;

    if(!authorization){
        return res.sendStatus(401);
    }

    try{
        const token = authorization?.replace("Bearer ", "")
        if(!token || token === "Bearer"){
            return res.sendStatus(401);
        }
        const session = await sessionCollection.findOne({token});
        if(!session){
            return res.sendStatus(401);
        }        
        const user = await userCollection.findOne({_id: session?.userId});
        if(!user){
            return res.sendStatus(401);
        }
        delete user.password;
        // aqui, antes de devolver o objeto, posso alterar para 
        // a primeira letra do nome ser maiuscula
        return res.send(user);
    } catch(err) {
        console.log(err);
        res.sendStatus(500);
    }
})

app.post("/newmovement", async (req, res) => {
    const movement = req.body;
    const {authorization} = req.headers;

    if(!authorization){
        return res.sendStatus(401);
    }

    const {error} = movementSchema.validate(movement, {abortEarly: false});
    if (error){
        const errors = error.details.map((detail) => detail.message);
        return res.status(400).send(errors);
    }

    try{
        const token = authorization?.replace("Bearer ", "")
        if(!token || token === "Bearer"){
            return res.sendStatus(401);
        }
        const session = await sessionCollection.findOne({token});
        if(!session){
            return res.sendStatus(401);
        }        
        const user = await userCollection.findOne({_id: session?.userId});
        if(!user){
            return res.sendStatus(401);
        }
        const idUser = String(user._id);

        await movementCollection.insertOne({...movement, idUser: idUser});
        res.sendStatus(201);
    } catch(err){
        console.log(err);
        return res.sendStatus(500);
    }
})

app.get("/movements", async (req, res) => {
    const {authorization} = req.headers;

    if(!authorization){
        return res.sendStatus(401);
    }

    try{    
        const token = authorization?.replace("Bearer ", "")
        if(!token || token === "Bearer"){
            return res.sendStatus(401);
        }
        const session = await sessionCollection.findOne({token});
        if(!session){
            return res.sendStatus(401);
        }        
        const user = await userCollection.findOne({_id: session?.userId});
        if(!user){
            return res.sendStatus(401);    
        }
        const idUser = String(user._id);
        const movements = await movementCollection.find({idUser: idUser}).toArray();
        return res.send(movements);
    } catch(err){
        console.log(err);
        return res.sendStatus(500);
    }
})

app.delete("/logout", async (req, res) => {
    const {authorization} = req.headers;
    console.log(authorization);

    if(!authorization){
        return res.sendStatus(401);
    }

    try{
        const token = authorization?.replace("Bearer ", "")
        if(!token || token === "Bearer"){
            return res.sendStatus(401);
        }
        await sessionCollection.deleteOne({token: token})
        res.sendStatus(200).send({message: "Logout com sucesso!"})
    } catch(err){
        console.log(err);
        return res.sendStatus(500);
    }
})

app.listen(process.env.PORT || 5000, () => console.log(`Server runnig in port: ${process.env.PORT || 5000}`));