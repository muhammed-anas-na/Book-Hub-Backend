import Express from 'express'
import { dbConenct } from './config/db.js'
import router from './Routes/index.js';
import session from 'express-session';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = Express();
const start = async()=>{
    try{
        dbConenct()
    }catch(err){
        console.log("Error while connecting to db");
    }
}
app.use(cors({
    origin: ['http://localhost:3000', 'https://book-hub-black.vercel.app'],  // Replace with your frontend's URL
    credentials: true,  // This allows cookies to be sent across origins
    optionsSuccessStatus: 200,  // Some legacy browsers choke on 204
  }));
  
app.use(cookieParser());
app.use(session({
    secret: 'your-secret-key', // A secret key to sign the session ID cookie
    resave: false,             // Forces the session to be saved back to the store
    saveUninitialized: true,   // Forces a session that is "uninitialized" to be saved
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // Cookie expiration time (1 day in this example)
    }
}));
app.use(Express.json());
app.use('/api', router);

app.listen(8000,()=>{
    console.log("User service started at port 8000")
})

start();