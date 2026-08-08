import { Link } from "react-router-dom";
import {
  useFollowOrganization,
  useOrganizations,
  useUnfollowOrganization,
} from "../hooks/useOrganizations";

export function OrganizationsPage() {
  const { data: organizations, isPending, isError } = useOrganizations();
  const followMutation = useFollowOrganization();
  const unfollowMutation = useUnfollowOrganization();

  return (
    <main>
      <p>
        <Link to="/">← Back</Link>
      </p>
      <h1>Organizations</h1>

      {isPending && <p>Loading…</p>}
      {isError && <p role="alert">Couldn't load organizations. Try refreshing.</p>}

      {organizations && (
        <ul>
          {organizations.map((org) => (
            <li key={org.id}>
              {org.name}{" "}
              <button
                onClick={() =>
                  org.isFollowed
                    ? unfollowMutation.mutate(org.id)
                    : followMutation.mutate(org.id)
                }
                disabled={followMutation.isPending || unfollowMutation.isPending}
              >
                {org.isFollowed ? "Unfollow" : "Follow"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
