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

// ==========================================
// ⟡ 1. ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ (ОБЛАКО)
// ==========================================
// Добавлена база /anemoia перед знаком вопроса
const MONGO_URI = "mongodb://efebogurc2929_db_user:AnVQuSXVZQnK4dEy@ac-3ldkvxq-shard-00-00.tndk8hd.mongodb.net:27017,ac-3ldkvxq-shard-00-01.tndk8hd.mongodb.net:27017,ac-3ldkvxq-shard-00-02.tndk8hd.mongodb.net:27017/anemoia?ssl=true&replicaSet=atlas-gjwo2g-shard-0&authSource=admin&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log('💠 Квантовая связь с MongoDB установлена'))
    .catch(err => console.error('Критическая ошибка базы данных:', err));

// ==========================================
// ⟡ 2. СХЕМА ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ (ЧЕРТЕЖ)
// ==========================================
const userSchema = new mongoose.Schema({
    cube_id: { type: String, required: true, unique: true }, 
    nickname: { type: String, required: true },              
    avatar: { type: String, default: '' },                   
    status: { type: String, default: 'offline' },            
    current_track: { type: Object, default: null }           
});
const User = mongoose.model('User', userSchema);

// ==========================================
// ⟡ 3. ЛОГИКА СИНДИКАТА (SOCKET.IO)
// ==========================================
io.on('connection', (socket) => {
    console.log('⚡ Новый агент подключился к коммутатору:', socket.id);

    // --- ПОИСК ПРОФИЛЯ ---
    socket.on('get-user', async (requestedId, callback) => {
        try {
            console.log(`Поиск агента в базе: ${requestedId}`);
            const user = await User.findOne({ cube_id: requestedId });

            if (user) {
                callback({ success: true, profile: user });
            } else {
                callback({ success: false, message: 'Пользователь не найден' });
            }
        } catch (error) {
            callback({ success: false, message: 'Ошибка сервера' });
        }
    });

    // --- РЕГИСТРАЦИЯ ИЛИ ОБНОВЛЕНИЕ ---
    // Тот самый блок, который вы просили вставить:
    socket.on('update-profile', async (userData) => {
        try {
            await User.findOneAndUpdate(
                { cube_id: userData.cube_id },
                userData,
                { upsert: true, new: true } 
            );
            console.log(`✅ Профиль обновлен в облаке: ${userData.nickname}`);
        } catch (e) { 
            console.error('Ошибка обновления профиля:', e); 
        }
    });

    socket.on('disconnect', () => {
        console.log('Потерян сигнал с агентом:', socket.id);
    });
});

// Запуск коммутатора
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[СИНДИКАТ] Сервер успешно запущен на порту ${PORT}`);
});
