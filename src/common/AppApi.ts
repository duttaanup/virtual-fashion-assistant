//@ts-nocheck
import { get, post } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth'

const API_NAME = "vfaAPI";
const DB_PATH = "db";
const AI_PATH = "ai";
const CONFY_PATH = "confy";

export const AppApi = {
    dbGetOperation: async () => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken  
            const restOperation = get({
                apiName: API_NAME,
                path: DB_PATH,
                options: {
                    headers: {
                        Authorization: token
                    }
                }
            });
            const { body } = await restOperation.response;
            const response = await body.json();
            return response;
        } catch (error) {
            console.log('GET call failed: ', error);
        }
    },

    dbPostOperation: async (payload) => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken  
            const restOperation = post({
                apiName: API_NAME,
                path: DB_PATH,
                options: {
                    headers: {
                        Authorization: token
                    },
                    body : payload
                }
            });
            const { body } = await restOperation.response;
            const response = await body.json();
            return response;
        } catch (error) {
            console.log('GET call failed: ', error);
        }
    },

    aiOperation: async (imageData) => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken
            const restOperation = post({
                apiName: API_NAME,
                path: AI_PATH,
                options: {
                    headers: {
                        Authorization: token
                    },
                    body: { "image": imageData.replace("data:image/png;base64,","") },
                }
            });
            const { body } = await restOperation.response;
            const response = await body.json();
            return response;
        } catch (error) {
            console.log('GET call failed: ', JSON.parse(error.response.body));
        }
    },

    confyOperation: async () => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken
            const restOperation = get({
                apiName: API_NAME,
                path: CONFY_PATH,
                options: {
                    headers: {
                        Authorization: token
                    }
                }
            });
            const response = await restOperation.response;
            console.log('GET call succeeded: ', response);
        } catch (error) {
            console.log('GET call failed: ', JSON.parse(error.response.body));
        }
    }

}