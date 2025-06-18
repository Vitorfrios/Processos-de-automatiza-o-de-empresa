<?php
require_once __DIR__ . '/tcpdf/tcpdf.php';
require_once __DIR__ . '/classes/pdf_mc_table.php';

class PropostaTecnica {
    private $dados;
    private $resultados;
    
    public function __construct($dados, $resultados) {
        $this->dados = $dados;
        $this->resultados = $resultados;
    }
    public function gerarPropostaTecnica() {
    return $this->gerar();
    }

    public function gerar() {
        $pdf = new PDF_MC_Table();
        $pdf->SetCreator('Sistema HVAC');
        $pdf->SetAuthor('ACTEMIUM');
        $pdf->SetTitle('PROPOSTA TÉCNICA');
        $pdf->SetSubject('Proposta Técnica para Sistema HVAC');
        
        // Configurações de página
        $pdf->SetMargins(15, 15, 15);
        $pdf->SetHeaderMargin(10);
        $pdf->SetFooterMargin(10);
        $pdf->SetAutoPageBreak(true, 25);
        
        $pdf->AddPage();
        
        // Cabeçalho
        $this->gerarCabecalho($pdf, 'PROPOSTA TÉCNICA (PT)');
        
        // 1 - OBJETO
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, '1 - OBJETO', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->MultiCell(0, 7, 'Serviços de projeto de ar-condicionado dos objetos descritos abaixo, a serem executados no padrão do cliente. Para mais detalhes, gentileza consultar a Proposta Comercial (PC) enviada juntamente com esta Proposta Técnica (PT).', 0, 'J');
        $pdf->Ln(5);
        
        $this->adicionarItemLista($pdf, 'Projeto do sistema HVAC da(s) Sala(s) de Painéis.');
        $this->adicionarItemLista($pdf, 'Acompanhamento dos testes nas dependências do cliente na região metropolitana de Belo Horizonte/MG (item ofertado como cortesia, não haverá desconto em caso de não realização do serviço).');
        $pdf->Ln(10);
        
        // Fora de escopo
        $this->gerarSecaoForaEscopo($pdf);
        
        // Premissas
        $this->gerarSecaoPremissas($pdf);
        
        // 1 - GENERALIDADES DO SISTEMA
        $this->gerarSecaoGeneralidades($pdf);
        
        return $pdf;
    }
    
    private function gerarCabecalho($pdf, $titulo) {
        $pdf->SetFont('helvetica', 'B', 16);
        $pdf->Cell(0, 10, $titulo, 0, 1, 'C');
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(0, 5, 'Belo Horizonte, ' . date('d/m/Y'), 0, 1, 'R');
        $pdf->Ln(10);
        
        // Logo
        $logoPath = __DIR__ . '/images/logo_actemium.jpg';
        if (file_exists($logoPath)) {
            $pdf->Image($logoPath, 15, 20, 40);
        }
        $pdf->Ln(25);
    }
    
    private function adicionarItemLista($pdf, $texto, $nivel = 0) {
        $pdf->Cell(5 + ($nivel * 5), 7, '', 0, 0);
        $pdf->Cell(5, 7, '-', 0, 0);
        $pdf->MultiCell(0, 7, $texto, 0, 'J');
    }
    
    private function gerarSecaoForaEscopo($pdf) {
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, 'Fora de escopo:', 0, 1);
        
        // Força e controle
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'Força e controle:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        
        $itens = [
            'Sensores/alarmes que não venham de fábrica com os equipamentos',
            'Painel de força e comando (alimentar diretamente do QD do cliente)',
            'Cabos elétricos de força e controle para alimentação das máquinas e dos painéis',
            'Disponibilização de energia para alimentação das máquinas nos testes e na aplicação final',
            'Interligação elétrica entre os painéis dos eletrocentros, caso exista',
            'Automatismos dos sistemas de exaustão e ventilação (quando aplicável. Deverá ser previsto lógica elétrica nos painéis de força e comando conforme descritivo funcional, documento integrante do projeto HVAC)'
        ];
        
        foreach ($itens as $item) {
            $this->adicionarItemLista($pdf, $item);
        }
        $pdf->Ln(5);
        
        // Montagens e transportes
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'Montagens e transportes:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        
        $itens = [
            'Qualquer tipo de montagem, instalação, fixação/acoplamento (máquinas, acessórios, dutos ou painéis nas Salas Elétricas)',
            'Transporte e movimentação horizontal e vertical das máquinas',
            'Suportes e plataformas de acesso para manutenção, instalação ou testes (se aplicável)',
            'Suportes metálicos das máquinas, caso necessário',
            'Qualquer intervenção de natureza civil, rasgos e acabamentos nas Salas Elétricas'
        ];
        
        foreach ($itens as $item) {
            $this->adicionarItemLista($pdf, $item);
        }
        $pdf->Ln(5);
        
        // Serviços e engenharia
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'Serviços e engenharia:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        
        $itens = [
            'Treinamentos',
            'Qualquer documento de engenharia que não esteja presente no item "documentação de projeto" da proposta técnica',
            'Projetos elétricos e de automação',
            'Projeto elétrico de instalação interna à Sala Elétrica, rota de cabos etc',
            'Projeto e diagrama de interligação',
            'Projetos de exaustão ou ventilação de ambientes não relacionados na PT',
            'Inspeções em fábrica ou visitas técnicas, exceto quando explicitado na proposta',
            'Qualquer tipo de operação assistida, exceto quando explicitado na proposta'
        ];
        
