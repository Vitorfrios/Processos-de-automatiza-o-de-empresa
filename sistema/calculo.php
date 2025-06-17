<?php
class CalculadoraHVAC {
    private $dados;
    private $modelos;
    
    public function __construct($dados) {
        $this->dados = $dados;
        $this->carregarModelos();
        $this->validarDados();
        
        // Inicializa arrays que podem estar faltando
        $this->dados['divisorias'] = $this->dados['divisorias'] ?? [];
        $this->dados['perdas'] = $this->dados['perdas'] ?? ['exaustao' => 0, 'ventilacao' => 0];
        $this->dados['pressurizacao'] = $this->dados['pressurizacao'] ?? ['necessaria' => false, 'delta_p' => 25];
        $this->dados['exaustao'] = $this->dados['exaustao'] ?? ['necessaria' => false];
        $this->dados['condicoes_externas'] = $this->dados['condicoes_externas'] ?? [
            'temperatura' => 32,
            'umidade_absoluta' => 18.39
        ];
    }
    
    private function carregarModelos() {
        $caminho = __DIR__ . '/dados/modelos.json';
        if (!file_exists($caminho)) {
            throw new Exception("Arquivo de modelos não encontrado: " . $caminho);
        }
        
        $json = file_get_contents($caminho);
        $this->modelos = json_decode($json, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Erro ao decodificar JSON: " . json_last_error_msg());
        }
        
        // Verifica estrutura básica
        $camposObrigatorios = ['materiais', 'fatores', 'configuracoes', 'modelos_equipamentos'];
        foreach ($camposObrigatorios as $campo) {
            if (!isset($this->modelos[$campo])) {
                throw new Exception("Configuração incompleta do sistema - campo '$campo' faltando");
            }
        }
    }
    
    private function validarDados() {
        $camposObrigatorios = [
            'ambiente.area', 'ambiente.pe_direito', 'ambiente.tipo_construcao',
            'paredes.oeste', 'paredes.leste', 'paredes.norte', 'paredes.sul',
            'portas.simples', 'portas.duplas', 'pressurizacao.delta_p',
            'carga_interna.dissipacao', 'carga_interna.n_pessoas',
            'setpoint.temperatura'
        ];
        
        foreach ($camposObrigatorios as $campo) {
            $parts = explode('.', $campo);
            $valor = $this->dados;
            foreach ($parts as $part) {
                if (!isset($valor[$part])) {
                    throw new Exception("Campo obrigatório faltando: $campo");
                }
                $valor = $valor[$part];
            }
        }
    }
    
    public function calcular() {
        $resultado = [
            'ganhos' => [],
            'perdas' => [],
            'totais' => [],
            'solucao' => [
                'climatizacao' => [],
                'pressurizacao' => null,
                'exaustao' => null
            ]
        ];
        
        $resultado['ganhos'] = $this->calcularGanhosTermicos();
        $resultado['perdas'] = $this->calcularPerdas();
        $resultado['totais'] = $this->calcularTotais($resultado['ganhos'], $resultado['perdas']);
        
        $solucoes = $this->buscarSolucoesPossiveis($resultado['totais']['total_tr']);
        
        if (!empty($solucoes)) {
            $resultado['solucao']['climatizacao'] = $solucoes;
            
            if (($this->dados['pressurizacao']['necessaria'] ?? false)) {
                $resultado['solucao']['pressurizacao'] = $this->modelos['modelos_equipamentos']['pressurizacao'][0] ?? null;
            }
            
            if (($this->dados['exaustao']['necessaria'] ?? false)) {
                $resultado['solucao']['exaustao'] = $this->modelos['modelos_equipamentos']['exaustao'][0] ?? null;
            }
        }
        
        return $resultado;
    }
    
