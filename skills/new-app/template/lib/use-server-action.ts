"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

/** Any ActionResult, whatever it carries on success. */
type AnyResult = { ok: true } | { ok: false; message: string };

/** What a successful result carries: its `data`, or nothing. Read off the success branch only. */
type Data<R> = Extract<R, { ok: true }> extends { data: infer D } ? D : undefined;

type Options<TInput, R, TContext> = Omit<
  UseMutationOptions<Data<R>, Error, TInput, TContext>,
  "mutationFn"
> & {
  /** Toast shown when the action succeeds. Omit for no toast. */
  success?: string | ((data: Data<R>, input: TInput) => string);
  /**
   * Re-render the server components after success. On by default: the read
   * path is server-rendered, so refreshing the route is what shows the change.
   */
  refresh?: boolean;
};

/**
 * Runs a Server Action as a TanStack Query mutation.
 *
 * The one place that knows an action reports failure as `{ ok: false }` (see
 * lib/action-result.ts): it becomes a thrown Error, so `isPending`, `error` and
 * `mutateAsync` behave the way every caller expects. Errors are toasted unless the caller handles them
 * with its own `onError` (a form showing the message beside its fields).
 */
export function useServerAction<TInput, R extends AnyResult, TContext = unknown>(
  action: (input: TInput) => Promise<R>,
  { success, refresh = true, onSuccess, onError, ...options }: Options<TInput, R, TContext> = {},
) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return useMutation<Data<R>, Error, TInput, TContext>({
    ...options,
    mutationFn: async (input) => {
      const result = await action(input);
      if (!result.ok) throw new Error(result.message);
      return ("data" in result ? result.data : undefined) as Data<R>;
    },
    onSuccess: async (data, input, context, mutation) => {
      if (success) toast.success(typeof success === "function" ? success(data, input) : success);
      await onSuccess?.(data, input, context, mutation);
      if (refresh) startTransition(() => router.refresh());
    },
    onError: (error, input, context, mutation) => {
      if (onError) return onError(error, input, context, mutation);
      toast.error(error.message);
    },
  });
}
