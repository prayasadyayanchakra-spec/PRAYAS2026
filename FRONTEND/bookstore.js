// Bookstore functionality
function loadBooks() {
    fetch('/api/books')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('booksContainer');
            container.innerHTML = '';
            data.forEach(book => {
                const card = document.createElement('div');
                card.className = 'book-card';
                card.onclick = () => showBookDetails(book);
                card.innerHTML = `
                    <img src="${book.coverImage}" alt="${book.title}">
                    <div class="book-card-content">
                        <h3>${book.title}</h3>
                        <p><strong>Author:</strong> ${book.author}</p>
                        <p><strong>Price:</strong> ₹${book.price}</p>
                        <p><strong>Available:</strong> ${book.available ? 'Yes' : 'No'}</p>
                    </div>
                `;
                container.appendChild(card);
            });
        })
        .catch(error => console.error('Error loading books:', error));
}

function showBookDetails(book) {
    const modal = document.getElementById('bookModal');
    document.getElementById('bookCover').src = book.coverImage;
    document.getElementById('bookTitle').textContent = book.title;
    document.getElementById('bookAuthor').textContent = book.author;
    document.getElementById('bookPrice').textContent = '₹' + book.price;
    document.getElementById('bookCategory').textContent = book.category;
    document.getElementById('bookAvailable').textContent = book.available ? 'Yes' : 'No';
    document.getElementById('bookDescription').textContent = book.description;
    document.getElementById('bookPdfLink').href = book.pdfUrl;
    document.getElementById('bookModal').dataset.bookId = book.id;
    
    modal.style.display = 'block';
}

function closeBookModal() {
    document.getElementById('bookModal').style.display = 'none';
}

function buyNow() {
    const bookId = document.getElementById('bookModal').dataset.bookId;
    
    fetch('/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ bookId: bookId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Book ordered successfully!');
            closeBookModal();
        } else {
            alert('Failed to order book: ' + data.message);
        }
    })
    .catch(error => console.error('Error ordering book:', error));
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('bookModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Load books on page load
document.addEventListener('DOMContentLoaded', loadBooks);
