document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: email, password: password })
                });
                const data = await response.json();
                
                if (data.success) {
                    localStorage.setItem('adminToken', data.token);
                    window.location.href = '/dashboard';
                } else {
                    alert('Invalid credentials');
                }
            } catch (error) {
                console.error('Error logging in:', error);
                alert('Error connecting to server');
            }
        });
    }
    const togglePasswordBtn = document.getElementById('toggle-password');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            const icon = togglePasswordBtn.querySelector('span');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.textContent = 'visibility_off';
            } else {
                passwordInput.type = 'password';
                icon.textContent = 'visibility';
            }
        });
    }
});
