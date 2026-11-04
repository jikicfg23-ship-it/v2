// دالة تحويل كلمة المرور إلى الهاش SHA-256 لضمان الصعوبة الأمنية البالغة
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// دالة توليد أرقام عشوائية ثابتة بناءً على البذرة (Seeded PRNG) لربط الفوضى بكلمة المرور
function createPRNG(seedHex) {
    // نأخذ جزءاً من الهاش ونحوله لرقم لبدء معادلة LCG الرياضية
    let seed = parseInt(seedHex.substring(0, 8), 16);
    return function() {
        // معادلة Linear Congruential Generator معقدة لإنتاج فوضى رياضية ثابتة
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}

// الدالة الأساسية للتوليد والتشفير
document.getElementById('btnEncrypt').addEventListener('click', async () => {
    const text = document.getElementById('textInput').value;
    const password = document.getElementById('passwordInput').value;

    if (!text || !password) {
        alert('من فضلك أدخل النص وكلمة المرور معاً!');
        return;
    }

    // 1. تشفير النص برمجياً عبر تحويله إلى بايتات
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(text);
    
    // 2. توليد بذرة التشفير من كلمة المرور عبر SHA-256
    const passwordHash = await sha256(password);
    const rand = createPRNG(passwordHash);

    // تجهيز ساحة الرسم الإلكترونية (Canvas)
    const canvas = document.getElementById('chaosCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // خلفية سوداء مطلقة للبصمة
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. رسم النقاط الهندسية الفوضوية بناءً على إحداثيات التشفير
    // كل بايت من النص يتم تمثيله وتعميته داخل هندسة العلاقات بين النقاط العشوائية
    const totalPoints = Math.max(textBytes.length * 3, 120); // زيادة النقاط لتعقيد الشفرة بصرياً
    const points = [];

    // توليد مواقع فوضوية ثابتة لكل نقطة بناء على كلمة المرور فقط
    for (let i = 0; i < totalPoints; i++) {
        points.push({
            x: rand() * (canvas.width - 40) + 20,
            y: rand() * (canvas.width - 40) + 20,
            size: rand() * 4 + 2,
            baseColor: Math.floor(rand() * 3) // فئات رمزية للألوان
        });
    }

    // دمج بايتات المقال/النص لتعديل المسافات والخطوط الرابطة بشكل فوضوي دقيق جداً
    for (let i = 0; i < textBytes.length; i++) {
        const byte = textBytes[i];
        // دمج البايت الرياضي مع الـ PRNG لاختيار نقطتين عشوائيتين لربطهما بخط شفرة
        const p1Idx = Math.floor(rand() * points.length);
        const p2Idx = Math.floor(rand() * points.length);
        
        const p1 = points[p1Idx];
        const p2 = points[p2Idx];

        // معادلة التعديل البصري (تغيير طفيف جداً في الألوان والشفافية يحمل قيمة الـ Byte المكتوب)
        ctx.strokeStyle = `rgba(${100 + byte}, ${150 + (byte % 50)}, 255, ${0.4 + (byte / 500)})`;
        ctx.lineWidth = 1 + (byte % 3);
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    // رسم كتل وجزيئات النقاط الفوضوية في مواقعها المشفرة
    points.forEach((p, idx) => {
        // تعديل هالة الضوء بناءً على معادلة الدمج الأمنية
        ctx.fillStyle = p.baseColor === 0 ? '#3b82f6' : (p.baseColor === 1 ? '#60a5fa' : '#ffffff');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // إظهار زر تحميل الصورة الناتجة
    document.getElementById('btnDownload').style.display = 'block';
});

// دالة تحميل الصورة الناتجة للاحتفاظ بها
document.getElementById('btnDownload').addEventListener('click', () => {
    const canvas = document.getElementById('chaosCanvas');
    const link = document.createElement('a');
    link.download = 'chaos_signature.png';
    link.href = canvas.toDataURL();
    link.click();
});
