

export async function createRegister(req, res){
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
}

export async function sendLogin(req, res){
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
}

export async function logout(req, res){
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
}