# Cursor Rules & Agents Setup

## Overview

This directory contains the configuration for Cursor agents and project rules for the **backends** project (My Finance Tracker API).

## Structure

```
.cursor/
├── agents.json          # Agent definitions and configuration
└── rules/
    ├── README.md        # This file
    ├── 000-global-rules.mdc     # Global coding conventions
    ├── 001-nestjs-rules.mdc     # NestJS architecture patterns
    ├── 002-database-rules.mdc   # Drizzle ORM & PostgreSQL rules
    ├── 003-testing-rules.mdc    # Jest testing conventions
    └── 004-packages-rules.mdc   # Shared package utilities rules
```

## Agents Team

| Agent                    | Role                                               | Auto-Apply        | Rules                              |
| ------------------------ | -------------------------------------------------- | ----------------- | ---------------------------------- |
| 👑 **Lead Architect**    | Architecture oversight, module design, code review | No                | global, nestjs                     |
| ⚡ **Backend Developer** | Feature implementation, endpoints, DB logic        | **Yes** (default) | global, nestjs, database, packages |
| 🧪 **QA Engineer**       | Unit tests, E2E tests, coverage                    | No                | testing                            |
| 🔍 **Code Reviewer**     | Code quality, security, performance review         | No                | all rules                          |
| 🗄️ **DB Migration**      | Schema changes, migrations, seeds                  | No                | database                           |

## How to Use

1. **Default agent**: `backend-dev` - activates automatically when you start a task
2. **Switch agents**: Use `@agent-name` in your prompt (e.g., `@architect-lead review this module`)
3. **Agent workflow**:
   - `@architect-lead` → Plan and approve architecture
   - `@backend-dev` → Implement features
   - `@tester` → Write tests
   - `@reviewer` → Review code before commit
   - `@db-migration` → Handle schema changes

## Rule Files (.mdc)

Each `.mdc` file uses the **Markdown with Description** format and is automatically applied when files matching the `globs` pattern are opened.

- Files are loaded in numerical order (000 → 004)
- More specific rules override general ones when there's overlap
- Each rule file targets specific file patterns via `globs`
