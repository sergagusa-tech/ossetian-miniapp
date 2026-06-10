let tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

// alert("APP START");

let score = 0;
let correctAnswer = "";
let answered = false;
let currentMode = "word";


let lives = 3;
let level = 1;
let timer = 10;
let timerInterval = null;

// ------------------
// SPLASH + MENU
// ------------------

window.addEventListener("load", () => {

    const splash = document.getElementById("splash-screen");

    if (splash) {
        splash.remove();
    }

    document.getElementById("menu-screen").style.display = "flex";

    document.getElementById("wordModeBtn").onclick = () => {

        currentMode = "word";

        document.getElementById("gameMode").innerText = "Слова";

        startGame();
    };

    document.getElementById("sentenceModeBtn").onclick = () => {

        currentMode = "sentence";

        document.getElementById("gameMode").innerText = "Фразы";

        startGame();
    };

    document.getElementById("backBtn").onclick = showMenu;
});

// ------------------
// START GAME
// ------------------

function startGame() {

    score = 0;

    document.getElementById("score").innerText = "0";

    document.getElementById("menu-screen").style.display = "none";

    document.getElementById("game-screen").style.display = "block";

    loadQuestion();

    loadLeaderboard();
}

function startTimer() {
    clearInterval(timerInterval);
    timer = 10;

    timerInterval = setInterval(() => {
        timer--;

        document.getElementById("timer").innerText = timer;

        if (timer <= 0) {
            clearInterval(timerInterval);
            handleWrong("⏰ Время вышло!");
        }
    }, 1000);
}

function handleWrong(message) {

    streak = 0; // если ещё используешь
    lives--;

    document.getElementById("result").innerText = message;

    tg?.HapticFeedback?.notificationOccurred("error");

    updateUI();

    if (lives <= 0) {
        finishGame();
        return;
    }

    setTimeout(() => {
        loadQuestion();
    }, 1200);
}

// ------------------
// SHOW MENU
// ------------------

function showMenu() {

    document.getElementById("game-screen").style.display = "none";

    document.getElementById("menu-screen").style.display = "flex";
}

// ------------------
// LOAD QUESTION
// ------------------

async function loadQuestion() {

    try {

        answered = false;

        const endpoint =
            currentMode === "word"
                ? "/word"
                : "/sentence";

        const res = await fetch(endpoint);

        const data = await res.json();

        document.getElementById("word").innerText =
            data.ru;

        correctAnswer = data.correct;

        const answers =
            document.getElementById("answers");

        answers.innerHTML = "";

        data.options.forEach((option, index) => {

            const btn =
                document.createElement("button");

            btn.className = "answer-btn";

            btn.innerHTML = `
                <div class="answer-number">
                    ${index + 1}
                </div>
                <span>${option}</span>
            `;

            btn.onclick = () =>
                checkAnswer(option);

            answers.appendChild(btn);
        });

        document.getElementById("result").innerText = "";
                // ✔ обновляем интерфейс
                updateUI();

                // ✔ запускаем таймер нового вопроса
                startTimer();
    } catch (err) {

        console.error(err);

        document.getElementById("result").innerText =
            "Ошибка загрузки вопроса";
    }
}

function showExplanation(correct) {
    const el = document.getElementById("result");

    el.innerHTML = `
        ❌ Неправильно<br>
        ✅ Правильный ответ: ${correct}
    `;
}

function checkDailyReward() {
    const last = localStorage.getItem("lastReward");
    const today = new Date().toDateString();

    if (last !== today) {
        score += 3;

        localStorage.setItem("lastReward", today);

        alert("🎁 Ежедневный бонус +3 очка!");
    }
}

function updateUI() {
    document.getElementById("score").innerText = score;
    document.getElementById("lives").innerText = lives;
}

function gameOver() {
    document.getElementById("result").innerHTML = `
        💀 Игра окончена<br>
        🏆 Очки: ${score}
    `;
}

// ------------------
// CHECK ANSWER
// ------------------

function checkAnswer(answer) {
    tg?.HapticFeedback?.impactOccurred("light"); 
    if (answered) return;
    answered = true;

    clearInterval(timerInterval);

    const buttons = document.querySelectorAll(".answer-btn");

    buttons.forEach(btn => {
        const text = btn.querySelector("span").innerText;

        if (text === correctAnswer) {
            btn.classList.add("correct");
        } else {
            btn.classList.add("dimmed");
        }

        if (text === answer && answer !== correctAnswer) {
            btn.classList.add("wrong");
            btn.classList.remove("dimmed");
        }
    });

    if (answer === correctAnswer) {
    tg?.HapticFeedback?.notificationOccurred("success");

    score++;

    document.getElementById("score").innerText = score;

    document.getElementById("result").innerText = "✅ Правильно";

    setTimeout(loadQuestion, 1000);


    } else {
        tg?.HapticFeedback?.notificationOccurred("error");
        handleWrong(`❌ Правильно: ${correctAnswer}`);
    }
}

// ------------------
// FINISH GAME
// ------------------

async function finishGame() {
    try {

        const user = tg?.initDataUnsafe?.user;

        await fetch("/save_score", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                tg_id: user?.id || "0",
                username: user?.username || user?.first_name || "User",
                score: score
            })
        });

        await loadLeaderboard();

        document.getElementById("result").innerText =
            `💀 Игра окончена\n🏆 Очков: ${score}`;

        setTimeout(() => {
            showMenu();
        }, 2000);

    } catch (err) {
        console.error(err);
    }
}

// ------------------
// LEADERBOARD
// ------------------

async function loadLeaderboard() {

    try {

        const res =
            await fetch("/leaderboard");

        const data =
            await res.json();

        const board =
            document.getElementById("board");

        board.innerHTML = "";

        data.forEach((u, i) => {

            const div =
                document.createElement("div");

            div.innerText = `${i + 1}. ${u.username || "User"} — ${u.best_score}`;

            board.appendChild(div);
        });

    } catch (err) {

        console.error(err);
    }

    setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    if (splash) splash.remove();
                    }, 3000);

}
