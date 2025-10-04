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
    Tabela de inputs
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
                =ROUNDUP((B39+B40)/3,6*1,25*1;0)
                B39=AUX Portas Duplas
                B40=AUX Portas Simples

            Calculo de AUX Portas Duplas
                =(0,827*B18*VARIAVEL_PD*(POWER(B20;0,5))*3600)
                B18=N° Portas Duplas
                B20=Pressurização Pa
                VARIAVEL_PD=0,042, estará no banco de dados dados.json como VARIAVEL_PD
            
            Calculo de AUX Portas Simples
                =(0,827*B19*VARIAVEL_PS*(POWER(B20;0,5))*3600)
                B19=N° Portas Simples
                B20=Pressurização Pa
                VARIAVEL_PS=0,024, estará no banco de dados dados.json como VARIAVEL_PS
                
    Calculo de ganhos
        correlação entre celulas e inputs
            //Ceuluas = input
            B2 = Ambiente
            B3 = Back-up
            B4 = Área
            B5 = Tipo de Construção
            B6 = Parede Oeste
            B7 = Parede Leste
            B8 = Parede Norte
            B9 = Parede Sul
            B10 = Pé Direito
            B11 = Divisória Área Não Climatizada 1
            B12 = Divisória Área Não Climatizada 2
            B13 = Divisória Área Climatizada 1
            B14 = Divisória Área Climatizada 2
            B15 = Dissipação
            B16 = N° Pessoas
            B17 = Vazão de Ar Externo
            B18 = N° Portas Duplas
            B19 = N° Portas Simples
            B20 = Pressurização
            B21 = Setpoint
            B22 = Combate a Incêndio
            B23 = U-Value 1 (Alvenaria Teto) : 3,961
            B24 = U-Value 2 (Alvenaria Parede): 2,546
            B25 = U-Value 3 (Lã de Rocha Teto): 1,145
            B26 = U-Value 4 (Lã de Rocha Parede): 1,12
            
            //Variáveis
            AUX_U_Value_Parede = =IF(B5="Eletrocentro";B26;IF(B5="Alvenaria";B24;"ERRO"))
            AUX_U_Value_Teto = =IF(B5="Eletrocentro";B25;IF(B5="Alvenaria";B23;"ERRO"))
            AUX_U_Value_Piso = 2,7
            AUX_Fator_Iluminacao = 7
            AUX_Fs_Iluminacao = 1
            AUX_Fator_Conver_Painel = 1
            AUX_Fs_Paineis = 100
            AUX_OCp_Csp = 86,5
            AUX_OCp_Clp = 133,3
            Densi_ar=1,17
            AUX_m_ArExterno = =B17*3,6*Densi_ar*1000      
            AUX_c_ArExterno = 0,24         
            AUX_deltaT_ArExterno = 10      
            AUX_f_ArExterno = 3,01
            AUX_deltaUa_ArExterno = 8,47
            deltaT_piso = 7,5
            deltaT_teto = 20
            deltaT_parede_Oes = 13
            deltaT_parede_Les = 13
            deltaT_parede_Nor = 13
            deltaT_parede_Sul = 13

            deltaT_divi_N_clim1 = 10
            deltaT_divi_N_clim2 = 10
            deltaT_divi_clim1 = 3
            deltaT_divi_clim2 = 3


            //Calculos
            Calc_Dissp_Term = AUX_Fator_Conversao_Painel * B15 * AUX_Fs_Paineis / 100

            Calc_Ocp_Pss_C1 = AUX_OCp_Csp * B16 * AUX_Fs_OCp_Pessoas / 100
            Calc_Ocp_Pss_C2 = AUX_OCp_Clp * B16 * AUX_Fs_OCp_Pessoas / 100

            Calc_Gsens_ArE = AUX_m_ArExterno * AUX_c_ArExterno * AUX_deltaT_ArExterno

        Ganho de paredes e teto
            |                        | INPUT | Área (m²)      | U-Value (W/m².K)      | ΔT corrigido (°C)       | Ganho Térmico (W)                          |
            | ganho_teto             |  B4   | B4             | AUX_U_Value_Teto      | deltaT_teto             | =B4*AUX_U_Value_Teto*deltaT_teto           |
            | ganho_parede_oeste     |  B6   | =B6*$B$10      | AUX_U_Value_Parede    | deltaT_parede_Oes       | =B5*AUX_U_Value_Parede*deltaT_parede_Oes   |
            | ganho_parede_leste     |  B7   | =B7*$B$10      | AUX_U_Value_Parede    | deltaT_parede_Les       | =B6*AUX_U_Value_Parede*deltaT_parede_Les   |
            | ganho_parede_norte     |  B8   | =B8*$B$10      | AUX_U_Value_Parede    | deltaT_parede_Nor       | =B7*AUX_U_Value_Parede*deltaT_parede_Nor   |
            | ganho_parede_sul       |  B9   | =B9*$B$10      | AUX_U_Value_Parede    | deltaT_parede_Sul       | =B8*AUX_U_Value_Parede*deltaT_parede_Sul   |
            | total_externo          | = ganho_teto + ganho_parede_oeste + ganho_parede_leste + ganho_parede_norte + ganho_parede_sul |


        Ganho por divisórias
            | Elemento       | INPUT | Área (m²)        |       U-Value      |          ΔT         |            Ganho Térmico (W)                 |
            | ganho_divi_Anc1|  B11  |    =B11*$B$10    | AUX_U_Value_Parede | deltaT_divi_An_clim1|  =B11*AUX_U_Value_Parede*deltaT_divi_N_clim1 |
            | ganho_divi_Anc2|  B12  |    =B12*$B$10    | AUX_U_Value_Parede | deltaT_divi_An_clim2|  =B12*AUX_U_Value_Parede*deltaT_divi_N_clim2 |
            | ganho_divi_c1  |  B13  |    =B13*$B$10    | AUX_U_Value_Parede |  deltaT_divi_clim1  |  =B13*AUX_U_Value_Parede*deltaT_divi_clim1   |
            | ganho_divi_c2  |  B14  |    =B14*$B$10    | AUX_U_Value_Parede |  deltaT_divi_clim2  |  =B14*AUX_U_Value_Parede*deltaT_divi_clim2   |
            | total_divisoes |          = ganho_divi_nc1 + ganho_divi_Anc2 + ganho_divi_c1+ ganho_divi_c2                                         |



        Ganho por piso
            | Elemento   | INPUT | Área (m²) |      U-Value     |      ΔT     |   Ganho Térmico (W)             |
            | ---------- | :---: | :-------: | :--------------: | :---------: | :-------------------:           |
            | ganho_piso |   B4  |     B4    | AUX_U_Value_Piso | deltaT_piso |=B4*AUX_U_Value_Piso*deltaT_piso |
            | total_piso |                                        = ganho_piso                                  |

 
            
        Ganho por iluminação
            | Elemento         | INPUT | Área (m²) |     Fator (W/m²)     |         Fs        |  Ganho Térmico (W)                       |
            | ---------------- | :---: | :-------: | :------------------: | :---------------: | :-----------------:                      |
            | ganho_iluminacao |   B4  |     B4    | AUX_Fator_Iluminacao | AUX_Fs_Iluminacao |=B4*AUX_Fator_Iluminacao*AUX_Fs_Iluminacao|
            | total_iluminacao |                                  = ganho_iluminacao                                                     |


        
        Dissipação termica interna
            |                        | Fator Conversão            | Pe (W) | Fs             | Ganho Térmico (W)   |
            | ---------------------- | -------------------------- | ------ | -------------- | --------------------|
            |   ganho_dissi_termicaI | AUX_Fator_Conversao_Painel | B15    | AUX_Fs_Paineis | =Calc_Dissp_Term    |
            | Total                  |                               =ganho_dissi_termicaI                        |


            
        Ganhos por ocupação de pessoas
            |                       | Csp         | Clp         | O   | Fs                 | Ganho Térmico (W)                         |
            | --------------------- | ----------- | ----------- | --- | ------------------ | ------------------------------------------|
            | ganho_ocupacao_pessoas| AUX_OCp_Csp | AUX_OCp_Clp | B16 | AUX_Fs_OCp_Pessoas | =(Calc_Ocp_Pss_C1) + (Calc_Ocp_Pss_C2)    |
            | total_pessoas         |                                    =ganho_ocupacao_pessoas                                       |

        
        GANHO SENSÍVEL DE AR EXTERNO uso do  B23
            |                              | m (kg)          | c               | ΔT (°C)              | Ganho Térmico (W)                  |
            | ---------------------------- | --------------- | --------------- | -------------------- | ---------------------------------- |
            |    ganho_ar_sensivel         | AUX_m_ArExterno | AUX_c_ArExterno | AUX_deltaT_ArExterno | = Calc_Gsens_ArE / 1000 * 1,16     |
            | total_ar_sensivel            |                                                       =ganho_ar_sensivel                      |


        
        Ganho latende de ar externo
            |                             | Var (l/s)           | f               | ΔUa (g/Kg)            | Ganho Térmico (W)                               |
            | --------------------------- | ------------------- | --------------- | --------------------- | ------------------------------------------------|
            | ganho_ar_latente            | B17                 | AUX_f_ArExterno | AUX_deltaUa_ArExterno | = B17 * AUX_f_ArExterno * AUX_deltaUa_ArExterno |
            | total_ar_latente            |                                                             =ganho_ar_latente                                   |
        
        Somatório das principais cargas
            | Descrição                 | Variável           | Cálculo                        |
            | ------------------------- | ------------------ | ------------------------------ |
            | Total Paredes Externas    | total_externo      | =ROUNDUP(total_externo;0)      |
            | Total Divisórias Internas | total_divisoes     | =ROUNDUP(total_divisoes;0)     |
            | Total Piso                | total_piso         | =ROUNDUP(total_piso;0)         |
            | Total Iluminação          | total_iluminacao   | =ROUNDUP(total_iluminacao;0)   |
            | Total Equipamentos        | total_equipamentos | =ROUNDUP(total_equipamentos;0) |
            | Total Pessoas             | total_pessoas      | =ROUNDUP(total_pessoas;0)      |
            | Total Ar Externo          | total_ArExterno    | =ROUNDUP(total_ArExterno;0)    |
            | **TOTAL EM W**            | total_geral        | =ROUNDUP(total_geral;0)        |
            | **TOTAL EM TR**           | total_geral_tr     | =ROUNDUP(total_geral / 3517;0) |

            
                
                								
        
