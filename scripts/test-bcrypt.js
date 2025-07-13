// scripts/test-bcrypt.js
const bcrypt = require('bcryptjs')

async function testBcrypt() {
  const password = 'SecureAdmin@2024'
  
  console.log('Testing bcrypt...')
  console.log('Original password:', password)
  
  // Hash the password
  const hash = await bcrypt.hash(password, 12)
  console.log('Generated hash:', hash)
  
  // Compare the password
  const isMatch = await bcrypt.compare(password, hash)
  console.log('Comparison result:', isMatch)
  
  // Test with wrong password
  const wrongMatch = await bcrypt.compare('WrongPassword', hash)
  console.log('Wrong password result:', wrongMatch)
}

testBcrypt()