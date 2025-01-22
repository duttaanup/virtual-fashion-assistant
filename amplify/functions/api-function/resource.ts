import { defineFunction } from "@aws-amplify/backend";

export const dbApiFunction = defineFunction({
    name: "db-api",
    entry: "./dbHandler.ts",
    timeoutSeconds: 60,
});

export const aiApiFunction = defineFunction({
    name: "ai-api",
    entry: "./aiHandler.ts",
    timeoutSeconds: 360,
})

export const confyApiFunction = defineFunction({
    name: "confy-api",
    entry: "./confyHandler.ts",
    timeoutSeconds: 60,
})

export const sqsApiFunction = defineFunction({
    name: "sqs-api",
    entry: "./sqsHandler.ts",
    timeoutSeconds: 60,
})

export const imageApiFunction = defineFunction({
    name: "image-api",
    entry: "./imageHandler.ts",
    timeoutSeconds: 60,
})