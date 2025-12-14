# 📋 Documentação Completa - Sistema de Processamento de Pedidos
## 🎯 Visão Geral

Sistema de simulação de e-commerce que gera e processa 1 milhão de pedidos com priorização VIP, utilizando Node.js, TypeScript, MongoDB Atlas, Redis Cloud e BullMQ para processamento de filas.

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico
- **Backend**: Node.js + TypeScript + Express
- **Banco de Dados**: MongoDB Atlas (NoSQL)
- **Sistema de Filas**: Redis Cloud + BullMQ
- **Interface**: HTML/CSS/JavaScript (SPA)
- **Deploy**: Docker + Docker Compose

### Estrutura de Diretórios
```
backend-hw-publishing/
├── src/
│   ├── config/
│   │   ├── database.ts          # Configuração MongoDB Atlas
│   │   └── redis.ts             # Configuração Redis Cloud
│   ├── models/
│   │   └── Order.ts             # Schema Mongoose para pedidos
│   ├── services/
│   │   ├── queueService.ts      # BullMQ filas e workers
│   │   └── orderService.ts      # Lógica de negócio
│   ├── routers/
│   │   └── order.ts             # Endpoints da API REST
│   └── server.ts                # Servidor principal Express
├── public/
│   └── index.html               # Interface web
├── docker-compose.yml           # Orquestração de containers
├── Dockerfile                   # Imagem da aplicação
├── package.json                 # Dependências e scripts
├── tsconfig.json               # Configuração TypeScript
└── .env                        # Variáveis de ambiente
```

## 🔧 Configuração e Instalação

### Pré-requisitos
- Node.js 18+
- Yarn ou NPM
- Docker (opcional)
- Conta MongoDB Atlas
- Conta Redis Cloud

### Variáveis de Ambiente (.env)
```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_PASSWORD=sua_senha_mongodb

# Redis Cloud
REDIS_HOST=redis-xxxxx.c239.us-east-1-2.ec2.redns.redis-cloud.com
REDIS_PORT=17368
REDIS_USERNAME=default
REDIS_PASSWORD=sua_senha_redis
REDIS_DB=0

# Aplicação
PORT=3333
```

### Instalação Local
```bash
# 1. Clonar/baixar o projeto
cd backend-hw-publishing

# 2. Instalar dependências
yarn install

# 3. Configurar .env com suas credenciais

# 4. Executar em desenvolvimento
yarn dev

# 5. Acessar aplicação
http://localhost:3333
```

### Instalação com Docker
```bash
# 1. Subir todos os serviços
docker-compose up

# 2. Acessar aplicação
http://localhost:3333
```

## 📊 Modelo de Dados

### Schema do Pedido (MongoDB)
```typescript
interface IOrder {
  id: string;                    // ID único: ORDER_timestamp_sequencial
  cliente: string;               // Nome do cliente aleatório
  valor: number;                 // Valor entre 100-10100
  tier: 'BRONZE' | 'PRATA' | 'OURO' | 'DIAMANTE';  // Tier do cliente
  priority: 'VIP' | 'NORMAL';    // VIP = DIAMANTE, NORMAL = outros
  observacoes: string;           // Status do processamento
  processedAt?: Date;            // Timestamp do processamento
  createdAt: Date;               // Timestamp de criação
  updatedAt: Date;               // Timestamp de atualização
}
```

### Índices MongoDB
```javascript
// Índice único no campo id
{ id: 1 }

// Índice para consultas por prioridade
{ priority: 1 }

// Índice para pedidos processados
{ processedAt: 1 }
```

## 🚀 Funcionalidades do Sistema

### 1. Geração de Pedidos
**Endpoint**: `POST /api/executar`

**Processo**:
1. Limpa banco de dados existente
2. Gera 1.000.000 de pedidos com dados aleatórios
3. Insere em lotes de 10.000 para otimização
4. Calcula tempo de geração
5. Inicia processamento automático

**Dados Gerados**:
- **ID**: `ORDER_${timestamp}_${sequencial}`
- **Cliente**: `Cliente_${número_aleatório}`
- **Valor**: Entre R$ 100,00 e R$ 10.100,00
- **Tier**: Distribuição aleatória entre BRONZE, PRATA, OURO, DIAMANTE
- **Priority**: DIAMANTE = VIP, outros = NORMAL
- **Observações**: "Pedido gerado"

### 2. Sistema de Filas (BullMQ)

#### Filas Implementadas
```typescript
// Fila VIP - Alta prioridade
const vipQueue = new Queue('vip-orders', { connection: redis });

// Fila Normal - Prioridade padrão  
const normalQueue = new Queue('normal-orders', { connection: redis });
```

