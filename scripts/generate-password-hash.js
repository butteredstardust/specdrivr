const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'demo';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Bcrypt hash (10 salt rounds):');
  console.log(hash);
  console.log('\nUse this hash in your SQL seed file for all demo users.');
}

generateHash().catch(console.error);
