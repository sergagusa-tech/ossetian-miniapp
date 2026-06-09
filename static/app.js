let tg = window.Telegram?.WebApp;

if (tg) {
    tg.expand();
}

let score = 0;
let correctAnswer = "";
let answered = false;
let currentMode = "word";

// ------------------
// SPLASH
// ------------------

window.addEventListener("load", () => {

    setTimeout(() => {

        document.getElementById("splash-screen").style.display = "none";

        const menu = document.getElementById("menu-screen");

        menu.style.display = "flex";

    }, 3000);

});

// ------------------
// MENU
// ------------------

setTimeout(() => {

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

}, 100);

// ------------------
// START GAME
// ------------------

function startGame() {

    score = 0;

    document.getElementById("score").innerText = "0";

    document.getElementById("menu-screen").style.display =
        "none";

    document.getElementById("game-screen").style.display =
        "block";

    loadQuestion();

    loadLeaderboard();
}

// ------------------
// MENU
// ------------------

function showMenu() {

    document.getElementById("game-screen").style.display =
        "none";

    document.getElementById("menu-screen").style.display =
        "flex";
}

// ------------------
// LOAD QUESTION
// ------------------

async function loadQuestion() {

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

    document.getElementById("result").innerText =
        "";
}

// ------------------
// CHECK ANSWER
// ------------------

function checkAnswer(answer) {

    if (answered) return;

    answered = true;

    const buttons =
        document.querySelectorAll(".answer-btn");

    buttons.forEach(btn => {

        const text =
            btn.querySelector("span").innerText;

        if (text === correctAnswer) {

            btn.classList.add("correct");

        } else {

            btn.classList.add("dimmed");
        }

        if (
            text === answer &&
            answer !== correctAnswer
        ) {

            btn.classList.remove("dimmed");

            btn.classList.add("wrong");
        }
    });

    if (answer === correctAnswer) {

        score++;

        document.getElementById("score").innerText =
            score;

        document.getElementById("result").innerText =
            "✅ Правильно";

        setTimeout(() => {

            loadQuestion();

        }, 1200);

    } else {

        document.getElementById("result").innerText =
            `❌ Правильный ответ: ${correctAnswer}`;
    }
}

// ------------------
// FINISH GAME
// ------------------

async function finishGame() {

    let tg_id =
        tg?.initDataUnsafe?.user?.id || "0";

    await fetch("/save_score", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            tg_id: tg_id,
            score: score
        })
    });

    if (tg) {

        tg.sendData(
            JSON.stringify({
                score: score
            })
        );
    }

    loadLeaderboard();

    document.getElementById("result").innerText =
        `🏆 Очков: ${score}`;
}

// ------------------
// LEADERBOARD
// ------------------

async function loadLeaderboard() {

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

        div.innerText =
            `${i + 1}. ${u.tg_id} — ${u.best_score}`;

        board.appendChild(div);
    });
}
