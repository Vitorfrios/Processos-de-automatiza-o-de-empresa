<?php
/**
 * Script para geração de PDF de proposta técnica
 * Versão robusta com tratamento completo de erros
 */

// =============================================
// CONFIGURAÇÃO INICIAL E PROTEÇÃO CONTRA ERROS
// =============================================

// Nível máximo de buffer para evitar saídas precoces
while (ob_get_level() > 0) ob_end_clean();
ob_start();

// Desativa warnings que podem gerar saída indesejada
error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);
ini_set('display_errors', 0);

// =============================================
// REQUISITOS E DEPENDÊNCIAS
// =============================================

// Caminhos absolutos para evitar problemas de inclusão
require_once __DIR__ . '/tcpdf/tcpdf.php';
require_once __DIR__ . '/classes/pdf_mc_table.php';

// =============================================
// VALIDAÇÃO DOS DADOS DE ENTRADA
// =============================================

try {
    // Verificação robusta da estrutura de dados
    if (!isset($dadosCompletos)) {
        throw new Exception("Nenhum dado foi fornecido para geração do PDF");
    }

    if (!is_array($dadosCompletos)) {
        throw new Exception("Os dados fornecidos não estão no formato esperado");
    }

    // Estrutura padrão com todos os campos necessários
    $defaults = [
        'cliente' => [
            'nome' => 'Não informado',
            'empresa' => 'Não informado',
            'cnpj' => 'Não informado',
            'telefone' => 'Não informado',
            'email' => 'Não informado'
        ],
        'ambiente' => [
            'area' => 0,
            'pe_direito' => 0,
            'projeto' => 'Projeto Padrão',
            'tipo' => 'Comercial',
            'setpoint' => 24
        ],
        'portas' => [
            'simples' => 0,
            'duplas' => 0
        ],
        'config' => [
            'pressurizacao' => 0,
            'backup' => 'sem_backup'
        ],
        'resultados' => [
            'total_w' => 0,
            'total_tr' => 0,
            'detalhes' => [
                'externos' => ['total' => 0],
                'piso' => ['total' => 0],
                'iluminacao' => 0,
                'pessoas' => 0,
                'ar_externo' => 0
            ],
            'solucoes' => [
                [
                    'modelo' => 'Modelo Padrão',
                    'capacidade' => 0,
                    'sem_backup' => 0,
                    'com_backup' => 0
                ]
            ]
        ]
    ];

    // Preenche os dados faltantes com valores padrão
    $dadosCompletos = array_replace_recursive($defaults, $dadosCompletos);

    // =============================================
    // DEFINIÇÃO DAS CLASSES DO PDF
    // =============================================

    class MYPDF extends TCPDF {
        public $widths;
        public $aligns;

        public function SetWidths($w) {
            $this->widths = $w;
        }

        public function SetAligns($a) {
            $this->aligns = $a;
        }

        public function Row($data, $header = false) {
            $nb = 0;
            $data_count = count($data);
            
            for ($i = 0; $i < $data_count; $i++) {
                $nb = max($nb, $this->NbLines($this->widths[$i], $data[$i]));
            }
            
            $h = 5 * $nb;
            $this->CheckPageBreak($h);
            
            for ($i = 0; $i < $data_count; $i++) {
                $w = $this->widths[$i];
                $a = isset($this->aligns[$i]) ? $this->aligns[$i] : 'L';
                $x = $this->GetX();
                $y = $this->GetY();
                
                if ($header) {
                    $this->Rect($x, $y, $w, $h, 'F');
                } else {
                    $this->Rect($x, $y, $w, $h);
                }
                
                $this->MultiCell($w, 5, $data[$i], 0, $a);
                $this->SetXY($x + $w, $y);
            }
            $this->Ln($h);
        }

        public function NbLines($w, $txt) {
            // Garante que $txt seja uma string válida
            $txt = (is_string($txt) || is_numeric($txt)) ? (string)$txt : '';
            
            $cw = &$this->CurrentFont['cw'];
            if ($w == 0) {
                $w = $this->w - $this->rMargin - $this->x;
            }
            
            $margins = $this->getMargins();
            $wmax = ($w - ($margins['left'] + $margins['right'])) * 1000 / $this->FontSize;

            $s = str_replace("\r", '', $txt);
            $nb = strlen($s);
            if ($nb > 0 && $s[$nb - 1] == "\n") {
                $nb--;
            }
            $sep = -1;
            $i = 0;
            $j = 0;
            $l = 0;
            $nl = 1;
            while ($i < $nb) {
                $c = $s[$i];
                if ($c == "\n") {
                    $i++;
                    $sep = -1;
                    $j = $i;
                    $l = 0;
                    $nl++;
                    continue;
                }
                if ($c == ' ') {
                    $sep = $i;
                }
                $l += isset($cw[$c]) ? $cw[$c] : 0;
                if ($l > $wmax) {
                    if ($sep == -1) {
                        if ($i == $j) {
                            $i++;
                        }
                    } else {
                        $i = $sep + 1;
                    }
                    $sep = -1;
                    $j = $i;
                    $l = 0;
                    $nl++;
                } else {
                    $i++;
                }
            }
            return $nl;
        }

        public function checkPageBreak($h = 0, $y = null, $addpage = true) {
            if ($y === null) {
                $y = $this->GetY();
            }
            if ($y + $h > $this->PageBreakTrigger) {
                if ($addpage) {
                    $this->AddPage($this->CurOrientation);
                }
                return true;
            }
            return false;
        }
    }

    class PropostaPDF extends MYPDF {
        public function Header() {
            $logoPath = __DIR__ . '/images/logo.jpg';
            if (file_exists($logoPath)) {
                $this->Image($logoPath, 15, 10, 30);
            }
            $this->SetFont('helvetica', 'B', 16);
            $this->Cell(0, 15, 'PROPOSTA TÉCNICA COMPLETA', 0, 1, 'C');
            $this->SetFont('helvetica', '', 10);
            $this->Cell(0, 5, 'Data: ' . date('d/m/Y'), 0, 1, 'R');
            $this->Line(15, 30, $this->GetPageWidth()-15, 30);
        }

        public function Footer() {
            $this->SetY(-15);
            $this->SetFont('helvetica', 'I', 8);
            $this->Cell(0, 10, 'Página ' . $this->getAliasNumPage().'/'.$this->getAliasNbPages(), 0, 0, 'C');
        }
    }

    // =============================================
    // GERAÇÃO DO PDF
    // =============================================

    // Limpeza final antes de criar o PDF
    ob_end_clean();

    $pdf = new PropostaPDF();
    $pdf->AddPage();

    // 1. DADOS DO CLIENTE
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'DADOS DO CLIENTE', 0, 1);
    $pdf->SetFont('helvetica', '', 10);

    $cliente = $dadosCompletos['cliente'];
    $pdf->Cell(40, 7, 'Nome:', 0, 0); 
    $pdf->Cell(0, 7, $cliente['nome'], 0, 1);
    $pdf->Cell(40, 7, 'Empresa:', 0, 0); 
    $pdf->Cell(0, 7, $cliente['empresa'], 0, 1);
    $pdf->Cell(40, 7, 'CNPJ:', 0, 0); 
    $pdf->Cell(0, 7, $cliente['cnpj'], 0, 1);
    $pdf->Cell(40, 7, 'Projeto:', 0, 0); 
    $pdf->Cell(0, 7, $dadosCompletos['ambiente']['projeto'], 0, 1);

    $pdf->Ln(10);

    // 2. PARÂMETROS DO AMBIENTE
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'PARÂMETROS DO AMBIENTE', 0, 1);
    $pdf->SetFont('helvetica', '', 9);

    // Tabela de parâmetros
    $header = ['Parâmetro', 'Valor', 'Unidade'];
    $data = [
        ['Área', number_format($dadosCompletos['ambiente']['area'], 2, ',', '.'), 'm²'],
        ['Pé-direito', number_format($dadosCompletos['ambiente']['pe_direito'], 2, ',', '.'), 'm'],
        ['Tipo de construção', $dadosCompletos['ambiente']['tipo'], ''],
        ['Temperatura desejada', $dadosCompletos['ambiente']['setpoint'].' °C', ''],
        ['Pressurização', $dadosCompletos['config']['pressurizacao'].' Pa', ''],
        ['Portas duplas', $dadosCompletos['portas']['duplas'], 'un'],
        ['Portas simples', $dadosCompletos['portas']['simples'], 'un']
    ];

    // Cabeçalho da tabela
    $pdf->SetFillColor(240, 240, 240);
    $pdf->SetTextColor(0);
    $pdf->SetFont('', 'B');
    foreach ($header as $col) {
        $pdf->Cell(60, 7, $col, 1, 0, 'C', 1);
    }
    $pdf->Ln();

    // Dados da tabela
    $pdf->SetFont('', '');
    $fill = false;
    foreach ($data as $row) {
        $pdf->Cell(60, 6, $row[0], 'LR', 0, 'L', $fill);
        $pdf->Cell(60, 6, $row[1], 'LR', 0, 'C', $fill);
        $pdf->Cell(60, 6, $row[2], 'LR', 0, 'C', $fill);
        $pdf->Ln();
        $fill = !$fill;
    }
    $pdf->Cell(180, 0, '', 'T');

    $pdf->Ln(15);

    // 3. RESULTADOS DOS CÁLCULOS
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'RESULTADOS DOS CÁLCULOS', 0, 1);

    $pdf->SetFont('helvetica', '', 10);
    $pdf->Cell(0, 7, sprintf('Carga Térmica Total: %.2f TR (%.0f W)', 
        $dadosCompletos['resultados']['total_tr'], 
        $dadosCompletos['resultados']['total_w']), 0, 1);

    // Tabela de detalhamento
    $pdf->SetWidths([120, 60]);
    $pdf->SetFont('', 'B');
    $pdf->Row(['Componente', 'Carga Térmica (W)'], true);

    $pdf->SetFont('', '');
    $pdf->Row(['Paredes e teto', number_format($dadosCompletos['resultados']['detalhes']['externos']['total'], 0, ',', '.').' W']);
    $pdf->Row(['Piso', number_format($dadosCompletos['resultados']['detalhes']['piso']['total'], 0, ',', '.').' W']);
    $pdf->Row(['Iluminação', number_format($dadosCompletos['resultados']['detalhes']['iluminacao'], 0, ',', '.').' W']);
    $pdf->Row(['Pessoas', number_format($dadosCompletos['resultados']['detalhes']['pessoas'], 0, ',', '.').' W']);
    $pdf->Row(['Ar externo', number_format($dadosCompletos['resultados']['detalhes']['ar_externo'], 0, ',', '.').' W']);

    $pdf->Ln(10);

    // 4. SOLUÇÃO RECOMENDADA
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'SOLUÇÃO RECOMENDADA', 0, 1);

    $solucao = $dadosCompletos['resultados']['solucoes'][0];
    $backupType = $dadosCompletos['config']['backup'];

    $pdf->SetFont('helvetica', '', 10);
    $pdf->Cell(0, 7, sprintf('Modelo: %s (%d TR)', $solucao['modelo'], $solucao['capacidade']), 0, 1);
    $pdf->Cell(0, 7, sprintf('Quantidade: %d unidade(s) (%s)', $solucao[$backupType], $backupType), 0, 1);
    $pdf->Cell(0, 7, sprintf('Capacidade Total: %d TR', $solucao['capacidade'] * $solucao[$backupType]), 0, 1);

    $pdf->Ln(10);

    // 5. OBSERVAÇÕES
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'OBSERVAÇÕES', 0, 1);
    $pdf->SetFont('helvetica', '', 10);
    $pdf->MultiCell(0, 7, "1. Proposta válida por 15 dias\n2. Preços sujeitos a alteração\n3. Condições de pagamento a negociar");

    // Saída do PDF
    $pdf->Output('proposta_tecnica.pdf', 'I');
    exit;

} catch (Exception $e) {
    // Limpeza completa em caso de erro
    while (ob_get_level() > 0) ob_end_clean();
    
    // Mensagem de erro segura
    header('Content-Type: text/plain');
    echo "ERRO NA GERAÇÃO DO PDF:\n";
    echo "------------------------\n";
    echo "Mensagem: " . $e->getMessage() . "\n\n";
    echo "Por favor, entre em contato com o suporte técnico.\n";
    
    // Log detalhado do erro
    error_log("ERRO gera_pdf: " . date('Y-m-d H:i:s') . "\n" . 
              "Mensagem: " . $e->getMessage() . "\n" .
              "Arquivo: " . $e->getFile() . "\n" .
              "Linha: " . $e->getLine() . "\n" .
              "Trace: " . $e->getTraceAsString() . "\n\n", 
              3, __DIR__ . '/logs/erros_pdf.log');
    
    exit(1);
}