//@ts-nocheck
import type { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDB, S3 } from "aws-sdk";

const USER_REGISTRATION_TABLE = process.env.USER_REGISTRATION_TABLE;
const S3_BUCKET = process.env.S3_BUCKET;

const dynamodb = new DynamoDB.DocumentClient();
const s3 = new S3();
const htmlheader = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
    "Content-Type": "text/html",
};

export const handler: APIGatewayProxyHandler = async (event) => {
    const user_id = event.queryStringParameters.id;
    const user = await getUserById(user_id);
    console.log(user.Item);
    if(user.Item.processed_image == ""){
        return {
            statusCode: 200,
            headers: htmlheader,
            body: "<b>Image Generation is in-progress. Please try after sometime</b>",
        };
    }else{
        const s3Params = {
            Bucket: S3_BUCKET,
            Key: user.Item.processed_image,
        };
        const s3Data = await s3.getObject(s3Params).promise();
        const base64Data = s3Data.Body.toString('base64');
        return {
            statusCode: 200,
            headers: htmlheader,
            body: `<img src="data:image/jpeg;base64,${base64Data}" alt="Processed Image">`,
        };
    }
    
}

async function getUserById(id: string) {
    const params = {
        TableName: USER_REGISTRATION_TABLE,
        Key: {
            email: "duttanup+"+id+"@amazon.com",
        },
    };
    const data = await dynamodb.get(params).promise();
    return data;
}