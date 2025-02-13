var express = require('express');
const passport = require('passport');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./posts');
const localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));
const upload = require('./multer');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

postModel.collection.dropIndex('username_1', function(err, result) {
  if (err) {
    console.error('Error dropping index:', err);
  } else {
    console.log('Index dropped:', result);
  }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/profile', isLoggedIn ,async function(req, res, next) {
  const user = await userModel.findOne({
    username : req.session.passport.user
  })
  .populate('posts');
  console.log(user);
  res.render('profile',{user});
});

router.get('/login',function(req, res, next) {
  res.render('login',{error: req.flash('error')});
});

router.get('/edit', isLoggedIn ,async function(req, res, next) {
  const user = await userModel.findOne({
    username : req.session.passport.user
  });

  res.render('edit',{user});
});

router.get('/feed', isLoggedIn ,async function(req, res, next) {
  const user = await userModel.findOne({
    username : req.session.passport.user
  })
  .populate('posts')

  const people = await userModel.find()
  .populate('posts')
  
  res.render('feed',{user,people});
});

router.get('/uploadpost', isLoggedIn ,async function(req, res, next) {
  const user = await userModel.findOne({
    username : req.session.passport.user
  });

  res.render('uploadpost',{user});
});


router.get('/search', isLoggedIn ,async function(req, res, next) {

  const user = await userModel.findOne({
    username : req.session.passport.user
  });

  res.render('search',{user});
});

router.get('/username/:username', isLoggedIn ,async function(req, res, next) {

  const regex = new RegExp(`^${req.params.username}`, 'i'); 
  const users = await userModel.find({username: regex});
  res.json(users);
});

router.get('/profile/:user', async function(req, res, next) {
    const user = await userModel.findOne({ username: req.session.passport.user });

    if (user.username === req.params.user) {
      return res.redirect('/profile');
    }

    let userprofile = await userModel.findOne({ username: req.params.user })
      .populate('posts');

    res.render('userprofile', { user, userprofile }); // Use res.render to render a view with data
  });

router.get('/deletepost/:post', isLoggedIn ,async function(req,res,next){
  try{

    const user = await userModel.findOne({ username: req.session.passport.user });
    
    const post =await postModel.findOneAndDelete({_id: req.params.post});
    res.redirect('/profile')
  }catch(error){
    next(error);
  }
});

router.get('/deleteprofile',async function(req,res,next){
  try {
    const User = await userModel.findOneAndDelete({username: req.session.passport.user});
  } catch (error) {
    next(error);
  }
})

router.get('/like/:id', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });

    const post = await postModel.findOne({ _id: req.params.id });

    const userIndex = post.likes.indexOf(user._id);

    if (userIndex === -1) {
      post.likes.push(user._id);
    } else {
      post.likes.splice(userIndex, 1);
    }

    await post.save();
    res.redirect('/feed');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/follow/:userid', isLoggedIn, async function(req, res, next) {
  try {
    const followkarnewala = await userModel.findOne({ username: req.session.passport.user });
    const followhoonewala = await userModel.findOne({ _id: req.params.userid });
    const user = await userModel.findOne({ username: req.session.passport.user });
    const userprofile = await userModel.findOne({ _id: req.params.userid });

    if (!followkarnewala || !followhoonewala) {
      return res.status(404).send('User not found');
    }

    const index = followkarnewala.following.indexOf(followhoonewala._id.toString());
    const index2 = followhoonewala.followers.indexOf(followkarnewala._id.toString());

    if (index !== -1) {
      followkarnewala.following.splice(index, 1);
      followhoonewala.followers.splice(index2, 1);
    } else {
      followkarnewala.following.push(followhoonewala._id);
      followhoonewala.followers.push(followkarnewala._id);
    }

    await followhoonewala.save();
    await followkarnewala.save();

    res.render('userprofile', { user, userprofile });
  } catch (error) {
    next(error);
  }
});



router.post('/register',function(req,res){
  const { username, email, fullname } = req.body;
  const userData = new userModel({ username, email, fullname });

  userModel.register(userData, req.body.password)
  .then(function(){
    passport.authenticate('local')(req,res,function(){
      res.redirect('/profile')
    })
  })
});


router.post('/login',passport.authenticate("local",{
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true
}),function(req,res){})


router.post('/file', isLoggedIn , upload.single('ProfileImage'),async function(req,res,next){
  if(!req.file){
    return res.status('404').send('No File Is Selected');
  }

  const user = await userModel.findOne({
    username : req.session.passport.user
  });

  user.ProfileImage = req.file.filename;
  await user.save();
  res.redirect('/profile')
});


router.post('/upload-bio', isLoggedIn ,async function(req,res,next){
  const user = await userModel.findOneAndUpdate({
    username : req.session.passport.user
  },{bio: req.body.bio},{new: true});

  await user.save();
  res.redirect('profile');
});

router.post('/update-name' ,async function(req,res,next){
  const user = await userModel.findOneAndUpdate({
    username : req.session.passport.user
  },{username: req.body.username,fullname: req.body.fullname},{new: true});

  await user.save();
  res.redirect('profile');
});

router.post('/postupload', isLoggedIn, upload.single('posts'), async (req, res, next) => {
  try {
    // Check if a file is selected
    if (!req.file) {
      return res.status(400).send('No file selected');
    }

    // Find the user by their session username
    const user = await userModel.findOne({ username: req.session.passport.user });
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Create a new post
    const postData = new postModel({
      image: req.file.filename,
      imageText: req.body.caption,
      userid: user._id,
      username: user.username
    });

    // Save the post and update the user's posts array
    const savedPost = await postData.save();
    user.posts.push(savedPost._id);
    await user.save();

    // Redirect to profile after successful upload
    res.redirect('/profile');
  } catch (error) {
    // Pass the error to the error handler middleware
    next(error);
  }
});



router.get('/logout',function(req,res){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
})

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()) return next();
  res.redirect('/');
}

module.exports = router;
