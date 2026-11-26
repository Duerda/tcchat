let slideAtual = 0;
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const slidesContainer = document.querySelector('.slides-container');
let intervaloCarrossel;

function atualizarCarrossel() {
    slidesContainer.style.transform = `translateX(-${slideAtual * 100}%)`;
    slides.forEach((slide, index) => {
        slide.classList.toggle('ativo', index === slideAtual);
    });
    dots.forEach((dot, index) => {
        dot.classList.toggle('ativo', index === slideAtual);
    });
}

function moverSlide(direcao) {
    const totalSlides = slides.length;
    slideAtual = (slideAtual + direcao + totalSlides) % totalSlides;
    atualizarCarrossel();
    reiniciarIntervalo();
}

function irParaSlide(index) {
    slideAtual = index;
    atualizarCarrossel();
    reiniciarIntervalo();
}

function reiniciarIntervalo() {
    clearInterval(intervaloCarrossel);
    intervaloCarrossel = setInterval(() => {
        moverSlide(1);
    }, 6000);
}

document.addEventListener('DOMContentLoaded', function() {
    if (slides.length > 0) {
        slides.forEach((s, i) => s.classList.toggle('ativo', i === 0));
        dots.forEach((d, i) => d.classList.toggle('ativo', i === 0));
        slidesContainer.style.transform = 'translateX(0)';
        reiniciarIntervalo();
        const carrossel = document.getElementById('carrossel');
        carrossel.addEventListener('mouseenter', () => clearInterval(intervaloCarrossel));
        carrossel.addEventListener('mouseleave', reiniciarIntervalo);
    }
});

function scrollParaInicio() {
    const header = document.querySelector('header');
    if (header) {
        header.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function scrollParaSobre() {
    const section = document.querySelector('.conceito');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function scrollParaIntegrantes() {
    const section = document.getElementById('carrossel-wrapper');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function scrollParaProgresso() {
    const section = document.getElementById('porcentagem');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

document.addEventListener('scroll', function() {
    const sections = [
        { id: 'header', btnId: 'btnInicio' },
        { id: 'conceito', btnId: 'btnSobre' },
        { id: 'carrossel-wrapper', btnId: 'btnIntegrantes' },
        { id: 'porcentagem', btnId: 'btnProgresso' }
    ];
    let currentSection = '';
    sections.forEach(s => {
        const el = document.querySelector(s.id === 'header' ? 'header' : '#' + s.id);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 100) {
                currentSection = s.btnId;
            }
        }
    });
    document.querySelectorAll('.btn-nav').forEach(btn => btn.classList.remove('ativo'));
    if (currentSection) {
        const btn = document.getElementById(currentSection);
        if (btn) btn.classList.add('ativo');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const elementos = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('ativo');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });
    elementos.forEach(el => observer.observe(el));
});