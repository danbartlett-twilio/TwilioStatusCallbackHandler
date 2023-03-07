/**
 *  save-to-s3
 * 
 * Lambda function subscribed to SNS Topic. Receives
 * new messages, parses the message body, and then
 * saves to S3 bucket. Object key follows pattern:
 * date/timestamp-messagesid-status.json
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const lambdaHandler = async (event, context) => {
    
    let messageBody = JSON.parse(event.Records[0].Sns.Message);

    //console.info("EVENT\n" + JSON.stringify(event, null, 2));    
    //console.info("Message\n" + JSON.stringify(messageBody, null, 2));
    /**
     * {
        "SmsSid": "SM5c6ea011xxxxxxxxxxxxxxxxx",
        "SmsStatus": "delivered",
        "MessageStatus": "delivered",
        "To": "+17111111111",
        "MessageSid": "SM5c6ea011bxxxxxxxxxxxxxxxxx",
        "AccountSid": "AC7db7467e0xxxxxxxxxxxxxxxxx",
        "From": "+17111111111",
        "ApiVersion": "2010-04-01",
        "sqs_record": "33bd9b6d-d4e5-xxxxxxxxxxxxxxxxx",
        "timestamp": 1676263215089,
        "id": "123",
        "category": "marketing"
        }
     */


    const client = new S3Client({ region: process.env.REGION });

    let now = new Date(); 
    let y = now.getFullYear().toString();
    let m = (now.getMonth() < 10 ? '0' : '') + now.getMonth().toString();
    let d = (now.getDate() < 10 ? '0' : '') + now.getDate().toString();
    // Create a date prefix so that objects in S3 bucket are organized
    // by date. Note, date is based on UTC time!
    let dateprefix = `${y}-${m}-${d}/`;

    let key = `${dateprefix}${messageBody.timestamp}-${messageBody.MessageSid}-${messageBody.MessageStatus}.json`;

    const params = {
        Bucket: process.env.DestinationBucket,
        Key: key,
        Body: JSON.stringify(messageBody),
        ContentType: 'application/json'        
    };
    
    // console.log("params => ", params);
    
    const command = new PutObjectCommand(params);
    
    try {
        
        const data = await client.send(command);
        console.log("Successfully saved object to S3 bucket! Data => ", data);

    } catch (error) {
        
        console.log("Error saving object to S3 bucket => ", error);

    }    

};