<?php
// SEMPRE deve ser a primeira linha do arquivo, sem espaços antes!
header('Content-Type: text/html; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Inclui o arquivo de cálculos
require 'calculo_termico.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Sanitização segura dos dados
    $dados = [
        'cliente' => [
            'nome' => htmlspecialchars($_POST['nome'] ?? ''),
            'empresa' => htmlspecialchars($_POST['empresa'] ?? ''),
            'cnpj' => preg_replace('/[^0-9]/', '', $_POST['cnpj'] ?? ''),
            'telefone' => filter_var($_POST['telefone'], FILTER_SANITIZE_NUMBER_INT),
            'email' => filter_var($_POST['email'], FILTER_SANITIZE_EMAIL)
        ],
        'ambiente' => [
            'projeto' => htmlspecialchars($_POST['projeto'] ?? ''),
            'area' => filter_var($_POST['area'], FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION),
            'pe_direito' => filter_var($_POST['pe_direito'], FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION),
            'area_paredes' => filter_var($_POST['area_paredes'], FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION),
            'dissipacao' => filter_var($_POST['dissipacao'], FILTER_SANITIZE_NUMBER_FLOAT),
            'n_pessoas' => filter_var($_POST['n_pessoas'], FILTER_SANITIZE_NUMBER_INT),
            'pressurizacao' => filter_var($_POST['pressurizacao'], FILTER_SANITIZE_NUMBER_FLOAT),
            'portas_duplas' => filter_var($_POST['portas_duplas'], FILTER_SANITIZE_NUMBER_INT),
            'portas_simples' => filter_var($_POST['portas_simples'], FILTER_SANITIZE_NUMBER_INT)
        ],
        'backup' => htmlspecialchars($_POST['backup'] ?? 'N')
    ];

    // Cálculo da carga térmica
    $carga = calcularCargaTermica($dados['ambiente']);

    // Prepara a proposta completa
    $proposta = [
        'cliente' => $dados['cliente'],
        'ambiente' => $dados['ambiente'],
        'carga_termica' => $carga,
        'backup' => $dados['backup']
    ];

    // Redirecionamento SEM output prévio
    header("Location: gera_pdf.php?dados=" . urlencode(json_encode($proposta)));
    exit;
}

// Se chegar aqui sem ser POST, redireciona
header("Location: index.html");
exit;
?>