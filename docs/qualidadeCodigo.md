# Verificações locais de qualidade

Execute `npm run quality` para validar tipos, lint, formatação e testes em sequência. Os comandos `typecheck`, `lint:check`, `format:check`, `format` e `test:unit` usam o mesmo executor.

Proteções:

- Um executor por checkout, com bloqueio `.quality.lock`.
- Heap V8 limitado a 768 MiB por processo; isso **não é limite de RAM total**.
- Prazo de 120 segundos por etapa, com encerramento do processo se excedido.
- Testes executados com concorrência 1.
- Verificação de pelo menos 10 GiB livres no volume do projeto antes de cada etapa.
- TypeScript restrito às fontes do front e tipos gerados do Next; datasets, notebooks e ambientes de treinamento ficam fora da descoberta inicial.
- Interrupção na primeira falha. Não aumentar automaticamente limites quando uma etapa falhar.

O comando `quality:build` foi removido para evitar iniciar um build pesado automaticamente. `npm run build` permanece uma operação separada e não recebe os limites desse executor.

Se o processo for encerrado abruptamente, o lock pode permanecer. Confirme que nenhuma verificação deste projeto está rodando antes de remover apenas `.quality.lock`.

## Incidente de 7 de novembro de 2026

O relatório fornecido registra ausência de resposta de watchdogd durante 90 segundos e 18 arquivos de swap com pouco espaço de swap. Isso não identifica o processo causador. A configuração anterior do TypeScript descobria arquivos recursivamente em todo o repositório. O escopo foi reduzido e os comandos passaram a ter limites explícitos.

Essas medidas reduzem a carga das verificações, mas não garantem impedir kernel panic nem controlam outros programas, memória nativa ou falhas do sistema operacional. Em caso de recorrência, seguir o [diagnóstico da Apple](https://support.apple.com/en-gb/102382).
