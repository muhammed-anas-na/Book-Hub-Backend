import {app} from './app'
import {dbConenct} from './config/db'
console.log("HELO")
const start = async()=>{
    console.log("Hi")
    try{
        await dbConenct()
    }catch(err){
        console.log("Error while connecting to db");
    }
}
console.log("Connecting to server")
app.listen(8000,()=>{
    console.log("User service started at port 8000")
})

start();