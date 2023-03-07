/**
 *  save-to-dynamodb
 * 
 * Lambda function subscribed to SNS Topic. Receives
 * new messages, parses the message body, and then
 * saves to DynamoDB Table. primary key / sort key follows pattern:
 * pk: MessageSid, sk: MessageStatus
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

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


    const client = new DynamoDBClient({ region: process.env.REGION });
    const ddbDocClient = DynamoDBDocumentClient.from(client);               

    // Set primary key as message sid
    // Set sort key as message status
    const newItem = {
        pk: messageBody.MessageSid,
        sk: messageBody.MessageStatus,
        ...messageBody
    }; 

    // console.log("newItem => ", newItem);
    
    try {
        
        const data = await ddbDocClient.send(
            new PutCommand({
              TableName: process.env.TABLE_NAME,
              Item: newItem,
            })
        );
        //console.log("Successfully saved object to DynamoDB Table! Data => ", data);
        
    } catch (error) {
        
        console.log("Error saving object to S3 bucket => ", error);

    }    

};