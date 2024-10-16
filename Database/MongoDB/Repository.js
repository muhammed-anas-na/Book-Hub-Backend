import mongoose from "mongoose";
import userModel from "./Models/userModel.js";
import bookModel from "./Models/bookModel.js";
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { query } from "express";
dotenv.config();

// Create transporter outside the function to reuse it
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


export const checkUserExist = async (phone) => {
  const user = await userModel.findOne({
    phone
  })
  console.log("Result from DB =>", user)
  return user !== null;
}

export const createNewUser = async (name, phone, latitude, longitude) => {
  return userModel.insertMany({
    name,
    phone,
    location: {
      coordinates: [longitude, latitude]
    }
  })
}
export const addBookToDatabase = async ({
  userId,
  title,
  description,
  willingTo,
  latitude,
  longitude,
  selectedBookCover,
  locationInText,
  category
}) => {
  let curr_latitude = latitude;
  let curr_longitude = longitude;
  let curr_locationInText = locationInText;
  if (!latitude || !longitude) {
    try {
      var user = await userModel.findById(userId);
      console.log("Current user ==> ", user);
      curr_longitude = user.location.coordinates[0];
      curr_latitude = user.location.coordinates[1];
      curr_locationInText = user.locationInText
    } catch (err) {
      console.log(err);
      return err;
    }
  }
  try {
    return await bookModel.insertMany({
      userId,
      title,
      description,
      willingTo,
      location: {
        coordinates: [curr_longitude, curr_latitude]
      },
      locationInText: curr_locationInText,
      selectedBookCover,
      category,
    })
  } catch (err) {
    console.log(err)
  }
}

export const findNearestBooksFromDB = async (latitude, longitude, distanceInMeter) => {
  try {
    console.log(latitude, longitude)
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

export const getMyBookFromDb = async (userId) => {
  const books = await bookModel.find({
    userId
  })
  return books;
}

export const AddUserFromGoogle = async (
  email,
  displayName,
  profileURL,
  token,
) => {
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


export const updateUserLocation = async (userId, location, latitude, longitude) => {
  console.log(userId)
  return userModel.findByIdAndUpdate(userId, {
    locationInText: location,
    location: {
      type: 'Point',  // GeoJSON format requires the type to be 'Point'
      coordinates: [longitude, latitude],  // Coordinates are in [longitude, latitude] order
    }
  }, { new: true })
}


export const getBooksFromDB = async () => {
  return bookModel.find()
}

export const getUserBooksFromDB = async (userId) => {
  console.log("User id : ", userId);
  return bookModel.find({
    userId,
  })
}

export const GetBookDetailsFromDB = async (bookId) => {
  return bookModel.findById(bookId)
}

export const addRequestCallback = async ({ name, number, bookId, selectedBookCover, title }) => {
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
          callbacks: { bookId, name, number, selectedBookCover, title } // Push new callback entry
        }
      },
      { new: true }
    );
    if (!updatedUser) {
      throw new Error("User not found");
    }

    sendEmailAboutCallback(updatedUser.email, {
      enquirerName: name,
      bookTitle: title,
      bookId: bookId
    })

    return updatedUser;
  } catch (error) {
    console.error("Error adding callback: ", error);
    throw error; // Propagate error
  }
};


export const GET_USER_QUERIES_FROM_DB = async (userId) => {
  return userModel.findById(userId);
}

export const GET_BOOKS_CATEOGRIES_LOCATIONS_LENGTH = async (searchKey) => {
  try {
    const searchPattern = new RegExp(searchKey, 'i');

    // Get matching books count
    const books = await bookModel.find({
      $or: [
        { title: { $regex: searchPattern } },
        { description: { $regex: searchPattern } },
        // { locationInText: { $regex: searchPattern } },
      ]
    }).countDocuments()
    console.log("Book length =>", books)

    // Get unique locations that match the search
    const matchedLocations = await bookModel.distinct('locationInText', {
      $or: [
        { locationInText: { $regex: searchPattern } }
      ]
    }).countDocuments()
    console.log('location length ==>', matchedLocations)

    //   // Get unique locations that match the search
    const uniqueCategories = await bookModel.distinct('categories', {
      $or: [
        { category: { $regex: searchPattern } }
      ]
    }).countDocuments()
    console.log('Categorylength ==>', uniqueCategories)


    return {
      booksLength: books,
      locations: matchedLocations,
      categoryLength: uniqueCategories,
    };
  } catch (error) {
    console.error('Error in GET_BOOKS_CATEGORIES_LOCATIONS_LENGTH:', error);
    throw error;
  }
}

