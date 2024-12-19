import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
    name: 'virtual_fashion_assistant',
    access: (allow) => ({
        'raw/*':[allow.authenticated.to(['read','write','delete'])],
        'processed/*':[allow.authenticated.to(['read','write','delete'])]
    }),
});