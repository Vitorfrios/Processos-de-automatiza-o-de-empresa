|Logo    |   Nome do Sistema |     Logo      |
----------------------------------------------
|              Navegação                     |
----------------------------------------------
| Nome da aba | Campo Add project| Campo dell|
----------------------------------------------
||||Projeto 1 (-) | Campo edit |Campo add|Campo dell||||
 |||Sala1(-)                               |Campo edit|||
    ||Climatização(-)
    ||Maquinas(-)
        |Config maquina cada uma(-)
    ||Config geral(-)
 |||                            Atualizar dados|Salvar|||
 |||Sala2(-)                               |Campo edit|||
    ||Climatização(-)
    ||Maquinas(-)
        |Config maquina cada uma(-)
    ||Config geral(-)
 |||                            Atualizar dados|Salvar|||
 |||...|||

|||| Verificar dados|   Salvar  |   Baixar pdf/word  ||||
----------------------------------------------------------
||||Projeto 2 (-) | Campo edit |Campo add|Campo dell ||||
 |||Sala1(-)                               |Campo edit|||
    ||Climatização(-)
    ||Maquinas(-)
        |Config maquina cada uma(-)
    ||Config geral(-)
 |||                            Atualizar dados|Salvar|||
 |||Sala2(-)                               |Campo edit|||
    ||Climatização(-)
    ||Maquinas(-)
        |Config maquina cada uma(-)
    ||Config geral(-)
 |||                            Atualizar dados|Salvar|||
 |||...|||

|||| Verificar dados|   Salvar  |   Baixar pdf/word  ||||
----------------------------------------------------------
||||...||||

Dados importantes:
    inputs climatização a serem colocados ex:
        Ambiente |Lugar do imput|
        Back-up |Lugar do imput|
        Área |Lugar do imput|
        Tipo de Construção |Lugar do imput|
    Os outros topicos seguem o mesmo processo

Climatização
    Ambiente | Back-up n/n+1/n+2
    Área em m² |   Tipo de Construção alvenaria/eletrocentro
    Parede Oeste em m | Parede Leste em m
    Parede Norte em m  |  Parede Sul em m
    Pé Direito
    Divisória com Área não Climatizada 1 |   Divisória com Área não Climatizada 2
    Divisória com Área Climatizada 1 |       Divisória com Área Climatizada 2
    Dissipação em W
    N° Pessoas
    N° Portas Duplas | N° Portas Simples
    Pressurização Pa
    Setpoint em °C
    Vazão de Ar Externo (l/s) (não eh imput e sim resultado de calculo)
    Combate a Incêndio (Opções: Manual/Detecção;FM200;NOVEC;FirePRO;N/I)

Caclulo da vsão de ar externo com formulas do exel e indicações de variaveis
    formula do exel para vasão:
        =ROUNDUP(SUM(B39:B40)/3,6*1,25*1;0)
        B39=AUX Portas Duplas
        B40=AUX Portas Simples
        
    Calculo de AUX Portas Duplas
        =(0,827*B25*Varivel_PD*(POWER(B28;0,5))*3600)
        B25=N° Portas Duplas
        B28=Pressurização Pa
        Varivel_PD=0,042, estará no banco de dados dados.json como Varivel_PD
    
    Calculo de AUX Portas Simples
        =(0,827*B26*0,024*(POWER(B28;0,5))*3600)
        B26=N° Portas Simples
        B28=Pressurização Pa
        Varivel_PS=0,024, estará no banco de dados dados.json como Varivel_PS
        