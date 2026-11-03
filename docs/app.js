// حالة اللعبة وبيانات المستخدم
const state = {
    coins: 150,
    gems: 5,
    selectedHero: 'C#',
    selectedSkin: 'default',
    upgrades: {
        dmg: 0,
        hp: 0
    },
    unlockedSkins: ['default'],
    achievements: [
        { id: 'first_win', title: 'مبرمج مبتدئ', desc: 'أكمل معركتك الأولى', completed: false, reward: 50 },
        { id: 'bug_hunter', title: 'صائد الأجز', desc: 'اقضِ على 25 بج', completed: false, reward: 100 },
        { id: 'rich_dev', title: 'مطور غني', desc: 'اجمع 500 عملة', completed: false, reward: 200 }
    ]
};

// السكنات المخصصة المتاحة
const customSkins = [
    { id: 'default', name: 'الكلاسيكي', icon: '👤', price: 0 },
    { id: 'cyber', name: 'سايبر كود', icon: '🤖', price: 100 },
    { id: 'matrix', name: 'ماتريكس أخضر', icon: '🕶️', price: 200 },
    { id: 'neon', name: 'نيون ليزر', icon: '✨', price: 350 }
];

// تحميل البيانات المحفوظة
function loadGameData() {
    try {
        const saved = localStorage.getItem('code_stickman_save');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(state, parsed);
        }
    } catch (e) {
        console.error('فشل تحميل البيانات', e);
    }
}

function saveGameData() {
    try {
        localStorage.setItem('code_stickman_save', JSON.stringify(state));
    } catch (e) {
        console.error('فشل حفظ البيانات', e);
    }
}

// التنقل بين الشاشات
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    if (screenId === 'screen-menu') {
        updateUI();
        saveGameData();
    } else if (screenId === 'screen-skins') {
        renderSkins();
    } else if (screenId === 'screen-shop') {
        updateShopUI();
    } else if (screenId === 'screen-achievements') {
        renderAchievements();
    }
}

function updateUI() {
    document.getElementById('mini-coins').innerText = `🪙 ${state.coins}`;
    document.getElementById('mini-gems').innerText = `💎 ${state.gems}`;
    document.getElementById('skin-coins').innerText = `🪙 ${state.coins}`;
    document.getElementById('shop-coins').innerText = `🪙 ${state.coins}`;
}

// عرض السكنات
function renderSkins() {
    const container = document.getElementById('skins-container');
    container.innerHTML = '';
    
    customSkins.forEach(skin => {
        const isUnlocked = state.unlockedSkins.includes(skin.id);
        const isSelected = state.selectedSkin === skin.id;
        
        const card = document.createElement('div');
        card.className = `skin-card ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
            <div class="skin-icon">${skin.icon}</div>
            <h4>${skin.name}</h4>
            <p>${isUnlocked ? (isSelected ? 'مُستخدَم' : 'ممتلك') : `🪙 ${skin.price}`}</p>
        `;
        
        card.onclick = () => {
            if (isUnlocked) {
                state.selectedSkin = skin.id;
                renderSkins();
            } else if (state.coins >= skin.price) {
                state.coins -= skin.price;
                state.unlockedSkins.push(skin.id);
                state.selectedSkin = skin.id;
                updateUI();
                renderSkins();
            } else {
                alert('لا توجد عملات كافية!');
            }
        };
        container.appendChild(card);
    });
}

// المتجر والترقيات
function updateShopUI() {
    document.getElementById('cost-dmg').innerText = 50 * (state.upgrades.dmg + 1);
    document.getElementById('cost-hp').innerText = 50 * (state.upgrades.hp + 1);
    updateUI();
}

function upgradeStat(type) {
    const cost = 50 * (state.upgrades[type] + 1);
    if (state.coins >= cost) {
        state.coins -= cost;
        state.upgrades[type]++;
        updateShopUI();
        checkAchievements();
    } else {
        alert('عملات غير كافية!');
    }
}

// الإنجازات
function renderAchievements() {
    const container = document.getElementById('achievements-container');
    container.innerHTML = '';
    
    state.achievements.forEach(ach => {
        const item = document.createElement('div');
        item.className = 'ach-item';
        item.innerHTML = `
            <div class="ach-icon">${ach.completed ? '🏆' : '🔒'}</div>
            <div class="ach-details">
                <h4>${ach.title} ${ach.completed ? '(مكتمل)' : ''}</h4>
                <p>${ach.desc} (+${ach.reward} 🪙)</p>
            </div>
        `;
        container.appendChild(item);
    });
}

function checkAchievements() {
    state.achievements.forEach(ach => {
        if (!ach.completed) {
            if (ach.id === 'first_win' && gameStats.wins > 0) {
                ach.completed = true;
                state.coins += ach.reward;
            }
            if (ach.id === 'bug_hunter' && gameStats.totalBugsKilled >= 25) {
                ach.completed = true;
                state.coins += ach.reward;
            }
            if (ach.id === 'rich_dev' && state.coins >= 500) {
                ach.completed = true;
                state.coins += ach.reward;
            }
        }
    });
}

