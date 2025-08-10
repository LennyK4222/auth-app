// Quick script to promote a user to admin for testing
// Run this in browser console when logged in

fetch('/api/admin/promote', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'your-email@example.com' // Replace with your actual email
  })
})
.then(response => response.json())
.then(data => console.log('Promotion result:', data))
.catch(error => console.error('Error:', error));