erros para corrigir
Ganho por divisórias
    tabela de calculos atualizada
            | Elemento       | INPUT | Área (m²)        |       U-Value      |          ΔT         |            Ganho Térmico (W)                 |
            | ganho_divi_Anc1|  B11  |    =B11*$B$10    | AUX_U_Value_Parede | deltaT_divi_An_clim1|  =B11*AUX_U_Value_Parede*deltaT_divi_N_clim1 |
            | ganho_divi_Anc2|  B12  |    =B12*$B$10    | AUX_U_Value_Parede | deltaT_divi_An_clim2|  =B12*AUX_U_Value_Parede*deltaT_divi_N_clim2 |
            | ganho_divi_c1  |  B13  |    =B13*$B$10    | AUX_U_Value_Parede |  deltaT_divi_clim1  |  =B13*AUX_U_Value_Parede*deltaT_divi_clim1   |
            | ganho_divi_c2  |  B14  |    =B14*$B$10    | AUX_U_Value_Parede |  deltaT_divi_clim2  |  =B14*AUX_U_Value_Parede*deltaT_divi_clim2   |
            | total_divisoes |          = ganho_divi_nc1 + ganho_divi_Anc2 + ganho_divi_c1+ ganho_divi_c2                                         |
Ganhos por ocupação de pessoas
    constantes adicionadas no json 
            AUX_OCp_Csp
            AUX_OCp_Clp
Ganho latende de ar externo 
    constantes adicionadas no json 
            AUX_f_ArExterno 
            AUX_deltaUa_ArExterno 


	 