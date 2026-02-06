// Publications functionality
function loadPublications() {
    fetch('/api/publications')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('publicationsContainer');
            container.innerHTML = '';
            data.forEach(pub => {
                const card = document.createElement('div');
                card.className = 'publication-card';
                card.innerHTML = `
                    <img src="${pub.image}" alt="${pub.title}">
                    <div class="publication-card-content">
                        <h3>${pub.title}</h3>
                        <p><strong>Author:</strong> ${pub.author}</p>
                        <p><strong>Category:</strong> ${pub.category}</p>
                        <p><strong>Status:</strong> ${pub.status}</p>
                        <p>${pub.abstract}</p>
                        <a href="${pub.imageUrl}" download class="btn btn-secondary">Download</a>
                    </div>
                `;
                container.appendChild(card);
            });
        })
        .catch(error => console.error('Error loading publications:', error));
}

// Load publications on page load
document.addEventListener('DOMContentLoaded', loadPublications);
