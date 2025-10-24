@echo off
chcp 65001 > nul
title SISTEMA DE CLIMATIZACAO - DEBUG
echo ========================================
echo    MODO DEBUG - SISTEMA DE CLIMATIZACAO
echo ========================================
echo.

cd /d "%~dp0"

echo Executando diagnostico completo...
echo.

python servidor.py

echo.
echo ========================================
echo    STATUS DO SISTEMA
echo ========================================
echo.

if %errorlevel% == 0 (
    echo SISTEMA EXECUTADO COM SUCESSO
) else (
    echo ERRO DETECTADO: %errorlevel%
)

echo.
pause