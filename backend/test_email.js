const emailValidator = require('deep-email-validator');

async function test() {
  const res = await emailValidator.validate('abs@gmail.com');
  console.log('abs@gmail.com:', res.valid, res.reason, res.validators.smtp);
  
  const res2 = await emailValidator.validate('antigravity_test_123456789@gmail.com');
  console.log('antigravity_test_123456789@gmail.com:', res2.valid, res2.reason, res2.validators.smtp);

  const res3 = await emailValidator.validate('heetsantoki@gmail.com');
  console.log('heetsantoki@gmail.com:', res3.valid, res3.reason, res3.validators.smtp);
}

test();
