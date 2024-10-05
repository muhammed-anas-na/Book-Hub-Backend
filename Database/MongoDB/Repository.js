import mongoose from "mongoose";
import userModel from "./Models/userModel.js";
import bookModel from "./Models/bookModel.js";

    export const checkUserExist=async(phone)=>{
        const user = await userModel.findOne({
            phone
        })
        console.log("Result from DB =>", user)
        return user !== null;
    }

export const createNewUser = async(name,phone,latitude,longitude)=>{
    return userModel.insertMany({
        name,
        phone,
        location: {
            coordinates: [longitude, latitude]
        }
    })
}
export const addBookToDatabase = async({
    userId,
    title,
    description,
    author,
    willingTo,
    latitude,
    longitude,
    selectedBookCover,
    locationInText,
})=>{
    let curr_latitude = latitude;
    let curr_longitude = longitude;
    let curr_locationInText = locationInText;
    if(!latitude || !longitude) {
        try{
            var user = await userModel.findById(userId);
            console.log("Current user ==> ",user);
            curr_longitude = user.location.coordinates[0];
            curr_latitude = user.location.coordinates[1];
            curr_locationInText = user.locationInText
        }catch(err){
            console.log(err);
            return err;
        }
    }
    try{
        return await bookModel.insertMany({
            userId,
            title,
            description,
            author,
            willingTo,
            location: {
                coordinates: [curr_longitude, curr_latitude]
            },
            locationInText: curr_locationInText,
            selectedBookCover,
        })
    }catch(err){
        console.log(err)
    } 
}

export const findNearestBooks=async(latitude,longitude, distanceInMeter)=>{
    try {
        console.log(latitude,longitude)
        const nearestBooks = await bookModel.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: distanceInMeter  // 5 km radius (in meters)
                }
            }
        });

        return nearestBooks;
    } catch (err) {
        console.log(err);
        return null;
    }
}

export const getMyBookFromDb = async(userId)=>{
    const books = await bookModel.find({
        userId
    })
    return books;
}

export const AddUserFromGoogle = async(
    email,
    displayName,
    profileURL,
    token,
)=>{
    return userModel.findOneAndUpdate(
        { email: email }, // Search for user by email
        {
          $set: {
            displayName: displayName,
            profileURL: profileURL,
            token: token, // You can choose to store the token if necessary
          },
        },
        {
          new: true,  // Return the updated document
          upsert: true, // If user does not exist, create a new one
          setDefaultsOnInsert: true, // Applies schema defaults if a new document is inserted
        }
      );
}


export const updateUserLocation = async(userId, location, latitude, longitude)=>{
    console.log(userId)
    return userModel.findByIdAndUpdate(userId , {
        locationInText: location,
        location: {
            type: 'Point',  // GeoJSON format requires the type to be 'Point'
            coordinates: [longitude, latitude],  // Coordinates are in [longitude, latitude] order
        }
    },{new:true})
}


export const getBooksFromDB = async()=>{
    return bookModel.find()
}

export const getUserBooksFromDB = async(userId)=>{
    return bookModel.find({
        userId,
    })
}

export const GetBookDetailsFromDB = async(bookId)=>{
    return bookModel.findById(bookId)
}

export const addRequestCallback = async ({ name, number, bookId }) => {
    try {
      // Find the book details based on the bookId
      const bookDetails = await bookModel.findById(bookId);
      
      // If no book found, return an error
      if (!bookDetails) {
        throw new Error("Book not found");
      }
  
      // Push the name and phone to the user's callbacks array
      const updatedUser = await userModel.findByIdAndUpdate(
        bookDetails.userId, 
        {
          $push: {
            callbacks: {bookId, name, number } // Push new callback entry
          }
        },
        { new: true }
      );
      if (!updatedUser) {
        throw new Error("User not found");
      }
  
      return updatedUser;
    } catch (error) {
      console.error("Error adding callback: ", error);
      throw error; // Propagate error
    }
  };
  