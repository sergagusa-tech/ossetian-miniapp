from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import random

from db import get_connection, init_db

app = FastAPI()

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------
# СЛОВА
# --------------------

words = [
    {"ru": "Дом", "os": "Хæдзар"},
    {"ru": "Книга", "os": "Чингуытæ"},
    {"ru": "Собака", "os": "Куыдз"},
    {"ru": "Кошка", "os": "Гæды"},
    {"ru": "Вода", "os": "Дон"},
    {"ru": "Школа", "os": "Скъола"},
    {"ru": "Друг", "os": "Æмбал"},
    {"ru": "Город", "os": "Сахар"},
    {"ru": "Мать", "os": "Мад"},
    {"ru": "Отец", "os": "Фыд"},
]

# --------------------
# ПРЕДЛОЖЕНИЯ
# --------------------

sentences = [
    {"ru": "Я иду домой", "os": "Æз цæуын хæдзармæ"},
    {"ru": "Как тебя зовут?", "os": "Дæ ном куыд у?"},
    {"ru": "Доброе утро", "os": "Хорз райсом"},
    {"ru": "Спасибо большое", "os": "Стыр бузныг"},
    {"ru": "Я люблю Осетию", "os": "Æз уарзын Ирыстон"},
    {"ru": "До свидания", "os": "Фæндараст"},
]

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def index():
    return FileResponse("static/index.html")


# --------------------
# РЕЖИМ СЛОВ
# --------------------

@app.get("/word")
def get_word():

    word = random.choice(words)
    correct = word["os"]

    wrong = [w["os"] for w in words if w["os"] != correct]

    count = min(3, len(wrong))

    options = random.sample(wrong, count)
    options.append(correct)

    random.shuffle(options)

    return {
        "ru": word["ru"],
        "correct": correct,
        "options": options
    }


# --------------------
# РЕЖИМ ПРЕДЛОЖЕНИЙ
# --------------------

@app.get("/sentence")
def get_sentence():

    sentence = random.choice(sentences)
    correct = sentence["os"]

    wrong = [s["os"] for s in sentences if s["os"] != correct]

    count = min(3, len(wrong))

    options = random.sample(wrong, count)
    options.append(correct)

    random.shuffle(options)

    return {
        "ru": sentence["ru"],
        "correct": correct,
        "options": options
    }


# --------------------
# СОХРАНЕНИЕ ОЧКОВ
# --------------------

@app.post("/save_score")
def save_score(data: dict):

    tg_id = str(data["tg_id"])
    score = int(data["score"])

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM users WHERE tg_id=?",
        (tg_id,)
    )

    user = cur.fetchone()

    if user:

        best = max(user["best_score"], score)

        cur.execute(
            """
            UPDATE users
            SET score=?, best_score=?
            WHERE tg_id=?
            """,
            (score, best, tg_id)
        )

    else:

        cur.execute(
            """
            INSERT INTO users
            (tg_id, score, best_score)
            VALUES (?, ?, ?)
            """,
            (tg_id, score, score)
        )

    conn.commit()
    conn.close()

    return {"status": "ok"}


# --------------------
# ЛИДЕРБОРД
# --------------------

@app.get("/leaderboard")
def leaderboard():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT tg_id, best_score
        FROM users
        ORDER BY best_score DESC
        LIMIT 10
        """
    )

    data = cur.fetchall()

    conn.close()

    return [
        {
            "tg_id": row["tg_id"],
            "best_score": row["best_score"]
        }
        for row in data
    ]