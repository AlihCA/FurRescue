import { Mail, Facebook } from "lucide-react";

export default function Contact() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight">Contact</h1>
      <p className="mt-4 text-zinc-700 max-w-3xl">
        For adoptions, please message us on Facebook. For other concerns, email us.
      </p>

      <div className="mt-6 grid sm:grid-cols-2 gap-5 max-w-3xl">
        <a
          className="rounded-2xl border border-zinc-200 p-5 hover:bg-zinc-50 transition flex gap-3"
          href="https://facebook.com/"
          target="_blank"
          rel="noreferrer"
        >
          <Facebook />
          <div>
            <p className="font-bold">Facebook</p>
            <p className="text-sm text-zinc-600">Message the rescuers here.</p>
          </div>
        </a>

        <a
          className="rounded-2xl border border-zinc-200 p-5 hover:bg-zinc-50 transition flex gap-3"
          href="mailto:furrescue@example.com"
        >
          <Mail />
          <div>
            <p className="font-bold">Email</p>
            <p className="text-sm text-zinc-600">FurRescue@gmail.com</p>
          </div>
        </a>
      </div>
    </main>
  );
}
