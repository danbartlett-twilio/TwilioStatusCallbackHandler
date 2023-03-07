/**
 *  check-for-errors
 * 
 * Lambda function subscribed to SNS Topic. Receives
 * new messages, parses the message body, looks for error code
 * and if present, format event to send to eventbridge for further 
 * processing. 
 */

export const lambdaHandler = async (event, context) => {
    // https://www.twilio.com/docs/api/errors/30006        
    console.info("Error Code 30006 => \n" + JSON.stringify(event, null, 2));

};