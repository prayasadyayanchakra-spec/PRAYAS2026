// Super Admin specific functions
function loadNotifications() {
    fetch('/api/notifications', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        const tbody = document.getElementById('notificationsTableBody');
        tbody.innerHTML = '';
        data.forEach(notif => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${notif.date}</td>
                <td><a href="${notif.link}" target="_blank">${notif.link}</a></td>
                <td><button class="btn-reject" onclick="deleteNotification(${notif.id})">Delete</button></td>
            `;
            tbody.appendChild(row);
        });
    })
    .catch(error => console.error('Error loading notifications:', error));
}

function loadPublications() {
    fetch('/api/publications', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        const tbody = document.getElementById('publicationsTableBody');
        tbody.innerHTML = '';
        data.forEach(pub => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pub.title}</td>
                <td>${pub.author}</td>
                <td>${pub.category}</td>
                <td>${pub.status}</td>
                <td>
                    <button class="btn-approve" onclick="approvePublication(${pub.id})">Approve</button>
                    <button class="btn-reject" onclick="rejectPublication(${pub.id})">Reject</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    })
    .catch(error => console.error('Error loading publications:', error));
}

function loadBooks() {
    fetch('/api/books', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        const tbody = document.getElementById('booksTableBody');
        tbody.innerHTML = '';
        data.forEach(book => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>₹${book.price}</td>
                <td>${book.available ? 'Yes' : 'No'}</td>
                <td><button class="btn-reject" onclick="deleteBook(${book.id})">Delete</button></td>
            `;
            tbody.appendChild(row);
        });
    })
    .catch(error => console.error('Error loading books:', error));
}

function loadOrders() {
    fetch('/api/orders', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = '';
        data.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.orderId}</td>
                <td>${order.bookTitle}</td>
                <td>${order.userName}</td>
                <td>${order.status}</td>
                <td>
                    <select onchange="updateOrderStatus(${order.id}, this.value)">
                        <option value="${order.status}" selected>${order.status}</option>
                        <option value="approved">Approved</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                    </select>
                </td>
            `;
            tbody.appendChild(row);
        });
    })
    .catch(error => console.error('Error loading orders:', error));
}

function approvePublication(pubId) {
    fetch(`/api/publications/${pubId}/approve`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Publication approved!');
            loadPublications();
        }
    })
    .catch(error => console.error('Error approving publication:', error));
}

function rejectPublication(pubId) {
    fetch(`/api/publications/${pubId}/reject`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Publication rejected!');
            loadPublications();
        }
    })
    .catch(error => console.error('Error rejecting publication:', error));
}

function updateOrderStatus(orderId, status) {
    fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ status: status })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Order status updated!');
        }
    })
    .catch(error => console.error('Error updating order:', error));
}

// Load all data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStudents();
    loadPayments();
    loadNotifications();
    loadPublications();
    loadBooks();
    loadOrders();
});
