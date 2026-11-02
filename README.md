# 🚀 ChatBoat — Modern Real-Time Live Chat Web Application

ChatBoat is a production-grade, full-stack, real-time live messaging platform inspired by WhatsApp Web, Discord, and Telegram. Built using React, Tailwind CSS, Node.js, Express, Socket.IO, and MongoDB, it delivers an ultra-smooth, responsive experience across desktop, tablet, and mobile devices.

---

## 🌟 Key Features

### 🔐 Authentication & Presence
- **Secure Registration & Login**: User authentication powered by JSON Web Tokens (JWT) and `bcryptjs` password hashing.
- **Persistent Sessions**: Automatic token hydration and reconnection on page refresh.
- **Real-Time Online Presence**: Live status indicators (`Active now`, `Away`, `Busy`, `Offline`, and `Last seen` timestamps) broadcast instantaneously via Socket.IO.
- **Custom Profile & Bio**: Editable full name, custom status messages (e.g. `Coding something cool 🚀`), and profile avatar uploads or presets.

### 💬 Real-Time Messaging & Chat System
- **1-to-1 Direct Messaging**: Private conversations with real-time socket delivery.
- **Group Channels**: Create and manage group conversations, assign admins, add members, and customize group descriptions and avatars.
- **Typing Indicators**: Live three-dot animated typing indicators (`Sarah is typing...`) synchronized in real time.
- **Message Read Receipts**:
  - `✓` Sent (single checkmark)
  - `✓✓` Delivered (double grey checkmark)
  - `✓✓` Read / Seen (double blue checkmark)
- **Message Replies**: Quote and reply to previous messages with one-click smooth scrolling to the original message.
- **Emoji Reactions**: Interactive emoji reaction tray (`👍`, `❤️`, `😂`, `😮`, `😢`, `🔥`) with real-time counts.
- **Media & File Sharing**:
  - Image uploads with inline preview and full-screen **Lightbox Zoom Modal**.
  - Document uploads (PDF, DOCX, ZIP, TXT) with file size indicators and direct download links.
- **Search Capabilities**:
  - Global conversation and contact search in the sidebar.
  - In-chat message text search to locate past discussions.
- **Message Deletion**: Support for `Delete for everyone` (with deleted message placeholder) and `Delete for me`.
- **Sound Notifications**: Pleasant, self-contained Web Audio API chime on new incoming messages with an in-app mute toggle.

### 🎨 UI/UX Design & Dashboard
- **Glassmorphic 3-Column Layout**:
  - **Left Sidebar**: Profile header, search bar, filter tabs (`All`, `Direct`, `Groups`, `Online`), active online contacts bar, and conversation list with unread counters.
  - **Center Chat Area**: Header with live status, message history with date dividers, reply bar, attachment preview, and expandable input field.
  - **Right Info Drawer**: Contact card, group members list (with admin badges), shared media gallery, and shared documents.
- **Dark & Light Mode**: Seamless theme switching with dark palette persistence.
- **Accent Color Themes**: Customizable accent colors (Indigo, Emerald, Violet, Rose, Sky Blue).
- **Fully Responsive**: Adapts fluidly from wide 4K screens to tablets and mobile devices with slide-over navigation and back buttons.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Tailwind CSS, Lucide Icons (`lucide-react`), Socket.IO Client, Axios, Vite |
| **Backend** | Node.js (ES Modules), Express.js, Socket.IO, Mongoose, Multer, JWT, Bcryptjs, CORS, Dotenv |
| **Database** | MongoDB (Local instance or MongoDB Atlas) |

---

## 📂 Project Structure

```
chatboat/
├── client/                     # Frontend React Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Avatar & shared UI components
│   │   │   ├── Sidebar/        # Left sidebar, tabs, search, online list
│   │   │   ├── ChatArea/       # Chat header, bubbles, typing dots, input
│   │   │   ├── RightSidebar/   # Contact details & media drawer
│   │   │   └── Modals/         # New chat, group creator, profile, lightbox
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Authentication & session state
│   │   │   ├── SocketContext.jsx # Socket.IO & audio notifications
│   │   │   ├── ChatContext.jsx   # Messages, conversations, typing
│   │   │   └── ThemeContext.jsx  # Dark/light mode & accent colors
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx     # Login with 1-click demo accounts
│   │   │   ├── RegisterPage.jsx  # Registration & avatar selector
│   │   │   └── ChatDashboard.jsx # Main 3-column dashboard
│   │   ├── styles/
│   │   │   └── index.css         # Tailwind & custom scrollbar styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Backend Node.js & Express API
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile
│   │   ├── userController.js     # Search users & directory
│   │   ├── conversationController.js # Direct & group chat management
│   │   └── messageController.js  # Messages, replies, reactions, reads
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT token verification
│   │   ├── uploadMiddleware.js   # Multer file storage
│   │   └── errorMiddleware.js    # Global error handlers
│   ├── models/
│   │   ├── User.js               # User schema & bcrypt hashing
│   │   ├── Conversation.js       # Conversation & group schema
│   │   └── Message.js            # Messages, reactions, attachments
│   ├── routes/                   # Express REST API routes
│   ├── socket/
│   │   └── socketHandler.js      # Socket.IO real-time event dispatcher
│   ├── uploads/                  # Uploaded images and documents
│   ├── seed.js                   # Demo database seeder
│   ├── server.js                 # HTTP & Socket.IO server entry point
│   ├── .env                      # Environment configuration
│   └── package.json
│
├── package.json                # Root package with helper scripts
└── README.md
```

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher)
- **MongoDB** (running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI)

