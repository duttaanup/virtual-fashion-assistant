# Virtual Fashion Assistant: AI-Powered Clothing Try-On Experience

The Virtual Fashion Assistant is an innovative web application that leverages AI technology to provide users with a virtual try-on experience for clothing. This project combines advanced image processing, machine learning, and cloud technologies to create a seamless and interactive fashion exploration platform.

Users can upload their photos, select garments, and receive AI-generated images of themselves wearing the chosen clothing items. The application utilizes AWS services for backend processing, storage, and user management, ensuring scalability and security.

## Repository Structure

```
virtual-fashion-assistant/
├── amplify/
│   ├── auth/
│   ├── backend.ts
│   ├── functions/
│   │   └── api-function/
│   ├── storage/
│   └── tsconfig.json
├── src/
│   ├── common/
│   ├── pages/
│   └── App.tsx
├── amplify.yml
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Key Files:
- `amplify/backend.ts`: Defines the AWS backend infrastructure
- `src/App.tsx`: Main React component for the application
- `src/pages/Fashion.tsx`: Core functionality for the virtual try-on experience
- `amplify/functions/api-function/`: Lambda functions for various API endpoints

### Important Integration Points:
- AWS Amplify for authentication and storage
- AWS Lambda for serverless API functions
- Amazon Bedrock for AI image processing
- DynamoDB for user data storage
- SQS for message queuing
- API Gateway for RESTful API endpoints

## Usage Instructions

### Installation

Prerequisites:
- Node.js (v14 or later)
- AWS CLI configured with appropriate permissions
- Amplify CLI (v5 or later)

Steps:
1. Clone the repository:
   ```
   git clone <repository-url>
   cd virtual-fashion-assistant
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Initialize Amplify:
   ```
   amplify init
   ```
4. Push the backend to AWS:
   ```
   amplify push
   ```

### Getting Started

1. Start the development server:
   ```
   npm run dev
   ```
2. Open your browser and navigate to `http://localhost:3000`

### Configuration Options

- Update `amplify/backend.ts` to modify AWS resource configurations
- Adjust API endpoints in `src/common/AppApi.ts`
- Modify UI components in `src/pages/` directory

### Common Use Cases

1. User Registration:
   ```typescript
   const registerUser = async () => {
     const useremail = window.prompt("Please enter your email", "user@email.com");
     if (useremail) {
       // API call to register user
       await AppApi.dbPostOperation({
         "action": ProcessActionEnum.ADD_USER,
         "data": { email: useremail, /* other user data */ }
       });
     }
   };
   ```

2. Image Upload and Processing:
   ```typescript
   const submitPhoto = async () => {
     const ai_response = await AppApi.aiOperation(selectedImage);
     // Process AI response and update user data
     await AppApi.dbPostOperation({
       "action": ProcessActionEnum.UPDATE_USER,
       "action_type": ProcessActionTypeEnum.SELECTED_USER_IMAGE,
       "data": updatedUserData
     });
   };
   ```

### Testing & Quality

- Run unit tests: `npm test`
- Run linter: `npm run lint`
- Ensure all API endpoints are thoroughly tested with various input scenarios

### Troubleshooting

1. Issue: Failed to upload image
   - Error message: "Access Denied"
   - Diagnostic steps:
     1. Check AWS credentials in Amplify configuration
     2. Verify S3 bucket permissions
     3. Ensure user is authenticated before upload attempt
   - Debug command: `amplify status`
   - Expected outcome: Correct AWS resource configuration displayed

2. Issue: AI processing timeout
   - Error message: "Lambda function timed out"
   - Diagnostic steps:
     1. Check Lambda function timeout settings in `amplify/backend.ts`
     2. Review CloudWatch logs for performance bottlenecks
     3. Optimize image processing code if necessary
   - Debug command: `amplify console function`
   - Expected outcome: Increased Lambda timeout resolves issue

### Debugging

- Enable verbose logging:
  ```typescript
  import { Amplify } from 'aws-amplify';
  Amplify.Logger.LOG_LEVEL = 'DEBUG';
  ```
