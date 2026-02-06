// Admin panel functions
function showSection(sectionId) {
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => section.classList.remove('active'));
    
    const links = document.querySelectorAll('.sidebar-menu a');
    links.forEach(link => link.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active');
    event.target.classList.add('active');
}

function loadStudents(schoolName = null) {
    let url = '/api/students';
    if (schoolName) {
        url += `?school=${schoolName}`;
    }
    
    fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        const tbody = document.getElementById('studentsTableBody');
        tbody.innerHTML = '';
        data.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.name}</td>
                <td>${student.rollNumber}</td>
                <td>${student.class}</td>
                <td>${student.caste}</td>
                <td>${student.schoolName || student.phone}</td>
            `;
            tbody.appendChild(row);
        });
    })
    .catch(error => console.error('Error loading students:', error));
}

function loadPayments(schoolName = null) {
    let url = '/api/payments';
    if (schoolName) {
        url += `?school=${schoolName}`;
    }
    
    fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        const tbody = document.getElementById('paymentsTableBody');
        tbody.innerHTML = '';
        data.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.name}</td>
                <td>${payment.rollNumber}</td>
                <td>${payment.paymentId}</td>
                <td>${payment.class}</td>
                <td>₹${payment.amount}</td>
                <td>${payment.schoolName || payment.date}</td>
                <td>${payment.date}</td>
            `;
            tbody.appendChild(row);
        });
    })
    .catch(error => console.error('Error loading payments:', error));
}

function filterStudents() {
    // Implement filter logic based on input values
    const nameFilter = document.getElementById('nameFilter').value;
    const rollFilter = document.getElementById('rollFilter').value;
    loadStudents();
}

function filterPayments() {
    // Implement filter logic
    loadPayments();
}

function updateAmount() {
    // Get amount from fee structure based on class and fee type
    const feeType = document.getElementById('feeType').value;
    const paymentClass = document.getElementById('paymentClass').value;
    
    if (feeType && paymentClass) {
        fetch(`/api/fee-structure?class=${paymentClass}&type=${feeType}`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                document.getElementById('amount').value = data[0].amount;
            }
        })
        .catch(error => console.error('Error fetching amount:', error));
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}

// Load initial data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStudents();
    loadPayments();
});
