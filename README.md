# 🎮 Whac-A-Mole Game

Um jogo interativo e responsivo de Whac-A-Mole (Acerte a Toupeira) desenvolvido com HTML, CSS e JavaScript puro.

![Game Preview](imagens/Whac-A-Mole.jpg)

## 🎯 Sobre o Projeto

Jogo clássico de arcade onde o objetivo é acertar o maior número possível de toupeiras que aparecem aleatoriamente nos buracos. O jogo possui três níveis de dificuldade, sistema de pontuação dinâmico e tabela de recordes.

## ✨ Funcionalidades

- 🎮 **Três Níveis de Dificuldade**: Fácil, Médio e Difícil
- 🏆 **Sistema de Recordes**: Armazenamento local dos top 10 jogadores
- 📊 **Pontuação Dinâmica**: Valores diferentes por nível de dificuldade
- 📱 **Totalmente Responsivo**: Otimizado para desktop, tablet e mobile
- 🍎 **Compatível com iOS**: Suporte completo a touch events
- ⏱️ **Timer de 60 segundos**: Contagem regressiva durante o jogo
- 💾 **Armazenamento Local**: Salva recordes e preferências do jogador

## 🎯 Sistema de Pontuação

### Modo Fácil
- ✅ Acerto: +5 pontos
- ⏰ Perdido: -2 pontos
- ❌ Erro: -3 pontos

### Modo Médio
- ✅ Acerto: +10 pontos
- ⏰ Perdido: -4 pontos
- ❌ Erro: -6 pontos

### Modo Difícil
- ✅ Acerto: +20 pontos
- ⏰ Perdido: -8 pontos
- ❌ Erro: -12 pontos

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilização e responsividade
- **JavaScript (Vanilla)**: Lógica do jogo
- **Bootstrap 5.3**: Componentes UI
- **Google Fonts**: Tipografia personalizada
- **LocalStorage**: Persistência de dados

## 📱 Compatibilidade

- ✅ Chrome / Edge / Firefox / Safari
- ✅ iOS Safari (otimizado)
- ✅ Android Chrome
- ✅ Tablets e iPads
- ✅ Desktop (todas as resoluções)

## 🚀 Como Jogar

1. Acesse o menu principal
2. Clique em "Jogar"
3. Digite seu nome e escolha a dificuldade
4. Clique em "Começar Jogo"
5. Acerte as toupeiras que aparecerem
6. Evite clicar em buracos vazios
7. Acumule o máximo de pontos em 60 segundos!

## 📂 Estrutura do Projeto

```
Jogo-Whac-A-Mole/
├── index.html              # Menu principal
├── tabuleiro.html          # Tela do jogo
├── regras.html             # Regras do jogo
├── recordes.html           # Tabela de recordes
├── css/
│   ├── estilo_responsivo.css    # Estilos principais
│   └── estilo.css               # Estilos legados
├── javascript/
│   └── jogo.js             # Lógica do jogo
├── imagens/
│   ├── hole.png            # Buraco vazio
│   ├── hole-mole.png       # Toupeira
│   ├── hammer.png          # Cursor martelo
│   ├── hammerDown.png      # Martelo pressionado
│   └── caractere_*.gif     # Dígitos do placar
└── README.md               # Este arquivo
```

## 🌐 Deploy

### GitHub Pages (Recomendado)

1. No repositório do GitHub, vá em **Settings**
2. Clique em **Pages** no menu lateral
3. Em **Source**, selecione **main** branch
4. Clique em **Save**
5. Acesse: `https://7silasmelo7.github.io/Jogo-Whac-A-Mole`

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

1. Arraste a pasta do projeto para [netlify.com/drop](https://app.netlify.com/drop)
2. Pronto! Sua aplicação está no ar

## 💻 Desenvolvimento Local

Não requer instalação de dependências. Basta abrir o arquivo `index.html` no navegador:

```bash
# Clone o repositório
git clone https://github.com/7silasmelo7/Jogo-Whac-A-Mole.git

# Entre na pasta
cd Jogo-Whac-A-Mole

# Abra no navegador (Windows)
start index.html

# Ou use um servidor local
python -m http.server 8000
# Acesse: http://localhost:8000
```

## 🎨 Personalizações

### Modificar Dificuldade

Edite o arquivo `javascript/jogo.js`:

```javascript
const dificuldades = {
    facil: { buracos: 6, intervalo: 3000, janela: 2000, colunas: 3, pontosAcerto: 5, pontosPerdido: 2, pontosErro: 3 },
    medio: { buracos: 8, intervalo: 2000, janela: 1500, colunas: 4, pontosAcerto: 10, pontosPerdido: 4, pontosErro: 6 },
    dificil: { buracos: 10, intervalo: 1500, janela: 1000, colunas: 5, pontosAcerto: 20, pontosPerdido: 8, pontosErro: 12 }
};
```

### Modificar Tempo do Jogo

```javascript
var tempoTotal = 60; // Alterar para o tempo desejado em segundos
```

## 🐛 Problemas Conhecidos

Nenhum problema crítico identificado. Projeto estável e pronto para produção.

## 📝 Licença

Este projeto é de código aberto e está disponível sob a [MIT License](LICENSE).

## 👤 Autor

**Silas Melo**
- GitHub: [@7silasmelo7](https://github.com/7silasmelo7)
- Projeto: [Jogo-Whac-A-Mole](https://github.com/7silasmelo7/Jogo-Whac-A-Mole)

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um Fork do projeto
2. Criar uma Branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a Branch (`git push origin feature/NovaFuncionalidade`)
5. Abrir um Pull Request

## 📊 Melhorias Futuras

- [ ] Sistema de power-ups
- [ ] Efeitos sonoros
- [ ] Modo multiplayer
- [ ] Compartilhamento de recordes via redes sociais
- [ ] Conquistas e badges
- [ ] Modo escuro
- [ ] Diferentes temas visuais

## 🙏 Agradecimentos

- Bootstrap pela biblioteca de componentes
- Google Fonts pela tipografia
- Comunidade open source

---

⭐ Se você gostou deste projeto, não esqueça de dar uma estrela!

**Desenvolvido com ❤️ por Silas Melo**