<?php
require_once __DIR__ . '/tcpdf/tcpdf.php';
require_once __DIR__ . '/classes/pdf_mc_table.php';

class GeradorProposta {
    private $dados;
    private $resultados;
    
    public function __construct($dados, $resultados) {
        $this->dados = $dados;
        $this->resultados = $resultados;
    }
    
    public function gerarPropostaComercial() {
        $pdf = new PDF_MC_Table();
        $pdf->SetCreator('Sistema HVAC');
        $pdf->SetAuthor('ACTEMIUM');
        $pdf->SetTitle('PROPOSTA COMERCIAL');
        $pdf->SetSubject('Proposta Comercial para Sistema HVAC');
        
        // Configurações de página
        $pdf->SetMargins(15, 15, 15);
        $pdf->SetHeaderMargin(10);
        $pdf->SetFooterMargin(10);
        $pdf->SetAutoPageBreak(true, 25);
        
        $pdf->AddPage();
        
        // Cabeçalho
        $this->gerarCabecalho($pdf, 'PROPOSTA COMERCIAL (PC)');
        
        // 1 - OBJETO
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, '1 - OBJETO', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->MultiCell(0, 7, 'Serviços de projeto de ar-condicionado dos objetos descritos abaixo, a serem executados no padrão do cliente. Para mais detalhes, gentileza consultar a Proposta Técnica (PT) enviada juntamente com esta Proposta Comercial (PC).', 0, 'J');
        $pdf->Ln(5);
        
        $this->adicionarItemLista($pdf, 'Projeto do sistema HVAC da(s) Sala(s) de Painéis.');
        $this->adicionarItemLista($pdf, 'Acompanhamento dos testes nas dependências do cliente na região metropolitana de Belo Horizonte/MG (item ofertado como cortesia, não haverá desconto em caso de não realização do serviço).');
        $pdf->Ln(10);
        
        // 2 - PREÇO
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, '2 - PREÇO', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        
        // Climatização
        $this->gerarSecaoClimatizacao($pdf);
        
        // Pressurização
        if (!empty($this->resultados['solucao']['pressurizacao'])) {
            $this->gerarSecaoPressurizacao($pdf);
        }
        
        // Exaustão
        if (!empty($this->resultados['solucao']['exaustao'])) {
            $this->gerarSecaoExaustao($pdf);
        }
                // Engenharia
        $this->gerarSecaoEngenharia($pdf);
                // TOTAL
        $this->gerarTotalProposta($pdf);
                // 3 - DADOS
        $this->gerarSecaoDados($pdf);
                // 4 - INFORMAÇÕES PERTINENTES
        $this->gerarSecaoInformacoes($pdf);
                // 5 - VALIDADE
        $this->gerarSecaoValidade($pdf);
                // 6 - FORMA DE PAGAMENTO
        $this->gerarSecaoPagamento($pdf);
                // 7 - PRAZO DE PAGAMENTO
        $this->gerarSecaoPrazoPagamento($pdf);
                // Assinatura
        $this->gerarAssinatura($pdf);
        return $pdf;
    }
    
    public function gerarPropostaTecnica() {
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
    
    private function gerarSecaoClimatizacao($pdf) {
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'Climatização:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        
        // Verifica se existe a seção de climatização e se não está vazia
        if (empty($this->resultados['solucao']['climatizacao']) || !is_array($this->resultados['solucao']['climatizacao'])) {
            $pdf->Cell(5, 7, '', 0, 0);
            $pdf->Cell(0, 7, 'Nenhum equipamento de climatização selecionado', 0, 1);
            $pdf->Ln(5);
            return;
        }
        
        foreach ($this->resultados['solucao']['climatizacao'] as $equipamento) {
            // Valores padrão caso as chaves não existam
            $precoUnitario = $equipamento['preco_unitario'] ?? 0;
            $quantidade = $equipamento['quantidade_n1'] ?? 1;
            $capacidade = $equipamento['capacidade_tr'] ?? 0;
            $modelo = $equipamento['modelo'] ?? 'Wall Mounted';
            
            $pdf->Cell(5, 7, '', 0, 0);
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(0, 7, 'R$ ' . number_format($precoUnitario * $quantidade, 2, ',', '.'), 0, 1);
            $pdf->SetFont('helvetica', '', 10);
            
            $pdf->Cell(10, 7, '', 0, 0);
            $pdf->MultiCell(0, 7, 
                'Referentes a ' . $quantidade . ' equipamento(s) ' . $modelo . ' de ' . 
                $capacidade . 'TR da Sala de Painéis - Faturamento Direto TOSI.', 
                0, 'J');
                
            $pdf->Cell(10, 7, '', 0, 0);
            $pdf->Cell(0, 7, 'Entrega em: Cabreúva/SP;', 0, 1);
            $pdf->Cell(10, 7, '', 0, 0);
            $pdf->Cell(0, 7, 'ICMS: 12% incluso; IPI: Isento', 0, 1);
            $pdf->Ln(5);
        }
    }
        
    private function gerarSecaoPressurizacao($pdf) {
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'Pressurização:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        
        $pdf->Cell(5, 7, '', 0, 0);
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'R$ 7.900,00', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(10, 7, '', 0, 0);
        $pdf->MultiCell(0, 7, 'Referentes a 1 gabinete de ventilação para promover pressão positiva. - Faturamento Direto Sicflux.', 0, 'J');
        $pdf->Cell(10, 7, '', 0, 0);
        $pdf->Cell(0, 7, 'Entrega em: Contagem/MG;', 0, 1);
        $pdf->Ln(5);
        
        $pdf->Cell(5, 7, '', 0, 0);
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'R$ 3.250,00', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(10, 7, '', 0, 0);
        $pdf->MultiCell(0, 7, 'Referentes aos acessórios de difusão e controle de ar associados ao sistema de ventilação - Faturamento Direto Tropical (grupo TOSI).', 0, 'J');
        $pdf->Cell(10, 7, '', 0, 0);
        $pdf->Cell(0, 7, 'Entrega em: Cabreúva/SP;', 0, 1);
        $pdf->Cell(10, 7, '', 0, 0);
        $pdf->Cell(0, 7, 'ICMS: 12% incluso; IPI: EXCLUSO DE 5%;', 0, 1);
        $pdf->Ln(5);
    }
    
    private function gerarSecaoExaustao($pdf) {
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'Exaustão da Baia de Transformadores:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        
        $pdf->Cell(5, 7, '', 0, 0);
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'R$ 8.520,00', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(10, 7, '', 0, 0);
        $pdf->MultiCell(0, 7, 'Referentes ao exaustor tubo-axial do sistema de exaustão da Baia de Transformador (Entrega em Joinville/SC; 12% ICMS incluso, IPI isento - Faturamento Direto Aeroville).', 0, 'J');
        $pdf->Ln(5);
    }
    
    private function gerarSecaoEngenharia($pdf) {
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'Engenharia:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        
        $pdf->Cell(5, 7, '', 0, 0);
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 7, 'R$ 14.133,00', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(10, 7, '', 0, 0);
        $pdf->MultiCell(0, 7, 'Referente ao projeto HVAC e acompanhamento do start-up nas dependências do cliente (região metropolitana de Belo Horizonte/MG). Impostos inclusos (ISS), faturado pela ESI.', 0, 'J');
        $pdf->Ln(10);
    }
    
    private function gerarTotalProposta($pdf) {
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, 'TOTAL: R$ ' . number_format($this->calcularTotalProposta(), 2, ',', '.'), 0, 1, 'R');
        $pdf->Ln(10);
    }
    
