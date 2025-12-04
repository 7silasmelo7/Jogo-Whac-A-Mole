var acertos = 0, perdidos = 0, errados = 0;
var intervalo = 3000, janela = 2000;
var timer = null, idTemporizador = null;
var tempoTotal = 60, tempoRestante = tempoTotal;
var jogoAtivo = false;

const ajustarLayout = () => document.getElementById('idGramado').style.gridTemplateColumns = window.innerWidth < 500 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)';
window.addEventListener('load', ajustarLayout);
window.addEventListener('resize', ajustarLayout);

window.addEventListener('load', () => {
    document.getElementById('start').addEventListener('click', start);
    document.getElementById('idGramado').addEventListener('mousedown', marteloBaixo);
    document.getElementById('idGramado').addEventListener('mouseup', marteloCima);
    for (let i = 0; i < 5; i++) {
        document.getElementById('buraco' + i).addEventListener('click', martelada);
    }
});

function start() {
    const botao = document.getElementById('start');
    botao.removeEventListener('click', start);
    botao.disabled = true;
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
    document.querySelectorAll('img[id^="buraco"]').forEach(t => t.src = 'imagens/hole.png');
    alert(`Fim de jogo! Acertos: ${acertos} | Perdidos: ${perdidos} | Errados: ${errados}`);
    acertos = perdidos = errados = 0;
    mostraPontuacao();
    const botao = document.getElementById('start');
    botao.addEventListener('click', start);
    botao.disabled = false;
}

function sobeToupeira() {
    if (!jogoAtivo) return;
    const buraco = Math.floor(Math.random() * 5);
    document.getElementById('buraco' + buraco).src = 'imagens/hole-mole.png';
    timer = setTimeout(tiraToupeira, janela, buraco);
    setTimeout(sobeToupeira, intervalo);
}

function tiraToupeira(buraco) {
    document.getElementById('buraco' + buraco).src = 'imagens/hole.png';
    perdidos++;
    mostraPontuacao();
}

function mostraPontuacao() {
    ['acertos', 'perdidos', 'errados'].forEach(tipo => mostraPontuacaoDe(tipo, eval(tipo)));
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
    if (evento.target.src.includes('hole-mole')) {
        acertos++;
        evento.target.src = 'imagens/hole.png';
        clearTimeout(timer);
    } else {
        errados++;
    }
    mostraPontuacao();
}