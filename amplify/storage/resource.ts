import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
    name: 'virtual_fashion_assistant',
    access: (allow) => ({
        'raw/*':[allow.authenticated.to(['read','write','delete'])],
        'output/*':[allow.authenticated.to(['read','write','delete'])],
        'garments/*':[allow.authenticated.to(['read'])]
    }),
});