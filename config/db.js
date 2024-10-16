import mongoose from "mongoose";
export const dbConenct = () =>{
    const uri = "mongodb+srv://BBook-Admin:1234@cluster0.g3xacoe.mongodb.net/BBooks"
    // Connect to MongoDB Atlas
    mongoose.connect(uri)
    .then(() => {
        console.log('Connected to MongoDB Atlas');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB Atlas:', error);
        dbConenct()
    });
}