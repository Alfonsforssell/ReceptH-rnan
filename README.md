# 🍽️ Recepthörnan

Recepthörnan is a full-stack recipe sharing web application built with HTML, CSS, JavaScript, and Deno.

Users can create an account, log in, publish their own recipes, edit or delete recipes they own, save favorite recipes from other users, and discover new dishes shared by the community.

This project is being developed as both a learning experience and a portfolio project, focusing on full-stack web development, REST APIs, and user authentication.

---

## ✨ Features

### User Accounts
- Register a new account
- Log in and log out
- Session-based authentication using cookies
- User profiles

### Recipes
- Create recipes
- Edit your own recipes
- Delete your own recipes
- Browse all recipes
- View recipe details

### Community
- Save favorite recipes
- Search recipes
- Filter recipes by category or dietary preferences

### Recipe Information
- Ingredients with units and amounts
- Adjustable servings with automatic ingredient scaling
- Step-by-step cooking instructions
- Cooking time
- Difficulty level
- Recipe images

---

## 🛠️ Built With

- HTML5
- CSS3
- JavaScript (ES6)
- Deno
- REST API
- JSON

---

## 📁 Project Structure

```
Recepthörnan/
│
├── data/
│   ├── users.json
│   ├── recipes.json
│   ├── favorites.json
│   └── sessions.json
│
├── public/
│   ├── css/
│   ├── js/
│   ├── images/
│   ├── index.html
│   ├── register.html
│   ├── home.html
│   ├── recipe.html
│   ├── profile.html
│   ├── create.html
│   ├── edit.html
│   └── favorites.html
│
└── server.js
```

---

## 🚀 Getting Started

Clone the repository

```bash
git clone https://github.com/yourusername/recepthornan.git
```

Start the server

```bash
deno run --allow-net --allow-read --allow-write server.js
```

Open your browser

```
http://localhost:8000
```

---

## 📌 Roadmap

- [ ] User authentication
- [ ] User profiles
- [ ] Recipe creation
- [ ] Recipe editing
- [ ] Recipe deletion
- [ ] Favorites
- [ ] Search
- [ ] Filters
- [ ] Ingredient scaling
- [ ] Comments
- [ ] Ratings
- [ ] Responsive design

---

## 🎯 Purpose

The goal of this project is to practice:

- Client-server architecture
- RESTful API development
- Asynchronous JavaScript
- User authentication
- CRUD operations
- DOM manipulation
- JSON data handling
- Responsive web design
- Full-stack application development

---

## 📄 License

This project is created for educational and portfolio purposes.

## 📈 Changelog

### v0.1.0
- Initial project setup
- Repository created