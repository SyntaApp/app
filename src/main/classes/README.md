# Synta Class Architecture

Synta organizes classes into a 4-level hierarchy based on their scope and dependencies. This system ensures clear separation of concerns and prevents circular dependencies.

## Hierarchy Overview

```
Level 1: Application Bootstrap
Level 2: Core System Components  
Level 3: Feature Services
Level 4: Utilities & Helpers
```

## Level Descriptions

### Level 1: Application Bootstrap
The top level contains the main application class that bootstraps everything. This single entry point manages the entire application lifecycle, owns all Level 2 components, and handles critical system events like startup, shutdown, and crashes. It's responsible for application initialization, service registration, global event wiring, and security configuration.

### Level 2: Core System Components
These are the core managers and system components directly owned by Level 1. They provide essential functionality like service orchestration, window management, and inter-process communication. Level 2 components implement singleton patterns for global access and handle cross-cutting concerns across the application.

### Level 3: Feature Services
Services implement specific application features and business logic. They're managed by Level 2 service managers and follow consistent lifecycle patterns. Services can depend on other services at the same level and typically extend abstract base classes for consistency. This level handles business logic, data management, external integrations, and domain-specific operations.

### Level 4: Utilities & Helpers
Utility classes provide reusable functionality across the entire application. They're stateless, focused on specific tasks, and can be used by any level above them. This includes asset management, data transformations, common utility functions, and type conversions.

## Design Principles

**Level Isolation** ensures classes only depend on classes at their level or below, preventing circular dependencies and maintaining clear architectural boundaries.

**Service-Oriented Architecture** means Level 3 services follow a consistent lifecycle: registration with managers, initialization with dependencies, runtime operation, and proper cleanup.

**Dependency Flow** follows a clear direction: Level 1 owns Level 2, Level 2 manages Level 3, Level 4 utilities are available to all levels, and services can depend on other services at the same level.

## Development Guidelines

When creating new classes, determine the appropriate level based on scope and dependencies. Document the level and responsibilities in class comments, ensure dependencies flow downward in the hierarchy, and follow established patterns within each level. Test classes both in isolation and with their dependencies to maintain architectural integrity.
