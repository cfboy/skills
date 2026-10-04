import { passkeyClient } from "@better-auth/passkey/client";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, platformAc, platformRoles, roles } from "@/lib/auth/permissions";

/** The browser side of BetterAuth: signing in and out, passkeys, password resets. */
export const authClient = createAuthClient({
  plugins: [
    organizationClient({ ac, roles }),
    adminClient({ ac: platformAc, roles: platformRoles }),
    passkeyClient(),
  ],
});
