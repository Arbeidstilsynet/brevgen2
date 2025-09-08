import { fetchReposFromAzure } from "@/actions/azdo";
import { auth } from "@/auth";

export default async function RepoList() {
  const session = await auth();
  if (!session) return null;

  const repos = await fetchReposFromAzure();

  return (
    <div>
      <h2>Azure DevOps Repositories</h2>
      <ul>
        {repos.map((repo) => (
          <li key={repo.id}>
            <a href={repo.remoteUrl} target="_blank" rel="noopener noreferrer">
              {repo.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
