import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

/**
 * Returns an Octokit instance authenticated as a GitHub App installation.
 * Requires GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY env vars.
 * Returns null if the GitHub App is not configured.
 */
export async function getInstallationOctokit(
  installationId: number
): Promise<Octokit | null> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    return null;
  }

  const auth = createAppAuth({
    appId: parseInt(appId),
    privateKey: privateKey.replace(/\\n/g, "\n"),
    installationId,
  });

  const { token } = await auth({ type: "installation" });

  return new Octokit({ auth: token });
}

/**
 * Fetches PR file diffs. Returns formatted diff text or empty string.
 */
export async function getPRFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<string> {
  try {
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 30,
    });

    return files
      .map(
        (f) =>
          `File: ${f.filename} [${f.status}] +${f.additions}/-${f.deletions}\n${
            f.patch ? f.patch.slice(0, 2000) : "(binary or large file)"
          }`
      )
      .join("\n\n---\n\n");
  } catch {
    return "";
  }
}

/**
 * Posts a comment on a pull request.
 */
export async function postPRComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string
): Promise<void> {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body,
  });
}

/**
 * Posts a PR review with inline comments.
 */
export async function postPRReview(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
  event: "COMMENT" | "APPROVE" | "REQUEST_CHANGES" = "COMMENT"
): Promise<string> {
  const { data } = await octokit.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    body,
    event,
  });
  return String(data.id);
}

/**
 * Applies labels to a GitHub issue.
 */
export async function applyIssueLabels(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  labels: string[]
): Promise<void> {
  // Ensure labels exist before applying
  for (const label of labels) {
    try {
      await octokit.issues.getLabel({ owner, repo, name: label });
    } catch {
      // Create label if it doesn't exist
      const colors: Record<string, string> = {
        bug: "d73a4a",
        enhancement: "a2eeef",
        question: "d876e3",
        documentation: "0075ca",
        "priority:critical": "b60205",
        "priority:high": "e4e669",
        "priority:medium": "fbca04",
        "priority:low": "0e8a16",
      };
      await octokit.issues.createLabel({
        owner,
        repo,
        name: label,
        color: colors[label] ?? "ededed",
      }).catch(() => {});
    }
  }

  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels,
  });
}

/**
 * Posts a comment on a GitHub issue.
 */
export async function postIssueComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<void> {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
}
