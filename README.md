# Card de Status de Servidor - Painel HTML Graphics (Grafana)

<img width="426" height="294" alt="image" src="https://github.com/user-attachments/assets/e18fc8d6-209e-4a60-b8b8-e96f5f7fed02" />

## Visão geral

Este painel exibe o status operacional de um servidor/serviço em um dashboard Grafana, usando o plugin **HTML Graphics** (`gapit-htmlgraphics-panel`). O card mostra:

- um indicador de status HA (`HA-ON` / `HA-OFF`) com cor dinâmica;
- o nome do serviço/servidor e um ícone de identificação (no print, aparenta ser o logotipo do Zabbix, sugerindo que os dados vêm dessa fonte de monitoramento);
- quatro métricas em formato de anel de progresso - CPU, RAM, Disco e Temperatura - cada uma com ícone próprio e preenchimento que reage ao valor atual.

Toda a renderização é feita por três blocos configurados no editor do painel: **HTML/SVG document**, **CSS** e **onRender** (JavaScript).

## Pré-requisitos

- Grafana 8.2.0 ou superior.
- Plugin **HTML Graphics** (`gapit-htmlgraphics-panel`) instalado. É gratuito e open source para instâncias self-hosted; no Grafana Cloud, o uso de plugins de marketplace pode exigir assinatura de uma entitlement.
- Uma fonte de dados que entregue ao painel exatamente 5 séries, na ordem descrita na seção abaixo - o script lê as séries por **posição (índice)**, não por nome de campo.

## Instalação do plugin

Via `grafana-cli`:

```bash
grafana-cli --pluginUrl https://github.com/gapitio/gapit-htmlgraphics-panel/releases/latest/download/gapit-htmlgraphics-panel.zip plugins install gapit-htmlgraphics-panel
```

Via Docker / docker-compose (variável de ambiente):

```yaml
environment:
  - GF_INSTALL_PLUGINS=gapit-htmlgraphics-panel
```

Depois de instalar, reinicie o Grafana e crie um novo painel do tipo **HTML Graphics**.

## Estrutura de dados esperada (`data.series`)

| Índice | Métrica | Usado em | Observação |
|---|---|---|---|
| `series[0]` | CPU (%) | `#value0` + 1º anel | |
| `series[1]` | RAM (%) | `#value1` + 2º anel | |
| `series[2]` | Disco (%) | `#value2` + 3º anel | |
| `series[3]` | Temperatura | `#value3` + 4º anel | recebe sufixo `°` em vez de `%` |
| `series[4]` | Status | badge HA | espera o texto `"online"` (case-insensitive) |

Cada série precisa ter ao menos um ponto em `fields[1]` (segundo campo); o script sempre usa o último valor (`values.get(length - 1)`).

## Como o painel é montado

No editor do painel HTML Graphics, três campos são preenchidos:

1. **HTML/SVG document** - marcação estática do card (estrutura, ids e classes).
2. **CSS** - estilos visuais (anexado abaixo).
3. **onRender** - JavaScript executado a cada atualização de dados, responsável por preencher os valores e colorir os anéis.

## HTML (estrutura do card)

> O HTML original não veio na mensagem (apenas o CSS e o JS - o bloco de JS, aliás, foi colado duas vezes idêntico). Reconstruí a estrutura abaixo a partir dos ids/classes usados no CSS e no script, e ela reproduz fielmente o resultado visual do print. Envie o HTML real se quiser que eu substitua esta seção com 100% de fidelidade ao seu código.

```html
<div class="container">
  <div class="card">
    <div class="card-header">
      <div id="status-indicator" class="status-indicator">HA-ON</div>
      <span class="card-title">SERVIÇO/SERVIDOR</span>
      <img class="card-icon" src="URL_DO_ICONE" alt="logo" />
    </div>

    <div class="values-container">
      <div class="value-box">
        <div class="icon-wrapper">
          <div class="icon-ring"></div>
          <img class="icon" src="URL_ICONE_CPU" alt="CPU" />
        </div>
        <h3 id="value0">0%</h3>
        <span class="value-label">CPU</span>
      </div>

      <div class="value-box">
        <div class="icon-wrapper">
          <div class="icon-ring"></div>
          <img class="icon" src="URL_ICONE_RAM" alt="RAM" />
        </div>
        <h3 id="value1">0%</h3>
        <span class="value-label">RAM</span>
      </div>

      <div class="value-box">
        <div class="icon-wrapper">
          <div class="icon-ring"></div>
          <img class="icon" src="URL_ICONE_DISCO" alt="DISCO" />
        </div>
        <h3 id="value2">0%</h3>
        <span class="value-label">DISCO</span>
      </div>

      <div class="value-box">
        <div class="icon-wrapper">
          <div class="icon-ring"></div>
          <img class="icon" src="URL_ICONE_TEMP" alt="TEMP" />
        </div>
        <h3 id="value3">0°</h3>
        <span class="value-label">TEMP</span>
      </div>
    </div>
  </div>
</div>
```
A ordem dos quatro `.value-box` precisa ser exatamente CPU → RAM → Disco → Temperatura, porque o script seleciona os anéis com `querySelectorAll('.icon-ring')[i]` (por posição no DOM, não por id).

