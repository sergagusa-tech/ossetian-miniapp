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

words = [
    {"ru": "Дом", "os": "Хæдзар"},
    {"ru": "Книга", "os": "Чингуытæ"},
    {"ru": "Собака", "os": "Куыдз"},
    {"ru": "Кошка", "os": "Гæды"},
    {"ru": "Вода", "os": "Дон"},
]

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def index():
    return FileResponse("static/index.html")


@app.get("/word")
def get_word():
    word = random.choice(words)
    correct = word["os"]

    wrong = [w["os"] for w in words if w["os"] != correct]

    options = random.sample(wrong, 2)
    options.append(correct)

    random.shuffle(options)

    return {
        "ru": word["ru"],
        "correct": correct,
        "options": options
    }


# 📊 сохранить очки пользователя
@app.post("/save_score")
def save_score(data: dict):
    tg_id = str(data["tg_id"])
    score = int(data["score"])

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM users WHERE tg_id=?", (tg_id,))
    user = cur.fetchone()

    if user:
        best = max(user["best_score"], score)

        cur.execute("""
        UPDATE users
        SET score=?, best_score=?
        WHERE tg_id=?
        """, (score, best, tg_id))
    else:
        cur.execute("""
        INSERT INTO users (tg_id, score, best_score)
        VALUES (?, ?, ?)
        """, (tg_id, score, score))

    conn.commit()
    conn.close()

    return {"status": "ok"}


# 🏆 лидерборд
@app.get("/leaderboard")
def leaderboard():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
    SELECT tg_id, best_score
    FROM users
    ORDER BY best_score DESC
    LIMIT 10
    """)

    data = cur.fetchall()
    conn.close()

    return [{"tg_id": row["tg_id"], "best_score": row["best_score"]} for row in data]