#### Workers de Processamento
```typescript
// Worker VIP - Concorrência: 10
const vipWorker = new Worker('vip-orders', async (job) => {
  // Atualiza pedido: observacoes = "enviado com prioridade"
  // Marca processedAt = new Date()
});

// Worker Normal - Concorrência: 10
const normalWorker = new Worker('normal-orders', async (job) => {
  // Atualiza pedido: observacoes = "processado sem prioridade"  
  // Marca processedAt = new Date()
});
```

#### Estratégia de Processamento
1. **Fase 1**: Processa TODOS os pedidos VIP primeiro
2. **Aguarda**: Conclusão completa da fila VIP
3. **Fase 2**: Inicia processamento dos pedidos NORMAL
4. **Logs**: Progresso a cada 1.000 pedidos processados

### 3. API REST

#### GET /api/pedidos
Retorna estatísticas completas do processamento:

```json
{
  "tempoGeracaoPedidos": "45000ms",
  "tempoProcessamentoVIP": "12000ms", 
  "tempoProcessamentoNormal": "35000ms",
  "horarioInicioVIP": "2024-01-15T10:30:00.000Z",
  "horarioFimVIP": "2024-01-15T10:32:00.000Z",
  "horarioInicioNormal": "2024-01-15T10:32:00.000Z",
  "horarioFimNormal": "2024-01-15T10:35:00.000Z",
  "tempoTotalExecucao": "92000ms",
  "quantidadePedidosVIP": 250000,
  "quantidadePedidosNormal": 750000
}
```

#### POST /api/executar
Inicia o processo completo de geração e processamento.

**Resposta Imediata**:
```json
{
  "message": "Processamento iniciado com sucesso"
}
```

#### POST /api/reset
Limpa completamente o sistema para nova execução.

**Ações Executadas**:
- Remove todos os pedidos do MongoDB
- Limpa filas Redis (VIP e Normal)
- Reseta estatísticas em memória
- Prepara sistema para nova execução

### 4. Interface Web

#### Funcionalidades
- **Botão Executar**: Inicia processamento de 1M pedidos
- **Botão Reset**: Limpa banco para novo teste
- **Status em Tempo Real**: Métricas atualizadas a cada 5s
- **Logs de Execução**: Histórico detalhado com timestamps

#### Métricas Exibidas
- Tempo de geração dos pedidos
- Tempo de processamento VIP vs Normal
- Quantidade de pedidos por categoria
- Tempo total de execução
- Progresso em tempo real

## ⚡ Otimizações Implementadas

### 1. Performance de Banco
- **Batch Inserts**: 10.000 registros por operação
- **Índices Otimizados**: Consultas rápidas por priority
- **Conexão Única**: Reutilização de conexão MongoDB

### 2. Sistema de Filas
- **Bulk Operations**: Adiciona jobs em lote
- **Concorrência**: 10 workers simultâneos por fila
- **Cleanup Automático**: Remove jobs concluídos/falhos
- **Isolamento**: Filas separadas garantem prioridade

### 3. Memória e CPU
- **Streaming**: Processa lotes sem acumular em memória
- **Async/Await**: Processamento não-bloqueante
- **Garbage Collection**: Limpeza automática de arrays

### 4. Monitoramento
- **Logs Progressivos**: Feedback a cada 1K pedidos
- **Métricas em Tempo Real**: Coleta eficiente de estatísticas
- **Error Handling**: Tratamento robusto de erros

## 🔍 Decisões Arquiteturais

### 1. Filas Separadas vs Fila Única com Prioridade
**Decisão**: Filas separadas (VIP + Normal)

**Justificativa**:
- ✅ **Isolamento Total**: VIP nunca aguarda Normal
- ✅ **Escalabilidade**: Workers independentes
- ✅ **Monitoramento**: Métricas isoladas
- ✅ **Confiabilidade**: Falhas não se propagam

### 2. MongoDB vs PostgreSQL
**Decisão**: MongoDB Atlas

**Justificativa**:
- ✅ **NoSQL**: Flexibilidade de schema
- ✅ **Escalabilidade Horizontal**: Sharding nativo
- ✅ **Performance**: Inserções em lote otimizadas
- ✅ **Cloud**: Gerenciamento automático

### 3. BullMQ vs Outros Sistemas de Fila
**Decisão**: BullMQ + Redis

**Justificativa**:
- ✅ **Maturidade**: Biblioteca estável e testada
- ✅ **Features**: Retry, delay, cron jobs
- ✅ **Monitoramento**: Dashboard integrado
- ✅ **Performance**: Redis como backend

### 4. Processamento Sequencial vs Paralelo
**Decisão**: Sequencial (VIP → Normal)

