const fs   = require('fs');
const jwt   = require('jsonwebtoken');

// use 'utf8' to get string instead of byte array  (512 bit key)
let privateKEY  = process.env.privateKEY;
let publicKEY  =  process.env.publicKEY;

if (!privateKEY) {
  privateKEY = fs.readFileSync('./private.key', 'utf8');
  publicKEY = fs.readFileSync('./private.key', 'utf8');
}

module.exports = {
 sign: (clientId) => {
  /*
   sOptions = {
    audience: "Client_Identity" // this should be provided by client
   }
  */
  // Token signing options
  const signOptions = {
    audience:  clientId,
    expiresIn:  "30d",    // 30 days validity
    algorithm:  "RS256"
  };
  return jwt.sign({}, privateKEY, signOptions);
},
verify: (token, clientId) => {
  /*
   vOption = {
    audience: "Client_Identity" // this should be provided by client
   }
  */
  const verifyOptions = {
    audience:  clientId,
    expiresIn:  "30d",
    algorithm:  ["RS256"]
  };
   try{
     jwt.verify(token, publicKEY, verifyOptions);
     return true;
   }catch (err){
     return false;
   }
},
 decode: (token) => {
    return jwt.decode(token, {complete: true});
    //returns null if token is invalid
 }
}
