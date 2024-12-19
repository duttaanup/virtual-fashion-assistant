//@ts-nocheck
import type { APIGatewayProxyHandler } from "aws-lambda";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
const MODEL_REGION = "us-east-1";
const MODEL_ID = "amazon.nova-lite-v1:0";
const bedrockClient = new BedrockRuntimeClient({ region: MODEL_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("event", event);
  try {
    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    const userPrompt = `You are an ai assistant specialize in gender identification. Identify gender of the image provide and respond a json output. give answer either male or female , along with confidence score between 0-1 , 1 is the highest in following format { "gender" : "male", "confidence": [0-1]} or { "gender" : "female", "confidence": [0-1]}`;

    // Prepare the nova lite payload
    const payload = {
      "inferenceConfig": {
        "max_new_tokens": 1000
      },
      "system":[
        {
          "text": "provide only json output without any additional content"
        }
      ],
      "messages": [
        {
          "role": "user",
          "content": [
            {
              "text": userPrompt
            },
            {
              "image": {
                "format": "png",
                "source": {
                  "bytes": body.image
                }
              }
            }
          ]
        }
      ]
    }

    // Create the command to invoke the model
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    });

    // Invoke the model
    const response = await bedrockClient.send(command);

    // Parse the response
    const responseBody = new TextDecoder().decode(response.body);
    const result = JSON.parse(responseBody);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({
        response: result
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({
        error: "Internal Server Error",
        details: error.message
      })
    };
  }
};