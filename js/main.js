const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

const CENSORSHIP_NAMESPACE = 'urn:x-cast:com.videai.censorship';
let censorOverlays = [];

// Debug Logger
const debug = (msg) => {
    console.log(`[VideAI] ${msg}`);
    // You could also display debug info on screen if enabled
};

// 1. Listen for Custom Messages (Censorship Data)
context.addCustomMessageListener(CENSORSHIP_NAMESPACE, (event) => {
    debug('Received censorship data');
    try {
        const data = event.data; // Expecting { overlays: [{start: 10, end: 20}, ...] }
        if (data && data.overlays) {
            censorOverlays = data.overlays;
            debug(`Loaded ${censorOverlays.length} overlays`);
        }
    } catch (e) {
        console.error('Error parsing censorship data', e);
    }
});

// 2. Monitor Playback Time
// We poll less frequently than requestAnimationFrame to save resources, but enough for accuracy
setInterval(() => {
    const videoElement = playerManager.getMediaElement();
    if (!videoElement) return;

    const currentTime = videoElement.currentTime;
    const overlayElement = document.getElementById('censorOverlay');

    if (!overlayElement) return;

    // Check if current time is inside ANY censor range
    const isCensored = censorOverlays.some(overlay =>
        currentTime >= overlay.start && currentTime <= overlay.end
    );

    if (isCensored) {
        if (overlayElement.style.display !== 'flex') {
            overlayElement.style.display = 'flex';
            debug(`Censorship ACTIVE at ${currentTime}s`);

            // Optional: Mute audio?
            // videoElement.muted = true; 
        }
    } else {
        if (overlayElement.style.display !== 'none') {
            overlayElement.style.display = 'none';
            debug(`Censorship LIFTED at ${currentTime}s`);

            // Optional: Unmute audio?
            // videoElement.muted = false;
        }
    }
}, 200); // Check 5 times per second

// 3. Start Receiver
context.start();
debug('Receiver started');
