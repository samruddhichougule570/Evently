# Evently — Event Management Platform

A full-stack MERN application for managing the complete lifecycle of an event — from listing and registration, through sessions, speakers, and payments, to QR-based attendance and post-event feedback.

> **Business problem it solves:** Manage event registration, participants, sessions, attendance, speakers, and post-event feedback — as one connected process, not a set of disconnected screens.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Demo Walkthrough](#demo-walkthrough)
- [Key Design Decisions](#key-design-decisions)
- [Scripts Reference](#scripts-reference)
- [Author](#author)

---

## Features

| Area | What it does |
|---|---|
| **Event registration** | Users browse upcoming events and register (free or paid). Seats are held with an atomic database check, so two people can't grab the last seat at once. |
| **Participants** | Admins see a full registrant list per event — name, email, ticket code, payment status. |
| **Sessions & speakers** | Each event can have multiple sessions, each with a speaker, start time, and end time. |
| **Attendance (QR check-in)** | Every registration doubles as a ticket with a unique QR code. Admins scan tickets at the door (camera, image upload, or manual code entry) to mark attendance in real time. |
| **Post-event feedback** | Registered attendees can leave a star rating + comment after the event; the event page shows the average rating. |
| **Payments** | Paid events go through **Razorpay** (test or live mode) if API keys are configured, with a built-in simulated "demo gateway" fallback so the app always works out of the box. |
| **Auth & roles** | JWT-based authentication with `user` / `admin` roles. Passwords are validated (length, upper/lower case, number, special character) on both client and server. |
| **Live seat updates** | Socket.io pushes live seat-count updates to every connected browser as people register. |

---

## Tech Stack

**Frontend**
- React 19 (Vite)
- React Router v7
- Tailwind CSS v4
- Axios
- Socket.io Client
- `qrcode.react` (generating ticket QR codes)
- `html5-qrcode` (scanning tickets at check-in)
- Lucide React (icons)

**Backend**
- Node.js + Express 5
- MongoDB with Mongoose
- JWT (`jsonwebtoken`) + `bcryptjs` for authentication
- Multer for event image uploads
- Razorpay SDK for payments
- Socket.io for live seat updates

**Architecture:** MVC (`models/`, `controllers/`, `routes/`, `middleware/`) on the backend; component/page structure on the frontend. Validation and "past event" rules are intentionally duplicated on both the client (fast UX feedback) and the server (the real source of truth).

---

## Project Structure

```
FEWT2/
├── backend/
│   ├── config/
│   │   └── db.js                      # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   ├── feedbackController.js
│   │   ├── messageController.js
│   │   ├── paymentController.js
│   │   └── registrationController.js
│   ├── middleware/
│   │   ├── authMiddleware.js          # protect / admin route guards
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── Event.js
│   │   ├── Feedback.js
│   │   ├── Message.js
│   │   ├── Registration.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── feedbackRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── registrationRoutes.js
│   ├── utils/
│   │   ├── dates.js                   # shared "is this event past?" rule
│   │   ├── razorpay.js                # Razorpay client + signature verification
│   │   ├── ticket.js                  # unique QR ticket code generator
│   │   └── validators.js              # email/password validation rules
│   ├── .env.example
│   ├── seed.js                        # populates demo data
│   └── server.js                      # app entry point
│
└── frontend/
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── assets/                    # event placeholder images
        ├── components/
        │   ├── EventCard.jsx
        │   ├── Navbar.jsx
        │   ├── PaymentModal.jsx       # demo payment gateway UI
        │   ├── ProtectedRoute.jsx
        │   ├── SupportWidget.jsx      # WhatsApp-style floating support button
        │   └── TicketQR.jsx
        ├── context/
        │   └── AuthContext.jsx        # JWT session state
        ├── hooks/
        │   ├── useDebounce.js
        │   └── useSeatUpdates.js      # live seat count via Socket.io
        ├── pages/
        │   ├── About.jsx
        │   ├── AdminDashboard.jsx
        │   ├── CheckIn.jsx            # admin QR scanner
        │   ├── Contact.jsx
        │   ├── EventDetails.jsx
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   ├── MyEvents.jsx
        │   └── Register.jsx
        ├── utils/
        │   ├── dates.js
        │   ├── razorpay.js            # loads the Razorpay checkout script
        │   └── validators.js
        ├── App.jsx
        ├── main.jsx
        ├── socket.js                  # Socket.io client setup
        └── index.css
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- A MongoDB instance — local (`mongod`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Clone and install

```bash
git clone https://github.com/samruddhichougule570/Evently.git
cd Evently

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

### 3. Seed demo data (recommended)

```bash
cd backend
npm run seed
```

This creates:
- An **admin** account (`admin@example.com`)
- A couple of **attendee** accounts (`demo@example.com`, `guest@example.com`)
- A mix of **past** and **upcoming** events, complete with sessions, speakers, registrations, and feedback — so the app has something to show immediately.

(All demo passwords are `password123` unless overridden by `SEED_PASSWORD`.)

### 4. Run the app

In two separate terminals:

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

In `backend/`, copy the example file:

```bash
cp .env.example .env
```

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/eventdb
JWT_SECRET=replace_with_a_long_random_string
FRONTEND_URL=http://localhost:5173

# Optional — leave blank to use the built-in demo payment gateway instead
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Optional — password for the seeded demo accounts (defaults to password123)
SEED_PASSWORD=
```

---

## Demo Walkthrough

1. **Browse events** on the home page — upcoming events show live seat counts and a Register button; past events show a "Registration Closed" state with no booking option.
2. **Register** for a free or paid event (paid events use the demo payment gateway unless Razorpay keys are set). You'll receive a **QR ticket** under *My Events*.
3. **Log in as admin** → **Admin Dashboard** → open an event's participant list to see everyone registered.
4. **Admin Dashboard → QR Check-in** → scan (or upload/type) a ticket code to mark that attendee as present in real time.
5. After an event's date has passed, a registered attendee can leave **feedback** (rating + comment) on the event's detail page.

---

## Key Design Decisions

- **Registration = Participants + Attendance.** Rather than a separate "Attendance" collection, attendance is a boolean + timestamp on the same `Registration` document — a participant's attendance is a property of their registration, not a separate business concept.
- **Sessions & speakers are embedded**, not a separate collection, since they're structural details of one event rather than an independent entity.
- **Payments never trust the browser.** The entry fee is read from the database when creating a Razorpay order, and the payment signature is verified server-side before a ticket is ever issued.
- **Seat claims are atomic** (`findOneAndUpdate` with a capacity check) to prevent overselling when multiple users register for the last seat simultaneously.
- **Graceful payment fallback.** The app checks at runtime whether Razorpay keys are configured; if not, it uses a safe simulated "demo gateway" so the full registration flow always works, even without a Razorpay account.

---

## Scripts Reference

| Location | Command | Description |
|---|---|---|
| `backend/` | `npm run dev` | Start the backend with auto-restart on file changes |
| `backend/` | `npm start` | Start the backend (no auto-restart) |
| `backend/` | `npm run seed` | Wipe and repopulate the database with demo data |
| `frontend/` | `npm run dev` | Start the Vite dev server |
| `frontend/` | `npm run build` | Production build (outputs to `frontend/dist`) |
| `frontend/` | `npm run lint` | Run ESLint over the frontend source |

---

## Author

**Samruddhi Dilip Chougule** — Full Stack MERN Developer
