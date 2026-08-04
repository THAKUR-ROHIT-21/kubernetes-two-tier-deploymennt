function Footer() {
  return (
    <footer className="border-t border-border-line mt-20 px-6 py-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="font-display text-text-primary font-semibold">
          <span className="text-teal font-mono">{'<'}</span>
          Electronix
          <span className="text-teal font-mono">{'/>'}</span>
        </p>
        <p className="font-mono text-xs text-text-muted">
          © {new Date().getFullYear()} — built for builders
        </p>
      </div>
    </footer>
  );
}

export default Footer;