// محرك اللعبة (Game Engine)
let canvas, ctx;
let gameInterval;
let isPaused = false;

const gameStats = {
    wins: 0,
    totalBugsKilled: 0
};

let player = {
    x: 50,
    y: 250,
    width: 40,
    height: 60,
    vx: 0,
    vy: 0,
    speed: 4,
    jumpPower: -10,
    gravity: 0.5,
    isGrounded: false,
    hp: 100,
    maxHp: 100,
    facing: 1, // 1: right, -1: left
    isAttacking: false,
    attackTimer: 0
};

let bugs = [];
let particles = [];
let moveDir = 0;
let bugsRemaining = 10;
let totalBugsWave = 10;

function selectHero(heroName) {
    state.selectedHero = heroName;
    showScreen('screen-game');
    initGame();
}

function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // ضبط أبعاد الكانفاس لتناسب الحاوية
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // إعادة ضبط بيانات اللاعب
    player.maxHp = 100 + (state.upgrades.hp * 20);
    player.hp = player.maxHp;
    player.x = 50;
    player.y = canvas.height - 120;
    player.vx = 0;
    player.vy = 0;
    
    bugs = [];
    bugsRemaining = 10;
    totalBugsWave = 10;
    spawnBugs(5);

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, 1000 / 60);
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

function setMove(dir) {
    moveDir = dir;
}

function playerJump() {
    if (player.isGrounded) {
        player.vy = player.jumpPower;
        player.isGrounded = false;
    }
}

function playerAttack() {
    if (player.isAttacking) return;
    player.isAttacking = true;
    player.attackTimer = 15; // عدد الإطارات للهجوم

    // فحص الاصطدام مع الأجز القريبة
    bugs.forEach(bug => {
        const dist = Math.abs((player.x + player.width/2) - (bug.x + bug.width/2));
        if (dist < 60 && Math.abs(player.y - bug.y) < 40) {
            const damage = 25 + (state.upgrades.dmg * 5);
            bug.hp -= damage;
            showFloatingText(`-${damage}`, bug.x, bug.y, '#ef4444');
            
            if (bug.hp <= 0) {
                bug.dead = true;
                bugsRemaining--;
                gameStats.totalBugsKilled++;
            }
        }
    });
}

function playerSpecial() {
    // ضربة خاصة تنظف الشاشة تقريباً
    bugs.forEach(bug => {
        const damage = 60 + (state.upgrades.dmg * 10);
        bug.hp -= damage;
        showFloatingText(`💥-${damage}`, bug.x, bug.y, '#f59e0b');
        if (bug.hp <= 0) {
            bug.dead = true;
            bugsRemaining--;
            gameStats.totalBugsKilled++;
        }
    });
    showFloatingText('🌟 كود خارق!', player.x, player.y - 30, '#10b981');
}

function spawnBugs(count) {
    for (let i = 0; i < count; i++) {
        bugs.push({
            x: canvas.width + Math.random() * 200,
            y: canvas.height - 120,
            width: 35,
            height: 50,
            speed: 1.5 + Math.random() * 1.5,
            hp: 40,
            maxHp: 40
        });
    }
}

