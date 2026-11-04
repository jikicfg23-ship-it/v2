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

    // تحويل النص لـ Base64 لضمان ثباته
    const utf8Bytes = new TextEncoder().encode(text);
    const base64Text = btoa(String.fromCharCode(...utf8Bytes));
    const textBytes = new TextEncoder().encode(base64Text);

    const canvas = document.getElementById('chaosCanvas');
    const ctx = canvas.getContext('2d');
    
    // إيقاف تشغيل منعم الحواف تماماً لضمان عدم ضياع البيانات
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // تعبئة الخلفية باللون الأسود الأساسي
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const passwordHash = await sha256(password);
    const rand = createPRNG(passwordHash);

    // 1. توليد إحداثيات البكسلات الحاملة للبيانات بناءً على كلمة المرور
    // هذه المربعات صلبة ومستحيل للمتصفح أن يعدل قيمتها الرقمية
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;

    for (let i = 0; i < textBytes.length; i++) {
        const byte = textBytes[i];
        
        // حساب موقع فريد لكل بايت مبني على الكلمة السرية
        const x = Math.floor(rand() * canvas.width);
        const y = Math.floor(rand() * canvas.height);
        const pixelIdx = (y * canvas.width + x) * 4;

        // حقن البيانات في قنوات الألوان مباشرة كمصفوفة صامتة
        pixels[pixelIdx] = byte;       // R: يحمل الحرف
        pixels[pixelIdx + 1] = 77;     // G: علامة تأكيدية (مفتاح التحقق)
        pixels[pixelIdx + 2] = 255;    // B: هالة التثبيت
        pixels[pixelIdx + 3] = 255;    // A: معتم تماماً
    }
    ctx.putImageData(imgData, 0, 0);

    // 2. الآن نرسم طبقة "الفوضى البصرية" فوق البيانات للتمويه
    const totalPoints = 250;
    for (let i = 0; i < totalPoints; i++) {
        ctx.strokeStyle = `rgba(59, 130, 246, 0.15)`; // شفافية خفيفة لا تؤثر على البكسل الخلفي
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rand() * canvas.width, rand() * canvas.height);
        ctx.lineTo(rand() * canvas.width, rand() * canvas.height);
        ctx.stroke();

        // رسم كتل النجوم
        ctx.fillStyle = rand() > 0.5 ? '#60a5fa' : '#ffffff';
        ctx.beginPath();
        ctx.arc(rand() * canvas.width, rand() * canvas.height, rand() * 2 + 1, 0, Math.PI * 2);
        ctx.fill();
    }

    document.getElementById('btnDownload').style.display = 'block';
});

document.getElementById('btnDownload').addEventListener('click', () => {
    const canvas = document.getElementById('chaosCanvas');
    const link = document.createElement('a');
    link.download = 'chaos_signature.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});
