async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// دالة تشفير النص بكلمة المرور (XOR) لضمان الصعوبة الأمنية
function xorEncryptDecrypt(text, key) {
    let result = "";
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(unescape(encodeURIComponent(result))); // تحويل لـ Base64 آمن
}

document.getElementById('btnEncrypt').addEventListener('click', async () => {
    const text = document.getElementById('textInput').value;
    const password = document.getElementById('passwordInput').value;

    if (!text || !password) {
        alert('من فضلك أدخل النص وكلمة المرور معاً!');
        return;
    }

    const canvas = document.getElementById('chaosCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // رسم شكل فوضوي جمالي مذهل
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // توليد شكل بصري معقد لا علاقة له بالبيانات لمنع تتبعها
    let MathRand = () => Math.random();
    for (let i = 0; i < 180; i++) {
        ctx.strokeStyle = `rgba(59, 130, 246, ${MathRand() * 0.4})`;
        ctx.lineWidth = MathRand() * 3;
        ctx.beginPath();
        ctx.moveTo(MathRand() * canvas.width, MathRand() * canvas.height);
        ctx.lineTo(MathRand() * canvas.width, MathRand() * canvas.height);
        ctx.stroke();
    }

    // 1. تشفير النص باستخدام المفتاح المستخرج من الهاش SHA-256
    const key = await sha256(password);
    const encryptedText = xorEncryptDecrypt(text, key);

    // 2. تحويل الصورة إلى بايتات وحقن النص المشفر في نهايتها كعلامة سرية (Magic Marker)
    canvas.toBlob(async (blob) => {
        const arrayBuffer = await blob.arrayBuffer();
        const originalBytes = new Uint8Array(arrayBuffer);
        
        // تحويل النص المشفر إلى بايتات وإضافة علامة مميزة قبلها ليعرفها فاحص الكود
        const marker = "||CHAOS_KEY||";
        const secretPayload = new TextEncoder().encode(marker + encryptedText);
        
        // دمج البايتات معاً في ملف واحد صلب
        const finalBytes = new Uint8Array(originalBytes.length + secretPayload.length);
        finalBytes.set(originalBytes);
        finalBytes.set(secretPayload, originalBytes.length);

        // تجهيز الملف النهائي للتحميل
        const finalBlob = new Blob([finalBytes], { type: 'image/png' });
        window.generatedBlobUrl = URL.createObjectURL(finalBlob);
        
        document.getElementById('btnDownload').style.display = 'block';
    }, 'image/png');
});

document.getElementById('btnDownload').addEventListener('click', () => {
    if (window.generatedBlobUrl) {
        const link = document.createElement('a');
        link.download = 'chaos_signature.png';
        link.href = window.generatedBlobUrl;
        link.click();
    }
});
