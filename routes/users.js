const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect('mongodb+srv://pranavdeshmukh5454:LYs3VTzZG7EGBlA0@instaclone.ddhbx.mongodb.net/');

const userSchema = mongoose.Schema({
  username: {
    type: String
  },
  fullname: {
    type: String
  },
  email: {
    type: String
  },
  password: {
    type: String
  },
  ProfileImage: {
    type: String
  },
  bio: {
    type: String,
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user" 
    } 
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user" 
    }
  ],
});

mongoose.plugin(plm);

module.exports = mongoose.model('user',userSchema);