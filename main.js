document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const createGameButton = document.getElementById('create-game');
    const joinGameButton = document.getElementById('join-game');
    const startGameButton = document.getElementById('start-game');
    const mixmoButton = document.getElementById('mixmo-button');
    const quitGameButton = document.getElementById('quit-game');
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

    quitGameButton.addEventListener('click', () => {
        location.reload();
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
        quitGameButton.style.display = 'block';
        document.getElementById('controls').classList.add('hidden');
        document.getElementById('game-info').classList.add('hidden');
        document.getElementById('direction-controls').classList.remove('hidden');
        playerLetters.classList.remove('hidden');
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
            if (selectedCell) {
                updateDirectionArrow(selectedCell);
            }
        });
    });

    gameBoard.addEventListener('click', (event) => {
        if (event.target.classList.contains('cell')) {
            if (selectedCell) {
                selectedCell.classList.remove('selected');
                removeDirectionArrow(selectedCell);
            }
            if (selectedCell === event.target) {
                direction = direction === 'horizontal' ? 'vertical' : 'horizontal';
                updateDirectionArrow(selectedCell);
            } else {
                selectedCell = event.target;
                selectedCell.classList.add('selected');
                updateDirectionArrow(selectedCell);
            }
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
                    const nextCell = selectedCell.nextElementSibling;
                    if (nextCell && nextCell.classList.contains('cell')) {
                        selectedCell.classList.remove('selected');
                        removeDirectionArrow(selectedCell);
                        selectedCell = nextCell;
                        selectedCell.classList.add('selected');
                        updateDirectionArrow(selectedCell);
                    }
                } else {
                    const cellIndex = Array.from(gameBoard.children).indexOf(selectedCell);
                    const nextCell = gameBoard.children[cellIndex + 20];
                    if (nextCell && nextCell.classList.contains('cell')) {
                        selectedCell.classList.remove('selected');
                        removeDirectionArrow(selectedCell);
                        selectedCell = nextCell;
                        selectedCell.classList.add('selected');
                        updateDirectionArrow(selectedCell);
                    }
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
                const prevCell = selectedCell.previousElementSibling;
                if (prevCell && prevCell.classList.contains('cell')) {
                    selectedCell.classList.remove('selected');
                    removeDirectionArrow(selectedCell);
                    selectedCell = prevCell;
                    selectedCell.classList.add('selected');
                    updateDirectionArrow(selectedCell);
                }
            } else {
                const cellIndex = Array.from(gameBoard.children).indexOf(selectedCell);
                const prevCell = gameBoard.children[cellIndex - 20];
                if (prevCell && prevCell.classList.contains('cell')) {
                    selectedCell.classList.remove('selected');
                    removeDirectionArrow(selectedCell);
                    selectedCell = prevCell;
                    selectedCell.classList.add('selected');
                    updateDirectionArrow(selectedCell);
                }
            }
        }
    });

    const updateDirectionArrow = (cell) => {
        removeDirectionArrow(cell);
        if (!cell.textContent) {
            const arrow = document.createElement('div');
            arrow.classList.add('direction-arrow', direction);
            cell.appendChild(arrow);
        }
    };

    const removeDirectionArrow = (cell) => {
        const arrow = cell.querySelector('.direction-arrow');
        if (arrow) {
            cell.removeChild(arrow);
        }
    };

    for (let i = 0; i < 400; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        gameBoard.appendChild(cell);
    }
});