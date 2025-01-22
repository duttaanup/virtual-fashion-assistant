//@ts-nocheck
import { SQSEvent, SQSHandler } from 'aws-lambda';
import { DynamoDB, SES, S3 , Pinpoint } from "aws-sdk";
import { createMimeMessage } from "mimetext";

const pinpoint = new Pinpoint();
const USER_REGISTRATION_TABLE = process.env.USER_REGISTRATION_TABLE;
const S3_BUCKET = process.env.S3_BUCKET;
const EMAIL_ID = process.env.EMAIL_ID;
const SUPPORT_EMAIL_ID = process.env.SUPPORT_EMAIL_ID;
const PINPOINT_APPLICATION_ID = process.env.PINPOINT_APP_ID;


export const handler: SQSHandler = async (event: SQSEvent) => {
  try {
    for (const record of event.Records) {
      // Parse the message body
      const messageBody = JSON.parse(record.body);
      // Process your message here
      console.log('Processing message:', messageBody);
      if (messageBody.action == "Image_Processed") {
        await processMessage(messageBody);
      } else {
        console.log("Not a valid action")
      }
    }
  } catch (error) {
    console.error('Error processing messages:', error);
    const ses = new SES();
    const response = await ses.sendEmail({
      Destination: {
        ToAddresses: [SUPPORT_EMAIL_ID],
      },
      Message: {
        Body: {
          Text: {
            Data: `Error processing messages: ${error}`,
          },
        },
        Subject: {
          Data: 'Error processing messages',
        },
      },
      Source: EMAIL_ID,
    }).promise();
    console.log("Email sent successfully:", response);
  }
};

async function processMessage(messageBody: any) {
  // Read file from s3
  const s3 = new S3();
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: messageBody.user_data.s3_key,
  };
  const s3Data = await s3.getObject(s3Params).promise();
  const base64Data = s3Data.Body.toString('base64');

  // await sendEmailWithAttachment( EMAIL_ID, base64Data, messageBody.user_data.email);

  const dynamodb = new DynamoDB.DocumentClient();
  const params = {
    TableName: USER_REGISTRATION_TABLE,
    Key: {
      email: messageBody.user_data.email,
    },
    UpdateExpression: "set #process_state = :process_state , #processed_image = :processed_image , #update_on = :update_on",
    ExpressionAttributeNames: {
      "#process_state": "process_state",
      "#processed_image": "processed_image",
      "#update_on": "update_on"
    },
    ExpressionAttributeValues: {
      ":process_state": "Image Processed",
      ":processed_image": messageBody.user_data.s3_key,
      ":update_on": new Date().toISOString()
    },
    ReturnValues: "ALL_NEW",
  };
  await dynamodb.update(params).promise();
}

async function sendEmailWithAttachment(fromEmail: string, base64Data: string, recipientEmail: string) {
  const ses = new SES();

  // Create MIME message
  const msg = createMimeMessage();

  // Set email headers with proper formatting
  msg.setSender({ name: "Virtual Fashion Assistant", addr: fromEmail });
  msg.setSubject("Your Processed Image");
  msg.setRecipient(recipientEmail);
  msg.addAttachment({
    filename: "processed_image.jpg",
    contentType: "image/jpeg",
    data: base64Data,
    encoding: "base64"
  });

  msg.addMessage({
    contentType: 'text/html',
    data: `<html>
        <body>
          <p>Please find your processed image attached.</p>
        </body>
      </html>`
  })
  const params = {
    Destinations: msg.getRecipients({ type: 'to' }).map(mailbox => mailbox.addr),
    RawMessage: {
      Data: Buffer.from(msg.asRaw(), 'utf8') // the raw message data needs to be sent as uint8array
    },
    Source: msg.getSender().addr
  }
  try {
    await ses.sendRawEmail(params).promise();
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}