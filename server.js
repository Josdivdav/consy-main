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
const { createPost, getPost, reactionControlLike } = require("./post.js");
const { svn } = require("./numbers.js");
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Folder to save files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});
const upload = multer({ storage: storage });

const { key, user } = mailings;
app.use(cors());
app.use('/uploads', express.static('uploads'));
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
  socket.on("create-post", async (postData) => {
    const { sid } = postData;
    try {
      const response = await createPost(postData);
      io.to(sid).emit("create-post", response);
    } catch(err) {
      io.to(sid).emit("create-post", "Error occured");
    }
  })
  socket.on("fetch-post", async (sid, uid) => {
    io.to(sid).emit("fetch-post", await getPost(uid), sid);
  })
});

// fetch data 
app.post("/fetch-user", async (req, res) => {
  const { userId } = req.body;
  userId ? res.json(await getUserData(userId)) : res.json(await getUsers());
})

app.post("/api/post-react-like", async (req, res) => {
  const { postId, portalId } = req.body;
  const response = await reactionControlLike(postId, portalId);
  res.json({likes: response.reactions.likes});
})

app.post("/api/send-code/v1", async (req, res) => {
  const { email, code } = req.body;
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    auth: {
      user: user,
      pass: key
    },
    tls: {
      rejectUnauthorized: false
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

app.post("/api/upload", upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: 'No file uploaded' });
  }
  res.json({ filePath: req.file.path, type: req.file.mimetype });
});

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
