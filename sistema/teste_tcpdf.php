<?php
require_once('tcpdf/tcpdf.php');

$pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
$pdf->AddPage();
$pdf->SetFont('helvetica', 'B', 16);
$pdf->Cell(0, 10, 'TCPDF instalado com sucesso!', 0, 1, 'C');
$pdf->Output('teste.pdf', 'I'); // Abre no navegador
?>