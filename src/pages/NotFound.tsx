import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
    <Logo />
    <h1 className="font-display text-7xl font-bold mt-8 bg-gradient-brand bg-clip-text text-transparent">404</h1>
    <p className="mt-2 text-muted-foreground">This page doesn't exist.</p>
    <Link to="/" className="mt-6">
      <Button className="bg-gradient-brand shadow-brand">Go home</Button>
    </Link>
  </div>
);

export default NotFound;
