#!/bin/bash

# Script de Deploy para GitHub Pages
# Jogo Whac-A-Mole

echo "🚀 Iniciando processo de deploy..."

# Adicionar todos os arquivos
echo "📝 Adicionando arquivos modificados..."
git add .

# Commit das mudanças
echo "💾 Criando commit..."
git commit -m "Deploy: Atualização do jogo Whac-A-Mole $(date +%Y-%m-%d)"

# Push para o GitHub
echo "☁️ Enviando para o GitHub..."
git push origin main

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "🌐 Seu jogo estará disponível em:"
echo "   https://7silasmelo7.github.io/Jogo-Whac-A-Mole"
echo ""
echo "⚙️ Para ativar o GitHub Pages:"
echo "   1. Acesse: https://github.com/7silasmelo7/Jogo-Whac-A-Mole/settings/pages"
echo "   2. Em 'Source', selecione 'main' branch"
echo "   3. Clique em 'Save'"
echo "   4. Aguarde alguns minutos para o site ficar disponível"
echo ""
