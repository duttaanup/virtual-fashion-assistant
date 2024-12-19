//@ts-nocheck
import { get } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth'

const API_NAME = "vfaAPI";
const DB_PATH = "db";
const AI_PATH = "ai";
const CONFY_PATH = "confy";

export const AppApi = {
    dbOperation: async () => {
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
            const response = await restOperation.response;
            console.log('GET call succeeded: ', response);
        } catch (error) {
            console.log('GET call failed: ', JSON.parse(error.response.body));
        }
    },

    aiOperation: async () => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken
            const restOperation = get({
                apiName: API_NAME,
                path: AI_PATH,
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