## CSS - pontos principais

- `.card` define o fundo escuro (`#0e1433`), cantos arredondados e a largura máxima do card.
- `.icon-wrapper` + `.icon-ring` criam o efeito de anel: `icon-ring` usa `mask` / `-webkit-mask` com `radial-gradient` para deixar visível só uma faixa fina (2–3px) do círculo; o ícone (`img.icon`) fica sobreposto e centralizado, com `filter: brightness(0) invert(1)` para forçar a cor branca independentemente da cor original do ícone.
- `.status-indicator` estiliza o badge `HA-ON` / `HA-OFF`, incluindo o `box-shadow` que cria o efeito de brilho na cor do status.
- Ajuste pendente: em `.card-header { margin-bottom: px; }` falta o número (ex.: `8px`). Esse valor é inválido em CSS e o navegador ignora a regra silenciosamente - vale corrigir ou remover a linha.

## JavaScript (onRender) - lógica

**Métricas (CPU / RAM / Disco / Temperatura)**

- `formatValue(value, decimalPlaces)` arredonda o valor recebido (no loop principal é chamado sempre com 0 casas decimais).
- `updateProgressRing(element, percent)` pinta o `.icon-ring` com um `conic-gradient`: a fatia verde (`#00ff88`) cobre de `0%` a `percent%` do círculo, e o restante fica com o trilho cinza translúcido.
- O `for (let i = 0; i < 4; i++)` lê `data.series[i].fields[1]`, pega o último valor da série, atualiza o texto de `h3#value{i}` (adicionando `°` apenas quando `i === 3`, ou seja, Temperatura) e chama `updateProgressRing` no anel correspondente.

**Status HA (online / offline)**

- Lê `data.series[4].fields[1]`, pega o último valor e compara (sem diferenciar maiúsculas/minúsculas) com a string `"online"`.
- Comportamento atual: quando o valor é `"online"`, o badge mostra **HA-OFF** em vermelho; quando não é `"online"`, mostra **HA-ON** em verde.
- Isso é o inverso do que normalmente se espera (verde = saudável/online, vermelho = problema). Pode ser intencional - por exemplo, se "HA-ON" significa "modo de alta disponibilidade ativo" (o failover assumiu porque o servidor primário caiu) e "HA-OFF" significa "operação normal, sem failover". Vale confirmar essa regra de negócio antes de subir para produção, porque hoje texto e cor parecem trocados em relação à convenção usual.

## Personalização rápida

- Cor de preenchimento dos anéis: trocar `#00ff88` dentro de `updateProgressRing`.
- Textos/cores do badge: ajustar os literais `'HA-ON'`, `'HA-OFF'`, `#00c26f` (verde) e `#c20000` (vermelho) no bloco de status.
- Casas decimais dos valores: segundo argumento de `formatValue` (hoje fixo em `0` no loop principal).
- Largura do card: propriedade `max-width` em `.card` (atualmente `300px`).
- Ícones: trocar o `src` das tags `<img class="icon">` por ícones de monitor, memória, disco e termômetro (ou outro set) - eles ficam brancos automaticamente por causa do filtro CSS aplicado.

## Pontos de atenção / TODO

- [ ] Confirmar e colar o HTML real do card (a versão deste README foi reconstruída a partir do CSS/JS).
- [ ] Corrigir `margin-bottom: px;` em `.card-header`.
- [ ] Validar se a relação cor/texto do badge HA-ON/HA-OFF está de acordo com a regra de negócio esperada.
- [ ] Garantir que as 5 séries da query sempre cheguem na ordem CPU, RAM, Disco, Temperatura, Status.

MIT - sinta-se livre para usar, modificar e distribuir. Se este card te ajudou e você for compartilhar em alguma rede social, blog ou fórum, considere fazer uma referência a este repositório como base. Isso ajuda a comunidade a encontrar o projeto e contribui para que mais pessoas se beneficiem da solução. 🙌 🔗
