const LogoCloud = () => {
  const partners = [
    "Acme Corp", "TechFlow", "InnovateX", "CloudSync", "DataWave", "NexGen"
  ];

  return (
    <section className="py-16 bg-charcoal/50 border-y border-border/40">
      <div className="container mx-auto px-6">
        <p className="text-center text-sm text-muted-foreground mb-10 uppercase tracking-wider">
          Trusted by Leading Teams
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-16 opacity-50">
          {partners.map((partner) => (
            <div 
              key={partner}
              className="text-2xl font-semibold text-muted-foreground hover:text-copper/80 transition-smooth"
            >
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoCloud;