function updateGame() {
    if (isPaused) return;

    // حركة اللاعب
    player.vx = moveDir * player.speed;
    if (moveDir !== 0) player.facing = moveDir;
    
    player.x += player.vx;
    player.vy += player.gravity;
    player.y += player.vy;

    // حدود الأرضية
    const groundLevel = canvas.height - 100;
    if (player.y >= groundLevel) {
        player.y = groundLevel;
        player.vy = 0;
        player.isGrounded = true;
    }

    // حدود الشاشة الأفقية
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;

    // مؤقت الهجوم
    if (player.isAttacking) {
        player.attackTimer--;
        if (player.attackTimer <= 0) player.isAttacking = false;
    }

    // تحديث الأجز (Bugs)
    bugs.forEach(bug => {
        if (bug.x > player.x) {
            bug.x -= bug.speed;
        } else {
            bug.x += bug.speed;
        }

        // اصطدام البج باللاعب
        const dist = Math.abs((player.x + player.width/2) - (bug.x + bug.width/2));
        if (dist < 30 && Math.abs(player.y - bug.y) < 30) {
            player.hp -= 1;
            if (player.hp <= 0) {
                endGame(false);
            }
        }
    });

    // إزالة الأجز الميتة واستدعاء غيرها
    bugs = bugs.filter(b => !b.dead);
    if (bugs.length < 3 && (totalBugsWave - (10 - bugsRemaining)) > 0) {
        spawnBugs(2);
    }

    // الفوز بالمرحلة
    if (bugsRemaining <= 0 && bugs.length === 0) {
        endGame(true);
    }

    // تحديث الواجهة داخل اللعبة
    document.getElementById('hud-hero-name').innerText = `${state.selectedHero} (${state.selectedSkin})`;
    document.getElementById('hud-hp-fill').style.width = `${(player.hp / player.maxHp) * 100}%`;
    document.getElementById('hud-bugs').innerText = bugsRemaining;

    // الرسم
    drawGame();
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // رسم الخلفية (محاكاة بيئة تطوير أنيقة)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // رسم شبكة البرمجة في الخلفية
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }

    // رسم الأرضية
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 4);

    // رسم الأجز (Bugs - zombies)
    bugs.forEach(bug => {
        ctx.fillStyle = '#ef4444';
        // شكل البج كخطوط حمراء غاضبة
        ctx.fillRect(bug.x, bug.y, bug.width, bug.height);
        // عيون البج
        ctx.fillStyle = '#fff';
        ctx.fillRect(bug.x + 8, bug.y + 10, 6, 6);
        ctx.fillRect(bug.x + 20, bug.y + 10, 6, 6);

        // شريط صحة البج
        ctx.fillStyle = '#333';
        ctx.fillRect(bug.x, bug.y - 10, bug.width, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(bug.x, bug.y - 10, bug.width * (bug.hp / bug.maxHp), 4);
    });

    // رسم اللاعب (Stickman المطور)
    ctx.fillStyle = getHeroColor();
    const px = player.x;
    const py = player.y;

    // الرأس
    ctx.beginPath();
    ctx.arc(px + 20, py + 12, 12, 0, Math.PI * 2);
    ctx.fill();

    // الجسم
    ctx.lineWidth = 4;
    ctx.strokeStyle = getHeroColor();
    ctx.beginPath();
    ctx.moveTo(px + 20, py + 24);
    ctx.lineTo(px + 20, py + 48);
    // الأرجل
    ctx.moveTo(px + 20, py + 48);
    ctx.lineTo(px + 10, py + 65);
    ctx.moveTo(px + 20, py + 48);
    ctx.lineTo(px + 30, py + 65);
    // الأذرع وهجوم السيف/الكود
    if (player.isAttacking) {
        ctx.moveTo(px + 20, py + 32);
        ctx.lineTo(px + 20 + (player.facing * 35), py + 32);
        // تأثير وميض السيف البرمجي
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(px + (player.facing > 0 ? 35 : -15), py + 20, 30, 20);
    } else {
        ctx.moveTo(px + 20, py + 32);
        ctx.lineTo(px + 5, py + 45);
        ctx.moveTo(px + 20, py + 32);
        ctx.lineTo(px + 35, py + 45);
    }
    ctx.stroke();
}

function getHeroColor() {
    switch(state.selectedHero) {
        | 'C#': return '#10b981';
        | 'C++': return '#3b82f6';
        | 'Java': return '#f59e0b';
        | 'Kotlin': return '#8b5cf6';
        default: return '#ffffff';
    }
}

function showFloatingText(text, x, y, color) {
    const layer = document.getElementById('floating-text-layer');
    const el = document.createElement('div');
    el.className = 'float-txt';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    el.innerText = text;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 600);
}

function togglePause() {
    isPaused = !isPaused;
    const modal = document.getElementById('modal-pause');
    if (isPaused) {
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
    }
}

function quitGame() {
    if (gameInterval) clearInterval(gameInterval);
    isPaused = false;
    document.getElementById('modal-pause').classList.remove('active');
    showScreen('screen-menu');
}

function endGame(won) {
    if (gameInterval) clearInterval(gameInterval);
    const modal = document.getElementById('modal-gameover');
    const title = document.getElementById('gameover-title');
    const desc = document.getElementById('gameover-desc');
    const rewards = document.getElementById('gameover-rewards');

    if (won) {
        gameStats.wins++;
        const coinReward = 100;
        const gemReward = 1;
        state.coins += coinReward;
        state.gems += gemReward;
        
        title.innerText = '🎉 انتصار باهر!';
        desc.innerText = `لقد نجحت بلغة ${state.selectedHero} في تصحيح جميع الأخطاء والقضاء على البجز!`;
        rewards.innerHTML = `<span>🪙 +${coinReward}</span><span>💎 +${gemReward}</span>`;
    } else {
        title.innerText = '💀 فشل النظام';
        desc.innerText = 'لقد تفوقت الأخطاء البرمجية. حاول ترقية قدراتك أو سكنك!';
        rewards.innerHTML = `<span>🪙 +10</span>`;
        state.coins += 10;
    }

    checkAchievements();
    saveGameData();
    modal.classList.add('active');
}

// تشغيل عند التحميل
window.onload = () => {
    loadGameData();
    updateUI();
};
=== END ===
