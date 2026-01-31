
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Difficulty, PRIZE_VALUES, Question } from './types';
import { generateQuestion } from './services/geminiService';
import Button from './components/Button';
import QuestionCard from './components/QuestionCard';

const STORAGE_KEY = 'gramatica_milhao_state_v2';

const INITIAL_STATE: GameState = {
  status: 'START',
  currentLevel: 1,
  difficulty: Difficulty.BASIC,
  question: null,
  score: 0,
  isPracticeMode: false,
  usedLifelines: {
    fiftyFifty: false,
    skip: false,
    hint: false,
  }
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [loadingMsg, setLoadingMsg] = useState('Preparando...');
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GameState;
        if (['PLAYING', 'TRANSITION', 'LOADING'].includes(parsed.status)) {
          setHasSavedGame(true);
        }
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!['START', 'WON', 'LOST'].includes(gameState.status)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } else if (['WON', 'LOST'].includes(gameState.status)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [gameState]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playSound = (type: 'correct' | 'wrong' | 'transition' | 'win') => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.5);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'transition') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.exponentialRampToValueAtTime(1046, now + 0.5);
        gain.gain.setValueAtTime(0.05, now);
        osc.start(now); osc.stop(now + 1);
    }
  };

  const fetchNewQuestion = useCallback(async (level: number, diff: Difficulty, practice: boolean) => {
    setGameState(prev => ({ ...prev, status: 'LOADING', isPracticeMode: practice }));
    setLoadingMsg("Preparando desafio...");
    
    try {
      const q = await generateQuestion(diff, level);
      setGameState(prev => ({ 
        ...prev, 
        status: 'PLAYING', 
        question: q,
        currentLevel: level,
        difficulty: diff,
        isPracticeMode: practice
      }));
      setHiddenOptions([]);
      setShowHint(false);
      playSound('transition');
    } catch (error) {
      setGameState(prev => ({ ...prev, status: 'START' }));
    }
  }, []);

  const startGame = (practice = false) => {
    initAudio();
    localStorage.removeItem(STORAGE_KEY);
    fetchNewQuestion(1, Difficulty.BASIC, practice);
  };

  const resumeGame = () => {
    initAudio();
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as GameState;
      fetchNewQuestion(parsed.currentLevel, parsed.difficulty, parsed.isPracticeMode);
    }
  };

  const handleAnswer = (index: number) => {
    if (!gameState.question) return;
    if (index === gameState.question.correctIndex) {
      playSound('correct');
      setGameState(prev => ({ ...prev, status: 'TRANSITION' }));
      setTimeout(() => {
        const nextLevel = gameState.currentLevel + 1;
        if (nextLevel > 15) {
          playSound('win');
          setGameState(prev => ({ ...prev, status: 'WON' }));
        } else {
          let nextDiff = Difficulty.BASIC;
          if (nextLevel > 10) nextDiff = Difficulty.HARD;
          else if (nextLevel > 5) nextDiff = Difficulty.INTERMEDIATE;
          fetchNewQuestion(nextLevel, nextDiff, gameState.isPracticeMode);
        }
      }, 2800); // Matched with animate-zoom-glow duration
    } else {
      playSound('wrong');
      if (gameState.isPracticeMode) setShowHint(true);
      else setGameState(prev => ({ ...prev, status: 'LOST' }));
    }
  };

  const useFiftyFifty = () => {
    if (gameState.usedLifelines.fiftyFifty || !gameState.question) return;
    const correct = gameState.question.correctIndex;
    const others = [0, 1, 2, 3].filter(i => i !== correct);
    const toHide = others.sort(() => Math.random() - 0.5).slice(0, 2);
    setHiddenOptions(toHide);
    setGameState(prev => ({ ...prev, usedLifelines: { ...prev.usedLifelines, fiftyFifty: true } }));
  };

  const useSkip = () => {
    if (gameState.usedLifelines.skip) return;
    setGameState(prev => ({ ...prev, usedLifelines: { ...prev.usedLifelines, skip: true } }));
    fetchNewQuestion(gameState.currentLevel, gameState.difficulty, gameState.isPracticeMode);
  };

  const useHint = () => {
    if (gameState.usedLifelines.hint) return;
    setShowHint(true);
    setGameState(prev => ({ ...prev, usedLifelines: { ...prev.usedLifelines, hint: true } }));
  };

  const progressPercentage = (gameState.currentLevel / 15) * 100;
  const getProgressColor = () => {
    if (gameState.difficulty === Difficulty.BASIC) return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]';
    if (gameState.difficulty === Difficulty.INTERMEDIATE) return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]';
    return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]';
  };

  if (gameState.status === 'START') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-4 bg-[#020617] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/40 to-black pointer-events-none opacity-50"></div>
        <div className="relative z-10 text-center w-full max-w-xl space-y-6 animate-in zoom-in duration-700">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-400 to-amber-700 drop-shadow-xl italic tracking-tighter">
              GRAMÁTICA<br/>DO MILHÃO
            </h1>
            <p className="text-blue-400 font-bold tracking-[0.3em] uppercase text-[10px] md:text-xs">MARCOS ARLOVE APRESENTA</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-6 md:p-8 rounded-[32px] border border-white/10 shadow-2xl flex flex-col gap-3">
            {hasSavedGame && <Button onClick={resumeGame} variant="secondary" className="py-3 text-sm rounded-xl">Continuar Jogo Salvo</Button>}
            <Button onClick={() => startGame(false)} className="py-3 text-sm rounded-xl">Novo Desafio (Real)</Button>
            <Button onClick={() => startGame(true)} variant="ghost" className="py-3 text-sm rounded-xl border-white/10 text-slate-400">Modo de Prática</Button>
          </div>
          <div className="flex justify-center gap-4 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Básico</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Intermediário</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Difícil</span>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.status === 'TRANSITION') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 overflow-hidden text-center p-6 relative">
        <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>
        <div className="animate-zoom-glow z-10 flex flex-col items-center">
           <h2 className="text-6xl md:text-9xl font-black text-amber-500 italic mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">CERTO!</h2>
           <p className="text-slate-400 uppercase tracking-[0.6em] text-[10px] md:text-xs mb-4">Nível {gameState.currentLevel} Concluído</p>
           <div className="relative">
             <div className="absolute -inset-4 bg-white/10 blur-2xl rounded-full"></div>
             <p className="text-5xl md:text-8xl font-black text-white relative">{PRIZE_VALUES[gameState.currentLevel - 1]}</p>
           </div>
           <div className="w-64 h-2 bg-slate-900 rounded-full overflow-hidden mt-12 shadow-inner border border-white/5">
              <div className={`h-full animate-grow-x ${getProgressColor()}`} style={{ width: `${progressPercentage}%` }}></div>
           </div>
        </div>
      </div>
    );
  }

  if (gameState.status === 'LOADING') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 p-6">
        <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 border-4 border-slate-900 rounded-full"></div>
            <div className={`absolute inset-0 border-4 ${getProgressColor().split(' ')[0].replace('bg-', 'border-')} rounded-full border-t-transparent animate-spin`}></div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white">{gameState.currentLevel}</div>
        </div>
        <h2 className="text-xl font-bold text-blue-100 animate-pulse">{loadingMsg}</h2>
      </div>
    );
  }

  if (gameState.status === 'WON' || gameState.status === 'LOST') {
    const isWon = gameState.status === 'WON';
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center overflow-hidden">
        <div className={`p-8 md:p-12 rounded-[40px] border ${isWon ? 'border-amber-500/20 bg-amber-950/10' : 'border-red-500/20 bg-red-950/10'} backdrop-blur-xl shadow-2xl max-w-lg w-full`}>
          <h2 className={`text-4xl md:text-6xl font-black mb-4 italic ${isWon ? 'text-amber-500' : 'text-red-500'}`}>
            {isWon ? 'LENDÁRIO!' : 'FIM DO JOGO'}
          </h2>
          <div className="mb-6 p-4 bg-white/5 rounded-2xl italic text-sm font-light leading-relaxed text-slate-300">
             "{isWon ? "Você provou ser um mestre da língua portuguesa. Parabéns pela conquista!" : "Não desanime. Cada erro é um degrau no aprendizado da gramática."}"
             <p className="mt-2 text-[8px] font-bold text-slate-500 uppercase">— Marcos Arlove</p>
          </div>
          <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Prêmio Final</p>
          <p className="text-3xl md:text-4xl font-black text-white mb-8">{isWon ? PRIZE_VALUES[14] : (PRIZE_VALUES[gameState.currentLevel - 2] || '0 Kz')}</p>
          <div className="grid grid-cols-1 gap-3">
              <Button onClick={() => startGame(gameState.isPracticeMode)} className="py-3 text-sm rounded-xl">Jogar Novamente</Button>
              <Button onClick={() => setGameState(INITIAL_STATE)} variant="ghost" className="py-3 text-sm rounded-xl border-white/5">Menu Principal</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden relative">
      <div className="w-full h-1 bg-slate-900"><div className={`h-full transition-all duration-700 ease-out ${getProgressColor()}`} style={{ width: `${progressPercentage}%` }}></div></div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:flex w-64 bg-slate-900/30 border-r border-white/5 flex-col p-6 overflow-hidden">
          <div className="mb-6">
            <h1 className="text-lg font-black text-white italic leading-tight tracking-tighter">GRAMÁTICA DO MILHÃO</h1>
            <p className="text-[8px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">Marcos Arlove</p>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col-reverse gap-1 pr-2">
            {PRIZE_VALUES.map((val, idx) => {
              const level = idx + 1;
              const isActive = gameState.currentLevel === level;
              const isPassed = gameState.currentLevel > level;
              return (
                <div key={idx} className={`flex justify-between items-center px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isActive ? 'bg-amber-500 text-slate-950 scale-105 shadow-md z-10 translate-x-1' : isPassed ? 'text-blue-400/30' : 'text-slate-600'}`}>
                  <span>{level.toString().padStart(2, '0')}</span>
                  <span>{val}</span>
                </div>
              );
            })}
          </div>
          {gameState.isPracticeMode && <div className="mt-4 bg-amber-500/20 text-amber-500 text-[8px] font-black p-2 rounded border border-amber-500/30 text-center uppercase tracking-widest">MODO PRÁTICA</div>}
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
          <header className="px-4 py-3 flex justify-between items-center border-b border-white/5 bg-slate-950/80 backdrop-blur shrink-0">
             <div className="lg:hidden">
                <h1 className="text-white font-black text-sm italic tracking-tighter">GRAMÁTICA DO MILHÃO</h1>
                <p className="text-[7px] text-blue-500 font-bold uppercase tracking-widest leading-none">Marcos Arlove</p>
             </div>
             <div className="hidden lg:flex items-center gap-3 text-slate-500 text-[9px] font-black uppercase tracking-widest">
               <span>{gameState.difficulty}</span> <div className="w-1 h-1 rounded-full bg-slate-800"></div> <span>NÍVEL {gameState.currentLevel} / 15</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="bg-slate-900/50 px-3 py-1 rounded-lg border border-white/5 text-right">
                   <p className="text-slate-500 text-[7px] font-bold uppercase tracking-widest leading-none mb-0.5">VALENDO</p>
                   <p className="text-white font-black text-sm md:text-base leading-none">{PRIZE_VALUES[gameState.currentLevel - 1]}</p>
                </div>
                <button onClick={() => setGameState(INITIAL_STATE)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 text-sm">×</button>
             </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden">
            {gameState.question && (
              <div className="w-full flex flex-col items-center justify-center overflow-hidden h-full max-h-full">
                <QuestionCard 
                  question={gameState.question} 
                  onAnswer={handleAnswer} 
                  disabled={gameState.status !== 'PLAYING'}
                  hiddenIndices={hiddenOptions}
                  isPracticeMode={gameState.isPracticeMode}
                  hintActive={showHint && !gameState.isPracticeMode}
                />

                {(showHint || gameState.isPracticeMode) && gameState.question && (
                  <div className="mt-4 w-full max-w-2xl animate-in slide-in-from-top-4 duration-500 shrink-0">
                     <div className="bg-blue-600/10 border border-blue-400/20 p-4 md:p-5 rounded-2xl flex items-start gap-4 backdrop-blur-lg">
                       <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-sm shadow-md animate-float">i</div>
                       <div className="flex-1 overflow-y-auto max-h-[8rem] pr-2 no-scrollbar">
                         <h4 className="font-black text-blue-400 uppercase text-[9px] tracking-widest mb-1">Explicação:</h4>
                         <p className="text-blue-100/80 text-sm italic font-light leading-snug">{gameState.question.explanation}</p>
                         {gameState.isPracticeMode && <Button onClick={() => handleAnswer(gameState.question!.correctIndex)} variant="ghost" className="mt-3 py-1.5 px-4 text-[10px] rounded-lg border-blue-500/30 text-blue-300">Próxima Questão</Button>}
                       </div>
                     </div>
                  </div>
                )}
              </div>
            )}
          </main>

          <footer className="px-4 py-4 md:py-6 border-t border-white/5 bg-slate-950/90 backdrop-blur-xl flex justify-center gap-4 md:gap-10 shrink-0">
            {[
              { label: '50:50', action: useFiftyFifty, used: gameState.usedLifelines.fiftyFifty, color: 'blue' },
              { label: 'PULO', action: useSkip, used: gameState.usedLifelines.skip, color: 'amber' },
              { label: 'DICA', action: useHint, used: gameState.usedLifelines.hint, color: 'green' }
            ].map(( lifeline, i ) => (
              <button 
                key={i} 
                onClick={lifeline.action}
                disabled={lifeline.used || gameState.status !== 'PLAYING'}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex flex-col items-center justify-center text-[8px] font-black border transition-all duration-300 ${
                  lifeline.used ? 'border-slate-800 bg-slate-900/50 text-slate-700 cursor-not-allowed grayscale' : `border-${lifeline.color}-500/30 bg-${lifeline.color}-500/5 text-${lifeline.color}-400 hover:scale-105 active:scale-95`
                }`}
              >
                <span className="text-base md:text-lg mb-0.5">{lifeline.label}</span>
                <span className="opacity-40 uppercase text-[6px]">{i === 0 ? 'Corte' : i === 1 ? 'Skip' : 'Explica'}</span>
              </button>
            ))}
          </footer>
        </div>
      </div>
    </div>
  );
};

export default App;
