const socketServer = require('socket.io');
const cors = require('cors');
const express = require("express");
const app = express();
app.use(express.json());
const http = require('http').createServer(app);
const nodemailer = require('nodemailer');
const { jwt } = require('jsonwebtoken');
const { db, secret_key, mailings } = require("./admin.firebase.js");
const { generateToken, verifyToken } = require("./jwt.utils.js");
const { verifyAndCreateUser, verifyAndLogUserIn } = require("./firebase.auth.js");
const { getUserData, getUsers } = require("./user.js");
const { createPost, getPost } = require("./post.js");
const { svn } = require("./numbers.js")
const { key, user } = mailings;
app.use(cors());
const io = socketServer(http, {cors: {origin: '*'}});
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = verifyToken(token, secret_key);
  if (!decoded) {
    socket.disconnect();
    return next(new Error('Unauthorized'));
  }
  socket.user = decoded;
  next();
};

io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log('Client connected id: '+socket.id);
  socket.on("authenticate", (r) => {
    const token = socket.handshake.auth.token;
    io.to(r).emit("authenticate", verifyToken(token, secret_key));
  })
  socket.on("fetchUserData", async (sid, uid) => {
    io.to(sid).emit("fetchUserData", await getUserData(uid));
  })
  socket.on("createPost", async (postData) => {
    const { content, mediaData, uuid, sid, reactions, timestamp } = postData;
    const response = await createPost({text: content, mediaData: mediaData, uuid: uuid, timestamp: timestamp, reactions});
    io.to(sid).emit("createPost", response);
  })
  socket.on("fetchPost", async (sid, uid) => {
    io.to(sid).emit("fetchPost", await getPost(uid), sid);
  })
});

// fetch data 
app.post("/fetch-user", async (req, res) => {
  const { userId } = req.body;
  userId ? res.json(await getUserData(userId)) : res.json(await getUsers());
})

app.post("/api/send-code/v1", async (req, res) => {
  const { email, code } = req.body;
  const transporter = nodemailer.createTransport({
   service: 'gmail',
   auth: {
     user: user,
     pass: key
   }
 })
 
 const mailOptions = {
  from: 'nazoratechnologylimited@gmail.com',
  to: email,
  subject: "Consy - Code",
  text: '',
  html: `
   <html>
   <body>
    <h2>Hello there,</h2>
    <p>You recently signed up for our application. To complete your registration, please use the verification code below:</p>
    <h1>Verification Code: ${code}</h1>
    <p>Enter this code on the verification page to activate your account.</p>
    <p>If you didn't sign up for our application, please disregard this email.</p>
    <p>Best regards,</p>
    <p>Consy Inc</p>
   </body>
   </html>
  `
 }
 transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Error:', error);
    res.status(500).send({code: 500, message: "Invalid email address"});
  } else {
    console.log('Email sent:', info.response);
    res.json({code: 200, message: "Code was sent"});
  }
 })

})

// register a user
app.post("/api/register", async (req, res) => {
  const userData = req.body;
  const { portalID } = userData;
  if(!portalID || !svn.includes(portalID)) {
    res.status(500).send({message: "invalid svn"});
    return;
  }
  const request = await verifyAndCreateUser(userData);
  if(request.code === 500) {
    res.status(500).send({message: request.message});
  } else {
    res.json(request);
  }
})

/// sign in a user
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const response = await verifyAndLogUserIn(email, password);
  console.log(secret_key)
  
  res.json({token: generateToken(response, secret_key), name: response?.name});
})

http.listen(5000, () => {
  console.log('Server listening on port 5000');
});
