import type { APIGatewayProxyHandler } from "aws-lambda";

const COMFY_SERVER = process.env.COMFY_SERVER;

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("event", event);
  // Make a post call to the API
  try{
    const response = await fetch(`${COMFY_SERVER}/vton`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: event.body,
    });
    return {
      statusCode: 200,
      // Modify the CORS settings below to match your specific requirements
      headers: {
        "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
        "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
      },
      body: JSON.stringify(response),
    };
  }catch(error){
    console.log("error", error);
  }
  return {
    statusCode: 200,
    // Modify the CORS settings below to match your specific requirements
    headers: {
      "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
      "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
    },
    body: JSON.stringify({"status": "error"}),
  };
};