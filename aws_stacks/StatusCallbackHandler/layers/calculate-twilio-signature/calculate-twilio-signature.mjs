/**
 * calculate-twilio-signature
 * 
 * helper function to generate twilio signature
 * to be sure that request is coming from twilio.
 * Calculation reliant on secret "authToken"
 * 
 */
import crypto from 'crypto';

async function getSignature(authToken, url, params) {
    
 try {
    
    // get all request parameters
    let data = Object.keys(params)
       // sort them
      .sort()
       // concatenate them to a string
      .reduce((acc, key) => acc + key + params[key], url);
    
    return crypto
       // sign the string with sha1 using your AuthToken
      .createHmac('sha1', authToken)
      .update(Buffer.from(data, 'utf-8'))
       // base64 encode it
      .digest('base64');
      
  } catch (err) {

    console.error("Error in calculate-twilio-signature layer => ", err);

  }

}

export { getSignature }
