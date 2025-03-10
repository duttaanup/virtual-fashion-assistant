import ReactDOM from "react-dom/client";
import { Amplify } from "aws-amplify";
import * as Analytics from "@aws-amplify/analytics";
import { initializeInAppMessaging } from 'aws-amplify/in-app-messaging';
import App from "./App.tsx";
import "@cloudscape-design/global-styles/index.css"
import "./index.css";
import '@aws-amplify/ui-react/styles.css';

import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);

const existingConfig = Amplify.getConfig();
Amplify.configure({
  ...existingConfig,
  API: {
    ...existingConfig.API,
    REST: outputs.custom.API,
  },
});

Analytics.enable();

initializeInAppMessaging();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <App />
);
