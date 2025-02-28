const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const games = {};
const letterDistribution = {
    'A': 18, 'E': 30, 'I': 16, 'O': 12, 'U': 12, 'Y': 2,
    'B': 4, 'C': 4, 'D': 6, 'F': 4, 'G': 4, 'H': 4, 'J': 2, 'K': 2,
    'L': 10, 'M': 6, 'N': 12, 'P': 4, 'Q': 2, 'R': 12, 'S': 12, 'T': 12,
    'V': 4, 'W': 2, 'X': 2, 'Z': 2
};
let letterBag = [];

const initializeLetterBag = () => {
    letterBag = [];
    for (const [letter, count] of Object.entries(letterDistribution)) {
        for (let i = 0; i < count; i++) {
            letterBag.push(letter);
        }
    }
    console.log('Sac de lettres initialisé:', letterBag);
};

const drawLetters = (count) => {
    const drawnLetters = [];
    for (let i = 0; i < count; i++) {
        if (letterBag.length === 0) break;
        const randomIndex = Math.floor(Math.random() * letterBag.length);
        drawnLetters.push(letterBag.splice(randomIndex, 1)[0]);
    }
    console.log(`Lettres tirées (${count}):`, drawnLetters);
    return drawnLetters;
};

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('createGame', (username) => {
        const gameId = uuidv4();
        games[gameId] = { players: [{ id: socket.id, username, letters: [] }], creator: socket.id };
        socket.join(gameId);
        socket.emit('gameCreated', gameId);
        io.to(gameId).emit('gameJoined', games[gameId].players.map(player => player.username));
    });

    socket.on('joinGame', ({ gameId, username }) => {
        if (games[gameId]) {
            games[gameId].players.push({ id: socket.id, username, letters: [] });
            socket.join(gameId);
            io.to(gameId).emit('playerJoined', games[gameId].players.map(player => player.username));
        } else {
            socket.emit('error', 'Partie non trouvée.');
        }
    });

    socket.on('startGame', (gameId) => {
        console.log('Tentative de démarrage de la partie pour le jeu ID:', gameId);
        if (games[gameId] && games[gameId].creator === socket.id) {
            initializeLetterBag();
            games[gameId].players.forEach(player => {
                player.letters = drawLetters(6);
            });
            games[gameId].players.forEach(player => {
                io.to(player.id).emit('gameStarted', player.letters);
            });
            console.log('Partie démarrée pour le jeu ID:', gameId);
        } else {
            socket.emit('error', 'Vous n\'êtes pas le créateur de la partie.');
            console.log('Erreur: Tentative de démarrage de la partie par un non-créateur.');
        }
    });

    socket.on('mixmo', (gameId) => {
        console.log('Tentative de mixmo pour le jeu ID:', gameId);
        if (games[gameId]) {
            games[gameId].players.forEach(player => {
                // player.letters.push(...drawLetters(2));
                io.to(player.id).emit('newLetters', drawLetters(2));
            });
        } else {
            socket.emit('error', 'Partie non trouvée.');
            console.log('Erreur: Tentative de mixmo pour un jeu non trouvé.');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
