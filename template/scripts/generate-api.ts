import * as path from "path";
import { generateApi } from "swagger-typescript-api";

generateApi({
  url: "http://147.45.245.104:8181/api-docs/swagger.json",
  output: path.resolve(__dirname, "../src/api/api-gen"),
  httpClientType: "axios",
  templates: path.resolve(__dirname, "./api-templates"),
  modular: true,
  extractRequestBody: true,
  extractRequestParams: true,
  // Don't clean output — http-client.ts is maintained manually
  cleanOutput: false,
})
  .then(() => {
    console.log("API generated successfully");
  })
  .catch(e => console.error(e));
