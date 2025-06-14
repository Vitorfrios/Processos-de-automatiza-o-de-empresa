<?php
// CONSTANTES BASE (DA PLANILHA)
define('TR_W', 3517); // 1 TR = 3517W
define('U_TETO_ALVENARIA', 3.961);
define('U_PAREDE_ALVENARIA', 2.546);
define('U_PISO_ELETROCENTRO', 2.7);
define('FATOR_LUMINOSIDADE', 7); // W/m²

function calcularCargaTermica($dados) {
    // 1. GANHOS POR PAREDES/TETO
    $ganho_teto = $dados['area'] * U_TETO_ALVENARIA * 20; // ΔT=20°C fixo
    $ganho_paredes = $dados['area_paredes'] * U_PAREDE_ALVENARIA * 13; // ΔT=13°C fixo
    
    // 2. GANHOS POR PISO
    $ganho_piso = $dados['area'] * U_PISO_ELETROCENTRO * 7.5; // ΔT=7.5°C fixo
    
    // 3. GANHOS POR PORTAS
    $ganho_portas = calcularCargaPortas($dados['portas_duplas'], $dados['portas_simples'], $dados['pressurizacao']);
    
    // 4. OUTROS COMPONENTES
    $ganho_luminosidade = $dados['area'] * FATOR_LUMINOSIDADE;
    $ganho_pessoas = $dados['n_pessoas'] * (86.5 + 133.3); // Csp + Clp
    $ganho_dissipacao = $dados['dissipacao'];
    
    // SOMA TOTAL
    $total_w = $ganho_teto + $ganho_paredes + $ganho_piso + $ganho_portas 
               + $ganho_luminosidade + $ganho_pessoas + $ganho_dissipacao;
    
    return [
        'w' => $total_w,
        'tr' => $total_w / TR_W,
        'detalhes' => [
            'teto' => $ganho_teto,
            'paredes' => $ganho_paredes,
            'piso' => $ganho_piso,
            'portas' => $ganho_portas,
            'luminosidade' => $ganho_luminosidade,
            'pessoas' => $ganho_pessoas,
            'dissipacao' => $ganho_dissipacao
        ]
    ];
}

function calcularCargaPortas($n_portas_duplas, $n_portas_simples, $pressurizacao) {
    $carga_duplas = 0.827 * $n_portas_duplas * 0.0402 * (pow($pressurizacao, 0.5)) * 3600;
    $carga_simples = 0.827 * $n_portas_simples * 0.024 * (pow($pressurizacao, 0.5)) * 3600;
    return $carga_duplas + $carga_simples;
}
?>