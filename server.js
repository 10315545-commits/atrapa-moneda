const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const shopItems = [
  { id: 'avatar_anniv', type: 'avatar', name: 'Cumpleañero', emoji: '🎂', price: 0 },
  { id: 'avatar1', type: 'avatar', name: 'Clásico', emoji: '👤', price: 0 },
  { id: 'avatar2', type: 'avatar', name: 'Frío', emoji: '😎', price: 150 },
  { id: 'avatar3', type: 'avatar', name: 'Robot', emoji: '🤖', price: 200 },
  { id: 'avatar_witch', type: 'avatar', name: 'Bruja', emoji: '🧙', price: 250 },

  { id: 'skin_anniversary', type: 'skin', name: 'Anniversary Basket', emoji: '🎉', price: 0 },
  { id: 'skin1', type: 'skin', name: 'Clásica', emoji: '🧺', price: 0 },
  { id: 'skin2', type: 'skin', name: 'Fuego', emoji: '🔥', price: 220 },
  { id: 'skin3', type: 'skin', name: 'Mágica', emoji: '✨', price: 180 },
  { id: 'skin_pumpkin', type: 'skin', name: 'Calabaza', emoji: '🎃', price: 300 },

  { id: 'coin_gold', type: 'coin', name: 'Dorada', emoji: '🪙', price: 0 },
  { id: 'coin_diamond', type: 'coin', name: 'Diamante', emoji: '💎', price: 180 },
  { id: 'coin_fire', type: 'coin', name: 'Fuego', emoji: '🔥', price: 250 },
  { id: 'coin_ghost', type: 'coin', name: 'Fantasma', emoji: '👻', price: 320 },

  { id: 'trail_none', type: 'trail', name: 'Sin Trail', emoji: '🚫', price: 0 },
  { id: 'trail_rgb', type: 'trail', name: 'RGB', emoji: '🌈', price: 350 },
  { id: 'trail_witch', type: 'trail', name: 'Trail Mágico', emoji: '🧙', price: 400 }
];

const users = new Map();
const chatHistory = [
  { username: 'Sistema', text: 'Bienvenido al chat global.', system: true }
];

function makeUser(username) {
  return {
    username,
    coins: 100,
    inventory: ['avatar_anniv', 'avatar1', 'skin_anniversary', 'skin1', 'coin_gold', 'trail_none'],
    avatar: 'avatar_anniv',
    skin: 'skin_anniversary',
    coinSkin: 'coin_gold',
    trail: 'trail_none'
  };
}

function getUserData(socketId) {
  const user = users.get(socketId);
  return user ? { ...user } : null;
}

io.on('connection', (socket) => {
  socket.on('register', ({ username }) => {
    const safeName = String(username || 'Jugador').trim().slice(0, 18) || 'Jugador';

    if (!users.has(socket.id)) {
      users.set(socket.id, makeUser(safeName));
    } else {
      users.get(socket.id).username = safeName;
    }

    const user = users.get(socket.id);

    socket.emit('state', {
      me: user,
      shop: shopItems,
      chat: chatHistory,
      connected: [...users.values()].map(u => ({ username: u.username, coins: u.coins }))
    });

    io.emit('chat:new', {
      username: 'Sistema',
      text: `${safeName} se conectó.`,
      system: true
    });
  });

  socket.on('shop:buy', ({ itemId }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const item = shopItems.find(x => x.id === itemId);
    if (!item) return;

    const alreadyOwned = user.inventory.includes(itemId);
    if (alreadyOwned) {
      if (item.type === 'avatar') user.avatar = itemId;
      if (item.type === 'skin') user.skin = itemId;
      if (item.type === 'coin') user.coinSkin = itemId;
      if (item.type === 'trail') user.trail = itemId;

      socket.emit('shop:updated', { me: user });
      return;
    }

    if (user.coins < item.price) {
      socket.emit('shop:error', { message: 'No tienes suficientes monedas.' });
      return;
    }

    user.coins -= item.price;
    user.inventory.push(itemId);

    if (item.type === 'avatar') user.avatar = itemId;
    if (item.type === 'skin') user.skin = itemId;
    if (item.type === 'coin') user.coinSkin = itemId;
    if (item.type === 'trail') user.trail = itemId;

    socket.emit('shop:updated', { me: user });
    io.emit('shop:sync', {
      connected: [...users.values()].map(u => ({ username: u.username, coins: u.coins }))
    });
  });

  socket.on('chat:send', ({ text }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const trimmed = String(text || '').trim();
    if (!trimmed) return;

    const msg = {
      username: user.username,
      text: trimmed,
      system: false
    };

    chatHistory.push(msg);
    if (chatHistory.length > 80) chatHistory.shift();

    io.emit('chat:new', msg);
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (!user) return;

    io.emit('chat:new', {
      username: 'Sistema',
      text: `${user.username} salió del chat.`,
      system: true
    });

    users.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
