const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    imageText: { 
        type: String, 
    },
    image: {
      type: String
    },
    createdAt: { 
        type: Date, 
        default: Date.now() 
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
      }
    ],
    userid:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    username: {
      type: String,
    },
  });

const Post = mongoose.model("Post", postSchema);
module.exports = Post;

