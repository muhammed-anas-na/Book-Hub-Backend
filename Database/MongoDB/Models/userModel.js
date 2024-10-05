import mongoose from "mongoose";


let userModelSchema = new mongoose.Schema({
    displayName:{
        type:String,
    },
    email:{
        type: String
    },
    photoURL:{
        type: String,
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
    isBlocked:{
        type:String,
        default:false,
    },
    Books:{
        type:Array,
    },
    callbacks:{
        type:Array,
    }
});
const userModel = mongoose.model('users', userModelSchema);

export default userModel;