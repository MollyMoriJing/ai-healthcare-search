const { Configuration, OpenAIApi } = require('openai');

const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

async function interpretSymptoms(symptoms) {
  const prompt = `User describes: ${symptoms}. Which medical specialty should they consult?`;
  const res = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });
  return res.data.choices[0].message.content.trim();
}

module.exports = { interpretSymptoms };