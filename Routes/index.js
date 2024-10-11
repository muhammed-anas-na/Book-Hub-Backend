import express from 'express';
const router = express.Router();
import { LoginController, requestCallback,getUserQueries,getSearchLengths,
    addBook,findNearestBook, getMyBooks,updateProfile,googleSignin , getLoggedInUser,
    getBooks,
    GET_LOCATION_FROM_POINTS_AND_UPDATE_USER,GET_LOCATION_FROM_POINTS,getUserBooks,getBookDetailsByID,
    } from '../Controllers/Auth-controller.js';


router.get('/health-check',(req,res)=>res.json({
    msg:"Server Healthy"
}))

router.get('/',(req,res)=>{res.json({message:"📚 Book Hub Backend server"})})
router.post('/login', LoginController) //Not completed

router.post('/google-signin', googleSignin) //Completed
router.get('/get-user', getLoggedInUser) //Completed
router.post('/get-location-from-points-and-update-user', GET_LOCATION_FROM_POINTS_AND_UPDATE_USER) //Completed
router.post('/get-location-from-points' , GET_LOCATION_FROM_POINTS) //Completed

router.post('/add-books', addBook) //Completed
router.post('/nearest-book',findNearestBook) //Completed
router.get('/get-books' , getBooks); 
router.post('/get-user-books' , getUserBooks) //Completed
router.post('/get-book-details-by-id' , getBookDetailsByID); //Completed
router.post('/request-callback' , requestCallback)
router.post('/get-user-queries', getUserQueries);
//Working on ...........
router.post('/get-search-length' , getSearchLengths)


router.post('/get-my-books', getMyBooks)
router.post('/update-profile' , updateProfile)


export default router;