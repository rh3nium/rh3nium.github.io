// main.js

// Ensure THREE is available globally from the CDN link in index.html
const THREE = window.THREE;

if (!THREE) {
    console.error("THREE.js library not found. Check the CDN link in index.html.");
}

const canvas = document.getElementById('webgl-background-canvas');
const texturePath = 'styles/99.png'; 
const effectSpeed = 1.0;
const rippleSize = 0.015;

let scene, camera, renderer, uniforms;

// --- 1. Initialization ---
function init() {
    // Scene setup
    scene = new THREE.Scene();
    
    // Camera setup (Orthographic for 2D background)
    // The screen plane will be from -1 to 1 in X and Y
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: false }); // alpha: false for performance
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Load texture
    const loader = new THREE.TextureLoader();
    loader.load(texturePath, 
        (texture) => {
            // Success: set up the geometry and start
            setupGeometry(texture);
            addListeners();
            animate(0); // Pass initial time
        },
        undefined, 
        (err) => {
            // Error handling for image loading
            console.error('An error occurred loading the texture. Check the path:', texturePath, err);
            // Fallback: Set a solid black background if the image fails to load
            document.body.style.backgroundColor = 'black'; 
        }
    );
}

// --- 2. Geometry and Shader Setup ---
function setupGeometry(texture) {
    // Define the uniforms (variables passed from JS to the Shader)
    uniforms = {
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_texture: { value: texture },
        u_ripple_center: { value: new THREE.Vector2(0.0, 0.0) },
        u_ripple_size: { value: rippleSize },
        u_ripple_start: { value: -100.0 } // Start far in the past so no ripple is visible
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    
    // Retrieve shaders from the script tags in index.html
    const vertexShader = document.getElementById('vertex-shader').textContent;
    const fragmentShader = document.getElementById('fragment-shader').textContent;
    
    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);
}

// --- 3. Animation Loop ---
function animate(currentTime) {
    requestAnimationFrame(animate);
    
    // Update time uniform 
    uniforms.u_time.value = currentTime * 0.001 * effectSpeed;

    renderer.render(scene, camera);
}

// --- 4. Event Listeners ---
function addListeners() {
    let lastRippleTime = 0;
    const rippleCooldown = 150; // milliseconds to prevent spamming ripples

    // Event listener on the canvas to trigger the ripple
    canvas.addEventListener('mousemove', (event) => {
        const now = performance.now();
        
        // Only trigger a ripple if enough time has passed since the last one
        if (now - lastRippleTime < rippleCooldown) {
            return;
        }
        lastRippleTime = now;

        // Convert mouse position to normalized WebGL coordinates (-1 to 1)
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -(event.clientY / window.innerHeight) * 2 + 1; // Y is inverted in WebGL

        // Start the ripple effect at the mouse location
        uniforms.u_ripple_center.value.set(x, y);
        uniforms.u_ripple_start.value = uniforms.u_time.value;
    });

    // Handle resizing
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    });
}

// Start the whole thing
document.addEventListener('DOMContentLoaded', init);
