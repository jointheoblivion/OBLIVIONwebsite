class AudioVisualizer {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.mesh = null;
        this.clock = new THREE.Clock();
        
        // Audio variables
        this.audioContext = null;
        this.audio = null;
        this.analyser = null;
        this.source = null;
        this.audioData = null;
        this.isPlaying = false;
        this.simulateAudio = false;
        
        // Color mode (0: White, 1: Red, 2: Gradient, 3: Pulsing)
        this.colorMode = 0;
        
        this.settings = {
            wireframe: true,
            autoRotate: true,
            audioIntensity: 2.5,
            noiseIntensity: 1.5
        };
        
        this.init();
    }
    
    init() {
        this.initScene();
        this.createMesh();
        this.setupAudio();
        this.createControls();
        this.animate();
    }
    
    initScene() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x100506); 
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x100506);
        
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(8, 5, 15);
    
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = false;
        this.controls.enableZoom = true;
        this.controls.enablePan = false;
        this.controls.maxPolarAngle = Math.PI / 2;
        
        const ambientLight = new THREE.AmbientLight(0x402020);
        this.scene.add(ambientLight);
        
        const redLight = new THREE.DirectionalLight(0xA40C2C, 1.5);
        redLight.position.set(5, 10, 7);
        this.scene.add(redLight);
        
        const whiteLight = new THREE.PointLight(0xffffff, 1, 20);
        whiteLight.position.set(-5, 3, 5);
        this.scene.add(whiteLight);
        
        const pointLight1 = new THREE.PointLight(0xA40C2C, 1.5, 15);
        pointLight1.position.set(3, -2, 8);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xA40C2C, 1.5, 15);
        pointLight2.position.set(-3, 4, -5);
        this.scene.add(pointLight2);
        
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createMesh() {
        const geometry = new THREE.IcosahedronGeometry(4, 5);
        const vertexShader = document.getElementById('vertexShader').textContent;
        const fragmentShader = document.getElementById('fragmentShader').textContent;
        
        this.uniforms = {
            u_time: { value: 0.0 },
            u_audioData: { value: new Array(32).fill(0) },
            u_audioAverage: { value: 0.0 },
            u_bassLevel: { value: 0.0 },
            u_midLevel: { value: 0.0 },
            u_trebleLevel: { value: 0.0 },
            u_colorMode: { value: 0 } // 0: White, 1: Red, 2: Gradient, 3: Pulsing
        };
        
        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            wireframe: this.settings.wireframe,
            transparent: false,
            side: THREE.DoubleSide
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
    }
    
    createControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.id = 'sphere-controls';
        controlsDiv.innerHTML = `
            <button id="play-sphere-btn" class="sphere-control-btn">P L A Y</button>
            <button id="rotate-sphere-btn" class="sphere-control-btn">R O T A T E : O N</button>
            <button id="color-sphere-btn" class="sphere-control-btn">C O L O R : W H I T E</button>
        `;
        this.container.appendChild(controlsDiv);
        
        // Play button
        document.getElementById('play-sphere-btn').addEventListener('click', () => {
            if (this.isPlaying) {
                this.audio.pause();
                this.isPlaying = false;
                document.getElementById('play-sphere-btn').textContent = ' P L A Y';
            } else {
                this.playAudio();
                document.getElementById('play-sphere-btn').textContent = ' P A U S E';
            }
        });
        
        // Rotation button
        document.getElementById('rotate-sphere-btn').addEventListener('click', (e) => {
            this.settings.autoRotate = !this.settings.autoRotate;
            e.target.textContent = this.settings.autoRotate ? 'R O T A T E : O N' : 'R O T A T E : O F F';
        });
        
        // Color button
        document.getElementById('color-sphere-btn').addEventListener('click', (e) => {
            this.colorMode = (this.colorMode + 1) % 4; 
            
            if (this.uniforms) {
                this.uniforms.u_colorMode.value = this.colorMode;
            }
            
            switch(this.colorMode) {
                case 0:
                    e.target.textContent = 'C O L O R : W H I T E';
                    break;
                case 1:
                    e.target.textContent = 'C O L O R : R E D';
                    break;
                case 2:
                    e.target.textContent = 'C O L O R : G R A D I E N T';
                    break;
                case 3:
                    e.target.textContent = 'C O L O R : P U L S E';
                    break;
            }
        });
    }
    
    setupAudio() {
        this.audio = document.getElementById('audioPlayer');
        this.audio.src = 'BeyondMasterFinalFinal.wav'; 
        
        document.addEventListener('click', () => {
            if (!this.audioContext && !this.simulateAudio) {
                this.initAudioContext();
            }
        }, { once: true });
    }
    
    async initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.source = this.audioContext.createMediaElementSource(this.audio);
            this.analyser = this.audioContext.createAnalyser();
            
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.7;
            
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            this.audioData = new Uint8Array(this.analyser.frequencyBinCount);
            
            console.log('Audio context initialized');
        } catch (error) {
            console.error('Audio setup failed, using simulation:', error);
            this.simulateAudio = true;
            this.isPlaying = true;
        }
    }
    
    async playAudio() {
        try {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            await this.audio.play();
            this.isPlaying = true;
            
        } catch (error) {
            console.error('Play failed, using simulation:', error);
            this.simulateAudio = true;
            this.isPlaying = true;
        }
    }
    
    updateAudioData() {
        if (this.simulateAudio) {
            const time = Date.now() * 0.001;
            const simulatedData = new Array(32).fill(0).map((_, i) => {
                return (Math.sin(time * 3 + i * 0.8) * 0.7 + 
                        Math.sin(time * 5 + i * 0.3) * 0.3 + 
                        Math.random() * 0.2) * 1.5;
            });
            
            this.uniforms.u_audioData.value = simulatedData;
            
            const average = simulatedData.reduce((a, b) => a + b) / simulatedData.length;
            const bass = simulatedData.slice(0, 4).reduce((a, b) => a + b) / 4;
            const mid = simulatedData.slice(4, 12).reduce((a, b) => a + b) / 8;
            const treble = simulatedData.slice(12, 20).reduce((a, b) => a + b) / 8;
            
            this.uniforms.u_audioAverage.value = average;
            this.uniforms.u_bassLevel.value = bass;
            this.uniforms.u_midLevel.value = mid;
            this.uniforms.u_trebleLevel.value = treble;
            
            return;
        }
        
        if (this.analyser && this.isPlaying && this.audioData) {
            this.analyser.getByteFrequencyData(this.audioData);
            
            const normalizedData = Array.from(this.audioData).map(v => v / 256);
            this.uniforms.u_audioData.value = normalizedData.slice(0, 32);
            
            const average = normalizedData.reduce((a, b) => a + b) / normalizedData.length;
            const bass = normalizedData.slice(0, 8).reduce((a, b) => a + b) / 8;
            const mid = normalizedData.slice(8, 24).reduce((a, b) => a + b) / 16;
            const treble = normalizedData.slice(24, 32).reduce((a, b) => a + b) / 8;
            
            this.uniforms.u_audioAverage.value = average * 1.5;
            this.uniforms.u_bassLevel.value = bass * 2.0;
            this.uniforms.u_midLevel.value = mid * 1.5;
            this.uniforms.u_trebleLevel.value = treble * 1.2;
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (!this.mesh) return;
        
        if (this.uniforms) {
            this.uniforms.u_time.value = this.clock.getElapsedTime();
        }

        this.updateAudioData();
        
        if (this.settings.autoRotate && this.mesh) {
            this.mesh.rotation.y += 0.002 + (this.uniforms.u_bassLevel.value * 0.01);
            this.mesh.rotation.x += 0.001 + (this.uniforms.u_midLevel.value * 0.005);
            this.mesh.rotation.z += this.uniforms.u_trebleLevel.value * 0.003;
        }
        
        if (this.uniforms && this.uniforms.u_audioAverage.value > 0 && this.mesh) {
            const pulse = 1 + this.uniforms.u_audioAverage.value * 0.15;
            this.mesh.scale.set(pulse, pulse, pulse);
        }
        
        if (this.controls) {
            this.controls.update();
        }
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    onWindowResize() {
        if (!this.container) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}