        foreach ($itens as $item) {
            $this->adicionarItemLista($pdf, $item);
        }
    }
    
    private function gerarSecaoPremissas($pdf) {
        $pdf->AddPage();
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, 'Premissas:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        
        $premissas = [
            'Premissas - Irei adicionar'
        ];
        
        foreach ($premissas as $premissa) {
            $this->adicionarItemLista($pdf, $premissa);
        }
    }
    
    private function gerarSecaoGeneralidades($pdf) {
        $pdf->AddPage();
        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->Cell(0, 10, '1 - GENERALIDADES DO SISTEMA', 0, 1);
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, '1.1. - CONSIDERAÇÕES DA SOLUÇÃO', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        
        // Climatização
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'Climatização:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        
        foreach ($this->resultados['solucao']['climatizacao'] as $equipamento) {
            $pdf->Cell(5, 7, '', 0, 0);
            $pdf->MultiCell(0, 7, 'Sala de Painéis: ' . $equipamento['quantidade_n1'] . ' equipamento(s) do tipo Wall Mounted de capacidade ' . $equipamento['capacidade_tr'] . 'TR, onde 1 (um) é atuante como back-up (n+1).', 0, 'J');
            $pdf->Cell(5, 7, '', 0, 0);
            $pdf->Cell(5, 7, '☒', 0, 0);
            $pdf->Cell(0, 7, 'Back-up.', 0, 1);
            $pdf->Cell(5, 7, '', 0, 0);
            $pdf->Cell(5, 7, '☒', 0, 0);
            $pdf->Cell(0, 7, 'Pressurização.', 0, 1);
            $pdf->Cell(5, 7, '', 0, 0);
            $pdf->Cell(0, 7, 'Setpoint: ' . $this->dados['setpoint']['temperatura'] . '°C', 0, 1);
            $pdf->Cell(5, 7, '', 0, 0);
            $pdf->Cell(0, 7, 'Dif. Pressão: ' . $this->dados['pressurizacao']['delta_p'] . 'Pa', 0, 1);
            $pdf->Ln(5);
        }
        
        // Configuração
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'Configuração:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->MultiCell(0, 7, 'Bocal de insuflamento protegido por grelha diretamente no ambiente. Bocal acoplado à rede de dutos por lona flexível. Distribuição por grelhas. Condicionadores fixados externamente à SE, sobre mão-francesa na parede.', 0, 'J');
        $pdf->Ln(5);
        $pdf->Cell(0, 7, 'Legenda:', 0, 1);
        $pdf->Cell(5, 7, '☒', 0, 0);
        $pdf->Cell(0, 7, 'Incluso', 0, 1);
        $pdf->Cell(5, 7, '☐', 0, 0);
        $pdf->Cell(0, 7, 'Não incluso', 0, 1);
        $pdf->Ln(10);
        
        // Ventilação/Renovação/Pressurização
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'Ventilação/Renovação/Pressurização:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->MultiCell(0, 7, 'Uma caixa de ventilação com rotor do tipo centrífugo realizará o insuflamento de ar necessário para a manutenção de pressão positiva no ambiente, garantindo também a renovação mínima prevista.', 0, 'J');
        $pdf->Cell(5, 7, '', 0, 0);
        $pdf->Cell(5, 7, '☒', 0, 0);
        $pdf->Cell(0, 7, 'Back-up.', 0, 1);
        $pdf->Cell(5, 7, '', 0, 0);
        $pdf->Cell(5, 7, '☒', 0, 0);
        $pdf->Cell(0, 7, 'Limpeza automática do filtro.', 0, 1);
        $pdf->Ln(5);
        $pdf->Cell(0, 7, 'Legenda:', 0, 1);
        $pdf->Cell(5, 7, '☒', 0, 0);
        $pdf->Cell(0, 7, 'Incluso', 0, 1);
        $pdf->Cell(5, 7, '☐', 0, 0);
        $pdf->Cell(0, 7, 'Não incluso', 0,1);
        $pdf->Ln(10);
        
        // Exaustão
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'Exaustão da Sala de Baterias:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(0, 7, 'N/I', 0, 1);
        $pdf->Ln(5);
        
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'Exaustão da Baia de Transformador:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->MultiCell(0, 7, 'Exaustor com rotor tipo tubo-axial realizará a exaustão necessária para manutenção da temperatura no ambiente. Premissa: ∆T = 10°C', 0, 'J');
        $pdf->Cell(5, 7, '', 0, 0);
        $pdf->Cell(5, 7, '☒', 0, 0);
        $pdf->Cell(0, 7, 'Admissão de ar filtrada', 0, 1);
        $pdf->Cell(5, 7, '', 0, 0);
        $pdf->Cell(5, 7, '☒', 0, 0);
        $pdf->Cell(0, 7, 'Back-up.', 0, 1);
        $pdf->Ln(5);
        $pdf->Cell(0, 7, 'Legenda:', 0, 1);
        $pdf->Cell(5, 7, '☒', 0, 0);
        $pdf->Cell(0, 7, 'Incluso', 0, 1);
        $pdf->Cell(5, 7, '☐', 0, 0);
        $pdf->Cell(0, 7, 'Não incluso', 0, 1);
    }
}