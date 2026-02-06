// Notifications functionality
function loadNotifications() {
    fetch('/api/notifications')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('notificationBody');
            tbody.innerHTML = '';
            data.forEach(notification => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${notification.date}</td>
                    <td><a href="${notification.link}" target="_blank">View</a></td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error loading notifications:', error));
}

// Load notifications on page load
document.addEventListener('DOMContentLoaded', loadNotifications);
