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

    /**
     * Função utilitária de debounce para otimizar performance
     * Atrasa a execução de uma função até que um período de inatividade tenha passado
     * @param {Function} func - Função a ser executada
     * @param {number} delay - Tempo de espera em milissegundos
     * @returns {Function} Função com debounce aplicado
     */
    const debounce = (func, delay) => {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    };

    /**
     * Gerenciador de áudio do jogo
     * Controla todos os efeitos sonoros e configuração de mute
     */
    const AudioManager = {
        sons: {
            acerto: null,
            erro: null,
            inicio: null,
            fim: null
        },
        mutado: false,

        inicializar() {
            // Carregar preferência de mute do localStorage
            const muteSalvo = localStorage.getItem('whacAMoleMute');
            this.mutado = muteSalvo === 'true';
            
            // Criar objetos de áudio usando Web Audio API como fallback
            // Usamos sons gerados sinteticamente para não depender de arquivos externos
            this.sons.acerto = this.criarSomSintetizado('acerto');
            this.sons.erro = this.criarSomSintetizado('erro');
            this.sons.inicio = this.criarSomSintetizado('inicio');
            this.sons.fim = this.criarSomSintetizado('fim');
            
            this.atualizarIconeMute();
        },

        /**
         * Cria sons sintetizados usando Web Audio API
         * @param {string} tipo - Tipo do som (acerto, erro, inicio, fim)
         * @returns {Function} Função para tocar o som
         */
        criarSomSintetizado(tipo) {
            return () => {
                if (this.mutado) return;
                
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    // Configurar som baseado no tipo
                    switch(tipo) {
                        case 'acerto':
                            // Som alegre de acerto (arpejo ascendente)
                            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
                            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
                            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                            oscillator.start(audioContext.currentTime);
                            oscillator.stop(audioContext.currentTime + 0.3);
                            break;
                            
                        case 'erro':
                            // Som de erro (nota baixa curta)
                            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                            oscillator.type = 'sawtooth';
                            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                            oscillator.start(audioContext.currentTime);
                            oscillator.stop(audioContext.currentTime + 0.2);
                            break;
                            
                        case 'inicio':
                            // Som de início (fanfarra curta)
                            oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
                            oscillator.frequency.setValueAtTime(554.37, audioContext.currentTime + 0.15); // C#5
                            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.3); // E5
                            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.45);
                            oscillator.start(audioContext.currentTime);
                            oscillator.stop(audioContext.currentTime + 0.45);
                            break;
                            
                        case 'fim':
                            // Som de fim (arpejo descendente)
                            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
                            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime + 0.2); // C5
                            oscillator.frequency.setValueAtTime(392, audioContext.currentTime + 0.4); // G4
                            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
                            oscillator.start(audioContext.currentTime);
                            oscillator.stop(audioContext.currentTime + 0.6);
                            break;
                    }
                } catch (error) {
                    console.warn('Áudio não suportado:', error);
                }
            };
        },

        tocar(tipo) {
            if (this.sons[tipo] && !this.mutado) {
                this.sons[tipo]();
            }
        },

        toggleMute() {
            this.mutado = !this.mutado;
            localStorage.setItem('whacAMoleMute', this.mutado);
            this.atualizarIconeMute();
            
            // Feedback visual
            const botao = document.getElementById('muteBtn');
            if (botao) {
                const texto = this.mutado ? 'Som ativado' : 'Som desativado';
                botao.setAttribute('aria-label', `${this.mutado ? 'Ativar' : 'Desativar'} som`);
            }
        },

        atualizarIconeMute() {
            const botao = document.getElementById('muteBtn');
            if (!botao) return;
            
            const icone = botao.querySelector('.mute-icon');
            if (icone) {
                icone.textContent = this.mutado ? '🔇' : '🔊';
            }
            botao.setAttribute('aria-pressed', this.mutado ? 'false' : 'true');
            botao.setAttribute('aria-label', `${this.mutado ? 'Ativar' : 'Desativar'} som`);
        }
    };

    /**
     * Gerenciador de notificações Toast
     * Sistema moderno de notificações para substituir alert()
     */
    const NotificationManager = {
        container: null,
        activeToasts: [],

        inicializar() {
            // Criar container de notificações se não existir
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'toast-container';
                this.container.className = 'toast-container';
                this.container.setAttribute('aria-live', 'polite');
                this.container.setAttribute('aria-atomic', 'true');
                document.body.appendChild(this.container);
            }
        },

        /**
         * Mostra uma notificação toast
         * @param {string} message - Mensagem a exibir
         * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
         * @param {number} duration - Duração em ms (0 = requer clique manual)
         */
        mostrar(message, type = 'info', duration = 5000) {
            this.inicializar();

            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            toast.setAttribute('aria-atomic', 'true');

            // Ícone baseado no tipo
            const icones = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: '📢'
            };

            const icone = icones[type] || icones.info;

            toast.innerHTML = `
                <div class="toast-content">
                    <span class="toast-icon" aria-hidden="true">${icone}</span>
                    <div class="toast-message">${message}</div>
                    <button class="toast-close" aria-label="Fechar notificação" type="button">
                        <span aria-hidden="true">×</span>
                    </button>
                </div>
            `;

            // Botão de fechar
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => this.fechar(toast));

            // Adicionar ao container
            this.container.appendChild(toast);
            this.activeToasts.push(toast);

            // Animação de entrada
            setTimeout(() => toast.classList.add('toast-show'), 10);

            // Auto-fechar se duration > 0
            if (duration > 0) {
                setTimeout(() => this.fechar(toast), duration);
            }

            return toast;
        },

        /**
         * Fecha uma notificação
         */
        fechar(toast) {
            if (!toast || !toast.parentElement) return;

            toast.classList.remove('toast-show');
            toast.classList.add('toast-hide');

            setTimeout(() => {
                if (toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
                const index = this.activeToasts.indexOf(toast);
                if (index > -1) {
                    this.activeToasts.splice(index, 1);
                }
            }, 300);
        },

        /**
         * Mostra modal de fim de jogo com estatísticas detalhadas
         */
        mostrarFimDeJogo(nomeJogador, dificuldade, acertos, perdidos, errados, pontuacao) {
            this.inicializar();

            // Criar overlay
            const overlay = document.createElement('div');
            overlay.className = 'game-over-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-labelledby', 'game-over-title');

            overlay.innerHTML = `
                <div class="game-over-modal">
                    <div class="game-over-header">
                        <h2 id="game-over-title">🎮 Fim de Jogo!</h2>
                        <button class="modal-close" aria-label="Fechar" type="button">×</button>
                    </div>
                    <div class="game-over-body">
                        <p class="player-name">👋 ${nomeJogador}</p>
                        <p class="difficulty">🎯 Dificuldade: <strong>${dificuldade.toUpperCase()}</strong></p>
                        
                        <div class="stats-grid">
                            <div class="stat-item stat-success">
                                <span class="stat-icon">✅</span>
                                <span class="stat-label">Acertos</span>
                                <span class="stat-value">${acertos}</span>
                            </div>
                            <div class="stat-item stat-warning">
                                <span class="stat-icon">⏱️</span>
                                <span class="stat-label">Perdidos</span>
                                <span class="stat-value">${perdidos}</span>
                            </div>
                            <div class="stat-item stat-error">
                                <span class="stat-icon">❌</span>
                                <span class="stat-label">Errados</span>
                                <span class="stat-value">${errados}</span>
                            </div>
                        </div>
                        
                        <div class="final-score">
                            <span class="score-label">🏆 PONTUAÇÃO FINAL</span>
                            <span class="score-value">${pontuacao}</span>
                        </div>
                        
                        <p class="record-saved">✨ Seu recorde foi salvo!</p>
                        
                        <button class="btn btn-primary btn-play-again" type="button">
                            🔄 Jogar Novamente
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Event listeners
            const closeBtn = overlay.querySelector('.modal-close');
            const playAgainBtn = overlay.querySelector('.btn-play-again');

            const fecharModal = () => {
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    if (overlay.parentElement) {
                        overlay.parentElement.removeChild(overlay);
                    }
                }, 300);
            };

            closeBtn.addEventListener('click', fecharModal);
            playAgainBtn.addEventListener('click', () => {
                fecharModal();
                // O botão Iniciar já estará habilitado
            });

            // Fechar ao clicar fora do modal
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    fecharModal();
                }
            });

            // Suporte para ESC
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    fecharModal();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            // Animação de entrada
            setTimeout(() => overlay.classList.add('show'), 10);

            // Focar no botão de fechar para acessibilidade
            setTimeout(() => closeBtn.focus(), 100);
        },

        // Métodos de atalho
        success(message, duration = 4000) {
            return this.mostrar(message, 'success', duration);
        },

        error(message, duration = 6000) {
            return this.mostrar(message, 'error', duration);
        },

        warning(message, duration = 5000) {
            return this.mostrar(message, 'warning', duration);
        },

        info(message, duration = 4000) {
            return this.mostrar(message, 'info', duration);
        }
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
        jogoFoiPausado: false,
        audioInicializado: false
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
        AudioManager.tocar('fim');
        
        document.querySelectorAll('img[id^="buraco"]').forEach(t => t.src = 'imagens/hole.png');
        
        const pontuacaoFinal = calcularPontuacao();
        RecordesManager.adicionar(state.nomeJogador, pontuacaoFinal, state.dificuldadeAtual);
        
        // Mostrar modal de fim de jogo em vez de alert
        NotificationManager.mostrarFimDeJogo(
            state.nomeJogador,
            state.dificuldadeAtual,
            state.acertos,
            state.perdidos,
            state.errados,
            pontuacaoFinal
        );
        
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
                AudioManager.tocar('acerto');
                atualizarStatusBuraco(buracoId, false);
                if (state.timers[buraco]) {
                    clearTimeout(state.timers[buraco]);
                    delete state.timers[buraco];
                }
            } else {
                state.errados++;
                AudioManager.tocar('erro');
            }
            mostraPontuacao();
        }
    };

    /**
     * Inicia o jogo
     */
    const start = () => {
        if (!state.nomeJogador) {
            NotificationManager.error('❌ Erro: Jogador não registrado! Redirecionando...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }
        
        const botao = document.getElementById('start');
        const seletorDificuldade = document.getElementById('dificuldade');
        
        botao.removeEventListener('click', start);
        botao.disabled = true;
        if (seletorDificuldade) seletorDificuldade.disabled = true;
        
        AudioManager.tocar('inicio');
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
        // Inicializar sistema de áudio
        if (!state.audioInicializado) {
            AudioManager.inicializar();
            state.audioInicializado = true;
        }
        
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
            NotificationManager.warning('⚠️ Por favor, registre-se antes de jogar!');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2500);
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
        
        // Botão de mute
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => AudioManager.toggleMute());
        }
    };

    // Event listeners de layout com debounce para otimização de performance
    // O debounce de 250ms reduz cálculos desnecessários durante redimensionamento
    const ajustarLayoutComDebounce = debounce(LayoutManager.ajustar, 250);
    
    window.addEventListener('load', () => {
        LayoutManager.ajustar();
        inicializar();
    });
    window.addEventListener('resize', ajustarLayoutComDebounce);
    window.addEventListener('orientationchange', ajustarLayoutComDebounce);

    // API pública do módulo (caso precise acessar externamente)
    return {
        inicializar,
        getState: () => ({ ...state }), // Retorna cópia do estado
        limparTimers: limparTodosTimers
    };
})();