    private function calcularGanhosTermicos() {
        $ganhos = [];
        $tipoConstrucao = $this->dados['ambiente']['tipo_construcao'] ?? 'eletrocentro';
        
        $configMateriais = $this->modelos['solucoes_padrao']['configuracoes_tipicas'][$tipoConstrucao] ?? 
                         $this->modelos['solucoes_padrao']['configuracoes_tipicas']['eletrocentro'];
        
        $ganhos['transmissao'] = [
            'teto' => $this->calcularGanhoTeto($configMateriais['u_teto'] ?? 1.145),
            'paredes_externas' => $this->calcularGanhoParedesExternas($configMateriais['u_parede'] ?? 1.12),
            'piso' => $this->calcularGanhoPiso($configMateriais['u_piso'] ?? 2.7),
            'divisorias' => $this->calcularGanhoDivisorias()
        ];
        
        $ganhos['internos'] = [
            'iluminacao' => $this->calcularGanhoIluminacao(),
            'equipamentos' => $this->dados['carga_interna']['dissipacao'] ?? 0,
            'pessoas' => $this->calcularGanhoPessoas()
        ];
        
        $ganhos['ar_externo'] = $this->calcularGanhoArExterno();
        
        return $ganhos;
    }
    
    private function calcularGanhoTeto($u_teto) {
        $deltaT = $this->modelos['materiais']['teto']['alvenaria']['delta_t_padrao'] ?? 36;
        return ($this->dados['ambiente']['area'] ?? 0) * $u_teto * $deltaT;
    }
    
    private function calcularGanhoParedesExternas($u_parede) {
        $area_total = (
            ($this->dados['paredes']['oeste'] ?? 0) + 
            ($this->dados['paredes']['leste'] ?? 0) +
            ($this->dados['paredes']['norte'] ?? 0) + 
            ($this->dados['paredes']['sul'] ?? 0)
        ) * ($this->dados['ambiente']['pe_direito'] ?? 0);
        
        $deltaT = $this->modelos['materiais']['paredes']['alvenaria']['delta_t_padrao'] ?? 13;
        return $area_total * $u_parede * $deltaT;
    }
    
    private function calcularGanhoPiso($u_piso) {
        $deltaT = $this->modelos['materiais']['piso']['eletrocentro']['delta_t_padrao'] ?? 6;
        return ($this->dados['ambiente']['area'] ?? 0) * $u_piso * $deltaT;
    }
    
    private function calcularGanhoDivisorias() {
        $ganho_total = 0;
        
        if (!empty($this->dados['divisorias'])) {
            foreach ($this->dados['divisorias'] as $divisoria) {
                $tipo = $divisoria['tipo'] ?? 'nao_climatizada';
                $config = $this->modelos['materiais']['divisorias'][$tipo] ?? 
                         ['condutividade' => 3.0, 'delta_t_padrao' => 10];
                
                $area = ($divisoria['comprimento'] ?? 0) * ($this->dados['ambiente']['pe_direito'] ?? 0);
                $ganho_total += $area * $config['condutividade'] * $config['delta_t_padrao'];
            }
        }
        
        return $ganho_total;
    }
    
    private function calcularGanhoIluminacao() {
        return ($this->dados['ambiente']['area'] ?? 0) * ($this->modelos['fatores']['iluminacao'] ?? 7);
    }
    
    private function calcularGanhoPessoas() {
        $fatores = $this->modelos['fatores']['calor_pessoa'] ?? ['sensivel' => 86.5, 'latente' => 133.3];
        return ($this->dados['carga_interna']['n_pessoas'] ?? 0) * ($fatores['sensivel'] + $fatores['latente']);
    }
    
    private function calcularGanhoArExterno() {
        $vazao_lps = $this->dados['carga_interna']['vazao_ar'] ?? $this->calcularVazaoArExterno();
        $vazao_kgh = $vazao_lps * 
                    ($this->modelos['fatores']['renovacao_ar']['fator_conversao_lps_para_kgh'] ?? 3.6) * 
                    ($this->modelos['configuracoes']['unidades']['densidade_ar'] ?? 1.14);
        
        $deltaT = ($this->dados['condicoes_externas']['temperatura'] ?? 32) - 
                 ($this->dados['setpoint']['temperatura'] ?? 25);
        
        $ganho_sensivel = $vazao_kgh * 
                         ($this->modelos['configuracoes']['unidades']['calor_especifico_ar'] ?? 0.24) * 
                         $deltaT * 1.16;
        
        $deltaUA = ($this->dados['condicoes_externas']['umidade_absoluta'] ?? 18.39) - 
                  ($this->dados['setpoint']['umidade_absoluta'] ?? 9.92);
        
        $ganho_latente = $vazao_lps * 
                        ($this->modelos['configuracoes']['unidades']['fator_ar_externo'] ?? 3.01) * 
                        $deltaUA;
        
        return $ganho_sensivel + $ganho_latente;
    }
    
