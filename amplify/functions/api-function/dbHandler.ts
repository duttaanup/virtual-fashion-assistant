//@ts-nocheck
import type { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDB, SES } from "aws-sdk";

const header = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

const USER_REGISTRATION_TABLE = process.env.USER_REGISTRATION_TABLE;

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("event", event);
  if (event.httpMethod === "GET") {
    const dynamodb = new DynamoDB.DocumentClient();
    const params = {
      TableName: USER_REGISTRATION_TABLE,
    };
    const data = await dynamodb.scan(params).promise();
    return {
      statusCode: 200,
      headers: header,
      body: JSON.stringify(data.Items),
    };
  } else if (event.httpMethod === "POST") {
    const body = JSON.parse(event.body);
    if (body.action == "ADD_USER") {
      const dynamodb = new DynamoDB.DocumentClient();
      const params = {
        TableName: USER_REGISTRATION_TABLE,
        Item: body.data,
      };
      await dynamodb.put(params).promise();
      // Send email to user
      const ses = new SES();
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
        Source: "no-reply@mysampledemo.site",
      };
      await ses.sendEmail(emailParams).promise();
    } else if (body.action == "UPDATE_USER") {
      const dynamodb = new DynamoDB.DocumentClient();
      if(body.action_type == "SELECTED_USER_IMAGE"){
        const params = {
          TableName: USER_REGISTRATION_TABLE,
          Key: {
            email: body.data.email,
          },
          UpdateExpression: "set #process_state = :process_state , #selected_image = :selected_image , #update_on = :update_on , #gender = :gender",
          ExpressionAttributeNames: {
            "#process_state": "process_state",
            "#selected_image": "selected_image",
            "#update_on":"update_on",
            "#gender":"gender"
          },
          ExpressionAttributeValues: {
            ":process_state": body.data.process_state,
            ":selected_image": body.data.selected_image,
            ":update_on": body.data.update_on,
            ":gender": body.data.gender
          },
          ReturnValues: "ALL_NEW",
        };
        await dynamodb.update(params).promise();
      }else if(body.action_type == "SELECTED_USER_GARMENT"){
        const params = {
          TableName: USER_REGISTRATION_TABLE,
          Key: {
            email: body.data.email,
          },
          UpdateExpression: "set #process_state = :process_state , #selected_garment = :selected_garment , #update_on = :update_on",
          ExpressionAttributeNames: {
            "#process_state": "process_state",
            "#selected_garment": "selected_garment",
            "#update_on":"update_on"
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
    }
    return {
      statusCode: 200,
      headers: header,
      body: JSON.stringify("Success"),
    };
  } else {
    return {
      statusCode: 400,
      headers: header,
      body: JSON.stringify("Invalid Request"),
    };
  }

};