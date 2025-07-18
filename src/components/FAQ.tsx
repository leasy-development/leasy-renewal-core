import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the smart scraper work?",
    answer: "Our intelligent scraper analyzes your website structure and automatically extracts property listings, images, and details. It handles various website formats and can be configured to match your specific site structure. The process is completely automated and runs in the background."
  },
  {
    question: "Can I customize the AI-generated content?",
    answer: "Absolutely! You have full control over the AI optimization. You can choose to enhance existing descriptions, completely rewrite them, or use AI suggestions as a starting point for manual editing. The AI learns from your preferences to improve future suggestions."
  },
  {
    question: "Which platforms can I export to?",
    answer: "We support 50+ platforms including ImmoScout24, FARAWAYHOME, Rightmove, Zoopla, Airbnb, Booking.com, and many more. You can also export to your own website via API or webhook integrations. New platforms are added regularly based on customer requests."
  },
  {
    question: "Is my data secure?",
    answer: "Yes, security is our top priority. We use bank-grade encryption, SOC 2 compliance, and store all data in secure, geographically distributed data centers. Your property data is never shared with third parties and you maintain full ownership and control."
  },
  {
    question: "How does pricing work with multiple listings?",
    answer: "Our pricing is based on the number of active listings you manage. You can easily upgrade or downgrade your plan as your portfolio grows or shrinks. There are no setup fees or long-term contracts, and you only pay for what you use."
  },
  {
    question: "Do you offer API access?",
    answer: "Yes, we provide comprehensive REST APIs for all Pro plans and above. This allows you to integrate Home Scraper with your existing property management software, CRM systems, or custom applications. Full API documentation and support are included."
  },
  {
    question: "How quickly are listings synchronized?",
    answer: "Real-time synchronization happens within minutes of making changes. You can also schedule bulk updates during off-peak hours. Our system processes thousands of listing updates per minute with 99.9% uptime reliability."
  },
  {
    question: "Can I try before I buy?",
    answer: "Definitely! We offer a full-featured 14-day free trial with no credit card required. You can import your listings, test all features, and see the results before making any commitment. Our team is also available to provide personalized demos."
  }
];

export const FAQ = () => {
  return (
    <section id="faq" className="py-20 lg:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Frequently asked questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Get answers to common questions about Home Scraper
            </p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-gradient-card border border-border/50 rounded-lg px-6 shadow-soft hover:shadow-medium transition-all duration-300"
              >
                <AccordionTrigger className="text-left text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Contact CTA */}
          <div className="text-center mt-12 p-8 bg-gradient-card border border-border/50 rounded-lg shadow-soft">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-6">
              Our team is here to help you get started with Home Scraper
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@homescraper.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Contact Support
              </a>
              <a 
                href="#"
                className="inline-flex items-center justify-center px-6 py-3 border border-border bg-background text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                Schedule Demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};