**Justificativa**:
- ✅ **Garantia de Prioridade**: Zero interferência
- ✅ **Recursos Focados**: CPU/IO dedicados
- ✅ **Simplicidade**: Lógica linear
- ✅ **Métricas Precisas**: Tempos isolados

## 📈 Métricas e Monitoramento

### Estatísticas Coletadas
```typescript
interface ProcessStats {
  vipStartTime: Date | null;      // Início processamento VIP
  vipEndTime: Date | null;        // Fim processamento VIP  
  normalStartTime: Date | null;   // Início processamento Normal
  normalEndTime: Date | null;     // Fim processamento Normal
  vipProcessed: number;           // Contador pedidos VIP
  normalProcessed: number;        // Contador pedidos Normal
  generationTime: number;         // Tempo geração (ms)
  totalStartTime: Date | null;    // Início processo completo
}
```

### Logs Detalhados
```
[10:30:00] Banco limpo. Iniciando geração de 1 milhão de pedidos...
[10:30:05] 10000 pedidos gerados...
[10:30:10] 20000 pedidos gerados...
...
[10:32:15] 1 milhão de pedidos gerados em 45000ms
[10:32:15] Iniciando processamento de pedidos...
[10:32:16] Adicionando 250000 pedidos VIP à fila...
[10:32:20] 1000 pedidos VIP processados...
[10:32:25] 2000 pedidos VIP processados...
...
[10:34:20] Processamento VIP concluído!
[10:34:20] Adicionando 750000 pedidos normais à fila...
[10:34:25] 1000 pedidos normais processados...
...
[10:37:45] Processamento Normal concluído!
[10:37:45] Processamento completo!
```

## 🚨 Tratamento de Erros

### Cenários Cobertos
1. **Falha de Conexão MongoDB**: Retry automático + log
2. **Falha de Conexão Redis**: Reconexão automática
3. **Erro de Inserção**: Rollback de lote + retry
4. **Job Falhado**: Retry configurável + dead letter queue
5. **Timeout de Processamento**: Timeout configurável por job

### Estratégias de Recuperação
- **Retry Exponencial**: Tentativas com delay crescente
- **Circuit Breaker**: Pausa processamento em caso de falhas
- **Graceful Shutdown**: Finaliza jobs em andamento
- **Health Checks**: Monitoramento de saúde dos serviços

## 🔒 Segurança

### Configurações Implementadas
- **Variáveis de Ambiente**: Credenciais não expostas no código
- **Conexões Seguras**: TLS/SSL para MongoDB e Redis
- **Validação de Input**: Sanitização de dados de entrada
- **Rate Limiting**: Proteção contra spam de requests

## 🐳 Deploy e Produção

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3333:3333"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_HOST=${REDIS_HOST}
    depends_on:
      - mongo
      - redis
```

### Variáveis de Produção
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://prod-user:senha@cluster-prod.mongodb.net/
REDIS_HOST=redis-prod.cloud.com
LOG_LEVEL=info
MAX_WORKERS=20
BATCH_SIZE=10000
```

## 📊 Benchmarks e Performance

### Resultados Esperados (1M pedidos)
- **Geração**: ~30-60 segundos
- **Processamento VIP**: ~5-15 minutos  
- **Processamento Normal**: ~15-45 minutos
- **Total**: ~20-60 minutos

### Fatores de Performance
- **CPU**: Processamento de workers
- **Memória**: Lotes em memória
- **Rede**: Latência MongoDB/Redis
- **Disco**: I/O do banco de dados

## 🔧 Manutenção e Troubleshooting

### Comandos Úteis
```bash
# Logs da aplicação
docker-compose logs -f app

# Status das filas Redis
redis-cli -h host -p port -a password info

# Estatísticas MongoDB
mongo "mongodb+srv://..." --eval "db.orders.stats()"

# Reiniciar serviços
docker-compose restart
```

### Problemas Comuns
1. **"Duplicate key error"**: Execute reset antes de novo teste
2. **"Redis connection failed"**: Verifique credenciais Redis
3. **"MongoDB timeout"**: Verifique conexão de rede
4. **"Memory limit exceeded"**: Reduza BATCH_SIZE

## 📝 Conclusão

Este sistema demonstra uma implementação robusta e escalável para processamento de grandes volumes de dados com priorização, utilizando as melhores práticas de arquitetura de software e tecnologias modernas de backend.

A solução atende completamente aos requisitos do caso de teste, fornecendo:
- ✅ Geração de 1 milhão de pedidos
- ✅ Processamento com priorização VIP
- ✅ Sistema de filas robusto (BullMQ)
- ✅ Logs detalhados e métricas
- ✅ Interface de monitoramento
- ✅ Funcionalidade de reset
- ✅ Arquitetura escalável
