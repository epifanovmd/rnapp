import { generateApiService } from "@force-dev/utils/node";

generateApiService({
  output: `${__dirname}/../src/api/api-gen`,
  url: "http://localhost:8181/api-docs/swagger.json", // URL вашего Swagger JSON
})
  .then(() => {
    console.log("API успешно сгенерировано");
  })
  .catch(e => console.error(e));
