<?php
require_once 'PC.php';
require_once 'PT.php';
class GeradorProposta {
    private $dados;
    private $resultados;
    public function __construct($dados, $resultados) {
        $this->dados = $dados;
        $this->resultados = $resultados;
    }
    public function gerarPropostas() {
        $geradorPC = new PropostaComercial($this->dados, $this->resultados);
        $geradorPT = new PropostaTecnica($this->dados, $this->resultados);
        return [
            'pc' => $geradorPC->gerarPropostaComercial()->Output('', 'S'),
            'pt' => $geradorPT->gerarPropostaTecnica()->Output('', 'S')
        ];
    }
}
