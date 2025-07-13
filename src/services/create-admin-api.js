// const fetch = require('node-fetch') // You might need to install: npm install node-fetch

async function createAdminViaAPI() {
  try {
    console.log('🚀 Creating admin user via API...')
    
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

    console.log('📡 Response status:', response.status)
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Admin created successfully!')
      console.log('📧 Email: admin@pureharvest.com')
      console.log('🔑 Password: SecureAdmin@2024')
      console.log('👤 Role: admin')
      console.log('📱 Phone: 9876543210')
    } else {
      console.error('❌ Error:', data.error)
      console.log('📊 Response data:', data)
    }
  } catch (error) {
    console.error('❌ Network error:', error.message)
    console.log('💡 Make sure your Next.js server is running (npm run dev)')
    console.log('💡 Check if http://localhost:3000 is accessible')
  }
}

createAdminViaAPI()