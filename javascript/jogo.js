var acertos = 0, perdidos = 0, errados = 0;
var intervalo = 3000, janela = 2000;
var timers = {}; // Armazena todos os timers ativos por buraco
var timeoutsSobeToupeira = []; // Armazena timeouts de sobeToupeira
var idTemporizador = null;
var tempoTotal = 60, tempoRestante = tempoTotal;
var jogoAtivo = false;
var numBuracosAtivos = 6; // Número de buracos baseado na dificuldade
var dificuldadeAtual = 'facil';
var nomeJogador = ''; // Nome do jogador atual
var recordes = []; // Array de recordes

// Configurações de dificuldade
const dificuldades = {
    facil: { buracos: 6, intervalo: 3000, janela: 2000, colunas: 3 },
    medio: { buracos: 8, intervalo: 2000, janela: 1500, colunas: 4 },
    dificil: { buracos: 10, intervalo: 1500, janela: 1000, colunas: 5 }
};

// Funções de gerenciamento de recordes
function carregarRecordes() {
    const recordesSalvos = localStorage.getItem('whacAMoleRecordes');
    if (recordesSalvos) {
        recordes = JSON.parse(recordesSalvos);
    } else {
        // Recordes iniciais (exemplo)
        recordes = [
            { nome: 'Asterix', pontos: 512, data: '20/07/2019', dificuldade: 'medio' },
            { nome: 'Obelix', pontos: 256, data: '01/01/2002', dificuldade: 'facil' },
            { nome: 'Panoramix', pontos: 128, data: '25/06/2009', dificuldade: 'facil' }
        ];
        salvarRecordes();
    }
}

function salvarRecordes() {
    localStorage.setItem('whacAMoleRecordes', JSON.stringify(recordes));
}

function adicionarRecorde(nome, pontos, dificuldade) {
    const agora = new Date();
    const dataFormatada = `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')}/${agora.getFullYear()}`;
    
    const novoRecorde = {
        nome: nome,
        pontos: pontos,
        data: dataFormatada,
        dificuldade: dificuldade
    };
    
    recordes.push(novoRecorde);
    recordes.sort((a, b) => b.pontos - a.pontos); // Ordenar por pontuação decrescente
    recordes = recordes.slice(0, 50); // Manter apenas top 50
    salvarRecordes();
}

function calcularPontuacao() {
    return Math.max(acertos - perdidos - errados, 0);
}

const ajustarLayout = () => {
    const gramado = document.getElementById('idGramado');
    if (!gramado) return;
    
    const larguraTela = window.innerWidth;
    const alturaTela = window.innerHeight;
    const config = dificuldades[dificuldadeAtual];
    
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
};

window.addEventListener('load', ajustarLayout);
window.addEventListener('resize', ajustarLayout);
window.addEventListener('orientationchange', ajustarLayout);

window.addEventListener('load', () => {
    carregarRecordes();
    
    // Carregar dados do jogador do sessionStorage
    const jogadorSalvo = sessionStorage.getItem('whacAMoleJogador');
    const dificuldadeSalva = sessionStorage.getItem('whacAMoleDificuldade');
    
    if (jogadorSalvo) {
        nomeJogador = jogadorSalvo;
    }
    
    if (dificuldadeSalva) {
        dificuldadeAtual = dificuldadeSalva;
        const config = dificuldades[dificuldadeAtual];
        numBuracosAtivos = config.buracos;
        intervalo = config.intervalo;
        janela = config.janela;
    }
    
    const startBtn = document.getElementById('start');
    const gramado = document.getElementById('idGramado');
    const seletorDificuldade = document.getElementById('dificuldade');
    
    // Aplicar dificuldade ao seletor
    if (seletorDificuldade && dificuldadeAtual) {
        seletorDificuldade.value = dificuldadeAtual;
    }
    
    // Ajustar layout inicial
    ajustarLayout();
    
    // Redirecionar se não houver jogador registrado
    if (!nomeJogador) {
        alert('Por favor, registre-se antes de jogar!');
        window.location.href = 'index.html';
        return;
    }
    
    // Event listener para mudança de dificuldade
    if (seletorDificuldade) {
        seletorDificuldade.addEventListener('change', (e) => {
            dificuldadeAtual = e.target.value;
            const config = dificuldades[dificuldadeAtual];
            numBuracosAtivos = config.buracos;
            intervalo = config.intervalo;
            janela = config.janela;
            ajustarLayout();
            // Atualizar sessionStorage
            sessionStorage.setItem('whacAMoleDificuldade', dificuldadeAtual);
        });
    }
    
    if (startBtn) {
        startBtn.addEventListener('click', start);
        // Adicionar suporte para touch em dispositivos móveis
        startBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!startBtn.disabled) {
                start();
            }
        });
    }
    
    if (gramado) {
        gramado.addEventListener('mousedown', marteloBaixo);
        gramado.addEventListener('mouseup', marteloCima);
    }
    
    for (let i = 0; i < 10; i++) {
        const buraco = document.getElementById('buraco' + i);
        if (buraco) buraco.addEventListener('click', martelada);
    }
});

