# Sales Microfrontends Demo

Demo didática de microfrontends para uma aplicação de vendas.

## Arquitetura

- `apps/host-react`: shell principal em React, com header, busca e carrinho.
- `apps/remote-angular-sales`: microfrontend Angular responsável pela listagem de produtos.
- `apps/remote-angular-checkout`: microfrontend Angular responsável pelo carrinho detalhado.
- `single-spa`: usado para montar os remotes dentro da mesma tela.

## Objetivo

Manter o exemplo pequeno e legível, com foco em:

- uma única página de vendas
- header, filtro de busca, listagem e carrinho
- dois remotes em Angular com responsabilidades separadas
- comunicação entre as apps por eventos do `window`
- código fácil de entender para estudo

## Fluxo

- o host envia o texto do filtro para o remote de listagem
- o remote de listagem emite eventos quando o usuário adiciona um produto
- o remote de carrinho escuta esses eventos e atualiza o total
- o host também escuta os eventos para mostrar o resumo do carrinho
