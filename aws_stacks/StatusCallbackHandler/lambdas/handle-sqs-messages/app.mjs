/**
 * handle-sqs-messages
 * 
 * Lambda function that is triggered by SQS. Opens
 * message, check x-twilio-signature, publishes message
 * to SNS topic for downstream processing.
 */
import  querystring from 'node:querystring';
import { getSignature } from '/opt/calculate-twilio-signature.mjs';
import  { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({ region: process.env.REGION });

async function processRecord(record) {

    //console.log(`Processing ${record.messageId}`);

    let url = `https://${record.messageAttributes.domainName.stringValue}${record.messageAttributes.path.stringValue}`;
    let hasParams = (record.messageAttributes.queryStringParams.stringValue === 'yes') ? true : false;
    let qParams = [];    
    
    // If present, pull parameter values
    if (hasParams) {
        let keys = record.messageAttributes.paramsArray.stringValue.split('|');
        keys.forEach( (k, i) => {
            //console.log("k => ", k);
            //console.log("i => ", i);
            let d = (i===0) ? '?' : '&';
            url += `${d}${k}=${record.messageAttributes[k].stringValue}`;
            qParams.push({[k]:record.messageAttributes[k].stringValue});
        });
    }

    // Decode the request body
    let bodyParams = querystring.decode(record.body);           
    
    // This is the header passed from twilio
    let passedTwilioSignature = record.messageAttributes['x-twilio-signature'].stringValue;
    
    // Calculated what the twilio header should be
    let calculatedTwilioSignature = await getSignature(process.env.AUTH_TOKEN, url, bodyParams);
    
    //console.log('calculatedTwilioSignature => ', calculatedTwilioSignature);
    //console.log('passedTwilioSignature => ', passedTwilioSignature);

    // Check to be sure the header from twilio is valid before processing!
    if (calculatedTwilioSignature === passedTwilioSignature) {
            
        // Signatures Match! Publish to SNS Topic
        let snsObject = {
            ...bodyParams,
            sqs_record:record.messageId,
            timestamp:parseInt(record.attributes.ApproximateFirstReceiveTimestamp)
        };
        
        // If the status callback has query string params, add
        // them to the object
        if (hasParams) {            
            qParams.forEach( x => { Object.assign(snsObject, x) } );
        }
        
        //console.log("Publishing SNS Record =====> ");    
        //console.log(JSON.stringify(snsObject, 2, null));    
        
        const params = {
            Message: JSON.stringify(snsObject),            
            TopicArn: process.env.SNStopic
        };
          
        // Send to SNS
        try {
            
            const data = await snsClient.send(new PublishCommand(params));
            //console.log("Success. Message Published",  data);        

        } catch (err) {
            
            console.log("Error publishing message to Topic!", err.stack);

        }     

    } else {
        
        console.warn('x-twilio-signature does not match!');        
        console.warn(`SQS Message: ${record.messageId} was not processed!`);
        
        // Add additional security notification here!

    }

}

export const lambdaHandler = async (event, context) => {
    
    //console.log(JSON.stringify(event, 2, null));    

    // Loop through all messages in batch received from SQS
    await Promise.all(event.Records.map(async (record) => {
        
        await processRecord(record);

    }));            

};