
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const {launchProfile} = require('./automation/launcher')
const bodyParser = require("body-parser");
const swaggerUi = require("swagger-ui-express");
const requestContextMiddleware = require('./middlewares/requestContextMiddleware')

const app = express();
const PORT = 8001;
const profileDir = path.join(process.cwd(), 'profiles');
const profileRoutes = require('./routes/profileRoutes');
const contentRoutes = require('./routes/contentRoutes');
const promptCategory = require('./routes/promptCategoryRoutes');
const promptInputRoutes = require('./routes/promptInputRoutes');
const taskRoutes = require('./routes/taskRoutes');

if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(requestContextMiddleware);


app.use(bodyParser.json());
app.use('/api/profiles', profileRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/promptCategory', promptCategory);
app.use('/api/prompts', promptInputRoutes);
app.use('/api/task', taskRoutes);

const swaggerOutputPath = path.resolve(process.cwd(), "swagger-output.json");

if (fs.existsSync(swaggerOutputPath)) {
  const swaggerDocument = require(swaggerOutputPath);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  console.warn("Swagger output file not found. Please generate it first.");
}

app.post('/api/launch', async (req, res) => {
  const { name, url, postContent } = req.body;

  try {
    await launchProfile({ name, url , postContent});

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Swagger is running on http://localhost:${PORT}/api-docs`);

});
