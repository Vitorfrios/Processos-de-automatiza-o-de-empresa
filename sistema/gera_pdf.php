<?php
require_once('tcpdf/tcpdf.php');
$proposta = json_decode(urldecode($_GET['dados']), true);

$pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
$pdf->SetMargins(15, 25, 15);
$pdf->AddPage();

// Cabeçalho
$pdf->SetFont('helvetica', 'B', 14);
$pdf->Cell(0, 10, 'PROPOSTA TÉCNICA', 0, 1, 'C');
$pdf->SetFont('helvetica', '', 10);

// Dados do Cliente
$pdf->Cell(0, 5, 'Cliente: ' . $proposta['cliente']['nome'], 0, 1);
$pdf->Cell(0, 5, 'Projeto: ' . $proposta['ambiente']['projeto'], 0, 1);

// Carga Térmica
$pdf->Ln(10);
$pdf->SetFont('helvetica', 'B', 12);
$pdf->Cell(0, 10, 'RESULTADOS DO CÁLCULO', 0, 1);
$pdf->SetFont('helvetica', '', 10);

$pdf->Cell(0, 5, sprintf("Carga Térmica Total: %.2f TR (%.0f W)", $proposta['carga_termica']['tr'], $proposta['carga_termica']['w']), 0, 1);

// Detalhes
$pdf->Ln(5);
foreach ($proposta['carga_termica']['detalhes'] as $item => $valor) {
    $pdf->Cell(0, 5, ucfirst($item) . ': ' . round($valor) . ' W', 0, 1);
}

$pdf->Output('proposta.pdf', 'I');
?>