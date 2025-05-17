document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    const startButton = document.getElementById('start-test');
    const infoButton = document.getElementById('info-btn');
    const modal = document.getElementById('info-modal');
    const closeButton = document.querySelector('.close');
    
    // Load test history
    loadTestHistory();
    
    // Event listeners
    startButton.addEventListener('click', startTest);
    infoButton.addEventListener('click', () => modal.style.display = 'block');
    closeButton.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
    
    // Test functions
    async function startTest() {
        const statusElement = document.getElementById('status');
        const pingElement = document.getElementById('ping-value');
        const downloadGauge = document.querySelector('.download-gauge .gauge-fill');
        const downloadValue = document.querySelector('.download-gauge .gauge-cover');
        const uploadGauge = document.querySelector('.upload-gauge .gauge-fill');
        const uploadValue = document.querySelector('.upload-gauge .gauge-cover');
        const startButton = document.getElementById('start-test');
        
        // Disable button during test
        startButton.disabled = true;
        startButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
        
        try {
            // Test ping first
            statusElement.textContent = "Testing ping...";
            const ping = await testPing();
            pingElement.textContent = ping;
            
            // Test download speed
            statusElement.textContent = "Testing download speed...";
            const downloadSpeed = await testDownloadSpeed();
            setGauge(downloadGauge, downloadValue, downloadSpeed, 'download');
            
            // Test upload speed
            statusElement.textContent = "Testing upload speed...";
            const uploadSpeed = await testUploadSpeed();
            setGauge(uploadGauge, uploadValue, uploadSpeed, 'upload');
            
            statusElement.textContent = "Test completed!";
            
            // Save results to history
            saveTestResult(downloadSpeed, uploadSpeed, ping);
            
        } catch (error) {
            statusElement.textContent = "Error during test: " + error.message;
            console.error(error);
        } finally {
            // Re-enable button
            startButton.disabled = false;
            startButton.innerHTML = '<i class="fas fa-play"></i> Start Test';
        }
    }
    
    async function testPing() {
        // Test with multiple requests for better accuracy
        const testUrls = [
            'https://httpbin.org/get',
            'https://google.com',
            'https://cloudflare.com'
        ];
        
        let totalPing = 0;
        let successfulTests = 0;
        
        for (const url of testUrls) {
            try {
                const startTime = performance.now();
                await fetch(url, {
                    method: 'HEAD',
                    cache: 'no-store',
                    mode: 'no-cors'
                });
                const endTime = performance.now();
                totalPing += (endTime - startTime);
                successfulTests++;
            } catch (e) {
                console.warn(`Ping test failed for ${url}: ${e.message}`);
            }
        }
        
        if (successfulTests === 0) throw new Error("All ping tests failed");
        
        return Math.round(totalPing / successfulTests);
    }
    
    async function testDownloadSpeed() {
        const testDataUrls = [
            'https://httpbin.org/bytes/10000000', // ~10MB
            'https://httpbin.org/bytes/5000000'    // ~5MB
        ];
        
        let totalSpeed = 0;
        let successfulTests = 0;
        
        for (const url of testDataUrls) {
            try {
                const startTime = performance.now();
                const response = await fetch(url + '?cache=' + Date.now());
                const blob = await response.blob();
                const endTime = performance.now();
                
                // Calculate speed in Mbps
                const sizeInBits = blob.size * 8;
                const durationInSeconds = (endTime - startTime) / 1000;
                const speedMbps = (sizeInBits / durationInSeconds) / 1000000;
                
                totalSpeed += speedMbps;
                successfulTests++;
            } catch (e) {
                console.warn(`Download test failed for ${url}: ${e.message}`);
            }
        }
        
        if (successfulTests === 0) throw new Error("All download tests failed");
        
        return Math.round((totalSpeed / successfulTests) * 10) / 10; // Average and round
    }
    
    async function testUploadSpeed() {
        // Create test payloads of different sizes
        const testPayloads = [
            new Blob([new ArrayBuffer(1000000)]),  // ~1MB
            new Blob([new ArrayBuffer(500000)])    // ~0.5MB
        ];
        
        let totalSpeed = 0;
        let successfulTests = 0;
        
        for (const payload of testPayloads) {
            try {
                const startTime = performance.now();
                await fetch('https://httpbin.org/post', {
                    method: 'POST',
                    body: payload,
                    cache: 'no-store'
                });
                const endTime = performance.now();
                
                // Calculate speed in Mbps
                const sizeInBits = payload.size * 8;
                const durationInSeconds = (endTime - startTime) / 1000;
                const speedMbps = (sizeInBits / durationInSeconds) / 1000000;
                
                totalSpeed += speedMbps;
                successfulTests++;
            } catch (e) {
                console.warn(`Upload test failed: ${e.message}`);
            }
        }
        
        if (successfulTests === 0) throw new Error("All upload tests failed");
        
        return Math.round((totalSpeed / successfulTests) * 10) / 10; // Average and round
    }
    
    function setGauge(gaugeElement, valueElement, speed, type) {
        // Adjust max speed based on connection type
        const maxSpeed = navigator.connection && navigator.connection.effectiveType === '4g' ? 100 : 50;
        const percentage = Math.min(speed / maxSpeed, 1);
        
        gaugeElement.style.transform = `rotate(${0.5 * percentage}turn)`;
        valueElement.textContent = `${speed} Mbps`;
        
        // Add color feedback
        if (type === 'download') {
            if (speed < 5) {
                gaugeElement.style.backgroundColor = '#ff4d4d';
            } else if (speed < 20) {
                gaugeElement.style.background = 'linear-gradient(to right, #ffa64d, #ff8c1a)';
            } else {
                gaugeElement.style.background = 'linear-gradient(to right, var(--primary-color), var(--dark-color))';
            }
        } else {
            if (speed < 2) {
                gaugeElement.style.backgroundColor = '#ff4d4d';
            } else if (speed < 10) {
                gaugeElement.style.background = 'linear-gradient(to right, #ffa64d, #ff8c1a)';
            } else {
                gaugeElement.style.background = 'linear-gradient(to right, var(--secondary-color), #96c93d)';
            }
        }
    }
    
    function saveTestResult(download, upload, ping) {
        const testResult = {
            date: new Date().toLocaleString(),
            download,
            upload,
            ping
        };
        
        // Get existing history or create new array
        let history = JSON.parse(localStorage.getItem('speedTestHistory') || '[]');
        
        // Add new result
        history.unshift(testResult);
        
        // Keep only last 10 results
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        
        // Save to localStorage
        localStorage.setItem('speedTestHistory', JSON.stringify(history));
        
        // Update display
        loadTestHistory();
    }
    
    function loadTestHistory() {
        const historyList = document.getElementById('history-list');
        const history = JSON.parse(localStorage.getItem('speedTestHistory') || '[]');
        
        if (history.length === 0) {
            historyList.innerHTML = '<p>No test history yet</p>';
            return;
        }
        
        historyList.innerHTML = history.map(result => `
            <div class="history-item">
                <span class="history-date">${result.date}</span>
                <div class="history-speeds">
                    <div class="history-speed">
                        <span>Download</span>
                        <span>${result.download} Mbps</span>
                    </div>
                    <div class="history-speed">
                        <span>Upload</span>
                        <span>${result.upload} Mbps</span>
                    </div>
                    <div class="history-speed">
                        <span>Ping</span>
                        <span>${result.ping} ms</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
});
