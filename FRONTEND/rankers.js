// Rankers functionality
function loadRankers(year = null) {
    let url = '/api/rankers';
    if (year) {
        url += `?year=${year}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('rankersContainer');
            container.innerHTML = '';
            data.forEach(ranker => {
                const card = document.createElement('div');
                card.className = 'ranker-card';
                card.innerHTML = `
                    <img src="${ranker.image}" alt="${ranker.name}">
                    <div class="ranker-card-content">
                        <h3>${ranker.name}</h3>
                        <p><strong>Rank:</strong> ${ranker.rank}</p>
                        <p><strong>School:</strong> ${ranker.schoolName}</p>
                        <p><strong>Class:</strong> ${ranker.class}</p>
                        <p><strong>Year:</strong> ${ranker.year}</p>
                    </div>
                `;
                container.appendChild(card);
            });
        })
        .catch(error => console.error('Error loading rankers:', error));
}

function filterRankersByYear() {
    const year = document.getElementById('yearSelect').value;
    loadRankers(year || null);
}

// Load rankers on page load
document.addEventListener('DOMContentLoaded', () => loadRankers());
