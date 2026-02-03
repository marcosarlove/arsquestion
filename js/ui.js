const UI = (() => {
    const appContainer = document.getElementById('app');

    const renderScreen = (htmlContent) => {
        appContainer.innerHTML = htmlContent;
    };

    const renderStartScreen = (availableCategories, onStartGame) => {
        let categoriesHtml = '';
        availableCategories.forEach(cat => {
            categoriesHtml += `
                <div class="relative">
                    <input type="checkbox" id="cat-${cat.file}" value="${cat.file}" class="category-checkbox sr-only peer" checked>
                    <label for="cat-${cat.file}" class="flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border-2 border-white/10 bg-white/5 backdrop-blur-sm peer-checked:border-amber-500 peer-checked:bg-amber-500/10 transition-all duration-200 cursor-pointer hover:bg-white/10 peer-checked:text-amber-300 text-slate-300">
                        <span class="text-base font-bold">${cat.name}</span>
                        <span class="text-xs text-slate-400 peer-checked:text-amber-500">${cat.subcategory}</span>
                        <div class="absolute top-2 right-2 peer-checked:block hidden">
                            <svg class="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                        </div>
                    </label>
                </div>
            `;
        });

        const modalHtml = `
            <div id="categoryModal" class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 hidden">
                <div class="bg-slate-900 border border-white/10 p-6 rounded-2xl max-w-lg w-full shadow-2xl animate-slide-up">
                    <h3 class="text-lg font-bold text-white mb-4">Selecione as Categorias</h3>
                    <div class="grid grid-cols-2 gap-3 text-left mb-4">
                        ${categoriesHtml}
                    </div>
                    <button id="closeModalBtn" class="w-full py-2 rounded-lg bg-amber-500 text-slate-950 font-bold">Confirmar</button>
                </div>
            </div>
        `;

        const startScreenHtml = `
            <div class="h-screen w-screen flex flex-col items-center justify-center p-4 bg-[#020617] relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-slate-900/40 to-fuchsia-900/30 pointer-events-none opacity-50 animate-move-gradient"></div>
                <div class="relative z-10 text-center w-full max-w-md space-y-6">
                    <div class="space-y-1">
                        <h1 class="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-400 to-amber-700 drop-shadow-xl italic tracking-tighter">
                            ARSQuestion
                        </h1>
                        <p class="text-blue-400 font-bold tracking-[0.3em] uppercase text-[10px] md:text-xs">Powered by Marcos Arlove</p>
                    </div>
                    <div class="bg-white/5 backdrop-blur-md p-6 md:p-8 rounded-[32px] border border-white/10 shadow-2xl flex flex-col gap-4">
                        <div class="text-center">
                            <p class="text-slate-400 text-sm">Categorias Selecionadas:</p>
                            <p id="selectionCount" class="text-white font-bold text-lg">${availableCategories.length}</p>
                            <button id="openModalBtn" class="mt-2 text-sm text-amber-400 hover:text-amber-300 font-semibold">Alterar Seleção</button>
                        </div>
                        <button id="startGameBtn" class="w-full py-3 text-sm rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all">Iniciar Jogo</button>
                    </div>
                </div>
                ${modalHtml}
            </div>
        `;
        renderScreen(startScreenHtml);

        const openModalBtn = document.getElementById('openModalBtn');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const categoryModal = document.getElementById('categoryModal');
        const selectionCount = document.getElementById('selectionCount');
        const checkboxes = document.querySelectorAll('.category-checkbox');

        const updateSelectionCount = () => {
            const count = document.querySelectorAll('.category-checkbox:checked').length;
            selectionCount.textContent = `${count}`;
        };

        openModalBtn.addEventListener('click', () => categoryModal.classList.remove('hidden'));
        closeModalBtn.addEventListener('click', () => categoryModal.classList.add('hidden'));
        checkboxes.forEach(cb => cb.addEventListener('change', updateSelectionCount));

        document.getElementById('startGameBtn').addEventListener('click', () => {
            const selectedCategoryCheckboxes = document.querySelectorAll('.category-checkbox:checked');
            const selectedCategoryFiles = Array.from(selectedCategoryCheckboxes).map(cb => cb.value);
            if (selectedCategoryFiles.length === 0) {
                alert('Por favor, selecione pelo menos uma categoria.');
                return;
            }
            onStartGame(selectedCategoryFiles);
        });
    };

    const renderLoadingScreen = (message = "Carregando...") => {
        const loadingHtml = `
            <div class="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 p-6">
                <div class="relative w-24 h-24 mb-6">
                    <div class="absolute inset-0 border-4 border-slate-900 rounded-full"></div>
                    <div class="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h2 class="text-xl font-bold text-blue-100 animate-pulse">${message}</h2>
            </div>
        `;
        renderScreen(loadingHtml);
    };

    const renderQuestionScreen = (question, gameState, onAnswer, onUseLifeline, onBack) => {
        // Determine current difficulty level and progress within it
        let currentLevelName = 'Fácil';
        let levelStartIndex = 0;
        let questionsInLevel = 0;
        let questionsCompletedInLevel = 0;

        if (gameState.currentQuestionIndex >= gameState.difficultyStarts.hard) {
            currentLevelName = 'Difícil';
            levelStartIndex = gameState.difficultyStarts.hard;
            questionsInLevel = gameState.difficultyCounts.hard;
        } else if (gameState.currentQuestionIndex >= gameState.difficultyStarts.medium) {
            currentLevelName = 'Médio';
            levelStartIndex = gameState.difficultyStarts.medium;
            questionsInLevel = gameState.difficultyCounts.medium;
        } else {
            currentLevelName = 'Fácil';
            levelStartIndex = gameState.difficultyStarts.easy;
            questionsInLevel = gameState.difficultyCounts.easy;
        }
        
        questionsCompletedInLevel = gameState.currentQuestionIndex - levelStartIndex;
        const progressPercentage = questionsInLevel > 0 ? ((questionsCompletedInLevel + 1) / questionsInLevel) * 100 : 0;

        const getProgressColor = () => {
            if (currentLevelName === 'Fácil') return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]';
            if (currentLevelName === 'Médio') return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]';
            return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]';
        };

        const prizeLadderHtml = gameState.prizeLadder.map((val, idx) => {
            const level = idx + 1;
            if (val === 0) return ''; // Don't show the 0 prize
            const isActive = gameState.score === idx;
            const isPassed = gameState.score > idx;
            return `
                <div class="flex justify-between items-center px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isActive ? 'bg-amber-500 text-slate-950 scale-105 shadow-md z-10 translate-x-1' : isPassed ? 'text-blue-400/30' : 'text-slate-600'}">
                    <span>${level.toString().padStart(2, '0')}</span>
                    <span>${val}</span>
                </div>
            `;
        }).reverse().join('');

        const optionsHtml = question.options.map((option, index) => {
            const isHidden = gameState.removedOptions && gameState.removedOptions.includes(index);
            return `
                <button 
                    class="w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 text-sm md:text-base font-semibold ${isHidden ? 'opacity-0 pointer-events-none' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-700/70 hover:border-amber-500'}"
                    data-index="${index}"
                    ${isHidden ? 'disabled' : ''}
                >
                    <span class="font-black text-amber-400 mr-2">${String.fromCharCode(65 + index)}</span> ${option}
                </button>
            `;
        }).join('');

        const questionScreenHtml = `
            <div class="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden relative">
                <div class="w-full h-1 bg-slate-900"><div class="h-full transition-all duration-700 ease-out ${getProgressColor()}" style="width: ${progressPercentage}%"></div></div>

                <div class="flex flex-1 overflow-hidden">
                    <aside class="hidden lg:flex w-64 bg-slate-900/30 border-r border-white/5 flex-col p-6 overflow-hidden">
                        <div class="mb-6">
                            <h1 class="text-lg font-black text-white italic leading-tight tracking-tighter">ARSQuestion</h1>
                            <p class="text-[8px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">Powered by Marcos Arlove</p>
                        </div>
                        <div class="flex-1 overflow-y-auto no-scrollbar flex flex-col-reverse gap-1 pr-2">
                            ${prizeLadderHtml}
                        </div>
                    </aside>

                    <div class="flex-1 flex flex-col overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                        <header class="px-4 py-3 flex justify-between items-center border-b border-white/5 bg-slate-950/80 backdrop-blur shrink-0">
                            <div class="flex items-center gap-3">
                                <button id="backBtn" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all active:scale-90">
                                    <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <div class="flex items-center gap-3 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                                    <span>NÍVEL ${currentLevelName.toUpperCase()}</span> <div class="w-1 h-1 rounded-full bg-slate-800"></div> <span>${questionsCompletedInLevel + 1} / ${questionsInLevel}</span>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="bg-slate-900/50 px-3 py-1 rounded-lg border border-white/5 text-right">
                                    <p class="text-slate-500 text-[7px] font-bold uppercase tracking-widest leading-none mb-0.5">VALENDO</p>
                                    <p class="text-white font-black text-sm md:text-base leading-none">${gameState.prizeLadder[gameState.score + 1] || gameState.prizeLadder[gameState.prizeLadder.length - 1]}</p>
                                </div>
                            </div>
                        </header>

                        <main class="flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto">
                            <div class="w-full max-w-2xl text-center animate-slide-up">
                                <h2 class="text-2xl md:text-3xl font-bold text-slate-100 mb-6">${question.question}</h2>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    ${optionsHtml}
                                </div>
                                
                                <footer class="px-4 py-4 md:py-6 flex justify-center gap-4 md:gap-10 shrink-0 mt-8">
                                    <button id="lifeline-fiftyFifty" ${gameState.lifelines.fiftyFifty ? '' : 'disabled'} class="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex flex-col items-center justify-center text-[8px] font-black border transition-all duration-300 ${gameState.lifelines.fiftyFifty ? 'border-blue-500/30 bg-blue-500/5 text-blue-400 hover:scale-105 active:scale-95' : 'border-slate-800 bg-slate-900/50 text-slate-700 cursor-not-allowed grayscale'}">
                                        <span class="text-base md:text-lg mb-0.5">50:50</span>
                                    </button>
                                    <button id="lifeline-skip" ${gameState.lifelines.skip ? '' : 'disabled'} class="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex flex-col items-center justify-center text-[8px] font-black border transition-all duration-300 ${gameState.lifelines.skip ? 'border-amber-500/30 bg-amber-500/5 text-amber-400 hover:scale-105 active:scale-95' : 'border-slate-800 bg-slate-900/50 text-slate-700 cursor-not-allowed grayscale'}">
                                        <span class="text-base md:text-lg mb-0.5">PULAR</span>
                                    </button>
                                    <button id="lifeline-hint" ${gameState.lifelines.hint ? '' : 'disabled'} class="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex flex-col items-center justify-center text-[8px] font-black border transition-all duration-300 ${gameState.lifelines.hint ? 'border-green-500/30 bg-green-500/5 text-green-400 hover:scale-105 active:scale-95' : 'border-slate-800 bg-slate-900/50 text-slate-700 cursor-not-allowed grayscale'}">
                                        <span class="text-base md:text-lg mb-0.5">DICA</span>
                                    </button>
                                </footer>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        `;
        renderScreen(questionScreenHtml);

        document.getElementById('backBtn').addEventListener('click', onBack);

        const answerButtons = document.querySelectorAll('[data-index]');

        answerButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const selectedButton = event.currentTarget;
                const selectedIndex = parseInt(selectedButton.dataset.index);

                // Disable all buttons to prevent multiple clicks
                answerButtons.forEach(btn => {
                    btn.disabled = true;
                    btn.classList.remove('hover:bg-slate-700/70', 'hover:border-amber-500');
                });

                // Highlight the selected button immediately
                selectedButton.classList.remove('border-slate-700', 'bg-slate-800/50');
                selectedButton.classList.add('border-blue-500', 'bg-blue-900/50', 'scale-105');

                // Wait a very short moment for the visual feedback to register before proceeding
                setTimeout(() => {
                    onAnswer(selectedIndex);
                }, 300);
            });
        });

        const setupLifelineListener = (id, lifelineType) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', () => {
                    if (button.disabled) return;
                    button.classList.add('animate-use-lifeline');
                    onUseLifeline(lifelineType);
                });
            }
        };

        setupLifelineListener('lifeline-hint', 'hint');
        setupLifelineListener('lifeline-fiftyFifty', 'fiftyFifty');
        setupLifelineListener('lifeline-skip', 'skip');
    };

    const renderFeedbackScreen = (isCorrect, question, onContinue) => {
        const gameState = Game.getGameState();
        const title = isCorrect ? 'CERTO!' : 'Incorreto!';
        const titleColor = isCorrect ? 'text-amber-500' : 'text-red-500';
        const bgColor = isCorrect ? 'bg-amber-500/5' : 'bg-red-500/5';
        const buttonColor = isCorrect ? 'bg-amber-500 text-slate-950' : 'bg-red-500 text-white';
        const hintText = isCorrect ? question.hintCorrect : question.hintWrong;
        
        // NOTE: Prize penalty logic is not implemented in Game.js yet.
        // For now, on wrong answer, we show the prize the user had before answering.
        const prize = isCorrect ? gameState.currentPrize : gameState.prizeLadder[gameState.score];

        const feedbackHtml = `
            <div class="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 overflow-hidden text-center p-6 relative">
                <div class="absolute inset-0 ${bgColor} animate-pulse"></div>
                <div id="feedbackContainer" class="animate-zoom-in-glow z-10 flex flex-col items-center max-w-2xl w-full">
                   <h2 class="text-6xl md:text-9xl font-black ${titleColor} italic mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">${title}</h2>
                   <p class="text-slate-400 uppercase tracking-[0.6em] text-[10px] md:text-xs mb-4">Pontos</p>
                   <div class="relative mb-6">
                     <div class="absolute -inset-4 bg-white/10 blur-2xl rounded-full"></div>
                     <p class="text-5xl md:text-8xl font-black text-white relative">${prize}</p>
                   </div>
                   <div class="bg-black/20 p-4 rounded-lg mb-6">
                        <p class="text-slate-300 text-base">${hintText}</p>
                   </div>
                   <button id="continueBtn" class="w-full max-w-sm py-3 rounded-lg ${buttonColor} font-bold hover:opacity-90 transition-all">Continuar</button>
                </div>
            </div>
        `;
        renderScreen(feedbackHtml);
        document.getElementById('continueBtn').addEventListener('click', onContinue);
    };

    const renderGameOverScreen = (gameState) => {
        let summaryHtml = '';
        if (gameState.wrongAnswers.length > 0) {
            summaryHtml += '<h4 class="text-lg font-bold text-slate-300 mt-8 mb-3">Perguntas que você errou:</h4>';
            summaryHtml += '<div class="text-left text-sm space-y-3 max-h-40 overflow-y-auto no-scrollbar p-3 bg-black/20 rounded-lg">';
            gameState.wrongAnswers.forEach(q => {
                const correctAnswerText = q.options[q.correctAnswerIndex];
                summaryHtml += `
                    <div>
                        <p class="font-semibold text-slate-400">${q.question}</p>
                        <p class="text-green-400">Resposta correta: <span class="font-bold">${correctAnswerText}</span></p>
                    </div>
                `;
            });
            summaryHtml += '</div>';
        }

        const gameOverHtml = `
            <div class="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center overflow-hidden">
                <div class="p-8 md:p-12 rounded-[40px] border border-red-500/20 bg-red-950/10 backdrop-blur-xl shadow-2xl max-w-lg w-full animate-slide-up">
                    <h2 class="text-4xl md:text-6xl font-black mb-4 italic text-red-500">FIM DO JOGO</h2>
                    <div class="mb-6 p-4 bg-white/5 rounded-2xl italic text-sm font-light leading-relaxed text-slate-300">
                        "Não desanime. Cada erro é um degrau no aprendizado."
                        <p class="mt-2 text-[8px] font-bold text-slate-500 uppercase">— Marcos Arlove</p>
                    </div>
                    <p class="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Pontuação Final</p>
                    <p class="text-3xl md:text-4xl font-black text-white mb-8">${gameState.currentPrize}</p>
                    
                    ${summaryHtml}

                    <div class="grid grid-cols-1 gap-3 mt-8">
                        <button id="restartGameBtn" class="py-3 text-sm rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all">Jogar Novamente</button>
                        <button id="mainMenuBtn" class="py-3 text-sm rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-all">Menu Principal</button>
                    </div>
                </div>
            </div>
        `;
        renderScreen(gameOverHtml);
        document.getElementById('restartGameBtn').addEventListener('click', () => window.location.reload());
        document.getElementById('mainMenuBtn').addEventListener('click', () => window.location.reload());
    };


    const renderHintModal = (hint) => {
        const existingModal = document.getElementById('hintModalContainer');
        if (existingModal) existingModal.remove();

        const modalHtml = `
            <div id="hintModalContainer" class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                <div class="bg-slate-800 border border-blue-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-slide-up">
                    <h4 class="font-black text-blue-400 uppercase text-sm tracking-widest mb-2">Dica</h4>
                    <p class="text-blue-100/80 text-base font-light leading-snug mb-4">${hint}</p>
                    <button id="closeHintBtn" class="w-full py-2 rounded-lg bg-blue-600 text-white font-bold">Entendi</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const closeButton = document.getElementById('closeHintBtn');
        const modalContainer = document.getElementById('hintModalContainer');

        const closeModal = () => modalContainer.remove();
        closeButton.addEventListener('click', closeModal);
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) closeModal();
        });
    };

    return {
        renderStartScreen,
        renderLoadingScreen,
        renderQuestionScreen,
        renderFeedbackScreen,
        renderGameOverScreen,
        renderHintModal
    };
})();
