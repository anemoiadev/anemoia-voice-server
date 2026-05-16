const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// ⟡ Настройка радаров реального времени
const io = new Server(server, {
    cors: { origin: "*" }
});

const MONGO_URI = "";

mongoose.connect(MONGO_URI)
    .then(() => console.log('Квантовая связь с MongoDB установлена'))
    .catch(err => console.error('Критическая ошибка базы данных:', err));

const userSchema = new mongoose.Schema({
    cube_id: { type: String, required: true, unique: true },
    nickname: { type: String, required: true },
    avatar: { type: String, default: '' },
    status: { type: String, default: 'offline' },
    current_track: { type: Object, default: null }
});
const User = mongoose.model('User', userSchema);

io.on('connection', (socket) => {
    console.log('Новый агент подключился к коммутатору:', socket.id);

    socket.on('get-user', async (requestedId, callback) => {
        try {
            console.log(`Поиск агента в базе: ${requestedId}`);

            const user = await User.findOne({
                cube_id: { $regex: '^' + requestedId, $options: 'i' }
            });

            if (user) {
                callback({ success: true, profile: user });
                
            } else {
                callback({ success: false, message: 'Пользователь не найден' });
            }
        } catch (error) {
            callback({ success: false, message: 'Ошибка сервера' });
        }
    });

    socket.on('update-profile', async (userData) => {
        try {
            await User.findOneAndUpdate(
                { cube_id: userData.cube_id },
                userData,
                { upsert: true, new: true }
            );
            console.log(`Профиль обновлен в облаке: ${userData.nickname}`);
        } catch (e) {
            console.error('Ошибка обновления профиля:', e);
        }
    });

    socket.on('disconnect', () => {
        console.log('Потерян сигнал с пользователем:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер успешно запущен на порту ${PORT}`);
});
