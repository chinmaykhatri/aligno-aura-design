import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "How does Aligno's AI-powered task prioritization work?",
      answer: "Aligno uses advanced machine learning algorithms to analyze your project data, team capacity, deadlines, and task dependencies. It automatically suggests optimal task priorities and can even predict potential bottlenecks before they occur. The AI learns from your team's patterns over time, becoming more accurate with continued use. You maintain full control and can always override AI suggestions.",
      link: true
    },
    {
      question: "Can I migrate my existing projects from other tools?",
      answer: "Yes! Aligno offers seamless migration from popular project management tools including Asana, Trello, Monday.com, and Jira. Our migration wizard preserves your project structure, tasks, comments, and attachments."
    },
    {
      question: "What integrations does Aligno support?",
      answer: "Aligno integrates with over 50 popular tools including Slack, Microsoft Teams, Google Workspace, GitHub, Figma, and more. We also provide a robust API for custom integrations."
    },
    {
      question: "Is my data secure with Aligno?",
      answer: "Security is our top priority. We use bank-level 256-bit SSL encryption, comply with SOC 2 Type II standards, and offer enterprise features like SSO and advanced permission controls. Your data is backed up multiple times daily."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Absolutely. You can cancel your Pro subscription at any time with no penalties or hidden fees. Your data remains accessible, and you can export it at any point."
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Aligno
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible defaultValue="item-0" className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border/40 rounded-2xl px-6 bg-card hover:border-copper/30 transition-smooth"
              >
                <AccordionTrigger className="text-left text-foreground font-medium hover:text-copper">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                  {faq.link && (
                    <a href="#" className="text-copper hover:text-copper-dark ml-2 text-sm">
                      Read more →
                    </a>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