- CloudWatch Logs: Access via AWS Console or CLI for Lambda function logs
- API Gateway: Enable request/response logging in API Gateway console

### Performance Optimization

- Monitor Lambda execution times and memory usage
- Use AWS X-Ray for tracing API calls and identifying bottlenecks
- Implement caching strategies for frequently accessed data
- Optimize image sizes before processing to reduce AI inference time

## Data Flow

The Virtual Fashion Assistant processes user requests through several stages:

1. User uploads an image through the frontend application.
2. The image is stored in an S3 bucket.
3. A Lambda function is triggered to process the image using Amazon Bedrock AI services.
4. The processed image data is stored in DynamoDB.
5. An SQS message is sent to queue the virtual try-on process.
6. Another Lambda function picks up the SQS message and initiates the try-on process.
7. The resulting image is stored back in S3 and the user record in DynamoDB is updated.
8. The frontend polls for updates and displays the processed image to the user.

```
[User] -> [Frontend] -> [API Gateway] -> [Lambda] -> [S3]
                                           |
                                           v
[User] <- [Frontend] <- [API Gateway] <- [Lambda] <- [DynamoDB]
                                           ^
                                           |
                                       [SQS Queue]
```

Note: Ensure proper IAM permissions are set for each service to communicate with others in the flow.

## Database Schema

The Virtual Fashion Assistant uses Amazon DynamoDB for data storage. The main table is called "UserRegistration" and has the following schema:

### UserRegistration Table

- **Partition Key**: `email` (String)
- **Attributes**:
  - `user_id` (String): Unique identifier for the user
  - `process_state` (String): Current state of the user's processing (e.g., IMAGE_SELECTED, IMAGE_PROCESSING)
  - `selected_image` (String): S3 key of the user's selected image
  - `selected_garment` (String): Identifier or S3 key of the selected garment
  - `gender` (Object): Contains gender information detected from the user's image
  - `processed_image` (String): S3 key of the processed try-on image
  - `processed_video` (String): S3 key of the processed try-on video (if applicable)
  - `create_on` (String): Timestamp of user registration
  - `update_on` (String): Timestamp of last update to the user record

The table uses a single-table design pattern, with the email address as the partition key for efficient lookups. The `process_state` attribute allows for tracking the user's progress through the virtual try-on workflow, while the various image and garment attributes store references to the relevant files in S3.

## Deployment

Prerequisites:
- AWS account with necessary permissions
- Amplify CLI configured

Deployment steps:
1. Review and update `amplify.yml` if necessary
2. Commit and push changes to your Git repository
3. In the Amplify Console, connect your repository and select the branch to deploy
4. Follow the Amplify Console prompts to deploy both backend and frontend

Environment configurations:
- Set environment variables in Amplify Console for sensitive data
- Update `amplify/backend.ts` for environment-specific configurations

Monitoring setup:
- Enable CloudWatch alarms for Lambda functions and API Gateway
- Set up SNS topics for critical alerts

## Infrastructure

The Virtual Fashion Assistant utilizes several AWS resources defined in the `amplify/backend.ts` file:

### Lambda Functions:
- `dbApiFunction`: Handles database operations
- `aiApiFunction`: Processes AI requests using Amazon Bedrock
- `confyApiFunction`: Interfaces with the VTON API
- `sqsApiFunction`: Processes messages from SQS queue
- `imageApiFunction`: Handles image-related operations

### API Gateway:
- `vfaAPI`: REST API with endpoints for db, ai, confy, image, and callback operations

### DynamoDB:
- `UserRegistration`: Table for storing user data

### S3:
- Storage bucket for raw images, processed outputs, and garment images

### Cognito:
- User Pool with custom resource server and OAuth2 scopes
- User Pool Client for machine-to-machine authentication

### SQS:
- Queue for handling asynchronous processing requests

### IAM:
- Various roles and policies for Lambda functions and API Gateway integrations

### Pinpoint:
- In-app messaging configuration (defined but not detailed in the provided code)

Note: Specific resource names and ARNs are dynamically generated by Amplify and CDK.