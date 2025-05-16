document.getElementById('start-test').addEventListener('click', startTest);

async function startTest() {
    const statusElement = document.getElementById('status');
    const pingElement = document.getElementById('ping-value');
    const downloadGauge = document.querySelector('.download-gauge .gauge-fill');
    const downloadValue = document.querySelector('.download-gauge .gauge-cover');
    const uploadGauge = document.querySelector('.upload-gauge .gauge-fill');
    const uploadValue = document.querySelector('.upload-gauge .gauge-cover');
    
    statusElement.textContent = "Testing ping...";
    
    try {
        // Test ping first
        const ping = await testPing();
        pingElement.textContent = ping;
        
        // Test download speed
        statusElement.textContent = "Testing download speed...";
        const downloadSpeed = await testDownloadSpeed();
        setGauge(downloadGauge, downloadValue, downloadSpeed);
        
        // Test upload speed
        statusElement.textContent = "Testing upload speed...";
        const uploadSpeed = await testUploadSpeed();
        setGauge(uploadGauge, uploadValue, uploadSpeed);
        
        statusElement.textContent = "Test completed!";
    } catch (error) {
        statusElement.textContent = "Error during test: " + error.message;
        console.error(error);
    }
}

async function testPing() {
    // This is a simplified ping test - real ping would require server-side support
    const startTime = performance.now();
    await fetch('https://httpbin.org/get', {cache: 'no-store'});
    const endTime = performance.now();
    return Math.round(endTime - startTime);
}

async function testDownloadSpeed() {
    const testDataUrl = 'https://httpbin.org/bytes/10000000'; // ~10MB file
    const startTime = performance.now();
    
    const response = await fetch(testDataUrl);
    const blob = await response.blob();
    const endTime = performance.now();
    
    // Calculate speed in Mbps
    const sizeInBits = blob.size * 8;
    const durationInSeconds = (endTime - startTime) / 1000;
    const speedMbps = (sizeInBits / durationInSeconds) / 1000000;
    
    return Math.round(speedMbps * 10) / 10; // Round to 1 decimal
}

async function testUploadSpeed() {
    // Create a 1MB test payload
    const testData = new ArrayBuffer(1000000); // ~1MB
    const startTime = performance.now();
    
    await fetch('https://httpbin.org/post', {
        method: 'POST',
        body: testData,
        cache: 'no-store'
    });
    
    const endTime = performance.now();
    
    // Calculate speed in Mbps
    const sizeInBits = 1000000 * 8;
    const durationInSeconds = (endTime - startTime) / 1000;
    const speedMbps = (sizeInBits / durationInSeconds) / 1000000;
    
    return Math.round(speedMbps * 10) / 10; // Round to 1 decimal
}

function setGauge(gaugeElement, valueElement, speed) {
    // Cap the speed at 100Mbps for visualization (adjust as needed)
    const maxSpeed = 100;
    const percentage = Math.min(speed / maxSpeed, 1);
    
    gaugeElement.style.transform = `rotate(${0.5 * percentage}turn)`;
    valueElement.textContent = `${speed} Mbps`;
}
