"use client";

import { Button, Card, CardBody } from "@/components/ui";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardBody className="space-y-3">
        <h1 className="font-semibold">Action impossible</h1>
        <p className="text-sm text-muted-foreground">{error.message || "Une erreur est survenue."}</p>
        <Button variant="secondary" onClick={reset}>Réessayer</Button>
      </CardBody>
    </Card>
  );
}
