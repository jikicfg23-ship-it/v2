async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function createPRNG(seedHex) {
    let seed = parseInt(seedHex.substring(0, 8), 16);
    return function() {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}

document.getElementById('btnEncrypt').addEventListener('click', async () => {
    const text = document.getElementById('textInput').value;
    const password = document.getElementById('passwordInput').value;

    if (!text || !password) {
        alert('من فضلك أدخل النص وكلمة المرور معاً!');
        return;
    }

    const utf8Bytes = new TextEncoder().encode(text);
    const base64Text = btoa(String.fromCharCode(...utf8Bytes));
    const textBytes = new TextEncoder().encode(base64Text);
    
    const passwordHash = await sha256(password);
    const rand = createPRNG(passwordHash);

    const canvas = document.getElementById('chaosCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const totalPoints = 300; 
    const points = [];
    for (let i = 0; i < totalPoints; i++) {
        points.push({
            x: rand() * (canvas.width - 40) + 20,
            y: rand() * (canvas.width - 40) + 20,
            size: rand() * 3 + 2,
            baseColor: Math.floor(rand() * 3)
        });
    }

    for (let i = 0; i < textBytes.length; i++) {
        const byte = textBytes[i];
        const p1Idx = Math.floor(rand() * points.length);
        const p2Idx = Math.floor(rand() * points.length);
        
        const p1 = points[p1Idx];
        const p2 = points[p2Idx];

        ctx.strokeStyle = `rgb(${byte}, ${Math.floor(rand() * 50)}, 255)`;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    points.forEach((p) => {
        ctx.fillStyle = p.baseColor === 0 ? '#3b82f6' : (p.baseColor === 1 ? '#60a5fa' : '#ffffff');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    document.getElementById('btnDownload').style.display = 'block';
});

document.getElementById('btnDownload').addEventListener('click', () => {
    const canvas = document.getElementById('chaosCanvas');
    const link = document.createElement('a');
    link.download = 'chaos_signature.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});
