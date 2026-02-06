// Authentication functionality
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function openRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    if (event.target == loginModal) {
        loginModal.style.display = 'none';
    }
    if (event.target == registerModal) {
        registerModal.style.display = 'none';
    }
}

// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(loginForm);
            
            fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: loginForm.querySelector('input[type="text"]').value,
                    password: loginForm.querySelector('input[type="password"]').value,
                    loginType: loginForm.querySelector('select').value
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    window.location.href = data.redirect;
                } else {
                    alert('Login failed: ' + data.message);
                }
            })
            .catch(error => console.error('Login error:', error));
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fullName: registerForm.querySelector('input[placeholder="Full Name"]').value,
                    fatherName: registerForm.querySelector('input[placeholder="Father\'s Name"]').value,
                    rollNumber: registerForm.querySelector('input[placeholder="Roll Number"]').value,
                    phone: registerForm.querySelector('input[type="tel"]').value,
                    caste: registerForm.querySelectorAll('select')[1].value,
                    class: registerForm.querySelectorAll('select')[2].value,
                    password: registerForm.querySelector('input[type="password"]').value,
                    registerType: registerForm.querySelector('select')[0].value
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Registration successful! Please login.');
                    closeRegisterModal();
                } else {
                    alert('Registration failed: ' + data.message);
                }
            })
            .catch(error => console.error('Registration error:', error));
        });
    }
});

function goToRegister() {
    closeLoginModal();
    openRegisterModal();
}
