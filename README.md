# Bingo Master 🎯

**An online multiplayer board game blending Bingo and Chess — a perfect middle ground between strategy and simplicity!**

---

## 📌 Table of Contents

* [How to setup project on local ](#-how-to-setup)
* [About the Game](#-about-the-game)
* [Why I Built This](#-why-i-built-this)
* [Tech Stack](#-tech-stack)
* [Key Features](#-key-features)
* [The UI Journey](#-the-ui-journey)
* [Play Now](https://bingo-master-ts.vercel.app/)

## live url
[https://bingo-master-ts.vercel.app/](https://bingo-master-ts.vercel.app/)

---

![Game Preview](/frontend/src/assets/aibattele.png)

---

## 🎮 How to setup 

As this repo includes both frontend and backend so you will have to install npm libraries in both folders 
**frontend setup**
```
cd frontend
```
```
npm install 
```

**for backend**
```
cd server
```
```
npm install 
```
Create a .env and update it with your postgres database connection details:
```
cp .env.sample .env
```

---

## 🎮 About the Game

**Bingo Master** is a thoughtfully interesting twist on the classic Bingo game — or as I like to call it, a blend of **Bingo and Chess**.

The game is simple and straightforward:

* You have a **5×5 board** with numbers from **1 to 25** arranged randomly.
* On your turn, you can **call out any number** of your choice. So can your opponent.
* The goal is to **cancel out 5 rows, columns, or diagonals** — any combination.
* The first player to complete five such lines scores a **Bingo** and **wins the game**!

This version is based on the **Bingo** I used to play in school. When I searched for Bingo online, I found versions that felt a bit odd compared to ours. So I thought — *why not just recreate the one we loved?*

---

## 🤔 Why I Built This

I've always wanted to build something using **WebSockets** — and this game was a perfect fit.

Sure, there are tons of tutorials for building games like **chess** or **tic-tac-toe**, but:

* **Chess** why would someone will play my version of chess if there are multiple opotions out there and  — not everyone can just jump in and play chess you first need to know how to play it .
* **Tic-tac-toe** is a bit too simple — more like a kid’s game.

**Bingo Master**, though, sits perfectly in the middle. It's strategic but approachable.
and this was the game that i used to play in my school when we had nothing in classroom we can't even go back to hostels and we dont have mobile phone now what lets play bingo and you wont belive we have filled almost intire notebook at a time just by these bingo boards it was a crase at that time. 
so its a nostalgic project as well.

> ⚠️ Warning: Long devlog ahead...
> But if you're here just to play the game, [**click here to start playing!**](#play-now)

---

## 🛠️ Tech Stack

* **PostgreSQL** for the database
* **Express.js** as the server framework
* **Node.js** for the backend
* **React** for the frontend
* Everything is written in **TypeScript**

### WebSockets (Not Socket.IO!)

Instead of using `socket.io`, which comes with built-in room functionality, I chose to use the native `ws` library. That meant I had to **implement room logic myself** — but honestly, it made more sense and felt more rewarding.

---

## ✨ Key Features

* 🔗 Real-time multiplayer gameplay using WebSockets
* 🎲 Randomized 5×5 boards every game
* 🧠 Strategic gameplay — not just luck!
* ✅ Room management built from scratch
* 📱 Responsive and mobile-friendly UI
* 🛡️ TypeScript throughout for better maintainability

---

## 🎨 The UI Journey

So here's the deal — the original version of this game **worked**, but the **UI was terrible**.
![ui update](/frontend/src/assets/uishift.png)

When I showed it to friends, their reaction was like:

> “Bro, this looks like it’s already broken.”

And I was like, *"Yeah, I know\..."*

It wasn’t that the game was bad — I just didn’t have a UI to model it on. There was no existing game exactly like this to copy or get design inspiration from. And let’s be honest — I’m not a designer.

But if you want to **look like a great developer**, the easiest trick is a **clean, trendy UI**. Because most people don’t care if you built it from scratch — unless they’re devs themselves.

So I went through **countless Dribbble shots** and mobile game designs. After tons of iteration, I finally came up with something that, while it might not be perfect, I personally find pleasing and a big step up from the old version.

---

## 🕹️ Play Now

> Ready to challenge your friend in a game of strategy and luck?

👉 **[Click here to play Bingo Master!](#)**
*(Insert your live link here)*

![Game Preview](/frontend/src/assets/mobiless.png)

---

## 🙌 Final Words

This project was both a **nostalgic trip** and a **technical challenge**. It combines:

* Childhood memories
* Real-time multiplayer tech
* A lot of UI/UX hustle

If you’re looking for a fun little game that sits right between chess and tic-tac-toe in terms of complexity — **Bingo Master** is for you.

---

Let me know if you want help making a live documentation site or deploying this on platforms like Vercel or Railway. I can help you set it up too.

![alt text](/frontend/src/assets/mobiless.png)