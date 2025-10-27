const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'joshuadivine985@gmail.com',
    pass: 'fycj tsbi luuy ieqo' // Use app password, not regular password
  }
});

// Email options
const mailOptions = {
  from: 'nazoratechnologylimited@gmail.com',
  to: 'llc.bytewave@gmail.com',
  subject: 'Test Email from Node.js',
  text: 'This is a plain text email!',
  html: '<h1>This is an HTML email!</h1><p>Pretty cool, right?</p>'
};

// Send email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});
