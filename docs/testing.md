# Testing strategy

The production-Docker integration tests check generated PDFs through text, page counts,
and visual comparisons. Deployed-dev load tests also exercise real Entra authentication
before API promotion. See the [API testing guidance](../apps/api/README.md#integrasjonstester).

Focused unit tests complement these checks for Dynamic Markdown, document templates,
HTML generation, scheduling, and client behavior; they do not replace actual rendering tests.

## C# request contract

The [.NET contract test](../nuget-client/BrevgeneratorClient.Tests/Unit/RequestContractTests.cs)
captures real client serialization for all four document templates and detects fixture drift.
The [API contract test](../apps/api/src/testing/nuget-contract.test.ts) checks those fixtures
against the Zod request schema. Run both from the repository root when changing the contract:

```sh
dotnet test --project nuget-client/BrevgeneratorClient.Tests -- --filter-class '*RequestContractTests'
pnpm --dir apps/api exec vitest run src/testing/nuget-contract.test.ts
```

For intentional serialization changes, set `UPDATE_REQUEST_CONTRACT_FIXTURE` to the absolute
path of [serialized-requests.json](../nuget-client/BrevgeneratorClient.Tests/Fixtures/serialized-requests.json)
when running the .NET test; format and review the generated JSON, then rerun both checks.
Do not hand-edit fixtures. Client-only changes do not trigger the TypeScript CI job.
