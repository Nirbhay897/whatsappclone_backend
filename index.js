import express from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config();

// app config
const app = express();

const pusher = new Pusher({
    appId: process.env.appId,
    key: process.env.key,
    secret: process.env.secret,
    cluster: "ap2",
    useTLS: true
})

// middleware
app.use(express.json())
app.use(cors())
 

// DB config
const URL = 'mongodb+srv://Nirbhay:Nirbhay123@cluster0.c27a97w.mongodb.net/?retryWrites=true&w=majority'
mongoose.connect(URL)


const db = mongoose.connection

db.once("open", ()=>{
    console.log("Db connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch()

    changeStream.on("change", (change)=>{
        console.log(change);

        if(change.operationType === "insert"){
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name:messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                recieved:messageDetails.recieved
            })
        } else{
            console.log("Err trigor Pusher");
        }
    })
})


// api route
app.get('/', (req, res)=>{
    res.status(200).send("hello world")
})

app.get('/messages/sync' , (req, res)=>{
    Messages.find((err, data)=>{
        if(err){
            res.status(500).send(err)
        } else{
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res)=>{
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data)=>{
        if(err){
            res.status(500).send(err)
        } else{
            res.status(201).send(data)
        }
    })
})


// listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, (err)=>{
    if(!err) {
        console.log(`Server is running on port ${PORT}`);
    }
})