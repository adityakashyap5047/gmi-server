import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  location: {
    lat: Number,
    lng: Number,
  },
  visible: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.model("User", userSchema);