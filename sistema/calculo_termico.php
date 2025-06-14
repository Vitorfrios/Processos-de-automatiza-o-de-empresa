<?php
// Constantes globais
define('TR_W', 3517); // 1TR = 3517W
define('U_TETO_ALVENARIA', 3.961);
define('U_PAREDE_ALVENARIA', 2.546);
define('U_PISO_ELETROCENTRO', 2.7);
define('FATOR_LUMINOSIDADE', 7);

function calcularCargaTermica($dados) {
    // Validação dos dados obrigatórios
    if (
        empty($dados['paredes']['oeste']) || empty($dados['paredes']['leste']) ||
        empty($dados['paredes']['norte']) || empty($dados['paredes']['sul']) ||
        empty($dados['ambiente']['area']) || empty($dados['ambiente']['pe_direito']) ||
        !isset($dados['portas']['simples']) || !isset($dados['portas']['duplas']) ||
        !isset($dados['pressurizacao']) ||
        !isset($dados['carga_interna']['dissipacao']) || !isset($dados['carga_interna']['n_pessoas']) ||
        !isset($dados['carga_interna']['vazao_ar'])
    ) {
        throw new Exception("Dados insuficientes para cálculo.");
    }

    // Cálculo da área total das paredes
    $area_paredes = (
        $dados['paredes']['oeste'] + $dados['paredes']['leste'] +
        $dados['paredes']['norte'] + $dados['paredes']['sul']
    ) * $dados['ambiente']['pe_direito'];

    $ganhos = [
        'teto' => $dados['ambiente']['area'] * U_TETO_ALVENARIA * 20,
        'paredes' => $area_paredes * U_PAREDE_ALVENARIA * 13,
        'portas' => calcularPortas($dados['portas'], $dados['pressurizacao']),
        'piso' => $dados['ambiente']['area'] * U_PISO_ELETROCENTRO * 7.5,
        'iluminacao' => $dados['ambiente']['area'] * FATOR_LUMINOSIDADE,
        'dissipacao' => $dados['carga_interna']['dissipacao'],
        'pessoas' => $dados['carga_interna']['n_pessoas'] * (86.5 + 133.3),
        'ar_externo' => calcularArExterno($dados['carga_interna']['vazao_ar']),
    ];

    $total_w = array_sum($ganhos);
    $total_tr = $total_w / TR_W;

    return [
        'detalhes' => $ganhos,
        'total_w' => $total_w,
        'total_tr' => $total_tr,
    ];
}

function calcularPortas($portas, $pressurizacao) {
    return (0.827 * $portas['duplas'] * 0.0402 * sqrt($pressurizacao) * 3600) +
           (0.827 * $portas['simples'] * 0.024 * sqrt($pressurizacao) * 3600);
}

function calcularArExterno($vazao) {
    $sensivel = $vazao * 0.24 * 10 / 1000 * 1.16;
    $latente = $vazao * 3.01 * 8.47;
    return $sensivel + $latente;
}

function gerarSolucoes($total_tr, $backup) {
    $modelos = json_decode(file_get_contents('dados/modelos.json'), true);
    $solucoes = [];

    foreach ($modelos as $modelo) {
        $qtd_base = ceil($total_tr / $modelo['capacidade_tr']);

        $solucoes[] = [
            'modelo' => $modelo['modelo'],
            'capacidade' => $modelo['capacidade_tr'],
            'N' => $qtd_base,
            'N+1' => $qtd_base + 1,
            '2N' => $qtd_base * 2,
            'preco_base' => $modelo['preco_base'],
        ];
    }

    return $solucoes;
}
?>
