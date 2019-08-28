const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hello@rekr.app',
    pass: 'Tyryky13'
  }
});

async function sendUserEmail({ username, email, token }) {
  const mailOptions = {
    from: 'hello@rekr.com',
    to: 'lingleryan@gmail.com',
    subject: 'Confirm Your Email',
    html: `<div>
             Hello ${username}!
             <br></br>
             <br></br>
             Before you can start recommending episodes and stacking sats we are going to do need
             to verify your email address:
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

  sendEmail(mailOptions);
}

async function sendPodcastEmail({ title, email, token }) {
  const mailOptions = {
    from: 'hello@rekr.com',
    to: 'lingleryan@gmail.com',
    subject: 'Start Receiving Podcast Donations!',
    html: `<div>
             Hello ${title} Admin!
             <br></br>
             <br></br>
             Before you can start receiving donations for your episodes we are going to do need
             to verify your email address:
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
  sendEmail(mailOptions);
}

function sendEmail(mailOptions) {
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

module.exports = { sendUserEmail, sendPodcastEmail };
