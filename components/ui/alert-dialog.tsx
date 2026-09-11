"use client";

import * as React from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const AlertDialog = Dialog;
const AlertDialogTrigger = DialogTrigger;
const AlertDialogPortal = React.Fragment;

const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>(({ className, ...props }, ref) => (
  <DialogClose asChild>
    <button
      ref={ref}
      type="button"
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  </DialogClose>
));
AlertDialogCancel.displayName = "AlertDialogCancel";

const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>(({ className, ...props }, ref) => (
  <DialogClose asChild>
    <button
      ref={ref}
      type="button"
      className={cn(buttonVariants({ variant: "destructive" }), className)}
      {...props}
    />
  </DialogClose>
));
AlertDialogAction.displayName = "AlertDialogAction";

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      showCloseButton={false}
      className={cn("max-w-lg gap-5", className)}
      {...props}
    />
  );
}

const AlertDialogHeader = DialogHeader;
const AlertDialogFooter = DialogFooter;
const AlertDialogTitle = DialogTitle;
const AlertDialogDescription = DialogDescription;

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
