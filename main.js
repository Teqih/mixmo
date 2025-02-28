document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const createGameButton = document.getElementById('create-game');
    const joinGameButton = document.getElementById('join-game');
    const startGameButton = document.getElementById('start-game');
    const mixmoButton = document.getElementById('mixmo-button');
    const usernameInput = document.getElementById('username');
    const gameIdInput = document.getElementById('game-id');
    const gameIdDisplay = document.getElementById('game-id-display');
    const playersList = document.getElementById('players-list');
    const playerLetters = document.getElementById('player-letters');
    const directionControls = document.getElementsByName('direction');
    const socket = io();
    let currentGameId = null;
    let selectedCell = null;
    let direction = 'horizontal';
    let availableLetters = [];

    createGameButton.addEventListener('click', () => {
        const username = usernameInput.value;
        if (username) {
            socket.emit('createGame', username);
        } else {
            alert('Veuillez entrer un pseudo.');
        }
    });

    joinGameButton.addEventListener('click', () => {
        const username = usernameInput.value;
        const gameId = gameIdInput.value;
        if (username && gameId) {
            socket.emit('joinGame', { gameId, username });
            currentGameId = gameId; // Mise à jour de currentGameId lors de la jonction
        } else {
            alert('Veuillez entrer un pseudo et un ID de partie.');
        }
    });

    startGameButton.addEventListener('click', () => {
        console.log('Démarrage de la partie...');
        socket.emit('startGame', currentGameId);
    });

    mixmoButton.addEventListener('click', () => {
        socket.emit('mixmo', currentGameId);
    });

    socket.on('gameCreated', (gameId) => {
        currentGameId = gameId;
        gameIdDisplay.textContent = `ID de la partie: ${gameId}`;
        startGameButton.style.display = 'block';
        navigator.clipboard.writeText(gameId).then(() => {
            alert('ID de la partie copié dans le presse-papiers');
        }).catch(err => {
            console.error('Erreur lors de la copie de l\'ID de la partie dans le presse-papiers :', err);
        });
    });

    socket.on('gameJoined', (players) => {
        playersList.textContent = `Joueurs: ${players.join(', ')}`;
    });

    socket.on('playerJoined', (players) => {
        playersList.textContent = `Joueurs: ${players.join(', ')}`;
    });

    socket.on('gameStarted', (letters) => {
        console.log('La partie a commencé ! Lettres reçues :', letters);
        alert('La partie a commencé !');
        startGameButton.style.display = 'none';
        mixmoButton.style.display = 'block';
        availableLetters = letters;
        playerLetters.textContent = `Vos lettres: ${letters.join(', ')}`;
    });

    socket.on('newLetters', (letters) => {
        availableLetters.push(...letters);
        playerLetters.textContent = `Vos lettres: ${availableLetters.join(', ')}`;
    });

    directionControls.forEach(control => {
        control.addEventListener('change', (event) => {
            direction = event.target.value;
        });
    });

    gameBoard.addEventListener('click', (event) => {
        if (event.target.classList.contains('cell')) {
            if (selectedCell) {
                selectedCell.classList.remove('selected');
            }
            selectedCell = event.target;
            selectedCell.classList.add('selected');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (selectedCell && /^[a-zA-Z]$/.test(event.key)) {
            const letter = event.key.toUpperCase();
            const letterIndex = availableLetters.indexOf(letter);
            if (letterIndex !== -1) {
                if (selectedCell.textContent !== '') {
                    availableLetters.push(selectedCell.textContent);
                    playerLetters.textContent = `Vos lettres: ${availableLetters.join(', ')}`;
                }
                selectedCell.textContent = letter;
                selectedCell.classList.add('filled');
                availableLetters.splice(letterIndex, 1);
                playerLetters.textContent = `Vos lettres: ${availableLetters.join(', ')}`;
                if (direction === 'horizontal') {
                    selectedCell = selectedCell.nextElementSibling;
                } else {
                    const cellIndex = Array.from(gameBoard.children).indexOf(selectedCell);
                    selectedCell = gameBoard.children[cellIndex + 15];
                }
                if (selectedCell && selectedCell.classList.contains('cell')) {
                    selectedCell.classList.add('selected');
                }
            }
        } else if (selectedCell && event.key === 'Backspace') {
            if (selectedCell.textContent !== '') {
                availableLetters.push(selectedCell.textContent);
                playerLetters.textContent = `Vos lettres: ${availableLetters.join(', ')}`;
                selectedCell.textContent = '';
                selectedCell.classList.remove('filled');
            }
            if (direction === 'horizontal') {
                selectedCell = selectedCell.previousElementSibling;
            } else {
                const cellIndex = Array.from(gameBoard.children).indexOf(selectedCell);
                selectedCell = gameBoard.children[cellIndex - 15];
            }
            if (selectedCell && selectedCell.classList.contains('cell')) {
                selectedCell.classList.add('selected');
            }
        }
    });

    for (let i = 0; i < 225; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        gameBoard.appendChild(cell);
    }
});