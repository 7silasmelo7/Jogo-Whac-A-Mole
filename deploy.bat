@echo off
REM Script de Deploy para GitHub Pages - Windows
REM Jogo Whac-A-Mole

echo.
echo ========================================
echo    DEPLOY - WHAC-A-MOLE GAME
echo ========================================
echo.

echo [1/4] Adicionando arquivos modificados...
git add .

echo.
echo [2/4] Criando commit...
set hora=%time:~0,2%
set hora=%hora: =0%
git commit -m "Deploy: Atualizacao do jogo Whac-A-Mole - %date% %hora%:%time:~3,2%"

echo.
echo [3/4] Enviando para o GitHub...
git push origin main

echo.
echo [4/4] Verificando status...
git status

echo.
echo ========================================
echo    DEPLOY CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Seu jogo estara disponivel em:
echo https://7silasmelo7.github.io/Jogo-Whac-A-Mole
echo.
echo Para ativar o GitHub Pages (primeira vez):
echo 1. Acesse: https://github.com/7silasmelo7/Jogo-Whac-A-Mole/settings/pages
echo 2. Em 'Source', selecione 'main' branch
echo 3. Clique em 'Save'
echo 4. Aguarde 2-3 minutos para o site ficar disponivel
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