export const GET_SEARCH_RESULT = async ({
  query,
  type
}) => {
  const searchPattern = new RegExp(query, 'i');
  if (type == 'books') {
    const books = await bookModel.find({
      $or: [
        { title: { $regex: searchPattern } },
        { description: { $regex: searchPattern } },
      ]
    })
    console.log("Books =>", books)
    return books;
  }else if(type == 'category'){
        //   // Get unique locations that match the search
        const uniqueCategories =  await bookModel.find({
          $or: [
            { category: { $regex: searchPattern } }
          ]
        })
        console.log('uniqueCategories in search ==>', uniqueCategories)
        return uniqueCategories;
  }else if(type == 'locations'){
    const matchedLocations =  await bookModel.find({
      $or: [
        { locationInText: { $regex: searchPattern } }
      ]
    })
    console.log('matchedLocations ==>', matchedLocations)
    return matchedLocations;
  }
}
async function sendEmailAboutCallback(email, callbackDetails) {
  try {
    // Destructure necessary details from callbackDetails
    const {
      bookTitle,
      enquirerName,
      bookId
    } = callbackDetails;

    // Create the callback details URL
    const callbackUrl = `${process.env.ENVIRONMENT == "dev" ? `http://localhost:3000/profile` : `https://book-hub-black.vercel.app/profil`}`;
    // Create the book details URL
    const bookUrl = `${process.env.ENVIRONMENT == "dev" ? `http://localhost:3000/discover-books/${bookId}` : `https://book-hub-black.vercel.app/discover-books/${bookId}`}`;

    // Create HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      /* Base styles */
      body {
        margin: 0;
        padding: 0;
        background-color: #f3f4f6;
        font-family: 'Segoe UI', Arial, sans-serif;
      }
      
      /* Container styles */
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      /* Header styles */
      .header {
        padding: 0;
        position: relative;
        overflow: hidden;
      }

      .header-content {
        padding: 35px 20px;
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
      }

      .logo-container {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
      }

      .logo-icon {
        font-size: 28px;
        margin-right: 12px;
      }

      .logo {
        color: black;
        font-size: 32px;
        font-weight: 800;
        margin: 0;
        letter-spacing: 1px;
      }

      .logo span {
        color: #fb923c;
      }

      .header-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background-image: radial-gradient(circle at 1px 1px, #fb923c 1px, transparent 0);
        background-size: 20px 20px;
      }

      /* Urgency banner styles */
      .urgency-banner {
        background: linear-gradient(90deg, #fb923c 0%, #f97316 100%);
        padding: 18px 25px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }

      .urgency-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: #ffffff;
        font-weight: 600;
        font-size: 16px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .notification-icon {
        background-color: rgba(255, 255, 255, 0.2);
        padding: 8px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      /* Content styles */
      .content {
        padding: 40px 30px;
        background-color: #ffffff;
        color: #333333;
        line-height: 1.6;
      }

      .highlight-box {
        background-color: #fff8f1;
        border-left: 4px solid #fb923c;
        padding: 20px;
        margin: 25px 0;
        border-radius: 0 8px 8px 0;
      }

      .details-list {
        background-color: #f9fafb;
        padding: 20px 25px;
        border-radius: 8px;
        margin: 15px 0;
        list-style: none;
      }

      .details-list li {
        margin: 12px 0;
        color: #374151;
      }

      /* Button styles */
      .button-container {
        text-align: center;
        margin: 35px 0;
      }

      .button {
        display: inline-block;
        padding: 16px 35px;
        background-color: #fb923c;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: bold;
        font-size: 18px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(251, 146, 60, 0.2);
      }

      .secondary-link {
        color: #fb923c;
        text-decoration: none;
        font-weight: 600;
      }

      /* Signature and footer styles */
      .signature {
        margin-top: 35px;
        padding-top: 25px;
        border-top: 1px solid #e5e7eb;
      }

      .footer {
        background-color: #000000;
        color: #ffffff;
        text-align: center;
        padding: 30px;
        font-size: 14px;
      }

      /* Responsive styles */
      @media only screen and (max-width: 600px) {
        .content {
          padding: 30px 20px;
        }
        .button {
          padding: 14px 28px;
          font-size: 16px;
        }
        .logo {
          font-size: 28px;
        }
        .urgency-content {
          font-size: 14px;
          padding: 0 10px;
        }
      }
    </style>
  </head>
  <body>
    <div style="padding: 20px;">
      <div class="email-container">
        <div class="header">
          <div class="header-pattern"></div>
          <div class="header-content">
            <div class="logo-container">
              <div class="logo-icon">📚</div>
              <h1 class="logo">Book<span>Hub</span></h1>
            </div>
          </div>
        </div>
        
        <div class="urgency-banner">
          <div class="urgency-content">
            <div class="notification-icon">
              🔔
            </div>
            <div>
              Exciting News! Someone's Interested in Your Book
            </div>
          </div>
        </div>

        <div class="content">
          <h2 style="color: #000000; margin-bottom: 25px;">Hello there!</h2>
          
          <p style="font-size: 16px;">You've caught someone's attention with your book listing on BookHub! This could be the start of a great exchange.</p>
          
          <div class="highlight-box">
            <h3 style="color: #fb923c; margin-top: 0;">Enquiry Details:</h3>
            <ul class="details-list">
              <li>📚 <strong>Book:</strong> ${bookTitle}</li>
              <li>👤 <strong>Interested Reader:</strong> ${enquirerName}</li>
              <li>⏰ <strong>Received:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>

          <p style="font-size: 16px;">
            <strong>Quick tip:</strong> Quick responses lead to successful exchanges! Readers appreciate prompt replies and are more likely to proceed with the exchange.
          </p>
          
          <div class="button-container">
            <a href="${callbackUrl}" class="button">
              View & Respond Now →
            </a>
          </div>

          <p style="text-align: center; margin-top: 30px;">
            Want to review your listing first?<br>
            <a href="${bookUrl}" class="secondary-link">Check Your Book Details →</a>
          </p>

          <div class="signature">
            <p>Happy Reading!<br>
            <strong>The BookHub Team</strong></p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} BookHub. All rights reserved.</p>
          <p style="margin: 5px 0; color: #9ca3af;">This is an automated message. Please do not reply directly.</p>
        </div>
      </div>
    </div>
  </body>
</html>
`;

    // Configure email options
    const mailOptions = {
      from: `"Book Hub" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `New Enquiry for Your Book: ${bookTitle}`,
      html: htmlContent
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Callback notification email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Error sending callback notification email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}




