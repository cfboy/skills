import { DatabaseError } from "pg";
import { describe, expect, it } from "vitest";

import { violatedConstraint } from "./errors";

function pgError(constraint?: string): DatabaseError {
  const error = new DatabaseError("duplicate key value", 0, "error");
  error.constraint = constraint;
  return error;
}

describe("violatedConstraint", () => {
  it("names the constraint Postgres reported", () => {
    expect(violatedConstraint(pgError("user_email_unique"))).toBe("user_email_unique");
  });

  it("finds it through a wrapping error, the way Drizzle throws", () => {
    const wrapped = new Error("Failed query", { cause: pgError("member_organization_user_idx") });
    expect(violatedConstraint(wrapped)).toBe("member_organization_user_idx");
  });

  it("is null for anything that is not a constraint violation", () => {
    expect(violatedConstraint(new Error("connection refused"))).toBeNull();
    expect(violatedConstraint(pgError())).toBeNull();
    expect(violatedConstraint("not an error")).toBeNull();
  });
});
