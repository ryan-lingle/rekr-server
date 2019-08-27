const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hello@rekr.app',
    pass: 'Tyryky13'
  }
});

async function sendConfirmationEmail({ username, email, token }) {
  const mailOptions = {
    from: 'hello@rekr.com',
    to: 'lingleryan@gmail.com',
    subject: 'Confirm Your Email',
    html: `<div>
             Hello ${username}!
             <br></br>
             <br></br>
             Before you can start recommending episodes and stacking sats we are going to do need
             to verify that email address of yours:
             <br></br>
             <br></br>
             <a href="http://localhost:3000/confirm_email/${token}" >Verify Your Email Address</a>
             <br></br>
             <br></br>
             Best,
             <br></br>
             The Rekr Team
           </div>`
  };


  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

module.exports = { sendConfirmationEmail };
