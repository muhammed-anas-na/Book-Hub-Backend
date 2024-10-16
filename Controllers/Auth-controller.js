
import {
    addRequestCallback,
    GetBookDetailsFromDB,
    getUserBooksFromDB,
    getBooksFromDB,
    updateUserLocation,
    AddUserFromGoogle,
    addBookToDatabase,
    findNearestBooksFromDB,
    getMyBookFromDb,
    GET_USER_QUERIES_FROM_DB,
    GET_BOOKS_CATEOGRIES_LOCATIONS_LENGTH,
    GET_SEARCH_RESULT,
    deleteProductFromDB,
    
} from '../Database/MongoDB/Repository.js'
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config()

const MAPBOX_API_KEY = "pk.eyJ1IjoiYW5hcy1uYSIsImEiOiJjbHJocnlwcmMwMm4wMmltbDhmOWFieXI1In0.-HhwhnfkjKGXxpVSxyXWQg";
export const LoginController = (req, res) => {

}

export const addBook = async (req, res) => {

    try {
        console.log(req.body);
        const { title, description, willingTo, location, selectedBookCover,category } = req.body;
        const { locationInText, latitude, longitude } = location;
        const authCookie = req.cookies.auth;
        console.log("Logged In User ==>", authCookie);
        const userData = JSON.parse(authCookie);
        const data = await addBookToDatabase({
            userId: userData._id,
            title,
            description,
            willingTo,
            locationInText,
            latitude,
            longitude,
            selectedBookCover,
            category,
        })
        res.json({
            newBook: data[0]
        })
    } catch (err) {
        return res.json(err);
    }
}

export const findNearestBook = async (req, res) => {
    const { distance = 5 } = req.body;
    console.log("Radius ==>" , distance);
    let latitude;
    let longitude
    try {
        const loggedInUser = JSON.parse(req.cookies.auth);
        console.log("Logged In user ==>", loggedInUser);
        latitude = loggedInUser.location.coordinates[1]
        longitude = loggedInUser.location.coordinates[0]
    } catch (err) {
        console.log(err);
        return res.json({
            err: "User not logged in or not added location."
        })
    }
    const distanceInMeter = distance * 1000;
    const data = await findNearestBooksFromDB(latitude, longitude, distanceInMeter);
    console.log("Nearest books => ", data);
    res.json(data);

}

export const getMyBooks = async (req, res) => {
    try {
        const { userId } = req.body;
        const myBook = await getMyBookFromDb(userId)
        res.json(myBook);
    } catch (err) {
        console.log(err);
    }
}
export const updateProfile = async (req, res) => {
    try {
        const data = updateProfileInDb()
    } catch (err) {
        console.log(err);
    }
}

export const googleSignin = async (req, res) => {
    const {
        token,
        displayName,
        profileURL,
        email
    } = req.body
    const userData = await AddUserFromGoogle(email, displayName, profileURL, token);
    console.log("Secure : ", process.env.ENVIRONMENT === 'production')
    res.cookie('auth', JSON.stringify(userData), {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({ success: true });
}
export const getLoggedInUser = (req, res) => {
    console.log(req.cookies.auth)
    const authCookie = req.cookies.auth;
    if (authCookie) {
        const userData = JSON.parse(authCookie);
        res.json(userData);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
}

export const GET_LOCATION_FROM_POINTS_AND_UPDATE_USER = async (req, res) => {
    const { latitude, longitude } = req.body;
    console.log("Cookie == >", req.cookie);
    const user = JSON.parse(req.cookies.auth);
    let result;
    console.log(user);
    try {
        result = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_API_KEY}`);
    } catch (err) {
        console.log("Error while fetchin data from MAPBOX :", err)
    }
    let updatedUser = await updateUserLocation(user._id, result?.data?.features[0]?.place_name, latitude, longitude);
    res.cookie('auth', JSON.stringify(updatedUser), {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
    });
    res.json({
        locationName: result?.data?.features[0]?.place_name
    });

}

export const GET_LOCATION_FROM_POINTS = async (req, res) => {
    const { latitude, longitude } = req.body;
    let result = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_API_KEY}`);
    res.json(result?.data?.features[0]?.place_name)

}

export const getBooks = async (req, res) => {
    const books = await getBooksFromDB();
    res.json(books)
}

export const getUserBooks = async (req, res) => {
    console.log("Body", req.body);
    const { userId } = req.body;
    console.log(req.body)
    const books = await getUserBooksFromDB(userId);
    console.log(books);
    res.json(books)
}
export const getBookDetailsByID = async (req, res) => {
    console.log("HERE")
    const { bookId } = req.body;
    const bookDetails = await GetBookDetailsFromDB(bookId);
    res.json(bookDetails);
}

export const requestCallback = async (req, res) => {
    try {
        console.log(req.body);
        const response = await addRequestCallback(req.body);
        res.json(response);
    } catch (err) {
        res.json(err);
    }
}

export const getUserQueries = async(req,res)=>{
    try{
        const userData = await GET_USER_QUERIES_FROM_DB(req.body.userId)
        console.log(userData?.callbacks);
        res.json({
            callbacks: userData?.callbacks
        })
    }catch(err){
        res.json(err);
    }
}


export const getSearchLengths = async(req,res)=>{
    console.log("Search Word",req.body);
    const response = await GET_BOOKS_CATEOGRIES_LOCATIONS_LENGTH(req.body.data);
    res.json(response);
}

export const getSearchResult = async(req,res)=>{
    console.log("Body ==>",req.body);
    const response = await GET_SEARCH_RESULT(req.body);
    res.json(response);
}

export const deleteBooks = async(req,res)=>{
    const authCookie = req.cookies.auth;
    if(!authCookie){
        res.status(401).json({
            message:"Not logged in for delete"
        })
    }
    const {_id} = JSON.parse(authCookie);
    const {productId} = req.body;
    const response = await deleteProductFromDB(productId, _id);
    console.log(response);
    res.json(response);
}