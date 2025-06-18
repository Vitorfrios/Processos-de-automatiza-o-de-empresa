<?php
require_once __DIR__ . '/calculo.php';
require_once __DIR__ . '/tcpdf/tcpdf.php';
require_once __DIR__ . '/classes/pdf_mc_table.php';
require_once __DIR__ . '/GeradorPropostas.php';

header('Content-Type: application/json');

try {
    function limparDado($dado) {
        return is_string($dado) ? strip_tags(trim($dado)) : $dado;
    }

    function validarNumero($valor, $nomeCampo, $obrigatorio = true, $min = 0, $permiteZero = true) {
        if ($valor === null || $valor === false) {
            return $obrigatorio ? "O campo $nomeCampo é obrigatório" : null;
        }

        if ($permiteZero) {
            if ($valor < $min) {
                return "O campo $nomeCampo deve ser maior ou igual a $min";
            }
        } else {
            if ($valor <= $min) {
                return "O campo $nomeCampo deve ser maior que $min";
            }
        }

        return null;
    }

    // Lê o JSON enviado via fetch
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !is_array($input)) {
        echo json_encode([
            'status' => 'erro',
            'mensagem' => 'JSON inválido ou não recebido'
        ]);
        exit;
    }

    // Coletar dados do corpo JSON
    $dadosForm = [
        'cliente' => [
            'nome' => limparDado($input['cliente']['nome'] ?? ''),
            'empresa' => limparDado($input['cliente']['empresa'] ?? ''),
            'cnpj' => limparDado($input['cliente']['cnpj'] ?? ''),
            'telefone' => limparDado($input['cliente']['telefone'] ?? ''),
            'email' => filter_var($input['cliente']['email'] ?? '', FILTER_SANITIZE_EMAIL)
        ],
        'ambiente' => [
            'area' => filter_var($input['ambiente']['area'] ?? null, FILTER_VALIDATE_FLOAT),
            'pe_direito' => filter_var($input['ambiente']['pe_direito'] ?? null, FILTER_VALIDATE_FLOAT),
            'tipo_construcao' => limparDado($input['ambiente']['tipo_construcao'] ?? 'Eletrocentro')
        ],
        'paredes' => [
            'oeste' => filter_var($input['paredes']['oeste'] ?? null, FILTER_VALIDATE_FLOAT),
            'leste' => filter_var($input['paredes']['leste'] ?? null, FILTER_VALIDATE_FLOAT),
            'norte' => filter_var($input['paredes']['norte'] ?? null, FILTER_VALIDATE_FLOAT),
            'sul' => filter_var($input['paredes']['sul'] ?? null, FILTER_VALIDATE_FLOAT)
        ],
        'divisorias' => isset($input['divisorias']) ? array_map(function($div) {
            return [
                'comprimento' => filter_var($div['comprimento'] ?? null, FILTER_VALIDATE_FLOAT),
                'tipo' => limparDado($div['tipo'] ?? 'nao_climatizada')
            ];
        }, $input['divisorias']) : [],
        'portas' => [
            'simples' => filter_var($input['portas']['simples'] ?? null, FILTER_VALIDATE_INT),
            'duplas' => filter_var($input['portas']['duplas'] ?? null, FILTER_VALIDATE_INT)
        ],
        'pressurizacao' => [
            'necessaria' => filter_var($input['pressurizacao']['necessaria'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'delta_p' => filter_var($input['pressurizacao']['delta_p'] ?? 25, FILTER_VALIDATE_FLOAT)
        ],
        'carga_interna' => [
            'dissipacao' => filter_var($input['carga_interna']['dissipacao'] ?? null, FILTER_VALIDATE_FLOAT),
            'n_pessoas' => filter_var($input['carga_interna']['n_pessoas'] ?? null, FILTER_VALIDATE_INT),
            'vazao_ar' => filter_var($input['carga_interna']['vazao_ar'] ?? null, FILTER_VALIDATE_FLOAT)
        ],
        'setpoint' => [
            'temperatura' => filter_var($input['setpoint']['temperatura'] ?? 25, FILTER_VALIDATE_FLOAT),
            'umidade_absoluta' => filter_var($input['setpoint']['umidade_absoluta'] ?? 9.92, FILTER_VALIDATE_FLOAT)
        ],
        'condicoes_externas' => [
            'temperatura' => filter_var($input['condicoes_externas']['temperatura'] ?? 32, FILTER_VALIDATE_FLOAT),
            'umidade_absoluta' => filter_var($input['condicoes_externas']['umidade_absoluta'] ?? 18.39, FILTER_VALIDATE_FLOAT)
        ],
        'exaustao' => [
            'necessaria' => filter_var($input['exaustao']['necessaria'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'carga_termica' => filter_var($input['exaustao']['carga_termica'] ?? 0, FILTER_VALIDATE_FLOAT),
            'delta_t' => filter_var($input['exaustao']['delta_t'] ?? 10, FILTER_VALIDATE_FLOAT),
            'filtragem' => filter_var($input['exaustao']['filtragem'] ?? false, FILTER_VALIDATE_BOOLEAN)
        ],
        'config' => [
            'backup' => limparDado($input['config']['backup'] ?? 'N+1')
        ],
        'perdas' => [
            'exaustao' => 0,
            'ventilacao' => 0
        ]
    ];

    // Validação
    $erros = [];
    $erros[] = validarNumero($dadosForm['ambiente']['area'], 'Área', true, 0, false);
    $erros[] = validarNumero($dadosForm['ambiente']['pe_direito'], 'Pé-direito', true, 0, false);
    $erros[] = validarNumero($dadosForm['paredes']['oeste'], 'Parede Oeste');
    $erros[] = validarNumero($dadosForm['paredes']['leste'], 'Parede Leste');
    $erros[] = validarNumero($dadosForm['paredes']['norte'], 'Parede Norte');
    $erros[] = validarNumero($dadosForm['paredes']['sul'], 'Parede Sul');
    $erros[] = validarNumero($dadosForm['portas']['simples'], 'Portas Simples');
    $erros[] = validarNumero($dadosForm['portas']['duplas'], 'Portas Duplas');
    $erros[] = validarNumero($dadosForm['carga_interna']['dissipacao'], 'Dissipação');
    $erros[] = validarNumero($dadosForm['carga_interna']['n_pessoas'], 'Número de Pessoas');

    $erros = array_filter($erros);

    if (!empty($erros)) {
        echo json_encode([
            'status' => 'erro',
            'mensagem' => 'Erros de validação encontrados',
            'erros' => array_values($erros)
        ]);
        exit;
    }

    // Processamento
    $calculadora = new CalculadoraHVAC($dadosForm);
    $resultado = $calculadora->calcular();

    $gerador = new GeradorProposta($dadosForm, $resultado);
    $propostas = $gerador->gerarPropostas();

    echo json_encode([
        'status' => 'sucesso',
        'pdfs' => [
            'pc' => base64_encode($propostas['pc']),
            'pt' => base64_encode($propostas['pt'])
        ],
        'nomes_arquivos' => [
            'pc' => 'Proposta_Comercial_' . date('Ymd') . '.pdf',
            'pt' => 'Proposta_Tecnica_' . date('Ymd') . '.pdf'
        ],
        'resultados' => $resultado
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'erro',
        'mensagem' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
