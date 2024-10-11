import mongoose from "mongoose";


let bookModelSchema = new mongoose.Schema({
    userId:{
        type: String,
        required:true,
    },
    title:{
        type: String,
        required:true,
    },
    description:{
        type: String,
        required:true,
    },
    category:{
        type: String,
    },
    willingTo:{
        type: String,
        enum: ["Trade","Rent","Sell"]
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    locationInText:{
        type: String,
    },
    selectedBookCover:{
        type: String,
    }
});
bookModelSchema.index({ location: "2dsphere" });
const bookModel = mongoose.model('books', bookModelSchema);

export default bookModel;