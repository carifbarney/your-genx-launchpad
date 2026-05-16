import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Xcelerate — Clarity for Gen X Women in Digital Marketing" },
      { name: "description", content: "AI-powered starting point for Gen X women building digital and affiliate income from home." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Xcelerate</h1>
        <p className="mt-6 text-base text-muted-foreground">
          Salespage being added — visit{" "}
          <Link to="/login" className="font-semibold text-foreground underline underline-offset-4">
            /login
          </Link>{" "}
          to access the tool.
        </p>
      </div>
    </main>
  );
}
