$(document).ready(function () {

    // ── Sentiment detection from response text ──────────────────────────────
    const SENTIMENTS = {
        positive: /\b(wonderful|great|excellent|happy|joy|love|beautiful|amazing|fantastic|glad|hope|bright|wisdom|insight|clarity|peace|harmony|flourish)\b/i,
        confident: /\b(certain|absolutely|indeed|clearly|undoubtedly|precisely|truth|know|understand|definite|sure|strong|power|resolve)\b/i,
        uncertain: /\b(perhaps|maybe|unsure|unclear|complex|difficult|unknown|mystery|wonder|ponder|question|doubt|ambiguous|paradox)\b/i,
        thinking:  /\b(consider|reflect|contemplate|analyze|process|reason|logic|deduce|infer|evaluate|weigh|deliberate)\b/i,
    };

    function detectSentiment(text) {
        for (const [mood, re] of Object.entries(SENTIMENTS)) {
            if (re.test(text)) return mood;
        }
        return 'neutral';
    }

    // ── Aura colors per mood ────────────────────────────────────────────────
    const MOOD_AURA = {
        neutral:   { color: '0,229,255',   pulse: 2.5, radius: 0.55 },
        positive:  { color: '0,230,118',   pulse: 1.8, radius: 0.65 },
        confident: { color: '124,77,255',  pulse: 1.4, radius: 0.70 },
        uncertain: { color: '255,171,0',   pulse: 3.2, radius: 0.50 },
        thinking:  { color: '0,176,255',   pulse: 2.0, radius: 0.58 },
    };

    let currentMood = 'neutral';
    let targetMood  = 'neutral';
    let moodLerp    = 1;

    // ── Background particle canvas ──────────────────────────────────────────
    const bgCanvas = document.getElementById('bg-canvas');
    const bgCtx    = bgCanvas.getContext('2d');

    function resizeBg() {
        bgCanvas.width  = window.innerWidth;
        bgCanvas.height = window.innerHeight;
    }
    resizeBg();
    window.addEventListener('resize', resizeBg);

    const STAR_COUNT = 120;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.2 + 0.2,
        speed: Math.random() * 0.15 + 0.03,
        alpha: Math.random() * 0.6 + 0.2,
    }));

    function drawBg() {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        const aura = MOOD_AURA[currentMood];
        stars.forEach(s => {
            s.y -= s.speed;
            if (s.y < 0) { s.y = bgCanvas.height; s.x = Math.random() * bgCanvas.width; }
            bgCtx.beginPath();
            bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            bgCtx.fillStyle = `rgba(${aura.color},${s.alpha})`;
            bgCtx.fill();
        });
    }

    // ── Aura canvas ─────────────────────────────────────────────────────────
    const auraCanvas = document.getElementById('aura-canvas');
    const auraCtx    = auraCanvas.getContext('2d');
    let auraT = 0;

    function resizeAura() {
        const wrap = auraCanvas.parentElement;
        auraCanvas.width  = wrap.offsetWidth  + 80;
        auraCanvas.height = wrap.offsetHeight + 80;
    }
    resizeAura();
    window.addEventListener('resize', resizeAura);

    function drawAura() {
        auraCtx.clearRect(0, 0, auraCanvas.width, auraCanvas.height);
        const aura = MOOD_AURA[currentMood];
        const cx = auraCanvas.width  / 2;
        const cy = auraCanvas.height / 2;
        const pulse = Math.sin(auraT * aura.pulse) * 0.06 + 1;
        const r = Math.min(auraCanvas.width, auraCanvas.height) * aura.radius * pulse;

        const grad = auraCtx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
        grad.addColorStop(0,   `rgba(${aura.color},0.18)`);
        grad.addColorStop(0.5, `rgba(${aura.color},0.07)`);
        grad.addColorStop(1,   `rgba(${aura.color},0)`);

        auraCtx.beginPath();
        auraCtx.arc(cx, cy, r, 0, Math.PI * 2);
        auraCtx.fillStyle = grad;
        auraCtx.fill();

        // Outer ring
        auraCtx.beginPath();
        auraCtx.arc(cx, cy, r * 0.98, 0, Math.PI * 2);
        auraCtx.strokeStyle = `rgba(${aura.color},${0.12 + Math.sin(auraT * aura.pulse) * 0.06})`;
        auraCtx.lineWidth = 1.5;
        auraCtx.stroke();
    }

    // ── Apply mood to avatar image ───────────────────────────────────────────
    const hudStatus = document.getElementById('hud-status');

    const STATUS_TEXT = {
        neutral:   'AWAITING INPUT',
        positive:  'RESONATING',
        confident: 'ASSERTING',
        uncertain: 'CONTEMPLATING',
        thinking:  'PROCESSING',
    };

    function applyMood(mood) {
        document.querySelectorAll('.sage-img').forEach(img => {
            img.classList.toggle('active', img.dataset.mood === mood);
        });
        hudStatus.textContent = STATUS_TEXT[mood] || 'AWAITING INPUT';
        const aura = MOOD_AURA[mood];
        hudStatus.style.color = `rgba(${aura.color},0.7)`;
    }

    function setMood(mood) {
        if (mood === targetMood) return;
        targetMood = mood;
        applyMood(mood);
        // Snap immediately for responsiveness; aura lerps via auraT
        currentMood = mood;
    }

    // ── Main animation loop ──────────────────────────────────────────────────
    function loop() {
        auraT += 0.016;
        drawBg();
        drawAura();
        requestAnimationFrame(loop);
    }
    loop();

    // ── Chat logic ───────────────────────────────────────────────────────────
    function appendMsg(text, cls) {
        const div = $('<div class="chat-message"></div>').addClass(cls).text(text);
        $('#chat-messages').append(div);
        $('#chat-messages').scrollTop($('#chat-messages')[0].scrollHeight);
        return div;
    }

    function sendMessage() {
        const text = $('#user-input').val().trim();
        if (!text) return;
        $('#user-input').val('');

        appendMsg(text, 'user-message');
        setMood('thinking');

        const typingDiv = appendMsg('', 'sage-message typing');

        $.get('/get', { msg: text })
            .done(function (response) {
                typingDiv.removeClass('typing').text(response);
                const mood = detectSentiment(response);
                setMood(mood);
                // Reset to neutral after 6 s
                setTimeout(() => setMood('neutral'), 6000);
            })
            .fail(function () {
                typingDiv.removeClass('typing').text('I am unable to respond right now.');
                setMood('uncertain');
                setTimeout(() => setMood('neutral'), 4000);
            });
    }

    $('#send-btn').on('click', sendMessage);
    $('#user-input').on('keypress', function (e) {
        if (e.which === 13) sendMessage();
    });
});
