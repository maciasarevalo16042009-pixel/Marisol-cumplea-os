document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('galaxyCanvas');
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Adaptabilidad ante redimensiones o giros de pantalla en Android
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initGalaxy();
    });

    // Estado del Sistema Galáctico e Interactividad (Mouse y Táctil con Inercia)
    const stars = [];
    const galaxyParticles = [];
    const heartParticles = [];
    const starRainParticles = [];

    let galaxyRotation = 0;
    let isSurpriseActive = false;
    let coreGlowIntensity = 1;
    let heartScale = 1;
    let heartPulseDir = 0.003;

    // Variables de control para arrastre interactivo e inercia
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let userRotationOffset = 0;
    let userTiltOffset = 0;
    let velocityX = 0;
    let velocityY = 0;

    // --- Control de Eventos de Mouse y Táctiles (Android / Escritorio) ---
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        velocityX = 0;
        velocityY = 0;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        userRotationOffset += dx * 0.004;
        userTiltOffset = Math.max(-0.35, Math.min(0.35, userTiltOffset + dy * 0.002));

        velocityX = dx * 0.004;
        velocityY = dy * 0.002;

        startX = e.clientX;
        startY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Eventos táctiles para móviles Android
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            velocityX = 0;
            velocityY = 0;
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        e.preventDefault(); // Evita desplazamientos accidentales de la página en Android

        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;

        userRotationOffset += dx * 0.004;
        userTiltOffset = Math.max(-0.35, Math.min(0.35, userTiltOffset + dy * 0.002));

        velocityX = dx * 0.004;
        velocityY = dy * 0.002;

        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: false });

    window.addEventListener('touchend', () => {
        isDragging = false;
    });


    // 1. Fondo de Estrellas Fijas del Espacio Profundo
    const NUM_BACKGROUND_STARS = Math.min(Math.floor((width * height) / 1400), 450);
    for (let i = 0; i < NUM_BACKGROUND_STARS; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.5 + 0.3,
            alpha: Math.random() * 0.8 + 0.2,
            twinkleSpeed: Math.random() * 0.02 + 0.005
        });
    }

    // 2. Galaxia Espiral de Alta Densidad y Volumen (Brazos abultados, polvo cósmico y nebulosas)
    class SpiralParticle {
        constructor() {
            this.reset(true);
        }

        reset(randomDist = false) {
            this.armIndex = Math.floor(Math.random() * 4); // 4 brazos espirales principales
            // Distribución concentrada hacia el núcleo con extensión gradual
            this.distanceFromCenter = randomDist ? Math.pow(Math.random(), 1.5) * (width * 0.48) : Math.random() * 15 + 2;
            this.angle = this.armIndex * ((Math.PI * 2) / 4) + (this.distanceFromCenter * 0.0032);
            
            this.orbitSpeed = (0.0007 + (1 / (this.distanceFromCenter + 40)) * 0.045);
            
            // Variación entre estrellas brillantes y partículas de polvo/nebulosa difusas
            this.isDust = Math.random() < 0.35; 
            this.size = this.isDust ? (Math.random() * 3.5 + 1.5) : (Math.random() * 2.2 + 0.5);
            
            // Paleta cósmica mejorada y densa
            if (this.distanceFromCenter < 70) {
                this.color = Math.random() < 0.65 ? '#ffffff' : '#ffefd5';
            } else {
                const colors = ['#ff69b4', '#da70d6', '#ba55d3', '#ffffff', '#ffb6c1', '#9370db', '#ff1493', '#dda0dd'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }
            
            this.alpha = this.isDust ? (Math.random() * 0.35 + 0.1) : (Math.random() * 0.8 + 0.2);
            
            // Grosor y volumen tridimensional de cada brazo espiral
            const thicknessFactor = 18 + this.distanceFromCenter * 0.08;
            this.spreadOffset = (Math.random() - 0.5) * thicknessFactor;
            this.zOffset = (Math.random() - 0.5) * 50;
        }

        update() {
            this.distanceFromCenter += 0.07;
            this.angle += this.orbitSpeed * 0.6;

            if (this.distanceFromCenter > width * 0.52) {
                this.reset(false);
                this.distanceFromCenter = 5;
            }
        }

        draw() {
            const centerX = width / 2;
            const centerY = height / 2;

            // Integración de rotación base + rotación interactiva del usuario
            const currentAngle = this.angle + galaxyRotation + userRotationOffset;
            
            // Cálculo del grosor transversal (perpendicular al brazo para dar volumen real)
            const perpAngle = currentAngle + Math.PI / 2;
            const perpX = Math.cos(perpAngle) * this.spreadOffset;
            const perpY = Math.sin(perpAngle) * this.spreadOffset * 0.42;

            const tilt = 0.42 + userTiltOffset;
            const x = centerX + Math.cos(currentAngle) * this.distanceFromCenter + perpX;
            const y = centerY + Math.sin(currentAngle) * (this.distanceFromCenter * tilt) + perpY;

            ctx.save();
            ctx.globalAlpha = this.alpha * (isSurpriseActive ? 1.3 : 1);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = this.isDust ? 8 : (this.distanceFromCenter < 90 ? 12 : 3);
            
            ctx.beginPath();
            ctx.arc(x, y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function initGalaxy() {
        galaxyParticles.length = 0;
        // Alta densidad de partículas para lograr brazos voluminosos y complejos
        const totalGalaxyParticles = Math.min(Math.floor(width * 3.2), 2400);
        for (let i = 0; i < totalGalaxyParticles; i++) {
            galaxyParticles.push(new SpiralParticle());
        }
    }
    initGalaxy();

    // 3. Corazón Central Luminoso (Ecuación Paramétrica)
    function getHeartCoords(t) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        return { x, y };
    }

    class HeartParticle {
        constructor(t) {
            this.t = t;
            const pos = getHeartCoords(t);
            this.baseX = pos.x;
            this.baseY = pos.y;
            this.size = Math.random() * 2 + 1;
            this.color = Math.random() < 0.4 ? '#ffffff' : '#ff2a85';
            this.floatOffset = Math.random() * 100;
        }

        draw(scale) {
            const centerX = width / 2;
            const centerY = height / 2;
            const factor = (width > 600 ? 13 : 8.5) * scale;

            // Movimiento flotante sutil independiente
            const floatX = Math.sin(Date.now() * 0.002 + this.floatOffset) * 2;
            const floatY = Math.cos(Date.now() * 0.002 + this.floatOffset) * 2;

            const x = centerX + (this.baseX * factor) + floatX;
            const y = centerY + (this.baseY * factor) + floatY;

            ctx.save();
            ctx.globalAlpha = 0.95;
            ctx.fillStyle = this.color;
            ctx.shadowColor = '#ff1493';
            ctx.shadowBlur = 15 * coreGlowIntensity;
            ctx.beginPath();
            ctx.arc(x, y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function initHeart() {
        heartParticles.length = 0;
        const points = 240;
        for (let i = 0; i < points; i++) {
            const t = (i / points) * Math.PI * 2;
            heartParticles.push(new HeartParticle(t));
        }
    }
    initHeart();

    // 4. Lluvia de Estrellas (Activada por el botón de sorpresa)
    class StarRainParticle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * (width + 200) - 100;
            this.y = -30;
            this.length = Math.random() * 70 + 20;
            this.speed = Math.random() * 7 + 3;
            this.size = Math.random() * 2 + 1;
            this.color = Math.random() < 0.5 ? '#ffffff' : '#ffb6c1';
            this.alpha = Math.random() * 0.8 + 0.2;
        }

        update() {
            this.y += this.speed;
            this.x += this.speed * 0.3; // Inclinación natural
            if (this.y > height + 50) {
                this.reset();
            }
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.speed * 0.3, this.y - this.length);
            ctx.stroke();
            ctx.restore();
        }
    }

    function triggerStarRain() {
        if (starRainParticles.length === 0) {
            for (let i = 0; i < 110; i++) {
                starRainParticles.push(new StarRainParticle());
            }
        }
    }

    // Bucle Principal de Animación (60 FPS fluidos con inercia aplicada)
    function animate() {
        // Limpiar lienzo con efecto de rastro cósmico tenue
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, width, height);

        // Aplicar inercia suave al soltar el arrastre de la galaxia
        if (!isDragging) {
            userRotationOffset += velocityX;
            velocityX *= 0.92; // Fricción / amortiguación gradual
            velocityY *= 0.92;
        }

        // 1. Dibujar estrellas de fondo parpadeantes
        stars.forEach(s => {
            s.alpha += s.twinkleSpeed;
            if (s.alpha > 1 || s.alpha < 0.2) s.twinkleSpeed = -s.twinkleSpeed;
            ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        });

        // Rotación natural continua de la galaxia espiral
        galaxyRotation += 0.0008;

        // 2. Renderizar Núcleo Galáctico Resplandeciente
        const centerX = width / 2;
        const centerY = height / 2;
        const coreGradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, width * 0.3);
        coreGradient.addColorStop(0, `rgba(255, 240, 245, ${0.4 * coreGlowIntensity})`);
        coreGradient.addColorStop(0.2, `rgba(218, 112, 214, ${0.3 * coreGlowIntensity})`);
        coreGradient.addColorStop(0.5, `rgba(138, 43, 226, ${0.12 * coreGlowIntensity})`);
        coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, width * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 3. Renderizar brazos espirales de alta densidad y volumen
        galaxyParticles.forEach(p => {
            p.update();
            p.draw();
        });

        // 4. Animación de latido del corazón central
        heartScale += heartPulseDir;
        if (heartScale > 1.08 || heartScale < 0.96) {
            heartPulseDir = -heartPulseDir;
        }

        if (isSurpriseActive && coreGlowIntensity < 2.2) {
            coreGlowIntensity += 0.015;
        }

        // 5. Renderizar Corazón Flotante Delante del Núcleo (estáticamente centrado)
        heartParticles.forEach(hp => hp.draw(heartScale));

        // 6. Lluvia de estrellas si está activa
        if (isSurpriseActive) {
            starRainParticles.forEach(sr => {
                sr.update();
                sr.draw();
            });
        }

        requestAnimationFrame(animate);
    }
    animate();

    // Interactividad: Evento del Botón de Sorpresa
    const surpriseBtn = document.getElementById('surpriseBtn');
    const surpriseModal = document.getElementById('surpriseModal');
    const closeModal = document.getElementById('closeModal');

    surpriseBtn.addEventListener('click', () => {
        isSurpriseActive = true;
        triggerStarRain();
        surpriseModal.classList.remove('hidden');
    });

    closeModal.addEventListener('click', () => {
        surpriseModal.classList.add('hidden');
    });

    surpriseModal.addEventListener('click', (e) => {
        if (e.target === surpriseModal) {
            surpriseModal.classList.add('hidden');
        }
    });

    // Reacción táctil / clic en el corazón (latido extra y brillo)
    window.addEventListener('click', (e) => {
        const dx = e.clientX - width / 2;
        const dy = e.clientY - height / 2;
        if (Math.sqrt(dx * dx + dy * dy) < 120) {
            heartScale = 1.2;
            coreGlowIntensity = Math.min(coreGlowIntensity + 0.4, 2.5);
        }
    });
});