# Ponto Eletrônico (MVP)

MVP de um sistema simples de controle de ponto. Inclui backend em Node.js/TypeScript, frontend estático e testes automatizados com Playwright. O foco é fornecer uma base mínima para experimentação, estudo e validação de fluxos de registro de jornada.

---

## Instalação

```
npm install
```

---

## Uso

Iniciar servidor e frontend:

```
npm start
```

A aplicação estará disponível em:

```
http://localhost:3000
```

Credenciais padrão:

```
Código: admin
PIN: 1234
```

Executar testes:

```
npm test
```

---

## API

### POST /api/login  
Autenticação básica.  
Retorna token simples em memória.

### POST /api/clock  
Registra entrada ou saída.  
Requer header `Authorization: Bearer <token>`.

### GET /api/clock  
Retorna histórico de registros.  
Requer autenticação.

---

## Estrutura

```
backend/              API e lógica do servidor
frontend/             Interface estática
tests/                Testes Playwright
playwright.config.ts  Configuração dos testes
```

---

## Funcionalidades atuais

- Login com código + PIN  
- Registro de entrada e saída  
- Histórico básico  
- Testes automatizados cobrindo o fluxo principal  

---

## Roadmap

- Persistência (JSON ou SQLite)  
- Testes de UI adicionais  
- Validação de usuário/PIN  
- Filtros e histórico por data  

---

## Licença

Uso livre para fins de estudo e experimentação.