function start() {
    if (!nomeJogador) {
        alert('Erro: Jogador não registrado!');
        window.location.href = 'index.html';
        return;
    }
    
    const botao = document.getElementById('start');
    const seletorDificuldade = document.getElementById('dificuldade');
    
    botao.removeEventListener('click', start);
    botao.disabled = true;
    if (seletorDificuldade) seletorDificuldade.disabled = true;
    
    jogoAtivo = true;
    tempoRestante = tempoTotal;
    iniciaTemporizador();
    sobeToupeira();
}

function mostraTempo() {
    const display = document.getElementById('tempo');
    if (display) display.textContent = 'Tempo: ' + tempoRestante + 's';
}

/** Inicia o temporizador do jogo  */
function iniciaTemporizador() {
    mostraTempo();
    idTemporizador = setInterval(() => {
        tempoRestante--;
        mostraTempo();
        if (tempoRestante <= 0) finalizaJogo();
    }, 1000);
}
/** Finaliza o jogo quando o tempo acaba */
function finalizaJogo() {
    clearInterval(idTemporizador);
    jogoAtivo = false;
    
    // Limpar todos os timeouts pendentes
    Object.values(timers).forEach(timer => clearTimeout(timer));
    timers = {};
    timeoutsSobeToupeira.forEach(timeout => clearTimeout(timeout));
    timeoutsSobeToupeira = [];
    
    document.querySelectorAll('img[id^="buraco"]').forEach(t => t.src = 'imagens/hole.png');
    
    // Calcular pontuação final
    const pontuacaoFinal = calcularPontuacao();
    
    // Salvar recorde
    adicionarRecorde(nomeJogador, pontuacaoFinal, dificuldadeAtual);
    
    // Mostrar mensagem de fim de jogo
    alert(`Fim de jogo, ${nomeJogador}!\n\nDificuldade: ${dificuldadeAtual.toUpperCase()}\n\nAcertos: ${acertos}\nPerdidos: ${perdidos}\nErrados: ${errados}\n\nPONTUAÇÃO FINAL: ${pontuacaoFinal}\n\nSeu recorde foi salvo!`);
    
    acertos = perdidos = errados = 0;
    mostraPontuacao();
    
    const botao = document.getElementById('start');
    const seletorDificuldade = document.getElementById('dificuldade');
    
    if (botao) {
        botao.addEventListener('click', start);
        botao.disabled = false;
    }
    if (seletorDificuldade) seletorDificuldade.disabled = false;
}

function sobeToupeira() {
    if (!jogoAtivo) return;
    const buraco = Math.floor(Math.random() * numBuracosAtivos);
    const elementoBuraco = document.getElementById('buraco' + buraco);
    
    if (elementoBuraco && !elementoBuraco.src.includes('hole-mole')) {
        elementoBuraco.src = 'imagens/hole-mole.png';
        timers[buraco] = setTimeout(tiraToupeira, janela, buraco);
    }
    
    const proximoTimeout = setTimeout(sobeToupeira, intervalo);
    timeoutsSobeToupeira.push(proximoTimeout);
}

function tiraToupeira(buraco) {
    const elementoBuraco = document.getElementById('buraco' + buraco);
    if (elementoBuraco && elementoBuraco.src.includes('hole-mole')) {
        elementoBuraco.src = 'imagens/hole.png';
        perdidos++;
        mostraPontuacao();
    }
    delete timers[buraco];
}

function mostraPontuacao() {
    const pontuacoes = {
        acertos: acertos,
        perdidos: perdidos,
        errados: errados
    };
    
    Object.entries(pontuacoes).forEach(([tipo, valor]) => mostraPontuacaoDe(tipo, valor));
    mostraPontuacaoDe('saldo', Math.max(acertos - perdidos - errados, 0));
}

function mostraPontuacaoDe(display, valor) {
    const imgs = document.getElementById(display).children;
    const digitos = [Math.floor(valor/100), Math.floor((valor/10)%10), valor%10];
    digitos.forEach((d, i) => {
        imgs[i].src = `imagens/caractere_${d}.gif`;
        imgs[i].alt = d;
    });
}

const marteloBaixo = () => document.getElementById('idGramado').style.cursor = 'url(imagens/hammerDown.png), default';
const marteloCima = () => document.getElementById('idGramado').style.cursor = 'url(imagens/hammer.png), default';

function martelada(evento) {
    if (!jogoAtivo) return;
    
    const buraco = evento.target.id.replace('buraco', '');
    
    if (evento.target.src.includes('hole-mole')) {
        acertos++;
        evento.target.src = 'imagens/hole.png';
        if (timers[buraco]) {
            clearTimeout(timers[buraco]);
            delete timers[buraco];
        }
    } else {
        errados++;
    }
    mostraPontuacao();
}