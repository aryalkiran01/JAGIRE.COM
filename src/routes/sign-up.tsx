import { createFileRoute, Navigate } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  redirect: z.string().optional(),
  ref: z.string().optional(),
});

export const Route = createFileRoute("/sign-up")({
  validateSearch: searchSchema,
  component: SignUpRoute,
});

function SignUpRoute() {
  const search = Route.useSearch();
  return <Navigate to="/auth" search={{ mode: "signup", ...search }} replace />;
}
