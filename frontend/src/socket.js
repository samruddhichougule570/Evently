// This code is used for the shared Socket.io connection (one connection for the whole app).
import { io } from 'socket.io-client';

export const socket = io('http://localhost:5000', { withCredentials: true });
