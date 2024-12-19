import { defineFunction } from "@aws-amplify/backend";

export const dbApiFunction = defineFunction({
  name: "db-api",
  entry: "./dbHandler.ts"
});

export const aiApiFunction = defineFunction({
    name: "ai-api",
    entry: "./aiHandler.ts",
    timeoutSeconds: 360
})

export const confyApiFunction = defineFunction({
    name: "confy-api",
    entry: "./confyHandler.ts"
})