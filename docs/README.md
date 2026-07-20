# Framework Engine Documentation

## Authority and Scope

These documents describe the target open-source implementation. The legacy codebase is intentionally out of scope. Start with [Target Scope](./PRODUCT_SCOPE.md); it resolves scope conflicts in older specifications until they are reconciled.

## Foundation

- [Project Brief](./PROJECT_BRIEF.md)
- [Target Scope](./PRODUCT_SCOPE.md)
- [Target Architecture](./ARCHITECTURE.md)
- [Target Technology Decisions](./tech_stack_decision.md)
- [Privacy, Security, and Safety Contract](./PRIVACY_AND_SAFETY.md)
- [MVP Acceptance Checklist](./MVP_ACCEPTANCE.md)
- [Open-Source BYOK Agent Instructions](./OpenSource_BYOK_Agent_Instructions.md)
- [Future To-Do](./future_todo.md)
- [Use Cases and Safety Boundaries](./use_cases.md)

## Product and Interaction Specifications

- [Dashboard](./spec_dashboard.md)
- [Onboarding](./spec_onboarding.md)
- [Sidebar](./spec_sidebar.md)
- [1-on-1 Chat](./spec_1_on_1.md)
- [Unified Chat](./spec_chat.md)
- [Council](./spec_council.md)
- [Persona Library](./spec_persona_library.md)
- [Persona Creator](./spec_persona_creator.md)
- [Persona Selector](./spec_persona_selector.md)
- [Settings](./spec_settings.md)
- [Data Management](./spec_data_management.md)
- [File Attachments](./spec_file_attachments.md)
- [Search](./spec_search.md)
- [Analytics](./spec_analytics.md)
- [Local Models](./spec_local_models.md)
- [Audio (future design)](./spec_audio.md)
- [Loading States](./spec_loading_states.md)
- [Keyboard and Accessibility](./spec_keyboard_shortcuts.md)
- [Error Boundaries](./spec_error_boundaries.md)

## Architecture Decision Records

- [ADR-001: Network and Privacy Boundary](./decisions/ADR-001-network-privacy-boundary.md)
- [ADR-002: Local-First Data Model](./decisions/ADR-002-local-first-data-model.md)
- [ADR-003: Routing and Session Lifecycle](./decisions/ADR-003-routing-and-session-lifecycle.md)
- [ADR-004: Provider Capability and Local Topology](./decisions/ADR-004-provider-capability-topology.md)
- [ADR-005: Council Execution and Cost Controls](./decisions/ADR-005-council-execution-and-cost-controls.md)
- [ADR-006: Persona Portability and Import Safety](./decisions/ADR-006-persona-portability-and-import-safety.md)
- [ADR-007: Incognito and Data Operations](./decisions/ADR-007-incognito-and-data-operations.md)

## Documentation Rules

- State whether a feature is MVP, future, or outside the open-source edition.
- Use the route, storage, provider, and privacy contracts from Target Scope.
- Keep architectural rationale in ADRs instead of duplicating it across every feature spec.
- Do not add machine-specific paths or links to private local files.
