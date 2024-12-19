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