### 2. Clone / Open Directory
```bash
cd chatboat
```

### 3. Install Dependencies
Run the installation command from the root directory:
```bash
npm run install:all
```
*(Or navigate into `server` and `client` individually and run `npm install`)*

### 4. Configure Environment Variables
- `server/.env`:
  ```env
  PORT=5000
  MONGO_URI=mongodb://127.0.0.1:27017/chatboat
  JWT_SECRET=supersecretjwtkey_chatboat_2026_modern_live_chat
  CLIENT_URL=http://localhost:5173
  NODE_ENV=development
  ```
- `client/.env`:
  ```env
  VITE_API_URL=http://localhost:5000
  ```

### 5. Seed Demo Data (Optional but Recommended)
Populate realistic users, direct chats, and a group conversation:
```bash
npm run seed
```
This sets up demo accounts with password `password123`:
- **Alex Morgan** (`alex` / `alex@chatboat.io`)
- **Sarah Connor** (`sarah` / `sarah@chatboat.io`)
- **David Miller** (`david` / `david@chatboat.io`)
- **Emily Watson** (`emily` / `emily@chatboat.io`)

### 6. Start the Backend Server
```bash
npm run server
```
The server will start on `http://localhost:5000`.

### 7. Start the Frontend Application
In a separate terminal:
```bash
npm run client
```
The client will start on `http://localhost:5173`. Open this URL in your browser!

---

## 🔌 API Reference

### Auth Endpoints (`/api/auth`)
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Login with username/email & password
- `GET /api/auth/me` — Fetch currently authenticated user
- `PUT /api/auth/profile` — Update user profile & status
- `POST /api/auth/logout` — Logout user and set status to offline

### Users Endpoints (`/api/users`)
- `GET /api/users` — Get all users in the directory
- `GET /api/users/search?q=:query` — Search users by name or username
- `GET /api/users/:id` — Get single user profile

### Conversations Endpoints (`/api/conversations`)
- `GET /api/conversations` — Get all conversations for current user
- `POST /api/conversations/direct` — Get or create 1-to-1 conversation
- `POST /api/conversations/group` — Create group conversation
- `GET /api/conversations/:id` — Get conversation details
- `PUT /api/conversations/:id` — Update group metadata
- `POST /api/conversations/:id/members` — Add members to group
- `POST /api/conversations/:id/leave` — Leave group
- `DELETE /api/conversations/:id` — Delete conversation history

### Messages Endpoints (`/api/messages`)
- `GET /api/messages/:conversationId` — Retrieve message history (supports `?search=:query`)
- `POST /api/messages` — Send a text or media message
- `PUT /api/messages/:conversationId/read` — Mark conversation messages as read
- `DELETE /api/messages/:id` — Delete message (`forEveryone` or `forMe`)
- `POST /api/messages/:id/react` — Add or toggle emoji reaction

### File Upload Endpoint (`/api/upload`)
- `POST /api/upload` — Upload single photo or document (up to 25MB)

---

## 📡 Socket.IO Real-Time Events

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `connection` | Client -> Server | Handshake Auth Token | Authenticates socket connection |
| `join_conversation` | Client -> Server | `conversationId` | Joins chat room |
| `send_message` | Client -> Server | `message` object | Broadcasts message to room & updates unread counts |
| `new_message` | Server -> Client | `message` object | Receives incoming message instantly |
| `typing` | Client -> Server | `{ conversationId }` | Emits typing state to chat room |
| `user_typing` | Server -> Client | `{ conversationId, user }` | Notifies recipient that a user is typing |
| `stop_typing` | Client -> Server | `{ conversationId }` | Clears typing indicator |
| `mark_read` | Client -> Server | `{ conversationId }` | Marks messages read and updates checkmarks to blue |
| `message_reaction` | Client -> Server | `{ conversationId, messageId, reactions }` | Synchronizes emoji reactions |
| `message_deleted` | Client -> Server | `{ conversationId, messageId, message }` | Updates deleted message bubble |
| `user_status_changed` | Server -> Client | `{ userId, status, lastSeen }` | Broadcasts user online/offline changes |

---

## 💻 Testing Real-Time Messaging Locally

To test real-time live messaging:
1. Open `http://localhost:5173` in your normal browser window and click **Alex** on the login page (or log in with `alex` / `password123`).
2. Open `http://localhost:5173` in an **Incognito / Private** window and log in as **Sarah** (`sarah` / `password123`).
3. Click on the conversation between Alex and Sarah.
4. Type in either window: notice the live typing indicator appears instantly in the other window.
5. Send a message: see instant delivery, read receipt checks turn blue, and hear the gentle audio chime!
6. Test sending photos, uploading documents, reacting with emojis, replying to messages, and switching dark/light themes.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
