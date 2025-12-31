document.addEventListener('DOMContentLoaded', () => {
    // --- Data Loading ---
    const dataEl = document.getElementById('site-data');
    if (!dataEl) return;

    // Parse data safely
    let photos = [], letters = [], surprises = [];
    try {
        photos = JSON.parse(dataEl.dataset.photos || '[]');
        letters = JSON.parse(dataEl.dataset.letters || '[]');
        surprises = JSON.parse(dataEl.dataset.surprises || '[]');
    } catch (e) {
        console.error("Error parsing data", e);
    }

    // --- Modal Logic ---
    const modal = document.getElementById('modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.querySelector('.modal-close');
    const photoItems = document.querySelectorAll('.photo-item');

    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalCaption = document.getElementById('modal-caption');
    const modalDate = document.getElementById('modal-date');
    const modalPlace = document.getElementById('modal-place');

    function openModal(id) {
        const photo = photos.find(p => p.id == id);
        if (!photo) return;

        modalImg.src = photo.src;
        modalTitle.textContent = photo.title;
        modalCaption.textContent = photo.caption;

        let metaText = photo.date ? photo.date : '';
        if (photo.place) metaText += (metaText ? ' • ' : '') + photo.place;

        modalDate.textContent = metaText;

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Lock scroll
    }

    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        modalImg.src = ''; // Clear for next time
    }

    photoItems.forEach(item => {
        item.addEventListener('click', () => openModal(item.dataset.id));
        item.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') openModal(item.dataset.id);
        });
    });

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
    });

    // --- Letter Logic ---
    const moodBtns = document.querySelectorAll('.mood-btn');
    const letterDisplay = document.getElementById('letter-display');
    const letterText = document.getElementById('letter-text');
    const letterMemory = document.getElementById('letter-memory');
    const btnCopy = document.getElementById('btn-copy');
    const btnNext = document.getElementById('btn-next');

    let currentMood = null;
    let seenLetters = JSON.parse(localStorage.getItem('seenLetters')) || {};

    // Helper: Shuffle array
    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    function generateLetter(moodId) {
        let pool = [];
        if (moodId === 'surprise') {
            pool = surprises;
        } else {
            pool = letters.filter(l => l.moodId === moodId);
        }

        if (pool.length === 0) return null;

        const seenForMood = seenLetters[moodId] || [];
        const available = pool.filter(l => !seenForMood.includes(l.id));

        let choice;
        if (available.length === 0) {
            // Reset if exhausted
            seenLetters[moodId] = [];
            localStorage.setItem('seenLetters', JSON.stringify(seenLetters));
            choice = pool[Math.floor(Math.random() * pool.length)]; // Pick random from full pool
            // Mark as seen immediately
            seenLetters[moodId] = [choice.id];
        } else {
            choice = available[Math.floor(Math.random() * available.length)];
            seenLetters[moodId] = [...seenForMood, choice.id];
        }

        localStorage.setItem('seenLetters', JSON.stringify(seenLetters));
        return choice;
    }

    function showLetter(letter) {
        if (!letter) return;

        letterDisplay.classList.remove('hidden');
        // Simple animation restart
        const card = document.querySelector('.letter-card');
        card.style.animation = 'none';
        card.offsetHeight; /* trigger reflow */
        card.style.animation = 'slideIn 0.5s ease-out';

        letterText.textContent = letter.text;
        letterMemory.textContent = letter.memory ? `Recuerdo: ${letter.memory}` : '';

        // Scroll to letter
        letterDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Visual active state
            moodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentMood = btn.dataset.mood;
            const letter = generateLetter(currentMood);
            showLetter(letter);
        });
    });

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (!currentMood) return;
            const letter = generateLetter(currentMood);
            showLetter(letter);
        });
    }

    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            const text = `${letterText.textContent}\n\n${letterMemory.textContent}`;
            navigator.clipboard.writeText(text).then(() => {
                const original = btnCopy.textContent;
                btnCopy.textContent = "¡Copiado!";
                setTimeout(() => btnCopy.textContent = original, 2000);
            });
        });
    }
});
