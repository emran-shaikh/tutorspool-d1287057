import { Helmet } from "react-helmet-async";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const HOME_FAQS = [
  {
    q: "How do I find the right online tutor for my subject?",
    a: "Browse verified tutors by subject, read student reviews, compare hourly rates and experience, then book a 1-on-1 session with the tutor who fits your learning goals. Every tutor profile on TutorsPool shows qualifications, subjects taught, average rating and real student feedback so you can choose with confidence.",
  },
  {
    q: "Which subjects can I learn on TutorsPool?",
    a: "Our expert tutors cover 50+ subjects including mathematics, physics, chemistry, biology, English, Arabic, Spanish, computer science and programming, business studies, accounting, and test prep for IELTS, SAT, O/A Levels and university entrance exams.",
  },
  {
    q: "How much does online tutoring cost?",
    a: "Tutors set their own hourly rates, and most 1-on-1 sessions start from around $10–$30 per hour. Prices are displayed automatically in your local currency so you always know what a session costs before you book.",
  },
  {
    q: "Are TutorsPool tutors verified?",
    a: "Yes. Every tutor is manually reviewed and approved by our team before their profile goes live. We check qualifications, teaching experience and subject expertise, and students can leave public reviews after each completed session.",
  },
  {
    q: "How are online tutoring sessions delivered?",
    a: "Sessions run live over secure video meetings with screen sharing and an interactive whiteboard. You can book one-off lessons or a recurring weekly schedule, and access assignments, quizzes and learning resources shared by your tutor between sessions.",
  },
  {
    q: "Can parents track their child's learning progress?",
    a: "Yes. Parents can link to their child's account and quietly monitor attendance, session history, quiz results and progress reports, plus receive email updates — without interrupting the student's learning experience.",
  },
];

export function FaqSection() {
  return (
    <section className="py-16 md:py-20 bg-muted/30">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: HOME_FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          })}
        </script>
      </Helmet>
      <div className="container max-w-3xl">
        <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4 text-center">
          Online tutoring questions, answered
        </h2>
        <p className="text-muted-foreground text-center mb-10">
          Everything students and parents ask before booking their first session with an expert tutor.
        </p>
        <Accordion type="single" collapsible className="w-full">
          {HOME_FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
