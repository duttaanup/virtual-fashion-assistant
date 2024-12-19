//@ts-nocheck
import type { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const header = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

// Get table name from environment variables
const USER_REGISTRATION_TABLE = process.env.USER_REGISTRATION_TABLE;

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("event", event);
  // Handle GET and POST requests
  if (event.httpMethod === "GET") {
    // Get all items from dynamodb table
    const dynamodb = new DynamoDB.DocumentClient();
    const params = {
      TableName: USER_REGISTRATION_TABLE,
    };
    const data = await dynamodb.scan(params).promise();
    console.log("data", data)
    return {
      statusCode: 200,
      // Modify the CORS settings below to match your specific requirements
      headers: header,
      body: JSON.stringify(data.Items),
    };
  } else if (event.httpMethod === "POST") {
    // Save item to dynamodb table
    const dynamodb = new DynamoDB.DocumentClient();
    const params = {
      TableName: USER_REGISTRATION_TABLE,
      Item: JSON.parse(event.body),
    };
    await dynamodb.put(params).promise();
    return {
      statusCode: 200,
      // Modify the CORS settings below to match your specific requirements
      headers: header,
      body: JSON.stringify("Hello from db functions!"),
    };
  }else{
    return {
      statusCode: 400,
      // Modify the CORS settings below to match your specific requirements
      headers: header,
      body: JSON.stringify("Invalid Request"),
    };
  }
  
};