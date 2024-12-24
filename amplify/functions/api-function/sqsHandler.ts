import { SQSEvent, SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = async (event: SQSEvent) => {
    try {
        for (const record of event.Records) {
            // Parse the message body
            const messageBody = JSON.parse(record.body);
            
            // Process your message here
            console.log('Processing message:', messageBody);
            
            // Add your business logic here
            await processMessage(messageBody);
        }
    } catch (error) {
        console.error('Error processing messages:', error);
        throw error;
    }
};

async function processMessage(messageBody: any) {
    // Implement your message processing logic here
    // For example:
    // - Store data in DynamoDB
    // - Call other services
    // - Perform calculations
    // etc.
    console.log('Processing message body:', messageBody);
}
