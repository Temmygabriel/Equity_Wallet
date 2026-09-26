# Project Progress

## Current state

The repository has moved from an empty Git repository to a minimal, unimplemented project scaffold. No product functionality is present.

## Completed steps

1. Reconnaissance: confirmed the initial repository contained only `.gitkeep`.
2. Step 2 foundation: created workspace configuration, Hardhat contract structure, React/Vite frontend structure, environment template, documentation, and ignore rules.

## Git baseline

- Current branch: `work`
- Starting commit before Step 2: `1e99c8c` (`Initialize repository`)

## What Step 2 does

- Configures npm workspaces for `contracts` and `frontend`.
- Configures Solidity `0.8.24` with Hardhat.
- Defines the optional `robinhoodTestnet` Hardhat network with chain ID `46630`, activated only when a local RPC environment variable is supplied.
- Adds empty, tracked directories for Solidity contracts, tests, and deployment scripts.
- Adds a minimal React/Vite entry point solely to validate frontend tooling.

## Remaining work

- Confirm and incorporate the design/build specifications once available in the project context.
- Define and implement the `GrantEscrow` contract and its state model.
- Add unit and integration tests for all contract behavior.
- Implement deployment scripts after official network values are available.
- Build employer and contractor frontend experiences, wallet flows, and any certificate experience.
- Add any approved USDG/stock-token swap integration only after its requirements and addresses are confirmed.

## Next recommended implementation step

Translate the approved Design Spec and Build Spec into a concise contract interface/state-machine plan, including roles, grant data, events, invariants, and test cases—then implement `GrantEscrow` with tests. Do not select token/router addresses or deploy until official values are supplied.
