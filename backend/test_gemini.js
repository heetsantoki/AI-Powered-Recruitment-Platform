require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const modelsToTest = [
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-pro'
];

async function findQuotaAvailableModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('❌ GEMINI_API_KEY is not defined in .env.');
    return;
  }

  const genAI = new GoogleGenerativeAI(key);

  console.log('--- Testing Alternate Gemini Models for Quota Availability ---');
  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing model: "${modelName}"...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const response = await model.generateContent('Say "OK"');
      const text = response.response.text().trim();
      console.log(`✅ SUCCESS with "${modelName}"! Response: "${text}"`);
      console.log(`💡 You can switch to "${modelName}" to bypass the 2.5 rate limit!`);
    } catch (err) {
      console.log(`❌ FAILED with "${modelName}": ${err.message.split('\n')[0]}`);
    }
  }
  console.log('\nFinished testing alternate models.\n');
}

findQuotaAvailableModel();
