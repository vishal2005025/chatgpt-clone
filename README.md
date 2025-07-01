# 🧠 ChatGPT Clone – Full-Stack AI Assistant

A pixel-perfect, fully functional **ChatGPT clone** built with **Next.js**, **TypeScript**, **Vercel AI SDK**, **OpenAI** and **MongoDB**. Includes AI-powered image + text understanding, streaming responses, persistent chat memory, authentication, and more — 
---

## ✨ Features

✅ Pixel-perfect UI (based on original ChatGPT)  
✅ AI responses with **Vercel AI SDK** + **OpenRouter**  
✅ **Streaming responses** with loader and graceful updates  
✅ **Image uploads** with [Cloudinary](https://cloudinary.com/)  
✅ AI uses **text + image captioning** (via Hugging Face BLIP)  
✅ **Chat memory** powered by `mem0` (like GPT-4 w/ memory)  
✅ Title extraction using AI  
✅ Fully persistent data via **MongoDB**:
- ✅ `Users` (Google / Credentials)
- ✅ `Chats` (individual chat sessions)
- ✅ `Conversations` (messages)
✅ **Login / Signup** with **Google OAuth** and credentials  
✅ **Editable user messages** (with Cancel / Re-send)  
✅ **Context window handling** (long conversations handled)  
✅ **Conversation grouping**: _Today_, _Yesterday_, _30 Days Ago_  
✅ **Stop Generating** button to interrupt assistant  
✅ Copy messages functionality  
✅ **Drag-and-drop + preview** image support  
✅ Fully **responsive** and **ARIA-compliant** (accessible)  
✅ Uses Zustand for state management  
✅ Clean separation of frontend and backend  
✅ Production-ready deployment

---

## 🖥️ Tech Stack

| Layer        | Technology                                 |
|--------------|---------------------------------------------|
| Frontend     | Next.js (App Router) + TailwindCSS          |
| Backend      | Node.js + Express + MongoDB + Mongoose      |
| Auth         | JWT + Passport (Google OAuth)               |
| AI Provider  | OpenRouter via Vercel AI SDK                |
| Image Upload | Cloudinary                                  |
| Memory       | mem0 (context-aware memory management)      |
| Image Caption| Hugging Face BLIP (Free vision pipeline)    |
| State Mgmt   | Zustand (authStore + chatStore)             |

---

## 🚀 Live Links

- **Frontend**: https://chatgpt-clone-indol-omega.vercel.app  
- **Backend**: https://chatgpt-clone-rpgj.onrender.com

---

## 📦 Folder Structure

```
chatgpt-clone/
├── frontend/                 # Next.js app
│   ├── components/
│   ├── store/                # Zustand stores
│   ├── lib/                  # API config, helpers
│   ├── app/                  # Next.js routes and pages
│   └── ...
├── backend/                  # Node + Express API
│   ├── routes/               # Auth, Chat, Conversation
│   ├── controllers/
│   ├── middleware/
│   ├── models/               # User, Chat, Conversation
│   └── server.js             # Entry point
```

---

## 🛠️ Installation & Running Locally

### ⚙️ 1. Clone the repository

```bash
git clone https://github.com/vishal2005025/chatgpt-clone.git
cd chatgpt-clone
```

---

### 🧩 2. Setup Environment Variables

#### ➤ Frontend (`frontend/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
NEXT_PUBLIC_MEM0_API_KEY=your_mem0_key
NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key
```

#### ➤ Backend (`backend/.env`)
```env
MONGO_URI=mongodb+srv://your_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_secret
FRONTEND_URL=http://localhost:3000
```

---

### 🖥️ 3. Run Backend

```bash
cd backend
npm install
npm start
```

Runs on: `http://localhost:8000`

---

### 🌐 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on: `http://localhost:3000`

---

## ✅ How to Use

1. Signup or Login using **Google** or credentials.
2. Start a new chat, type a message or upload images.
3. Messages stream from the AI with smooth UI updates.
4. Click **Edit** on a message to modify and re-send.
5. Use the **Stop Generating** button to interrupt responses.
6. View conversations grouped by **Today**, **Yesterday**, etc.
7. All chats are saved to MongoDB and retrieved per user.

---

## 🧠 AI Response Handling

- Uses `generateStreamResponse()` for streaming responses.
- Falls back to alternate models using OpenRouter fallback logic.
- Captions images with **BLIP**, sends to LLM for context-aware replies.
- Memory integration with `mem0` to remember previous chat sessions.

---

## ⚠️ Important Notes

- Backend deployed on Render must use:
  - `Secure`, `SameSite=None` cookies for auth
  - CORS set to Vercel frontend domain
- Image upload uses [Cloudinary unsigned uploads](https://cloudinary.com/documentation/upload_images#unsigned_upload).
- All cookies are **HTTP-only secure JWTs**.

---

## 👨‍💻 Author

- Vishal Malyan  
  MERN Developer  
  [GitHub](https://github.com/vishal2005025) · [LinkedIn](https://linkedin.com/in/vishal-malyan)

---

## 📄 License

This project is licensed under the MIT License.
