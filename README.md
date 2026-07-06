# Contact Center Analytics - Prototype v0.2

Protótipo high fidelity de uma aplicação web de Business Intelligence para análise operacional de Contact Center.

## Como abrir

Abra `index.html` diretamente no browser. O projeto não usa backend, login, Excel, base de dados ou API.

Alguns browsers bloqueiam `fetch()` de ficheiros JSON quando o HTML é aberto via `file://`. Por isso, a aplicação tenta carregar `data/dashboardData.json` e usa um fallback interno com os mesmos dados quando esse bloqueio acontece.

## Estrutura

```text
ContactCenterDashboard/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── charts.js
│   ├── filters.js
│   └── navigation.js
├── data/
│   └── dashboardData.json
├── assets/
│   ├── logo.png
│   └── icons/
└── README.md
```

## Bibliotecas

- ApexCharts
- Tabulator
- Google Material Icons

## Notas

Os PDFs fornecidos estavam fora do workspace e o sistema bloqueou a leitura a partir do Desktop. Os dados incluídos são realistas e coerentes para validação de conceito, design, navegação e experiência de utilização.

## v0.2

- Landing Dashboard inicial com estado por cliente.
- Entrada direta em campanhas reais a partir de Vodafone e Oney.
- Sidebar recolhível.
- Header corporativo com última atualização e estado de sincronização.
- Polimento visual de KPIs, insights, espaçamento, tipografia e responsividade.
