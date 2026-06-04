document.addEventListener('DOMContentLoaded', () => {

    const crypticTexts = [
        "I T  H E A R S  T H E  C H A O S",
        "T H E  S O R R O W   F I L L E D  S C R E A M S",
        "SO  IT  A W A I T S",
        "F O R  Y O U  T O  L E T  I T  I N ",
        "B E C A U S E  I T  C U R E S ",
        "B E C A U S E  I T  H E A L S ",
        "P A I N  I S  I N E V I T A B L E",
        "T H E R E  I S  N O  R E T U R N . . .",
        "U N L E S S   I T  I S  U N L E A S H E D",
        "L E T  U S  F I X  T H E  W O R L D",
    ];

    
    const joinOverlay = document.getElementById('join-overlay');
    const joinButton = document.getElementById('join-button');
    const textSequenceOverlay = document.getElementById('text-sequence-overlay');
    const sequenceText = document.getElementById('sequence-text');
    const progressFill = document.getElementById('sequence-progress-fill');
    const visualizerContainer = document.getElementById('visualizer-container');
    let currentTextIndex = 0;

    window.audioVisualizer = null;
    const textAudio = new Audio();
    textAudio.src = 'B55.wav'; 
    textAudio.loop = true; 

   

    function showNextText() {
        if (currentTextIndex < crypticTexts.length) {
            sequenceText.textContent = crypticTexts[currentTextIndex];
            sequenceText.setAttribute('data-text', crypticTexts[currentTextIndex]);
            const progress = ((currentTextIndex + 1) / crypticTexts.length) * 100;
            progressFill.style.width = `${progress}%`;
            currentTextIndex++;
        
            if (currentTextIndex === crypticTexts.length) {
                textAudio.pause();
                textAudio.currentTime = 0;
                
                setTimeout(() => {
                    showSphere();
                }, 1500);
            }
        }
    }

    function showSphere() {
        textSequenceOverlay.style.display = 'none';
        visualizerContainer.style.display = 'block';
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'visualizer-loading';
        loadingDiv.innerHTML = `
            <div class="spinner"></div>
        `;
        visualizerContainer.appendChild(loadingDiv);

        setTimeout(() => {
            const loading = document.getElementById('visualizer-loading');
            if (loading) loading.remove();
            
            if (!window.audioVisualizer) {
                window.audioVisualizer = new AudioVisualizer('visualizer-container');
            }
        }, 2000);
    }

    joinButton.addEventListener('click', () => {
        joinOverlay.classList.add('hidden');
        textAudio.play().catch(e => console.log('Audio play failed:', e));
    
        setTimeout(() => {
            textSequenceOverlay.style.display = 'flex';
    
            currentTextIndex = 0;
            showNextText();
            
            const textInterval = setInterval(() => {
                if (currentTextIndex < crypticTexts.length) {
                    showNextText();
                } else {
                    clearInterval(textInterval);
                }
            }, 6000); 
            
        }, 500);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (!joinOverlay.classList.contains('hidden')) {
                joinButton.click();
            }
        }
    });

    joinButton.addEventListener('mouseenter', () => {
        joinButton.textContent = "J O I N · U S";
    });
    
    joinButton.addEventListener('mouseleave', () => {
        joinButton.textContent = "H E L P · U S";
    });
});