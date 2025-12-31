import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Is Aligno a project management tool?",
      answer: "Aligno is broader than project management. While it understands tasks, timelines, and teams, its purpose is to provide intelligence—predicting risk, explaining why something matters, and helping you decide what to do next. It's a work intelligence platform that supports decision-making, not just task tracking.",
    },
    {
      question: "How is Aligno different from task tracking platforms?",
      answer: "Task trackers show you what's on your list. Aligno shows you what's likely to go wrong, why, and what you can do about it. It connects capacity, dependencies, sentiment, and execution into a single insight—so you spend less time gathering data and more time making good decisions.",
    },
    {
      question: "Does Aligno replace managers or teams?",
      answer: "No. Aligno supports human judgment—it doesn't replace it. Every recommendation is reviewable, every action is optional, and every decision stays with your team. Think of it as a calm advisor that surfaces what matters, not an autopilot that takes over.",
    },
    {
      question: "How does Aligno predict risk and delays?",
      answer: "Aligno analyzes patterns across your work—task progress, team capacity, historical velocity, dependencies, and more. It identifies early signals that often precede delays and surfaces them before they become problems. The goal is foresight, not hindsight.",
    },
    {
      question: "Can teams still work normally without AI automation?",
      answer: "Absolutely. AI in Aligno is advisory, never forced. You can ignore suggestions, override recommendations, or simply use Aligno as a visibility layer. The intelligence adapts to how you work—it doesn't demand you change.",
    },
    {
      question: "Who is Aligno best suited for?",
      answer: "Teams, leads, and executives who care about outcomes—not just outputs. If you've ever wished you could see problems earlier, explain project health clearly, or make decisions with more confidence, Aligno is designed for you.",
    },
    {
      question: "Is Aligno suitable for small teams or individuals?",
      answer: "Yes. Insight depth scales with usage. A solo founder can use Aligno to stay ahead of their own workload, while enterprise teams can use it across portfolios. The platform adapts to your context.",
    },
    {
      question: "How does Aligno avoid overwhelming users with data?",
      answer: "Instead of showing everything, Aligno starts with a Single Insight Summary—one clear answer about what matters most right now. You can explore deeper when needed, but the default is clarity, not complexity.",
    },
    {
      question: "Is my data secure and private?",
      answer: "Yes. Your data is encrypted, access-controlled, and never shared. Aligno is built with enterprise-grade security in mind, so you can trust it with sensitive project information.",
    },
    {
      question: "Can Aligno scale from one project to a portfolio?",
      answer: "Yes. Aligno provides portfolio-level intelligence—aggregate health scores, cross-project risk visibility, and executive summaries that span multiple initiatives. As your scope grows, so does the insight.",
    },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Questions about Aligno
          </h2>
          <p className="text-lg text-muted-foreground">
            Understanding how work intelligence is different
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