// Schools page functionality
function loadSchoolFeeStructure() {
    const schoolSelect = document.getElementById('schoolSelect');
    const selectedSchool = schoolSelect.value;
    
    if (!selectedSchool) return;
    
    document.getElementById('schoolName').textContent = selectedSchool;
    
    fetch(`/api/fee-structure?school=${selectedSchool}`)
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('feeTableBody');
            tbody.innerHTML = '';
            data.forEach(fee => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${fee.class}</td>
                    <td>₹${fee.monthlyFee}</td>
                    <td>₹${fee.quarterlyFee}</td>
                    <td>₹${fee.yearlyFee}</td>
                    <td><button class="btn btn-primary" onclick="openPaymentForm('${fee.class}', ${fee.monthlyFee})">PAY</button></td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error loading fee structure:', error));
}

function openPaymentForm(feeClass, amount) {
    const modal = document.getElementById('paymentModal');
    modal.style.display = 'block';
    
    // Get user data from localStorage or API
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        document.getElementById('payName').value = userData.name;
        document.getElementById('payRollNo').value = userData.rollNumber;
        document.getElementById('paySchoolName').value = userData.schoolName;
        document.getElementById('payFatherName').value = userData.fatherName;
        
        validatePaymentForm();
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

function validatePaymentForm() {
    const name = document.getElementById('payName').value;
    const rollNo = document.getElementById('payRollNo').value;
    const schoolName = document.getElementById('paySchoolName').value;
    const fatherName = document.getElementById('payFatherName').value;
    const payButton = document.getElementById('payButton');
    
    if (name && rollNo && schoolName && fatherName) {
        payButton.disabled = false;
        document.getElementById('matchStatus').textContent = '✓ All details matched!';
        document.getElementById('matchStatus').style.color = 'green';
    } else {
        payButton.disabled = true;
        document.getElementById('matchStatus').textContent = 'Please fill all fields';
        document.getElementById('matchStatus').style.color = 'red';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('paymentModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Load schools on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize
});
