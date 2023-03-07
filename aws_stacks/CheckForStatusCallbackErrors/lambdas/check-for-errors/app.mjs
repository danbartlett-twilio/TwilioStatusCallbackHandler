/**
 *  check-for-errors
 * 
 * Lambda function subscribed to SNS Topic. Receives
 * new messages, parses the message body, looks for error code
 * and if present, format event to send to eventbridge for further 
 * processing. 
 */
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";


export const lambdaHandler = async (event, context) => {
    
    let messageBody = JSON.parse(event.Records[0].Sns.Message);

    //console.info("EVENT\n" + JSON.stringify(event, null, 2));    
    //console.info("Message\n" + JSON.stringify(messageBody, null, 2));
    /**
     * {
        "ErrorCode": "30xxx",    
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

    if (messageBody?.ErrorCode) {

        // Pass this onto EventBridge for further processing!
        const client = new EventBridgeClient();
        let eventParams = {
            "Entries": [ 
            {
              // Event envelope fields
              Source: process.env.EVENT_SOURCE_NAME,
              EventBusName: process.env.EVENTBUS_NAME,
              DetailType: process.env.EVENT_DETAIL_TYPE,
              Time: new Date(),

              Detail: JSON.stringify({
                ErrorCode: messageBody.ErrorCode,
                ...messageBody              
              })
            }
            ]    
          };
        const command = new PutEventsCommand(eventParams);

        try {            
            
            const response = await client.send(command);            
            //console.log("Successfully added event to eventbridge! Response => ", response);
        
        } catch (error) {
            
            console.log("Error adding event to eventbridge => ", error);
    
        }    

    } else {

        // No error! Do nothing else

    }

};