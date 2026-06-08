let tg = window.Telegram?.WebApp;

if (tg) {
    tg.expand();
}

let score = 0;
let correctAnswer = "";

async function loadWord() {
    const res = await fetch("/word");
    const data = await res.json();

    document.getElementById("word").innerText = data.ru;

    correctAnswer = data.correct;

    const answers = document.getElementById("answers");
    answers.innerHTML = "";

    data.options.forEach(option => {
        const btn = document.createElement("button");
        btn.innerText = option;

        btn.onclick = () => checkAnswer(option);

        answers.appendChild(btn);
    });

    document.getElementById("result").innerText = "";
}

function checkAnswer(answer) {
    if (answer === correctAnswer) {
        score++;
        document.getElementById("score").innerText = score;
        document.getElementById("result").innerText = "✅ Правильно";
    } else {
        document.getElementById("result").innerText = "❌ Неправильно";
    }
}

async function finishGame() {
    let tg_id = tg?.initDataUnsafe?.user?.id || "0";

    await fetch("/save_score", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            tg_id: tg_id,
            score: score
        })
    });

    if (tg) {
        tg.sendData(JSON.stringify({ score }));
    }

    loadLeaderboard();
}

async function loadLeaderboard() {
    const res = await fetch("/leaderboard");
    const data = await res.json();

    const board = document.getElementById("board");
    board.innerHTML = "";

    data.forEach((u, i) => {
        const div = document.createElement("div");
        div.innerText = `${i + 1}. ${u.tg_id} — ${u.best_score}`;
        board.appendChild(div);
    });
}

loadWord();
loadLeaderboard();