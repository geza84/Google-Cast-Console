const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

const CENSORSHIP_NAMESPACE = 'urn:x-cast:com.videai.censorship';
let censorOverlays = [];
let overlayCheckInterval = null;

// Debug Logger
const debug = (msg) => {
    console.log(`[VideAI] ${msg}`);
    // You could also display debug info on screen if enabled
};

// 1. Listen for Custom Messages (Censorship Data)
context.addCustomMessageListener(CENSORSHIP_NAMESPACE, (event) => {
    debug('🎭 Received censorship data');
    console.log('[VideAI] Raw data:', JSON.stringify(event.data));
    try {
        const data = event.data; // Expecting { overlays: [{start: 10, end: 20}, ...] }
        if (data && data.overlays) {
            censorOverlays = data.overlays;
            debug(`✅ Loaded ${censorOverlays.length} overlays`);
            console.log('[VideAI] Overlay details:', censorOverlays);
            startOverlayMonitoring();
        } else {
            debug('⚠️ No overlays in data');
        }
    } catch (e) {
        console.error('[VideAI] Error parsing censorship data', e);
    }
});

// 2. Start Overlay Monitoring
function startOverlayMonitoring() {
    if (overlayCheckInterval) {
        debug('Overlay monitoring already started');
        return;
    }
    
    debug('🔍 Starting overlay monitoring (200ms interval)');
    
    overlayCheckInterval = setInterval(() => {
        const videoElement = playerManager.getMediaElement();
        if (!videoElement) {
            console.warn('[VideAI] No video element yet');
            return;
        }

        const currentTime = videoElement.currentTime;
        const overlayElement = document.getElementById('censorOverlay');

        if (!overlayElement) {
            console.error('[VideAI] ❌ No overlay element #censorOverlay found in HTML!');
            return;
        }

        // Check if current time is inside ANY censor range
        const isCensored = censorOverlays.some(overlay =>
            currentTime >= overlay.start && currentTime <= overlay.end
        );

        if (isCensored) {
            if (overlayElement.style.display !== 'flex') {
                overlayElement.style.display = 'flex';
                debug(`⚠️ Censorship ACTIVE at ${currentTime.toFixed(2)}s`);
            }
        } else {
            if (overlayElement.style.display !== 'none') {
                overlayElement.style.display = 'none';
                debug(`✅ Censorship LIFTED at ${currentTime.toFixed(2)}s`);
            }
        }
    }, 200); // Check 5 times per second
}

// 3. Player Event Listeners
playerManager.addEventListener(
    cast.framework.events.EventType.PLAYER_LOAD_COMPLETE,
    () => {
        debug('📼 Video loaded successfully');
    }
);

playerManager.addEventListener(
    cast.framework.events.EventType.PLAYING,
    () => {
        debug('▶️ Video is playing');
        // Ensure monitoring is active when playing starts
        if (censorOverlays.length > 0 && !overlayCheckInterval) {
            startOverlayMonitoring();
        }
    }
);

// 4. Start Receiver
debug('🚀 Receiver starting...');
const options = new cast.framework.CastReceiverOptions();
options.disableIdleTimeout = true; // Don't timeout
context.start(options);
debug('✅ Receiver started and ready');
