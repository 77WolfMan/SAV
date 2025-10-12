const dados = {
  "tecnicos": [
    { "nome": "Nuno Vicente", "iniciais": "NV" },
    { "nome": "Dário Cardoso", "iniciais": "DC" },
    { "nome": "Diogo Gomes", "iniciais": "DG" },
    { "nome": "Paulo Lobo", "iniciais": "PL" },
    { "nome": "Benvindo (Sub.)", "iniciais": "BV" },
    { "nome": "Capela (Sub.)", "iniciais": "CF" },
    { "nome": "Técnico INTERCO", "iniciais": "BW" },
    { "nome": "Outros Subcontratados", "iniciais": "OT" }
  ],
  "tiposTarefa": [
    { "tipo": "Preventiva", "cor": "#33FF57" },
    { "tipo": "Curativa", "cor": "#FF33A8" },
    { "tipo": "Contrato", "cor": "#33C3FF" },
    { "tipo": "Urgência", "cor": "#FF706B" },
    { "tipo": "Transformação", "cor": "#CDE743" },
    { "tipo": "Reunião", "cor": "#D783FF" },
    { "tipo": "Férias", "cor": "#FFC133" },
    { "tipo": "Ausência", "cor": "#929292" }
  ],
  "ano": 2025,
  "feriados": [
    { "mes": "01", "dia": "01", "nome": "Ano Novo" },
    { "mes": "04", "dia": "18", "nome": "Sexta-Feira Santa" },
    { "mes": "04", "dia": "20", "nome": "Páscoa" },
    { "mes": "04", "dia": "25", "nome": "Dia da Liberdade" },
    { "mes": "05", "dia": "01", "nome": "Dia do Trabalhador" },
    { "mes": "06", "dia": "10", "nome": "Dia de Portugal, de Camões e das Comunidades Portuguesas" },
    { "mes": "06", "dia": "19", "nome": "Corpo de Deus" },
    { "mes": "08", "dia": "15", "nome": "Assunção de Nossa Senhora" },
    { "mes": "10", "dia": "05", "nome": "Implantação da República" },
    { "mes": "11", "dia": "01", "nome": "Dia de Todos os Santos" },
    { "mes": "12", "dia": "01", "nome": "Restauração da Independência" },
    { "mes": "12", "dia": "08", "nome": "Dia da Imaculada Conceição" },
    { "mes": "12", "dia": "25", "nome": "Natal" }
  ],
  "tarefas": [
    {
      "data_inicio": "2025-02-17",
      "duracao": 3,
      "tecnico": "Técnico INTERCO",
      "tipo": "Transformação",
      "cliente": "Repsol",
      "descricao": "Revamping da caldeira, para queimador misto"
    },
    {
      "data_inicio": "2025-01-01",
      "duracao": 3,
      "tecnico": "Paulo Lobo",
      "tipo": "Curativa",
      "cliente": "Repsol",
      "descricao": "cagari..."
    },
    {
      "data_inicio": "2025-02-03",
      "duracao": 3,
      "tecnico": "Nuno Vicente",
      "tipo": "Férias",
      "cliente": "",
      "descricao": ""
    },
    {
      "data_inicio": "2025-02-05",
      "duracao": 3,
      "tecnico": "Dário Cardoso",
      "tipo": "Ausência",
      "cliente": "",
      "descricao": ""
    },
    {
      "data_inicio": "2025-02-15",
      "duracao": 2,
      "tecnico": "Nuno Vicente",
      "tipo": "Preventiva",
      "cliente": "Terra Alegre",
      "descricao": "Instalação do sistema X"
    },
    {
      "data_inicio": "2025-02-17",
      "duracao": 2,
      "tecnico": "Nuno Vicente",
      "tipo": "Preventiva",
      "cliente": "Termolan",
      "descricao": "Instalação do sistema X"
    },
    {
      "data_inicio": "2025-02-15",
      "duracao": 3,
      "tecnico": "Técnico INTERCO",
      "tipo": "Curativa",
      "cliente": "Cork Supply",
      "descricao": "Instalação do sistema X"
    },
    {
      "data_inicio": "2025-02-17",
      "duracao": 2,
      "tecnico": "Dário Cardoso",
      "tipo": "Contrato",
      "cliente": "Tribérica",
      "descricao": "Manutenção Y"
    },
    {
      "data_inicio": "2025-02-17",
      "duracao": 3,
      "tecnico": "Diogo Gomes",
      "tipo": "Urgência",
      "cliente": "Repsol",
      "descricao": "Manutenção AQA"
     },
    {
      "data_inicio": "2025-02-17",
      "duracao": 1,
      "tecnico": "Paulo Lobo",
      "tipo": "Reunião",
      "cliente": "Babcock",
      "descricao": "Manutenção ccc"
    },
    {
      "data_inicio": "2025-02-17",
      "duracao": 1,
      "tecnico": "Paulo Lobo",
      "tipo": "Reunião",
      "cliente": "Terra Alegre",
      "descricao": "Manutenção ccc"
    },
    {
      "data_inicio": "2025-02-17",
      "duracao": 1,
      "tecnico": "Paulo Lobo",
      "tipo": "Reunião",
      "cliente": "Cepsa",
      "descricao": "Manutenção ccc"
    },
    {
      "data_inicio": "2025-02-17",
      "duracao": 1,
      "tecnico": "Paulo Lobo",
      "tipo": "Reunião",
      "cliente": "Tribérica",
      "descricao": "Manutenção ccc"
    },
    {
      "data_inicio": "2025-02-17",
      "duracao": 2,
      "tecnico": "Benvindo (Sub.)",
      "tipo": "Urgência",
      "cliente": "Lusomedicamenta",
      "descricao": "Manutenção WWW"
    },
    {
      "data_inicio": "2025-03-17",
      "duracao": 3,
      "tecnico": "Paulo Lobo",
      "tipo": "Preventiva",
      "cliente": "Bencom PDL",
      "descricao": "Manutenção ccc"
    },
    {
      "data_inicio": "2025-03-17",
      "duracao": 3,
      "tecnico": "Outros Subcontratados",
      "tipo": "Contrato",
      "cliente": "Gelgurte",
      "descricao": "Manutenção ccc"
    },
    {
      "data_inicio": "2025-03-17",
      "duracao": 3,
      "tecnico": "Dário Cardoso",
      "tipo": "Curativa",
      "cliente": "Vestan",
      "descricao": "Manutenção ccc"
    },
    {
      "data_inicio": "2025-03-17",
      "duracao": 3,
      "tecnico": "Nuno Vicente",
      "tipo": "Curativa",
      "cliente": "Tanquisado",
      "descricao": "Manutenção ccc"
    }
  ]
};