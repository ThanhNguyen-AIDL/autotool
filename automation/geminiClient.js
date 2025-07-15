require('dotenv').config();
const axios = require('axios');

async function generateGeminiContent(inputText) {
  try {
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const apiKey = process.env.GEMINI_API_KEY;

    const response = await axios.post(`${endpoint}?key=${apiKey}`, {
      contents: [
        {
          parts: [
            {
              text: inputText
            }
          ]
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const candidates = response.data.candidates || [];
    const outputText = candidates[0]?.content?.parts?.[0]?.text || '';

    // console.log('Gemini Response:\n', outputText);
    return outputText;

  } catch (error) {
    console.error('❌ Error calling Gemini API:', error.response?.data || error.message);
    return ""
  }
}

module.exports={
    generateGeminiContent
}