    private function gerarSecaoDados($pdf) {
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, '3 - DADOS:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(0, 7, 'ESI ENERGIA:', 0, 1);
        $pdf->Cell(0, 7, 'Razão Social: ESI - ENERGIA SOLUÇÕES INTELIGENTES LTDA.', 0, 1);
        $pdf->Cell(0, 7, 'CNPJ: 20.232.429/0001-11', 0, 1);
        $pdf->Ln(10);
    }
    
    private function gerarSecaoInformacoes($pdf) {
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, '4 - INFORMAÇÕES PERTINENTES:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->MultiCell(0, 7, 'ATENÇÃO! Esta proposta foi elaborada de maneira a obter a melhor solução técnica, atendendo às normas vigentes com o menor custo possível. Ao analisar qualquer proposta, certifique-se que ela atende aos requisitos mínimos da norma ABNT 16.401, NR15 e NR10 para mérito de equalização de propostas.', 0, 'J');
        $pdf->Ln(5);
        $pdf->MultiCell(0, 7, 'A obediência às normas é imprescindível para estar isento de problemas futuros.', 0, 'J');
        $pdf->Ln(10);
    }
    
    private function gerarSecaoValidade($pdf) {
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, '5 - VALIDADE DESTA PROPOSTA:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(0, 7, '10 (dez) dias.', 0, 1);
        $pdf->Ln(10);
    }
    
    private function gerarSecaoPagamento($pdf) {
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, '6 - FORMA DE PAGAMENTO:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(0, 7, 'Para as máquinas: (à negociar)', 0, 1);
        $pdf->Cell(0, 7, 'Serviços: 100% na entrega da REV0 do projeto.', 0, 1);
        $pdf->Ln(5);
    }
    
    private function gerarSecaoPrazoPagamento($pdf) {
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, '7 - PRAZO DE PAGAMENTO:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(0, 7, 'Para as máquinas: (à negociar)', 0, 1);
        $pdf->Cell(0, 7, 'Serviços: 30ddl', 0, 1);
        $pdf->Ln(10);
    }
    
    private function gerarAssinatura($pdf) {
        $pdf->MultiCell(0, 7, 'Sendo o que temos a apresentar, nos colocamos à disposição para quaisquer esclarecimentos adicionais.', 0, 'J');
        $pdf->Ln(15);
        $pdf->Cell(0, 7, 'Atenciosamente,', 0, 1);
        $pdf->Ln(10);
        $pdf->Cell(0, 7, '________________________________________________', 0, 1, 'C');
        $pdf->Cell(0, 7, 'Matheus Pacheco Herzeberg Gonçalves', 0, 1, 'C');
        $pdf->Cell(0, 7, 'Engenheiro Mecânico - ESI Energia', 0, 1, 'C');
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
    
    private function calcularTotalProposta() {
        $total = 0;
        
        // Soma dos equipamentos de climatização
        foreach ($this->resultados['solucao']['climatizacao'] as $equipamento) {
            $total += $equipamento['preco_unitario'] * $equipamento['quantidade_n1'];
        }
        
        // Adicionar valores fixos para outros itens
        if (!empty($this->resultados['solucao']['pressurizacao'])) {
            $total += 7900 + 3250; // Gabinete + acessórios
        }
        
        if (!empty($this->resultados['solucao']['exaustao'])) {
            $total += 8520; // Exaustor
        }
        
        // Engenharia
        $total += 14133;
        
        return $total;
    }
    
    public function gerarPropostas() {
        return [
            'pc' => $this->gerarPropostaComercial()->Output('', 'S'),
            'pt' => $this->gerarPropostaTecnica()->Output('', 'S')
        ];
    }
}