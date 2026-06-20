## Current task

Execute the approved 8-task plan in `plan-12fa-control-flow.md`: move phase routing, status transitions, and the form-first guard out of agent inference into an embedded Python reducer `src/scripts/dispatch.py` (CLI subcommands the agent calls and obeys, markdown output), then rewire SKILL.md and the phase files to the reducer loop.

## Open decisions

- Execution mode: subagent-driven (fresh subagent per task, content Tasks 5-7 must run on Opus) versus inline with checkpoints. Not chosen.
- Whether to commit the planning artifacts (brief, spec, plan, and the `feedback_agent_reads_markdown` memory) onto a fresh `dev` branch before execution starts. They are currently uncommitted on `main`.
