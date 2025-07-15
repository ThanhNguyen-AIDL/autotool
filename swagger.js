const swaggerAutogen = require("swagger-autogen")();
const path = require("path");

// Resolve absolute paths to ensure consistency from the project root or file location.
const outputFile = path.resolve(__dirname, "swagger-output.json");

// Adjust the path to your server file or any files containing endpoints.
// For example, if your server file is in the same folder, use __dirname.
const endpointsFiles = [path.resolve(__dirname, "server.js")];

const doc = {
  info: {
    title: "API Documentation",
    version: "1.0.0",
  },
  host: "localhost:8001", // Change this for production
  schemes: ["http"], // Use "https" if needed
  securityDefinitions: {
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header', // can be 'header', 'query' or 'cookie'
      name: 'X-API-KEY', // name of the header, query parameter or cookie
      description: 'Some description...'
    }
  },
  security:{apiKeyAuth: []}
  
};


swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log("Swagger docs generated at:", outputFile);
  // Optionally start your server automatically:
  // require("./server.js");
});
