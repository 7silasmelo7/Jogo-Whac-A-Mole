/** quantidade de acertos */
var acertos;
acertos = 0;    

/** quantidade de toupeiras perdidas */
var perdidos = 0;

/** quantidade de marteladas erradas */
var errados = 0;

/** tempo entre cada toupeira sair do buraco */
var intervalo = 3000;

/** tempo que a toupeira fica fora do buraco */
var janela = 2000;

/** timer que controla o tempo da toupeira fora do buraco */
var timer = null;

/**tempo total do jogo em segundos */
var tempoTotal = 60;

/** tempo restante do jogo */
var tempoRestante = tempoTotal;

/** ID do intervalo do jogo  */
var idTemporizador = null;

/** controle do andamento do jogo */
var jogoAtivo = false;

function ajustarLayout() {
    let gramado = document.getElementById('idGramado');
    let larguraTela = window.innerWidth;
    if (larguraTela < 500) {
        gramado.style.gridTemplateColumns = 'repeat(2, 1fr)';
    }else {
        gramado.style.gridTemplateColumns = 'repeat(3, 1fr)';
    }
     
}

window.onload = ajustarLayout;
window.onresize = ajustarLayout;

// Suporte a teclado para elementos com role="button" e tabindex="0"
function handleKeyDown(event){
    // Aceita Enter e Space
    var key = event.key || event.keyCode;
    if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 13){
        event.preventDefault();
        var id = event.target && event.target.id;
        if (id){
            escolherQuadrado(id);
        }
    }
}


onload = function () {
    document.getElementById('start').addEventListener('click', start);
    document.getElementById('idGramado').addEventListener('mousedown', marteloBaixo);
    document.getElementById('idGramado').addEventListener('mouseup', marteloCima);
    document.getElementById('buraco0').addEventListener('click', martelada);
    document.getElementById('buraco1').addEventListener('click', martelada);
    document.getElementById('buraco2').addEventListener('click', martelada);
    document.getElementById('buraco3').addEventListener('click', martelada);
    document.getElementById('buraco4').addEventListener('click', martelada);
};

/**
 * Sobe uma toupeira
 * Remove o evento do botão start
 */
function start() {
    var botao = document.getElementById('start')

    botao.removeEventListener('click', start);
    botao.disable = true;
    jogoAtivo = true;
    tempoRestante = tempoTotal;
    iniciaTemporizador();
    sobeToupeira();
}

/** Inicia o temporizador do jogo  */
function iniciaTemporizador() {
    mostraTempo();
    idTemporizador = setInterval(function (){
        tempoRestante--;
        mostraTempo();

        if (tempoRestante <= 0){
            finalizaJogo();
        }
    }, 1000);
}

/** Mostra o tempo restante no display */
function mostraTempo() {
    let display = document.getElementById('tempo');
    if (display) {
        display.textContent = 'Tempo: ' + tempoRestante + 's';
    }
}
/** Finaliza o jogo quando o tempo acaba */
function finalizaJogo() {
    clearInterval(idTemporizador);
    jogoAtivo = false;
    let toupeiras = document.querySelectorAll('img[id^="buraco"]');
    toupeiras.forEach(t => t.src = 'imagens/hole.png');
    alert('Fim de jogo! Pontuação final:' + acertos + ' | Pontos perdidos:' + perdidos + ' | Errados:' + errados);

// Reinicia variáveis
    acertos = 0;
    perdidos = 0;
    errados = 0;
    mostraPontuacao();

    document.getElementById('start').addEventListener('click', start);
    document.getElementById('start').disable = false;
}

/**
 * Coloca a toupeira para fora do buraco.
 * Recalcula o tempo que a toupeira fica fora do buraco.
 * @fires remover a toupeira
 * @fires próximo evento.
 */
function sobeToupeira() {
    if (!jogoAtivo) return;
    var buraco = Math.floor(Math.random() * 5);
    var objBuraco = document.getElementById('buraco' + buraco);
    objBuraco.src = 'imagens/hole-mole.png';
    timer = setTimeout(tiraToupeira, janela, buraco);
    setTimeout(sobeToupeira, intervalo);
}

/**
 * Remove a toupeira de um buraco
 * 
 * @param {int} buraco número do buraco onde está a toupeira
 */
function tiraToupeira(buraco) {
    var objBuraco = document.getElementById('buraco' + buraco);
    objBuraco.src = 'imagens/hole.png';
    perdidos++;
    mostraPontuacao();
}

/**
 * Mostra a pontuação no display de 16 segmentos.
 * A função calcula e exibe o saldo.
 */
function mostraPontuacao() {
    mostraPontuacaoDe('acertos', acertos);
    mostraPontuacaoDe('perdidos', perdidos);
    mostraPontuacaoDe('errados', errados);
    mostraPontuacaoDe('saldo', Math.max(acertos - perdidos - errados, 0));
}

/**
 * Mostra um valor no display.
 * 
 * @param {object image} display imagens com display de 16 segmentos
 * @param {int} valor valor a ser exibido com até 3 dígitos
 */
function mostraPontuacaoDe(display, valor) {
    // pega as imagens
    let objCentena = document.getElementById(display).firstChild;
    let objDezena = objCentena.nextSibling;
    let objUnidade = objDezena.nextSibling;

    // calcula o valor de cada algarismo
    let centena = parseInt(valor/100);
    let dezena = parseInt((valor/10)%10)
    let unidade = (valor % 10)

    // muda a imagem e o valor do atributo para ledor de tela
    objCentena.src = 'imagens/caractere_' + centena + '.gif';
    objCentena.alt = centena;
    objDezena.src = 'imagens/caractere_' + dezena + '.gif';
    objDezena.alt = dezena;
    objUnidade.src = 'imagens/caractere_' + unidade + '.gif';
    objUnidade.alt = unidade;
}

/**
 * Coloca o martelo para baixo.
 */
function marteloBaixo() {
    document.getElementById('idGramado').style.cursor = 'url(imagens/hammerDown.png), default';
}

/**
 * Coloca o martelo para cima.
 */
function marteloCima() {
    document.getElementById('idGramado').style.cursor = 'url(imagens/hammer.png), default';
}

/**
 * Trata o evento de uma martelada, ou seja, um click do mouse sobre o gramado.
 * Ao final da martelada, exibe a pontuação atualizada.
 * 
 * @listens event:click
 * @param {event} evento 
 */
function martelada(evento) {
    if (!jogoAtivo) return;

    if (evento.target.src.includes('hole-mole')) {
        // acertou
        acertos++;
        evento.target.src = 'imagens/hole.png';
        clearTimeout(timer);
    }
    else {
        // errou
        errados++;
    }
    mostraPontuacao();
}