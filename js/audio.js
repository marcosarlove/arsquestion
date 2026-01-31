const AudioPlayer = (() => {
    let audioContext;
    const sounds = {};

    // Preload sounds to avoid delay on first play
    const preload = (name, path) => {
        try {
            const audio = new Audio(path);
            audio.preload = 'auto';
            sounds[name] = audio;
        } catch (e) {
            console.error(`Error preloading sound ${name}:`, e);
        }
    };

    // Initialize the audio context on the first user interaction
    const init = () => {
        if (!audioContext && typeof AudioContext !== 'undefined') {
            try {
                audioContext = new AudioContext();
            } catch (e) {
                console.error("AudioContext not supported.", e);
            }
        }
    };

    const play = (name) => {
        // The AudioContext must be resumed on a user gesture
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }

        if (sounds[name]) {
            sounds[name].currentTime = 0; // Rewind to start
            const playPromise = sounds[name].play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error(`Error playing sound ${name}:`, error);
                    // This can happen if the user hasn't interacted with the page yet.
                });
            }
        } else {
            console.warn(`Sound not found: ${name}`);
        }
    };

    return {
        init,
        preload,
        play
    };
})();
