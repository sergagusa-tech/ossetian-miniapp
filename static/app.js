let tg = window.Telegram?.WebApp;

if (tg) {
    tg.expand();
}

alert("APP START");

let score = 0;
let correctAnswer = "";
let answered = false;
let currentMode = "word";

// SPLASH

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
