import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * A textarea grows with its content (`field-sizing-content`), so `size` sets the
 * minimum it starts at and the padding, matching Input's scale rather than a
 * fixed height.
 */
const textareaVariants = cva(
  "flex field-sizing-content w-full rounded-lg border border-input bg-card text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        sm: "min-h-14 px-2 py-1.5",
        default: "min-h-16 px-2.5 py-2",
        lg: "min-h-22 px-3.5 py-2.5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function Textarea({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      data-size={size}
      className={cn(textareaVariants({ size, className }))}
      {...props}
    />
  );
}

export { Textarea, textareaVariants };
