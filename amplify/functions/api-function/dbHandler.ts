//@ts-nocheck
import type { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDB, SES, S3 } from "aws-sdk";
import { createMimeMessage } from "mimetext";

enum ActionTypes {
  ADD_USER = 'ADD_USER',
  UPDATE_USER = 'UPDATE_USER',
  SEND_IMAGE = 'SEND_IMAGE'
}

enum ProcessTypes {
  SELECTED_USER_IMAGE = 'SELECTED_USER_IMAGE',
  SELECTED_USER_GARMENT = 'SELECTED_USER_GARMENT'
}
const header = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

const USER_REGISTRATION_TABLE = process.env.USER_REGISTRATION_TABLE;
const EMAIL_ID = process.env.EMAIL_ID;
const S3_BUCKET = process.env.S3_BUCKET;

const dynamodb = new DynamoDB.DocumentClient();
const ses = new SES();
const s3 = new S3();

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("event", event);
  if (event.httpMethod === "GET") {
    return await getActions();
  } else if (event.httpMethod === "POST") {
    return await postActions(event)
  } else {
    return {
      statusCode: 400,
      headers: header,
      body: JSON.stringify("Invalid Request"),
    };
  }
};

async function getActions() {
  const params = {
    TableName: USER_REGISTRATION_TABLE,
  };
  const data = await dynamodb.scan(params).promise();
  return {
    statusCode: 200,
    headers: header,
    body: JSON.stringify(data.Items),
  };
}

async function postActions(event) {
  const body = JSON.parse(event.body);
  if (body.action == ActionTypes.ADD_USER) {
    const params = {
      TableName: USER_REGISTRATION_TABLE,
      Item: body.data,
    };
    await dynamodb.put(params).promise();
  
    const emailParams = {
      Destination: {
        ToAddresses: [body.data.email],
      },
      Message: {
        Body: {
          Text: {
            Data: "Thank you for registering for the Virtual Fashion Assistant. We will send you an email when the product is ready.",
          },
        },
        Subject: {
          Data: "Virtual Fashion Assistant Registration",
        },
      },
      Source: EMAIL_ID,
    };
    await ses.sendEmail(emailParams).promise();
  } else if (body.action == ActionTypes.UPDATE_USER) {
    if (body.action_type == ProcessTypes.SELECTED_USER_IMAGE) {
      const params = {
        TableName: USER_REGISTRATION_TABLE,
        Key: {
          email: body.data.email,
        },
        UpdateExpression: "set #process_state = :process_state , #selected_image = :selected_image , #update_on = :update_on , #gender = :gender , #processed_image = :processed_image , #processed_video = :processed_video",
        ExpressionAttributeNames: {
          "#process_state": "process_state",
          "#selected_image": "selected_image",
          "#update_on": "update_on",
          "#gender": "gender",
          "#processed_image": "processed_image",
          "#processed_video":"processed_video"
        },
        ExpressionAttributeValues: {
          ":process_state": body.data.process_state,
          ":selected_image": body.data.selected_image,
          ":update_on": body.data.update_on,
          ":gender": body.data.gender,
          ":processed_image": "",
          ":processed_video": ""
        },
        ReturnValues: "ALL_NEW",
      };
      await dynamodb.update(params).promise();
    } else if (body.action_type == ProcessTypes.SELECTED_USER_GARMENT) {
      const params = {
        TableName: USER_REGISTRATION_TABLE,
        Key: {
          email: body.data.email,
        },
        UpdateExpression: "set #process_state = :process_state , #selected_garment = :selected_garment , #update_on = :update_on",
        ExpressionAttributeNames: {
          "#process_state": "process_state",
          "#selected_garment": "selected_garment",
          "#update_on": "update_on"
        },
        ExpressionAttributeValues: {
          ":process_state": body.data.process_state,
          ":selected_garment": body.data.selected_garment,
          ":update_on": body.data.update_on
        },
        ReturnValues: "ALL_NEW",
      };
      await dynamodb.update(params).promise();
    }
  } else if (body.action == ActionTypes.SEND_IMAGE) {
    const params = {
      TableName: USER_REGISTRATION_TABLE,
      Key: {
        email: body.data.email,
      }
    };
    const data = await dynamodb.get(params).promise();
    const db_item = data.Item;
    
    const s3Params = {
      Bucket: S3_BUCKET,
      Key: db_item.processed_image,
    };
    const s3Data = await s3.getObject(s3Params).promise();
    const base64Data = s3Data.Body.toString('base64');
    await sendEmailWithAttachment( EMAIL_ID, base64Data, db_item.email );

  }
  return {
    statusCode: 200,
    headers: header,
    body: JSON.stringify("Success"),
  };
}

async function sendEmailWithAttachment(fromEmail: string, base64Data: string, recipientEmail: string) {
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