    private function calcularVazaoArExterno() {
        $vazao_pessoas = ($this->dados['carga_interna']['n_pessoas'] ?? 0) * 
                        ($this->modelos['fatores']['renovacao_ar']['por_pessoa'] ?? 5);
        $vazao_infiltracao = $this->calcularInfiltracaoPortas();
        return $vazao_pessoas + $vazao_infiltracao;
    }
    
    private function calcularInfiltracaoPortas() {
        $infiltracao = 0;
        $deltaP = $this->dados['pressurizacao']['delta_p'] ?? 25;
        $fatoresPortas = $this->modelos['fatores']['portas'] ?? [
            'simples' => ['coeficiente_infiltracao' => 0.024],
            'duplas' => ['coeficiente_infiltracao' => 0.0402]
        ];
        
        if (($this->dados['portas']['duplas'] ?? 0) > 0) {
            $coef = $fatoresPortas['duplas']['coeficiente_infiltracao'] ?? 0.0402;
            $infiltracao += 0.827 * $this->dados['portas']['duplas'] * $coef * sqrt($deltaP) * 3600;
        }
        
        if (($this->dados['portas']['simples'] ?? 0) > 0) {
            $coef = $fatoresPortas['simples']['coeficiente_infiltracao'] ?? 0.024;
            $infiltracao += 0.827 * $this->dados['portas']['simples'] * $coef * sqrt($deltaP) * 3600;
        }
        
        return $infiltracao / 3.6;
    }
    
    private function calcularPerdas() {
        return [
            'exaustao' => $this->dados['perdas']['exaustao'] ?? 0,
            'ventilacao' => $this->dados['perdas']['ventilacao'] ?? 0
        ];
    }
    
    private function calcularTotais($ganhos, $perdas) {
        $total_ganhos = array_sum($ganhos['transmissao'] ?? []) + 
                       array_sum($ganhos['internos'] ?? []) + 
                       ($ganhos['ar_externo'] ?? 0);
        
        $total_w = ($total_ganhos - array_sum($perdas ?? [])) * 
                  ($this->modelos['configuracoes']['unidades']['fator_seguranca'] ?? 1.1);
        
        $tr_para_w = $this->modelos['configuracoes']['unidades']['tr_para_w'] ?? 3516.85;
        $total_tr = ($tr_para_w > 0) ? ($total_w / $tr_para_w) : 0;
        
        return [
            'total_w' => $total_w,
            'total_tr' => $total_tr,
            'total_tr_arredondado' => ceil($total_tr)
        ];
    }
    
    private function buscarSolucoesPossiveis($totalTR) {
        $solucoes = [];
        $modelos = $this->modelos['modelos_equipamentos']['climatizacao'] ?? [];
        
        foreach ($modelos as $modelo) {
            if (($modelo['tipo'] ?? '') == 'wall_mounted') {
                $capacidade = $modelo['capacidade_tr'] ?? 5;
                $qtd_base = ceil($totalTR / max(1, $capacidade));
                
                if ($qtd_base <= 3) {
                    $solucoes[] = [
                        'modelo' => $modelo['modelo'] ?? 'Desconhecido',
                        'capacidade_tr' => $capacidade,
                        'quantidade' => $qtd_base,
                        'quantidade_n1' => $qtd_base + 1,
                        'quantidade_2n' => $qtd_base * 2,
                        'preco_unitario' => $modelo['preco_base'] ?? 0,
                        'opcionais_disponiveis' => $modelo['opcionais'] ?? []
                    ];
                }
            }
        }
        
        usort($solucoes, function($a, $b) {
            return ($a['quantidade'] ?? 0) <=> ($b['quantidade'] ?? 0);
        });
        
        return $solucoes;
    }
}