"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useToast } from "@/components/ui/toast";
import { CollectionFormDialog } from "./collection-form-dialog";

type NewCollectionButtonProps = {
  className: string;
  children: ReactNode;
  "aria-label"?: string;
};

/** A button that opens the New collection dialog and confirms with a toast linking to it. */
export function NewCollectionButton({ className, children, ...rest }: NewCollectionButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} {...rest}>
        {children}
      </button>
      <CollectionFormDialog
        open={open}
        onClose={() => setOpen(false)}
        onSaved={(collection) => {
          toast({
            message: "Collection created",
            action: { label: "View", href: `/app/collections/${collection.id}` },
          });
          router.refresh();
        }}
      />
    </>
  );
}
