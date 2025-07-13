const fetch = require('node-fetch') // You might need to install: npm install node-fetch

async function createAdminViaAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'PureHarvest Admin',
        email: 'admin@pureharvest.com',
        password: 'SecureAdmin@2024',
        phone: '9876543210',
        role: 'admin',
        adminSecret: process.env.ADMIN_SECRET || 'your-super-secret-admin-key-2024'
      })
    })

    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Admin created successfully!')
      console.log('📧 Email: admin@pureharvest.com')
      console.log('🔑 Password: SecureAdmin@2024')
    } else {
      console.error('❌ Error:', data.error)
    }
  } catch (error) {
    console.error('❌ Network error:', error.message)
    console.log('Make sure your Next.js server is running (npm run dev)')
  }
}

createAdminViaAPI()