// Carousel functionality
let currentSlide = 0;

function changeSlide(direction) {
    const slides = document.querySelectorAll('.carousel-image');
    slides[currentSlide].style.display = 'none';
    
    currentSlide += direction;
    if (currentSlide >= slides.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = slides.length - 1;
    
    slides[currentSlide].style.display = 'block';
}

// Auto-change slides every 5 seconds
setInterval(() => {
    changeSlide(1);
}, 5000);
