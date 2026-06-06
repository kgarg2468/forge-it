import { Link } from "react-router-dom";
import { Button } from "../components";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <p className="text-5xl font-semibold tracking-tight text-ink-900">404</p>
      <p className="mt-2 text-gray-500">This page doesn't exist.</p>
      <Link to="/" className="mt-6">
        <Button variant="secondary">Back home</Button>
      </Link>
    </div>
  );
}
