/**
 * Módulo principal do jogo Whac-A-Mole
 * Encapsula todo o estado e lógica do jogo
 */
const WhacAMoleGame = (() => {
    // Configurações de dificuldade (constante privada)
    const DIFICULDADES = {
        facil: { buracos: 6, intervalo: 3000, janela: 2000, colunas: 3, pontosAcerto: 5, pontosPerdido: 2, pontosErro: 3 },
        medio: { buracos: 8, intervalo: 2000, janela: 1500, colunas: 4, pontosAcerto: 10, pontosPerdido: 4, pontosErro: 6 },
        dificil: { buracos: 10, intervalo: 1500, janela: 1000, colunas: 5, pontosAcerto: 20, pontosPerdido: 8, pontosErro: 12 }
    };

    // Estado privado do jogo
    const state = {
        acertos: 0,
        perdidos: 0,
        errados: 0,
        intervalo: 3000,
        janela: 2000,
        timers: {},
        timeoutsSobeToupeira: [],
        idTemporizador: null,
        tempoTotal: 60,
        tempoRestante: 60,
        jogoAtivo: false,
        numBuracosAtivos: 6,
        dificuldadeAtual: 'facil',
        nomeJogador: '',
        recordes: [],
        jogoFoiPausado: false
    };

    /**
     * Sanitiza nomes de jogadores para segurança
     * @param {string} nome - Nome do jogador
     * @returns {string} Nome sanitizado
     */
    const sanitizarNome = (nome) => {
        if (!nome || typeof nome !== 'string') {
            return 'Jogador';
        }
        
        nome = nome.trim().replace(/\s+/g, ' ');
        nome = nome.replace(/[^A-Za-zÀ-ÿ0-9\s]/g, '');
        nome = nome.substring(0, 20);
        
        return nome.trim().length > 0 ? nome : 'Jogador';
    };

    /**
     * Limpa todos os timers ativos para prevenir memory leaks
     */
    const limparTodosTimers = () => {
        if (state.idTemporizador) {
            clearInterval(state.idTemporizador);
            state.idTemporizador = null;
        }
        
        Object.values(state.timers).forEach(timer => {
            if (timer) clearTimeout(timer);
        });
        state.timers = {};
        
        state.timeoutsSobeToupeira.forEach(timeout => {
            if (timeout) clearTimeout(timeout);
        });
        state.timeoutsSobeToupeira = [];
        
        state.jogoAtivo = false;
        
        console.log('Todos os timers foram limpos');
    };

    /**
     * Gerenciamento de recordes
     */
    const RecordesManager = {
        carregar() {
            const recordesSalvos = localStorage.getItem('whacAMoleRecordes');
            if (recordesSalvos) {
                state.recordes = JSON.parse(recordesSalvos);
            } else {
                state.recordes = [
                    { nome: 'Asterix', pontos: 512, data: '20/07/2019', dificuldade: 'medio' },
                    { nome: 'Obelix', pontos: 256, data: '01/01/2002', dificuldade: 'facil' },
                    { nome: 'Panoramix', pontos: 128, data: '25/06/2009', dificuldade: 'facil' }
                ];
                this.salvar();
            }
        },

        salvar() {
            localStorage.setItem('whacAMoleRecordes', JSON.stringify(state.recordes));
        },

        adicionar(nome, pontos, dificuldade) {
            nome = sanitizarNome(nome);
            
            const agora = new Date();
            const dataFormatada = `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')}/${agora.getFullYear()}`;
            
            const novoRecorde = {
                nome,
                pontos,
                data: dataFormatada,
                dificuldade
            };
            
            state.recordes.push(novoRecorde);
            state.recordes.sort((a, b) => b.pontos - a.pontos);
            state.recordes = state.recordes.slice(0, 50);
            this.salvar();
        }
    };

    /**
     * Calcula a pontuação atual
     * @returns {number} Pontuação calculada
     */
    const calcularPontuacao = () => {
        const config = DIFICULDADES[state.dificuldadeAtual];
        const pontos = (state.acertos * config.pontosAcerto) - 
                       (state.perdidos * config.pontosPerdido) - 
                       (state.errados * config.pontosErro);
        return Math.max(pontos, 0);
    };

    /**
     * Atualiza os valores de pontuação na UI
     */
    const atualizarValoresPontuacao = () => {
        const config = DIFICULDADES[state.dificuldadeAtual];
        const valorAcerto = document.getElementById('valorAcerto');
        const valorPerdido = document.getElementById('valorPerdido');
        const valorErrado = document.getElementById('valorErrado');
        
        if (valorAcerto) valorAcerto.textContent = `(+${config.pontosAcerto})`;
        if (valorPerdido) valorPerdido.textContent = `(-${config.pontosPerdido})`;
        if (valorErrado) valorErrado.textContent = `(-${config.pontosErro})`;
    };

    /**
     * Gerenciamento de layout responsivo
     */
    const LayoutManager = {
        ajustar() {
            const gramado = document.getElementById('idGramado');
            if (!gramado) return;
            
            const larguraTela = window.innerWidth;
            const alturaTela = window.innerHeight;
            const config = DIFICULDADES[state.dificuldadeAtual];
            
            // Mostrar/ocultar buracos baseado na dificuldade
            for (let i = 0; i < 10; i++) {
                const buraco = document.getElementById('buraco' + i);
                if (buraco) {
                    buraco.style.display = i < config.buracos ? 'block' : 'none';
                }
            }
            
            // Ajustar grid baseado na dificuldade e tamanho da tela
            let numColunas;
            if (larguraTela < 500) {
                numColunas = Math.min(2, config.colunas);
            } else if (larguraTela < 768) {
                numColunas = Math.min(3, config.colunas);
            } else {
                numColunas = config.colunas;
            }
            
            gramado.style.gridTemplateColumns = `repeat(${numColunas}, 1fr)`;
            
            // Calcular tamanho ideal para os buracos
            const tamanhoBase = Math.min(larguraTela, alturaTela) * 0.85;
            const tamanhoBuraco = Math.floor((tamanhoBase / numColunas) - 20);
            
            // Aplicar tamanho aos buracos
            const buracos = document.querySelectorAll('.hole');
            buracos.forEach(buraco => {
                buraco.style.width = tamanhoBuraco + 'px';
                buraco.style.height = tamanhoBuraco + 'px';
                buraco.style.objectFit = 'contain';
            });
            
            // Ajustar tamanho do gramado
            const larguraGramado = (tamanhoBuraco * numColunas) + (20 * (numColunas + 1));
            gramado.style.width = larguraGramado + 'px';
            gramado.style.maxWidth = '95vw';
        }
    };

    /**
     * Gerenciamento do display de tempo
     */
    const mostraTempo = () => {
        const display = document.getElementById('tempo');
        if (display) display.textContent = `Tempo: ${state.tempoRestante}s`;
    };

    /**
     * Inicia o temporizador do jogo
     */
    const iniciaTemporizador = () => {
        mostraTempo();
        state.idTemporizador = setInterval(() => {
            state.tempoRestante--;
            mostraTempo();
            if (state.tempoRestante <= 0) finalizaJogo();
        }, 1000);
    };

    /**
     * Finaliza o jogo quando o tempo acaba
     */
    const finalizaJogo = () => {
        limparTodosTimers();
        
        document.querySelectorAll('img[id^="buraco"]').forEach(t => t.src = 'imagens/hole.png');
        
        const pontuacaoFinal = calcularPontuacao();
        RecordesManager.adicionar(state.nomeJogador, pontuacaoFinal, state.dificuldadeAtual);
        
        alert(`Fim de jogo, ${state.nomeJogador}!\n\nDificuldade: ${state.dificuldadeAtual.toUpperCase()}\n\nAcertos: ${state.acertos}\nPerdidos: ${state.perdidos}\nErrados: ${state.errados}\n\nPONTUAÇÃO FINAL: ${pontuacaoFinal}\n\nSeu recorde foi salvo!`);
        
        state.acertos = state.perdidos = state.errados = 0;
        mostraPontuacao();
        
        const botao = document.getElementById('start');
        const seletorDificuldade = document.getElementById('dificuldade');
        
        if (botao) {
            botao.addEventListener('click', start);
            botao.disabled = false;
        }
        if (seletorDificuldade) seletorDificuldade.disabled = false;
    };

    /**
     * Gerenciamento de toupeiras
     */
    const ToupeiraManager = {
        sobeToupeira() {
            if (!state.jogoAtivo || state.jogoFoiPausado) return;
            
            const buraco = Math.floor(Math.random() * state.numBuracosAtivos);
            const buracoId = 'buraco' + buraco;
            const elementoBuraco = document.getElementById(buracoId);
            
            if (elementoBuraco) {
                const img = elementoBuraco.querySelector('img');
                if (img && !img.src.includes('hole-mole')) {
                    atualizarStatusBuraco(buracoId, true);
                    state.timers[buraco] = setTimeout(() => this.tiraToupeira(buraco), state.janela);
                }
            }
            
            const proximoTimeout = setTimeout(() => this.sobeToupeira(), state.intervalo);
            state.timeoutsSobeToupeira.push(proximoTimeout);
        },

        tiraToupeira(buraco) {
            const buracoId = 'buraco' + buraco;
            const elementoBuraco = document.getElementById(buracoId);
            if (elementoBuraco) {
                const img = elementoBuraco.querySelector('img');
                if (img && img.src.includes('hole-mole')) {
                    atualizarStatusBuraco(buracoId, false);
                    state.perdidos++;
                    mostraPontuacao();
                }
            }
            delete state.timers[buraco];
        }
    };

    /**
     * Mostra a pontuação na tela
     */
    const mostraPontuacao = () => {
        const pontuacoes = {
            acertos: state.acertos,
            perdidos: state.perdidos,
            errados: state.errados
        };
        
        Object.entries(pontuacoes).forEach(([tipo, valor]) => mostraPontuacaoDe(tipo, valor));
        mostraPontuacaoDe('saldo', calcularPontuacao());
    };

    /**
     * Mostra a pontuação de um tipo específico e atualiza ARIA labels
     */
    const mostraPontuacaoDe = (display, valor) => {
        const container = document.getElementById(display);
        if (!container) return;
        
        const imgs = container.children;
        const digitos = [Math.floor(valor/100), Math.floor((valor/10)%10), valor%10];
        
        digitos.forEach((d, i) => {
            if (imgs[i] && imgs[i].tagName === 'IMG') {
                imgs[i].src = `imagens/caractere_${d}.gif`;
                imgs[i].alt = d;
            }
        });
        
        // Atualizar aria-label para leitores de tela
        const labelMap = {
            'acertos': 'Acertos',
            'perdidos': 'Perdidos',
            'errados': 'Errados',
            'saldo': 'Saldo total'
        };
        
        if (labelMap[display]) {
            container.setAttribute('aria-label', `${labelMap[display]}: ${valor}`);
        }
        
        // Atualizar span visualmente oculto para leitores de tela
        const scoreValue = container.querySelector('.score-value');
        if (scoreValue) {
            scoreValue.textContent = valor;
        }
    };

    /**
     * Atualiza o status visual e acessível de um buraco
     */
    const atualizarStatusBuraco = (buracoId, temToupeira) => {
        const buraco = document.getElementById(buracoId);
        if (!buraco) return;
        
        const img = buraco.querySelector('img');
        const status = buraco.querySelector('.hole-status');
        
        if (temToupeira) {
            if (img) img.src = 'imagens/hole-mole.png';
            if (status) status.textContent = 'Toupeira apareceu!';
            buraco.setAttribute('aria-label', buraco.getAttribute('aria-label').replace('Buraco', 'Toupeira no buraco'));
        } else {
            if (img) img.src = 'imagens/hole.png';
            if (status) status.textContent = 'Buraco vazio';
            buraco.setAttribute('aria-label', buraco.getAttribute('aria-label').replace('Toupeira no buraco', 'Buraco'));
        }
    };

    /**
     * Handlers de eventos do martelo
     */
    const MarteloHandlers = {
        marteloBaixo() {
            const gramado = document.getElementById('idGramado');
            if (gramado) gramado.style.cursor = 'url(imagens/hammerDown.png), default';
        },

        marteloCima() {
            const gramado = document.getElementById('idGramado');
            if (gramado) gramado.style.cursor = 'url(imagens/hammer.png), default';
        },

        martelada(evento) {
            if (!state.jogoAtivo) return;
            
            // Suportar tanto click em img quanto no botão
            const target = evento.target.closest('.hole-button') || evento.target;
            const buracoId = target.id;
            const buraco = buracoId.replace('buraco', '');
            const img = target.querySelector ? target.querySelector('img') : target;
            
            if (img && img.src.includes('hole-mole')) {
                state.acertos++;
                atualizarStatusBuraco(buracoId, false);
                if (state.timers[buraco]) {
                    clearTimeout(state.timers[buraco]);
                    delete state.timers[buraco];
                }
                // Feedback sonoro/visual poderia ser adicionado aqui
            } else {
                state.errados++;
            }
            mostraPontuacao();
        }
    };

    /**
     * Inicia o jogo
     */
    const start = () => {
        if (!state.nomeJogador) {
            alert('Erro: Jogador não registrado!');
            window.location.href = 'index.html';
            return;
        }
        
        const botao = document.getElementById('start');
        const seletorDificuldade = document.getElementById('dificuldade');
        
        botao.removeEventListener('click', start);
        botao.disabled = true;
        if (seletorDificuldade) seletorDificuldade.disabled = true;
        
        state.jogoAtivo = true;
        state.jogoFoiPausado = false;
        state.tempoRestante = state.tempoTotal;
        iniciaTemporizador();
        ToupeiraManager.sobeToupeira();
    };

    /**
     * Gerenciamento de mudança de dificuldade
     */
    const mudarDificuldade = (novaDificuldade) => {
        state.dificuldadeAtual = novaDificuldade;
        const config = DIFICULDADES[novaDificuldade];
        state.numBuracosAtivos = config.buracos;
        state.intervalo = config.intervalo;
        state.janela = config.janela;
        LayoutManager.ajustar();
        atualizarValoresPontuacao();
        sessionStorage.setItem('whacAMoleDificuldade', novaDificuldade);
    };

    /**
     * Gerenciamento de eventos de pausa/retomada
     */
    const EventHandlers = {
        pausarJogo() {
            if (state.jogoAtivo && !state.jogoFoiPausado) {
                state.jogoFoiPausado = true;
                limparTodosTimers();
                console.log('Jogo pausado');
            }
        },

        retomarJogo() {
            if (state.jogoFoiPausado && state.tempoRestante > 0) {
                state.jogoFoiPausado = false;
                state.jogoAtivo = true;
                iniciaTemporizador();
                ToupeiraManager.sobeToupeira();
                console.log('Jogo retomado');
            }
        }
    };

    /**
     * Inicialização do jogo
     */
    const inicializar = () => {
        RecordesManager.carregar();
        
        // Carregar dados do jogador
        const jogadorSalvo = sessionStorage.getItem('whacAMoleJogador');
        const dificuldadeSalva = sessionStorage.getItem('whacAMoleDificuldade');
        
        if (jogadorSalvo) {
            state.nomeJogador = sanitizarNome(jogadorSalvo);
        }
        
        if (dificuldadeSalva) {
            mudarDificuldade(dificuldadeSalva);
        }
        
        // Configurar elementos da UI
        const startBtn = document.getElementById('start');
        const gramado = document.getElementById('idGramado');
        const seletorDificuldade = document.getElementById('dificuldade');
        
        if (seletorDificuldade && state.dificuldadeAtual) {
            seletorDificuldade.value = state.dificuldadeAtual;
        }
        
        LayoutManager.ajustar();
        atualizarValoresPontuacao();
        
        // Redirecionar se não houver jogador
        if (!state.nomeJogador) {
            alert('Por favor, registre-se antes de jogar!');
            window.location.href = 'index.html';
            return;
        }
        
        // Event listeners
        if (seletorDificuldade) {
            seletorDificuldade.addEventListener('change', (e) => {
                mudarDificuldade(e.target.value);
            });
        }
        
        if (startBtn) {
            startBtn.addEventListener('click', start);
            startBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (!startBtn.disabled) start();
            });
        }
        
        if (gramado) {
            gramado.addEventListener('mousedown', MarteloHandlers.marteloBaixo);
            gramado.addEventListener('mouseup', MarteloHandlers.marteloCima);
        }
        
        // Configurar buracos com suporte para teclado
        for (let i = 0; i < 10; i++) {
            const buraco = document.getElementById('buraco' + i);
            if (buraco) {
                buraco.addEventListener('click', MarteloHandlers.martelada);
                
                // Suporte para teclado (Enter e Espaço)
                buraco.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        MarteloHandlers.martelada(e);
                    }
                });
                
                // Suporte para dispositivos touch (iOS)
                buraco.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    MarteloHandlers.martelada(e);
                });
            }
        }
        
        // Event listeners de ciclo de vida
        window.addEventListener('beforeunload', () => {
            if (state.jogoAtivo) limparTodosTimers();
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                EventHandlers.pausarJogo();
            } else {
                EventHandlers.retomarJogo();
            }
        });
        
        window.addEventListener('blur', EventHandlers.pausarJogo);
        window.addEventListener('focus', EventHandlers.retomarJogo);
        window.addEventListener('unload', limparTodosTimers);
        window.addEventListener('pagehide', limparTodosTimers);
    };

    // Event listeners de layout
    window.addEventListener('load', () => {
        LayoutManager.ajustar();
        inicializar();
    });
    window.addEventListener('resize', LayoutManager.ajustar);
    window.addEventListener('orientationchange', LayoutManager.ajustar);

    // API pública do módulo (caso precise acessar externamente)
    return {
        inicializar,
        getState: () => ({ ...state }), // Retorna cópia do estado
        limparTimers: limparTodosTimers
    };
})();