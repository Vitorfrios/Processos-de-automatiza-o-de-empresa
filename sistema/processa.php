<?php
require_once 'calculo_termico.php';
require_once 'tcpdf/tcpdf.php';
require_once __DIR__ . '/classes/pdf_mc_table.php';

// Funções auxiliares (mantidas as mesmas do código anterior)
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

// Coletar e validar dados do cliente
$cliente = [
    'nome' => limparDado($_POST['cliente']['nome'] ?? ''),
    'empresa' => limparDado($_POST['cliente']['empresa'] ?? ''),
    'cnpj' => limparDado($_POST['cliente']['cnpj'] ?? ''),
    'telefone' => limparDado($_POST['cliente']['telefone'] ?? ''),
    'email' => filter_var($_POST['cliente']['email'] ?? '', FILTER_SANITIZE_EMAIL)
];

// Coletar e validar dados do ambiente
$ambiente = [
    'area' => filter_var($_POST['ambiente']['area'] ?? null, FILTER_VALIDATE_FLOAT),
    'pe_direito' => filter_var($_POST['ambiente']['pe_direito'] ?? null, FILTER_VALIDATE_FLOAT)
];

// Coletar e validar dados das paredes
$paredes = [
    'oeste' => filter_var($_POST['paredes']['oeste'] ?? null, FILTER_VALIDATE_FLOAT),
    'leste' => filter_var($_POST['paredes']['leste'] ?? null, FILTER_VALIDATE_FLOAT),
    'norte' => filter_var($_POST['paredes']['norte'] ?? null, FILTER_VALIDATE_FLOAT),
    'sul' => filter_var($_POST['paredes']['sul'] ?? null, FILTER_VALIDATE_FLOAT)
];

// Coletar e validar dados das portas
$portas = [
    'simples' => filter_var($_POST['portas']['simples'] ?? null, FILTER_VALIDATE_INT),
    'duplas' => filter_var($_POST['portas']['duplas'] ?? null, FILTER_VALIDATE_INT)
];

// Coletar e validar pressurização
$pressurizacao = filter_var($_POST['pressurizacao'] ?? null, FILTER_VALIDATE_FLOAT);

// Coletar e validar carga interna
$carga_interna = [
    'dissipacao' => filter_var($_POST['carga_interna']['dissipacao'] ?? null, FILTER_VALIDATE_FLOAT),
    'n_pessoas' => filter_var($_POST['carga_interna']['n_pessoas'] ?? null, FILTER_VALIDATE_INT),
    'vazao_ar' => filter_var($_POST['carga_interna']['vazao_ar'] ?? null, FILTER_VALIDATE_FLOAT)
];

// Configurações
$config = [
    'backup' => limparDado($_POST['config']['backup'] ?? '')
];

// Validação dos campos
$erros = [];

// Validar ambiente
$erros[] = validarNumero($ambiente['area'], 'Área', true, 0, false);
$erros[] = validarNumero($ambiente['pe_direito'], 'Pé-direito', true, 0, false);

// Validar paredes
$erros[] = validarNumero($paredes['oeste'], 'Parede Oeste');
$erros[] = validarNumero($paredes['leste'], 'Parede Leste');
$erros[] = validarNumero($paredes['norte'], 'Parede Norte');
$erros[] = validarNumero($paredes['sul'], 'Parede Sul');

// Validar portas
$erros[] = validarNumero($portas['simples'], 'Portas Simples');
$erros[] = validarNumero($portas['duplas'], 'Portas Duplas');

// Validar pressurização e carga interna
$erros[] = validarNumero($pressurizacao, 'Pressurização');
$erros[] = validarNumero($carga_interna['dissipacao'], 'Dissipação');
$erros[] = validarNumero($carga_interna['n_pessoas'], 'Número de Pessoas');
$erros[] = validarNumero($carga_interna['vazao_ar'], 'Vazão de Ar');

// Remover valores nulos (campos válidos)
$erros = array_filter($erros);

// Se houver erros, retornar
if (!empty($erros)) {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erros de validação encontrados',
        'erros' => $erros
    ]);
    exit;
}

// Preparar dados para cálculo
$dadosCalculo = [
    'ambiente' => [
        'area' => (float)$ambiente['area'],
        'pe_direito' => (float)$ambiente['pe_direito']
    ],
    'paredes' => [
        'oeste' => (float)$paredes['oeste'],
        'leste' => (float)$paredes['leste'],
        'norte' => (float)$paredes['norte'],
        'sul' => (float)$paredes['sul']
    ],
    'portas' => [
        'simples' => (int)$portas['simples'],
        'duplas' => (int)$portas['duplas']
    ],
    'pressurizacao' => (float)$pressurizacao,
    'carga_interna' => [
        'dissipacao' => (float)$carga_interna['dissipacao'],
        'n_pessoas' => (int)$carga_interna['n_pessoas'],
        'vazao_ar' => (float)$carga_interna['vazao_ar']
    ]
];

// Executar cálculo térmico
try {
    $resultado = calcularCargaTermica($dadosCalculo);
    
    // Preparar dados completos para PDF
    $dadosCompletos = [
        'cliente' => $cliente,
        'ambiente' => array_merge($dadosCalculo['ambiente'], [
            'projeto' => 'Projeto de Climatização',
            'tipo' => 'Comercial',
            'setpoint' => 24 // Temperatura desejada
        ]),
        'paredes' => $dadosCalculo['paredes'],
        'portas' => $dadosCalculo['portas'],
        'config' => array_merge($config, [
            'pressurizacao' => $pressurizacao
        ]),
        'resultados' => [
            'total_w' => $resultado['total_w'],
            'total_tr' => $resultado['total_tr'],
            'detalhes' => [
                'externos' => [
                    'total' => $resultado['detalhes']['paredes'] + $resultado['detalhes']['teto']
                ],
                'piso' => ['total' => $resultado['detalhes']['piso']],
                'iluminacao' => $resultado['detalhes']['iluminacao'],
                'pessoas' => $resultado['detalhes']['pessoas'],
                'ar_externo' => $resultado['detalhes']['ar_externo']
            ],
            'solucoes' => [
                [
                    'modelo' => 'Modelo X-3000',
                    'capacidade' => 10, // TR
                    'sem_backup' => ceil($resultado['total_tr'] / 10),
                    'com_backup' => ceil($resultado['total_tr'] / 10) + 1
                ]
            ]
        ]
    ];

    // Salvar em arquivo JSON (opcional)
    $caminhoArquivo = __DIR__ . '/dados/entrada.json';
    if (!file_exists(dirname($caminhoArquivo))) {
        mkdir(dirname($caminhoArquivo), 0777, true);
    }
    
    file_put_contents(
        $caminhoArquivo,
        json_encode($dadosCompletos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );

    // Gerar PDF
    ob_start();
    require __DIR__ . '/gera_pdf.php';
    $pdfContent = ob_get_clean();

    // Salvar PDF em arquivo (opcional)
    $pdfPath = __DIR__ . '/dados/proposta.pdf';
    file_put_contents($pdfPath, $pdfContent);

    // Retornar sucesso com URL do PDF
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'sucesso',
        'mensagem' => 'Cálculo realizado com sucesso',
        'resultado' => $resultado,
        'pdf_url' => 'dados/proposta.pdf' // Ou um caminho público
    ]);
    
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro durante o processamento',
        'erro' => $e->getMessage()
    ]);
}